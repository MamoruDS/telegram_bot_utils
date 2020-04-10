import { EventEmitter } from 'events'

import { CTR, AnyCtor } from './ctr'
import { Message } from './telegram'

export class BotMgr extends CTR<BotUtils, BotUtilsConstructor> {
    constructor() {
        super(BotUtils, 'Bot', 'name')
    }

    add(name: string, owner?: number | string) {
        const botUtils = super.add(name, owner)
        botUtils.init()
        return botUtils
    }
}

type Owner = {
    id: number
    is_bot: boolean
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
}

interface BotUtilsConstructor {
    new (
        botName: string,
        owner?: string | number,
        expireDelay?: number,
        errReply?: boolean
    ): BotUtils
}

export class BotUtils {
    private _botName: string
    private _owner: Owner
    private _expireDelay: number
    private _errReply: boolean
    private _event: EventEmitter
    private _applications: ApplicationMgr
    private _commands: CommandMgr
    private _messageActions: MessageActionMgr
    private _tasks: TaskMgr
    private _groupUtils: GroupUtils

    constructor(...P: ConstructorParameters<BotUtilsConstructor>)
    constructor(
        botName: string,
        owner?: string | number,
        expireDelay?: number,
        errReply?: boolean
    ) {
        this._botName = botName
        this._owner = {} as Owner
        this._expireDelay = expireDelay || Infinity
        this._errReply = errReply || false
        this._event = new EventEmitter()
        if (typeof owner === 'string') {
            this._owner.username = owner
        } else if (typeof owner === 'number') {
            this._owner.id = owner
        }
    }

    get name(): string {
        return this._botName
    }
    get owner(): Owner {
        return this._owner
    }
    get expireDelay(): number {
        return this._expireDelay
    }
    get errReply(): boolean {
        return this._errReply
    }
    set errReply(bool: boolean) {
        this._errReply = bool
    }
    get event(): EventEmitter {
        return this._event
    }
    get app(): ApplicationMgr {
        return this._applications
    }
    get application(): ApplicationMgr {
        return this._applications
    }
    get cmd(): CommandMgr {
        return this._commands
    }
    get command(): CommandMgr {
        return this._commands
    }
    get messageAction(): MessageActionMgr {
        return this._messageActions
    }
    get groupUtils(): GroupUtils {
        return this._groupUtils
    }
    get task(): TaskMgr {
        return this._tasks
    }

    init() {
        this._applications = new ApplicationMgr(this._botName)
        this._commands = new CommandMgr(this._botName)
        this._messageActions = new MessageActionMgr(this._botName)

        this._tasks = new TaskMgr(this._botName)
        this._groupUtils = new GroupUtils(this._botName)
    }
    getDefaultOptions<O>(
        defaultOptions: Required<O>,
        inputOptions: O = {} as O
    ): Required<O> {
        const _options = { ...defaultOptions }
        if (
            typeof inputOptions !== 'object' ||
            inputOptions === null ||
            Array.isArray(inputOptions)
        ) {
            throw new TypeError('Input options expect an object to be entered')
        }
        for (const opt in _options) {
            _options[opt] =
                inputOptions[opt] !== undefined
                    ? inputOptions[opt]
                    : _options[opt]
        }
        return _options
    }
    private isMessageExpired(message: Message): boolean {
        const _delay = Math.floor(Date.now() / 1000) - message.date
        if (_delay > this._expireDelay) {
            return true
        } else {
            return false
        }
    }
    async onMessage(message: Message): Promise<void> {
        try {
            if (this.isMessageExpired(message)) return
            const _l = await this._messageActions.checkMessage(message)
            if (_l.passToCommand) {
                await this._commands.check(message)
            }
            this._groupUtils.listener(message)
        } catch (err) {
            this.onError(err)
        }
    }
    private onError(err: Error): void {
        if (this._event.listenerCount('error') === 0) {
            throw err
        } else {
            this._event.emit('error', err)
        }
    }
}

export class BotUtilCTR<T, C extends AnyCtor<T> = AnyCtor<T>> extends CTR<
    T,
    C
> {
    protected _botName: string

    constructor(
        newItem: C,
        itemType: string,
        idField: string,
        botName: string
    ) {
        super(newItem, itemType, idField)
        this._botName = botName
    }

    protected get _bot(): BotUtils {
        return botMgr.get(this._botName)
    }
}

import { botMgr } from './main'

import { ApplicationMgr } from './application'
import { CommandMgr } from './command'
import { GroupUtils } from './group'
import { TaskMgr } from './task'
import { MessageActionMgr } from './messageAction'
