import { AppRouteRecord } from '@/types/router'
import { systemRoutes } from './system'
import { visitRoutes } from './visit'
import { resultRoutes } from './result'
import { exceptionRoutes } from './exception'

/**
 * 导出所有模块化路由
 */
export const routeModules: AppRouteRecord[] = [
  visitRoutes,
  systemRoutes,
  resultRoutes,
  exceptionRoutes
]
