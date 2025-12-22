import {HttpStatusCodes} from '@naverpay/es-http-status-codes'
import {
    BUCKETS,
    DEFAULT_METRICS_LABELS,
    DEFAULT_METRICS_NAMES,
    DEFAULT_METRICS_TYPE,
    endTraceHistogram,
    registerHistogram,
    startTraceHistogram,
} from '@naverpay/prometheus-core'

import type {Context, MiddlewareHandler} from 'hono'

type TraceMetrics = ReturnType<typeof startTraceHistogram>

declare module 'hono' {
    interface ContextVariableMap {
        traceMetrics?: TraceMetrics
    }
}

function writeApiTrace(context: Context) {
    const traceMetrics = context.get('traceMetrics')
    if (traceMetrics) {
        endTraceHistogram(traceMetrics, {status: context.res.status})
    }
}

function endApiTrace(context: Context) {
    return context.text('Not Found', HttpStatusCodes.NOT_FOUND)
}

/**
 * Creates middleware for tracing API requests with Prometheus metrics
 * @param parameters - Configuration options
 * @returns Object containing middleware functions for API tracing
 */
export function createHonoApiTraceMiddleware(parameters?: {normalizePath?: (context: Context) => string}) {
    registerHistogram(
        DEFAULT_METRICS_TYPE.HTTP_API_REQUEST,
        DEFAULT_METRICS_NAMES.http_api_request,
        DEFAULT_METRICS_LABELS.http_api_request,
        BUCKETS,
    )

    const startApiTrace: MiddlewareHandler = (context, next) => {
        const url = new URL(context.req.url)
        const path = parameters?.normalizePath?.(context) || url.pathname
        const method = context.req.method
        context.set('traceMetrics', startTraceHistogram(DEFAULT_METRICS_TYPE.HTTP_API_REQUEST, {path, method}))
        return next()
    }

    return {startApiTrace, writeApiTrace, endApiTrace}
}
