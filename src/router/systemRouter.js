import config from '@/config/settings'
import tool from '@/utils/tool'
import routerUtil from '@/utils/routerUtil'

import Layout from '@/layout/index.vue'
import Login from '@/views/auth/login/login.vue'
import Findpwd from '@/views/auth/findPwd/index.vue'
import Callback from '@/views/auth/login/callback.vue'

// 系统路由
const routes = [
	{
		name: 'layout',
		path: '/',
		component: Layout,
		redirect: tool.data.get('MENU') ? routerUtil.getIndexMenu(tool.data.get('MENU')).path : config.DASHBOARD_URL,
		children: []
	},
	{
		path: '/login',
		component: Login,
		meta: {
			title: '登录'
		}
	},
	{
		path: '/findpwd',
		component: Findpwd,
		meta: {
			title: '找回密码'
		}
	},
	{
		path: '/callback',
		component: Callback,
		meta: {
			title: '三方登录'
		}
	}
]

export default routes
