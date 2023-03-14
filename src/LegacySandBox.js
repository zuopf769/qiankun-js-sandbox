// 支持单应用的代理沙箱
// 不能遍历window的所有属性
class LegacySandBox {
  // 沙箱期间新增的全局变量
  addedPropsMapInSandbox = new Map()
  // 沙箱期间更新的全局变量
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
        // 修改代理window上原本的属性，需要保留没有修改之前的该属性值，用于失活的时候恢复
      },
      get: (target, prop, receiver) => {}
    })
  }

  // 激活当前微应用
  active() {
    // 恢复上一次运行该微应用的时候所修改过的属性到windows
  }

  // 当前微应用失活
  inactive() {
    // 还原window上所有的属性
    // 新添加到window上的属性删除
    // 修改window上的属性的值还原为没修改之前的值
  }
}

// 验证:
let snapshotSandBox = new LegacySandBox()
console.log('window.city-00:', window.city) // undefined 激活之前window上没有city属性
snapshotSandBox.active() // 激活
legacySandBox.proxyWindow.city = 'Beijing' // 激活后给window上设置city属性
console.log('window.city-01:', window.city) // Beijing
snapshotSandBox.inactive() // 失活后window上的属性恢复到原本的状态
console.log('window.city-02:', window.city) // undefined
snapshotSandBox.active() // 再次激活，恢复到上次微前端修改后的状态
console.log('window.city-03:', window.city) // Beijing
snapshotSandBox.inactive()

// 输出：
// window.city-00: undefined
// window.city-01: Beijing
// window.city-02: undefined
// window.city-03: Beijing
