import fs from 'node:fs'
import path from 'node:path'

import {glob} from 'glob'

interface RouteInfo {
    page: string
    regex: string
}

interface RoutesManifest {
    basePath: string
    dynamicRoutes: RouteInfo[]
    staticRoutes: RouteInfo[]
}

/**
 * Reads and parses Next.js routes manifest file
 * @returns Object containing basePath and routes with regex patterns
 */
export function getNextRoutesManifest() {
    try {
        const pattern = path.join(process.cwd(), '**/.next/routes-manifest.json')
        const manifestsPath = glob.globSync(pattern, {nodir: true})
        if (!manifestsPath[0]) {
            throw new Error('No routes-manifest.json found')
        }
        const manifestJson = JSON.parse(fs.readFileSync(manifestsPath[0], 'utf8')) as RoutesManifest
        const {basePath, dynamicRoutes: orgDynamicRoutes, staticRoutes: orgStaticRoutes} = manifestJson
        const dynamicRoutes = orgDynamicRoutes.map(({page, regex}) => ({page, regex: new RegExp(regex)}))
        const staticRoutes = orgStaticRoutes.map(({page, regex}) => ({page, regex: new RegExp(regex)}))
        const routes = [...dynamicRoutes, ...staticRoutes]
        return {basePath, dynamicRoutes, staticRoutes, routes}
    } catch {
        // eslint-disable-next-line no-console
        console.warn('No routes manifest found. Please make sure you are running in a Next.js environment.')
        return {basePath: '', dynamicRoutes: [], staticRoutes: [], routes: []}
    }
}

/**
 * Creates a function that normalizes Next.js URLs to route patterns for metrics
 * @returns Function that takes a URL and returns the normalized route pattern
 */
export function createNextRoutesUrlGroup(maxDepth: number, trimDynamic: boolean) {
    const {basePath, dynamicRoutes, routes} = getNextRoutesManifest()

    return function getUrlGroup(originalUrl: string) {
        const [orgRoute] = originalUrl.split('?')
        const route = orgRoute?.split('#')?.shift() ?? ''

        if (route === '/') {
            return '/'
        }

        const url = /^\//.test(route) ? route : `/${route}`
        const trailingSlashUrl = url.endsWith('/') ? url.slice(0, -1) : url
        const withoutBasePathUrl = trailingSlashUrl.startsWith(basePath)
            ? trailingSlashUrl.replace(basePath, '')
            : trailingSlashUrl

        const isStatic = /(^\/_next\/)|(\.\w{1,5}$)/.test(withoutBasePathUrl)

        if (isStatic) {
            return 'STATIC'
        }

        for (const it of routes) {
            if (it.regex.test(withoutBasePathUrl)) {
                return dynamicRoutes.includes(it) && !trimDynamic
                    ? it.page
                    : `/${it.page
                          .split('/')
                          .slice(1, maxDepth + 1)
                          .join('/')}`
            }
        }

        return withoutBasePathUrl
    }
}
