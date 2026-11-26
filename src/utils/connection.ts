import { reactive } from 'vue'

/** 後端是否連得上。由 API 攔截器更新,App.vue 據此顯示離線橫幅(與帳密錯誤分開)。 */
export const connection = reactive({ offline: false })
