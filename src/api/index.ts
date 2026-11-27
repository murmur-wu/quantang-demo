import request from './request'

// ---- 型別 ----
export interface MenuNode {
  menuId: number
  name: string
  perms?: string
  path?: string
  component?: string
  menuType: 'M' | 'C' | 'F'
  icon?: string
  children: MenuNode[]
}
export interface SysMenu {
  menuId: number
  menuName: string
  parentId: number
  orderNum: number
  path?: string
  component?: string
  menuType: 'M' | 'C' | 'F'
  visible: string
  status: string
  perms?: string
  icon?: string
  createTime?: string
}
export interface SysDept {
  deptId: number
  parentId: number
  deptName: string
  orderNum: number
  leader?: string
  phone?: string
  email?: string
  status: string
  createTime?: string
}
export interface Paged<T> {
  rows: T[]
  total: number
}

// ---- Auth ----
export const login = (userName: string, password: string): Promise<void> =>
  request.post('/auth/login', { userName, password })
export const logout = (): Promise<void> => request.post('/auth/logout')
export const getInfo = (): Promise<{
  user: { userId: number; userName: string; nickName: string; deptName?: string }
  roles: string[]
  roleNames: string[]
  dataScopes: string[]
  permissions: string[]
}> => request.get('/auth/info')
export const getRouters = (): Promise<MenuNode[]> => request.get('/auth/routers')

// ---- 個人化設定(每位使用者各自儲存) ----
export const getThemeSetting = (): Promise<string | null> => request.get('/user/setting/theme')
export const saveThemeSetting = (theme: string) => request.put('/user/setting/theme', { theme })

// ---- User ----
export const listUsers = (params: Record<string, unknown>): Promise<Paged<any>> =>
  request.get('/system/user', { params })
export const createUser = (data: unknown) => request.post('/system/user', data)
export const updateUser = (id: number, data: unknown) => request.put(`/system/user/${id}`, data)
export const deleteUser = (id: number) => request.delete(`/system/user/${id}`)
export const resetPassword = (id: number, password: string) =>
  request.put(`/system/user/${id}/reset-password`, { password })

// ---- Role ----
export const listRoles = (params: Record<string, unknown>): Promise<Paged<any>> =>
  request.get('/system/role', { params })
export const getRoleMenuIds = (id: number): Promise<number[]> => request.get(`/system/role/${id}/menu-ids`)
export const createRole = (data: unknown) => request.post('/system/role', data)
export const updateRole = (id: number, data: unknown) => request.put(`/system/role/${id}`, data)
export const assignRoleMenus = (id: number, menuIds: number[]) => request.put(`/system/role/${id}/menus`, menuIds)
export const deleteRole = (id: number) => request.delete(`/system/role/${id}`)

// ---- Menu ----
export const listMenus = (params?: Record<string, unknown>): Promise<SysMenu[]> =>
  request.get('/system/menu', { params })
export const createMenu = (data: unknown) => request.post('/system/menu', data)
export const updateMenu = (id: number, data: unknown) => request.put(`/system/menu/${id}`, data)
export const deleteMenu = (id: number) => request.delete(`/system/menu/${id}`)

// ---- Dept ----
export const listDepts = (params?: Record<string, unknown>): Promise<SysDept[]> =>
  request.get('/system/dept', { params })
export const createDept = (data: unknown) => request.post('/system/dept', data)
export const updateDept = (id: number, data: unknown) => request.put(`/system/dept/${id}`, data)
export const deleteDept = (id: number) => request.delete(`/system/dept/${id}`)
