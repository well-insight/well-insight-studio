# 提交规范

本仓库使用 [Conventional Commits](https://www.conventionalcommits.org/)。本地通过 **husky** + **commitlint** 在 `commit-msg` 钩子中校验。

## 格式

```text
<type>(optional-scope)!: <description>
```

### type（必填）

| type       | 含义                  |
| ---------- | --------------------- |
| `feat`     | 新功能                |
| `fix`      | 缺陷修复              |
| `docs`     | 文档                  |
| `style`    | 不影响逻辑的格式/样式 |
| `refactor` | 重构（非 feat / fix） |
| `perf`     | 性能                  |
| `test`     | 测试                  |
| `build`    | 构建 / 依赖           |
| `ci`       | CI                    |
| `chore`    | 杂项维护              |
| `revert`   | 回滚                  |

破坏性变更在 type 后加 `!`，例如 `feat!: 调整 Button API`，或在正文写 `BREAKING CHANGE:`。

### scope（可选）

按改动所在包或区域标注，例如：`web`、`api`、`shared`、`docs`。

```text

fix(web): 修复登录页跳转
docs(api): 补充鉴权说明
```

## 示例

```text

chore: 调整 monorepo 脚本

```

不合规的提交会被 hook 拒绝，例如缺少 type、或 type 不在允许列表中。
