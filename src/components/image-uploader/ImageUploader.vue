<script setup lang="ts">
import type { UploadFile, UploadFileStatus } from 'element-plus'
import type { UploaderFile } from 'vant'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElButton, ElDialog, ElIcon, ElMessage, ElProgress } from 'element-plus'
import { Button, ImagePreview, Uploader } from 'vant'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

// Props默认值
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
  onSuccess: () => () => { },
  onError: () => () => { },
  onRemove: () => () => { },
  onExceed: () => () => { },
  onProgress: () => () => { },
})

// Emits定义
const emit = defineEmits<{
  'update:modelValue': [value: ImageUploadFile[]]
  'success': [response: any, file: ImageUploadFile]
  'error': [error: any, file: ImageUploadFile]
  'remove': [file: ImageUploadFile, files: ImageUploadFile[]]
  'exceed': [files: File[], filesList: ImageUploadFile[]]
  'progress': [percent: number, file: ImageUploadFile]
}>()

// 设备判断
function isMobileDevice() {
  const ua = navigator.userAgent
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  const isSmallScreen = window.innerWidth < 768
  return isMobileUA || isSmallScreen
}

// 统一文件类型
export interface ImageUploadFile {
  url: string
  name: string
  uid: string
  status: UploadFileStatus | 'uploading' | 'done' | 'failed'
  raw?: File | null
  percent?: number
  response?: any
}

// Props定义
interface ImageUploadProps {
  uploadUrl: string
  modelValue?: ImageUploadFile[]
  headers?: Record<string, string>
  limit?: number
  multiple?: boolean
  accept?: string
  fileSize?: number
  autoUpload?: boolean
  disabled?: boolean
  drag?: boolean
  listType?: 'text' | 'picture' | 'picture-card'
  buttonText?: string
  buttonType?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text'
  buttonIcon?: typeof ElIcon
  dragText?: string
  showProgress?: boolean
  onSuccess?: (response: any, file: ImageUploadFile) => void
  onError?: (error: any, file: ImageUploadFile) => void
  onRemove?: (file: ImageUploadFile, files: ImageUploadFile[]) => void
  onExceed?: (files: File[], filesList: ImageUploadFile[]) => void
  onProgress?: (percent: number, file: ImageUploadFile) => void
}

// 核心状态
const isMobile = ref<boolean>(false)
const uploadProgress = ref<number>(0)
const previewVisible = ref<boolean>(false)
const previewUrl = ref<string>('')
const innerFileList = ref<ImageUploadFile[]>([])

// 设备监听
function resizeHandler() { isMobile.value = isMobileDevice() }
onMounted(() => {
  isMobile.value = isMobileDevice()
  window.addEventListener('resize', resizeHandler)
  innerFileList.value = props.modelValue || []
})
onUnmounted(() => window.removeEventListener('resize', resizeHandler))

// 双向绑定
watch(() => props.modelValue, (newVal = []) => innerFileList.value = newVal, { deep: true, immediate: true })
watch(() => innerFileList.value, newVal => emit('update:modelValue', newVal), { deep: true })

// PC端适配
const elFileList = computed<UploadFile[]>(() =>
  innerFileList.value.map(item => ({
    url: item.url,
    name: item.name,
    uid: item.uid,
    status: item.status as UploadFileStatus,
    raw: item.raw,
    percent: item.percent || 0,
    response: item.response,
  })),
)

function handleElBeforeUpload(rawFile: File) {
  const isAccept = props.accept.split(',').some(type =>
    type.startsWith('.') ? rawFile.name.toLowerCase().endsWith(type.toLowerCase()) : rawFile.type === type,
  )
  if (!isAccept) { ElMessage.error(`仅支持${props.accept.replace(/\./g, '').split(',').join('、')}格式`); return false }
  if (rawFile.size > props.fileSize * 1024 * 1024) { ElMessage.error(`文件不超过${props.fileSize}MB`); return false }
  return true
}

function handleElSuccess(response: any, file: UploadFile) {
  uploadProgress.value = 0
  if (response.code === 200 && response.data?.url) {
    const index = innerFileList.value.findIndex(item => item.uid === file.uid)
    if (index !== -1)
      innerFileList.value[index] = { ...innerFileList.value[index], url: response.data.url, status: 'success', response }
    const unifiedFile = innerFileList.value.find(item => item.uid === file.uid)
    unifiedFile && (props.onSuccess(response, unifiedFile), emit('success', response, unifiedFile))
    ElMessage.success('上传成功')
  }
  else { ElMessage.error(response.message || '上传失败') }
}

