import { BotMgr, BotUtils, NodeTGBotAPIConstructor } from './bot'

const _bots = new BotMgr() as BotMgr

const _options = {
    botAPIConstructor: undefined,
    maxInlineButtonWidth: 16,
} as {
    botAPIConstructor: NodeTGBotAPIConstructor
    maxInlineButtonWidth: number
}

export { _bots as bots, _options as options, BotUtils }
