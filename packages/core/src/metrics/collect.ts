import promClient from 'prom-client'

/**
 * Enables collection of default Node.js metrics (CPU, memory, event loop, etc.)
 */
export function enableCollectDefaultMetrics() {
    promClient.collectDefaultMetrics()
}
