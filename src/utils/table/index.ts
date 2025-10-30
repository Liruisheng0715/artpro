/**
 * 表格工具集
 * 提供表格数据管理、缓存、分页等功能
 */

// 导出 useTable Hook
export { useTable } from './useTable'
export type { UseTableOptions, UseTableReturn } from './useTable'

// 导出缓存相关
export { TableCache, CacheInvalidationStrategy } from './tableCache'
export type { ApiResponse, CacheItem } from './tableCache'

// 导出工具函数
export {
  defaultResponseAdapter,
  extractTableData,
  updatePaginationFromResponse,
  createSmartDebounce,
  createErrorHandler
} from './tableUtils'
export type { BaseRequestParams, TableError } from './tableUtils'

// 导出配置
export { tableConfig } from './tableConfig'
