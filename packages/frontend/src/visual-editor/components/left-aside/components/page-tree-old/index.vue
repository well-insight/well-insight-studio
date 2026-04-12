<!-- 页面树 -->
<script lang="tsx" setup>
import type { VisualEditorPage } from '@/visual-editor/visual-editor.utils'
import { Delete, Edit, Link, MoreFilled, Plus, Search, Tickets } from '@element-plus/icons-vue'
import { ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useModal } from '@/visual-editor/hooks/useModal'
import { createNewPage, useVisualData } from '@/visual-editor/hooks/useVisualData'

defineOptions({
  name: 'PageTree',
  label: '页面',
  order: 1,
  icon: Tickets,
})

const rules = {
  title: [{ required: true, message: '请输入页面标题', trigger: 'blur' }],
  path: [{ required: true, message: '请输入页面路径', trigger: 'blur' }],
}

const router = useRouter()
const route = useRoute()

const { jsonData: jsonDataRef, setCurrentPage, deletePage, updatePage, incrementPage } = useVisualData()

const ruleFormRef = ref<InstanceType<typeof ElForm>>()

const defaultProps = ref({
  children: 'children',
  label: 'title',
})
const currentNodeKey = ref(route.path)
// 当前要增加或修改的页面
const operatePageData = ref<VisualEditorPage | null>(null)
// 增改页面表单数据
const form = ref({
  title: '',
  path: '',
})

// 所有的页面
const pages = computed(() =>
  Object.keys(jsonDataRef.value.pages).map(key => ({
    title: jsonDataRef.value.pages[key].title,
    path: key,
  })),
)

// 点击当前节点
function handleNodeClick(data) {
  // setCurrentPage(data.path)
  // router.push(data.path)
}

/**
 * @description 显示新增/编辑模态框
 */
function showOparateModal() {
  return useModal({
    title: operatePageData.value ? '编辑页面' : '新增页面',
    props: {
      width: 380,
    },
    content: () => (
      <ElForm ref={ruleFormRef} model={form.value} rules={rules}>
        <ElFormItem prop="title" label="页面标题" labelWidth="80px">
          <ElInput v-model={form.value.title} />
        </ElFormItem>
        <ElFormItem prop="path" label="页面路径" labelWidth="80px">
          <ElInput v-model={form.value.path} />
        </ElFormItem>
      </ElForm>
    ),
    onConfirm: () => {
      return new Promise((resolve, reject) => {
        ruleFormRef.value?.validate(async (valid) => {
          if (valid) {
            const { title, path } = form.value
            if ([title.trim(), path.trim()].includes('')) {
              return ElMessage.error('标题或路径不能为空！')
            }
            if (operatePageData.value) {
              updatePage({
                newPath: path,
                oldPath: operatePageData.value.path || path,
                page: { title },
              })
              // await router.replace(path)
              currentNodeKey.value = path
            }
            else {
              incrementPage(path, createNewPage({ title }))
            }
            resolve(true)
          }
          else {
            console.log('error submit!!')
            reject()
            return false
          }
        })
      })
    },
  })
}

// 新增页面
function addPage() {
  operatePageData.value = null
  form.value = {
    title: '',
    path: '',
  }
  showOparateModal()
}
// 编辑页面
function editPage(data) {
  operatePageData.value = data
  form.value = {
    title: data.title,
    path: data.path,
  }
  showOparateModal()
  console.log('子页面数据：', data)
}
// 删除子页面
function delPage(data) {
  console.log('删除子页面数据', data)
  deletePage(data.path, '/')
}
// 设置为默认页面
function setDefaultPage(data) {
  console.log('设置该页面为默认页面', data)
}
</script>

<template>
  <div class="full w-full flex flex-col">
    <div class="w-full h-[50px] flex items-center justify-between px-3 border-bottom-1">
      <el-text>页面</el-text>
      <el-space>
        <el-button :icon="Search" link />
        <el-button :icon="Plus" link @click="addPage" />
      </el-space>
    </div>
  </div>
  <el-tree
    :data="pages"
    :props="defaultProps"
    class="custom-el-tree-wrapper"
    node-key="path"
    highlight-current
    :current-node-key="currentNodeKey"
    @node-click="handleNodeClick"
  >
    <template #default="{ node, data }">
      <span class="custom-tree-node">
        <span
          >{{ node.label }}（{{ data.path }}）
          <template v-if="data.isDefault">
            <el-tag size="default">默认</el-tag>
          </template>
        </span>
        <span @click.stop>
          <el-dropdown trigger="click">
            <span class="el-dropdown-link">
              <el-icon>
                <MoreFilled />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :icon="Edit" @click="editPage(data)">编辑</el-dropdown-item>
                <el-dropdown-item :icon="Delete" @click="delPage(data)">删除</el-dropdown-item>
                <el-dropdown-item :icon="Link" @click="setDefaultPage(data)">设为首页</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </span>
      </span>
    </template>
  </el-tree>
</template>

<style lang="scss" scoped>
.custom-tree-node {
  display: flex;
  padding-right: 8px;
  font-size: 14px;
  flex: 1;
  align-items: center;
  justify-content: space-between;
}
</style>
