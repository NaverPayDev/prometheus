import type {CommonPrometheusExporterOptions} from '@naverpay/prometheus-core'
import type {Context} from 'hono'

/** Configuration options for Hono Prometheus exporter */
export interface HonoPrometheusExporterOptions extends CommonPrometheusExporterOptions {
    /** Function to determine if a request should be bypassed from metrics collection */
    bypass?: (context: Context) => boolean
    /**
     * Function to normalize/group request paths for metrics.
     * Return a string to use it as the path label. Return `undefined` to skip this path and
     * fall through to Next.js route grouping (when `nextjs` is enabled) and then default normalization.
     */
    normalizePath?: (context: Context) => string | undefined
    /** Function to format status codes for metrics */
    formatStatusCode?: (context: Context) => string
}
