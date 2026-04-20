<script setup lang="ts">
import type { DrawerProps } from 'element-plus'
import type { CSSProperties } from 'vue'
import { computed } from 'vue'
import SimulatorEditorPreview from '@/visual-editor/ui/canvas/simulator-editor-preview/SimulatorEditorPreview.vue'

// 定义组件Props
interface Props {
  /** 设备类型：pc/mobile */
  device?: 'pc' | 'mobile'
}

// 定义Props并设置默认值
const props = withDefaults(defineProps<Props & Partial<DrawerProps>>(), {
  device: 'pc',
  direction: 'btt'
})

const modelValue = defineModel<boolean>({ required: true })

// 计算属性：抽屉展开方向（从下往上）
const drawerDirection = computed<DrawerProps['direction']>(() => 'btt')

// 计算属性：抽屉尺寸（适配不同设备）
const drawerSize = computed(() => (props.device === 'pc' ? '95%' : '95%'))

const deviceStyle = computed<CSSProperties>(() => {
  const width = props?.device === 'pc' ? '100%' : '374px'
  return {
    width,
    height: '100%'
  }
})
</script>

<template>
  <el-drawer v-model="modelValue" :direction="drawerDirection" title="预览" :size="drawerSize" class="preview-drawer">
    <div class="w-full h-full flex items-center justify-center">
      <el-card :class="$style.card" :style="deviceStyle">
        <SimulatorEditorPreview />
      </el-card>
    </div>
  </el-drawer>
</template>

<style lang="scss" module>
.card {
}
</style>
