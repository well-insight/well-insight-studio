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
  background:
    radial-gradient(circle at 12% 8%, rgba(37, 99, 235, 0.1), transparent 28%),
    linear-gradient(135deg, #f8fbff 0%, #edf4ff 48%, #f6fffb 100%);
  color: var(--el-text-color-primary);
}

.app-shell__sider {
  overflow: visible;
  border: 1px solid rgba(82, 124, 181, 0.18);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(246, 251, 255, 0.9)), var(--el-bg-color);
  box-shadow: 0 18px 48px rgba(31, 58, 112, 0.1);
}

.app-shell__sider-inner {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 16px;
}

.app-shell__logo {
  flex-shrink: 0;
  height: var(--app-shell-header-height);
  border-bottom: 1px solid rgba(82, 124, 181, 0.12);
}

.app-shell__menu {
  flex: 1;
  min-height: 0;
  padding: 10px 8px;
}

.app-shell__setting {
  flex-shrink: 0;
  border-top: 1px solid rgba(82, 124, 181, 0.12);
  background: rgba(255, 255, 255, 0.42);
}

.app-shell__main {
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.app-shell__main-panel {
  overflow: hidden;
  border: 1px solid rgba(82, 124, 181, 0.16);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.62);
  box-shadow: 0 18px 48px rgba(31, 58, 112, 0.08);
}

.app-shell__header {
  height: var(--app-shell-header-height);
  flex-shrink: 0;
  padding: 0;
  border-bottom: 1px solid rgba(82, 124, 181, 0.13);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(16px);
}

.app-shell__content {
  min-height: 0;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.4), transparent 220px), var(--el-bg-color-page);
}

:global(html.dark) .app-shell {
  background:
    radial-gradient(circle at 14% 8%, rgba(67, 156, 255, 0.18), transparent 30%),
    linear-gradient(135deg, #06111c 0%, #071a2b 48%, #06211d 100%);
}

:global(html.dark) .app-shell__sider,
:global(html.dark) .app-shell__main-panel {
  border-color: rgba(140, 210, 255, 0.14);
  background: linear-gradient(180deg, rgba(13, 40, 64, 0.92), rgba(8, 28, 48, 0.9)), var(--el-bg-color);
  box-shadow: 0 18px 48px rgba(4, 16, 30, 0.34);
}

:global(html.dark) .app-shell__logo,
:global(html.dark) .app-shell__setting,
:global(html.dark) .app-shell__header {
  border-color: rgba(140, 210, 255, 0.12);
}

:global(html.dark) .app-shell__setting,
:global(html.dark) .app-shell__header {
  background: rgba(13, 40, 64, 0.72);
}
</style>
