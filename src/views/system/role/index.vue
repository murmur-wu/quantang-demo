<script setup lang="ts">
import { roleLabel } from '../../../i18n/labels'
import { formatDate } from '../../../i18n/format'
import { useConfirm } from '../../../utils/confirm'
import { useI18n } from 'vue-i18n'

import { computed, onMounted, reactive, ref } from 'vue'
import {
  listRoles, createRole, updateRole, deleteRole, getRoleMenuIds, assignRoleMenus,
  listMenus, type SysMenu,
} from '../../../api'
import Modal from '../../../components/Modal.vue'
import Switch from '../../../components/Switch.vue'
import Pagination from '../../../components/Pagination.vue'
import MenuTreePanel from '../../../components/MenuTreePanel.vue'
import { buildTree, type TreeNode } from '../../../utils/tree'
import { message } from '../../../utils/message'

const { t } = useI18n()

const query = reactive({ roleName: '', roleKey: '', status: '', pageNum: 1, pageSize: 10 })
const rows = ref<any[]>([])
const total = ref(0)
const selected = ref(new Set<number>())
const menuTree = ref<TreeNode<SysMenu>[]>([])

async function load() {
  const res = await listRoles({
    ...query,
    roleName: query.roleName || undefined,
    roleKey: query.roleKey || undefined,
    status: query.status || undefined,
  })
  rows.value = res.rows
  total.value = res.total
  selected.value.clear()
}

function resetQuery() {
  Object.assign(query, { roleName: '', roleKey: '', status: '', pageNum: 1 })
  load()
}

onMounted(async () => {
  await load()
  try {
    const menus = await listMenus()
    menuTree.value = buildTree(menus, (m) => m.menuId, (m) => m.parentId)
  } catch { /* 無選單查詢權限時,權限樹不可用 */ }
})

// ---- 勾選 ----
const selectableRows = computed(() => rows.value.filter((r) => r.roleKey !== 'site_admin'))
const allChecked = computed(() => selectableRows.value.length > 0 && selectableRows.value.every((r) => selected.value.has(r.roleId)))
function toggleAll(on: boolean) {
  selected.value.clear()
  if (on) for (const r of selectableRows.value) selected.value.add(r.roleId)
}
function toggleOne(id: number) {
  if (selected.value.has(id)) selected.value.delete(id)
  else selected.value.add(id)
}

// ---- 新增/修改 ----
const showEdit = ref(false)
const editId = ref<number | null>(null)
const form = reactive({ roleName: '', roleKey: '', roleSort: 0, status: '0', remark: '' })
const editMenuIds = ref<number[]>([])

function openCreate() {
  editId.value = null
  Object.assign(form, { roleName: '', roleKey: '', roleSort: 0, status: '0', remark: '' })
  editMenuIds.value = []
  showEdit.value = true
}
async function openUpdate(row: any) {
  editId.value = row.roleId
  Object.assign(form, { roleName: row.roleName, roleKey: row.roleKey, roleSort: row.roleSort, status: row.status, remark: row.remark ?? '' })
  editMenuIds.value = await getRoleMenuIds(row.roleId) // 保留原勾選,權限由「權限設定」維護
  showEdit.value = true
}
async function save() {
  const payload = { ...form, menuIds: editMenuIds.value }
  if (editId.value === null) await createRole(payload)
  else await updateRole(editId.value, payload)
  message(t('system.saved'))
  showEdit.value = false
  await load()
}

// ---- 狀態開關 ----
async function toggleStatus(row: any) {
  const menuIds = await getRoleMenuIds(row.roleId)
  await updateRole(row.roleId, {
    roleName: row.roleName, roleKey: row.roleKey, roleSort: row.roleSort,
    status: row.status === '0' ? '1' : '0', remark: row.remark, menuIds,
  })
  message(t('system.statusUpdated'))
  await load()
}

// ---- 權限設定(選單權限樹) ----
const showPerm = ref(false)
const permRole = ref<any>(null)
const permChecked = ref(new Set<number>())

