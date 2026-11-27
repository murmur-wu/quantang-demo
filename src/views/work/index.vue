<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import api from '../../api/request'
import { strings } from '../../strings'
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
type Entry = { id: number; taskId: number; userId: number; date: string; hours: number; note: string }
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
  if (!project.value || !confirm(`確定要刪除任務「${t.name}」嗎？`)) return
  await api.delete(`/tasks/${t.id}`)
  await openProject(project.value.id)
}
async function deleteEntry(e: Entry) {
  if (!task.value || !confirm('確定要刪除這筆工時紀錄嗎？')) return
  await api.delete(`/time-entries/${e.id}`)
  await openTask(task.value.id)
}
function canDeleteEntry(e: Entry) {
  return (e.userId === auth.user?.userId && auth.hasPerm('biz:timeEntry:writeOwn')) || auth.hasPerm('biz:timeEntry:writeAny')
}
// 完整姓名需由後端在工時回應加入 nickName 或同等欄位；本次未改後端，也未呼叫帳號清單。
function entryMember(e: Entry) {
  return e.userId === auth.user?.userId ? auth.user.nickName?.trim() || strings.me : strings.member(e.userId)
}
function editEntry(e: Entry) { entry.value = e; date.value = e.date; hours.value = e.hours; note.value = e.note }
onMounted(async () => { await loadProjects(); if (route.params.id) await openProject(Number(route.params.id)) })
// /work 與 /work/:id 共用同一個元件實例,網址上的編號改變時要重新向後端讀取(範圍外會得到 403 頁)。
watch(() => route.params.id, (id) => { if (id) openProject(Number(id)).catch(() => {}); else { project.value = undefined; task.value = undefined } })
</script>
<template>
  <div class="space-y-5 rounded bg-card p-5">
    <h1 class="text-xl font-semibold">專案、任務與工時</h1>
    <section><h2 class="font-semibold">專案列表</h2><div class="mt-2 flex flex-wrap gap-2"><router-link v-for="p in projects" :key="p.id" :to="{ name: 'work-detail', params: { id: String(p.id) } }" class="rounded border border-line px-3 py-2 hover:text-primary">{{ p.name }}</router-link></div></section>
    <section v-if="project" class="space-y-3 border-t border-line pt-4"><h2 class="font-semibold">專案詳情：{{ project.name }}</h2>
      <p v-if="client" class="text-secondary">客戶：{{ client.name }} · {{ client.industry }} · {{ client.city }}</p>
      <p>任務列表</p><div class="flex flex-wrap gap-2"><span v-for="t in tasks" :key="t.id" class="flex gap-2"><button class="rounded border border-line px-3 py-2 hover:text-primary" @click="openTask(t.id)">{{ t.name }}</button><button v-if="auth.hasPerm('biz:task:write')" class="text-primary" @click="deleteTask(t)">刪除</button></span></div>
      <form v-if="auth.hasPerm('biz:task:write')" class="flex flex-wrap gap-2" @submit.prevent="saveTask"><input v-model="taskName" required maxlength="200" class="rounded border border-line p-2" placeholder="任務名稱"><button class="rounded bg-primary px-3 py-2 text-white">{{ task ? '儲存任務' : '新增任務' }}</button><button v-if="task" type="button" @click="task = undefined; taskName = ''">新增其他任務</button></form>
    </section>
    <section v-if="task" class="space-y-3 border-t border-line pt-4"><h2 class="font-semibold">任務詳情：{{ task.name }}</h2><h3>工時紀錄</h3>
      <div v-for="e in entries" :key="e.id" class="flex flex-wrap gap-4">{{ e.date }} · {{ e.hours }} 小時 · {{ entryMember(e) }} · {{ e.note }} <button v-if="canDeleteEntry(e)" class="text-primary" @click="editEntry(e)">修改</button><button v-if="canDeleteEntry(e)" class="text-primary" @click="deleteEntry(e)">刪除</button></div>
      <form v-if="auth.hasPerm('biz:timeEntry:writeOwn')" class="flex flex-wrap gap-2" @submit.prevent="saveEntry"><input v-model="date" type="date" required class="rounded border border-line p-2"><input v-model.number="hours" type="number" min="0.01" max="24" step="0.01" required class="w-24 rounded border border-line p-2"><input v-model="note" maxlength="500" placeholder="說明" class="rounded border border-line p-2"><button class="rounded bg-primary px-3 py-2 text-white">{{ entry ? '儲存工時' : '新增工時' }}</button><button v-if="entry" type="button" @click="entry = undefined">取消修改</button></form>
    </section>
  </div>
</template>
