<template>
  <div class="pi-seg" role="radiogroup">
    <template v-for="option in options" :key="option.value">
      <input
        :id="`${controlId}-${option.value}`"
        v-model="internalValue"
        type="radio"
        :name="controlId"
        :value="option.value"
      />
      <label :for="`${controlId}-${option.value}`">{{ option.label }}</label>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  options: {
    type: Array,
    required: true
  },
  controlId: {
    type: String,
    default: 'seg'
  }
})

const emit = defineEmits(['update:modelValue'])

const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>
