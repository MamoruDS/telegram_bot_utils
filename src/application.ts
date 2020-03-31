import * as _ from 'lodash'

import { CTR } from './ctr'
import { botMgr } from './main'
import * as types from './types'
import * as cache from './cache'
import * as telegram from './telegram'

class ApplicationChatBindMgr extends CTR<ApplicationChatBind> {
    idField = 'chatId'
    private botName: string
    private applicationName: string

    constructor(botName: string, applicationName: string) {
        super(ApplicationChatBind)
        this.botName = botName
        this.applicationName = applicationName
        this._event.addListener('init', this.read)
        this._event.addListener('add', this.write)
        this._event.addListener('edit', this.write)
        this._event.addListener('delete', this.write)
    }

    add(chatId: number, options: { passive: boolean } = { passive: false }) {
        return super.add(chatId, options, this.botName, this.applicationName)
    }
    private read = () => {
        cache.getApplicationChatBinds(this.botName, this.applicationName)
    }
    private write = () => {
        const binds = this.map(bind => {
            return {
                chat_id: bind.chatId,
                passive: bind.passive,
            }
        })
        cache.setApplicationChatBinds(this.botName, this.applicationName, binds)
    }
}

class ApplicationChatBind {
    private botName: string
    private applicationName: string
    // TODO: remove additional properties
    private readonly _chatId: number
    private _passive

    constructor(
        chatId: number,
        options: { passive: boolean },
        botName,
        applicationName
    ) {
        this.botName = botName
        this.applicationName = applicationName
        this._chatId = chatId
        this._passive = options.passive
    }

    private get CTR(): ApplicationChatBindMgr {
        return botMgr.get(this.botName).application.get(this.applicationName)
            .bind
    }
    get chatId(): number {
        return this._chatId
    }
    get passive(): boolean {
        return this._passive
    }
    set passive(toggle: boolean) {
        this._passive = toggle
        this.CTR.event.emit('edit')
    }
}

export class ApplicationDataMan {
    private id: string
    private botName: string
    private applicationName: string
    private chatId?: number
    private userId?: number

    constructor(
        botName: string,
        applicationName: string,
        link: types.dataLink
    ) {
        this.botName = botName
        this.applicationName = applicationName
        this.chatId = link.chat_id
        this.userId = link.user_id
    }

    get application(): Application {
        return botMgr.get(this.botName).application.get(this.applicationName)
    }
    get link(): types.dataLink {
        return {
            chat_id: this.chatId,
            user_id: this.userId,
        }
    }
    get data(): object {
        return this.application.getUserData(this.link)
    }
    set data(data: object | null) {
        this.application.setUserData(data, this.link)
    }

    get = (path?: string[]): any => {
        const _data = this.application.getUserData(this.link)
        return _.get(_data, path)
    }
    set = (data: object, path?: string[]): void => {
        let _data = data
        if (typeof path !== 'undefined') {
            _data = this.application.getUserData(this.link)
            _data = _.set(_data, path, data)
        }
        this.application.setUserData(_data, this.link)
    }
    delete = (): void => {
        this.set(null)
    }
}

export class ApplicationMgr extends CTR<Application> {
    itemType = 'Application'
    private botName: string

    constructor(botName: string) {
        // super()
        super(Application)
        this.botName = botName
        this.add('_global', {
            priority: 0,
            final_app: false,
            is_group_need_bind: false,
            link_chat_free: false,
            link_user_free: false,
        })
    }

    get last(): Application {
        let app = { priority: -Infinity } as Application
        this.map(_app => {
            app = app.priority <= _app.priority ? _app : app
        })
        return app
    }

    add(name: string, options: ApplicationOptions) {
        return super.add(name, options)
    }
}

interface ApplicationOptions {
    priority?: number
    final_app?: boolean
    is_group_need_bind?: boolean
    link_chat_free?: boolean
    link_user_free?: boolean
}

const defaultApplicationOptions = {
    priority: -Infinity,
    final_app: false,
    is_group_need_bind: true,
    link_chat_free: false,
    link_user_free: false,
} as Required<ApplicationOptions>

export class Application {
    private readonly botName: string
    private readonly _name: string
    private _priority: number
    private _finalApp: boolean
    private readonly _isGroupNeedBind: boolean
    private readonly _linkChatFree: boolean
    private readonly _linkUserFree: boolean
    private _binds: ApplicationChatBindMgr

    constructor(name: string, options: ApplicationOptions, botName: string) {
        this.botName = botName
        // const _options = defaults.options_application(options)
        const _options = botMgr
            .get(this.botName)
            .getDefaultOptions<ApplicationOptions>(
                defaultApplicationOptions,
                options,
                false
            )
        if (_options.priority === -Infinity) {
            try {
                _options.priority =
                    botMgr.get(this.botName).application.last.priority + 1
            } catch (err) {
                //
                _options.priority = 0
            }
        }
        this._name = name
        this._priority = _options.priority
        this._finalApp = _options.final_app
        this._isGroupNeedBind = _options.is_group_need_bind
        this._linkChatFree = _options.link_chat_free
        this._linkUserFree = _options.link_user_free
        cache.initApplication(this.botName, name)
        this._binds = new ApplicationChatBindMgr(this.botName, this._name)
    }

    private get CTR(): ApplicationMgr {
        return botMgr.get(this.botName).application
    }
    get name(): string {
        return this._name
    }
    get priority(): number {
        return this._priority
    }
    set priority(priority: number) {
        this._priority = priority
        this.CTR.event.emit('edit')
    }
    get isFinalApp(): boolean {
        return this._finalApp
    }
    set isFinalApp(isFinalApp: boolean) {
        this._finalApp = isFinalApp
        this.CTR.event.emit('edit')
    }
    get isGroupNeedBind(): boolean {
        return this._isGroupNeedBind
    }
    get linkChatFree(): boolean {
        return this._linkChatFree
    }
    get linkUserFree(): boolean {
        return this._linkUserFree
    }
    get bind(): ApplicationChatBindMgr {
        return this._binds
    }

    isValidForChat = (chat: telegram.Chat): boolean => {
        if (chat.type === 'channel') {
            return false
        }
        if (this._isGroupNeedBind) {
            if (chat.type === 'group' || chat.type === 'supergroup') {
                const bind = this._binds.get(chat.id, false, false)
                if (typeof bind === undefined) {
                    return false
                }
                // TODO: passive mode handle
            }
        }
        return true
    }
    getUserData = (link: types.dataLink = {}): object => {
        const chatId = link.chat_id || 0
        const userId = link.user_id || 0
        return cache.getUserData(this.botName, this._name, {
            chat_id: chatId,
            user_id: userId,
        })
    }
    setUserData = (data: object | null, link: types.dataLink = {}) => {
        const chatId = link.chat_id || 0
        const userId = link.user_id || 0
        cache.setUserData(this.botName, this._name, data, {
            chat_id: chatId,
            user_id: userId,
        })
    }
    dataMan = (link: types.dataLink): ApplicationDataMan => {
        const that = this
        return new ApplicationDataMan(this.botName, this._name, link)
    }
}
