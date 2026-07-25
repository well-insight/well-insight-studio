<script lang="ts" setup>
import SvgIcon from '@/components/svg-icon/SvgIcon.vue'

defineProps<{ collapse?: boolean }>()
</script>

<template>
  <div class="logo-bar" :class="{ 'logo-bar--collapsed': collapse }">
    <div class="logo-bar__mark">
      <SvgIcon name="logo" />
    </div>
    <div v-show="!collapse" class="logo-bar__copy">
      <div class="logo-bar__title">
        WellCube
      </div>
      <div class="logo-bar__subtitle">
        Design OS
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.logo-bar {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  gap: 10px;
  padding: 0 16px;
}

.logo-bar--collapsed {
  justify-content: center;
  padding: 0;
}

.logo-bar__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border: 1px solid rgba(37, 99, 235, 0.18);
  border-radius: 12px;
  background:
    radial-gradient(circle at 30% 24%, rgba(45, 212, 191, 0.34), transparent 42%),
    linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(255, 255, 255, 0.84));
  color: var(--el-color-primary);
  box-shadow:
    0 8px 22px rgba(37, 99, 235, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.logo-bar__mark :deep(svg) {
  width: 24px;
  height: 24px;
}

.logo-bar__copy {
  min-width: 0;
}

.logo-bar__title {
  color: #14213d;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.1;
  white-space: nowrap;
}

.logo-bar__subtitle {
  margin-top: 3px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

:global(html.dark) .logo-bar__mark {
  border-color: rgba(140, 210, 255, 0.16);
  background:
    radial-gradient(circle at 30% 24%, rgba(45, 212, 191, 0.26), transparent 42%),
    linear-gradient(135deg, rgba(67, 156, 255, 0.2), rgba(8, 28, 48, 0.82));
}

:global(html.dark) .logo-bar__title {
  color: var(--el-text-color-primary);
}
</style>
