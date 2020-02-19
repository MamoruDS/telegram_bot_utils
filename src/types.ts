interface messageFrom {
    readonly id: number
    readonly is_bot: boolean
    readonly first_name?: string
    readonly last_name?: string
    readonly username?: string
    readonly language_code?: string
}

interface messageChat {
    readonly id: number
    readonly first_name?: string
    readonly last_name?: string
    readonly username?: string
    readonly title?: string
    readonly type: 'group' | 'private'
}

interface messageSticker {
    readonly width: number
    readonly height: number
    readonly emoji?: string
    readonly set_name: string
    readonly is_animated: boolean
    readonly thumb: {
        file_id: string
        file_unique_id: string
        file_size: number
        width: number
        height: number
    }
}

type timestamp = number

interface message {
    from: messageFrom
    reply_to_message?: {}
    new_chat_participant?: {}
    new_chat_member?: {}
    new_chat_members?: {}
}

interface messageBasic extends message {
    message_id: number
    chat: messageChat
    date: timestamp
    text?: string
    sticker?: messageSticker
    reply_to_message?: {}
}

interface messageCommon extends message, messageBasic {}

interface messageCallback extends message {
    id: string
    message: messageBasic
    chat_instance: string
    data: string
}

export const msgType = msg => {}

export const isPrivateMsg = msg => {}

export const isGroupMsg = msg => {}
