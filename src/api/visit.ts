import request from '@/utils/http'

/**
 * 获取走访记录列表
 * @param params 搜索参数
 */
export function fetchVisitList(params: Api.Visit.VisitSearchParams) {
  return request.get<Api.Visit.VisitListResponse>({
    url: '/api/visit/list',
    params
  })
}

/**
 * 获取走访记录详情
 * @param id 记录ID
 */
export function fetchVisitDetail(id: string) {
  return request.get<Api.Visit.VisitRecord>({
    url: `/api/visit/detail/${id}`
  })
}

/**
 * 创建走访记录
 * @param params 创建参数
 */
export function fetchCreateVisit(params: Api.Visit.CreateVisitParams) {
  return request.post<Api.Visit.VisitRecord>({
    url: '/api/visit/create',
    params,
    showSuccessMessage: true
  })
}

/**
 * 更新走访记录
 * @param params 更新参数
 */
export function fetchUpdateVisit(params: Api.Visit.UpdateVisitParams) {
  return request.put<Api.Visit.VisitRecord>({
    url: '/api/visit/update',
    params,
    showSuccessMessage: true
  })
}

/**
 * 删除走访记录
 * @param id 记录ID
 */
export function fetchDeleteVisit(id: string) {
  return request.del({
    url: `/api/visit/delete/${id}`,
    showSuccessMessage: true
  })
}

/**
 * 批量删除走访记录
 * @param ids 记录ID数组
 */
export function fetchBatchDeleteVisit(ids: string[]) {
  return request.post({
    url: '/api/visit/batch-delete',
    params: { ids },
    showSuccessMessage: true
  })
}

/**
 * 导出走访记录
 * @param params 搜索参数
 */
export function fetchExportVisit(params: Api.Visit.VisitSearchParams) {
  return request.get({
    url: '/api/visit/export',
    params
  })
}

/**
 * 批量导入走访记录
 * @param params 导入参数
 */
export function fetchBatchImportVisit(params: Api.Visit.BatchImportParams) {
  return request.post<Api.Visit.BatchImportResponse>({
    url: '/api/visit/batch-import',
    params,
    showSuccessMessage: true
  })
}
