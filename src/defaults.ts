import * as _ from 'lodash'

export const getOptions = (
    defaultOptions: object,
    userDefinedOptions?: object
): object => {
    let _options = defaultOptions
    if (userDefinedOptions === undefined) {
        return _options
    } else {
        for (const option in _options) {
            _options[option] =
                userDefinedOptions[option] !== undefined
                    ? userDefinedOptions[option]
                    : _options[option]
        }
        return _options
    }
}
