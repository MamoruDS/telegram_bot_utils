type Integer = number
type Float = number

// https://core.telegram.org/bots/api#user
interface User {
    readonly id: Integer
    readonly is_bot: boolean
    readonly first_name: string
    readonly last_name?: string
    readonly username?: string
    readonly language_code?: string
    readonly can_join_groups?: boolean
    readonly can_read_all_group_messages?: boolean
    readonly supports_inline_queries?: boolean
}

// https://core.telegram.org/bots/api#chat
interface Chat {
    readonly id: Integer
    readonly type: string
    readonly title?: string
    readonly username?: string
    readonly first_name?: string
    readonly last_name?: string
    readonly photo?: ChatPhoto
    readonly description?: string
    readonly invite_link?: string
    readonly pinned_message?: Message
    readonly permissions?: ChatPermissions
    readonly slow_mode_delay?: Integer
    readonly sticker_set_name?: string
    readonly can_set_sticker_set: boolean
}

// https://core.telegram.org/bots/api#message
interface Message {
    readonly message_id: Integer
    readonly from?: User
    readonly date: Integer
    readonly chat: Chat
    readonly forward_from?: User
    readonly forward_from_chat?: Chat
    readonly forward_from_message_id?: Integer
    readonly forward_signature?: string
    readonly forward_sender_name?: string
    readonly forward_data?: Integer
    readonly reply_to_message?: Message
    readonly edit_date?: Integer
    readonly media_group_id?: string
    readonly author_signature?: string
    readonly text?: string
    readonly entities?: MessageEntity[]
    readonly caption_entities?: MessageEntity[]
    readonly audio?: Audio
    readonly document?: Document
    readonly animation?: Animation
    readonly game?: Game
    readonly photo?: PhotoSize[]
    readonly sticker?: Sticker
    readonly video?: Video
    readonly voice?: Voice
    readonly video_note?: VideoNote
    readonly caption?: string
    readonly contact?: Contact
    readonly location?: Location
    readonly venue?: Venue
    readonly poll?: Poll
    readonly new_chat_members?: User[]
    readonly left_chat_member?: User
    readonly new_chat_title?: string
    readonly new_chat_photo?: PhotoSize[]
    readonly delete_chat_photo?: true
    readonly group_chat_created?: true
    readonly supergroup_chat_created?: true
    readonly channel_chat_created: true
    readonly migrate_to_chat_id?: Integer
    readonly migrate_from_chat_id?: Integer
    readonly pinned_message?: Message
    readonly invoice?: Invoice
    readonly successful_payment?: SuccessfulPayment
    readonly connected_website?: string
    readonly passport_data?: PassportData
    readonly reply_markup?: InlineKeyboardMarkup
}

// https://core.telegram.org/bots/api#messageentity
interface MessageEntity {
    readonly type:
        | 'mention'
        | 'hastag'
        | 'cashtag'
        | 'bot_command'
        | 'url'
        | 'email'
        | 'phone_number'
        | 'bold'
        | 'italic'
        | 'underline'
        | 'strikethrough'
        | 'code'
        | 'pre'
        | 'text_link'
        | 'text_mention'
    readonly offset: Integer
    readonly length: Integer
    readonly url?: string
    readonly user?: User
    readonly language?: string
}

// https://core.telegram.org/bots/api#photosize
interface PhotoSize {
    readonly file_id: String
    readonly file_unique_id: string
    readonly width: Integer
    readonly height: Integer
    readonly file_size?: Integer
}

// https://core.telegram.org/bots/api#audio
interface Audio {
    readonly file_id: String
    readonly file_unique_id: string
    readonly duration: Integer
    readonly performer?: string
    readonly title?: string
    readonly mime_type?: string
    readonly file_size?: Integer
    readonly thumb?: PhotoSize
}

// https://core.telegram.org/bots/api#document
interface Document {
    readonly file_id: String
    readonly file_unique_id: string
    readonly thumb?: PhotoSize
    readonly file_name?: string
    readonly mime_tyoe?: string
    readonly file_size?: Integer
}

// https://core.telegram.org/bots/api#video
interface Video {
    readonly file_id: string
    readonly file_unique_id: string
    readonly width: Integer
    readonly height: Integer
    readonly duration: Integer
    readonly thumb?: PhotoSize
    readonly mime_type?: string
    readonly file_size?: Integer
}

// https://core.telegram.org/bots/api#animation
interface Animation {
    readonly file_id: string
    readonly file_unique_id: string
    readonly width: Integer
    readonly height: Integer
    readonly duration: Integer
    readonly thumb?: PhotoSize
    readonly file_name?: string
    readonly mime_type?: string
    readonly file_size?: Integer
}

// https://core.telegram.org/bots/api#voice
interface Voice {
    readonly file_id: string
    readonly file_unique_id: string
    readonly duration: Integer
    readonly mime_type?: string
    readonly file_size?: Integer
}

// https://core.telegram.org/bots/api#videonote
interface VideoNote {
    readonly file_id: string
    readonly file_unique_id: string
    readonly length: Integer
    readonly duration: Integer
    readonly thumb?: PhotoSize
    readonly file_size?: Integer
}

