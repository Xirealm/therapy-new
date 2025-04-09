import os
from openai import OpenAI
import dashscope
import json
from prompts import *

from uuid import uuid4
from datetime import datetime

from websockets.exceptions import ConnectionClosed

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"), 
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

import requests

API_URL = 'http://localhost:31415/results'  # 根据你的实际服务地址调整
POLL_INTERVAL = 10  # 每隔 10秒轮询一次
TM = datetime.now().strftime("%Y%m%d%H%M%S")

global full_detection
full_detection = []
# global full_dialogue
# full_dialogue = ""

def fetch_final_results():
    try:
        print("⏳ 获取识别结果...")
        response = requests.get(API_URL)
        if response.status_code == 200:
            data = response.json()
            results = data.get("results", [])
            for result in results:
                if result.get("type") == "final":
                    return result.get('text')
        else:
            print(f"❌ 请求失败: {response.status_code}")
    except Exception as e:
        print(f"🚨 错误: {e}")

if __name__ == '__main__':
    fetch_final_results()


def detect(user_input):
    flag = False
    for item in user_input:
        if "咨询师" in item["role"]:
            flag = True
    
    full_text = "\n".join(
        f'{item["role"]}：“{item["content"]}”' for item in user_input
    )

    if flag == False:
        return "{}"
    completion = client.chat.completions.create(
    model="qwen-max", # 模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
    response_format = {"type": "json_object"},
    messages=[
        {'role': 'system', 'content': system_prompt3},
        {'role': 'user', 'content': full_text},],
    )
    return completion.choices[0].message.content

def split_text(text):
    """把文本用 qwen 分割成咨询师和来访者对话的 json 格式"""
    if text is None:
        return "{}"
    # f_dialogue = full_dialogue.replace("{", "").replace("}", "")
    # system_prompt = prompt_split.format(full_dialogue)  # full_dialogue 是历史记录
    # print(system_prompt)
    # system_prompt = prompt_split
    try:
        completion = client.chat.completions.create(
            model="qwen-max",
            response_format={"type": "json_object"},
            messages=[
                {'role': 'system', 'content': prompt_split},
                {'role': 'user', 'content': text},  # 当前轮识别出来的新文本
            ],
        )
        result = completion.choices[0].message.content
        print("🔍 分割返回结果:", result)
        return result
    except Exception as e:
        print(f"❌ Qwen对话分割失败: {e}")
        return "{}"

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
import requests

app = FastAPI()
connected_clients = set()  # 添加这行来定义 connected_clients

# 添加 CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def fetch_and_broadcast():
    while True:
        try:
            response = requests.get(API_URL)
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                for result in results:
                    if result.get("type") == "final":
                        text = result.get('text')
                        # 处理成对话格式
                        dialog = split_text(text)
                        # 广播给前端
                        await broadcast(dialog)
        except Exception as e:
            print("Error:", e)
        await asyncio.sleep(POLL_INTERVAL)

async def broadcast(message):
    # 发送到本地WebSocket客户端
    for ws in connected_clients.copy():
        try:
            await ws.send_text(message)
        except Exception as e:
            print(f"本地推送失败: {e}")
            connected_clients.remove(ws)

@app.websocket("/ws/dialog")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    try:
        # 保持连接打开
        while True:
            await asyncio.sleep(1)
    except Exception as e:
        print(f"\nWebSocket错误: {e}")
    finally:
        connected_clients.remove(websocket)
        print("WebSocket连接关闭")

@app.on_event("startup")
async def startup_event():
    global connected_clients
    connected_clients = set()
    # 启动fetch_and_broadcast任务
    asyncio.create_task(fetch_and_broadcast())

# 启动 FastAPI 服务器的任务
async def run_server():
    config = uvicorn.Config(app, host="0.0.0.0", port=8000)
    server = uvicorn.Server(config)
    await server.serve()

def save_history_to_json(data, record_type, file_path=None):
    """
    保存数据到 JSON 文件
    
    参数:
    - data: 要保存的数据
    - record_type: 记录类型，可选值为 "dialogue"、"detection" 或 "culture"
    - file_path: 指定的文件路径，若为None则根据record_type自动生成
    """
    
    try:
        # 根据记录类型确定文件路径
        if file_path is None:
            if record_type == "dialogue":
                file_path = f"dialogue_history_{TM}.json"
            elif record_type == "detection":
                file_path = f"detection_history_{TM}.json"
            elif record_type == "culture":
                file_path = f"culture_history_{TM}.json"
        file_path = os.path.join('records', file_path)
        if not os.path.exists('records'):
            os.makedirs('records')
        # 如果文件已存在，读取原有内容
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                history = json.load(f)
        else:
            history = []

        # 添加新记录并写入文件
        history.extend(data)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
        print(f"✅ 对话历史已写入 {file_path}")
        
    except Exception as e:
        print(f"❌ 写入历史文件出错: {e}")

