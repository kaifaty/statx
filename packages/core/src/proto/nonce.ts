class Nonce {
  private value = 0
  clear() {
    this.value = 0
  }
  get() {
    return this.value++
  }
}
export const nonce = new Nonce()
