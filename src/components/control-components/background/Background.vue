<script lang='ts' setup>
import type { CSSProperties } from 'vue'
import { ref, watch } from 'vue'
import { ColorPicker } from '../color-picker'
import { ImageUploader } from '../uploader'
import BackgroundRepeat from './BackgroundRepeat.vue'

const backgroundValue = defineModel<string>({ default: '', required: true })

const modelForm = ref({
  backgroundColor: '#ffffff',
  backgroundImage: '',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '100% 100%',
})

watch(backgroundValue, (n) => {
  debugger
  modelForm.value = parseBackground(n)
})

function changeBackground() {
  backgroundValue.value = composeBackground(modelForm.value)
  debugger
}

/**
 * 解析 background 复合属性为拆分的子属性对象
 * @param {string} bgComposite - background 复合属性值（如 "red url('bg.jpg') center/cover no-repeat fixed"）
 * @returns {object} 拆分后的子属性对象
 */
function parseBackground(bgComposite: string) {
  if (!bgComposite || typeof bgComposite !== 'string') {
    return {
      backgroundColor: '',
      backgroundImage: '',
      backgroundRepeat: '',
      backgroundPosition: '',
      backgroundSize: '',
      backgroundAttachment: '',
      backgroundOrigin: '',
      backgroundClip: '',
    }
  }

  const result = {
    backgroundColor: '',
    backgroundImage: '',
    backgroundRepeat: '',
    backgroundPosition: '',
    backgroundSize: '',
    backgroundAttachment: '',
    backgroundOrigin: '',
    backgroundClip: '',
  }

  const segments = splitBackgroundString(bgComposite)
  const positionSizeSeparator = '/'
  let positionSizeSegment = ''

  // 第一步：识别各片段类型
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!

    // 处理 position/size 组合段（如 center/cover）
    if (seg.includes(positionSizeSeparator)) {
      positionSizeSegment = seg
      continue
    }

    // 1. 识别 background-image（url() 开头）
    if (seg.startsWith('url(')) {
      result.backgroundImage = seg
      continue
    }

    // 2. 识别 background-attachment（scroll/fixed/local）
    if (['scroll', 'fixed', 'local'].includes(seg)) {
      result.backgroundAttachment = seg
      continue
    }

    // 3. 识别 background-repeat（repeat/repeat-x/repeat-y/no-repeat/space/round）
    if (['repeat', 'repeat-x', 'repeat-y', 'no-repeat', 'space', 'round'].includes(seg)) {
      result.backgroundRepeat = seg
      continue
    }

    // 4. 识别 background-origin/background-clip（padding-box/border-box/content-box）
    const boxValues = ['padding-box', 'border-box', 'content-box']
    if (boxValues.includes(seg)) {
      // origin 优先级高于 clip（复合属性中 origin 在前，clip 在后）
      if (!result.backgroundOrigin) {
        result.backgroundOrigin = seg
      }
      else {
        result.backgroundClip = seg
      }
      continue
    }

    // 5. 剩余未识别的片段：优先是颜色（最后处理，因为颜色值格式多）
    result.backgroundColor = seg
  }

  // 第二步：解析 position/size 组合段
  if (positionSizeSegment) {
    const [position, size] = positionSizeSegment.split(positionSizeSeparator)
    result.backgroundPosition = position?.trim() || ''
    result.backgroundSize = size?.trim() || ''
  }

  // 补充默认值（若未识别到 repeat，默认 repeat）
  if (!result.backgroundRepeat) {
    result.backgroundRepeat = 'repeat'
  }

  // 补充默认值（若未识别到 attachment，默认 scroll）
  if (!result.backgroundAttachment) {
    result.backgroundAttachment = 'scroll'
  }

  return result
}

/**
 * 合并拆分的 background 子属性为复合属性字符串
 * @param {object} bgParts - 拆分后的子属性对象（结构同 parseBackground 返回值）
 * @returns {string} background 复合属性值
 */
function composeBackground(bgParts: CSSProperties): string {
  if (!bgParts || typeof bgParts !== 'object') {
    return ''
  }

  // 解构子属性（赋默认空值）
  const {
    backgroundColor = '',
    backgroundImage = '',
    backgroundRepeat = 'repeat',
    backgroundPosition = 'center',
    backgroundSize = 'auto',
    backgroundAttachment = 'scroll',
    backgroundOrigin = '',
    backgroundClip = '',
  } = bgParts

  const compositeSegments = []

  // 1. 拼接 background-image
  if (backgroundImage) {
    compositeSegments.push(backgroundImage)
  }

  // 2. 拼接 position/size（用 / 分隔）
  const positionSize = [backgroundPosition, backgroundSize].filter(Boolean).join('/')
  if (positionSize) {
    compositeSegments.push(positionSize)
  }

  // 3. 拼接 background-repeat
  if (backgroundRepeat) {
    compositeSegments.push(backgroundRepeat)
  }

  // 4. 拼接 background-attachment
  if (backgroundAttachment) {
    compositeSegments.push(backgroundAttachment)
  }

  // 5. 拼接 background-origin
  if (backgroundOrigin) {
    compositeSegments.push(backgroundOrigin)
  }

  // 6. 拼接 background-clip
  if (backgroundClip) {
    compositeSegments.push(backgroundClip)
  }

  // 7. 拼接 background-color（最后一位）
  if (backgroundColor) {
    compositeSegments.push(backgroundColor)
  }

  // 过滤空片段并拼接成最终字符串
  return compositeSegments.filter(Boolean).join(' ')
}

/**
 * 工具函数：安全分割 background 字符串（避免分割带引号的 URL 内部空格）
 * @param {string} bgStr - 原始 background 字符串
 * @returns {string[]} 分割后的有效片段数组
 */
function splitBackgroundString(bgStr: string): string[] {
  const segments = []
  let currentSegment = ''
  let inQuotes = false // 标记是否在引号内（处理 url("xxx xxx") 场景）

  for (const char of bgStr.trim()) {
    if (char === '"' || char === '\'') {
      inQuotes = !inQuotes
    }
    // 仅当不在引号内且遇到空格时，分割片段
    if (char === ' ' && !inQuotes) {
      if (currentSegment) {
        segments.push(currentSegment)
        currentSegment = ''
      }
    }
    else {
      currentSegment += char
    }
  }
  // 追加最后一个片段
  if (currentSegment) {
    segments.push(currentSegment)
  }

  return segments
}
</script>

<template>
  <div class="wfull flex flex-col">
    <el-form
      class="w-full"
      label-position="top"
      label-width="auto"
      :model="modelForm"
    >
      <el-form-item label="背景颜色" prop="backgroundColor">
        <ColorPicker v-model="modelForm.backgroundColor" @change="changeBackground" />
      </el-form-item>
      <el-form-item label="背景图片" prop="backgroundImage">
        <ImageUploader v-model="modelForm.backgroundImage" @change="changeBackground" />
      </el-form-item>
      <el-form-item label="背景位置" prop="backgroundPosition">
        <el-input v-model="modelForm.backgroundPosition" @change="changeBackground" />
      </el-form-item>
      <el-form-item label="背景重复" prop="backgroundRepeat">
        <BackgroundRepeat v-model="modelForm.backgroundRepeat" @change="changeBackground" />
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang='scss' module></style>