function handleElError(error: any, file: UploadFile) {
  uploadProgress.value = 0
  const unifiedFile = innerFileList.value.find(item => item.uid === file.uid)
  unifiedFile && (unifiedFile.status = 'error', props.onError(error, unifiedFile), emit('error', error, unifiedFile))
  ElMessage.error('上传失败')
}

function handleElRemove(file: UploadFile, files: UploadFile[]) {
  const unifiedFile = innerFileList.value.find(item => item.uid === file.uid)
  innerFileList.value = files.map(item => ({ url: item.url, name: item.name, uid: item.uid, status: item.status as UploadFileStatus, raw: item.raw }))
  unifiedFile && (props.onRemove(unifiedFile, innerFileList.value), emit('remove', unifiedFile, innerFileList.value))
  ElMessage.info('已移除')
}

function handleElExceed(files: File[], filesList: UploadFile[]) {
  ElMessage.warning(`最多上传${props.limit}张`)
  emit('exceed', files as File[], filesList.map(item => ({ url: item.url, name: item.name, uid: item.uid, status: item.status as UploadFileStatus, raw: item.raw })))
}

function handleElProgress(event: any, file: UploadFile) {
  const percent = Math.round(event.percent || 0)
  uploadProgress.value = percent
  const unifiedFile = innerFileList.value.find(item => item.uid === file.uid)
  unifiedFile && (props.onProgress(percent, unifiedFile), emit('progress', percent, unifiedFile))
}

// 移动端适配
const vantFileList = computed<UploaderFile[]>(() =>
  innerFileList.value.map(item => ({
    url: item.url,
    name: item.name,
    file: item.raw,
    status: item.status === 'success' ? 'done' : item.status === 'error' ? 'failed' : 'uploading',
    percent: item.percent || 0,
    uid: item.uid,
  })),
)

