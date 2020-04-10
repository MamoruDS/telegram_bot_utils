import { GroupId } from './utils'
import { getRecords, getRecord, setReocrd } from './cache'
import { ctrMgr, CTR } from './ctr'
import { BotUtilCTR } from './bot'

export class RecordMan {
    public readonly id: string
    private _recordMgr: RecordMgr<any>

    constructor(id: string, mgr: RecordMgr<any>) {
        this.id = id
        this._recordMgr = mgr
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
    private _session: GroupId

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
        return super.addItem(rec)
    }
    import(recordOf: string) {
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
    updateCache(id: string): void {
        // const rec = this.get(id, false, false)
        let rec = undefined
        try {
            rec = this.get(id, false, false)
        } catch (e) {
            // console.error(e)
            // TODO:
        }
        if (typeof rec === 'undefined') {
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
        if (typeof id === 'undefined') {
            return getRecords(this._botName, this._recordType)
        } else {
            return getRecord(this._botName, this._recordType, id)
        }
    }
    cacheSet(id: string, rec: RecSTO<RecInfo>): void {
        setReocrd<RecInfo>(this._botName, this._recordType, id, rec)
    }
    cacheDel(id: string): void {
        setReocrd<RecInfo>(this._botName, this._recordType, id, undefined)
    }
    recordMan(id: string): RecordMan {
        return new RecordMan(id, this)
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

class Record<RecInfo> {
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
    get info(): RecInfo {
        return this._info
    }
    set info(info: RecInfo) {
        this.mgrCTR.event.emit('edit', this._id)
        this._info = info
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
}
