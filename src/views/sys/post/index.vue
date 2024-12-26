<template>
	<a-row :gutter="8">
		<!-- 左侧组织树 -->
		<a-col :span="5">
			<a-card :bordered="false" :loading="cardLoading" >
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
			<a-card :bordered="false">
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
					:data="loadTableData"
					:scroll="{ x: 1200 }"
					bordered
					:row-key="(record) => record.code"
					:tool-config="toolConfig"
					:row-selection="options.rowSelection"
					@resizeColumn="handleResizeColumn"
				>
					<template #operator class="table-operator">
						<a-space>
							<a-button type="primary" :icon="h(PlusOutlined)" @click="addFormRef.onOpen(searchFormData.orgCode)">新增</a-button>
							<xn-batch-button
								buttonName="批量删除"
								icon="DeleteOutlined"
								buttonDanger
								:selectedRowKeys="selectedRowKeys"
								@batchCallBack="batchDeletePost"
							/>
						</a-space>
					</template>
					<template #bodyCell="{ column, record }">
						<template v-if="column.dataIndex === 'code'">
							<a-tag v-if="record.code" :bordered="false">{{ record.code }}</a-tag>
						</template>
						<template v-if="column.dataIndex === 'postType'">
							<!-- 岗位类型(字典 1特有 2通用 3自建) -->
							<a-tag v-if="record.postType === 1" color="cyan">特有</a-tag>
							<a-tag v-if="record.postType === 2" color="blue">通用</a-tag>
							<a-tag v-if="record.postType === 3" color="purple">自建</a-tag>
						</template>
						<template v-if="column.dataIndex === 'status'">
							<a-tag v-if="record.status === 0" color="green">正常</a-tag>
							<a-tag v-else>已停用</a-tag>
						</template>
						<template v-if="column.dataIndex === 'action'">
							<a-space>
								<a-button type="link" size="small" @click="editFormRef.onOpen(record)">编辑</a-button>
								<a-divider type="vertical" />
								<a-button type="link" size="small" @click="grantMenuFormRef.onOpen(record)">授权</a-button>
								<a-divider type="vertical" />
								<a-popconfirm title="确定要删除此岗位吗？" @confirm="deletePost(record)">
									<a-button type="link" size="small" danger>删除</a-button>
								</a-popconfirm>
							</a-space>
						</template>
					</template>
				</s-table>
			</a-card>
		</a-col>
	</a-row>
	<EditForm ref="editFormRef" @successful="tableRef.refresh()" />
	<AddForm ref="addFormRef" @successful="tableRef.refresh()" />
</template>

<script setup>
	import { onMounted, h } from "vue";
	import orgApi from '@/api/sys/orgApi'
	import postApi from '@/api/sys/postApi'
	import { Empty } from 'ant-design-vue'
	import { PlusOutlined, SearchOutlined } from "@ant-design/icons-vue";
	import AddForm from './addForm.vue'
	import EditForm from './editForm.vue'

	const columns = [
		{
			title: '组织机构',
			dataIndex: 'orgName',
			resizable: true,
			width: 200,
			ellipsis: true
		},
		{
			title: '角色组名称',
			dataIndex: 'name',
			resizable: true,
			width: 200
		},
		{
			title: '分组类型',
			dataIndex: 'postType',
			align: 'center',
			width: 100
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
			width: 200
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
		return postApi.postPage(Object.assign(parameter, searchFormData.value)).then((res) => {
			return res
		})
	}
	// 重置
	const reset = () => {
		searchFormRef.value.resetFields()
		tableRef.value.refresh(true)
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
	// 点击树查询
	const treeSelect = (selectedKeys) => {
		if (selectedKeys.length > 0) {
			searchFormData.value.orgCode = selectedKeys.toString()
		} else {
			delete searchFormData.value.orgCode
		}
		tableRef.value.refresh(true)
	}
	// 单个删除
	const deletePost = (record) => {
		let data = { codes: [record.code] }
		postApi.deleteOrgTree(data).then(() => {
			tableRef.value.refresh(true)
		})
	}
	// 批量删除
	const batchDeletePost = (params) => {
		let data = { codes: selectedRowKeys.value }
		postApi.deletePost(data).then(() => {
			tableRef.value.clearRefreshSelected()
		})
	}
	// 可伸缩列
	const handleResizeColumn = (w, col) => {
		col.width = w
	}
	// 成功回调
	const handleSuccess = () => {
		loadTreeData()
		loadTableData()
	}
</script>

<style scoped>
	.ant-form-item {
		margin-bottom: 0 !important;
	}
</style>
