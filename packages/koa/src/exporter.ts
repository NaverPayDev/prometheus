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

import type {KoaPrometheusExporterOptions} from './types'

/**
 * Creates a Koa Prometheus exporter with middleware and router
 * @param options - Configuration options for the exporter
 * @returns Object containing router, middleware, and disconnect function
 */
export async function createKoaPrometheusExporter({
    pm2,
    nextjs = true,
    metricsPath,
    collectDefaultMetrics = true,
    bypass,
    normalizePath,
    formatStatusCode,
}: KoaPrometheusExporterOptions) {
    if (!pm2) {
        const router = getNoopRouter({metricsPath})
        const middleware = getKoaNoopMiddleware()
        return {
            router,
            middleware,
            disconnect: async () => {
                // noop
            },
        }
    }

    if (pm2) {
        await pm2Connector.connect()
    }

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

    const middleware = getKoaMetricsMiddleware({nextjs, bypass, normalizePath, formatStatusCode})
    const router = await getKoaMetricsRouter({metricsPath})

    return {
        router,
        middleware,
        disconnect: pm2Connector.disconnect,
    }
}
