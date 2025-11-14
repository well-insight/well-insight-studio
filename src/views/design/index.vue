<script setup lang="ts">
import type { designListType } from '@/type'
import { computed, reactive, ref } from 'vue'
import Heart from '@/components/Heart/index.vue'
import ItemCard from '@/components/ItemCard/index.vue'
import { closeLoading, openLoading } from '@/hooks/useLoading'
import router from '@/router'
import { useDesignStore } from '@/stores/design'
import Preview from './Preview.vue'

interface designDropdownListType {
  title: string
  icon: string
  click: any
}

const store = useDesignStore()

const previewRef = ref<HTMLElement | null>(null)

const designLoading = ref(true)

const designList = computed(() => store.designList)

// 下拉框list
const designDropdownHandle = reactive<designDropdownListType[]>([
  {
    title: '预览',
    icon: '预览', // svg-icon name
    click: () => {

    },
  },
  {
    title: '克隆',
    icon: '克隆', // svg-icon name
    click: () => {

    },
  },
  {
    title: '重命名',
    icon: '重命名', // svg-icon name
    click: () => {

    },
  },
  {
    title: '取消发布',
    icon: '取消发布', // svg-icon name
    click: () => {

    },
  },
  {
    title: '下载',
    icon: '下载', // svg-icon name
    click: () => {

    },
  },
  {
    title: '删除',
    icon: '删除', // svg-icon name
    click: async (item: designListType) => {
      openLoading({ text: '操作中' })
      store.deleteDesign(item.id)
      await store.findDesignList()
      closeLoading()
    },
  },
])

// 弹窗预览
const showViewData = reactive<designListType>({
  title: '',
  img: '',
  width: 0,
  height: 0,
  backgroundColor: '',
  adapter: '',
  theme: '',
  status: '',
  id: '',
})

// 界面设计
function toDesignSpace(id?: string) {
  router.push({
    path: '/design/design-space',
    query: { id },
  })

  // window.open(newUrl.href, "_blank");
}

getDesignList()

async function getDesignList() {
  designLoading.value = true
  await store.findDesignList()
  designLoading.value = false
}

// 封面
</script>

<template>
  <div v-loading="designLoading" element-loading-text="数据加载中，请稍等..." class="w-full h-full">
    <el-scrollbar>
      <div v-loading="!designList" class="my-design-manager-container">
        <ItemCard v-for="(item) in designList" :key="item.img" shadow="hover" :body-style="{}">
          <div class="design-content">
            <div class="design-img" @click="toDesignSpace(item.id)">
              <!-- <svg-icon :name="item.img" style="width: 80%; height: 80%"></svg-icon> -->
              <el-image style="width: 100%;height: 100%;" :src="item?.img" alt="" />
            </div>
            <div class="design-footer">
              <span class="title">{{ item.title }}</span>
              <div class="right">
                <span class="status">
                  <Heart style="margin-right: 5px" size=".8em" :type="item.status" />
                  状态
                </span>
                <el-tooltip content="编辑" effect="light">
                  <el-button class="edit" plain @click="toDesignSpace(item.id)">
                    <template #icon>
                      <svg-icon name="hammer" size="1.5em" color="" />
                    </template>
                  </el-button>
                </el-tooltip>
                <el-dropdown class="more" :show-timeout="0">
                  <el-button icon="MoreFilled" plain />
                  <template #dropdown>
                    <el-dropdown-menu class="my-design-manager-dropdown">
                      <el-dropdown-item v-for="(m) in designDropdownHandle" :key="m.title" @click="m.click(item)">
                        <svg-icon color="" :name="m.icon" />
                        <span>{{ m.title }}</span>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </ItemCard>
      </div>

      <!-- 设计预览 -->
      <Preview ref="previewRef" :show-view-data="showViewData" />
    </el-scrollbar>
  </div>
</template>

<style lang="scss" scoped>
.my-design-manager-container {
    height: 100%;
    padding: 16px;
    position: relative;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    grid-gap: 16px;

    .item-card {
        // height: auto!important;
        // width: 250px;
        height: 250px;
        display: inline-block;

        .design-content {
            height: 100%;
            display: flex;
            flex-direction: column;

            .design-img {
                display: flex;
                flex: 1;
                height: 0;
                width: 100%;
                align-items: center;
                justify-content: center;
                cursor: pointer;
            }

            .design-footer {
                width: 100%;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                // font-size: 14px;

                .title {
                    max-width: 60px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    word-break: break-all;
                    font-size: 14px;
                }

                .right {
                    display: flex;
                    align-items: center;

                    .status {
                        display: flex;
                        align-items: center;
                        font-size: 14px;
                        margin-right: 10px;
                    }

                    .edit {
                        margin-right: 10px;
                    }
                }
            }
        }

    }
}
</style>

<style lang="scss">
.my-design-manager-dropdown {
    .el-dropdown-menu__item {
        .svg-icon {
            margin-right: 10px;
        }
    }
}

.show-disign-view-dialog {
    height: 70vh;

    .el-dialog__body {
        display: grid;
        height: calc(100% - 50px);
        width: 100%;
        grid-template-rows: 20px 1fr 40px;
        padding: 20px;

        .title {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .overviewImg {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;

            .svg-icon {
                height: 80%;
                width: auto;
                // width: 200px;
            }
        }

        .bottom-line {
            width: 100%;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: space-between;

            .edit {
                margin-left: 20px;
            }
        }
    }
}
</style>
