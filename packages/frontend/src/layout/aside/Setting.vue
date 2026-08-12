<script lang="ts" setup>
import type { ThemeCategory, ThemePreset } from '@/styles/theme/presets'
import type { AppearanceStyle, AppearanceStyleId, ThemeMode, ThemeSize } from '@/styles/theme/tokens'
import { ArrowDown, Expand, Fold, Monitor, Moon, Setting as SettingIcon, Sunny, SwitchButton } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { userDisplayLabel } from '@/api/auth'
import { AdaptiveDialog } from '@/components/adaptive-dialog'
import { useAuthStore } from '@/stores/auth'
import { useControlStore } from '@/stores/controlStore'
import { useThemeStore } from '@/stores/themeStore'
import { CATEGORY_LABELS, THEME_PRESETS } from '@/styles/theme/presets'
import { APPEARANCE_STYLES, WELLCUBE_PRIMARY } from '@/styles/theme/tokens'

defineProps<{ collapse?: boolean }>()

const controlStore = useControlStore()
const { asideCollapse } = storeToRefs(controlStore)

const themeStore = useThemeStore()
const { isDark, config, currentPresetId, currentAppearance } = storeToRefs(themeStore)

const themeDialogVisible = ref(false)
const filterTag = ref<ThemeCategory | 'all'>('all')

const borderRadius = computed({
  get: () => config.value.borderRadius,
  set: (val: number) => themeStore.setBorderRadius(val),
})
const borderRadiusOptions = [
  { value: 2, label: '直角' },
  { value: 4, label: '小圆角' },
  { value: 8, label: '中圆角' },
  { value: 12, label: '大圆角' },
  { value: 16, label: '超圆角' },
]

const modeOptions: { value: ThemeMode, label: string, icon: typeof Sunny }[] = [
  { value: 'light', label: '浅色', icon: Sunny },
  { value: 'dark', label: '暗黑', icon: Moon },
  { value: 'system', label: '跟随系统', icon: Monitor },
]

const sizeOptions: { value: ThemeSize, label: string }[] = [
  { value: 'large', label: '较大' },
  { value: 'default', label: '默认' },
  { value: 'small', label: '紧凑' },
]

const filteredThemes = computed(() => {
  if (filterTag.value === 'all')
    return THEME_PRESETS
  return THEME_PRESETS.filter(t => t.category === filterTag.value)
})

const currentPreset = computed(() => THEME_PRESETS.find(p => p.name === currentPresetId.value))

const themeSummary = computed(() => {
  const modeLabel = modeOptions.find(o => o.value === config.value.mode)?.label ?? '主题'
  const styleLabel = currentAppearance.value?.label ?? '样式'
  return isDark.value ? `${styleLabel} · ${modeLabel}` : `${styleLabel} · ${modeLabel}`
})

function openThemeDialog() {
  themeDialogVisible.value = true
}

function onModeChange(mode: ThemeMode | string | number | boolean | undefined) {
  if (mode === 'light' || mode === 'dark' || mode === 'system')
    themeStore.setMode(mode)
}

function onSizeChange(size: ThemeSize | string | number | boolean | undefined) {
  if (size === 'large' || size === 'default' || size === 'small')
    themeStore.setSize(size)
}

function onPrimaryChange(color: string | null) {
  themeStore.setPrimary(color || WELLCUBE_PRIMARY)
}

function onPresetClick(preset: ThemePreset) {
  themeStore.applyPreset(preset.name)
}

function onAppearanceClick(style: AppearanceStyle) {
  // 切换风格时套用该风格推荐默认（Cube → 薄荷青/暗黑/小圆角）
  themeStore.setAppearance(style.id as AppearanceStyleId, true)
}

function onBorderRadiusChange(val: number | string | boolean | undefined) {
  if (typeof val === 'number')
    themeStore.setBorderRadius(val)
}

function toggleAsideCollapse() {
  asideCollapse.value = !asideCollapse.value
}

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const router = useRouter()

const displayName = computed(() =>
  user.value ? userDisplayLabel(user.value) : '未登录',
)

const userEmail = computed(() => user.value?.email?.trim() || '')

const avatarLetter = computed(() => {
  const n = displayName.value.trim()
  return n ? n.charAt(0).toUpperCase() : '?'
})

async function confirmLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning',
    })
  }
  catch {
    return
  }
  authStore.logout()
  await router.replace({ path: '/login' })
}
</script>

