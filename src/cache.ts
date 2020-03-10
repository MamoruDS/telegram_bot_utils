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

db.defaults({ bots: {} }).write()

export const setCallbackData = (
    botId: string,
    id: string,
    data: string | null
): void => {
    if (data === null) {
        db.unset(['bots', botId, 'callback_data', id]).write()
    } else {
        db.set(['bots', botId, 'callback_data', id], data).write()
    }
}

export const getCallbackData = (botId: string, id: string): string => {
    return db.get(['bots', botId, 'callback_data', id]).value()
}

export const removeCallbackDataByGroup = (botId: string, group: string) => {
    db.update(['bots', botId, 'callback_data'], datas => {
        for (const _id of Object.keys(datas)) {
            if (_id.lastIndexOf(group) !== -1) {
                datas[_id] = undefined
            }
        }
        return datas
    }).write()
}

export const getTaskRecords = (botId: string): types.TaskRecord[] => {
    const recs = []
    const _cachedRecs = db.get(['bots', botId, 'taskRecords']).value()
    if (!_cachedRecs) {
        db.set(['bots', botId, 'taskRecords'], {}).write()
    } else {
        _.mapKeys(db.get(['bots', botId, 'taskRecords']).value(), (v, k) => {
            recs.push(Object.assign({ id: k }, v))
        })
    }
    return recs
}

export const getTaskRecord = (
    botId: string,
    recId: string
): types.TaskRecord | null => {
    const rec = db.get(['bots', botId, 'taskRecords', recId]).value()
    if (rec) {
        return Object.assign({ id: recId }, rec)
    } else {
        return null
    }
}

export const setTaskRecord = (
    botId: string,
    taskRecord: types.TaskRecord
): void => {
    const id = taskRecord.id
    delete taskRecord.id
    db.get(['bots', botId, 'taskRecords', id], taskRecord).write()
    return
}

export const setBotUserId = (botId: string, botUserId: number) => {
    db.get(['bots', botId])
        .assign({ user_id: botUserId })
        .write()
}

export const getBotUserId = (botId: string): number => {
    return db.get(['bots', botId, 'user_id']).value()
}

export const initApplication = (botId: string, applicationName: string) => {
    const binds = getApplicationBinds(botId, applicationName)
    if (binds === undefined) setApplicationBinds(botId, applicationName, [])
}

export const setApplicationBinds = (
    botId: string,
    applicationName: string,
    binds: number[]
): number[] => {
    const _bindsPath = ['bots', botId, 'applications', applicationName, 'binds']
    db.set(_bindsPath, binds).write()
    return db.get(_bindsPath).value()
}

export const getApplicationBinds = (
    botId: string,
    applicationName: string
): number[] => {
    const _bindsPath = ['bots', botId, 'applications', applicationName, 'binds']
    return db.get(_bindsPath).value()
}

export const setApplicationUserData = (
    botId: string,
    application: string,
    data: object | null = null,
    link: types.dataLink
): string | 'removed' => {
    const _appPath = ['bots', botId, 'applications', application, 'userData']
    // const _appPath = ['bots', botId, application]
    if (db.get(_appPath).value() === undefined && data !== null) {
        db.set(_appPath, []).write()
    }
    let _data = db
        .get(_appPath)
        .find({ chat_id: link.chat_id, user_id: link.user_id })
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
                chat_id: link.chat_id,
                user_id: link.user_id,
                data: data,
            })
            .write()
        return _id
    }
}

export const getApplicationUserData = (
    botId: string,
    application: string,
    link: types.dataLink
): types.applicationUserData[] => {
    const _appPath = ['bots', botId, 'applications', application, 'userData']
    return db
        .get(_appPath)
        .filter({ chat_id: link.chat_id, user_id: link.user_id })
        .value()
}

export const setApplicationDataByPath = (
    botId: string,
    application: string,
    value: any,
    dataPath: [string] | [],
    link: types.dataLink
) => {
    let _data = getApplicationUserData(botId, application, {
        chat_id: link.chat_id,
        user_id: link.user_id,
    })
    if (_data !== undefined) {
        setApplicationUserData(
            botId,
            application,
            _.set(_data, _.concat('data', dataPath), value),
            { chat_id: link.chat_id, user_id: link.user_id }
        )
    }
}
