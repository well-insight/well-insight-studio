<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { ELayout, ELayoutContent, ELayoutHeader, ELayoutSider } from '@/components/e-layout'
import { useControlStore } from '@/stores/controlStore'
import Logo from './aside/Logo.vue'
import Menu from './aside/Menu.vue'
import Setting from './aside/Setting.vue'
import Header from './header/Header.vue'

const controlStore = useControlStore()

const { asideCollapse } = storeToRefs(controlStore)
</script>

<template>
  <ELayout class="w-full h-full app-shell">
    <ELayoutSider v-model:collapsed="asideCollapse" class="app-shell__sider" :width="252" :collapsed-width="78">
      <div class="app-shell__sider-inner">
        <div class="app-shell__logo">
          <Logo :collapse="asideCollapse" />
        </div>
        <div class="app-shell__menu">
          <Menu :collapse="asideCollapse" />
        </div>
        <div class="app-shell__setting">
          <Setting :collapse="asideCollapse" />
        </div>
      </div>
    </ELayoutSider>
    <ELayoutContent :style="{ width: 0 }" class="app-shell__main">
      <ELayout direction="column" class="app-shell__main-panel">
        <ELayoutHeader class="app-shell__header">
          <Header>
            <template #center>
              <router-view name="headerCenter" />
            </template>
            <template #actions>
              <router-view name="headerActions" />
            </template>
          </Header>
        </ELayoutHeader>
        <ELayoutContent class="custom-el-main-wrapper app-shell__content">
          <router-view>
            <template #default="{ Component, route }">
              <keep-alive v-if="route.meta.keepAlive">
                <component :is="Component" />
              </keep-alive>
              <component :is="Component" v-else />
            </template>
          </router-view>
        </ELayoutContent>
      </ELayout>
    </ELayoutContent>
  </ELayout>
</template>

<style lang="scss" scoped>
.app-shell {
  --app-shell-header-height: 60px;

  gap: 12px;
  padding: 12px;
  background: var(--app-shell-bg);
  color: var(--el-text-color-primary);
}

.app-shell__sider {
  overflow: visible;
  border: 1px solid var(--app-shell-panel-border);
  border-radius: var(--app-shell-radius, 16px);
  background: var(--app-shell-panel-bg);
  box-shadow: var(--app-shell-panel-shadow);
}

.app-shell__sider-inner {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
}

.app-shell__logo {
  flex-shrink: 0;
  height: var(--app-shell-header-height);
  border-bottom: 1px solid var(--app-shell-divider);
}

.app-shell__menu {
  flex: 1;
  min-height: 0;
  padding: 10px 8px;
}

.app-shell__setting {
  flex-shrink: 0;
  border-top: 1px solid var(--app-shell-divider);
  background: var(--app-shell-setting-bg);
}

.app-shell__main {
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.app-shell__main-panel {
  overflow: hidden;
  border: 1px solid var(--app-shell-main-border);
  border-radius: var(--app-shell-radius, 16px);
  background: var(--app-shell-main-bg);
  box-shadow: var(--app-shell-main-shadow);
}

.app-shell__header {
  height: var(--app-shell-header-height);
  flex-shrink: 0;
  padding: 0;
  border-bottom: 1px solid var(--app-shell-header-border);
  background: var(--app-shell-header-bg);
  backdrop-filter: blur(16px);
}

.app-shell__content {
  display: flex;
  flex-direction: column;
  min-height: 0;
  /* 主区滚动容器；勿用 hidden，工作台等内容会被裁切无法滚动 */
  overflow: auto;
  background: var(--app-shell-content-bg);
}

/* 让页面根节点能按主区高度撑满（工作台等一屏布局） */
.app-shell__content > :deep(*) {
  flex: 1 0 auto;
  width: 100%;
  min-height: 100%;
}
</style>
