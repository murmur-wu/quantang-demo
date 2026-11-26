<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import request from '../../api/request'
import { useAuthStore } from '../../stores/auth'
import { listUsers, listRoles } from '../../api'

// 工作台:自己權限範圍內的專案與待辦摘要。所有列表都已由後端依資料範圍過濾,這裡只做加總與顯示。
const auth = useAuthStore()
type Project = { id: number; name: string; clientId: number | null }
type Task = { id: number; projectId: number; name: string }
type Entry = { id: number; taskId: number; userId: number; date: string; hours: number; note: string }

const nextReset = ref<string | null>(null)
const projects = ref<Project[]>([]), tasks = ref<Task[]>([]), entries = ref<Entry[]>([])
const clientCount = ref<number | null>(null)
const admin = ref<{ users: number; roles: number } | null>(null)
const loaded = ref(false)

const scopeText: Record<string, string> = {
  all: '全部專案',
  group: '所屬業務組的專案',
  owned_or_assigned: '自己負責或被指派的專案',
  assigned: '被指派的專案',
  public_demo: '公開示範專案（唯讀）',
}
const scopes = computed(() => auth.dataScopes.map(s => scopeText[s] ?? s).join('、') || '沒有可用的資料範圍')
const canTime = computed(() => auth.hasPerm('biz:timeEntry:read'))
const myEntries = computed(() => entries.value.filter(e => e.userId === auth.user?.userId))
const myHours = computed(() => myEntries.value.reduce((sum, e) => sum + Number(e.hours), 0))
const taskCount = (projectId: number) => tasks.value.filter(t => t.projectId === projectId).length
const taskName = (id: number) => tasks.value.find(t => t.id === id)?.name ?? `任務 ${id}`
const recent = computed(() => [...myEntries.value].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 5))

onMounted(async () => {
  try {
    nextReset.value = (await request.get<any, { nextResetUtc: string | null }>('/demo-reset')).nextResetUtc
    if (auth.hasPerm('biz:project:read')) projects.value = await request.get<any, Project[]>('/projects')
    if (auth.hasPerm('biz:task:read')) tasks.value = await request.get<any, Task[]>('/tasks')
    if (canTime.value) entries.value = await request.get<any, Entry[]>('/time-entries')
    if (auth.hasPerm('biz:client:read')) clientCount.value = (await request.get<any, unknown[]>('/clients')).length
    if (auth.hasPerm('system:user:list') && auth.hasPerm('system:role:list')) {
      admin.value = {
        users: (await listUsers({ pageNum: 1, pageSize: 1 })).total,
        roles: (await listRoles({ pageNum: 1, pageSize: 1 })).total,
      }
    }
  } catch { /* 錯誤由 API 攔截器處理(離線橫幅或提示) */ } finally { loaded.value = true }
})
</script>

<template>
  <div class="space-y-5">
    <section class="rounded bg-card p-5 shadow-sm">
      <h1 class="text-lg font-semibold">{{ auth.user?.nickName }}，你好</h1>
      <p class="mt-1 text-secondary">
        角色：{{ auth.roleNames.join('、') || '未指派' }} · 業務組：{{ auth.user?.deptName ?? '不隸屬業務組' }} · 資料範圍：{{ scopes }}
      </p>
      <p class="mt-2 text-xs text-disabled">下次示範資料重置：{{ nextReset ? new Date(nextReset).toLocaleString() : '未排程' }}。重置後所有修改會還原。</p>
    </section>

    <section class="grid grid-cols-2 gap-5 lg:grid-cols-4">
      <div class="rounded bg-card p-5 shadow-sm"><div class="text-[22px] font-bold">{{ projects.length }}</div><div class="text-[13px] text-disabled">範圍內專案</div></div>
      <div class="rounded bg-card p-5 shadow-sm"><div class="text-[22px] font-bold">{{ tasks.length }}</div><div class="text-[13px] text-disabled">範圍內任務</div></div>
      <div class="rounded bg-card p-5 shadow-sm"><div class="text-[22px] font-bold">{{ canTime ? myHours : '—' }}</div><div class="text-[13px] text-disabled">{{ canTime ? `我登記的工時（小時，共 ${myEntries.length} 筆）` : '沒有工時讀取權限' }}</div></div>
      <div class="rounded bg-card p-5 shadow-sm"><div class="text-[22px] font-bold">{{ clientCount ?? '—' }}</div><div class="text-[13px] text-disabled">{{ clientCount === null ? '沒有客戶讀取權限' : '範圍內客戶' }}</div></div>
    </section>

    <section class="rounded bg-card p-5 shadow-sm">
      <h2 class="mb-3 text-[15px] font-semibold">我的專案</h2>
      <table class="w-full text-left text-[13px]">
        <thead><tr class="bg-muted text-secondary"><th class="px-2.5 py-3 font-medium">專案</th><th class="px-2.5 py-3 font-medium">任務數</th><th class="px-2.5 py-3 font-medium"></th></tr></thead>
        <tbody>
          <tr v-for="p in projects" :key="p.id" class="border-b border-line hover:bg-muted">
            <td class="px-2.5 py-3">{{ p.name }}</td><td class="px-2.5 py-3">{{ taskCount(p.id) }}</td>
            <td class="px-2.5 py-3 text-right"><router-link :to="`/work/${p.id}`" class="text-primary hover:underline">開啟</router-link></td>
          </tr>
          <tr v-if="loaded && projects.length === 0"><td colspan="3" class="px-2.5 py-3 text-disabled">範圍內沒有專案。</td></tr>
        </tbody>
      </table>
    </section>

    <section v-if="canTime" class="rounded bg-card p-5 shadow-sm">
      <h2 class="mb-3 text-[15px] font-semibold">我最近登記的工時</h2>
      <table class="w-full text-left text-[13px]">
        <thead><tr class="bg-muted text-secondary"><th class="px-2.5 py-3 font-medium">日期</th><th class="px-2.5 py-3 font-medium">任務</th><th class="px-2.5 py-3 font-medium">小時</th><th class="px-2.5 py-3 font-medium">說明</th></tr></thead>
        <tbody>
          <tr v-for="e in recent" :key="e.id" class="border-b border-line"><td class="px-2.5 py-3">{{ e.date }}</td><td class="px-2.5 py-3">{{ taskName(e.taskId) }}</td><td class="px-2.5 py-3">{{ e.hours }}</td><td class="px-2.5 py-3">{{ e.note }}</td></tr>
          <tr v-if="loaded && recent.length === 0"><td colspan="4" class="px-2.5 py-3 text-disabled">還沒有登記工時。到「專案與工時」選一個任務就能登記。</td></tr>
        </tbody>
      </table>
    </section>

    <section v-if="admin" class="rounded bg-card p-5 shadow-sm">
      <h2 class="mb-1 text-[15px] font-semibold">系統管理</h2>
      <p class="text-secondary">共 {{ admin.users }} 個帳號、{{ admin.roles }} 個角色。管理頁的修改同樣會在下次重置時還原；示範帳號的密碼與你自己的角色不能改。</p>
    </section>
  </div>
</template>
