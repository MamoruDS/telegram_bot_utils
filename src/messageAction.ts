import { botMgr } from './main'
import { Message } from './telegram'
import {
    ApplicationDataMan,
    ApplicationInfo,
    AppBaseUtilCTR,
    AppBaseUtilItem,
} from './application'
import { RecordMan, RecordMgr } from './record'

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
        execFn: ActionFn,
        options: MessageActionOptions = {},
        applicationInfo: ApplicationInfo
    ) {
        this._records.import(name)
        return super.add(name, execFn, options, applicationInfo, this._botName)
    }
    async new(actionName: string, chatId: number, userId: number) {
        // this.get(actionName).add(chatId, userId)
        const _recs = this._records.filterAdv(actionName, {
            chat_id: chatId,
            user_id: userId,
        })
        if (_recs.length !== 0) {
            const action = this.get(actionName)
            await action.duplicateExec(chatId, userId, _recs[0].id)
            return
        }
        const action = this.get(actionName)
        await action.initExec(chatId, userId)
        this._records.add(actionName, {
            chat_id: chatId,
            user_id: userId,
            executed: 0,
        })
    }
    async checkMessage(
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
            return rec.info.chat_id === chatId && rec.info.user_id === userId
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
        const _orderedActions = this._bot.application.orderByPriority<
            OrderedAction,
            MessageAction
        >(_actions, this)
        for (const orderedAction of _orderedActions) {
            const _action = this.get(orderedAction.idFieldVal)
            const _recId: string = orderedAction.recId
            const _res = await _action.exec(message, _recId)
            if (_res.removeListener) {
                const _rec = this._records.get(_recId)
                _action.expireExec(_rec.info.chat_id, _rec.info.user_id)
                // this.delete(_action.name)
                this._records.delete(_recId)
                // TODO: maybe delete from action is safe?
            }
            if (!_res.passToCommand) res.passToCommand = false
            if (!_res.passToOtherAction) break
        }
        return res
    }
}

type ActionFn = (
    record: RecordMan,
    msg: Message,
    data: ApplicationDataMan
) => Promise<boolean>

type ActionAutoFn = (
    chat_id: number,
    user_id: number,
    data: ApplicationDataMan
) => Promise<any>

type DuplicateFn = (
    chat_id: number,
    user_id: number,
    data: ApplicationDataMan,
    record: RecordMan
) => Promise<any>

type MessageActionOptions = {
    max_exec_counts?: number
    pass_to_other_action?: boolean
    pass_to_command?: boolean
    init_function?: ActionAutoFn
    duplicate_function?: DuplicateFn
    expire_function?: ActionAutoFn
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
        execFn: ActionFn,
        options: MessageActionOptions,
        appInfo: ApplicationInfo,
        botName: string
    ): MessageAction
}

class MessageAction extends AppBaseUtilItem {
    private readonly _name: string
    private readonly _execFunction: ActionFn
    private readonly _maxExecCounts: number
    private readonly _passToOtherAction: boolean
    private readonly _passToCommand: boolean
    private readonly _initFunction: ActionAutoFn
    private readonly _duplicateFunction: DuplicateFn
    private readonly _expireFunction: ActionAutoFn

    constructor(...P: ConstructorParameters<MessageActionConstructor>)
    constructor(
        name: string,
        execFn: ActionFn,
        options: MessageActionOptions,
        appInfo: ApplicationInfo,
        botName: string
    ) {
        super(appInfo, botName)
        this._name = name
        const _options = botMgr
            .get(this._botName)
            .getDefaultOptions<MessageActionOptions>(
                defaultMessageActionOptions,
                options
            )
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

    async exec(
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
        record.info.executed += 1
        res.removeListener =
            (await this._execFunction(
                this._CTR.record.recordMan(record.id),
                message,
                this.dataMan(message)
            )) || record.info.executed >= this._maxExecCounts
        return res
    }

    async initExec(chatId: number, userId: number) {
        this._initFunction(
            chatId,
            userId,
            this.dataMan({ chat_id: chatId, user_id: userId })
        )
    }
    async duplicateExec(chatId: number, userId: number, recId: string) {
        this._duplicateFunction(
            chatId,
            userId,
            this.dataMan({ chat_id: chatId, user_id: userId }),
            this._CTR.record.recordMan(recId)
        )
    }
    async expireExec(chatId: number, userId: number) {
        this._expireFunction(
            chatId,
            userId,
            this.dataMan({ chat_id: chatId, user_id: userId })
        )
    }
}
