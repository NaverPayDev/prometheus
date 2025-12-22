import {DEFAULT_METRICS_PATH, pm2Connector} from '@naverpay/prometheus-core'
import {Hono} from 'hono'

import type {HonoPrometheusExporterOptions} from '../types'

/**
 * Creates a Hono app with metrics endpoint
 * @param options - Configuration options including metrics path
 * @returns Promise resolving to configured Hono app
 */
export async function getHonoMetricsRouter({
    metricsPath = DEFAULT_METRICS_PATH,
}: Pick<HonoPrometheusExporterOptions, 'metricsPath'>) {
    const app = new Hono()
    app.get(metricsPath, async (context) => {
        const {metrics, metricsRegistry} = await pm2Connector.getMetrics()
        return context.text(metrics, 200, {
            'Content-Type': metricsRegistry.contentType,
        })
    })
    return app
}
