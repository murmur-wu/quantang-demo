import { reactive } from 'vue'

export const confirmState = reactive({ show: false, text: '' })
let resolvePending: ((result: boolean) => void) | undefined
export function useConfirm(text: string): Promise<boolean> {
  resolvePending?.(false)
  confirmState.text = text
  confirmState.show = true
  return new Promise(resolve => { resolvePending = resolve })
}
export function resolveConfirm(result: boolean) {
  confirmState.show = false
  resolvePending?.(result)
  resolvePending = undefined
}
