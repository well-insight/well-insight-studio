<script setup lang="ts">
defineProps<{
  rows?: number
}>()
</script>

<template>
  <div class="skeleton">
    <div v-for="i in (rows ?? 5)" :key="i" class="skeleton-row">
      <div class="skeleton-block" :style="{ width: `${20 + (i % 4) * 20}%` }" />
    </div>
  </div>
</template>

<style scoped>
.skeleton {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 0;
  width: 100%;
}
.skeleton-row {
  height: 10px;
  border-radius: 3px;
  background: var(--wi-surface-hover, #141c2a);
  overflow: hidden;
  position: relative;
}
.skeleton-block {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--wi-surface-hover, #141c2a) 0%, var(--wi-border-color, #2a3448) 50%, var(--wi-surface-hover, #141c2a) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
