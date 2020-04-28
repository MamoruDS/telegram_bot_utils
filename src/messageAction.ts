import * as MAIN from './main'
import { Message } from './telegram'
import {
    ApplicationDataMan,
    ApplicationInfo,
    AppBaseUtilCTR,
    AppBaseUtilItem,
} from './application'
import { RecordMan, RecordMgr } from './record'
import { assignDefault } from './utils'

type MessageListenerInfo = {
    chat_id: number
    user_id: number
    executed: number
}

export class MessageActionMgr extends AppBaseUtilCTR<
    MessageAction,
    MessageActionConstructor
> {
    private _records: RecordMgr<MessageListenerInfo>

    constructor(botName: string) {
        super(MessageAction, 'Message Action', 'name', botName)
        this._records = new RecordMgr<MessageListenerInfo>(
            this._botName,
            'MessageListener'
        )
    }

    get record(): RecordMgr<MessageListenerInfo> {
        return this._records
    }

    add(
        name: string,
        execFn: CustomFn,
        options: MessageActionOptions = {},
        applicationInfo: ApplicationInfo = {}
    ) {
        this._records.import(name)
        return super.add(name, execFn, options, applicationInfo, this._botName)
    }
    async new(actionName: string, chatId: number, userId: number) {
        const _recs = this._records.filterAdv(actionName, {
            chat_id: chatId,
            user_id: userId,
        })
        if (_recs.length !== 0) {
            const action = this.get(actionName)
            await action._duplicateExec(chatId, userId, _recs[0].id)
            return
        }
        const action = this.get(actionName)
        const res = await action._initExec(chatId, userId)
        this._records.add(actionName, {
            chat_id: chatId,
            user_id: userId,
            executed: 0,
        })
        return res
    }
    async _checkMessage(
        message: Message
    ): Promise<{
        passToCommand: boolean
    }> {
        const res = {
            passToCommand: true,
        }
        const chatId = message.chat.id
        const userId = message.from.id
        const recs = this._records.filter((rec) => {
            return (
                rec.info().chat_id === chatId && rec.info().user_id === userId
            )
        })
        // const actions = this.filter({name: })
        type OrderedAction = {
            idFieldVal: string
            recId: string
        }
        const _actions = recs.map((rec) => {
            return {
                idFieldVal: rec.recordOf,
                recId: rec.id,
            } as OrderedAction
        })
        const _orderedActions = this._bot.application._orderByPriority<
            OrderedAction,
            MessageAction
        >(_actions, this)
        for (const orderedAction of _orderedActions) {
            const _action = this.get(orderedAction.idFieldVal)
            if (
                !this._bot.application
                    .get(_action.appInfo.application_name)
                    ._isValidForChat(message.chat)
            )
                continue
            const _recId: string = orderedAction.recId
            const _res = await _action._exec(message, _recId)
            if (_res.removeListener) {
                const _rec = this._records.get(_recId)
                _action.expireExec(
                    _rec.info().chat_id,
                    _rec.info().user_id,
                    _rec.id
                )
                this._records.delete(_recId)
            }
            if (!_res.passToCommand) res.passToCommand = false
            if (!_res.passToOtherAction) break
        }
        return res
    }
}

type CustomInitFn = (inf: {
    data: {
        chat_id: number
        user_id: number
        user_data: ApplicationDataMan
    }
}) => Promise<void>

type CustomAutoFn = (inf: {
    record: RecordMan<MessageListenerInfo>
    data: {
        chat_id: number
        user_id: number
        user_data: ApplicationDataMan
    }
}) => Promise<void>

type CustomFn = (inf: {
    record: RecordMan<MessageListenerInfo>
    message: Message
    data: {
        chat_id: number
        user_id: number
        user_data: ApplicationDataMan
    }
}) => Promise<boolean>

type MessageActionOptions = {
    max_exec_counts?: number
    pass_to_other_action?: boolean
    pass_to_command?: boolean
    init_function?: CustomInitFn
    duplicate_function?: CustomAutoFn
    expire_function?: CustomAutoFn
}

const defaultMessageActionOptions: Required<MessageActionOptions> = {
    max_exec_counts: Infinity,
    pass_to_other_action: true,
    pass_to_command: true,
    init_function: async () => {},
    duplicate_function: async () => {},
    expire_function: async () => {},
}

interface MessageActionConstructor {
    new (
        name: string,
        execFn: CustomFn,
        options: MessageActionOptions,
        appInfo: ApplicationInfo,
        botName: string
    ): MessageAction
}

class MessageAction extends AppBaseUtilItem {
    private readonly _name: string
    private readonly _execFunction: CustomFn
    private readonly _maxExecCounts: number
    private readonly _passToOtherAction: boolean
    private readonly _passToCommand: boolean
    private readonly _initFunction: CustomInitFn
    private readonly _duplicateFunction: CustomAutoFn
    private readonly _expireFunction: CustomAutoFn

    constructor(...P: ConstructorParameters<MessageActionConstructor>)
    constructor(
        name: string,
        execFn: CustomFn,
        options: MessageActionOptions,
        appInfo: ApplicationInfo,
        botName: string
    ) {
        super(appInfo, botName)
        this._name = name
        const _options = assignDefault(defaultMessageActionOptions, options)
        this._execFunction = execFn
        this._maxExecCounts = _options.max_exec_counts
        this._passToOtherAction = _options.pass_to_other_action
        this._passToCommand = _options.pass_to_command
        this._initFunction = _options.init_function
        this._duplicateFunction = _options.duplicate_function
        this._expireFunction = _options.expire_function
    }

    get name(): string {
        return this._name
    }
    get maxExecCounts(): number {
        return this._maxExecCounts
    }
    private get _CTR(): MessageActionMgr {
        return this._bot.messageAction
    }

    async _exec(
        message: Message,
        recordId: string
    ): Promise<{
        removeListener: boolean
        passToOtherAction: boolean
        passToCommand: boolean
    }> {
        const res = {
            removeListener: false,
            passToOtherAction: this._passToOtherAction,
            passToCommand: this._passToCommand,
        }
        const record = this._CTR.record.get(recordId)
        record.info({ executed: record.info().executed + 1 })
        res.removeListener =
            (await this._execFunction({
                record: this._CTR.record.recordMan(record.id),
                message: message,
                data: {
                    chat_id: message.chat.id,
                    user_id: message.from.id,
                    user_data: this.dataMan(message),
                },
            })) || record.info().executed >= this._maxExecCounts
        return res
    }

    async _initExec(chatId: number, userId: number): Promise<any> {
        return this._initFunction({
            data: {
                chat_id: chatId,
                user_id: userId,
                user_data: this.dataMan({ chat_id: chatId, user_id: userId }),
            },
        })
    }
    async _duplicateExec(
        chatId: number,
        userId: number,
        recId: string
    ): Promise<void> {
        this._duplicateFunction({
            record: this._CTR.record.recordMan(recId),
            data: {
                chat_id: chatId,
                user_id: userId,
                user_data: this.dataMan({ chat_id: chatId, user_id: userId }),
            },
        })
    }
    async expireExec(chatId: number, userId: number, recId: string) {
        this._expireFunction({
            record: this._CTR.record.recordMan(recId),
            data: {
                chat_id: chatId,
                user_id: userId,
                user_data: this.dataMan({ chat_id: chatId, user_id: userId }),
            },
        })
    }
}
