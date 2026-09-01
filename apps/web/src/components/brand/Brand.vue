<script lang="ts" setup>
import { WiFlex, WiSpace } from '@well-insight/ui';

</script>

<template>
  <WiFlex class="logo-brand" align="center" gap="11px" aria-label="Well-Insight 首页">
    <div class="brand-mark">
      <span>WI</span><i />
    </div>
    <div class="brand-copy">
      <strong>Well-Insight</strong>
      <span>INSIGHT STUDIO</span>
    </div>
  </wiflex>
</template>


<style scoped>
.logo-brand {
  display: inline-flex;

  .brand-mark {
    width: 30px;
    height: 30px;
    position: relative;
    display: grid;
    place-items: center;
    border: var(--wi-border-width) solid var(--wi-color-primary);
    border-radius: var(--wi-radius-md) var(--wi-radius-md) var(--wi-radius-md) var(--wi-radius-sm);
    color: var(--wi-color-on-emphasis);
    background: var(--wi-color-primary);
    transform: rotate(-5deg);
  }

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
  background: #f3b66d;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-copy strong {
  font-size: 13px;
  letter-spacing: -.02em;
}

.brand-copy span,
.section-kicker,
.eyebrow,
.visual-label {
  font-size: 9px;
  letter-spacing: .16em;
  color: #77949b;
}
</style>