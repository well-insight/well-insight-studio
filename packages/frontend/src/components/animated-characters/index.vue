<script setup lang="ts">
import gsap from 'gsap'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

export interface Props {
  isTyping?: boolean
  showPassword?: boolean
  passwordLength?: number
  width?: string | number
  height?: string | number
  sceneWidth?: number
  sceneHeight?: number
  characters?: Partial<Record<CharacterKey, Partial<CharacterLayout>>>
  faces?: Partial<Record<CharacterKey, Partial<FaceLayout>>>
  mouth?: Partial<MouthLayout>
}

type CharacterKey = 'purple' | 'black' | 'orange' | 'yellow'
interface CharacterLayout {
  left: number
  width: number
  height: number
  background: string
  borderRadius: string
  zIndex: number
}
interface FaceLayout {
  left: number
  top: number
  gap: number
}
interface MouthLayout {
  left: number
  top: number
  width: number
  height: number
  borderRadius: string
  background: string
}

const props = withDefaults(defineProps<Props>(), {
  isTyping: false,
  showPassword: false,
  passwordLength: 0,
  width: '100%',
  height: '100%',
  sceneWidth: 550,
  sceneHeight: 400,
})

const DEFAULT_CHARACTERS: Record<CharacterKey, CharacterLayout> = {
  purple: { left: 70, width: 180, height: 400, background: '#6c3ff5', borderRadius: '10px 10px 0 0', zIndex: 1 },
  black: { left: 240, width: 120, height: 310, background: '#2d2d2d', borderRadius: '8px 8px 0 0', zIndex: 2 },
  orange: { left: 0, width: 240, height: 200, background: '#ff9b6b', borderRadius: '120px 120px 0 0', zIndex: 3 },
  yellow: { left: 310, width: 140, height: 230, background: '#e8d754', borderRadius: '70px 70px 0 0', zIndex: 4 },
}

const DEFAULT_FACES: Record<CharacterKey, FaceLayout> = {
  purple: { left: 45, top: 40, gap: 32 },
  black: { left: 26, top: 32, gap: 24 },
  orange: { left: 82, top: 90, gap: 32 },
  yellow: { left: 52, top: 40, gap: 24 },
}

const DEFAULT_MOUTH: MouthLayout = {
  left: 40,
  top: 88,
  width: 80,
  height: 4,
  borderRadius: '9999px',
  background: '#2d2d2d',
}

const containerRef = ref<HTMLDivElement>()
const purpleRef = ref<HTMLDivElement>()
const blackRef = ref<HTMLDivElement>()
const yellowRef = ref<HTMLDivElement>()
const orangeRef = ref<HTMLDivElement>()
const purpleFaceRef = ref<HTMLDivElement>()
const blackFaceRef = ref<HTMLDivElement>()
const yellowFaceRef = ref<HTMLDivElement>()
const orangeFaceRef = ref<HTMLDivElement>()
const yellowMouthRef = ref<HTMLDivElement>()
const sceneScale = ref(1)
let resizeObserver: ResizeObserver | null = null

const mousePosition = ref({ x: 0, y: 0 })
const rafId = ref(0)
const isLooking = ref(false)
const lookingTimer = ref<ReturnType<typeof setTimeout>>()
const purpleBlinkTimer = ref<ReturnType<typeof setTimeout>>()
const blackBlinkTimer = ref<ReturnType<typeof setTimeout>>()
const purplePeekTimer = ref<ReturnType<typeof setTimeout>>()

