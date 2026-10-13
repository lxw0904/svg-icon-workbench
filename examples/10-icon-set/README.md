# 10-icon-set 示例

此目录包含 10 个 `.svg` 文件，其中 `broken.svg` 是故意损坏的 XML，用来验证错误隔离。

在工作台点击或拖拽整个目录中的文件即可：

- 9 个正常文件应进入预览和图标列表。
- `broken.svg` 应进入右侧错误列表，且不影响其他文件。
- `home.svg` 与 `search.svg` 内部都使用了 `clip0`，生成 Sprite 后应分别变成 `home__clip0`、`search__clip0`。
