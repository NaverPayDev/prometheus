import Router from '@koa/router'
import {HttpStatusCodes} from '@naverpay/es-http-status-codes'
import {DEFAULT_METRICS_PATH} from '@naverpay/prometheus-core'

import type {KoaPrometheusExporterOptions} from '../types'

/**
 * Creates a no-operation router that returns a simple message for metrics endpoint
 * @param options - Configuration options including metrics path
 * @returns Configured Koa router
 */
export function getNoopRouter({metricsPath = DEFAULT_METRICS_PATH}: Pick<KoaPrometheusExporterOptions, 'metricsPath'>) {
    const router = new Router()
    router.get(metricsPath, async (context) => {
        context.status = HttpStatusCodes.OK
        context.set('Content-Type', 'text/plain')
        context.body = '[@naverpay/prometheus-koa] this router is a noop'
    })
    return router
}
