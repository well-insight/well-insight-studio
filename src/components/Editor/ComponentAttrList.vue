<script lang="ts" setup>
import type { ComponentConfig } from '@/custom-components/types'
import { storeToRefs } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import customComponents from '@/custom-components'
import { useDesignStore } from '@/stores/design'
import { getComponent } from '../control-components'

const activeNames = ref(['1'])

const designStore = useDesignStore()

const { currentComponentConfig } = storeToRefs(designStore)

const configs = ref<ComponentConfig[]>()

watch(() => designStore.currentComponentConfig, (n) => {
  console.log(customComponents, n)
  configs.value = customComponents.find(e => e?.name === n.component)?.config || []
})
function handleChange(val: string[]) {
  console.log(val)
}

const chartOptions = ref({})
</script>

<template>
  <div class="component-attr-list-container flex flex-col gap-4">
    <div class="title">
      <span>组件配置</span>
      <svg-icon name="预览" />
    </div>
    <el-tabs type="border-card" class="w-full h-full" stretch>
      <el-tab-pane label="基础">
        <el-collapse v-model="activeNames">
          <template v-for="e in configs" :key="e?.key">
            <el-collapse-item :title="e?.title" :name="e?.value">
              <div>
                Consistent with real life: in line with the process and logic of real
                life, and comply with languages and habits that the users are used to;
              </div>
            </el-collapse-item>
            <!-- <div v-else class="w-full flex">
              <el-text>{{ e?.title }}</el-text>
              <div class="flex-auto w-0">
                <component :is="getComponent(e?.key)" v-model="currentComponentConfig[e.value]" />
              </div>
            </div> -->
          </template>
          <template v-for="e in configs" :key="e?.key">
            <div class="w-full flex h-[50px] items-center attrs-setting-item">
              <el-text class="w-[30%]">
                {{ e?.title }}
              </el-text>
              <div class="flex-auto w-0">
                <component :is="getComponent(e?.key)" v-model="currentComponentConfig[e.value]" />
              </div>
            </div>
          </template>
        </el-collapse>
      </el-tab-pane>
      <el-tab-pane label="动画">
        Config
      </el-tab-pane>
      <el-tab-pane label="数据">
        Role
      </el-tab-pane>
      <el-tab-pane label="Task">
        Task
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.component-attr-list-container {
  width: 100%;
  height: 100%;
  padding: 12px;
  font-size: 14px;
  font-weight: 700;
  // overflow-y: scroll;

  .title {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    height: 35px;
    width: 100%;
    border-radius: 6px;
    background-color: #fff;
    cursor: pointer;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 8%);

    span {
      margin-right: 5px;
    }
  }

  .attrs-setting-item {
    border-bottom: 1px solid var(--el-collapse-border-color);
  }
}
</style>
