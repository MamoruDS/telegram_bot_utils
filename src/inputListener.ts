import { CTR } from './ctr'
import { botMgr } from './main'
import { Chat, User, Message } from './telegram'
import * as types from './types'
import { ApplicationDataMan } from './application'
import { genId } from './utils'

type Listener = (msg: Message, data: ApplicationDataMan) => Promise<boolean>
type ListenerAuto = (
    chat: Chat,
    user: User,
    data: ApplicationDataMan
) => Promise<any>
// TODO: any->never

export class InputListenerMgr extends CTR<InputListener> {
    idField = 'id'
    itemType = 'Input Listener'
    private botName: string

    constructor(botName: string) {
        super(InputListener)
        this.botName = botName
    }

    add(
        chat: Chat,
        user: User,
        execFunc: Listener,
        options?: inputListenerOptions
    ) {
        return super.add(chat, user, execFunc, options, this.botName)
    }
    check = async (
        msg: Message
    ): Promise<{
        passToCommand: boolean
    }> => {
        const res = {
            passToCommand: true,
        }
        const chatId = msg.chat.id
        const userId = msg.from.id
        const listeners = this.filter({ chatId: chatId, userId: userId })
        listeners.sort((a, b) => {
            return (
                botMgr
                    .get(this.botName)
                    .application.get(a.dataSpace.application_name).priority -
                botMgr
                    .get(this.botName)
                    .application.get(b.dataSpace.application_name).priority
            )
        })
        for (const listener of listeners) {
            // TODO: use list instead
            const res = await listener.exec(msg)
            if (res.removeListener) this.delete(listener.id)
            if (!res.passToCommand) res.passToCommand = false
            if (!res.passToOtherListener) break
        }
        return res
    }
}

export interface inputListenerOptions {
    application_name?: string
    link_chat_free?: boolean
    link_user_free?: boolean
    available_count?: number
    pass_to_other_listener?: boolean
    pass_to_command?: boolean
    init_function?: ListenerAuto
    expire_function?: ListenerAuto
}

const defaultInputListenerOptions = {
    application_name: types.appGlobal,
    link_chat_free: false,
    link_user_free: false,
    available_count: Infinity,
    pass_to_other_listener: true,
    pass_to_command: true,
    init_function: async () => {},
    expire_function: async () => {},
} as Required<inputListenerOptions>

class InputListener {
    private readonly _id: string
    private readonly botName: string
    // private readonly _chatId: number
    // private readonly _userId: number
    private readonly _chat: Chat
    private readonly _user: User
    private readonly _execFunction: Listener
    private readonly _applicationName: string
    private readonly _linkChatFree: boolean
    private readonly _linkUserFree: boolean
    private _availableCount: number
    private _passToOtherListener: boolean
    private _passToCommand: boolean
    private readonly _initFunction: ListenerAuto
    private readonly _expireFunction: ListenerAuto
    private activated: boolean
    constructor(
        chat: Chat,
        user: User,
        execFunc: Listener,
        options: inputListenerOptions,
        botName: string
    ) {
        this._id = genId('IL')
        this.botName = botName
        const _options = botMgr
            .get(this.botName)
            .getDefaultOptions<inputListenerOptions>(
                defaultInputListenerOptions,
                options
            )
        this._chat = chat
        this._user = user
        this._execFunction = execFunc
        this._applicationName = _options.application_name
        this._linkChatFree = _options.link_chat_free
        this._linkUserFree = _options.link_user_free
        this._availableCount = _options.available_count
        this._passToOtherListener = _options.pass_to_other_listener
        this._passToCommand = _options.pass_to_command
        this._initFunction = _options.init_function
        this._expireFunction = _options.expire_function
        this.activated = false
        this.init()
    }

    private get CTR(): InputListenerMgr {
        return botMgr.get(this.botName).inputlistener
    }
    get id(): string {
        return this._id
    }
    get chatId(): number {
        return this._chat.id
    }
    get userId(): number {
        return this._user.id
    }
    get dataSpace(): types.DataSpace {
        return {
            application_name: this._applicationName,
            link_chat_free: this._linkChatFree,
            link_user_free: this._linkUserFree,
        }
    }
    get availableCount(): number {
        return this._availableCount
    }
    get passToOtherListener(): boolean {
        return this._passToOtherListener
    }
    set passToOtherListener(pass: boolean) {
        this._passToOtherListener = pass
        this.CTR.event.emit('edit')
    }
    get passToCommand(): boolean {
        return this._passToCommand
    }
    set passToCommand(pass: boolean) {
        this._passToCommand = pass
        this.CTR.event.emit('edit')
    }

    dataMan = (): ApplicationDataMan => {
        return botMgr
            .get(this.botName)
            .application.get(this._applicationName)
            .dataMan({
                chat_id: this._linkChatFree ? undefined : this._chat.id,
                user_id: this._linkUserFree ? undefined : this._user.id,
            })
    }
    init = async (): Promise<void> => {
        await this._initFunction(this._chat, this._user, this.dataMan())
        this.activated = true
        this.CTR.event.emit('edit')
    }
    exec = async (
        msg: Message
    ): Promise<{
        removeListener: boolean
        passToOtherListener: boolean
        passToCommand: boolean
    }> => {
        const res = {
            removeListener: false,
            passToOtherListener: this._passToOtherListener,
            passToCommand: this._passToCommand,
        }
        this._availableCount -= 1
        this.CTR.event.emit('edit')
        res.removeListener = await this._execFunction(msg, this.dataMan())
        if (this._availableCount < 1) {
            res.removeListener = true
            await this._expireFunction(this._chat, this._user, this.dataMan())
        }
        return res
    }
}
