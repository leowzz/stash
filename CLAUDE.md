# Stash 项目指南

## 常用命令

### 构建
- `make build` — 构建 debug 二进制（stash + phasher）
- `make ui` — 构建前端
- `make ui-start` — 启动前端开发服务器
- `make server-start` — 启动后端开发服务器

### 测试
- `make test` — 运行 Go 单元测试（`go test ./...`）
- `make it` — 运行包含集成测试的全部测试（需要 `-tags integration`）
- 运行单个测试：`go test ./pkg/sqlite/... -run TestSceneFull`

### 代码质量
- `make lint` — Go linter（golangci-lint）
- `make fmt` / `make fmt-ui` — 格式化 Go / 前端代码
- `make generate` — 生成 GraphQL 代码（前后端）
- `make validate` — PR 提交前完整验证（lint + 集成测试 + 前端检查）
- `make validate-ui-quick` — 仅验证改动的前端文件（更快）

## 架构概览

- **API 层**: GraphQL（gqlgen），resolver 在 `internal/api/resolver_*.go`
- **业务层**: `internal/{scene,performer,studio,tag,gallery,group,...}/`
- **数据层**: Repository 模式，接口在 `internal/models/`，SQLite 实现在 `internal/sqlite/`
- **外部服务**: FFmpeg、scraper、插件系统（JS/Python）、DLNA、stash-box 集成
- **前端**: `ui/v2.5/`（React + TypeScript + Vite + pnpm）
- **代码生成**: 修改 `graphql/*.graphql` 后必须运行 `make generate`

## 关键设计决策

- CGO 必须启用（SQLite 依赖）：`CGO_ENABLED=1`
- 前端资源通过 Go embed 内嵌到二进制文件中
- 两个二进制：`cmd/stash`（主应用）和 `cmd/phasher`（感知哈希工具）
- 集成测试通过 build tag `integration` 与单元测试分离
