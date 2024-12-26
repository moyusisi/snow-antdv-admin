<template>
	<a-row :gutter="8">
		<!-- 左侧组织树 -->
		<a-col :span="5">
			<a-card :bordered="false" :loading="cardLoading">
				<a-tree
					v-if="treeData.length > 0"
					v-model:expandedKeys="defaultExpandedKeys"
					:tree-data="treeData"
					:field-names="treeFieldNames"
					@select="treeSelect"
				/>
				<a-empty v-else :image="Empty.PRESENTED_IMAGE_SIMPLE" />
			</a-card>
		</a-col>
		<!-- 右侧内容 -->
		<a-col :span="19">
			<a-card :bordered="false" class="xn-mb10">
				<a-form ref="searchFormRef" :model="searchFormData">
					<a-row :gutter="24">
						<a-col :span="8">
							<a-form-item name="searchKey" label="关键词">
								<a-input v-model:value="searchFormData.searchKey" placeholder="请输入姓名或关键词" allowClear />
							</a-form-item>
						</a-col>
						<a-col :span="6">
							<a-form-item label="用户状态" name="status">
								<a-select v-model:value="searchFormData.status" placeholder="请选择状态" :options="statusOptions" allowClear />
							</a-form-item>
						</a-col>
						<a-col :span="8">
							<a-space>
								<a-button type="primary" :icon="h(SearchOutlined)" @click="tableRef.refresh(true)">查询</a-button>
								<a-button :icon="h(RedoOutlined)" @click="reset">重置</a-button>
							</a-space>
						</a-col>
					</a-row>
				</a-form>
			</a-card>
			<a-card :bordered="false">
				<s-table
					ref="tableRef"
					:columns="columns"
					:data="loadTableData"
					:scroll="{ x: 1200 }"
					bordered
					:alert="options.alert.show"
					:row-key="(record) => record.id"
					:row-selection="options.rowSelection"
					:tool-config="toolConfig"
				>
					<template #operator>
						<a-space>
							<a-button type="primary" :icon="h(PlusOutlined)" @click="addFormRef.onOpen(searchFormData.orgCode)">新增用户</a-button>
							<a-button @click="ImpExpRef.onOpen()">
								<template #icon><import-outlined /></template>
								<span>{{ $t('common.imports') }}</span>
							</a-button>
							<a-button @click="exportBatchUserVerify">
								<template #icon><export-outlined /></template>
								{{ $t('user.batchExportButton') }}
							</a-button>
							<xn-batch-button
								buttonName="批量删除"
								icon="DeleteOutlined"
								buttonDanger
								:selectedRowKeys="selectedRowKeys"
								@batchCallBack="batchDeleteUser"
							/>
						</a-space>
					</template>
					<template #bodyCell="{ column, record }">
						<template v-if="column.dataIndex === 'gender'">
							<a-tag v-if="record.gender === 1" color="blue">男</a-tag>
							<a-tag v-else-if="record.gender === 2" color="pink">女</a-tag>
							<a-tag v-else>未知</a-tag>
						</template>
						<template v-if="column.dataIndex === 'status'">
							<a-tag v-if="record.status === 0" color="green">正常</a-tag>
							<a-tag v-else>已停用</a-tag>
						</template>
						<template v-if="column.dataIndex === 'action'">
							<a-space>
								<a-button type="link" size="small" @click="editFormRef.onOpen(record)">编辑</a-button>
