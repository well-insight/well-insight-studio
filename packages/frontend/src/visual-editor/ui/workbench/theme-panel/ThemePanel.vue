<script lang="ts" setup>
/**
 * 画布主题面板
 * 仿照 echarts-theme-builder 的 ThemePanel 设计
 * 支持预定义主题选择和自定义主题编辑
 */
import { Check, Edit, MagicStick, RefreshLeft } from '@element-plus/icons-vue'
import { useCanvasThemeStore } from '@/stores/canvasThemeStore'
import { getPredefinedThemeMetas } from '@/common/types/predefinedThemes'
import type { CanvasTheme } from '@/common/types/canvasTheme'
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { cloneDeep } from 'lodash-es'

const themeStore = useCanvasThemeStore()
const { activeThemeId, currentTheme, isCustomMode, isDark, customTheme } = storeToRefs(themeStore)

const predefinedMetas = getPredefinedThemeMetas()

/** 当前编辑标签页 */
const activeTab = ref<'preset' | 'custom'>('preset')

/** 编辑中的自定义主题（深拷贝避免直接修改 store） */
const editingTheme = reactive<CanvasTheme>(cloneDeep(customTheme.value))

// 当编辑标签切换到自定义时，同步编辑数据
watch(activeTab, (tab) => {
  if (tab === 'custom') {
    Object.assign(editingTheme, cloneDeep(customTheme.value))
  }
})

/** 颜色配置分组定义 */
interface ColorGroup {
  label: string
  key: string
  items: { label: string, path: string }[]
}

const colorGroups = computed<ColorGroup[]>(() => [
  {
    label: '品牌色',
    key: 'palette',
    items: [
      { label: '主色', path: 'palette.primary' },
      { label: '成功色', path: 'palette.success' },
      { label: '警告色', path: 'palette.warning' },
      { label: '危险色', path: 'palette.danger' },
      { label: '信息色', path: 'palette.info' },
    ],
  },
  {
    label: '文字色',
    key: 'text',
    items: [
      { label: '主要文字', path: 'text.primary' },
      { label: '常规文字', path: 'text.regular' },
      { label: '次要文字', path: 'text.secondary' },
      { label: '占位文字', path: 'text.placeholder' },
      { label: '禁用文字', path: 'text.disabled' },
    ],
  },
  {
    label: '背景色',
    key: 'bg',
    items: [
      { label: '页面背景', path: 'bg.page' },
      { label: '组件背景', path: 'bg.component' },
      { label: '叠加背景', path: 'bg.overlay' },
      { label: '悬停背景', path: 'bg.hover' },
      { label: '选中背景', path: 'bg.selected' },
    ],
  },
  {
    label: '边框色',
    key: 'border',
    items: [
      { label: '基础边框', path: 'border.base' },
      { label: '浅色边框', path: 'border.light' },
      { label: '深色边框', path: 'border.dark' },
    ],
  },
  {
    label: '填充色',
    key: 'fill',
    items: [
      { label: '默认填充', path: 'fill.default' },
      { label: '浅填充', path: 'fill.light' },
      { label: '深填充', path: 'fill.dark' },
      { label: '页面填充', path: 'fill.page' },
    ],
  },
])

/** 获取主题中某个路径的值 */
function getThemeValue(theme: CanvasTheme, path: string): string {
  const keys = path.split('.')
  let value: any = theme
  for (const key of keys) {
    value = value?.[key]
  }
  return typeof value === 'string' ? value : ''
}

/** 选择预定义主题 */
function selectTheme(themeId: string) {
  themeStore.selectPredefinedTheme(themeId)
  activeTab.value = 'preset'
}

/** 进入自定义编辑模式 */
function enterCustomMode() {
  themeStore.forkCurrentTheme()
  Object.assign(editingTheme, cloneDeep(customTheme.value))
  activeTab.value = 'custom'
}

/** 应用自定义编辑的颜色 */
function applyCustomColor(path: string, value: string) {
  themeStore.updateCustomThemeColor(path, value)
  // 同步编辑中数据
  const keys = path.split('.')
  let target: any = editingTheme
  for (let i = 0; i < keys.length - 1; i++) {
    target = target?.[keys[i]]
  }
  if (target && keys[keys.length - 1] in target) {
    target[keys[keys.length - 1]] = value
  }
}

