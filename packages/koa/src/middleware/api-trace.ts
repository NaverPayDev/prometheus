/* eslint-disable unicorn/consistent-function-scoping */
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

import type {Context, Middleware} from 'koa'

/**
 * Creates middleware for tracing API requests with Prometheus metrics
 * @param parameters - Configuration options
 * @returns Object containing middleware functions for API tracing
 */
export function createKoaApiTraceMiddleware(parameters?: {normalizePath?: (context: Context) => string}) {
    registerHistogram(
        DEFAULT_METRICS_TYPE.HTTP_API_REQUEST,
        DEFAULT_METRICS_NAMES.http_api_request,
        DEFAULT_METRICS_LABELS.http_api_request,
        BUCKETS,
    )

    const startApiTrace: Middleware = (context, next) => {
        const {pathname} = context.URL
        context.state.traceMetrics = startTraceHistogram(DEFAULT_METRICS_TYPE.HTTP_API_REQUEST, {
            path: parameters?.normalizePath?.(context) || pathname,
            method: context.method,
        })
        return next()
    }

    const writeApiTrace = (context: Context) => {
        if (context.state.traceMetrics) {
            endTraceHistogram(context.state.traceMetrics, {status: context.status})
        }
    }

    const endApiTrace = (context: Context) => {
        context.throw(HttpStatusCodes.NOT_FOUND)
    }

    return {startApiTrace, writeApiTrace, endApiTrace}
}