async function openPerm(row: any) {
  permRole.value = row
  permChecked.value = new Set(await getRoleMenuIds(row.roleId))
  showPerm.value = true
}
async function savePerm() {
  await assignRoleMenus(permRole.value.roleId, [...permChecked.value])
  message(t('system.permissionsUpdated'))
  showPerm.value = false
}

// ---- 刪除 / 匯出 ----
async function onDelete(ids: number[]) {
  if (!ids.length) return
  if (!await useConfirm(t('confirm.deleteRoles', { count: ids.length }))) return
  for (const id of ids) await deleteRole(id)
  message(t('system.deleted'))
  await load()
}

function goPage(p: number) {
  query.pageNum = p
  load()
}
</script>

<template>
  <div class="rounded bg-card p-5 shadow-sm">
    <!-- 搜尋列 -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <label class="flex items-center gap-2 text-[13px] text-secondary">
        {{ t('system.roleName') }} <input v-model="query.roleName" type="text" :placeholder="t('system.enterRoleName')" class="w-44 rounded border border-line px-3 py-2 outline-none focus:border-primary" />
      </label>
      <label class="flex items-center gap-2 text-[13px] text-secondary">
        {{ t('system.roleKey') }} <input v-model="query.roleKey" type="text" :placeholder="t('system.enterRoleKey')" class="w-44 rounded border border-line px-3 py-2 outline-none focus:border-primary" />
      </label>
      <label class="flex items-center gap-2 text-[13px] text-secondary">
        {{ t('system.status') }}
        <select v-model="query.status" class="rounded border border-line px-3 py-2 outline-none focus:border-primary">
          <option value="">{{ t('system.all') }}</option><option value="0">{{ t('system.enabled') }}</option><option value="1">{{ t('system.disabled') }}</option>
        </select>
      </label>
      <button class="rounded bg-primary px-3 py-2 text-xs text-white hover:bg-primary-hover" @click="goPage(1)">🔍 {{ t('system.search') }}</button>
      <button class="rounded border border-line px-3 py-2 text-xs text-secondary hover:border-primary hover:bg-muted hover:text-primary" @click="resetQuery">{{ t('system.reset') }}</button>
    </div>

    <!-- 工具列 -->
    <div class="mb-4 flex gap-2">
      <button v-perm="'system:role:add'" class="rounded bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary-hover" @click="openCreate">＋ {{ t('system.add') }}</button>
      <button v-perm="'system:role:remove'" :disabled="!selected.size" class="rounded bg-danger px-3 py-1.5 text-xs text-white hover:bg-danger-hover disabled:cursor-not-allowed disabled:opacity-50" @click="onDelete([...selected])">🗑 {{ t('system.delete') }}</button>
    </div>

    <table class="w-full text-[13px]">
      <thead>
        <tr class="bg-muted text-left text-secondary">
          <th class="w-8 px-2.5 py-3"><input type="checkbox" class="accent-primary" :checked="allChecked" @change="toggleAll(($event.target as HTMLInputElement).checked)" /></th>
          <th class="px-2.5 py-3 font-medium">{{ t('system.roleId') }}</th><th class="px-2.5 py-3 font-medium">{{ t('system.roleName') }}</th>
          <th class="px-2.5 py-3 font-medium">{{ t('system.roleKey') }}</th><th class="px-2.5 py-3 font-medium">{{ t('system.sortOrder') }}</th>
          <th class="px-2.5 py-3 font-medium">{{ t('system.status') }}</th><th class="px-2.5 py-3 font-medium">{{ t('system.createdAt') }}</th>
          <th class="px-2.5 py-3 font-medium">{{ t('system.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.roleId" class="border-b border-line hover:bg-muted">
          <td class="px-2.5 py-3">
            <input type="checkbox" class="accent-primary" :disabled="row.roleKey === 'site_admin'" :checked="selected.has(row.roleId)" @change="toggleOne(row.roleId)" />
          </td>
          <td class="px-2.5 py-3">{{ row.roleId }}</td>
          <td class="px-2.5 py-3">{{ roleLabel(row.roleKey, row.roleName) }}</td>
          <td class="px-2.5 py-3">
            <span class="rounded border px-1.5 py-0.5 text-xs" :class="row.roleKey === 'site_admin' ? 'border-[color-mix(in_srgb,var(--danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-danger' : 'border-[color-mix(in_srgb,var(--info)_35%,transparent)] bg-[color-mix(in_srgb,var(--info)_12%,transparent)] text-info'">{{ row.roleKey }}</span>
          </td>
          <td class="px-2.5 py-3">{{ row.roleSort }}</td>
          <td class="px-2.5 py-3">
            <Switch :on="row.status === '0'" :disabled="row.roleKey === 'site_admin'" @toggle="toggleStatus(row)" />
          </td>
          <td class="px-2.5 py-3">{{ row.createTime ? formatDate(row.createTime) : '' }}</td>
          <td class="px-2.5 py-3 whitespace-nowrap">
            <template v-if="row.roleKey !== 'site_admin'">
              <button v-perm="'system:role:edit'" class="px-1.5 text-primary hover:underline" @click="openUpdate(row)">{{ t('system.edit') }}</button>
              <button v-perm="'system:role:edit'" class="px-1.5 text-primary hover:underline" @click="openPerm(row)">{{ t('system.permissions') }}</button>
              <button v-perm="'system:role:remove'" class="px-1.5 text-danger hover:underline" @click="onDelete([row.roleId])">{{ t('system.delete') }}</button>
            </template>
            <template v-else>
              <button class="cursor-not-allowed px-1.5 text-disabled" disabled>{{ t('system.edit') }}</button>
              <button class="cursor-not-allowed px-1.5 text-disabled" disabled>{{ t('system.permissions') }}</button>
            </template>
          </td>
        </tr>
        <tr v-if="!rows.length"><td colspan="8" class="py-10 text-center text-disabled">{{ t('system.noData') }}</td></tr>
      </tbody>
    </table>

    <Pagination :total="total" :page-num="query.pageNum" :page-size="query.pageSize" @change="goPage" />

    <!-- 新增/修改角色 Modal(照 prototype:不含權限樹) -->
    <Modal :show="showEdit" :title="editId === null ? t('system.addRole') : t('system.editRole')" @close="showEdit = false" @confirm="save">
      <div class="grid grid-cols-2 gap-4 text-[13px]">
        <div>
          <label class="mb-1.5 block text-secondary"><span class="text-danger">*</span> {{ t('system.roleName') }}</label>
          <input v-model="form.roleName" type="text" :placeholder="t('system.enterRoleName')" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </div>
        <div>
          <label class="mb-1.5 block text-secondary"><span class="text-danger">*</span> {{ t('system.roleKey') }}</label>
          <input v-model="form.roleKey" type="text" :placeholder="t('system.roleKeyExample')" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </div>
        <div>
          <label class="mb-1.5 block text-secondary">{{ t('system.sortOrder') }}</label>
          <input v-model.number="form.roleSort" type="number" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </div>
        <div>
          <label class="mb-1.5 block text-secondary">{{ t('system.status') }}</label>
          <div class="flex gap-4 pt-2">
            <label class="flex items-center gap-1.5"><input v-model="form.status" type="radio" value="0" class="accent-primary" /> {{ t('system.enabled') }}</label>
            <label class="flex items-center gap-1.5"><input v-model="form.status" type="radio" value="1" class="accent-primary" /> {{ t('system.disabled') }}</label>
          </div>
        </div>
        <div class="col-span-2">
          <label class="mb-1.5 block text-secondary">{{ t('system.remark') }}</label>
          <textarea v-model="form.remark" :placeholder="t('system.enterRemark')" class="min-h-[70px] w-full rounded border border-line px-3 py-2 outline-none focus:border-primary"></textarea>
        </div>
      </div>
    </Modal>

    <!-- 權限設定 Modal:選單權限樹(照 prototype) -->
    <Modal :show="showPerm" :title="t('system.permissionsTitle', { name: permRole ? roleLabel(permRole.roleKey, permRole.roleName) : '' })" width="520px" @close="showPerm = false" @confirm="savePerm">
      <MenuTreePanel :nodes="menuTree" :checked="permChecked" />
    </Modal>
  </div>
</template>
