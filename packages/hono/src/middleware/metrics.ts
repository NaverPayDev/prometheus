import {
    createNextRoutesUrlGroup,
    DEFAULT_METRICS_TYPE,
    getStatusCodeGroup,
    isBypassPath,
    startTraceHistogram,
    normalizeUrlWithTrimming,
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
    maxNormalizedUrlDepth,
}: Pick<
    HonoPrometheusExporterOptions,
    'nextjs' | 'bypass' | 'normalizePath' | 'formatStatusCode' | 'maxNormalizedUrlDepth'
>): MiddlewareHandler {
    const normalizeNextRoutesPath = nextjs ? createNextRoutesUrlGroup(maxNormalizedUrlDepth) : undefined

    const extendedNormalizePath = (context: Context) => {
        const url = new URL(context.req.url)
        return (
            normalizeNextRoutesPath?.(url.href) ||
            normalizePath?.(context) ||
            normalizeUrlWithTrimming(url.pathname, maxNormalizedUrlDepth)
        )
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
