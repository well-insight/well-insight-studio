<script lang="ts">
import { ArrowLeftBold, ArrowRightBold, InfoFilled, Paperclip } from '@element-plus/icons-vue'
import { defineComponent, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSystemStore } from '@/stores/system'

// type
export default defineComponent({
  name: 'Sidebar',
  // 侧边栏
  props: {
    // 标题logo
    logo: {
      type: String,
      default: '../../assets/Sidebar/logo.png',
    },
  },
  async setup(props, context) {
    const num = ref(100)
    const { logo } = props
    const elMenu = ref() // ref Menu元素
    const router = useRouter()
    const route = useRoute()
    const store = useSystemStore()

    const data = reactive({
      selectSign: 0,
    })

    // 菜单收拢状态
    const isCollapse = ref(false)

    const handle = reactive({
      // 收拢
      arrow: () => {
        console.log('点击收拢')
        isCollapse.value = !isCollapse.value
        context.emit('arrow', isCollapse.value)
      },
      // 浮动
      float: () => {
        console.log('点击浮动')
        context.emit('arrow', '点击浮动')
      },
      // 大事记
      bigThing: () => {
        console.log('大事记')
        context.emit('arrow', '大事记')
      },
    })

    const handleOpen = (key: string, keyPath: string[]) => {
      //
    }
    const handleClose = (key: string, keyPath: string[]) => {
      // debugger
    }
    const selectMenu = (key: string, keyPath: string[]) => {
      // debugger
    }

    // 菜单
    await store.fetchMenuList()
    const menuList = store.menuList

    return {
      num,
      data,
      logo,
      handle,
      isCollapse,
      handleOpen,
      handleClose,
      menuList,
      elMenu,
      selectMenu,
      route,
      router,
      ArrowLeftBold,
      ArrowRightBold,
      Paperclip,
      InfoFilled,
    }
  },
})
</script>

<template>
  <div class="sidebar-container" :class="isCollapse ? 'arrow' : 'expand'" :style="{ width: !isCollapse ? '200px' : '70px' }">
    <div class="logo" title="weiDesign" @click="router.push('/')">
      <svg-icon name="lightning" size="2em" color="var(--el-color-primary)" />
      <span v-if="!isCollapse" class="title">DESIGNER</span>
    </div>
    <div class="sidebar-list">
      <el-menu
        ref="elMenu" v-loading="!menuList" :default-active="route.path" :router="true"
        class="el-menu-vertical" :unique-opened="true" :collapse="isCollapse" :collapse-transition="false"
        @open="handleOpen" @close="handleClose" @select="selectMenu"
      >
        <template v-for="(item) in menuList" :key="item.router">
          <el-menu-item :index="item.router">
            <div class="item-container">
              <el-icon>
                <svg-icon :name="item.icon" color="" />
              </el-icon>
              <span v-if="!isCollapse">{{ item.title }}</span>
            </div>
            <template v-if="isCollapse" #title>
              {{ item.title }}
            </template>
          </el-menu-item>
        </template>
      </el-menu>
    </div>
    <div class="switch-list" :style="{ display: !isCollapse ? 'flex' : 'inline-block' }">
      <div class="switch-item">
        <el-button :icon="isCollapse ? ArrowRightBold : ArrowLeftBold" title="收拢" circle @click="handle.arrow" />
      </div>
      <div class="switch-item">
        <el-button :icon="Paperclip" circle title="浮动" @click="handle.float" />
      </div>
      <div class="switch-item">
        <el-button :icon="InfoFilled" circle title="大事记" @click="handle.bigThing" />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
html:root {
    --el-menu-item-height: 50px;
    --el-menu-sub-item-height: 50px;
}

.sidebar-container {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #ffffff;
    -webkit-box-shadow: 0px 3px 3px #c8c8c8;
    -moz-box-shadow: 0px 3px 3px #c8c8c8;
    box-shadow: 0px 15px 30px rgba(0, 0, 0, 0.4);
    border-right: 1px solid #dddfe5;
    transition: width 0.25s;
    overflow: hidden;
    white-space: nowrap;
    // color: #ffffff;

    &.arrow .sidebar-list .item-container {
        padding-left: 0;
    }

    &.expand .sidebar-list .item-container {
        padding-left: 10px;
    }

    .logo {
        width: 100%;
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        user-select: none;

        .el-image {
            height: 40px;
            width: 40px;
            margin-right: 10px;
        }

        .title {
            color: var(--el-color-primary);
            font-size: 2em;
            font-weight: 600;
        }
    }

    .sidebar-list {
        width: 100%;
        height: calc(100% - 300px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-evenly;
        overflow-y: scroll;
        overflow-x: hidden;
        scrollbar-width: none;
        /* firefox */
        -ms-overflow-style: none;
        /* IE 10+ */
        color: #575a64;

        &::-webkit-scrollbar {
            display: none;
            /* Chrome Safari */
        }

        .item-container {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            border-radius: 5px;
            user-select: none;
            transition: background-color 0.2s;

            &:hover {
                background-color: var(--el-color-primary);
                // border: 1px solid #0ca296;
                color: #ffffff;
            }
        }

        .el-menu--collapse {
            .item-container {
                align-items: center;
                justify-content: center;
            }
        }
    }

    .switch-list {
        border-top: 0.5px solid var(--el-border-color);
        width: 100%;
        height: 200px;
        transition: all 0.5s;
        padding-top: 20px;

        .switch-item {
            height: 40px;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }
    }
}
</style>

<style lang="scss">
// elementui 样式自定义
.el-menu-vertical {
    height: 100%;
    border: none;
    border-right: none !important;
}

.el-menu-item .el-menu-tooltip__trigger {
    position: static !important;
    padding: 0 !important;
}

.el-menu-vertical:not(.el-menu--collapse) {
    width: 100%;
    height: 100%;
}

.el-menu-item {
    padding: 5px 10px !important;

    &:hover {
        background-color: transparent !important;
    }

    &.is-active {
        color: #ffffff !important;

        .item-container {

            width: 100%;
            border-radius: 5px;
            background-color: var(--el-color-primary);
            // border: 1px solid #0ca296;
            color: #ffffff !important;
        }
    }
}

// .el-menu--collapse .el-sub-menu.is-active .el-sub-menu__title {
//     color: var(--el-color-primary) !important;
// }

.el-sub-menu {
    width: 100%;

    .el-menu-item {
        min-width: auto !important;
    }

    .el-sub-menu__title {
        padding: 5px 10px !important;

        &:hover {
            background-color: transparent !important;
            color: #fff;
        }
    }

    .el-menu-item-group__title {
        padding: 0;
    }
}
</style>
