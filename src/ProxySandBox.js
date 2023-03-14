// 支持多应用的代理沙箱
class ProxySandBox {
  proxyWindow
  isRunning = false

  active() {
    this.isRunning = true
  }

  inactive() {
    this.isRunning = false
  }

  constructor() {
    const fakeWindow = Object.create(null)
    this.proxyWindow = new Proxy(fakeWindow, {
      set: (target, prop, value, receiver) => {
        if (this.isRunning) {
          target[prop] = value
        }
      },
      get: (target, prop, receiver) => {
        return prop in target ? target[prop] : window[prop]
      }
    })
  }
}

// 验证：
let proxySandBox1 = new ProxySandBox()
let proxySandBox2 = new ProxySandBox()
proxySandBox1.active()
proxySandBox2.active()
proxySandBox1.proxyWindow.city = 'Beijing'
proxySandBox2.proxyWindow.city = 'Shanghai'
console.log('active:proxySandBox1:window.city:', proxySandBox1.proxyWindow.city)
console.log('active:proxySandBox2:window.city:', proxySandBox2.proxyWindow.city)
console.log('window:window.city:', window.city)
proxySandBox1.inactive()
proxySandBox2.inactive()
proxySandBox1.proxyWindow.city = 'Beijing2'
proxySandBox2.proxyWindow.city = 'Shanghai2'
console.log('inactive:proxySandBox1:window.city:', proxySandBox1.proxyWindow.city)
console.log('inactive:proxySandBox2:window.city:', proxySandBox2.proxyWindow.city)
console.log('window:window.city:', window.city)

// 输出：
// active:proxySandBox1:window.city: Beijing
// active:proxySandBox2:window.city: Shanghai
// window:window.city: undefined
// inactive:proxySandBox1:window.city: Beijing
// inactive:proxySandBox2:window.city: Shanghai
// window:window.city: undefined
