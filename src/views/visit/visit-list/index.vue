<template>
  <div class="visit-list-page">
    <!-- 搜索栏 -->
    <ArtSearchBar
      v-model:formData="searchForm"
      :fields="searchFields"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 表格头部 -->
    <ArtTableHeader :title="`走访记录列表 (${tableData.total})`">
      <template #left>
        <ElButton type="primary" :icon="Plus" @click="handleAdd" v-ripple>
          新增走访记录
        </ElButton>
        <ElButton
          type="success"
          :icon="Upload"
          @click="handleImport"
          v-if="hasImportPermission"
          v-ripple
        >
          批量导入
        </ElButton>
        <ElButton
          :icon="Download"
          @click="handleExport"
          v-if="hasExportPermission"
          v-ripple
        >
          导出数据
        </ElButton>
        <ElButton
          type="danger"
          :icon="Delete"
          :disabled="!selectedIds.length"
          @click="handleBatchDelete"
          v-if="hasDeletePermission"
          v-ripple
        >
          批量删除 ({{ selectedIds.length }})
        </ElButton>
      </template>
      <template #right>
        <ElButton :icon="Refresh" circle @click="refreshData" v-ripple />
      </template>
    </ArtTableHeader>

    <!-- 数据表格 -->
    <ArtTable
      v-model:columns="tableColumns"
      :data="tableData.list"
      :loading="tableData.loading"
      :pagination="tableData.pagination"
      @selection-change="handleSelectionChange"
      @page-change="handlePageChange"
    >
      <!-- 运营商 -->
      <template #operator="{ row }">
        <ElTag :type="getOperatorType(row.operator)">
          {{ row.operator }}
        </ElTag>
      </template>

      <!-- 费用 -->
      <template #fee="{ row }">
        <span style="color: var(--el-color-danger); font-weight: 600">
          ¥{{ row.fee.toFixed(2) }}
        </span>
      </template>

      <!-- 走访时间 -->
      <template #visitTime="{ row }">
        {{ formatDate(row.visitTime) }}
      </template>

      <!-- 更新时间 -->
      <template #updateTime="{ row }">
        {{ formatDate(row.updateTime) }}
      </template>

      <!-- 操作列 -->
      <template #action="{ row }">
        <ElSpace>
          <ElButton link type="primary" :icon="View" @click="handleView(row)">
            查看
          </ElButton>
          <ElButton
            link
            type="primary"
            :icon="Edit"
            @click="handleEdit(row)"
            v-if="hasUpdatePermission"
          >
            编辑
          </ElButton>
          <ElButton
            link
            type="danger"
            :icon="Delete"
            @click="handleDelete(row)"
            v-if="hasDeletePermission"
          >
            删除
          </ElButton>
        </ElSpace>
      </template>
    </ArtTable>

    <!-- 查看/编辑对话框 -->
    <VisitDialog
      v-model:visible="dialogVisible"
      :mode="dialogMode"
      :data="currentRecord"
      @confirm="handleDialogConfirm"
    />

    <!-- 批量导入对话框 -->
    <ImportDialog v-model="importDialogVisible" @import-success="handleImportSuccess" />
  </div>
</template>

