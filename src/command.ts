export const cmdMatch = (input: string): string[] | null => {
    const regex = new RegExp(
        `(^\\/([\\w|_|\\-|\\.]{1,})(?=$|\\s))|([^\\s]{1,})`,
        'g'
    )
    let result = regex.exec(input)
    /**
     * result [0] -> input
     * result [1] -> group_1 \/cmd\s
     * result [2] -> group_2 cmd
     * result [3] -> group_3 args
     */
    let args = []
    args.push(result ? result[2] : undefined)
    if (args[0] !== undefined) {
        while ((result = regex.exec(input)) !== null) args.push(result[3])
        return args
    } else {
        return null
    }
}
