import * as _ from 'lodash'

import { inputListenerOptions, CommandOptions } from './types'
import * as types from './types'
import * as telegram from './telegram'

export const getOptions = (
    defaultOptions: object,
    userDefinedOptions?: object
): object => {
    let _options = Object.assign({}, defaultOptions)
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

export const chat_permissions_unrestricted: telegram.ChatPermissions = {
    can_send_messages: true,
    can_send_media_messages: true,
    can_send_polls: true,
    can_send_other_messages: true,
    can_add_web_page_previews: true,
    can_change_info: true,
    can_invite_users: true,
    can_pin_messages: true,
}

export const chat_permissions_fully_restricted: telegram.ChatPermissions = {
    can_send_messages: false,
    can_send_media_messages: false,
    can_send_polls: false,
    can_send_other_messages: false,
    can_add_web_page_previews: false,
    can_change_info: false,
    can_invite_users: false,
    can_pin_messages: false,
}

const defaultInputListenerOptions = {
    application_name: types.appGlobal,
    link_chat_free: false,
    link_user_free: false,
    available_count: Infinity,
    pass_to_other_listener: true,
    pass_to_command: true,
    init_function: () => {},
    final_function: () => {},
} as inputListenerOptions

export const options_input_listener = (
    options?: inputListenerOptions
): inputListenerOptions => {
    const _options = getOptions(
        defaultInputListenerOptions,
        options
    ) as inputListenerOptions
    return _options
}

const defaultCommandOptions = {
    application_name: types.appGlobal,
    argument_check: [],
    argument_error_function: () => {},
    link_chat_free: false,
    link_user_free: false,
    filter: 'owner',
    filter_function: async () => true,
    description: 'undefined',
} as CommandOptions

export const options_command = (options?: CommandOptions): CommandOptions => {
    const _options = getOptions(
        defaultCommandOptions,
        options
    ) as CommandOptions
    return _options
}
