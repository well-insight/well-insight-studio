import type { PropType } from 'vue'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { computed, defineComponent } from 'vue'
import { visualConfig } from '@/visual.config'

export default defineComponent({
  name: 'CompRender',
  props: {
    element: {
      type: Object as PropType<VisualEditorBlockData>,
      default: () => ({}),
    },
  },
  setup(props) {
    const blockStyles = computed(() => {
      const { tempPadding, ...rest } = props.element.styles || {}
      return rest
    })

    const renderContent = () =>
      visualConfig.componentMap[props.element.componentKey].render({
        styles: props.element.styles || {},
        props: props.element.props || {},
        model: {},
        block: props.element,
        custom: {},
      })

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
