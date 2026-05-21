<script lang="ts" setup>
import { updateApplication } from "@/api/application";
import { SvgIcon } from "@/components/svg-icon";
import { useControlStore } from "@/stores/controlStore";
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
import PageRouterSetting from "./components/PageRouterSetting.vue";

const workspaceStore = useWorkspaceStore();
const controlStore = useControlStore();
const { currentApp } = storeToRefs(workspaceStore);
const { floatingSettingVisible } = storeToRefs(controlStore);

const { jsonData } = useVisualData();

const previewVisible = ref(false);
const saving = ref(false);

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

async function saveAll() {
  const app = currentApp.value;
  if (!app?.id) {
    ElMessage.warning("未找到当前应用");
    return;
  }
  saving.value = true;
  try {
    const schema = JSON.parse(JSON.stringify(toRaw(toValue(jsonData)))) as Record<string, unknown>;
    await updateApplication(String(app.id), {
      schema,
      client_type: app.clientType ?? 1,
      status: app.status ?? 1,
    });
    sessionStorage.setItem(localKey, JSON.stringify(toRaw(toValue(jsonData))));
    ElMessage.success("保存成功");
  } catch (e) {
    ElMessage.error((e as Error).message || "保存失败");
  } finally {
    saving.value = false;
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

function openFloatingSetting() {
  floatingSettingVisible.value = true;
}
</script>

<template>
  <div class="border-bottom-1 flex h-full w-full items-center gap-2 overflow-hidden px-4">
    <div class="flex h-full min-w-0 flex-1 items-center gap-2 overflow-hidden">
      <PageSettingButton />
      <slot name="center" />
    </div>

    <div class="flex h-full shrink-0 items-center">
      <el-button text :icon="RefreshLeft" />
      <el-button text :icon="RefreshRight" />
      <el-divider direction="vertical" />
      <el-button v-if="currentApp?.clientType === 2" text :icon="Iphone" @click="triggerClient" />
      <el-button v-if="currentApp?.clientType === 1" text :icon="Monitor" @click="triggerClient" />
      <el-button text :icon="Orange" />
      <el-button text :icon="WarnTriangleFilled" />
      <el-divider direction="vertical" />
      <el-button text :icon="DocumentChecked" :loading="saving" @click="saveAll">保存</el-button>
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
