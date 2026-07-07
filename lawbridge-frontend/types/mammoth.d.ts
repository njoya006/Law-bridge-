declare module 'mammoth' {
  interface Result {
    value: string
    messages: Array<{ type: string; message: string }>
  }

  interface BrowserInput {
    arrayBuffer: ArrayBuffer
  }

  interface MammothApi {
    convertToHtml(input: BrowserInput): Promise<Result>
    extractRawText(input: BrowserInput): Promise<Result>
  }

  const mammoth: MammothApi
  export = mammoth
}
