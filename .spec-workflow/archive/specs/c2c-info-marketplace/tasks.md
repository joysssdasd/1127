# Tasks Document

## Backend Services

- [x] 1. 实现双因子认证服务
  - Files: services/auth/src/wechat.controller.ts, services/auth/src/bind.service.ts, shared/contracts/auth.ts
  - Build OAuth state/nonce校验、openid+手机号绑定、JWT发行与刷新逻辑；补充手机号校验与节流，暴露`POST /auth/wechat/login`、`POST /auth/bind-phone`接口
  - Extend现有SMS模块、JWT中间件与设备指纹工具
  - _Requirements: 1_
  - _Prompt: Role: NestJS Auth Engineer | Task: Implement WeChat OAuth + phone verification binding flow per requirement 1 with proper throttling, JWT issuance, and failure handling using shared auth contracts | Restrictions: follow shared error codes, do not绕过captcha/OTP校验 | Success: 双绑定流程可重放测试，JWT含openid+deviceId，未绑定用户被拦截_

- [x] 2. 完成Listing服务的发布/上下架能力
  - Files: services/listing/src/listing.controller.ts, listing.service.ts, dto/create-listing.dto.ts, repositories/listing.repo.ts
  - 校验表单、扣积分、初始化查看额度/有效期、自动下架/重新上架、与AI网关的调用与回退
  - 集成事务、Outbox事件`listing.published` & `listing.expired`
  - _Requirements: 2,6_
  - _Prompt: Role: Backend Listing Developer | Task: Build listing publish/update lifecycle with AI-assisted enrichment and event emission per requirements 2 & 6 | Restrictions: 积分扣除必须调用Points API且幂等，AI失败要降级不阻断 | Success: 发布/编辑/重新上架接口自测通过并产生日志_

- [x] 3. 实现联系方式购买与成交追踪
  - Files: services/deal/src/contact-view.controller.ts, deal.service.ts, models/contact-view.entity.ts, models/deal-stat.entity.ts
  - 扣1积分、剪贴板token生成、24h成交回执、累计成交次数写入posts/users；超时提醒事件`deal.confirmation.pending`
  - 写入ContactView表、DealStats表，并触发通知服务
  - _Requirements: 2,3_
  - _Prompt: Role: Domain Service Engineer | Task: Implement contact purchase & deal confirmation pipeline handling points deduction, clipboard payload, reminders, and counters per requirements 2 & 3 | Restrictions: 同一买家重复确认需幂等，提醒仅触发一次/24h | Success: API契合OpenAPI，统计同步一致_

- [x] 4. 构建搜索服务（模糊+历史+热门）
  - Files: services/search/src/search.controller.ts, query-builders/listingQueryBuilder.ts, services/search-history.service.ts, shared/searchContracts.ts
  - 封装ES/Meilisearch查询，支持精准/模糊/拼音首字母权重；实现搜索历史写入与热门建议接口
  - _Requirements: 4_
  - _Prompt: Role: Search Engineer | Task: Implement multi-strategy search and history service with suggestion API per requirement 4, leveraging scoring weights和Redis缓存 | Restrictions: 历史记录最多10条/用户并支持清空，建议词需可配置 | Success: 搜索API P95<200ms且UT覆盖权重逻辑_

- [x] 5. 处理积分与人工充值
  - Files: services/points/src/ledger.service.ts, recharge.controller.ts, models/recharge-task.entity.ts, workers/rechargeReminder.worker.ts
  - 支持发布/查看扣分流水、充值申请、管理员审核、逾期提醒；写入操作日志
  - _Requirements: 2,5_
  - _Prompt: Role: Points Ledger Developer | Task: Implement publish/view deductions, recharge queue, admin reminders per requirements 2 & 5 with SLA tracking | Restrictions: 所有写操作包裹事务并记录幂等键，提醒通过消息队列发送 | Success: Ledger与Recharge测试通过并有Prometheus指标_

- [x] 6. DeepSeek AI Gateway
  - Files: services/ai-gateway/src/deepseek.controller.ts, deepseek.service.ts, config/secure-store.ts
  - 封装调用`POST /ai/extract-listing`，注入API Key(`sk-590...`) via secret manager、超时/重试、敏感词识别结果回传
  - _Requirements: 6_
  - _Prompt: Role: AI Integration Engineer | Task: Build DeepSeek proxy with timeout/retry/circuit breaker and risk flagging per requirement 6 | Restrictions: Key绝不硬编码，调用失败返回可恢复错误 | Success: Gateway在3次失败后熔断并暴露metrics_

## Frontend (H5 + Admin)

- [x] 7. H5 端注册/发帖/查看流程
  - Files: apps/frontend/src/modules/auth/**/*, modules/listing/**/*, modules/deal/**/*
  - 实现微信授权重定向、手机号绑定UI、发布表单（含AI建议浮层）、列表/详情展示累计成交次数、购买联系方式自动复制与失败重试
  - _Requirements: 1,2,3,4_
  - _Prompt: Role: Frontend Engineer (React/Vue H5) | Task: Implement end-user flows for auth, listing publish, search, contact purchase, ensuring toasts/reminders per requirements | Restrictions: 遵守移动端规范(48px)、使用现有组件库，不新增全局状态容器 | Success: 自测通过，Lighthouse移动得分>85_

- [x] 8. 搜索与历史组件
  - Files: apps/frontend/src/components/search/SearchBar.tsx, SearchHistoryList.tsx, services/searchApi.ts
  - 输入时调用搜索建议、支持拼音输入、展示/清除历史，联动筛选器
  - _Requirements: 4_
  - _Prompt: Role: Frontend Component Engineer | Task: Build reusable search bar & history components with suggestion dropdown meeting requirement 4 | Restrictions: 组件无业务状态，交互无阻塞 | Success: 单元测试覆盖输入/清除/回填_

- [x] 9. Admin 后台充值/风控待办
  - Files: apps/admin/src/pages/recharge/TaskList.tsx, hooks/useReminder.ts, pages/deal/FollowUp.tsx
  - 展示 pending 充值、批量审核、提醒操作日志；标注未反馈成交的待办列表
  - _Requirements: 3,5_
  - _Prompt: Role: Admin Frontend Engineer | Task: Build admin pages for recharge approvals and deal follow-ups per requirements 3 & 5 | Restrictions: 操作需二次确认，遵守表格组件规范 | Success: Cypress 覆盖审核/提醒流程_

## Testing & Observability

- [x] 10. 自动化测试与监控
  - Files: tests/unit/**/* (Auth/Listings/Deals/Search/Points/AI), tests/integration/contactPurchase.spec.ts, tests/e2e/h5-flows.spec.ts
  - 覆盖双因子/发布/购买/成交/搜索/充值等核心路径；集成Prometheus指标与告警（自动复制失败率、充值滞留）
  - _Requirements: All_
  - _Prompt: Role: QA/DevOps Engineer | Task: Implement unit/integration/E2E suites plus metrics/alerts covering full requirements | Restrictions: 单测需Mock外部依赖，E2E使用Playwright移动视口，报警阈值可配置 | Success: CI 100%通过并生成覆盖率/指标仪表_








