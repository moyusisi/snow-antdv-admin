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
			<a-table size="middle"
					 ref="tableRef"
					 :columns="columns"
					 :data-source="tableData"
					 :row-key="(record) => record.code"
					 :row-selection="rowSelection"
					 :defaultExpandAllRows="true"
					 bordered>
				<template #bodyCell="{ column, record }">
					<template v-if="column.dataIndex === 'name'">
						<span v-if="record.menuType === 1">
							<a-tag color="orange">模块</a-tag>{{record.name}}
						</span>
						<span v-if="record.menuType === 1">
							<a-tag color="orange">模块</a-tag>{{record.name}}
						</span>
						<span v-if="record.menuType === 2">
							<a-tag color="cyan">目录</a-tag>{{record.name}}
						</span>
						<span v-if="record.menuType === 3">
							<a-tag color="blue">菜单</a-tag>{{record.name}}
						</span>
						<span v-if="record.menuType === 4">
							<a-tag color="purple">按钮</a-tag>{{record.name}}
						</span>
						<span v-if="record.menuType === 5">
							<a-tag color="green">链接</a-tag>{{record.name}}
						</span>
					</template>
					<template v-if="column.dataIndex === 'buttonList'">
						<a-space v-if="record.allButtonList">
							<a-checkbox-group v-model:value="record.grantButtonList" @change="(evt) => onButtonChange(evt, record)">
								<a-checkbox v-for="item in record.allButtonList" :checked="item.checked" :key="item.code" :value="item.code">
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

	const spinningLoading = ref(false)
	const firstShowMap = ref({})
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
	// 已选中的按钮
	const selectedBtnKeys = ref([])
	// 列表选择配置
	const rowSelection = ref({
		checkStrictly: false,
		selectedRowKeys: selectedRowKeys,
		onChange: (selectedKeys, selectedRows) => {
			selectedRowKeys.value = selectedKeys
			console.log('onChange:', selectedKeys);
		},
		onSelect: (record, selected, selectedRows) => {
			// 取消选择时，menu下的按钮也要取消
			if (selected === false) {
				record.grantButtonList = []
			}
		}
	});

	const moduleId = ref('')
	// 模块的所有清单数据
	const moduleDataList = ref([])
	// 表格中的数据
	const tableData = ref([])
	const echoDatalist = ref([])
	const roleCode = ref('')
	const loadDatas = ref([])

	const loadData = async (parameter) => {
		// 已有数据不重复查询
		if (moduleDataList.value.length > 0) {
			// 选中模块的菜单权限清单
			tableData.value = moduleDataList.value.find((e) => e.code === moduleId.value).children
			console.log(tableData.value)
		} else {
			// 菜单权限树
			spinningLoading.value = true
			const param = { code: roleCode.value }
			const res = await roleApi.menuTreeForGrant(param)
			spinningLoading.value = false
			moduleId.value = res[0].code
			moduleDataList.value = res
			tableData.value = moduleDataList.value[0].children
		}
		// 已选菜单
		// // firstShowMap = {} // 重置单元格合并映射
		// // 如果有数据，我们再不去反复的查询
		// if (echoDatalist.value.length > 0) {
		// 	// 这里必须保持联动，不可克隆
		// 	loadDatas.value = echoDatalist.value.find((f) => f.code === moduleId.value).menu
		// } else {
		// 	// 获取表格数据
		// 	spinningLoading.value = true
		// 	const res = await roleApi.roleResourceTreeSelector()
		// 	const param = {
		// 		id: resultDataModel.id
		// 	}
		// 	// 获取回显数据
		// 	const resEcho = await roleApi.roleOwnResource(param)
		// 	spinningLoading.value = false
		// 	echoDatalist.value = echoModuleData(res, resEcho)
		// 	moduleId.value = res[0].id
		// 	loadDatas.value = echoDatalist.value[0].menu
		// }
	}
	const checkFieldKeys = ['button']
	const visible = ref(false)
	// 返回的数据模型，最终需要转换成这样
	let resultDataModel = {
		id: '',
		grantInfoList: []
	}
	// 打开抽屉
	const onOpen = (record) => {
		visible.value = true
		roleCode.value = record.code
		firstShowMap.value = {}
		// 再查询授权清单树
		loadData()
	}
	// 数据转换
	const echoModuleData = (data, resEcho) => {
		// 通过应用循环
		data.forEach((module) => {
			if (module.menu) {
				// 加入回显内容
				module.menu.forEach((item) => {
					const menusCheck = ref(0)
					if (resEcho.grantInfoList.length > 0) {
						resEcho.grantInfoList.forEach((grant) => {
							if (item.id === grant.menuId) {
								menusCheck.value++
								// 处理按钮
								if (grant.buttonInfo.length > 0) {
									grant.buttonInfo.forEach((button) => {
										item.button.forEach((itemButton) => {
											if (button === itemButton.id) {
												itemButton.check = true
											}
										})
									})
								}
							}
						})
					}
					// 回显前面的2个
					if (menusCheck.value > 0) {
						item.parentCheck = true
						item.nameCheck = true
					}
				})

				// 排序
				module.menu.sort((a, b) => {
					// 首先比较parentName属性
					let nameComparison = b.parentName.localeCompare(a.parentName)
					if (nameComparison !== 0) {
						// 如果parentName不同，直接返回parentName的比较结果
						return nameComparison
					} else {
						// 如果name相同，则比较parentId属性，直接返回parentId的差值
						return Number(a.parentId) - Number(b.parentId)
					}
				})
				// 缓存加入索引
				module.menu.forEach((item, index) => {
					// 下面就是用来知道不同的一级菜单里面有几个二级菜单，以及他们所在的索引
					if (firstShowMap.value[item.parentName]) {
						firstShowMap.value[item.parentName].push(index)
					} else {
						firstShowMap.value[item.parentName] = [index]
					}
				})
			}
		})
		return data
	}

	// 通过应用分菜单
	const moduleClock = (value) => {
		moduleId.value = value
		loadData()
	}
	// 遍历字段
	const handleOnlySelf = (record, key, val) => {
		record[key].forEach((item) => {
			// 处理'button'选中状态
			item.check = val
		})
	}
	const checkAllChildNotChecked = (record) => {
		return checkFieldKeys.every((key) => {
			// 遍历所有的字段
			const child = record[key]
			return child.every((field) => !field.check)
		})
	}
	const changeChildCheckBox = (record, evt) => {
		let checked = evt.target.checked
		if (!checked && checkAllChildNotChecked(record)) {
			// 这里注释掉勾选去掉所有按钮，联动去掉菜单
			/*record.nameCheck = false
			record.parentCheck = false*/
		} else if (checked) {
			record.nameCheck = checked
			record.parentCheck = checked
		}
	}
	// 按钮授权列表变更
	const onButtonChange = (evt, record) => {
		// 选中按钮时，若菜单未选中，则需要选中菜单
		if (evt.length > 0 && selectedRowKeys.value.indexOf(record.code) === -1) {
			selectedRowKeys.value = [...selectedRowKeys.value, record.code]
			record.checked = true
		}
		console.log(record.allButtonList)
	}
	// 二级菜单的勾选
	const changeSub = (record, val) => {
		// 选中二级菜单
		record.nameCheck = val
		checkFieldKeys.forEach((key) => {
			// 遍历所有的字段
			handleOnlySelf(record, key, val)
		})
	}
	// 当点击首列的勾选
	const changeParent = (record, val) => {
		record.parentCheck = val
		// 通过这个应用id，找到应用下的所有菜单
		const moduleMenu = echoDatalist.value.find((f) => record.module === f.id)
		const parentName = record.parentName
		// 获取同一级菜单的所有索引
		const indexArr = firstShowMap.value[parentName]
		indexArr.forEach((indexItem) => {
			// 获取同一级菜单的所有行
			const row = moduleMenu.menu[indexItem]
			// 给这些菜单的索引去勾选
			changeSub(row, val)
		})
	}
	// 关闭抽屉
	const onClose = () => {
		// 将这些缓存的给清空
		echoDatalist.value = []
		moduleDataList.value = []
		moduleId.value = ''
		tableData.value = []
		loadDatas.value = []
		firstShowMap.value = {}
		visible.value = false
	}
	// 提交之前转换数据
	const convertData = () => {
		resultDataModel.grantInfoList = []
		echoDatalist.value.forEach((table) => {
			if (table.menu) {
				table.menu.forEach((item) => {
					const grantInfo = {
						menuId: '',
						buttonInfo: []
					}
					if (item.nameCheck) {
						grantInfo.menuId = item.id
						item.button.forEach((button) => {
							if (button.check) {
								grantInfo.buttonInfo.push(button.id)
							}
						})
						resultDataModel.grantInfoList.push(grantInfo)
					}
				})
			}
		})
		return resultDataModel
	}
	// 验证并提交数据
	const onSubmit = () => {
		// 收集所有的已选菜单和已选按钮

		const param = convertData()
		submitLoading.value = true
		roleApi
			.roleGrantResource(param)
			.then(() => {
				onClose()
				emit('successful')
				refreshCache()
			})
			.finally(() => {
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
	/* 重写复选框的样式 */
	.ant-checkbox-wrapper {
		margin-left: 0 !important;
		padding-top: 2px !important;
		padding-bottom: 2px !important;
	}
</style>
