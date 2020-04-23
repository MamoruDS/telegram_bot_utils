import { BotMgr } from './bot'

const _bots = new BotMgr() as BotMgr

const _options = {
    botAPIConstructor: undefined,
    maxInlineButtonWidth: 16,
} as {
    botAPIConstructor: new () => any
    maxInlineButtonWidth: number
}

export { _bots as bots, _options as options }
