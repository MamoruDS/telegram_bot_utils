import { GroupId } from './utils'
import { getRecords, getRecord, setReocrd } from './cache'
import { ctrMgr, CTR } from './ctr'

// class CachedRecord<RecInfo> {
//     private readonly _id: string
//     private readonly _info: RecInfo

//     constructor(id: string, info: string) {
//         this._id = id
//         try {
//             this._info = Object.assign(JSON.parse(info))
//         } catch (err) {
//             if (err instanceof SyntaxError) {
//                 this._info = Object.assign({ failed: info })
//                 // TODO: raise error message
//             } else {
//                 throw err
//             }
//         }
//     }

//     get id(): string {
//         return this._id
//     }
//     get info(): RecInfo {
//         return this._info
//     }
// }

// class CachedRecordMgr<RecInfo> extends CTR<CachedRecord<RecInfo>> {
//     itemType = 'Cached Record'
//     idField = 'id'
//     private botName: string
//     private recordType: string

//     constructor(botName: string, recordType: string) {
//         super(CachedRecord)
//         this.botName = botName
//         this.recordType = recordType
//     }

//     add(id: string, info: RecInfo): CachedRecord<RecInfo> {
//         return
//     }
//     update() {
//         this._event.emit('edit')
//     }
// }

export class RecordMgr<RecInfo> extends CTR<Record<RecInfo>> {
    itemType = 'Record'
    idField = 'id'
    private botName: string
    private recordType: string
    private session: GroupId
    // private cache: CachedRecordMgr<RecInfo>

    constructor(botName: string, recordType: string) {
        super(Record)
        this.botName = botName
        this.recordType = recordType
        this.session = new GroupId('RC')
        // this.cache = new CachedRecordMgr(this.botName, this.recordType)
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
        // this.cache.add(id, info)
        return super.addItem(rec)
    }
    import(recordOf: string) {
        const _recs = this.cacheGet()
        for (const _rec of _recs) {
            if (_rec.recordOf === recordOf) {
                this.cacheDel(_rec.id)
                this.add(recordOf, _rec.info, this.session.import(_rec.id))
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
    // private _recordOf: string
    // private CTRId: string
    protected _info: RecInfo
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
        this.MGRCTRID = mgrId
    }

    get mgrCTR() {
        return ctrMgr.get<RecordMgr<RecInfo>>(this.MGRCTRID)
    }
    get id(): string {
        return this._id
    }
    get info(): RecInfo {
        return this._info
    }
    set info(info: RecInfo) {
        this.mgrCTR.event.emit('edit', this._id)
        this._info = info
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
