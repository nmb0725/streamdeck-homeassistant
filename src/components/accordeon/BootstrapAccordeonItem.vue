<template>
  <div class="accordion-item">
    <h2 :id="itemId" class="accordion-header">
      <button
        class="accordion-button collapsed"
        type="button"
        data-bs-toggle="collapse"
        :data-bs-target="'#collapse' + itemId"
        aria-expanded="true"
        :aria-controls="'collapse' + itemId"
      >
        {{ title }}
        <span
          v-if="configured"
          class="badge bg-success ms-2"
          style="font-size: 0.6rem; padding: 0.2em 0.45em; vertical-align: middle"
          aria-label="Configured"
          >&#10003;</span
        >
      </button>
    </h2>
    <div
      :id="'collapse' + itemId"
      class="accordion-collapse collapse"
      :aria-labelledby="itemId"
      :data-bs-parent="'#' + accordeonId"
    >
      <div class="accordion-body">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  accordeonId: {
    type: String,
    required: true
  },
  itemId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  configured: {
    type: Boolean,
    default: false
  }
})
</script>
