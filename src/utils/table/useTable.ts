import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import { TableCache, CacheInvalidationStrategy, type ApiResponse } from './tableCache'
import {
  defaultResponseAdapter,
  extractTableData,
  updatePaginationFromResponse,
  createSmartDebounce,
  createErrorHandler,
  type BaseRequestParams,
  type TableError
} from './tableUtils'
import { tableConfig } from './tableConfig'

/**
 * useTable 配置选项
 */
export interface UseTableOptions<T = any, P = BaseRequestParams> {
  /** 是否立即请求数据 */
  immediate?: boolean
  /** 初始请求参数 */
  params?: Partial<P>
  /** 响应数据适配器 */
  responseAdapter?: (response: unknown) => ApiResponse<T>
  /** 启用缓存 */
  enableCache?: boolean
  /** 缓存时间（毫秒） */
  cacheTime?: number
  /** 防抖延迟（毫秒） */
  debounceDelay?: number
  /** 错误处理回调 */
  onError?: (error: TableError) => void
  /** 请求前回调 */
  onBeforeRequest?: (params: P) => P | Promise<P>
  /** 请求成功回调 */
  onSuccess?: (data: T[], response: ApiResponse<T>) => void
  /** 启用日志 */
  enableLog?: boolean
  /** 排除的参数（不参与请求） */
  excludeParams?: string[]
}

/**
 * useTable 返回值
 */
export interface UseTableReturn<T = any, P = BaseRequestParams> {
  /** 表格数据 */
  data: {
    list: T[]
    total: number
    loading: boolean
    error: TableError | null
    pagination: {
      current: number
      size: number
      total: number
    }
  }
  /** 刷新数据 */
  refresh: (invalidation?: CacheInvalidationStrategy) => Promise<void>
  /** 更新请求参数 */
  updateParams: (params: Partial<P>) => void
  /** 重置参数 */
  resetParams: () => void
  /** 获取缓存统计 */
  getCacheStats: () => { total: number; size: string; hitRate: string }
  /** 清空缓存 */
  clearCache: (invalidation?: CacheInvalidationStrategy) => void
}

/**
 * 表格数据管理 Hook
 *
 * @example
 * ```ts
 * const { data, refresh, updateParams } = useTable(fetchUserList, {
 *   immediate: true,
 *   params: { status: 1 }
 * })
 * ```
 */
