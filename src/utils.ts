export const randomStr = (prefix?: string) => {
    return `${prefix ? `${prefix}-` : ''}${Math.random()
        .toString(36)
        .substring(2, 8)}-${Date.now().toString(16)}-${Math.random()
        .toString(36)
        .substring(2, 8)}`.toUpperCase()
}
