import * as events from 'events'
import * as _ from 'lodash'

import * as cache from './cache'
import * as utils from './utils'
import { Task, TaskRecord } from './types'

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
    private getRecord = (id: string): TaskRecord => {
        return cache.getTaskRecord(this._botId, id)
    }
    private setRecord = (record: TaskRecord): void => {
        return cache.setTaskRecord(this._botId, record)
    }
    public addTask = (task: Task): void => {
        if (_.filter(this._tasks, { name: task.name }).length === 0) {
            this._tasks.push(task)
        }
        // TODO: throw error
    }
    private getTask = (taskName: string) => {
        return _.filter(this._tasks, { name: taskName })[0]
    }
    public addRecord = (
        taskName: string,
        chatId: number,
        userId: number
    ): string => {
        const task = this.getTask(taskName)
        const startTs = Date.now()
        const nextTs = task.interval * 1000 + startTs
        const record = {
            id: utils.genId('TC'),
            task_name: task.name,
            chat_id: chatId,
            user_id: userId,
            start_timestamp: startTs,
            next_timestamp: nextTs,
            remains: task.repeat,
            execution_counts: 0,
        } as TaskRecord
        this.setRecord(record)
        return record.id
    }
    public delRecord = (record: TaskRecord) => {
        this.setRecord(Object.assign({ expired: true }, record))
    }
    public checkRecord = (record: TaskRecord | undefined) => {
        if (!record) return
        const dTs = Date.now() - record.next_timestamp
        const task = this.getTask(record.task_name)
        if (dTs > task.timeout) {
            this.emit('timeout', record, task)
        } else {
            if (dTs > 0) {
                this.emit('execute', record, task)
            } else {
                setTimeout(() => {
                    this.checkRecord(this.getRecord(record.id))
                }, Math.abs(dTs))
            }
        }
    }
}
