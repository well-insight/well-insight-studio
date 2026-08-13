<script lang="ts" setup>
import type { ReportDocument } from './types'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { ElMessageBox } from 'element-plus'
import { computed, onBeforeUnmount, watch } from 'vue'

const props = withDefaults(defineProps<{
  content: ReportDocument
  editable?: boolean
  placeholder?: string
}>(), {
  editable: true,
  placeholder: '输入内容…',
})

const emit = defineEmits<{ update: [content: ReportDocument] }>()

const editor = useEditor({
  content: props.content,
  editable: props.editable,
  extensions: [
    StarterKit,
    Image.configure({ inline: false, allowBase64: false }),
    Placeholder.configure({ placeholder: props.placeholder }),
  ],
  onUpdate: ({ editor }) => emit('update', editor.getJSON() as ReportDocument),
})

const activeFormats = computed(() => ({
  bold: editor.value?.isActive('bold') ?? false,
  italic: editor.value?.isActive('italic') ?? false,
  bulletList: editor.value?.isActive('bulletList') ?? false,
  orderedList: editor.value?.isActive('orderedList') ?? false,
}))

watch(() => props.editable, editable => editor.value?.setEditable(editable))
watch(() => props.content, (content) => {
  if (!editor.value || JSON.stringify(editor.value.getJSON()) === JSON.stringify(content))
    return
  editor.value.commands.setContent(content, { emitUpdate: false })
}, { deep: true })

function focus() {
  editor.value?.commands.focus('end')
}

async function insertImage() {
  try {
    const { value } = await ElMessageBox.prompt('请输入图片地址', '插入图片', {
      confirmButtonText: '插入',
      cancelButtonText: '取消',
      inputPlaceholder: 'https://example.com/image.png',
      inputPattern: /^https?:\/\//,
      inputErrorMessage: '请输入有效的 http 或 https 图片地址',
    })
    if (value)
      editor.value?.chain().focus().setImage({ src: value.trim(), alt: '报表图片' }).run()
  }
  catch {
    // 用户取消插入，无需反馈错误。
  }
}

function insertText(text: string) {
  editor.value?.chain().focus().insertContent(text).run()
}

defineExpose({
  activeFormats,
  focus,
  insertText,
  insertImage,
  insertDivider: () => editor.value?.chain().focus().setHorizontalRule().run(),
  insertParagraph: () => editor.value?.chain().focus().insertContent('<p></p>').run(),
  toggleBold: () => editor.value?.chain().focus().toggleBold().run(),
  toggleItalic: () => editor.value?.chain().focus().toggleItalic().run(),
  toggleBulletList: () => editor.value?.chain().focus().toggleBulletList().run(),
  toggleOrderedList: () => editor.value?.chain().focus().toggleOrderedList().run(),
  toggleHeading: (level: 1 | 2 | 3) => editor.value?.chain().focus().toggleHeading({ level }).run(),
})

onBeforeUnmount(() => editor.value?.destroy())
</script>

<template>
  <div class="report-section-editor" :class="{ 'is-readonly': !editable }" @click="focus">
    <EditorContent :editor="editor" />
  </div>
</template>

<style lang="scss" scoped>
.report-section-editor {
  min-height: 44px;
  cursor: text;
}
.report-section-editor :deep(.tiptap) {
  min-height: 44px;
  outline: none;
}
.report-section-editor :deep(.tiptap > :first-child) {
  margin-top: 0;
}
.report-section-editor :deep(.tiptap > :last-child) {
  margin-bottom: 0;
}
.report-section-editor :deep(.tiptap h1),
.report-section-editor :deep(.tiptap h2),
.report-section-editor :deep(.tiptap h3) {
  margin: 1.1em 0 0.55em;
  line-height: 1.25;
}
.report-section-editor :deep(.tiptap p) {
  margin: 0.65em 0;
  line-height: 1.8;
}
.report-section-editor :deep(.tiptap img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 1rem 0;
}
.report-section-editor :deep(.tiptap hr) {
  margin: 1.25rem 0;
  border: 0;
  border-top: 1px solid var(--el-border-color);
}
.report-section-editor :deep(.tiptap .is-editor-empty:first-child::before) {
  float: left;
  height: 0;
  color: var(--el-text-color-placeholder);
  pointer-events: none;
  content: attr(data-placeholder);
}
.report-section-editor.is-readonly {
  min-height: 0;
  cursor: default;
}
.report-section-editor.is-readonly :deep(.tiptap) {
  min-height: 0;
}
</style>
