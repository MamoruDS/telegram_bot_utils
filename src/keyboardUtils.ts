import * as types from './types'
import * as utils from './utils'
import * as cache from './cache'
import * as telegram from './telegram'

const maxRowWidth = types.maxInlineWidth

export const genInlineKeyBoard = (
    botId: string,
    initUserId: number,
    buttons: types.inlineKeyboardButton[]
): telegram.InlineKeyboardButton[][] => {
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
): telegram.InlineKeyboardButton => {
    const _url = redir
        ? `https://mamoruds.github.io/redir_page/?redir=${encodeURIComponent(
              url
          )}`
        : url
    // more details on https://github.com/MamoruDS/redir_page
    const keyButton: telegram.InlineKeyboardButton = {
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
): telegram.InlineKeyboardButton => {
    const id = setCachedCallbackData(botId, group, callbackData)
    const keyButton: telegram.InlineKeyboardButton = {
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
    private _btnGrp: telegram.InlineKeyboardButton[][]
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
        inlineKeyboardButton: telegram.InlineKeyboardButton,
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
                .filter(v => v != -1)
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

    public getInlineKeyBoard(): telegram.InlineKeyboardButton[][] {
        return this._btnGrp
    }
}
