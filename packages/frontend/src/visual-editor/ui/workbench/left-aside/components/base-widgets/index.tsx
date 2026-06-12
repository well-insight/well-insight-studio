import { Edit } from '@element-plus/icons-vue'
import { cloneDeep } from 'lodash-es'

import { defineComponent, ref } from 'vue'
import DraggableTransitionGroup from '@/visual-editor/ui/canvas/simulator-editor/DraggableTransitionGroup.vue'
import { createNewBlock } from '@/visual-editor/visual-editor.utils'
import { visualConfig } from '@/visual.config'
import styles from './index.module.scss'

export default defineComponent({
  name: 'BaseWidgets',
  label: '基本组件',
  order: 3,
  icon: Edit,
  setup() {
    const baseWidgets = ref(visualConfig.componentModules.baseWidgets)

    const log = (evt) => {
      window.console.log('onChange:', evt)
    }
    // 克隆组件
    const cloneDog = (comp) => {
      console.log('当前拖拽的组件：', comp)
      const newComp = cloneDeep(comp)
      return createNewBlock(newComp)
    }

    return () => (
      <>
        <DraggableTransitionGroup
          class={styles.listGroup}
          v-model={baseWidgets.value}
          group={{ name: 'components', pull: 'clone', put: false }}
          clone={cloneDog}
          onChange={log}
          itemKey="key"
        >
          {{
            item: ({ element }) => (
              <div class={styles.listGroupItem} data-label={element.label}>
                {element.preview()}
              </div>
            ),
          }}
        </DraggableTransitionGroup>
      </>
    )
  },
})
