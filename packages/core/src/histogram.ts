import promClient from 'prom-client'

import {BUCKETS} from './constants'

import type {LabelValues} from 'prom-client'

const registeredMetrics: Record<string, promClient.Histogram<string> | promClient.Gauge> = {}

/**
 * Registers a new histogram metric with the given parameters
 * @param type - Unique identifier for the histogram
 * @param name - Prometheus metric name
 * @param labelNames - Array of label names for the metric
 * @param buckets - Histogram buckets, defaults to BUCKETS constant
 */
export function registerHistogram(type: string, name: string, labelNames: string[], buckets: number[] = BUCKETS) {
    if (registeredMetrics[type]) {
        // eslint-disable-next-line no-console
        console.warn(`Histogram ${type} already registered`)
        return
    }

    registeredMetrics[type] = new promClient.Histogram({
        name,
        help: `duration histogram of ${name} labeled with: ${labelNames.join(', ')}`,
        labelNames: [...labelNames],
        registers: [promClient.register],
        buckets,
    })
}

interface TraceMetrics {
    timer?: () => void
    labelValues: LabelValues<string>
}

/**
 * Starts timing for a histogram metric
 * @param type - The histogram type identifier
 * @param labelValues - Label values for the metric
 * @returns TraceMetrics object containing timer and label values
 */
export function startTraceHistogram(type: string, labelValues: LabelValues<string>): TraceMetrics {
    if (!registeredMetrics?.[type]) {
        // eslint-disable-next-line no-console
        console.warn(`Histogram ${type} not registered`)
    }

    const timer = registeredMetrics?.[type]?.startTimer(labelValues)

    return {timer, labelValues}
}

/**
 * Ends timing for a histogram metric and records the duration
 * @param traceMetrics - The TraceMetrics object from startTraceHistogram
 * @param additionalLabelValues - Additional label values to add before recording
 */
export function endTraceHistogram(traceMetrics: TraceMetrics, additionalLabelValues: LabelValues<string> = {}) {
    if (!traceMetrics) {
        return
    }

    for (const [label, value] of Object.entries(additionalLabelValues)) {
        traceMetrics.labelValues[label] = value
    }

    traceMetrics.timer?.()
}

/**
 * Registers a gauge metric that indicates service availability (1 = up, 0 = down)
 * @param prefix - Optional prefix for the metric name
 */
export function registerGaugeUp(prefix = '') {
    registeredMetrics.up = new promClient.Gauge({
        name: `${prefix}up`,
        help: '1 = up, 0 = not up',
        registers: [promClient.register],
    })
    registeredMetrics.up.set(1)
}
