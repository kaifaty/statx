/* eslint-disable @typescript-eslint/no-explicit-any */
import {test} from 'uvu'
import * as assert from 'uvu/assert'

import {list} from '../index.js'

test('List: create, subscribe', async () => {
  const res = list([0, 1, 2])
  let test = 0

  assert.is(res()[2](), 2)

  res.subscribe((v) => {
    test = v[0].peek()
  })
  res.set([3])

  await 1

  assert.is(test, 3)
})

test('List: push, imutability', async () => {
  const v1 = [0, 1, 2]
  const res = list(v1)
  res.push(3)
  const res2 = res.push(3, 4, 5)

  assert.is(res2, 7)
  assert.is(res().length, 7)
  assert.is.not(v1, res())
})

test('List: pop, imutability', async () => {
  const v1 = [0, 1, 2, 5]
  const res = list(v1)
  const last = res.pop()
  assert.is(last, 5)
  assert.is(res().length, 3)
  assert.is.not(v1, res())
})

test('List: shift, imutability', async () => {
  const v1 = [0, 1, 2]
  const res = list(v1)
  const first = res.shift()

  assert.is(first, 0)
  assert.is(res().length, 2)
  assert.is.not(v1, res())
})

test.only('List: unshift, imutability', async () => {
  const v1 = [11, 12, 13]
  const res = list(v1)
  res.unshift(3)
  const res2 = res.unshift(3, 4, 5)
  assert.is(res().length, 7)
  assert.is(res2, 7)
  assert.is(res()[0](), 3)
  assert.is(res()[2](), 5)
  assert.is(res()[3](), 3)
  assert.is(res()[4](), 11)
  assert.is.not(v1, res())
})

test('List: sort, imutability', async () => {
  const v1 = [11, 1, 5, 0, 3, 4]
  const res = list(v1)

  const sortedAsStrings = res.sort()
  assert.is(sortedAsStrings, res())

  const sortedAsNumbers = res.sort((a, b) => a - b)
  assert.is(sortedAsNumbers, res())

  assert.is.not(v1, sortedAsStrings)
  assert.is.not(v1, sortedAsNumbers)

  assert.is(sortedAsStrings[0], 0)
  assert.is(sortedAsStrings.at(-1), 5)
  assert.is(sortedAsNumbers[0], 0)
  assert.is(sortedAsNumbers.at(-1), 11)
})

test('List: at', async () => {
  const v1 = [11, 1, 5, 0, 3, 4]
  const res = list(v1)
  assert.is(res.at(0), 11)
  assert.is(res.at(1), 1)
  assert.is(res.at(11), undefined)
  assert.is(res.at(-1), 4)
  assert.is(res.at(-11), undefined)
})

test('List: indexOf', async () => {
  const v1 = [11, 1, 5, 0, 3, 4]
  const res = list(v1)

  assert.is(res.indexOf(res()[3]), 3)
})

test('List: splice', async () => {
  const v1 = [11, 1, 5, 0, 3, 4]
  const res = list(v1)

  assert.is(res.splice(0, 2)[1](), 1)
  assert.is(res.splice(0, 2)[1](), 0)
  assert.is(res.splice(0, 2)[1](), 4)
})

test.only('List: map', async () => {
  const v1 = [11, 1, 5, 0, 3, 4]
  const res = list(v1)
  const map = res.map((v) => v() + 1)
  assert.is(map().at(0)?.(), 12)
})

test.run()
