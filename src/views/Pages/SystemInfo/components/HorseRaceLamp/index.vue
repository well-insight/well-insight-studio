<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { goodDailySentences } from '@/api/service'
import { getRandomColor } from '@/utils'

const horseTextList = ref<{ title: string, color: string }[]>([])
const oneSentenceData = ref<any>({})
goodDailySentences().then((res: any) => {
  if (res) {
    oneSentenceData.value = res.data
    horseTextList.value = (res.data.content || '').split('').map((o: string) => {
      return {
        title: o,
        color: getRandomColor(),
      }
    })
  }
})

// 文本长度
const conRef: any = ref(null)
const lineRef: any = ref(null)
const conWidth = ref<number | string>(0)
const lineW = ref<number | string>(0)

onMounted(() => {
  conWidth.value = `${(conRef.value ? conRef.value.offsetWidth : 0) - 80}px`
  lineW.value = `${(lineRef.value ? lineRef.value.offsetWidth : 0) * -1}px`
})
</script>

<template>
  <div ref="conRef" class="horse-race-lamp-container">
    <div ref="lineRef" class="line">
      <div class="content">
        <span v-for="(item, i) in horseTextList" :key="i" style="color: #909399" class="line-item">{{ item.title }}</span>
      </div>
      <div style="position: absolute; bottom: 0; width: 100%" dir="rtl">
        {{ oneSentenceData.origin }}——
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@conwidth: v-bind(conWidth);
@lineW: v-bind(lineW);

.horse-race-lamp-container {
    height: 100%;
    width: 100%;
    white-space: normal;
    display: flex;
    align-items: center;
    overflow: hidden;

    .line {
        display: inline-block;
        position: relative;
        width: 100%;
        height: 100%;

        .content {
            width: 100%;
            font-size: .4em;

            .line-item {
                margin: 0 2px;
                font-size: .5em;
            }

        }
    }
}
</style>