<!--								<a-button type="link" size="small" @click="grantMenuFormRef.onOpen(record)">授权</a-button>-->
								<a-popconfirm title="确定要删除此用户吗？" @confirm="deleteUser(record)">
									<a-button type="link" size="small" danger>删除</a-button>
								</a-popconfirm>
							</a-space>
							<a-dropdown>
								<a class="ant-dropdown-link">
									{{ $t('common.more') }}
									<DownOutlined />
								</a>
								<template #overlay>
									<a-menu>
										<a-menu-item>
											<a-popconfirm
												:title="$t('user.popconfirmResatUserPwd')"
												placement="topRight"
												@confirm="resetPassword(record)"
											>
												<a>{{ $t('user.resetPassword') }}</a>
											</a-popconfirm>
										</a-menu-item>
										<a-menu-item>
											<a @click="selectRole(record)">{{ $t('user.grantRole') }}</a>
										</a-menu-item>
										<a-menu-item>
											<a @click="grantResourceFormRef.onOpen(record)">{{ $t('user.grantResource') }}</a>
										</a-menu-item>
										<a-menu-item>
											<a @click="grantPermissionFormRef.onOpen(record)">{{ $t('user.grantPermission') }}</a>
										</a-menu-item>
										<a-menu-item>
											<a @click="exportUserInfo(record)">{{ $t('user.exportUserInfo') }}</a>
										</a-menu-item>
									</a-menu>
								</template>
							</a-dropdown>
						</template>
					</template>
				</s-table>
			</a-card>
		</a-col>
	</a-row>
	<Form ref="formRef" @successful="tableRef.refresh()" />
	<xn-role-selector
		ref="RoleSelectorPlusRef"
		:org-tree-api="selectorApiFunction.orgTreeApi"
		:role-page-api="selectorApiFunction.rolePageApi"
		:add-show="false"
		:show="false"
		:role-global="true"
		@onBack="roleBack"
	/>
	<ImpExp ref="ImpExpRef" />
	<grantResourceForm ref="grantResourceFormRef" @successful="tableRef.refresh()" />
	<grantPermissionForm ref="grantPermissionFormRef" @successful="tableRef.refresh()" />
	<EditForm ref="editFormRef" @successful="tableRef.refresh()" />
	<AddForm ref="addFormRef" @successful="tableRef.refresh()" />
</template>