export function useTable<T = any, P extends BaseRequestParams = BaseRequestParams>(
  apiFn: (params: P) => Promise<any>,
  options: UseTableOptions<T, P> = {}
): UseTableReturn<T, P> {
  const {
    immediate = false,
    params: initialParams = {} as Partial<P>,
    responseAdapter = defaultResponseAdapter,
    enableCache = true,
    cacheTime = 5 * 60 * 1000,
    debounceDelay = 0,
    onError,
    onBeforeRequest,
    onSuccess,
    enableLog = false,
    excludeParams = []
  } = options

  // 缓存实例
  const cache = enableCache ? new TableCache<T>(cacheTime, 50, enableLog) : null

  // 错误处理器
  const handleError = createErrorHandler(onError, enableLog)

  // 初始化分页参数
  const defaultPagination = {
    current: 1,
    size: 10,
    total: 0
  }

  // 响应式数据
  const list = ref<T[]>([]) as any
  const loading = ref(false)
  const error = ref<TableError | null>(null)
  const pagination = reactive({ ...defaultPagination })

  // 请求参数
  const requestParams = reactive<Partial<P>>({
    ...initialParams,
    [tableConfig.paginationKey.current]: pagination.current,
    [tableConfig.paginationKey.size]: pagination.size
  } as Partial<P>)

  // 初始参数备份（用于重置）
  const initialParamsCopy = { ...initialParams }

  // 数据对象
  const data = computed(() => ({
    list: list.value,
    total: pagination.total,
    loading: loading.value,
    error: error.value,
    pagination: {
      current: pagination.current,
      size: pagination.size,
      total: pagination.total
    }
  }))

  /**
   * 过滤参数（移除排除的参数）
   */
  const filterParams = (params: Partial<P>): P => {
    const filtered = { ...params } as any
    excludeParams.forEach(key => {
      delete filtered[key]
    })
    return filtered as P
  }

  /**
   * 获取数据
   */
  const fetchData = async (invalidation: CacheInvalidationStrategy = CacheInvalidationStrategy.KEEP_ALL) => {
    try {
      loading.value = true
      error.value = null

      // 合并分页参数
      const finalParams: P = {
        ...requestParams,
        [tableConfig.paginationKey.current]: pagination.current,
        [tableConfig.paginationKey.size]: pagination.size
      } as P

      // 过滤参数
      const filteredParams = filterParams(finalParams)

      // 请求前回调
      const processedParams = onBeforeRequest
        ? await onBeforeRequest(filteredParams)
        : filteredParams

      // 检查缓存
      if (cache && invalidation === CacheInvalidationStrategy.KEEP_ALL) {
        const cached = cache.get(processedParams)
        if (cached) {
          if (enableLog) console.log('[useTable] 使用缓存数据')
          list.value = cached.data
          updatePaginationFromResponse(pagination, cached.response)
          return
        }
      }

      // 清理缓存
      if (cache && invalidation !== CacheInvalidationStrategy.KEEP_ALL) {
        switch (invalidation) {
          case CacheInvalidationStrategy.CLEAR_ALL:
            cache.clear()
            break
          case CacheInvalidationStrategy.CLEAR_CURRENT:
            cache.clearCurrentSearch(processedParams)
            break
          case CacheInvalidationStrategy.CLEAR_PAGINATION:
            cache.clearPagination()
            break
        }
      }

      // 发起请求
      const response = await apiFn(processedParams)
      const adapted = responseAdapter(response)
      const records = extractTableData(adapted)

      // 更新数据
      list.value = records
      updatePaginationFromResponse(pagination, adapted)

      // 缓存数据
      if (cache) {
        cache.set(processedParams, records, adapted)
      }

      // 成功回调
      onSuccess?.(records, adapted)

    } catch (err) {
      const tableError = handleError(err, '数据获取失败')
      error.value = tableError
      list.value = []
      pagination.total = 0
    } finally {
      loading.value = false
    }
  }

  // 创建防抖函数
  const debouncedFetch = debounceDelay > 0
    ? createSmartDebounce(fetchData, debounceDelay)
    : fetchData

  /**
   * 刷新数据
   */
  const refresh = async (invalidation: CacheInvalidationStrategy = CacheInvalidationStrategy.KEEP_ALL) => {
    await debouncedFetch(invalidation)
  }

  /**
   * 更新请求参数
   */
  const updateParams = (params: Partial<P>) => {
    Object.assign(requestParams, params)

    // 如果更新的参数包含分页字段，同步到 pagination
    const currentKey = tableConfig.paginationKey.current
    const sizeKey = tableConfig.paginationKey.size

    if (params[currentKey as keyof P] !== undefined) {
      pagination.current = params[currentKey as keyof P] as any
    }
    if (params[sizeKey as keyof P] !== undefined) {
      pagination.size = params[sizeKey as keyof P] as any
    }
  }

  /**
   * 重置参数
   */
  const resetParams = () => {
    Object.keys(requestParams).forEach(key => {
      delete (requestParams as any)[key]
    })
    Object.assign(requestParams, initialParamsCopy)
    pagination.current = 1
    pagination.size = 10
    pagination.total = 0
  }

  /**
   * 获取缓存统计
   */
  const getCacheStats = () => {
    return cache ? cache.getStats() : { total: 0, size: '0KB', hitRate: '0 avg hits' }
  }

  /**
   * 清空缓存
   */
  const clearCache = (invalidation: CacheInvalidationStrategy = CacheInvalidationStrategy.CLEAR_ALL) => {
    if (!cache) return

    switch (invalidation) {
      case CacheInvalidationStrategy.CLEAR_ALL:
        cache.clear()
        break
      case CacheInvalidationStrategy.CLEAR_CURRENT:
        cache.clearCurrentSearch(requestParams)
        break
      case CacheInvalidationStrategy.CLEAR_PAGINATION:
        cache.clearPagination()
        break
    }
  }

  // 监听分页变化
  watch([() => pagination.current, () => pagination.size], () => {
    refresh()
  })

  // 组件卸载时清理
  onUnmounted(() => {
    if (debouncedFetch && typeof (debouncedFetch as any).cancel === 'function') {
      (debouncedFetch as any).cancel()
    }
  })

  // 立即请求
  if (immediate) {
    refresh()
  }

  return {
    data,
    refresh,
    updateParams,
    resetParams,
    getCacheStats,
    clearCache
  }
}
