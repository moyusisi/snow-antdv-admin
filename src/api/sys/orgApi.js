import service from '@/utils/request'
import { baseRequest } from '@/utils/request'

const request = (url, ...arg) => baseRequest(`/sys/org/` + url, ...arg)
/**
 * 机构
 *
 * @author yubaoshan
 * @date 2022-09-22 22:33:20
 */
export default {
	// 查询组织机构列表
	orgList(data) {
		return service.postJson('/api/sys/org/list', data)
	},
	// 分页查询组织机构列表
	orgPage(data) {
		return service.postJson('/api/sys/org/page', data)
	},
	// 获取组织机构树
	orgTree(data) {
		return service.postJson('/api/sys/org/tree', data)
	},
	// 获取组织机构详情
	orgDetail(data) {
		return service.postJson('/api/sys/org/detail', data)
	},
	// 新增组织机构
	addOrg(data) {
		return service.postJson('/api/sys/org/add', data)
	},
	// 删除组织机构，通过codes删除，会集联删除整个树
	deleteOrgTree(data) {
		return service.postJson('/api/sys/org/deleteTree', data)
	},
	// 编辑组织机构
	editOrg(data) {
		return service.postJson('/api/sys/org/edit', data)
	},



	// 提交表单 edit为true时为编辑，默认为新增
	submitForm(data, edit = false) {
		return request(edit ? 'edit' : 'add', data)
	},

	// 获取组织树选择器
	orgOrgTreeSelector(data) {
		return request('orgTreeSelector', data, 'get')
	},
	// 获取用户选择器
	orgUserSelector(data) {
		return request('userSelector', data, 'get')
	}
}
