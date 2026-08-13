<script lang="ts" setup>
import type { ReportPreviewMode, ReportSchema, ReportSection } from './types'
import type { ApiDatasetDetail, ApiDatasetListItem } from '@/api/dataset'
import { Document, Grid, Minus, Picture, Refresh, Tickets } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import { fetchAllDatasets, fetchDatasetDetail } from '@/api/dataset'
import { getEmptyReportSchema, normalizeReportSchema } from './report-schema.utils'
import ReportSectionEditor from './ReportSectionEditor.vue'

const props = defineProps<{ initialSchema?: ReportSchema | null }>()
const emit = defineEmits<{ 'update:schema': [schema: ReportSchema], 'dirtyChange': [dirty: boolean] }>()

type SectionId = ReportSection['id']
type SectionEditor = InstanceType<typeof ReportSectionEditor>

const schema = ref<ReportSchema>(getEmptyReportSchema())
const activeSection = ref<SectionId>('body')
const previewMode = ref<ReportPreviewMode>('a4-portrait')
const baseline = ref('')
const initialized = ref(false)
const headerEditor = ref<SectionEditor | null>(null)
const bodyEditor = ref<SectionEditor | null>(null)
const footerEditor = ref<SectionEditor | null>(null)
const datasets = ref<ApiDatasetListItem[]>([])
const selectedDataset = ref<ApiDatasetDetail | null>(null)
const datasetsLoading = ref(false)
const fieldsLoading = ref(false)

const paperStyle = computed(() => {
  if (previewMode.value === 'online')
    return { maxWidth: `${schema.value.settings.online.maxWidth}px` }
  const landscape = previewMode.value === 'a4-landscape'
  const { margin } = schema.value.settings.page
  return { width: landscape ? '297mm' : '210mm', minHeight: landscape ? '210mm' : '297mm', padding: `${margin.top}mm ${margin.right}mm ${margin.bottom}mm ${margin.left}mm` }
})

const activeEditor = computed(() => ({ header: headerEditor.value, body: bodyEditor.value, footer: footerEditor.value }[activeSection.value]))
const activeFormats = computed(() => activeEditor.value?.activeFormats ?? { bold: false, italic: false, bulletList: false, orderedList: false })

function cloneSchema() {
  return JSON.parse(JSON.stringify(schema.value)) as ReportSchema
}

function syncSavedBaseline() {
  baseline.value = JSON.stringify(schema.value)
  emit('dirtyChange', false)
}

function sectionName(section: SectionId) {
  return { header: '页眉', body: '正文', footer: '页脚' }[section]
}

function updateSection(section: SectionId, content: ReportSection['content']) {
  schema.value.sections[section].content = content
}

function activateSection(section: SectionId) {
  activeSection.value = section
  requestAnimationFrame(() => activeEditor.value?.focus())
}

function insertField(fieldName: string) {
  activeEditor.value?.insertText(`{{${selectedDataset.value?.name}.${fieldName}}}`)
}

function setPreviewMode(mode: ReportPreviewMode) {
  previewMode.value = mode
  if (mode !== 'online')
    schema.value.settings.page.orientation = mode === 'a4-landscape' ? 'landscape' : 'portrait'
}

async function loadDatasets() {
  datasetsLoading.value = true
  try {
    datasets.value = await fetchAllDatasets()
    if (datasets.value[0] && !selectedDataset.value)
      await selectDataset(datasets.value[0].id)
  }
  catch (error) { ElMessage.error((error as Error).message || '加载数据集失败') }
  finally { datasetsLoading.value = false }
}

async function selectDataset(id: string) {
  fieldsLoading.value = true
  try {
    selectedDataset.value = await fetchDatasetDetail(id)
  }
  catch (error) {
    ElMessage.error((error as Error).message || '加载字段失败')
  }
  finally {
    fieldsLoading.value = false
  }
}

