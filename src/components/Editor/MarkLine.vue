<script lang="ts" setup>
import { computed, onMounted, reactive } from 'vue'
import { useDesignStore } from '@/stores/design'
import bus from '@/utils/eventBus'

const store = useDesignStore()

const markLineData = reactive<any>({
  lines: ['xt', 'xc', 'xb', 'yl', 'yc', 'yr'], // 分别对应三条横线和三条竖线
  diff: 3, // 相距 dff 像素将自动吸附
  lineConfig: {
    xt: { show: false, style: {} },
    xc: { show: false, style: {} },
    xb: { show: false, style: {} },
    yl: { show: false, style: {} },
    yc: { show: false, style: {} },
    yr: { show: false, style: {} },
  },
})

const curComponentIndex = computed(() => store.$state.curComponentIndex)
const componentData = computed(() => store.$state.componentsInCanvas)

function hideLine() {
  Object.keys(markLineData.lineConfig).forEach((line: string) => {
    markLineData.lineConfig[line].show = false
  })
}

function checkLine() {
  const curComponent = componentData.value[curComponentIndex.value]
  componentData.value.forEach((com: any) => {
    const style = com.style
    const componentStyle: any = {
      xt: `${Number.parseInt(style.top)}px`,
      xc: `${Number.parseInt(style.top) + Number.parseInt(style.height) / 2}px`,
      xb: `${Number.parseInt(style.top) + Number.parseInt(style.height)}px`,
      yl: `${Number.parseInt(style.left)}px`,
      yc: `${Number.parseInt(style.left) + Number.parseInt(style.width) / 2}px`,
      yr: `${Number.parseInt(style.left) + Number.parseInt(style.width)}px`,
    }
    Object.entries(markLineData.lineConfig).forEach(([key, value]: any) => {
      const position = key.includes('x') ? 'top' : 'left'
      if (curComponent.id === com.id) {
        return
      }
      markLineData.lineConfig[key].show = Math.abs(Number.parseInt(value.style[position]) - Number.parseInt(componentStyle[key])) <= markLineData.diff
    })
  })
}

onMounted(() => {
  bus.on('moveComponent', (component: any) => {
    checkLine()
    // Object.entries(markLineData.lineConfig).forEach(([key, value]: any) => {
    //     markLineData.lineConfig[key].show =true;
    // });
    Object.keys(markLineData.lineConfig).forEach((key) => {
      const lineStyle = markLineData.lineConfig[key].style
      if (key === 'xt') {
        lineStyle.top = `${Number.parseInt(component.style.top)}px`
      }
      if (key === 'xc') {
        lineStyle.top = `${Number.parseInt(component.style.top) + Number.parseInt(component.style.height) / 2}px`
      }
      if (key === 'xb') {
        lineStyle.top = `${Number.parseInt(component.style.top) + Number.parseInt(component.style.height)}px`
      }
      if (key === 'yl') {
        lineStyle.left = `${Number.parseInt(component.style.left)}px`
      }
      if (key === 'yc') {
        lineStyle.left = `${Number.parseInt(component.style.left) + Number.parseInt(component.style.width) / 2}px`
      }
      if (key === 'yr') {
        lineStyle.left = `${Number.parseInt(component.style.left) + Number.parseInt(component.style.width)}px`
      }
    })
  })
  bus.on('unMoveComponent', () => {
    hideLine()
  })
})
</script>

<template>
  <div class="mark-line">
    <div v-for="line in markLineData.lines" v-show="markLineData.lineConfig[line].show || false" :key="line" :ref="line" :style="markLineData.lineConfig[line].style" class="line" :class="line.includes('x') ? 'xline' : 'yline'" />
  </div>
</template>

<style lang="scss" scoped>
.mark-line {
    height: 100%;
}
.line {
    background: #59c7f9;
    position: absolute;
    z-index: 1000;
}
.xline {
    width: 100%;
    height: 1px;
}
.yline {
    width: 1px;
    height: 100%;
}
</style>
