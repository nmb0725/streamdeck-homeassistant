<template>
  <div>
    <div class="mb-2">
      <label class="form-label" for="domain">Domain</label>
      <div class="input-group input-group-sm">
        <select
          id="domain"
          v-model="selectedDomain"
          class="form-select form-select-sm"
          @change="(update('serviceId', null), update('entityId', null))"
        >
          <option
            v-for="availableDomain in availableDomains"
            :key="availableDomain"
            :value="availableDomain"
          >
            {{ availableDomain }}
          </option>
        </select>
        <button
          class="btn btn-outline-secondary"
          type="button"
          aria-label="Clear domain selection"
          @click="(selectedDomain = '', clear('serviceId', 'entityId', 'serviceData'))"
        >
          ✕
        </button>
      </div>
    </div>

    <div v-if="selectedDomain" class="mb-2">
      <label class="form-label" for="service">Service</label>
      <div class="input-group input-group-sm">
        <select
          id="service"
          :value="modelValue.serviceId"
          class="form-select form-select-sm"
          @change="update('serviceId', $event.target.value)"
        >
          <option
            v-for="domainService in domainServices"
            v-bind:key="domainService.serviceId"
            :value="domainService.serviceId"
          >
            {{ domainService.name }}
          </option>
        </select>
        <button
          class="btn btn-outline-secondary"
          type="button"
          aria-label="Clear service selection"
          @click="clear('serviceId', 'entityId', 'serviceData')"
        >
          ✕
        </button>
      </div>
    </div>

    <div v-if="domainEntities.length > 0" class="mb-2">
      <EntitySelection
        :available-entities="domainEntities"
        @change="update('entityId', $event.target.value)"
        :model-value="props.modelValue.entityId"
      ></EntitySelection>
      <button
        class="btn btn-sm btn-outline-secondary mt-1"
        type="button"
        aria-label="Clear entity selection"
        @click="clear('entityId')"
      >
        Clear entity
      </button>
    </div>

    <template v-if="props.modelValue.serviceId">
      <label class="form-label" for="serviceData">Service data JSON
        <span class="text-muted fw-normal">(optional)</span>
      </label>
      <textarea
        id="serviceData"
        :class="{ 'is-invalid': serviceDataInvalidFeedback }"
        :value="props.modelValue.serviceData"
        class="form-control form-control-sm font-monospace"
        placeholder='{
  "option": "value"
}'
        rows="5"
        @input="update('serviceData', $event.target.value)"
      ></textarea>
      <div class="invalid-feedback" v-if="serviceDataInvalidFeedback">
        {{ serviceDataInvalidFeedback }}
      </div>

      <details class="pi-vars mt-1" v-if="dataProperties && dataProperties.length > 0">
        <summary>Available options</summary>
        <div class="pi-vars-content">
          <div v-for="item in dataProperties" v-bind:key="item.name" class="form-text">
            <span class="text-info font-monospace">{{ item.name }}</span>
            <span class="text-warning font-monospace" v-if="item.info.required"> (required)</span>
            — {{ item.info.description }}
            <template v-if="item.info.example">
              <br /><span class="text-muted">Example: <i>{{ item.info.example }}</i></span>
            </template>
          </div>
        </div>
      </details>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import nunjucks from 'nunjucks'
import EntitySelection from '@/components/EntitySelection.vue'

const titleSort = (s1, s2) => (s1.name.toLowerCase() > s2.name.toLowerCase() ? 1 : -1)

const props = defineProps({
  modelValue: {
    required: true,
    type: Object,
    default: () => ({
      serviceId: null,
      entityId: null,
      serviceData: null
    })
  },
  availableServices: {
    required: true,
    type: [] // Service[]
  },
  availableEntities: {
    required: true,
    type: [] // Entity[]
  }
})

const emit = defineEmits(['update:modelValue'])

const selectedDomain = ref('')

onMounted(() => {
  if (props.modelValue && props.modelValue['serviceId']) {
    selectedDomain.value = props.modelValue['serviceId'].split('.')[0]
  }
})

function update(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function clear(...keys) {
  let clearedValue = { ...props.modelValue }
  keys.forEach((key) => delete clearedValue[key])
  emit('update:modelValue', clearedValue)
}

const availableDomains = computed(() => {
  if (!props.availableServices.length) {
    return []
  }
  return [...new Set(props.availableServices.map((service) => service.domain))].sort()
})

const domainServices = computed(() => {
  if (!props.availableServices.length || !selectedDomain.value) {
    return []
  }
  return props.availableServices
    .filter((service) => service.domain === selectedDomain.value)
    .sort(titleSort)
})

const domainEntities = computed(() => {
  if (
    !props.availableServices ||
    !props.availableEntities ||
    !props.modelValue ||
    !props.modelValue.serviceId
  ) {
    return []
  }
  const selectedService = props.availableServices.find(
    (service) => service.serviceId === props.modelValue.serviceId
  )
  if (selectedService && selectedService.target && selectedService.target.entity) {
    // target.entity may contain a single or an array of entities. Make sure we always work with array.
    let targetEntities = ensureArray(selectedService.target.entity)
    let targetDomains = targetEntities
      .filter((entity) => entity.domain)
      .flatMap((entity) => ensureArray(entity.domain))
    if (targetDomains.length > 0) {
      return props.availableEntities
        .filter((entity) => targetDomains.includes(entity.domain))
        .sort(titleSort)
    } else {
      return props.availableEntities.filter((entity) => entity).sort(titleSort)
    }
  }
  return []
})

const serviceDataInvalidFeedback = computed(() => {
  let serviceDataString = props.modelValue.serviceData
  if (!serviceDataString) {
    return ''
  }
  try {
    const renderedServiceData = nunjucks.renderString(serviceDataString, {
      ticks: 5,
      rotationPercent: 100,
      rotationAbsolute: 100
    })

    const json = JSON.parse(renderedServiceData)
    return typeof json === 'object' ? '' : 'Service data must be an JSON object.'
  } catch (e) {
    return 'Invalid JSON string: ' + e
  }
})

const dataProperties = computed(() => {
  if (
    !(
      props.availableServices.length &&
      props.availableEntities &&
      props.modelValue &&
      props.modelValue.serviceId
    )
  ) {
    return []
  }
  const selectedService = props.availableServices.find(
    (service) => service.serviceId === props.modelValue.serviceId
  )
  if (!selectedService || !selectedService.dataFields) {
    return []
  }
  return Object.entries(selectedService.dataFields).map((entry) => {
    return {
      name: entry[0],
      info: entry[1]
    }
  })
})

function ensureArray(input) {
  return Array.isArray(input) ? input : [input]
}
</script>
