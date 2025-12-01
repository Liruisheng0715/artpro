import request from '@/utils/http'

// 获取角色列表
export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams) {
  return request.get<Api.SystemManage.RoleList>({
    url: '/api/role/list',
    params
  })
}

// 更新角色状态（启用/禁用）
export function fetchUpdateRoleStatus(params: Api.SystemManage.UpdateRoleParams) {
  return request.put({
    url: '/api/role/update-status',
    params,
    showSuccessMessage: true
  })
}