const isHidingPassword = computed(() => props.passwordLength > 0 && !props.showPassword)
const isShowingPassword = computed(() => props.passwordLength > 0 && props.showPassword)
const mergedCharacters = computed(() => {
  return {
    purple: { ...DEFAULT_CHARACTERS.purple, ...(props.characters?.purple || {}) },
    black: { ...DEFAULT_CHARACTERS.black, ...(props.characters?.black || {}) },
    orange: { ...DEFAULT_CHARACTERS.orange, ...(props.characters?.orange || {}) },
    yellow: { ...DEFAULT_CHARACTERS.yellow, ...(props.characters?.yellow || {}) },
  }
})
const mergedFaces = computed(() => {
  return {
    purple: { ...DEFAULT_FACES.purple, ...(props.faces?.purple || {}) },
    black: { ...DEFAULT_FACES.black, ...(props.faces?.black || {}) },
    orange: { ...DEFAULT_FACES.orange, ...(props.faces?.orange || {}) },
    yellow: { ...DEFAULT_FACES.yellow, ...(props.faces?.yellow || {}) },
  }
})
const mergedMouth = computed(() => ({ ...DEFAULT_MOUTH, ...(props.mouth || {}) }))
const containerStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}))
const sceneStyle = computed(() => ({
  width: `${props.sceneWidth}px`,
  height: `${props.sceneHeight}px`,
  transform: `translate(-50%, -50%) scale(${sceneScale.value})`,
}))
const mouthStyle = computed(() => ({
  left: `${mergedMouth.value.left}px`,
  top: `${mergedMouth.value.top}px`,
  width: `${mergedMouth.value.width}px`,
  height: `${mergedMouth.value.height}px`,
  borderRadius: mergedMouth.value.borderRadius,
  background: mergedMouth.value.background,
}))
function characterStyle(key: CharacterKey) {
  const style = mergedCharacters.value[key]
  return {
    left: `${style.left}px`,
    width: `${style.width}px`,
    height: `${style.height}px`,
    background: style.background,
    borderRadius: style.borderRadius,
    zIndex: style.zIndex,
  }
}
function faceStyle(key: CharacterKey) {
  const style = mergedFaces.value[key]
  return { left: `${style.left}px`, top: `${style.top}px`, gap: `${style.gap}px` }
}

let purpleSkew: gsap.QuickToFunc
let blackSkew: gsap.QuickToFunc
let orangeSkew: gsap.QuickToFunc
let yellowSkew: gsap.QuickToFunc
let purpleX: gsap.QuickToFunc
let blackX: gsap.QuickToFunc
let purpleHeight: gsap.QuickToFunc
let purpleFaceLeft: gsap.QuickToFunc
let purpleFaceTop: gsap.QuickToFunc
let blackFaceLeft: gsap.QuickToFunc
let blackFaceTop: gsap.QuickToFunc
let orangeFaceX: gsap.QuickToFunc
let orangeFaceY: gsap.QuickToFunc
let yellowFaceX: gsap.QuickToFunc
let yellowFaceY: gsap.QuickToFunc
let mouthX: gsap.QuickToFunc
let mouthY: gsap.QuickToFunc

function calcPos(el: HTMLElement, mouseX: number, mouseY: number) {
  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 3
  const dx = mouseX - cx
  const dy = mouseY - cy

  const faceX = Math.max(-15, Math.min(15, dx / 20))
  const faceY = Math.max(-10, Math.min(10, dy / 30))
  const bodySkew = Math.max(-6, Math.min(6, -dx / 120))

  return { faceX, faceY, bodySkew }
}

function calcEyePos(el: HTMLElement, mouseX: number, mouseY: number, maxDist = 5) {
  const r = el.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  const dx = mouseX - cx
  const dy = mouseY - cy
  const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist)
  const angle = Math.atan2(dy, dx)
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
  }
}

