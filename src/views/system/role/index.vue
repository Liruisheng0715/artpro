<template>
  <div class="role-page">
    <!-- 搜索栏 -->
    <ArtSearchBar
      v-model:formData="searchForm"
      :fields="searchFields"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 表格头部 -->
    <ArtTableHeader :title="`角色列表 (${tableData.total})`">
      <template #right>
        <ElButton :icon="Refresh" circle @click="refreshData" v-ripple />
      </template>
    </ArtTableHeader>

    <!-- 数据表格 -->
    <ArtTable
      :data="tableData.list"
      :columns="tableColumns"
      :loading="loading"
      row-key="roleId"
    >
      <!-- 角色代码插槽 -->
      <template #roleCode="{ row }">
        <ElTag :type="getRoleTagType(row.roleCode)">
          {{ getRoleLabel(row.roleCode) }}
        </ElTag>
      </template>

      <!-- 角色状态插槽 -->
      <template #enabled="{ row }">
        <ElSwitch
          :model-value="row.enabled"
          @change="(val) => handleStatusChange(row, val)"
          :loading="row.switchLoading"
          :disabled="!isSuperAdmin"
        />
      </template>

      <!-- 操作插槽 -->
      <template #action="{ row }">
        <ElButton
          type="primary"
          link
          :icon="Edit"
          @click="handleEditPermission(row)"
        >
          修改权限
        </ElButton>
      </template>
    </ArtTable>

    <!-- 修改权限对话框 -->
    <ElDialog
      v-model="permissionDialogVisible"
      title="修改角色权限"
      width="500px"
      :close-on-click-modal="false"
    >
      <ElForm label-width="100px">
        <ElFormItem label="角色ID">
          <ElInput :model-value="currentRole?.roleId" disabled />
        </ElFormItem>
        <ElFormItem label="角色名称">
          <ElInput :model-value="currentRole?.roleName" disabled />
        </ElFormItem>
        <ElFormItem label="当前权限">
          <ElTag :type="getRoleTagType(currentRole?.roleCode)">
            {{ getRoleLabel(currentRole?.roleCode) }}
          </ElTag>
        </ElFormItem>
        <ElFormItem label="新权限">
          <ElSelect v-model="newRoleCode" placeholder="请选择新权限" style="width: 100%">
            <ElOption label="超级管理员" value="R_SUPER" />
            <ElOption label="管理员" value="R_ADMIN" />
            <ElOption label="普通用户" value="R_USER" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="permissionDialogVisible = false">取消</ElButton>
        <ElButton
          type="primary"
          @click="handleConfirmPermissionChange"
          :loading="permissionChangeLoading"
        >
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
  import { useUserStore } from '@/store/modules/user'
  import {
    fetchGetRoleList,
    fetchUpdateRoleStatus,
    fetchUpdateRolePermission
  } from '@/api/system-manage'

  defineOptions({ name: 'Role' })

  type RoleListItem = Api.SystemManage.RoleListItem
  type RoleType = Api.SystemManage.RoleType

  const userStore = useUserStore()

  // 检查是否是超级管理员
  const isSuperAdmin = computed(() => {
    const userInfo = userStore.getUserInfo
    return userInfo.roles?.includes('R_SUPER') || false
  })

  // 搜索表单
  const searchForm = ref({
    roleId: '',
    roleName: '',
    roleCode: undefined as RoleType | undefined,
    enabled: undefined as boolean | undefined
  })

  // 搜索字段配置
  const searchFields = [
    {
      type: 'input',
      prop: 'roleId',
      label: '角色ID',
      placeholder: '请输入角色ID'
    },
    {
      type: 'input',
      prop: 'roleName',
      label: '角色名称',
      placeholder: '请输入角色名称'
    },
    {
      type: 'select',
      prop: 'roleCode',
      label: '角色等级',
      placeholder: '请选择角色等级',
      options: [
        { label: '超级管理员', value: 'R_SUPER' },
        { label: '管理员', value: 'R_ADMIN' },
        { label: '普通用户', value: 'R_USER' }
      ]
    },
    {
      type: 'select',
      prop: 'enabled',
      label: '角色状态',
      placeholder: '请选择角色状态',
      options: [
        { label: '启用', value: true },
        { label: '禁用', value: false }
      ]
    }
  ]

  // 表格列配置
  const tableColumns = ref([
    { type: 'index', label: '序号', width: 70 },
    { prop: 'roleId', label: '角色ID', width: 200 },
    { prop: 'roleName', label: '角色名称', width: 180 },
    { prop: 'roleCode', label: '角色等级', width: 150, slot: 'roleCode' },
    { prop: 'enabled', label: '角色状态', width: 120, slot: 'enabled' },
    { prop: 'action', label: '操作', width: 120, fixed: 'right', slot: 'action' }
  ])

  // 使用 useTable hooks
  const {
    data: tableData,
    loading,
    refresh: refreshData,
    updateParams
  } = useTable(fetchGetRoleList, {
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
      roleId: '',
      roleName: '',
      roleCode: undefined,
      enabled: undefined
    }
    handleSearch()
  }

  // 获取角色标签类型
  const getRoleTagType = (roleCode?: RoleType) => {
    const typeMap = {
      R_SUPER: 'danger',
      R_ADMIN: 'warning',
      R_USER: 'info'
    }
    return roleCode ? typeMap[roleCode] : 'info'
  }

  // 获取角色标签文本
  const getRoleLabel = (roleCode?: RoleType) => {
    const labelMap = {
      R_SUPER: '超级管理员',
      R_ADMIN: '管理员',
      R_USER: '普通用户'
    }
    return roleCode ? labelMap[roleCode] : ''
  }

  // 处理角色状态变更
  const handleStatusChange = async (
    row: RoleListItem & { switchLoading?: boolean },
    newStatus: boolean
  ) => {
    // 只有超级管理员可以修改状态
    if (!isSuperAdmin.value) {
      ElMessage.error('只有超级管理员才能修改角色状态')
      return
    }

    try {
      const action = newStatus ? '启用' : '禁用'
      await ElMessageBox.confirm(
        `确定${action}角色"${row.roleName}"吗？`,
        `${action}确认`,
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      // 设置加载状态
      row.switchLoading = true

      await fetchUpdateRoleStatus({
        roleId: row.roleId,
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
  const permissionDialogVisible = ref(false)
  const currentRole = ref<RoleListItem | null>(null)
  const newRoleCode = ref<RoleType>('R_USER')
  const permissionChangeLoading = ref(false)

  // 打开修改权限对话框
  const handleEditPermission = (row: RoleListItem) => {
    // 只有超级管理员可以修改权限
    if (!isSuperAdmin.value) {
      ElMessage.error('只有超级管理员才能修改角色权限')
      return
    }

    currentRole.value = row
    newRoleCode.value = row.roleCode
    permissionDialogVisible.value = true
  }

  // 确认修改权限
  const handleConfirmPermissionChange = async () => {
    if (!currentRole.value) return

    if (newRoleCode.value === currentRole.value.roleCode) {
      ElMessage.warning('新权限与当前权限相同')
      return
    }

    try {
      permissionChangeLoading.value = true

      await fetchUpdateRolePermission({
        roleId: currentRole.value.roleId,
        roleCode: newRoleCode.value
      })

      ElMessage.success('权限修改成功')
      permissionDialogVisible.value = false
      refreshData()
    } catch (error) {
      ElMessage.error('权限修改失败')
      console.error('权限修改错误:', error)
    } finally {
      permissionChangeLoading.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .role-page {
    padding: 20px;
  }
</style>
