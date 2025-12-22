import promClient from 'prom-client'

/**
 * Gets metrics from prom-client registry for standalone (non-PM2) mode
 * @returns Promise resolving to metrics string and content type
 */
export async function getStandaloneMetrics() {
    const metrics = await promClient.register.metrics()
    return {metrics, contentType: promClient.register.contentType}
}
