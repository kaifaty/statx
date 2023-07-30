import {createI18n} from '../translation.js'
import {test} from 'uvu'
import * as assert from 'uvu/assert'

test('test value', () => {
  const v = createI18n(
    {
      test: {
        en: 'value - ${value}',
      },
    },
    'en',
  )

  const result = v.i18n('test', {value: 'str'})

  assert.is(result, 'value - 123')
})
test.run()
