import * as fs from 'fs'
import * as path from 'path'
import * as _ from 'lodash'
import * as low from 'lowdb'
import * as FileSync from 'lowdb/adapters/FileSync'

import * as utils from './utils'
import * as types from './types'

const DATA_DIR = './data'

// const CACHE_PATH = path.join(DATA_DIR, 'cache.json')
const DATA_PATH = path.join(DATA_DIR, 'data.json')

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR)
}

if (!fs.statSync(DATA_DIR).isDirectory()) {
    process.exit(1)
}

const adapter = new FileSync(DATA_PATH)
const db = low(adapter)

db.defaults({ bots: {}, cache: { callback_data: {} } }).write()

export const setCallbackData = (data: string): string => {
    const id = utils.genId('C')
    db.set(['cache', 'callback_data', id], data).write()
    return id
}

export const getCallbackData = (id: string): string => {
    return db.get(['cache', 'callback_data', id]).value()
}

export const delCallbackData = (id: string): void => {
    db.unset(['cache', 'callback_data', id]).write()
}

export const setBotUserId = (botId: string, botUserId: number) => {
    db.get(['bots', botId])
        .assign({ user_id: botUserId })
        .write()
}

export const getBotUserId = (botId: string): number => {
    return db.get(['bots', botId, 'user_id']).value()
}

export const setApplicationUserData = (
    botId: string,
    application: string,
    chatId: number,
    userId: number,
    data: object | null
): string | 'removed' => {
    const _appPath = ['bots', botId, 'applications', application, 'userData']
    // const _appPath = ['bots', botId, application]
    if (db.get(_appPath).value() === undefined && data !== null) {
        db.set(_appPath, []).write()
    }
    let _data = db
        .get(_appPath)
        .find({ chat_id: chatId, user_id: userId })
        .value()
    if (_data !== undefined) {
        if (data === null) {
            db.get(_appPath)
                .remove({ id: _data.id })
                .write()
            return 'removed'
        } else {
            db.get(_appPath)
                .find({ id: _data.id })
                .assign({ data: data })
                .write()
            return _data.id
        }
    } else {
        if (data === null) return 'removed'
        const _id = utils.genId('D')
        db.get(_appPath)
            .push({
                id: _id,
                chat_id: chatId,
                user_id: userId,
                data: data,
            })
            .write()
        return _id
    }
}

export const getApplicationUserData = (
    botId: string,
    application: string,
    chatId: number,
    userId: number
): types.applicationUserData[] => {
    const _appPath = ['bots', botId, 'applications', application, 'userData']
    return db
        .get(_appPath)
        .filter({ chat_id: chatId, user_id: userId })
        .value()
}

export const setApplicationDataByPath = (
    botId: string,
    application: string,
    chatId: number,
    userId: number,
    dataPath: [string] | [],
    value: any
) => {
    let _data = getApplicationUserData(botId, application, chatId, userId)
    if (_data !== undefined) {
        setApplicationUserData(
            botId,
            application,
            chatId,
            userId,
            _.set(_data, _.concat('data', dataPath), value)
        )
    }
}
