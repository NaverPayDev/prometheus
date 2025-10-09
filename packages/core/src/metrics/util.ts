import {HttpStatusCodes} from '@naverpay/es-http-status-codes'

/**
 * Determines if a request path should be bypassed from metrics collection
 * @param path - The request path to check
 * @returns True if the path should be bypassed
 */
export function isBypassPath(path: string) {
    /**
     * next.js는 반복된 slash(//) 혹은 역slash(\)가 사용된 경우 자동으로 redirect (308) 처리한다.
     * 이로 인해 불필요한 redirect가 기록되어 기본적으로 bypass 처리
     */
    if (/(\\|\/\/)/.test(path)) {
        return true
    }

    /**
     * 불필요한 webpack-hmr 요청을 bypass 처리
     */
    if (/\/_next\/webpack-hmr/.test(path)) {
        return true
    }

    /**
     * 기본적으로 healthcheck와 metrics는 bypass 처리
     */
    return ['/healthcheck', '/metrics'].includes(path)
}

/**
 * Groups HTTP status codes for metrics aggregation
 * @param statusCode - The HTTP status code
 * @returns Grouped status code (200, 500, or 2xx/3xx/4xx/5xx format)
 */
export function getStatusCodeGroup(statusCode: number) {
    switch (statusCode) {
        /**
         * 200, 500만 그대로 사용
         */
        case HttpStatusCodes.OK:
        case HttpStatusCodes.INTERNAL_SERVER_ERROR: {
            return statusCode
        }
        /**
         * 그 외 status code는 2xx, 3xx, 4xx, 5xx로 그룹화
         */
        default: {
            return `${Math.floor(statusCode / 100)}xx`
        }
    }
}
