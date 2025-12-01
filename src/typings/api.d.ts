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
    /** 角色类型枚举 */
    type RoleType = 'R_SUPER' | 'R_ADMIN' | 'R_USER'

    /** 角色列表 */
    type RoleList = Api.Common.PaginatedResponse<RoleListItem>

    /** 角色列表项 */
    interface RoleListItem {
      /** 角色ID */
      roleId: string
      /** 角色名称 */
      roleName: string
      /** 角色代码 */
      roleCode: RoleType
      /** 角色状态（是否启用） */
      enabled: boolean
    }

    /** 角色搜索参数 */
    type RoleSearchParams = Partial<
      Pick<RoleListItem, 'roleId' | 'roleName' | 'roleCode' | 'enabled'> &
        Api.Common.CommonSearchParams
    >

    /** 更新角色参数 */
    interface UpdateRoleParams {
      roleId: string
      roleCode?: RoleType
      enabled?: boolean
    }

    /** 用户列表 */
    type UserList = Api.Common.PaginatedResponse<UserListItem>

    /** 用户列表项 */
    interface UserListItem {
      /** 用户ID */
      id: number
      /** 用户名 */
      username: string
      /** 性别 (1:男, 0:女) */
      gender: 1 | 0
      /** 手机号 */
      mobile: string
      /** 邮箱 */
      email: string
      /** 部门 */
      dep: string
      /** 状态 */
      status: string
      /** 创建时间 */
      create_time: string
      /** 头像 */
      avatar: string
      /** 角色代码 */
      roleCode: RoleType
      /** 角色名称 */
      roleName: string
    }

    /** 用户搜索参数 */
    type UserSearchParams = Partial<
      Pick<UserListItem, 'id' | 'username' | 'roleCode' | 'status'> &
        Api.Common.CommonSearchParams
    >

    /** 更新用户角色参数 */
    interface UpdateUserRoleParams {
      /** 用户ID */
      id: number
      /** 新角色代码 */
      roleCode: RoleType
    }
  }
}
