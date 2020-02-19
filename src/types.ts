interface tgUser {
    readonly id: number
    readonly is_bot: boolean
    readonly first_name?: string
    readonly last_name?: string
    readonly username?: string
}

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

interface messageAudio extends messageTgFile {
    readonly duration: number
    readonly mime_type: string | 'audio/acc'
    readonly title?: string
    readonly performer?: string
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

interface messagePoll {
    readonly id: string
    readonly question: string
    readonly options: object[]
    readonly total_voter_count: number
    readonly is_closed: boolean
    readonly is_anonymous: boolean
    readonly type: 'regular' | 'quiz'
    readonly allows_multiple_answers: boolean
}

interface messageLocation {
    readonly latidude: number
    readonly longitude: number
}

interface messageContact {
    readonly user_id: number
    readonly phone_number?: string
    readonly first_name?: string
    readonly last_name?: string
}

type timestamp = number

interface message {
    readonly from: messageFrom
    readonly forward_sender_name?: string
    readonly forward_from?: messageFrom
    readonly forward_data?: timestamp
    readonly reply_to_message?: messageCommon
    readonly new_chat_participant?: {}
    readonly new_chat_member?: {}
    readonly new_chat_members?: {}
}

type textEntity = {
    readonly offset: number
    readonly length: number
    readonly type:
        | 'url'
        | 'mention'
        | 'text_mention'
        | 'bold'
        | 'italic'
        | 'code'
    readonly user?: tgUser
}

interface messageBasic extends message {
    readonly message_id: number
    readonly chat: messageChat
    readonly date: timestamp
    readonly text?: string
    readonly entities?: textEntity[]
    readonly photo?: messagePhoto
    readonly sticker?: messageSticker
    readonly animation?: messageAnimation
    readonly audio?: messageAudio
    readonly voice?: messageVoice
    readonly video?: messageVideo
    readonly video_note?: messageVideoNote
    readonly document?: messageDocument
    readonly caption?: string
    readonly caption_entities?: textEntity[]
    readonly poll?: messagePoll
    readonly location?: messageLocation
    readonly contact?: messageContact
}

interface messageCommon extends message, messageBasic {}

interface messageCallback extends message {
    readonly id: string
    readonly message: messageBasic
    readonly chat_instance: string
    readonly data: string
}

type cacheKey = string

interface messageInfo {
    isMsgWithText: boolean
    isMsgWithPhoto: boolean
    isMsgWithSticker: boolean
    isMsgWithAnimation: boolean
    isMsgWithAudio: boolean
    isMsgWithVoice: boolean
    isMsgWithVideo: boolean
    isMsgWithVideoNote: boolean
    isMsgWithDocument: boolean
    isMsgWithCaption: boolean
    isPoll: boolean
    isLocation: boolean
    isContact: boolean
    isChatPrivate: boolean
    isChatGroup: boolean
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
    msgInfo.isChatPrivate = isPrivateMsg(_message)
    msgInfo.isChatGroup = isGroupMsg(_message)
    return msgInfo
}

const isPrivateMsg = (msg: messageCommon): boolean => {
    return msg.chat.type === 'private'
}

const isGroupMsg = (msg: messageCommon): boolean => {
    return msg.chat.type === 'group'
}

const isCallback = (msg: object): boolean => {
    return msg.hasOwnProperty('message')
}
