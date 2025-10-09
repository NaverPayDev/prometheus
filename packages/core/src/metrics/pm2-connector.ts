import promClient from 'prom-client'

import {PROM_REGISTER_EVENT} from '../constants'
import {pm2Messages} from '../pm2/messages'

/**
 * Disconnects from PM2 message bus and clears the metrics registry
 */
async function disconnect() {
    try {
        if (pm2Messages.isConnected()) {
            await pm2Messages.disconnect()
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
    } finally {
        promClient.register.clear()
    }
}

/**
 * Connects to PM2 message bus and sets up message handlers for metrics collection
 */
async function connect() {
    if (pm2Messages.isConnected()) {
        return
    }

    try {
        await pm2Messages.connect()
        pm2Messages.onMessage(PROM_REGISTER_EVENT, () => promClient.register.getMetricsAsJSON())
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
    }
}

/**
 * Aggregates metrics from all PM2 processes and returns them as a string
 * @returns Object containing metrics string and registry
 */
async function getMetrics() {
    const metricsArray = await pm2Messages.getMessages(PROM_REGISTER_EVENT)
    const metricsRegistry = promClient.AggregatorRegistry.aggregate(metricsArray)
    const metrics = await metricsRegistry.metrics()
    return {metrics, metricsRegistry}
}

export const pm2Connector = {connect, disconnect, getMetrics}
