import {state} from '@statx/core'
import {suspenseState} from '../suspense.js'

const url = `https://api.github.com/repos/javascript-tutorial/en.javascript.info/commits`

const sha = state('ea7738bb7c3616bb51ff14ae3db2a2747d7888ff')

const fetchCommits = async () => {
  const request = await fetch(url + `/${sha()}`)
  const res = request.json()
  return res
}

const commits = suspenseState(fetchCommits, {cacheLocal: {name: 'commits'}})

console.log('initial', commits.isFetching, commits.isLoading, commits.data)

commits.subscribe(({isFetching, isLoading, data}) => {
  console.log('updated', isFetching, isLoading, data)
})

setTimeout(() => sha.set('4a8e8e19394ca7c2c29a28edc4ef987bc6e05a38'), 3000)
