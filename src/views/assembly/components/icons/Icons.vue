<script lang="ts" setup>
import { ElMessage } from 'element-plus'

const svgModules = import.meta.glob('@/assets/svgs/icons/**.svg', { eager: true })

const svgNames = Object.keys(svgModules).map((filePath) => {
  // 步骤1：截取文件名（带后缀） -> home.svg
  const fileNameWithExt = filePath.split('/').pop()!
  // 步骤2：去掉 .svg 后缀 -> home
  return fileNameWithExt.replace(/\.svg$/, '')
})

function copyIconName(name: string) {
  navigator.clipboard.writeText(`<svg-icon name="${name}" />`)
    .then(() => {
      ElMessage.success(`图标名称复制成功：<svg-icon name="${name}" />`)
    })
}
</script>

<template>
  <div class="w-full h-full">
    <el-scrollbar class="w-full h-full" :view-class="$style['icons-container']">
      <div v-for="e in svgNames" :key="e" :class="$style['icons-item']" class="p-4 cursor-pointer" @click="copyIconName(e)">
        <svg-icon :name="e" />
        <el-text truncated>
          {{ e }}
        </el-text>
      </div>
    </el-scrollbar>
  </div>
</template>

<style lang="scss" module>
.icons-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  grid-gap: 16px;
}

.icons-item {
    height: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: var(--el-border);
    border-radius: var(--el-border-radius-base);
    flex-direction: column;
    gap: 12px;

    &:hover {
      background: var(--el-color-primary-light-8);

      :global(.svg-icon) {
        color: var(--el-color-primary);
      }

      :global(.el-text) {
        --el-text-color: var(--el-color-primary);
      }

    }
  }
</style>
