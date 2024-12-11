import service from '@/utils/request'

/**
 * 菜单相关接口
 */
export default {
	// 查询菜单列表
	menuList(data) {
		return service.postJson('/api/sys/menu/list', data)
	},
	// 分页查询菜单列表
	menuPage(data) {
		return service.postJson('/api/sys/menu/page', data)
	},
	// 获取菜单树
	menuTree(data) {
		return service.postJson('/api/sys/menu/tree', data)
	},
}