function tick() {
  const container = containerRef.value
  if (!container)
    return

  const typing = props.isTyping
  const hiding = isHidingPassword.value
  const showing = isShowingPassword.value
  const looking = isLooking.value

  if (purpleRef.value && !showing) {
    const pp = calcPos(purpleRef.value, mousePosition.value.x, mousePosition.value.y)
    if (typing || hiding) {
      purpleSkew?.(pp.bodySkew - 12)
      purpleX?.(40)
      purpleHeight?.(440)
    }
    else {
      purpleSkew?.(pp.bodySkew)
      purpleX?.(0)
      purpleHeight?.(400)
    }
  }

  if (blackRef.value && !showing) {
    const bp = calcPos(blackRef.value, mousePosition.value.x, mousePosition.value.y)
    if (looking) {
      blackSkew?.(bp.bodySkew * 1.5 + 10)
      blackX?.(20)
    }
    else if (typing || hiding) {
      blackSkew?.(bp.bodySkew * 1.5)
      blackX?.(0)
    }
    else {
      blackSkew?.(bp.bodySkew)
      blackX?.(0)
    }
  }

  if (orangeRef.value && !showing) {
    const op = calcPos(orangeRef.value, mousePosition.value.x, mousePosition.value.y)
    orangeSkew?.(op.bodySkew)
  }

  if (yellowRef.value && !showing) {
    const yp = calcPos(yellowRef.value, mousePosition.value.x, mousePosition.value.y)
    yellowSkew?.(yp.bodySkew)
  }

  if (purpleRef.value && !showing && !looking) {
    const pp = calcPos(purpleRef.value, mousePosition.value.x, mousePosition.value.y)
    const purpleFaceX = pp.faceX >= 0 ? Math.min(25, pp.faceX * 1.5) : pp.faceX
    purpleFaceLeft?.(45 + purpleFaceX)
    purpleFaceTop?.(40 + pp.faceY)
  }

  if (blackRef.value && !showing && !looking) {
    const bp = calcPos(blackRef.value, mousePosition.value.x, mousePosition.value.y)
    blackFaceLeft?.(26 + bp.faceX)
    blackFaceTop?.(32 + bp.faceY)
  }

  if (orangeRef.value && !showing) {
    const op = calcPos(orangeRef.value, mousePosition.value.x, mousePosition.value.y)
    orangeFaceX?.(op.faceX)
    orangeFaceY?.(op.faceY)
  }

  if (yellowRef.value && !showing) {
    const yp = calcPos(yellowRef.value, mousePosition.value.x, mousePosition.value.y)
    yellowFaceX?.(yp.faceX)
    yellowFaceY?.(yp.faceY)
    mouthX?.(yp.faceX)
    mouthY?.(yp.faceY)
  }

  if (!showing) {
    const purePupils = container.querySelectorAll<HTMLElement>('.pupil')
    purePupils.forEach((el) => {
      const maxDist = Number(el.dataset.maxDistance) || 5
      const ePos = calcEyePos(el, mousePosition.value.x, mousePosition.value.y, maxDist)
      gsap.set(el, { x: ePos.x, y: ePos.y })
    })

    if (!looking) {
      const eyeballs = container.querySelectorAll<HTMLElement>('.eyeball')
      eyeballs.forEach((el) => {
        const maxDist = Number(el.dataset.maxDistance) || 10
        const pupil = el.querySelector<HTMLElement>('.eyeball-pupil')
        if (!pupil)
          return
        const ePos = calcEyePos(el, mousePosition.value.x, mousePosition.value.y, maxDist)
        gsap.set(pupil, { x: ePos.x, y: ePos.y })
      })
    }
  }

  rafId.value = requestAnimationFrame(tick)
}

function onMove(e: MouseEvent) {
  mousePosition.value = { x: e.clientX, y: e.clientY }
}

function initAnimations() {
  if (
    !purpleRef.value
    || !blackRef.value
    || !orangeRef.value
    || !yellowRef.value
    || !purpleFaceRef.value
    || !blackFaceRef.value
    || !orangeFaceRef.value
    || !yellowFaceRef.value
    || !yellowMouthRef.value
  ) {
    return
  }

  purpleSkew = gsap.quickTo(purpleRef.value, 'skewX', {
    duration: 0.3,
    ease: 'power2.out',
  })
  blackSkew = gsap.quickTo(blackRef.value, 'skewX', {
    duration: 0.3,
    ease: 'power2.out',
  })
  orangeSkew = gsap.quickTo(orangeRef.value, 'skewX', {
    duration: 0.3,
    ease: 'power2.out',
  })
  yellowSkew = gsap.quickTo(yellowRef.value, 'skewX', {
    duration: 0.3,
    ease: 'power2.out',
  })
  purpleX = gsap.quickTo(purpleRef.value, 'x', {
    duration: 0.3,
    ease: 'power2.out',
  })
  blackX = gsap.quickTo(blackRef.value, 'x', {
    duration: 0.3,
    ease: 'power2.out',
  })
  purpleHeight = gsap.quickTo(purpleRef.value, 'height', {
    duration: 0.3,
    ease: 'power2.out',
  })
  purpleFaceLeft = gsap.quickTo(purpleFaceRef.value, 'left', {
    duration: 0.3,
    ease: 'power2.out',
  })
  purpleFaceTop = gsap.quickTo(purpleFaceRef.value, 'top', {
    duration: 0.3,
    ease: 'power2.out',
  })
  blackFaceLeft = gsap.quickTo(blackFaceRef.value, 'left', {
    duration: 0.3,
    ease: 'power2.out',
  })
  blackFaceTop = gsap.quickTo(blackFaceRef.value, 'top', {
    duration: 0.3,
    ease: 'power2.out',
  })
  orangeFaceX = gsap.quickTo(orangeFaceRef.value, 'x', {
    duration: 0.2,
    ease: 'power2.out',
  })
  orangeFaceY = gsap.quickTo(orangeFaceRef.value, 'y', {
    duration: 0.2,
    ease: 'power2.out',
  })
  yellowFaceX = gsap.quickTo(yellowFaceRef.value, 'x', {
    duration: 0.2,
    ease: 'power2.out',
  })
  yellowFaceY = gsap.quickTo(yellowFaceRef.value, 'y', {
    duration: 0.2,
    ease: 'power2.out',
  })
  mouthX = gsap.quickTo(yellowMouthRef.value, 'x', {
    duration: 0.2,
    ease: 'power2.out',
  })
  mouthY = gsap.quickTo(yellowMouthRef.value, 'y', {
    duration: 0.2,
    ease: 'power2.out',
  })

  gsap.set(containerRef.value.querySelectorAll('.pupil, .eyeball-pupil'), { x: 0, y: 0 })
  tick()
}

