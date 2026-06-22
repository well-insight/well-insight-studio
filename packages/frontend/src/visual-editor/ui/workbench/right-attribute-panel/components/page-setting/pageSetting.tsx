import type { Ref } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { ElButton, ElColorPicker, ElForm, ElFormItem, ElIcon, ElOption, ElSelect, ElSwitch } from 'element-plus'
import { storeToRefs } from 'pinia'
import { computed, defineComponent, inject, provide, reactive, ref } from 'vue'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { defaultComponentBorder } from '@/utils/blockBorder'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { BorderStyleConfig } from '@/visual-editor/ui/shared/border-style-config'
import ImageUpload from '@/visual-editor/ui/shared/image-upload/ImageUpload.vue'
import DeviceSelect from './DeviceSelect.vue'

const ForceExpandKey = Symbol('forceExpand')

/** 可折叠卡片组件 — 支持父级强制展开/收起 */
const CollapsibleCard = defineComponent({
  name: 'CollapsibleCard',
  props: {
    title: { type: String, required: true },
    defaultOpen: { type: Boolean, default: true },
  },
  setup(props, { slots }) {
    const localOpen = ref(props.defaultOpen)
    const forceExpand = inject<Ref<boolean | null>>(ForceExpandKey, ref(null))

    const isOpen = computed(() => forceExpand.value ?? localOpen.value)

    function toggle() {
      // 用户手动点击卡片时，清除父级的 forceExpand，恢复独立控制
      if (forceExpand.value !== null) {
        forceExpand.value = null
      }
      localOpen.value = !localOpen.value
    }
    return () => (
      <div class="page-setting-card">

        <ElButton text class="page-setting-card__header" onClick={toggle}>
          <ElIcon
            class="page-setting-card__arrow"
            style={{
              transition: 'transform 0.2s ease',
              transform: isOpen.value ? 'rotate(0deg)' : 'rotate(-90deg)',
            }}
          >
            <ArrowDown />
          </ElIcon>
          <span class="page-setting-card__title">{props.title}</span>

        </ElButton>
        <div class="page-setting-card__body" v-show={isOpen.value}>
          {slots.default?.()}
        </div>
      </div>
    )
  },
})

export const PageSetting = defineComponent({
  setup(props, { expose }) {
    const { currentPage } = useVisualData()

    const pageConfig = computed(() => currentPage.value.config)

    const componentBorder = computed({
      get: () => {
        if (!pageConfig.value.componentBorder) {
          pageConfig.value.componentBorder = defaultComponentBorder()
        }
        return pageConfig.value.componentBorder
      },
      set: (val) => {
        pageConfig.value.componentBorder = val
      },
    })

    const workspaceStore = useWorkspaceStore()
    const { currentApp } = storeToRefs(workspaceStore)

    const options = reactive({
      backgroundRepeat: [
        { value: 'repeat', label: 'repeat（双向重复）' },
        { value: 'repeat-x', label: 'repeat-x（水平重复）' },
        { value: 'repeat-y', label: 'repeat-y（垂直重复）' },
        { value: 'no-repeat', label: 'no-repeat（不重复）' },
        { value: 'space', label: 'space（均匀分布）' },
        { value: 'round', label: 'round（平铺缩放）' },
      ],
      backgroundSize: [
        { value: '100% 100%', label: '拉伸铺满' },
        { value: 'cover', label: '等比例覆盖背景' },
        { value: 'contain', label: '等比例完整显示' },
        { value: 'auto', label: '保持图片原始尺寸' },
      ],
    })

    const forceExpand = ref<boolean | null>(null)

    provide(ForceExpandKey, forceExpand)

    function expandAll() {
      forceExpand.value = true
    }
    function collapseAll() {
      forceExpand.value = false
    }

    expose({ expandAll, collapseAll })

    return () => (
      <div class="page-setting-wrapper">
        <CollapsibleCard title="页面设置" defaultOpen={true}>
          <ElForm size="default" class="page-setting-form">
            <ElFormItem label="页面尺寸">
              <DeviceSelect
                client-type={currentApp.value?.clientType === 1 ? 'pc' : 'mobile'}
                v-model={pageConfig.value.pageSize}
              />
            </ElFormItem>
            <ElFormItem label="路由缓存">
              <ElSwitch size="default" v-model={pageConfig.value.keepAlive} />
            </ElFormItem>
          </ElForm>
        </CollapsibleCard>

        <CollapsibleCard title="背景设置" defaultOpen={true}>
          <ElForm size="default" class="page-setting-form">
            <ElFormItem label="背景颜色">
              <ElColorPicker
                model-value={pageConfig.value.bgColor || ''}
                size="default"
                teleported={false}
                show-alpha={true}
                color-format="rgb"
                predefine={['rgb(255, 255, 255)', 'rgba(255, 255, 255, 0)']}
                onUpdate:modelValue={(value) => {
                  pageConfig.value.bgColor = typeof value === 'string' ? value : ''
                }}
              />
            </ElFormItem>
            <ElFormItem label="背景图片">
              <ImageUpload v-model={pageConfig.value.bgImage} />
            </ElFormItem>
            <ElFormItem label="背景重复">
              <ElSelect
                size="default"
                v-model={pageConfig.value.bgRepeat}
                clearable
                teleported={false}
              >
                {options.backgroundRepeat.map(item => (
                  <ElOption key={item.value} label={item.label} value={item.value} />
                ))}
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="背景大小">
              <ElSelect
                size="default"
                v-model={pageConfig.value.bgSize}
                clearable
                teleported={false}
              >
                {options.backgroundSize.map(item => (
                  <ElOption key={item.value} label={item.label} value={item.value} />
                ))}
              </ElSelect>
            </ElFormItem>
          </ElForm>
        </CollapsibleCard>

        <CollapsibleCard title="边框设置" defaultOpen={false}>
          <div class="page-setting-card__border">
            <BorderStyleConfig
              modelValue={componentBorder.value}
              onUpdate:modelValue={(val) => {
                componentBorder.value = val
              }}
              layout="form"
              teleported={false}
            />
          </div>
        </CollapsibleCard>
      </div>
    )
  },
})
