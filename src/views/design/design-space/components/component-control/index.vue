<script lang="ts" setup>
import type { Compnents } from '@/type'
import { computed, ref } from 'vue'
import Html2Canvas from '@/components/Html2canvas/index.vue'
import customComponents from '@/custom-components'
import List from '@/custom-components/config'
import { getComponentConfig } from '@/custom-components/utils'

defineProps({
  shrinkComponent: {
    type: Boolean,
    default: false,
  },
})

const componentsList = (List || [])
const activeComponentIndex = ref(0) // 选择组件 index
const activeLayerIndex = ref(0) // 选择 类型 index

const layerList = computed(() => {
  return [{
    name: '全部',
    components: [],
    value: 'all',
  }, ...(List || [])[activeComponentIndex.value]?.list || []]
})

function selectComponentList(index: number) {
  activeComponentIndex.value = index
  activeLayerIndex.value = 0
}

const chartList = computed(() => {
  let list: any[] = []
  if ((layerList.value[activeLayerIndex.value] as any).value === 'all') {
    layerList.value.forEach((o: any) => {
      if (o.components.length) {
        list.push(...o.components)
      }
    })
  }
  else {
    list = (layerList.value[activeLayerIndex.value]?.components || [])
  }

  list = list.map((e) => {
    const config = customComponents?.find(u => u?.name === e?.component)?.config
    return {
      ...getComponentConfig(e?.name, config),
      ...e,
    }
  })

  return list
})

function selectLayerIndex(index: number) {
  activeLayerIndex.value = index
}

const searchValue = ref('')

function handleDragStart(e: any, item: Compnents) {
  const itemStr = JSON.stringify(item)
  e.dataTransfer.setData('component', itemStr)
}
</script>

<template>
  <div class="component-control-container" :class="!shrinkComponent ? 'shrinkComponent' : ''">
    <ul v-loading="!componentsList" class="components-list">
      <li
        v-for="(item, index) in componentsList" :key="item.title"
        :class="activeComponentIndex === index ? 'active' : ''" @click="selectComponentList(index)"
      >
        <svg-icon :name="item.icon" size="1.2em" />
        <span class="title">{{ item.title }}</span>
      </li>
    </ul>
    <ul class="layer-list">
      <li
        v-for="(item, index) in layerList" :key="item.name" :class="activeLayerIndex === index ? 'active' : ''"
        @click="selectLayerIndex(index)"
      >
        {{ item.name }}
      </li>
    </ul>
    <ul class="chart-list">
      <li
        v-for="(item, index) in chartList" :key="index + item.id" draggable="true" :data-index="index"
        @dragstart="handleDragStart($event, item)"
      >
        <el-card shadow="never" class="w-full h-full custom-card">
          <template #header>
            {{ item.label }}
          </template>
          <div class="layer-content">
            <Html2Canvas :component-data="item" />
            <!-- <svg-icon :name="item.icon" style="width: 90%; height: 90%"></svg-icon> -->
          </div>
        </el-card>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.component-control-container {
  height: 100%;
  width: 100%;
  display: flex;

  .components-list {
    width: 50px;
    height: 100%;
    // box-shadow: 6px 0 12px -6px rgba(14, 34, 73, .06);
    background: var(--el-color-white);
    border-right: 1px solid #e7eaee;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-bottom: 4px;
    user-select: none;
    width: 50px;
    z-index: 1;

    li {
      width: 50px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
      padding: 8px;
      cursor: pointer;
      gap: 6px;

      &:hover {
        background-color: #f4f4f4;
      }

      &.active {
        background-color: var(--el-color-primary-light-9);

        .svg-icon {
          color: var(--el-color-primary);
        }
      }

      .title {
        white-space: nowrap;
      }
    }
  }

  .layer-list {
    width: 80px;
    height: 100%;
    background-color: #fff;
    padding: 12px 0 12px 12px;
    font-weight: 700;

    li {
      list-style: none;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 10px;
      border-radius: 4px;
      cursor: pointer;

      &.active {
        background-color: var(--el-color-primary);
        color: var(--el-color-white);
      }
    }
  }

  .chart-list {
    width: 0;
    flex: 1;
    height: 100%;
    background-color: #fff;
    padding: 12px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      /*滚动条整体样式*/
      width: 0px;
      /*高宽分别对应横竖滚动条的尺寸*/
      height: 0px;
    }

    li {
      width: 100%;
      height: 150px;
      display: block;
      list-style: none;
      margin-bottom: 10px;

      .layer-content {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        .svg-icon {
          transition: all .4s;
          max-height: 100px;
        }

        &:hover {
          .svg-icon {
            width: 100% !important;
            height: 100% !important;
          }
        }
      }
    }
  }
}

.custom-card {
  display: flex;
  flex-direction: column;

  --el-card-padding: 12px;

  :deep(.el-card__body) {
    flex: 1;
    height: 0;
  }
}
</style>

<style lang="scss">
.component-control-container {
  .content {
    .item-card {
      .el-card__header {
        padding: 4px 10px;

        .btn {
          height: 8px;
          width: 8px;
        }
      }
    }
  }
}
</style>
