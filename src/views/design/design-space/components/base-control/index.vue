<script lang="ts" setup>
import type { Action } from 'element-plus'
import type { Compnents } from '@/type'
import { Delete, Plus, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, ref } from 'vue'
import Html2Canvas from '@/components/Html2canvas/index.vue'
import ItemCard from '@/components/ItemCard/index.vue'
import List from '@/custom-components/config'
import ComponentControl from '../component-control/index.vue'

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

const options = [{ label: '组件', value: 'component' }, { label: '层级', value: 'layer' }]

const pages = ref([{ title: '首页', key: 'index' }, { title: '第一页', key: 'first' }, { title: '经济日支出情况看板', key: 'jjkb' }])

const isActivePage = ref('index')

function selectPage(k: string) {
  isActivePage.value = k
}

function deletePage(page: { key: string, title: string }) {
  if (pages.value?.length === 1) {
    ElMessage.warning('至少存在一个页面')
    return
  }
  const index = pages.value.findIndex(e => e?.key === page?.key)
  ElMessageBox.alert(`确认是否删除页面：${page?.title}`, '提示', {
    // if you want to disable its autofocus
    // autofocus: false,
    confirmButtonText: '确认',
    callback: (action: Action) => {
      if (action === 'confirm') {
        pages.value.splice(index, 1)
        if (isActivePage.value === page?.key) {
          isActivePage.value = pages.value?.[0]?.key || 'index'
        }
      }
    },
  })
}

const dialogVisible = ref(false)
const pageForm = ref({ title: '', key: '' })
function openAddPage() {
  dialogVisible.value = true
}
</script>

<template>
  <div class="component-control-container" :class="!shrinkComponent ? 'shrinkComponent' : ''">
    <div class="page-list-container">
      <el-scrollbar view-style="padding: 12px;">
        <div
          v-for="e in pages"
          :key="e.key"
          class="page-wrapper relative"
          :class="{ 'is-active': isActivePage === e?.key }"
          @click="selectPage(e?.key)"
        >
          <el-button :icon="Delete" link class="absolute top-0 right-0 right-icon" @click.stop="deletePage(e)" />
          {{ e?.title }}
        </div>

        <div
          class="page-wrapper relative flex items-center justify-center"
          @click="openAddPage"
        >
          <el-button :icon="Plus" link size="large" />
        </div>
      </el-scrollbar>
    </div>
    <div class="flex-auto w-0 flex flex-col h-full">
      <div class="title-wrapper">
        <el-input
          v-model="searchValue"
          placeholder="输入组件名称搜索"
          :prefix-icon="Search"
          class="mb-2"
        />
        <el-tabs v-model="currentManage" stretch class="custom-tabs">
          <el-tab-pane
            v-for="e in options"
            :key="e?.value"
            :label="e?.label"
            :name="e.value"
          />
        </el-tabs>
      </div>
      <div class="main-wrapper">
        <div class="main-view-container">
          <ComponentControl v-show="currentManage === 'component'" />
          <div v-show="currentManage === 'layer'">
            层级列表
          </div>
        </div>
      </div>
    </div>
  </div>

  <el-dialog
    v-model="dialogVisible"
    title="Tips"
    append-to-body
    width="500"
  >
    <el-form :model="pageForm" label-width="auto" style="max-width: 600px">
      <el-form-item label="页面标识">
        <el-input v-model="pageForm.key" />
      </el-form-item>
      <el-form-item label="页面名称">
        <el-input v-model="pageForm.title" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">
          Cancel
        </el-button>
        <el-button type="primary" @click="dialogVisible = false">
          Confirm
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.component-control-container {
  height: 100%;
  width: 100%;
  display: flex;

  .page-list-container {
    width: 100px;
    height: 100%;
    background: var(--el-color-white);
    // border-right: 1px solid #e7eaee;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-bottom: 4px;
    user-select: none;
    z-index: 1;

    .page-wrapper {
      height: 100px;
      border: var(--el-border);
      margin-bottom: 12px;
      border-radius: var(--el-border-radius-base);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;

      .right-icon {
        display: none;
      }

      &:hover {
        background-color: #f4f4f4;

        .right-icon {
          display: block;
        }
      }

      &.is-active {
        background-color: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
        border: var(--el-border);
        border-color: var(--el-color-primary);

        .right-icon {
          display: block;
        }
      }
      // box-shadow: var(--el-box-shadow-light);
    }
  }

  .title-wrapper {
    padding: 12px 12px 0 0;
    font-size: 14px;
    width: 100%;
    background-color: var(--el-color-white);
    cursor: pointer;

    .custom-tabs {
      :deep(.el-tabs__header) {
        margin-bottom: 0;
      }
    }
  }

  .main-wrapper {
    flex: 1;
    height: 0;
    background-color: var(--el-color-white);
    padding: 12px 12px 12px 0;

    .main-view-container {
      height: 100%;
      width: 100%;
      border: var(--el-border);
    }
  }

  .components-list {
    width: 50px;
    height: 100%;
    box-shadow: 6px 0 12px -6px rgba(14, 34, 73, .06);
    background: var(--el-color-white);
    // border-right: 1px solid #e7eaee;
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
        background-color: var(--el-color-primary);

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
        padding: 4px 12px;

        .btn {
          height: 8px;
          width: 8px;
        }
      }
    }
  }
}
</style>
