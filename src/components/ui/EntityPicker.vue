<template>
  <div class="pi-entity-picker">
    <div class="pi-entity-search">
      <span class="pi-search-icon">&#128269;</span>
      <input
        ref="searchInput"
        v-model="filter"
        type="search"
        :placeholder="compact ? 'Filter…' : 'Filter by name or entity ID…'"
        autocomplete="off"
        spellcheck="false"
        @keydown="onSearchKeydown"
      />
      <button
        class="pi-clear-btn"
        :class="{ hidden: !filter }"
        tabindex="-1"
        aria-label="Clear filter"
        @click="filter = ''"
      >
        ✕
      </button>
    </div>

    <div
      ref="listEl"
      class="pi-entity-list"
      :class="compact ? 'rows-4' : 'rows-6'"
      role="listbox"
      tabindex="0"
      @keydown="onListKeydown"
    >
      <div
        v-for="(entity, index) in filteredEntities"
        :key="entity.entityId"
        :ref="(el) => (itemRefs[index] = el)"
        class="pi-entity-item"
        :class="{
          selected: entity.entityId === modelValue,
          focused: index === focusedIndex
        }"
        role="option"
        :aria-selected="entity.entityId === modelValue"
        @click="select(entity.entityId)"
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
</template>

<script setup>
import { computed, ref, watch } from 'vue'

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
const focusedIndex = ref(-1)
const itemRefs = ref([])
const listEl = ref(null)

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

function select(entityId) {
  emit('update:modelValue', entityId)
}

function scrollFocused() {
  const el = itemRefs.value[focusedIndex.value]
  if (el) el.scrollIntoView({ block: 'nearest' })
}

function onSearchKeydown(e) {
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
    filter.value = ''
  }
}

function onListKeydown(e) {
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
    const entity = filteredEntities.value[focusedIndex.value]
    if (entity) select(entity.entityId)
  }
}
</script>
