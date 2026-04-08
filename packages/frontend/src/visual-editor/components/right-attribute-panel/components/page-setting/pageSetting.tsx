import { Plus } from '@element-plus/icons-vue'
import { ElColorPicker, ElForm, ElFormItem, ElInput, ElSwitch, ElUpload } from 'element-plus'
import { storeToRefs } from 'pinia'
import { defineComponent, reactive, ref } from 'vue'
import { useWorkspaceStore } from '@/store/workspaceStore/workspaceStore'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import DeviceSelect from './DeviceSelect.vue'
import ImageUpload from './ImageUpload.vue'

export const PageSetting = defineComponent({
  setup() {
    const { currentPage } = useVisualData()

    const pageConfig = currentPage.value.config

    const workspaceStore = useWorkspaceStore()

    const { currentApp } = storeToRefs(workspaceStore)

    const beforeUpload = (file: File) => {
      console.log(file, '要上传的文件')
      const fileReader = new FileReader()
      fileReader.onload = event => {
        pageConfig.bgImage = event.target?.result as string
      }
      fileReader.readAsDataURL(file)
    }

    const options = reactive({
      backgroundRepeat: [
        { value: 'repeat', label: 'repeat（双向重复）' },
        { value: 'repeat-x', label: 'repeat-x（水平重复）' },
        { value: 'repeat-y', label: 'repeat-y（垂直重复）' },
        { value: 'no-repeat', label: 'no-repeat（不重复）' },
        { value: 'space', label: 'space（均匀分布）' },
        { value: 'round', label: 'round（平铺缩放）' }
      ],
      backgroundSize: [
        { value: '100% 100%', label: '拉伸铺满' },
        { value: 'cover', label: '等比例覆盖背景' },
        { value: 'contain', label: '等比例完整显示' },
        { value: 'auto', label: '保持图片原始尺寸' }
      ]
    })

    return () => (
      <>
        <ElForm>
          <ElFormItem label='页面尺寸'>
            <DeviceSelect
              client-type={currentApp.value?.clientType === 1 ? 'pc' : 'mobile'}
              v-model={pageConfig.pageSize}
            ></DeviceSelect>
          </ElFormItem>
          <ElFormItem label='背景颜色'>
            <ElColorPicker v-model={pageConfig.bgColor} />
          </ElFormItem>
          <ElFormItem label='背景图片'>
            <ImageUpload v-model={pageConfig.bgImage}></ImageUpload>
          </ElFormItem>
          <ElFormItem label='背景重复'>
            <el-select v-model={pageConfig.bgRepeat} options={options.backgroundRepeat} clearable></el-select>
          </ElFormItem>
          <ElFormItem label='背景大小'>
            <el-select v-model={pageConfig.bgSize} options={options.backgroundSize} clearable></el-select>
          </ElFormItem>
          <ElFormItem label='路由切换时缓存本页面'>
            <ElSwitch v-model={pageConfig.keepAlive} />
          </ElFormItem>
        </ElForm>
      </>
    )
  }
})
