import * as fs from 'fs'
import * as path from 'path'
import * as _ from 'lodash'
import * as low from 'lowdb'
import * as FileSync from 'lowdb/adapters/FileSync'

import * as utils from './utils'

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

export const setApplicationData = (
    botId: string,
    application: string,
    chatId: number,
    userId: number,
    data: object | null
): string | 'removed' => {
    const _appPath = ['bots', botId, application]
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

export const getApplicationData = (
    botId: string,
    application: string,
    chatId: number,
    userId: number
): object | undefined => {
    const _appPath = ['bots', botId, application]
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
    let _data = getApplicationData(botId, application, chatId, userId)
    if (_data !== undefined) {
        setApplicationData(
            botId,
            application,
            chatId,
            userId,
            _.set(_data, _.concat('data', dataPath), value)
        )
    }
}
