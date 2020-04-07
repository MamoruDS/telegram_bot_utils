import { GroupId } from './utils'
import { getRecords, getRecord, setReocrd } from './cache'
import { ctrMgr, CTR } from './ctr'

export class RecordMgr<RecInfo> extends CTR<Record<RecInfo>> {
    itemType = 'Record'
    idField = 'id'
    private botName: string
    private recordType: string
    private session: GroupId

    constructor(botName: string, recordType: string) {
        super(Record)
        this.botName = botName
        this.recordType = recordType
        this.session = new GroupId('RC')
        this._event.addListener('add', this.updateCache)
        this._event.addListener('edit', this.updateCache)
        this._event.addListener('delete', this.updateCache)
    }

    add(recordOf: string, info: RecInfo, id?: string): Record<RecInfo> {
        id = id || this.session.genId()
        const rec = new Record<RecInfo>(
            id,
            this.session.group,
            recordOf,
            info,
            this.CTRUID
        )
        return super.addItem(rec)
    }
    import(recordOf: string) {
        const _recs = this.cacheGet()
        for (const _rec of _recs) {
            if (_rec.recordOf === recordOf) {
                this.cacheDel(_rec.id)
                const idRenew = this.session.import(_rec.id)
                this.add(recordOf, _rec.info, idRenew)
                this._event.emit('import', idRenew)
            }
            continue
        }
    }
    updateCache(id: string) {
        const rec = this.get(id, false, false)
        if (typeof rec === 'undefined') {
            this.cacheDel(id)
        } else {
            this.cacheSet(id, rec.STO)
        }
    }

    cacheGet(): RecSTO<RecInfo>[]
    cacheGet(id: string): RecSTO<RecInfo>
    cacheGet(id?: string): RecSTO<RecInfo> | RecSTO<RecInfo>[] {
        if (typeof id === 'undefined') {
            return getRecords(this.botName, this.recordType)
        } else {
            return getRecord(this.botName, this.recordType, id)
        }
    }
    cacheSet(id: string, rec: RecSTO<RecInfo>): void {
        setReocrd<RecInfo>(this.botName, this.recordType, id, rec)
    }
    cacheDel(id: string): void {
        setReocrd<RecInfo>(this.botName, this.recordType, id, undefined)
    }
}

export type RecSTO<I> = {
    id: string
    session: string
    recordOf: string
    info: I
}

class Record<RecInfo> {
    private readonly _id: string
    private readonly _session: string
    private readonly _recordOf: string
    protected _info: RecInfo
    private _locked: boolean
    private readonly MGRCTRID: string

    constructor(
        id: string,
        session: string,
        recordOf: string,
        info: RecInfo,
        mgrId: string
    ) {
        this._id = id
        this._session = session
        this._recordOf = recordOf
        this._info = info
        this._locked = false
        this.MGRCTRID = mgrId
    }

    get mgrCTR() {
        return ctrMgr.get<RecordMgr<RecInfo>>(this.MGRCTRID)
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
