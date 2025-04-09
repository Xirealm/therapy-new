#!/bin/bash

# conda activate psy
echo "正在执行 python backend/app.py..."
python src/backend/app.py &

echo "正在执行 python main.py..."
python src/main.py &

echo "正在执行 npm start..."
npm start &

sleep 1

echo "发送 curl 请求..."
curl -X POST http://localhost:31415/start