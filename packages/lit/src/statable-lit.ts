/* eslint-disable @typescript-eslint/no-explicit-any */
import type {LitElement} from 'lit'
import {statable, Constructor} from '@statx/element'

//@ts-ignore
export const statableLit = <T extends Constructor<LitElement>>(superClass: T): T => statable(superClass)
