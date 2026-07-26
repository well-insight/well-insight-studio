import type { Component, PropType } from 'vue'
import type { VisualEditorProps } from '@/visual-editor/visual-editor.props'
import type {
  VisualEditorBlockData,
  VisualEditorComponent,
} from '@/visual-editor/visual-editor.utils'
import { Warning } from '@element-plus/icons-vue'
import {
  ElCascader,
  ElColorPicker,
  ElFormItem,
  ElIcon,
  ElInput,
  ElOption,
  ElSelect,
  ElSpace,
  ElSwitch,
  ElTooltip,
} from 'element-plus'
import { cloneDeep } from 'lodash-es'
import { computed, defineComponent } from 'vue'
import { isChartBindProp } from '@/utils/datasetBinding'
import { useDotProp } from '@/visual-editor/hooks/useDotProp'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import PropDatasetBindTrigger from '@/visual-editor/ui/shared/dataset-bind/PropDatasetBindTrigger.vue'
import { VisualEditorPropsType } from '@/visual-editor/visual-editor.props'
import { ImageUploadEditor, OptionsEditorDialog, TablePropEditor } from '..'

export const PropConfig = defineComponent({
  props: {
    component: {
      type: Object as PropType<VisualEditorComponent>,
      default: () => ({}),
    },
    block: {
      type: Object as PropType<VisualEditorBlockData>,
      default: () => ({}),
    },
  },
  setup(props) {
    const { jsonData } = useVisualData()
    /**
     * @description 模型集合
     */
    const models = computed(() => cloneDeep(jsonData.value.models))

    const renderPropItem = (
      propName: string,
      propConfig: VisualEditorProps,
    ) => {
      const { propObj, prop } = useDotProp(props.block.props, propName)

      propObj[prop] ??= propConfig.defaultValue

      const renderFunc: Record<
        VisualEditorPropsType,
        () => JSX.Element | Component
      > = {
        [VisualEditorPropsType.input]: () => {
          if (
            !Object.is(propObj[prop], undefined)
            && !Object.is(propObj[prop], null)
          ) {
            propObj[prop] = `${propObj[prop]}`
          }
          return (
            <ElInput
              v-model={propObj[prop]}
              placeholder={propConfig.tips || propConfig.label}
            />
          )
        },
        [VisualEditorPropsType.inputNumber]: () => {
          const parseRes = Number.parseFloat(propObj[prop])
          propObj[prop] = Number.isNaN(parseRes) ? 0 : parseRes
          return (
            <ElInput
              v-model={propObj[prop]}
              type="number"
              min={propConfig.min}
              max={propConfig.max}
              class="w-full"
            >
              {{
                suffix: () => <span>px</span>,
              }}
            </ElInput>
          )
        },
        [VisualEditorPropsType.switch]: () => (
          <ElSwitch v-model={propObj[prop]} />
        ),
        [VisualEditorPropsType.color]: () => (
          <ElColorPicker v-model={propObj[prop]} />
        ),
        [VisualEditorPropsType.crossSortable]: () => (
          <OptionsEditorDialog
            v-model={propObj[prop]}
            multiple={propConfig.multiple}
            showItemPropsConfig={propConfig.showItemPropsConfig}
            label={propConfig.label}
          />
        ),
        [VisualEditorPropsType.select]: () => (
          <ElSelect
            v-model={propObj[prop]}
            valueKey="value"
            multiple={propConfig.multiple}
          >
            {propConfig.options?.map(opt => (
              <ElOption
                label={opt.label}
                style={{ fontFamily: opt.value }}
                value={opt.value}
              />
            ))}
          </ElSelect>
        ),
        [VisualEditorPropsType.table]: () => (
          <TablePropEditor v-model={propObj[prop]} propConfig={propConfig} />
        ),
        [VisualEditorPropsType.modelBind]: () => (
          <ElCascader
            clearable={true}
            class="w-full"
            props={{
              checkStrictly: true,
              children: 'entitys',
              label: 'name',
              value: 'key',
              expandTrigger: 'hover',
            }}
            placeholder="请选择绑定的请求数据"
            v-model={propObj[prop]}
            options={[...models.value]}
          >
          </ElCascader>
        ),
        [VisualEditorPropsType.imageUpload]: () => {
          return (
            <>
              <ImageUploadEditor
                v-model={propObj[prop]}
                propConfig={propConfig}
              >
              </ImageUploadEditor>
            </>
          )
        },
      }

      return renderFunc[propConfig.type]?.()
    }

    return () => {
      const componentKey = props.block.componentKey
      const propEntries = Object.entries(props.component.props ?? {}).filter(
        ([propName]) => !isChartBindProp(propName, componentKey),
      )

      return propEntries.map(([propName, propConfig]) => {
        return (
          <>
            <ElFormItem
              key={props.block._vid + propName}
              style={
                propConfig.labelPosition === 'top'
                  ? {
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }
                  : {}
              }
            >
              {{
                label: () => (
                  <>
                    <div class="flex w-full items-center justify-between gap-8px">
                      <ElSpace>
                        {propConfig.label}
                        {propConfig.tips && (
                          <ElTooltip
                            placement="left-start"
                            popper-class="max-w-200px"
                            content={propConfig.tips}
                          >
                            <div>
                              <ElIcon>
                                <Warning />
                              </ElIcon>
                            </div>
                          </ElTooltip>
                        )}
                      </ElSpace>
                      {/* {isOptions && (
                        <PropDatasetBindTrigger
                          block={props.block}
                          propName={propName}
                          propLabel={propConfig.label}
                          propConfig={propConfig}
                        />
                      )} */}
                    </div>
                  </>
                ),
                default: () => (
                  <div class="flex w-full items-center gap-8px">
                    <div class="min-w-0 flex-1 flex items-center justify-end">
                      {renderPropItem(propName, propConfig)}
                    </div>
                    <PropDatasetBindTrigger
                      block={props.block}
                      propName={propName}
                      propLabel={propConfig.label}
                      propConfig={propConfig}
                    />
                  </div>
                ),
              }}
            </ElFormItem>
          </>
        )
      })
    }
  },
})
