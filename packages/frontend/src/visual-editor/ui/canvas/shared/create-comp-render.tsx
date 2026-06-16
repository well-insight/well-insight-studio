import type { PropType } from 'vue'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { computed, defineComponent } from 'vue'
import { useDatasetResolvedProps } from '@/hooks/useDatasetResolvedProps'
import { visualConfig } from '@/visual.config'

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
        return rest
      })

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
          },
        })
      }

      return () => (
        <div
          class={['comp-render-root', `comp-render-${props.element._vid}`]}
          style={{
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
            ...blockStyles.value,
          }}
        >
          {renderContent()()}
        </div>
      )
    },
  })
}
