'use strict'

module.exports = function realip(options = {}) {
	if (typeof options !== 'object') {
		throw new Error('配置参数错误')
	}

	const disabled = options.disabled || false
	const index = options.index || 0

	if (typeof index !== 'number') {
		throw new Error('参数 index 应该是一个整数')
	}

	return async function (ctx, next) {
		if (disabled) {
			return await next()
		}

		const ips = ctx.ips
		const length = ips.length

		if (index >= 0) {
			ctx.request.ip = ips[index]
		} else {
			ctx.request.ip = ips[length + index]
		}

		await next()
	}
}
