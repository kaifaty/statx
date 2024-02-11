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
