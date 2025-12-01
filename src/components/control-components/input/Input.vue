<script lang='ts' setup>
const inputValue = defineModel<string>({ required: true, default: '' })
</script>

<template>
  <el-input v-model="inputValue" size="small" placeholder="请输入" />
</template>

<style lang='scss' module></style>
