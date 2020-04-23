import { EventEmitter } from 'events'

import * as NodeTGBotAPI from 'node-telegram-bot-api'

interface NodeTGBotAPIConstructor {
    new (token: string, options?: NodeTGBotAPI.ConstructorOptions): NodeTGBotAPI
}

import { CTR, AnyCtor } from './ctr'
import { Message, CallbackQuery } from './telegram'

export class BotMgr extends CTR<BotUtils, BotUtilsConstructor> {
    constructor() {
        super(BotUtils, 'Bot', 'name')
    }

    add(name: string, options: BotOptions = {}) {
        const botUtils = super.add(name, options)
        botUtils._init()
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
    new (botName: string, options?: BotOptions): BotUtils
}

type BotOptions = {
    owner?: string | number
    expireDelay?: number
    api?: {
        token: string
        options: NodeTGBotAPI.ConstructorOptions
    }
}

const defaultBotOptions = {
    owner: undefined,
    expireDelay: Infinity,
    api: {},
} as Required<BotOptions>

export class BotUtils {
    private _botName: string
    private _owner: Owner
    private _expireDelay: number
    private _event: EventEmitter
    private _applications: ApplicationMgr
    private _commands: CommandMgr
    private _messageActions: MessageActionMgr
    private _tasks: TaskMgr
    private _inlineKYBDUtils: InlineKYBDUtils
    private _groupUtils: GroupUtils
    private _botAPI?: NodeTGBotAPI
    private _APIToken?: string
    private _APIOptions?: NodeTGBotAPI.ConstructorOptions

    constructor(...P: ConstructorParameters<BotUtilsConstructor>)
    constructor(botName: string, options?: BotOptions) {
        this._botName = botName
        this._owner = {} as Owner
        const _options = this.getDefaultOptions<BotOptions>(
            defaultBotOptions,
            options
        )
        this._expireDelay = _options.expireDelay
        this._event = new EventEmitter()
        if (typeof _options.owner === 'string') {
            this._owner.username = _options.owner
        } else if (typeof _options.owner === 'number') {
            this._owner.id = _options.owner
        }
        this._APIToken = _options.api.token
        this._APIOptions = _options.api.options
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
    get inlineKYBD(): InlineKYBDUtils {
        return this._inlineKYBDUtils
    }
    get api(): NodeTGBotAPI {
        return this._botAPI
    }

    _init() {
        this._applications = new ApplicationMgr(this._botName)
        this._commands = new CommandMgr(this._botName)
        this._messageActions = new MessageActionMgr(this._botName)
        this._tasks = new TaskMgr(this._botName)
        this._inlineKYBDUtils = new InlineKYBDUtils(this._botName)
        this._groupUtils = new GroupUtils(this._botName)
        this._botAPI = this._initAPI(this._APIToken, this._APIOptions)
    }
    private _initAPI(
        token: string,
        options?: NodeTGBotAPI.ConstructorOptions
    ): NodeTGBotAPI {
        const _ctor = MAIN.options.botAPIConstructor as NodeTGBotAPIConstructor
        if (this._APIToken) {
            try {
                return (this._botAPI = new _ctor(token, options))
            } catch (e) {
                // e.code == 'MODULE_NOT_FOUND'
            }
        }
        return undefined
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
                await this._commands.checkMessage(message)
            }
            this._groupUtils.listener(message)
        } catch (err) {
            this._onError(err)
        }
    }
    onCallbackQuery(callbackQuery: CallbackQuery): void {
        try {
            this._inlineKYBDUtils.checkCallbackQuery(callbackQuery)
        } catch (err) {
            this._onError(err)
        }
    }
    private _onError(err: Error): void {
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
        return MAIN.bots.get(this._botName)
    }
}

import * as MAIN from './main'

import { ApplicationMgr } from './application'
import { CommandMgr } from './command'
import { GroupUtils } from './group'
import { TaskMgr } from './task'
import { MessageActionMgr } from './messageAction'
import { InlineKYBDUtils } from './keyboardUtils'
