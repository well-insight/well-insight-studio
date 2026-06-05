<script lang="ts" setup>
import type {
  ComponentBorderOverride,
  ComponentBorderStyle,
} from "@/visual-editor/core/visual-editor.utils";
import { defaultComponentBorder } from "@/utils/blockBorder";
import { BoxShadowPickerField } from "@/components/box-shadow-picker";
import { useVModel } from "@vueuse/core";
import { computed } from "vue";

export type BorderStyleConfigLayout = "dropdown" | "form";

const props = withDefaults(
  defineProps<{
    modelValue: ComponentBorderStyle | ComponentBorderOverride;
    layout?: BorderStyleConfigLayout;
    size?: "small" | "default";
    teleported?: boolean;
    /** 组件级配置：显示「沿用页面」选项 */
    inheritable?: boolean;
  }>(),
  {
    layout: "dropdown",
    size: "default",
    teleported: false,
    inheritable: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: ComponentBorderStyle | ComponentBorderOverride];
}>();

const border = useVModel(props, "modelValue", emit);

const shadowEmptyLabel = computed(() => (props.inheritable ? "沿用页面" : ""));

const borderStyleOptions = [
  { label: "实线", value: "solid" },
  { label: "虚线", value: "dashed" },
  { label: "点线", value: "dotted" },
  { label: "无", value: "none" },
];

const showMode = computed({
  get: () => {
    if (!props.inheritable) {
      return border.value.show ? "show" : "hide";
    }
    if (border.value.show === null || border.value.show === undefined) {
      return "inherit";
    }
    return border.value.show ? "show" : "hide";
  },
  set(val: "inherit" | "show" | "hide") {
    if (!props.inheritable) {
      border.value.show = val === "show";
      return;
    }
    if (val === "inherit") {
      border.value.show = null;
      return;
    }
    border.value.show = val === "show";
  },
});

function ensureDefaults() {
  const d = defaultComponentBorder();
  if (!border.value.width) border.value.width = d.width;
  if (!border.value.style) border.value.style = d.style;
  if (!border.value.color) border.value.color = d.color;
  if (!border.value.radius) border.value.radius = d.radius;
  if (!border.value.shadow) border.value.shadow = d.shadow;
}

if (!props.inheritable) {
  ensureDefaults();
}
</script>

<template>
  <template v-if="layout === 'dropdown'">
    <el-dropdown-item>
      <div class="border-style-config__row">
        <span class="border-style-config__label">显示边框</span>
        <div class="border-style-config__control">
          <el-radio-group v-if="inheritable" v-model="showMode" :size="size">
            <el-radio-button value="inherit">沿用页面</el-radio-button>
            <el-radio-button value="show">显示</el-radio-button>
            <el-radio-button value="hide">隐藏</el-radio-button>
          </el-radio-group>
          <el-switch v-else v-model="border.show" />
        </div>
      </div>
    </el-dropdown-item>
    <el-dropdown-item>
      <div class="border-style-config__row">
        <span class="border-style-config__label">边框宽度</span>
        <div class="border-style-config__control">
          <el-input
            v-model="border.width"
            :size="size"
            :placeholder="inheritable ? '沿用页面' : '如 1px'"
          />
        </div>
      </div>
    </el-dropdown-item>
    <el-dropdown-item>
      <div class="border-style-config__row">
        <span class="border-style-config__label">边框样式</span>
        <div class="border-style-config__control">
          <el-select
            v-model="border.style"
            :size="size"
            :teleported="teleported"
            clearable
            :placeholder="inheritable ? '沿用页面' : '请选择'"
          >
            <el-option
              v-for="opt in borderStyleOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
      </div>
    </el-dropdown-item>
    <el-dropdown-item>
      <div class="border-style-config__row">
        <span class="border-style-config__label">边框颜色</span>
        <div class="border-style-config__control">
          <el-color-picker v-model="border.color" :size="size" show-alpha color-format="hex" />
        </div>
      </div>
    </el-dropdown-item>
    <el-dropdown-item>
      <div class="border-style-config__row">
        <span class="border-style-config__label">圆角</span>
        <div class="border-style-config__control">
          <el-input
            v-model="border.radius"
            :size="size"
            :placeholder="inheritable ? '沿用页面' : '如 6px'"
          />
        </div>
      </div>
    </el-dropdown-item>
    <el-dropdown-item @click.stop>
      <div class="border-style-config__row border-style-config__row--shadow">
        <span class="border-style-config__label">阴影</span>
        <div class="border-style-config__control">
          <BoxShadowPickerField
            v-model="border.shadow"
            :size="size"
            placeholder="点击配置阴影"
            :empty-label="shadowEmptyLabel"
          />
        </div>
      </div>
    </el-dropdown-item>
  </template>

  <el-form v-else label-position="left" :label-width="96">
    <el-form-item label="显示边框">
      <el-radio-group v-if="inheritable" v-model="showMode" :size="size">
        <el-radio-button value="inherit">沿用页面</el-radio-button>
        <el-radio-button value="show">显示</el-radio-button>
        <el-radio-button value="hide">隐藏</el-radio-button>
      </el-radio-group>
      <el-switch v-else v-model="border.show" />
    </el-form-item>
    <el-form-item label="边框宽度">
      <el-input
        v-model="border.width"
        :size="size"
        :placeholder="inheritable ? '沿用页面' : '如 1px'"
      />
    </el-form-item>
    <el-form-item label="边框样式">
      <el-select
        v-model="border.style"
        :size="size"
        :teleported="teleported"
        clearable
        :placeholder="inheritable ? '沿用页面' : '请选择'"
      >
        <el-option
          v-for="opt in borderStyleOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="边框颜色">
      <el-color-picker v-model="border.color" :size="size" show-alpha color-format="hex" />
    </el-form-item>
    <el-form-item label="圆角">
      <el-input
        v-model="border.radius"
        :size="size"
        :placeholder="inheritable ? '沿用页面' : '如 6px'"
      />
    </el-form-item>
    <el-form-item label="阴影">
      <BoxShadowPickerField
        v-model="border.shadow"
        :size="size"
        placeholder="点击配置阴影"
        :empty-label="shadowEmptyLabel"
      />
    </el-form-item>
  </el-form>
</template>

<style scoped>
.border-style-config__row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.border-style-config__row--shadow {
  align-items: flex-start;
}

.border-style-config__row--shadow .border-style-config__label {
  padding-top: 6px;
}

.border-style-config__label {
  color: var(--el-text-color);
  line-height: 1.2;
  flex-shrink: 0;
  min-width: 64px;
}

.border-style-config__control {
  flex: 1;
  width: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-left: 12px;
}

.border-style-config__control :deep(.el-input),
.border-style-config__control :deep(.el-select) {
  width: 100%;
}

.border-style-config__row--shadow .border-style-config__control {
  align-items: stretch;
}
</style>
