import type { Animation } from '@/visual-editor/visual-editor.utils'
import { CaretRight, Delete, Plus, VideoPlay } from '@element-plus/icons-vue'
import { onClickOutside } from '@vueuse/core'
import { ElButton, ElIcon, ElSwitch, ElTabPane, ElTabs, ElTooltip } from 'element-plus'
import { defineComponent, reactive, ref, watchEffect } from 'vue'
import { useAnimate } from '@/hooks/useAnimate'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { getBlockAnimationElement } from '@/visual-editor/visual-editor.utils'
import styles from './animate.module.scss'
import { animationTabs } from './animateConfig'

export const Animate = defineComponent({
  setup() {
    const { currentBlock } = useVisualData()
    const target = ref<InstanceType<typeof HTMLDivElement>>()

    const state = reactive({
      activeName: '',
      isAddAnimates: false, // 是否显示添加动画集
      changeTargetIndex: -1, // 要修改的动画的索引
    })

    onClickOutside(target, () => {
      if (state.isAddAnimates) {
        state.isAddAnimates = false
      }
    })

    watchEffect(() => {
      if (state.isAddAnimates) {
        state.activeName = 'in'
      }
      else {
        state.changeTargetIndex = -1
      }
    })

    /**
     * @description 运行动画
     */
    const runAnimation = (animation: Animation | Animation[] = []) => {
      const animateEl = getBlockAnimationElement(currentBlock.value?._vid)
      if (animateEl) {
        useAnimate(animateEl, animation)
      }
    }

    /**
     * @description 点击要修改的动画名称
     */
    const clickAnimateName = (index: number) => {
      state.changeTargetIndex = index
      state.isAddAnimates = true
    }

    /**
     * @description 删除动画
     */
    const delAnimate = (index: number) => {
      currentBlock.value.animations?.splice(index, 1)
    }

    /**
     * @description 添加/修改动画
     */
    const addOrChangeAnimate = (animateItem: Animation) => {
      const animation: Animation = {
        ...animateItem,
      }
      if (state.changeTargetIndex === -1) {
        currentBlock.value.animations?.push(animation)
      }
      else {
        currentBlock.value.animations![state.changeTargetIndex] = animation
        state.changeTargetIndex = -1
      }
      state.isAddAnimates = false
    }

    // 已添加的动画列表面板
    const AddedAnimateList = () => {
      const animations = currentBlock.value.animations
      if (!animations || animations.length === 0) {
        return (
          <div class="animate-empty">
            <span class="animate-empty__icon">🎬</span>
            <span>暂无动画，点击上方按钮添加</span>
          </div>
        )
      }

      return (
        <div class="animate-list">
          {animations.map((item, index) => (
            <div key={item.value + index} class="animate-card">
              <div class="animate-card__header">
                <span class="animate-card__index">{index + 1}</span>
                <span class="animate-card__label" onClick={() => clickAnimateName(index)}>
                  {item.label}
                </span>
                <ElTooltip content="播放动画" placement="top" offset={4}>
                  <span class="animate-card__play" onClick={() => runAnimation(item)} title="播放">
                    <ElIcon size={16}>
                      <VideoPlay />
                    </ElIcon>
                  </span>
                </ElTooltip>
                <ElTooltip content="删除动画" placement="top" offset={4}>
                  <span class="animate-card__delete" onClick={() => delAnimate(index)} title="删除">
                    <ElIcon size={14}>
                      <Delete />
                    </ElIcon>
                  </span>
                </ElTooltip>
              </div>
              <div class="animate-card__params">
                <div class="animate-card__param">
                  <span class="animate-card__param-label">持续(s)</span>
                  <input v-model={item.duration} type="number" step={0.1} min={0} placeholder="1" />
                </div>
                <div class="animate-card__param">
                  <span class="animate-card__param-label">延迟(s)</span>
                  <input v-model={item.delay} type="number" step={0.1} min={0} placeholder="0" />
                </div>
                <div class="animate-card__param">
                  <span class="animate-card__param-label">次数</span>
                  <input v-model={item.count} type="number" min={0} placeholder="1" />
                </div>
              </div>
              <div class="animate-card__loop">
                <ElSwitch v-model={item.infinite} size="small" />
                <span>循环播放</span>
              </div>
            </div>
          ))}
        </div>
      )
    }

    // 可选动画列表（选择/添加动画模式）
    const AnimatePicker = () => (
      <div class="animate-picker">
        <ElButton
          class="animate-back"
          size="small"
          text
          onClick={() => {
            state.isAddAnimates = false
            state.changeTargetIndex = -1
          }}
        >
          ← 返回列表
        </ElButton>
        <ElTabs v-model={state.activeName} stretch>
          {Object.entries(animationTabs).map(([tabKey, animationBox]) => (
            <ElTabPane label={animationBox.label} name={tabKey} key={tabKey}>
              <div class="animate-grid">
                {animationBox.value.map((animateItem: Animation) => (
                  <div
                    class="animate-item"
                    key={animateItem.value}
                    onClick={() => addOrChangeAnimate(animateItem)}
                    onMouseenter={() => runAnimation(animateItem)}
                  >
                    {animateItem.label}
                  </div>
                ))}
              </div>
            </ElTabPane>
          ))}
        </ElTabs>
      </div>
    )

    return () => (
      <div ref={target} class={styles.animate}>
        {!state.isAddAnimates
          ? (
              <>
                <div class="animate-actions">
                  <ElButton
                    type="primary"
                    disabled={!currentBlock.value.animations}
                    plain
                    icon={Plus}
                    onClick={() => (state.isAddAnimates = true)}
                  >
                    添加动画
                  </ElButton>
                  <ElButton
                    type="primary"
                    disabled={!currentBlock.value.animations?.length}
                    plain
                    icon={CaretRight}
                    onClick={() => runAnimation(currentBlock.value.animations)}
                  >
                    播放全部
                  </ElButton>
                </div>
                <AddedAnimateList />
              </>
            )
          : (
              <AnimatePicker />
            )}
      </div>
    )
  },
})
