import {
    BUCKETS,
    DEFAULT_METRICS_LABELS,
    DEFAULT_METRICS_NAMES,
    DEFAULT_METRICS_TYPE,
    enableCollectDefaultMetrics,
    registerGaugeUp,
    pm2Connector,
    registerHistogram,
} from '@naverpay/prometheus-core'

import {getHonoMetricsMiddleware} from './middleware/metrics'
import {getHonoNoopMiddleware} from './middleware/noop'
import {getHonoMetricsRouter} from './router/metrics'
import {getNoopRouter} from './router/noop'
import {getHonoStandaloneMetricsRouter} from './router/standalone'

import type {HonoPrometheusExporterOptions} from './types'

async function noop() {
    // No operation
}

/**
 * Creates a Hono Prometheus exporter with middleware and router
 * @param options - Configuration options for the exporter
 * @returns Object containing router, middleware, and disconnect function
 */
export async function createHonoPrometheusExporter({
    enabled = true,
    pm2 = false,
    nextjs = true,
    metricsPath,
    collectDefaultMetrics = true,
    bypass,
    normalizePath,
    formatStatusCode,
    maxDepth,
}: HonoPrometheusExporterOptions) {
    // Disabled: return noop
    if (!enabled) {
        return {
            router: getNoopRouter({metricsPath}),
            middleware: getHonoNoopMiddleware(),
            disconnect: noop,
        }
    }

    // PM2 cluster mode: connect to PM2
    if (pm2) {
        await pm2Connector.connect()
    }

    // Register default metrics
    if (collectDefaultMetrics) {
        enableCollectDefaultMetrics()
    }

    // Register HTTP request histogram
    registerHistogram(
        DEFAULT_METRICS_TYPE.HTTP_REQUEST,
        DEFAULT_METRICS_NAMES.http_request,
        DEFAULT_METRICS_LABELS.http_request,
        BUCKETS,
    )

    registerGaugeUp()

    const middleware = getHonoMetricsMiddleware({
        nextjs,
        bypass,
        normalizePath,
        formatStatusCode,
        maxDepth,
    })

    // PM2 mode: aggregated metrics from all workers
    // Standalone mode: single process metrics
    const router = pm2 ? getHonoMetricsRouter({metricsPath}) : getHonoStandaloneMetricsRouter({metricsPath})

    return {
        router,
        middleware,
        disconnect: pm2 ? pm2Connector.disconnect : noop,
    }
}
