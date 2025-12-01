import request from '@/utils/http'

// 获取账号列表
export function fetchGetAccountList(params: Api.SystemManage.AccountSearchParams) {
  return request.get<Api.SystemManage.AccountList>({
    url: '/api/account/list',
    params
  })
}

// 更新账号信息（启用/禁用或修改权限）
export function fetchUpdateAccount(params: Api.SystemManage.UpdateAccountParams) {
  return request.put({
    url: '/api/account/update',
    params,
    showSuccessMessage: true
  })
}
