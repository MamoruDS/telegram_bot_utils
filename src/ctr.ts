import { EventEmitter } from 'events'
import { genId } from './utils'

class CTRMgr {
    private CTRs: {
        [key: string]: CTR<any, AnyCtor<any>>
    }
    constructor() {
        this.CTRs = Object.assign({})
    }

    add<T>(id: string, CTR: CTR<T, AnyCtor<T>>): CTR<T, AnyCtor<T>> {
        this.CTRs[id] = CTR
        return CTR
    }
    get<T>(id: string): CTR<T, AnyCtor<any>> {
        return this.CTRs[id]
    }
}

export const ctrMgr = new CTRMgr()

type filterCallbackFn<T> = (item: T) => boolean

export interface AnyCtor<T> {
    new (...P: any[]): T
}

export class CTR<
    ItemType,
    // ItemCtor extends AnyCtor<ItemType> = AnyCtor<ItemType>
    ItemCtor extends AnyCtor<ItemType>
> {
    private readonly UID: string
    private items: ItemType[]
    private newItem: ItemCtor
    protected readonly itemType: string = 'unknown'
    protected readonly idField: string = 'name'
    protected _event: EventEmitter

    constructor(typeClass: ItemCtor) {
        this.UID = genId('CTR')
        this.newItem = typeClass
        ctrMgr.add<ItemType>(this.UID, this)
        this.items = []
        this._event = new EventEmitter()
        this._event.emit('init')
    }

    get CTRUID(): string {
        return this.UID
    }
    get size(): number {
        return this.items.length
    }
    get list(): ItemType[] {
        return this.items.map(v => {
            return v[this.idField]
        })
    }
    get type(): string {
        return this.itemType
    }
    get event(): EventEmitter {
        return this._event
    }

    getCTR<C>(id: string): CTR<C, AnyCtor<C>> {
        return ctrMgr.get<C>(id)
    }
    get(
        id: string | number,
        checkExist: boolean = true,
        checkDuplicate: boolean = false
    ): ItemType | undefined {
        for (const item of this.items) {
            if (item[this.idField] === id) {
                if (checkDuplicate) {
                    throw new RangeError('Duplicate item')
                } else {
                    return item
                }
            }
        }
        if (checkExist) {
            throw new RangeError(
                `Item not exist, failed to find "${id}" in <${this.itemType}>`
            )
        } else {
            return undefined
        }
    }
    add(...P: ConstructorParameters<ItemCtor>): ItemType {
        
        const item = new this.newItem(...P)
        return this.addItem(item)
    }
    protected addItem(item: ItemType): ItemType {
        this.get(item[this.idField], false, true)
        this.items.push(item)
        this._event.emit('add', item[this.idField])
        return item
    }
    delete(id: string | number): boolean {
        let removed = false
        this.items = this.items.filter(item => {
            if (item[this.idField] === id) {
                removed = true
                return false
            }
            return true
        })
        if (removed) this._event.emit('delete', id)
        return removed
    }

    filter(filters: filterCallbackFn<ItemType>): ItemType[]
    filter(
        filters: {
            [key in keyof ItemType]?: ItemType[key]
        }
    ): ItemType[]
    filter(
        filters:
            | {
                  [key in keyof ItemType]?: ItemType[key]
              }
            | filterCallbackFn<ItemType>
    ): ItemType[] {
        const _items = [...this.items]
        if (typeof filters === 'object') {
            return _items.filter(item => {
                for (const key of Object.keys(filters)) {
                    if (item[key] !== filters[key]) return false
                }
                return true
            })
        }
        if (typeof filters === 'function') {
            return _items.filter(item => {
                return filters(item)
            })
        }
    }
    map(
        callbackfn: (
            value?: ItemType,
            index?: number,
            array?: ItemType[]
        ) => any
    ): any[] {
        const _items = [...this.items]
        return _items.map(callbackfn)
    }
}
