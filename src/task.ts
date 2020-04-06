import { EventEmitter } from 'events'
import * as _ from 'lodash'

import * as utils from './utils'
import * as types from './types'
import { CTR } from './ctr'
import { RecordMgr } from './record'
import { ApplicationDataMan } from './application'
import { botMgr } from './main'

type TaskRecordInfo = {
    vk?: string
    init_chat_id: number
    init_user_id: number
    start: number
    next: number
    executed: number
}

export class TaskMgr extends CTR<Task> {
    idField = 'name'
    private botName: string
    private _records: RecordMgr<TaskRecordInfo>
    constructor(botName: string) {
        super(Task)
        this._records = new RecordMgr<TaskRecordInfo>(this.botName, 'BotTask')
        this._records.event.addListener('import', recId => {
            this.check(recId)
        })
        this.botName = botName
    }

    get record(): RecordMgr<TaskRecordInfo> {
        return this._records
    }

    add(
        name: string,
        execFn: TaskExecFn,
        interval: number,
        maxExecCounts: number,
        options: TaskOptions
    ) {
        const _task = super.add(
            name,
            execFn,
            interval,
            maxExecCounts,
            options,
            this.botName
        )
        this._records.import(name)
        return _task
    }
    new(
        taskName: string,
        initChatId: number,
        initUserId: number,
        execImmediately: boolean = true
    ): string {
        //    this._records.add()
        const task = this.get(taskName, true, false)
        const _start = Date.now()
        const _next = execImmediately ? _start : task.interval + _start
        const record = this._records.add(taskName, {
            init_chat_id: initChatId,
            init_user_id: initUserId,
            start: _start,
            next: _next,
            executed: 0,
        })
        this.next(record.id)
        return record.id
    }

    check(recId: string, verifyKey?: string): void {
        const record = this._records.get(recId, true, false)
        if (typeof verifyKey !== 'undefined' && verifyKey !== record.info.vk)
            return
        const dTs = Date.now() - record.info.next
        const task = this.get(record.recordOf, true, false)
        if (record.info.executed >= task.maxExecCounts) {
            this._records.delete(record.id)
            return
        }
        if (dTs > task.timeout && !record.locked) {
            record.locked = true
            // this.event.emit(
            task.event.emit(
                'timeout',
                record.id,
                typeof verifyKey === 'undefined'
            )
            return
        }
        if (dTs > 0 && typeof verifyKey === 'undefined') {
            switch (task.importPolicy.split('-')[1]) {
                case 'ignore':
                    while (record.info.next < Date.now() - task.interval) {
                        record.info.next += task.interval
                    }
                    break
                case 'restart':
                    record.info.next = Date.now()
                    break
            }
            switch (task.importPolicy.split('-')[0]) {
                case 'curr':
                    task.exec(record.id)
                    break
                case 'next':
                    record.info.next += task.interval
                    this.next(record.id)
                    break
            }
        } else if (dTs > 0) {
            task.exec(record.id)
        } else {
            record.locked = false
            this.next(record.id, Math.abs(dTs))
        }
    }
    next(recId: string, timeout: number = 0): void {
        const record = this._records.get(recId, false, false)
        if (record) {
            const key = utils.genRandom(4)
            record.info.vk = key
            setTimeout(() => {
                this.check(record.id, key)
            }, timeout)
        }
    }
}

type ImportPolicy =
    | 'curr-ignore'
    | 'curr-restart'
    | 'curr-redo'
    | 'next-ignore'
    | 'next-restart'

type TaskExecFn = (recordInfo: TaskRecordInfo, data: ApplicationDataMan) => void

type TaskTimeoutFn = (
    recordInfo: TaskRecordInfo,
    data: ApplicationDataMan
) => Promise<void>

type TaskOptions = {
    description?: string
    application_name?: string
    link_chat_free?: boolean
    link_user_free?: boolean
    timeout?: number
    import_policy?: ImportPolicy
    timeout_function?: TaskTimeoutFn
}

const defaultTaskOptions = {
    description: 'USER DEFINED TASK',
    application_name: types.appGlobal,
    link_chat_free: false,
    link_user_free: false,
    import_policy: 'next-ignore',
    timeout: 300,
    timeout_function: async () => {},
} as Required<TaskOptions>

class Task {
    private botName: string
    protected _event: EventEmitter
    private _name: string
    private _execFunction: TaskExecFn
    private _interval: number
    private _maxExecCounts: number
    private _description: string
    private _applicationName: string
    private _linkChatFree: boolean
    private _linkUserFree: boolean
    private _importPolicy: ImportPolicy
    private _timeout: number
    private _timeoutFunction: TaskTimeoutFn

    constructor(
        name: string,
        execFn: TaskExecFn,
        interval: number,
        maxExecCounts: number,
        options: TaskOptions,
        botName: string
    ) {
        this.botName = botName
        this._event = new EventEmitter()
        const _options = botMgr
            .get(botName)
            .getDefaultOptions<TaskOptions>(defaultTaskOptions, options)
        this._name = name
        this._execFunction = execFn
        this._interval = interval
        this._maxExecCounts = maxExecCounts
        this._description = _options.description
        this._applicationName = _options.application_name
        this._linkChatFree = _options.link_chat_free
        this._linkUserFree = _options.link_user_free
        this._importPolicy = _options.import_policy
        this._timeout = _options.timeout
        this._timeoutFunction = _options.timeout_function
        this.init()
    }

    private get CTR(): TaskMgr {
        return botMgr.get(this.botName).task
    }
    get event(): EventEmitter {
        return this._event
    }
    get name(): string {
        return this._name
    }
    get interval(): number {
        return this.interval
    }
    get maxExecCounts(): number {
        return this._maxExecCounts
    }
    get importPolicy(): ImportPolicy {
        return this._importPolicy
    }
    get timeout(): number {
        return this._timeout
    }

    dataMan = (chatId?: number, userId?: number): ApplicationDataMan => {
        return botMgr
            .get(this.botName)
            .application.get(this._applicationName)
            .dataMan({
                chat_id: this._linkChatFree ? undefined : chatId,
                user_id: this._linkUserFree ? undefined : userId,
            })
    }
    init() {
        this._event.addListener(
            'timeout',
            async (recId: string, imported: boolean) => {
                const record = this.CTR.record.get(recId, true, false)
                await this._timeoutFunction(
                    record.info,
                    this.dataMan(
                        record.info.init_chat_id,
                        record.info.init_user_id
                    )
                )
                this.CTR.check(record.id)
            }
        )
        this._event.addListener('execute', recId => {
            const record = this.CTR.record.get(recId, true, false)
            this._execFunction(
                record.info,
                this.dataMan(record.info.init_chat_id, record.info.init_user_id)
            )
        })
    }
    async exec(recId: string): Promise<void> {
        const record = this.CTR.record.get(recId, false, false)
        if (record) {
            record.info.next += this._interval
            record.info.executed += 1
            // this.CTR.event.emit('execute', recId, false)
            this._event.emit('execute', recId)
            await utils.wait(5)
            this.CTR.next(record.id)
        }
        return
    }
}
