<script lang="ts" setup>
import type { UploadFile } from 'element-plus'
import type { CSSProperties, Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import { themeColor } from '@/hooks/useEchartTheme'
import { useDesignStore } from '@/stores/design'

const uploadImage = ref<UploadFile[]>([])

const fileUrl = ref('')

const designStore = useDesignStore()

const { pageConfig }: { pageConfig: Ref<CSSProperties> } = storeToRefs(designStore)

const backgroundControl = reactive({

})

function selectThemeColor(key: string) {
  pageConfig.value.theme = key || 'light'
}

function showThemeBorderColor(key: string | number) {
  const isSel = key === pageConfig.value.theme
  return isSel ? (themeColor as any)[key].colors[0] : 'transparent'
}

function changePageBgColor(e: string | null) {
  designStore.setPageConfigByKey('backgroundColor', e)
}

function uploadSuccess(file: UploadFile) {
  if (file.status !== 'ready')
    return
  if (file) {
    const reader = new FileReader()
    reader.readAsDataURL(file.raw!)
    reader.onload = (e) => {
      fileUrl.value = (e.target?.result || '') as string
      designStore.setPageConfigByKey('backgroundImage', fileUrl.value)
    }
  }
}

function deleteBg() {
  fileUrl.value = ''
  uploadImage.value = []
  designStore.setPageConfigByKey('backgroundImage', undefined)
}

watch(() => pageConfig.value.backgroundImage, (n) => {
  fileUrl.value = n || ''
}, { immediate: true })
</script>

<template>
  <div class="canvas-attr-list-container">
    <el-scrollbar view-style="padding: 10px">
      <div class="title">
        <span>页面配置</span>
        <svg-icon name="预览" size="1.15em" />
      </div>

      <div class="canvas-attr-list-content">
        <div class="attrs-setting-item">
          <el-text class="attrs-setting-item-title">
            宽度
          </el-text>
          <div class="attrs-setting-item-content">
            <el-input v-model="pageConfig.width" type="number" :min="1">
              <template #suffix>
                px
              </template>
            </el-input>
          </div>
        </div>

        <div class="attrs-setting-item">
          <el-text class="attrs-setting-item-title">
            长度
          </el-text>
          <div class="attrs-setting-item-content">
            <el-input v-model="pageConfig.height" type="number" :min="1">
              <template #suffix>
                px
              </template>
            </el-input>
          </div>
        </div>

        <div class="attrs-setting-item">
          <el-text class="attrs-setting-item-title">
            背景颜色
          </el-text>
          <div class="attrs-setting-item-content">
            <el-color-picker
              v-model="pageConfig.backgroundColor" label="1111" color-format="hex"
              popper-class="color-popper-container" show-alpha @active-change="changePageBgColor"
            />
          </div>
        </div>

        <div class="attrs-setting-item">
          <el-text class="attrs-setting-item-title">
            背景图片
          </el-text>
          <div class="attrs-setting-item-content">
            <el-upload
              v-model:file-list="uploadImage" class="custom-upload" drag action="#" :multiple="false"
              :show-file-list="false" :on-change="uploadSuccess"
            >
              <div class="flex items-center justify-center flex-col w-full relative h-full custom-upload-wrapper">
                <template v-if="!fileUrl">
                  <el-icon class="el-icon--upload" size="60px">
                    <PictureFilled />
                  </el-icon>
                  <div class="el-upload__text">
                    背景图需小于 5M ，格式为 png/jpg/gif 的文件
                  </div>
                </template>
                <template v-else>
                  <img class="w-full" :src="fileUrl" alt="" fit="contain">
                  <div class="flex absolute top-2 right-2 z-99">
                    <el-icon :size="20" @click.stop="deleteBg">
                      <Delete />
                    </el-icon>
                  </div>
                </template>
              </div>
            </el-upload>
          </div>
        </div>

        <el-collapse class="custom-collapse">
          <el-collapse-item title="背景属性设置" name="backgroundControl">
            <div class="attrs-setting-item">
              <el-text class="attrs-setting-item-title">
                背景位置
              </el-text>
              <div class="attrs-setting-item-content">
                <el-input v-model="pageConfig.backgroundPosition" placeholder="请输入" />
              </div>
            </div>

            <div class="attrs-setting-item">
              <el-text class="attrs-setting-item-title">
                背景大小
              </el-text>
              <div class="attrs-setting-item-content">
                <el-input v-model="pageConfig.backgroundSize" placeholder="请输入" />
              </div>
            </div>

            <div class="attrs-setting-item">
              <el-text class="attrs-setting-item-title">
                背景重复
              </el-text>
              <div class="attrs-setting-item-content">
                <el-select v-model="pageConfig.backgroundRepeat">
                  <el-option value="repeat" label="repeat" />
                  <el-option value="repeat-x" label="repeat-x" />
                  <el-option value="repeat-y" label="repeat-y" />
                  <el-option value="no-repeat" label="no-repeat" />
                </el-select>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>

        <!-- <div class="config-item ">
        <label>宽度</label>
        <div class="config-content">
          <el-input v-model="pageConfig.width" type="number" :min="1">
            <template #suffix>
              px
            </template>
</el-input>
</div>
</div>

<div class="config-item ">
  <label>长度</label>
  <div class="config-content">
    <el-input id="canvas-size-height" v-model="pageConfig.height" type="number" :min="1">
      <template #suffix>
              px
            </template>
    </el-input>
  </div>
</div>

<div class="config-item color-config">
  <label>背景颜色</label>
  <div class="config-content">
    <el-color-picker v-model="pageConfig.backgroundColor" label="1111" color-format="hex"
      popper-class="color-popper-container" show-alpha @active-change="changePageBgColor" />
  </div>
</div>

<div class="config-item background-img-config">
  <label>背景图片</label>
  <div class="config-content">
    <el-upload v-model:file-list="uploadImage" class="custom-upload" drag action="#" :multiple="false"
      :show-file-list="false" :on-change="uploadSuccess">
      <div class="flex items-center justify-center flex-col w-full relative h-full custom-upload-wrapper">
        <template v-if="!fileUrl">
                <el-icon class="el-icon--upload" size="60px">
                  <PictureFilled />
                </el-icon>
                <div class="el-upload__text">
                  背景图需小于 5M ，格式为 png/jpg/gif 的文件
                </div>
              </template>
        <template v-else>
                <img class="w-full" :src="fileUrl" alt="" fit="contain">
                <div class="flex absolute top-2 right-2 z-99">
                  <el-icon :size="20" @click.stop="deleteBg">
                    <Delete />
                  </el-icon>
                </div>
              </template>
      </div>
    </el-upload>
  </div>
</div>

<div class="config-item color-config">
  <label>背景颜色</label>
  <div class="config-content">
    <el-radio-group v-model="pageConfig.adapter" class="mb-4">
      <el-radio-button label="auto">
        自适应
      </el-radio-button>
      <el-radio-button label="XPro">
        X轴铺满
      </el-radio-button>
    </el-radio-group>
    <el-radio-group v-model="pageConfig.adapter">
      <el-radio-button label="YPro">
        Y轴铺满
      </el-radio-button>
      <el-radio-button label="XYPro">
        四周铺满
      </el-radio-button>
    </el-radio-group>
  </div>
</div> -->

        <!-- <div class="config-item">
      <label>适配方式</label>
      <el-radio-group v-model="pageConfig.adapter" size="small">
        <el-radio-button size="small" label="auto">
          自适应
        </el-radio-button>
        <el-radio-button size="small" label="XPro">
          X轴铺满
        </el-radio-button>
        <el-radio-button size="small" label="YPro">
          Y轴铺满
        </el-radio-button>
        <el-radio-button size="small" label="XYPro">
          四周铺满
        </el-radio-button>
      </el-radio-group>
    </div> -->
        <div class="title">
          <span>主题颜色</span>
          <svg-icon name="调色板" size="1.15em" />
        </div>
        <div class="config-item theme-config">
          <div
            v-for="(item, key) in themeColor" :key="item.name"
            :style="{ borderTop: `2px solid ${showThemeBorderColor(key)}` }"
            :class="[`color-line theme-color-${key}`, pageConfig.theme === key ? 'active' : '']"
            @click="selectThemeColor(key)"
          >
            <label>{{ item.name }}</label>
            <div class="color-item-box">
              <span v-for="color in item.colors" :key="color" class="color-item" :style="{ backgroundColor: color }" />
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<style lang="scss" scoped>
$themeColor: v-bind(themeColor);

.canvas-attr-list-container {
  width: 100%;
  height: 100%;
  // padding: 10px;
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
    margin-bottom: 12px;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 8%);

    span {
      margin-right: 5px;
    }
  }

  .canvas-attr-list-content {
    border: var(--el-border);
    background-color: var(--el-bg-color);
    margin-bottom: 12px;
    padding: 15px;

    .attrs-setting-item {
      display: flex;
      align-items: flex-start;
      border-bottom: var(--el-border);
      padding: 12px 0;

      .attrs-setting-item-title {
        width: 30%;
        line-height: var(--el-component-size);
        height: var(--el-component-size);
        align-self: baseline;
      }

      .attrs-setting-item-content {
        flex: 1;
        width: 0;
      }
    }
  }

  .config-item {
    width: 100%;
    margin-bottom: 20px;
    display: flex;
    // align-items: center;
    align-items: flex-start;

    &>label {
      width: 60px;
      margin-right: 8px;
      height: 32px;
      line-height: 32px;
    }

    .config-content {
      flex: 1;
      width: 0;
    }
  }

  // .background-img-config {
  //   align-items: flex-start;

  //   .el-upload {
  //     width: 200px;

  //     .el-icon--upload svg {
  //       width: 100px;
  //       height: 100px;
  //     }
  //   }
  // }

  .color-config {
    //position: relative;
    //.color-pick-value {
    //    display: inline-flex;
    //    width: 200px;
    //    position: absolute;
    //    left: -200px;
    //    align-items: center;
    //    transform: translateX(100%);
    //}
  }

  .theme-config {
    display: flex;
    flex-direction: column;

    .color-line {
      width: 100%;
      height: 40px;
      display: flex;
      align-items: center;
      padding-left: 10px;
      // border: #e8e8e9 1px solid;
      background-color: #FFF;
      border-radius: 20px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all .3s;
      border-top: 2px solid transparent;

      &.active {
        box-shadow: var(--el-box-shadow-lighter);
      }

      &:hover {
        box-shadow: var(--el-box-shadow-lighter);
      }

      label {
        width: 30px;
        margin-right: 5px;
      }

      .color-item-box {
        display: flex;
        align-items: center;
        justify-content: space-around;
        width: calc(100% - 35px);

        .color-item {
          width: 30px;
          height: 30px;
          // margin: 0 10px;
          border-radius: 50%;
        }

      }

    }
  }

  .custom-upload {
    height: 180px;
    // width: 100%;

    :deep(.el-upload) {
      height: 100%;
      width: 100%;
    }

    :deep(.el-upload-dragger) {
      padding: 0;
      height: 100%;
      width: 100%;
    }
  }

  .custom-upload-container {
    // padding: var(--el-upload-dragger-padding-horizontal) var(--el-upload-dragger-padding-vertical);
  }

  .custom-collapse {
    // border-bottom: none;

    :deep(.el-collapse-item__content) {
      padding-left: 20px;
    }
  }
}
</style>

<style lang="scss">
.canvas-attr-list-container {
  .color-config .el-color-picker {
    flex: 1;

    .el-color-picker__trigger {
      width: 100%;
    }
  }
}

.color-popper-container .el-color-dropdown__btns button {
  display: none;
}
</style>
