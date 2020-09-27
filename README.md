# koa-clientip README

# koa-clientip

用于 Koa 框架中获取真实客户端 IP 地址(适用于使用了 API 网关、反向代理或负载均衡等场景)

## 背景介绍

一般情况下，Koa 框架会从指定 Header 的字段（一般为 X-Forwarded-For）或请求的 socket 的 remoteAddress 获取 IP 地址。如果用户的请求并未直接发送到 Koa 框架，而是中间套了几层代理转发，那么就只能使用 Header 的指定字段来传递 IP 地址，而使用这种方法，可能面临调用者伪造对应 Header 字段的问题。

## 使用场景

下面介绍几种常见的场景如何配置获取客户端 IP 地址，部分场景不需要使用当前中间件。

> 下述将 API 网关、反向代理和负载均衡等统称为“代理转发”。

### 无代理转发

这种情况无需额外处理，Koa 自动获取请求的 socket 的 remoteAddress 作为客户端 IP 地址（赋值到 ctx.request.ip）

```javascript
const Koa = require('koa')
const app = new Koa()
app.use(ctx=>{
	console.log(ctx.ip)
})
...
```

### 自建 Nginx 的代理转发

这种情况也比较简单，因此**可以在 Nginx 中配置\*\***重置覆盖\***\*用户伪造的 Header**，以使用 X-Forwarded-For 传递 IP 地址为例，第 1 层的代理转发和后面的代理转发策略是不一样的。

第 1 层的代理转发要重置 Header 的 X-Forwarded-For 字段，在 Nginx 中配置：

```javascript
proxy_set_header X-Forwarded-For $remote_addr;
```

**不要**配置成以下语句，这种方式仅添加，未重置，会将用户伪造的字段值带入。

```javascript
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

从第 2 层的代理转发开始，可以配置以下语句，追加代理转发的 IP 地址：

```javascript
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

以上这种方式配置的，也无需使用当前的中间件，和无代理转发一致（在 Koa 框架中已做处理）

```javascript
const Koa = require('koa')
const app = new Koa({
	proxy:true,    // 表明存在代理转发
})
app.use(ctx=>{
	console.log(ctx.ip)
})
...
```

### 使用云厂商的代理转发

实测很多云厂商（阿里云、腾讯元等）的代理转发（例如 API 网关、负载均衡、反向代理等）对于 Header 字段值只能做“追加”，无法“重置”，只能将用户伪造的 Header 字段值传入到应用层。这种情况下就需要用到本中间件了。

我们可以认为从云厂商处开始的代理转发追加的 IP 地址是可靠的，因此**只需要倒序找到用户的客户端 IP 即可**。

```javascript
const Koa = require('koa')
const clientip = require('koa-clientip')
const app = new Koa({
	proxy:true,    // 表明存在代理转发
})
app.use(clientip({
	index: -2,    // 表明倒数第2个是真实客户端 IP
}))
app.use(ctx=>{
	console.log(ctx.ip)    // IP 会直接赋值到 Koa 框架对应的 IP 值中，直接获取使用即可
})
...
```

除了 index 属性外，还可以使用 disabled 属性禁用该中间件。

```javascript
app.use(
	clientip({
		index: -2,
		disabled: true,
	})
)
```
