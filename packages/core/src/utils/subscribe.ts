import {getComputedValue} from './get-computed-value.js'
import type {CommonInternal, Listner, UnSubscribe} from '../types/types.js'
import {getComputedState} from './utils.js'

export const subscribe = (state: CommonInternal | CommonInternal, listner: Listner): UnSubscribe => {
  /**
   * Если значение стейта ниразу не расчитывалось, его нужно обновить
   * Если подписываемся на вычисляемый стэйт, то нужно узнать всех родителей
   * Родители могут меняться, поэтому после каждого вычисления нужно обновлять зависимости дерева
   *
   * При отписке нужно оповестить всех на кого были опдписанты о том что мы отписались
   *
   */

  if (state.subscribes.has(listner)) {
    return () => ({})
  }

  const computedState = getComputedState(state)
  // Нужно актуализировать в родилеях зависимость
  if (computedState) {
    getComputedValue(computedState)
    state.depends.forEach((parent) => parent.childs.add(state))
  }

  state.subscribes.add(listner)

  return () => {
    state.subscribes.delete(listner)
    if (state.subscribes.size === 0) {
      state.depends.forEach((parent) => parent.childs.delete(state))
    }
  }
}
