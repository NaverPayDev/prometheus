/** Common configuration options for Prometheus exporters */
export interface CommonPrometheusExporterOptions {
    /** Whether to enable PM2 clustering support */
    pm2: boolean
    /** Whether to enable Next.js route normalization */
    nextjs?: boolean
    /** Custom path for metrics endpoint */
    metricsPath?: string
    /** Whether to collect default Node.js metrics */
    collectDefaultMetrics?: boolean
}
