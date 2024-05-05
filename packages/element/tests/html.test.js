/* eslint-disable no-undef */
import {expect} from '@esm-bundle/chai'
import {state} from '@statx/core'

import {render, html} from '../src/html'

it('Should Render nodes', () => {
  document.body.innerHTML = `<div id = 'test'></div>`
  const testNode = document.querySelector('#test')
  expect(testNode).instanceOf(HTMLElement)
  render(html`<div><button>Button</button></div>`, testNode)
  expect(document.querySelector('button').textContent).equal('Button')
})

it('Should replace render content', () => {
  render(html`<div></div>`, document.body)
  render(html`<button></button>`, document.body)
  expect(document.querySelector('button')).instanceOf(HTMLButtonElement)
})

it('Should render text values', () => {
  const a1 = state(10)
  render(html`<div>${a1()}</div>`, document.body)
  expect(document.querySelector('div').textContent).equal('10')
})

it('Should render and update state text values', async () => {
  const a1 = state(10)
  render(html`<div>${a1}</div>`, document.body)
  expect(document.querySelector('div').textContent).equal('10')
  a1.set(20)
  await 1
  expect(document.querySelector('div').textContent).equal('20')
})

it('Should render and update state attribute values', async () => {
  const a1 = state('red')
  const a2 = state('green')
  render(html`<div class="${a1}"></div>`, document.body)
  expect(document.querySelector('div').classList.contains('red')).equal(true)

  render(html`<div class="${a1} ${a2}"></div>`, document.body)
  const div = document.querySelector('div')
  expect(div.classList.contains('red')).equal(true)
  expect(div.classList.contains('green')).equal(true)
  a1.set('black')
  a2.set('grey')
  await 1
  expect(div.classList.contains('red')).equal(false, 'red')
  expect(div.classList.contains('green')).equal(false, 'green')
  expect(div.classList.contains('black')).equal(true, 'black')
  expect(div.classList.contains('grey')).equal(true, 'grey')
})

it('Should render and update boolean attribute values', async () => {
  const a1 = state(true)
  render(html`<button ?disabled="${a1}"></button>`, document.body)

  expect(document.querySelector('button').disabled).equal(true)
  expect(document.querySelector('button').hasAttribute('disabled')).equal(true)
  expect(document.querySelector('button').hasAttribute('?disabled')).equal(false)

  a1.set(false)

  await 1
  expect(document.querySelector('button').hasAttribute('disabled')).equal(false)
  expect(document.querySelector('button').hasAttribute('?disabled')).equal(false)

  a1.set(true)
  await 1
  expect(document.querySelector('button').hasAttribute('disabled')).equal(true)
  expect(document.querySelector('button').hasAttribute('?disabled')).equal(false)
})

it('Should render and update property values', async () => {
  const a1 = state('button')
  const node = html`<input .value="${a1}" />`
  render(node, document.body)

  expect(document.querySelector('input').value).equal('button')

  a1.set('submit')

  await 1
  expect(document.querySelector('input').value).equal('submit')
  expect(document.querySelector('input').hasAttribute('value')).equal(false)
})

it('Should handle events', async () => {
  let i = 0
  const handleClick = () => {
    i++
  }
  render(html`<button @click="${handleClick}"></button>`, document.body)
  document.querySelector('button')?.click()
  document.querySelector('button')?.click()
  document.querySelector('button')?.click()
  expect(i).equal(3)
})

it('Should no sunscribers when node unmount events', async () => {
  const a1 = state(10)
  const res = html`<div>${a1}</div>`
  render(res, document.body)
  expect(a1.deps.length).equal(1)
  expect(document.querySelector('div').textContent).equal('10')
  res.dispose()
  expect(a1.deps?.length).to.be.undefined
  a1.set(20)
  await 1

  expect(document.querySelector('div').textContent).equal('10')
  res.restore()
  expect(a1.deps.length).equal(1)
  await 1

  expect(document.querySelector('div').textContent).equal('20')
})

// TODO atributes tests
