<script setup lang="ts">
import { onMounted, ref } from 'vue'
import api from '../../api/request'
type Client = { id: number; name: string; industry: string; city: string }
type Project = { id: number; name: string; clientId: number | null }
const clients = ref<Client[]>([]), projects = ref<Project[]>([]), loaded = ref(false)
// 兩個列表都已由後端依資料範圍過濾；這裡只做顯示用的對應。
onMounted(async () => {
  clients.value = await api.get('/clients') as unknown as Client[]
  projects.value = await api.get('/projects') as unknown as Project[]
  loaded.value = true
})
const projectsOf = (id: number) => projects.value.filter(p => p.clientId === id)
</script>
<template>
  <div class="rounded bg-card p-5 shadow-sm">
    <h1 class="mb-2 text-lg font-semibold">客戶</h1>
    <p class="mb-4 text-secondary">只列出你的資料範圍內專案所屬的客戶，僅供閱讀。</p>
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead><tr class="bg-muted"><th class="p-3">客戶</th><th class="p-3">產業</th><th class="p-3">所在地</th><th class="p-3">範圍內專案</th></tr></thead>
        <tbody>
          <tr v-for="c in clients" :key="c.id" class="border-b border-line">
            <td class="p-3 font-medium">{{ c.name }}</td><td class="p-3">{{ c.industry }}</td><td class="p-3">{{ c.city }}</td>
            <td class="p-3"><div class="flex flex-wrap gap-2"><router-link v-for="p in projectsOf(c.id)" :key="p.id" :to="`/work/${p.id}`" class="text-primary hover:underline">{{ p.name }}</router-link></div></td>
          </tr>
          <tr v-if="loaded && clients.length === 0"><td colspan="4" class="p-3 text-disabled">範圍內沒有客戶。</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
