import { getApplication, applicationDataMan } from './types'
import { CTR } from './ctr'
import { Message } from './telegram'
import * as types from './types'
import { botMgr } from './main'
import { ApplicationDataMan } from './application'

export const cmdMatch = (input: string): string[] | null => {
    const regex = new RegExp(
        `(^\\/([\\w|_|\\-|\\.]{1,})(?=$|\\s))|([^\\s]{1,})`,
        'g'
    )
    let result = regex.exec(input)
    /**
     * result [0] -> input
     * result [1] -> group_1 \/cmd\s
     * result [2] -> group_2 cmd
     * result [3] -> group_3 args
     */
    let args = []
    args.push(result ? result[2] : undefined)
    if (args[0] !== undefined) {
        while ((result = regex.exec(input)) !== null) args.push(result[3])
        return args
    } else {
        return null
    }
}

export const parseCommand = (
    input: string
): {
    matched: boolean
    args: string[]
    botMentioned: string
} => {
    const regex = new RegExp(
        /((^\/([\w|_|\-|\.]{1,})\@([a-z|0-9|\_]{1,}\_bot))|(^\/([\w|_|\-|\.]{1,}))(?=$|\s))|([\S]{1,})/g
    )
    const res = {
        matched: false,
        args: [],
        botMentioned: undefined,
    }
    let _exec: RegExpExecArray
    while ((_exec = regex.exec(input)) !== null) {
        if (res.args.length === 0 && typeof _exec[1] === 'undefined') break
        res.botMentioned = _exec[4] || res.botMentioned
        res.args.push(_exec[3] || _exec[6] || _exec[7])
    }
    res.matched = res.args.length !== 0
    return res
}

export const argumentCheck = async (
    args: string[],
    checker: ArgumentCheck[]
): Promise<any[]> => {
    let _args = [...args]
    for (const i of Array(checker.length).keys()) {
        const indexFixed = i + 1
        let _arg: any = _args[indexFixed]
        if (_arg === undefined) {
            const _defaultValue = checker[i].default_value
            if (_defaultValue === undefined) {
                // const err: ERR = {
                // error_type: BotUtilsError.ArgumentUndefined,
                // }
                // TODO: error adv
                throw new TypeError(
                    `Required argument (args[${indexFixed}]) do not exist.`
                )
            } else {
                _arg = _defaultValue
            }
        } else {
            const _type = checker[i].type
            if (_type === 'string') {
                // pass
            } else if (_type === 'integer') {
                _arg = parseInt(Number(_arg).toString())
                _arg = isNaN(_arg) ? undefined : _arg
            } else if (_type === 'float') {
                _arg = parseFloat(Number(_arg).toString())
                _arg = isNaN(_arg) ? undefined : _arg
            } else if (_type === 'boolean') {
                _arg = _arg.toLowerCase()
                if (_arg === 'true') {
                    _arg = true
                } else if (_arg === 'false') {
                    _arg = false
                } else {
                    _arg = undefined
                }
            } else {
                _arg = undefined
            }
            if (typeof _arg === 'undefined')
                throw new TypeError(
                    `Cannot parse given argument (args[${indexFixed}]="${args[indexFixed]}") to the type required.`
                )
            const _range = checker[i].range
            if (_range !== undefined) {
                if (_range === 'function') {
                    if (!(await checker[i].range_function(_arg)))
                        throw new RangeError()
                } else if (_range.length !== 0) {
                    if (_range.indexOf(_arg) === -1)
                        throw new RangeError(
                            `Given argument (args[${indexFixed}]="${args[indexFixed]}") out of range.`
                        )
                }
            }
        }
        _args[indexFixed] = _arg
    }
    return _args
}

export class CommandMgr extends CTR<Command> {
    idField = 'cmd'
    itemType = 'Command'
    private botName: string

    constructor(botName: string) {
        super(Command)
        this.botName = botName
    }

