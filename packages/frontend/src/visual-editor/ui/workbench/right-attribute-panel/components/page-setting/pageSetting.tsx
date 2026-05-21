import { ElColorPicker, ElForm, ElFormItem, ElOption, ElSelect, ElSwitch } from "element-plus";
import { storeToRefs } from "pinia";
import { computed, defineComponent, reactive } from "vue";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useVisualData } from "@/visual-editor/hooks/useVisualData";
import DeviceSelect from "./DeviceSelect.vue";
import ImageUpload from "./ImageUpload.vue";

export const PageSetting = defineComponent({
  setup() {
    const { currentPage } = useVisualData();

    const pageConfig = computed(() => currentPage.value.config);

    const workspaceStore = useWorkspaceStore();
    const { currentApp } = storeToRefs(workspaceStore);

    const options = reactive({
      backgroundRepeat: [
        { value: "repeat", label: "repeat（双向重复）" },
        { value: "repeat-x", label: "repeat-x（水平重复）" },
        { value: "repeat-y", label: "repeat-y（垂直重复）" },
        { value: "no-repeat", label: "no-repeat（不重复）" },
        { value: "space", label: "space（均匀分布）" },
        { value: "round", label: "round（平铺缩放）" },
      ],
      backgroundSize: [
        { value: "100% 100%", label: "拉伸铺满" },
        { value: "cover", label: "等比例覆盖背景" },
        { value: "contain", label: "等比例完整显示" },
        { value: "auto", label: "保持图片原始尺寸" },
      ],
    });

    return () => (
      <>
        <ElForm size="default">
          <ElFormItem label="页面尺寸">
            <DeviceSelect
              client-type={currentApp.value?.clientType === 1 ? "pc" : "mobile"}
              v-model={pageConfig.value.pageSize}
            ></DeviceSelect>
          </ElFormItem>
          <ElFormItem label="背景颜色">
            <ElColorPicker
              model-value={pageConfig.value.bgColor || ""}
              size="default"
              teleported={false}
              show-alpha={true}
              color-format="rgb"
              predefine={["rgb(255, 255, 255)", "rgba(255, 255, 255, 0)"]}
              onUpdate:modelValue={(value) => {
                pageConfig.value.bgColor = typeof value === "string" ? value : "";
              }}
            />
          </ElFormItem>
          <ElFormItem label="背景图片">
            <ImageUpload v-model={pageConfig.value.bgImage}></ImageUpload>
          </ElFormItem>
          <ElFormItem label="背景重复">
            <ElSelect
              size="default"
              v-model={pageConfig.value.bgRepeat}
              clearable
              teleported={false}
            >
              {options.backgroundRepeat.map((item) => (
                <ElOption key={item.value} label={item.label} value={item.value} />
              ))}
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="背景大小">
            <ElSelect size="default" v-model={pageConfig.value.bgSize} clearable teleported={false}>
              {options.backgroundSize.map((item) => (
                <ElOption key={item.value} label={item.label} value={item.value} />
              ))}
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="路由切换时缓存本页面">
            <ElSwitch size="default" v-model={pageConfig.value.keepAlive} />
          </ElFormItem>
        </ElForm>
      </>
    );
  },
});
