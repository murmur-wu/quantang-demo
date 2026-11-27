import { i18n } from './index'
import zhTW from './locales/zh-TW'

/**
 * 後端種子資料的選單、角色名稱是繁中。只有名稱仍等於種子原文時才翻譯；
 * 管理員在展示站改過名稱、或查不到對照時，一律顯示後端原文。
 */
function seeded(group: 'menus' | 'perms' | 'roles' | 'dataScopes', id: string, name?: string): string | undefined {
  const original = (zhTW[group] as Record<string, string>)[id]
  if (original === undefined) return undefined
  if (name !== undefined && name !== original) return undefined
  return i18n.global.t(`${group}.${id}`)
}

export function menuLabel(m: { path?: string; perms?: string; menuName: string }): string {
  if (m.perms) {
    const byPerm = seeded('perms', m.perms.replaceAll(':', '_'), m.menuName)
    if (byPerm) return byPerm
  }
  let path = (m.path ?? '').replace(/^\/+|\/+$/g, '')
  if (['user', 'role', 'menu', 'dept'].includes(path)) path = `system/${path}`
  return (path && seeded('menus', path.replaceAll('/', '_'), m.menuName)) || m.menuName
}

export function roleLabel(roleKey: string | undefined, name: string): string {
  return (roleKey && seeded('roles', roleKey, name)) || name
}

export function scopeLabel(dataScope: string | undefined, name?: string): string {
  return (dataScope && seeded('dataScopes', dataScope)) || name || dataScope || ''
}