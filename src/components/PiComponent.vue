<template>
  <div class="pi-root">

    <!-- ── Connection status bar (collapsed global settings) ──────────────── -->
    <div v-if="!globalSettingsExpanded" class="pi-connection-bar mb-3">
      <span class="pi-status-dot connected" aria-hidden="true"></span>
      <span class="text-truncate flex-grow-1 small text-muted">Connection: {{ serverUrl }}</span>
      <button
        class="btn btn-sm btn-outline-secondary py-0 px-2 ms-1 flex-shrink-0"
        style="font-size: 0.7rem"
        type="button"
        aria-label="Edit global settings"
        @click="globalSettingsExpanded = true"
      >
        Edit
      </button>
    </div>

    <!-- ── Global Settings ────────────────────────────────────────────────── -->
    <div v-if="globalSettingsExpanded" class="mb-3">
      <p class="pi-section-header mt-0">Global Settings</p>

      <div class="mb-3">
        <label class="form-label" for="serverUrl">Server URL</label>
        <input id="serverUrl" v-model="serverUrl" class="form-control form-control-sm" type="url" />
        <div class="form-text">
          <span class="text-body-secondary">Without SSL:</span> ws://localhost:8123/api/websocket
        </div>
        <div class="form-text">
          <span class="text-body-secondary">With SSL:</span> wss://ha.mydomain.net:8123/api/websocket
          <span class="text-muted">(requires a trusted certificate)</span>
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label" for="accessToken">Access Token</label>
        <input
          id="accessToken"
          v-model="accessToken"
          class="form-control form-control-sm"
          required
          type="password"
          autocomplete="current-password"
        />
        <div class="form-text">
          Create a long-lived token under your HA profile page.
          <a
            href="https://developers.home-assistant.io/docs/auth_api/#long-lived-access-token"
            target="_blank"
            rel="noopener"
            >Documentation</a
          >
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label" for="displayConfig">Display theme</label>
        <select
          :disabled="displayConfigurationUrlOverride.length > 0"
          id="displayConfig"
          v-model="displayConfiguration"
          class="form-select form-select-sm"
        >
          <option
            v-for="availableConfiguration in manifest['display-configs']"
            :key="availableConfiguration"
            :value="availableConfiguration"
          >
            {{ availableConfiguration.title }}
          </option>
        </select>

        <label for="displayConfigUrlOverride" class="form-label mt-2">Custom theme URL</label>
        <input
          id="displayConfigUrlOverride"
          v-model="displayConfigurationUrlOverride"
          class="form-control form-control-sm"
          type="url"
          placeholder="file://c:/custom.yml"
        />
        <div class="form-text">
          Override with a custom YAML config.
          <a
            target="_blank"
            rel="noopener"
            href="https://raw.githubusercontent.com/cgiesche/streamdeck-homeassistant/master/public/config/default-display-config.yml"
            >Example</a
          >
        </div>
      </div>

      <div v-if="haError" class="alert alert-danger alert-dismissible py-2" role="alert">
        <span class="small">{{ haError }}</span>
        <button class="btn-close btn-close-sm" type="button" aria-label="Dismiss" @click="haError = ''"></button>
      </div>

      <button
        :disabled="!isHaSettingsComplete || haConnectionState === 'connecting'"
        class="btn btn-sm btn-primary w-100"
        type="button"
        v-on:click="saveGlobalSettings"
      >
        <span
          v-if="haConnectionState === 'connecting'"
          aria-hidden="true"
          class="spinner-border spinner-border-sm me-1"
          role="status"
        ></span>
        {{ haConnectionState === 'connected' ? 'Save and reconnect' : 'Save and connect' }}
      </button>
      <button
        v-if="haConnectionState === 'connected'"
        class="btn btn-sm btn-outline-secondary w-100 mt-2"
        type="button"
        @click="globalSettingsExpanded = false"
      >
        Close
      </button>
    </div>

    <!-- ── Appearance ─────────────────────────────────────────────────────── -->
    <div v-if="haConnectionState === 'connected' && !globalSettingsExpanded" class="mb-3">
      <p class="pi-section-header">{{ controllerType }} Appearance</p>

      <EntitySelection
        class="mb-3"
        :available-entities="availableEntities"
        v-model="entity"
      ></EntitySelection>

      <!-- Custom title toggle -->
      <div class="form-check form-switch mb-2">
        <input
          id="chkButtonTitle"
          v-model="useCustomTitle"
          class="form-check-input"
          type="checkbox"
          role="switch"
        />
        <label class="form-check-label" for="chkButtonTitle">Custom title</label>
      </div>
      <div v-if="useCustomTitle" class="mb-3 ps-1">
        <input
          id="buttonTitle"
          v-model="buttonTitle"
          class="form-control form-control-sm"
          placeholder="{{friendly_name}}"
          type="text"
        />
        <div class="form-text text-warning-emphasis">
          Clear the title in the main Stream Deck window for this template to take effect.
        </div>
        <details class="pi-vars" v-if="entityAttributes.length">
          <summary>Available variables</summary>
          <div class="pi-vars-content">
            <div v-for="attr in entityAttributes" v-bind:key="attr" class="form-text font-monospace">
              {{ attr }}
            </div>
          </div>
        </details>
      </div>

      <!-- Custom labels toggle -->
      <div class="form-check form-switch mb-2">
        <input
          id="chkCustomLabels"
          v-model="useCustomButtonLabels"
          class="form-check-input"
          type="checkbox"
          role="switch"
        />
        <label class="form-check-label" for="chkCustomLabels">Custom labels</label>
      </div>
      <div v-if="useCustomButtonLabels" class="mb-3 ps-1">
        <textarea
          id="buttonLabels"
          v-model="buttonLabels"
          class="form-control form-control-sm font-monospace"
          placeholder="Line 1 (may overlap with icon)"
          rows="4"
        ></textarea>
        <details class="pi-vars" v-if="entityAttributes.length">
          <summary>Available variables</summary>
          <div class="pi-vars-content">
            <div v-for="attr in entityAttributes" v-bind:key="attr" class="form-text font-monospace">
              {{ attr }}
            </div>
          </div>
        </details>
      </div>

      <!-- Service indicator (Keypad only) -->
      <template v-if="controllerType !== 'Encoder'">
        <div class="form-check form-switch mb-2">
          <input
            id="chkEnableServiceIndicator"
            v-model="enableServiceIndicator"
            class="form-check-input"
            type="checkbox"
            role="switch"
          />
          <label class="form-check-label" for="chkEnableServiceIndicator">
            Visual service indicators
          </label>
        </div>
      </template>

      <!-- Icon source segmented control -->
      <div class="mb-3 mt-3">
        <label class="form-label d-block" id="iconSourceLabel">Icon source</label>
        <div
          class="btn-group w-100 pi-icon-btn-group"
          role="group"
          aria-labelledby="iconSourceLabel"
        >
          <input
            type="radio"
            class="btn-check"
            id="radioPlugin"
            value="PREFER_PLUGIN"
            v-model="iconSettings"
            autocomplete="off"
          />
          <label class="btn btn-outline-secondary" for="radioPlugin">Plugin</label>

          <input
            type="radio"
            class="btn-check"
            id="radioHomeAssistant"
            value="PREFER_HA"
            v-model="iconSettings"
            autocomplete="off"
          />
          <label class="btn btn-outline-secondary" for="radioHomeAssistant">Home Assistant</label>

          <input
            type="radio"
            class="btn-check"
            id="radioHide"
            value="HIDE"
            v-model="iconSettings"
            autocomplete="off"
          />
          <label class="btn btn-outline-secondary" for="radioHide">Hide</label>
        </div>
        <div class="form-text" v-if="iconSettings === 'PREFER_PLUGIN'">
          Plugin icon preferred; falls back to HA entity icon.
        </div>
        <div class="form-text" v-else-if="iconSettings === 'PREFER_HA'">
          HA entity icon preferred; falls back to plugin icon.
        </div>
      </div>

      <!-- ── Actions ──────────────────────────────────────────────────────── -->
      <p class="pi-section-header">{{ controllerType }} Actions</p>

      <AccordeonComponent id="presses" class="mb-3">
        <AccordeonItem
          accordeon-id="presses"
          item-id="shortPress"
          title="Short Press"
          :configured="!!serviceShortPress.serviceId"
        >
          <ServiceCallConfiguration
            v-model="serviceShortPress"
            :available-entities="availableEntities"
            :available-services="availableServices"
          ></ServiceCallConfiguration>
        </AccordeonItem>

        <AccordeonItem
          accordeon-id="presses"
          item-id="longPress"
          title="Long Press"
          :configured="!!serviceLongPress.serviceId"
        >
          <ServiceCallConfiguration
            v-model="serviceLongPress"
            :available-entities="availableEntities"
            :available-services="availableServices"
          ></ServiceCallConfiguration>
        </AccordeonItem>

        <template v-if="controllerType === 'Encoder'">
          <AccordeonItem
            accordeon-id="presses"
            item-id="touch"
            title="Screen Tap"
            :configured="!!serviceTap.serviceId"
          >
            <ServiceCallConfiguration
              v-model="serviceTap"
              :available-entities="availableEntities"
              :available-services="availableServices"
            ></ServiceCallConfiguration>
          </AccordeonItem>

          <AccordeonItem
            accordeon-id="presses"
            item-id="dialRotate"
            title="Rotation"
            :configured="!!serviceRotation.serviceId"
          >
            <ServiceCallConfiguration
              v-model="serviceRotation"
              :available-entities="availableEntities"
              :available-services="availableServices"
            ></ServiceCallConfiguration>

            <details class="pi-vars mt-2 mb-3">
              <summary>Available variables</summary>
              <div class="pi-vars-content">
                <div class="form-text">
                  <span v-pre class="text-info font-monospace">{{ ticks }}</span> — ticks rotated
                  (negative = left, positive = right).
                </div>
                <div class="form-text">
                  <span v-pre class="text-info font-monospace">{{ rotationPercent }}</span> — 0–100
                  rotation percentage.
                </div>
                <div class="form-text">
                  <span v-pre class="text-info font-monospace">{{ rotationAbsolute }}</span> — 0–255
                  absolute rotation value.
                </div>
              </div>
            </details>

            <label class="form-label" for="rotationTickMultiplier">
              Tick multiplier
              <span class="badge bg-secondary ms-1">×{{ rotationTickMultiplier }}</span>
            </label>
            <input
              id="rotationTickMultiplier"
              v-model="rotationTickMultiplier"
              class="form-range"
              max="10"
              min="0.1"
              step="0.1"
              type="range"
            />
            <div class="form-text mb-3">Each dial tick is multiplied by this value.</div>

            <label class="form-label" for="rotationTickBucketSizeMs">
              Tick bucket size
              <span class="badge bg-secondary ms-1">{{ rotationTickBucketSizeMs }} ms</span>
            </label>
            <input
              id="rotationTickBucketSizeMs"
              v-model="rotationTickBucketSizeMs"
              class="form-range"
              max="1000"
              min="0"
              step="50"
              type="range"
            />
            <div class="form-text mb-2">
              Aggregates ticks for this duration before firing the service call. Zero = one call per
              tick.
            </div>
          </AccordeonItem>
        </template>
      </AccordeonComponent>

      <button class="btn btn-sm btn-primary w-100" type="button" v-on:click="saveSettings">
        Save configuration
      </button>
    </div>
  </div>
