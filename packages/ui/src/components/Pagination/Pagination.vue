<script setup lang="ts">
import { computed } from 'vue'
import type { PaginationProps } from './types'

const props = withDefaults(defineProps<PaginationProps>(), {
  modelValue: 1,
  rows: 10,
  pageLinkSize: 5,
  disabled: false,
})
const emit = defineEmits<{
  (event: 'update:modelValue', value: number): void
  (event: 'page', value: number): void
}>()
const pageCount = computed(() => Math.max(1, Math.ceil(props.totalRecords / props.rows)))
const currentPage = computed(() => Math.min(Math.max(1, props.modelValue), pageCount.value))
/** Zero-based index of the first record on the current page . */
const first = computed(() => (currentPage.value - 1) * props.rows)
const pages = computed(() => {
  const count = Math.min(props.pageLinkSize, pageCount.value)
  const start = Math.min(Math.max(1, currentPage.value - Math.floor(count / 2)), pageCount.value - count + 1)
  return Array.from({ length: count }, (_, index) => start + index)
})

function setPage(page: number) {
  const nextPage = Math.min(Math.max(1, page), pageCount.value)
  if (props.disabled || nextPage === currentPage.value) return
  emit('update:modelValue', nextPage)
  emit('page', nextPage)
}

defineExpose({ first, pageCount })
</script>

<template>
  <nav class="wd-pagination" aria-label="分页导航">
    <button type="button" class="wd-pagination__button" :disabled="disabled || currentPage === 1" aria-label="上一页" @click="setPage(currentPage - 1)">‹</button>
    <button v-for="page in pages" :key="page" type="button" class="wd-pagination__button" :class="{ 'wd-pagination__button--active': page === currentPage }" :disabled="disabled" :aria-label="`第 ${page} 页`" :aria-current="page === currentPage ? 'page' : undefined" @click="setPage(page)">{{ page }}</button>
    <button type="button" class="wd-pagination__button" :disabled="disabled || currentPage === pageCount" aria-label="下一页" @click="setPage(currentPage + 1)">›</button>
  </nav>
</template>
