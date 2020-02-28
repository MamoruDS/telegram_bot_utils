import * as _ from 'lodash'

import * as cache from './cache'
import * as utils from './utils'
import * as types from './types'
import * as telegram from './telegram'
import * as group from './group'
import { cmdMatch } from './command'
import * as defaults from './defaults'

export class botUtils {
    private _botId: string
    private _ownerId: number
    private _applications: types.Application[]
    private _commands: types.Command[]
    private _inputListeners: types.inputListener[]
    constructor(botId: string | number, ownerId: number = -1) {
        this._commands = [] as types.Command[]
        this._applications = [] as types.Application[]
        this._pasCmdMsgListener = [] as types.PasCmdMsgListener[]
        this._timers = {} as types.Timers
        this._inputListeners = [] as types.inputListener[]
        this._botId = `${botId}`
        this._ownerId = ownerId
        this.addApplication('_global', 0, false)
    }
    public setBotId = (userId: number) => {
        cache.setBotUserId(this._botId, userId)
    }
    public getBotId = (): number => {
        return cache.getBotUserId(this._botId)
    }
    public addInputListener = (
        chat: telegram.Chat,
        user: telegram.User,
        application: string | '_global',
        listener: (
            msg: telegram.Message,
            data: types.applicationDataMan
        ) => any,
        options?: types.inputListenerOptions
    ): void => {
        const _options = defaults.options_input_listener(options)
        const _listener = _.filter(this._inputListeners, {
            application: application,
            chat_id: chat.id,
            user_id: user.id,
        })
        const userData = this.userDataMan(chat.id, user.id, application)
        if (_listener.length === 0) {
            _options.init_function(chat, user, userData)
            this._inputListeners.push({
                id: utils.genId('L'),
                chat_id: chat.id,
                user_id: user.id,
                application: application,
                listener: listener,
                available_count: _options.available_count,
                pass_to_other_listener: _options.pass_to_other_listener,
                pass_to_command: _options.pass_to_command,
                init_function: _options.init_function,
                final_function: _options.final_function,
            })
        } else {
            // TODO:
        }
    }
    public addCommand = (
        commandStr: string,
        command_function: (
            args: string[],
            msg: telegram.Message,
            data: { get: () => object; set: (data: object) => any }
        ) => any,
        options?: types.CommandOptions
    ) => {
        const _options = defaults.options_command(options)
        if (
            _.filter(this._commands, {
                command_string: commandStr,
                application: _options.application,
            }).length === 0
        ) {
            this._commands.push({
                command_string: commandStr,
                command_function: command_function,
                application: _options.application,
                filter: _options.filter,
                filter_function: _options.filter_function,
                description: _options.description,
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
    public setUserData = (
        chatId: number,
        userId: number,
        application: string = '_global',
        data: object | null
    ): void => {
        cache.setApplicationUserData(
            this._botId,
            application,
            chatId,
            userId,
            data
        )
    }
    public getUserData = (
        chatId: number,
        userId: number,
        application: string = '_global'
    ): object | null => {
        const _data = cache.getApplicationUserData(
            this._botId,
            application,
            chatId,
            userId
        )
        if (_data.length !== 0) {
            return _data[0]['data']
        } else {
            return null
        }
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
    public onMessage = (msg: telegram.Message) => {
        const _listenerRes = this.checkInputListener(msg)
        if (_listenerRes.passToCommand) {
            this.checkCommand(msg)
        }
    }
    public checkInputListener = (
        msg: telegram.Message
    ): {
        passToCommand: boolean
    } => {
        let _res = {
            passToCommand: true,
        }
        const chatId = getChatId(msg)
        const userId = getUserId(msg)
        for (const app of _.sortBy(this._applications, ['priority'])) {
            const inputListener = _.filter(this._inputListeners, {
                application: app.name,
                chat_id: chatId,
                user_id: userId,
            })[0]
            if (inputListener === undefined) continue
            const id = inputListener.id
            const avaiableCnt = inputListener.available_count - 1
            const userData = this.userDataMan(chatId, userId, app.name)
            const res = inputListener.listener(msg, userData)
            let removeListener: boolean = false
            if (res) {
                removeListener = true
            } else {
                if (avaiableCnt < 1) {
                    inputListener.final_function(msg.chat, msg.from, userData)
                    // inputListener.final_function(chatId, userId, userData)
                    removeListener = true
                } else {
                    this._inputListeners = _.map(
                        this._inputListeners,
                        inputListener => {
                            if (inputListener.id === id) {
                                inputListener.available_count = avaiableCnt
                            }
                            return inputListener
                        }
                    )
                }
            }
            if (removeListener) {
                _.remove(this._inputListeners, inputListener => {
                    return inputListener.id === id
                })
            }
            if (!inputListener.pass_to_command) _res.passToCommand = false
            if (!inputListener.pass_to_other_listener) break
        }
        return _res
    }
    private checkCommand = (msg: telegram.Message): void => {
        const chatId = getChatId(msg)
        const userId = getUserId(msg)
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
                                    cache.getApplicationUserData(
                                        this._botId,
                                        app.name,
                                        chatId,
                                        userId
                                    ).length === 0
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
                        const userData = this.userDataMan(
                            chatId,
                            userId,
                            app.name
                        )
                        cmd.command_function(args, msg, userData)
                        return
                    }
                }
            }
        }
        return null
    }
    private checkApplication = (msg: telegram.Message) => {}
    public groupUtils = (
        toggleByBot: boolean = false,
        toggleBySelf: boolean = false
    ) => {
        const that = this
        return {
            joinListener(
                msg: telegram.Message,
                func: (msg: telegram.Message) => any
            ) {
                const newChatMembers = msg.new_chat_members
                    ? msg.new_chat_members
                    : []
                if (newChatMembers.length !== 0) {
                    const newChatMember = newChatMembers[0]
                    if (newChatMember.is_bot && !toggleByBot) return
                    if (newChatMember.id === that.getBotId() && !toggleBySelf)
                        return
                    func(msg)
                }
            },
            leftListener(
                msg: telegram.Message,
                func: (msg: telegram.Message) => any
            ) {
                const leftMember = msg.left_chat_member
                    ? msg.left_chat_member
                    : undefined
                if (leftMember) {
                    if (leftMember.is_bot && !toggleByBot) return
                    if (leftMember.id === that.getBotId() && !toggleBySelf)
                        return
                    func(msg)
                }
            },
        }
    }
    public userDataMan = (
        chatId,
        userId,
        applicationName = '_global'
    ): types.applicationDataMan => {
        const that = this
        return {
            get(path?: string[]) {
                const _data = that.getUserData(chatId, userId, applicationName)
                if (Array.isArray(path) && path.length !== 0) {
                    return _.get(_data, path)
                } else {
                    return _data
                }
            },
            set(value, path?: string[]) {
                let _data = value
                if (Array.isArray(path) && path.length !== 0) {
                    _data = that.getUserData(chatId, userId, applicationName)
                    if (_data === null) _data = {}
                    _data = _.set(_data, path, value)
                }
                return that.setUserData(chatId, userId, applicationName, _data)
            },
        }
    }
}

export const getUserId = (msg: telegram.Message): number => {
    if (msg.from) {
        return msg.from.id
    }
}

export const getChatId = (msg: telegram.Message): number => {
    if (msg.chat) {
        return msg.chat.id
    }
}

export const getMessageId = (msg: telegram.Message): number => {
    return msg.message_id
}

export const groupUtils = group
