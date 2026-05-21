import { useDotProp } from "@/visual-editor/hooks/useDotProp";
import { useVisualData } from "@/visual-editor/hooks/useVisualData";
import type { VisualEditorProps } from "@/visual-editor/visual-editor.props";
import { VisualEditorPropsType } from "@/visual-editor/visual-editor.props";
import type {
  VisualEditorBlockData,
  VisualEditorComponent,
} from "@/visual-editor/visual-editor.utils";
import { Warning } from "@element-plus/icons-vue";
import {
  ElCascader,
  ElColorPicker,
  ElDropdownItem,
  ElIcon,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTooltip,
} from "element-plus";
import { cloneDeep } from "lodash-es";
import type { Component, PropType } from "vue";
import { computed, defineComponent } from "vue";
import { CrossSortableOptionsEditor, ImageUploadEditor, TablePropEditor } from "..";

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
    commonOnly: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const { jsonData } = useVisualData();
    const uiSize = "default";
    /**
     * @description 模型集合
     */
    const models = computed(() => cloneDeep(jsonData.value.models));

    const renderPropItem = (propName: string, propConfig: VisualEditorProps) => {
      const { propObj, prop } = useDotProp(props.block.props, propName);

      propObj[prop] ??= propConfig.defaultValue;

      const renderFunc: Record<VisualEditorPropsType, () => JSX.Element | Component> = {
        [VisualEditorPropsType.input]: () => {
          if (!Object.is(propObj[prop], undefined) && !Object.is(propObj[prop], null)) {
            propObj[prop] = `${propObj[prop]}`;
          }
          return (
            <ElInput
              size={uiSize}
              v-model={propObj[prop]}
              placeholder={propConfig.tips || propConfig.label}
            />
          );
        },
        [VisualEditorPropsType.inputNumber]: () => {
          const parseRes = Number.parseFloat(propObj[prop]);
          propObj[prop] = Number.isNaN(parseRes) ? 0 : parseRes;
          return <ElInputNumber size={uiSize} v-model={propObj[prop]} />;
        },
        [VisualEditorPropsType.switch]: () => <ElSwitch size={uiSize} v-model={propObj[prop]} />,
        [VisualEditorPropsType.color]: () => (
          <ElColorPicker size={uiSize} v-model={propObj[prop]} />
        ),
        [VisualEditorPropsType.crossSortable]: () => (
          <CrossSortableOptionsEditor
            v-model={propObj[prop]}
            multiple={propConfig.multiple}
            showItemPropsConfig={propConfig.showItemPropsConfig}
          />
        ),
        [VisualEditorPropsType.select]: () => (
          <ElSelect
            size={uiSize}
            v-model={propObj[prop]}
            valueKey="value"
            multiple={propConfig.multiple}
          >
            {propConfig.options?.map((opt) => (
              <ElOption label={opt.label} style={{ fontFamily: opt.value }} value={opt.value} />
            ))}
          </ElSelect>
        ),
        [VisualEditorPropsType.table]: () => (
          <TablePropEditor v-model={propObj[prop]} propConfig={propConfig} />
        ),
        [VisualEditorPropsType.modelBind]: () => (
          <ElCascader
            size={uiSize}
            clearable={true}
            class="w-full"
            props={{
              checkStrictly: true,
              children: "entitys",
              label: "name",
              value: "key",
              expandTrigger: "hover",
            }}
            placeholder="请选择绑定的请求数据"
            v-model={propObj[prop]}
            options={[...models.value]}
          ></ElCascader>
        ),
        [VisualEditorPropsType.imageUpload]: () => {
          return (
            <>
              <ImageUploadEditor
                v-model={propObj[prop]}
                propConfig={propConfig}
              ></ImageUploadEditor>
            </>
          );
        },
      };

      return renderFunc[propConfig.type]?.();
    };

    const commonTypes = new Set<VisualEditorPropsType>([
      VisualEditorPropsType.input,
      VisualEditorPropsType.inputNumber,
      VisualEditorPropsType.switch,
      VisualEditorPropsType.select,
      VisualEditorPropsType.color,
      VisualEditorPropsType.imageUpload,
    ]);

    return () => {
      const propEntries = Object.entries(props.component.props ?? {}).filter(([, propConfig]) => {
        if (!props.commonOnly) {
          return true;
        }
        return commonTypes.has(propConfig.type);
      });

      return propEntries.map(([propName, propConfig]) => (
        <>
          <ElDropdownItem key={propName} class="items-start!">
            <div class="toolbar-item-row">
              <span class="toolbar-item-title inline-flex items-center gap-1">
                <span>{propConfig.label}</span>
                {propConfig.tips && (
                  <ElTooltip
                    placement="left-start"
                    popper-class="max-w-200px"
                    content={propConfig.tips}
                  >
                    <div class="inline-flex">
                      <ElIcon>
                        <Warning />
                      </ElIcon>
                    </div>
                  </ElTooltip>
                )}
              </span>
              <div key={props.block._vid + propName} class="toolbar-item-content">
                {renderPropItem(propName, propConfig)}
              </div>
            </div>
          </ElDropdownItem>
        </>
      ));
    };
  },
});
