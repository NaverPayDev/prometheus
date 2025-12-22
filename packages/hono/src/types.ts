import type {CommonPrometheusExporterOptions} from '@naverpay/prometheus-core'
import type {Context} from 'hono'

/** Configuration options for Hono Prometheus exporter */
export interface HonoPrometheusExporterOptions extends CommonPrometheusExporterOptions {
    /** Function to determine if a request should be bypassed from metrics collection */
    bypass?: (context: Context) => boolean
    /** Function to normalize/group request paths for metrics */
    normalizePath?: (context: Context) => string
    /** Function to format status codes for metrics */
    formatStatusCode?: (context: Context) => string
}
