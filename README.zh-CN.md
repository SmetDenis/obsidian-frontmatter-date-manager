# Obsidian - Frontmatter Date Manager

[English](README.md) | **简体中文** | [Русский](README.ru.md) | [Deutsch](README.de.md) | [日本語](README.ja.md)

_本文档译自[英文 README](README.md)。发现错误？欢迎参与改进，详见 [CONTRIBUTING.md](CONTRIBUTING.md)。_

[![CI](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/SmetDenis/obsidian-frontmatter-date-manager)](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/releases/latest)
[![Obsidian](https://img.shields.io/badge/Obsidian-v1.11.0+-7C3AED)](https://obsidian.md)
[![Obsidian downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=7C3AED&label=downloads&query=%24%5B%22frontmatter-date-manager%22%5D.downloads&url=https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugin-stats.json)](https://community.obsidian.md/plugins/frontmatter-date-manager)
[![License: MIT](https://img.shields.io/github/license/SmetDenis/obsidian-frontmatter-date-manager)](LICENSE)

在 Obsidian 中编辑笔记时，自动更新 YAML frontmatter 中的 `created`、`updated` 和 `viewed` 日期。

## 为什么需要这个插件？

- **手动维护时间戳很繁琐。** 每次编辑笔记都要手动更新 frontmatter 中的 `created` 和 `updated`，既容易出错，又会打断你的写作思路。
- **Obsidian 没有内置的 frontmatter 日期管理。** 它在文件系统层面记录 `ctime`/`mtime`，但不会自动在笔记内部写入或维护日期属性。
- **同步工具会造成虚假更新。** Obsidian Sync、iCloud、Syncthing、Dropbox 以及基于 Git 的同步都会在内容并未真正变化的情况下修改文件。若没有内容哈希校验，每次同步都会触发一次时间戳更新——产生干扰，甚至可能导致无限同步循环。
- **模板和自动化插件容易冲突。** Templater、Daily Notes、QuickAdd 等插件会先创建文件再立即修改它。若没有可配置的延迟，时间戳会在模板尚未完全应用之前就被写入，从而产生错误的日期。
- **已有的库缺少时间戳。** 当你在一个已有成百上千篇笔记的库中启用本插件时，需要一种从文件系统日期批量填充时间戳的方法——而不是逐篇笔记手动更新。
- **手动录入会导致格式不一致。** 不同笔记最终会出现 `2024-01-15`、`Jan 15, 2024`、`15.01.2024` 等各种写法。本插件可在整个库中强制使用单一的可配置格式。
- **没有自动的“上次打开”记录。** Obsidian 会记录文件何时被修改，却没有“你上次*阅读*它是什么时候”的概念——也没有其他插件会把它写入 frontmatter。本插件可选地在你每次打开笔记时盖上一个 `viewed` 日期戳，使其可通过 Dataview 查询，用于间隔重复、复习流程以及“哪些笔记我已经好几个月没看过了？”这类看板。

## 功能特性

- 文件修改时自动更新 `updated` 字段（与 `mtime` 同步）
- 新建文件时自动设置 `created` 字段（与 `ctime` 同步）
- 文件被打开时自动设置 `viewed` 字段——这是其他插件所没有的独特功能（默认禁用）
- 统计你编辑每篇笔记的频率（`updated_count`，默认禁用）——一个近似的活跃度信号，你可以在 Bases/Dataview 中排序或筛选，找出编辑次数最多的笔记
- 可自定义的日期格式（使用 [date-fns](https://date-fns.org/v4.1.0/docs/format) 语法）
- 支持时区，并提供 IANA 时区自动补全
- 支持字符串和数字属性类型（数字类型适用于 Unix 时间戳）
- Gitignore 风格的文件过滤规则，带预览和校验
- 可配置的更新最小间隔
- 为新建文件设置延迟（兼容 Templater、Daily Notes 等）
- SHA-256 内容哈希以检测真实变更（防止同步工具引起的虚假更新）
- 变更检测模式：仅笔记正文、仅属性，或两者皆检测
- 可将指定属性排除在变更检测之外
- 在日期更新后运行一条命令
- 根据每个文件磁盘上自身的日期批量填充日期，并提供试运行预览
- 跨所有笔记重命名某个属性（迁移旧名称，带预览）
- 将已有日期从一种格式重排为另一种格式（解析旧值，写入新值，带预览）
- 每个批量预览都分页显示（上一页/下一页），展示所有受影响的文件（不设行数上限），并可在桌面端将完整差异下载为 TSV 文件（保存到系统下载目录，绝不写入你的库）
- 通过命令面板或状态栏开关自动更新
- 暂停自动更新 5 分钟，并自动恢复
- 多语言界面，跟随 Obsidian 的应用语言——英语和俄语经人工校对，另有 19 种基线翻译，所有语言均按键回退到英语
- 支持桌面端和移动端

## 截图

![笔记中自动维护的创建、更新和上次打开日期](screenshots/01-automatic-dates.png)

![根据每个文件自身的历史，为已有的库批量填充日期，带试运行预览](screenshots/02-populate-vault.png)

![将混杂的日期格式重排为统一标准，并对有歧义的日/月日期加以防护](screenshots/03-reformat-dates.png)

![条理清晰、通俗易懂的设置界面](screenshots/04-settings.png)

![Gitignore 风格的过滤规则，精确决定哪些笔记会被加上日期](screenshots/05-filter-rules.png)

## 安装

### 社区插件

在 Obsidian 中，打开「设置 > 第三方插件 > 浏览」，搜索 **Frontmatter Date Manager**，然后点击安装。

### 手动安装

从[最新发行版](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/releases/latest)下载 `main.js`、`manifest.json` 和 `styles.css`，放入 `<vault>/.obsidian/plugins/frontmatter-date-manager/`。

## 使用方法

插件安装后会自动运行。当你编辑一个 markdown 文件时，它会用当前的修改时间更新 `updated` 属性。如果 `created` 属性缺失，它会将其设置为文件的创建时间。你也可以在设置中启用 `viewed` 日期，以记录你上次打开每篇笔记的时间。

在 **设置 -> Frontmatter Date Manager** 中配置插件行为。

### 命令

| 命令                                   | 说明                                                     |
|----------------------------------------|---------------------------------------------------------|
| **更新当前文件的时间戳**               | 手动触发对当前笔记的时间戳更新                            |
| **开关自动更新**                       | 启用或禁用自动时间戳更新                                  |
| **暂停自动更新 5 分钟**                | 临时暂停更新，并自动恢复                                  |

**状态栏指示器** —— 显示当前状态（`Paused` 或 `Paused (Xm)`）；点击可开关自动更新。

## 设置

| 设置                               | 默认值                  | 说明                                                                             |
|------------------------------------|-------------------------|----------------------------------------------------------------------------------|
| 记录创建日期                       | `true`                  | 为尚无创建日期的笔记添加一个创建日期                                              |
| 创建日期属性                       | `created`               | 保存创建日期的属性名                                                              |
| 记录上次编辑日期                   | `true`                  | 每当你编辑笔记时更新该日期                                                        |
| 更新日期属性                       | `updated`               | 保存上次编辑日期的属性名                                                          |
| 统计编辑次数                       | `false`                 | 添加一个数字属性，每次编辑加一（一个近似的活跃度计数，并非精确历史）              |
| 编辑次数属性                       | `updated_count`         | 保存编辑次数的属性名                                                              |
| 记录上次打开日期                   | `false`                 | 每次打开笔记时保存日期                                                            |
| 查看日期属性                       | `viewed`                | 保存上次打开日期的属性名                                                          |
| 日期格式                           | `yyyy-MM-dd'T'HH:mm:ss` | 日期与时间格式（[date-fns 语法](https://date-fns.org/v4.1.0/docs/format)）       |
| 时区                               | `""`（系统）            | IANA 时区标识符；留空则使用系统时区                                               |
| 纯数字日期不加引号保存             | `false`                 | 对纯数字格式输出数字而非带引号的文本                                              |
| 自动更新                           | `true`                  | 当你编辑笔记时自动更新日期                                                        |
| 更新之间的最小间隔（秒）           | `30`                    | 两次日期更新之间的最小间隔                                                        |
| 要跳过的文件和文件夹               | `""`（所有文件）        | Gitignore 风格规则：每行为排除，`!` 重新包含，`#` 为注释                          |
| 变更检测（内容哈希）               | `true`                  | 仅在内容真正变化时才写入日期（SHA-256 哈希）                                      |
| 何为变更                           | `body`                  | 何种变化会触发更新：`body`、`frontmatter` 或 `both`                              |
| 忽略这些属性                       | `[]`                    | 在变更检测中忽略的属性；可用逗号分隔一次添加多个                                  |
| 新文件延迟                         | `5000` 毫秒             | 处理新建笔记前的等待时间                                                          |
| 启动时自动填充缓存                 | `true`                  | 插件加载时为未缓存的笔记构建变更检测数据                                          |
| 缓存条目上限                       | `10000`                 | 缓存超过此上限时，移除最久未使用的条目                                            |
| 更新后执行命令                     | `""`（无）              | 每次日期更新后运行的 Obsidian 命令                                                |

### 上次编辑早于创建日期

| 设置                             | 默认值     | 说明                                                                                                                             |
|----------------------------------|------------|----------------------------------------------------------------------------------------------------------------------------------|
| `如何修正顺序颠倒的日期`         | `disabled` | 当上次编辑日期早于创建日期时如何处理。仅作用于自动编辑；`disabled` 表示只检测不修改。                                            |
| `忽略微小差异（秒）`             | `0`        | 当差距小于此值时忽略顺序颠倒的日期。可用于抑制亚秒级的时钟偏差。                                                                  |
| `查找顺序颠倒的日期`             | _（操作）_ | 扫描你的笔记（遵守跳过规则），列出上次编辑日期早于创建日期的笔记。可在弹窗中应用修复。                                          |

可用策略：`将创建日期设为上次编辑日期`、`将上次编辑日期设为创建日期`、`将两者都设为较新的日期`。

## 日期格式示例

| 格式字符串              | 示例输出                  |
|-------------------------|---------------------------|
| `yyyy-MM-dd'T'HH:mm:ss` | 2026-04-12T14:30:00       |
| `yyyy-MM-dd HH:mm:ss`   | 2026-04-12 14:30:00       |
| `dd.MM.yyyy HH:mm`      | 12.04.2026 14:30          |
| `t`                     | 1776268200（Unix 秒）     |
| `T`                     | 1776268200000（Unix 毫秒）|

> **注意：** 本插件使用 **date-fns**，而非 Moment.js。常见迁移：`YYYY` -> `yyyy`，`DD` -> `dd`。

## 找出编辑次数最多的笔记（可选）

一旦启用 **统计编辑次数**，`updated_count` 属性就是一个普通数字，你可以随意排序和筛选。插件只负责写入这个数字——如何组织视图由你决定。例如，用一个 Dataview 查询找出你编辑最频繁的笔记：

````markdown
```dataview
TABLE updated_count, updated
WHERE updated_count
SORT updated_count DESC
LIMIT 20
```
````

或者在 Obsidian **Bases** 中，按 `updated_count` 降序排序（也可按近期的 `updated` 进行筛选）。该计数是一个近似的活跃度信号，并非精确历史——它从你启用该功能的那一刻开始计数。它每次编辑*会话*加一，而非每次按键加一：在你的 **更新之间的最小间隔** 窗口内的快速编辑会被算作一次。运行 **更新当前文件的时间戳** 命令也会计数；批量操作（填充/重排/重命名）会重写日期，但不改变计数。

## 常见问题

### 首次安装

> 我首次启用插件时，它会修改我所有已有的笔记吗？

不会。插件只在你编辑某个文件时才处理它。首次加载时，它会在后台为你已有的文件构建一份哈希缓存，为变更检测做准备，但在此过程中绝不会写入时间戳。在你真正编辑某篇笔记之前，你的库保持原样。

> 如何为安装前写的笔记添加时间戳？

使用「设置 → 批量操作 → 根据文件自身的日期设置日期」。它会读取每个文件在磁盘上自身的创建和修改日期，并将其写入笔记的属性中，并提供试运行预览，让你在提交前先行检查。默认模式是“仅填充缺失项”——已有的日期不会被覆盖。如果你的库通过 iCloud 或 Obsidian Sync 同步，这些磁盘上的日期可能已被同步服务重置——请仔细检查预览。

> 我使用 Templater / Daily Notes / QuickAdd。插件会和它们冲突吗？

不会。插件在处理新建文件前会等待 5 秒（可配置：设置 → 行为 → 高级 → 新文件延迟），给模板插件留出完成的时间。

> 我需要先手动给每篇笔记添加属性吗？

不需要。如果某篇笔记还没有属性，插件会在下次编辑时创建 `---` 块并插入日期。如果属性已存在，它会在你已有的属性旁添加日期属性。

> 哪种日期格式最适合 Dataview？

默认的 `yyyy-MM-dd'T'HH:mm:ss`（ISO 8601）开箱即用。Dataview 可以原生解析、排序和比较它。

> 插件使用 date-fns 而非 Moment.js。这对我有影响吗？

仅当你自定义日期格式时才有影响。关键区别：年份用 `yyyy`（而非 `YYYY`），日期用 `dd`（而非 `DD`）。如果插件检测到 Moment.js 风格的格式，会在设置中给出提示。

### 日常使用

> 我启用了 "viewed" 时间戳，但有些笔记里没有出现。

viewed 时间戳只在你打开文件时才写入。自启用该功能以来你尚未打开过的笔记还不会有该字段。相同的过滤规则和最小间隔设置同样适用于 viewed 的写入。

> 我编辑了标签或别名，但 `updated` 没有变化。这是 bug 吗？

不是。默认情况下，变更检测只关注笔记正文——只有属性块下方的改动才会触发日期更新。若要把属性变化也纳入其中，请将「设置 → 变更检测 → 何为变更」切换为“两者”。

> 同步（iCloud / Obsidian Sync / Dropbox）会导致虚假时间戳吗？

不会。插件通过 SHA-256 哈希比较文件内容。如果同步服务在不改变内容的情况下重写了文件，哈希值就会匹配，时间戳不会被更新。该功能默认启用。

> 我重命名或移动了一篇笔记。插件会跟丢它吗？

不会。哈希缓存条目会自动迁移到新路径。已有的时间戳会被保留。

> 我更改了日期格式。旧的时间戳会被转换吗？

不会自动转换。请使用「设置 → 批量操作 → 重排日期格式」来统一所有值。插件会自动检测已有格式（ISO 8601、欧式、美式、数字时间戳），并用你当前的格式重写它们。应用前可预览所有改动。

> 像 `01/05/2024` 这样的日期可能表示 1 月 5 日或 5 月 1 日。会怎么处理？

这类有歧义的日/月日期默认保持不变——插件绝不猜测。预览会显示找到了多少个，并提供一键选择（日在前或月在前），且会根据你的系统地区预先推荐，让你在任何内容被重写之前做出决定。只有一种有效解读的日期（例如 `25/12/2024`）总是会被转换。

> 我重命名了属性（例如 `created` → `date_created`）。已有的文件怎么办？

请使用「设置 → 批量操作 → 重命名属性」。输入旧的和新的属性名，预览受影响的笔记，然后应用。你可以选择删除旧属性还是同时保留两者。

> 我更改了时区。旧的时间戳会被重新计算吗？

不会。原理相同——旧值保持不变。新的写入会使用新时区。

> 如果某篇笔记的 YAML frontmatter 损坏了会怎样？

插件会跳过该文件，并显示一条包含文件路径和错误详情的通知。它绝不会写入 YAML 格式错误的文件。修正语法后，插件会在下次编辑时重新处理它。

> 我在快速保存。每次保存都会更新时间戳吗？

不会。两次更新之间有最小 30 秒的间隔（可配置：5-300 秒），外加 2 秒的防抖，因此快速编辑会被合并为一次时间戳写入。

## 同步与版本控制

插件会在其数据目录（`.obsidian/plugins/frontmatter-date-manager/`）内存储一个本地缓存文件 `hash-cache.json`。该文件包含用于内容变更检测的 SHA-256 哈希。它会在启动时自动重建，因此将其排除既安全又推荐。

**为何要排除：** 缓存在每次文件编辑时都会更新，因此多台设备会各自独立地修改它——从而导致频繁的同步冲突和不必要的流量。由于它会自动重建，同步它毫无益处。

添加到你的 `.gitignore`：

```
.obsidian/plugins/frontmatter-date-manager/hash-cache.json
```

对于 **Obsidian Sync**：该文件已被自动排除（Sync 不会同步除 `data.json` 之外的插件数据文件）。

对于 **iCloud、Syncthing、Dropbox 或其他基于文件的同步**：请将 `hash-cache.json` 添加到你的同步工具针对该插件目录的忽略/排除列表中。

## 隐私与权限能力

本插件完全在本地运行。它没有后端，不发起任何网络请求，也不收集任何形式的遥测或分析数据。社区插件的评分卡会列出一个插件代码可使用的权限能力；以下正是本插件对每一项的具体用途：

- **读取你库中的 markdown 文件。** 批量工具（填充日期、重命名属性、重排日期格式、查找顺序颠倒的日期、重建变更检测缓存）会跨整个库操作，因此它们会通过 Obsidian 的 `getMarkdownFiles()` 列出你的 markdown 笔记。插件从不枚举非 markdown 文件（不使用 `getFiles()`），所以附件、图片及其他二进制文件绝不会被触碰。
- **只写入已配置的日期属性。** 所有改动都经由 Obsidian 的 `processFrontMatter()`，它只触碰你配置的 `created` / `updated` / `viewed` 属性，而保持笔记正文、键的顺序、注释以及无关属性不受影响。
- **在自己的插件文件夹内写入一个附属文件。** SHA-256 变更检测缓存（`hash-cache.json`）写入 `.obsidian/plugins/frontmatter-date-manager/` 内，绝不会写入你的笔记。
- **仅本地导出。** “下载完整预览”按钮会通过浏览器将差异保存为一个本地 `.tsv` 文件，不会向你的库写入任何文件。文件下载仅限桌面端——在移动端，完整差异仍可在屏幕上的表格中查看。

## 语言

插件界面会自动跟随 Obsidian 自身的语言设置——无需单独设置一个语言选项。它内置 21 种语言的翻译（阿拉伯语、德语、英语、西班牙语、波斯语、法语、印度尼西亚语、意大利语、日语、韩语、荷兰语、波兰语、葡萄牙语、巴西葡萄牙语、俄语、泰语、土耳其语、乌克兰语、越南语，以及简体/繁体中文），任何翻译未覆盖到的文本都会回退到英语，所以界面绝不会出现空白。英语和俄语经人工校对；其余为基线翻译，**非常欢迎改进**——详见 [`CONTRIBUTING.md`](CONTRIBUTING.md) 中的 "Translations" 一节。

## 开发

```bash
make              # Show all available commands
make install      # Install dependencies
make pre-commit   # Run all checks (format, lint, test, build)
make local-test   # Build and copy plugin to local vault
```

要使用 `make local-test`，请在你的 shell 环境中设置 `OBSIDIAN_VAULT_TEST`，或直接传入：`make local-test OBSIDIAN_VAULT_TEST=/path/to/vault`。

## 许可证

[MIT](LICENSE)
