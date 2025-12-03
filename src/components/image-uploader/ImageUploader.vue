<!-- ImageUploader.vue -->
<script setup lang="ts">
import type {
  UploadFile,
  UploadProps,
  UploadRawFile,
  UploadStatus,
} from 'element-plus'
import type { Component } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import {
  ElButton,
  ElDialog,
  ElIcon,
  ElMessage,
  ElProgress,
} from 'element-plus'
import { onMounted, ref, watch } from 'vue'

// 定义文件列表项类型（适配 Element Plus 2.11+ UploadFile 结构）
export interface ImageUploadFile extends Omit<UploadFile, 'raw'> {
  url: string
  name: string
  uid: number
  status: UploadStatus
  raw?: File | null
  [key: string]: any // 允许扩展字段
}

// 定义组件 props 类型（基于 Element Plus 2.11+ UploadProps 扩展）
interface ImageUploadProps extends Omit<UploadProps, 'onSuccess' | 'onError' | 'onRemove' | 'onExceed' | 'beforeUpload' | 'onProgress'> {
  // 上传接口地址（必填）
  uploadUrl: string
  // 已上传文件列表（用于回显）
  modelValue?: ImageUploadFile[]
  // 单个文件最大尺寸（MB）
  fileSize?: number
  // 上传按钮文本
  buttonText?: string
  // 上传按钮类型
  buttonType?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text'
  // 上传按钮图标
  buttonIcon?: Component
  // 拖拽区域提示文本
  dragText?: string
  // 是否显示上传进度条
  showProgress?: boolean
  // 自定义文件状态文本（Element Plus 2.11+ 新增属性）
  fileStatusText?: Partial<Record<UploadStatus, string>>
  // 上传成功回调
  onSuccess?: (response: any, file: UploadFile) => void
  // 上传失败回调
  onError?: (error: any, file: UploadFile) => void
  // 文件移除回调
  onRemove?: (file: UploadFile, files: UploadFile[]) => void
}

// 组件 props 定义（使用 withDefaults 确保类型安全，适配 2.11+ 默认值）
const props = withDefaults(defineProps<ImageUploadProps>(), {
  headers: () => ({}),
  modelValue: () => [],
  limit: 1,
  multiple: false,
  accept: '.jpg,.jpeg,.png,.gif,.webp',
  fileSize: 5,
  autoUpload: true,
  disabled: false,
  drag: false,
  listType: 'picture-card',
  buttonText: '',
  buttonType: 'primary',
  buttonIcon: () => UploadFilled,
  dragText: '',
  showProgress: true,
  fileStatusText: () => ({
    success: '上传成功',
    error: '上传失败',
    uploading: '上传中',
    ready: '等待上传',
  }),
  onSuccess: () => () => {},
  onError: () => () => {},
  onRemove: () => () => {},
  customRequest: undefined,
  beforeUpload: undefined,
  onProgress: undefined,
})

// 定义组件 emits 类型（严格遵循 Element Plus 2.11+ 回调参数格式）
const emit = defineEmits<{
  'update:modelValue': [value: ImageUploadFile[]]
  'success': [response: any, file: UploadFile, fileList: UploadFile[]]
  'error': [error: any, file: UploadFile, fileList: UploadFile[]]
  'remove': [file: UploadFile, fileList: UploadFile[]]
  'exceed': [files: UploadRawFile[], fileList: UploadFile[]]
  'progress': [event: ProgressEvent, file: UploadFile, fileList: UploadFile[]]
}>()

// 内部状态管理
const fileList = ref<UploadFile[]>([]) // 上传组件文件列表（严格匹配 2.11+ UploadFile 类型）
const uploadProgress = ref<number>(0) // 上传进度
const previewVisible = ref<boolean>(false) // 预览弹窗显示状态
const previewUrl = ref<string>('') // 预览图片地址

// 初始化文件列表（处理回显，适配 2.11+ UploadFile 结构）
onMounted(() => {
  if (props.modelValue?.length) {
    fileList.value = props.modelValue.map(item => ({
      ...item,
      status: item.status || 'success',
      raw: item.raw || null,
      response: item.response || null,
      percent: item.percent || 0,
    }))
  }
})

