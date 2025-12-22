import Router from '@koa/router'
import {DEFAULT_METRICS_PATH, pm2Connector} from '@naverpay/prometheus-core'

import type {KoaPrometheusExporterOptions} from '../types'

/**
 * Creates a Koa router with metrics endpoint
 * @param options - Configuration options including metrics path
 * @returns Configured Koa router
 */
export function getKoaMetricsRouter({
    metricsPath = DEFAULT_METRICS_PATH,
}: Pick<KoaPrometheusExporterOptions, 'metricsPath'>) {
    const router = new Router()
    router.get(metricsPath, async (context) => {
        const {metrics, metricsRegistry} = await pm2Connector.getMetrics()
        context.set('Content-Type', metricsRegistry.contentType)
        context.body = metrics
    })
    return router
}
