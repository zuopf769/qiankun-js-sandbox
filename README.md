# 乾坤的 JS 隔离机制原理剖析

## 概述

乾坤，作为一款微前端领域的知名框架，其建立在`single-spa`基础上。相较于`single-spa`，乾坤做了两件重要的事情，其一是加载资源，第二是进行资源隔离。

而资源隔离又分为`JS`资源隔离和`CSS`资源隔离，本文主要探索的是乾坤的`JS`资源隔离机制。

下文会分三部分来进行讲解：

- 乾坤`JS`隔离机制的发展史；
- 编码实现三种`JS`隔离机制的核心逻辑，并分析各自的优劣；
- 分析乾坤的三种 Js 隔离机制的源代码，并深入细节进行解析；

## 乾坤 Js 隔离机制的发展史

我们把`JS`隔离机制常常称作沙箱，事实上，乾坤有三种`JS`隔离机制，并且在源代码中也是以 `SnapshotSandbox`、`LegacySandbox`、`ProxySandbox`三个类名来指代三种不同的隔离机制。

下面我们统一以快照沙箱、支持单应用的代理沙箱、支持多应用的代理沙箱，来代表这三种不同的 Js 隔离机制。

那么问题来了，隔离就隔离，怎么有这么多沙箱？

### 快照沙箱

一开始乾坤也只有一种沙箱叫“快照沙箱”，也就是由 SnapshotSandbox 类来实现的沙箱。这个沙箱有个缺点，就是需要遍历 window 上的所有属性，性能较差。

### LegacySandbox - 支持单应用的代理沙箱

随着`ES6`的普及，利用`Proxy`可以比较良好的解决这个问题，这就诞生了`LegacySandbox`，可以实现和快照沙箱一样的功能，但是却性能更好，和`SnapshotSandbox`一样，由于会污染全局的`window`，`LegacySandbox`也仅仅允许页面同时运行一个微应用，所以我们也称`LegacySandbox`为支持单应用的代理沙箱。

从`LegacySandbox`这个类名可以看出，一开始肯定是不叫`LegacySandbox`，是因为有了更好的机制，才将这个名字强加给它了。

### ProxySandbox - 支持多应用的代理沙箱

那这个更好的机制是什么呢，就是`ProxySandbox`，它可以支持一个页面运行多个微应用，因此我们称 ProxySandbox 为支持多应用的代理沙箱。

事实上，`LegacySandbox`在未来应该会消失，因为`LegacySandbox`可以做的事情，`ProxySandbox`都可以做，而`SanpsshotSandbox`因为向下兼容的原因反而会和`ProxySandbox`长期并存。

## 编码实现三个沙箱的核心逻辑

### 快照沙箱-极简版

```JavaScript
// 快照沙箱
class SnapshotSandBox {
  // window属性快照-存放激活该微前端前window对象的所有属性
  windowSnapshot = {}
  // 存放激活微应用后当前微应用修改的全局变量
  modifyPropsMap = {}

  // 激活当前微应用，激活后直接往window对象上添加和删除prop
  active() {
    // 1. 保存window上的所有属性的状态到快照对象windowSnapshot上
    for (const prop in window) {
      this.windowSnapshot[prop] = window[prop]
    }
    // 2. 恢复上一次运行该微应用的时候所修改过的window上的属性
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
        // 1. 记录当前微应用修改了window上哪些属性
        this.modifyPropsMap[prop] = window[prop]
        // 2. window上的属性恢复至微应用运行之前的状态
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
```

快照沙箱的核心逻辑很简单，就是在激活沙箱和沙箱失活的时候各做两件事情

- 沙箱激活 - 就是此时我们的微应用处于运行中，这个阶段有可能对 `window` 上的属性进行操作改变；
- 沙箱失活 - 就是此时我们的微应用已经停止了对 `window` 的影响

**在沙箱激活的时候：**

- 记录 `window`当时的状态（我们把这个状态称之为快照，也就是快照沙箱这个名称的来源）；

- 恢复上一次沙箱失活时记录的沙箱运行过程中对 `window` 做的状态改变，也就是上一次沙箱激活后对 `window` 做了哪些改变，现在也保持一样的改变。

**在沙箱失活的时候：**

- 记录 `window` 上有哪些状态发生了变化（沙箱自激活开始，到失活的这段时间）；

- 清除沙箱在激活之后在 `window` 上改变的状态，从代码可以看出，就是让 `window` 此时的属性状态和刚激活时候的 `window` 的属性状态进行对比，不同的属性状态就以快照为准，恢复到未改变之前的状态。

**快照沙箱存在两个重要的问题**

- 会改变全局 `window` 的属性，如果同时运行多个微应用，多个应用同时改写 `window`上的属性，势必会出现状态混乱，这也就是为什么快照沙箱无法支持多各微应用同时运行的原因。关于这个问题，下文中支持多应用的代理沙箱可以很好的解决这个问题；

- 会通过 `for(prop in window){}`的方式来遍历 `window` 上的所有属性，`window` 属性众多，这其实是一件很耗费性能的事情。关于这个问题支持单应用的代理沙箱和支持多应用的代理沙箱都可以规避。

## 支持单应用的代理沙箱-极简版

```JavaScript
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

```

从上面的代码可以看出，其实现的功能和快照沙箱是一模一样的，不同的是，通过三个变量来记住沙箱激活后 window 发生变化过的所有属性，这样在后续的状态还原时候就不再需要遍历 window 的所有属性来进行对比，提升了程序运行的性能。

**存在问题**

但是这仍然改变不了这种机制仍然污染了 window 的状态的事实，因此也就无法承担起同时支持多个微应用运行的任务。
