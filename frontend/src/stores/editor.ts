import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { EditorMode } from '@/types'

export const useEditorStore = defineStore('editor', () => {
  // State
  const content = ref(`# Welcome to SimpleTextEditor

一个功能强大的 Markdown 编辑器，支持实时协作。

## 基础格式

**粗体** *斜体* ~~删除线~~ ==高亮==

H~2~O 水分子 (下标)
X^2^ 平方 (上标)

## 列表

### 无序列表
- 项目 1
- 项目 2
  - 嵌套项目

### 任务列表
- [x] 已完成任务
- [ ] 待办任务
- [ ] 另一个待办

## 代码

行内代码: \`const x = 1\`

\`\`\`javascript
// 代码块示例
function hello(name) {
  console.log(\`Hello, \${name}!\`);
}
hello("World");
\`\`\`

## 表格

| 功能 | 状态 | 说明 |
|------|------|------|
| Markdown | ✅ | 完整支持 |
| 数学公式 | ✅ | KaTeX |
| 图表 | ✅ | Mermaid |

## 数学公式

行内公式: $E = mc^2$

块级公式:
$$
\\sum_{i=1}^n a_i = a_1 + a_2 + \\cdots + a_n
$$

## Mermaid 图表

\`\`\`mermaid
graph LR
    A[开始] --> B{判断}
    B -->|是| C[执行]
    B -->|否| D[结束]
    C --> D
\`\`\`

## 引用

> 这是一段引用文字。
>
> — 作者

## 脚注

这是一个带脚注的文本[^1]。

[^1]: 这是脚注内容。

---

开始编辑你的文档吧！ :smile:
`)
  const mode = ref<EditorMode>('split')
  const isDirty = ref(false)
  const isSaving = ref(false)
  const cursorLine = ref(1)
  const cursorColumn = ref(1)

  // Computed
  const wordCount = computed(() => {
    const text = content.value.trim()
    if (!text) return 0
    // Count Chinese characters and English words
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = text.replace(/[\u4e00-\u9fa5]/g, ' ').split(/\s+/).filter(w => w.length > 0).length
    return chineseChars + englishWords
  })

  const charCount = computed(() => content.value.length)

  const readingTime = computed(() => {
    // Average reading speed: 200 words per minute for Chinese, 250 for English
    const minutes = Math.ceil(wordCount.value / 200)
    return minutes < 1 ? '< 1' : String(minutes)
  })

  // Actions
  function setContent(newContent: string) {
    content.value = newContent
    isDirty.value = true
  }

  function setMode(newMode: EditorMode) {
    mode.value = newMode
  }

  function setCursorPosition(line: number, column: number) {
    cursorLine.value = line
    cursorColumn.value = column
  }

  function markSaved() {
    isDirty.value = false
    isSaving.value = false
  }

  function startSaving() {
    isSaving.value = true
  }

  return {
    // State
    content,
    mode,
    isDirty,
    isSaving,
    cursorLine,
    cursorColumn,
    // Computed
    wordCount,
    charCount,
    readingTime,
    // Actions
    setContent,
    setMode,
    setCursorPosition,
    markSaved,
    startSaving
  }
})