watch(() => props.initialSchema, (value) => {
  if (initialized.value)
    return
  schema.value = normalizeReportSchema(value ?? getEmptyReportSchema())
  previewMode.value = schema.value.settings.page.orientation === 'landscape' ? 'a4-landscape' : 'a4-portrait'
  initialized.value = true
  syncSavedBaseline()
}, { immediate: true })
watch(schema, () => {
  if (!initialized.value)
    return
  emit('update:schema', cloneSchema())
  emit('dirtyChange', JSON.stringify(schema.value) !== baseline.value)
}, { deep: true })

onMounted(() => {
  void loadDatasets()
})
defineExpose({ getSchema: cloneSchema, syncSavedBaseline })
</script>

<template>
  <div class="report-designer">
    <aside v-loading="datasetsLoading" class="report-designer__datasets" aria-label="数据集字段">
      <header class="report-designer__datasets-header">
        <div><strong>数据集字段</strong><small>点击字段插入当前光标位置</small></div><el-button text :icon="Refresh" aria-label="刷新数据集" @click="loadDatasets" />
      </header>
      <div v-if="datasets.length" class="report-designer__dataset-list">
        <button v-for="dataset in datasets" :key="dataset.id" type="button" class="report-designer__dataset" :class="{ 'is-selected': selectedDataset?.id === dataset.id }" @click="selectDataset(dataset.id)">
          <el-icon><Tickets /></el-icon><span>{{ dataset.name }}</span><small>{{ dataset.field_count }} 字段</small>
        </button>
      </div>
      <el-empty v-else :image-size="56" description="暂无可用数据集" />
      <div v-if="selectedDataset" v-loading="fieldsLoading" class="report-designer__fields">
        <div class="report-designer__fields-title">
          {{ selectedDataset.name }}
        </div><button v-for="field in selectedDataset.fields" :key="field.id" type="button" class="report-designer__field" @click="insertField(field.name)">
          <el-icon><Document /></el-icon><span>{{ field.name }}</span><small>{{ field.field_type }}</small>
        </button>
      </div>
    </aside>

    <main class="report-designer__workspace">
      <div class="report-designer__toolbar" aria-label="文档工具栏">
        <div class="report-designer__format-tools">
          <el-button-group><el-button :type="activeFormats.bold ? 'primary' : 'default'" :icon="Document" aria-label="加粗" @click="activeEditor?.toggleBold()" /><el-button :type="activeFormats.italic ? 'primary' : 'default'" :icon="Grid" aria-label="斜体" @click="activeEditor?.toggleItalic()" /></el-button-group><el-button-group><el-button :type="activeFormats.bulletList ? 'primary' : 'default'" :icon="Grid" aria-label="项目符号" @click="activeEditor?.toggleBulletList()" /><el-button :type="activeFormats.orderedList ? 'primary' : 'default'" :icon="Document" aria-label="编号列表" @click="activeEditor?.toggleOrderedList()" /></el-button-group><el-button-group>
            <el-button @click="activeEditor?.toggleHeading(1)">
              标题 1
            </el-button><el-button @click="activeEditor?.toggleHeading(2)">
              标题 2
            </el-button>
          </el-button-group><el-button :icon="Picture" @click="activeEditor?.insertImage()">
            图片
          </el-button><el-button :icon="Minus" @click="activeEditor?.insertDivider()">
            分隔线
          </el-button>
        </div>
        <div class="report-designer__mode-tools">
          <el-radio-group :model-value="previewMode" size="small" @change="setPreviewMode">
            <el-radio-button label="a4-portrait">
              A4 纵向
            </el-radio-button><el-radio-button label="a4-landscape">
              A4 横向
            </el-radio-button><el-radio-button label="online">
              在线
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>
      <div class="report-designer__canvas-scroll">
        <div class="report-designer__paper" :class="`report-designer__paper--${previewMode}`" :style="paperStyle">
          <section class="report-designer__section report-designer__section--header" :class="{ 'is-active': activeSection === 'header' }" @click="activateSection('header')">
            <button type="button" class="report-designer__section-label" @click.stop="activateSection('header')">
              页眉
            </button><ReportSectionEditor ref="headerEditor" :content="schema.sections.header.content" placeholder="输入页眉内容…" @update="updateSection('header', $event)" />
          </section>
          <section class="report-designer__section report-designer__section--body" :class="{ 'is-active': activeSection === 'body' }" @click="activateSection('body')">
            <button type="button" class="report-designer__section-label" @click.stop="activateSection('body')">
              正文
            </button><ReportSectionEditor ref="bodyEditor" :content="schema.sections.body.content" placeholder="像使用 Word 一样开始输入内容，或从左侧插入数据集字段…" @update="updateSection('body', $event)" />
          </section>
          <section class="report-designer__section report-designer__section--footer" :class="{ 'is-active': activeSection === 'footer' }" @click="activateSection('footer')">
            <button type="button" class="report-designer__section-label" @click.stop="activateSection('footer')">
              页脚
            </button><ReportSectionEditor ref="footerEditor" :content="schema.sections.footer.content" placeholder="输入页脚内容…" @update="updateSection('footer', $event)" />
          </section>
        </div>
      </div>
      <footer class="report-designer__status">
        正在编辑：{{ sectionName(activeSection) }} · {{ previewMode === 'online' ? '响应式在线文档' : 'A4 页面' }}
      </footer>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.report-designer {
  display: flex;
  height: 100%;
  min-height: 0;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color-page);
}
.report-designer__datasets {
  z-index: 1;
  width: 276px;
  flex: 0 0 276px;
  overflow: auto;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
}
.report-designer__datasets-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.report-designer__datasets-header div {
  display: grid;
  gap: 4px;
}
.report-designer__datasets-header small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.report-designer__dataset-list {
  display: grid;
  gap: 4px;
  padding: 10px;
}
.report-designer__dataset {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 9px;
  text-align: left;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
}
.report-designer__dataset:hover,
.report-designer__dataset.is-selected {
  background: var(--el-fill-color-light);
  border-color: var(--el-color-primary-light-5);
}
.report-designer__dataset span,
.report-designer__field span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.report-designer__dataset small,
.report-designer__field small {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}
.report-designer__fields {
  padding: 12px 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.report-designer__fields-title {
  padding: 0 6px 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.report-designer__field {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 8px 6px;
  text-align: left;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 4px;
}
.report-designer__field:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}
.report-designer__workspace {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.report-designer__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 58px;
  padding: 8px 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}
.report-designer__format-tools,
.report-designer__mode-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.report-designer__canvas-scroll {
  min-height: 0;
  flex: 1;
  padding: 32px clamp(16px, 7vw, 96px);
  overflow: auto;
}
.report-designer__paper {
  box-sizing: border-box;
  margin: 0 auto;
  background: var(--el-bg-color);
  box-shadow: var(--ds-shadow-card-lg, 0 12px 34px rgb(0 0 0 / 12%));
}
.report-designer__paper--online {
  width: 100%;
  min-height: 100%;
  padding: 48px clamp(32px, 7vw, 96px);
}
.report-designer__section {
  position: relative;
  min-height: 68px;
  padding: 16px;
  border: 1px solid transparent;
  border-radius: 3px;
}
.report-designer__section + .report-designer__section {
  margin-top: 28px;
}
.report-designer__section--header {
  border-bottom-color: var(--el-border-color-lighter);
}
.report-designer__section--footer {
  color: var(--el-text-color-secondary);
  border-top-color: var(--el-border-color-lighter);
}
.report-designer__section.is-active {
  background: color-mix(in srgb, var(--el-color-primary) 5%, transparent);
  border-color: var(--el-color-primary-light-5);
}
.report-designer__section-label {
  position: absolute;
  top: -11px;
  left: -10px;
  z-index: 1;
  padding: 3px 7px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  cursor: pointer;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}
.report-designer__section.is-active .report-designer__section-label {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}
.report-designer__status {
  padding: 8px 16px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-light);
}
.report-designer button:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}
@media (max-width: 760px) {
  .report-designer__datasets {
    width: 220px;
    flex-basis: 220px;
  }
  .report-designer__toolbar {
    justify-content: flex-start;
  }
  .report-designer__canvas-scroll {
    padding: 16px;
  }
}
</style>
