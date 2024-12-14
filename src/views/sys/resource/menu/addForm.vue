<template>
	<a-drawer
		:open="visible"
		title="增加菜单"
		:width="drawerWidth"
		:footerStyle="{'display': 'flex', 'justify-content': 'flex-end' }"
		@close="onClose"
	>
		<a-form ref="formRef" :model="formData">
			<a-card title="基本信息">
				<a-row :gutter="24">
					<a-col :span="12">
						<a-form-item label="显示名称：" name="name" :rules="[required('请输入菜单名称')]">
							<a-input v-model:value="formData.name" placeholder="请输入显示名称" allow-clear />
						</a-form-item>
					</a-col>
					<a-form-item label="菜单类型：" name="menuType" :rules="[required('请选择菜单类型')]">
						<a-radio-group v-model:value="formData.menuType" button-style="solid">
							<!-- 1模块 2目录 3菜单 4按钮 5外链 -->
							<a-radio-button :value="2">目录</a-radio-button>
							<a-radio-button :value="3">菜单</a-radio-button>
							<a-radio-button :value="4">按钮</a-radio-button>
							<a-radio-button :value="5">外链</a-radio-button>
						</a-radio-group>
					</a-form-item>
					<a-col :span="12">
						<a-form-item label="上级菜单：" name="parentCode" :rules="[required('请选择上级菜单')]">
							<a-tree-select
								v-model:value="formData.parentCode"
								v-model:treeExpandedKeys="defaultExpandedKeys"
								:dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
								placeholder="请选择上级菜单"
								allow-clear
								:tree-data="treeData"
								:field-names="{ children: 'children', label: 'name', value: 'id' }"
								selectable="false"
								tree-line
								@change="parentChange"
							/>
						</a-form-item>
					</a-col>
					<a-col :span="12">
						<a-form-item label="排序:" name="sortNum">
							<a-input-number class="xn-wd" v-model:value="formData.sortNum" :max="100" />
						</a-form-item>
					</a-col>
				</a-row>
			</a-card>
			<a-card title="资源信息">
				<!-- 路由、组件、权限、图标、可见、排序 -->
				<a-row :gutter="24">
					<!-- 目录、菜单:路由地址 -->
					<a-col :span="12" v-if="formData.menuType === 2 || formData.menuType === 3">
						<a-form-item name="path" :rules="[required('请输入路由地址')]">
							<template #label>
								<a-tooltip>
									<template #title>
										路由前面必须有反斜杠！
									</template>
									<question-circle-outlined />
								</a-tooltip>
								&nbsp 路由地址
							</template>
							<a-input v-model:value="formData.path" placeholder="请输入路由地址" allow-clear />
						</a-form-item>
					</a-col>
					<!-- 外链:链接地址 -->
					<a-col :span="12" v-else-if="formData.menuType === 5">
						<a-form-item name="path" :rules="[required('请输入连接地址')]">
							<template #label>
								<a-tooltip>
									<template #title>
										链接必须以http(s)开头
									</template>
									<question-circle-outlined />
								</a-tooltip>
								&nbsp 链接地址
							</template>
							<a-input v-model:value="formData.path" placeholder="请输入链接地址" allow-clear />
						</a-form-item>
					</a-col>
					<!-- 菜单:组件地址 -->
					<a-col :span="12" v-if="formData.menuType === 3">
						<a-form-item name="component" :rules="[required('请输入组件地址')]">
							<template #label>
								<a-tooltip>
									<template #title> 组件可设置为代码文件夹名称 </template>
									<question-circle-outlined />
								</a-tooltip>
								&nbsp 组件地址
							</template>
							<a-input v-model:value="formData.component" addon-before="src/views/" placeholder="请输入组件地址" allow-clear/>
						</a-form-item>
					</a-col>
					<!-- 按钮:权限标识 -->
					<a-col :span="12" v-if="formData.menuType === 4">
						<a-form-item name="permission" :rules="[required('请输入权限标识')]">
							<template #label>
								<a-tooltip>
									<template #title> 权限标识应与后端接口保持一致且用':'分割 </template>
									<question-circle-outlined />
								</a-tooltip>
								&nbsp 权限标识
							</template>
							<a-input v-model:value="formData.permission" placeholder="请输入权限标识" allow-clear/>
						</a-form-item>
					</a-col>
				</a-row>
				<a-row :gutter="24">
					<!-- 目录、菜单、外链:是否可见 -->
					<a-col :span="12" v-if="formData.menuType === 2 || formData.menuType === 3 || formData.menuType === 5">
						<a-form-item label="是否可见:" name="visible" :rules="[required('请选择是否可见')]">
							<a-radio-group v-model:value="formData.visible" button-style="solid" :options="visibleOptions" />
						</a-form-item>
					</a-col>
					<!-- 目录、菜单、外链:图标 -->
					<a-col :span="12" v-if="formData.menuType === 2 || formData.menuType === 3 || formData.menuType === 5">
						<a-form-item label="图标：" name="icon">
							<a-input v-model:value="formData.icon" class="xn-wdcalc-70" placeholder="请选择图标" allow-clear disabled />
							<a-button type="primary" @click="iconSelector.showIconModal(formData.icon)">选择</a-button>
						</a-form-item>
					</a-col>
				</a-row>
			</a-card>
		</a-form>
		<template #footer>
			<a-button class="xn-mr8" @click="onClose">关闭</a-button>
			<a-button type="primary" :loading="submitLoading" @click="onSubmit">保存</a-button>
		</template>
		<Icon-selector ref="iconSelector" @iconCallBack="iconCallBack" />
	</a-drawer>