// https://core.telegram.org/bots/api#contact
interface Contact {
    readonly phone_number: string
    readonly first_name: string
    readonly last_name?: string
    readonly user_id?: Integer
    readonly vcard?: string
}

// https://core.telegram.org/bots/api#location
interface Location {
    readonly longitude: Float
    readonly latitude: Float
}

// https://core.telegram.org/bots/api#venue
interface Venue {
    readonly location: Location
    readonly title: string
    readonly address: string
    readonly foursquare_id?: string
    readonly foursquare_type?: string
}

// https://core.telegram.org/bots/api#polloption
interface PollOption {
    readonly text: string
    readonly voter_count: Integer
}

// https://core.telegram.org/bots/api#pollanswer
interface PollAnswer {
    readonly poll_id: string
    readonly user: User
    readonly option_ids: Integer[] | []
}

// https://core.telegram.org/bots/api#poll
interface Poll {
    readonly id: string
    readonly question: string
    readonly options: PollOption[]
    readonly total_voter_count: Integer
    readonly is_closed: boolean
    readonly is_anonymous: boolean
    readonly type: 'regular' | 'quiz'
    readonly allows_multiple_answers: boolean
    readonly correct_option_id?: Integer
}

// https://core.telegram.org/bots/api#userprofilephotos
interface UserProfilePhotos {
    readonly total_count: Integer
    readonly photos: PhotoSize[][]
}

// https://core.telegram.org/bots/api#file
interface File {
    readonly file_id: string
    readonly file_unique_id: string
    readonly file_size?: Integer
    readonly file_path?: string
}

// https://core.telegram.org/bots/api#replykeyboardmarkup
interface ReplyKeyboardMarkup {
    readonly keyboard: KeyboardButton[][]
    readonly resize_keyboard?: boolean
    readonly one_time_keyboard?: boolean
    readonly selective?: boolean
}

// https://core.telegram.org/bots/api#keyboardbutton
interface KeyboardButton {
    readonly text: string
    readonly request_contact?: boolean
    readonly request_location?: boolean
    readonly request_poll?: KeyboardButtonPollType
}

// https://core.telegram.org/bots/api#keyboardbuttonpolltype
interface KeyboardButtonPollType {
    readonly type?: string | 'quiz' | 'regular'
}

// https://core.telegram.org/bots/api#replykeyboardremove
interface ReplyKeyboardRemove {
    readonly remove_keyboard: true
    readonly selective?: boolean
}

// https://core.telegram.org/bots/api#inlinekeyboardmarkup
interface InlineKeyboardMarkup {
    readonly inline_keyboard: InlineKeyboardButton[][]
}

// https://core.telegram.org/bots/api#inlinekeyboardbutton
interface InlineKeyboardButton {
    readonly text: string
    readonly url?: string
    readonly login_url?: LoginUrl
    readonly callback_data?: string
    readonly switch_inline_query?: string
    readonly switch_inline_query_current_chat?: string
    readonly callback_game?: CallbackGame
    readonly pay?: boolean
}

// https://core.telegram.org/bots/api#loginurl
interface LoginUrl {
    readonly url: string
    readonly forward_text?: string
    readonly bot_username?: string
    readonly request_write_access?: boolean
}

// https://core.telegram.org/bots/api#callbackquery
interface CallbackQuery {
    readonly id: string
    readonly from: User
    readonly message?: Message
    readonly inline_message_id?: string
    readonly chat_instance: string
    readonly data?: string
    readonly game_short_name?: string
}

// https://core.telegram.org/bots/api#forcereply
interface ForceReply {
    readonly force_reply: true
    readonly selective?: boolean
}

// https://core.telegram.org/bots/api#chatphoto
interface ChatPhoto {
    readonly small_file_id: string
    readonly small_file_unique_id: string
    readonly big_file_id: string
    readonly big_file_unique_id: string
}

// https://core.telegram.org/bots/api#chatmember
interface ChatMember {
    readonly user: User
    readonly status:
        | 'creator'
        | 'administrator'
        | 'member'
        | 'restricted'
        | 'left'
        | 'kicked'
    readonly custom_title?: string
    readonly until_date?: Integer
    readonly can_be_edited?: boolean
    readonly can_post_messages?: boolean
    readonly can_edit_messages?: boolean
    readonly can_delete_messages?: boolean
    readonly can_restrict_members?: boolean
    readonly can_promote_members?: boolean
    readonly can_change_info?: boolean
    readonly can_invite_users?: boolean
    readonly can_pin_messages?: boolean
    readonly is_member?: boolean
    readonly can_send_messages?: boolean
    readonly can_send_media_messages?: boolean
    readonly can_send_polls?: boolean
    readonly can_send_other_messages?: boolean
    readonly can_add_web_page_previews?: boolean
}

// https://core.telegram.org/bots/api#chatpermissions
interface ChatPermissions {
    readonly can_send_messages?: boolean
    readonly can_send_media_messages?: boolean
    readonly can_send_polls?: boolean
    readonly can_send_other_messages?: boolean
    readonly can_add_web_page_previews?: boolean
    readonly can_change_info?: boolean
    readonly can_invite_users?: boolean
    readonly can_pin_messages?: boolean
}

