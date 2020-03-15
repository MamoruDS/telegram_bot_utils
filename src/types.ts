import * as telegram from './telegram'

export const linkFree = 0
type LinkFree = 0

export const appGlobal = '_global'
type AppGlobal = '_global'

export type Infinity = number
type timestamp = number

export interface Application {
    name: string
    priority: number
    final_app: boolean
    is_group_need_bind: boolean
    link_chat_free: boolean
    link_user_free: boolean
}

export interface ApplicationOptions {
    priority: number
    final_app: boolean
    is_group_need_bind: boolean
    link_chat_free: boolean
    link_user_free: boolean
}

export interface ApplicationOptionsInput {
    priority?: number
    final_app?: boolean
    is_group_need_bind?: boolean
    link_chat_free?: boolean
    link_user_free?: boolean
}

export type getApplication = (
    name: string,
    checkExist?: boolean,
    checkDuplicate?: boolean
) => Application

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

export interface Action {
    name: string
    action_exec: (
        callbackData: any,
        triggerMessage: telegram.Message,
        data: applicationDataMan
    ) => void
    application_name: string
    link_chat_free: boolean
    link_user_free: boolean
    group_clean: boolean
}

export interface ActionOptions {
    application_name: string | AppGlobal
    link_chat_free: boolean
    link_user_free: boolean
    group_clean: boolean
}

export interface ActionOptionsInput {
    application_name?: string
    link_chat_free?: boolean
    link_user_free?: boolean
    group_clean?: boolean
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
        data: applicationDataMan
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
    listener: (
        msg: telegram.Message,
        data: applicationDataMan
    ) => Promise<boolean>
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
    available_count: number | Infinity
    pass_to_other_listener: boolean
    pass_to_command: boolean
    init_function: listenerAutoFunc
    final_function: listenerAutoFunc
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
        description: string
        start_timestamp: timestamp
    }
}

export type TaskAction = (
    taskRecord: TaskRecord,
    taskRecordMan: TaskRecordMan,
    userData: applicationDataMan
) => void

export type TaskTimeoutAction = (
    taskRecord: TaskRecord,
    taskRecordMan: TaskRecordMan,
    userData: applicationDataMan
) => Promise<void>

export const importPolicies = [
    'curr-ignore',
    'curr-restart',
    'curr-redo',
    'next-ignore',
    'next-restart',
]

export type ImportPolicy =
    | 'curr-ignore'
    | 'curr-restart'
    | 'curr-redo'
    | 'next-ignore'
    | 'next-restart'

export interface Task {
    name: string
    action: TaskAction
    interval: number
    execution_counts: number | Infinity
    description: string
    application_name: string | AppGlobal
    link_chat_free: boolean
    link_user_free: boolean
    import_policy: ImportPolicy
    timeout: number
    timeout_action: TaskTimeoutAction
}

export interface TaskRecord {
    id: string
    vk?: string
    task_name: string
    chat_id: number
    user_id: number
    start: timestamp
    next: timestamp
    executed: number
    locked?: true
    expired?: true
}

export interface TaskOptions {
    description: string
    application_name: string | AppGlobal
    link_chat_free: boolean
    link_user_free: boolean
    timeout: number
    import_policy: ImportPolicy
    timeout_action: TaskTimeoutAction
}

export interface TaskOptionsInput {
    description?: string
    application_name?: string | AppGlobal
    link_chat_free?: boolean
    link_user_free?: boolean
    timeout?: number
    import_policy?: ImportPolicy
    timeout_action?: TaskTimeoutAction
}

export interface TaskRecordMan {
    kill: () => void
    resetTimer: (manualTimer?: number) => void
}

export const maxInlineWidth = 16

export interface inlineKeyboardButton {
    text: string
    url?: string
    url_redir?: boolean
    callback_data?: any
    switch_inline_query?: string
    switch_inline_query_current_chat?: string
    keyboard_row_full_width?: boolean
    keyboard_row_auto_append?: boolean
    keyboard_row_force_append?: boolean
    keyboard_row_force_append_row_num?: number
}

export type callbackData = any | CallbackDataDefined

export interface CallbackDataDefined {
    action_name: string
    user_id: number
    data: any
    is_defined_data: true
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
        // this.name = 'Error'
        this.errCode = errCode
    }
}
