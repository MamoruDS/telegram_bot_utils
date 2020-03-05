import * as types from './types'
import * as cache from './cache'
import * as telegram from './telegram'

const maxLineWidth = 50

export const getInlineKeyBoard = () => {}

const getInlineKYBDBtnWithUrl = (
    text: string,
    url: string,
    redir?: boolean
): telegram.InlineKeyboardButton => {
    const _url = redir
        ? `https://mamoruds.github.io/redir_page/?redir=${encodeURIComponent(
              url
          )}`
        : url
    const keyButton: telegram.InlineKeyboardButton = {
        text: text,
        url: _url,
    }
    return keyButton
}

const getInlineKYBDBtnWithCallbackData = (
    text: string,
    callback_data: any
): telegram.InlineKeyboardButton => {
    const id = cache.setCallbackData(JSON.stringify({ data: callback_data }))
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
            this.addLine()
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
