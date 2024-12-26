<template>
	<a-card :bordered="false" class="xn-mb10">
		<a-form ref="searchFormRef" :model="searchFormData">
			<a-row :gutter="24">
				<a-col :span="8">
					<a-form-item name="searchKey" label="名称关键词">
						<a-input v-model:value="searchFormData.searchKey" placeholder="请输入关键词" allowClear />
					</a-form-item>
				</a-col>
				<a-col :span="6">
					<a-form-item label="使用状态" name="status">
						<a-select v-model:value="searchFormData.status" placeholder="请选择状态" :options="statusOptions" allowClear />
					</a-form-item>
				</a-col>
				<a-col :span="8">
					<a-space>
						<a-button type="primary" :icon="h(SearchOutlined)" @click="tableRef.refresh(true)">查询</a-button>
						<a-button @click="reset">重置</a-button>
					</a-space>
				</a-col>
			</a-row>
		</a-form>
	</a-card>
	<a-card :bordered="false">
		<s-table
			ref="tableRef"
			:columns="columns"
			:data="loadData"
			:alert="options.alert.show"
			:scroll="{ x: 1200 }"
			bordered
			:row-key="(record) => record.id"
			:tool-config="toolConfig"
			:row-selection="options.rowSelection"
		>
			<template #operator>
				<a-space>
					<a-button type="primary" :icon="h(PlusOutlined)" @click="addFormRef.onOpen(module)">新增角色</a-button>
					<xn-batch-button
						buttonName="批量删除"
						icon="DeleteOutlined"
						buttonDanger
						:selectedRowKeys="selectedRowKeys"
						@batchCallBack="deleteBatchRole"
					/>
				</a-space>
			</template>
			<template #bodyCell="{ column, record }">
				<template v-if="column.dataIndex === 'code'">
					<a-tag v-if="record.code" :bordered="false">{{ record.code }}</a-tag>
				</template>
				<template v-if="column.dataIndex === 'status'">
					<a-tag v-if="record.status === 0" color="green">正常</a-tag>
					<a-tag v-else>已停用</a-tag>
				</template>
				<template v-if="column.dataIndex === 'action'">
					<a-button type="link" size="small" @click="editFormRef.onOpen(record)">编辑</a-button>
					<a-divider type="vertical" />
					<a-button type="link" size="small" @click="grantMenuFormRef.onOpen(record)">授权</a-button>
					<a-divider type="vertical" />
					<a-popconfirm title="确定要删除此角色吗？" @confirm="deleteRole(record)">
						<a-button type="link" size="small" danger>删除</a-button>
					</a-popconfirm>
					<a-divider type="vertical" />
					<a-dropdown>
						<a class="ant-dropdown-link">
							授权
							<DownOutlined />
						</a>
						<template #overlay>
							<a-menu>
								<a-menu-item>
									<a @click="grantResourceFormRef.onOpen(record)">授权资源</a>
								</a-menu-item>
								<a-menu-item>
									<a @click="grantMobileResourceFormRef.onOpen(record)">授权移动端资源</a>
								</a-menu-item>
								<a-menu-item>
									<a @click="grantPermissionFormRef.onOpen(record)">授权权限</a>
								</a-menu-item>
								<a-menu-item>
									<a @click="openRoleUserSelector(record)">授权用户</a>
								</a-menu-item>
							</a-menu>
						</template>
					</a-dropdown>
				</template>
			</template>
		</s-table>
	</a-card>
	<grant-menu-form ref="grantMenuFormRef" @successful="tableRef.refresh()" />
	<grantResourceForm ref="grantResourceFormRef" @successful="tableRef.refresh()" />
	<grantMobileResourceForm ref="grantMobileResourceFormRef" @successful="tableRef.refresh()" />
	<grantPermissionForm ref="grantPermissionFormRef" @successful="tableRef.refresh()" />
	<Form ref="formRef" @successful="tableRef.refresh()" />
	<AddForm ref="addFormRef" @successful="tableRef.refresh()" />
	<EditForm ref="editFormRef" @successful="tableRef.refresh()" />
	<xn-user-selector
		ref="userSelectorPlusRef"
		:org-tree-api="selectorApiFunction.orgTreeApi"
		:user-page-api="selectorApiFunction.userPageApi"
		data-type="object"
		:user-show="false"
		@onBack="userCallBack"
	/>
