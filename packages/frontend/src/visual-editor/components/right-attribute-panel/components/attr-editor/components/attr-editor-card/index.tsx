import type { SlotsType } from 'vue'
import { Setting } from '@element-plus/icons-vue'
import { ElCard, ElIcon, ElSpace, ElText } from 'element-plus'
import { defineComponent } from 'vue'
import styles from './styles.module.scss'

interface Slots {
  default?: () => any
  header?: () => any
  footer?: () => any
}

export const AttrEditorCard = defineComponent({
  props: {
    header: {
      type: String,
      default: '标题'
    }
  },
  slots: Object as SlotsType<Slots>,
  setup(props, { slots }) {
    return () => (
      <ElCard class={styles.card} shadow='never'>
        {{
          header: () => (
            <>
              {slots.header?.() || (
                <ElSpace>
                  <ElIcon>
                    <Setting></Setting>
                  </ElIcon>
                  <ElText>{props?.header}</ElText>
                </ElSpace>
              )}
            </>
          ),
          default: () => <>{slots.default?.()}</>
        }}
      </ElCard>
    )
  }
})