</template>

<script setup>
import defaultManifest from '../../public/config/manifest.yml'
import { StreamDeck } from '@/modules/common/streamdeck'
import { Settings } from '@/modules/common/settings'
import { Homeassistant } from '@/modules/homeassistant/homeassistant'
import { Entity } from '@/modules/pi/entity'
import { Service } from '@/modules/pi/service'
import { computed, onMounted, ref, watch } from 'vue'
import ServiceCallConfiguration from '@/components/ServiceCallConfiguration.vue'
import { ObjectUtils } from '@/modules/common/utils'
import AccordeonComponent from '@/components/accordeon/BootstrapAccordeon.vue'
import AccordeonItem from '@/components/accordeon/BootstrapAccordeonItem.vue'
import EntitySelection from '@/components/EntitySelection.vue'
import axios from 'axios'
import yaml from 'js-yaml'

let manifest = ref(defaultManifest)

const globalSettingsExpanded = ref(true)

let $HA = null
let $SD = null

const serverUrl = ref('')
const accessToken = ref('')
const displayConfiguration = ref()
const displayConfigurationUrlOverride = ref('')

const entity = ref('')

const serviceShortPress = ref({})
const serviceLongPress = ref({})
const serviceTap = ref({})
const serviceRotation = ref({})

const rotationTickMultiplier = ref(1)
const rotationTickBucketSizeMs = ref(300)

