import {expect} from '@esm-bundle/chai'
import {StateURL, parseQueryParams} from '../url'

it('test queries', async () => {
  window.history.pushState({}, '', '/?data=test1')
  const url = new StateURL()
  expect(url.query().data).equal('test1')
})
it('test push', async () => {
  const url = new StateURL()
  url.push('/?data=test1')
  expect(url.query().data).equal('test1')
})

it('test addQueryParam', async () => {
  const url = new StateURL()
  url.addQueryParam('test', 'value')

  expect(url.query().test).equal('value')
  expect(parseQueryParams().test).equal('value')
})

it('test deleteQueryParam', async () => {
  const url = new StateURL()
  url.push('/?data=test1')
  url.deleteQueryParam('test')

  expect(url.query().test).equal(undefined)
  expect(parseQueryParams().test).equal(undefined)
})

it('test path', async () => {
  const url = new StateURL()
  url.push('/test1')

  expect(url.path()).equal('/test1')
})

it('test hash', async () => {
  const url = new StateURL()
  url.push('/test1#test')

  expect(url.hash()).equal('#test')
})
