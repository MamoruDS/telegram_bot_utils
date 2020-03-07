import * as telegram from './telegram'

export const linkFree = 0
type LinkFree = 0

export const appGlobal = '_global'
type AppGlobal = '_global'

export type Infinity = number
type Timestamp = number

export interface Application {
    name: string
    priority: number
    final_app: boolean
}

export interface applicationUserData {
    id: string
    chat_id: number
    user_id: number
    data: object
}

export interface applicationDataMan {
    get: (path?: string[]) => object
    set: (data: object, path?: string[]) => any
}

export type dataLink = {
    chat_id: number | LinkFree
    user_id: number | LinkFree
}

export type dataLinkLess = {
    chat_id?: number | LinkFree
    user_id?: number | LinkFree
}

type CommandFilter = 'public' | 'registered' | 'owner' | 'function'

export interface ArgumentCheck {
    type: 'string' | 'integer' | 'float' | 'boolean'
    default_value?: string | number | boolean
    range?: any[] | 'function'
    range_function?: (arg: any) => Promise<boolean> | Promise<Error>
}

export interface Command {
    command_string: string
    command_function: (
        args: string[],
        msg: telegram.Message,
        data: { get: () => object; set: (data: object) => any }
    ) => any
    application_name?: string | AppGlobal
    argument_check: ArgumentCheck[]
    argument_error_function: (msg: telegram.Message, err: Error) => any
    link_chat_free: boolean
    link_user_free: boolean
    filter: CommandFilter
    filter_function?: (msg: telegram.Message) => Promise<boolean>
    description?: string
}

export interface CommandInfo {
    command_string: string
    application_name: string
    filter: CommandFilter
    description: string
}

export interface CommandOptions {
    application_name: string | AppGlobal
    argument_check: ArgumentCheck[]
    argument_error_function: (msg: telegram.Message, err: Error) => any
    link_chat_free: boolean
    link_user_free: boolean
    filter: CommandFilter
    filter_function: (msg: telegram.Message) => Promise<boolean>
    description: string
}

export interface CommandOptionsInput {
    application_name?: string | AppGlobal
    argument_check?: ArgumentCheck[]
    argument_error_function?: (msg: telegram.Message, err: Error) => any
    link_chat_free?: boolean
    link_user_free?: boolean
    filter?: CommandFilter
    filter_function?: (msg: telegram.Message) => Promise<boolean>
    description?: string
}

export interface PasCmdMsgListener {
    chat_id: number
    user_id: number
    verify_function: (chatId: number, userId: number) => boolean
    error_message?: (availableCount: number | Infinity) => string
    error_message_reply?: boolean
    available_count?: number
}

type listenerAutoFunc = (
    chat: telegram.Chat,
    user: telegram.User,
    data: applicationDataMan
) => any

export interface inputListener {
    id: string
    chat_id: number
    user_id: number
    listener: (msg: telegram.Message, data: applicationDataMan) => boolean
    application_name: string | AppGlobal
    link_chat_free: boolean
    link_user_free: boolean
    available_count: number
    pass_to_other_listener: boolean
    pass_to_command: boolean
    init_function: listenerAutoFunc
    final_function: listenerAutoFunc
}

export interface inputListenerOptions {
    application_name: string | AppGlobal
    link_chat_free: boolean
    link_user_free: boolean
    available_count?: number | Infinity
    pass_to_other_listener?: boolean
    pass_to_command?: boolean
    init_function?: listenerAutoFunc
    final_function?: listenerAutoFunc
}

export interface inputListenerOptionsInput {
    application_name?: string | AppGlobal
    link_chat_free?: boolean
    link_user_free?: boolean
    available_count?: number | Infinity
    pass_to_other_listener?: boolean
    pass_to_command?: boolean
    init_function?: listenerAutoFunc
    final_function?: listenerAutoFunc
}

export interface Timers {
    [timerId: string]: {
        action: string
        start_timestamp: Timestamp
    }
}

export const maxInlineWidth = 20

export interface inlineKeyboardButton {
    text: string
    url?: string
    url_redir?: boolean
    callback_data?: any
    switch_inline_query?: string
    switch_inline_query_current_chat?: string
    keyboard_row_full_width?: boolean
    keyboard_row_auto_append?: boolean
}

export type callbackData = any | CallbackDataDefined

interface CallbackDataDefined {
    is_defined_data: true
    application_name: string
    action_name: string
    data: any
}

type ArgumentRequiredError = 0
type ArgumentParseError = 1
type ArgumentRangeError = 2
export const BotUtilsError = {
    ArgumentRequiredError: 0,
    ArgumentParseError: 1,
    ArgumentRangeError: 2,
}

export type ErrorType = number

export interface ERR {
    error_type: ErrorType
    error_message?: string
}

export class ArgumentTypeError extends Error {
    public errCode: number
    constructor(errCode, msg) {
        super(msg)
        // this.name = 'wtfError'
        this.errCode = errCode
    }
}
