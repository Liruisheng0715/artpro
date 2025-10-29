/**
 * 配置相关类型定义
 */

import { MenuTypeEnum, SystemThemeEnum } from '@/enums/appEnum'
import { MenuThemeType, SystemThemeTypes } from '@/types/store'

// 主题设置
export interface ThemeSetting {
  name: string
  theme: SystemThemeEnum
  color: string[]
  leftLineColor: string
  rightLineColor: string
  img: string
}

// 菜单布局
export interface MenuLayout {
  name: string
  value: MenuTypeEnum
  img: string
  description?: string
}

// 节日配置
export interface FestivalConfig {
  date: string
  name: string
  image: string
  scrollText: string
  isActive?: boolean
}

// 系统基础配置
export interface SystemBasicConfig {
  // 系统名称
  name: string
  // 系统描述
  description?: string
  // 系统logo
  logo?: string
  // 系统favicon
  favicon?: string
  // 版权信息
  copyright?: string
}

// 系统配置
export interface SystemConfig {
  // 系统基础信息
  systemInfo: SystemBasicConfig
  // 系统主题样式
  systemThemeStyles: SystemThemeTypes
  // 设置主题列表
  settingThemeList: ThemeSetting[]
  // 菜单布局列表
  menuLayoutList: MenuLayout[]
  // 主题列表
  themeList: MenuThemeType[]
  // 暗色菜单样式
  darkMenuStyles: MenuThemeType[]
  // 系统主色调
  systemMainColor: readonly string[]
  // 系统设置
  systemSetting: {
    defaultMenuWidth: number
    defaultCustomRadius: string
    defaultTabStyle: string
  }
  // 顶部栏功能配置
  headerBar?: HeaderBarFeatureConfig
}

// 环境配置
export interface EnvConfig {
  // 环境名称
  NODE_ENV: string
  // 应用版本
  VITE_VERSION: string
  // 应用端口
  VITE_PORT: string
  // 应用基础路径
  VITE_BASE_URL: string
  // API 地址
  VITE_API_URL: string
  // 是否开启 Mock
  VITE_USE_MOCK?: string
  // 是否开启压缩
  VITE_USE_GZIP?: string
  // 是否开启 CDN
  VITE_USE_CDN?: string
}

// 应用配置
export interface AppConfig extends SystemConfig {
  // 环境配置
  env: EnvConfig
  // 开发模式
  isDev: boolean
  // 生产模式
  isProd: boolean
  // 测试模式
  isTest: boolean
}

// 功能配置项基础接口
export interface FeatureConfigItem {
  enabled: boolean
  description: string
}

// 顶部栏功能配置接口
export interface HeaderBarFeatureConfig {
  /** 菜单按钮 */
  menuButton: FeatureConfigItem
  /** 刷新按钮 */
  refreshButton: FeatureConfigItem
  /** 面包屑导航 */
  breadcrumb: FeatureConfigItem
  /** 全局搜索 */
  globalSearch: FeatureConfigItem
  /** 全屏功能 */
  fullscreen: FeatureConfigItem
  /** 通知功能 */
  notification: FeatureConfigItem
  /** 聊天功能 */
  chat: FeatureConfigItem
  /** 多语言切换 */
  language: FeatureConfigItem
  /** 设置面板 */
  settings: FeatureConfigItem
  /** 主题切换 */
  themeToggle: FeatureConfigItem
}
