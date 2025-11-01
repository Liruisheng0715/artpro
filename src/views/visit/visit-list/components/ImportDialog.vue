<template>
  <ElDialog
    v-model="dialogVisible"
    :title="$t('visit.import.title')"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="import-dialog">
      <!-- 导入说明 -->
      <ElAlert
        :title="$t('visit.import.notice')"
        type="info"
        :closable="false"
        class="import-notice"
      >
        <template #default>
          <div class="notice-content">
            <p>{{ getLimitText }}</p>
            <p>{{ $t('visit.import.fileFormat') }}</p>
          </div>
        </template>
      </ElAlert>

      <!-- 模板下载 -->
      <div class="template-download">
        <ElButton type="primary" link @click="downloadTemplate">
          <ElIcon><Download /></ElIcon>
          {{ $t('visit.import.downloadTemplate') }}
        </ElButton>
      </div>

      <!-- 文件上传 -->
      <div class="file-upload">
        <ElUpload
          ref="uploadRef"
          :auto-upload="false"
          accept=".xlsx, .xls"
          :limit="1"
          :on-change="handleFileChange"
          :on-exceed="handleExceed"
          :file-list="fileList"
          :on-remove="handleRemove"
          drag
        >
          <ElIcon class="el-icon--upload"><UploadFilled /></ElIcon>
          <div class="el-upload__text">
            {{ $t('visit.import.dragTip') }}
            <em>{{ $t('visit.import.clickTip') }}</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              {{ $t('visit.import.fileTip') }}
            </div>
          </template>
        </ElUpload>
      </div>

      <!-- 导入进度 -->
      <div v-if="importing" class="import-progress">
        <ElProgress :percentage="progress" :status="progressStatus" />
        <p class="progress-text">{{ progressText }}</p>
      </div>

      <!-- 导入结果 -->
      <div v-if="importResult" class="import-result">
        <ElAlert
          :title="$t('visit.import.result')"
          :type="importResult.success ? 'success' : 'warning'"
          :closable="false"
        >
          <template #default>
            <div class="result-content">
              <p>{{ $t('visit.import.totalRecords') }}: {{ importResult.total }}</p>
              <p>{{ $t('visit.import.successRecords') }}: {{ importResult.successCount }}</p>
              <p v-if="importResult.failCount > 0" class="error-text">
                {{ $t('visit.import.failRecords') }}: {{ importResult.failCount }}
              </p>
              <div v-if="importResult.errors.length > 0" class="error-list">
                <p class="error-title">{{ $t('visit.import.errorDetails') }}:</p>
                <ul>
                  <li v-for="(error, index) in importResult.errors.slice(0, 5)" :key="index">
                    {{ error }}
                  </li>
                  <li v-if="importResult.errors.length > 5">
                    ... {{ $t('visit.import.moreErrors', { count: importResult.errors.length - 5 }) }}
                  </li>
                </ul>
              </div>
            </div>
          </template>
        </ElAlert>
      </div>
    </div>

    <template #footer>
      <ElButton @click="handleClose">{{ $t('common.cancel') }}</ElButton>
      <ElButton
        type="primary"
        :loading="importing"
        :disabled="fileList.length === 0 || importing"
        @click="handleImport"
      >
        {{ importing ? $t('visit.import.importing') : $t('visit.import.startImport') }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Download, UploadFilled } from '@element-plus/icons-vue'
  import type { UploadFile, UploadInstance, UploadUserFile } from 'element-plus'
  import * as XLSX from 'xlsx'
  import { saveAs } from 'file-saver'
  import { useUserStore } from '@/store/modules/user'
  import { useI18n } from 'vue-i18n'
  import { fetchBatchImportVisit } from '@/api/visit'

  defineOptions({ name: 'ImportDialog' })

  const { t } = useI18n()
  const userStore = useUserStore()

  // Props
  interface Props {
    modelValue: boolean
  }

  const props = defineProps<Props>()

  // Emits
  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'import-success': []
  }>()

  // 对话框可见性
  const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  // 上传组件引用
  const uploadRef = ref<UploadInstance>()
  const fileList = ref<UploadUserFile[]>([])

  // 导入状态
  const importing = ref(false)
  const progress = ref(0)
  const progressStatus = ref<'success' | 'exception' | 'warning' | undefined>(undefined)
  const progressText = ref('')

  // 导入结果
  interface ImportResult {
    success: boolean
    total: number
    successCount: number
    failCount: number
    errors: string[]
  }
  const importResult = ref<ImportResult | null>(null)

  // 获取用户角色
  const userRoles = computed(() => {
    const userInfo = userStore.getUserInfo
    return userInfo.roles || []
  })

  // 检查是否有指定角色
  const hasRole = (roles: string[]) => {
    return userRoles.value.some((role) => roles.includes(role))
  }

  // 获取数据限制
  const dataLimit = computed(() => {
    if (hasRole(['R_SUPER'])) {
      return Infinity // 超级管理员无限制
    } else if (hasRole(['R_ADMIN'])) {
      return 500 // 管理员限制 500 条
    }
    return 0 // 普通用户不能导入
  })

  // 获取限制文本
  const getLimitText = computed(() => {
    if (hasRole(['R_SUPER'])) {
      return t('visit.import.superAdminLimit')
    } else if (hasRole(['R_ADMIN'])) {
      return t('visit.import.adminLimit', { count: 500 })
    }
    return t('visit.import.userLimit')
  })

  // 下载模板
  const downloadTemplate = () => {
    // 创建模板数据
    const templateData = [
      {
        运营商: '中国移动',
        员工公司: '示例公司',
        商务号码: '13800138000',
        天翼号码: '18900189000',
        联系电话: '13900139000',
        套餐类型: '5G畅享套餐',
        费用: 128,
        区: '朝阳区',
        街道: '三里屯街道',
        社区: '三里屯社区',
        详细地址: '北京市朝阳区三里屯路1号',
        走访时间: '2024-01-01 10:00:00',
        走访内容: '客户回访，了解套餐使用情况'
      }
    ]

    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '走访记录模板')

    // 设置列宽
    const colWidths = [
      { wch: 12 }, // 运营商
      { wch: 20 }, // 员工公司
      { wch: 15 }, // 商务号码
      { wch: 15 }, // 天翼号码
      { wch: 15 }, // 联系电话
      { wch: 20 }, // 套餐类型
      { wch: 10 }, // 费用
      { wch: 12 }, // 区
      { wch: 15 }, // 街道
      { wch: 15 }, // 社区
      { wch: 30 }, // 详细地址
      { wch: 20 }, // 走访时间
      { wch: 40 } // 走访内容
    ]
    ws['!cols'] = colWidths

    // 生成 Excel 文件
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    // 下载文件
    saveAs(blob, `走访记录导入模板_${new Date().getTime()}.xlsx`)
    ElMessage.success(t('visit.import.templateDownloaded'))
  }

  // 文件变化处理
  const handleFileChange = (file: UploadFile) => {
    fileList.value = [file]
    importResult.value = null
  }

  // 超出文件数量限制
  const handleExceed = () => {
    ElMessage.warning(t('visit.import.fileLimit'))
  }

  // 移除文件
  const handleRemove = () => {
    fileList.value = []
    importResult.value = null
  }

  // 解析 Excel 文件
  const parseExcel = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const results = XLSX.utils.sheet_to_json(worksheet)
          resolve(results)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = (error) => reject(error)
      reader.readAsArrayBuffer(file)
    })
  }

  // 验证数据
  const validateData = (data: any[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (data.length === 0) {
      errors.push(t('visit.import.emptyFile'))
      return { valid: false, errors }
    }

    // 检查数据量限制
    if (dataLimit.value !== Infinity && data.length > dataLimit.value) {
      errors.push(t('visit.import.exceedLimit', { limit: dataLimit.value, count: data.length }))
      return { valid: false, errors }
    }

    // 验证必填字段
    const requiredFields = [
      '运营商',
      '员工公司',
      '商务号码',
      '天翼号码',
      '联系电话',
      '套餐类型',
      '费用',
      '区',
      '街道',
      '社区',
      '详细地址',
      '走访时间',
      '走访内容'
    ]

    data.forEach((row, index) => {
      requiredFields.forEach((field) => {
        if (!row[field] && row[field] !== 0) {
          errors.push(
            t('visit.import.missingField', { row: index + 2, field }) // +2 因为 Excel 第一行是表头
          )
        }
      })

      // 验证运营商
      const validOperators = ['中国移动', '中国联通', '中国电信']
      if (row['运营商'] && !validOperators.includes(row['运营商'])) {
        errors.push(t('visit.import.invalidOperator', { row: index + 2 }))
      }

      // 验证费用为数字
      if (row['费用'] && isNaN(Number(row['费用']))) {
        errors.push(t('visit.import.invalidFee', { row: index + 2 }))
      }
    })

    return { valid: errors.length === 0, errors: errors.slice(0, 10) } // 最多显示 10 个错误
  }

  // 转换数据格式
  const transformData = (data: any[]): Api.Visit.VisitCreateParams[] => {
    return data.map((row) => ({
      operator: row['运营商'] as Api.Visit.OperatorType,
      company: String(row['员工公司']),
      businessNumber: String(row['商务号码']),
      tianYiNumber: String(row['天翼号码']),
      contactNumber: String(row['联系电话']),
      packageType: String(row['套餐类型']),
      fee: Number(row['费用']),
      district: String(row['区']),
      street: String(row['街道']),
      community: String(row['社区']),
      fullAddress: String(row['详细地址']),
      visitTime: String(row['走访时间']),
      visitContent: String(row['走访内容'])
    }))
  }

  // 执行导入
  const handleImport = async () => {
    if (fileList.value.length === 0) {
      ElMessage.warning(t('visit.import.selectFile'))
      return
    }

    // 检查权限
    if (dataLimit.value === 0) {
      ElMessage.error(t('visit.import.noPermission'))
      return
    }

    try {
      importing.value = true
      progress.value = 0
      progressStatus.value = undefined
      progressText.value = t('visit.import.parsing')
      importResult.value = null

      // 解析 Excel 文件
      const file = fileList.value[0].raw
      if (!file) {
        throw new Error(t('visit.import.invalidFile'))
      }

      progress.value = 20
      const rawData = await parseExcel(file)

      // 验证数据
      progress.value = 40
      progressText.value = t('visit.import.validating')
      const validation = validateData(rawData)

      if (!validation.valid) {
        importing.value = false
        progressStatus.value = 'exception'
        importResult.value = {
          success: false,
          total: rawData.length,
          successCount: 0,
          failCount: rawData.length,
          errors: validation.errors
        }
        ElMessage.error(t('visit.import.validationFailed'))
        return
      }

      // 转换数据格式
      progress.value = 60
      progressText.value = t('visit.import.transforming')
      const transformedData = transformData(rawData)

      // 调用 API 导入
      progress.value = 80
      progressText.value = t('visit.import.uploading')
      const result = await fetchBatchImportVisit({ records: transformedData })

      // 导入成功
      progress.value = 100
      progressStatus.value = 'success'
      progressText.value = t('visit.import.completed')

      importResult.value = {
        success: true,
        total: result.total || transformedData.length,
        successCount: result.successCount || transformedData.length,
        failCount: result.failCount || 0,
        errors: result.errors || []
      }

      ElMessage.success(
        t('visit.import.importSuccess', { count: importResult.value.successCount })
      )

      // 通知父组件刷新列表
      emit('import-success')
    } catch (error: any) {
      importing.value = false
      progressStatus.value = 'exception'
      progressText.value = t('visit.import.failed')

      importResult.value = {
        success: false,
        total: 0,
        successCount: 0,
        failCount: 0,
        errors: [error.message || t('visit.import.unknownError')]
      }

      ElMessage.error(error.message || t('visit.import.importFailed'))
      console.error('导入失败:', error)
    } finally {
      importing.value = false
    }
  }

  // 关闭对话框
  const handleClose = () => {
    if (importing.value) {
      ElMessageBox.confirm(
        t('visit.import.closeConfirm'),
        t('common.warning'),
        {
          type: 'warning'
        }
      ).then(() => {
        dialogVisible.value = false
        resetDialog()
      })
    } else {
      dialogVisible.value = false
      resetDialog()
    }
  }

  // 重置对话框
  const resetDialog = () => {
    fileList.value = []
    importing.value = false
    progress.value = 0
    progressStatus.value = undefined
    progressText.value = ''
    importResult.value = null
  }
</script>

<style scoped lang="scss">
  .import-dialog {
    .import-notice {
      margin-bottom: 20px;

      .notice-content {
        p {
          margin: 5px 0;
          font-size: 14px;
        }
      }
    }

    .template-download {
      margin-bottom: 20px;
      text-align: center;
    }

    .file-upload {
      margin-bottom: 20px;
    }

    .import-progress {
      margin-top: 20px;

      .progress-text {
        margin-top: 10px;
        text-align: center;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }

    .import-result {
      margin-top: 20px;

      .result-content {
        p {
          margin: 5px 0;
          font-size: 14px;

          &.error-text {
            color: var(--el-color-danger);
          }
        }

        .error-list {
          margin-top: 10px;

          .error-title {
            font-weight: bold;
            margin-bottom: 5px;
          }

          ul {
            margin: 0;
            padding-left: 20px;

            li {
              font-size: 13px;
              color: var(--el-color-danger);
              margin: 3px 0;
            }
          }
        }
      }
    }
  }
</style>
