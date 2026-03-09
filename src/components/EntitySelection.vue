<template>
  <div>
    <label class="form-label" for="entity">Entity</label>
    <input
      v-model="entityFilter"
      type="search"
      class="form-control form-control-sm mb-1"
      placeholder="Filter by name or entity ID…"
      aria-label="Filter entities"
      autocomplete="off"
      spellcheck="false"
    />
    <select
      id="entity"
      size="5"
      :value="modelValue"
      class="form-select form-select-sm"
      @change="emit('update:modelValue', $event.target.value)"
    >
      <option
        v-for="entity in filteredEntities"
        :key="entity"
        :value="entity.entityId"
        :title="entity?.entityId"
      >
        {{ entity.title }}
      </option>
    </select>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'
import { Entity } from '@/modules/pi/entity'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => new Entity()
  },
  availableEntities: {
    required: true,
    type: Array // Entity[]
  }
})

const emit = defineEmits(['update:modelValue'])

const entityFilter = ref('')

const filteredEntities = computed(() => {
  if (!entityFilter.value) {
    return props.availableEntities
  }

  let filterLc = entityFilter.value.toLowerCase()
  return props.availableEntities.filter((entity) => {
    let entityIdMatches = entity.entityId.toLowerCase().indexOf(filterLc) !== -1
    let titleMatches = entity.title.toLowerCase().indexOf(filterLc) !== -1
    return entityIdMatches || titleMatches
  })
})
</script>
