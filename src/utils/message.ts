/** 極簡 toast 訊息(取代 alert) */
export function message(text: string, type: 'success' | 'error' = 'success') {
  const el = document.createElement('div')
  el.textContent = text
  el.className =
    'fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 rounded text-sm shadow-lg transition-opacity ' +
    (type === 'success'
      ? 'bg-green-50 text-green-600 border border-green-200'
      : 'bg-red-50 text-red-600 border border-red-200')
  document.body.appendChild(el)
  setTimeout(() => {
    el.style.opacity = '0'
    setTimeout(() => el.remove(), 300)
  }, 2500)
}
