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
		<a-row :gutter="20">
			<a-col :span="12">
				<!-- 上方查询框 -->
				<a-card size="small" title="全部角色列表">
					<a-form ref="searchFormRef" :model="searchFormData">
						<a-row :gutter="16">
							<a-col :span="8">
								<a-form-item name="searchKey">
									<a-input v-model:value="searchFormData.searchKey" placeholder="请输入关键词" allowClear />
								</a-form-item>
							</a-col>
							<a-col :span="8">
								<a-space>
									<a-button type="primary" :icon="h(SearchOutlined)" @click="tableRef.refresh(true)">查询</a-button>
									<a-button :icon="h(RedoOutlined)" @click="reset">重置</a-button>
								</a-space>
							</a-col>
							<a-col :span="8" style="text-align: right">
								<a-form-item>
									<a-button type="dashed" :icon="h(PlusOutlined)" @click="addRows" style="color: #52C41AFF; border-color: #52C41AFF">添加</a-button>
								</a-form-item>
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
			<a-col :span="12">
				<!-- 上方查询框 -->
				<a-card size="small" title="已授权角色列表">
					<a-form  style="text-align: right">
						<a-form-item>
							<a-button type="dashed" danger @click="delRows" :icon="h(MinusOutlined)">移除</a-button>
						</a-form-item>
					</a-form>
					<a-table size="small"
							 ref="toTableRef"
							 :columns="toColumns"
							 :data-source="toTableData"
							 :row-key="(record) => record.code"
							 :row-selection="toRowSelection"
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
		return "角色组-" + group.value.name
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
	}
	// 关闭抽屉
	const onClose = () => {
		// 表单数据
		searchFormData.value = {}
		// table数据
		tableData.value = []
		selectedRowKeys.value = []
		selectedRecords.value = []
		toTableData.value = []
		toSelectedRowKeys.value = []
		visible.value = false
	}

	// 表格查询 返回 Promise 对象
	const loadTableData = async () => {
		const res = await roleApi.roleList(searchFormData.value)
		tableData.value = res
	}
	// 重置
	const reset = () => {
		searchFormRef.value.resetFields()
		loadTableData()
	}
	// 添加记录
	const addRows = () => {
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
		toTableData.value = list
	}
	// 删减记录
	const delRows = () => {
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
		formRef.value.validate().then(() => {
			submitLoading.value = true
			postApi.addPost(formData.value).then(() => {
				emit('successful')
				onClose()
			}).finally(() => {
				submitLoading.value = false
			})
		}).catch(() => {
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
