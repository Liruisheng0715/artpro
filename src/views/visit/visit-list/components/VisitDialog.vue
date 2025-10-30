<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="900px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      :disabled="mode === 'view'"
    >
      <ElRow :gutter="20">
        <!-- 运营商 -->
        <ElCol :span="12">
          <ElFormItem label="运营商" prop="operator">
            <ElSelect
              v-model="formData.operator"
              placeholder="请选择运营商"
              style="width: 100%"
            >
              <ElOption label="中国移动" value="中国移动" />
              <ElOption label="中国联通" value="中国联通" />
              <ElOption label="中国电信" value="中国电信" />
            </ElSelect>
          </ElFormItem>
        </ElCol>

        <!-- 员工所属公司 -->
        <ElCol :span="12">
          <ElFormItem label="员工所属公司" prop="company">
            <ElInput v-model="formData.company" placeholder="请输入员工所属公司" />
          </ElFormItem>
        </ElCol>

        <!-- 业务号码 -->
        <ElCol :span="12">
          <ElFormItem label="业务号码" prop="businessNumber">
            <ElInput v-model="formData.businessNumber" placeholder="请输入业务号码" maxlength="20" />
          </ElFormItem>
        </ElCol>

        <!-- 天翼号码 -->
        <ElCol :span="12">
          <ElFormItem label="天翼号码" prop="tianYiNumber">
            <ElInput v-model="formData.tianYiNumber" placeholder="请输入天翼号码" maxlength="20" />
          </ElFormItem>
        </ElCol>

        <!-- 联系号码 -->
        <ElCol :span="12">
          <ElFormItem label="联系号码" prop="contactNumber">
            <ElInput
              v-model="formData.contactNumber"
              placeholder="请输入联系号码"
              maxlength="20"
            />
          </ElFormItem>
        </ElCol>

        <!-- 套餐类型 -->
        <ElCol :span="12">
          <ElFormItem label="套餐类型" prop="packageType">
            <ElInput v-model="formData.packageType" placeholder="请输入套餐类型" />
          </ElFormItem>
        </ElCol>

        <!-- 费用 -->
        <ElCol :span="12">
          <ElFormItem label="费用" prop="fee">
            <ElInputNumber
              v-model="formData.fee"
              :min="0"
              :precision="2"
              :controls="false"
              placeholder="请输入费用"
              style="width: 100%"
            />
          </ElFormItem>
        </ElCol>

        <!-- 走访时间 -->
        <ElCol :span="12">
          <ElFormItem label="走访时间" prop="visitTime">
            <ElDatePicker
              v-model="formData.visitTime"
              type="datetime"
              placeholder="选择走访时间"
              style="width: 100%"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </ElFormItem>
        </ElCol>

        <!-- 区县 -->
        <ElCol :span="8">
          <ElFormItem label="区县" prop="district">
            <ElInput v-model="formData.district" placeholder="请输入区县" />
          </ElFormItem>
        </ElCol>

        <!-- 街道 -->
        <ElCol :span="8">
          <ElFormItem label="街道" prop="street">
            <ElInput v-model="formData.street" placeholder="请输入街道" />
          </ElFormItem>
        </ElCol>

        <!-- 小区 -->
        <ElCol :span="8">
          <ElFormItem label="小区" prop="community">
            <ElInput v-model="formData.community" placeholder="请输入小区" />
          </ElFormItem>
        </ElCol>

        <!-- 完整地址 -->
        <ElCol :span="24">
          <ElFormItem label="完整地址" prop="fullAddress">
            <ElInput
              v-model="formData.fullAddress"
              type="textarea"
              :rows="2"
              placeholder="请输入完整地址"
              maxlength="200"
              show-word-limit
            />
          </ElFormItem>
        </ElCol>

        <!-- 走访内容 -->
        <ElCol :span="24">
          <ElFormItem label="走访内容" prop="visitContent">
            <ElInput
              v-model="formData.visitContent"
              type="textarea"
              :rows="4"
              placeholder="请输入走访内容"
              maxlength="500"
              show-word-limit
            />
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>

    <template #footer>
      <ElButton @click="handleCancel">{{ mode === 'view' ? '关闭' : '取消' }}</ElButton>
      <ElButton type="primary" @click="handleConfirm" :loading="submitLoading" v-if="mode !== 'view'">
        确定
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import { fetchCreateVisit, fetchUpdateVisit } from '@/api/visit'

  defineOptions({ name: 'VisitDialog' })

  interface Props {
    visible: boolean
    mode: 'view' | 'add' | 'edit'
    data?: Api.Visit.VisitRecord | null
  }

  const props = withDefaults(defineProps<Props>(), {
    visible: false,
    mode: 'view',
    data: null
  })

  const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'confirm'): void
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const dialogTitle = computed(() => {
    const titleMap = {
      view: '查看走访记录',
      add: '新增走访记录',
      edit: '编辑走访记录'
    }
    return titleMap[props.mode]
  })

  // 表单引用
  const formRef = ref<FormInstance>()
  const submitLoading = ref(false)

  // 表单数据
  const formData = ref<Api.Visit.CreateVisitParams>({
    operator: '中国移动',
    company: '',
    businessNumber: '',
    tianYiNumber: '',
    contactNumber: '',
    packageType: '',
    fee: 0,
    district: '',
    street: '',
    community: '',
    fullAddress: '',
    visitTime: '',
    visitContent: ''
  })

  // 表单验证规则
  const formRules: FormRules = {
    operator: [{ required: true, message: '请选择运营商', trigger: 'change' }],
    company: [{ required: true, message: '请输入员工所属公司', trigger: 'blur' }],
    businessNumber: [
      { required: true, message: '请输入业务号码', trigger: 'blur' },
      { pattern: /^[0-9-]+$/, message: '业务号码格式不正确', trigger: 'blur' }
    ],
    tianYiNumber: [
      { required: true, message: '请输入天翼号码', trigger: 'blur' },
      { pattern: /^[0-9-]+$/, message: '天翼号码格式不正确', trigger: 'blur' }
    ],
    contactNumber: [
      { required: true, message: '请输入联系号码', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '联系号码格式不正确', trigger: 'blur' }
    ],
    packageType: [{ required: true, message: '请输入套餐类型', trigger: 'blur' }],
    fee: [{ required: true, message: '请输入费用', trigger: 'blur' }],
    district: [{ required: true, message: '请输入区县', trigger: 'blur' }],
    street: [{ required: true, message: '请输入街道', trigger: 'blur' }],
    community: [{ required: true, message: '请输入小区', trigger: 'blur' }],
    fullAddress: [{ required: true, message: '请输入完整地址', trigger: 'blur' }],
    visitTime: [{ required: true, message: '请选择走访时间', trigger: 'change' }],
    visitContent: [{ required: true, message: '请输入走访内容', trigger: 'blur' }]
  }

  // 监听数据变化，初始化表单
  watch(
    () => props.data,
    (newVal) => {
      if (newVal && (props.mode === 'edit' || props.mode === 'view')) {
        formData.value = { ...newVal }
      } else {
        resetForm()
      }
    },
    { immediate: true }
  )

  // 重置表单
  const resetForm = () => {
    formData.value = {
      operator: '中国移动',
      company: '',
      businessNumber: '',
      tianYiNumber: '',
      contactNumber: '',
      packageType: '',
      fee: 0,
      district: '',
      street: '',
      community: '',
      fullAddress: '',
      visitTime: '',
      visitContent: ''
    }
    formRef.value?.clearValidate()
  }

  // 取消
  const handleCancel = () => {
    dialogVisible.value = false
  }

  // 确认
  const handleConfirm = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
      submitLoading.value = true

      if (props.mode === 'add') {
        await fetchCreateVisit(formData.value)
        ElMessage.success('新增成功')
      } else if (props.mode === 'edit') {
        await fetchUpdateVisit({
          id: props.data!.id,
          ...formData.value
        })
        ElMessage.success('更新成功')
      }

      dialogVisible.value = false
      emit('confirm')
    } catch (error) {
      console.error('提交失败:', error)
    } finally {
      submitLoading.value = false
    }
  }

  // 对话框关闭后重置表单
  const handleClosed = () => {
    resetForm()
  }
</script>

<style lang="scss" scoped>
  :deep(.el-dialog__body) {
    padding: 20px;
  }
</style>
