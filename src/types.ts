import * as tgTypes from './tgTypes'

type CommandFilter = 'public' | 'registered' | 'owner' | 'function'

export interface Command {
    command_string: string
    command_function: (
        args: string[],
        msg: tgTypes.Message,
        data: { get: () => object; set: (data: object) => any }
    ) => any
    application?: string | '_global'
    filter: CommandFilter
    filter_function?: (msg: tgTypes.Message) => boolean
    description?: string
}

export interface CommandInfo {
    command_string: string
    application: string
    filter: CommandFilter
    description: string
}

export interface CommandOptions {
    application: string | '_global'
    filter: 'public' | 'registered' | 'owner'
    filter_function: (msg: tgTypes.Message) => boolean
    description: string
}

export interface Application {
    name: string
    priority: number
    final_app: boolean
}

export type Infinity = number

export interface PasCmdMsgListener {
    chat_id: number
    user_id: number
    verify_function: (chatId: number, userId: number) => boolean
    error_message?: (availableCount: number | Infinity) => string
    error_message_reply?: boolean
    available_count?: number
}

type Timestamp = number

export interface Timers {
    [timerId: string]: {
        action: string
        start_timestamp: Timestamp
    }
}

export interface inlineKeyboard {
    text: string
    url?: string
    callback_data?: string
    switch_inline_query?: string
    switch_inline_query_current_chat?: string
}

export interface applicationDataMan {
    get: (path?: string[]) => object
    set: (data: object, path?: string[]) => any
}

export interface applicationData {
    binds: bind[]
    userData: applicationUserData[]
}

export interface bind {
    chat_id: number
}

export interface applicationUserData {
    id: string
    chat_id: number
    user_id: number
    data: object
}

export interface inputListener {
    id: string
    chat_id: number
    user_id: number
    application: string
    listener: (msg: tgTypes.Message, data: applicationDataMan) => boolean
    available_count: number
    final_listener: boolean
    init_function?: (
        chatId: number,
        userId: number,
        data: applicationDataMan
    ) => any
    final_function?: (
        chatId: number,
        userId: number,
        data: applicationDataMan
    ) => any
}

export interface inputListenerOptions {
    available_count?: number | Infinity
    final_listener?: boolean
    init_function?: (
        chatId: number,
        userId: number,
        data: applicationDataMan
    ) => any
    final_function?: (
        chatId: number,
        userId: number,
        data: applicationDataMan
    ) => any
}