<template>
  <div class="user-footer" :class="{ 'user-footer--collapsed': collapse }">
    <el-dropdown trigger="hover" placement="right-end" class="user-footer__dropdown">
      <div class="user-footer__trigger" role="button" tabindex="0">
        <el-tooltip v-if="collapse" :content="displayName" placement="right">
          <el-avatar :size="34" class="user-footer__avatar shrink-0">
            {{ avatarLetter }}
          </el-avatar>
        </el-tooltip>
        <el-avatar v-else :size="40" class="user-footer__avatar shrink-0">
          {{ avatarLetter }}
        </el-avatar>
        <template v-if="!collapse">
          <div class="user-footer__meta min-w-0 flex-1">
            <span class="user-footer__name">{{ displayName }}</span>
            <span v-if="userEmail" class="user-footer__email">{{ userEmail }}</span>
          </div>
          <el-icon class="user-footer__caret shrink-0">
            <ArrowDown />
          </el-icon>
        </template>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-if="user" disabled class="user-footer__menu-head">
            <div class="user-footer__menu-title">
              {{ displayName }}
            </div>
            <div v-if="userEmail" class="user-footer__menu-sub">
              {{ userEmail }}
            </div>
          </el-dropdown-item>
          <el-dropdown-item divided @click="confirmLogout">
            <el-icon class="align-middle mr-1">
              <SwitchButton />
            </el-icon>
            退出登录
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <div class="user-footer__theme-wrap">
      <el-tooltip v-if="collapse" :content="themeSummary" placement="right">
        <el-button
          type="default"
          circle
          size="small"
          class="user-footer__theme-btn"
          @click="openThemeDialog"
        >
          <el-icon>
            <SettingIcon />
          </el-icon>
        </el-button>
      </el-tooltip>
      <el-button
        v-else
        text
        bg
        class="user-footer__theme-btn user-footer__theme-btn--wide"
        @click="openThemeDialog"
      >
        <el-icon>
          <SettingIcon />
        </el-icon>
        <span>主题设置</span>
      </el-button>
    </div>

    <div class="user-footer__toggle-wrap">
      <el-tooltip v-if="collapse" content="展开侧栏" placement="right">
        <el-button type="default" circle size="small" class="user-footer__toggle-btn" @click="toggleAsideCollapse">
          <el-icon><Expand /></el-icon>
        </el-button>
      </el-tooltip>
      <el-button
        v-else
        text
        bg
        class="user-footer__toggle-btn user-footer__toggle-btn--wide"
        @click="toggleAsideCollapse"
      >
        <el-icon><Fold /></el-icon>
        <span>收起侧栏</span>
      </el-button>
    </div>

    <!-- 主题设置弹窗 -->
    <AdaptiveDialog
      v-model="themeDialogVisible"
      title="主题设置"
      width="720px"
      destroy-on-close
    >
      <div class="theme-dialog__body">
        <!-- 样式风格（壳层外观，与配色方案独立） -->
        <section class="theme-dialog__section">
          <div class="theme-dialog__label">
            样式风格
            <span class="theme-dialog__badge">{{ APPEARANCE_STYLES.length }} 套</span>
          </div>
          <p class="theme-dialog__hint">
            控制字体、圆角、Logo 形态、面板线框等结构气质；浅色/暗黑只换色，不改这些
          </p>
          <div class="theme-dialog__style-grid">
            <button
              v-for="style in APPEARANCE_STYLES"
              :key="style.id"
              type="button"
              class="theme-dialog__style-card"
              :class="{ 'is-active': config.appearance === style.id }"
              @click="onAppearanceClick(style)"
            >
              <div class="theme-dialog__style-header">
                <span class="theme-dialog__style-name">{{ style.label }}</span>
                <span class="theme-dialog__palette-badge">{{ style.id }}</span>
              </div>
              <p class="theme-dialog__style-desc">
                {{ style.description }}
              </p>
              <div class="theme-dialog__palette-strip">
                <span
                  v-for="(c, ci) in style.colors"
                  :key="ci"
                  class="theme-dialog__palette-swatch"
                  :style="{ background: c }"
                />
              </div>
            </button>
          </div>
        </section>

        <!-- 配色方案库 -->
        <section class="theme-dialog__section">
          <div class="theme-dialog__label">
            配色方案库
            <span class="theme-dialog__badge">{{ THEME_PRESETS.length }} 套配色</span>
          </div>
          <p class="theme-dialog__hint">
            点击任意配色卡片切换全局主题，组件实时预览效果
          </p>

          <!-- 分类筛选 -->
          <div class="theme-dialog__filter">
            <el-tag
              size="small"
              :type="filterTag === 'all' ? '' : 'info'"
              :effect="filterTag === 'all' ? 'dark' : 'plain'"
              class="theme-dialog__filter-tag"
              @click="filterTag = 'all'"
            >
              全部
            </el-tag>
            <el-tag
              v-for="cat in (['blue', 'green', 'orange', 'purple', 'red', 'neutral'] as ThemeCategory[])"
              :key="cat"
              size="small"
              :effect="filterTag === cat ? 'dark' : 'plain'"
              class="theme-dialog__filter-tag"
              @click="filterTag = cat"
            >
              {{ CATEGORY_LABELS[cat] }}
            </el-tag>
          </div>

          <!-- 配色卡片网格 -->
          <div class="theme-dialog__palette-grid">
            <button
              v-for="theme in filteredThemes"
              :key="theme.name"
              class="theme-dialog__palette-card"
              :class="{ 'is-active': currentPresetId === theme.name }"
              type="button"
              @click="onPresetClick(theme)"
            >
              <div class="theme-dialog__palette-header">
                <span class="theme-dialog__palette-name">{{ theme.label }}</span>
                <span class="theme-dialog__palette-badge">{{ theme.name }}</span>
              </div>
              <div class="theme-dialog__palette-strip">
                <span
                  v-for="(c, ci) in theme.colors"
                  :key="ci"
                  class="theme-dialog__palette-swatch"
                  :style="{ backgroundColor: c }"
                  :title="c"
                />
              </div>
              <div class="theme-dialog__palette-footer">
                <el-tag size="small" type="info" effect="plain">
                  {{ theme.primary }}
                </el-tag>
              </div>
            </button>
          </div>
        </section>

        <!-- 当前主题信息 -->
        <div v-if="currentPreset" class="theme-dialog__current">
          <span class="theme-dialog__current-label">当前主题：</span>
          <span class="theme-dialog__current-name">{{ currentPreset.label }}</span>
          <span class="theme-dialog__current-primary">（主色 {{ currentPreset.primary }}）</span>
        </div>

        <!-- 外观模式 -->
        <section class="theme-dialog__section">
          <div class="theme-dialog__label">
            外观模式
          </div>
          <p class="theme-dialog__hint">
            仅切换浅色 / 暗黑色值，不改变样式风格里的字体、圆角与结构
          </p>
          <el-segmented
            :model-value="config.mode"
            :options="modeOptions.map(o => ({ label: o.label, value: o.value }))"
            block
            @change="onModeChange"
          />
        </section>

        <!-- 品牌主色 -->
        <section class="theme-dialog__section">
          <div class="theme-dialog__label">
            品牌主色
          </div>
          <p class="theme-dialog__hint">
            拖拽色盘或直接输入 hex 值，页面实时预览
          </p>
          <div class="theme-dialog__primary-row">
            <el-color-picker
              :model-value="config.primary"
              color-format="hex"
              @change="onPrimaryChange"
            />
            <el-input
              :model-value="config.primary"
              maxlength="7"
              placeholder="#409EFF"
              @change="onPrimaryChange"
            />
            <el-button text type="primary" size="small" @click="themeStore.setPrimary(WELLCUBE_PRIMARY)">
              重置
            </el-button>
          </div>
          <div class="theme-dialog__color-preview">
            <span
              v-for="i in 10"
              :key="i"
              class="theme-dialog__color-chip"
              :style="{ backgroundColor: `var(--el-color-primary-light-${i > 9 ? 9 : i})` }"
            />
          </div>
        </section>

        <!-- 组件尺寸 -->
        <section class="theme-dialog__section">
          <div class="theme-dialog__label">
            组件尺寸
          </div>
          <el-radio-group
            :model-value="config.size"
            class="theme-dialog__size"
            @change="onSizeChange"
          >
            <el-radio-button
              v-for="item in sizeOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </section>

        <!-- 圆角大小 -->
        <section class="theme-dialog__section">
          <div class="theme-dialog__label">
            圆角大小
          </div>
          <div class="theme-dialog__radius-row">
            <el-radio-group
              v-model="borderRadius"
              size="small"
              @change="onBorderRadiusChange"
            >
              <el-radio-button
                v-for="item in borderRadiusOptions"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </el-radio-button>
            </el-radio-group>
          </div>
          <div class="theme-dialog__radius-preview">
            <span class="theme-dialog__radius-box" :style="{ borderRadius: `${borderRadius}px` }">
              预览
            </span>
            <span class="theme-dialog__radius-box" :style="{ borderRadius: `${borderRadius * 2}px` }">
              按钮
            </span>
          </div>
        </section>
      </div>

      <template #footer>
        <el-button @click="themeStore.resetTheme()">
          恢复默认
        </el-button>
        <el-button type="primary" @click="themeDialogVisible = false">
          完成
        </el-button>
      </template>
    </AdaptiveDialog>
  </div>
