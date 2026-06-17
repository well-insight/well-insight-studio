import type { PropType, Ref } from 'vue'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { computed, defineComponent, inject, ref } from 'vue'
import { useDatasetResolvedProps } from '@/hooks/useDatasetResolvedProps'
import {
  type ContainerEditorContext,
  ContainerEditorContextKey,
  EditingContainerIdKey,
} from '@/packages/pc/container-component/container'
import { visualConfig } from '@/visual.config'

const CONTAINER_COMPONENT_KEYS = new Set(['group', 'container', 'layout', 'form'])

function isContainerComponent(componentKey: string) {
  return CONTAINER_COMPONENT_KEYS.has(componentKey)
}

/**
 * 画布组件渲染：在绘制前合并数据集解析结果，使所有组件统一具备数据绑定能力
 */
export function createCompRender(name = 'CompRender') {
  return defineComponent({
    name,
    props: {
      element: {
        type: Object as PropType<VisualEditorBlockData>,
        default: () => ({}),
      },
    },
    setup(props) {
      const editingContainerId = inject<Ref<string | null>>(EditingContainerIdKey, ref(null))
      const editorCtx = inject<ContainerEditorContext | null>(ContainerEditorContextKey, null)

      const blockStyles = computed(() => {
        const { tempPadding, ...rest } = props.element.styles || {}
        // 组内定位由外层 blockWrapperStyles 负责，避免污染 comp-render-root 的 flex 布局
        if (props.element.groupInnerLayout) {
          const {
            position: _p,
            left: _l,
            top: _t,
            right: _r,
            bottom: _b,
            width: _w,
            height: _h,
            ...clean
          } = rest
          return clean
        }
        // 容器组件不使用 flex 居中默认样式，否则会破坏 header/aside/main 布局
        if (isContainerComponent(props.element.componentKey)) {
          const {
            display: _display,
            justifyContent: _justifyContent,
            alignItems: _alignItems,
            ...containerStyles
          } = rest
          return {
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            ...containerStyles,
          }
        }
        return rest
      })

      const isContainer = computed(() => isContainerComponent(props.element.componentKey))

      const { resolvedProps, datasetLoading, datasetError, datasetBound, refreshDataset }
        = useDatasetResolvedProps(
          () => props.element.componentKey,
          () => props.element,
        )

      const renderContent = () => {
        const comp = visualConfig.componentMap[props.element.componentKey]
        if (!comp) {
          return () => null
        }
        return comp.render({
          styles: props.element.styles || {},
          props: resolvedProps.value,
          model: props.element.model || {},
          block: props.element,
          custom: {
            datasetLoading: datasetLoading.value,
            datasetError: datasetError.value,
            datasetBound: datasetBound.value,
            refreshDataset,
            editingContainerId,
            editorCtx,
          },
        })
      }

      return () => {
        // 建立对容器编辑态的响应式依赖，确保双击进入编辑模式后插槽画布及时更新
        void editingContainerId.value

        return (
          <div
            class={['comp-render-root', `comp-render-${props.element._vid}`]}
            style={{
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
              overflow: isContainer.value ? 'visible' : 'hidden',
              ...blockStyles.value,
            }}
          >
            {renderContent()()}
          </div>
        )
      }
    },
  })
}
