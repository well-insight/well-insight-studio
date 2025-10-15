<script lang="ts">
import { YJPage } from 'yjpl-core'
import MenuItem from './menuItem.yjpl'

export default class Menu extends YJPage {
  components() {
    return {
      MenuItem,
    }
  }

  props() {
    return {
      menuData: {
        type: Array,
        default: () => [],
      },
      indexKey: {
        type: String,
        default: 'paixu',
      },
    }
  }
}
</script>

<template>
  <el-menu v-bind="$attrs" v-on="$listeners">
    <menu-item :menu-data="menuData" :index-key="indexKey" />
  </el-menu>
</template>
