import {render, html, LitElement} from 'lit'
import {url} from '@statx/url'
import {Router} from '../router'
import Pack from '../../package.json'
Router.renderFunction = render

const root = Router.initRoot({
  injectSelector: 'main',
  render: (outer) => {
    return html`<header>
        <style>
          nav {
            margin: 20px 0;
          }
          a {
            color: magenta;
            padding: 10px;
            display: inline-block;
          }
          footer {
            margin-top: 20px;
          }
        </style>
        <h1>Router example</h1>
        <nav>
          <a href="/cart/new">Cart new</a>
          <a href="/cart/view">Cart view</a>
          <a href="/catalog">Catalog</a>
        </nav>
      </header>
      <section>${outer?.() ?? ''}</section>
      <footer>StatxRouter v${Pack.version}</footer>`
  },
})

const cart = root.addChild({
  name: 'cart',
  render: (outer) => html`<cart-element>${outer?.()}</cart-element>`,
})
cart.addChild({
  name: 'new',
  render: () => html`<cartnew-element></cartnew-element>`,
  entry: () => false,
})
cart.addChild({
  name: 'view',
  render: () => html`Many many cheep items`,
})

root.addChild({
  name: 'catalog',
  render: () => html`Catalog`,
})

Router.start()

//@ts-ignore
window.path = url

class Cart extends LitElement {
  render() {
    return html`<h3>MyCart</h3>
      <p><slot></slot></p> `
  }
}
class CartNew extends LitElement {
  render() {
    return html`<strong>This is new Cart</strong>`
  }
}
customElements.define('cart-element', Cart)
customElements.define('cartnew-element', CartNew)
