import {
    createNextRoutesUrlGroup,
    DEFAULT_METRICS_TYPE,
    getStatusCodeGroup,
    isBypassPath,
    startTraceHistogram,
    normalizeUrlWithTrimming,
} from '@naverpay/prometheus-core'
import onFinished from 'on-finished'

import type {KoaPrometheusExporterOptions} from '../types'
import type {PromClientLabelValues} from '@naverpay/prometheus-core'
import type {Context, Middleware} from 'koa'

/**
 * Creates Koa middleware for collecting HTTP request metrics
 * @param options - Configuration options for metrics collection
 * @returns Koa middleware function
 */
export function getKoaMetricsMiddleware({
    nextjs,
    bypass,
    normalizePath,
    formatStatusCode,
    maxNormalizedUrlDepth,
}: Pick<
    KoaPrometheusExporterOptions,
    'nextjs' | 'bypass' | 'normalizePath' | 'formatStatusCode' | 'maxNormalizedUrlDepth'
>): Middleware {
    const normalizeNextRoutesPath = nextjs ? createNextRoutesUrlGroup(maxNormalizedUrlDepth) : undefined

    const extendedNormalizePath = (context: Context) => {
        return (
            normalizeNextRoutesPath?.(context.url) || normalizePath?.(context) || normalizeUrlWithTrimming(context.path)
        )
    }

    return async (context, next) => {
        if (bypass?.(context) || isBypassPath(context.URL.pathname)) {
            return next()
        }

        const labels: PromClientLabelValues<string> = {}

        const {timer: endTimer} = startTraceHistogram(DEFAULT_METRICS_TYPE.HTTP_REQUEST, labels)

        onFinished(context.res, () => {
            labels['status_code'] = formatStatusCode?.(context) || getStatusCodeGroup(context.status)
            labels.method = context.req.method
            labels.path = extendedNormalizePath(context)

            endTimer?.()
        })

        await next()
    }
}
