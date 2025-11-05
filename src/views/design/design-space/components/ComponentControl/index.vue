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
</script>

<template>
  <div class="component-control-container" :class="!shrinkComponent ? 'shrinkComponent' : ''">
    <div class="top">
      <span class="left-box">
        组件
        <svg-icon name="chart" />
      </span>
      <span class="right-box">
        <el-input v-model="searchValue" size="small" placeholder="搜索组件" :suffix-icon="Search" />
        <el-button-group size="small">
          <el-tooltip effect="dark" placement="top" content="单列">
            <el-button type="" plain>
              <template #icon>
                <svg-icon name="单列" />
              </template>
            </el-button>
          </el-tooltip>
          <el-tooltip effect="dark" placement="top" content="双列">
            <el-button type="" plain>
              <template #icon>
                <svg-icon name="双列" />
              </template>
            </el-button>
          </el-tooltip>
        </el-button-group>
      </span>
    </div>
    <div class="content">
      <ul v-loading="!componentsList" class="components-list">
        <li
          v-for="(item, index) in componentsList" :key="item.title"
          :class="activeComponentIndex === index ? 'active' : ''" @click="selectComponentList(index)"
        >
          <svg-icon :name="item.icon" size="1.25em" />
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
          <ItemCard :btns="['cancel', 'enLarge', 'reduce']">
            <template #headerRight>
              <span>{{ item.label }}</span>
            </template>
            <div class="layer-content">
              <Html2Canvas :component-data="item" />
              <!-- <svg-icon :name="item.icon" style="width: 90%; height: 90%"></svg-icon> -->
            </div>
          </ItemCard>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.component-control-container {
  height: 100%;
  width: 330px;
  display: grid;
  grid-template-rows: 40px auto;
  overflow: hidden;

  .top {
    width: 100%;
    height: 40px;
    display: flex;
    align-content: center;
    justify-content: space-between;
    white-space: nowrap;
    background-color: #f6f8f9;

    .left-box {
      height: 100%;
      display: flex;
      align-items: center;
      padding-left: 10px;
      font-size: 14px;
      font-weight: bold;

      .svg-icon {
        margin-left: 5px;
      }
    }

    .right-box {
      display: flex;
      align-items: center;

      .el-input {
        width: 100px;
      }

      .el-button-group {
        margin: 0 10px;
      }
    }
  }

  .content {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 65px 65px auto;
    border-top: 1px solid #fff;
    overflow: hidden;

    .components-list {
      width: 100%;
      height: 100%;

      li {
        width: 50px;
        height: 55px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: bold;
        padding: 8px;
        border-radius: 4px;
        margin: 5px 0 5px 5px;
        cursor: pointer;

        &.active {
          background-color: var(--el-color-primary-light-5);
          color: var(--el-color-white);

          .svg-icon {
            color: var(--el-color-white);
          }
        }

        .title {
          white-space: nowrap;
        }
      }
    }

    .layer-list {
      width: 100%;
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
        white-space: nowrap;

        &.active {
          background-color: var(--el-color-primary-light-5);
          color: var(--el-color-white);
        }
      }
    }

    .chart-list {
      width: 100%;
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
