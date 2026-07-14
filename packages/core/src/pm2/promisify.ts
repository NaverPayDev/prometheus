import {promisify} from 'node:util'

import type {PM2ProcessDescription, PM2RequestPacket} from './types'
import type {EventEmitter} from 'node:events'
import type PM2 from 'pm2'

let pm2Module: typeof PM2 | undefined

/**
 * Lazily loads the pm2 module so that consumers who don't use PM2-based
 * features never trigger `Cannot find module 'pm2'` at import time
 * @returns Loaded pm2 module
 */
async function loadPm2(): Promise<typeof PM2> {
    if (!pm2Module) {
        const imported = await import('pm2')
        pm2Module = imported.default
    }
    return pm2Module
}

/** Promisified PM2 connect function */
async function connect(): Promise<void> {
    const pm2 = await loadPm2()
    return promisify(pm2.connect.bind(pm2))()
}

/** Promisified PM2 disconnect function */
async function disconnect(): Promise<void> {
    const pm2 = await loadPm2()
    await promisify(pm2.disconnect.bind(pm2))()
}

/** Promisified PM2 list function */
async function list(): Promise<PM2ProcessDescription[]> {
    const pm2 = await loadPm2()
    return promisify(pm2.list.bind(pm2))()
}

/**
 * Promisified PM2 launchBus function
 * @returns Promise that resolves to EventEmitter for PM2 bus communication
 */
async function launchBus(): Promise<EventEmitter> {
    const pm2 = await loadPm2()
    return new Promise((resolve, reject) => {
        pm2.launchBus((error, bus) => {
            if (error) {
                return reject(error)
            }
            resolve(bus)
        })
    })
}

/**
 * Promisified PM2 sendDataToProcessId function
 * @param pmId - Target PM2 process ID
 * @param packet - Data packet to send
 * @returns Promise that resolves when data is sent
 */
async function sendDataToProcessId(pmId: number, packet: PM2RequestPacket): Promise<void> {
    const pm2 = await loadPm2()
    return new Promise((resolve, reject) => {
        pm2.sendDataToProcessId(pmId, packet, (error: Error) => {
            if (error) {
                reject(error)
            } else {
                resolve()
            }
        })
    })
}

/** Promisified PM2 API object */
const promisifiedPm2 = {
    connect,
    disconnect,
    list,
    launchBus,
    sendDataToProcessId,
}

export default promisifiedPm2
