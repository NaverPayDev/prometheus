import {DEFAULT_METRICS_PATH, getStandaloneMetrics} from '@naverpay/prometheus-core'
import {Hono} from 'hono'

import type {HonoPrometheusExporterOptions} from '../types'

/**
 * Creates a Hono app with metrics endpoint for standalone (non-PM2) mode
 * @param options - Configuration options including metrics path
 * @returns Configured Hono app
 */
export function getHonoStandaloneMetricsRouter({
    metricsPath = DEFAULT_METRICS_PATH,
}: Pick<HonoPrometheusExporterOptions, 'metricsPath'>) {
    const app = new Hono()
    app.get(metricsPath, async (context) => {
        const {metrics, contentType} = await getStandaloneMetrics()
        return context.text(metrics, 200, {
            'Content-Type': contentType,
        })
    })
    return app
}
