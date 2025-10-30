import { AppRouteRecord } from '@/types/router'

export const visitRoutes: AppRouteRecord = {
  path: '/visit',
  name: 'Visit',
  component: '/index/index',
  meta: {
    title: 'menus.visit.title',
    icon: '&#xe810;', // 使用图标编码
    roles: ['R_SUPER', 'R_ADMIN', 'R_USER'] // 所有角色都可访问
  },
  children: [
    {
      path: 'list',
      name: 'VisitList',
      component: '/visit/visit-list',
      meta: {
        title: 'menus.visit.list',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN', 'R_USER'],
        authList: [
          { title: '新增', authMark: 'add' },
          { title: '编辑', authMark: 'edit' },
          { title: '删除', authMark: 'delete' }
        ]
      }
    }
  ]
}
