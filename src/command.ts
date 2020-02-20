export const cmdMatch = (cmd: string, str: string): string[] | null => {
    const regex = new RegExp(`(^\\/(${cmd}))|([^\\s]{1,})`, 'g')
    let result = regex.exec(str)
    /**
     * result [0] -> input
     * result [1] -> group_1 \cmd
     * result [2] -> group_2 cmd
     * result [3] -> group_3 args
     */
    let args = []
    args.push(result ? result[2] : null)
    if (args[0] === cmd) {
        while ((result = regex.exec(str)) !== null) args.push(result)
        return args
    } else {
        return null
    }
}
