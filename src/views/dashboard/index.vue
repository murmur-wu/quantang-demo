<script setup lang="ts">
import { roleLabel, scopeLabel } from '../../i18n/labels'
import { formatDate, formatNumber } from '../../i18n/format'
import { formatDateTime } from '../../i18n/format'
import { useI18n } from 'vue-i18n'
import { computed, onMounted, ref } from 'vue'
import request from '../../api/request'
import { useAuthStore } from '../../stores/auth'
import { listUsers, listRoles } from '../../api'
import { strings } from '../../strings'

// 工作台:自己權限範圍內的專案與待辦摘要。所有列表都已由後端依資料範圍過濾,這裡只做加總與顯示。
const { t } = useI18n()
const auth = useAuthStore()
type Project = { id: number; name: string; clientId: number | null }
type Task = { id: number; projectId: number; name: string }
type Entry = { id: number; taskId: number; userId: number; date: string; hours: number; note: string }

const nextReset = ref<string | null>(null)
const projects = ref<Project[]>([]), tasks = ref<Task[]>([]), entries = ref<Entry[]>([])
const clientCount = ref<number | null>(null)
const admin = ref<{ users: number; roles: number } | null>(null)
const loaded = ref(false)
const loadFailed = ref(false)

const scopes = computed(() => auth.dataScopes.map(s => scopeLabel(s)).join(', ') || t('public.noScope'))
const canTime = computed(() => auth.hasPerm('biz:timeEntry:read'))
const myEntries = computed(() => entries.value.filter(e => e.userId === auth.user?.userId))
const myHours = computed(() => myEntries.value.reduce((sum, e) => sum + Number(e.hours), 0))
const taskCount = (projectId: number) => tasks.value.filter(t => t.projectId === projectId).length
const taskName = (id: number) => tasks.value.find(t => t.id === id)?.name ?? t('public.taskFallback', { id })
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
  } catch { loadFailed.value = true } finally { loaded.value = true }
})
</script>

<template>
  <div class="space-y-5">
    <section class="rounded bg-card p-5 shadow-sm">
      <h1 class="text-lg font-semibold">{{ t('public.greeting', { name: auth.user?.nickName ?? '' }) }}</h1>
      <p class="mt-1 text-secondary">
        {{ t('public.roleLine', { roles: auth.roleNames.map((name, i) => roleLabel(auth.roles.length === auth.roleNames.length ? auth.roles[i] : undefined, name)).join(', ') || t('public.unassigned'), dept: auth.user?.deptName ?? t('public.noDept'), scopes }) }}
      </p>
      <p class="mt-2 text-xs text-disabled">{{ t('public.resetInfo', { time: nextReset ? formatDateTime(nextReset) + ' (UTC+8)' : t('common.unscheduled') }) }}</p>
    </section>

    <p v-if="!loaded || loadFailed" role="status" class="text-secondary">{{ loadFailed ? strings.loadFailed : strings.loading }}</p>
    <section class="grid grid-cols-2 gap-5 lg:grid-cols-4">
      <div class="rounded bg-card p-5 shadow-sm"><div class="text-[22px] font-bold">{{ loaded && !loadFailed ? formatNumber(projects.length) : strings.loadingPlaceholder }}</div><div class="text-[13px] text-disabled">{{ t('public.projectsInScope') }}</div></div>
      <div class="rounded bg-card p-5 shadow-sm"><div class="text-[22px] font-bold">{{ loaded && !loadFailed ? formatNumber(tasks.length) : strings.loadingPlaceholder }}</div><div class="text-[13px] text-disabled">{{ t('public.tasksInScope') }}</div></div>
      <div class="rounded bg-card p-5 shadow-sm"><div class="text-[22px] font-bold">{{ loaded && !loadFailed && canTime ? formatNumber(myHours) : strings.loadingPlaceholder }}</div><div class="text-[13px] text-disabled">{{ !loaded || loadFailed ? strings.loadingPlaceholder : canTime ? t('common.myHours', { count: formatNumber(myEntries.length) }) : t('public.noTimeAccess') }}</div></div>
      <div class="rounded bg-card p-5 shadow-sm"><div class="text-[22px] font-bold">{{ loaded && !loadFailed ? clientCount === null ? strings.loadingPlaceholder : formatNumber(clientCount) : strings.loadingPlaceholder }}</div><div class="text-[13px] text-disabled">{{ !loaded || loadFailed ? strings.loadingPlaceholder : clientCount === null ? t('public.noClientAccess') : t('public.clientsInScope') }}</div></div>
    </section>

    <section class="rounded bg-card p-5 shadow-sm">
      <h2 class="mb-3 text-[15px] font-semibold">{{ t('public.myProjects') }}</h2>
      <table class="w-full text-left text-[13px]">
        <thead><tr class="bg-muted text-secondary"><th class="px-2.5 py-3 font-medium">{{ t('public.project') }}</th><th class="px-2.5 py-3 font-medium">{{ t('public.taskCount') }}</th><th class="px-2.5 py-3 font-medium"></th></tr></thead>
        <tbody>
          <tr v-for="p in loaded && !loadFailed ? projects : []" :key="p.id" class="border-b border-line hover:bg-muted">
            <td class="px-2.5 py-3">{{ p.name }}</td><td class="px-2.5 py-3">{{ formatNumber(taskCount(p.id)) }}</td>
            <td class="px-2.5 py-3 text-right"><router-link :to="`/work/${p.id}`" class="text-primary hover:underline">{{ t('public.open') }}</router-link></td>
          </tr>
          <tr v-if="loaded && !loadFailed && projects.length === 0"><td colspan="3" class="px-2.5 py-3 text-disabled">{{ t('public.noProjects') }}</td></tr>
        </tbody>
      </table>
    </section>

    <section v-if="canTime" class="rounded bg-card p-5 shadow-sm">
      <h2 class="mb-3 text-[15px] font-semibold">{{ t('public.recentTime') }}</h2>
      <table class="w-full text-left text-[13px]">
        <thead><tr class="bg-muted text-secondary"><th class="px-2.5 py-3 font-medium">{{ t('public.date') }}</th><th class="px-2.5 py-3 font-medium">{{ t('public.task') }}</th><th class="px-2.5 py-3 font-medium">{{ t('public.hours') }}</th><th class="px-2.5 py-3 font-medium">{{ t('public.description') }}</th></tr></thead>
        <tbody>
          <tr v-for="e in loaded && !loadFailed ? recent : []" :key="e.id" class="border-b border-line"><td class="px-2.5 py-3">{{ formatDate(e.date) }}</td><td class="px-2.5 py-3">{{ taskName(e.taskId) }}</td><td class="px-2.5 py-3">{{ formatNumber(e.hours) }}</td><td class="px-2.5 py-3">{{ e.note }}</td></tr>
          <tr v-if="loaded && !loadFailed && recent.length === 0"><td colspan="4" class="px-2.5 py-3 text-disabled">{{ t('public.noTime') }}</td></tr>
        </tbody>
      </table>
    </section>

    <section v-if="admin" class="rounded bg-card p-5 shadow-sm">
      <h2 class="mb-1 text-[15px] font-semibold">{{ t('public.adminTitle') }}</h2>
      <p class="text-secondary">{{ t('public.adminInfo', { users: formatNumber(admin.users), roles: formatNumber(admin.roles) }) }}</p>
    </section>
  </div>
</template>
