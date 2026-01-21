<!-- Deprecated placeholder for SelectionToolbar. The floating toolbar feature is removed; this minimal component keeps imports working. -->
<script setup lang="ts">
// Props kept for backward compatibility (component is deprecated placeholder)
defineProps({
  visible: { type: Boolean, default: false },
  position: { type: Object as () => { x?: number; y?: number }, default: () => ({}) },
  selectedElement: { type: Object as () => HTMLElement | null, default: null }
})

defineEmits(['command', 'close'])

// Intentionally minimal: no runtime logic here. The real toolbar was removed.
</script>

<template>
  <!-- Empty placeholder: nothing rendered. -->
  <div v-if="false" />
</template>

<style scoped>
/* deprecated placeholder styles (kept empty) */

</style>
