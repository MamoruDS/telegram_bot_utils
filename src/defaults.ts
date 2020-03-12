import * as _ from 'lodash'

import { inputListenerOptions, inputListenerOptionsInput } from './types'
import { CommandOptions, CommandOptionsInput } from './types'
import { TaskOptions, TaskOptionsInput } from './types'
import { ActionOptions, ActionOptionsInput } from './types'
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
    options?: inputListenerOptionsInput
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

export const options_command = (
    options?: CommandOptionsInput
): CommandOptions => {
    const _options = getOptions(
        defaultCommandOptions,
        options
    ) as CommandOptions
    return _options
}

const defaultTaskOptions = {
    description: 'USER DEFINED TASK',
    application_name: types.appGlobal,
    link_chat_free: false,
    link_user_free: false,
    import_policy: 'next-ignore',
    timeout: 300,
    timeout_action: async () => {},
} as TaskOptions

export const options_task = (options?: TaskOptionsInput): TaskOptions => {
    const _options = getOptions(defaultTaskOptions, options) as TaskOptions
    return _options
}

const defaultActionOptions = {
    application_name: types.appGlobal,
    link_chat_free: false,
    link_user_free: false,
    group_clean: false,
} as ActionOptions

export const options_action = (options?: ActionOptionsInput): ActionOptions => {
    const _options = getOptions(defaultActionOptions, options) as ActionOptions
    return _options
}
