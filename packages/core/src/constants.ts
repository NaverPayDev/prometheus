/** Default path for metrics endpoint */
export const DEFAULT_METRICS_PATH = '/metrics'

/** Event name for PM2 register communication */
export const PROM_REGISTER_EVENT = 'get_prom_register'

/** Default histogram buckets for response time measurements in seconds */
export const BUCKETS = [0.1, 0.3, 0.95, 1.2, 3, 5, 7, 9, 10, 20, 30, 40, 50, 60, 70]

/** Enum for different types of default metrics */
export enum DEFAULT_METRICS_TYPE {
    HTTP_REQUEST = 'http_request',
    HTTP_API_REQUEST = 'http_api_request',
}

/** Mapping of metric types to their Prometheus metric names */
export const DEFAULT_METRICS_NAMES = {
    [DEFAULT_METRICS_TYPE.HTTP_REQUEST]: 'http_request_duration_seconds',
    [DEFAULT_METRICS_TYPE.HTTP_API_REQUEST]: 'http_api_request_duration_seconds',
}

/** Mapping of metric types to their label names */
export const DEFAULT_METRICS_LABELS = {
    [DEFAULT_METRICS_TYPE.HTTP_REQUEST]: ['status_code', 'method', 'path'],
    [DEFAULT_METRICS_TYPE.HTTP_API_REQUEST]: ['path', 'status', 'method'],
}
