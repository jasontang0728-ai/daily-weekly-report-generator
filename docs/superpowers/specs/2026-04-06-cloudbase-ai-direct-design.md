# CloudBase AI 直连生成设计文档

**主题：** 将日报/周报生成主链路从 `云托管 mock 生成` 切换为 `wx.cloud.extend.AI` 直连云开发 AI 能力，先接 `DeepSeek`，后续支持切换到 `腾讯混元`。

## 背景

当前项目已经完成以下基础建设：

- 小程序前端、CloudBase 数据库、云托管服务均已跑通
- 日报/周报生成、保存、历史、模板管理主链路已可在微信开发者工具中验证
- 小程序运行时已经完成 `wx.cloud.init`
- 云开发环境已开通 AI 能力，且确认 `DeepSeek` 可用

当前的生成主链路仍然是：

- 小程序
- `wx.cloud.callContainer`
- 云托管 `cloudrun`
- mock draft builder

这条链路能用于联调，但还不是真实 LLM 调用。与此同时，云开发文档已经提供了面向小程序的 `wx.cloud.extend.AI` 能力，并且当前目标 provider `DeepSeek` 与后续目标 provider `腾讯混元` 都能走这条路径。

因此，本次设计不再继续加重 `cloudrun` 的 LLM 转发职责，而是把真实生成主链路切到云开发 AI 扩展。

## 目标

- 日报生成主链路改为 `wx.cloud.extend.AI`
- 周报生成主链路改为 `wx.cloud.extend.AI`
- 模型切换采用统一配置，不在页面内散落 provider/model 常量
- 当前默认接入 `DeepSeek`
- 后续切到 `腾讯混元` 时，不改页面调用逻辑，只改配置映射
- 保留现有 `ReportDocument`、模板校验、保存、历史等下游链路不变

## 非目标

- 本次不重做页面 UI
- 本次不增加“用户手动切换模型”界面
- 本次不实现流式输出
- 本次不删除现有 `cloudrun` 服务
- 本次不做多 provider 并行兜底
- 本次不实现完整的未保存离开提醒

## 方案选择

### 方案 A：继续以 `cloudrun` 为主链路接 LLM

优点：

- 后端集中控制 provider、日志、鉴权和 prompt
- 长期看更适合做统一治理

缺点：

- 当前 `cloudrun` 仍是 mock 结构，不是成熟 LLM 网关
- 还要补 provider adapter、密钥、环境变量、日志和转发层
- 对当前项目“尽快接上真实模型”的收益不高

### 方案 B：改为 `wx.cloud.extend.AI` 直连云开发 AI

优点：

- 最贴合当前代码成熟度
- 可直接利用已经跑通的云开发环境
- `DeepSeek -> 腾讯混元` 切换更轻
- 不需要维护额外的 LLM 转发层

缺点：

- 生成逻辑更多落在小程序服务层
- 可观测性和后端集中治理不如服务端代理

### 结论

采用 **方案 B**。

原因是当前项目最稳定的部分已经是：

- 小程序页面流程
- CloudBase 读写
- 模板与历史链路

而不是 `cloudrun` mock 路由。继续加重 `cloudrun` 会把当前复杂度重新抬高；直接切到 `wx.cloud.extend.AI` 更符合现阶段目标。

## 总体架构

新的生成链路调整为：

- 页面层调用 `generateDailyReport(...)` / `generateWeeklyReport(...)`
- 统一进入 `miniprogram/lib/services/ai.ts`
- `ai.ts` 根据场景读取模型配置
- `ai.ts` 通过 `wx.cloud.extend.AI.createModel(provider)` 创建模型客户端
- 调用 `generateText(...)`
- 把返回结果转换为当前项目已有的 `ReportDocument`
- 继续复用现有结构校验、保存、历史与预览逻辑

### 关键原则

- 页面层不感知 provider 名称
- provider/model 只允许在统一配置层定义
- `cloudrun` 保留但不再承担日报/周报主生成职责
- 生成结果仍需经过模板结构校验，避免脏数据直接落库

## 组件与职责

### 1. 运行时配置层

文件：

- `miniprogram/lib/config/runtime.ts`

职责：

- 保留 CloudBase 相关配置
- 保留 `requestTimeoutMs`
- 将 `useCloudRun` 从主链路开关降级，不再作为日报/周报生成主判断条件

说明：

CloudBase 数据库读写仍依赖当前环境配置，因此 `cloudEnvId` 仍然保留。`cloudServiceName` 可以先保留，作为回滚或后续备用信息，但不再主导生成链路。

### 2. AI 模型配置层

新增文件建议：

- `miniprogram/lib/config/ai-models.ts`

职责：

- 定义统一的模型预设
- 定义场景到模型的映射

建议结构：

- `MODEL_PRESETS`
  - `deepseek => { provider: "deepseek", model: "deepseek-v3.2" }`
  - `hunyuan => { provider: "hunyuan-exp", model: "hunyuan-2.0-instruct-20251111" }`
- `SCENARIO_MODEL_KEYS`
  - `daily_generate => "deepseek"`
  - `weekly_generate => "deepseek"`

这样后续切换到混元时，只需改场景映射，不改页面。

