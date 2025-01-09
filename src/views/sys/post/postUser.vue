<template>
	<a-drawer
		:open="visible"
		:title="title"
		:width="drawerWidth"
		:closable="false"
		:footerStyle="{'display': 'flex', 'justify-content': 'flex-end' }"
		:destroy-on-close="true"
		@close="onClose"
	>
		<template #extra>
			<a-button type="primary" size="small" @click="onClose"><CloseOutlined /></a-button>
		</template>
		<!-- 页面内容 -->
		<a-row :gutter="8">
			<!-- 左侧组织树 -->
			<a-col :span="5">
				<a-card size="small" :loading="cardLoading" bodyStyle="padding-left:5px;padding-right:5px;">
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
			<a-col :span="19">
				<a-card size="small">
					<!-- 上方查询框 -->
					<a-form ref="searchFormRef" :model="searchFormData">
						<a-row :gutter="16">
							<a-col :span="8">
								<a-form-item name="searchKey">
									<a-input v-model:value="searchFormData.searchKey" placeholder="请输入关键词" allowClear />
								</a-form-item>
							</a-col>
							<a-col :span="8">
								<a-space>
									<a-button type="primary" :icon="h(SearchOutlined)" @click="loadTableData()">查询</a-button>
									<a-button :icon="h(RedoOutlined)" @click="reset">重置</a-button>
								</a-space>
							</a-col>
							<a-col :span="8" style="text-align: right">
								<a-space>
									<a-button type="dashed" :icon="h(PlusOutlined)" style="color: #52C41AFF; border-color: #52C41AFF">添加用户</a-button>
									<a-button type="dashed" danger  :icon="h(MinusOutlined)">移除用户</a-button>
								</a-space>
							</a-col>
						</a-row>
					</a-form>
					<a-table size="small"
							 ref="tableRef"
							 :columns="columns"
							 :data-source="tableData"
							 :row-key="(record) => record.code"
							 :row-selection="rowSelection"
							 bordered>
					</a-table>
				</a-card>
			</a-col>
		</a-row>
	</a-drawer>
</template>

<script setup>
	import postApi from '@/api/sys/postApi'

	import { globalStore } from "@/store";
	import { Empty } from "ant-design-vue";
	import { h } from "vue";
	import { PlusOutlined, MinusOutlined, RedoOutlined, SearchOutlined } from "@ant-design/icons-vue";

	const columns = [
		{
			title: '姓名',
			dataIndex: 'name',
			align: 'center',
			resizable: true,
			width: 100
		},
		{
			title: '账号',
			dataIndex: 'code',
			align: 'center',
			resizable: true,
			width: 100
		},
		{
			title: '组织机构',
			dataIndex: 'orgName',
			resizable: true,
			width: 200,
			ellipsis: true
		}
	]

	// 默认是关闭状态
	const visible = ref(false)
	const group = ref()
	const emit = defineEmits({ successful: null })
	// 节点树
	const treeData = ref([])
	// 默认展开的节点(顶级)
	const defaultExpandedKeys = ref([])
	// 替换treeNode 中 children,title,key
	const treeFieldNames = { children: 'children', title: 'name', key: 'code' }
	const cardLoading = ref(false)
	// 表单数据
	const searchFormRef = ref()
	const searchFormData = ref({})
	// table数据
	const tableRef = ref()
	// 表格中的数据(loadTableData中会更新)
	const tableData = ref([])
	// 已选中的菜单(loadTableData中会更新)
	const selectedRowKeys = ref([])
	// 列表选择配置
	const rowSelection = ref({
		checkStrictly: false,
		selectedRowKeys: selectedRowKeys,
		onChange: (selectedKeys, selectedRows) => {
			selectedRowKeys.value = selectedKeys
			console.log('onChange,selectedKeys:', selectedKeys);
		}
	});

	// 使用状态options（0正常 1停用）
	const statusOptions = [
		{ label: "正常", value: 0 },
		{ label: "已停用", value: 1 }
	]
	const title = computed(() => {
		return "用户组-" + group.value.name + "-已授权用户列表"
	})
	const drawerWidth = computed(() => {
		return `calc(100%)`
	})

	// 打开抽屉
	const onOpen = (record, tradeData) => {
		visible.value = true
		treeData.value = tradeData
		defaultExpandedKeys.value = [tradeData[0]?.code]
		group.value = record;
		loadTableData()
	}
	// 关闭抽屉
	const onClose = () => {
		visible.value = false
	}
	// 点击树查询
	const treeSelect = (selectedKeys) => {
		if (selectedKeys.length > 0) {
			searchFormData.value.orgCode = selectedKeys.toString()
		} else {
			delete searchFormData.value.orgCode
		}
		loadTableData()
	}

	// 表格查询 返回 Promise 对象
	const loadTableData = async () => {
		selectedRowKeys.value = []
		let param = Object.assign({ "code": group.value.code }, searchFormData.value)
		const res = await postApi.postUserList(param)
		tableData.value = res
	}
	// 重置
	const reset = () => {
		searchFormData.value = {}
		loadTableData()
	}
	// 调用这个函数将子组件的一些数据和方法暴露出去
	defineExpose({
		onOpen
	})
</script>

<style scoped>
	.ant-form-item {
		margin-bottom: 10px !important;
	}
	.selectorTree {
		max-height: 600px;
		overflow: auto;
	}
</style>
