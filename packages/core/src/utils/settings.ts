import {Settings} from '../types/types.js'

export const settings: Settings = {
  historyLength: 5,
}

export const setSetting = (data: Partial<Settings>) => {
  Object.assign(settings, data)
}
