import {
  createConnection,
  createLongLivedTokenAuth,
  callService as haCallService
} from 'home-assistant-js-websocket'

export class Homeassistant {
  constructor(url, accessToken, onReady, onError, onClose) {
    this._connection = null
    this._lastFullSync = null
    this._closed = false

    const auth = createLongLivedTokenAuth(url, accessToken)

    createConnection({ auth })
      .then((conn) => {
        if (this._closed) {
          conn.close()
          return
        }
        this._connection = conn
        conn.addEventListener('disconnected', () => onClose?.())
        conn.addEventListener('reconnect-error', () => onError?.('Reconnection failed'))
        onReady?.()
      })
      .catch((err) => {
        if (!this._closed) onError?.(String(err))
      })
  }

  close() {
    this._closed = true
    this._connection?.close()
    this._connection = null
  }

  getStatesDebounced(callback) {
    if (!this._lastFullSync || Date.now() - this._lastFullSync > 2000) {
      this._lastFullSync = Date.now()
      this.getStates(callback)
    }
  }

  getStates(callback) {
    this._connection.sendMessagePromise({ type: 'get_states' }).then(callback)
  }

  getServices(callback) {
    this._connection.sendMessagePromise({ type: 'get_services' }).then(callback)
  }

  subscribeEntitiesChanged(entityIds, callback) {
    return this._connection.subscribeMessage(callback, {
      type: 'subscribe_trigger',
      trigger: {
        platform: 'state',
        entity_id: entityIds
      }
    })
  }

  callService(service, domain, entity_id = null, serviceData = null) {
    const target = entity_id ? { entity_id } : undefined
    haCallService(this._connection, domain, service, serviceData ?? {}, target)
  }
}
