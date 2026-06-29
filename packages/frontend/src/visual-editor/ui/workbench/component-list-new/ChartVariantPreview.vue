<script lang="ts" setup>
import { computed } from 'vue'
import DatasetChartView from '@/packages/pc/chart-widgets/shared/DatasetChartView'
import { getChartOptionBuilder } from '@/packages/pc/chart-widgets/shared/chartOptionBuilders'

const props = defineProps<{
  componentKey: string
  chartVariant?: string
}>()

const buildOption = computed(() => getChartOptionBuilder(props.componentKey))
const variant = computed(() => props.chartVariant ?? 'basic')
</script>

<template>
  <DatasetChartView
    compact
    :chart-variant="variant"
    :build-option="buildOption"
  />
</template>
