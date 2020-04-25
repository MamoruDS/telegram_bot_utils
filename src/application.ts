import * as _ from 'lodash'

import { AnyCtor } from './ctr'
import { BotUtils, BotUtilCTR } from './bot'
import * as MAIN from './main'
import * as cache from './cache'
import { Chat, Message } from './telegram'

export type ApplicationChatBindSTO = {
    chat_id: number
    passive: boolean
}

class ApplicationChatBindMgr extends BotUtilCTR<ApplicationChatBind> {
    private _applicationName: string

    constructor(botName: string, applicationName: string) {
        super(ApplicationChatBind, 'ChatBind', 'chatId', botName)
        this._applicationName = applicationName
        this._event.addListener('init', this._read)
        this._event.addListener('add', this._write)
        this._event.addListener('edit', this._write)
        this._event.addListener('delete', this._write)
    }

    add(chatId: number, options: { passive: boolean } = { passive: false }) {
        return super.add(chatId, options, this._botName, this._applicationName)
    }
    private _read = () => {
        const binds = cache.getApplicationChatBinds(
            this._botName,
            this._applicationName
        )
        for (const bind of binds) {
            this.add(bind.chat_id, { passive: bind.passive })
        }
    }
    private _write = () => {
        const binds = this.map((bind) => {
            return {
                chat_id: bind.chatId,
                passive: bind.passive,
            }
        })
        cache.setApplicationChatBinds(
            this._botName,
            this._applicationName,
            binds
        )
    }
}

class ApplicationChatBind {
    private _botName: string
    private _applicationName: string
    // TODO: remove additional properties
    private readonly _chatId: number
    private _passive

    constructor(
        chatId: number,
        options: { passive: boolean },
        botName: string,
        applicationName: string
    ) {
        this._botName = botName
        this._applicationName = applicationName
        this._chatId = chatId
        this._passive = options.passive
    }

    private get _CTR(): ApplicationChatBindMgr {
        return MAIN.bots
            .get(this._botName)
            .application.get(this._applicationName).chatBind
    }
    get chatId(): number {
        return this._chatId
    }
    get passive(): boolean {
        return this._passive
    }
    set passive(toggle: boolean) {
        this._passive = toggle
        this._CTR.event.emit('edit')
    }
}

export type DataSpace = {
    chat_id?: number
    user_id?: number
}

export class ApplicationDataMan {
    private _id: string
    private _botName: string
    private _applicationName: string
    private _chatId: number | undefined
    private _userId: number | undefined

    constructor(
        botName: string,
        applicationName: string,
        dataSpace: DataSpace
    ) {
        this._botName = botName
        this._applicationName = applicationName
        this._chatId = dataSpace.chat_id
        this._userId = dataSpace.user_id
    }

    get application(): Application {
        return MAIN.bots
            .get(this._botName)
            .application.get(this._applicationName)
    }
    get dataSpace(): DataSpace {
        return {
            chat_id: this._chatId,
            user_id: this._userId,
        }
    }
    get data(): object {
        return this.application._getUserData(this.dataSpace)
    }
    set data(data: object | null) {
        this.application._setUserData(data, this.dataSpace)
    }

    get = (path?: string[]): any => {
        const _data = this.application._getUserData(this.dataSpace)
        return _.get(_data, path)
    }
    set = (data: object, path?: string[]): void => {
        let _data = data
        if (typeof path !== 'undefined') {
            _data = this.application._getUserData(this.dataSpace)
            _data = _.set(_data, path, data)
        }
        this.application._setUserData(_data, this.dataSpace)
    }
    clean = (): void => {
        this.set(null)
    }
}

type BasicOrderItem = {
    idFieldVal: string
}

export class ApplicationMgr extends BotUtilCTR<
    Application,
    ApplicationConstructor
> {
    constructor(botName: string) {
        super(Application, 'Application', 'name', botName)
        this.add('_global', {
            priority: 0,
            // final_app: false,
            is_group_need_bind: false,
            data_bind_with_chat: true,
            data_bind_with_user: true,
        })
    }

    get last(): Application {
        let app = { priority: -Infinity } as Application
        this.map((_app) => {
            app = app.priority <= _app.priority ? _app : app
        })
        return app
    }

    add(name: string, options: ApplicationOptions) {
        return super.add(name, options, this._botName)
    }
    _orderByPriority<O extends BasicOrderItem, CTRItemType>(
        itemArray: O[],
        itemCTR: AppBaseUtilCTR<CTRItemType>
    ): O[] {
        const that = this
        return _.orderBy(
            itemArray,
            [
                (items) => {
                    const appInfo = itemCTR.get(items.idFieldVal)[
                        'appInfo'
                    ] as ApplicationInfo
                    return that.get(appInfo.application_name).priority
                },
                ,
                (items) => {
                    const appInfo = itemCTR.get(items.idFieldVal)[
                        'appInfo'
                    ] as ApplicationInfo
                    return appInfo.sub_priority
                },
            ],
            ['asc', 'asc']
        )
    }
}

interface ApplicationOptions {
    priority?: number
    // final_app?: boolean
    is_group_need_bind?: boolean
    data_bind_with_chat?: boolean
    data_bind_with_user?: boolean
}

const defaultApplicationOptions = {
    priority: -Infinity,
    // final_app: false,
    is_group_need_bind: true,
    data_bind_with_chat: true,
    data_bind_with_user: true,
} as Required<ApplicationOptions>

export interface ApplicationConstructor {
    new (
        name: string,
        options: ApplicationOptions,
        botName: string
    ): Application
}

type ctor = ConstructorParameters<ApplicationConstructor>

