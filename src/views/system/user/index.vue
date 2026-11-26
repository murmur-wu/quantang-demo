<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  listUsers, createUser, updateUser, deleteUser, resetPassword,
  listRoles, listDepts, type SysDept,
} from '../../../api'
import Modal from '../../../components/Modal.vue'
import Switch from '../../../components/Switch.vue'
import Pagination from '../../../components/Pagination.vue'
import DeptTree from '../../../components/DeptTree.vue'
import { buildTree, flattenTree, pruneTree, type TreeNode } from '../../../utils/tree'
import { message } from '../../../utils/message'

const query = reactive({ userName: '', phone: '', status: '', deptId: null as number | null, pageNum: 1, pageSize: 10 })
const rows = ref<any[]>([])
const total = ref(0)
const selected = ref(new Set<number>())
const demoAccounts = new Set([
  'admin@quantang.demo', 'east.lead@quantang.demo', 'west.lead@quantang.demo',
  'owner@quantang.demo', 'advisor@quantang.demo', 'guest@quantang.demo',
])

// ---- 部門樹(左側) ----
const deptFilter = ref('')
const deptTree = ref<TreeNode<SysDept>[]>([])
const deptExpanded = reactive(new Set<number>())
const deptOptions = ref<{ deptId: number; label: string }[]>([])
const roleOptions = ref<any[]>([])

const visibleDeptTree = computed(() =>
  deptFilter.value ? pruneTree(deptTree.value, (d) => d.deptName.includes(deptFilter.value)) : deptTree.value,
)

function onSelectDept(id: number) {
  query.deptId = query.deptId === id ? null : id // 再點一次取消篩選
  goPage(1)
}

async function load() {
  const res = await listUsers({
    ...query,
    userName: query.userName || undefined,
    phone: query.phone || undefined,
    status: query.status || undefined,
    deptId: query.deptId ?? undefined,
  })
  rows.value = res.rows
  total.value = res.total
  selected.value.clear()
}

function resetQuery() {
  Object.assign(query, { userName: '', phone: '', status: '', deptId: null, pageNum: 1 })
  load()
}

onMounted(async () => {
  await load()
  try {
    const depts = await listDepts()
    deptTree.value = buildTree<SysDept>(depts, (d) => d.deptId, (d) => d.parentId)
    for (const d of depts) deptExpanded.add(d.deptId) // 預設全展開
    deptOptions.value = flattenTree(deptTree.value)
      .map((f) => ({ deptId: f.data.deptId, label: `${'　'.repeat(f.level)}${f.data.deptName}` }))
    roleOptions.value = (await listRoles({ pageNum: 1, pageSize: 100 })).rows
  } catch { /* 無部門/角色查詢權限時略過 */ }
})

// ---- 勾選 ----
const allChecked = computed(() => rows.value.length > 0 && rows.value.every((r) => selected.value.has(r.userId)))
function toggleAll(on: boolean) {
  selected.value.clear()
  if (on) for (const r of rows.value) selected.value.add(r.userId)
}
function toggleOne(id: number) {
  if (selected.value.has(id)) selected.value.delete(id)
  else selected.value.add(id)
}

// ---- 新增/修改 ----
const showEdit = ref(false)
const editId = ref<number | null>(null)
const form = reactive({
  userName: '', nickName: '', password: '', deptId: null as number | null,
  phone: '', email: '', status: '0', remark: '', roleIds: [] as number[],
})

function openCreate() {
  editId.value = null
  Object.assign(form, { userName: '', nickName: '', password: '', deptId: null, phone: '', email: '', status: '0', remark: '', roleIds: [] })
  showEdit.value = true
}
function openUpdate(row: any) {
  editId.value = row.userId
  Object.assign(form, {
    userName: row.userName, nickName: row.nickName, password: '',
    deptId: row.deptId ?? null, phone: row.phone ?? '', email: row.email ?? '',
    status: row.status, remark: row.remark ?? '', roleIds: [...row.roleIds],
  })
  showEdit.value = true
}
function openUpdateSelected() {
  const row = rows.value.find((r) => selected.value.has(r.userId))
  if (row) openUpdate(row)
}
async function save() {
  if (editId.value === null) await createUser(form)
  else await updateUser(editId.value, form)
  message('儲存成功')
  showEdit.value = false
  await load()
}

// ---- 狀態開關 ----
async function toggleStatus(row: any) {
  await updateUser(row.userId, {
    userName: row.userName, nickName: row.nickName, password: '',
    deptId: row.deptId ?? null, phone: row.phone, email: row.email,
    status: row.status === '0' ? '1' : '0', remark: row.remark, roleIds: [...row.roleIds],
  })
  message('狀態已更新')
  await load()
}

