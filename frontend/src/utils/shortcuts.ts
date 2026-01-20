// Keyboard shortcuts configuration
export interface ShortcutHandler {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
}

/**
 * Create a keyboard event handler for shortcuts
 */
export function createShortcutHandler(shortcuts: ShortcutHandler[]) {
  return (event: KeyboardEvent) => {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event
    const ctrl = ctrlKey || metaKey // Support both Ctrl and Cmd (Mac)

    for (const shortcut of shortcuts) {
      const matchesKey = key.toLowerCase() === shortcut.key.toLowerCase()
      const matchesCtrl = shortcut.ctrl ? ctrl : !ctrl
      const matchesShift = shortcut.shift ? shiftKey : !shiftKey
      const matchesAlt = shortcut.alt ? altKey : !altKey

      if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
        event.preventDefault()
        shortcut.action()
        return true
      }
    }

    return false
  }
}

/**
 * Editor command types
 */
export type EditorCommand =
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'underline'
  | 'code'
  | 'mark'
  | 'heading'
  | 'list'
  | 'insert'
  | 'textColor'
  | 'bgColor'

/**
 * Markdown syntax wrappers for each command
 */
export const markdownWrappers: Record<string, { before: string; after: string }> = {
  bold: { before: '**', after: '**' },
  italic: { before: '*', after: '*' },
  strikethrough: { before: '~~', after: '~~' },
  underline: { before: '<u>', after: '</u>' },
  code: { before: '`', after: '`' },
  mark: { before: '==', after: '==' }
}

/**
 * Get heading prefix
 */
export function getHeadingPrefix(level: number): string {
  if (level === 0) return ''
  return '#'.repeat(level) + ' '
}

/**
 * Get list prefix
 */
export function getListPrefix(type: string): string {
  switch (type) {
    case 'ul': return '- '
    case 'ol': return '1. '
    case 'task': return '- [ ] '
    default: return ''
  }
}

/**
 * Get insert template
 */
export function getInsertTemplate(type: string): string {
  switch (type) {
    case 'link':
      return '[链接文字](url)'
    case 'image':
      return '![图片描述](url)'
    case 'table':
      return `| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 内容 | 内容 | 内容 |
| 内容 | 内容 | 内容 |`
    case 'codeblock':
      return '```language\n// 代码\n```'
    case 'math':
      return '$$\n\\sum_{i=1}^n a_i\n$$'
    case 'mermaid':
      return `\`\`\`mermaid
graph LR
    A[开始] --> B[结束]
\`\`\``
    case 'quote':
      return '> 引用内容'
    case 'hr':
      return '\n---\n'
    default:
      return ''
  }
}

/**
 * Get color HTML wrapper
 */
export function getColorWrapper(type: 'textColor' | 'bgColor', color: string): { before: string; after: string } {
  if (type === 'textColor') {
    return {
      before: `<span style="color: ${color}">`,
      after: '</span>'
    }
  } else {
    if (color === 'transparent') {
      return { before: '', after: '' }
    }
    return {
      before: `<span style="background-color: ${color}">`,
      after: '</span>'
    }
  }
}
