// 支持单应用的代理沙箱
// 不能遍历window的所有属性
class LegacySandBox {
  // 沙箱期间新增的全局变量
  addedPropsMapInSandbox = new Map()
  // 沙箱期间更新的全局变量-存放要修改的属性的原始值OriginalValue
  modifiedPropsOriginalValueMapInSandbox = new Map()
  // 持续记录更新的(新增和修改的)全局变量的 map，用于在任意时刻做 snapshot
  currentUpdatedPropsValueMap = new Map()
  // 代理window对象，用户不要直接操作window对象，而是使用proxyWindow来新增修改属性
  proxyWindow

  constructor() {
    // 假的window
    const fakeWindow = Object.create(null)
    // 代理window对象
    this.proxyWindow = new Proxy(fakeWindow, {
      set: (target, prop, value, receiver) => {
        // 给代理window上新增属性
        if (!window.hasOwnProperty(prop)) {
          this.addedPropsMapInSandbox.set(prop, value)
        } else if (!this.modifiedPropsOriginalValueMapInSandbox.has(prop)) {
          // 要修改window的已经有的prop的原始值
          const originalVal = window[prop]
          // 修改代理window上原本的属性，需要保留没有修改之前的该属性值，用于失活的时候恢复
          this.modifiedPropsOriginalValueMapInSandbox.set(prop, originalVal)
        }
        // 该沙箱激活时当前全局变量的快照
        this.currentUpdatedPropsValueMap.set(prop, value)
        // 将激活该微应用时修改和添加的属性设置到window全局变量上
        window[prop] = value
      },
      get: (target, prop, receiver) => {
        return window[prop]
      }
    })
  }

  setWindowProp(prop, value, toDelete = false) {
    if (value === undefined && toDelete) {
      delete window[prop]
    } else {
      window[prop] = value
    }
  }

  // 激活当前微应用
  active() {
    // 恢复上一次运行该微应用的时候所修改过的属性到windows
    this.currentUpdatedPropsValueMap.forEach((value, prop) => this.setWindowProp(prop, value))
  }

  // 当前微应用失活-还原window上所有的属性
  inactive() {
    // 新添加到window上的属性删除
    this.addedPropsMapInSandbox.forEach((value, prop) => this.setWindowProp(prop, undefined, true))
    // 修改window上的属性的值还原为没修改之前的值
    this.modifiedPropsOriginalValueMapInSandbox.forEach((value, prop) => this.setWindowProp(prop, value))
  }
}

// 验证:
let legacySandBox = new LegacySandBox()
console.log('window.city-00:', window.city) // undefined 激活之前window上没有city属性
legacySandBox.active() // 激活
legacySandBox.proxyWindow.city = 'Beijing' // 激活后给window上设置city属性
console.log('window.city-01:', window.city) // Beijing
legacySandBox.inactive() // 失活后window上的属性恢复到原本的状态
console.log('window.city-02:', window.city) // undefined
legacySandBox.active() // 再次激活，恢复到上次微前端修改后的状态
console.log('window.city-03:', window.city) // Beijing
legacySandBox.inactive()

// 输出：
// window.city-00: undefined
// window.city-01: Beijing
// window.city-02: undefined
// window.city-03: Beijing
