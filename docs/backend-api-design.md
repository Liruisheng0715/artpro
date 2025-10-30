# Art Design Pro 后端 API 设计文档

> 电信运营商客户走访管理系统 - 后端接口规范

## 📋 目录

- [1. 接口规范](#1-接口规范)
- [2. 认证授权](#2-认证授权)
- [3. 用户管理](#3-用户管理)
- [4. 走访记录管理](#4-走访记录管理)
- [5. 数据库设计](#5-数据库设计)
- [6. 数据备份方案](#6-数据备份方案)

---

## 1. 接口规范

### 1.1 统一响应格式

```typescript
{
  "code": 200,          // 状态码：200成功，其他失败
  "msg": "操作成功",     // 消息提示
  "data": {}            // 响应数据
}
```

### 1.2 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 操作成功 |
| 401 | 未授权（Token无效或过期） |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 1.3 分页参数

```typescript
{
  "pageNum": 1,         // 页码，从1开始
  "pageSize": 10,       // 每页数量
  "total": 100          // 总记录数
}
```

---

## 2. 认证授权

### 2.1 用户登录

**接口地址：** `POST /api/auth/login`

**请求参数：**
```json
{
  "username": "admin",
  "password": "123456"
}
```

**响应数据：**
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userInfo": {
      "userId": 1,
      "username": "admin",
      "email": "admin@example.com",
      "avatar": "https://...",
      "roleCode": "super_admin",
      "roleName": "超级管理员"
    }
  }
}
```

### 2.2 获取用户信息

**接口地址：** `GET /api/user/info`

**请求头：**
```
Authorization: Bearer {accessToken}
```

**响应数据：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "userId": 1,
    "username": "admin",
    "email": "admin@example.com",
    "avatar": "https://...",
    "roleCode": "super_admin",
    "roleName": "超级管理员",
    "permissions": ["visit:add", "visit:edit", "visit:delete"]
  }
}
```

---

## 3. 用户管理

### 3.1 用户角色定义

| 角色代码 | 角色名称 | 权限说明 |
|---------|---------|---------|
| `super_admin` | 超级管理员 | 所有权限 + 系统配置 |
| `admin` | 管理员 | 数据增删改查 |
| `user` | 普通用户 | 数据增加、修改（不能删除） |

### 3.2 获取用户列表

**接口地址：** `GET /api/user/list`

**请求参数：**
```json
{
  "pageNum": 1,
  "pageSize": 10,
  "username": "",       // 用户名（模糊搜索）
  "roleCode": "",       // 角色代码
  "status": 1           // 状态：1启用 0禁用
}
```

**响应数据：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "list": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "avatar": "https://...",
        "roleCode": "super_admin",
        "roleName": "超级管理员",
        "status": 1,
        "createdAt": "2025-01-01 10:00:00",
        "updatedAt": "2025-01-01 10:00:00"
      }
    ],
    "total": 100,
    "pageNum": 1,
    "pageSize": 10
  }
}
```

---

## 4. 走访记录管理

### 4.1 获取走访记录列表

**接口地址：** `GET /api/visit/list`

**权限要求：** 所有角色

**请求参数：**
```json
{
  "pageNum": 1,
  "pageSize": 10,
  "operator": "中国移动",              // 运营商（可选）
  "company": "",                       // 公司名称（模糊搜索）
  "businessNumber": "",                // 业务号码
  "district": "",                      // 区县
  "visitTimeStart": "2025-01-01",      // 走访开始时间
  "visitTimeEnd": "2025-12-31"         // 走访结束时间
}
```

**响应数据：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "list": [
      {
        "id": "visit_20250101001",
        "operator": "中国移动",
        "company": "某某通信公司",
        "businessNumber": "0571-88888888",
        "tianYiNumber": "13800138000",
        "contactNumber": "13900139000",
        "packageType": "5G畅享套餐",
        "fee": 99.00,
        "district": "西湖区",
        "street": "文三路",
        "community": "嘉绿苑",
        "fullAddress": "浙江省杭州市西湖区文三路嘉绿苑10幢",
        "visitTime": "2025-01-15 14:30:00",
        "visitContent": "客户反馈网络信号良好，套餐使用满意度高。",
        "updateTime": "2025-01-15 15:00:00",
        "updateUser": "张三"
      }
    ],
    "total": 100,
    "pageNum": 1,
    "pageSize": 10
  }
}
```

### 4.2 获取走访记录详情

**接口地址：** `GET /api/visit/detail/:id`

**权限要求：** 所有角色

