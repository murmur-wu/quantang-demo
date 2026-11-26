<script setup lang="ts">
import { useAuthStore } from '../../stores/auth'
// 作品說明首頁:純靜態,不呼叫 API,後端離線時也看得到。
const auth = useAuthStore()
const stack = [
  ['後端', '.NET 10、ASP.NET Core Web API、EF Core、SQLite'],
  ['前端', 'Vue 3、TypeScript、Vite、Pinia、Tailwind CSS'],
  ['登入', 'HttpOnly cookie 加伺服器端工作階段，前端不保存權杖'],
  ['部署', '前端是靜態網站；後端提供 API，負責權限與資料範圍判斷'],
]
const points = [
  ['資料範圍', '同一支列表 API，不同角色拿到不同資料。過濾寫在資料庫查詢裡，不是先全部取回再丟掉。'],
  ['真正的 401 與 403', '未登入回 401；有登入但沒權限或超出範圍回 403，回應不帶該筆資料內容。'],
  ['權限只認後端', '前端隱藏按鈕只是體驗；每個請求都由後端重新計算角色與權限。'],
  ['防跨站請求', '寫入請求同時檢查來源與 antiforgery token；cookie 只發給後端。'],
  ['登出即失效', '登出會刪除伺服器端的工作階段，被複製走的 cookie 也不能再用。'],
  ['定時重置', '示範資料每 30 分鐘還原成固定種子，隨意修改不必擔心弄壞。'],
]
const accounts = [
  ['站台管理員', '看得到全部 8 個專案、帳號與完整權限矩陣'],
  ['業務組主管', '只看得到自己業務組的專案；東岸與西岸各一位，可以對照'],
  ['專案負責人', '只看得到自己負責或被指派的專案，可以改任務'],
  ['顧問', '只看得到被指派的專案，只能登記與修改自己的工時'],
  ['參觀訪客', '只能唯讀一個公開示範專案與權限矩陣'],
]
</script>
<template>
  <main class="min-h-screen bg-body text-main">
    <div class="mx-auto max-w-4xl px-5 py-12">
      <header class="rounded-lg bg-gradient-to-br from-[#304156] to-[#263445] p-8 text-white">
        <p class="text-sm opacity-80">個人作品集展示</p>
        <h1 class="mt-1 text-3xl font-semibold">權糖 quantang</h1>
        <p class="mt-3 max-w-2xl leading-relaxed opacity-90">
          一個小而完整的權限與資料範圍範例。情境是虛構的顧問公司「青瀨顧問」的內部專案板：
          五種角色登入後，看得到、改得到的專案、任務與工時都不一樣。公司、人名與客戶都是假資料。
        </p>
        <div class="mt-6 flex flex-wrap gap-3">
          <router-link v-if="auth.isLoggedIn" to="/dashboard" class="rounded bg-primary px-5 py-2.5 font-medium text-white">進入工作台</router-link>
          <router-link v-else to="/login" class="rounded bg-primary px-5 py-2.5 font-medium text-white">用示範帳號登入</router-link>
        </div>
      </header>

      <section class="mt-8 rounded bg-card p-6 shadow-sm">
        <h2 class="text-lg font-semibold">這個展示想說明什麼</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div v-for="p in points" :key="p[0]" class="rounded border border-line p-4">
            <h3 class="font-medium">{{ p[0] }}</h3>
            <p class="mt-1 text-sm leading-relaxed text-secondary">{{ p[1] }}</p>
          </div>
        </div>
      </section>

      <section class="mt-6 rounded bg-card p-6 shadow-sm">
        <h2 class="text-lg font-semibold">可以試試看</h2>
        <p class="mt-2 text-sm text-secondary">登入頁列出六個示範帳號。換不同帳號開同一個頁面，或直接改網址上的專案編號，就能看到範圍的差別。</p>
        <table class="mt-4 w-full text-left text-sm">
          <thead><tr class="bg-muted"><th class="p-3">角色</th><th class="p-3">登入後看得到什麼</th></tr></thead>
          <tbody><tr v-for="a in accounts" :key="a[0]" class="border-b border-line"><td class="whitespace-nowrap p-3 font-medium">{{ a[0] }}</td><td class="p-3 text-secondary">{{ a[1] }}</td></tr></tbody>
        </table>
      </section>

      <section class="mt-6 rounded bg-card p-6 shadow-sm">
        <h2 class="text-lg font-semibold">技術棧</h2>
        <dl class="mt-4 space-y-2 text-sm">
          <div v-for="s in stack" :key="s[0]" class="flex gap-4"><dt class="w-12 shrink-0 font-medium">{{ s[0] }}</dt><dd class="text-secondary">{{ s[1] }}</dd></div>
        </dl>
        <p class="mt-4 text-sm text-secondary">權限模型（使用者、角色、選單與按鈕權限）的概念參考若依（MIT 授權），以 .NET 10 自行重寫；資料範圍、cookie 安全、測試與部署流程是自己設計的部分。</p>
      </section>

      <section class="mt-6 rounded border border-line p-6 text-sm leading-relaxed text-secondary">
        <h2 class="text-base font-semibold text-main">使用前請知道</h2>
        <ul class="mt-2 list-disc space-y-1 pl-5">
          <li>展示站沒有備援，不保證隨時在線。連不上後端時，頁面上方會顯示「展示主機目前離線」。</li>
          <li>示範資料每 30 分鐘自動重置，你做的修改不會保留。</li>
          <li>這是展示站，請不要輸入任何真實的個人資料或密碼。</li>
        </ul>
      </section>
    </div>
  </main>
</template>
