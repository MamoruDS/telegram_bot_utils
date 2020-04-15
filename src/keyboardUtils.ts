import { botMgr } from './main'
import * as types from './types'
import * as utils from './utils'
import * as cache from './cache'
import { Message, CallbackQuery, InlineKeyboardButton } from './telegram'
import {
    ApplicationDataMan,
    ApplicationInfo,
    AppBaseUtilCTR,
    AppBaseUtilItem,
} from './application'
import { RecordMan, RecordMgr } from './record'

const maxRowWidth = types.maxInlineWidth

export const genInlineKeyBoard = (
    botId: string,
    initUserId: number,
    buttons: types.inlineKeyboardButton[]
): InlineKeyboardButton[][] => {
    if (buttons.length === 0) return undefined
    const keyBoard = new InlineKeyboard()
    const group = new utils.GroupId('CD')
    for (const btn of buttons) {
        if (btn.url) {
            keyBoard.addKeyboardButton(
                genInlineKYBDBtnWithUrl(btn.text, btn.url, btn.url_redir),
                btn.keyboard_row_full_width,
                btn.keyboard_row_auto_append,
                btn.keyboard_row_force_append,
                btn.keyboard_row_force_append_row_num
            )
            continue
        }
        if (btn.callback_data) {
            keyBoard.addKeyboardButton(
                genInlineKYBDBtnWithCallbackData(
                    btn.text,
                    {
                        action_name: btn.action_name,
                        init_user_id: initUserId,
                        data: btn.callback_data,
                    },
                    botId,
                    group
                ),
                btn.keyboard_row_full_width,
                btn.keyboard_row_auto_append,
                btn.keyboard_row_force_append,
                btn.keyboard_row_force_append_row_num
            )
            continue
        }
    }
    return keyBoard.getInlineKeyBoard()
}

const genInlineKYBDBtnWithUrl = (
    text: string,
    url: string,
    redir?: boolean
): InlineKeyboardButton => {
    redir =
        url.match(/(?!^https{0,1}:\/\/)(^[\w\d\-\_]{1,}:\/\/)/) === null
            ? redir
            : true
    const _url = redir
        ? `https://mamoruds.github.io/redir_page/?redir=${encodeURIComponent(
              url
          )}`
        : url
    // more details on https://github.com/MamoruDS/redir_page
    const keyButton: InlineKeyboardButton = {
        text: text,
        url: _url,
    }
    return keyButton
}

const genInlineKYBDBtnWithCallbackData = (
    text: string,
    callbackData: types.CallbackData,
    botId: string,
    group: utils.GroupId
): InlineKeyboardButton => {
    const id = setCachedCallbackData(botId, group, callbackData)
    const keyButton: InlineKeyboardButton = {
        text: text,
        callback_data: id,
    }
    return keyButton
}

export const setCachedCallbackData = (
    botId: string,
    groupId: utils.GroupId,
    callbackData: types.CallbackData
): string => {
    const definedData = ['', 0, undefined] as types.definedCallbackData
    const keys = types.callbackDataIndex
    for (const key of Object.keys(keys)) {
        definedData[keys[key]] = callbackData[key]
    }
    const id = groupId.genId()
    cache.setCallbackData(botId, id, JSON.stringify(definedData))
    return id
}

export const getCachedCallbackData = (
    botId: string,
    dataId: string
): { idInfo: utils.IdInfo; data: types.CallbackData } => {
    const res = {} as { idInfo: utils.IdInfo; data: types.CallbackData }
    res.idInfo = utils.parseId(dataId)
    if (res.idInfo.match) {
        try {
            const definedData = JSON.parse(cache.getCallbackData(botId, dataId))
            const keys = types.callbackDataIndex
            for (const key of Object.keys(keys)) {
                res.data[key] = definedData[keys[key]]
            }
        } catch (e) {
            //
        }
    }
    return res
}

export class InlineKeyboard {
    private _btnGrp: InlineKeyboardButton[][]
    private _rowWidths: number[]

    constructor() {
        this._btnGrp = []
        this._rowWidths = []
        this.addLine()
    }

    private addLine(): void {
        this._btnGrp.push([])
        this._rowWidths.push(0)
    }

