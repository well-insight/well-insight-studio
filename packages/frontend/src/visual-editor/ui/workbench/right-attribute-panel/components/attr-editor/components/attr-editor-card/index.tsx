import type { SlotsType } from 'vue'
import { Setting } from '@element-plus/icons-vue'
import { ElIcon, ElSpace, ElText } from 'element-plus'
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
      default: '标题',
    },
  },
  slots: Object as SlotsType<Slots>,
  setup(props, { slots }) {
    return () => (
      <div class={`page-setting-card ${styles.card}`}>
        <div class={styles.cardHeader}>
          {slots.header?.() || (
            <ElSpace size={8}>
              <span class={styles.headerIcon} aria-hidden="true">
                <ElIcon size={14}>
                  <Setting />
                </ElIcon>
              </span>
              <ElText class={styles.headerTitle}>{props.header}</ElText>
            </ElSpace>
          )}
        </div>
        <div class={styles.cardBody}>{slots.default?.()}</div>
      </div>
    )
  },
})
