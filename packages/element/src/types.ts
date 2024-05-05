/* eslint-disable @typescript-eslint/no-explicit-any */
export interface AttributeConverter<T> {
  /**
   * Called to convert an attribute value to a property
   * value.
   */
  fromAttribute?(value: string | null): T
  /**
   * Called to convert a property value to an attribute
   * value.
   */
  toAttribute?(value: T): string
}
export type ObservedAttribute = {
  reflect?: boolean
  converter?: AttributeConverter<any>
}
export type ObservedAttributeMap = Record<string, ObservedAttribute>