    public addKeyboardButton(
        inlineKeyboardButton: InlineKeyboardButton,
        isFullWidthBtn: boolean,
        autoAppend: boolean,
        forceAppend: boolean,
        forceAppendRowNum?: number
    ): void {
        if (isFullWidthBtn) {
            if (this._rowWidths.slice(-1)[0] !== 0) {
                this.addLine()
            }
            const curLine = this._rowWidths.length - 1
            this._btnGrp[curLine].push(inlineKeyboardButton)
            this._rowWidths[curLine] = Infinity
            return
        }
        const textLength = inlineKeyboardButton.text.length
        if (autoAppend) {
            const _validRows = this._rowWidths
                .map((v, i) => {
                    if (v + textLength > maxRowWidth) {
                        return -1
                    } else return i
                })
                .filter((v) => v != -1)
            if (_validRows.length !== 0) {
                const curLine = _validRows[0]
                this._btnGrp[curLine].push(inlineKeyboardButton)
                this._rowWidths[curLine] += textLength
                return
            }
        }
        if (!forceAppend) this.addLine()
        const curLine =
            forceAppend && !isNaN(forceAppendRowNum)
                ? forceAppendRowNum
                : this._rowWidths.length - 1
        this._btnGrp[curLine].push(inlineKeyboardButton)
        this._rowWidths[curLine] += textLength
        return
    }

    public getInlineKeyBoard(): InlineKeyboardButton[][] {
        return this._btnGrp
    }
}

class KeyboardMan {
    private readonly _KeyboardId: string
    private readonly _clickedkeyId: string
    private readonly _chatId: number
    private readonly _messageId: number
    private _KYBDUtils: InlineKYBDUtils

    constructor(
        KYBDId: string,
        KeyId: string,
        chatId: number,
        messageId: number,
        KYBDUtils: InlineKYBDUtils
    ) {
        this._KeyboardId = KYBDId
        this._chatId = chatId
        this._messageId = messageId
        this._clickedkeyId = KeyId
        this._KYBDUtils = KYBDUtils
    }

    get data(): any {
        return this._KYBDUtils.record.get(this._KeyboardId).info().btns[
            this._clickedkeyId
        ].data
    }
    get messageId(): number {
        return this._messageId
    }
    get chatId(): number {
        return this._chatId
    }

    delete() {
        this._KYBDUtils.record.delete(this._KeyboardId)
    }
}

type inlineKeyboardButton = {
    text: string
    url?: string
    url_redir?: boolean
    callback_action?: string
    callback_data?: any
    switch_inline_query?: string
    switch_inline_query_current_chat?: string
    keyboard_row_full_width?: boolean
    keyboard_row_auto_append?: boolean
    keyboard_row_force_append?: boolean
    keyboard_row_force_append_row_num?: number
}

type InlineKYBDInfo = {
    init_user_id: number
    init_chat_id: number
    btns: {
        [keyId: string]: InlineKYBDBtnInfo
    }
}

type InlineKYBDBtnInfo<T = any> = {
    action_name: string
    data: T
}

const encodeCallbackInf = (inf: CallbackDataInfo): string => {
    return [inf.BTN, inf.KYBD].join('@')
}

const decodeCallbackInf = (inf: string): CallbackDataInfo => {
    const _infa = inf.split('@')
    if (typeof _infa[0] !== 'string' || typeof _infa[1] !== 'string') {
        throw new SyntaxError()
    }
    return {
        KYBD: _infa[1],
        BTN: _infa[0],
    }
}

type CallbackDataInfo = {
    KYBD: string
    BTN: string
    previousSessionRecord?: boolean
}

export class InlineKYBDUtils extends AppBaseUtilCTR<
    InlineKYBDAciton,
    InlineKYBDActionConstructor
