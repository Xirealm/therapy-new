# 心理咨询反移情检测助手使用指南

本项目是一个基于语音识别的心理咨询反移情检测助手，可以实时分析咨询对话，检测可能的反移情问题，并提供专业建议。

## 环境配置与启动步骤

### 第一步：创建 Python 环境

使用 Conda 创建 Python 3.10 环境：

```bash
# 创建新的 conda 环境
conda create -n therapy-assistant python=3.10
# 激活环境
conda activate therapy-assistant
# 安装依赖
cd /path/to/therapy-assistant
pip install -r requirements.txt
```

### 第二步：启动前端服务

在项目根目录下：

```bash
# 安装前端依赖
npm install
# 启动前端开发服务器
npm start
```

前端界面将在 http://localhost:3000 上运行。

### 第三步：启动语音识别后端

在新的终端窗口中：

```bash
# 确保在正确的 conda 环境中
conda activate therapy-assistant
# 启动语音识别服务
python src/backend/app.py
```

语音识别服务将在 http://localhost:31415 上运行。

### 第四步：启动主处理模块

在另一个新的终端窗口中：

```bash
# 确保在正确的 conda 环境中
conda activate therapy-assistant
# 启动主处理模块

python src/main.py
```

主处理模块将在 http://localhost:8000 上运行，处理反移情检测和实时分析。

### 第五步：开始语音识别

使用 curl 命令触发语音识别开始：

```bash
curl -X POST http://localhost:31415/start
```

至此，所有服务已启动完毕，您可以开始使用系统。打开 http://localhost:3000 查看界面并开始测试。

## 可选配置：使用 BlackHole 采集系统音频

要将电脑系统声音作为麦克风输入源（例如，分析录音或在线会议），可以安装 BlackHole 虚拟音频设备：

1. **安装 BlackHole**：
   ```bash
   # 使用 Homebrew 安装
   brew install blackhole-2ch
   ```

2. **配置 BlackHole**：
   - 打开"音频 MIDI 设置"（在应用程序 > 实用工具中）
   - 创建一个多输出设备，包含您的常规输出设备和 BlackHole
   - 将此多输出设备设为系统默认输出
   - 在应用程序中将 BlackHole 选为音频输入源

3. **配置应用**：
   - 在语音识别设置中选择 BlackHole 作为麦克风输入
   - 现在系统声音将被捕获并用于语音识别

## 故障排除

如果遇到端口占用问题，可以使用提供的脚本关闭相关端口：

```bash
python close_ports.py
```

如果需要强制关闭进程：

```bash
python close_ports.py --force
```

## 系统架构

- **前端**：React 应用，提供交互界面和可视化
- **语音识别后端**：Python Flask 服务，使用 Azure 语音识别
- **主处理模块**：FastAPI 服务，处理反移情检测和结果分析
- **WebSocket**：实现前后端实时数据传输

## 文件结构

```
therapy-assistant/
├── public/             # 静态资源
├── src/                # 源代码
│   ├── backend/        # 后端语音识别服务
│   ├── components/     # React 组件
│   ├── main.py         # 主处理模块
│   └── ...
├── records/            # 存储对话和检测记录
├── package.json        # 前端依赖配置
└── requirements.txt    # Python 依赖配置
```

## 注意事项

- 确保所有三个服务（前端、语音识别后端、主处理模块）同时运行
- 首次使用时需要允许麦克风访问权限
- 使用耳机可以避免语音识别捕获到系统输出的声音

---