<script setup>
	import userApi from '@/api/sys/userApi'
	import orgApi from '@/api/sys/orgApi'

	import { h } from "vue";
	import { message, Empty } from 'ant-design-vue'
	import { SearchOutlined, RedoOutlined, PlusOutlined } from "@ant-design/icons-vue";
	import downloadUtil from '@/utils/downloadUtil'
	import Form from './form.vue'
	import ImpExp from './impExp.vue'
	import GrantResourceForm from './grantResourceForm.vue'
	import GrantPermissionForm from './grantPermissionForm.vue'
	import AddForm from './addForm.vue'
	import EditForm from "./editForm.vue"

	const columns = [
		{
			title: '账号',
			dataIndex: 'account',
			resizable: true,
			width: 200,
			ellipsis: true
		},
		{
			title: '姓名',
			dataIndex: 'name',
			resizable: true,
			width: 150
		},
		{
			title: '性别',
			dataIndex: 'gender',
			align: 'center',
			width: 80
		},
		{
			title: '手机',
			dataIndex: 'phone',
			align: 'center',
			width: 150
		},
		{
			title: '机构',
			dataIndex: 'orgName',
			resizable: true,
			width: 200,
			ellipsis: true
		},
		{
			title: '状态',
			dataIndex: 'status',
			align: 'center',
			width: 80
		},
		{
			title: '操作',
			dataIndex: 'action',
			align: 'center',
			resizable: true,
			width: 220
		}
	]
	const selectedRowKeys = ref([])
	// 列表选择配置
	const options = {
		alert: {
			show: false,
			clear: () => {
				selectedRowKeys.value = ref([])
			}
		},
		rowSelection: {
			onChange: (selectedRowKey, selectedRows) => {
				selectedRowKeys.value = selectedRowKey
			}
		}
	}
	// 使用状态options（0正常 1停用）
	const statusOptions = [
		{ label: "正常", value: 0 },
		{ label: "已停用", value: 1 }
	]
	// 定义tableDOM
	const tableRef = ref()
	const toolConfig = { refresh: true, height: true, columnSetting: false, striped: false }
	const addFormRef = ref()
	const editFormRef = ref()
	const searchFormRef = ref()
	const searchFormData = ref({})

	const formRef = ref(null)
	const RoleSelectorPlusRef = ref()
	const selectedRecord = ref({})
	const loading = ref(false)
	const ImpExpRef = ref()
	const grantResourceFormRef = ref()
	const grantPermissionFormRef = ref()
	// 默认展开的节点
	const defaultExpandedKeys = ref([])
	const treeData = ref([])
	// 替换treeNode 中 children,title,key
	const treeFieldNames = { children: 'children', title: 'name', key: 'code' }
	const cardLoading = ref(true)

	onMounted(() => {
		loadTreeData()
	})

	// 表格查询 返回 Promise 对象
	const loadTableData = (parameter) => {
		return userApi.userPage(Object.assign(parameter, searchFormData.value)).then((res) => {
			return res
		})
	}
	// 加载左侧的树
	const loadTreeData = () => {
		orgApi.orgTree().then((res) => {
			cardLoading.value = false
			if (res !== null) {
				treeData.value = res
				defaultExpandedKeys.value = [res[0]?.code]
			}
		}).finally(() => {
			cardLoading.value = false
		})
	}
	// 重置
	const reset = () => {
		searchFormRef.value.resetFields()
		tableRef.value.refresh(true)
	}
	// 点击树查询
	const treeSelect = (selectedKeys) => {
		if (selectedKeys.length > 0) {
			searchFormData.value.orgCode = selectedKeys.toString()
		} else {
			delete searchFormData.value.orgCode
		}
		tableRef.value.refresh(true)
	}
	// 删除用户
	const deleteUser = (record) => {
		let data = { ids: [record.id] }
		userApi.deleteUser(data).then(() => {
			tableRef.value.refresh(true)
		})
	}
	// 批量删除
	const batchDeleteUser = (params) => {
		let data = { ids: selectedRowKeys.value }
		userApi.deleteUser(data).then(() => {
			tableRef.value.clearRefreshSelected()
		})
	}
	// 批量导出校验并加参数
	const exportBatchUserVerify = () => {
		if ((selectedRowKeys.value.length < 1) & !searchFormData.value.searchKey & !searchFormData.value.userStatus) {
			message.warning('请输入查询条件或勾选要导出的信息')
		}
		if (selectedRowKeys.value.length > 0) {
			const params = {
				userIds: selectedRowKeys.value
					.map((m) => {
						return m
					})
					.join()
			}
			exportBatchUser(params)
			return
		}
		if (searchFormData.value.searchKey || searchFormData.value.userStatus) {
			const params = {
				searchKey: searchFormData.value.searchKey,
				userStatus: searchFormData.value.userStatus
			}
			exportBatchUser(params)
		}
	}
	// 批量导出
	const exportBatchUser = (params) => {
		userApi.userExport(params).then((res) => {
			downloadUtil.resultDownload(res)
			tableRef.value.clearSelected()
		})
	}
	// 打开角色选择器
	const selectRole = (record) => {
		selectedRecord.value = record
		// 查询到已有角色，并转为ids的格式，给角色选择器
		const param = {
			id: record.id
		}
		userApi.userOwnRole(param).then((data) => {
			RoleSelectorPlusRef.value.showModel(data)
		})
	}
	// 角色选择回调
	const roleBack = (value) => {
		let params = {
			id: selectedRecord.value.id,
			roleIdList: []
		}
		if (value.length > 0) {
			value.forEach((item) => {
				params.roleIdList.push(item)
			})
		}
		userApi.grantRole(params).then(() => {})
	}
	// 重置用户密码
	const resetPassword = (record) => {
		userApi.userResetPassword(record).then(() => {})
	}
	// 导出用户信息
	const exportUserInfo = (record) => {
		const params = {
			id: record.id
		}
		userApi.userExportUserInfo(params).then((res) => {
			downloadUtil.resultDownload(res)
		})
	}
	// 传递设计器需要的API
	const selectorApiFunction = {
		orgTreeApi: (param) => {
			return userApi.userOrgTreeSelector(param).then((data) => {
				return Promise.resolve(data)
			})
		},
		rolePageApi: (param) => {
			return userApi.userRoleSelector(param).then((data) => {
				return Promise.resolve(data)
			})
		}
	}
</script>

<style scoped>
	.ant-form-item {
		margin-bottom: 0 !important;
	}
	.snowy-table-avatar {
		margin-top: -10px;
		margin-bottom: -10px;
	}
	.snowy-button-left {
		margin-left: 8px;
	}
</style>
