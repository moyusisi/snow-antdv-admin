<template>
	<a-drawer
		:open="visible"
		title="编辑分组(角色组、岗位)"
		:width="drawerWidth"
		:footerStyle="{'display': 'flex', 'justify-content': 'flex-end' }"
		@close="onClose"
	>
		<a-form ref="formRef" :model="formData">
			<a-card title="基本信息">
				<a-row :gutter="24">
					<a-col :span="12">
						<a-form-item label="分组名称：" name="name" :rules="[required('请输入名称')]">
							<a-input v-model:value="formData.name" placeholder="请输入显示名称" allow-clear />
						</a-form-item>
					</a-col>
					<a-col :span="12">
						<a-form-item label="组织编码：" name="code">
							<a-input v-model:value="formData.code" disabled/>
						</a-form-item>
					</a-col>
					<a-col :span="12">
						<a-form-item label="直属组织：" name="orgCode" :rules="[required('请选择直属组织')]">
							<a-tree-select
								v-model:value="formData.orgCode"
								v-model:treeExpandedKeys="defaultExpandedKeys"
								:dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
								placeholder="请选择直属组织"
								allow-clear
								:tree-data="treeData"
								:field-names="{ children: 'children', label: 'name', value: 'code' }"
								selectable="false"
								tree-line
								@change="parentChange"
							/>
						</a-form-item>
					</a-col>
					<a-form-item label="分组类型：" name="postType" :rules="[required('请选择分组类型')]">
						<a-radio-group v-model:value="formData.postType" button-style="solid">
							<!-- 岗位类型(字典 1特有 2通用 3自建) -->
							<a-radio-button :value="1">特有</a-radio-button>
							<a-radio-button :value="2">通用</a-radio-button>
							<a-radio-button :value="3">自建</a-radio-button>
						</a-radio-group>
					</a-form-item>
					<!-- 使用状态 -->
					<a-col :span="12">
						<a-form-item label="使用状态:" name="status" :rules="[required('请选择使用状态')]">
							<a-radio-group v-model:value="formData.status" option-type="button" button-style="solid" :options="statusOptions" />
						</a-form-item>
					</a-col>
					<a-col :span="12">
						<a-form-item label="排序:" name="sortNum" :rules="[required('请填写排序值')]">
							<a-input-number class="xn-wd" v-model:value="formData.sortNum" :max="100" />
						</a-form-item>
					</a-col>
				</a-row>
			</a-card>
		</a-form>
		<template #footer>
			<a-space>
				<a-button @click="onClose">关闭</a-button>
				<a-button type="primary" :loading="submitLoading" @click="onSubmit">保存</a-button>
			</a-space>
		</template>
	</a-drawer>
</template>

<script setup>
	import orgApi from '@/api/sys/orgApi'
	import postApi from '@/api/sys/postApi'

	import { required } from '@/utils/formRules'
	import { globalStore } from "@/store";

	const store = globalStore()

	// 默认是关闭状态
	const visible = ref(false)
	const emit = defineEmits({ successful: null })
	const formRef = ref()
	const treeData = ref([])
	const iconSelector = ref()
	// 表单数据，这里有默认值
	const formData = ref({})
	// 默认展开的节点(顶级)
	const defaultExpandedKeys = ref([0])
	const submitLoading = ref(false)
	// 使用状态options（0正常 1停用）
	const statusOptions = [
		{ label: "正常", value: 0 },
		{ label: "已停用", value: 1 }
	]
	const drawerWidth = computed(() => {
		return store.menuIsCollapse ? `calc(100% - 80px)` : `calc(100% - 210px)`
	})

	// 打开抽屉
	const onOpen = (record) => {
		visible.value = true
		// 获取组织信息
		postApi.postDetail({ code: record.code }).then((res) => {
			formData.value = res
		})
		// 获取组织树并加入顶级节点
		orgApi.orgTree({}).then((res) => {
			treeData.value = res
			defaultExpandedKeys.value = [res[0]?.code]
		})
	}
	// 关闭抽屉
	const onClose = () => {
		formRef.value.resetFields()
		visible.value = false
	}
	// 选择上级加载模块的选择框
	const parentChange = (value) => {
		formData.value.orgCode = value
	}

	// 验证并提交数据
	const onSubmit = () => {
		formRef.value.validate().then(() => {
			const param = formData.value
			submitLoading.value = true
			postApi.editPost(param).then(() => {
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
