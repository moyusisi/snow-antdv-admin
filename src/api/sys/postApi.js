import service from '@/utils/request'

/**
 * 分组(角色组、岗位)
 *
 * @author yubaoshan
 * @date 2022-09-22 22:33:20
 */
export default {
	// 查询岗位分组列表
	postList(data) {
		return service.postJson('/api/sys/post/list', data)
	},
	// 分页查询岗位分组列表
	postPage(data) {
		return service.postJson('/api/sys/post/page', data)
	},
	// 获取岗位分组详情
	postDetail(data) {
		return service.postJson('/api/sys/post/detail', data)
	},
	// 新增岗位分组
	addPost(data) {
		return service.postJson('/api/sys/post/add', data)
	},
	// 删除岗位分组，通过ids删除
	deletePost(data) {
		return service.postJson('/api/sys/post/delete', data)
	},
	// 编辑岗位分组
	editPost(data) {
		return service.postJson('/api/sys/post/edit', data)
	},
}
