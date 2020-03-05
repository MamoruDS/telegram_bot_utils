import * as _ from 'lodash'

export const genRandom = (
    length: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
): string => {
    return _.random(36 ** (length - 1), 36 ** length - 1).toString(36)
}

export const genId = (prefix?: string, suffix?: string) => {
    return `${prefix ? `${prefix}-` : ''}${genRandom(6)}-${Date.now().toString(
        16
    )}-${genRandom(6)}${suffix ? `-${suffix}` : ''}`.toUpperCase()
}

export class GroupId {
    private readonly _group: string
    private readonly _prefix?: string
    constructor(prefix?: string) {
        this._group = genRandom(10)
        this._prefix = prefix
    }
    public genId(): string {
        return genId(this._prefix, this._group)
    }
}
