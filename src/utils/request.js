// 统一的请求发送
import axios from 'axios'
import qs from 'qs'
import { Modal, message } from 'ant-design-vue'
import sysConfig from '@/config/settings'
import tool from '@/utils/tool'
import { convertUrl } from './apiAdaptive'

// 以下这些code需要重新登录
const reloadCodes = [401, 1011007, 1011008]
const errorCodeMap = {
	400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
	401: '用户没有权限（令牌、用户名、密码错误）。',
	403: '用户得到授权，但是访问是被禁止的。',
	404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
	406: '请求的格式不可得。',
	410: '请求的资源被永久删除，且不会再得到的。',
	422: '当创建一个对象时，发生一个验证错误。',
	500: '服务器发生错误，请检查服务器。',
	502: '网关错误。',
	503: '服务不可用，服务器暂时过载或维护。',
	504: '网关超时。'
}
// 定义一个重新登录弹出窗的变量
const loginBack = ref(false)
// 创建 axios 实例
const service = axios.create({
	// baseURL: '/api', // api base_url
	baseURL: import.meta.env.VITE_API_BASEURL,
	timeout: sysConfig.TIMEOUT // 请求超时时间
})

// HTTP request 拦截器
service.interceptors.request.use(
	(config) => {
		// header中携带token
		const token = tool.data.get('TOKEN')
		if (token) {
			config.headers[sysConfig.TOKEN_NAME] = sysConfig.TOKEN_PREFIX + token
		}
		// get请求携带时间戳
		if (!sysConfig.REQUEST_CACHE && config.method === 'get') {
			config.params = config.params || {}
			config.params._ = new Date().getTime()
		}
		// 携带配置中的固定header
		Object.assign(config.headers, sysConfig.HEADERS)
		return config
	},
	(error) => {
		return Promise.reject(error)
	}
)

// 保持重新登录Modal的唯一性
const reLogin = () => {
	loginBack.value = true
	Modal.error({
		title: '提示：',
		okText: '重新登录',
		content: '登录已失效， 请重新登录',
		onOk: () => {
			loginBack.value = false
			tool.data.remove('TOKEN')
			tool.data.remove('USER_INFO')
			tool.data.remove('MENU')
			tool.data.remove('PERMISSIONS')
			window.location.reload()
		}
	})
}

// HTTP response 拦截器
service.interceptors.response.use(
	(response) => {
		// 二进制数据不处理，直接返回文件流
		if (response.request.responseType === 'blob') {
			return response
		}
		// 返回的报文内容
		const res = response.data
		// 如果需要重新登陆
		if (reloadCodes.includes(res.code)) {
			if (!loginBack.value) {
				reLogin()
			}
			return
		}
		// 响应code不为0则认为失败
		if (res.code !== 0) {
			console.log("网络错误:" + response.config.url)
			message.error(res.msg || "网络错误")
			return Promise.reject(res)
		} else {
			// 统一成功提示
			const functionName = response.config.url.split('/').pop()
			const apiNameArray = [
				'add',
				'edit',
				'delete',
				'update',
				'grant',
				'reset',
				'stop',
				'pass',
				'disable',
				'enable',
				'revoke',
				'suspend',
				'active',
				'turn',
				'adjust',
				'reject',
				'saveDraft'
			]
			apiNameArray.forEach((apiName) => {
				// 上面去掉接口路径后，方法内包含内置的进行统一提示成功
				if (functionName.includes(apiName)) {
					message.success(res.msg)
				}
			})
		}
		return Promise.resolve(res.data)
	},
	(error) => {
		if (error) {
			const status = 503
			const description = errorCodeMap[status]
			console.error({
				message: '请求错误',
				description
			})
			return Promise.reject(status)
		}
	}
)

// 适配器, 用于适配不同的请求方式
export const baseRequest = (url, value = {}, method = 'post', options = {}) => {
	url = sysConfig.API_URL + convertUrl(url)
	if (method === 'post') {
		return service.post(url, value, options)
	} else if (method === 'get') {
		return service.get(url, { params: value, ...options })
	} else if (method === 'formdata') {
		// form-data表单提交的方式
		return service.post(url, qs.stringify(value), {
			headers: {
				'Content-Type': 'multipart/form-data'
			},
			...options
		})
	} else {
		// 其他请求方式，例如：put、delete
		return service({
			method: method,
			url: url,
			data: value,
			...options
		})
	}
}

// 自定义的通用下载方法
service.download = function download(config) {
	return service({
		responseType: 'blob',
		...config
	}).then(async response => {
		if (response.data.type === 'application/json') {
			const resText = await response.data.text()
			const res = JSON.parse(resText)
			Message.error(res.message)
			return
		}
		// 创建一个链接元素用于下载
		const url = window.URL.createObjectURL(new Blob([response.data]))
		const link = document.createElement('a')
		link.href = url
		// 设置下载文件名
		link.setAttribute('download', 'moyu.zip')
		document.body.appendChild(link)
		link.click()
		// 清理并移除链接元素
		document.body.removeChild(link)
		window.URL.revokeObjectURL(url)
	}).catch(err => {
		console.error(err)
		Message.error('下载文件失败！')
	})
}

// 提交表单
service.postForm = function postForm(url, data, config) {
	// 删除所有的null属性和未定义属性
	const formData = new FormData()
	for (const key in data) {
		if (data[key] != null && typeof (data[key]) !== 'undefined') {
			formData.append(key, data[key])
		}
	}
	return service.post(url, formData, config)
}

// 提交Json
service.postJson = function postJson(url, data, config) {
	// 删除所有的null属性和未定义属性
	for (const key in data) {
		if (data[key] == null || typeof (data[key]) === 'undefined') {
			delete data[key]
		}
	}
	return service.post(url, data, config)
}

export default service
