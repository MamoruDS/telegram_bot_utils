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

export interface CommandInput {
    application: string | '_global'
    filter: 'public' | 'registered' | 'owner'
    filterFunction: (msg: tgTypes.Message) => boolean
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
