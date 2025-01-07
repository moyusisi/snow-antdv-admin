import { defineStore } from 'pinia'
import userCenterApi from '@/api/sys/userCenterApi'
import { useGlobalStore } from '@/store'
import tool from '@/utils/tool'

export const userStore = defineStore('userStore', () => {
	// 定义state
	// 用户信息
	// const userInfo = ref(tool.data.get('USER_INFO') || {})

	// 定义action
	// 初始化用户信息
	const initUserInfo = async () => {
		const data = await userCenterApi.loginUserInfo()
		const globalStore = useGlobalStore()
		globalStore.setUserInfo(data)
		tool.data.set('USER_INFO', data)
	}
	// 刷新登录用户信息
	const refreshUserLoginUserInfo = () => {
		userCenterApi.loginUserInfo().then((data) => {
			const globalStore = useGlobalStore()
			globalStore.setUserInfo(data)
			tool.data.set('USER_INFO', data)
		})
	}
	return { initUserInfo, refreshUserLoginUserInfo }
})