**响应数据：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "id": "visit_20250101001",
    "operator": "中国移动",
    // ... 其他字段同列表
  }
}
```

### 4.3 创建走访记录

**接口地址：** `POST /api/visit/create`

**权限要求：** 所有角色

**请求参数：**
```json
{
  "operator": "中国移动",
  "company": "某某通信公司",
  "businessNumber": "0571-88888888",
  "tianYiNumber": "13800138000",
  "contactNumber": "13900139000",
  "packageType": "5G畅享套餐",
  "fee": 99.00,
  "district": "西湖区",
  "street": "文三路",
  "community": "嘉绿苑",
  "fullAddress": "浙江省杭州市西湖区文三路嘉绿苑10幢",
  "visitTime": "2025-01-15 14:30:00",
  "visitContent": "客户反馈网络信号良好，套餐使用满意度高。"
}
```

**响应数据：**
```json
{
  "code": 200,
  "msg": "创建成功",
  "data": {
    "id": "visit_20250101001",
    // ... 完整记录
  }
}
```

### 4.4 更新走访记录

**接口地址：** `PUT /api/visit/update`

**权限要求：** 所有角色

**请求参数：**
```json
{
  "id": "visit_20250101001",
  "visitContent": "更新后的走访内容",
  // ... 其他需要更新的字段
}
```

**响应数据：**
```json
{
  "code": 200,
  "msg": "更新成功",
  "data": {
    // ... 更新后的完整记录
  }
}
```

### 4.5 删除走访记录

**接口地址：** `DELETE /api/visit/delete/:id`

**权限要求：** 仅管理员和超级管理员

**响应数据：**
```json
{
  "code": 200,
  "msg": "删除成功",
  "data": null
}
```

### 4.6 批量删除走访记录

**接口地址：** `POST /api/visit/batch-delete`

**权限要求：** 仅管理员和超级管理员

**请求参数：**
```json
{
  "ids": ["visit_20250101001", "visit_20250101002"]
}
```

**响应数据：**
```json
{
  "code": 200,
  "msg": "删除成功",
  "data": {
    "successCount": 2,
    "failCount": 0
  }
}
```

### 4.7 导出走访记录

**接口地址：** `GET /api/visit/export`

**权限要求：** 所有角色

**请求参数：** 同列表查询参数

**响应：** Excel文件流

---

## 5. 数据库设计

### 5.1 用户表（users）

```sql
CREATE TABLE `users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（BCrypt加密）',
  `email` VARCHAR(100) COMMENT '邮箱',
  `avatar` VARCHAR(255) COMMENT '头像URL',
  `role_code` VARCHAR(50) NOT NULL COMMENT '角色代码',
  `status` TINYINT DEFAULT 1 COMMENT '状态：1启用 0禁用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_username` (`username`),
  INDEX `idx_role_code` (`role_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

### 5.2 角色表（roles）

```sql
CREATE TABLE `roles` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '角色ID',
  `code` VARCHAR(50) UNIQUE NOT NULL COMMENT '角色代码',
  `name` VARCHAR(50) NOT NULL COMMENT '角色名称',
  `description` VARCHAR(200) COMMENT '角色描述',
  `permissions` JSON COMMENT '权限列表',
  `status` TINYINT DEFAULT 1 COMMENT '状态：1启用 0禁用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';
```

### 5.3 走访记录表（visit_records）

```sql
CREATE TABLE `visit_records` (
  `id` VARCHAR(50) PRIMARY KEY COMMENT '唯一编号（如：visit_20250101001）',
  `operator` VARCHAR(20) NOT NULL COMMENT '运营商',
  `company` VARCHAR(100) NOT NULL COMMENT '员工所属公司',
  `business_number` VARCHAR(50) NOT NULL COMMENT '业务号码',
  `tianyi_number` VARCHAR(50) NOT NULL COMMENT '天翼号码',
  `contact_number` VARCHAR(50) NOT NULL COMMENT '联系号码',
  `package_type` VARCHAR(100) NOT NULL COMMENT '套餐类型',
  `fee` DECIMAL(10, 2) NOT NULL COMMENT '费用',
  `district` VARCHAR(50) NOT NULL COMMENT '区县',
  `street` VARCHAR(100) NOT NULL COMMENT '街道',
  `community` VARCHAR(100) NOT NULL COMMENT '小区',
  `full_address` VARCHAR(300) NOT NULL COMMENT '完整地址',
  `visit_time` TIMESTAMP NOT NULL COMMENT '走访时间',
  `visit_content` TEXT NOT NULL COMMENT '走访内容',
  `update_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` VARCHAR(50) NOT NULL COMMENT '更新人员',
  `created_by` INT NOT NULL COMMENT '创建人ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_operator` (`operator`),
  INDEX `idx_company` (`company`),
  INDEX `idx_business_number` (`business_number`),
  INDEX `idx_district` (`district`),
  INDEX `idx_visit_time` (`visit_time`),
  INDEX `idx_created_by` (`created_by`),
  FULLTEXT INDEX `ft_visit_content` (`visit_content`) WITH PARSER ngram
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='走访记录表';
```

### 5.4 数据备份记录表（backup_logs）

```sql
CREATE TABLE `backup_logs` (
  `id` INT PRIMARY KEY AUTO_INCREMENT COMMENT '备份ID',
  `backup_file` VARCHAR(255) NOT NULL COMMENT '备份文件名',
  `backup_size` BIGINT NOT NULL COMMENT '备份大小（字节）',
  `backup_type` VARCHAR(20) NOT NULL COMMENT '备份类型：auto自动 manual手动',
  `status` VARCHAR(20) NOT NULL COMMENT '状态：success成功 failed失败',
  `error_msg` TEXT COMMENT '错误信息',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '备份时间',
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据备份记录表';
```

---

## 6. 数据备份方案

### 6.1 自动备份策略

**备份频率：** 每天凌晨 2:00 自动备份

**备份方式：**
- 全量备份（MySQL dump）
- 保留最近 30 天的备份文件
- 超过 30 天的自动清理

**备份存储：**
```
backups/
├── 2025-01-01-02-00-00.sql.gz    # 压缩备份文件
├── 2025-01-02-02-00-00.sql.gz
└── ...
```

### 6.2 备份脚本示例

```bash
#!/bin/bash
# backup.sh - MySQL 自动备份脚本

BACKUP_DIR="/data/backups"
DB_NAME="artpro"
DB_USER="root"
DB_PASS="your_password"
DATE=$(date +%Y-%m-%d-%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/${DATE}.sql.gz"

# 创建备份
mysqldump -u${DB_USER} -p${DB_PASS} ${DB_NAME} | gzip > ${BACKUP_FILE}

# 删除30天前的备份
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +30 -delete

# 记录备份日志
echo "[$(date)] Backup completed: ${BACKUP_FILE}" >> ${BACKUP_DIR}/backup.log
```

### 6.3 定时任务配置（Crontab）

```bash
# 每天凌晨2点执行备份
0 2 * * * /path/to/backup.sh
```

### 6.4 Docker 环境备份

```yaml
# docker-compose.yml 中添加备份服务
services:
  backup:
    image: databack/mysql-backup
    environment:
      - DB_SERVER=mysql
      - DB_USER=root
      - DB_PASS=${MYSQL_ROOT_PASSWORD}
      - DB_NAMES=artpro
      - DB_DUMP_FREQ=1440  # 每天备份（分钟）
      - DB_DUMP_BEGIN=0200 # 凌晨2点开始
      - DB_CLEANUP_TIME=2592000  # 保留30天
    volumes:
      - ./backups:/db
    depends_on:
      - mysql
```

---

## 7. 权限矩阵

| 功能 | 普通用户 | 管理员 | 超级管理员 |
|------|---------|--------|-----------|
| 查看走访记录 | ✅ | ✅ | ✅ |
| 新增走访记录 | ✅ | ✅ | ✅ |
| 修改走访记录 | ✅ | ✅ | ✅ |
| 删除走访记录 | ❌ | ✅ | ✅ |
| 导出数据 | ✅ | ✅ | ✅ |
| 用户管理 | ❌ | ❌ | ✅ |
| 角色管理 | ❌ | ❌ | ✅ |
| 系统配置 | ❌ | ❌ | ✅ |

---

## 8. 数据字典

### 8.1 运营商枚举

```typescript
enum Operator {
  MOBILE = '中国移动',
  UNICOM = '中国联通',
  TELECOM = '中国电信'
}
```

### 8.2 角色代码枚举

```typescript
enum RoleCode {
  SUPER_ADMIN = 'super_admin',  // 超级管理员
  ADMIN = 'admin',               // 管理员
  USER = 'user'                  // 普通用户
}
```

---

## 9. 开发建议

### 9.1 安全建议

1. **密码加密：** 使用 BCrypt 加密用户密码
2. **Token 有效期：** accessToken 有效期 2小时，refreshToken 有效期 7天
3. **接口限流：** 防止暴力破解，登录接口限制 5次/分钟
4. **SQL 注入防护：** 使用 Prisma ORM 防止 SQL 注入
5. **XSS 防护：** 前端输入校验 + 后端转义

### 9.2 性能优化

1. **索引优化：** 为常用查询字段添加索引
2. **缓存策略：** Redis 缓存用户信息和权限
3. **分页查询：** 使用游标分页提升性能
4. **慢查询监控：** 记录超过 1秒 的查询

### 9.3 日志记录

```typescript
// 操作日志示例
{
  userId: 1,
  username: 'admin',
  action: 'DELETE_VISIT',
  resourceId: 'visit_20250101001',
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  timestamp: '2025-01-15 10:30:00'
}
```

---

## 10. 接口测试清单

- [ ] 用户登录
- [ ] 获取用户信息
- [ ] 获取走访记录列表
- [ ] 创建走访记录（普通用户）
- [ ] 更新走访记录（普通用户）
- [ ] 删除走访记录（普通用户应该失败）
- [ ] 删除走访记录（管理员成功）
- [ ] 批量删除
- [ ] 数据导出
- [ ] Token 过期测试
- [ ] 权限验证测试

---

**文档版本：** v1.0
**最后更新：** 2025-01-15
**维护人员：** Claude
