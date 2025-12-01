<template>
  <div class="account-page">
    <!-- 搜索栏 -->
    <ArtSearchBar
      v-model:formData="searchForm"
      :fields="searchFields"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 表格头部 -->
    <ArtTableHeader :title="`账号列表 (${tableData.total})`">
      <template #right>
        <ElButton :icon="Refresh" circle @click="refreshData" v-ripple />
      </template>
    </ArtTableHeader>

    <!-- 数据表格 -->
    <ArtTable
      :data="tableData.list"
      :columns="tableColumns"
      :loading="loading"
      row-key="accountId"
    >
      <!-- 账号类别插槽 -->
      <template #role="{ row }">
        <ElTag :type="getRoleTagType(row.role)">
          {{ getRoleLabel(row.role) }}
        </ElTag>
      </template>

      <!-- 账号状态插槽 -->
      <template #enabled="{ row }">
        <ElSwitch
          :model-value="row.enabled"
          @change="(val) => handleStatusChange(row, val)"
          :loading="row.switchLoading"
        />
      </template>

      <!-- 操作插槽 -->
      <template #action="{ row }">
        <ElSpace>
          <ElButton
            type="primary"
            link
            :icon="Edit"
            @click="handleChangeRole(row)"
          >
            修改权限
          </ElButton>
        </ElSpace>
      </template>
    </ArtTable>

    <!-- 修改权限对话框 -->
    <ElDialog
      v-model="roleDialogVisible"
      title="修改账号权限"
      width="500px"
      :close-on-click-modal="false"
    >
      <ElForm label-width="100px">
        <ElFormItem label="账号ID">
          <ElInput :model-value="currentAccount?.accountId" disabled />
        </ElFormItem>
        <ElFormItem label="员工姓名">
          <ElInput :model-value="currentAccount?.employeeName" disabled />
        </ElFormItem>
        <ElFormItem label="当前权限">
          <ElTag :type="getRoleTagType(currentAccount?.role)">
            {{ getRoleLabel(currentAccount?.role) }}
          </ElTag>
        </ElFormItem>
        <ElFormItem label="新权限">
          <ElSelect v-model="newRole" placeholder="请选择新权限" style="width: 100%">
            <ElOption label="超级管理员" value="R_SUPER" />
            <ElOption label="管理员" value="R_ADMIN" />
            <ElOption label="普通用户" value="R_USER" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="roleDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleConfirmRoleChange" :loading="roleChangeLoading">
          确认修改
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { Refresh, Edit } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useTable } from '@/utils/table'
  import { fetchGetAccountList, fetchUpdateAccount } from '@/api/system-manage'

  defineOptions({ name: 'Account' })

  type AccountListItem = Api.SystemManage.AccountListItem
  type AccountRole = Api.SystemManage.AccountRole

  // 搜索表单
  const searchForm = ref({
    accountId: '',
    employeeName: '',
    role: undefined as AccountRole | undefined,
    enabled: undefined as boolean | undefined
  })

  // 搜索字段配置
  const searchFields = [
    {
      type: 'input',
      prop: 'accountId',
      label: '账号ID',
      placeholder: '请输入账号ID'
    },
    {
      type: 'input',
      prop: 'employeeName',
      label: '员工姓名',
      placeholder: '请输入员工姓名'
    },
    {
      type: 'select',
      prop: 'role',
      label: '账号类别',
      placeholder: '请选择账号类别',
      options: [
        { label: '超级管理员', value: 'R_SUPER' },
        { label: '管理员', value: 'R_ADMIN' },
        { label: '普通用户', value: 'R_USER' }
      ]
    },
    {
      type: 'select',
      prop: 'enabled',
      label: '账号状态',
      placeholder: '请选择账号状态',
      options: [
        { label: '启用', value: true },
        { label: '禁用', value: false }
      ]
    }
  ]

  // 表格列配置
  const tableColumns = ref([
    { type: 'index', label: '序号', width: 70 },
    { prop: 'accountId', label: '账号ID', width: 200 },
    { prop: 'employeeName', label: '员工姓名', width: 150 },
    { prop: 'role', label: '账号类别', width: 150, slot: 'role' },
    { prop: 'enabled', label: '账号状态', width: 100, slot: 'enabled' },
    { prop: 'createTime', label: '创建时间', width: 180 },
    { prop: 'updateTime', label: '更新时间', width: 180 },
    { prop: 'action', label: '操作', width: 150, fixed: 'right', slot: 'action' }
  ])

  // 使用 useTable hooks
  const {
    data: tableData,
    loading,
    refresh: refreshData,
    updateParams
  } = useTable(fetchGetAccountList, {
    immediate: true,
    params: searchForm.value
  })

  // 搜索
  const handleSearch = () => {
    updateParams(searchForm.value)
    refreshData()
  }

  // 重置
  const handleReset = () => {
    searchForm.value = {
      accountId: '',
      employeeName: '',
      role: undefined,
      enabled: undefined
    }
    handleSearch()
  }

  // 获取角色标签类型
  const getRoleTagType = (role?: AccountRole) => {
    const typeMap = {
      R_SUPER: 'danger',
      R_ADMIN: 'warning',
      R_USER: 'info'
    }
    return role ? typeMap[role] : 'info'
  }

  // 获取角色标签文本
  const getRoleLabel = (role?: AccountRole) => {
    const labelMap = {
      R_SUPER: '超级管理员',
      R_ADMIN: '管理员',
      R_USER: '普通用户'
    }
    return role ? labelMap[role] : ''
  }

  // 处理账号状态变更
  const handleStatusChange = async (row: AccountListItem & { switchLoading?: boolean }, newStatus: boolean) => {
    try {
      const action = newStatus ? '启用' : '禁用'
      await ElMessageBox.confirm(
        `确定${action}账号"${row.employeeName}"吗？`,
        `${action}确认`,
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      // 设置加载状态
      row.switchLoading = true

      await fetchUpdateAccount({
        accountId: row.accountId,
        enabled: newStatus
      })

      ElMessage.success(`${action}成功`)
      refreshData()
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error('操作失败')
        console.error('状态变更错误:', error)
      }
    } finally {
      row.switchLoading = false
    }
  }

  // 修改权限对话框
  const roleDialogVisible = ref(false)
  const currentAccount = ref<AccountListItem | null>(null)
  const newRole = ref<AccountRole>('R_USER')
  const roleChangeLoading = ref(false)

  // 打开修改权限对话框
  const handleChangeRole = (row: AccountListItem) => {
    currentAccount.value = row
    newRole.value = row.role
    roleDialogVisible.value = true
  }

  // 确认修改权限
  const handleConfirmRoleChange = async () => {
    if (!currentAccount.value) return

    if (newRole.value === currentAccount.value.role) {
      ElMessage.warning('新权限与当前权限相同')
      return
    }

    try {
      roleChangeLoading.value = true

      await fetchUpdateAccount({
        accountId: currentAccount.value.accountId,
        role: newRole.value
      })

      ElMessage.success('权限修改成功')
      roleDialogVisible.value = false
      refreshData()
    } catch (error) {
      ElMessage.error('权限修改失败')
      console.error('权限修改错误:', error)
    } finally {
      roleChangeLoading.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .account-page {
    padding: 20px;
  }
</style>