// 监听 modelValue 变化，同步文件列表（深度监听，适配数组变化）
watch(
  () => props.modelValue,
  (newVal = []) => {
    if (newVal.length) {
      fileList.value = newVal.map(item => ({
        ...item,
        status: item.status || 'success',
        raw: item.raw || null,
        response: item.response || null,
        percent: item.percent || 0,
      }))
    }
    else {
      fileList.value = []
    }
  },
  { deep: true, immediate: true },
)

// 同步文件列表到父组件（确保输出格式统一）
function syncFileList() {
  const value = fileList.value.map(item => ({
    url: item.url,
    name: item.name,
    uid: item.uid,
    status: item.status,
    raw: item.raw,
    response: item.response,
    percent: item.percent,
  })) as ImageUploadFile[]
  emit('update:modelValue', value)
}

// 上传前校验（适配 2.11+ beforeUpload 类型）
const handleBeforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  // 校验文件类型
  const acceptTypes = props.accept.split(',')
  const isAccept = acceptTypes.some((type) => {
    if (type.startsWith('.')) {
      return rawFile.name.toLowerCase().endsWith(type.toLowerCase())
    }
    return rawFile.type === type
  })

  if (!isAccept) {
    ElMessage.error(
      `不支持上传该类型文件，仅支持${props.accept.replace(/\./g, '').split(',').join('、')}格式`,
    )
    return false
  }

  // 校验文件大小（转换为字节）
  const maxSize = props.fileSize * 1024 * 1024
  const isLtMaxSize = rawFile.size < maxSize
  if (!isLtMaxSize) {
    ElMessage.error(`文件大小不能超过 ${props.fileSize}MB`)
    return false
  }

  return true
}

// 上传成功处理（适配 2.11+ onSuccess 类型）
const handleUploadSuccess: UploadProps['onSuccess'] = (response, uploadFile, uploadFiles) => {
  uploadProgress.value = 0

  // 假设接口返回格式：{ code: 200, data: { url: '图片地址' } }
  // 可根据实际业务调整响应处理逻辑
  if (response.code === 200 && response.data?.url) {
    // 更新文件列表中的图片地址和状态
    const index = fileList.value.findIndex(item => item.uid === uploadFile.uid)
    if (index !== -1) {
      fileList.value[index] = {
        ...fileList.value[index],
        url: response.data.url,
        status: 'success',
        response,
      }
    }

    ElMessage.success(props.fileStatusText?.success || '上传成功')
    syncFileList()
    props.onSuccess?.(response, uploadFile)
    emit('success', response, uploadFile, uploadFiles)
  }
  else {
    const errorMsg = response.message || '未知错误'
    ElMessage.error(`${props.fileStatusText?.error || '上传失败'}：${errorMsg}`)
    handleUploadError(response, uploadFile, uploadFiles)
  }
}

// 上传失败处理（适配 2.11+ onError 类型）
const handleUploadError: UploadProps['onError'] = (error, uploadFile, uploadFiles) => {
  uploadProgress.value = 0
  ElMessage.error(props.fileStatusText?.error || '上传失败，请重试')
  props.onError?.(error, uploadFile)
  emit('error', error, uploadFile, uploadFiles)
}

// 移除文件处理（适配 2.11+ onRemove 类型）
const handleRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
  fileList.value = uploadFiles
  syncFileList()
  props.onRemove?.(uploadFile, uploadFiles)
  emit('remove', uploadFile, uploadFiles)
  ElMessage.info('已移除图片')
}

// 超过最大上传数量处理（适配 2.11+ onExceed 类型）
const handleExceed: UploadProps['onExceed'] = (files, uploadFiles) => {
  ElMessage.warning(`最多只能上传 ${props.limit} 张图片`)
  emit('exceed', files, uploadFiles)
}

// 上传进度处理（适配 2.11+ onProgress 类型）
const handleProgress: UploadProps['onProgress'] = (event, uploadFile, uploadFiles) => {
  if (props.showProgress && event.percent !== undefined) {
    uploadProgress.value = Math.round(event.percent)
  }
  emit('progress', event, uploadFile, uploadFiles)
}

// 预览图片
function handlePreview(uploadFile: UploadFile) {
  if (uploadFile.url) {
    previewUrl.value = uploadFile.url
    previewVisible.value = true
  }
}

