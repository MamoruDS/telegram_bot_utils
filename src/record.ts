import { GroupId, parseId } from './utils'
import { getRecords, getRecord, setRecord } from './cache'
import { ctrMgr, CTR } from './ctr'
import { BotUtilCTR } from './bot'

export class RecordMan<RT = any> {
    public readonly id: string
    private _recordMgr: RecordMgr<RT>

    constructor(id: string, mgr: RecordMgr<RT>) {
        this.id = id
        this._recordMgr = mgr
    }

    get info(): RT {
        return this._recordMgr.get(this.id).info()
    }

    delete() {
        this._recordMgr.delete(this.id)
    }
}

export class RecordMgr<RecInfo> extends BotUtilCTR<
    Record<RecInfo>,
    RecordConstructor<RecInfo>
> {
    private _recordType: string
    private readonly _session: GroupId

    constructor(botName: string, recordType: string) {
        super(Record, 'Record', 'id', botName)
        this._recordType = recordType
        this._session = new GroupId('RC')
        this._event.addListener('add', (id) => {
            this.updateCache(id)
        })
        this._event.addListener('edit', (id) => {
            this.updateCache(id)
        })
        this._event.addListener('delete', (id) => {
            this.updateCache(id)
        })
    }

    add(recordOf: string, info: RecInfo, id?: string) {
        id = id || this._session.genId()
        const rec = new Record<RecInfo>(
            recordOf,
            info,
            id,
            this._session.group,
            this.CTRUID
        )
        return super._addItem(rec)
    }
    get(
        id: string,
        checkExist: boolean = true,
        checkDuplicate: boolean = false
    ): Record<RecInfo> {
        if (this._session.isMember(id))
            return super.get(id, checkExist, checkDuplicate)
        return undefined
    }
    isCurSessionRec(id: string): boolean {
        return this._session.isMember(id)
    }
    import(recordOf: string): void {
        if (!this._bot.ready) {
            this._bot.event.once('ready', () => {
                this.import(recordOf)
            })
            return
        }
        const _recs = this.cacheGet()
        for (const _rec of _recs) {
            if (_rec.recordOf === recordOf) {
                this.cacheDel(_rec.id)
                const idRenew = this._session.import(_rec.id)
                this.add(recordOf, _rec.info, idRenew)
                this._event.emit('import', idRenew)
            }
            continue
        }
    }
    renewId(id: string): string {
        return this._session.import(id)
    }
    updateCache(id: string): void {
        // const rec = this.get(id, false, false)
        let rec = undefined
        try {
            rec = this.get(id, false, false)
        } catch (e) {
            // console.error(e)
            // TODO:
        }
        if (typeof rec == 'undefined') {
            this.cacheDel(id)
        } else {
            this.cacheSet(id, rec.STO)
        }
    }
    filterAdv(
        recordOf: string,
        filter: { [key in keyof RecInfo]?: RecInfo[key] }
    ): Record<RecInfo>[] {
        return this.filter((rec) => {
            if (recordOf !== rec.recordOf) return false
            for (const key of Object.keys(filter)) {
                if (rec.info[key] !== filter[key]) return false
                continue
            }
            return true
        })
    }

    cacheGet(): RecSTO<RecInfo>[]
    cacheGet(id: string): RecSTO<RecInfo>
    cacheGet(id?: string): RecSTO<RecInfo> | RecSTO<RecInfo>[] {
        if (typeof id == 'undefined') {
            return getRecords(this._botName, this._recordType)
        } else {
            return getRecord(this._botName, this._recordType, id)
        }
    }
    cacheSet(id: string, rec: RecSTO<RecInfo>): void {
        setRecord<RecInfo>(this._botName, this._recordType, id, rec)
    }
    cacheDel(id: string): void {
        setRecord<RecInfo>(this._botName, this._recordType, id, undefined)
    }
    recordMan(id: string): RecordMan<RecInfo> {
        return new RecordMan<RecInfo>(id, this)
    }
}

export type RecSTO<I> = {
    id: string
    session: string
    recordOf: string
    info: I
}

interface RecordConstructor<RecInfo> {
    new (
        recordOf: string,
        info: RecInfo,
        id: string,
        session: string,
        mgrId: string
    ): Record<RecInfo>
}

export class Record<RecInfo> {
    private readonly _id: string
    private readonly _session: string
    private readonly _recordOf: string
    protected _info: RecInfo
    private _locked: boolean
    private readonly _MGRCTRID: string

    constructor(...P: ConstructorParameters<RecordConstructor<RecInfo>>)
    constructor(
        recordOf: string,
        info: RecInfo,
        id: string,
        session: string,
        mgrId: string
    ) {
        this._recordOf = recordOf
        this._info = info
        this._id = id
        this._session = session
        this._MGRCTRID = mgrId
        this._locked = false
    }

    get mgrCTR(): CTR<Record<RecInfo>, RecordConstructor<RecInfo>> {
        return ctrMgr.get<Record<RecInfo>>(this._MGRCTRID)
    }
    get id(): string {
        return this._id
    }
    get recordOf(): string {
        return this._recordOf
    }
    get locked(): boolean {
        return this._locked
    }
    set locked(lock: boolean) {
        this._locked = lock
    }
    get STO(): RecSTO<RecInfo> {
        return {
            id: this._id,
            session: this._session,
            recordOf: this._recordOf,
            info: this._info,
        }
    }

    forceSave() {
        this.mgrCTR.event.emit('edit', this._id)
    }
    info(
        propsUpdate?: {
            [key in keyof RecInfo]?: RecInfo[key]
        }
    ): RecInfo {
        if (typeof propsUpdate == 'undefined') {
            return this._info
        } else {
            this._info = { ...this._info, ...propsUpdate }
            this.mgrCTR.event.emit('edit', this._id)
            return this._info
        }
    }
}
