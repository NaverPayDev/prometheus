import {
    createNextRoutesUrlGroup,
    DEFAULT_METRICS_TYPE,
    getStatusCodeGroup,
    isBypassPath,
    startTraceHistogram,
} from '@naverpay/prometheus-core'

import type {HonoPrometheusExporterOptions} from '../types'
import type {PromClientLabelValues} from '@naverpay/prometheus-core'
import type {Context, MiddlewareHandler} from 'hono'

/**
 * Creates Hono middleware for collecting HTTP request metrics
 * @param options - Configuration options for metrics collection
 * @returns Hono middleware function
 */
export function getHonoMetricsMiddleware({
    nextjs,
    bypass,
    normalizePath,
    formatStatusCode,
}: Pick<HonoPrometheusExporterOptions, 'nextjs' | 'bypass' | 'normalizePath' | 'formatStatusCode'>): MiddlewareHandler {
    const normalizeNextRoutesPath = nextjs ? createNextRoutesUrlGroup() : undefined

    const extendedNormalizePath = (context: Context) => {
        const url = new URL(context.req.url)
        return normalizeNextRoutesPath?.(url.href) || normalizePath?.(context) || url.pathname
    }

    return async (context, next) => {
        const url = new URL(context.req.url)

        if (bypass?.(context) || isBypassPath(url.pathname)) {
            return next()
        }

        const labels: PromClientLabelValues<string> = {}

        const {timer: endTimer} = startTraceHistogram(DEFAULT_METRICS_TYPE.HTTP_REQUEST, labels)

        await next()

        labels['status_code'] = formatStatusCode?.(context) || getStatusCodeGroup(context.res.status)
        labels.method = context.req.method
        labels.path = extendedNormalizePath(context)

        endTimer?.()
    }
}