const useCustomTitle = ref(false)
const buttonTitle = ref('{{friendly_name}}')
const useStateImagesForOnOffStates = ref(false) // determined by action ID (manifest)
const useCustomButtonLabels = ref(false)
const buttonLabels = ref('')
const enableServiceIndicator = ref(true)
const iconSettings = ref('PREFER_PLUGIN')
const availableEntityDomains = ref([])
const availableEntities = ref([])
const availableServiceDomains = ref([])
const availableServices = ref([])
const currentStates = ref([])
const haConnectionState = ref('disconnected') // disconnected, connecting, connected
const haError = ref('')

const controllerType = ref('')

onMounted(() => {
  updateManifest()

  window.connectElgatoStreamDeckSocket = (
    inPort,
    inPropertyInspectorUUID,
    inRegisterEvent,
    inInfo,
    inActionInfo
  ) => {
    $SD = new StreamDeck(inPort, inPropertyInspectorUUID, inRegisterEvent, inInfo, inActionInfo)

    // Dual State entity (custom icons for on/off)
    const inActionInfoObject = JSON.parse(inActionInfo)

    useStateImagesForOnOffStates.value =
      inActionInfoObject['action'] === 'de.perdoctus.streamdeck.homeassistant.dual-state-entity'
    controllerType.value = inActionInfoObject.payload.controller

    $SD.on('globalsettings', (globalSettings) => {
      if (globalSettings) {
        serverUrl.value = globalSettings.serverUrl
        accessToken.value = globalSettings.accessToken

        let displayConfigurationFromSettings = globalSettings.displayConfiguration
        if (displayConfigurationFromSettings) {
          displayConfiguration.value = displayConfigurationFromSettings
          if (displayConfigurationFromSettings.urlOverride) {
            displayConfigurationUrlOverride.value = displayConfigurationFromSettings.urlOverride
          }
        }

        if (serverUrl.value && accessToken.value) {
          connectHomeAssistant()
        }
      }
    })

    $SD.on('connected', (actionInfo) => {
      $SD.requestGlobalSettings()

      let settings = Settings.parse(actionInfo.payload.settings)

      entity.value = settings['display']['entityId']
      enableServiceIndicator.value =
        settings['display']['enableServiceIndicator'] ||
        settings['display']['enableServiceIndicator'] === undefined
      iconSettings.value = settings['display']['iconSettings']
      useCustomTitle.value = settings['display']['useCustomTitle']
      buttonTitle.value = settings['display']['buttonTitle'] || '{{friendly_name}}'
      useCustomButtonLabels.value = settings['display']['useCustomButtonLabels']
      buttonLabels.value = settings['display']['buttonLabels']
      serviceShortPress.value = settings['button']['serviceShortPress']
      serviceLongPress.value = settings['button']['serviceLongPress']
      serviceTap.value = settings['button']['serviceTap']
      serviceRotation.value = settings['button']['serviceRotation']
      rotationTickMultiplier.value = settings['rotationTickMultiplier'] || 1
      rotationTickBucketSizeMs.value = settings['rotationTickBucketSizeMs'] || 300
    })
  }
})

