import * as _ from 'lodash'

import {
    Application,
    ApplicationOptions,
    ApplicationOptionsInput,
    getApplication,
    CommandOptions,
    CommandOptionsInput,
    inputListenerOptions,
    inputListenerOptionsInput,
    TaskOptions,
    TaskOptionsInput,
} from './types'
import { ActionOptions, ActionOptionsInput } from './types'
import * as types from './types'
import * as telegram from './telegram'

const getOptions = (
    defaultOptions: object,
    userDefinedOptions?: object
): object => {
    let _options = Object.assign({}, defaultOptions)
    if (typeof userDefinedOptions === 'undefined') {
        userDefinedOptions = {}
    } else if (
        typeof userDefinedOptions !== 'object' ||
        userDefinedOptions === null ||
        Array.isArray(userDefinedOptions)
    ) {
        throw new TypeError('Input options should be an object or undefined')
    }
    for (const option in _options) {
        _options[option] =
            userDefinedOptions[option] !== undefined
                ? userDefinedOptions[option]
                : _options[option]
    }
    return _options
}

export const getOptionsWithAppDefault = (
    inputOptions:
        | CommandOptionsInput
        | inputListenerOptionsInput
        | TaskOptionsInput
        | undefined,
    defaultOptions: CommandOptions | inputListenerOptions | TaskOptions,
    getApplication: getApplication
): CommandOptions | inputListenerOptions | TaskOptions => {
    let _options = Object.assign({}, defaultOptions)
    if (typeof inputOptions === 'undefined') {
        inputOptions = {}
    } else if (
        typeof inputOptions !== 'object' ||
        inputOptions === null ||
        Array.isArray(inputOptions)
    ) {
        throw new TypeError('Input options should be an object or undefined')
    }
    const app = getApplication(
        inputOptions.application_name || defaultOptions.application_name,
        true,
        false
    )
    _options = {
        ..._options,
        link_chat_free: app.link_chat_free,
        link_user_free: app.link_user_free,
    }
    for (const option in _options) {
        _options[option] =
            inputOptions[option] !== undefined
                ? inputOptions[option]
                : _options[option]
    }
    return _options
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

const defaultApplicationOptions = {
    priority: -Infinity,
    final_app: false,
    is_group_need_bind: true,
    link_chat_free: false,
    link_user_free: false,
} as ApplicationOptions

export const options_application = (
    options: ApplicationOptionsInput | undefined
): ApplicationOptions => {
    const _options = getOptions(
        options,
        defaultApplicationOptions
    ) as ApplicationOptions
    return _options
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
    options: inputListenerOptionsInput | undefined,
    getApplication: getApplication
): inputListenerOptions => {
    const _options = getOptionsWithAppDefault(
        options,
        defaultInputListenerOptions,
        getApplication
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
    options: CommandOptionsInput | undefined,
    getApplication: getApplication
): CommandOptions => {
    const _options = getOptionsWithAppDefault(
        options,
        defaultCommandOptions,
        getApplication
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

export const options_task = (
    options: TaskOptionsInput | undefined,
    getApplication: getApplication
): TaskOptions => {
    const _options = getOptionsWithAppDefault(
        options,
        defaultTaskOptions,
        getApplication
    ) as TaskOptions
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
