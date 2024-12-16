<template>
	<a-card :bordered="false" class="xn-mb10">
		<a-form ref="searchFormRef" :model="searchFormData">
			<a-row :gutter="24">
				<a-col :span="8">
					<a-form-item name="searchKey" label="名称关键词">
						<a-input v-model:value="searchFormData.searchKey" placeholder="请输入模块名称关键词" />
					</a-form-item>
				</a-col>
				<a-col :span="6">
					<a-form-item name="status" label="使用状态">
						<a-select v-model:value="searchFormData.status" placeholder="请选择状态" :options="statusOptions" />
					</a-form-item>
				</a-col>
				<a-col :span="8">
					<a-button type="primary" :icon="h(SearchOutlined)" @click="tableRef.refresh(true)">查询</a-button>
					<a-button class="xn-mg08" @click="reset">重置</a-button>
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
			bordered
			:row-key="(record) => record.id"
			:tool-config="toolConfig"
			:row-selection="options.rowSelection"
		>
			<template #operator>
				<a-space>
					<a-button type="primary" :icon="h(PlusOutlined)"  @click="addFormRef.onOpen()">新增模块</a-button>
					<xn-batch-button
						buttonName="批量删除"
						icon="DeleteOutlined"
						buttonDanger
						:selectedRowKeys="selectedRowKeys"
						@batchCallBack="deleteBatchModule"
					/>
				</a-space>
			</template>
			<template #bodyCell="{ column, record }">
				<template v-if="column.dataIndex === 'code'">
					<a-tag v-if="record.code" :bordered="false">{{ record.code }}</a-tag>
				</template>
				<template v-if="column.dataIndex === 'icon'">
					<span v-if="record.icon && record.icon !== '#'" >
						<component :is="record.icon"/>
					</span>
					<span v-else />
				</template>
				<template v-if="column.dataIndex === 'status'">
					<a-tag v-if="record.status === 0" color="green">正常</a-tag>
					<a-tag v-else>已停用</a-tag>
				</template>
				<template v-if="column.dataIndex === 'action'">
					<a-button type="link" size="small" @click="editFormRef.onOpen(record)">编辑</a-button>
					<a-divider type="vertical" />
					<a-popconfirm title="确定要删除此菜单吗？" @confirm="deleteModule(record)">
						<a-button type="link" size="small" danger>删除</a-button>
					</a-popconfirm>
				</template>
			</template>
		</s-table>
	</a-card>
	<AddForm ref="addFormRef" @successful="tableRef.refresh(true)" />
	<EditForm ref="editFormRef" @successful="tableRef.refresh(true)" />
</template>

<script setup>
	import menuApi from '@/api/sys/menuApi'
	import { h } from "vue";
	import { PlusOutlined, SearchOutlined } from "@ant-design/icons-vue";
	import AddForm from "@/views/sys/resource/module/addForm.vue";
	import EditForm from "@/views/sys/resource/module/editForm.vue";

	// menuType=1标识模块
	const searchFormData = ref({ 'menuType': 1 })
	const addFormRef = ref()
	const editFormRef = ref()
	const searchFormRef = ref()
	const tableRef = ref()
	const toolConfig = { refresh: true, height: true, columnSetting: false, striped: false }
	const columns = [
		{
			title: '显示名称',
			dataIndex: 'name',
			width: 200
		},
		{
			title: '唯一编码',
			dataIndex: 'code',
			width: 200
		},
		{
			title: '图标',
			dataIndex: 'icon',
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
			sorter: true,
			align: 'center',
			width: 200
		},
		{
			title: '操作',
			dataIndex: 'action',
			align: 'center',
			width: 200
		}
	]
	let selectedRowKeys = ref([])
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
				selectedRowKeys = ref([])
			}
		},
		rowSelection: {
			onChange: (selectedRowKey, selectedRows) => {
				selectedRowKeys.value = selectedRowKey
			}
		}
	}
	const loadData = (parameter) => {
		return menuApi.menuPage(Object.assign(parameter, searchFormData.value)).then((res) => {
			return res
		})
	}
	// 重置
	const reset = () => {
		searchFormRef.value.resetFields()
		tableRef.value.refresh(true)
	}
	// 删除
	const deleteModule = (record) => {
		console.log(record)
		let data = { ids: [record.id] }
		menuApi.deleteMenu(data).then(() => {
			tableRef.value.refresh(true)
		})
	}
	// 批量删除
	const deleteBatchModule = (params) => {
		let data = { ids: selectedRowKeys.value }
		menuApi.deleteMenu(data).then(() => {
			tableRef.value.clearRefreshSelected()
		})
	}
</script>

<style scoped>
.ant-form-item {
	margin-bottom: 0 !important;
}
</style>
