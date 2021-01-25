import { EventEmitter } from 'events'

import * as NodeTGBotAPI from 'node-telegram-bot-api'

export interface NodeTGBotAPIConstructor {
    new (token: string, options?: NodeTGBotAPI.ConstructorOptions): NodeTGBotAPI
}

import { CTR, AnyCtor } from './ctr'
import { copy, compObjCopy, assignDefault } from './utils'
import { Message, CallbackQuery, User } from './telegram'

export class BotMgr extends CTR<BotUtils, BotUtilsConstructor> {
    constructor() {
        super(BotUtils, 'Bot', 'name')
    }

    add(name: string, options: BotOptions = {}) {
        const botUtils = super.add(name, options)
        botUtils._init()
        return botUtils
    }

    async addSafe(name: string, options: BotOptions = {}): Promise<BotUtils> {
        const _bot = this.add(name, options)
        return new Promise((resolve) => {
            _bot.event.on('ready', () => {
                resolve(_bot)
            })
        })
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

type BotInfo = {
    firstname: string
    username: string
    id: number
    name: string // use in sto
    can_join_groups: boolean
    can_read_all_group_messages: boolean
    supports_inline_queries: boolean
}

type BotOptions = {
    owner?: number
    expireDelay?: number
    api?: {
        token: string
        options?: NodeTGBotAPI.ConstructorOptions
    }
}

const defaultBotOptions = {
    owner: undefined,
    expireDelay: Infinity,
    api: {},
} as Required<BotOptions>

export class BotUtils {
    private _botInfo: BotInfo
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
    private _ready: boolean

    constructor(...P: ConstructorParameters<BotUtilsConstructor>)
    constructor(botName: string, options?: BotOptions) {
        this._botInfo = { name: botName, username: botName } as BotInfo
        this._owner = {} as Owner
        const _options = assignDefault(defaultBotOptions, options)
        this._expireDelay = _options.expireDelay
        this._event = new EventEmitter()
        this._owner.id = _options.owner
        this._APIToken = _options.api.token
        this._APIOptions = _options.api.options
        this._ready = false
    }

    get name(): string {
        return this._botInfo.name
    }
    get username(): string {
        return this._botInfo.username
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
    get ready(): boolean {
        return this._ready
    }

    async _init() {
        if (typeof this._applications != 'undefined') return // init lock
        this._applications = new ApplicationMgr(this._botInfo.name)
        this._commands = new CommandMgr(this._botInfo.name)
        this._messageActions = new MessageActionMgr(this._botInfo.name)
        this._tasks = new TaskMgr(this._botInfo.name)
        this._inlineKYBDUtils = new InlineKYBDUtils(this._botInfo.name)
        this._groupUtils = new GroupUtils(this._botInfo.name)
        this._botAPI = await this._initAPI(this._APIToken, this._APIOptions)
        this._addAPIListener()
        this._ready = true
        this._event.emit('ready')
    }
    private async _initAPI(
        token: string,
        options?: NodeTGBotAPI.ConstructorOptions
    ): Promise<NodeTGBotAPI> {
        const _ctor = MAIN.options.botAPIConstructor as NodeTGBotAPIConstructor
        if (this._APIToken) {
            if (typeof _ctor == 'undefined') {
                console.warn(
                    'API Module not found: \n' +
                        'Got API token in Bot constructor, but no API module exist. All built-in functions need API to work were disabled.'
                )
            } else {
                try {
                    const _api = new _ctor(token, options)
                    const _bot = await _api.getMe()
                    this._updateBotProfile(_bot)
                    return _api
                } catch (e) {
                    // e.code == 'MODULE_NOT_FOUND'
                }
            }
        }
        return undefined
    }
    private _updateBotProfile(bot: User): void {
        this._botInfo.id = bot.id
        this._botInfo.firstname = bot.first_name
        this._botInfo.username = bot.username
        this._botInfo.can_join_groups = bot.can_join_groups
        this._botInfo.can_read_all_group_messages =
            bot.can_read_all_group_messages
        this._botInfo.supports_inline_queries = bot.supports_inline_queries
    }
    private _addAPIListener(): void {
        if (typeof this._botAPI != 'undefined') {
            this._botAPI.addListener('message', (message) => {
                this.onMessage(compObjCopy<Message>(message))
            })
            this._botAPI.addListener('callback_query', (callbackQuery) => {
                this.onCallbackQuery(compObjCopy<CallbackQuery>(callbackQuery))
            })
            this._botAPI.addListener('polling_error', (err) => {
                this._onError(err)
            })
            this._botAPI.addListener('error', (err) => {
                this._onError(err)
            })
        }
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
            const _l = await this._messageActions._checkMessage(message)
            if (_l.passToCommand) {
                await this._commands._checkMessage(message)
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
