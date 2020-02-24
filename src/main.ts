import * as _ from 'lodash'

import * as cache from './cache'
import * as utils from './utils'
import * as types from './types'
import * as tgTypes from './tgTypes'
import { cmdMatch } from './command'

export class botUtils {
    private _botId: string
    private _ownerId: number
    private _applications: types.Application[]
    private _commands: types.Command[]
    constructor(botId: string | number, ownerId: number = -1) {
        this._commands = [] as types.Command[]
        this._applications = [] as types.Application[]
        this._pasCmdMsgListener = [] as types.PasCmdMsgListener[]
        this._timers = {} as types.Timers
        this._botId = `${botId}`
        this._ownerId = ownerId
        this.addApplication('_global', 0, false)
    }
    public addCommand = (
        commandStr: string,
        command_function: (
            args: string[],
            msg: tgTypes.Message,
            data: { get: () => object; set: (data: object) => any }
        ) => any,
        options: types.CommandInput = defaultCmdOptions
    ) => {
        if (
            _.filter(this._commands, {
                command_string: commandStr,
                application: options.application,
            }).length === 0
        ) {
            this._commands.push({
                command_string: commandStr,
                command_function: command_function,
                application: options.application,
                filter: options.filter,
                filter_function: options.filterFunction,
                description: options.description,
            })
        } else {
            // TODO:
        }
    }
    public removeCommand = (
        commandStr: string,
        application: string = '_global'
    ) => {
        _.remove(this._commands, c => {
            return (
                c.command_string === commandStr && c.application === application
            )
        })
    }
    public getCommands = (): { [appName: string]: types.CommandInfo[] } => {
        let cmds = {} as { [appName: string]: types.CommandInfo[] }
        for (const c of this._commands) {
            const app = c.application
            if (!_.hasIn(cmds, app)) cmds[app] = [] as types.CommandInfo[]
            cmds[app].push({
                command_string: c.command_string,
                application: c.application,
                filter: c.filter,
                description: c.description,
            })
        }
        return cmds
    }
    public addApplication = (
        appName: string,
        priority: number,
        finalApp: boolean
    ) => {
        this._applications.push({
            name: appName,
            priority: priority,
            final_app: finalApp,
        })
    }

    public addListener = (
        chatId: number,
        userId: number,
        application: string | '_global',
        listener: () => void,
        options: {
            availableCount: number
        } = {
            availableCount: Infinity,
        }
    ) => void {}

    public setUserData = (
        chatId: number,
        userId: number,
        application: string = '_global',
        data: object
    ): void => {
        cache.setApplicationData(this._botId, application, chatId, userId, data)
    }
    public getUserData = (
        chatId: number,
        userId: number,
        application: string = '_global'
    ): object => {
        return cache.getApplicationData(
            this._botId,
            application,
            chatId,
            userId
        )[0]['data']
    }
    private _pasCmdMsgListener: types.PasCmdMsgListener[]
    public addForceInput = (
        chatId: number,
        userId: number,
        verifyFunc: (chatId: number, userId: number) => boolean,
        errMsg?: (availableCount: number | types.Infinity) => string,
        errMsgReply: boolean = false,
        availableCnt: number = Infinity
    ): void => {
        if (
            _.findIndex(this._pasCmdMsgListener, {
                chat_id: chatId,
                user_id: userId,
            }) !== -1
        )
            return
        this._pasCmdMsgListener.push({
            chat_id: chatId,
            user_id: userId,
            verify_function: verifyFunc,
            error_message: errMsg,
            error_message_reply: errMsgReply,
            available_count: availableCnt,
            // renew func
        })
    }
    public removeForceInput = (chatId: number, userId: number): void => {
        const _index = _.findIndex(this._pasCmdMsgListener, {
            chat_id: chatId,
            user_id: userId,
        })
        if (_index !== -1) this._pasCmdMsgListener.splice(_index, 1)
    }
    private _timers: types.Timers
    public addTimer = (
        action: () => any,
        timeout,
        description: string = 'undefined'
    ): string => {
        const id = utils.genId('T')
        this._timers[id] = {
            action: description,
            start_timestamp: Date.now(),
        }

        setTimeout(() => {
            if (this._timers[id]) {
                action()
                this.removeTimer(id)
            }
        }, timeout)
        return id
    }
    public removeTimer = (id: string): void => {
        _.unset(this._timers, id)
    }
    public onMessage = (msg: tgTypes.Message) => {
        // check pasCmdMsgListener
        this.checkCommand(msg)
    }

    private checkCommand = (msg: tgTypes.Message): void => {
        const args = cmdMatch(msg.text)
        if (msg.text && args !== null) {
            for (const app of _.sortBy(this._applications, ['priority'])) {
                for (const cmd of _.filter(this._commands, {
                    application: app.name,
                })) {
                    if (args[0] === cmd.command_string) {
                        switch (cmd.filter) {
                            case 'public':
                                break
                            case 'registered':
                                if (
                                    !cache.getApplicationData(
                                        this._botId,
                                        app.name,
                                        getChatId(msg),
                                        getUserId(msg)
                                    )
                                ) {
                                    return
                                }
                                break
                            case 'owner':
                                if (getUserId(msg) !== this._ownerId) {
                                    return
                                }
                                break
                            case 'function':
                                if (!cmd.filter_function(msg)) {
                                    return
                                }
                                break
                            default:
                                return
                        }
                        const that = this
                        const userData = {
                            get(path?: string[]) {
                                const _data = that.getUserData(
                                    getChatId(msg),
                                    getUserId(msg),
                                    app.name
                                )
                                if (path) {
                                    return _.get(_data, path)
                                } else {
                                    return _data
                                }
                            },
                            set(value, path?: string[]) {
                                let _data = value
                                if (path) {
                                    _data = that.getUserData(
                                        getChatId(msg),
                                        getUserId(msg),
                                        app.name
                                    )
                                    _data = _.set(_data, path, value)
                                }
                                return that.setUserData(
                                    getChatId(msg),
                                    getUserId(msg),
                                    app.name,
                                    _data
                                )
                            },
                        }
                        cmd.command_function(args, msg, userData)
                        return
                    }
                }
            }
        }
        return null
    }
    private checkApplication = (msg: tgTypes.Message) => {}
}

export const getUserId = (msg: tgTypes.Message): number => {
    if (msg.from) {
        return msg.from.id
    }
}
export const getChatId = (msg: tgTypes.Message): number => {
    if (msg.chat) {
        return msg.chat.id
    }
}
export const getMessageId = (msg: tgTypes.Message): number => {
    return msg.message_id
}

export const defaultCmdOptions = {
    application: '_global',
    filter: 'owner',
    filterFunction: () => true,
    description: 'undefined',
} as types.CommandInput
