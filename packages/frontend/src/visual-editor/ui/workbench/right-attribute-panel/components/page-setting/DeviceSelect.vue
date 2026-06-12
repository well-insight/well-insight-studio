<!-- DeviceSizeSelect.vue -->
<script setup lang="ts">
import { computed } from 'vue'

// 设备尺寸类型定义
export interface DeviceSize {
  name: string
  width: number
  height: number
}

const props = withDefaults(defineProps<{ clientType?: 'pc' | 'mobile' }>(), {
  clientType: 'pc',
})

// 移动端常用设备尺寸列表
const deviceSizesMobile: DeviceSize[] = [
  { name: 'iPhone SE/小屏安卓', width: 320, height: 568 },
  { name: 'iPhone 6/7/8/中端安卓', width: 375, height: 667 },
  { name: 'iPhone 12/13/14 标准版', width: 390, height: 844 },
  { name: 'iPhone 14/15 Pro', width: 393, height: 852 },
  { name: 'iPhone 15 Pro Max', width: 430, height: 932 },
  { name: '安卓大屏旗舰', width: 412, height: 915 },
  { name: 'iPad mini/安卓平板', width: 768, height: 1024 },
  { name: 'iPad Pro 11英寸', width: 834, height: 1194 },
]

const deviceSizesPc: DeviceSize[] = [{ name: '浏览器 常用尺寸', width: 1920, height: 1080 }]

const deviceSizes = computed(() => {
  return props?.clientType === 'mobile' ? deviceSizesMobile : deviceSizesPc
})

// ✅ 核心：一行代码实现 v-model 双向绑定
const model = defineModel<DeviceSize | undefined>()
</script>

<template>
  <el-select
    v-model="model"
    size="default"
    placeholder="请选择设备尺寸"
    clearable
    value-key="width"
    style="width: 260px"
    :teleported="false"
  >
    <el-option
      v-for="item in deviceSizes"
      :key="item.width"
      :label="`${item.name}（${item.width}×${item.height}px）`"
      :value="item"
    />
  </el-select>
</template>
