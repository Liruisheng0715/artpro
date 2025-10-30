/**
 * 走访管理相关类型定义
 */

declare namespace Api {
  namespace Visit {
    /** 运营商枚举 */
    type OperatorType = '中国移动' | '中国联通' | '中国电信'

    /** 走访记录 */
    interface VisitRecord {
      /** 唯一编号 */
      id: string
      /** 运营商 */
      operator: OperatorType
      /** 员工所属公司 */
      company: string
      /** 业务号码 */
      businessNumber: string
      /** 天翼号码 */
      tianYiNumber: string
      /** 联系号码 */
      contactNumber: string
      /** 套餐类型 */
      packageType: string
      /** 费用 */
      fee: number
      /** 区县 */
      district: string
      /** 街道 */
      street: string
      /** 小区 */
      community: string
      /** 完整地址 */
      fullAddress: string
      /** 走访时间 */
      visitTime: string
      /** 走访内容 */
      visitContent: string
      /** 更新时间 */
      updateTime: string
      /** 更新人员 */
      updateUser: string
    }

    /** 走访记录列表响应 */
    interface VisitListResponse {
      list: VisitRecord[]
      total: number
      pageNum: number
      pageSize: number
    }

    /** 走访记录搜索参数 */
    interface VisitSearchParams {
      /** 页码 */
      pageNum?: number
      /** 每页数量 */
      pageSize?: number
      /** 运营商 */
      operator?: OperatorType
      /** 员工所属公司 */
      company?: string
      /** 业务号码 */
      businessNumber?: string
      /** 区县 */
      district?: string
      /** 走访时间范围 */
      visitTimeRange?: [string, string]
    }

    /** 创建走访记录参数 */
    interface CreateVisitParams {
      operator: OperatorType
      company: string
      businessNumber: string
      tianYiNumber: string
      contactNumber: string
      packageType: string
      fee: number
      district: string
      street: string
      community: string
      fullAddress: string
      visitTime: string
      visitContent: string
    }

    /** 更新走访记录参数 */
    interface UpdateVisitParams extends Partial<CreateVisitParams> {
      id: string
    }
  }
}
