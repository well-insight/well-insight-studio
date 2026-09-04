<script lang="ts" setup>
import { WdFlex } from '@wex-design/ui'
</script>

<template>
  <WdFlex class="logo-brand" align="center" gap="11px" aria-label="Wex Design Studio">
    <div class="brand-mark">
      <span>WD</span><i />
    </div>
    <div class="brand-copy">
      <strong>Wex Design</strong>
      <span>DESIGN STUDIO</span>
    </div>
  </WdFlex>
</template>

<style scoped>
.logo-brand {
  display: inline-flex;
}

.brand-mark {
  width: 30px;
  height: 30px;
  position: relative;
  display: grid;
  place-items: center;
  border: var(--wd-border-width) solid var(--wd-color-primary);
  border-radius: var(--wd-radius-md) var(--wd-radius-md) var(--wd-radius-md) var(--wd-radius-sm);
  color: var(--wd-color-on-emphasis);
  background: var(--wd-color-primary);
  transform: rotate(-5deg);
}

.brand-mark span {
  font-size: 10px;
  font-weight: 900;
  transform: rotate(5deg);
}

.brand-mark i {
  position: absolute;
  width: 5px;
  height: 5px;
  right: -3px;
  bottom: -3px;
  border-radius: 50%;
  background: var(--wd-color-warning);
}

.brand-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-copy strong {
  font-size: 13px;
  letter-spacing: -0.02em;
}

.brand-copy span {
  font-size: 9px;
  letter-spacing: 0.16em;
  color: var(--wd-color-text-muted);
}
</style>
