/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable unicorn/no-null */

/**
 * Improved version of https://www.npmjs.com/package/pm2-messages
 * Built-in implementation of pm2-messages which is no longer maintained
 * Original file: https://github.com/ChrisLahaye/pm2-messages/blob/master/src/index.ts
 */
import {nanoid} from 'nanoid'

import pm2 from './promisify'

import type {PM2GetMessageOptions, PM2MessageHandler, PM2RequestPacket, PM2ResponsePacket} from './types'
import type EventEmitter from 'node:events'

const pm2MessageHandlers: Record<string, PM2MessageHandler> = {}

const processName = process.env.name
const pm2InstanceId = Number(process.env.pm_id)

let pm2EventBus: EventEmitter | null = null
const pm2EventBusListeners: Record<string, (instanceId: number, message: any) => void> = {}

/**
 * Type guard to check if a message is a PM2 request packet
 * @param target - The message to check
 * @returns True if the message is a PM2RequestPacket
 */
function isPM2RequestPacket(target: unknown): target is PM2RequestPacket {
    return !!target && typeof target === 'object' && 'topic' in target && 'data' in target && !!(target as any).data
}

process.on('message', async (message: unknown): Promise<void> => {
    if (isPM2RequestPacket(message) && typeof pm2MessageHandlers[message.topic] === 'function' && process.send) {
        const {targetInstanceId, requestId, data} = message.data
        const handledMessage = await pm2MessageHandlers?.[message.topic]?.(data)
        const response: PM2ResponsePacket<unknown> = {
            type: `process:${targetInstanceId}`,
            data: {
                instanceId: pm2InstanceId,
                requestId,
                message: handledMessage,
            },
        }
        process.send(response)
    }
})

/**
 * Connects to PM2 message bus and sets up event listeners
 */
async function connect(): Promise<void> {
    await pm2.connect()
    const bus = await pm2.launchBus()
    pm2EventBus = bus
    pm2EventBus.on(`process:${pm2InstanceId}`, ({data: {instanceId, requestId, message}}: PM2ResponsePacket<any>) => {
        pm2EventBusListeners?.[requestId]?.(instanceId, message)
    })
}

/**
 * Checks if PM2 event bus is connected
 * @returns True if connected to PM2 event bus
 */
function isConnected(): boolean {
    return !!pm2EventBus
}

/**
 * Disconnects from PM2 message bus
 */
async function disconnect(): Promise<void> {
    await pm2.disconnect()
    pm2EventBus = null
}

/**
 * Collects messages from all PM2 processes matching the filter
 * @param topic - Message topic to collect
 * @param data - Optional data to send with the request
 * @param options - Collection options including filter, timeout, etc.
 * @returns Promise resolving to array of collected messages
 */
async function getMessages<T = any>(
    topic: string,
    data?: any,
    {filter = (p) => p.name === processName, includeSelfIfUnmanaged = false, timeout = 3000}: PM2GetMessageOptions = {},
): Promise<T[]> {
    const requestId = nanoid()

    const timeoutPromise = new Promise<never>((_resolve, reject) =>
        setTimeout(() => reject(new Error(`[@naverpay/prometheus-core] pm2 ${topic} messages timed out`)), timeout),
    )

    async function collectMessages(): Promise<T[]> {
        const processes = await pm2.list()
        const messages: T[] = []
        const resolvers: Promise<void>[] = []
        const resolverBusTargets: number[] = []

        const resolverSelf = async (): Promise<void> => {
            messages.push(await pm2MessageHandlers?.[topic]?.(data))
        }

        if (includeSelfIfUnmanaged && Number.isNaN(pm2InstanceId)) {
            resolvers.push(resolverSelf())
        }

        for (const process of processes) {
            if (filter(process)) {
                if (process.pm_id === pm2InstanceId) {
                    resolvers.push(resolverSelf())
                } else if (typeof process.pm_id === 'number') {
                    resolverBusTargets.push(process.pm_id)
                }
            }
        }

        if (resolverBusTargets.length > 0) {
            resolvers.push(
                new Promise<void>((resolve, reject) => {
                    const pendingTargets = new Set(resolverBusTargets)

                    pm2EventBusListeners[requestId] = (instanceId, message) => {
                        if (pendingTargets.delete(instanceId)) {
                            messages.push(message)
                            if (pendingTargets.size === 0) {
                                resolve()
                            }
                        }
                    }

                    const packet: PM2RequestPacket = {
                        topic,
                        data: {targetInstanceId: pm2InstanceId, requestId, data},
                    }

                    Promise.all(resolverBusTargets.map((pmId) => pm2.sendDataToProcessId(pmId, packet))).catch(reject)
                }),
            )
        }

        await Promise.all(resolvers)

        delete pm2EventBusListeners[requestId]

        return messages
    }

    return Promise.race([timeoutPromise, collectMessages()])
}

/**
 * Registers a message handler for a specific topic
 * @param topic - Message topic to handle
 * @param handler - Function to handle messages for this topic
 */
function onMessage(topic: string, handler: PM2MessageHandler): void {
    pm2MessageHandlers[topic] = handler
}

/** PM2 messages API object */
export const pm2Messages = {connect, isConnected, disconnect, getMessages, onMessage}
