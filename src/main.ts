import { BotMgr } from './bot'

export const telegramBotUtils = {
    botMgr: undefined,
} as {
    botMgr: BotMgr
}

export const botMgr = new BotMgr()

telegramBotUtils.botMgr = botMgr