function handleVantBeforeRead(file: File) {
  const isAccept = props.accept.split(',').some(type =>
    type.startsWith('.') ? file.name.toLowerCase().endsWith(type.toLowerCase()) : file.type === type,
  )
  if (!isAccept) { ElMessage.error(`仅支持${props.accept.replace(/\./g, '').split(',').join('、')}格式`); return false }
  if (file.size > props.fileSize * 1024 * 1024) { ElMessage.error(`文件不超过${props.fileSize}MB`); return false }

  const uid = `vant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  innerFileList.value.push({ url: URL.createObjectURL(file), name: file.name, uid, status: 'uploading', raw: file, percent: 0 })
  return true
}

function handleVantDelete(file: UploaderFile) {
  const unifiedFile = innerFileList.value.find(item => item.uid === file.uid)
  innerFileList.value = innerFileList.value.filter(item => item.uid !== file.uid)
  unifiedFile && (props.onRemove(unifiedFile, innerFileList.value), emit('remove', unifiedFile, innerFileList.value))
  ElMessage.info('已移除')
}

const handleVantOversize = () => ElMessage.error(`文件不超过${props.fileSize}MB`)
function handleVantMaxCount(files: File[]) { ElMessage.warning(`最多上传${props.limit}张`); emit('exceed', files, innerFileList.value) }

function handleVantSuccess(response: any, file: UploaderFile) {
  const index = innerFileList.value.findIndex(item => item.uid === file.uid)
  if (index !== -1)
    innerFileList.value[index] = { ...innerFileList.value[index], url: response.data?.url || innerFileList.value[index].url, status: 'success', response, percent: 100 }
  const unifiedFile = innerFileList.value[index]
  unifiedFile && (props.onSuccess(response, unifiedFile), emit('success', response, unifiedFile))
  ElMessage.success('上传成功')
}

function handleVantError(error: any, file: UploaderFile) {
  const index = innerFileList.value.findIndex(item => item.uid === file.uid)
  if (index !== -1)
    innerFileList.value[index].status = 'error'
  const unifiedFile = innerFileList.value[index]
  unifiedFile && (props.onError(error, unifiedFile), emit('error', error, unifiedFile))
  ElMessage.error('上传失败')
}

function handleVantProgress(event: ProgressEvent, file: UploaderFile) {
  const percent = Math.round((event.loaded / event.total) * 100)
  const index = innerFileList.value.findIndex(item => item.uid === file.uid)
  if (index !== -1)
    innerFileList.value[index].percent = percent
  const unifiedFile = innerFileList.value[index]
  unifiedFile && (props.onProgress(percent, unifiedFile), emit('progress', percent, unifiedFile))
}

// 预览逻辑
function handlePreview(url: string) { previewUrl.value = url; previewVisible.value = true }
function handlePreviewClose() { previewUrl.value = ''; previewVisible.value = false }
</script>

<template>
  <div class="image-uploader-container" :class="{ mobile: isMobile }">
    <!-- PC端：Element Plus -->
    <div v-if="!isMobile" class="pc-upload">
      <el-upload
        :action="uploadUrl" :headers="headers" :file-list="elFileList" :limit="limit" :multiple="multiple"
        :accept="accept" :auto-upload="autoUpload" :disabled="disabled" :drag="drag"
        :before-upload="handleElBeforeUpload" :on-success="handleElSuccess" :on-error="handleElError"
        :on-remove="handleElRemove" :on-exceed="handleElExceed" :on-progress="handleElProgress" :list-type="listType"
      >
        <div v-if="!disabled" class="upload-trigger">
          <ElIcon v-if="drag && !multiple" class="upload-icon">
            <UploadFilled />
          </ElIcon>
          <div v-if="drag && !multiple" class="upload-text">
            <div class="upload-main-text">
              {{ dragText || '点击或拖拽上传' }}
            </div>
            <div class="upload-sub-text">
              支持格式：{{ accept.replace(/\./g, '').split(',').join('、') }} | 最大{{ fileSize }}MB
            </div>
          </div>
          <ElButton v-else :type="buttonType" :icon="buttonIcon" class="upload-button">
            {{ buttonText || (multiple ? '上传图片' : '选择图片') }}
          </ElButton>
        </div>
        <div v-if="showProgress && uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
          <ElProgress :percentage="uploadProgress" size="small" />
        </div>
      </el-upload>
    </div>

    <!-- 移动端：Vant -->
    <div v-else class="mobile-upload">
      <van-uploader
        :file-list="vantFileList" :accept="accept" :max-size="fileSize * 1024 * 1024" :max-count="limit"
        :multiple="multiple" :disabled="disabled" :upload-url="uploadUrl" :headers="headers" :auto-upload="autoUpload"
        :before-read="handleVantBeforeRead" preview-size="80" @delete="handleVantDelete" @oversize="handleVantOversize"
        @max-count="handleVantMaxCount" @upload-success="handleVantSuccess" @upload-fail="handleVantError"
        @upload-progress="handleVantProgress"
      >
        <van-button type="primary" size="normal" icon="plus" class="vant-upload-btn">
          {{ buttonText || (multiple ? '选择图片' : '上传图片') }}
        </van-button>
      </van-uploader>
    </div>

    <!-- 预览弹窗 -->
    <ElDialog
      v-if="!isMobile && previewVisible" v-model="previewVisible" title="预览" width="80%" append-to-body
      @close="handlePreviewClose"
    >
      <img :src="previewUrl" alt="预览" class="preview-image">
    </ElDialog>
    <van-image-preview
      v-if="isMobile && previewVisible" v-model:show="previewVisible" :images="[previewUrl]"
      @close="handlePreviewClose"
    />
  </div>
</template>

<style scoped lang="scss">
.image-uploader-container {
  width: 100%;

  &.mobile {
    padding: 0 10px;
  }

  .pc-upload {
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

      .el-icon {
        color: #fff;

        &:hover {
          color: #409eff;
        }
      }
    }

    :deep(.el-upload-list__item-thumbnail) {
      transition: transform 0.3s ease;
      cursor: pointer;

      &:hover {
        transform: scale(1.05);
      }
    }

    :deep(.el-upload-dragger) {
      border-radius: 8px;
      padding: 30px 0;
      transition: border-color 0.3s ease;

      &:hover {
        border-color: #409eff;
      }
    }
  }

  .mobile-upload {
    .vant-upload-btn {
      width: 100%;
      border-radius: 8px;
      margin-bottom: 10px;
    }

    :deep(.van-uploader__preview) {
      margin: 0 8px 8px 0;

      &:last-child {
        margin-right: 0;
      }
    }

    :deep(.van-uploader__preview-image) {
      border-radius: 4px;
    }
  }

  .preview-image {
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
    border-radius: 4px;
    display: block;
    margin: 0 auto;
  }
}
</style>
