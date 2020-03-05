import * as _ from 'lodash'

const idFormat = {
    ts_radix: 16,
    prefix_length_min: 1,
    prefix_length_max: 4,
    suffix_length_min: 10,
    suffix_length_max: 10,
    phrase_1_length: 6,
    phrase_2_length: 6,
    group_length: 10,
}

const idRegex = new RegExp(
    `((^\\w{${idFormat.prefix_length_min},${idFormat.prefix_length_max}})-|^)(\\w{1,${idFormat.phrase_1_length}})-([A-F\\d]{1,})-(\\w{1,${idFormat.phrase_1_length}})(-(\\w{${idFormat.suffix_length_min},${idFormat.suffix_length_max}})$|$)`,
    'gm'
)

export const genRandom = (length: number): string => {
    if (length < 1 || length > 10) {
        throw new RangeError()
    }
    return _.random(36 ** (length - 1), 36 ** length - 1).toString(36)
}

export const genId = (prefix?: string, suffix?: string) => {
    return `${prefix ? `${prefix}-` : ''}${genRandom(
        idFormat.phrase_1_length
    )}-${Date.now().toString(idFormat.ts_radix)}-${genRandom(
        idFormat.phrase_2_length
    )}${suffix ? `-${suffix}` : ''}`.toUpperCase()
}

interface IdInfo {
    match: boolean
    ts?: number
    prefix?: string
    suffix?: string
}

export const parseId = (id: string): IdInfo => {
    let _res = { match: false } as IdInfo
    const _regex = idRegex.exec(id)
    if (_regex === null) return _res
    _res.ts = parseInt(_regex[4], idFormat.ts_radix)
    _res.prefix = _regex[2]
    _res.suffix = _regex[7]
}

export class GroupId {
    private readonly _group: string
    private readonly _prefix?: string
    constructor(prefix?: string) {
        this._group = genRandom(idFormat.group_length)
        this._prefix = prefix
    }
    public genId(): string {
        return genId(this._prefix, this._group)
    }
}