function updateManifest() {
  console.log('Updating manifest.')
  axios
    .get(
      'https://cdn.jsdelivr.net/gh/cgiesche/streamdeck-homeassistant@master/public/config/manifest.yml'
    )
    .then((response) => (manifest.value = yaml.load(response.data)))
    .catch((error) => console.log(`Failed to download updated manifest.yml: ${error}`))
}

watch(haConnectionState, (state) => {
  if (state === 'connected') globalSettingsExpanded.value = false
  if (state === 'disconnected') globalSettingsExpanded.value = true
})

const isHaSettingsComplete = computed(() => {
  return serverUrl.value && accessToken.value
})

const entityAttributes = computed(() => {
  let currentEntityState = currentStates.value.find((state) => state.entityId === entity.value)
  if (currentEntityState && currentEntityState.attributes) {
    let attributes = currentEntityState.attributes.map((attribute) => `{{${attribute}}}`)
    return ['{{state}}', ...attributes]
  }
  return []
})

function connectHomeAssistant() {
  if ($HA) {
    $HA.close()
  }

  haConnectionState.value = 'connecting'

  try {
    $HA = new Homeassistant(
      serverUrl.value,
      accessToken.value,
      () => {
        haConnectionState.value = 'connected'
        $HA.getStates((states) => {
          availableEntityDomains.value = Array.from(
            states
              .map((state) => state.entity_id.split('.')[0])
              .reduce((acc, curr) => acc.add(curr), new Set())
          ).sort()

          availableEntities.value = states
            .map((state) => {
              let splittedId = state.entity_id.split('.')
              return new Entity(
                splittedId[0],
                splittedId[1],
                state.attributes.friendly_name || state.entity_id
              )
            })
            .sort((a, b) =>
              a.title.toLowerCase() > b.title.toLowerCase()
                ? 1
                : b.title.toLowerCase() > a.title.toLowerCase()
                  ? -1
                  : 0
            )

          currentStates.value = states.map((state) => {
            return {
              entityId: state.entity_id,
              attributes: ObjectUtils.paths(state.attributes)
            }
          })
        })
        $HA.getServices((services) => {
          availableServices.value = Object.entries(services).flatMap((domainServices) => {
            const domain = domainServices[0]
            return Object.entries(domainServices[1]).map((services) => {
              let serviceName = services[0]
              let serviceData = services[1]
              return new Service(domain, serviceName, serviceData.fields, serviceData.target)
            })
          })
          availableServiceDomains.value = Object.keys(services).sort()
        })
      },
      (message) => {
        haError.value = message
        haConnectionState.value = 'disconnected'
      },
      () => {
        haConnectionState.value = 'disconnected'
      }
    )
  } catch (e) {
    haError.value = e
    haConnectionState.value = 'disconnected'
  }
}

