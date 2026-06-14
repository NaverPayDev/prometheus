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

        // 사용자가 제공한 normalizePath를 최우선으로 사용한다.
        // 값을 반환하면 그 값을 쓰고, undefined를 반환하면 "이 경로는 처리하지 않음"으로 보고
        // Next.js 그룹핑 → 기본 정규화 순서로 위임한다.
        // (기존 `||` 체이닝은 Next.js 그룹핑이 미매칭 시에도 비어있지 않은 값을 반환해 normalizePath가 무시되었다)
        const normalized = normalizePath?.(context)
        if (normalized !== undefined) {
            return normalized
        }

        // Next.js 라우트 그룹핑은 전체 URL(href)이 아닌 pathname 기준으로 매칭해야 한다.
        // (href를 넘기면 scheme/host가 경로에 섞여 `/http://host/...` 형태의 비정규화 라벨이 생성된다)
        if (normalizeNextRoutesPath) {
            return normalizeNextRoutesPath(url.pathname)
        }

        return normalizeUrlWithTrimming(url.pathname, maxNormalizedUrlDepth)
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
