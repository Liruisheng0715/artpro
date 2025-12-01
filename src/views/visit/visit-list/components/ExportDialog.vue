<template>
  <ElDialog
    v-model="dialogVisible"
    title="导出数据"
    width="800px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <ElAlert
      title="提示"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 20px"
    >
      <template #default>
        <div>
          <p v-if="isSuperAdmin">您是超级管理员，可以无限制导出数据</p>
          <p v-else-if="isAdmin">您是管理员，一次最多可以导出 500 条数据</p>
          <p v-else>您没有导出权限</p>
        </div>
      </template>
    </ElAlert>

    <ElForm :model="filterForm" label-width="100px">
      <ElRow :gutter="20">
        <!-- 运营商 -->
        <ElCol :span="12">
          <ElFormItem label="运营商">
            <ElSelect
              v-model="filterForm.operator"
              placeholder="请选择运营商"
              clearable
              style="width: 100%"
            >
              <ElOption label="中国移动" value="中国移动" />
              <ElOption label="中国联通" value="中国联通" />
              <ElOption label="中国电信" value="中国电信" />
            </ElSelect>
          </ElFormItem>
        </ElCol>

        <!-- 所属公司 -->
        <ElCol :span="12">
          <ElFormItem label="所属公司">
            <ElInput v-model="filterForm.company" placeholder="请输入公司名称" clearable />
          </ElFormItem>
        </ElCol>

        <!-- 业务号码 -->
        <ElCol :span="12">
          <ElFormItem label="业务号码">
            <ElInput v-model="filterForm.businessNumber" placeholder="请输入业务号码" clearable />
          </ElFormItem>
        </ElCol>

        <!-- 天翼号码 -->
        <ElCol :span="12">
          <ElFormItem label="天翼号码">
            <ElInput v-model="filterForm.tianYiNumber" placeholder="请输入天翼号码" clearable />
          </ElFormItem>
        </ElCol>

        <!-- 联系号码 -->
        <ElCol :span="12">
          <ElFormItem label="联系号码">
            <ElInput v-model="filterForm.contactNumber" placeholder="请输入联系号码" clearable />
          </ElFormItem>
        </ElCol>

        <!-- 套餐类型 -->
        <ElCol :span="12">
          <ElFormItem label="套餐类型">
            <ElInput v-model="filterForm.packageType" placeholder="请输入套餐类型" clearable />
          </ElFormItem>
        </ElCol>

        <!-- 产品实例 -->
        <ElCol :span="12">
          <ElFormItem label="产品实例">
            <ElInput v-model="filterForm.productInstance" placeholder="请输入产品实例" clearable />
          </ElFormItem>
        </ElCol>

        <!-- 区县 -->
        <ElCol :span="12">
          <ElFormItem label="区县">
            <ElInput v-model="filterForm.district" placeholder="请输入区县" clearable />
          </ElFormItem>
        </ElCol>

        <!-- 街道 -->
        <ElCol :span="12">
          <ElFormItem label="街道">
            <ElInput v-model="filterForm.street" placeholder="请输入街道" clearable />
          </ElFormItem>
        </ElCol>

        <!-- 小区 -->
        <ElCol :span="12">
          <ElFormItem label="小区">
            <ElInput v-model="filterForm.community" placeholder="请输入小区" clearable />
          </ElFormItem>
        </ElCol>

        <!-- 走访时间范围 -->
        <ElCol :span="24">
          <ElFormItem label="走访时间">
            <ElDatePicker
              v-model="filterForm.visitTimeRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>

    <template #footer>
      <ElButton @click="handleCancel">取消</ElButton>
      <ElButton @click="handleReset">重置筛选</ElButton>
      <ElButton type="primary" @click="handleExport" :loading="exportLoading">
        确认导出
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useUserStore } from '@/store/modules/user'
  import { fetchVisitList } from '@/api/visit'
  import * as XLSX from 'xlsx'
  import { saveAs } from 'file-saver'

  defineOptions({ name: 'ExportDialog' })

  interface Props {
    modelValue: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false
  })

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'export-success'): void
  }>()

  const userStore = useUserStore()
  const exportLoading = ref(false)

  const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  // 获取用户角色
  const userRoles = computed(() => {
    const userInfo = userStore.getUserInfo
    return userInfo.roles || []
  })

  // 检查是否有指定角色
  const hasRole = (roles: string[]) => {
    return userRoles.value.some((role) => roles.includes(role))
  }

  const isSuperAdmin = computed(() => hasRole(['R_SUPER']))
  const isAdmin = computed(() => hasRole(['R_ADMIN']))

  // 数据导出限制
  const dataLimit = computed(() => {
    if (isSuperAdmin.value) {
      return Infinity
    } else if (isAdmin.value) {
      return 500
    }
    return 0
  })

  // 筛选表单
  const filterForm = ref({
    operator: undefined as string | undefined,
    company: '',
    businessNumber: '',
    tianYiNumber: '',
    contactNumber: '',
    packageType: '',
    productInstance: '',
    district: '',
    street: '',
    community: '',
    visitTimeRange: undefined as [string, string] | undefined
  })

  // 重置筛选
  const handleReset = () => {
    filterForm.value = {
      operator: undefined,
      company: '',
      businessNumber: '',
      tianYiNumber: '',
      contactNumber: '',
      packageType: '',
      productInstance: '',
      district: '',
      street: '',
      community: '',
      visitTimeRange: undefined
    }
  }

  // 取消
  const handleCancel = () => {
    dialogVisible.value = false
  }

  // 导出数据
  const handleExport = async () => {
    try {
      exportLoading.value = true

      // 构建查询参数（只包含有值的字段）
      const params: any = {
        pageNum: 1,
        pageSize: 999999 // 设置一个很大的数字，后端应该会限制
      }

      // 添加有值的筛选条件
      if (filterForm.value.operator) {
        params.operator = filterForm.value.operator
      }
      if (filterForm.value.company) {
        params.company = filterForm.value.company
      }
      if (filterForm.value.businessNumber) {
        params.businessNumber = filterForm.value.businessNumber
      }
      if (filterForm.value.tianYiNumber) {
        params.tianYiNumber = filterForm.value.tianYiNumber
      }
      if (filterForm.value.contactNumber) {
        params.contactNumber = filterForm.value.contactNumber
      }
      if (filterForm.value.packageType) {
        params.packageType = filterForm.value.packageType
      }
      if (filterForm.value.productInstance) {
        params.productInstance = filterForm.value.productInstance
      }
      if (filterForm.value.district) {
        params.district = filterForm.value.district
      }
      if (filterForm.value.street) {
        params.street = filterForm.value.street
      }
      if (filterForm.value.community) {
        params.community = filterForm.value.community
      }
      if (filterForm.value.visitTimeRange) {
        params.visitTimeRange = filterForm.value.visitTimeRange
      }

      ElMessage.info('正在获取数据，请稍候...')

      // 获取数据
      const response = await fetchVisitList(params)
      let exportData = response.list

      if (!exportData || exportData.length === 0) {
        ElMessage.warning('没有符合条件的数据可导出')
        return
      }

      // 检查数据量限制
      if (exportData.length > dataLimit.value && !isSuperAdmin.value) {
        const result = await ElMessageBox.confirm(
          `筛选结果共 ${exportData.length} 条数据，您的权限只能导出前 ${dataLimit.value} 条，是否继续？`,
          '提示',
          {
            confirmButtonText: '继续导出',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        if (result) {
          exportData = exportData.slice(0, dataLimit.value)
        }
      }

      ElMessage.info('正在生成 Excel 文件，请稍候...')

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
      dialogVisible.value = false
      emit('export-success')
    } catch (error: any) {
      // 用户取消导出
      if (error !== 'cancel') {
        ElMessage.error('导出失败')
        console.error('导出错误:', error)
      }
    } finally {
      exportLoading.value = false
    }
  }

  // 对话框关闭后重置表单
  const handleClosed = () => {
    handleReset()
  }
</script>

<style lang="scss" scoped>
  :deep(.el-dialog__body) {
    padding: 20px;
  }
</style>
