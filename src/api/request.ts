import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { message } from '../utils/message'
import { connection } from '../utils/connection'

/** 統一 API 封裝：攜帶 cookie、解包回應並處理授權錯誤。 */
const baseURL = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '')
const instance = axios.create({ baseURL, timeout: 15000, withCredentials: true })

let csrfToken: string | undefined
instance.interceptors.request.use(async (config) => {
  if (!['get', 'head', 'options'].includes((config.method ?? 'get').toLowerCase())) {
    // Tokens are bound to the current identity, so acquire one for each write.
    const response = await axios.get<{ token: string }>(`${baseURL}/antiforgery`, { withCredentials: true })
    csrfToken = response.data.token
    config.headers.set('X-CSRF-TOKEN', csrfToken)
  }
  return config
})

/**
 * 連不上後端:沒有任何回應,或閘道回 502/504。
 * 開發時 Vite 代理在後端沒開時會回空的 500,也算離線。
 */
function isOffline(err: any): boolean {
  if (!err.response) return true
  const status = err.response.status
  return status === 502 || status === 504 || (import.meta.env.DEV && status === 500 && !err.response.data)
}

/** 離線橫幅的「重試」:後端恢復則回 true。不經過攔截器,避免重複提示。 */
export async function ping(): Promise<boolean> {
  try {
    await axios.get(`${baseURL}/health`, { withCredentials: true, timeout: 8000 })
    connection.offline = false
    return true
  } catch {
    return false
  }
}

instance.interceptors.response.use(
  (res) => {
    connection.offline = false
    const body = res.data
    if (body && typeof body.code === 'number') {
      return body.data
    }
    return body
  },
  (err) => {
    // 離線只亮橫幅,不當成登入失敗,也不清掉登入狀態。
    if (isOffline(err)) { connection.offline = true; return Promise.reject(err) }
    connection.offline = false
    if (err.response?.status === 401) {
      useAuthStore().logout()
      if (location.pathname !== '/login') location.href = '/login'
      else message('帳號或密碼錯誤，或工作階段已失效', 'error')
      return Promise.reject(err)
    }
    if (err.response?.status === 403) {
      // 讀取被拒(例如直接開啟範圍外的專案)改顯示 403 頁;寫入被拒留在原頁並提示。
      if ((err.config?.method ?? 'get').toLowerCase() === 'get') {
        // 動態載入以避開 router → store → api 的循環相依。
        import('../router').then(({ default: router }) => {
          const current = router.currentRoute.value
          if (current.path !== '/403') router.replace({ path: '/403', query: { from: current.fullPath } })
        })
      } else message('沒有權限執行此操作', 'error')
      return Promise.reject(err)
    }
    message(err.response?.data?.msg || '操作失敗', 'error')
    return Promise.reject(err)
  },
)

export default instance
