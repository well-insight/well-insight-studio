<script setup lang='ts'>
import { ref } from 'vue'
import { HorizontalBarChart } from '@/custom-components/bar-chart'
// import { useDom2image } from "@/hooks/useDom2image"

const dom2imageRef = ref<HTMLElement | null>(null)

const demoImgSrc = ref('')

async function toImagg() {
  console.log(dom2imageRef)
  const options = {}
  // demoImgSrc.value = await useDom2image(dom2imageRef.value as HTMLElement);
}
</script>

<template>
  <div ref="dom2imageRef" class="html-2-png-container">
    <div>测试文字 普通 dom 元素</div>
    <div>
      <label>测试echarts 图</label>
      <HorizontalBarChart />
    </div>
  </div>

  <el-button @click="toImagg">
    导出
  </el-button>

  <img class="demo-img" :src="demoImgSrc" alt="">
</template>

<style lang='scss' scoped>
.html-2-png-container {
    height: 200px;
    width: 200px;
    border: 1px solid red;
    background-color: #fff;
}

.demo-img {
    height: 200px;
    height: 200px;
}
</style>
