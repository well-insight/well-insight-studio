<script setup lang='ts'>
import type { PropType } from 'vue'
import type { PageConfig } from '@/type'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Dialog from '@/components/Dialog/index.vue'

defineProps({
  showViewData: {
    type: Object as PropType<PageConfig>,
    default: () => {
      return {
        id: '11',
        img: '',
        title: '演示图表',
        status: 'warn',
      }
    },
  },
})

const router = useRouter()

const overviewVisible = ref(false)
const isDialogFullScreen = ref(false)

defineExpose({
  overviewVisible,
  isDialogFullScreen,
})

function toDesignSpace() {
  const newUrl = router.resolve({
    path: '/design/design-space',
  })
  window.open(newUrl.href, '_blank')
}
</script>

<template>
  <Dialog v-model="overviewVisible" class="show-disign-view-dialog" :show-close="false" :btns="['reduce', 'enLarge']" width="80%" :fullscreen="isDialogFullScreen" :append-to-body="true" @reduce="overviewVisible = false" @en-large="isDialogFullScreen = true">
    <div class="title">
      {{ showViewData.title }}
    </div>
    <div class="overviewImg">
      <svg-icon name="平台" />
    </div>
    <div class="bottom-line">
      <span>最后时间：{{ new Date() }}</span>
      <div class="right">
        <span class="status">
          <Heart style="margin-right: 5px" size=".8em" type="warn" />
          状态
        </span>
        <el-button class="edit" plain @click="toDesignSpace">
          <template #icon>
            <svg-icon name="hammer" size="1.5em" color="" />
          </template>
        </el-button>
      </div>
    </div>
  </Dialog>
</template>

<style lang='less' scoped>

</style>