</template>

<script setup>
	import { required } from '@/utils/formRules'
	import SnowflakeId from 'snowflake-id'
	import menuApi from '@/api/sys/menuApi'
	import IconSelector from '@/components/Selector/iconSelector.vue'
	import { globalStore } from "@/store";

	const store = globalStore()

	// 默认是关闭状态
	const visible = ref(false)
	const emit = defineEmits({ successful: null })
	const formRef = ref()
	const treeData = ref([])
	const iconSelector = ref()
	// 表单数据，这里有默认值
	const formData = ref({
		menuType: 3,
		visible: 1,
		sortNum: 99,
		status: 0
	})
	// 默认展开的节点(顶级)
	const defaultExpandedKeys = ref([0])
	const submitLoading = ref(false)
	// 模块ID
	const moduleId = ref('')

	const drawerWidth = computed(() => {
		return store.menuIsCollapse ? `calc(100% - 80px)` : `calc(100% - 210px)`
	})

	// 打开抽屉(新增时无data)
	const onOpen = (moduleCode) => {
		visible.value = true
		// 模块赋值
		moduleId.value = moduleCode
		// 获取菜单树并加入顶级节点
		menuApi.menuTreeSelector({ module: moduleCode }).then((res) => {
			defaultExpandedKeys.value = [moduleCode]
			treeData.value = [
				{
					id: moduleCode,
					parentId: '0',
					name: '顶级',
					children: res
				}
			]
		})
	}
	// 关闭抽屉
	const onClose = () => {
		formRef.value.resetFields()
		visible.value = false
	}
	// 选择上级加载模块的选择框
	const parentChange = (value) => {
		console.log(value)
		// formData.value.parentCode = value
	}
	// 图标选择器回调
	const iconCallBack = (value) => {
		if (value) {
			formRef.value.clearValidate('icon')
		}
		formData.value.icon = value
	}
	// 是否可见options
	const visibleOptions = [
		{ label: "可见", value: 1 },
		{ label: "不可见", value: 0 }
	]
	// 验证并提交数据
	const onSubmit = () => {
		formRef.value.validate().then(() => {
			const param = buildParam(formData.value)
			submitLoading.value = true
			menuApi.addMenu(param).then(() => {
				onClose()
				emit('successful')
			}).finally(() => {
				submitLoading.value = false
			})
		}).catch(() => {
		})
	}
	const buildParam = (data) => {
		// 统一增加模块标识
		data.module = moduleId.value
		// 如果用户输入的组件带反斜线，则去掉
		if (data.component && data.component.slice(0, 1) === '/') {
			data.component = data.component.slice(1)
		}
		return data
	}
	// 调用这个函数将子组件的一些数据和方法暴露出去
	defineExpose({
		onOpen
	})
</script>
