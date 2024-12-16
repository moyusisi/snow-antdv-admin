<template>
	<!-- 上方模块选择 -->
	<a-card :bordered="false" class="xn-mb10">
		<a-space>
			<a-radio-group v-model:value="module" button-style="solid">
				<a-radio-button v-for="module in moduleList" :key="module.code" :value="module.code" @click="moduleClick(module.code)">
					<component :is="module.icon" /> {{ module.name }}
				</a-radio-button>
			</a-radio-group>
		</a-space>
	</a-card>
	<!-- 内容区域 -->
	<a-card :bordered="false" class="mt-2">
		<s-table
			ref="tableRef"
			:columns="columns"
			:data="loadData"
			:alert="options.alert.show"
			bordered
			:row-key="(node) => node.code"
			:show-pagination="false"
			:tool-config="toolConfig"
			:row-selection="options.rowSelection"
			:scroll="{ x: 'max-content' }"
		>
			<template #operator>
				<a-space>
					<a-button type="primary" :icon="h(PlusOutlined)" @click="addFormRef.onOpen(module)">新增菜单</a-button>
					<xn-batch-button
						buttonName="批量删除"
						icon="DeleteOutlined"
						buttonDanger
						:selectedRowKeys="selectedRowKeys"
						@batchCallBack="batchDeleteMenu"
					/>
				</a-space>
			</template>
			<template #bodyCell="{ column, record : node }">
				<template v-if="column.dataIndex === 'menuType'">
					<a-tag v-if="node.menuType === 1" color="orange">模块</a-tag>
					<a-tag v-if="node.menuType === 2" color="cyan">目录</a-tag>
					<a-tag v-if="node.menuType === 3" color="blue">菜单</a-tag>
					<a-tag v-if="node.menuType === 4" color="purple">按钮</a-tag>
					<a-tag v-if="node.menuType === 5" color="green">链接</a-tag>
				</template>
				<template v-if="column.dataIndex === 'path'">
					<a-tag v-if="node.path" :bordered="false">{{ node.path }}</a-tag>
				</template>
				<template v-if="column.dataIndex === 'component'">
					<a-tag v-if="node.path" :bordered="false">{{ node.component }}</a-tag>
				</template>
				<template v-if="column.dataIndex === 'permission'">
					<a-tag v-if="node.permission" :bordered="false">{{ node.permission }}</a-tag>
				</template>
				<template v-if="column.dataIndex === 'icon'">
					<span v-if="node.icon && node.icon !== '#'" >
						<component :is="node.icon"/>
					</span>
					<span v-else />
				</template>
				<template v-if="column.dataIndex === 'visible'">
					<span v-if="node.menuType !== 4" >
						<a-tag v-if="node.visible === 1" color="green">可见</a-tag>
						<a-tag v-else>不可见</a-tag>
					</span>
					<span v-else ></span>
				</template>
				<template v-if="column.dataIndex === 'action'">
					<a-button type="link" size="small" @click="editFormRef.onOpen(node, module)">编辑</a-button>
					<a-divider type="vertical" />
					<a-popconfirm title="确定要删除此菜单吗？" @confirm="deleteMenu(record)">
						<a-button type="link" size="small" danger>删除</a-button>
					</a-popconfirm>
				</template>
			</template>
		</s-table>
	</a-card>
	<AddForm ref="addFormRef" @successful="handleSuccess" />
	<EditForm ref="editFormRef" @successful="handleSuccess" />
</template>

<script setup>
	import menuApi from '@/api/sys/menuApi'

	import { h } from 'vue'
	import { DeleteOutlined, FormOutlined, PlusOutlined } from '@ant-design/icons-vue'
	import AddForm from './addForm.vue'
	import EditForm from './editForm.vue'
	import { useMenuStore } from '@/store/menu'

	const queryForm = ref({})
	const tableRef = ref()
	const addFormRef = ref()
	const editFormRef = ref()
	const module = ref()
	const moduleList = ref([])
	const toolConfig = { refresh: true, height: true, columnSetting: false, striped: false }
	const columns = [
		{
			title: '显示名称',
			dataIndex: 'name'
		},
		{
			title: '类型',
			dataIndex: 'menuType',
			align: 'center',
			width: 80
		},
		{
			title: '图标',
			dataIndex: 'icon',
			align: 'center',
			width: 80
		},
		{
			title: '路由地址',
			dataIndex: 'path',
			ellipsis: true,
			width: 150
		},
		{
			title: '组件',
			dataIndex: 'component',
			ellipsis: true,
			width: 150
		},
		{
			title: '权限',
			dataIndex: 'permission',
			ellipsis: true,
			width: 150
		},
		{
			title: '是否可见',
			dataIndex: 'visible',
			align: 'center',
			width: 100
		},
		{
			title: '排序',
			dataIndex: 'weight',
			sorter: true,
			align: 'center',
			width: 80
		},
		{
			title: '操作',
			dataIndex: 'action',
			align: 'center',
			width: 160,
			scopedSlots: { customRender: 'action' }
		}
	]
	let selectedRowKeys = ref([])
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
		if (!module.value) {
			// 若无module, 则查询module列表第一个module作为默认module
			return menuApi.menuList({ "menuType": 1 }).then((data) => {
				moduleList.value = data
				module.value = data.length > 0 ? data[0].code : ''
				queryForm.value.module = module.value
				return menuApi.menuTree(Object.assign(parameter, queryForm.value)).then((data) => {
					if (data) {
						return data
					} else {
						return []
					}
				})
			})
		} else {
			// menuTree获取到的data中的id和parentId均为code
			return menuApi.menuTree(Object.assign(parameter, queryForm.value)).then((data) => {
				if (data) {
					return data
				} else {
					return []
				}
			})
		}
	}
	// 切换应用标签查询菜单列表
	const moduleClick = (value) => {
		queryForm.value.module = value
		tableRef.value.refresh(true)
	}
	// 单个删除
	const deleteMenu = (node) => {
		let data = { codes: [node.code] }
		menuApi.deleteMenuTree(data).then(() => {
			tableRef.value.refresh(true)
			refreshCacheMenu()
		})
	}
	// 批量删除
	const batchDeleteMenu = (params) => {
		let data = { codes: selectedRowKeys.value }
		menuApi.deleteMenuTree(data).then(() => {
			tableRef.value.clearRefreshSelected()
			refreshCacheMenu()
		})
	}
	// 成功回调
	const handleSuccess = () => {
		tableRef.value.refresh(true)
		refreshCacheMenu()
	}
	// 刷新缓存的菜单
	const refreshCacheMenu = () => {
		const menuStore = useMenuStore()
		menuStore.fetchMenu()
	}
</script>

<style scoped>
.ant-form-item {
	margin-bottom: 0 !important;
}
</style>
