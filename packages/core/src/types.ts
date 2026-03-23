/** Common configuration options for Prometheus exporters */
export interface CommonPrometheusExporterOptions {
    /** Whether to enable metrics collection (default: true) */
    enabled?: boolean
    /** Whether to enable PM2 clustering support for aggregating metrics across workers */
    pm2?: boolean
    /** Whether to enable Next.js route normalization */
    nextjs?: boolean
    /** Custom path for metrics endpoint */
    metricsPath?: string
    /** Whether to collect default Node.js metrics */
    collectDefaultMetrics?: boolean
    /** URL depth limit for path normalization */
    maxNormalizedUrlDepth?: number
}
