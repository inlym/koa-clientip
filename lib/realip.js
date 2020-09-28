'use strict'

module.exports = function realip(options = {}) {
	if (typeof options !== 'object') {
		throw new Error('配置参数错误')
	}

	const DEFAULT_INDEX = 0

	const disabled = options.disabled || false
	const index = options.index || DEFAULT_INDEX

	if (typeof index !== 'number') {
		throw new Error('参数 index 应该是一个整数')
	}

	return async function getClientIp(ctx, nextMiddleware) {
		if (disabled) {
			return await nextMiddleware()
		}

		const ips = ctx.ips
		const length = ips.length

		if (index >= DEFAULT_INDEX) {
			ctx.request.ip = ips[index]
		} else {
			ctx.request.ip = ips[length + index]
		}

		await nextMiddleware()
	}
}
