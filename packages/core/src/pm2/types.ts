/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Minimal subset of pm2's `ProcessDescription` fields actually used by this
 * package, redeclared locally so consumers without pm2 installed don't hit
 * `Cannot find module 'pm2'` when resolving this package's type declarations
 */
export interface PM2ProcessDescription {
    /** Process name registered in PM2 */
    name?: string
    /** PM2-assigned process ID */
    pm_id?: number
}

/** Handler function type for PM2 messages */
export type PM2MessageHandler<T = any, R = any> = (data: T) => Promise<R> | R

/** Configuration options for getting PM2 messages */
export interface PM2GetMessageOptions {
    /** Filter function to select which processes to query */
    filter?: (process: PM2ProcessDescription) => boolean
    /** Whether to include self if not managed by PM2 */
    includeSelfIfUnmanaged?: boolean
    /** Timeout in milliseconds for message collection */
    timeout?: number
}

/** Structure of PM2 request packets sent between processes */
export interface PM2RequestPacket<T = any> {
    /** Message topic/type identifier */
    topic: string
    /** Request data payload */
    data: {
        /** Target PM2 instance ID */
        targetInstanceId: number
        /** Unique request identifier */
        requestId: string
        /** Actual data being sent */
        data: T
    }
}

/** Structure of PM2 response packets sent back from processes */
export interface PM2ResponsePacket<T = any> {
    /** Response type identifier */
    type: string
    /** Response data payload */
    data: {
        /** Source PM2 instance ID */
        instanceId: number
        /** Request ID this response belongs to */
        requestId: string
        /** Response message/data */
        message: T
    }
}
