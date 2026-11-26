import { message } from './message'

/** 下載後端回傳的檔案 Blob;若後端回傳 JSON(權限不足等錯誤)則顯示錯誤訊息 */
export async function downloadBlob(filename: string, blob: Blob) {
  if (blob.type.includes('application/json')) {
    try {
      const body = JSON.parse(await blob.text())
      message(body.msg || '匯出失敗', 'error')
    } catch {
      message('匯出失敗', 'error')
    }
    return
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
