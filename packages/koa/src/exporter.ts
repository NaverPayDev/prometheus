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

import {getKoaMetricsMiddleware} from './middleware/metrics'
import {getKoaNoopMiddleware} from './middleware/noop'
import {getKoaMetricsRouter} from './router/metrics'
import {getNoopRouter} from './router/noop'
import {getKoaStandaloneMetricsRouter} from './router/standalone'

import type {KoaPrometheusExporterOptions} from './types'

async function noop() {
    // No operation
}

/**
 * Creates a Koa Prometheus exporter with middleware and router
 * @param options - Configuration options for the exporter
 * @returns Object containing router, middleware, and disconnect function
 */
export async function createKoaPrometheusExporter({
    enabled = true,
    pm2 = false,
    nextjs = true,
    metricsPath,
    collectDefaultMetrics = true,
    bypass,
    normalizePath,
    formatStatusCode,
    maxNormalizedUrlDepth,
}: KoaPrometheusExporterOptions) {
    // Disabled: return noop
    if (!enabled) {
        return {
            router: getNoopRouter({metricsPath}),
            middleware: getKoaNoopMiddleware(),
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

    const middleware = getKoaMetricsMiddleware({nextjs, bypass, normalizePath, formatStatusCode, maxNormalizedUrlDepth})

    // PM2 mode: aggregated metrics from all workers
    // Standalone mode: single process metrics
    const router = pm2 ? getKoaMetricsRouter({metricsPath}) : getKoaStandaloneMetricsRouter({metricsPath})

    return {
        router,
        middleware,
        disconnect: pm2 ? pm2Connector.disconnect : noop,
    }
}
