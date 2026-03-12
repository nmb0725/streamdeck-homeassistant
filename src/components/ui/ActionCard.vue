<template>
  <div class="pi-action-card">
    <div class="pi-action-header" @click="isOpen = !isOpen">
      <span class="pi-action-title">{{ title }}</span>
      <span v-if="configured && !isOpen" class="pi-action-summary">{{ summary }}</span>
      <span v-if="configured" class="pi-action-badge">✓ configured</span>
      <span class="pi-action-chevron" :class="{ open: isOpen }">&#9658;</span>
    </div>
    <div class="pi-action-body" :data-open="isOpen.toString()">
      <div class="pi-action-content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  title: {
    type: String,
    required: true
  },
  configured: {
    type: Boolean,
    default: false
  },
  summary: {
    type: String,
    default: ''
  }
})

const isOpen = ref(false)
</script>
