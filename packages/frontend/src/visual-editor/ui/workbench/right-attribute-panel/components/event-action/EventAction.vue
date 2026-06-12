<script setup lang="tsx">
import type { Action } from '@/visual-editor/visual-editor.utils'
import {
  ElButton,
  ElCard,
  ElCascader,
  ElCollapse,
  ElCollapseItem,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElPopconfirm,
  ElSelect,
} from 'element-plus'
import { cloneDeep } from 'lodash-es'
import { computed, ref } from 'vue'
import { useModal } from '@/visual-editor/hooks/useModal'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { generateNanoid } from '@/visual-editor/lib'

// 页面/组件数据
const { currentBlock, currentPage, jsonData } = useVisualData()

// 折叠面板激活的项
const activeNames = ref<string[]>([])

// 当前正在编辑的事件表单
const ruleForm = ref<Action>(createEmptyAction())

// 表单实例引用
const ruleFormRef = ref<InstanceType<typeof ElForm>>()

// 是否处于编辑状态（用于模态框标题）
const isEdit = computed(() =>
  currentBlock.value?.actions?.some(item => item.key === ruleForm.value.key),
)

// 创建一个空的动作处理对象（handle 子项）
function createEmptyActionHandle() {
  return {
    key: generateNanoid(),
    name: '',
    link: [] as string[],
  }
}

// 创建一个空的事件（action）
function createEmptyAction(): Action {
  return {
    key: generateNanoid(),
    name: '',
    event: '',
    handle: [createEmptyActionHandle()],
  }
}

// 可绑定的动作选项（级联选择器数据）
const actionOptions = computed(() => [
  {
    label: '全局',
    value: 'global',
    children: Object.keys(jsonData.value.actions).map((actionKey) => {
      const item = cloneDeep(jsonData.value.actions[actionKey])
      item.value = actionKey
      item.label = item.name
      const arrKey = Object.keys(item).find(key => Array.isArray(item[key]))
      item.children = (item[arrKey] || []).map((child: any) => {
        child.label = child.name
        child.value = child.key
        return child
      })
      return item
    }),
  },
  {
    label: '组件',
    value: 'component',
    children: cloneDeep(currentPage.value?.blocks || [])
      .filter(item => item.actions?.length)
      .map((item) => {
        item.value = item._vid
        item.children = (item.actions || []).map((act: any) => {
          act.label = act.name
          act.value = act.key
          return act
        })
        return item
      }),
  },
])

// 根据 link 数组生成可读的路径字符串
function getActionPath(link: string[]) {
  const result: string[] = []
  link.reduce((prev, curr) => {
    const target = prev?.find(item => item.value == curr)
    result.push(target?.label ?? '')
    return target?.children
  }, actionOptions.value)
  return result.join(' => ')
}

// 从当前组件的事件列表中删除整个事件
function deleteActionItem(key: string) {
  const idx = currentBlock.value?.actions?.findIndex(item => item.key === key)
  if (idx !== undefined && idx !== -1) {
    currentBlock.value.actions.splice(idx, 1)
  }
}

// 删除当前编辑事件下的某个动作处理项
function deleteActionHandleItem(index: number) {
  ruleForm.value.handle.splice(index, 1)
}

// 新增事件（打开空白模态框）
function addActionItem() {
  ruleForm.value = createEmptyAction()
  showOperateModal()
}

// 为当前编辑的事件增加一个空动作处理项
function addActionHandleItem() {
  ruleForm.value.handle.push(createEmptyActionHandle())
}

// 编辑已有事件
function showEditActionModal(action: Action) {
  ruleForm.value = cloneDeep(action)
  showOperateModal()
}

