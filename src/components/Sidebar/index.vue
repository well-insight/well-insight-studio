<script lang="ts" setup>
import type { userInfoType } from '@/type'
import { ArrowLeftBold, CirclePlusFilled, Paperclip, Promotion, Setting } from '@element-plus/icons-vue'
import { ElMenu, ElMessageBox } from 'element-plus'
import { defineComponent, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMenuList } from '@/api'
import { useStorage } from '@/hooks/useStorage'

interface goUrlType {
  name: string
  icon: string
  path: string
}

const props = defineProps({
  // 标题logo
  logo: {
    type: String,
    default: '../../assets/Sidebar/logo.png',
  },
})

const emits = defineEmits(['arrow'])

const { remove } = useStorage('session')

const elMenu = ref() // ref Menu元素
const router = useRouter()
const route = useRoute()

// 菜单收拢状态
const isCollapse = ref(false)

const handle = reactive({
  // 收拢
  arrow: () => {
    console.log('点击收拢')
    isCollapse.value = !isCollapse.value
    emits('arrow', isCollapse.value)
  },
  // 浮动
  float: () => {
    console.log('点击浮动')
    emits('arrow', '点击浮动')
  },
  // 大事记
  bigThing: () => {
    console.log('大事记')
    emits('arrow', '大事记')
  },
})

function handleOpen(key: string, keyPath: string[]) {
  //
}
function handleClose(key: string, keyPath: string[]) {
  // debugger
}
function selectMenu(key: string, keyPath: string[]) {
  // debugger
}

// 菜单

const menuList = ref<any[]>([])

const userInfo = reactive<userInfoType>({
  username: 'admin',
  avator: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
})

fetchMenuList()

function exitSystem() {
  ElMessageBox.confirm('确认退出登录？', {
    title: '提示',
  }).then(() => {
    remove('design.token')
    router.push('/login')
  })
}

async function fetchMenuList() {
  const res = await getMenuList()
  if (res) {
    menuList.value = res
  }
}
</script>

<template>
  <div
    class="sidebar-container" :class="isCollapse ? 'arrow' : 'expand'"
    :style="{ width: !isCollapse ? '200px' : '70px' }"
  >
    <div class="logo" title="well-design" @click="router.push('/')">
      <svg-icon name="lightning" size="40px" color="var(--el-color-primary)" />
      <span v-if="!isCollapse" class="title">DESIGNER</span>
    </div>
    <div class="sidebar-list">
      <ElMenu
        ref="elMenu" v-loading="!menuList" :default-active="route.path" :router="true" class="el-menu-vertical"
        :unique-opened="true" :collapse="isCollapse" :collapse-transition="false" @open="handleOpen"
        @close="handleClose" @select="selectMenu"
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
      </ElMenu>
    </div>
    <div class="switch-list" :style="{ display: !isCollapse ? 'flex' : 'inline-block' }">
      <div class="button-wrapper">
        <el-icon :size="18">
          <Setting />
        </el-icon>
        <span>设置</span>
      </div>

      <div class="button-wrapper">
        <el-icon :size="18">
          <CirclePlusFilled />
        </el-icon>
        <span>邀请用户</span>
      </div>

      <div class="button-wrapper">
        <el-icon :size="18">
          <Promotion />
        </el-icon>
        <span>帮助</span>
      </div>

      <el-popover placement="right" trigger="click">
        <template #reference>
          <div class="button-wrapper">
            <el-avatar style="width: 18px; height: 18px; margin-right: 5px;" :src="userInfo.avator" />
            <span class="username">{{ userInfo.username }}</span>
          </div>
        </template>
        <div class="popper-content-wrapper">
          <div class="mb-2 popper-item-wrapper">
            <svg-icon name="github" />
            个人信息
          </div>
          <div class="popper-item-wrapper" @click="exitSystem">
            <svg-icon name="exit" />
            退出登录
          </div>
        </div>
      </el-popover>

      <!-- <el-button :icon="isCollapse ? ArrowRightBold : ArrowLeftBold" title="收拢" @click="handle.arrow" />

      <el-button :icon="Paperclip" @click="handle.float">
        设置
      </el-button> -->

      <!-- <div class="switch-item">
        <el-button :icon="isCollapse ? ArrowRightBold : ArrowLeftBold" title="收拢" circle @click="handle.arrow" />
      </div>
      <div class="switch-item">
        <el-button :icon="Paperclip" circle title="浮动" @click="handle.float" />
      </div>
      <div class="switch-item">
        <el-button :icon="InfoFilled" circle title="大事记" @click="handle.bigThing" />
      </div> -->
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
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    padding: 0 10px;
    border-bottom: 1px solid var(--el-border-color);

    .title {
      color: var(--el-color-primary);
      font-size: 20px;
      font-weight: 600;
      flex: 1;
      width: 0;
      display: inline-block;
      margin-left: 8px;
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
    overflow: hidden;

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
    transition: all 0.5s;
    padding: 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .button-wrapper {
      display: inline-flex;
      width: 100%;
      height: 40px;
      border-radius: 4px;
      align-items: center;
      padding-left: 10px;
      cursor: pointer;
      margin-bottom: 10px;

      &:hover {
        background-color: var(--el-color-primary);
        color: white;
      }

      .el-icon {
        margin-right: 5px;
      }
    }
  }

}
</style>

<style lang="scss">
.popper-content-wrapper {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;

  .popper-item-wrapper {
    width: 100%;
    height: 30px;
    display: flex;
    align-items: center;
    padding: 5px;
    border-radius: 4px;
    cursor: pointer;

    .svg-icon {
      margin-right: 5px;
    }

    &:hover {
      background: var(--el-color-primary);
      color: white;

      .svg-icon {
        color: white;
      }
    }
  }
}

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
