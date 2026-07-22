<template>
  <div :ref="composedDialogRef" :class="dialogKls" :style="style" tabindex="-1">
    <header
      ref="headerRef"
      :class="[ns.e('header'), headerClass, { 'show-close': showClose }]"
    >
      <slot name="header">
        <span role="heading" :aria-level="ariaLevel" :class="ns.e('title')">
          {{ title }}
        </span>
      </slot>
      <div class="s-action-dialog-header-right-container">
        <slot name="header-right"></slot>
      </div>
    </header>
    <div :id="bodyId" :class="[ns.e('body'), bodyClass]">
      <slot />
    </div>
    <footer v-if="$slots.footer" :class="[ns.e('footer'), footerClass]">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject } from "vue";
import { ElIcon } from "element-plus";
import { FOCUS_TRAP_INJECTION_KEY } from "element-plus/es/components/focus-trap/index";
import { useDraggable, useLocale } from "element-plus/es/hooks/index";
import { CloseComponents, composeRefs } from "element-plus/es/utils/index";
import { dialogInjectionKey } from "./constants";
import { dialogContentEmits, dialogContentProps } from "./dialog-content";

const { t } = useLocale();
const { Close } = CloseComponents;

defineOptions({ name: "ElDialogContent" });
const props = defineProps(dialogContentProps);
defineEmits(dialogContentEmits);

const { dialogRef, headerRef, bodyId, ns, style } = inject(dialogInjectionKey)!;
const { focusTrapRef } = inject(FOCUS_TRAP_INJECTION_KEY)!;

const composedDialogRef = composeRefs(focusTrapRef, dialogRef);

const draggable = computed(() => !!props.draggable);
const overflow = computed(() => !!props.overflow);
const { resetPosition, updatePosition, isDragging } = useDraggable(
  dialogRef,
  headerRef,
  draggable,
  overflow
);

const dialogKls = computed(() => [
  ns.b(),
  ns.is("fullscreen", props.fullscreen),
  ns.is("draggable", draggable.value),
  ns.is("dragging", isDragging.value),
  ns.is("align-center", !!props.alignCenter),
  { [ns.m("center")]: props.center },
]);

defineExpose({
  resetPosition,
  updatePosition,
});
</script>
