<script lang='ts' setup>
const color = defineModel<string>({ required: true, default: '#ffffff' })
</script>

<template>
  <div class="w-full">
    <el-color-picker v-model="color" show-alpha />
  </div>
</template>

<style lang='scss' module></style>
