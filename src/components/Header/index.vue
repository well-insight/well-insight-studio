<script lang="ts">
import type { menuListType, userInfoType } from '@/type'
import { ArrowRight } from '@element-plus/icons-vue'
import { defineComponent, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStorage } from '@/hooks/useStorage'
import { useSystemStore } from '@/stores/system'
import { getItem } from '@/utils'

interface goUrlType {
  name: string
  icon: string
  path: string
}

const { remove } = useStorage('session')

export default defineComponent({
  name: 'DesignHeader',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useSystemStore()
    const data = reactive({
      selectIndex: 0,
      moveIndex: -1,
    })

    const menuList = store.menuList

    const crumbs: {
      name: any
      icon: string
    }[] = reactive([
      {
        name: '首页',
        icon: 'index',
      },
      {
        name: '首页',
        icon: 'index',
      },
    ])

    // userInfo
    const userInfo = reactive<userInfoType>({
      username: 'admin',
      avator: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    })

    const loginContent = getItem('loginContent')

    userInfo.username = loginContent ? loginContent.showname : ''

    // userInfo 用户信息跳转
    const goUrl: goUrlType[] = reactive([
      {
        name: 'GitHub',
        icon: 'github',
        path: 'https://github.com/Wayne1308/weiDesign',
      },
      {
        name: '退出登录',
        icon: 'exit',
        path: 'exit',
      },
    ])

    const goTo = (item: goUrlType) => {
      switch (item.path) {
        case 'exit':
          remove('design.token')
          router.push('/login')
          break

        default:
          window.open(item.path)
          break
      }
    }

    const refresh = () => {
      window.location.reload()
    }

    const initCrumbs = (routeData: any) => {
      crumbs.length > 1 && crumbs.splice(1)
      const path = routeData.path.split('/').filter((o: any) => o)
      let list = [...menuList]
      while (path.length > 0) {
        const item: menuListType | undefined = list.find((o: menuListType) => o.icon === path[0])
        crumbs.push({
          name: item?.title || routeData.name,
          icon: item?.icon || '',
        })
        if (item && item.children) {
          list = item.children
        }
        path.shift()
      }
    }

    initCrumbs(route)

    watch(route, (newV, oldV) => {
      initCrumbs(newV)
    })

    return {
      ArrowRight,
      data,
      crumbs,
      userInfo,
      goUrl,
      goTo,
      refresh,
    }
  },
})
</script>

<template>
  <div class="header-container">
    <div class="info-container">
      <div class="crumbs">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item
            v-for="(item, i) in crumbs"
            :key="i"
            :to="i === 0 ? { path: '/' } : ''"
          >
            <div class="crumbs-item">
              <el-icon>
                <svg-icon :name="item.icon" />
              </el-icon>
              <span class="crumbs-name">{{ item.name }}</span>
            </div>
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="info">
        <el-icon><search /></el-icon>
        <el-icon><bell /></el-icon>
        <el-icon><full-screen /></el-icon>
        <el-icon><magic-stick /></el-icon>
        <el-icon><folder-opened /></el-icon>
        <el-icon title="刷新" @click="refresh">
          <refresh />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.header-container {
  width: 100%;
  height: 100%;
  background-color: #fff;

  .info-container {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #dddfe5;

    .crumbs {
      margin-left: 10px;
      .crumbs-item {
        display: flex;
        align-items: center;
        justify-content: center;

        .crumbs-name {
          margin-left: 5px;
        }

        // .el-icon {
        //   &:hover {
        //     color: #0ca296;
        //   }
        // }
      }
    }

    .info {
      display: flex;
      align-items: center;

      .el-icon {
        margin: 0 10px;
        cursor: pointer;

        // &:hover {
        //   color: #0ca296;
        // }
      }

      .user-info {
        display: flex;
        align-items: center;
        cursor: pointer;

        .username {
          display: inline-block;
          margin-left: 5px;
        }
      }
    }
  }
}
</style>

<style lang="scss">
// .el-breadcrumb__inner a:hover,
// .el-breadcrumb__inner.is-link:hover {
//   color: #0ca296 !important;
// }
// .el-breadcrumb__inner .el-icon:hover {
//   color: #0ca296;
// }
// .el-dropdown-menu__item:hover {
//   color: #0ca296 !important;
//   background-color: #ecf8f3 !important;
// }
.el-dropdown-menu__item {
  .item-class {
    display: inline-block;
    margin-left: 5px;
  }
}
</style>
>
