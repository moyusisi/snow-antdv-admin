<template>
	<a-drawer
		:open="visible"
		:title="title"
		:width="drawerWidth"
		:closable="false"
		:footerStyle="{'display': 'flex', 'justify-content': 'flex-end' }"
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
				<!-- 上方查询框 -->
				<a-card size="small">
					<a-form ref="searchFormRef" :model="searchFormData">
						<a-row :gutter="16">
							<a-col :span="8">
								<a-form-item name="searchKey">
									<a-input v-model:value="searchFormData.searchKey" placeholder="请输入用户名" allowClear />
								</a-form-item>
							</a-col>
							<a-col :span="8">
								<a-space>
									<a-button type="primary" :icon="h(SearchOutlined)" @click="tableRef.refresh(true)">查询</a-button>
									<a-button :icon="h(RedoOutlined)" @click="reset">重置</a-button>
								</a-space>
							</a-col>
							<a-col :span="8" style="text-align: right">
								<a-space>
									<a-button type="dashed" :icon="h(PlusOutlined)" style="color: #52C41AFF; border-color: #52C41AFF">添加用户</a-button>
									<a-button type="dashed" danger  :icon="h(MinusOutlined)">移除</a-button>
								</a-space>
							</a-col>
						</a-row>
					</a-form>
				</a-card>
				<a-card size="small">
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
	import orgApi from '@/api/sys/orgApi'
	import postApi from '@/api/sys/postApi'

	import { globalStore } from "@/store";
	import { Empty } from "ant-design-vue";
	import { h } from "vue";
	import { PlusOutlined, MinusOutlined, RedoOutlined, SearchOutlined } from "@ant-design/icons-vue";

	const store = globalStore()
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
			dataIndex: 'account',
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

	// onMounted(() => {
	// 	loadTreeData()
	// })

	// 使用状态options（0正常 1停用）
	const statusOptions = [
		{ label: "正常", value: 0 },
		{ label: "已停用", value: 1 }
	]
	const title = computed(() => {
		return "用户组-" + group.value.name
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
		// 加载组织树
		// loadTreeData()

		// // 获取组织信息
		// postApi.postDetail({ code: record.code }).then((res) => {
		// 	formData.value = res
		// })
		// // 获取组织树并加入顶级节点
		// orgApi.orgTree({}).then((res) => {
		// 	treeData.value = res
		// 	defaultExpandedKeys.value = [res[0]?.code]
		// })
	}
	// 关闭抽屉
	const onClose = () => {
		visible.value = false
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

	// 调用这个函数将子组件的一些数据和方法暴露出去
	defineExpose({
		onOpen
	})
</script>

<style scoped>
	.ant-form-item {
		margin-bottom: 0 !important;
	}
	.selectorTree {
		max-height: 600px;
		overflow: auto;
	}
</style>