/** 重置主题 */
function resetToDefault() {
  themeStore.selectPredefinedTheme('default')
  themeStore.resetCustomTheme()
  activeTab.value = 'preset'
}
</script>

<template>
  <div :class="$style['theme-panel']">
    <!-- 标签页切换 -->
    <div :class="$style['tabs']">
      <button
        :class="[$style['tab'], activeTab === 'preset' && $style['tab--active']]"
        @click="activeTab = 'preset'"
      >
        <el-icon :size="14"><MagicStick /></el-icon>
        预置主题
      </button>
      <button
        :class="[$style['tab'], activeTab === 'custom' && $style['tab--active']]"
        @click="enterCustomMode"
      >
        <el-icon :size="14"><Edit /></el-icon>
        自定义
      </button>
    </div>

    <!-- 预置主题列表 -->
    <div v-show="activeTab === 'preset'" :class="$style['preset-list']">
      <div
        v-for="meta in predefinedMetas"
        :key="meta.id"
        :class="[
          $style['preset-item'],
          activeThemeId === meta.id && $style['preset-item--active'],
        ]"
        @click="selectTheme(meta.id)"
      >
        <div :class="$style['preset-preview']" :style="{ background: meta.previewBg }">
          <div
            v-for="(color, i) in meta.previewColors.slice(0, 5)"
            :key="i"
            :class="$style['preset-dot']"
            :style="{ backgroundColor: color }"
          />
        </div>
        <span :class="$style['preset-name']">{{ meta.name }}</span>
        <div v-if="activeThemeId === meta.id" :class="$style['preset-checked']">
          <el-icon :size="12"><Check /></el-icon>
        </div>
      </div>
    </div>

    <!-- 自定义主题编辑 -->
    <div v-show="activeTab === 'custom'" :class="$style['custom-editor']">
      <el-scrollbar max-height="420px">
        <div v-for="group in colorGroups" :key="group.key" :class="$style['color-group']">
          <div :class="$style['color-group__label']">{{ group.label }}</div>
          <div :class="$style['color-group__items']">
            <div
              v-for="item in group.items"
              :key="item.path"
              :class="$style['color-item']"
            >
              <label :class="$style['color-item__label']">{{ item.label }}</label>
              <div :class="$style['color-item__input']">
                <el-color-picker
                  :model-value="getThemeValue(editingTheme, item.path)"
                  size="small"
                  show-alpha
                  @change="(v: string) => applyCustomColor(item.path, v)"
                />
                <el-input
                  :model-value="getThemeValue(editingTheme, item.path)"
                  size="small"
                  style="width: 100px"
                  @change="(v: string) => applyCustomColor(item.path, v)"
                />
              </div>
            </div>
          </div>
        </div>
      </el-scrollbar>

      <div :class="$style['custom-actions']">
        <el-button size="small" @click="resetToDefault">重置默认</el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
.theme-panel {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.tabs {
  display: flex;
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 0;
  flex-shrink: 0;
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    color: var(--el-color-primary);
  }

  &--active {
    color: var(--el-color-primary);
    font-weight: 500;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 20%;
      right: 20%;
      height: 2px;
      background: var(--el-color-primary);
      border-radius: 1px 1px 0 0;
    }
  }
}

/* 预置主题列表 */
.preset-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 10px;
}

.preset-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 6px 6px;
  border-radius: 10px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  overflow: hidden;

  &:hover {
    background-color: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-7);
  }

  &--active {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
  }
}

.preset-preview {
  width: 100%;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 0 6px;
  border: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.preset-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.preset-name {
  font-size: 12px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.preset-checked {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

/* 自定义编辑 */
.custom-editor {
  padding: 0;
}

.color-group {
  padding: 12px 12px 8px;

  & + & {
    border-top: 1px solid var(--el-border-color-light);
  }

  &__label {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-regular);
    margin-bottom: 8px;
    padding-left: 2px;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
}

.color-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;

  &__label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
    min-width: 60px;
  }

  &__input {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.custom-actions {
  padding: 8px 12px 12px;
  display: flex;
  justify-content: center;
  border-top: 1px solid var(--el-border-color-light);
}
</style>
