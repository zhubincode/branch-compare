# Branch Compare

[English](#en) | [中文](#zh)

<a id="en"></a>

# Branch Compare

A powerful Git branch comparison tool that helps you easily compare and analyze code commit differences between different branches.

## Features

- Interactive command-line interface
- Support for selecting source and target branches for comparison
- Flexible time range filtering (All time/Last week/Last month/Last 3 months/Last 6 months/Last year)
- Filter commits by author
- Smart detection of identical content with different hash values
- Generate detailed comparison reports
- Support for adding remarks and ignoring specific commits
- Timeline view
- Cross-platform support (Windows, macOS, Linux)

## Installation

### Global Installation (Recommended)

```bash
npm install -g branch-commit-compare
```

### Local Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

## Usage

### Recommended: Using npx (No Installation Required)

The simplest way to use this tool is with npx, which runs it directly without installation:

```bash
# Navigate to your Git repository
cd /path/to/your/git/repository

# Run the tool using npx
npx branch-commit-compare
```

### If installed globally:

```bash
# Navigate to your Git repository
cd /path/to/your/git/repository

# Run the command
branch-commit-compare
```

### If installed locally:

```bash
# Navigate to your Git repository
cd /path/to/your/git/repository

# Run using npm
npm start
```

Follow the interactive prompts:

1. Select the base branch (source)
2. Select the target branch
3. Choose time range
4. Select author (optional)

The tool will automatically analyze the differences between branches and generate a report.

## Key Features Explained

### Smart Commit Detection

- Automatically identifies commits with identical content but different hash values
- Helps prevent duplicate analysis of the same changes

### Flexible Filtering

- Time-based filtering with multiple preset ranges
- Author-based filtering
- Branch-specific commit analysis

### Report Generation

- Detailed markdown reports
- Visual timeline view
- Commit categorization (source-only, target-only, common)

### HTML Report Details

The tool generates comprehensive HTML reports with the following features:

- **Interactive Timeline View**: Visualize commits along a chronological timeline with color-coded indicators for source and target branches
- **Detailed Commit Information**: View each commit's hash, author, date, and message in a structured format
- **Side-by-Side Comparison**: Compare source and target branches with clear visual indicators
- **Filtering Options**: Filter commits directly within the report based on branch, author, or time range
- **Collapsible Sections**: Expand or collapse sections to focus on relevant information
- **Responsive Design**: View reports on any device with a responsive layout
- **Search Functionality**: Quickly find specific commits or changes using the search feature
- **Export Options**: Export the report data for further analysis

The HTML reports are generated in your local directory and can be viewed in any modern web browser.

## Dependencies

- chalk@4.1.2 - Terminal styling
- inquirer@8.2.5 - Interactive CLI
- inquirer-autocomplete-prompt@2.0.0 - Autocomplete functionality
- fuzzy@0.1.3 - Fuzzy search capability

## System Requirements

- Node.js >= 12
- Git installed and configured

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT

---

<a id="zh"></a>

# Branch Compare

一个强大的 Git 分支比较工具，帮助你轻松对比和分析不同分支之间的代码提交差异。

## 功能特点

- 交互式命令行界面
- 支持选择源分支和目标分支进行比较
- 灵活的时间范围筛选（全部时间/最近一周/最近一月/最近三月/最近半年/最近一年）
- 按作者筛选提交记录
- 智能识别相同内容但不同哈希值的提交
- 生成详细的比较报告
- 支持添加备注和忽略特定提交
- 提供时间线视图
- 跨平台支持（Windows、macOS、Linux）

## 安装

### 全局安装（推荐）

```bash
npm install -g branch-commit-compare
```

### 本地安装

1. 克隆此仓库到本地
2. 安装依赖：

```bash
npm install
```

## 使用方法

### 推荐：使用 npx（无需安装）

使用此工具的最简单方法是通过 npx，它可以直接运行工具而无需安装：

```bash
# 切换到你的 Git 仓库目录
cd /path/to/your/git/repository

# 使用 npx 运行工具
npx branch-commit-compare
```

### 全局安装后使用：

```bash
# 切换到你的 Git 仓库目录
cd /path/to/your/git/repository

# 运行命令
branch-commit-compare
```

### 本地安装后使用：

```bash
# 切换到你的 Git 仓库目录
cd /path/to/your/git/repository

# 使用 npm 运行
npm start
```

按照交互式提示进行操作：

1. 选择基准分支（源分支）
2. 选择目标分支
3. 选择时间范围
4. 选择作者（可选）

工具将自动分析两个分支的差异并生成报告。

## 核心功能详解

### 智能提交检测

- 自动识别内容相同但哈希值不同的提交
- 避免重复分析相同的变更内容

### 灵活的筛选功能

- 基于时间范围的筛选，提供多个预设范围
- 基于作者的筛选
- 分支特定的提交分析

### 报告生成

- 详细的 Markdown 格式报告
- 可视化时间线视图
- 提交分类（仅源分支、仅目标分支、共同提交）

### HTML 报告详情

该工具生成的综合 HTML 报告具有以下特点：

- **交互式时间线视图**：通过时间轴可视化提交历史，源分支和目标分支使用不同颜色标识
- **详细的提交信息**：以结构化格式显示每个提交的哈希值、作者、日期和提交信息
- **并排比较视图**：清晰地并排比较源分支和目标分支
- **筛选选项**：可直接在报告中按分支、作者或时间范围筛选提交
- **可折叠部分**：展开或折叠各个部分，专注于相关信息
- **响应式设计**：支持在任何设备上查看报告
- **搜索功能**：使用搜索功能快速找到特定的提交或更改
- **导出选项**：导出报告数据以供进一步分析

HTML 报告生成在您的本地目录中，可以在任何现代网页浏览器中查看。

## 依赖项

- chalk@4.1.2 - 终端文字样式
- inquirer@8.2.5 - 交互式命令行工具
- inquirer-autocomplete-prompt@2.0.0 - 自动完成提示功能
- fuzzy@0.1.3 - 模糊搜索功能

## 系统要求

- Node.js >= 12
- 已安装并配置 Git

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT 