// 关闭预览弹窗
function handlePreviewClose() {
  previewUrl.value = ''
  previewVisible.value = false
}
</script>

<template>
  <div class="image-uploader-container">
    <!-- 上传区域 -->
    <el-upload
      :action="uploadUrl"
      :headers="headers"
      :file-list="fileList"
      :limit="limit"
      :multiple="multiple"
      :accept="accept"
      :auto-upload="autoUpload"
      :disabled="disabled"
      :drag="drag"
      :before-upload="handleBeforeUpload"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
      :on-remove="handleRemove"
      :on-exceed="handleExceed"
      :on-progress="handleProgress"
      :list-type="listType"
      :class="{ 'upload-disabled': disabled }"
      :http-request="customRequest"
      :file-status-text="fileStatusText"
    >
      <!-- 上传按钮/拖拽区域 -->
      <div v-if="!disabled" class="upload-trigger">
        <ElIcon v-if="drag && !multiple" class="upload-icon">
          <UploadFilled />
        </ElIcon>
        <div v-if="drag && !multiple" class="upload-text">
          <div class="upload-main-text">
            {{ dragText || '点击或拖拽文件至此处上传' }}
          </div>
          <div class="upload-sub-text">
            支持格式：{{ accept.replace(/\./g, '').split(',').join('、') }} | 最大尺寸：{{ fileSize }}MB
          </div>
        </div>
        <ElButton
          v-else
          :type="buttonType"
          :icon="buttonIcon"
          size="default"
          class="upload-button"
        >
          {{ buttonText || (multiple ? '上传图片' : '选择图片') }}
        </ElButton>
      </div>

      <!-- 上传进度条（单文件上传时显示） -->
      <div v-if="showProgress && uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
        <ElProgress :percentage="uploadProgress" size="small" />
      </div>
    </el-upload>

    <!-- 大图预览弹窗 -->
    <ElDialog
      v-model="previewVisible"
      title="图片预览"
      width="80%"
      append-to-body
      :close-on-click-modal="true"
      @close="handlePreviewClose"
    >
      <div class="preview-image-container">
        <img :src="previewUrl" alt="预览图片" class="preview-image">
      </div>
    </ElDialog>
  </div>
</template>

<style scoped lang="scss">
.image-uploader-container {
  width: 100%;

  .upload-trigger {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .upload-icon {
      font-size: 24px;
      color: #606266;
      margin-bottom: 8px;
    }

    .upload-text {
      text-align: center;
      color: #606266;

      .upload-main-text {
        font-size: 14px;
        margin-bottom: 4px;
      }

      .upload-sub-text {
        font-size: 12px;
        color: #909399;
      }
    }

    .upload-button {
      margin-bottom: 8px;
    }
  }

  .upload-progress {
    margin-top: 8px;
    width: 100%;
  }

  .upload-disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  // 预览弹窗样式
  .preview-image-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;

    .preview-image {
      max-width: 100%;
      max-height: 80vh;
      object-fit: contain;
      border-radius: 4px;
    }
  }

  // 适配 Element Plus 2.11+ 样式，使用 :deep() 穿透（Vue3 标准写法）
  :deep(.el-upload-list__item) {
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    }

    &:hover .el-upload-list__item-actions {
      opacity: 1;
    }
  }

  :deep(.el-upload-list__item-actions) {
    opacity: 0;
    transition: opacity 0.3s ease;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 0;

    .el-icon {
      color: #fff;
      transition: color 0.2s ease;

      &:hover {
        color: #409eff;
      }
    }
  }

  :deep(.el-upload-list__item-thumbnail) {
    transition: transform 0.3s ease;
    object-fit: cover;
  }

  :deep(.el-upload-list__item:hover .el-upload-list__item-thumbnail) {
    transform: scale(1.05);
  }

  // 拖拽区域样式优化（适配 2.11+ 拖拽容器）
  :deep(.el-upload-dragger) {
    border-radius: 8px;
    padding: 30px 0;
    transition: border-color 0.3s ease;

    &:hover {
      border-color: #409eff;
    }
  }

  // 按钮样式优化
  :deep(.el-button--primary) {
    transition: all 0.2s ease;
  }
</style>
