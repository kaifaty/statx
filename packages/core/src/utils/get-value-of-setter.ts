import {CommonInternal, SetterFunc} from '../types/index.js'
import {getHistoryValue} from './utils.js'

export const getValueOfSetterFunction = (state: CommonInternal, value: SetterFunc): unknown => {
  const prevValue = getHistoryValue(state)
  return value(prevValue)
}