// 显示事件/动作编辑模态框
function showOperateModal() {
  const operateType = isEdit.value ? '编辑' : '新增'
  useModal({
    title: `${operateType}动作`,
    props: { width: 600 },
    // 以下 content 保留 JSX 写法，保持与原有逻辑一致
    content: () => (
      <ElForm model={ruleForm.value} ref={ruleFormRef} label-width="100px">
        <ElFormItem
          label="事件"
          prop="event"
          rules={[{ required: true, message: '请选择事件', trigger: 'change' }]}
        >
          <ElSelect v-model={ruleForm.value.event} class="w-full">
            {currentBlock.value?.events?.map(eventItem => (
              <ElOption
                key={eventItem.value}
                label={eventItem.label}
                value={eventItem.value}
              />
            ))}
          </ElSelect>
        </ElFormItem>
        <ElFormItem
          label="事件名称"
          prop="name"
          rules={[{ required: true, message: '请输入事件名称', trigger: 'change' }]}
        >
          <ElInput v-model={ruleForm.value.name} placeholder="请输入事件名称" />
        </ElFormItem>

        {!ruleForm.value.handle?.length && (
          <ElFormItem>
            <ElButton onClick={addActionHandleItem} type="primary">
              添加动作
            </ElButton>
          </ElFormItem>
        )}

        {ruleForm.value.handle.map((handleItem, index) => (
          <ElCard
            key={handleItem.key}
            shadow="hover"
            class="mt-10px"
            v-slots={{
              header: () => (
                <div class="flex justify-between">
                  <ElFormItem
                    label="动作名称"
                    prop={`handle.${index}.name`}
                    rules={[
                      { required: true, message: '请输入动作名称', trigger: 'change' },
                    ]}
                  >
                    <ElInput v-model={handleItem.name} placeholder="请输入动作名称" />
                  </ElFormItem>
                  <div>
                    <ElButton onClick={() => deleteActionHandleItem(index)} type="danger">
                      删除
                    </ElButton>
                    <ElButton onClick={addActionHandleItem} type="primary">
                      添加
                    </ElButton>
                  </div>
                </div>
              ),
            }}
          >
            <ElFormItem
              label="触发的动作"
              prop={`handle.${index}.link`}
              rules={[
                { required: true, message: '请选择你要触发的动作', trigger: 'change' },
              ]}
            >
              <ElCascader
                clearable={true}
                class="w-full"
                placeholder="请选择你要触发的动作"
                v-model={handleItem.link}
                options={actionOptions.value}
              />
            </ElFormItem>
          </ElCard>
        ))}
      </ElForm>
    ),
    onConfirm: () => {
      return new Promise((resolve, reject) => {
        ruleFormRef.value?.validate((valid) => {
          if (valid) {
            const index = currentBlock.value?.actions?.findIndex(
              item => item.key === ruleForm.value.key,
            )
            if (index === -1 || index === undefined) {
              currentBlock.value?.actions?.push(ruleForm.value)
            }
            else {
              currentBlock.value?.actions?.splice(index, 1, ruleForm.value)
            }
            ruleForm.value = createEmptyAction()
            resolve('submit!')
          }
          else {
            reject()
            console.log('error submit!!')
          }
        })
      })
    },
    onCancel: () => {
      ruleForm.value = createEmptyAction()
    },
  })
}
</script>

<template>
  <div class="w-full h-full p-3">
    <ElButton :disabled="!currentBlock?.actions" type="primary" @click="addActionItem">
      添加事件
    </ElButton>

    <ElCard v-for="actionItem in currentBlock?.actions || []" :key="actionItem.key" class="mt-10px">
      <template #header>
        <div class="flex justify-between">
          {{ actionItem.name }}
          <div>
            <ElPopconfirm title="确定要删除该事件吗？" @confirm="() => deleteActionItem(actionItem.key)">
              <template #reference>
                <ElButton type="danger">
                  删除
                </ElButton>
              </template>
            </ElPopconfirm>
            <ElButton type="primary" @click="() => showEditActionModal(actionItem)">
              编辑
            </ElButton>
          </div>
        </div>
      </template>

      <ElCollapse v-model="activeNames">
        <ElCollapseItem
          v-for="(item, idx) in actionItem.handle"
          :key="item.key"
          :name="item.key"
          :title="`${idx + 1}. ${item.name}`"
        >
          <div>动作路径：{{ getActionPath(item.link) }}</div>
        </ElCollapseItem>
      </ElCollapse>
    </ElCard>
  </div>
</template>
