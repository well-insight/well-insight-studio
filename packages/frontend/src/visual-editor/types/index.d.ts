declare global {
  /** label-value一般用做选项 */
  interface LabelValue {
    label: string
    value: any
  }
  /** label-value 数组 一般用做选项 */
  type LabelValueOptions = OptionItem[]

  type RequestIdleCallbackHandle = any

  interface RequestIdleCallbackDeadline {
    readonly didTimeout: boolean
    timeRemaining: () => number
  }

  interface RequestIdleCallbackOptions {
    timeout: number
  }
  interface Window {
    $$refs: any
    requestIdleCallback: (
      callback: (deadline: RequestIdleCallbackDeadline) => void,
      opts?: RequestIdleCallbackOptions,
    ) => RequestIdleCallbackHandle
    cancelIdleCallback: (handle: RequestIdleCallbackHandle) => void
  }
}

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $$refs: any
  }
}

declare module '@vue/runtime-dom' {
  export interface CSSProperties {
    /** 临时padding变量. */
    tempPadding?: string
  }
}

export {}
