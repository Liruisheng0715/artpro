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
        />
      </template>
    </ArtTable>
  </div>
</template>

<script setup lang="ts">
  import { Refresh } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useTable } from '@/utils/table'
  import { useUserStore } from '@/store/modules/user'
  import { fetchGetRoleList, fetchUpdateRoleStatus } from '@/api/system-manage'

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
    { prop: 'roleName', label: '角色名称', width: 150 },
    { prop: 'roleCode', label: '角色等级', width: 150, slot: 'roleCode' },
    { prop: 'roleDescription', label: '角色描述', minWidth: 250 },
    { prop: 'enabled', label: '角色状态', width: 100, slot: 'enabled' },
    { prop: 'createTime', label: '创建时间', width: 180 },
    { prop: 'updateTime', label: '更新时间', width: 180 }
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
</script>

<style lang="scss" scoped>
  .role-page {
    padding: 20px;
  }
</style>
