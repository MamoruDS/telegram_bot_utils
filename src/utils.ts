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

const regStr = `((^\\w{${idFormat.prefix_length_min},${idFormat.prefix_length_max}})-|^)((\\w{1,${idFormat.phrase_1_length}})-([A-F\\d]{1,})-(\\w{1,${idFormat.phrase_1_length}}))(-(\\w{${idFormat.suffix_length_min},${idFormat.suffix_length_max}})$|$)`

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

export interface IdInfo {
    match: boolean
    body?: string
    ts?: number
    prefix?: string
    suffix?: string
}

export const parseId = (id: string): IdInfo => {
    let _res = { match: false } as IdInfo
    const _regex = new RegExp(regStr, 'gm').exec(id)
    if (_regex === null) return _res
    _res.match = true
    _res.body = _regex[3]
    _res.ts = parseInt(_regex[4], idFormat.ts_radix)
    _res.prefix = _regex[2]
    _res.suffix = _regex[8]
    return _res
}

export class GroupId {
    private readonly _prefix?: string
    public readonly group: string
    constructor(prefix?: string) {
        this.group = genRandom(idFormat.group_length).toUpperCase()
        this._prefix = prefix
    }
    public genId(): string {
        return genId(this._prefix, this.group)
    }
    public isMember(id: string): boolean {
        const idInfo = parseId(id)
        if (idInfo.match) {
            return idInfo.suffix === this.group
        } else {
            return false
        }
    }
    public import(id: string): string {
        const idInfo = parseId(id)
        if (!idInfo.match) {
            return undefined
        }
        return `${this._prefix}-${idInfo.body}-${this.group}`.toUpperCase()
    }
}

export const wait = async (timeout: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, timeout)
    })
}

export const copy = <T>(source: T): T => {
    if (source === null) return source
    if (Array.isArray(source)) {
        const _t = [] as any[]
        source.map((v) => {
            _t.push(copy(v))
        })
        return _t as any
    }
    if (typeof source === 'object') {
        if (source.constructor.name !== 'Object') {
            return source
        }
        const _t = {} as T
        for (const key of Object.keys(source)) {
            _t[key] = copy(source[key])
        }
        return _t
    }
    return source
}

export const compObjCopy = <T extends object>(source: object): T => {
    if (typeof source != 'object' || source === null || Array.isArray(source)) {
        throw new TypeError()
    }
    if (source == {}) {
        return {} as T
    }
    const _t = {} as T
    for (const key of Object.keys(source)) {
        _t[key] = copy(source[key])
    }
    return _t
}

type Optional<T extends object> = {
    [key in keyof T]?: T[key] extends object ? Optional<T[key]> : T[key]
}

export const assignDefault = <T extends object>(
    defaultOptions: Required<T>,
    inputOptions: Optional<T>
): Required<T> => {
    if (
        typeof inputOptions !== 'object' ||
        inputOptions === null ||
        Array.isArray(inputOptions)
    ) {
        throw new TypeError('Input options expect an object to be entered')
    }
    const _options = copy(defaultOptions)
    assign(_options, inputOptions)
    return _options
}

const assign = <T extends object>(
    target: Required<T>,
    input: Optional<T>,
    assignExistOnly?: boolean
): void => {
    for (const key of Object.keys(target)) {
        const _val = input[key]
        if (typeof _val != 'undefined') {
            if (_val == null) {
                target[key] = null
                continue
            }
            if (Array.isArray(_val)) {
                for (const i in target[key]) {
                    const __val = _val[i]
                    if (typeof __val == 'undefined') continue
                    if (
                        typeof target[key][i] == 'object' &&
                        !Array.isArray(target) &&
                        target != null
                    ) {
                        assign(target[key][i], _val[i])
                    } else {
                        target[key][i] = __val
                    }
                }
                continue
            }
            if (typeof _val == 'object' && _val != {}) {
                assign(target[key], _val)
                continue
            }
            target[key] = _val
            continue
        }
    }
    for (const key of Object.keys(input)) {
        if (typeof target[key] == 'undefined' && !assignExistOnly) {
            target[key] = copy(input[key])
        }
    }
}