function saveGlobalSettings() {
  haError.value = ''

  let displayConfigurationsSettings = displayConfiguration.value

  // validate custom config
  if (displayConfigurationUrlOverride.value) {
    axios
      .get(displayConfigurationUrlOverride.value)
      .then()
      .catch((error) => (haError.value = `Could not read custom display configuration: ${error}`))

    displayConfigurationsSettings.urlOverride = displayConfigurationUrlOverride.value
  }

  $SD.saveGlobalSettings({
    serverUrl: serverUrl.value,
    accessToken: accessToken.value,
    displayConfiguration: displayConfigurationsSettings
  })

  connectHomeAssistant()
}

function saveSettings() {
  let settings = {
    version: 5,

    controllerType: controllerType.value,

    display: {
      entityId: entity.value,
      useCustomTitle: useCustomTitle.value,
      buttonTitle: buttonTitle.value,
      enableServiceIndicator: enableServiceIndicator.value,
      iconSettings: iconSettings.value,
      useCustomButtonLabels: useCustomButtonLabels.value,
      buttonLabels: buttonLabels.value,
      useStateImagesForOnOffStates: useStateImagesForOnOffStates.value // determined by action ID (manifest)
    },

    button: {
      serviceShortPress: serviceShortPress.value,
      serviceLongPress: serviceLongPress.value,
      serviceTap: serviceTap.value,
      serviceRotation: serviceRotation.value
    },

    rotationTickMultiplier: rotationTickMultiplier.value,
    rotationTickBucketSizeMs: rotationTickBucketSizeMs.value
  }

  $SD.saveSettings(settings)
}
</script>