// ---- 刪除(單筆/批次) ----
async function onDelete(ids: number[]) {
  if (!ids.length) return
  if (!confirm(`確定刪除選取的 ${ids.length} 筆使用者嗎?`)) return
  for (const id of ids) await deleteUser(id)
  message('刪除成功')
  await load()
}

async function onResetPwd(row: any) {
  const pwd = prompt(`重設「${row.userName}」的密碼:`)
  if (!pwd) return
  await resetPassword(row.userId, pwd)
  message('密碼已重設')
}

function goPage(p: number) {
  query.pageNum = p
  load()
}
</script>

<template>
  <div class="grid items-start gap-5 lg:grid-cols-[280px_1fr]">
    <!-- 部門樹 -->
    <div class="rounded bg-card p-5 shadow-sm">
      <h3 class="mb-4 text-[15px] font-semibold">部門</h3>
      <input
        v-model="deptFilter"
        type="text"
        placeholder="請輸入部門名稱"
        class="mb-3 w-full rounded border border-line px-3 py-2 text-[13px] outline-none focus:border-primary"
      />
      <DeptTree :nodes="visibleDeptTree" :selected="query.deptId" :expanded="deptExpanded" @select="onSelectDept" />
    </div>

    <!-- 使用者列表 -->
    <div class="rounded bg-card p-5 shadow-sm">
      <!-- 搜尋列 -->
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <label class="flex items-center gap-2 text-[13px] text-secondary">
          帳號 <input v-model="query.userName" type="text" placeholder="請輸入帳號" class="w-44 rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </label>
        <label class="flex items-center gap-2 text-[13px] text-secondary">
          手機 <input v-model="query.phone" type="text" placeholder="請輸入手機號碼" class="w-44 rounded border border-line px-3 py-2 outline-none focus:border-primary" />
        </label>
        <label class="flex items-center gap-2 text-[13px] text-secondary">
          狀態
          <select v-model="query.status" class="rounded border border-line px-3 py-2 outline-none focus:border-primary">
            <option value="">全部</option><option value="0">啟用</option><option value="1">停用</option>
          </select>
        </label>
        <button class="rounded bg-primary px-3 py-2 text-xs text-white hover:bg-primary-hover" @click="goPage(1)">🔍 搜尋</button>
        <button class="rounded border border-line px-3 py-2 text-xs text-secondary hover:border-primary hover:bg-muted hover:text-primary" @click="resetQuery">重設</button>
      </div>

      <!-- 工具列 -->
      <div class="mb-4 flex gap-2">
        <button v-perm="'system:user:add'" class="rounded bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary-hover" @click="openCreate">＋ 新增</button>
        <button v-perm="'system:user:edit'" :disabled="selected.size !== 1" class="rounded bg-success px-3 py-1.5 text-xs text-white hover:bg-success-hover disabled:cursor-not-allowed disabled:opacity-50" @click="openUpdateSelected">✎ 修改</button>
        <button v-perm="'system:user:remove'" :disabled="!selected.size" class="rounded bg-danger px-3 py-1.5 text-xs text-white hover:bg-danger-hover disabled:cursor-not-allowed disabled:opacity-50" @click="onDelete([...selected])">🗑 刪除</button>
      </div>

      <table class="w-full text-[13px]">
        <thead>
          <tr class="bg-muted text-left text-secondary">
            <th class="w-8 px-2.5 py-3"><input type="checkbox" class="accent-primary" :checked="allChecked" @change="toggleAll(($event.target as HTMLInputElement).checked)" /></th>
            <th class="px-2.5 py-3 font-medium">使用者編號</th><th class="px-2.5 py-3 font-medium">帳號</th>
            <th class="px-2.5 py-3 font-medium">姓名</th><th class="px-2.5 py-3 font-medium">部門</th>
            <th class="px-2.5 py-3 font-medium">角色</th><th class="px-2.5 py-3 font-medium">手機</th>
            <th class="px-2.5 py-3 font-medium">狀態</th><th class="px-2.5 py-3 font-medium">建立時間</th>
            <th class="px-2.5 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.userId" class="border-b border-line hover:bg-muted">
            <td class="px-2.5 py-3"><input type="checkbox" class="accent-primary" :checked="selected.has(row.userId)" @change="toggleOne(row.userId)" /></td>
            <td class="px-2.5 py-3">{{ row.userId }}</td>
            <td class="px-2.5 py-3">{{ row.userName }}</td>
            <td class="px-2.5 py-3">{{ row.nickName }}</td>
            <td class="px-2.5 py-3">{{ row.deptName ?? '—' }}</td>
            <td class="px-2.5 py-3">
              <span v-for="r in row.roles" :key="r.roleId"
                class="mr-1 rounded border px-1.5 py-0.5 text-xs"
                :class="r.roleKey === 'site_admin' ? 'border-[color-mix(in_srgb,var(--danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-danger' : 'border-[color-mix(in_srgb,var(--info)_35%,transparent)] bg-[color-mix(in_srgb,var(--info)_12%,transparent)] text-info'"
              >{{ r.roleName }}</span>
              <span v-if="!row.roles.length" class="text-disabled">—</span>
            </td>
            <td class="px-2.5 py-3">{{ row.phone ?? '—' }}</td>
            <td class="px-2.5 py-3">
              <Switch :on="row.status === '0'" :disabled="demoAccounts.has(row.userName)" @toggle="toggleStatus(row)" />
            </td>
            <td class="px-2.5 py-3">{{ row.createTime?.slice(0, 10) }}</td>
            <td class="px-2.5 py-3 whitespace-nowrap">
              <button v-perm="'system:user:edit'" class="px-1.5 text-primary hover:underline" @click="openUpdate(row)">修改</button>
              <button v-if="!demoAccounts.has(row.userName)" v-perm="'system:user:resetPwd'" class="px-1.5 text-primary hover:underline" @click="onResetPwd(row)">重設密碼</button>
              <button v-if="!demoAccounts.has(row.userName)" v-perm="'system:user:remove'" class="px-1.5 text-danger hover:underline" @click="onDelete([row.userId])">刪除</button>
            </td>
          </tr>
          <tr v-if="!rows.length"><td colspan="10" class="py-10 text-center text-disabled">無資料</td></tr>
        </tbody>
      </table>

      <Pagination :total="total" :page-num="query.pageNum" :page-size="query.pageSize" @change="goPage" />

      <!-- 新增/修改 Modal -->
      <Modal :show="showEdit" :title="editId === null ? '新增使用者' : '修改使用者'" @close="showEdit = false" @confirm="save">
        <div class="grid grid-cols-2 gap-4 text-[13px]">
          <div>
            <label class="mb-1.5 block text-secondary"><span class="text-danger">*</span> 帳號</label>
            <input v-model="form.userName" :disabled="editId !== null" type="text" placeholder="請輸入帳號" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary disabled:bg-muted" />
          </div>
          <div>
            <label class="mb-1.5 block text-secondary"><span class="text-danger">*</span> 姓名</label>
            <input v-model="form.nickName" type="text" placeholder="請輸入姓名" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1.5 block text-secondary">{{ editId === null ? '密碼(必填)' : '密碼(留空不變更)' }}</label>
            <input v-model="form.password" type="password" placeholder="請輸入密碼" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1.5 block text-secondary">手機號碼</label>
            <input v-model="form.phone" type="text" placeholder="請輸入手機號碼" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1.5 block text-secondary">歸屬部門</label>
            <select v-model="form.deptId" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary">
              <option :value="null">—</option>
              <option v-for="d in deptOptions" :key="d.deptId" :value="d.deptId">{{ d.label }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-secondary">角色(可多選)</label>
            <select v-model="form.roleIds" multiple class="h-24 w-full rounded border border-line px-3 py-2 outline-none focus:border-primary">
              <option v-for="r in roleOptions" :key="r.roleId" :value="r.roleId">{{ r.roleName }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-secondary">Email</label>
            <input v-model="form.email" type="text" placeholder="請輸入 Email" class="w-full rounded border border-line px-3 py-2 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1.5 block text-secondary">狀態</label>
            <div class="flex gap-4 pt-2">
              <label class="flex items-center gap-1.5"><input v-model="form.status" type="radio" value="0" class="accent-primary" /> 啟用</label>
              <label class="flex items-center gap-1.5"><input v-model="form.status" type="radio" value="1" class="accent-primary" /> 停用</label>
            </div>
          </div>
          <div class="col-span-2">
            <label class="mb-1.5 block text-secondary">備註</label>
            <textarea v-model="form.remark" placeholder="請輸入備註" class="min-h-[70px] w-full rounded border border-line px-3 py-2 outline-none focus:border-primary"></textarea>
          </div>
        </div>
      </Modal>
    </div>
  </div>
</template>
