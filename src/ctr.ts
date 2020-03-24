export class CTR<T> {
    protected items: T[]
    protected readonly idField: string = 'name'
    constructor() {
        this.items = []
    }
    get size(): number {
        return this.items.length
    }
    get list(): T[] {
        return this.items.map(v => {
            return v[this.idField]
        })
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
            throw new RangeError('Item not exist')
        } else {
            return undefined
        }
    }
    protected _add(item: any): void {
        this.get(item[this.idField], false, true)
        this.items.push(item)
    }
    protected _default = () => {}
}