</template>

<script setup>
	import roleApi from '@/api/sys/roleApi'

	import { h } from "vue"
	import { PlusOutlined, SearchOutlined } from "@ant-design/icons-vue"
	import GrantResourceForm from './grantResourceForm.vue'
	import GrantMobileResourceForm from './grantMobileResourceForm.vue'
	import GrantPermissionForm from './grantPermissionForm.vue'
	import Form from './form.vue'
	import AddForm from "./addForm.vue";
	import EditForm from "./editForm.vue";
	import GrantMenuForm from "./grantMenuForm.vue";

	const columns = [
		{
			title: '角色名称',
			dataIndex: 'name',
			resizable: true,
			width: 150
		},
		{
			title: '唯一编码',
			dataIndex: 'code',
			resizable: true,
			width: 200
		},
		{
			title: '排序',
			dataIndex: 'sortNum',
			sorter: true,
			align: 'center',
			width: 100
		},
		{
			title: '状态',
			dataIndex: 'status',
			align: 'center',
			width: 100
		},
		{
			title: '创建时间',
			dataIndex: 'createTime',
			align: 'center',
			width: 160
		},
		{
			title: '更新时间',
			dataIndex: 'updateTime',
			align: 'center',
			width: 160
		},
		{
			title: '操作',
			dataIndex: 'action',
			align: 'center',
			resizable: true,
			width: 200
		}
	]
	const selectedRowKeys = ref([])
	// 使用状态options（0正常 1停用）
	const statusOptions = [
		{ label: "正常", value: 0 },
		{ label: "已停用", value: 1 }
	]
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
	// 定义tableDOM
	const tableRef = ref()
	const formRef = ref()
	const addFormRef = ref()
	const editFormRef = ref()
	const module = ref()
	const toolConfig = { refresh: true, height: true, columnSetting: false, striped: false }
	const grantMenuFormRef = ref()
	const grantResourceFormRef = ref()
	const grantMobileResourceFormRef = ref()
	const grantPermissionFormRef = ref()
	const userSelectorPlusRef = ref()
	const searchFormRef = ref()
	const searchFormData = ref({})
	// 记录数据
	const recordCacheData = ref({})

	// 表格查询 返回 Promise 对象
	const loadData = (parameter) => {
		let param = Object.assign(parameter, searchFormData.value)
		return roleApi.rolePage(param).then((res) => {
			return res
		})
	}
	// 重置
	const reset = () => {
		searchFormRef.value.resetFields()
		tableRef.value.refresh(true)
	}
	// 删除
	const deleteRole = (record) => {
		let data = { ids: [record.id] }
		roleApi.deleteRole(data).then(() => {
			tableRef.value.refresh(true)
		})
	}
	// 批量删除
	const deleteBatchRole = (params) => {
		let data = { ids: selectedRowKeys.value }
		roleApi.deleteRole(data).then(() => {
			tableRef.value.clearRefreshSelected()
		})
	}
	// 打开用户选择器
	const openRoleUserSelector = (record) => {
		// 打开人员选择器的时候，缓存一个记录数据
		recordCacheData.value = record
		// 查询接口，查到这个角色是多少个用户都有它
		const param = {
			id: record.id
		}
		roleApi.roleOwnUser(param).then((data) => {
			userSelectorPlusRef.value.showUserPlusModal(data)
		})
	}
	// 人员选择器回调
	const userCallBack = (value) => {
		const param = {
			id: recordCacheData.value.id,
			grantInfoList: value
		}
		roleApi.roleGrantUser(param).then(() => {})
	}
	// 传递设计器需要的API
	const selectorApiFunction = {
		orgTreeApi: (param) => {
			return roleApi.roleOrgTreeSelector(param).then((data) => {
				return Promise.resolve(data)
			})
		},
		userPageApi: (param) => {
			return roleApi.roleUserSelector(param).then((data) => {
				return Promise.resolve(data)
			})
		}
	}
</script>

<style scoped>
	.ant-form-item {
		margin-bottom: 0 !important;
	}
	.snowy-button-left {
		margin-left: 8px;
	}
</style>
