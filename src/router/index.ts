import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import type { MenuNode } from '../api'
import Layout from '../layout/Layout.vue'
import { connection } from '../utils/connection'

/** views 元件對照:後端 component 字串 → 實際模組 */
const viewModules = import.meta.glob('../views/**/index.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 公開頁:作品說明首頁與登入頁,不需登入、進入時不呼叫 API
    { path: '/', name: 'home', component: () => import('../views/home/index.vue'), meta: { public: true } },
    { path: '/login', name: 'login', component: () => import('../views/login/index.vue'), meta: { public: true } },
    {
      // 子路由都用絕對路徑,這個 path 只是掛載點,不會出現在網址上
      path: '/_app', name: 'root', component: Layout, redirect: '/dashboard',
      children: [
        // meta.perm:缺少該權限時由下方 guard 導向 /403(後端仍會各自檢查)
        { path: '/permission-matrix', name: 'permission-matrix', component: () => import('../views/matrix/index.vue'), meta: { title: '權限矩陣', perm: 'biz:permission:matrix' } },
        { path: '/work/:id', name: 'work-detail', component: () => import('../views/work/index.vue'), meta: { title: '專案詳情', perm: 'biz:project:read' } },
        { path: '/work', name: 'work', component: () => import('../views/work/index.vue'), meta: { title: '專案與工時', perm: 'biz:project:read' } },
        { path: '/clients', name: 'clients', component: () => import('../views/clients/index.vue'), meta: { title: '客戶', perm: 'biz:client:read' } },
        { path: '/403', name: 'forbidden', component: () => import('../views/forbidden/index.vue'), meta: { title: '沒有權限' } },
        // 個人中心:固定路由,不走選單權限
        { path: '/profile', name: 'profile', component: () => import('../views/profile/index.vue'), meta: { title: '個人中心' } },
      ],
    },
    // 注意:不可加 catch-all redirect '/',動態路由註冊前會造成無限重導向;
    // 未匹配路徑改由下方 guard 處理
  ],
})

/** 由後端選單樹產生路由(掛在 Layout 之下) */
function buildRoutes(menus: MenuNode[], parentPath = '', parentTitle = ''): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  for (const m of menus) {
    const fullPath = m.path ? `${parentPath}/${m.path}` : parentPath
    if (m.menuType === 'C' && m.component) {
      const loader = viewModules[`../views/${m.component}.vue`]
      if (loader) {
        routes.push({
          path: fullPath,
          name: `menu-${m.menuId}`,
          component: loader,
          meta: { title: m.name, icon: m.icon, parentTitle }, // parentTitle 供麵包屑顯示上層目錄
        })
      }
    }
    if (m.children?.length) routes.push(...buildRoutes(m.children, fullPath, m.name))
  }
  return routes
}

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.public) {
    return to.path === '/login' && auth.isLoggedIn ? '/dashboard' : true
  }

  // 已登入但動態路由尚未註冊(首次進入或 F5 重整)
  if (!auth.loaded) {
    try {
      await auth.fetchUser()
    } catch {
      // 後端離線時不清登入狀態(橫幅會說明);其餘視為未登入
      if (!connection.offline) auth.logout()
      return '/login'
    }
    for (const r of buildRoutes(auth.menus)) router.addRoute('root', r)
    auth.loaded = true
    return { path: to.fullPath, replace: true } // 重新導航讓新路由生效
  }

  // 動態路由已註冊仍無匹配:系統管理路徑代表沒有該選單權限 → 403;其餘未知路徑回工作台
  if (to.matched.length === 0) {
    return to.path.startsWith('/system/') ? { path: '/403', query: { from: to.fullPath }, replace: true } : '/dashboard'
  }
  const perm = to.meta.perm
  if (typeof perm === 'string' && !auth.hasPerm(perm)) return { path: '/403', query: { from: to.fullPath }, replace: true }
  return true
})

export default router
