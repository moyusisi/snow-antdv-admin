<template>
	<a-row :gutter="10">
		<!-- 左侧组织树 -->
		<a-col :xs="24" :sm="24" :md="24" :lg="5" :xl="5">
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
		<a-col :xs="24" :sm="24" :md="24" :lg="19" :xl="19">
			<a-card :bordered="false" class="xn-mb10">
				<a-form ref="searchFormRef" :model="searchFormState">
					<a-row :gutter="24">
						<a-col :span="8">
							<a-form-item name="searchKey" label="名称关键词">
								<a-input v-model:value="searchFormState.searchKey" placeholder="请输入关键词" allowClear />
							</a-form-item>
						</a-col>
						<a-col :span="6">
							<a-form-item label="使用状态" name="status">
								<a-select v-model:value="searchFormState.status" placeholder="请选择状态" :options="statusOptions" allowClear />
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
					:expand-row-by-click="true"
					:alert="options.alert.show"
					bordered
					:row-key="(record) => record.code"
					:tool-config="toolConfig"
					:row-selection="options.rowSelection"
				>
					<template #operator class="table-operator">
						<a-space>
							<a-button type="primary" :icon="h(PlusOutlined)" @click="addFormRef.onOpen(searchFormState.parentCode)">新增</a-button>
							<xn-batch-button
								buttonName="批量删除"
								icon="DeleteOutlined"
								buttonDanger
								:selectedRowKeys="selectedRowKeys"
								@batchCallBack="batchDeleteOrg"
							/>
						</a-space>
					</template>
					<template #bodyCell="{ column, record }">
						<template v-if="column.dataIndex === 'code'">
							<a-tag v-if="record.code" :bordered="false">{{ record.code }}</a-tag>
						</template>
						<template v-if="column.dataIndex === 'orgType'">
							<a-tag v-if="record.orgType === 1" color="cyan">公司组织</a-tag>
							<a-tag v-if="record.orgType === 2" color="blue">部门机构</a-tag>
							<a-tag v-if="record.orgType === 3" color="purple">虚拟节点</a-tag>
						</template>
						<template v-if="column.dataIndex === 'status'">
							<a-tag v-if="record.status === 0" color="green">正常</a-tag>
							<a-tag v-else>已停用</a-tag>
						</template>
						<template v-if="column.dataIndex === 'action'">
							<a-space>
								<a-button type="link" size="small" @click="editFormRef.onOpen(record)">编辑</a-button>
								<a-divider type="vertical" />
								<a-popconfirm title="确定要删除此组织吗？" @confirm="deleteOrg(record)">
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
	import { Empty } from 'ant-design-vue'
	import { DeleteOutlined, FormOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons-vue";
	import AddForm from './addForm.vue'
	import EditForm from './editForm.vue'

	const columns = [
		{
			title: '组织名称',
			dataIndex: 'name',
			resizable: true,
			width: 200
		},
		{
			title: '组织编码',
			dataIndex: 'code',
			width: 100
		},
		{
			title: '组织类型',
			dataIndex: 'orgType',
			align: 'center',
			width: 80
		},
		{
			title: '组织层级',
			dataIndex: 'orgLevel',
			align: 'center',
			width: 80
		},
		{
			title: '排序',
			dataIndex: 'sortNum',
			sorter: true,
			align: 'center',
			width: 80
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
			width: 120
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
	const searchFormState = ref({})
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
		return orgApi.orgPage(Object.assign(parameter, searchFormState.value)).then((res) => {
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
			searchFormState.value.parentCode = selectedKeys.toString()
		} else {
			delete searchFormState.value.parentCode
		}
		tableRef.value.refresh(true)
	}
	// 单个删除
	const deleteOrg = (record) => {
		let data = { codes: [record.code] }
		orgApi.deleteOrgTree(data).then(() => {
			tableRef.value.refresh(true)
		})
	}
	// 批量删除
	const batchDeleteOrg = (params) => {
		let data = { codes: selectedRowKeys.value }
		orgApi.deleteOrgTree(data).then(() => {
			tableRef.value.clearRefreshSelected()
		})
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
