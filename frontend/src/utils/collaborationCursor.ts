export function getCaretRectFromIndex(container: HTMLElement, index: number): DOMRect | null {
  const totalLength = container.innerText.length
  const safeIndex = Math.max(0, Math.min(index, totalLength))

  const range = document.createRange()
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)

  let remaining = safeIndex
  let node: Node | null = null

  while ((node = walker.nextNode())) {
    const text = node.textContent || ''
    if (remaining <= text.length) {
      range.setStart(node, remaining)
      range.setEnd(node, remaining)
      const rects = range.getClientRects()
      if (rects.length > 0) {
        return rects[0]
      }
      const parentRect = (node as Text).parentElement?.getBoundingClientRect()
      return parentRect || null
    }
    remaining -= text.length
  }

  return container.getBoundingClientRect()
}
