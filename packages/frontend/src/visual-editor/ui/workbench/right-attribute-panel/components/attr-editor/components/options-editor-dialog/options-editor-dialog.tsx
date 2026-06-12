import type { PropType } from 'vue'
import { Edit, Plus } from '@element-plus/icons-vue'
import {
  ElButton,
  ElCollapse,
  ElCollapseItem,
  ElDialog,
  ElIcon,
  ElScrollbar,
} from 'element-plus'
import { cloneDeep } from 'lodash-es'
import { computed, defineComponent, ref } from 'vue'
import { CrossSortableOptionsEditor } from '../cross-sortable-options-editor/cross-sortable-options-editor'
import styles from './options-editor-dialog.module.scss'

export const OptionsEditorDialog = defineComponent({
  props: {
    modelValue: {
      type: Array as PropType<(string | Record<string, any>)[]>,
      default: () => [],
    },
    multiple: Boolean,
    showItemPropsConfig: Boolean,
    label: {
      type: String,
      default: '选项列表',
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const visible = ref(false)
    const localData = ref<(string | Record<string, any>)[]>([])

    const optionCount = computed(() => props.modelValue?.length ?? 0)

    const triggerText = computed(() => {
      if (optionCount.value === 0)
        return '未配置'
      return `${optionCount.value}个选项`
    })

    // 打开弹窗时克隆数据
    function openDialog() {
      localData.value = cloneDeep(props.modelValue ?? [])
      visible.value = true
    }

    // 确认：提交修改
    function handleConfirm() {
      emit('update:modelValue', cloneDeep(localData.value))
      visible.value = false
    }

    // 取消：丢弃修改
    function handleCancel() {
      localData.value = []
      visible.value = false
    }

    return () => (
      <>
        <ElButton size="small" plain onClick={openDialog}>
          <ElIcon class="mr-4px">
            <Edit />
          </ElIcon>
          {triggerText.value}
        </ElButton>

        <ElDialog
          v-model={visible.value}
          title={`编辑${props.label}`}
          width="720px"
          destroyOnClose={true}
          append-to-body
          closeOnClickModal={false}
        >
          {{
            default: () => (
              <div class={styles.dialogBody}>
                {/* 列头 */}
                <div class={styles.columnHeader}>
                  <span />
                  <span>显示文字</span>
                  <span>绑定值</span>
                  <span />
                </div>

                {/* 滚动区域 */}
                <div class={styles.scrollArea}>
                  <ElScrollbar>
                    <CrossSortableOptionsEditor
                      v-model={localData.value}
                      multiple={props.multiple}
                      showItemPropsConfig={false}
                      compact={true}
                    />
                  </ElScrollbar>
                </div>

                {/* 底部操作栏 */}
                <div class={styles.bottomBar}>
                  <ElButton
                    class={styles.addBtn}
                    size="small"
                    plain
                    onClick={() => {
                      const len = (localData.value?.length ?? 0) + 1
                      localData.value = [
                        ...(localData.value ?? []),
                        { label: `选项${len}`, value: String(len) },
                      ]
                    }}
                  >
                    <ElIcon class="mr-4px">
                      <Plus />
                    </ElIcon>
                    添加选项
                  </ElButton>
                </div>

                {/* 高级配置 */}
                {props.showItemPropsConfig && (
                  <div class={styles.advancedSection}>
                    <ElCollapse>
                      <ElCollapseItem title="高级：单项属性配置">
                        <div style="padding: 8px 0; color: var(--el-text-color-placeholder); font-size: 13px;">
                          暂不支持在弹窗中编辑单项属性
                        </div>
                      </ElCollapseItem>
                    </ElCollapse>
                  </div>
                )}
              </div>
            ),
            footer: () => (
              <div class={styles.dialogFooter}>
                <ElButton onClick={handleCancel}>取消</ElButton>
                <ElButton type="primary" onClick={handleConfirm}>
                  确认
                </ElButton>
              </div>
            ),
          }}
        </ElDialog>
      </>
    )
  },
})
