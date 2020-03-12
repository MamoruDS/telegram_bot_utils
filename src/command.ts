// import * as types from './types'
import { ArgumentCheck, ERR, BotUtilsError } from './types'

export const cmdMatch = (input: string): string[] | null => {
    const regex = new RegExp(
        `(^\\/([\\w|_|\\-|\\.]{1,})(?=$|\\s))|([^\\s]{1,})`,
        'g'
    )
    let result = regex.exec(input)
    /**
     * result [0] -> input
     * result [1] -> group_1 \/cmd\s
     * result [2] -> group_2 cmd
     * result [3] -> group_3 args
     */
    let args = []
    args.push(result ? result[2] : undefined)
    if (args[0] !== undefined) {
        while ((result = regex.exec(input)) !== null) args.push(result[3])
        return args
    } else {
        return null
    }
}

export const argumentCheck = async (
    args: string[],
    checker: ArgumentCheck[]
): Promise<any[]> => {
    let _args = [...args]
    for (const i of Array(checker.length).keys()) {
        const indexFixed = i + 1
        let _arg: any = _args[indexFixed]
        if (_arg === undefined) {
            const _defaultValue = checker[i].default_value
            if (_defaultValue === undefined) {
                // const err: ERR = {
                // error_type: BotUtilsError.ArgumentUndefined,
                // }
                // TODO: error adv
                throw new TypeError(
                    `Required argument (args[${indexFixed}]) do not exist.`
                )
            } else {
                _arg = _defaultValue
            }
        } else {
            const _type = checker[i].type
            if (_type === 'string') {
                // pass
            } else if (_type === 'integer') {
                _arg = parseInt(Number(_arg).toString())
                _arg = isNaN(_arg) ? undefined : _arg
            } else if (_type === 'float') {
                _arg = parseFloat(Number(_arg).toString())
                _arg = isNaN(_arg) ? undefined : _arg
            } else if (_type === 'boolean') {
                _arg = _arg.toLowerCase()
                if (_arg === 'true') {
                    _arg = true
                } else if (_arg === 'false') {
                    _arg = false
                } else {
                    _arg = undefined
                }
            } else {
                _arg = undefined
            }
            if (typeof _arg === 'undefined')
                throw new TypeError(
                    `Cannot parse given argument (args[${indexFixed}]="${args[indexFixed]}") to the type required.`
                )
            const _range = checker[i].range
            if (_range !== undefined) {
                if (_range === 'function') {
                    if (!(await checker[i].range_function(_arg)))
                        throw new RangeError()
                } else if (_range.length !== 0) {
                    if (_range.indexOf(_arg) === -1)
                        throw new RangeError(
                            `Given argument (args[${indexFixed}]="${args[indexFixed]}") out of range.`
                        )
                }
            }
        }
        _args[indexFixed] = _arg
    }
    return _args
}
