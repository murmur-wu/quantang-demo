import type { Directive } from 'vue'
import { useAuthStore } from '../stores/auth'

/** v-perm="'system:user:add'" — 無權限時移除元素 */
export const perm: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    const auth = useAuthStore()
    if (binding.value && !auth.hasPerm(binding.value)) {
      el.parentNode?.removeChild(el)
    }
  },
}
