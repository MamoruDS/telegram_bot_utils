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
    readonly all_members_are_administrators?: boolean
}

type tgThumb = {
    file_id: string
    file_unique_id: string
    file_size: number
    width: number
    height: number
}

interface messageTgFile {
    readonly file_id: string
    readonly file_unique_id: string
    readonly file_size: number
}

interface messageMedia extends messageTgFile {
    readonly width: number
    readonly height: number
    readonly thumb: tgThumb
}

interface messageSticker extends messageMedia {
    readonly emoji?: string
    readonly set_name: string
    readonly is_animated: boolean
}

interface messagePhotoSized extends messageMedia {
    readonly width: number
    readonly height: number
}

type messagePhoto = messagePhotoSized[]

interface messageVideo extends messageMedia {
    readonly mime_type: string | 'video/mp4'
    readonly duration: number
}

interface messageAnimation extends messageMedia {
    readonly file_name: string
    readonly mime_type: string | 'video/mp4'
    readonly duration: number
}

interface messageVoice extends messageTgFile {
    readonly duration: number
    readonly mime_type: string | 'audio/ogg'
}

interface messageDocument extends messageTgFile {
    readonly file_name: string
    readonly mime_type: string
    readonly thumb?: tgThumb
}

interface messageVideoNote extends messageTgFile {
    readonly file_name: string
    readonly mime_type: string
    readonly length: number
    readonly duration: number
    readonly thumb: tgThumb
}

type timestamp = number

interface message {
    from: messageFrom
    forward_sender_name?: string
    forward_from?: messageFrom
    forward_data?: timestamp
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
    animation?: messageAnimation
    voice?: messageVoice
    reply_to_message?: {}
}

interface messageCommon extends message, messageBasic {}

interface messageCallback extends message {
    id: string
    message: messageBasic
    chat_instance: string
    data: string
}

type cacheKey = string

interface messageInfo {
    isMsgText: boolean
    isMsgSticker: boolean
    isPrivate: boolean
    isGroup: boolean
    isCallback: boolean
    callback: {
        submitData: cacheKey
        submitId: string | number
    }
}

export const msgInfo = (msg: object): messageInfo => {
    let msgInfo = {} as messageInfo
    let _message = {} as messageCommon
    msgInfo.isCallback = isCallback(msg)
    if (isCallback) {
        const _msg = msg as messageCallback
        msgInfo.callback.submitData = _msg.data
        msgInfo.callback.submitId = _msg.from.id
        _message = Object.assign(_message, _msg.message)
    } else {
        _message = Object.assign(_message, msg)
    }
    msgInfo.isPrivate = isPrivateMsg(_message)
    return msgInfo
}

const isPrivateMsg = (msg: messageCommon): boolean => {
    return msg.chat.type === 'private'
}

const isGroupMsg = (msg: messageCommon): boolean => {
    return msg.chat.type === 'group'
}

const isCallback = (msg: object): boolean => {
    if (msg.hasOwnProperty('message')) {
        return true
    } else {
        return false
    }
}
