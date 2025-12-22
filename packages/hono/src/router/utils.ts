import type {Env, Hono, Schema} from 'hono'

/**
 * Extracts all route paths from a Hono app
 * @param app - The Hono app instance
 * @param prefix - Optional prefix to add to paths
 * @returns Array of route paths
 */
export function getHonoRouterPaths<E extends Env, S extends Schema, B extends string>(app: Hono<E, S, B>, prefix = '') {
    return app.routes.map(({path}) => `${prefix}${path}`)
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
 * Creates a function that normalizes Hono router paths for metrics
 * @param app - The Hono app instance
 * @param prefix - Optional prefix for paths
 * @returns Function that normalizes pathnames
 */
export function createNormalizedHonoRouterPath<E extends Env, S extends Schema, B extends string>(
    app: Hono<E, S, B>,
    prefix = '',
) {
    const paths = getHonoRouterPaths(app, prefix)
    const testers = createPathTesters(paths, prefix)

    return function getNormalizedHonoRouterPath(pathname: string) {
        return getNormalizedPath(pathname, testers)
    }
}
