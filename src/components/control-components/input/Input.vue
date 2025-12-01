<script lang='ts' setup>
const inputValue = defineModel<string>({ required: true, default: '' })
</script>

<template>
  <div>
    <el-input v-model="inputValue" size="small" placeholder="请输入" />
  </div>
</template>

<style lang='scss' module></style>
