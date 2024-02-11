export class GithubAPI {
  token = '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'
  base = `https://api.github.com`
  apiCall = async (method: string, subPath: string) => {
    const url = `${this.base}/${method}/${subPath}`
    const res = await fetch(url, {
      headers: {
        Authorization: 'Token ' + this.token,
      },
    })

    const unwraped = await res.json()
    if (res.ok !== true) {
      throw new Error(unwraped)
    }
    return unwraped
  }
  reposApi = (user: string) => this.apiCall('users', `${user}/repos`)
}
