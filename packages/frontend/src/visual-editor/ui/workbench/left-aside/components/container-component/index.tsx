import type { VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { Suitcase } from '@element-plus/icons-vue'
import { cloneDeep } from 'lodash-es'

import { defineComponent } from 'vue'
import Draggable from 'vuedraggable'
import { createNewBlock } from '@/visual-editor/visual-editor.utils'
import { visualConfig } from '@/visual.config'
import styles from './index.module.scss'

export default defineComponent({
  name: 'ContainerComponent',
  label: '容器组件',
  icon: Suitcase,
  order: 4,
  setup() {
    const log = (evt) => {
      window.console.log(evt)
    }
    // 克隆组件
    const cloneDog = (comp) => {
      console.log('当前拖拽的组件：', comp)
      const newComp = cloneDeep(comp)
      return createNewBlock(newComp)
    }

    // 过滤掉不在列表中显示的组件（如组组件）
    const visibleComponents = Object.values(visualConfig.componentModules.containerComponents)
      .filter((comp: VisualEditorComponent) => !comp.hiddenInList)

    return () => (
      <>
        <Draggable
          class={styles.listGroup}
          sort={false}
          forceFallback={false}
          list={visibleComponents}
          group={{ name: 'components', pull: 'clone', put: false }}
          clone={cloneDog}
          item-key="_vid"
          onChange={log}
        >
          {{
            item: ({ element }: { element: VisualEditorComponent }) => (
              <div class={styles.listGroupItem} data-label={element.label}>
                {element.preview()}
              </div>
            ),
          }}
        </Draggable>
      </>
    )
  },
})
