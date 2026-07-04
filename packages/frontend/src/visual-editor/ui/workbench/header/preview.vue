<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import { AdaptiveDialog } from '@/components/adaptive-dialog'
import { BASE_URL } from '@/visual-editor/lib'

defineOptions({
  name: 'Preview',
})

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})
const emits = defineEmits(['update:visible'])

const dialogVisible = useVModel(props, 'visible', emits)
const previewUrl = `${BASE_URL}preview/${location.hash}`
</script>

<template>
  <AdaptiveDialog
    v-model="dialogVisible"
    title="H5 预览"
    width="360px"
    shell-class="h5-preview"
  >
    <iframe
      v-if="dialogVisible"
      :style="{ width: '100%', height: '100%' }"
      :src="previewUrl"
      frameborder="0"
      scrolling="auto"
    />
  </AdaptiveDialog>
</template>

<style lang="scss">
.h5-preview {
  .el-dialog__body {
    width: 360px;
    height: 640px;
    padding: 0;
  }

  .simulator {
    padding-right: 0;

    &::-webkit-scrollbar {
      width: 0;
    }
  }
}
</style>
