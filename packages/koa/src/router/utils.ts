/* eslint-disable @typescript-eslint/no-explicit-any */

import type Router from '@koa/router'

/**
 * Extracts all route paths from a Koa router
 * @param router - The Koa router instance
 * @param prefix - Optional prefix to add to paths
 * @returns Array of route paths
 */
export function getKoaRouterPaths(router: Router<any, any>, prefix = '') {
    return router.stack.map(({path}) => `${prefix}${path}`)
}

/**
 * Creates regex testers for path matching
 * @param pathnames - Array of path patterns
 * @param prefix - Prefix to add to paths
 * @returns Array of objects with regex and path
 */
export function createPathTesters(pathnames: string[], prefix: string) {
    return pathnames.map((path) => {
        const pathWithPrefix = `${prefix}${path}`
        const pattern = `^${pathWithPrefix.replaceAll(/:\w+/g, '[^/]+')}/?$`
        const regExp = new RegExp(pattern)
        return {regExp, path: pathWithPrefix}
    })
}

/**
 * Gets normalized path by matching against regex testers
 * @param pathname - The pathname to normalize
 * @param testers - Array of regex testers
 * @returns Normalized path or original pathname if no match
 */
export function getNormalizedPath(pathname: string, testers: {regExp: RegExp; path: string}[]) {
    for (const {regExp, path} of testers) {
        if (regExp.test(pathname)) {
            return path
        }
    }
    return pathname
}

/**
 * Creates a function that normalizes Koa router paths for metrics
 * @param router - The Koa router instance
 * @param prefix - Optional prefix for paths
 * @returns Function that normalizes pathnames
 */
export function createNormalizedKoaRouterPath(router: Router<any, any>, prefix = '') {
    const paths = getKoaRouterPaths(router, prefix)
    const testers = createPathTesters(paths, prefix)

    return function getNormalizedKoaRouterPath(pathname: string) {
        return getNormalizedPath(pathname, testers)
    }
}
