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

db.defaults({ callback_data: {} }).write()

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
    chatId: string,
    userId: string,
    data: object
): string => {
    const id = utils.genId('D')
    if (db.get(['bots', botId, application]).value() === undefined) {
        db.set(['bots', botId, application], []).write()
    }
    db.set(['bots', botId, application], {
        id: id,
        chat_id: chatId,
        user_id: userId,
        data: data,
    }).write()
    return id
}

export const getApplicationData = (
    botId: string,
    application: string,
    chatId: string,
    userId: string
): object => {
    return db
        .get(['bots', botId, application])
        .filter({ chat_id: chatId, user_id: userId })
        .value()
}

export const setApplicationDataByPath = (
    botId: string,
    application: string,
    chatId: string,
    userId: string,
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
            _.set(_data, dataPath, value)
        )
    }
}
