<script lang='ts' setup>
import { isNumber, isString } from 'lodash-es'
import { computed, ref, watch, watchEffect } from 'vue'
import { splitNumberUnit } from '@/utils/string'

const props = withDefaults(defineProps<{ unit?: '' }>(), {})

const moduleValue = defineModel<string | number | null | undefined>({ required: true, default: null })

const inputValue = ref<number | null>(null)

const unitValue = ref('')
const showUnitValue = computed(() => props?.unit || unitValue.value)

function setInputValue(v: string) {
  if (showUnitValue.value) {
    moduleValue.value = v + showUnitValue.value
  }
  else {
    moduleValue.value = Number(v)
  }
}

watchEffect(() => {
  if (isString(moduleValue.value)) {
    const [v, u] = splitNumberUnit(moduleValue.value)
    if (isNumber(v)) {
      inputValue.value = v
    }
    if (u) {
      unitValue.value = u
    }
  }
  else {
    inputValue.value = moduleValue.value || null
  }
})
</script>

<template>
  <el-input v-model="inputValue" placeholder="请输入" type="number" @input="setInputValue">
    <template v-if="showUnitValue" #append>
      {{ showUnitValue }}
    </template>
  </el-input>
</template>

<style lang='scss' module></style>
