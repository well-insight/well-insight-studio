import type { PropType } from 'vue'
import type { VisualEditorBlockData, VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { CirclePlus, Plus, Rank, Remove } from '@element-plus/icons-vue'
import { useVModel } from '@vueuse/core'
import {
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElCollapse,
  ElCollapseItem,
  ElForm,
  ElIcon,
  ElInput,
  ElTabPane,
  ElTabs,
} from 'element-plus'
import { cloneDeep } from 'lodash-es'
import { computed, defineComponent, reactive } from 'vue'
import Draggable from 'vuedraggable'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { isObject } from '@/visual-editor/lib/is'
import { PropConfig } from '../prop-config'
import styles from './cross-sortable-options-editor.module.scss'

interface OptionItem extends LabelValue {
  component?: VisualEditorComponent
  block?: VisualEditorBlockData
}

export const CrossSortableOptionsEditor = defineComponent({
  props: {
    modelValue: {
      type: Array as PropType<(string | OptionItem)[]>,
      default: () => [],
    },
    multiple: Boolean,
    showItemPropsConfig: Boolean,
    /** 紧凑模式：隐藏外层面板、表头、底部按钮、高级配置，仅展示可拖拽列表 */
    compact: Boolean,
  },
  setup(props, { emit }) {
    const { currentBlock } = useVisualData()

    const state = reactive({
      list: useVModel(props, 'modelValue', emit),
      drag: false,
    })

    const hasObjectItems = computed(() => state.list.some(item => isObject(item)))

    const checkList = computed({
      get: () => {
        const value = currentBlock.value.props.modelValue
        return Array.isArray(value) ? value : [...new Set(value?.split(','))]
      },
      set(value) {
        currentBlock.value.props.modelValue = value
      },
    })

    const dragOptions = computed(() => ({
      animation: 200,
      group: 'description',
      disabled: false,
      ghostClass: styles.ghost,
    }))

    const onChange = (val: string[]) => {
      let next = val.filter(item => item !== '')
      if (!props.multiple) {
        next = next.filter(n => !currentBlock.value.props.modelValue?.includes(n))
      }
      currentBlock.value.props.modelValue = next.join(',')
    }

    function createNewItem(length: number): OptionItem | string {
      if (hasObjectItems.value || state.list.length === 0) {
        const template = state.list.find(item => isObject(item)) as OptionItem | undefined
        return Object.assign(cloneDeep(template ?? { label: '', value: '' }), {
          label: `选项${length}`,
          value: String(length),
        })
      }
      return ''
    }

    function incrementOption(index: number) {
      const length = state.list.length + 1
      state.list.splice(index + 1, 0, createNewItem(length))
    }

    function appendOption() {
      const length = state.list.length + 1
      state.list.push(createNewItem(length))
    }

    return () => (
      <div class={[styles.panel, props.compact && styles.panelCompact]}>
        {hasObjectItems.value && !props.compact && (
          <div class={styles.header}>
            <span />
            <span class={styles.headerCol}>显示文字</span>
            <span class={styles.headerCol}>绑定值</span>
            <span />
          </div>
        )}

        <ElCheckboxGroup modelValue={checkList.value} onChange={onChange}>
          <Draggable
            tag="ul"
            list={state.list}
            class={styles.list}
            component-data={{
              tag: 'ul',
              type: 'transition-group',
              name: !state.drag ? 'flip-list' : null,
            }}
            handle={`.${styles.handle}`}
            {...dragOptions.value}
            itemKey=""
            onStart={() => (state.drag = true)}
            onEnd={() => (state.drag = false)}
          >
            {{
              item: ({ element, index }: { element: string | OptionItem, index: number }) =>
                isObject(element)
                  ? (
                      <li class={[styles.row, state.drag && styles.rowDragging]}>
                        <div class={styles.rowLead}>
                          <span class={styles.handle}>
                            <ElIcon size={14}>
                              <Rank />
                            </ElIcon>
                          </span>
                          <ElCheckbox label={element.value} />
                        </div>
                        <div class={styles.rowField}>
                          <ElInput
                            v-model={element.label}
                            size="small"
                            placeholder="显示文字"
                            clearable
                          />
                        </div>
                        <div class={styles.rowField}>
                          <ElInput
                            v-model={element.value}
                            size="small"
                            placeholder="绑定值"
                            clearable
                          />
                        </div>
                        <div class={styles.rowActions}>
                          <button
                            type="button"
                            class={[styles.actionBtn, styles.actionBtnAdd]}
                            title="在下方新增"
                            onClick={() => incrementOption(index)}
                          >
                            <ElIcon size={14}>
                              <CirclePlus />
                            </ElIcon>
                          </button>
                          <button
                            type="button"
                            class={[styles.actionBtn, styles.actionBtnRemove]}
                            title="删除"
                            onClick={() => state.list.splice(index, 1)}
                          >
                            <ElIcon size={14}>
                              <Remove />
                            </ElIcon>
                          </button>
                        </div>
                      </li>
                    )
                  : (
                      <li class={[styles.row, styles.rowText, state.drag && styles.rowDragging]}>
                        <span class={styles.handle}>
                          <ElIcon size={14}>
                            <Rank />
                          </ElIcon>
                        </span>
                        <div class={styles.rowField}>
                          <ElInput
                            v-model={state.list[index]}
                            size="small"
                            placeholder="请输入选项文字"
                            clearable
                          />
                        </div>
                        <div class={styles.rowActions}>
                          <button
                            type="button"
                            class={[styles.actionBtn, styles.actionBtnAdd]}
                            title="在下方新增"
                            onClick={() => incrementOption(index)}
                          >
                            <ElIcon size={14}>
                              <CirclePlus />
                            </ElIcon>
                          </button>
                          <button
                            type="button"
                            class={[styles.actionBtn, styles.actionBtnRemove]}
                            title="删除"
                            onClick={() => state.list.splice(index, 1)}
                          >
                            <ElIcon size={14}>
                              <Remove />
                            </ElIcon>
                          </button>
                        </div>
                      </li>
                    ),
            }}
          </Draggable>
        </ElCheckboxGroup>

        {!props.compact && (
          <div class={styles.footer}>
            <ElButton class={styles.addBtn} size="small" plain onClick={appendOption}>
              <ElIcon class="mr-4px">
                <Plus />
              </ElIcon>
              添加选项
            </ElButton>
          </div>
        )}

        {props.showItemPropsConfig && !props.compact && state.list.some(item => isObject(item)) && (
          <div class={styles.advanced}>
            <ElCollapse>
              <ElCollapseItem title="高级：单项属性配置">
                <ElTabs type="border-card">
                  {(state.list as OptionItem[]).map((item, idx) => (
                    <ElTabPane label={item.label || `选项${idx + 1}`} key={`${item.value}-${idx}`}>
                      <ElForm labelPosition="left" size="small">
                        <PropConfig component={item.component} block={item.block} />
                      </ElForm>
                    </ElTabPane>
                  ))}
                </ElTabs>
              </ElCollapseItem>
            </ElCollapse>
          </div>
        )}
      </div>
    )
  },
})