function tweenPupils(root: HTMLElement | undefined, selector: string, x: number, y: number) {
  if (!root)
    return
  root.querySelectorAll<HTMLElement>(selector).forEach((pupil) => {
    gsap.to(pupil, { x, y, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
  })
}

function applyLookAtEachOther() {
  purpleFaceLeft?.(55)
  purpleFaceTop?.(65)
  blackFaceLeft?.(32)
  blackFaceTop?.(12)
  tweenPupils(purpleRef.value, '.eyeball-pupil', 3, 4)
  tweenPupils(blackRef.value, '.eyeball-pupil', 0, -4)
}

function applyHidingPassword() {
  purpleFaceLeft?.(55)
  purpleFaceTop?.(65)
}

function applyShowPassword() {
  purpleSkew?.(0)
  blackSkew?.(0)
  orangeSkew?.(0)
  yellowSkew?.(0)
  purpleX?.(0)
  blackX?.(0)
  purpleHeight?.(400)

  purpleFaceLeft?.(20)
  purpleFaceTop?.(35)
  blackFaceLeft?.(10)
  blackFaceTop?.(28)
  orangeFaceX?.(-32)
  orangeFaceY?.(-5)
  yellowFaceX?.(-32)
  yellowFaceY?.(-5)
  mouthX?.(-30)
  mouthY?.(0)

  tweenPupils(purpleRef.value, '.eyeball-pupil', -4, -4)
  tweenPupils(blackRef.value, '.eyeball-pupil', -4, -4)
  tweenPupils(orangeRef.value, '.pupil', -5, -4)
  tweenPupils(yellowRef.value, '.pupil', -5, -4)
}

function scheduleBlink(host: HTMLElement, timer: typeof purpleBlinkTimer, fallbackSize: number) {
  const eyeballs = host.querySelectorAll<HTMLElement>('.eyeball')
  if (!eyeballs.length)
    return

  const loop = () => {
    timer.value = setTimeout(
      () => {
        eyeballs.forEach(el => gsap.to(el, { height: 2, duration: 0.08, ease: 'power2.in' }))
        setTimeout(() => {
          eyeballs.forEach((el) => {
            const size = Number(el.style.width.replace('px', '')) || fallbackSize
            gsap.to(el, { height: size, duration: 0.08, ease: 'power2.out' })
          })
          loop()
        }, 150)
      },
      Math.random() * 4000 + 3000,
    )
  }
  loop()
}

function schedulePurplePeek() {
  const purpleEyePupils = purpleRef.value?.querySelectorAll<HTMLElement>('.eyeball-pupil')
  if (!purpleEyePupils?.length)
    return

  const loop = () => {
    purplePeekTimer.value = setTimeout(
      () => {
        purpleEyePupils.forEach((pupil) => {
          gsap.to(pupil, { x: 4, y: 5, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
        })
        purpleFaceLeft?.(20)
        purpleFaceTop?.(35)

        setTimeout(() => {
          purpleEyePupils.forEach((pupil) => {
            gsap.to(pupil, { x: -4, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
          })
          loop()
        }, 800)
      },
      Math.random() * 3000 + 2000,
    )
  }
  loop()
}

watch(
  () => [props.isTyping, isShowingPassword.value] as const,
  ([typing, showing]) => {
    if (typing && !showing) {
      clearTimeout(lookingTimer.value)
      isLooking.value = true
      applyLookAtEachOther()
      lookingTimer.value = setTimeout(() => {
        isLooking.value = false
        purpleRef.value?.querySelectorAll<HTMLElement>('.eyeball-pupil').forEach((pupil) => {
          gsap.killTweensOf(pupil)
        })
      }, 800)
      return
    }

    clearTimeout(lookingTimer.value)
    isLooking.value = false
  },
)

watch(
  () => [isHidingPassword.value, isShowingPassword.value] as const,
  ([hiding, showing]) => {
    if (showing) {
      applyShowPassword()
    }
    else if (hiding) {
      applyHidingPassword()
    }
  },
)

watch(
  () => [isShowingPassword.value, props.passwordLength] as const,
  ([showing, len]) => {
    clearTimeout(purplePeekTimer.value)
    if (showing && len > 0) {
      schedulePurplePeek()
    }
  },
)

onMounted(() => {
  window.addEventListener('mousemove', onMove, { passive: true })
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const scale = Math.min(width / props.sceneWidth, height / props.sceneHeight)
      sceneScale.value = Number.isFinite(scale) && scale > 0 ? scale : 1
    })
    resizeObserver.observe(containerRef.value)
  }
  setTimeout(() => {
    initAnimations()
    if (purpleRef.value)
      scheduleBlink(purpleRef.value, purpleBlinkTimer, 18)
    if (blackRef.value)
      scheduleBlink(blackRef.value, blackBlinkTimer, 16)
  }, 100)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMove)
  cancelAnimationFrame(rafId.value)
  clearTimeout(lookingTimer.value)
  clearTimeout(purpleBlinkTimer.value)
  clearTimeout(blackBlinkTimer.value)
  clearTimeout(purplePeekTimer.value)
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<template>
  <div ref="containerRef" class="animated-characters" :style="containerStyle">
    <div class="animated-scene" :style="sceneStyle">
      <div ref="purpleRef" class="character" :style="characterStyle('purple')">
        <div ref="purpleFaceRef" class="face-row" :style="faceStyle('purple')">
          <div class="eyeball eyeball-sm" data-max-distance="5">
            <div class="eyeball-pupil pupil-sm" />
          </div>
          <div class="eyeball eyeball-sm" data-max-distance="5">
            <div class="eyeball-pupil pupil-sm" />
          </div>
        </div>
      </div>

      <div ref="blackRef" class="character" :style="characterStyle('black')">
        <div ref="blackFaceRef" class="face-row" :style="faceStyle('black')">
          <div class="eyeball eyeball-xs" data-max-distance="4">
            <div class="eyeball-pupil pupil-xs" />
          </div>
          <div class="eyeball eyeball-xs" data-max-distance="4">
            <div class="eyeball-pupil pupil-xs" />
          </div>
        </div>
      </div>

      <div ref="orangeRef" class="character" :style="characterStyle('orange')">
        <div ref="orangeFaceRef" class="face-row" :style="faceStyle('orange')">
          <div class="pupil" data-max-distance="5" />
          <div class="pupil" data-max-distance="5" />
        </div>
      </div>

      <div ref="yellowRef" class="character" :style="characterStyle('yellow')">
        <div ref="yellowFaceRef" class="face-row" :style="faceStyle('yellow')">
          <div class="pupil" data-max-distance="5" />
          <div class="pupil" data-max-distance="5" />
        </div>
        <div ref="yellowMouthRef" class="yellow-mouth" :style="mouthStyle" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.animated-characters {
  position: relative;
  overflow: hidden;
}

.animated-scene {
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: center center;
}

.character {
  position: absolute;
  bottom: 0;
  transform-origin: bottom center;
  will-change: transform;
}

.face-row {
  position: absolute;
  display: flex;
  will-change: left, top;
}

.pupil {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #2d2d2d;
  will-change: transform;
}

.eyeball {
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  will-change: height;
}

.eyeball-sm {
  width: 18px;
  height: 18px;
}

.eyeball-xs {
  width: 16px;
  height: 16px;
}

.eyeball-pupil {
  border-radius: 50%;
  background: #2d2d2d;
  will-change: transform;
}

.pupil-sm {
  width: 7px;
  height: 7px;
}

.pupil-xs {
  width: 6px;
  height: 6px;
}

.yellow-mouth {
  position: absolute;
  will-change: transform;
}
</style>
