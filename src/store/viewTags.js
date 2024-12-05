import { defineStore } from 'pinia'

export const viewTagsStore = defineStore('viewTags', () => {
	// 定义state
	const viewTags = ref([])

	// 定义action
	const pushViewTags = (route) => {
		const target = viewTags.value.find((item) => item.path === route.path)
		const isName = route.name
		if (!target && isName) {
			viewTags.value.push(route)
		}
		if (target) {
			viewTags.value.forEach((item, index) => {
				if (item.path === route.path) {
					viewTags.value[index] = { ...route, ...item }
					// Object.assign(item, route)
				}
			})
		}
	}
	const removeViewTags = (route) => {
		viewTags.value.forEach((item, index) => {
			if (item.fullPath === route.fullPath) {
				viewTags.value.splice(index, 1)
			}
		})
	}
	const updateViewTags = (route) => {
		viewTags.value.forEach((item, index) => {
			if (item.fullPath === route.fullPath) {
				viewTags.value[index] = { ...route, ...item }
				// Object.assign(item, route)
			}
		})
	}
	// 更新或删除视图标签
	const updateOrRemoveViewTags = (routes) => {
		if (routes && routes.length > 0) {
			viewTags.value.forEach((item, index) => {
				const target = routes.find((route) => route.path === item.fullPath)
				if (!target) {
					// 路由不存在，删除
					viewTags.value.splice(index, 1)
				} else {
					// 路由存在，更新
					viewTags.value = viewTags.value.map((item) => {
						if (item.fullPath === target.path) {
							return { ...item, meta: target.meta }
						}
						return item
					})
				}
			})
		}
	}
	const updateViewTagsTitle = (title = '') => {
		const nowFullPath = location.hash.substring(1)
		viewTags.value.forEach((item) => {
			if (item.fullPath === nowFullPath) {
				item.meta.key = Date.now()
				item.meta.title = title
			}
		})
	}
	const clearViewTags = () => {
		viewTags.value = []
	}

	return {
		viewTags,
		pushViewTags,
		removeViewTags,
		updateViewTags,
		updateViewTagsTitle,
		clearViewTags,
		updateOrRemoveViewTags
	}
})
