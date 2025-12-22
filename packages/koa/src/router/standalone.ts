import Router from '@koa/router'
import {DEFAULT_METRICS_PATH, getStandaloneMetrics} from '@naverpay/prometheus-core'

import type {KoaPrometheusExporterOptions} from '../types'

/**
 * Creates a Koa router with metrics endpoint for standalone (non-PM2) mode
 * @param options - Configuration options including metrics path
 * @returns Configured Koa router
 */
export function getKoaStandaloneMetricsRouter({
    metricsPath = DEFAULT_METRICS_PATH,
}: Pick<KoaPrometheusExporterOptions, 'metricsPath'>) {
    const router = new Router()
    router.get(metricsPath, async (context) => {
        const {metrics, contentType} = await getStandaloneMetrics()
        context.set('Content-Type', contentType)
        context.body = metrics
    })
    return router
}
