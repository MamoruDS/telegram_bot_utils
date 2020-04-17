import { EventEmitter } from 'events'
import { Message } from './telegram'

export class GroupUtils extends EventEmitter {
    private _botName: string
    private _triggeredByBot: boolean
    private _triggeredBySelf: boolean

    constructor(
        botName: string,
        options: {
            triggeredByBot?: boolean
            triggeredBySelf?: boolean
        } = {}
    ) {
        super()
        this._botName = botName
        this._triggeredByBot = options.triggeredByBot
        this._triggeredBySelf = options.triggeredBySelf
    }

    listener = (msg: Message) => {
        const manMember = msg.from
        const leftMember = msg.left_chat_member
        if (leftMember) {
            if (leftMember.id === manMember.id) {
                this._trigger('left', msg, leftMember)
            } else {
                this._trigger('removed', msg, leftMember)
            }
        }
        const newMembers = msg.new_chat_members || []
        if (newMembers.length !== 0) {
            for (const i in newMembers) {
                const newMember = newMembers[i]
                if (newMember.id === manMember.id) {
                    this._trigger('joined', msg, newMember)
                } else {
                    this._trigger('added', msg, newMember)
                }
            }
        }
    }
    private _trigger = (event: string, msg: Message, ...args: any[]) => {
        if (msg.from.is_bot && !this._triggeredByBot) return
        if (msg.from.username === this._botName && !this._triggeredBySelf)
            return
        this.emit(event, msg, ...args)
    }
}