</template>

<style lang="scss" scoped>
.user-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 12px;
}

.user-footer--collapsed {
  padding-left: 8px;
  padding-right: 8px;
}

.user-footer__theme-wrap {
  display: flex;
  justify-content: center;
  padding-top: 4px;
  border-top: 1px solid var(--footer-divider, var(--el-border-color-lighter));
}

.user-footer__theme-btn--wide {
  width: 100%;
  justify-content: flex-start;
  gap: 8px;
}

.user-footer__toggle-wrap {
  display: flex;
  justify-content: center;
}

.user-footer__toggle-btn--wide {
  width: 100%;
  justify-content: center;
}

.user-footer__dropdown {
  display: block;
  width: 100%;
}

.user-footer__trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 8px;
  border-radius: var(--el-border-radius-base);
  cursor: pointer;
  outline: none;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: var(--el-fill-color-light);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--el-color-primary-light-7);
  }
}

.user-footer--collapsed .user-footer__trigger {
  justify-content: center;
  padding-left: 4px;
  padding-right: 4px;
}

.user-footer__avatar {
  background: var(--footer-avatar-bg);
  color: var(--footer-avatar-color);
  border: 1px solid var(--footer-avatar-border);
  font-weight: 600;
}

.user-footer__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  text-align: left;
}