def analyze_emotions(dialogue_json):
    """分析对话中的情绪状态"""
    if not dialogue_json or len(dialogue_json) < 2:
        # 如果对话太短，返回默认值
        return {
            "therapist": {"primary": "中立", "secondary": "专业", "intensity": 50},
            "client": {"primary": "中立", "secondary": "中立", "intensity": 50}
        }
    
    full_text = "\n".join(
        f'{item["role"]}："{item["content"]}"' for item in dialogue_json
    )
    
    try:
        completion = client.chat.completions.create(
            model="qwen-max",
            response_format={"type": "json_object"},
            messages=[
                {'role': 'system', 'content': system_prompt_emotion},
                {'role': 'user', 'content': full_text},
            ],
        )
        
        emotion_result = json.loads(completion.choices[0].message.content)
        return emotion_result
    except Exception as e:
        print(f"情绪分析失败: {e}")
        return {
            "therapist": {"primary": "专注", "secondary": "专业", "intensity": 50},
            "client": {"primary": "中立", "secondary": "中立", "intensity": 50}
        }

def analyze_culture(dialogue_json):
    """分析对话中的文化差异"""
    full_text = "\n".join(
        f'{item["role"]}："{item["content"]}"' for item in dialogue_json  # 只分析最后5条对话
    )
    
    try:
        completion = client.chat.completions.create(
            model="qwen-max",
            response_format={"type": "json_object"},
            messages=[
                {'role': 'system', 'content': prompt_culture},
                {'role': 'user', 'content': full_text},
            ],
        )
        
        culture_result = completion.choices[0].message.content
        return culture_result
    except Exception as e:
        print(f"文化分析失败: {e}")
        return ""
# 全局变量，用于存储所有的检测结果


# 主监测循环
async def main_loop():
    last_text = ""  # 用于存储上一次的文本，避免重复处理
    
    while True:
        try:
            # 获取识别结果
            text = fetch_final_results()
            print(text)
            if text == "":
                continue
            # 处理文本得到对话
            dia = split_text(text)
            
            print("\n分割后的对话:", dia)

            try:
                dia_dict = json.loads(dia)
                # for item in dia_dict["dialogue"]:
                #     full_dialogue += f'{item["role"]}: {item["content"]}\n'
                # print(full_dialogue)
                if not dia_dict or "dialogue" not in dia_dict:
                    print("⚠️ 无 dialogue 字段，跳过")
                    await asyncio.sleep(10)
                    continue
                dialogue_json = dia_dict["dialogue"]
            except Exception as e:
                print("解析对话JSON失败:", e)
                await asyncio.sleep(1)
                continue

            dialogue_items = []
            now_str = datetime.now().strftime("%H:%M")

            for item in dialogue_json:
                dialogue_items.append({
                    "id": str(uuid4()),
                    "role": item["role"],
                    "text": item["content"],
                    "time": now_str  # 或者使用更精确的时间
                })
            save_history_to_json(dialogue_items, record_type="dialogue")
             # 构建响应数据
            response_data = {
                "dialogue": dialogue_items,
            }
            # 广播给所有连接的客户端
            for ws in connected_clients.copy():
                try:
                    await ws.send_json(response_data)  # 给本地客户端发送JSON对象
                    print("\n✅ 已推送到本地前端")
                except Exception as e:
                    print(f"推送到本地失败: {e}")
                    connected_clients.remove(ws)
            
            # 进行反移情检测
            detection_result_str = detect(dialogue_json)
            print("\n检测到结果:", json.loads(detection_result_str))
            try:
                detection_result = json.loads(detection_result_str)['analysis']
                
                # 为每个新检测项添加唯一ID
                for item in detection_result:
                    if 'id' not in item:
                        item['id'] = str(uuid4())  # 添加唯一ID
                    
                # 添加时间戳    
                current_time = datetime.now().strftime("%H:%M")
                for item in detection_result:
                    if 'time' not in item:
                        item['time'] = current_time

                # 检查重复，避免添加相同的检测结果
                existing_quotes = set(item['quote'] for item in full_detection if 'quote' in item)
                new_items = [item for item in detection_result if 'quote' in item and item['quote'] not in existing_quotes]
                
                # 将新的检测结果添加到全局变量
                full_detection.extend(new_items)
                save_history_to_json(detection_result, record_type="detection")
            
            except Exception as e:
                print("检测结果解析失败:", e)
                detection_result = []
            
            # 添加情绪分析
            emotion_data = analyze_emotions(dialogue_json)
            print("\n情绪分析结果:", emotion_data)
            
            culture_data = analyze_culture(dialogue_json)
            # 保存文化分析结果
            try:
                culture_data = json.loads(culture_data)
                save_history_to_json(culture_data, record_type="culture")
            except json.JSONDecodeError as e:
                print(f"文化分析 JSON 解析失败: {e}")
                culture_data = {}
            print("\n文化分析结果:", culture_data)
            
            # 构建响应数据
            response_data = {
                "dialogue": dialogue_items,
                "detection": full_detection,
                "emotions": emotion_data,
                "culture": culture_data
            }
            # 广播给所有连接的客户端
            for ws in connected_clients.copy():
                try:
                    await ws.send_json(response_data)  # 给本地客户端发送JSON对象
                    print("\n✅ 已推送到本地前端")
                except Exception as e:
                    print(f"推送到本地失败: {e}")
                    connected_clients.remove(ws)
            
            await asyncio.sleep(7)  # 每10秒检查一次
            
        except Exception as e:
            print(f"主循环错误: {e}")
            await asyncio.sleep(1)  # 出错时等待后重试


# 运行服务器和监测循环
async def run():
    await asyncio.gather(
        run_server(),
        main_loop()
    )

# 启动
import asyncio

if __name__ == "__main__":
    
    asyncio.run(run())
