/* eslint-disable @typescript-eslint/no-explicit-any */
import type {LitElement} from 'lit'
import type {Constructor} from '@statx/element'
import {statable} from '@statx/element'

//@ts-ignore
export const statableLit = <T extends Constructor<LitElement>>(superClass: T): T => statable(superClass)