    add(
        commandString: string,
        execFunc: CommandExecuteFunction,
        options: CommandOptions = {}
    ) {
        return super.add(commandString, execFunc, options, this.botName)
    }
    check = (msg: Message): void => {
        const cmdInfo = parseCommand(msg.text || msg.caption)
        if (!cmdInfo.matched) return
        if (cmdInfo.botMentioned && cmdInfo.botMentioned !== this.botName)
            return
        const cmd = this.get(cmdInfo.args[0])
        if (typeof cmd === 'undefined') return
        if (
            !botMgr
                .get(this.botName)
                .application.get(cmd.dataSpace.application_name)
                .isValidForChat(msg.chat)
        ) {
            return
        }
        const dataMan = cmd.dataMan(msg)
        if (!cmd.messageFilter(msg)) return
        cmd.exec(cmdInfo.args, msg, dataMan)
        return
    }
}

type ArgumentCheck = {
    type: 'string' | 'integer' | 'float' | 'boolean'
    default_value?: string | number | boolean
    range?: any[] | 'function'
    range_function?: (arg: any) => Promise<boolean> | Promise<Error>
}

type CommandFilter = 'public' | 'registered' | 'owner' | 'function'

type CommandExecuteFunction = (
    args: string[],
    message: Message,
    data: applicationDataMan
) => void

export interface CommandOptions {
    application_name?: string
    argument_check?: ArgumentCheck[]
    argument_error_function?: (msg: Message, err: Error) => any
    link_chat_free?: boolean
    link_user_free?: boolean
    filter?: CommandFilter
    filter_function?: (msg: Message) => Promise<boolean>
    description?: string
}

const defaultCommandOptions: Required<CommandOptions> = {
    application_name: types.appGlobal,
    argument_check: [],
    argument_error_function: () => {},
    link_chat_free: false,
    link_user_free: false,
    filter: 'owner',
    filter_function: async () => true,
    description: 'undefined',
}

class Command {
    private readonly botName: string
    private readonly _command: string
    private readonly _execFunction: CommandExecuteFunction
    private readonly _applicationName: string
    private readonly _argumentCheck: ArgumentCheck[]
    private readonly _argumentErrorFunction: (msg: Message, err: Error) => any
    private readonly _linkChatFree: boolean
    private readonly _linkUserFree: boolean
    private _filter: CommandFilter
    private _filterFunction: (msg: Message) => Promise<boolean>
    private _description?: string

    constructor(
        commandString: string,
        execFunc: CommandExecuteFunction,
        options: CommandOptions = {},
        botName: string
    ) {
        this.botName = botName
        const _options = botMgr
            .get(this.botName)
            .getDefaultOptions<CommandOptions>(defaultCommandOptions, options)
        this._command = commandString
        this._execFunction = execFunc
        this._applicationName = _options.application_name
        this._argumentCheck = _options.argument_check
        this._argumentErrorFunction = _options.argument_error_function
        this._linkChatFree = _options.link_chat_free || false
        this._linkUserFree = _options.link_user_free || false
        this._filter = _options.filter
        this._filterFunction = _options.filter_function
        this._description = _options.description
    }

    private get CTR(): CommandMgr {
        return botMgr.get(this.botName).command
    }
    get cmd(): string {
        return this._command
    }
    get dataSpace(): types.DataSpace {
        return {
            application_name: this._applicationName,
            link_chat_free: this._linkChatFree,
            link_user_free: this._linkUserFree,
        }
    }
    get filter(): string {
        return this._filter
    }
    get description(): string {
        return this._description
    }

    dataMan = (msg: Message): ApplicationDataMan => {
        return botMgr
            .get(this.botName)
            .application.get(this._applicationName)
            .dataMan({
                chat_id: this._linkChatFree ? undefined : msg.chat.id,
                user_id: this._linkUserFree ? undefined : msg.from.id,
            })
    }
    messageFilter = async (msg: Message): Promise<boolean> => {
        if (this._filter === 'public') {
            return true
        }
        if (this._filter === 'registered') {
            const _data = this.dataMan(msg).data
            return Object.keys(_data).length !== 0
        }
        if (this._filter === 'owner') {
            return (
                msg.from.id === botMgr.get(this.botName).owner.id ||
                msg.from.username === botMgr.get(this.botName).owner.username
            )
        }
        if (this._filter === 'function') {
            return await this._filterFunction(msg)
        }
        return false
    }
    exec = (
        ...args: Parameters<CommandExecuteFunction>
    ): ReturnType<CommandExecuteFunction> => {
        return this._execFunction(...args)
    }
}
