export const strings = {
  logout: '登出',
  themeSettings: '主題設定',
  infoColor: '資訊色',
  layoutSettings: '佈局設定',
  loadingPlaceholder: '—',
  loading: '資料載入中…',
  loadFailed: '資料載入失敗，請稍後再試。',
  loginFailed: '帳號或密碼錯誤',
  sessionExpired: '工作階段已失效，請重新登入',
  me: '我',
  member: (id: number) => `成員 #${id}`,
  myHours: (count: number) => `我登記的工時（小時，共 ${count} 筆）`,
}

export const sessionExpiredKey = 'session-expired'
