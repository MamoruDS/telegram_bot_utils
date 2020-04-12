import { Message } from './telegram'
import { botMgr } from './main'
import {
    ApplicationDataMan,
    ApplicationInfo,
    AppBaseUtilCTR,
    AppBaseUtilItem,
} from './application'

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
        const _type = checker[i].type
        if (_arg === undefined) {
            const _defaultValue = checker[i].default_value
            if (_defaultValue === undefined) {
                // const err: ERR = {
                // error_type: BotUtilsError.ArgumentUndefined,
                // }
                // TODO: error adv
                throw new TypeError(
                    `Except argument as ${_type} at position[${indexFixed}] does not exist.`
                )
            } else {
                _arg = _defaultValue
            }
        } else {
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
                    `Cannot parse given argument "${args[indexFixed]}" at position[${indexFixed}] to the type required (${_type}).`
                )
            const _range = checker[i].range
            if (_range !== undefined) {
                if (_range === 'function') {
                    if (!(await checker[i].range_function(_arg)))
                        throw new RangeError()
                } else if (_range.length !== 0) {
                    if (_range.indexOf(_arg) === -1)
                        throw new RangeError(
                            `Given argument "${args[indexFixed]}" at position[${indexFixed}] was out of range.`
                        )
                }
            }
        }
        _args[indexFixed] = _arg
    }
    return _args
}

export class CommandMgr extends AppBaseUtilCTR<Command, CommandConstructor> {
    constructor(botName: string) {
        super(Command, 'Command', 'cmd', botName)
    }

    add(
        commandString: string,
        execFunc: CommandExecuteFunction,
        options: CommandOptions = {},
        applicationInfo: ApplicationInfo
    ) {
        return super.add(
            commandString,
            execFunc,
            options,
            applicationInfo,
            this._botName
        )
    }
    async checkMessage(message: Message): Promise<void> {
        const cmdInfo = parseCommand(message.text || message.caption)
        if (!cmdInfo.matched) return
        if (cmdInfo.botMentioned && cmdInfo.botMentioned !== this._botName)
            return
        const cmd = this.get(cmdInfo.args[0])
        if (
            !this._bot.application
                .get(cmd.appInfo.application_name)
                .isValidForChat(message.chat)
        )
            return
        if (typeof cmd === 'undefined') return
        if (
            !botMgr
                .get(this._botName)
                .application.get(cmd.appInfo.application_name)
                .isValidForChat(message.chat)
        ) {
            return
        }
        const dataMan = cmd.dataMan(message)
        if (!cmd.messageFilter(message)) return
        try {
            const _args = await argumentCheck(cmdInfo.args, cmd.check)
            cmd.exec(_args, message, dataMan)
        } catch (e) {
            cmd.argumentErrorHandle(message, e)
        }
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
    data: ApplicationDataMan
) => void

export interface CommandOptions {
    argument_check?: ArgumentCheck[]
    argument_error_function?: (message: Message, err: Error) => any
    filter?: CommandFilter
    filter_function?: (message: Message) => Promise<boolean>
    description?: string
}

const defaultCommandOptions: Required<CommandOptions> = {
    argument_check: [],
    argument_error_function: (msg, err) => {
        throw err
    },
    filter: 'owner',
    filter_function: async () => true,
    description: 'undefined',
}

interface CommandConstructor {
    new (
        commandString: string,
        execFunc: CommandExecuteFunction,
        options: CommandOptions,
        appInfo: ApplicationInfo,
        botName: string
    ): Command
}

class Command extends AppBaseUtilItem {
    private readonly _command: string
    private readonly _execFunction: CommandExecuteFunction
    private readonly _argumentCheck: ArgumentCheck[]
    private readonly _argumentErrorFunction: (
        message: Message,
        err: Error
    ) => any
    private _filter: CommandFilter
    private _filterFunction: (message: Message) => Promise<boolean>
    private _description?: string

    constructor(...P: ConstructorParameters<CommandConstructor>)
    constructor(
        commandString: string,
        execFunc: CommandExecuteFunction,
        options: CommandOptions,
        appInfo: ApplicationInfo,
        botName: string
    ) {
        super(appInfo, botName)
        const _options = botMgr
            .get(this._botName)
            .getDefaultOptions<CommandOptions>(defaultCommandOptions, options)
        this._command = commandString
        this._execFunction = execFunc
        this._argumentCheck = _options.argument_check
        this._argumentErrorFunction = _options.argument_error_function
        this._filter = _options.filter
        this._filterFunction = _options.filter_function
        this._description = _options.description
    }

    private get CTR(): CommandMgr {
        return botMgr.get(this._botName).command
    }
    get cmd(): string {
        return this._command
    }
    get check(): ArgumentCheck[] {
        return this._argumentCheck
    }
    get filter(): string {
        return this._filter
    }
    get description(): string {
        return this._description
    }

    async messageFilter(message: Message): Promise<boolean> {
        if (this._filter === 'public') {
            return true
        }
        if (this._filter === 'registered') {
            const _data = this.dataMan(message).data
            return Object.keys(_data).length !== 0
        }
        if (this._filter === 'owner') {
            return (
                message.from.id === botMgr.get(this._botName).owner.id ||
                message.from.username ===
                    botMgr.get(this._botName).owner.username
            )
        }
        if (this._filter === 'function') {
            return await this._filterFunction(message)
        }
        return false
    }
    exec(
        ...args: Parameters<CommandExecuteFunction>
    ): ReturnType<CommandExecuteFunction> {
        return this._execFunction(...args)
    }
    argumentErrorHandle(message: Message, err: Error) {
        this._argumentErrorFunction(message, err)
    }
}
