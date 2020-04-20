import { BotMgr } from './bot'
import * as botAPI from 'node-telegram-bot-api'

const _bots = new BotMgr()
const _defaults = {
    maxInlineButtonWidth: 16,
} as {
    maxInlineButtonWidth: number
}
const _botAPI: botAPI = undefined

const _hasBotAPIModule = () => {
    try {
        const _b = new botAPI('N', { polling: false })
        return typeof _b.closeWebHook === 'function'
    } catch (e) {
        return false
    }
}

export {
    _bots as bots,
    _defaults as defaults,
    _botAPI as api,
    _hasBotAPIModule as hasBotAPIModule,
}

