import * as types from './types'
import * as tgTypes from './tgTypes'

const maxLineWidth = 50

export const genInlineKYBDBtnWithData = (text, callback_data) => {
    return {}
}

export class InlineKeyboard {
    private _btnGrp: tgTypes.InlineKeyboardButton[][]
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
        inlineKeyboardButton: tgTypes.InlineKeyboardButton,
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

    public getInlineKeyBoard(): tgTypes.InlineKeyboardButton[][] {
        return this._btnGrp
    }
}