<script setup lang="ts">
  import { Plus, Edit, Delete, View, Download, Refresh, Upload } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useTable } from '@/utils/table'
  import { useUserStore } from '@/store/modules/user'
  import {
    fetchVisitList,
    fetchDeleteVisit,
    fetchBatchDeleteVisit,
    fetchExportVisit
  } from '@/api/visit'
  import * as XLSX from 'xlsx'
  import { saveAs } from 'file-saver'
  import VisitDialog from './components/VisitDialog.vue'
  import ImportDialog from './components/ImportDialog.vue'

  defineOptions({ name: 'VisitList' })

  const userStore = useUserStore()

  // 获取用户角色
  const userRoles = computed(() => {
    const userInfo = userStore.getUserInfo
    return userInfo.roles || []
  })

  // 检查是否有指定角色
  const hasRole = (roles: string[]) => {
    return userRoles.value.some((role) => roles.includes(role))
  }

  // 权限控制
  const hasUpdatePermission = computed(() => {
    // 所有角色都可以更新
    return true
  })

  const hasDeletePermission = computed(() => {
    // 只有管理员和超级管理员可以删除
    return hasRole(['R_SUPER', 'R_ADMIN'])
  })

  const hasImportPermission = computed(() => {
    // 只有管理员和超级管理员可以批量导入
    return hasRole(['R_SUPER', 'R_ADMIN'])
  })

  const hasExportPermission = computed(() => {
    // 只有管理员和超级管理员可以批量导出
    return hasRole(['R_SUPER', 'R_ADMIN'])
  })

  // 搜索表单
  const searchForm = ref<Api.Visit.VisitSearchParams>({
    operator: undefined,
    company: '',
    businessNumber: '',
    district: '',
    visitTimeRange: undefined
  })

  // 搜索字段配置
  const searchFields = [
    {
      type: 'select',
      prop: 'operator',
      label: '运营商',
      placeholder: '请选择运营商',
      options: [
        { label: '中国移动', value: '中国移动' },
        { label: '中国联通', value: '中国联通' },
        { label: '中国电信', value: '中国电信' }
      ]
    },
    {
      type: 'input',
      prop: 'company',
      label: '所属公司',
      placeholder: '请输入公司名称'
    },
    {
      type: 'input',
      prop: 'businessNumber',
      label: '业务号码',
      placeholder: '请输入业务号码'
    },
    {
      type: 'input',
      prop: 'district',
      label: '区县',
      placeholder: '请输入区县'
    },
    {
      type: 'date-range',
      prop: 'visitTimeRange',
      label: '走访时间',
      placeholder: ['开始日期', '结束日期']
    }
  ]

  // 表格列配置
  const tableColumns = ref([
    { type: 'selection', width: 55, fixed: 'left' },
    { type: 'index', label: '序号', width: 70, fixed: 'left' },
    { prop: 'operator', label: '运营商', width: 120, slot: 'operator' },
    { prop: 'company', label: '所属公司', width: 180 },
    { prop: 'businessNumber', label: '业务号码', width: 140 },
    { prop: 'tianYiNumber', label: '天翼号码', width: 140 },
    { prop: 'contactNumber', label: '联系号码', width: 140 },
    { prop: 'packageType', label: '套餐类型', width: 150 },
    { prop: 'fee', label: '费用', width: 100, slot: 'fee' },
    { prop: 'productInstance', label: '产品实例', width: 150 },
    { prop: 'district', label: '区县', width: 120 },
    { prop: 'street', label: '街道', width: 150 },
    { prop: 'community', label: '小区', width: 180 },
    { prop: 'visitTime', label: '走访时间', width: 160, slot: 'visitTime' },
    { prop: 'updateUser', label: '更新人员', width: 120 },
    { prop: 'updateTime', label: '更新时间', width: 160, slot: 'updateTime' },
    { prop: 'action', label: '操作', width: 220, fixed: 'right', slot: 'action' }
  ])

  // 使用 useTable hooks
  const {
    data: tableData,
    refresh: refreshData,
    updateParams
  } = useTable(fetchVisitList, {
    immediate: true,
    params: searchForm.value
  })

  // 选中的记录
  const selectedIds = ref<string[]>([])

  // 对话框相关
  const dialogVisible = ref(false)
  const dialogMode = ref<'view' | 'add' | 'edit'>('view')
  const currentRecord = ref<Api.Visit.VisitRecord | null>(null)

  // 导入对话框
  const importDialogVisible = ref(false)

  // 搜索
  const handleSearch = () => {
    updateParams(searchForm.value)
    refreshData()
  }

  // 重置
  const handleReset = () => {
    searchForm.value = {
      operator: undefined,
      company: '',
      businessNumber: '',
      district: '',
      visitTimeRange: undefined
    }
    handleSearch()
  }

  // 新增
  const handleAdd = () => {
    dialogMode.value = 'add'
    currentRecord.value = null
    dialogVisible.value = true
  }

  // 查看
  const handleView = (row: Api.Visit.VisitRecord) => {
    dialogMode.value = 'view'
    currentRecord.value = row
    dialogVisible.value = true
  }

  // 编辑
  const handleEdit = (row: Api.Visit.VisitRecord) => {
    dialogMode.value = 'edit'
    currentRecord.value = row
    dialogVisible.value = true
  }

  // 删除
  const handleDelete = async (row: Api.Visit.VisitRecord) => {
    try {
      await ElMessageBox.confirm('确定要删除这条走访记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

      await fetchDeleteVisit(row.id)
      ElMessage.success('删除成功')
      refreshData()
    } catch (error) {
      // 用户取消
    }
  }

  // 批量删除
  const handleBatchDelete = async () => {
    try {
      await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条记录吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

      await fetchBatchDeleteVisit(selectedIds.value)
      ElMessage.success('删除成功')
      selectedIds.value = []
      refreshData()
    } catch (error) {
      // 用户取消
    }
  }

  // 批量导入
  const handleImport = () => {
    importDialogVisible.value = true
  }

  // 导入成功
  const handleImportSuccess = () => {
    ElMessage.success('导入成功')
    refreshData()
  }

  // 导出数据
  const handleExport = async () => {
    try {
      // 获取当前列表数据（根据搜索条件）
      const isSuperAdmin = hasRole(['R_SUPER'])
      const dataLimit = isSuperAdmin ? Infinity : 500

      // 检查数据量
      if (tableData.total > dataLimit && !isSuperAdmin) {
        await ElMessageBox.confirm(
          `当前筛选结果共 ${tableData.total} 条数据，您的权限只能导出前 ${dataLimit} 条，是否继续？`,
          '提示',
          {
            confirmButtonText: '继续导出',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      }

      // 获取要导出的数据
      const exportParams = {
        ...searchForm.value,
        pageNum: 1,
        pageSize: dataLimit === Infinity ? tableData.total : dataLimit
      }

      ElMessage.info('正在导出数据，请稍候...')

      const response = await fetchVisitList(exportParams)
      const exportData = response.list

      if (!exportData || exportData.length === 0) {
        ElMessage.warning('没有数据可导出')
        return
      }

      // 转换数据格式
      const excelData = exportData.map((item) => ({
        唯一编号: item.id,
        运营商: item.operator,
        员工公司: item.company,
        商务号码: item.businessNumber,
        天翼号码: item.tianYiNumber,
        联系电话: item.contactNumber,
        套餐类型: item.packageType,
        费用: item.fee,
        产品实例: item.productInstance,
        区: item.district,
        街道: item.street,
        社区: item.community,
        详细地址: item.fullAddress,
        走访时间: item.visitTime,
        走访内容: item.visitContent,
        更新时间: item.updateTime,
        更新人员: item.updateUser
      }))

      // 创建工作簿
      const ws = XLSX.utils.json_to_sheet(excelData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '走访记录')

      // 设置列宽
      const colWidths = [
        { wch: 25 }, // 唯一编号
        { wch: 12 }, // 运营商
        { wch: 20 }, // 员工公司
        { wch: 15 }, // 商务号码
        { wch: 15 }, // 天翼号码
        { wch: 15 }, // 联系电话
        { wch: 20 }, // 套餐类型
        { wch: 10 }, // 费用
        { wch: 20 }, // 产品实例
        { wch: 12 }, // 区
        { wch: 15 }, // 街道
        { wch: 15 }, // 社区
        { wch: 30 }, // 详细地址
        { wch: 20 }, // 走访时间
        { wch: 40 }, // 走访内容
        { wch: 20 }, // 更新时间
        { wch: 15 } // 更新人员
      ]
      ws['!cols'] = colWidths

      // 生成 Excel 文件
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      // 下载文件
      const fileName = `走访记录_${new Date().getTime()}.xlsx`
      saveAs(blob, fileName)

      ElMessage.success(`成功导出 ${exportData.length} 条数据`)
    } catch (error: any) {
      // 用户取消导出
      if (error !== 'cancel') {
        ElMessage.error('导出失败')
        console.error('导出错误:', error)
      }
    }
  }

  // 选择变化
  const handleSelectionChange = (selection: Api.Visit.VisitRecord[]) => {
    selectedIds.value = selection.map((item) => item.id)
  }

  // 分页变化
  const handlePageChange = () => {
    refreshData()
  }

  // 对话框确认
  const handleDialogConfirm = () => {
    refreshData()
  }

  // 获取运营商标签类型
  const getOperatorType = (operator: string) => {
    const typeMap: Record<string, any> = {
      中国移动: 'success',
      中国联通: 'primary',
      中国电信: 'warning'
    }
    return typeMap[operator] || 'info'
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
</script>

<style lang="scss" scoped>
  .visit-list-page {
    padding: 16px;
  }
</style>
