<template>
	<a-card :bordered="false">
		<a-space>
			<a-radio-group v-model:value="moduleType" button-style="solid">
				<a-radio-button
					v-for="module in moduleTypeList"
					:key="module.code"
					:value="module.code"
					@click="moduleClick(module.code)"
				>
					<component :is="module.icon" />
					{{ module.name }}</a-radio-button
				>
			</a-radio-group>
			<a-input-search
				v-model:value="searchFormState.searchKey"
				placeholder="请输入菜单名称关键词"
				enter-button
				allowClear
				@search="onSearch"
			/>
		</a-space>
	</a-card>
	<a-card :bordered="false" class="mt-2">
		<s-table
			ref="tableRef"
			:columns="columns"
			:data="loadData"
			:alert="options.alert.show"
			bordered
			:row-key="(record) => record.id"
			:show-pagination="false"
			:tool-config="toolConfig"
			:row-selection="options.rowSelection"
			:scroll="{ x: 'max-content' }"
		>
			<template #operator class="table-operator">
				<a-space>
					<a-button type="primary" @click="formRef.onOpen(undefined, moduleType)">
						<template #icon><plus-outlined /></template>
						新增菜单
					</a-button>
					<xn-batch-button
						buttonName="批量删除"
						icon="DeleteOutlined"
						buttonDanger
						:selectedRowKeys="selectedRowKeys"
						@batchCallBack="deleteBatchMenu"
					/>
				</a-space>
			</template>
			<template #headerCell="{ title, column }">
				<template v-if="column.dataIndex === 'visible'">
					<a-tooltip>
						<template #title> 如果将上级目录设置为隐藏，那么上级目录下的菜单都会被隐藏！ </template>
						<question-circle-outlined />&nbsp {{ title }}
					</a-tooltip>
				</template>
			</template>
			<template #bodyCell="{ column, record }">
				<template v-if="column.dataIndex === 'menuType'">
					<a-tag v-if="record.menuType === 1" color="purple">模块</a-tag>
					<a-tag v-if="record.menuType === 2" color="blue">目录</a-tag>
					<a-tag v-if="record.menuType === 3" color="cyan">菜单</a-tag>
					<a-tag v-if="record.menuType === 4" color="green">按钮</a-tag>
					<a-tag v-if="record.menuType === 5" color="orange">链接</a-tag>
				</template>
				<template v-if="column.dataIndex === 'path'">
					<a-tag v-if="record.path" :bordered="false">{{ record.path }}</a-tag>
				</template>
				<template v-if="column.dataIndex === 'component'">
					<a-tag v-if="record.path" :bordered="false">{{ record.component }}</a-tag>
				</template>
				<template v-if="column.dataIndex === 'permission'">
					<a-tag v-if="record.permission" :bordered="false">{{ record.permission }}</a-tag>
				</template>
				<template v-if="column.dataIndex === 'icon'">
					<span v-if="record.icon && record.icon !== '#'" >
						<component :is="record.icon"/>
					</span>
					<span v-else />
				</template>
				<template v-if="column.dataIndex === 'visible'">
					<a-tag v-if="record.visible === 'FALSE'">
						{{ $TOOL.dictTypeData('MENU_VISIBLE', record.visible) }}
					</a-tag>
					<a-tag v-else color="green">
						<span v-if="record.visible === 'TRUE'">
							{{ $TOOL.dictTypeData('MENU_VISIBLE', record.visible) }}
						</span>
						<span v-else> 显示 </span>
					</a-tag>
				</template>
				<template v-if="column.dataIndex === 'action'">
					<a-space>
						<a-tooltip title="编辑">
							<a-button type="link" size="small" @click="formRef.onOpen(record, moduleType)">
								<template #icon>
									<FormOutlined/>
								</template>
							</a-button>
						</a-tooltip>
						<a-tooltip title="删除">
							<a-popconfirm title="确定要删除此菜单吗？" @confirm="deleteMenu(record)">
								<a-button type="text" danger size="small" :icon="h(DeleteOutlined)" />
							</a-popconfirm>
						</a-tooltip>
						<div v-if="record.parentId === '0' || record.menuType === 'MENU'">
							<a-divider type="vertical" />
							<a-dropdown>
								<a class="ant-dropdown-link">
									更多
									<DownOutlined />
								</a>
								<template #overlay>
									<a-menu>
										<a-menu-item v-if="record.parentId === '0'">
											<a @click="changeModuleFormRef.onOpen(record)">更改模块</a>
										</a-menu-item>
										<a-menu-item v-if="record.menuType === 'MENU'">
											<a @click="buttonRef.onOpen(record)">按钮权限</a>
										</a-menu-item>
									</a-menu>
								</template>
							</a-dropdown>
						</div>
					</a-space>
				</template>
			</template>
		</s-table>
	</a-card>
	<Form ref="formRef" @successful="handleSuccess" />
	<changeModuleForm ref="changeModuleFormRef" @successful="handleSuccess" />
	<Button ref="buttonRef" />
</template>

<script setup name="sysMenu">
	import { h } from 'vue'
	import { DeleteOutlined } from '@ant-design/icons-vue'
	import menuApi from '@/api/sys/resource/menuApi'
	import menuApi2 from '@/api/sys/menuApi'
	import Form from './form.vue'
	import ChangeModuleForm from './changeModuleForm.vue'
	import Button from '../button/index.vue'
	import { useMenuStore } from '@/store/menu'

	const searchFormState = ref({})
	const tableRef = ref(null)
	const formRef = ref()
	const changeModuleFormRef = ref()
	const buttonRef = ref()
	const moduleType = ref()
	const moduleTypeList = ref([])
	const toolConfig = { refresh: true, height: true, columnSetting: false, striped: false }
	const columns = [
		{
			title: '显示名称',
			dataIndex: 'name'
		},
		{
			title: '类型',
			dataIndex: 'menuType',
			width: 80
		},
		{
			title: '图标',
			dataIndex: 'icon',
			width: 60
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
			width: 100
		},
		{
			title: '排序',
			dataIndex: 'weight',
			sorter: true,
			width: 80
		},
		{
			title: '操作',
			dataIndex: 'action',
			width: '200px',
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
		if (!moduleType.value) {
			return menuApi2.menuList({ "menuType": 1 }).then((data) => {
				moduleTypeList.value = data
				moduleType.value = data.length > 0 ? data[0].code : ''
				searchFormState.value.module = moduleType.value
				return menuApi2.menuTree(Object.assign(parameter, searchFormState.value)).then((data) => {
					if (data) {
						return data
					} else {
						return []
					}
				})
			})
		} else {
			return menuApi2.menuTree(Object.assign(parameter, searchFormState.value)).then((data) => {
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
		searchFormState.value.module = value
		tableRef.value.refresh(true)
	}
	// 查询
	const onSearch = () => {
		tableRef.value.refresh(true)
	}
	/* const removeEmptyChildren = (data) => {
		if (data == null || data.length === 0) return;
		for (let i = 0; i < data.length; i++) {
			const item = data[i];
			if (item.children != null && item.children.length === 0) {
				item.children = null;
			} else {
				removeEmptyChildren(item.children);
			}
		}
		return data;
	};*/
	// 删除
	const deleteMenu = (record) => {
		let params = [
			{
				id: record.id
			}
		]
		menuApi.menuDelete(params).then(() => {
			tableRef.value.refresh(true)
			refreshCacheMenu()
		})
	}
	// 批量删除
	const deleteBatchMenu = (params) => {
		menuApi.menuDelete(params).then(() => {
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
