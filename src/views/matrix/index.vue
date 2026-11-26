<script setup lang="ts">
import { onMounted, ref } from 'vue'
import request from '../../api/request'
type Role = { roleId: number; roleName: string; roleKey: string }
type Matrix = { roles: Role[]; permissions: string[]; links: { roleId: number; perms: string }[]; adminHasAllPermissions: boolean }
const matrix = ref<Matrix | null>(null)
onMounted(async () => { matrix.value = await request.get<any, Matrix>('/permission-matrix') })
function allowed(role: Role, permission: string) {
  return (role.roleKey === 'site_admin' && matrix.value?.adminHasAllPermissions) || matrix.value?.links.some(x => x.roleId === role.roleId && x.perms === permission)
}
</script>
<template>
  <div class="rounded bg-card p-5 shadow-sm">
    <h1 class="mb-2 text-lg font-semibold">權限矩陣</h1>
    <p class="mb-4 text-secondary">角色與權限碼一覽，僅供閱讀。</p>
    <div v-if="matrix" class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead><tr class="bg-muted"><th class="p-3">權限碼</th><th v-for="role in matrix.roles" :key="role.roleId" class="p-3">{{ role.roleName }}</th></tr></thead>
        <tbody><tr v-for="permission in matrix.permissions" :key="permission" class="border-b border-line"><td class="p-3">{{ permission }}</td><td v-for="role in matrix.roles" :key="role.roleId" class="p-3">{{ allowed(role, permission) ? '✓' : '—' }}</td></tr></tbody>
      </table>
    </div>
  </div>
</template>