.user-footer__name {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--footer-name-color, var(--type-title));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-footer__email {
  font-size: 11px;
  line-height: 1.2;
  color: var(--footer-meta-color, var(--type-caption));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--cube-font-mono, inherit);
  letter-spacing: 0.02em;
}

.user-footer__caret {
  font-size: 12px;
  color: var(--footer-meta-color, var(--type-caption));
}

:deep(.user-footer__menu-head.is-disabled) {
  cursor: default;
  opacity: 1;
  max-width: 240px;
  padding-top: 10px;
  padding-bottom: 8px;
  background-color: transparent !important;
}

.user-footer__menu-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.user-footer__menu-sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}

/* ---------- 主题弹窗 ---------- */
.theme-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 4px;
}

.theme-dialog__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.theme-dialog__label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.theme-dialog__badge {
  font-size: 12px;
  font-weight: 500;
  background: var(--el-fill-color);
  padding: 1px 12px;
  border-radius: 40px;
  color: var(--el-text-color-secondary);
}

.theme-dialog__hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--el-text-color-secondary);
}

.theme-dialog__style-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.theme-dialog__style-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  text-align: left;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-blank);
  cursor: pointer;
  color: inherit;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
  }

  &.is-active {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
  }
}

.theme-dialog__style-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.theme-dialog__style-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.theme-dialog__style-desc {
  margin: 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

/* 分类筛选 */
.theme-dialog__filter {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.theme-dialog__filter-tag {
  cursor: pointer;
  transition: transform 0.12s;
  font-size: 12px;

  &:hover {
    transform: scale(1.03);
  }
}

/* 配色卡片网格 */
.theme-dialog__palette-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.theme-dialog__palette-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 8px 6px;
  border: 2.5px solid transparent;
  border-radius: 10px;
  background: var(--el-bg-color);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.18s ease;
  user-select: none;
  text-align: left;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px -4px rgba(0, 0, 0, 0.1);
    border-color: var(--el-border-color);
  }

  &.is-active {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 3px var(--el-color-primary-light-7);
  }
}

.theme-dialog__palette-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.theme-dialog__palette-name {
  font-weight: 600;
  font-size: 12px;
  color: var(--el-text-color-primary);
}

.theme-dialog__palette-badge {
  font-size: 9px;
  background: var(--el-fill-color);
  padding: 1px 6px;
  border-radius: 30px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.theme-dialog__palette-strip {
  display: flex;
  gap: 3px;
}

.theme-dialog__palette-swatch {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
  transition: transform 0.1s;

  &:hover {
    transform: scale(1.15);
  }
}

.theme-dialog__palette-footer {
  display: flex;
  gap: 3px;
}

/* 当前主题信息 */
.theme-dialog__current {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  font-size: 13px;
}

.theme-dialog__current-label {
  color: var(--el-text-color-secondary);
}

.theme-dialog__current-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.theme-dialog__current-primary {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

/* 主色 */
.theme-dialog__primary-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.theme-dialog__color-preview {
  display: flex;
  gap: 4px;
  margin-top: 2px;
}

.theme-dialog__color-chip {
  width: 100%;
  height: 18px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

/* 组件尺寸 */
.theme-dialog__size {
  width: 100%;
  display: flex;

  :deep(.el-radio-button) {
    flex: 1;
  }

  :deep(.el-radio-button__inner) {
    width: 100%;
  }
}

/* 圆角 */
.theme-dialog__radius-row {
  :deep(.el-radio-button__inner) {
    font-size: 12px;
    padding: 4px 10px;
  }
}

.theme-dialog__radius-preview {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.theme-dialog__radius-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  height: 30px;
  font-size: 12px;
  color: #fff;
  background: var(--el-color-primary);
}
</style>
