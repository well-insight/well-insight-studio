<script lang="ts" setup>
import type { Compnents } from '@/type'
import { Search } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import Html2Canvas from '@/components/Html2canvas/index.vue'
import ItemCard from '@/components/ItemCard/index.vue'
import List from '@/custom-components/config'

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
  if ((layerList.value[activeLayerIndex.value] as any).value === 'all') {
    const list: any[] = []
    layerList.value.forEach((o: any) => {
      if (o.components.length) {
        list.push(...o.components)
      }
    })
    return list
  }

  return layerList.value[activeLayerIndex.value]?.components || []
})

function selectLayerIndex(index: number) {
  activeLayerIndex.value = index
}

const searchValue = ref('')

function handleDragStart(e: any, item: Compnents) {
  const itemStr = JSON.stringify(item)
  e.dataTransfer.setData('component', itemStr)
}

const currentManage = ref('component')
</script>

<template>
  <div class="component-control-container" :class="!shrinkComponent ? 'shrinkComponent' : ''">
    <div class="page-list-container">
      <el-scrollbar view-style="padding: 16px;">
        <div v-for="e in 10" :key="e" class="page-wrapper">
          ee
        </div>
      </el-scrollbar>
    </div>
    <div class="flex-auto w-0">
      <div class="title-wrapper">
        <el-segmented v-model="currentManage" :options="[{ label: '组件', value: 'component' }, { label: '层级', value: 'layer' }]" block />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.component-control-container {
  height: 100%;
  width: 330px;
  display: flex;

  .page-list-container {
    width: 120px;
    height: 100%;
    box-shadow: 6px 0 12px -6px rgba(14, 34, 73, .06);
    background: var(--el-color-white);
    border-right: 1px solid #e7eaee;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-bottom: 4px;
    user-select: none;
    z-index: 1;

    .page-wrapper {
      height: 120px;
      border: var(--el-border);
      margin-bottom: 16px;

    }
  }

  .title-wrapper {
    padding: 16px;
    font-size: 14px;
    font-weight: 700;
    width: 100%;
    background-color: #fff;
    cursor: pointer;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.08);
  }

  .components-list {
    width: 50px;
    height: 100%;
    box-shadow: 6px 0 12px -6px rgba(14, 34, 73, .06);
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
    padding: 5px 10px;
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
        background-color: var(--el-color-primary-light-5);
        color: var(--el-color-white);
      }
    }
  }

  .chart-list {
    width: 0;
    flex: 1;
    height: 100%;
    background-color: #fff;
    padding: 10px;
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
