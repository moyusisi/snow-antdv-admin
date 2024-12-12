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
	// 获取菜单详情
	menuDetail(data) {
		return service.postJson('/api/sys/menu/detail', data)
	},
	// 新增菜单
	addMenu(data) {
		return service.postJson('/api/sys/menu/add', data)
	},
	// 删除菜单
	deleteMenu(data) {
		return service.postJson('/api/sys/menu/delete', data)
	},
	// 编辑菜单
	editMenu(data) {
		return service.postJson('/api/sys/menu/edit', data)
	},
	// 获取菜单树选择器
	menuTreeSelector(data) {
		return service.postJson('/api/sys/menu/treeSelector', data)
	},
}
