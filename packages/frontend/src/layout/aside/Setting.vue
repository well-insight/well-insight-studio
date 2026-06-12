<script lang="ts" setup>
import { ArrowDown, Expand, Fold, SwitchButton } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { userDisplayLabel } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useControlStore } from '@/stores/controlStore'

defineProps<{ collapse?: boolean }>()

const controlStore = useControlStore()
const { asideCollapse } = storeToRefs(controlStore)

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

.user-footer__toggle-wrap {
  display: flex;
  justify-content: center;
  padding-top: 4px;
  border-top: 1px solid var(--el-border-color-lighter);
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
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
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
  font-weight: 500;
  line-height: 1.25;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-footer__email {
  font-size: 12px;
  line-height: 1.2;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-footer__caret {
  font-size: 12px;
  color: var(--el-text-color-secondary);
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
</style>
