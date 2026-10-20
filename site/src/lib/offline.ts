// Single-file build injects all data into window.__DATA__ so it works from file:// without a server.
type Inlined = { data?: Record<string, unknown>; content?: Record<string, string> }
const inl = (): Inlined | undefined => (typeof window === 'undefined' ? undefined : (window as unknown as { __DATA__?: Inlined }).__DATA__)
export const inlinedData = (name: string) => inl()?.data?.[name]
export const inlinedContent = (name: string) => inl()?.content?.[name]
