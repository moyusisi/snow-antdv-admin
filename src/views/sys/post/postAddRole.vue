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
			<a-col :span="24">
				<a-card size="small" title="全部角色列表">
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
								<a-button type="dashed" @click="addRows" :icon="h(PlusOutlined)" style="color: #52C41AFF; border-color: #52C41AFF">添加</a-button>
							</a-col>
						</a-row>
					</a-form>
					<!-- 数据列表 -->
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
		<!-- 底部内容 -->
		<template #footer>
			<a-space>
				<a-button @click="onClose">关闭</a-button>
				<a-button type="primary" :loading="submitLoading" @click="onSubmit">保存</a-button>
			</a-space>
		</template>
	</a-drawer>
</template>

<script setup>
	import postApi from '@/api/sys/postApi'
	import roleApi from "@/api/sys/roleApi"

	import { useGlobalStore } from "@/store";
	import { h } from "vue";
	import { PlusOutlined, MinusOutlined, RedoOutlined, SearchOutlined } from "@ant-design/icons-vue";
	import { message } from "ant-design-vue";

	const store = useGlobalStore()
	const columns = [
		{
			title: '角色名称',
			dataIndex: 'name',
			resizable: true,
			width: 100
		},
		{
			title: '唯一编码',
			dataIndex: 'code',
			resizable: true,
			width: 100
		}
	]
	// 右边结果数据表的字段
	const toColumns = [
		{
			title: '角色名称',
			dataIndex: 'name',
			resizable: true,
			width: 100
		},
		{
			title: '唯一编码',
			dataIndex: 'code',
			resizable: true,
			width: 100
		}
	]

	// 默认是关闭状态
	const visible = ref(false)
	const group = ref()
	const emit = defineEmits({ successful: null })
	const submitLoading = ref(false)
	// 表单数据
	const searchFormRef = ref()
	const searchFormData = ref({})
	// table数据
	const tableRef = ref()
	// 表格中的数据(loadTableData中会更新)
	const tableData = ref([])
	// 已选中的菜单(loadTableData中会更新)
	const selectedRowKeys = ref([])
	const selectedRecords = ref([])
	// 列表选择配置
	const rowSelection = ref({
		checkStrictly: false,
		selectedRowKeys: selectedRowKeys,
		onChange: (selectedKeys, selectedRows) => {
			selectedRowKeys.value = selectedKeys
			selectedRecords.value = selectedRows
			console.log('onChange,selectedKeys:', selectedKeys);
		}
	});

	// 右侧table数据
	const toTableRef = ref()
	const toTableData = ref([])
	const toSelectedRowKeys = ref([])
	const toRowSelection = ref({
		checkStrictly: false,
		selectedRowKeys: toSelectedRowKeys,
		onChange: (selectedKeys, selectedRows) => {
			toSelectedRowKeys.value = selectedKeys
			console.log('onChange,selectedKeys:', selectedKeys);
		}
	});
	const title = computed(() => {
		return group.value.name + "-添加角色"
	})
	// 抽屉宽度
	const drawerWidth = computed(() => {
		return store.menuIsCollapse ? `calc(100% - 80px)` : `calc(100% - 210px)`
	})

	// 打开抽屉
	const onOpen = (record) => {
		visible.value = true
		group.value = record;
		// 加载数据
		loadTableData()
		loadToTableData()
	}
	// 关闭抽屉
	const onClose = () => {
		// 表单清空
		searchFormData.value = {}
		// table数据清空
		tableData.value = []
		selectedRowKeys.value = []
		selectedRecords.value = []
		// 右边table清空
		toTableData.value = []
		toSelectedRowKeys.value = []
		// 关闭
		visible.value = false
	}

	// 表格查询 返回 Promise 对象
	const loadTableData = async () => {
		selectedRowKeys.value = []
		selectedRecords.value = []
		const res = await roleApi.roleList(searchFormData.value)
		tableData.value = res
	}
	// 表格查询 返回 Promise 对象
	const loadToTableData = async () => {
		// 查询指定岗位已包含的角色
		const res = await postApi.postRoleList({ "code": group.value.code })
		toTableData.value = res
	}
	// 重置
	const reset = () => {
		searchFormData.value = {}
		loadTableData()
	}
	// 添加记录
	const addRows = () => {
		if (selectedRowKeys.value.length < 1) {
			message.warning('请选择一条或多条数据')
			return
		}
		let allList = toTableData.value.concat(selectedRecords.value)
		let list = []
		for (let item1 of allList) {
			let flag = true
			for (let item2 of list) {
				if (item1.code === item2.code) {
					flag = false
				}
			}
			if (flag) {
				list.push(item1)
			}
		}
		selectedRowKeys.value = []
		selectedRecords.value = []
		toTableData.value = list
	}
	// 删减记录
	const delRows = () => {
		if (toSelectedRowKeys.value.length < 1) {
			message.warning('请选择一条或多条数据')
			return
		}
		let list = []
		for (let item of toTableData.value) {
			let flag = true
			if (toSelectedRowKeys.value.indexOf(item.code) > -1) {
				flag = false
			}
			if (flag) {
				list.push(item)
			}
		}
		toSelectedRowKeys.value = []
		toTableData.value = list
	}
	// 验证并提交数据
	const onSubmit = () => {
		submitLoading.value = true
		let codeList = []
		for (let item of toTableData.value) {
			codeList.push(item.code)
		}
		postApi.postAddRole({ "code": group.value.code, "codeSet": codeList }).then(() => {
			emit('successful')
			onClose()
		}).finally(() => {
			submitLoading.value = false
		})
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