// https://core.telegram.org/bots/api#responseparameters
interface ResponseParameters {
    readonly migrate_to_chat_id?: Integer
    readonly retry_after?: Integer
}

// https://core.telegram.org/bots/api#inputmedia
const InputMedia = [
    {} as InputMediaAnimation,
    {} as InputMediaDocument,
    {} as InputMediaAudio,
    {} as InputMediaPhoto,
    {} as InputMediaVideo,
]

type ParseMode = 'Markdown' | 'MarkdownV2' | 'HTML'

// https://core.telegram.org/bots/api#inputmediaphoto
interface InputMediaPhoto {
    readonly type: string
    readonly media: string
    readonly caption?: string
    readonly parse_mode?: ParseMode
}

// https://core.telegram.org/bots/api#inputmediavideo
interface InputMediaVideo {
    readonly type: string
    readonly media: string
    readonly thumb?: InputFile | string
    readonly caption?: string
    readonly parse_mode?: ParseMode
    readonly width?: Integer
    readonly height?: Integer
    readonly duration?: Integer
    readonly supports_streaming?: boolean
}

// https://core.telegram.org/bots/api#inputmediaanimation
interface InputMediaAnimation {
    readonly type: string
    readonly media: string
    readonly thumb?: InputFile | string
    readonly caption?: string
    readonly parse_mode?: ParseMode
    readonly width?: Integer
    readonly height?: Integer
    readonly duration?: Integer
}

// https://core.telegram.org/bots/api#inputmediaaudio
interface InputMediaAudio {
    readonly type: string
    readonly media: string
    readonly thumb?: InputFile | string
    readonly caption?: string
    readonly parse_mode?: ParseMode
    readonly duration?: Integer
    readonly performer?: string
    readonly title?: string
}

// https://core.telegram.org/bots/api#inputmediadocument
interface InputMediaDocument {
    readonly type: string
    readonly media: string
    readonly thumb?: InputFile | string
    readonly caption?: string
    readonly parse_mode?: ParseMode
}

// https://core.telegram.org/bots/api#inputfile
type InputFile = object

// https://core.telegram.org/bots/api#game
interface Game {
    readonly title: string
    readonly description: string
    readonly photo: PhotoSize[]
    readonly text?: string
    readonly text_entities?: MessageEntity[]
    readonly animation?: Animation
}

// https://core.telegram.org/bots/api#sticker
interface Sticker {
    readonly file_id: string
    readonly file_unique_id: string
    readonly width: Integer
    readonly height: Integer
    readonly is_animated: boolean
    readonly thumb?: PhotoSize
    readonly emoji?: string
    readonly set_name?: string
    readonly mask_position?: MaskPosition
    readonly file_size?: Integer
}

// https://core.telegram.org/bots/api#maskposition
interface MaskPosition {
    readonly point: 'forehead' | 'eyes' | 'mouth' | 'chin'
    readonly x_shift: Float
    readonly y_shift: Float
    readonly scale: Float
}

// https://core.telegram.org/bots/api#invoice
interface Invoice {
    readonly title: string
    readonly description: string
    readonly start_parameter: string
    readonly currency: string
    readonly total_amount: Integer
}

// https://core.telegram.org/bots/api#successfulpayment
interface SuccessfulPayment {
    readonly currency: string
    readonly total_amount: Integer
    readonly invoice_payload: string
    readonly shipping_option_id?: string
    readonly order_info?: OrderInfo
    readonly telegram_payment_charge_id: string
    readonly provider_payment_charge_id: string
}

// https://core.telegram.org/bots/api#shippingaddress
interface ShippingAddress {
    readonly country_code: string
    readonly state: string
    readonly city: string
    readonly street_line1: string
    readonly street_line2: string
    readonly post_code: string
}

// https://core.telegram.org/bots/api#orderinfo
interface OrderInfo {
    readonly name?: string
    readonly phone_number?: string
    readonly email?: string
    readonly ShippingAddress?: ShippingAddress
}

// https://core.telegram.org/bots/api#passportdata
interface PassportData {
    readonly data: EncryptedPassportElement[]
    readonly credentials: EncryptedCredentials
}

// https://core.telegram.org/bots/api#passportfile
interface PassportFile {
    readonly file_id: string
    readonly file_unique_id: string
    readonly file_size: Integer
    readonly file_date: Integer
}

type BASE64 = string

// https://core.telegram.org/bots/api#encryptedpassportelement
interface EncryptedPassportElement {
    type: string
    data?: string
    phone_number?: string
    email?: string
    files?: PassportFile[]
    front_side?: PassportFile
    reverse_side?: PassportFile
    selfie?: PassportFile
    translation?: PassportFile[]
    hash: BASE64
}

// https://core.telegram.org/bots/api#encryptedcredentials
interface EncryptedCredentials {
    data: BASE64
    hash: BASE64
    secret: BASE64
}

// https://core.telegram.org/bots/api#callbackgame
interface CallbackGame {}
