<template>
  <div>
    <div class="pi-toggle-row">
      <label class="pi-toggle-label" :for="id">{{ label }}</label>
      <div class="pi-toggle">
        <input
          :id="id"
          type="checkbox"
          :checked="modelValue"
          @change="emit('update:modelValue', $event.target.checked)"
        />
        <label :for="id"></label>
      </div>
    </div>
    <div v-if="modelValue && $slots.default" class="pi-toggle-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    required: true
  },
  id: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])
</script>
