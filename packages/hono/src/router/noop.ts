import {HttpStatusCodes} from '@naverpay/es-http-status-codes'
import {DEFAULT_METRICS_PATH} from '@naverpay/prometheus-core'
import {Hono} from 'hono'

import type {HonoPrometheusExporterOptions} from '../types'

/**
 * Creates a no-operation router that returns a simple message for metrics endpoint
 * @param options - Configuration options including metrics path
 * @returns Configured Hono app
 */
export function getNoopRouter({
    metricsPath = DEFAULT_METRICS_PATH,
}: Pick<HonoPrometheusExporterOptions, 'metricsPath'>) {
    const app = new Hono()
    app.get(metricsPath, (context) => {
        return context.text('[@naverpay/prometheus-hono] this router is a noop', HttpStatusCodes.OK, {
            'Content-Type': 'text/plain',
        })
    })
    return app
}
