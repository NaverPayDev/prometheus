import {promisify} from 'node:util'

import pm2 from 'pm2'

import type {PM2RequestPacket} from './types'
import type {EventEmitter} from 'node:events'

/** Promisified PM2 connect function */
const connect = promisify(pm2.connect.bind(pm2))

/** Promisified PM2 disconnect function */
const disconnect = promisify(pm2.disconnect.bind(pm2))

/** Promisified PM2 list function */
const list = promisify(pm2.list.bind(pm2))

/**
 * Promisified PM2 launchBus function
 * @returns Promise that resolves to EventEmitter for PM2 bus communication
 */
function launchBus(): Promise<EventEmitter> {
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
function sendDataToProcessId(pmId: number, packet: PM2RequestPacket): Promise<void> {
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
