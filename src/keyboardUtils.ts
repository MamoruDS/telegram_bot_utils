import * as types from './types'
import * as utils from './utils'
import * as cache from './cache'
import * as telegram from './telegram'

const maxLineWidth = types.maxInlineWidth

export const genInlineKeyBoard = (
    botId: string,
    buttons: types.inlineKeyboardButton[]
): telegram.InlineKeyboardButton[][] => {
    if (buttons.length === 0) return undefined
    const keyBoard = new InlineKeyboard()
    const group = new utils.GroupId('C')
    for (const btn of buttons) {
        if (btn.url) {
            keyBoard.addKeyboardButton(
                genInlineKYBDBtnWithUrl(btn.text, btn.url, btn.url_redir),
                btn.keyboard_row_full_width,
                btn.keyboard_row_auto_append
            )
            continue
        }
        if (btn.callback_data) {
            keyBoard.addKeyboardButton(
                genInlineKYBDBtnWithCallbackData(
                    btn.text,
                    btn.callback_data,
                    botId,
                    group
                ),
                btn.keyboard_row_full_width,
                btn.keyboard_row_auto_append
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
    callback_data: any,
    botId: string,
    group: utils.GroupId
): telegram.InlineKeyboardButton => {
    const id = group.genId()
    cache.setCallbackData(botId, id, JSON.stringify({ data: callback_data }))
    const keyButton: telegram.InlineKeyboardButton = {
        text: text,
        callback_data: id,
    }
    return keyButton
}

export class InlineKeyboard {
    private _btnGrp: telegram.InlineKeyboardButton[][]
    private _lineWidth: number[]
    private _curLine: number

    constructor() {
        this._btnGrp = []
        this._lineWidth = []
        this._curLine = -1
        this.addLine()
    }

    private addLine(): void {
        this._btnGrp.push([])
        this._curLine++
        this._lineWidth.push(0)
    }

    public addKeyboardButton(
        inlineKeyboardButton: telegram.InlineKeyboardButton,
        isNewLine?: boolean,
        isAutoAppend?: boolean
    ): void {
        if (isNewLine) {
            if (this._lineWidth[this._curLine] !== 0) this.addLine()
            this._btnGrp[this._curLine].push(inlineKeyboardButton)
            this._lineWidth[this._curLine] = Infinity
            return
        }
        const lineCheck = this._lineWidth
            .map((v, i) => {
                if (v + inlineKeyboardButton.text.length > maxLineWidth)
                    return -1
                else return i
            })
            .filter(v => v != -1)
        if (lineCheck.length === 0) {
            this.addLine()
            return this.addKeyboardButton(inlineKeyboardButton, isAutoAppend)
        }
        let inertLine = this._curLine
        if (lineCheck[0] !== this._curLine && isAutoAppend) {
            inertLine = lineCheck[0]
        }
        this._btnGrp[inertLine].push(inlineKeyboardButton)
        this._lineWidth[inertLine] += inlineKeyboardButton.text.length
        return
    }

    public getInlineKeyBoard(): telegram.InlineKeyboardButton[][] {
        return this._btnGrp
    }
}
