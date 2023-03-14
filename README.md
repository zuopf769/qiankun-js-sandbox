# 乾坤的JS隔离机制原理剖析

## 概述

乾坤，作为一款微前端领域的知名框架，其建立在`single-spa`基础上。相较于`single-spa`，乾坤做了两件重要的事情，其一是加载资源，第二是进行资源隔离。

而资源隔离又分为`JS`资源隔离和`CSS`资源隔离，本文主要探索的是乾坤的`JS`资源隔离机制。

下文会分三部分来进行讲解：

+ 乾坤`JS`隔离机制的发展史；
+ 编码实现三种`JS`隔离机制的核心逻辑，并分析各自的优劣；
+ 分析乾坤的三种Js隔离机制的源代码，并深入细节进行解析；


## 乾坤Js隔离机制的发展史

我们把`JS`隔离机制常常称作沙箱，事实上，乾坤有三种`JS`隔离机制，并且在源代码中也是以 `SnapshotSandbox`、`LegacySandbox`、`ProxySandbox`三个类名来指代三种不同的隔离机制。

下面我们统一以快照沙箱、支持单应用的代理沙箱、支持多应用的代理沙箱，来代表这三种不同的Js隔离机制。

那么问题来了，隔离就隔离，怎么有这么多沙箱？

### 快照沙箱

一开始乾坤也只有一种沙箱叫“快照沙箱”，也就是由SnapshotSandbox类来实现的沙箱。这个沙箱有个缺点，就是需要遍历window上的所有属性，性能较差。


### LegacySandbox - 支持单应用的代理沙箱

随着`ES6`的普及，利用`Proxy`可以比较良好的解决这个问题，这就诞生了`LegacySandbox`，可以实现和快照沙箱一样的功能，但是却性能更好，和`SnapshotSandbox`一样，由于会污染全局的`window`，`LegacySandbox`也仅仅允许页面同时运行一个微应用，所以我们也称`LegacySandbox`为支持单应用的代理沙箱。

从`LegacySandbox`这个类名可以看出，一开始肯定是不叫`LegacySandbox`，是因为有了更好的机制，才将这个名字强加给它了。


### ProxySandbox - 支持多应用的代理沙箱

那这个更好的机制是什么呢，就是`ProxySandbox`，它可以支持一个页面运行多个微应用，因此我们称ProxySandbox为支持多应用的代理沙箱。

事实上，`LegacySandbox`在未来应该会消失，因为`LegacySandbox`可以做的事情，`ProxySandbox`都可以做，而`SanpsshotSandbox`因为向下兼容的原因反而会和`ProxySandbox`长期并存。



