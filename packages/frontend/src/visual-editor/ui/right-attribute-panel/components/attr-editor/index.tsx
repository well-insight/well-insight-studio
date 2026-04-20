import { Warning } from '@element-plus/icons-vue'
import {
  ElDivider,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElInputNumber,
  ElPopover,
  ElRadioButton,
  ElRadioGroup
} from 'element-plus'
import { computed, defineComponent, watch } from 'vue'
import { FormatInputNumber } from '@/visual-editor/ui/common/format-input-number'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { AttrEditorCard } from './components/attr-editor-card'
import { PropConfig } from './components/prop-config'

export const AttrEditor = defineComponent({
  setup() {
    const { visualConfig, currentBlock } = useVisualData()

    const compPaddingAttrs = ['paddingTop', 'paddingLeft', 'paddingRight', 'paddingBottom']

    /**
     * @description 监听组件padding值的变化
     */
    watch(
      compPaddingAttrs.map(item => () => currentBlock.value.styles?.[item]),
      (val: string[]) => {
        const isSame = val.every(item => currentBlock.value.styles?.tempPadding == item)
        if (isSame || new Set(val).size === 1) {
          if (Reflect.has(currentBlock.value, 'styles')) {
            currentBlock.value.styles.tempPadding = val[0]
          }
        } else {
          currentBlock.value.styles.tempPadding = ''
        }
      }
    )

    /**
     * @description 总的组件padding变化时进行的操作
     */
    const compPadding = computed({
      get: () => currentBlock.value.styles?.tempPadding,
      set(val) {
        compPaddingAttrs.forEach(item => (currentBlock.value.styles[item] = val))
        currentBlock.value.styles.tempPadding = val
      }
    })

    // 表单项
    const FormEditor = () => {
      const content: JSX.Element[] = []
      if (currentBlock.value) {
        const { componentKey } = currentBlock.value
        const component = visualConfig.componentMap[componentKey]
        console.log('props.block:', currentBlock.value)
        content.push(
          <>
            <ElFormItem label='组件标识' labelWidth='70px'>
              <ElPopover
                width={200}
                trigger='hover'
                effect='dark'
                content={`你可以利用该组件ID。对该组件进行获取和设置其属性，组件可用属性可在控制台输入：$$refs.${currentBlock.value._vid} 进行查看`}
              >
                {{
                  reference: () => <ElInput disabled v-model={currentBlock.value._vid}></ElInput>
                }}
              </ElPopover>
            </ElFormItem>
          </>
        )
        if (component) {
          if (component.props) {
            //
            if (currentBlock.value?.showStyleConfig) {
              content.push(
                <>
                  <AttrEditorCard header='基础配置' class='mb-3'>
                    <el-space class='w-full'>
                      <ElFormItem label='宽度' labelWidth='40px'>
                        <ElInput type='number' v-model={currentBlock.value.width} class='w-full'>
                          {{
                            suffix: () => <span>px</span>
                          }}
                        </ElInput>
                      </ElFormItem>
                      <ElFormItem label='高度' labelWidth='40px'>
                        <ElInput v-model={currentBlock.value.height} type='number' class='w-full'>
                          {{
                            suffix: () => <span>px</span>
                          }}
                        </ElInput>
                      </ElFormItem>
                    </el-space>
                    <el-space class='w-full'>
                      <ElFormItem label='X' labelWidth='40px' labelPosition='right'>
                        <ElInput type='number' v-model={currentBlock.value.x}>
                          {{
                            suffix: () => <span>px</span>
                          }}
                        </ElInput>
                      </ElFormItem>
                      <ElFormItem label='Y' labelWidth='40px' labelPosition='right'>
                        <ElInput type='number' v-model={currentBlock.value.y}>
                          {{
                            suffix: () => <span>px</span>
                          }}
                        </ElInput>
                      </ElFormItem>
                    </el-space>
                  </AttrEditorCard>
                </>
              )
            }

            content.push(
              <>
                <AttrEditorCard header='组件配置' class='mb-3'>
                  <PropConfig component={component} block={currentBlock.value} />
                </AttrEditorCard>
              </>
            )

            if (currentBlock.value?.showStyleConfig) {
              content.push(
                <>
                  <AttrEditorCard header='样式配置'>
                    <ElFormItem label='水平对齐方式' labelWidth='auto'>
                      <ElRadioGroup v-model={currentBlock.value.styles.justifyContent}>
                        <ElRadioButton label='flex-start'>左对齐</ElRadioButton>
                        <ElRadioButton label='center'>居中</ElRadioButton>
                        <ElRadioButton label='flex-end'>右对齐</ElRadioButton>
                      </ElRadioGroup>
                    </ElFormItem>
                    <ElFormItem label='垂直对齐方式' labelWidth='auto'>
                      <ElRadioGroup v-model={currentBlock.value.styles.alignItems}>
                        <ElRadioButton label='flex-start'>上对齐</ElRadioButton>
                        <ElRadioButton label='center'>居中</ElRadioButton>
                        <ElRadioButton label='flex-end'>下对齐</ElRadioButton>
                      </ElRadioGroup>
                    </ElFormItem>
                    <ElFormItem label='组件内边距'>
                      <FormatInputNumber v-model={compPadding.value} />
                    </ElFormItem>
                    <ElFormItem>
                      <div class='w-full'>
                        <div class='grid grid-cols-3 gap-2 w-full bg-gray-100 p-20px items-center'>
                          <FormatInputNumber
                            v-model={currentBlock.value.styles.paddingTop}
                            class='!w-100px col-span-full col-start-2'
                          />
                          <FormatInputNumber
                            v-model={currentBlock.value.styles.paddingLeft}
                            class='!w-100px col-span-1'
                          />
                          <div class='bg-white col-span-1 h-40px'></div>
                          <FormatInputNumber
                            v-model={currentBlock.value.styles.paddingRight}
                            class='!w-100px col-span-1'
                          />
                          <FormatInputNumber
                            v-model={currentBlock.value.styles.paddingBottom}
                            class='!w-100px col-span-full col-start-2'
                          />
                        </div>
                      </div>
                    </ElFormItem>
                  </AttrEditorCard>
                </>
              )
            }
          }
        }
      }
      return (
        <>
          <ElForm labelPosition='left'>{content}</ElForm>
        </>
      )
    }

    return () => (
      <>
        <FormEditor />
      </>
    )
  }
})
