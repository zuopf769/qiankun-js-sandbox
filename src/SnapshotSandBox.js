// 快照沙箱
class SnapshotSandBox {
  // windows快照
  windowSnapshot = {}
  // 当前微应用修改的全局变量
  modifyPropsMap = {}

  // 激活当前微应用
  active() {
    // 保存window上的所有属性的状态
    // 恢复上一次运行该微应用的时候所修改过的window上的属性
  }

  // 当前微应用失活
  inactive() {
    // 将windows上的所有属性恢复至微应用运行执行的状态
    // 记录当前微应用修改了window
  }
}

// 验证:
let snapshotSandBox = new SnapshotSandBox()
console.log('window.city-00:', window.city) // 激活之前window上没有city属性
snapshotSandBox.active() // 激活
window.city = 'Beijing' // 激活后给window上设置city属性
console.log('window.city-01:', window.city) // Beijing
snapshotSandBox.inactive() // 失活后window上的属性恢复到原本的状态
console.log('window.city-02:', window.city) // undefined
snapshotSandBox.active() // 再次激活
console.log('window.city-03:', window.city) // Beijing
snapshotSandBox.inactive()
