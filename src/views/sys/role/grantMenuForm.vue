<template>
	<a-drawer
		title="角色授权-功能权限"
		:open="visible"
		:width="drawerWidth"
		:footerStyle="{'display': 'flex', 'justify-content': 'flex-end' }"
		:destroy-on-close="true"
		@close="onClose"
	>
		<a-spin :spinning="spinningLoading">
			<a-space class="xn-pb10">
				<a-radio-group v-model:value="moduleId" button-style="solid">
					<a-radio-button v-for="module in moduleDataList" :key="module.code" :value="module.code" @click="moduleClock(module.code)">
						<component :is="module.icon" /> {{ module.name }}
					</a-radio-button>
				</a-radio-group>
			</a-space>
			<!-- 菜单权限授权表格 -->
			<a-table size="small"
					 ref="tableRef"
					 :columns="columns"
					 :data-source="tableData"
					 :row-key="(record) => record.code"
					 :row-selection="rowSelection"
					 :defaultExpandedRowKeys="defaultExpandedRowKeys"
					 bordered>
				<template #bodyCell="{ column, record }">
					<template v-if="column.dataIndex === 'name'">
						<span v-if="record.menuType === 1">
							<a-tag color="orange">模块</a-tag>{{ record.name }}
						</span>
						<span v-if="record.menuType === 1">
							<a-tag color="orange">模块</a-tag>{{ record.name }}
						</span>
						<span v-if="record.menuType === 2">
							<a-tag color="cyan">目录</a-tag>{{ record.name }}
						</span>
						<span v-if="record.menuType === 3">
							<a-tag color="blue">菜单</a-tag>{{ record.name }}
						</span>
						<span v-if="record.menuType === 4">
							<a-tag color="purple">按钮</a-tag>{{ record.name }}
						</span>
						<span v-if="record.menuType === 5">
							<a-tag color="green">链接</a-tag>{{ record.name }}
						</span>
					</template>
					<template v-if="column.dataIndex === 'buttonList'">
						<a-space v-if="record.allButtonList">
							<a-checkbox-group v-model:value="record.grantButtonList"
											  @change="(evt) => onButtonChange(evt, record)">
								<a-checkbox v-for="item in record.allButtonList" :checked="item.checked"
											:key="item.code" :value="item.code">
									{{ item.name }}
								</a-checkbox>
							</a-checkbox-group>
						</a-space>
					</template>
				</template>
			</a-table>
		</a-spin>
		<template #footer>
			<a-space>
				<a-button @click="onClose">关闭</a-button>
				<a-button type="primary" :loading="submitLoading" @click="onSubmit">保存</a-button>
			</a-space>
		</template>
	</a-drawer>
</template>

<script setup>
	import roleApi from '@/api/sys/roleApi'
	import { useMenuStore } from '@/store/menu'
	import { userStore } from '@/store/user'
	import { useGlobalStore } from "@/store";
	import { Table } from "ant-design-vue";

	const globalStore = useGlobalStore()

	const visible = ref(false)
	const spinningLoading = ref(false)
	const emit = defineEmits({ successful: null })
	const submitLoading = ref(false)
	// 抽屉宽度
	const drawerWidth = computed(() => {
		return globalStore.menuIsCollapse ? `calc(100% - 80px)` : `calc(100% - 210px)`
	})

	const tableRef = ref(Table)
	const columns = [
		{
			title: '菜单权限',
			dataIndex: 'name',
			resizable: true,
			width: 300
		},
		{
			title: '按钮权限',
			dataIndex: 'buttonList'
		}
	]
	// 已选中的菜单
	const selectedRowKeys = ref([])
	// 默认展开的行
	const defaultExpandedRowKeys = ref([])
	// 列表选择配置
	const rowSelection = ref({
		checkStrictly: false,
		selectedRowKeys: selectedRowKeys,
		onChange: (selectedKeys, selectedRows) => {
			selectedRowKeys.value = selectedKeys
			// console.log('onChange:', selectedKeys);
		},
		onSelect: (record, selected, selectedRows) => {
			// 取消选择时，menu下的按钮也要取消
			if (selected === false) {
				record.grantButtonList = []
			}
		}
	});

	const roleCode = ref('')
	const moduleId = ref('')
	// 模块的所有清单数据
	const moduleDataList = ref([])
	// 表格中的数据
	const tableData = ref([])

	// 打开抽屉
	const onOpen = (record) => {
		visible.value = true
		roleCode.value = record.code
		// 再查询授权清单树
		loadData()
	}
	// 加载数据
	const loadData = async (parameter) => {
		// 已有数据不重复查询
		if (moduleDataList.value.length > 0) {
			// 选中模块的菜单权限清单
			tableData.value = moduleDataList.value.find((e) => e.code === moduleId.value).children
		} else {
			// 菜单权限树
			spinningLoading.value = true
			const res = await roleApi.menuTreeForGrant({ code: roleCode.value })
			spinningLoading.value = false
			moduleId.value = res[0].code
			moduleDataList.value = res
			tableData.value = moduleDataList.value[0].children
		}
		// 选中有权限的行，同时展开所有行
		selectedRowKeys.value = getCheckedMenuList(tableData.value)
	}

	// 获取有权限的菜单列表
	const getCheckedMenuList = (recordList) => {
		const selectedList = []
		recordList.forEach((record) => {
			// 选中状态的记录则有权限
			if (record.checked) {
				selectedList.push(record.code)
			}
			// 如果有子节点,继续遍历子节点的列表
			if (record.children) {
				const list = getCheckedMenuList(record.children)
				selectedList.push(...list)
				// 默认展开的行，有子节点就展开
				defaultExpandedRowKeys.value.push(record.code)
			}
		})
		return selectedList
	}
	// 通过应用分菜单
	const moduleClock = (value) => {
		moduleId.value = value
		loadData()
	}
	// 按钮授权列表变更
	const onButtonChange = (evt, record) => {
		// 选中按钮时，若菜单未选中，则需要选中菜单
		if (evt.length > 0 && selectedRowKeys.value.indexOf(record.code) === -1) {
			selectedRowKeys.value = [...selectedRowKeys.value, record.code]
			record.checked = true
		}
	}
	// 关闭抽屉
	const onClose = () => {
		// 将这些缓存的给清空
		moduleId.value = ''
		moduleDataList.value = []
		tableData.value = []
		visible.value = false
	}
	// 提交之前收集选中的按钮权限
	const grantButtonList = (recordList) => {
		const checkedList = []
		recordList.forEach((record) => {
			// 选中状态的记录则有权限
			if (record.grantButtonList) {
				checkedList.push(...record.grantButtonList)
			}
			// 如果有子节点,继续遍历子节点的列表
			if (record.children) {
				const list = grantButtonList(record.children)
				checkedList.push(...list)
			}
		})
		return checkedList
	}
	// 验证并提交数据
	const onSubmit = () => {
		// 收集所有的已选菜单和已选按钮
		const buttonList = grantButtonList(tableData.value)
		const menuList = selectedRowKeys.value
		const param = {
			code: roleCode.value,
			codes: [...menuList, ...buttonList]
		}
		submitLoading.value = true
		roleApi.roleGrantMenu(param).then(() => {
			onClose()
			emit('successful')
			refreshCache()
		}).finally(() => {
			submitLoading.value = false
		})
	}

	// 刷新缓存
	const refreshCache = () => {
		const menuStore = useMenuStore()
		menuStore.fetchMenu()
		userStore().refreshUserLoginUserInfo()
	}
	// 调用这个函数将子组件的一些数据和方法暴露出去
	defineExpose({
		onOpen
	})
</script>

<style scoped>

</style>
