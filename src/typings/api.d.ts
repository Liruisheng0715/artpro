/**
 * namespace: Api
 *
 * 所有接口相关类型定义
 * 在.vue文件使用会报错，需要在 eslint.config.mjs 中配置 globals: { Api: 'readonly' }
 */

declare namespace Api {
  /** 通用类型 */
  namespace Common {
    /** 分页参数 */
    interface PaginationParams {
      /** 当前页码 */
      current: number
      /** 每页条数 */
      size: number
      /** 总条数 */
      total: number
    }

    /** 通用搜索参数 */
    type CommonSearchParams = Pick<PaginationParams, 'current' | 'size'>

    /** 分页响应基础结构 */
    interface PaginatedResponse<T = any> {
      records: T[]
      current: number
      size: number
      total: number
    }

    /** 启用状态 */
    type EnableStatus = '1' | '2'
  }

  /** 认证类型 */
  namespace Auth {
    /** 登录参数 */
    interface LoginParams {
      userName: string
      password: string
    }

    /** 登录响应 */
    interface LoginResponse {
      token: string
      refreshToken: string
    }

    /** 用户信息 */
    interface UserInfo {
      buttons: string[]
      roles: string[]
      userId: number
      userName: string
      email: string
      avatar?: string
    }
  }

  /** 系统管理类型 */
  namespace SystemManage {
    /** 账号类别 */
    type AccountRole = 'R_SUPER' | 'R_ADMIN' | 'R_USER'

    /** 账号列表 */
    type AccountList = Api.Common.PaginatedResponse<AccountListItem>

    /** 账号列表项 */
    interface AccountListItem {
      /** 账号ID */
      accountId: string
      /** 所属员工姓名 */
      employeeName: string
      /** 账号类别 */
      role: AccountRole
      /** 账号状态 */
      enabled: boolean
      /** 创建时间 */
      createTime: string
      /** 更新时间 */
      updateTime: string
    }

    /** 账号搜索参数 */
    type AccountSearchParams = Partial<
      Pick<AccountListItem, 'accountId' | 'employeeName' | 'role' | 'enabled'> &
        Api.Common.CommonSearchParams
    >

    /** 更新账号参数 */
    interface UpdateAccountParams {
      accountId: string
      role?: AccountRole
      enabled?: boolean
    }
  }
}
