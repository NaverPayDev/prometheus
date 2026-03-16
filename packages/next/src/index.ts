import http from 'node:http'
import {exit} from 'node:process'

import next from 'next'

import {
    BUCKETS,
    createNextRoutesUrlGroup,
    DEFAULT_METRICS_LABELS,
    DEFAULT_METRICS_NAMES,
    DEFAULT_METRICS_PATH,
    DEFAULT_METRICS_TYPE,
    enableCollectDefaultMetrics,
    getStatusCodeGroup,
    isBypassPath,
    pm2Connector,
    registerGaugeUp,
    registerHistogram,
    startTraceHistogram,
    type CommonPrometheusExporterOptions,
    type PromClientLabelValues,
} from '@naverpay/prometheus-core'
import onFinished from 'on-finished'

import type {NextServerOptions} from 'next/dist/server/next'
import type {IncomingMessage, ServerResponse} from 'node:http'

/** Configuration options for Next.js Prometheus exporter */
export interface NextjsPrometheusExporterOptions extends Omit<CommonPrometheusExporterOptions, 'next'> {
    /** Next.js server configuration options */
    nextOptions: NextServerOptions & {turbo?: boolean; turbopack?: boolean}
    /** Function to determine if a request should be bypassed from metrics collection */
    bypass?: (request: IncomingMessage, response: ServerResponse<IncomingMessage>) => boolean
    /** Function to normalize/group request paths for metrics */
    normalizePath?: (request: IncomingMessage, response: ServerResponse<IncomingMessage>) => string
    /** Function to format status codes for metrics */
    formatStatusCode?: (response: ServerResponse<IncomingMessage>) => string
}

/**
 * Creates a Next.js server with integrated Prometheus metrics collection
 * @param options - Configuration options for the server and metrics
 * @returns HTTP server instance with metrics collection enabled
 */
export async function createNextServerWithMetrics({
    pm2,
    nextOptions,
    metricsPath = DEFAULT_METRICS_PATH,
    collectDefaultMetrics = true,
    bypass,
    normalizePath,
    formatStatusCode,
    maxDepth,
}: NextjsPrometheusExporterOptions) {
    const app = next(nextOptions)
    await app.prepare()

    const handler = app.getRequestHandler()

    if (pm2) {
        await pm2Connector.connect()

        if (collectDefaultMetrics) {
            enableCollectDefaultMetrics()
        }

        registerHistogram(
            DEFAULT_METRICS_TYPE.HTTP_REQUEST,
            DEFAULT_METRICS_NAMES.http_request,
            DEFAULT_METRICS_LABELS.http_request,
            BUCKETS,
        )

        registerGaugeUp()
    }

    const normalizeNextRoutesPath = createNextRoutesUrlGroup(maxDepth)

    const server = http.createServer(async (request, response) => {
        if (!pm2) {
            handler(request, response)
            return
        }

        if (request.url === metricsPath) {
            const {metrics, metricsRegistry} = await pm2Connector.getMetrics()
            response.setHeader('Content-Type', metricsRegistry.contentType)
            response.write(metrics)
            response.end()
            return
        }

        if (bypass?.(request, response) || isBypassPath(request.url || '')) {
            handler(request, response)
            return
        }

        const labels: PromClientLabelValues<string> = {}

        const {timer: endTimer} = startTraceHistogram(DEFAULT_METRICS_TYPE.HTTP_REQUEST, labels)

        onFinished(response, () => {
            labels['status_code'] = formatStatusCode?.(response) || getStatusCodeGroup(response.statusCode)
            labels.method = request.method
            labels.path = normalizePath?.(request, response) || normalizeNextRoutesPath(request.url || '')
            endTimer?.()
        })

        handler(request, response)
    })

    server.on('close', async () => {
        try {
            if (pm2) {
                await pm2Connector.disconnect()
            }
        } finally {
            exit(0)
        }
    })

    return server
}
