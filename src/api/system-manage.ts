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

// 更新角色权限
export function fetchUpdateRolePermission(params: Api.SystemManage.UpdateRoleParams) {
  return request.put({
    url: '/api/role/update-permission',
    params,
    showSuccessMessage: true
  })
}

// 获取用户列表
export function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
  return request.get<Api.SystemManage.UserList>({
    url: '/api/user/list',
    params
  })
}

// 更新用户角色
export function fetchUpdateUserRole(params: Api.SystemManage.UpdateUserRoleParams) {
  return request.put({
    url: '/api/user/update-role',
    params,
    showSuccessMessage: true
  })
}
