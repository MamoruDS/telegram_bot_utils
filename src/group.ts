import { Message } from './telegram'

export const joinListener = (msg: Message, func: (msg: Message) => any) => {
    const newMembers = msg.new_chat_members ? msg.new_chat_members : []
    if (newMembers.length !== 0) {
        func(msg)
    }
}

export const leftListener = (msg: Message, func: (msg: Message) => any) => {
    const leftMember = msg.left_chat_member ? msg.left_chat_member : undefined
    if (leftMember) {
        func(msg)
    }
}
