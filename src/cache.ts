import * as fs from 'fs'
import * as path from 'path'
import * as _ from 'lodash'
import * as low from 'lowdb'
import * as FileSync from 'lowdb/adapters/FileSync'

import * as utils from './utils'

import { RecSTO } from './record'
import { ApplicationChatBindSTO, DataSpace } from './application'

const DATA_DIR = './data'

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

const parseDBPath = (path: string[]) => {
    return path
        .map((p) => {
            if (!Number.isNaN(parseInt(p))) {
                p = `_${p}`
            }
            return p
        })
        .join('.')
}

const get = (path: string[]) => {
    return db.get(parseDBPath(path))
}

const set = (path: string[], data?: any) => {
    if (typeof data === 'undefined') {
        return db.unset(parseDBPath(path))
    }
    return db.set(parseDBPath(path), data)
}

export const setCallbackData = (
    botId: string,
    id: string,
    data: string | null
): void => {
    if (data === null) {
        set(['bots', botId, 'callback_data', id]).write()
    } else {
        set(['bots', botId, 'callback_data', id], data).write()
    }
}

export const getCallbackData = (botId: string, id: string): string => {
    return get(['bots', botId, 'callback_data', id]).value()
}

export const removeCallbackDataByGroup = (botId: string, group: string) => {
    db.update(['bots', botId, 'callback_data'], (datas) => {
        for (const _id of Object.keys(datas)) {
            if (_id.lastIndexOf(group) !== -1) {
                datas[_id] = undefined
            }
        }
        return datas
    }).write()
}

export function getRecords<I>(
    botName: string,
    recordType: string
): RecSTO<I>[] {
    const _recs = get(['bots', botName, recordType]).value()
    if (!_recs) return []
    return Object.keys(_recs).map((id) => {
        const _info = JSON.parse(_recs[id])
        return {
            id: id,
            session: _info['session'],
            recordOf: _info['recordOf'],
            info: _info['info'],
        }
    })
}

export function getRecord<I>(
    botName: string,
    recordType: string,
    recId: string
): RecSTO<I> {
    const _info = get(['bots', botName, recordType, recId]).value()[0]
    return JSON.parse({ ..._info, id: recId })
}

export function setReocrd<I>(
    botName: string,
    recordType: string,
    recId: string,
    rec?: RecSTO<I>
): void {
    const _data =
        typeof rec === 'undefined'
            ? undefined
            : JSON.stringify({
                  session: rec.session,
                  recordOf: rec.recordOf,
                  info: rec.info,
              })
    set(['bots', botName, recordType, recId], _data).write()
}

export const initApplication = (botId: string, applicationName: string) => {
    const binds = getApplicationChatBinds(botId, applicationName)
    if (binds === undefined) setApplicationChatBinds(botId, applicationName, [])
}

export const setApplicationChatBinds = (
    botId: string,
    applicationName: string,
    binds: ApplicationChatBindSTO[]
): void => {
    const _bindsPath = ['bots', botId, 'applications', applicationName, 'binds']
    set(_bindsPath, binds).write()
    return
}

export const getApplicationChatBinds = (
    botId: string,
    applicationName: string
): ApplicationChatBindSTO[] => {
    const _bindsPath = ['bots', botId, 'applications', applicationName, 'binds']
    return get(_bindsPath).value()
}

type ApplicationDataSTO = {
    id: string
    chat_id: number
    user_id: number
    data: object
}

export const getUserData = (
    botId: string,
    application: string,
    link: Required<DataSpace>
): object => {
    const _appPath = ['bots', botId, 'applications', application, 'userData']
    const _res = db
        .get(_appPath)
        .filter({ chat_id: link.chat_id, user_id: link.user_id })
        .value()
    if (_res.length > 0) {
        const _data = _res[0] as ApplicationDataSTO
        return _data.data
    } else {
        return {}
    }
}

export const setUserData = (
    botId: string,
    application: string,
    data: object | null = null,
    link: Required<DataSpace>
): string | 'removed' => {
    const _appPath = ['bots', botId, 'applications', application, 'userData']
    if (get(_appPath).value() === undefined && data !== null) {
        set(_appPath, []).write()
    }
    let _data = db
        .get(_appPath)
        .find({ chat_id: link.chat_id, user_id: link.user_id })
        .value()
    if (_data !== undefined) {
        if (data === null) {
            get(_appPath).remove({ id: _data.id }).write()
            return 'removed'
        } else {
            get(_appPath).find({ id: _data.id }).assign({ data: data }).write()
            return _data.id
        }
    } else {
        if (data === null) return 'removed'
        const _id = utils.genId('D')
        const _sto: Required<ApplicationDataSTO> = {
            id: _id,
            chat_id: link.chat_id,
            user_id: link.user_id,
            data: data,
        }
        get(_appPath).push(_sto).write()
        return _id
    }
}