export class Application {
    private readonly _botName: string
    private readonly _name: string
    private _priority: number
    // private _finalApp: boolean
    private readonly _isGroupNeedBind: boolean
    private readonly _dataBindWithChat: boolean
    private readonly _dataBindWithUser: boolean
    private _binds: ApplicationChatBindMgr

    constructor(...P: ConstructorParameters<ApplicationConstructor>) {
        const name = P[0]
        const options = P[1]
        const botName = P[2]
        this._botName = botName
        const _options = MAIN.bots
            .get(this._botName)
            .getDefaultOptions<ApplicationOptions>(
                defaultApplicationOptions,
                options
            )
        if (_options.priority === -Infinity) {
            try {
                _options.priority =
                    MAIN.bots.get(this._botName).application.last.priority + 1
            } catch (err) {
                //
                _options.priority = 0
            }
        }
        this._name = name
        this._priority = _options.priority
        // this._finalApp = _options.final_app
        this._isGroupNeedBind = _options.is_group_need_bind
        this._dataBindWithChat = _options.data_bind_with_chat
        this._dataBindWithUser = _options.data_bind_with_user
        cache.initApplication(this._botName, name)
        this._binds = new ApplicationChatBindMgr(this._botName, this._name)
    }

    private get _CTR(): ApplicationMgr {
        return MAIN.bots.get(this._botName).application
    }
    get name(): string {
        return this._name
    }
    get priority(): number {
        return this._priority
    }
    set priority(priority: number) {
        this._priority = priority
        this._CTR.event.emit('edit')
    }
    // get isFinalApp(): boolean {
    //     return this._finalApp
    // }
    // set isFinalApp(isFinalApp: boolean) {
    //     this._finalApp = isFinalApp
    //     this.CTR.event.emit('edit')
    // }
    get isGroupNeedBind(): boolean {
        return this._isGroupNeedBind
    }
    get dataBindWithChat(): boolean {
        return this._dataBindWithChat
    }
    get dataBindWithUser(): boolean {
        return this._dataBindWithUser
    }
    get chatBind(): ApplicationChatBindMgr {
        return this._binds
    }

    _isValidForChat(chat: Chat): boolean {
        if (chat.type === 'channel') {
            return false
        }
        if (this._isGroupNeedBind) {
            if (chat.type === 'group' || chat.type === 'supergroup') {
                const bind = this._binds.get(chat.id, false, false)
                if (typeof bind === 'undefined') {
                    return false
                }
                // TODO: passive mode handle
            }
        }
        return true
    }
    _getUserData(link: DataSpace = {}): object {
        const chatId = link.chat_id || PublicData
        const userId = link.user_id || PublicData
        return cache.getUserData(this._botName, this._name, {
            chat_id: chatId,
            user_id: userId,
        })
    }
    _setUserData(data: object | null, link: DataSpace = {}) {
        const chatId = link.chat_id || PublicData
        const userId = link.user_id || PublicData
        cache.setUserData(this._botName, this._name, data, {
            chat_id: chatId,
            user_id: userId,
        })
    }
    dataMan(dataSpace: DataSpace): ApplicationDataMan {
        return new ApplicationDataMan(this._botName, this._name, dataSpace)
    }
}

const DefaultApplication = '_global'
const PublicData = 0

export type ApplicationInfo = {
    application_name?: string
    data_space?: {
        bind_with_chat: boolean | undefined
        bind_with_user: boolean | undefined
    }
    sub_priority?: number
}

const DefaultApplicationInfo: Required<ApplicationInfo> = {
    application_name: DefaultApplication,
    data_space: {
        bind_with_chat: undefined,
        bind_with_user: undefined,
    },
    sub_priority: 0,
}

export class AppBaseUtilCTR<
    T,
    C extends AnyCtor<T> = AnyCtor<T>
> extends BotUtilCTR<T, C> {}

export class AppBaseUtilItem {
    protected readonly _botName: string
    protected _applicationInfo: ApplicationInfo

    constructor(appInfo: ApplicationInfo = {}, botName: string) {
        this._botName = botName
        this._applicationInfo = this._bot.getDefaultOptions<ApplicationInfo>(
            DefaultApplicationInfo,
            appInfo
        )
    }

    protected get _bot(): BotUtils {
        return MAIN.bots.get(this._botName)
    }
    protected get _app(): Application {
        return this._bot.application.get(this._applicationInfo.application_name)
    }
    get appInfo(): ApplicationInfo {
        return this._applicationInfo
    }
    get isAppBaseUtilItem(): true {
        return true
    }
    // TODO: is this necessary?

    dataMan(spaceInfo: Required<DataSpace> | Message): ApplicationDataMan {
        const _app = this._app
        const _appInfo = this._applicationInfo
        const _spaceInf = {
            chatId: 0,
            userId: 0,
        }
        if (Object.keys(spaceInfo).lastIndexOf('chat') !== -1) {
            const msg = { ...spaceInfo } as Message
            _spaceInf.chatId = msg.chat.id
            _spaceInf.userId = msg.from.id
        } else {
            spaceInfo = { ...spaceInfo } as Required<DataSpace>
            _spaceInf.chatId = spaceInfo.chat_id
            _spaceInf.userId = spaceInfo.user_id
        }
        const _bindWithChat: boolean =
            typeof _appInfo.data_space.bind_with_chat === 'boolean'
                ? _appInfo.data_space.bind_with_chat
                : _app.dataBindWithChat
        const _bindWithUser: boolean =
            typeof _appInfo.data_space.bind_with_user === 'boolean'
                ? _appInfo.data_space.bind_with_user
                : _app.dataBindWithUser
        return _app.dataMan({
            chat_id: _bindWithChat ? _spaceInf.chatId : undefined,
            user_id: _bindWithUser ? _spaceInf.userId : undefined,
        })
    }
}
