/* eslint-disable @typescript-eslint/no-explicit-any */

import type {ProcessDescription} from 'pm2'

/** Handler function type for PM2 messages */
export type PM2MessageHandler<T = any, R = any> = (data: T) => Promise<R> | R

/** Configuration options for getting PM2 messages */
export interface PM2GetMessageOptions {
    /** Filter function to select which processes to query */
    filter?: (process: ProcessDescription) => boolean
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
