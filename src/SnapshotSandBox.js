// 快照沙箱
class SnapshotSandBox {
  // window属性快照-存放激活该微前端前window对象的所有属性
  windowSnapshot = {}
  // 存放激活微应用后当前微应用修改的全局变量
  modifyPropsMap = {}

  // 激活当前微应用，激活后直接往window对象上添加和删除prop
  active() {
    // 保存window上的所有属性的状态
    for (const prop in window) {
      this.windowSnapshot[prop] = window[prop]
    }
    // 恢复上一次运行该微应用的时候所修改过的window上的属性
    Object.keys(this.modifyPropsMap).forEach(prop => {
      // 上一次运行该微应用的时候修改多的props设置到全局window对象上
      window[prop] = this.modifyPropsMap[prop]
    })
  }

  // 当前微应用失活
  inactive() {
    // 将window上的所有属性恢复至微应用运行之前的状态
    for (const prop in window) {
      // 当前微应用新加的prop或者修改的prop
      if (window[prop] !== this.windowSnapshot[prop]) {
        // 记录当前微应用修改了window上哪些属性
        this.modifyPropsMap[prop] = window[prop]
        // window上的属性恢复至微应用运行之前的状态
        window[prop] = this.windowSnapshot[prop]
      }
    }
  }
}

// 验证:
let snapshotSandBox = new SnapshotSandBox()
console.log('window.city-00:', window.city) // undefined 激活之前window上没有city属性
snapshotSandBox.active() // 激活
window.city = 'Beijing' // 激活后给window上设置city属性
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
