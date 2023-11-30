import {ElementX} from '../x-element'
import {html} from '@statx/lit'
import {statable} from '../mixins/statable'
import {statx} from '../decorators/statx'
import {css} from '../styles'

type ButtonState = {
  disabled: boolean
  variant: 'primary' | 'default'
}

class TestButton extends statable(ElementX) {
  @statx
  accessor config: ButtonState = {disabled: false, variant: 'default'}

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
