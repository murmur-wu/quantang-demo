import { message } from './message'
import { errorMessage } from '../api/request'
import { i18n } from '../i18n'

/** 下載後端回傳的檔案 Blob;若後端回傳 JSON(權限不足等錯誤)則顯示錯誤訊息 */
export async function downloadBlob(filename: string, blob: Blob) {
  if (blob.type.includes('application/json')) {
    try {
      const body = JSON.parse(await blob.text())
      message(errorMessage(body), 'error')
    } catch {
      message(i18n.global.t('errors.OPERATION_FAILED'), 'error')
    }
    return
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
