import { EventEmitter } from 'events'
import * as _ from 'lodash'

import * as utils from './utils'
import { RecordMgr, RecordMan } from './record'
import {
    ApplicationDataMan,
    ApplicationInfo,
    AppBaseUtilCTR,
    AppBaseUtilItem,
} from './application'
import { botMgr } from './main'

type TaskRecordInfo = {
    vk?: string
    init_chat_id: number
    init_user_id: number
    start: number
    next: number
    executed: number
}

export class TaskMgr extends AppBaseUtilCTR<Task, TaskConstructor> {
    private _records: RecordMgr<TaskRecordInfo>
    constructor(botName: string) {
        super(Task, 'Task', 'name', botName)
        this._records = new RecordMgr<TaskRecordInfo>(this._botName, 'BotTask')
        this._records.event.addListener('import', (recId) => {
            this.check(recId)
        })
    }

    get record(): RecordMgr<TaskRecordInfo> {
        return this._records
    }

    add(
        name: string,
        execFn: TaskExecFn,
        interval: number,
        maxExecCounts: number,
        options: TaskOptions,
        applicationInfo: ApplicationInfo
    ) {
        const _task = super.add(
            name,
            execFn,
            interval,
            maxExecCounts,
            options,
            applicationInfo,
            this._botName
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
        if (typeof verifyKey !== 'undefined' && verifyKey !== record.info().vk)
            return
        const dTs = Date.now() - record.info().next
        const task = this.get(record.recordOf, true, false)
        if (record.info().executed >= task.maxExecCounts) {
            this._records.delete(record.id)
            return
        }
        if (dTs > task.timeout && !record.locked) {
            record.locked = true
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
                    while (record.info().next < Date.now() - task.interval) {
                        record.info({
                            next: record.info().next + task.interval,
                        })
                    }
                    break
                case 'restart':
                    record.info({ next: Date.now() })
                    break
            }
            switch (task.importPolicy.split('-')[0]) {
                case 'curr':
                    task.exec(record.id)
                    break
                case 'next':
                    record.info({
                        next: record.info().next + task.interval,
                    })
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
            record.info({ vk: key })
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

type TaskExecFn = (
    record: RecordMan<TaskRecordInfo>,
    data: ApplicationDataMan
) => void

type TaskTimeoutFn = (
    record: RecordMan<TaskRecordInfo>,
    data: ApplicationDataMan
) => Promise<void>

type TaskOptions = {
    description?: string
    timeout?: number
    import_policy?: ImportPolicy
    timeout_function?: TaskTimeoutFn
}

const defaultTaskOptions: Required<TaskOptions> = {
    description: 'USER DEFINED TASK',
    import_policy: 'next-ignore',
    timeout: 300,
    timeout_function: async () => {},
}

interface TaskConstructor {
    new (
        name: string,
        execFn: TaskExecFn,
        interval: number,
        maxExecCounts: number,
        options: TaskOptions,
        appInfo: ApplicationInfo,
        botName: string
    ): Task
}

class Task extends AppBaseUtilItem {
    protected _event: EventEmitter
    private _name: string
    private _execFunction: TaskExecFn
    private _interval: number
    private _maxExecCounts: number
    private _description: string
    private _importPolicy: ImportPolicy
    private _timeout: number
    private _timeoutFunction: TaskTimeoutFn

    constructor(...P: ConstructorParameters<TaskConstructor>)
    constructor(
        name: string,
        execFn: TaskExecFn,
        interval: number,
        maxExecCounts: number,
        options: TaskOptions,
        appInfo: ApplicationInfo,
        botName: string
    ) {
        super(appInfo, botName)
        this._event = new EventEmitter()
        const _options = botMgr
            .get(botName)
            .getDefaultOptions<TaskOptions>(defaultTaskOptions, options)
        this._name = name
        this._execFunction = execFn
        this._interval = interval
        this._maxExecCounts = maxExecCounts
        this._description = _options.description
        this._importPolicy = _options.import_policy
        this._timeout = _options.timeout
        this._timeoutFunction = _options.timeout_function
        this.init()
    }

    private get _CTR(): TaskMgr {
        return botMgr.get(this._botName).task
    }
    get event(): EventEmitter {
        return this._event
    }
    get name(): string {
        return this._name
    }
    get interval(): number {
        return this._interval
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

    init() {
        this._event.addListener(
            'timeout',
            async (recId: string, imported: boolean) => {
                const record = this._CTR.record.get(recId, true, false)
                await this._timeoutFunction(
                    this._CTR.record.recordMan(recId),
                    this.dataMan({
                        chat_id: record.info().init_chat_id,
                        user_id: record.info().init_user_id,
                    })
                )
                this._CTR.check(record.id)
            }
        )
        this._event.addListener('execute', (recId) => {
            const record = this._CTR.record.get(recId, true, false)
            this._execFunction(
                this._CTR.record.recordMan(recId),
                this.dataMan({
                    chat_id: record.info().init_chat_id,
                    user_id: record.info().init_user_id,
                })
            )
        })
    }
    async exec(recId: string): Promise<void> {
        const record = this._CTR.record.get(recId, false, false)
        if (record) {
            record.info({ next: record.info().next += this._interval })
            record.info({ executed: record.info().executed + 1 })
            this._event.emit('execute', recId)
            await utils.wait(5)
            this._CTR.next(record.id)
        }
        return
    }
}
