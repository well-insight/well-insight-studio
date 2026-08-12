import {
  ElForm,
  ElFormItem,
  ElInput,
  ElPopover,
  ElRadioButton,
  ElRadioGroup,
  ElRadio,
} from "element-plus";
import { computed, defineComponent, watch } from "vue";
import { isChartComponent } from "@/utils/datasetBinding";
import { useVisualData } from "@/visual-editor/hooks/useVisualData";
import ChartDatasetBindPanel from "@/visual-editor/ui/shared/dataset-bind/ChartDatasetBindPanel.vue";
import { AttrEditorCard } from "./components/attr-editor-card";
import styles from "./components/attr-editor-card/styles.module.scss";
import { PropConfig } from "./components/prop-config";

export const AttrEditor = defineComponent({
  setup() {
    const { visualConfig, currentBlock } = useVisualData();

    const compPaddingAttrs = [
      "paddingTop",
      "paddingLeft",
      "paddingRight",
      "paddingBottom",
    ] as const;

    /**
     * @description 监听组件padding值的变化
     */
    watch(
      compPaddingAttrs.map((item) => () => currentBlock.value.styles?.[item]),
      (val: string[]) => {
        const isSame = val.every(
          (item) => currentBlock.value.styles?.tempPadding === item,
        );
        if (isSame || new Set(val).size === 1) {
          if (Reflect.has(currentBlock.value, "styles")) {
            currentBlock.value.styles.tempPadding = val[0];
          }
        } else {
          currentBlock.value.styles.tempPadding = "";
        }
      },
    );

    /**
     * @description 总的组件padding变化时进行的操作
     */
    const compPadding = computed({
      get: () => currentBlock.value.styles?.tempPadding,
      set(val) {
        compPaddingAttrs.forEach(
          (item) => (currentBlock.value.styles[item] = val),
        );
        currentBlock.value.styles.tempPadding = val;
      },
    });

    // 表单项
    const FormEditor = () => {
      const content: JSX.Element[] = [];
      if (currentBlock.value) {
        const { componentKey } = currentBlock.value;
        const component = visualConfig.componentMap[componentKey];
        content.push(
          <>
            <ElFormItem label="组件标识" labelWidth="70px">
              <ElInput disabled v-model={currentBlock.value._vid}></ElInput>
            </ElFormItem>
          </>,
        );
        if (component) {
          if (component.props) {
            //
            if (currentBlock.value?.showStyleConfig) {
              content.push(
                <>
                  <AttrEditorCard header="基础配置" class="mb-3">
                    <ElFormItem label="" class={styles.paddingUniformItem}>
                      <div class={styles.paddingUniformGrid}>
                        <ElFormItem
                          label="宽度"
                          labelWidth="40px"
                          labelPosition="right"
                        >
                          <ElInput
                            type="number"
                            v-model={currentBlock.value.width}
                            class="w-full"
                          >
                            {{
                              suffix: () => <span>px</span>,
                            }}
                          </ElInput>
                        </ElFormItem>
                        <ElFormItem
                          label="高度"
                          labelWidth="40px"
                          labelPosition="right"
                        >
                          <ElInput
                            v-model={currentBlock.value.height}
                            type="number"
                            class="w-full"
                          >
                            {{
                              suffix: () => <span>px</span>,
                            }}
                          </ElInput>
                        </ElFormItem>
                      </div>
                    </ElFormItem>

                    <ElFormItem label="" class={styles.paddingUniformItem}>
                      <div class={styles.paddingUniformGrid}>
                        <ElFormItem
                          label="X"
                          labelWidth="40px"
                          labelPosition="right"
                        >
                          <ElInput
                            type="number"
                            v-model={currentBlock.value.x}
                            class="w-full"
                          >
                            {{
                              suffix: () => <span>px</span>,
                            }}
                          </ElInput>
                        </ElFormItem>
                        <ElFormItem
                          label="Y"
                          labelWidth="40px"
                          labelPosition="right"
                        >
                          <ElInput
                            type="number"
                            v-model={currentBlock.value.y}
                            class="w-full"
                          >
                            {{
                              suffix: () => <span>px</span>,
                            }}
                          </ElInput>
                        </ElFormItem>
                      </div>
                    </ElFormItem>

                    {/* 样式配置合并到基础配置中 */}
                    <ElFormItem label="水平对齐" labelWidth="auto">
                      <div class="w-full flex items-center justify-end">
                        <ElRadioGroup
                          v-model={currentBlock.value.styles.justifyContent}
                        >
                          <ElRadio value="flex-start">左</ElRadio>
                          <ElRadio value="center">中</ElRadio>
                          <ElRadio value="flex-end">右</ElRadio>
                        </ElRadioGroup>
                      </div>
                    </ElFormItem>
                    <ElFormItem label="垂直对齐" labelWidth="auto">
                      <div class="w-full flex items-center justify-end">
                        <ElRadioGroup
                          v-model={currentBlock.value.styles.alignItems}
                        >
                          <ElRadio value="flex-start">上</ElRadio>
                          <ElRadio value="center">中</ElRadio>
                          <ElRadio value="flex-end">下</ElRadio>
                        </ElRadioGroup>
                      </div>
                    </ElFormItem>
                    <ElFormItem
                      label="统一内边距"
                      class={styles.paddingUniformItem}
                    >
                      <div class="flex w-full items-center gap-2">
                        <ElInput
                          v-model={compPadding.value}
                          type="number"
                          class={styles.paddingUniformInput}
                        >
                          {{
                            suffix: () => <span>px</span>,
                          }}
                        </ElInput>
                      </div>
                    </ElFormItem>
                    <ElFormItem label="" class={styles.paddingSidesItem}>
                      <div class={styles.paddingEditor}>
                        <div
                          class={`${styles.paddingEditorField} ${styles.paddingEditorFieldTop}`}
                        >
                          <span class={styles.paddingEditorLabel}>上</span>
                          <ElInput
                            v-model={currentBlock.value.styles.paddingTop}
                            type="number"
                            class={styles.paddingEditorInput}
                          >
                            {{
                              suffix: () => <span>px</span>,
                            }}
                          </ElInput>
                        </div>
                        <div
                          class={`${styles.paddingEditorField} ${styles.paddingEditorFieldLeft}`}
                        >
                          <span class={styles.paddingEditorLabel}>左</span>
                          <ElInput
                            v-model={currentBlock.value.styles.paddingLeft}
                            type="number"
                            class={styles.paddingEditorInput}
                          >
                            {{
                              suffix: () => <span>px</span>,
                            }}
                          </ElInput>
                        </div>
                        <div class={styles.paddingEditorCenter}>内容</div>
                        <div
                          class={`${styles.paddingEditorField} ${styles.paddingEditorFieldRight}`}
                        >
                          <ElInput
                            v-model={currentBlock.value.styles.paddingRight}
                            type="number"
                            class={styles.paddingEditorInput}
                          >
                            {{
                              suffix: () => <span>px</span>,
                            }}
                          </ElInput>
                          <span class={styles.paddingEditorLabel}>右</span>
                        </div>
                        <div
                          class={`${styles.paddingEditorField} ${styles.paddingEditorFieldBottom}`}
                        >
                          <span class={styles.paddingEditorLabel}>下</span>
                          <ElInput
                            v-model={currentBlock.value.styles.paddingBottom}
                            type="number"
                            class={styles.paddingEditorInput}
                          >
                            {{
                              suffix: () => <span>px</span>,
                            }}
                          </ElInput>
                        </div>
                      </div>
                    </ElFormItem>
                  </AttrEditorCard>
                </>,
              );
            }

            content.push(
              <>
                {isChartComponent(componentKey) && (
                  <AttrEditorCard header="数据配置" class="mb-3">
                    <ChartDatasetBindPanel block={currentBlock.value} />
                  </AttrEditorCard>
                )}
                <AttrEditorCard header="组件配置" class="mb-3">
                  <PropConfig
                    component={component}
                    block={currentBlock.value}
                    exclude-dataset
                  />
                </AttrEditorCard>
              </>,
            );
          }
        }
      }
      return (
        <>
          <ElForm labelPosition="left">{content}</ElForm>
        </>
      );
    };

    return () => (
      <>
        <FormEditor />
      </>
    );
  },
});
