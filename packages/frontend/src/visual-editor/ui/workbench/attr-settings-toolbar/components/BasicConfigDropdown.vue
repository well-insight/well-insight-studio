<script setup lang="ts">
import type { ComponentBorderOverride, TextStyleConfig as TextStyleConfigValue } from '@/visual-editor/core/visual-editor.utils'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { CaretBottom, Setting } from '@element-plus/icons-vue'
import { computed, watch } from 'vue'
import { defaultComponentBorder } from '@/utils/blockBorder'
import { defaultTextStyleConfig } from '@/visual-editor/core/visual-editor.utils'
import { BorderStyleConfig } from '@/visual-editor/ui/shared/border-style-config'
import { FormatInputNumber } from '@/visual-editor/ui/shared/format-input-number'
import ImageUpload from '@/visual-editor/ui/shared/image-upload/ImageUpload.vue'
import { CollapsibleCard, PopoverPanel } from '@/visual-editor/ui/shared/popover-panel'
import { TextStyleConfig } from '@/visual-editor/ui/shared/text-style-config'

const props = defineProps<{ block: VisualEditorBlockData }>()

const showTitle = computed({
  get: () => props.block?.showTitle === true,
  set(val: boolean) {
    if (!props.block?._vid)
      return
    props.block.showTitle = val
    if (val && !props.block.titleStyle) {
      props.block.titleStyle = defaultTextStyleConfig()
    }
  },
})

const titleStyle = computed({
  get: () => props.block?.titleStyle ?? defaultTextStyleConfig(),
  set(val: TextStyleConfigValue) {
    if (!props.block?._vid)
      return
    props.block.titleStyle = val
  },
})

const gridWidth = computed({
  get: () => props.block?.w ?? props.block?.width ?? 2,
  set(val: number) {
    if (!props.block?._vid)
      return
    props.block.w = val
    if ('width' in props.block) {
      ;(props.block as any).width = val
    }
  },
})

const gridHeight = computed({
  get: () => props.block?.h ?? props.block?.height ?? 2,
  set(val: number) {
    if (!props.block?._vid)
      return
    props.block.h = val
    if ('height' in props.block) {
      ;(props.block as any).height = val
    }
  },
})

const borderOverride = computed({
  get: (): ComponentBorderOverride => {
    if (!props.block?.borderOverride) {
      props.block.borderOverride = { ...defaultComponentBorder() }
    }
    return props.block.borderOverride
  },
  set(val: ComponentBorderOverride) {
    if (!props.block?._vid)
      return
    props.block.borderOverride = val
  },
})

const compPaddingAttrs = ['paddingTop', 'paddingLeft', 'paddingRight', 'paddingBottom']

watch(
  () => compPaddingAttrs.map(item => (props.block?.styles as any)?.[item]),
  (val: string[]) => {
    if (!props.block?.styles)
      return
    const isSame = val.every(item => props.block.styles?.tempPadding === item)
    if (isSame || new Set(val).size === 1) {
      props.block.styles.tempPadding = val[0]
    }
    else {
      props.block.styles.tempPadding = ''
    }
  },
  { immediate: true },
)

const compPadding = computed({
  get: () => props.block?.styles?.tempPadding,
  set(val) {
    if (!props.block?.styles)
      return
    const styles = props.block.styles as any
    compPaddingAttrs.forEach((item) => { styles[item] = val })
    styles.tempPadding = val
  },
})

const bgImageUrl = computed({
  get: () => {
    const raw = `${props.block?.styles?.backgroundImage || ''}`.trim()
    const matched = raw.match(/^url\((['"]?)(.*)\1\)$/)
    return matched ? matched[2] : raw
  },
  set: (val: string) => {
    if (!props.block?.styles)
      return
    const next = (val || '').trim()
    props.block.styles.backgroundImage = next ? `url(${next})` : 'none'
  },
})
</script>

<template>
  <PopoverPanel title="基础配置">
    <template #trigger>
      <el-button text :icon="Setting">
        <span>基础配置</span>
        <el-icon><CaretBottom /></el-icon>
      </el-button>
    </template>

    <CollapsibleCard title="基础设置" :default-open="true">
      <el-form label-position="left" label-width="80">
        <el-form-item label="组件名称">
          <el-input v-model="block.label" clearable placeholder="请输入组件名称" maxlength="32" />
        </el-form-item>
        <el-form-item label="展示标题">
          <el-switch v-model="showTitle" />
        </el-form-item>
        <TextStyleConfig v-if="showTitle" v-model="titleStyle" layout="form" show-position show-background show-border-radius size="default" :teleported="false" label-width="80" />
      </el-form>
    </CollapsibleCard>

    <CollapsibleCard title="尺寸与背景" :default-open="true">
      <el-form label-position="left" label-width="80">
        <el-form-item label="宽度">
          <el-input-number v-model="gridWidth" :min="1" />
        </el-form-item>
        <el-form-item label="高度">
          <el-input-number v-model="gridHeight" :min="1" />
        </el-form-item>
        <el-form-item label="背景颜色">
          <el-color-picker v-model="block.styles.backgroundColor" />
        </el-form-item>
        <el-form-item label="背景图片">
          <ImageUpload v-model="bgImageUrl" />
        </el-form-item>
        <el-form-item label="图片重复">
          <el-select v-model="block.styles.backgroundRepeat" clearable :teleported="false">
            <el-option label="不重复" value="no-repeat" />
            <el-option label="双向重复" value="repeat" />
            <el-option label="水平重复" value="repeat-x" />
            <el-option label="垂直重复" value="repeat-y" />
          </el-select>
        </el-form-item>
        <el-form-item label="图片大小">
          <el-select v-model="block.styles.backgroundSize" clearable :teleported="false">
            <el-option label="覆盖" value="cover" />
            <el-option label="完整显示" value="contain" />
            <el-option label="拉伸铺满" value="100% 100%" />
            <el-option label="原始尺寸" value="auto" />
          </el-select>
        </el-form-item>
      </el-form>
    </CollapsibleCard>

    <CollapsibleCard title="布局">
      <el-form label-position="left" label-width="80">
        <el-form-item label="水平对齐">
          <el-radio-group v-model="block.styles.justifyContent">
            <el-radio-button value="flex-start">
              左
            </el-radio-button>
            <el-radio-button value="center">
              中
            </el-radio-button>
            <el-radio-button value="flex-end">
              右
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="垂直对齐">
          <el-radio-group v-model="block.styles.alignItems">
            <el-radio-button value="flex-start">
              上
            </el-radio-button>
            <el-radio-button value="center">
              中
            </el-radio-button>
            <el-radio-button value="flex-end">
              下
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="内边距">
          <FormatInputNumber v-model="compPadding" />
        </el-form-item>
      </el-form>
    </CollapsibleCard>

    <CollapsibleCard title="边框设置">
      <BorderStyleConfig v-model="borderOverride" layout="form" :teleported="false" />
    </CollapsibleCard>
  </PopoverPanel>
</template>
