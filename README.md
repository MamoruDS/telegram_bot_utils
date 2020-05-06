# Telegram Bot Utils

[![](https://img.shields.io/npm/v/telegram-bot-utils.svg?style=flat-square)](https://www.npmjs.com/package/telegram-bot-utils)

A package helps you deploy your application easily on bot.

**This document is still at very early stage.**

**API reference still on the way 🚧**

## Example Usage

```shell
npm i telegram-bot-utils
```

Simply use with [Node.js Telegram Bot API](https://github.com/yagop/node-telegram-bot-api).

### Start your bot

```javascript
const TelegramBot = require('node-telegram-bot-api')
const BotUtils = require('telegram-bot-utils')

const token = process.env.BOT_TOKEN || 'token'

BotUtils.options.botAPIConstructor = TelegramBot
const bot = BotUtils.bots.add('bot_name', {
    api: {
        token: token,
        options: {
            polling: true,
        },
    },
})

bot.event.on('ready', () => {
    bot.api.on('message', (msg) => {
        console.log(msg)
    })
})
```

## License

MIT License
copyright © 2020 MamoruDS
