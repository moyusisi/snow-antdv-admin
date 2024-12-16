<template>
	<a-drawer
		:open="visible"
		title="新增模块"
		:width="550"
		:footerStyle="{'display': 'flex', 'justify-content': 'flex-end' }"
		:destroy-on-close="true"
		@close="onClose"
	>
		<a-form ref="formRef" :model="formData" layout="vertical">
			<a-form-item label="模块名称：" name="name" :rules="[required('请输入模块名称')]">
				<a-input v-model:value="formData.name" placeholder="请输入显示名称" allow-clear />
			</a-form-item>
			<a-form-item label="唯一编码" name="code" tooltip="不可更改！不填将会自动生成">
				<a-input v-model:value="formData.code" placeholder="唯一编码，不填将自动生成，创建后不可更改" allow-clear />
			</a-form-item>
			<a-form-item label="图标：" name="icon">
				<a-input v-model:value="formData.icon" placeholder="请选择图标" style="width: calc(100% - 70px)" allow-clear disabled />
				<a-button type="primary" @click="iconSelectorRef.showIconModal(formData.icon)">选择</a-button>
			</a-form-item>
			<!-- 使用状态 -->
			<a-form-item label="使用状态:" name="status" :rules="[required('请选择使用状态')]">
				<a-radio-group v-model:value="formData.status" option-type="button" button-style="solid" :options="statusOptions"/>
			</a-form-item>
			<a-form-item label="排序:" name="sortNum">
				<a-input-number v-model:value="formData.sortNum" :max="100" style="width: 100%"/>
			</a-form-item>
		</a-form>
		<template #footer>
			<a-space>
				<a-button @click="onClose">关闭</a-button>
				<a-button type="primary" @click="onSubmit">保存</a-button>
			</a-space>
		</template>
		<Icon-selector ref="iconSelectorRef" @iconCallBack="iconCallBack" />
	</a-drawer>
</template>

<script setup>
	import { required } from '@/utils/formRules'
	import menuApi from '@/api/sys/menuApi'
	import IconSelector from '@/components/Selector/iconSelector.vue'
	// 默认是关闭状态
	const visible = ref(false)
	const emit = defineEmits({ successful: null })
	const formRef = ref()
	const iconSelectorRef = ref()
	// 表单数据，这里有默认值
	const formData = ref({
		menuType: 1,
		visible: 1,
		sortNum: 9,
		status: 0
	})
	// 使用状态options（0正常 1停用）
	const statusOptions = [
		{ label: "正常", value: 0 },
		{ label: "已停用", value: 1 }
	]
	// 打开抽屉
	const onOpen = (record) => {
		visible.value = true
	}
	// 关闭抽屉
	const onClose = () => {
		formRef.value.resetFields()
		visible.value = false
	}
	// 图标选择器回调
	const iconCallBack = (value) => {
		if (value) {
			formRef.value.clearValidate('icon')
		}
		formData.value.icon = value
	}

	// 验证并提交数据
	const onSubmit = () => {
		formRef.value.validate().then(() => {
			menuApi.addMenu(formData.value).then(() => {
				emit('successful')
				onClose()
			})
		}).catch(() => {
		})
	}

	// 调用这个函数将子组件的一些数据和方法暴露出去
	defineExpose({
		onOpen
	})
</script>
