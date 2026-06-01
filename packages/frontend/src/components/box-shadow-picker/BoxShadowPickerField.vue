<script lang="ts" setup>
import { DEFAULT_CARD_SHADOW } from "@/utils/blockBorder";
import { ArrowRight } from "@element-plus/icons-vue";
import { computed, ref, watch } from "vue";
import BoxShadowPicker from "./BoxShadowPicker.vue";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    size?: "small" | "default";
    placeholder?: string;
    /** 值为空时显示沿用/未设置提示 */
    emptyLabel?: string;
  }>(),
  {
    modelValue: "",
    size: "default",
    placeholder: "点击配置阴影",
    emptyLabel: "",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const dialogVisible = ref(false);
const draftShadow = ref("");

watch(dialogVisible, (open) => {
  if (open) {
    draftShadow.value = props.modelValue?.trim() || DEFAULT_CARD_SHADOW;
  }
});

const previewShadow = computed(() => {
  const v = props.modelValue?.trim();
  if (!v) return "none";
  return v;
});

const summaryText = computed(() => {
  const v = props.modelValue?.trim();
  if (!v) {
    return props.emptyLabel || props.placeholder;
  }
  if (v === "none") {
    return "无阴影";
  }
  return "已配置阴影";
});

const hasValue = computed(() => Boolean(props.modelValue?.trim()));

function openDialog() {
  dialogVisible.value = true;
}

function applyDraft() {
  emit("update:modelValue", draftShadow.value.trim() || DEFAULT_CARD_SHADOW);
  dialogVisible.value = false;
}

function setNoShadow() {
  draftShadow.value = "none";
  emit("update:modelValue", "none");
  dialogVisible.value = false;
}

function resetDefault() {
  draftShadow.value = DEFAULT_CARD_SHADOW;
  emit("update:modelValue", DEFAULT_CARD_SHADOW);
  dialogVisible.value = false;
}

function clearShadow() {
  emit("update:modelValue", "");
  dialogVisible.value = false;
}
</script>

<template>
  <div class="box-shadow-field" :class="`box-shadow-field--${size}`">
    <button type="button" class="box-shadow-field__trigger" @click="openDialog">
      <span
        class="box-shadow-field__swatch"
        :style="{ boxShadow: previewShadow === 'none' ? 'none' : previewShadow }"
      />
      <span class="box-shadow-field__text">
        <span class="box-shadow-field__summary">{{ summaryText }}</span>
        <span v-if="hasValue && modelValue !== 'none'" class="box-shadow-field__css">
          {{ modelValue }}
        </span>
      </span>
      <el-icon class="box-shadow-field__arrow"><ArrowRight /></el-icon>
    </button>

    <el-button
      v-if="hasValue && emptyLabel"
      class="box-shadow-field__inherit-btn"
      text
      type="primary"
      :size="size"
      @click="clearShadow"
    >
      沿用页面
    </el-button>

    <el-dialog
      v-model="dialogVisible"
      title="阴影设置"
      width="440px"
      append-to-body
      align-center
      destroy-on-close
      class="box-shadow-field-dialog"
      :z-index="4100"
    >
      <el-scrollbar class="box-shadow-field-dialog__scroll" max-height="560px">
        <BoxShadowPicker
          v-model="draftShadow"
          compact
          :show-preview="true"
          :show-code-output="false"
          preview-text="组件卡片"
          preview-bg="#ffffff"
        />
      </el-scrollbar>
      <template #footer>
        <div class="box-shadow-field__footer">
          <div class="box-shadow-field__footer-left">
            <el-button text type="danger" @click="setNoShadow">无阴影</el-button>
            <el-button text @click="resetDefault">恢复默认</el-button>
          </div>
          <div class="box-shadow-field__footer-right">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="applyDraft">确定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.box-shadow-field {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 4px;
}

.box-shadow-field__trigger {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 4px 4px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-blank);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  text-align: left;
}

.box-shadow-field__trigger:hover {
  border-color: var(--el-color-primary);
}

.box-shadow-field--small .box-shadow-field__trigger {
  padding: 2px 6px 2px 2px;
}

.box-shadow-field__swatch {
  flex-shrink: 0;
  width: 36px;
  height: 28px;
  border-radius: 4px;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
}

.box-shadow-field--small .box-shadow-field__swatch {
  width: 32px;
  height: 24px;
}

.box-shadow-field__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.box-shadow-field__summary {
  font-size: 13px;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.box-shadow-field__css {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.box-shadow-field__arrow {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}

.box-shadow-field__inherit-btn {
  flex-shrink: 0;
}

.box-shadow-field__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
}

.box-shadow-field__footer-left,
.box-shadow-field__footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>

<style>
.box-shadow-field-dialog .el-dialog__body {
  padding: 12px 16px 8px;
  overflow: hidden;
}

.box-shadow-field-dialog__scroll {
  width: 100%;
}
</style>
