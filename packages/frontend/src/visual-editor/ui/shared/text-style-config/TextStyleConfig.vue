<script lang="ts" setup>
import type { TextStyleConfig } from "@/visual-editor/core/visual-editor.utils";
import { useVModel } from "@vueuse/core";

export type TextStyleConfigLayout = "dropdown" | "form";

const props = withDefaults(
  defineProps<{
    modelValue: TextStyleConfig;
    /** dropdown: 用于工具栏下拉项；form: 用于表单面板 */
    layout?: TextStyleConfigLayout;
    size?: "small" | "default";
    /** 下拉内 select 是否 teleport */
    teleported?: boolean;
    showPosition?: boolean;
    showBackground?: boolean;
    showBorderRadius?: boolean;
    showPadding?: boolean;
    /** 表单项 label 宽度 */
    labelWidth?: string | number;
  }>(),
  {
    layout: "dropdown",
    size: "default",
    teleported: false,
    showPosition: false,
    showBackground: true,
    showBorderRadius: true,
    showPadding: false,
    labelWidth: "auto",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: TextStyleConfig];
}>();

const style = useVModel(props, "modelValue", emit);

const fontWeightOptions = [
  { label: "常规", value: 400 },
  { label: "中等", value: 500 },
  { label: "加粗", value: 600 },
  { label: "特粗", value: 700 },
];

const positionOptions = [
  { label: "卡片内顶部", value: "inner" },
  { label: "外侧-左", value: "outer-left" },
  { label: "外侧-上", value: "outer-top" },
  { label: "外侧-右", value: "outer-right" },
];
</script>

<template>
  <!-- 工具栏下拉：多根节点，可直接置于 el-dropdown-menu 内 -->
  <template v-if="layout === 'dropdown'">
    <el-dropdown-item v-if="showPosition">
      <div class="text-style-config__row">
        <span class="text-style-config__label">标题展示</span>
        <div class="text-style-config__control">
          <el-select v-model="style.position" :size="size" :teleported="teleported">
            <el-option
              v-for="opt in positionOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
      </div>
    </el-dropdown-item>

    <el-dropdown-item>
      <div class="text-style-config__row">
        <span class="text-style-config__label">字号</span>
        <div class="text-style-config__control">
          <el-input v-model="style.fontSize" :size="size" placeholder="如 12px" />
        </div>
      </div>
    </el-dropdown-item>

    <el-dropdown-item>
      <div class="text-style-config__row">
        <span class="text-style-config__label">字重</span>
        <div class="text-style-config__control">
          <el-select v-model="style.fontWeight" :size="size" :teleported="teleported">
            <el-option
              v-for="opt in fontWeightOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
      </div>
    </el-dropdown-item>

    <el-dropdown-item>
      <div class="text-style-config__row">
        <span class="text-style-config__label">文字颜色</span>
        <div class="text-style-config__control">
          <el-color-picker v-model="style.color" :size="size" />
        </div>
      </div>
    </el-dropdown-item>

    <el-dropdown-item v-if="showBackground">
      <div class="text-style-config__row">
        <span class="text-style-config__label">文字背景</span>
        <div class="text-style-config__control">
          <el-color-picker v-model="style.backgroundColor" :size="size" />
        </div>
      </div>
    </el-dropdown-item>

    <el-dropdown-item v-if="showBorderRadius">
      <div class="text-style-config__row">
        <span class="text-style-config__label">圆角</span>
        <div class="text-style-config__control">
          <el-input v-model="style.borderRadius" :size="size" placeholder="如 3px" />
        </div>
      </div>
    </el-dropdown-item>

    <el-dropdown-item v-if="showPadding">
      <div class="text-style-config__row">
        <span class="text-style-config__label">内边距</span>
        <div class="text-style-config__control">
          <el-input v-model="style.padding" :size="size" placeholder="如 3px 5px" />
        </div>
      </div>
    </el-dropdown-item>
  </template>

  <!-- 表单面板 -->
  <template v-else>
    <el-form-item v-if="showPosition" label="标题位置" :label-width="labelWidth">
      <el-select v-model="style.position" :size="size" class="w-full">
        <el-option
          v-for="opt in positionOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="字号" :label-width="labelWidth">
      <el-input v-model="style.fontSize" :size="size" placeholder="如 12px" />
    </el-form-item>
    <el-form-item label="字重" :label-width="labelWidth">
      <el-select v-model="style.fontWeight" :size="size" class="w-full">
        <el-option
          v-for="opt in fontWeightOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="文字颜色" :label-width="labelWidth">
      <el-color-picker v-model="style.color" :size="size" />
    </el-form-item>
    <el-form-item v-if="showBackground" label="文字背景" :label-width="labelWidth">
      <el-color-picker v-model="style.backgroundColor" :size="size" />
    </el-form-item>
    <el-form-item v-if="showBorderRadius" label="圆角" :label-width="labelWidth">
      <el-input v-model="style.borderRadius" :size="size" placeholder="如 3px" />
    </el-form-item>
    <el-form-item v-if="showPadding" label="内边距" :label-width="labelWidth">
      <el-input v-model="style.padding" :size="size" placeholder="如 3px 5px" />
    </el-form-item>
  </template>
</template>

<style lang="scss" scoped>
.text-style-config__row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.text-style-config__label {
  color: var(--el-text-color);
  line-height: 1.2;
  flex-shrink: 0;
  min-width: 64px;
}

.text-style-config__control {
  flex: 1;
  width: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-left: 12px;

  :deep(.el-input),
  :deep(.el-input-number),
  :deep(.el-select),
  :deep(.el-color-picker) {
    width: 100%;
  }
}
</style>
