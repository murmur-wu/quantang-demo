<script setup lang="ts">
import { formatDate, formatNumber } from '../../i18n/format'
import { useConfirm } from '../../utils/confirm'

import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import api from '../../api/request'
import { strings } from '../../strings'
import { i18n } from '../../i18n'
const auth = useAuthStore()
const route = useRoute()
type Project = { id: number; name: string; clientId: number | null }
type Client = { id: number; name: string; industry: string; city: string }
// 客戶資訊只在有 biz:client:read 時載入;沒有權限的角色(如參觀訪客)不會發出請求。
const client = ref<Client>()
async function loadClient(p: Project) {
  client.value = p.clientId && auth.hasPerm('biz:client:read') ? await api.get(`/clients/${p.clientId}`) as unknown as Client : undefined
}
type Task = { id: number; projectId: number; name: string }
type Entry = { id: number; taskId: number; userId: number; nickName?: string; date: string; hours: number; note: string }
const projects = ref<Project[]>([]), tasks = ref<Task[]>([]), entries = ref<Entry[]>([])
const project = ref<Project>(), task = ref<Task>(), entry = ref<Entry>()
const taskName = ref(''), hours = ref(1), date = ref(new Date().toISOString().slice(0, 10)), note = ref('')
async function loadProjects() { projects.value = await api.get('/projects') as unknown as Project[] }
async function openProject(id: number) {
  project.value = await api.get(`/projects/${id}`) as unknown as Project
  tasks.value = await api.get('/tasks', { params: { projectId: id } }) as unknown as Task[]
  task.value = undefined; entries.value = []
  await loadClient(project.value)
}
async function openTask(id: number) {
  task.value = await api.get(`/tasks/${id}`) as unknown as Task
  taskName.value = task.value.name; entry.value = undefined
  entries.value = auth.hasPerm('biz:timeEntry:read') ? await api.get('/time-entries', { params: { taskId: id } }) as unknown as Entry[] : []
}
async function saveTask() {
  if (!project.value || !taskName.value.trim()) return
  const payload = { projectId: project.value.id, name: taskName.value }
  if (task.value) await api.put(`/tasks/${task.value.id}`, payload); else await api.post('/tasks', payload)
  await openProject(project.value.id); taskName.value = ''
}
async function saveEntry() {
  if (!task.value || !auth.user) return
  const payload = { taskId: task.value.id, userId: entry.value?.userId ?? auth.user.userId, date: date.value, hours: hours.value, note: note.value }
  if (entry.value) await api.put(`/time-entries/${entry.value.id}`, payload); else await api.post('/time-entries', payload)
  await openTask(task.value.id); note.value = ''; hours.value = 1
}
async function deleteTask(t: Task) {
  if (!project.value || !await useConfirm(i18n.global.t('confirm.deleteTask', { name: t.name }))) return
  await api.delete(`/tasks/${t.id}`)
  await openProject(project.value.id)
}
async function deleteEntry(e: Entry) {
  if (!task.value || !await useConfirm(i18n.global.t('confirm.deleteEntry'))) return
  await api.delete(`/time-entries/${e.id}`)
  await openTask(task.value.id)
}
function canDeleteEntry(e: Entry) {
  return (e.userId === auth.user?.userId && auth.hasPerm('biz:timeEntry:writeOwn')) || auth.hasPerm('biz:timeEntry:writeAny')
}
// 後端提供 nickName（查不到為空字串）；舊後端沒有此欄位時退回本人姓名或成員編號。
function entryMember(e: Entry) {
  return e.nickName?.trim() || (e.userId === auth.user?.userId ? auth.user.nickName?.trim() || strings.me : i18n.global.t('common.member', { id: e.userId }))
}
function editEntry(e: Entry) { entry.value = e; date.value = e.date; hours.value = e.hours; note.value = e.note }
onMounted(async () => { await loadProjects(); if (route.params.id) await openProject(Number(route.params.id)) })
// /work 與 /work/:id 共用同一個元件實例,網址上的編號改變時要重新向後端讀取(範圍外會得到 403 頁)。
watch(() => route.params.id, (id) => { if (id) openProject(Number(id)).catch(() => {}); else { project.value = undefined; task.value = undefined } })
</script>
<template>
  <div class="space-y-5 rounded bg-card p-5">
    <h1 class="text-xl font-semibold">{{ $t('app.workTitle') }}</h1>
    <section><h2 class="font-semibold">{{ $t('app.projectList') }}</h2><div class="mt-2 flex flex-wrap gap-2"><router-link v-for="p in projects" :key="p.id" :to="{ name: 'work-detail', params: { id: String(p.id) } }" class="rounded border border-line px-3 py-2 hover:text-primary">{{ p.name }}</router-link></div></section>
    <section v-if="project" class="space-y-3 border-t border-line pt-4"><h2 class="font-semibold">{{ $t('app.projectDetail', { name: project.name }) }}</h2>
      <p v-if="client" class="text-secondary">{{ $t('app.clientLabel', { name: client.name }) }} · {{ client.industry }} · {{ client.city }}</p>
      <p>{{ $t('app.taskList') }}</p><div class="flex flex-wrap gap-2"><span v-for="t in tasks" :key="t.id" class="flex gap-2"><button class="rounded border border-line px-3 py-2 hover:text-primary" @click="openTask(t.id)">{{ t.name }}</button><button v-if="auth.hasPerm('biz:task:write')" class="text-primary" @click="deleteTask(t)">{{ $t('system.delete') }}</button></span></div>
      <form v-if="auth.hasPerm('biz:task:write')" class="flex flex-wrap gap-2" @submit.prevent="saveTask"><input v-model="taskName" required maxlength="200" class="rounded border border-line p-2" :placeholder="$t('app.taskName')"><button class="rounded bg-primary px-3 py-2 text-white">{{ $t(task ? 'app.saveTask' : 'app.addTask') }}</button><button v-if="task" type="button" @click="task = undefined; taskName = ''">{{ $t('app.addOtherTask') }}</button></form>
    </section>
    <section v-if="task" class="space-y-3 border-t border-line pt-4"><h2 class="font-semibold">{{ $t('app.taskDetail', { name: task.name }) }}</h2><h3>{{ $t('app.timeEntries') }}</h3>
      <div v-for="e in entries" :key="e.id" class="flex flex-wrap gap-4">{{ formatDate(e.date) }} · {{ $t('app.hours', { hours: formatNumber(e.hours) }) }} · {{ entryMember(e) }} · {{ e.note }} <button v-if="canDeleteEntry(e)" class="text-primary" @click="editEntry(e)">{{ $t('system.edit') }}</button><button v-if="canDeleteEntry(e)" class="text-primary" @click="deleteEntry(e)">{{ $t('system.delete') }}</button></div>
      <form v-if="auth.hasPerm('biz:timeEntry:writeOwn')" class="flex flex-wrap gap-2" @submit.prevent="saveEntry"><input v-model="date" type="date" required class="rounded border border-line p-2"><input v-model.number="hours" type="number" min="0.01" max="24" step="0.01" required class="w-24 rounded border border-line p-2"><input v-model="note" maxlength="500" :placeholder="$t('app.description')" class="rounded border border-line p-2"><button class="rounded bg-primary px-3 py-2 text-white">{{ $t(entry ? 'app.saveEntry' : 'app.addEntry') }}</button><button v-if="entry" type="button" @click="entry = undefined">{{ $t('app.cancelEdit') }}</button></form>
    </section>
  </div>
</template>
