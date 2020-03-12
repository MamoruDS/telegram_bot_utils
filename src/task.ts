import * as events from 'events'
import * as _ from 'lodash'

import * as cache from './cache'
import * as utils from './utils'
import {
    Task,
    TaskRecord,
    TaskRecordMan,
    importPolicies,
    ImportPolicy,
} from './types'

export class BotTask extends events.EventEmitter {
    private _botId: string
    private _tasks: Task[]
    private _session: utils.GroupId
    constructor(botId: string) {
        super()
        this._botId = botId
        this._tasks = [] as Task[]
        this._session = new utils.GroupId('TS')
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
        _task.interval *= 1000
        _task.timeout *= 1000
        if (_.filter(this._tasks, { name: _task.name }).length === 0) {
            this._tasks.push(_task)
        }
        this.checkRecordsFromPreviousSession()
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
        const nextTs = execImmediately ? startTs : task.interval + startTs
        const record = {
            id: this._session.genId(),
            task_name: task.name,
            chat_id: chatId,
            user_id: userId,
            start: startTs,
            next: nextTs,
            executed: 0,
        } as TaskRecord
        this.setRecord(record)
        this.nextCheck(record.id)
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
    public checkRecordsFromPreviousSession = () => {
        const recs = this.getRecords()
        for (const rec of recs) {
            if (this._session.isMember(rec.id)) continue
            this.delRecordById(rec.id)
            rec.id = this._session.genId()
            this.setRecord(rec)
            this.checkRecordById(rec.id, undefined, true)
        }
    }
    public setRecordTimeoutLockById = (recordId: string, lock: boolean) => {
        const _rec = this.getRecord(recordId)
        if (lock) {
            _rec.locked = true
        } else {
            delete _rec.locked
        }
        this.setRecord(_rec)
    }
    public checkRecordById = (
        recordId: string,
        verifyKey: string,
        previousRecord?: boolean
    ): void => {
        const _rec = this.getRecord(recordId)
        this.checkRecord(_rec, verifyKey, previousRecord)
    }
    public checkRecord = (
        record: TaskRecord | undefined,
        verifyKey: string,
        previousRecord?: boolean
    ): void => {
        if (!record) return
        if (verifyKey !== record.vk && !previousRecord) return
        const dTs = Date.now() - record.next
        const task = this.getTask(record.task_name)
        if (!task) {
            return
        }
        if (record.executed >= task.execution_counts) {
            this.delRecord(record)
            return
        }
        if (dTs > task.timeout && !record.locked) {
            this.setRecordTimeoutLockById(record.id, true)
            this.emit('timeout', record, task, previousRecord)
            return
        }
        if (dTs > 0 && previousRecord) {
            const policy =
                importPolicies.indexOf(task.import_policy) !== -1
                    ? task.import_policy
                    : importPolicies[0]
            switch (policy.split('-')[1]) {
                case 'ignore':
                    const curr = Date.now()
                    while (record.next < curr - task.interval) {
                        record.next += task.interval
                    }
                    break
                case 'restart':
                    record.next = Date.now()
            }
            this.setRecord(record)
            if (policy.split('-')[0] === 'curr') {
                this.execTaskByRecordId(record.id)
            } else if (policy.split('-')[0] === 'next') {
                record.next += task.interval
                this.setRecord(record)
                this.nextCheck(record.id)
            }
        } else if (dTs > 0) {
            this.execTaskByRecordId(record.id)
        } else {
            this.setRecordTimeoutLockById(record.id, false)
            this.nextCheck(record.id, Math.abs(dTs))
        }
    }
    public nextCheck = (recordId: string, timeout: number = 0) => {
        const _rec = this.getRecord(recordId)
        if (_rec) {
            const key = utils.genRandom(4)
            _rec.vk = key
            this.setRecord(_rec)
            setTimeout(() => {
                this.checkRecordById(_rec.id, key)
            }, timeout)
        }
    }
    public execTaskByRecordId = async (recordId: string): Promise<void> => {
        const record = this.getRecord(recordId)
        if (!record) return
        const task = this.getTask(record.task_name)
        record.next += task.interval
        record.executed += 1
        this.setRecord(record)
        this.emit('execute', record, task)
        await utils.wait(5)
        this.nextCheck(record.id)
    }
    public taskRecordMan = (recordId: string): TaskRecordMan => {
        const that = this
        return {
            kill() {
                that.delRecordById(recordId)
            },
            resetTimer(manualTimer?: number) {
                const _rec = that.getRecord(recordId)
                const _task = that.getTask(_rec.task_name)
                const _interval =
                    typeof manualTimer === 'number'
                        ? manualTimer
                        : _task.interval
                _rec.next = Date.now() + _interval
            },
        }
    }
}
