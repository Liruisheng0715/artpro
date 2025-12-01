<template>
  <div class="user-manage-container">
    <ArtProTable
      ref="tableRef"
      :request-api="fetchGetUserList"
      :columns="columns"
      :search-config="searchConfig"
    >
      <!-- 角色等级插槽 -->
      <template #roleCode="{ row }">
        <ElTag :type="getRoleTagType(row.roleCode)">
          {{ row.roleName }}
        </ElTag>
      </template>

      <!-- 操作插槽 -->
      <template #action="{ row }">
        <ElButton
          type="primary"
          link
          :icon="Edit"
          @click="handleEditRole(row)"
          :disabled="!isSuperAdmin"
        >
          修改权限
        </ElButton>
      </template>
    </ArtProTable>

    <!-- 修改权限对话框 -->
    <ElDialog
      v-model="roleDialogVisible"
      title="修改用户权限"
      width="500px"
      :close-on-click-modal="false"
    >
      <div v-if="currentUser" class="role-dialog-content">
        <div class="user-info">
          <p><strong>用户ID:</strong> {{ currentUser.id }}</p>
          <p><strong>用户名:</strong> {{ currentUser.username }}</p>
          <p><strong>当前权限:</strong> {{ currentUser.roleName }}</p>
        </div>
        <ElDivider />
        <ElFormItem label="新权限等级">
          <ElSelect v-model="newRoleCode" placeholder="请选择新的权限等级" style="width: 100%">
            <ElOption label="超级管理员" value="R_SUPER" />
            <ElOption label="管理员" value="R_ADMIN" />
            <ElOption label="普通用户" value="R_USER" />
          </ElSelect>
        </ElFormItem>
      </div>
      <template #footer>
        <ElButton @click="roleDialogVisible = false">取消</ElButton>
        <ElButton
          type="primary"
          @click="handleConfirmRoleChange"
          :loading="roleChangeLoading"
        >
          确认修改
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { fetchGetUserList, fetchUpdateUserRole } from '@/api/system-manage'
  import { ElMessage, ElTag, ElDialog, ElFormItem, ElSelect, ElOption, ElDivider, ElButton } from 'element-plus'
  import { Edit } from '@element-plus/icons-vue'
  import { useUserStore } from '@/store/modules/user'

  defineOptions({ name: 'UserManage' })

  type UserListItem = Api.SystemManage.UserListItem

  const userStore = useUserStore()
  const tableRef = ref()

  // 判断是否为超级管理员
  const isSuperAdmin = computed(() => userStore.userInfo.roles.includes('R_SUPER'))

  // 搜索配置
  const searchConfig: ArtProTable.SearchConfig<UserListItem> = {
    labelWidth: 90,
    labelPosition: 'right',
    fields: [
      {
        prop: 'id',
        label: '用户ID',
        type: 'input',
        placeholder: '请输入用户ID'
      },
      {
        prop: 'username',
        label: '用户名',
        type: 'input',
        placeholder: '请输入用户名'
      },
      {
        prop: 'roleCode',
        label: '角色等级',
        type: 'select',
        placeholder: '请选择角色等级',
        options: [
          { label: '超级管理员', value: 'R_SUPER' },
          { label: '管理员', value: 'R_ADMIN' },
          { label: '普通用户', value: 'R_USER' }
        ]
      },
      {
        prop: 'status',
        label: '状态',
        type: 'select',
        placeholder: '请选择状态',
        options: [
          { label: '正常', value: '1' },
          { label: '禁用', value: '2' },
          { label: '离职', value: '3' },
          { label: '休假', value: '4' }
        ]
      }
    ]
  }

  // 表格列配置
  const columns: ArtProTable.ColumnProps<UserListItem>[] = [
    { type: 'index', label: '序号', width: 60 },
    { prop: 'id', label: '用户ID', search: false },
    { prop: 'username', label: '用户名', search: false },
    { prop: 'email', label: '邮箱', search: false },
    { prop: 'mobile', label: '手机号', search: false },
    { prop: 'dep', label: '部门', search: false },
    { prop: 'roleCode', label: '角色等级', search: false },
    { prop: 'action', label: '操作', fixed: 'right', width: 120, search: false }
  ]

  // 获取角色标签类型
  const getRoleTagType = (roleCode: string) => {
    const typeMap: Record<string, 'success' | 'warning' | 'info'> = {
      R_SUPER: 'success',
      R_ADMIN: 'warning',
      R_USER: 'info'
    }
    return typeMap[roleCode] || 'info'
  }

  // 修改权限相关
  const roleDialogVisible = ref(false)
  const currentUser = ref<UserListItem | null>(null)
  const newRoleCode = ref<Api.SystemManage.RoleType>('R_USER')
  const roleChangeLoading = ref(false)

  // 打开修改权限对话框
  const handleEditRole = (row: UserListItem) => {
    if (!isSuperAdmin.value) {
      ElMessage.error('只有超级管理员才能修改用户权限')
      return
    }
    currentUser.value = row
    newRoleCode.value = row.roleCode
    roleDialogVisible.value = true
  }

  // 确认修改权限
  const handleConfirmRoleChange = async () => {
    if (!currentUser.value) return

    if (newRoleCode.value === currentUser.value.roleCode) {
      ElMessage.warning('新权限与当前权限相同')
      return
    }

    try {
      roleChangeLoading.value = true
      await fetchUpdateUserRole({
        id: currentUser.value.id,
        roleCode: newRoleCode.value
      })
      ElMessage.success('权限修改成功')
      roleDialogVisible.value = false
      refreshData()
    } catch (error) {
      ElMessage.error('权限修改失败')
    } finally {
      roleChangeLoading.value = false
    }
  }

  // 刷新表格数据
  const refreshData = () => {
    tableRef.value?.refresh()
  }
</script>

<style lang="scss" scoped>
  .user-manage-container {
    padding: 20px;
  }

  .role-dialog-content {
    .user-info {
      padding: 10px 0;

      p {
        margin: 8px 0;
        font-size: 14px;

        strong {
          color: var(--el-text-color-primary);
          margin-right: 8px;
        }
      }
    }
  }
</style>
