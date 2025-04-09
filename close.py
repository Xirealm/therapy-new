#!/usr/bin/env python3
# filepath: /Users/imnort/Library/Mobile Documents/com~apple~CloudDocs/大学/反移情/close_ports.py

import os
import subprocess
import sys
import signal
import time

def find_pids_by_port(port):
    """查找占用指定端口的进程 PID"""
    try:
        # 使用 lsof 查找占用端口的进程
        cmd = f"lsof -i :{port} -t"
        result = subprocess.check_output(cmd, shell=True).decode('utf-8').strip()
        
        # 如果有多个 PID，分割它们
        if result:
            return [int(pid) for pid in result.split('\n')]
        return []
    except subprocess.CalledProcessError:
        # 端口未被占用
        return []

def kill_process(pid, graceful=True):
    """终止指定 PID 的进程"""
    try:
        if graceful:
            # 尝试优雅关闭 (SIGTERM)
            os.kill(pid, signal.SIGTERM)
            print(f"已发送终止信号到进程 {pid}")
            
            # 等待进程终止
            for _ in range(3):  # 最多等待 3 秒
                try:
                    os.kill(pid, 0)  # 检查进程是否存在
                    time.sleep(1)
                except OSError:
                    # 进程已经终止
                    return True
            
            # 如果进程仍然存在，使用 SIGKILL
            print(f"进程 {pid} 没有响应 SIGTERM，尝试强制终止...")
            os.kill(pid, signal.SIGKILL)
            print(f"已强制终止进程 {pid}")
        else:
            # 直接强制终止 (SIGKILL)
            os.kill(pid, signal.SIGKILL)
            print(f"已强制终止进程 {pid}")
        return True
    except OSError as e:
        print(f"终止进程 {pid} 时出错: {e}")
        return False

def close_port(port, force=False):
    """关闭指定端口上运行的所有程序"""
    pids = find_pids_by_port(port)
    
    if not pids:
        print(f"端口 {port} 没有被占用")
        return True
    
    print(f"发现 {len(pids)} 个进程占用端口 {port}: {', '.join(map(str, pids))}")
    
    success = True
    for pid in pids:
        if not kill_process(pid, not force):
            success = False
    
    # 验证端口是否已释放
    time.sleep(1)
    if find_pids_by_port(port):
        print(f"警告: 端口 {port} 仍然被占用")
        return False
    
    print(f"✅ 端口 {port} 已成功释放")
    return success

def main():
    # 添加命令行参数解析
    force_mode = "-f" in sys.argv or "--force" in sys.argv
    
    # 要关闭的端口列表
    ports = [8000, 31415, 3000]
    print(f"{'强制' if force_mode else '正常'}模式关闭端口: {', '.join(map(str, ports))}")
    
    all_success = True
    for port in ports:
        if not close_port(port, force_mode):
            all_success = False
    
    if all_success:
        print("✅ 所有端口已成功关闭")
    else:
        print("⚠️ 部分端口可能未成功关闭")
        sys.exit(1)

if __name__ == "__main__":
    main()