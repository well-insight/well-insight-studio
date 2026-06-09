<script lang="ts" setup>
import { updateApplication } from "@/api/application";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { localKey, useVisualData } from "@/visual-editor/hooks/useVisualData";
import {
  DocumentChecked,
  Iphone,
  Monitor,
  Orange,
  RefreshLeft,
  RefreshRight,
  VideoPlay,
  WarnTriangleFilled,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { storeToRefs } from "pinia";
import { computed, ref, toRaw, toValue } from "vue";
import Preview from "./components/Preview.vue";
import PageSettingButton from "./components/PageSetting.vue";

const workspaceStore = useWorkspaceStore();
const { currentApp } = storeToRefs(workspaceStore);

const { jsonData, saveStatus, saveError, isDirty, canUndo, canRedo, saveProject, undo, redo } =
  useVisualData();

const previewVisible = ref(false);

const statusActive = computed({
  get: () => currentApp.value?.status === 1,
  set: async (v: boolean) => {
    const app = currentApp.value;
    if (!app?.id) return;
    try {
      await updateApplication(String(app.id), { status: v ? 1 : 0 });
      app.status = v ? 1 : 0;
    } catch (e) {
      ElMessage.error((e as Error).message || "更新状态失败");
    }
  },
});

const saveStatusTooltip = computed(() => {
  if (saveStatus.value === "saving") {
    return "保存中…";
  }
  if (saveStatus.value === "error") {
    return saveError.value || "保存失败";
  }
  if (saveStatus.value === "saved") {
    return "已保存";
  }
  if (isDirty.value) {
    return "有未保存的更改";
  }
  return "已同步至服务器";
});

const saveStatusButtonType = computed(() => {
  if (saveStatus.value === "error" || isDirty.value) {
    return "danger";
  }
  if (saveStatus.value === "saved") {
    return "success";
  }
  return "info";
});

const saveStatusColor = computed(() => {
  if (saveStatus.value === "error" || isDirty.value) {
    return `var(--el-color-danger)`;
  }
  if (saveStatus.value === "saved") {
    return `var(--el-color-success)`;
  }
  return `var(--el-color-info)`;
});

async function saveAll() {
  const ok = await saveProject();
  if (ok) {
    ElMessage.success("保存成功");
  } else if (saveError.value) {
    ElMessage.error(saveError.value);
  } else {
    ElMessage.warning("未找到当前应用");
  }
}

function handleUndo() {
  if (!undo()) {
    ElMessage.info("没有可撤回的操作");
  }
}

function handleRedo() {
  if (!redo()) {
    ElMessage.info("没有可重做的操作");
  }
}

async function triggerClient() {
  const app = currentApp.value;
  if (!app?.id) return;
  const next = app.clientType === 1 ? 2 : 1;
  try {
    await updateApplication(String(app.id), { client_type: next });
    app.clientType = next;
    ElMessage.success(next === 2 ? "已切换为移动端画布" : "已切换为 PC 画布");
  } catch (e) {
    ElMessage.error((e as Error).message || "切换失败");
  }
}

function previewPage() {
  sessionStorage.setItem(localKey, JSON.stringify(toRaw(toValue(jsonData))));
  previewVisible.value = true;
}
</script>

<template>
  <div class="border-bottom-1 flex h-full w-full items-center gap-2 overflow-hidden px-4">
    <div class="flex h-full min-w-0 flex-1 items-center gap-2 overflow-hidden">
      <PageSettingButton />
      <div class="w-0 flex-auto">
        <el-scrollbar class="h-full w-full">
          <slot name="center" />
        </el-scrollbar>
      </div>
    </div>

    <div class="flex h-full shrink-0 items-center">
      <el-tooltip content="撤回" placement="bottom">
        <el-button text :icon="RefreshLeft" :disabled="!canUndo" @click="handleUndo" />
      </el-tooltip>
      <el-tooltip content="重做" placement="bottom">
        <el-button text :icon="RefreshRight" :disabled="!canRedo" @click="handleRedo" />
      </el-tooltip>
      <el-divider direction="vertical" />
      <!-- <el-button v-if="currentApp?.clientType === 2" text :icon="Iphone" @click="triggerClient" />
      <el-button v-if="currentApp?.clientType === 1" text :icon="Monitor" @click="triggerClient" />
      <el-button text :icon="Orange" /> -->
      <!-- <el-tooltip :content="saveStatusTooltip" placement="bottom">
        <el-button
          text
          :icon="WarnTriangleFilled"
          :type="saveStatusButtonType"
          :class="{ 'save-status-btn--pulse': isDirty }"
        />
      </el-tooltip> -->
      <!-- <el-divider direction="vertical" /> -->
      <el-tooltip :content="saveStatusTooltip" placement="bottom">
        <el-button text :icon="DocumentChecked" :loading="saveStatus === 'saving'" @click="saveAll">
          <el-badge is-dot :offset="[10, 0]" :color="saveStatusColor"> 保存 </el-badge>
        </el-button>
      </el-tooltip>

      <el-divider direction="vertical" />
      <el-button text :icon="VideoPlay" @click="previewPage">预览</el-button>
      <el-divider direction="vertical" />
      <el-space>
        <el-button text>
          <span
            class="mr-2"
            :class="[$style.status, statusActive ? $style.enable : $style.disable]"
          />
          <el-text>{{ statusActive ? "激活" : "关闭" }}</el-text>
        </el-button>
        <el-switch v-model="statusActive" />
      </el-space>
    </div>
  </div>

  <Preview v-model="previewVisible" :device="currentApp?.clientType === 1 ? 'pc' : 'mobile'" />
</template>

<style lang="scss" scoped>
.save-status-btn--pulse {
  animation: save-status-pulse 1.6s ease-in-out infinite;
}

@keyframes save-status-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.55;
  }
}
</style>

<style lang="scss" module>
.status {
  height: 8px;
  width: 8px;
  border-radius: 50%;
  display: inline-block;

  &.enable {
    background-color: green;
  }

  &.disable {
    background-color: red;
  }
}
</style>
