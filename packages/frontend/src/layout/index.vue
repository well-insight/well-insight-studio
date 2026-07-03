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
  <ELayout class="w-full h-full">
    <ELayoutSider v-model:collapsed="asideCollapse" class="border-end-1" :width="240" :collapsed-width="76">
      <div class="w-full h-full flex flex-col">
        <div class="h-[50px] border-bottom-1">
          <Logo :collapse="asideCollapse" />
        </div>
        <div class="flex-auto h-0">
          <Menu :collapse="asideCollapse" />
        </div>
        <div class="w-full border-top-1">
          <Setting :collapse="asideCollapse" />
        </div>
      </div>
    </ELayoutSider>
    <ELayoutContent :style="{ width: 0 }">
      <ELayout direction="column">
        <ELayoutHeader class="h-[50px] border-bottom-1 p-0">
          <Header>
            <template #center>
              <router-view name="headerCenter" />
            </template>
            <template #actions>
              <router-view name="headerActions" />
            </template>
          </Header>
        </ELayoutHeader>
        <ELayoutContent class="custom-el-main-wrapper">
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

<style lang="scss" module></style>
