import { CTR } from './ctr'
import { Message } from './telegram'
import { ApplicationMgr, ApplicationDataMan } from './application'
import { CommandMgr } from './command'
import { InputListenerMgr } from './inputListener'
import { BotTask } from './task'
import * as types from './types'
import * as defaults from './defaults'
import { GroupUtils } from './group'

export class BotMgr extends CTR<BotUtils> {
    itemType = 'Bot'

    constructor() {
        super(BotUtils)
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

type basicInputOptions = {
    application_name?: string
    link_chat_free?: boolean
    link_user_free?: boolean
}

class BotUtils {
    private _botName: string
    private _owner: Owner
    private _expireDelay: number
    private _applications: ApplicationMgr
    private _commands: CommandMgr
    private _inputListeners: InputListenerMgr
    private _tasks: BotTask
    private _groupUtils: GroupUtils

    constructor(
        botName: string,
        owner?: string | number,
        expireDelay: number = Infinity
    ) {
        this._botName = botName
        this._owner = {} as Owner
        this._expireDelay = expireDelay
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
    get inputlistener(): InputListenerMgr {
        return this.inputlistener
    }
    get groupUtils(): GroupUtils {
        return this._groupUtils
    }

    init = () => {
        this._applications = new ApplicationMgr(this._botName)
        this._commands = new CommandMgr(this._botName)
        this._inputListeners = new InputListenerMgr(this._botName)
        this._tasks = new BotTask(this._botName)
        // this._tasks.addListener('timeout', this.onTaskTimeout)
        // this._tasks.addListener('execute', this.onTaskExecute)
        this._groupUtils = new GroupUtils(this._botName)
    }
    getDefaultOptions<O extends basicInputOptions>(
        defaultOptions: Required<O>,
        inputOptions: O = {} as O,
        defaultDataSpace: boolean = true
    ): Required<O> {
        const _options = { ...defaultOptions }
        if (
            typeof inputOptions !== 'object' ||
            inputOptions === null ||
            Array.isArray(inputOptions)
        ) {
            throw new TypeError('Input options expect an object to be entered')
        }
        if (defaultDataSpace) {
            const _app = this._applications.get(
                inputOptions.application_name ||
                    defaultOptions.application_name,
                true,
                false
            )
            _options.link_chat_free = _app.linkChatFree
            _options.link_user_free = _app.linkUserFree
        }
        for (const opt in _options) {
            _options[opt] =
                inputOptions[opt] !== undefined
                    ? inputOptions[opt]
                    : _options[opt]
        }
        return _options
    }
    private isMessageExpired = (msg: Message): boolean => {
        const _delay = Math.floor(Date.now() / 1000) - msg.date
        if (_delay > this._expireDelay) {
            return false
        } else {
            return true
        }
    }
    onMessage = async (msg: Message): Promise<void> => {
        if (this.isMessageExpired(msg)) return
        const _l = await this._inputListeners.check(msg)
        if (_l.passToCommand) {
            this._commands.check(msg)
        }
        this._groupUtils.listener(msg)
    }
    // private onTaskTimeout = async (
    //     record: types.TaskRecord,
    //     task: types.Task,
    //     imported?: boolean
    // ) => {
    //     const applicationData = new ApplicationDataMan(
    //         this._botName,
    //         task.application_name,
    //         {
    //             chat_id: task.link_chat_free ? undefined : record.chat_id,
    //             user_id: task.link_user_free ? undefined : record.user_id,
    //         }
    //     )
    //     const taskRecordMan = this._tasks.taskRecordMan(record.id)
    //     await task.timeout_action(record, taskRecordMan, applicationData)
    //     this._tasks.checkRecordById(record.id, undefined, imported)
    // }
    // private onTaskExecute = (record: types.TaskRecord, task: types.Task) => {
    //     const applicationData = new ApplicationDataMan(
    //         this._botName,
    //         task.application_name,
    //         {
    //             chat_id: task.link_chat_free ? undefined : record.chat_id,
    //             user_id: task.link_user_free ? undefined : record.user_id,
    //         }
    //     )
    //     const taskRecordMan = this._tasks.taskRecordMan(record.id)
    //     task.action(record, taskRecordMan, applicationData)
    // }
    // public defTask = (
    //     taskName: string,
    //     action: types.TaskAction,
    //     interval: number,
    //     execution_counts: number = Infinity,
    //     options?: types.TaskOptionsInput
    // ) => {
    //     const _options = defaults.options_task(options, this._applications.get)
    //     this._tasks.addTask(
    //         Object.assign(
    //             {
    //                 name: taskName,
    //                 action: action,
    //                 interval: interval,
    //                 execution_counts: execution_counts,
    //             },
    //             _options
    //         )
    //     )
    // }
    // public startTask = (
    //     taskName: string,
    //     chatId: number,
    //     userId: number,
    //     execImmediately?: boolean
    // ): string => {
    //     return this._tasks.addRecord(taskName, chatId, userId, execImmediately)
    // }
    // public stopTask = (recordId: string): void => {
    //     this._tasks.delRecordById(recordId)
    // }
}
