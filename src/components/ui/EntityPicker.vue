<template>
  <div ref="pickerEl" class="pi-entity-picker">
    <div class="pi-entity-search" :class="{ open: isOpen }">
      <span class="pi-search-icon">&#128269;</span>
      <input
        ref="searchInput"
        :value="inputDisplayValue"
        type="text"
        :placeholder="isOpen ? 'Filter by name or entity ID…' : 'No entity selected'"
        autocomplete="off"
        spellcheck="false"
        :class="{ 'has-value': !isOpen && modelValue }"
        @focus="onFocus"
        @input="filter = $event.target.value"
        @keydown="onKeydown"
      />
      <button
        v-if="modelValue"
        class="pi-clear-btn"
        tabindex="-1"
        aria-label="Clear selection"
        @mousedown.prevent="clear"
      >
        ✕
      </button>
    </div>

    <div v-if="isOpen" class="pi-entity-dropdown">
      <div ref="listEl" class="pi-entity-list">
        <div
          v-for="(entity, index) in filteredEntities"
          :key="entity.entityId"
          :ref="(el) => (itemRefs[index] = el)"
          class="pi-entity-item"
          :class="{
            selected: entity.entityId === modelValue,
            focused: index === focusedIndex
          }"
          @mousedown.prevent="select(entity.entityId)"
          @mouseenter="focusedIndex = index"
        >
          <span class="pi-entity-badge" :style="{ background: domainColor(entity.domain) }">{{
            entity.domain
          }}</span>
          <span class="pi-entity-name">{{ entity.title }}</span>
          <span class="pi-entity-id">{{ entity.entityId }}</span>
        </div>
      </div>
      <div class="pi-entity-count">
        {{ filteredEntities.length }} of {{ availableEntities.length }} entities
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const DOMAIN_COLORS = {
  light: '#b8860b',
  switch: '#2dd4bf',
  sensor: '#34d399',
  cover: '#a78bfa',
  media_player: '#f87171',
  climate: '#2563eb',
  binary_sensor: '#fb923c',
  input_boolean: '#2dd4bf',
  automation: '#e879f9',
  script: '#a78bfa',
  scene: '#16a34a',
  default: '#6b7280'
}

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  availableEntities: {
    required: true,
    type: Array
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const filter = ref('')
const isOpen = ref(false)
const focusedIndex = ref(-1)
const itemRefs = ref([])
const pickerEl = ref(null)
const searchInput = ref(null)

const selectedEntity = computed(
  () => props.availableEntities.find((e) => e.entityId === props.modelValue) ?? null
)

const inputDisplayValue = computed(() => {
  if (!isOpen.value && selectedEntity.value) {
    return selectedEntity.value.title || selectedEntity.value.entityId
  }
  return filter.value
})

const filteredEntities = computed(() => {
  if (!filter.value) return props.availableEntities
  const lc = filter.value.toLowerCase()
  return props.availableEntities.filter(
    (e) => e.entityId.toLowerCase().includes(lc) || e.title.toLowerCase().includes(lc)
  )
})

watch(filteredEntities, () => {
  focusedIndex.value = -1
  itemRefs.value = []
})

function domainColor(domain) {
  return DOMAIN_COLORS[domain] ?? DOMAIN_COLORS.default
}

function onFocus() {
  filter.value = ''
  isOpen.value = true
  focusedIndex.value = -1
}

function select(entityId) {
  emit('update:modelValue', entityId)
  isOpen.value = false
  filter.value = ''
  searchInput.value?.blur()
}

function clear() {
  emit('update:modelValue', '')
  filter.value = ''
  isOpen.value = false
}

function scrollFocused() {
  itemRefs.value[focusedIndex.value]?.scrollIntoView({ block: 'nearest' })
}

function onKeydown(e) {
  if (!isOpen.value && e.key !== 'Escape') {
    isOpen.value = true
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    focusedIndex.value = Math.min(focusedIndex.value + 1, filteredEntities.value.length - 1)
    scrollFocused()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    focusedIndex.value = Math.max(focusedIndex.value - 1, 0)
    scrollFocused()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const idx = focusedIndex.value >= 0 ? focusedIndex.value : 0
    const entity = filteredEntities.value[idx]
    if (entity) select(entity.entityId)
  } else if (e.key === 'Escape') {
    isOpen.value = false
    filter.value = ''
    searchInput.value?.blur()
  }
}

function onDocumentMousedown(e) {
  if (pickerEl.value && !pickerEl.value.contains(e.target)) {
    isOpen.value = false
    filter.value = ''
  }
}

onMounted(() => document.addEventListener('mousedown', onDocumentMousedown))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocumentMousedown))
</script>
