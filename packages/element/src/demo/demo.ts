import {html} from '@statx/lit'

import {ElementX} from '../x-element'
import {css} from '../styles'
import {statable} from '../mixins/statable'
import {statx} from '../decorators/statx'
import {property} from '../decorators/property'

type ButtonState = {
  disabled: boolean
  variant: 'primary' | 'default'
}

class TestButton extends statable(ElementX) {
  @statx
  accessor config: ButtonState = {disabled: false, variant: 'default'}

  @property({type: String})
  accessor test: string = '12'

  static styles = css`
    [variant='primary'] {
      color: blue;
    }
    [variant='default'] {
      color: green;
    }
  `

  render() {
    const cfg = this.config
    return html`<button ?disabled="${cfg.disabled}" variant="${cfg.variant}">
      <slot>Variant: ${cfg.variant}</slot>
    </button>`
  }
}

customElements.define('test-button', TestButton)
