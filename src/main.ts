import * as _ from 'lodash'

import * as cache from './cache'
import * as utils from './utils'
import * as types from './types'
import * as telegram from './telegram'
import * as group from './group'
import * as keyboardUtils from './keyboardUtils'
import { cmdMatch, argumentCheck } from './command'
import * as defaults from './defaults'

export class BotUtils {
    private _botId: string
    private _ownerId: number
    private _applications: types.Application[]
    private _commands: types.Command[]
    private _inputListeners: types.inputListener[]
    // private _flushCachedCallbackData: boolean
    constructor(
        botId: string | number,
        ownerId: number = -1
        // options: {
        //     flushCallbackDataCache?: boolean
        // } = {}
    ) {
        this._commands = [] as types.Command[]
        this._applications = [] as types.Application[]
        this._timers = {} as types.Timers
        this._inputListeners = [] as types.inputListener[]
        this._botId = `${botId}`
        this._ownerId = ownerId
        this.addApplication('_global', 0, false)
        // if (options && options.flushCallbackDataCache){
        //     this._flushCachedCallbackData = true

        // }
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
        listener: (
            msg: telegram.Message,
            data: types.applicationDataMan
        ) => any,
        options?: types.inputListenerOptions
    ): void => {
        const _options = defaults.options_input_listener(options)
        const _listener = _.filter(this._inputListeners, {
            application_name: _options.application_name,
            chat_id: _options.link_chat_free ? types.linkFree : chat.id,
            user_id: _options.link_user_free ? types.linkFree : user.id,
        })
        const applicationData = this.applicationDataMan(
            _options.application_name,
            {
                chat_id: _options.link_chat_free ? types.linkFree : chat.id,
                user_id: _options.link_user_free ? types.linkFree : user.id,
            }
        )
        if (_listener.length === 0) {
            _options.init_function(chat, user, applicationData)
            this._inputListeners.push({
                id: utils.genId('L'),
                chat_id: chat.id,
                user_id: user.id,
                listener: listener,
                application_name: _options.application_name,
                link_chat_free: _options.link_chat_free,
                link_user_free: _options.link_user_free,
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
                application_name: _options.application_name,
            }).length === 0
        ) {
            this._commands.push({
                command_string: commandStr,
                command_function: command_function,
                application_name: _options.application_name,
                argument_check: _options.argument_check,
                argument_error_function: _options.argument_error_function,
                link_chat_free: _options.link_chat_free,
                link_user_free: _options.link_user_free,
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
        applicationName: string = '_global'
    ) => {
        _.remove(this._commands, c => {
            return (
                c.command_string === commandStr &&
                c.application_name === applicationName
            )
        })
    }
    public getCommands = (): { [appName: string]: types.CommandInfo[] } => {
        let cmds = {} as { [appName: string]: types.CommandInfo[] }
        for (const c of this._commands) {
            const appName = c.application_name
            if (!_.hasIn(cmds, appName))
                cmds[appName] = [] as types.CommandInfo[]
            cmds[appName].push({
                command_string: c.command_string,
                application_name: c.application_name,
                filter: c.filter,
                description: c.description,
            })
        }
        return cmds
    }
    public addApplication = (
        applicationName: string,
        priority: number,
        finalApp: boolean
    ): void => {
        this._applications.push({
            name: applicationName,
            priority: priority,
            final_app: finalApp,
        })
        cache.initApplication(this._botId, applicationName)
    }
    public setApplicationUserData = (
        applicationName: string = '_global',
        data: object | null,
        link: types.dataLinkLess = {}
    ): void => {
        const chatId = _.isUndefined(link.chat_id)
            ? types.linkFree
            : link.chat_id
        const userId = _.isUndefined(link.user_id)
            ? types.linkFree
            : link.user_id
        cache.setApplicationUserData(this._botId, applicationName, data, {
            chat_id: chatId,
            user_id: userId,
        })
    }
    public getApplicationUserData = (
        applicationName: string = '_global',
        link: types.dataLinkLess = {}
    ): object | null => {
        const chatId = _.isUndefined(link.chat_id)
            ? types.linkFree
            : link.chat_id
        const userId = _.isUndefined(link.user_id)
            ? types.linkFree
            : link.user_id
        const _data = cache.getApplicationUserData(
            this._botId,
            applicationName,
            {
                chat_id: chatId,
                user_id: userId,
            }
        )
        if (_data.length !== 0) {
            return _data[0]['data']
        } else {
            return null
        }
    }
    public setApplicationBind = (
        applicationName: string,
        chatId: number,
        unbind?: boolean
    ): number[] => {
        let _binds: number[] = cache.getApplicationBinds(
            this._botId,
            applicationName
        )
        if (unbind) {
            _.remove(_binds, bind => {
                return bind === chatId
            })
        } else {
            _binds = _.union(_binds, [chatId])
        }
        return cache.setApplicationBinds(this._botId, applicationName, _binds)
    }
    public getApplicationBinds = (applicationName: string): number[] => {
        return cache.getApplicationBinds(this._botId, applicationName)
    }
    private checkApplicationBind = (
        applicationName: string,
        chatId: number
    ): boolean => {
        if (applicationName === types.appGlobal) return true
        const _binds = this.getApplicationBinds(applicationName)
        return _binds.indexOf(chatId) === -1 ? false : true
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
            if (!this.checkApplicationBind(app.name, chatId)) continue
            const inputListener = _.filter(
                this._inputListeners,
                inputListener => {
                    return (
                        checkValue(chatId, inputListener['chat_id'], 0) &&
                        checkValue(userId, inputListener['user_id'], 0) &&
                        checkValue(app.name, inputListener['application'])
                    )
                }
            )[0]
            if (inputListener === undefined) continue
            const id = inputListener.id
            const avaiableCnt = inputListener.available_count - 1
            const applicationData = this.applicationDataMan(app.name, {
                chat_id: inputListener.link_chat_free ? types.linkFree : chatId,
                user_id: inputListener.link_user_free ? types.linkFree : userId,
            })
            const res = inputListener.listener(msg, applicationData)
            let removeListener: boolean = false
            if (res) {
                removeListener = true
            } else {
                if (avaiableCnt < 1) {
                    inputListener.final_function(
                        msg.chat,
                        msg.from,
                        applicationData
                    )
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
    private checkCommand = async (msg: telegram.Message): Promise<void> => {
        const chatId = getChatId(msg)
        const userId = getUserId(msg)
        const args = cmdMatch(msg.text)
        if (msg.text && args !== null) {
            for (const app of _.sortBy(this._applications, ['priority'])) {
                if (!this.checkApplicationBind(app.name, chatId)) continue
                for (const cmd of _.filter(this._commands, {
                    application_name: app.name,
                })) {
                    if (args[0] === cmd.command_string) {
                        const _args = await argumentCheck(
                            args,
                            cmd.argument_check
                        ).catch(err => {
                            cmd.argument_error_function(msg, err)
                            return []
                        })
                        if (_args.length === 0) return
                        switch (cmd.filter) {
                            case 'public':
                                break
                            case 'registered':
                                if (
                                    this.getApplicationUserData(app.name, {
                                        chat_id: chatId,
                                        user_id: userId,
                                    }) === null
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
                        const applicationData = this.applicationDataMan(
                            app.name,
                            {
                                chat_id: cmd.link_chat_free
                                    ? types.linkFree
                                    : chatId,
                                user_id: cmd.link_user_free
                                    ? types.linkFree
                                    : userId,
                            }
                        )
                        cmd.command_function(_args, msg, applicationData)
                        return
                    }
                }
            }
        }
        return null
    }
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
    public applicationDataMan = (
        applicationName: string | '_global',
        link: types.dataLinkLess = {}
    ): types.applicationDataMan => {
        const that = this
        return {
            get(path?: string[]) {
                const _data = that.getApplicationUserData(applicationName, link)
                if (Array.isArray(path) && path.length !== 0) {
                    return _.get(_data, path)
                } else {
                    return _data
                }
            },
            set(value, path?: string[]) {
                let _data = value
                if (Array.isArray(path) && path.length !== 0) {
                    _data = that.getApplicationUserData(applicationName, link)
                    if (_data === null) _data = {}
                    _data = _.set(_data, path, value)
                }
                return that.setApplicationUserData(applicationName, _data, link)
            },
        }
    }
    public genInlineKeyBoard = (
        buttons: types.inlineKeyboardButton[]
    ): telegram.InlineKeyboardButton[][] => {
        return keyboardUtils.genInlineKeyBoard(this._botId, buttons)
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

export const checkValue = (
    inputId: string | number,
    checkId: string | number,
    exception?: string | number
) => {
    return (
        inputId !== undefined &&
        checkId !== undefined &&
        (inputId === checkId || checkId === exception)
    )
}
