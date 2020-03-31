import { EventEmitter } from 'events'

type filterCallbackFn<T> = (item: T) => boolean

export class CTR<T> {
    private items: T[]
    protected readonly itemType: string = 'unknown'
    protected readonly idField: string = 'name'
    protected _event: EventEmitter

    constructor(private itemNew: new (...P: any[]) => T) {
        this.items = []
        this._event = new EventEmitter()
        this._event.emit('init')
    }
    
    get size(): number {
        return this.items.length
    }
    get list(): T[] {
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

    get(
        id: string | number,
        checkExist: boolean = true,
        checkDuplicate: boolean = false
    ): T | undefined {
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
    add(...P: any[]): T {
        const item = new this.itemNew(...P)
        this.get(item[this.idField], false, true)
        this.items.push(item)
        this._event.emit('add')
        return item
    }
    protected addItem(item: T): T {
        this.get(item[this.idField], false, true)
        this.items.push(item)
        this._event.emit('add')
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
        if (removed) this._event.emit('delete')
        return removed
    }

    filter(filters: filterCallbackFn<T>): T[]
    filter(
        filters: {
            [key in keyof T]?: T[key]
        }
    ): T[]
    filter(
        filters:
            | {
                  [key in keyof T]?: T[key]
              }
            | filterCallbackFn<T>
    ): T[] {
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
    map(callbackfn: (value?: T, index?: number, array?: T[]) => any): any[] {
        const _items = [...this.items]
        return _items.map(callbackfn)
    }
}