### 3. AI 服务层

文件：

- `miniprogram/lib/services/ai.ts`

职责：

- 保持 `generateDailyReport(...)` / `generateWeeklyReport(...)` 作为唯一对外入口
- 根据场景读取 provider/model 配置
- 调用 `wx.cloud.extend.AI`
- 组织 prompt
- 解析结果
- 做结构校验

说明：

当前 `ai.ts` 里既包含本地 draft fallback，又包含 `callCloudRun(...)` 逻辑。切换后，主逻辑会变成：

- 优先走 `wx.cloud.extend.AI`
- 保留本地 draft 作为开发回退路径
- `callCloudRun(...)` 不再作为主链路

### 4. Prompt 组装层

文件：

- 继续在 `miniprogram/lib/services/ai.ts` 内组织，或按实现需要拆出辅助函数

职责：

- 把日报原始输入、模板栏目、日期等上下文组装成 LLM 消息
- 把周报的日报列表、模板栏目、年周信息组装成 LLM 消息
- 明确要求返回与模板严格一致的结构

说明：

当前项目已有模板名称、结构校验等规则，因此 prompt 只需要对齐现有结构，不需要重新发明文档格式。

## 数据流

### 日报生成

1. 页面收集：
   - `rawInput`
   - `templateSections`
   - `reportDate`
2. 页面调用 `generateDailyReport(...)`
3. `ai.ts` 选择场景 `daily_generate`
4. 根据统一配置读取 `DeepSeek`
5. 调用 `wx.cloud.extend.AI.createModel("deepseek")`
6. 用 `generateText(...)` 请求真实模型
7. 把模型返回解析为 `ReportDocument`
8. 调用现有 `validateGeneratedDocument(...)`
9. 校验通过后回到页面，继续走编辑/完成/保存链路

### 周报生成

1. 页面收集：
   - 本周日报列表
   - 周报模板
   - `year`
   - `week`
2. 页面调用 `generateWeeklyReport(...)`
3. `ai.ts` 选择场景 `weekly_generate`
4. 根据统一配置读取 `DeepSeek`
5. 调用 `generateText(...)`
6. 把返回解析为 `ReportDocument`
7. 校验模板结构
8. 页面继续走预览/编辑/完成/保存链路

## 模型切换策略

### 当前默认

- `daily_generate => deepseek`
- `weekly_generate => deepseek`

### 后续切换到腾讯混元

只改统一配置，例如：

- `daily_generate => hunyuan`
- `weekly_generate => hunyuan`

不改：

- 页面层
- 数据保存
- 历史记录
- 模板管理

### 为什么不做 UI 切换

当前产品是“日报/周报助手”，不是多模型聊天工具。当前阶段最重要的是把真实模型主链路稳定接上，而不是增加用户感知的模型选择复杂度。

## 错误处理

### 云开发 AI 不可用

- `wx.cloud.extend.AI` 不存在
- provider/model 未开通
- 权限不足

处理方式：

- 在 AI 服务层抛出清晰错误
- 页面继续复用现有 toast 提示逻辑

### 模型返回为空或结构不合法

处理方式：

- 不直接保存
- 继续沿用现有 `validateGeneratedDocument(...)`
- 返回“内容不符合模板结构，请重试”一类错误

### 临时回退

为了降低切换风险，第一阶段可保留本地 draft fallback：

- 当 `wx.cloud.extend.AI` 不可用时，仍可回退到本地生成

这让前端在调试环境下更稳，也为真机/体验版调试留出回旋空间。

## 测试与验收建议

### 必测项

- 日报 `AI整理` 生成成功
- 周报 `生成本周周报` 成功
- 返回内容符合当前模板结构
- 切 `DeepSeek` 时主链路可用
- 修改场景映射后，切 `混元` 不需要改页面代码
- 生成失败时页面能给出清晰提示

### 回归项

- 日报保存
- 周报保存
- 日报历史
- 周报历史
- 模板管理
- 历史详情复制

## 风险与控制

### 风险 1：模型返回格式不稳定

控制：

- 保留结构校验
- 不通过校验就不落库

### 风险 2：切换 provider 时改动扩散

控制：

- 只允许统一配置层维护 provider/model
- 页面层不直接引用厂商名称

### 风险 3：当前 `cloudrun` 与新链路混用导致判断混乱

控制：

- 明确将 `wx.cloud.extend.AI` 设为主链路
- `cloudrun` 保留但不再承担日报/周报主生成职责

## 实施边界

本次设计仅覆盖：

- 小程序 AI 调用架构切换
- 统一模型配置
- `DeepSeek -> 腾讯混元` 的切换策略

不包含：

- 页面 UI 重做
- 用户手动模型切换
- 流式输出
- `cloudrun` 删除
- 完整 provider 抽象到独立 npm 包

## 成功标准

- 小程序在当前云开发环境下，可直接通过 `wx.cloud.extend.AI` 完成日报与周报生成
- 默认 provider 为 `DeepSeek`
- 后续切换到 `腾讯混元` 时，仅修改统一配置即可完成
- 页面层、模板层、历史层不需要因 provider 切换而返工
- 结构校验与保存链路继续稳定工作