> {
    private _records: RecordMgr<InlineKYBDInfo>

    constructor(botName: string) {
        super(InlineKYBDAciton, 'Inline Keyboard Action', 'name', botName)
        this._records = new RecordMgr<InlineKYBDInfo>(
            this._botName,
            'InlineKYBD'
        )
        this._records.import('InlineKYBD')
    }

    get record(): RecordMgr<InlineKYBDInfo> {
        return this._records
    }

    add(
        name: string,
        execFn: ActionFn,
        options: InlineKYBDOptions,
        appInfo: ApplicationInfo
    ) {
        return super.add(name, execFn, options, appInfo, this._botName)
    }
    new(
        chatId: number,
        userId: number,
        buttons: inlineKeyboardButton[]
    ): InlineKeyboardButton[][] {
        const _buttons = {} as { [keyId: string]: InlineKYBDBtnInfo }
        const keyBoard = new InlineKeyboard()
        const KYBDId = this._records.add('InlineKYBD', {
            init_chat_id: chatId,
            init_user_id: userId,
            btns: {},
        }).id
        for (const btn of buttons) {
            if (btn.url) {
                keyBoard.addKeyboardButton(
                    genInlineKYBDBtnWithUrl(btn.text, btn.url, btn.url_redir),
                    btn.keyboard_row_full_width,
                    btn.keyboard_row_auto_append,
                    btn.keyboard_row_force_append,
                    btn.keyboard_row_force_append_row_num
                )
                continue
            }
            if (btn.callback_action) {
                const KeyId = utils.genRandom(6).toUpperCase()
                _buttons[KeyId] = {
                    action_name: btn.callback_action,
                    data:
                        typeof btn.callback_data !== 'undefined'
                            ? btn.callback_data
                            : {},
                }
                const _inf: Required<CallbackDataInfo> = {
                    KYBD: KYBDId,
                    BTN: KeyId,
                    previousSessionRecord: false,
                }
                keyBoard.addKeyboardButton(
                    {
                        text: btn.text,
                        callback_data: encodeCallbackInf(_inf),
                    },
                    btn.keyboard_row_full_width,
                    btn.keyboard_row_auto_append,
                    btn.keyboard_row_force_append,
                    btn.keyboard_row_force_append_row_num
                )
                continue
            }
        }
        if (Object.keys(_buttons).length !== 0) {
            this._records.get(KYBDId).info({ btns: _buttons })
        } else {
            this._records.delete(KYBDId)
        }
        return keyBoard.getInlineKeyBoard()
    }
    checkCallbackQuery(callbackQuery: CallbackQuery) {
        const _inf = {
            KYBD: undefined,
            BTN: undefined,
            previousSessionRecord: false,
        } as CallbackDataInfo
        try {
            _inf.previousSessionRecord = !this._records._session.isMember(
                callbackQuery.data
            )
            Object.assign(_inf, decodeCallbackInf(callbackQuery.data))
        } catch (err) {
            if (err instanceof SyntaxError) return
            throw err
        }
        _inf.KYBD = !_inf.previousSessionRecord
            ? _inf.KYBD
            : this._records._session.import(_inf.KYBD)
        const record = this._records.get(_inf.KYBD, false, false)
        if (typeof record === 'undefined') {
            // TODO: handle invalid button
            if (_inf.previousSessionRecord) {
                // TODO: handle expired button
            }
            return
        }
        const btnInf = record.info().btns[_inf.BTN]
        const action = this.get(btnInf.action_name)
        action.exec(record.id, _inf.KYBD, _inf.BTN, callbackQuery)
    }
}

type ActionFn = (inf: {
    callback_query: CallbackQuery
    keyboard: KeyboardMan
    data: {
        chat_id: number
        user_id: number
        user_data: ApplicationDataMan
    }
}) => Promise<void>

type InlineKYBDOptions = {}

const defaultInlineKYBDOptions: Required<InlineKYBDOptions> = {}

interface InlineKYBDActionConstructor {
    new (
        name: string,
        execFn: ActionFn,
        options: InlineKYBDOptions,
        appInfo: ApplicationInfo,
        botName: string
    ): InlineKYBDAciton
}

class InlineKYBDAciton extends AppBaseUtilItem {
    private _name: string
    private _execFunction: ActionFn

    constructor(...P: ConstructorParameters<InlineKYBDActionConstructor>)
    constructor(
        name: string,
        execFn: ActionFn,
        options: InlineKYBDOptions,
        appInfo: ApplicationInfo,
        botName: string
    ) {
        super(appInfo, botName)
        this._name = name
        this._execFunction = execFn
        const _options = botMgr
            .get(this._botName)
            .getDefaultOptions<InlineKYBDOptions>(
                defaultInlineKYBDOptions,
                options
            )
    }

    get name(): string {
        return this._name
    }
    private get _CTR(): InlineKYBDUtils {
        return this._bot.inlineKYBD
    }

    async exec(
        recId: string,
        KYBDId: string,
        KeyId: string,
        query: CallbackQuery
    ) {
        if (this._CTR.record.get(recId).locked) return
        this._CTR.record.get(recId).locked = true
        await this._execFunction({
            callback_query: query,
            keyboard: new KeyboardMan(
                KYBDId,
                KeyId,
                query.message.chat.id,
                query.message.message_id,
                this._CTR
            ),
            data: {
                chat_id: query.message.chat.id,
                user_id: query.from.id,
                user_data: this.dataMan({
                    chat_id: query.message.chat.id,
                    user_id: query.from.id,
                }),
            },
        })
        try {
            this._CTR.record.get(recId).locked = false
        } catch (err) {
            // since record may has been deleted
            if (err instanceof RangeError) return
            throw err
        }
    }
}
