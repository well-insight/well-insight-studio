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
    <ELayoutSider v-model:collapsed="asideCollapse" class="border-end-1 app-shell__sider" :width="240" :collapsed-width="76">
      <div class="w-full h-full flex flex-col">
        <div class="h-[50px] border-bottom-1 app-shell__logo">
          <Logo :collapse="asideCollapse" />
        </div>
        <div class="flex-auto h-0 app-shell__menu">
          <Menu :collapse="asideCollapse" />
        </div>
        <div class="w-full border-top-1 app-shell__setting">
          <Setting :collapse="asideCollapse" />
        </div>
      </div>
    </ELayoutSider>
    <ELayoutContent :style="{ width: 0 }" class="app-shell__main">
      <ELayout direction="column">
        <ELayoutHeader class="h-[50px] border-bottom-1 p-0 app-shell__header">
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
  background-color: var(--el-bg-color-page);
  color: var(--el-text-color-primary);
}

.app-shell__sider {
  background: var(--el-bg-color);
}

.app-shell__header {
  background: var(--el-bg-color);
}

.app-shell__content {
  background: var(--el-bg-color-page);
}

.app-shell__logo,
.app-shell__setting {
  background: transparent;
}
</style>
