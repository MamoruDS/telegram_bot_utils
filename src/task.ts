import * as events from 'events'
import * as _ from 'lodash'

import * as cache from './cache'
import * as utils from './utils'
import { Task, TaskRecord, TaskRecordMan } from './types'

export class BotTask extends events.EventEmitter {
    private _botId: string
    private _tasks: Task[]
    constructor(botId: string) {
        super()
        this._botId = botId
        this._tasks = [] as Task[]
    }
    private getRecords = (): TaskRecord[] => {
        return cache.getTaskRecords(this._botId)
    }
    private getRecord = (id: string): TaskRecord | undefined => {
        return cache.getTaskRecord(this._botId, id)
    }
    private setRecord = (record: TaskRecord): void => {
        const _rec = Object.assign({}, record)
        return cache.setTaskRecord(this._botId, _rec)
    }
    public addTask = (task: Task): void => {
        const _task = Object.assign({}, task)
        if (_.filter(this._tasks, { name: _task.name }).length === 0) {
            this._tasks.push(_task)
        }
        // TODO: throw error
    }
    private getTask = (taskName: string): Task => {
        return _.filter(this._tasks, { name: taskName })[0]
    }
    public addRecord = (
        taskName: string,
        chatId: number,
        userId: number,
        execImmediately?: boolean
    ): string => {
        const task = this.getTask(taskName)
        if (!task) {
            // TODO: throw error
        }
        const startTs = Date.now()
        const nextTs = execImmediately
            ? startTs
            : task.interval * 1000 + startTs
        const record = {
            id: utils.genId('TC'),
            task_name: task.name,
            chat_id: chatId,
            user_id: userId,
            start_timestamp: startTs,
            next_timestamp: nextTs,
            // remains: task.repeat,
            executed_counts: 0,
        } as TaskRecord
        this.setRecord(record)
        this.checkRecordById(record.id)
        return record.id
    }
    public delRecordById = (recordId: string): void => {
        const _rec = this.getRecord(recordId)
        this.setRecord(Object.assign({ expired: true }, _rec))
    }
    public delRecord = (record: TaskRecord): void => {
        const _rec = Object.assign({}, record)
        this.setRecord(Object.assign({ expired: true }, _rec))
    }
    public checkRecordById = (recordId: string): void => {
        const _rec = this.getRecord(recordId)
        this.checkRecord(_rec)
    }
    public checkRecord = (record: TaskRecord | undefined): void => {
        if (!record) return
        const dTs = Date.now() - record.next_timestamp
        const task = this.getTask(record.task_name)
        if (record.executed_counts >= task.execution_counts) {
            this.delRecord(record)
            return
        }
        if (dTs > task.timeout) {
            this.emit('timeout', record, task)
        } else {
            if (dTs > 0) {
                this.execTaskByRecordId(record.id)
            } else {
                setTimeout(() => {
                    this.checkRecord(this.getRecord(record.id))
                }, Math.abs(dTs))
            }
        }
    }
    public taskRecordMan = (recordId: string): TaskRecordMan => {
        const that = this
        return {
            kill() {
                const _rec = that.getRecord(recordId)
                that.delRecord(_rec)
            },
        }
    }
    public execTaskByRecordId = (recordId: string): void => {
        const record = this.getRecord(recordId)
        if (!record) return
        const task = this.getTask(record.task_name)
        record.next_timestamp += task.interval * 1000
        record.executed_counts += 1
        this.setRecord(record)
        this.checkRecordById(record.id)
        this.emit('execute', record, task)
    }
}
