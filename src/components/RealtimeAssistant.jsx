import React, { useState, useEffect } from 'react';
import { MessageCircle, Info, RefreshCw } from 'react-feather';

const RealtimeAssistant = () => {
  const [transcript, setTranscript] = useState([]);
  const [detection, setDetection] = useState(null);
  const [wsError, setWsError] = useState(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [transferenceAlerts, setTransferenceAlerts] = useState([]);
  const [cultureData, setCultureData] = useState(null);  // 添加文化数据状态
  const MAX_RETRIES = 5;
  const RETRY_INTERVAL = 3000;
  const [emotionDetected, setEmotionDetected] = useState({
    therapist: { primary: '平静', secondary: '好奇', intensity: 60 },
    client: { primary: '焦虑', secondary: '压力', intensity: 75 }
  });


  // 添加这两个状态来控制高度
  const [suggestionsHeight, setSuggestionsHeight] = useState(25); // 百分比
  const [cultureHeight, setCultureHeight] = useState(8); // rem单位

  // 增加文化面板高度
  const increaseCultureHeight = () => {
    setCultureHeight(prev => Math.min(prev + 5, 30)); // 最大30rem
  };

  // 减少文化面板高度
  const decreaseCultureHeight = () => {
    setCultureHeight(prev => Math.max(prev - 5, 5)); // 最小5rem
  };

  // 在拖拽调整建议区域高度
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(25);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartHeight(suggestionsHeight);
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const delta = e.clientY - startY;
    const parentElement = document.querySelector('.flex-1.flex');

    // 添加安全检查
    if (parentElement) {
      const parentHeight = parentElement.clientHeight;
      const newHeight = startHeight + (delta / parentHeight * 100);

      // 限制高度在10%到50%之间
      setSuggestionsHeight(Math.max(10, Math.min(50, newHeight)));
    }
  };


  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 添加全局鼠标事件处理
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);


  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;

    const connect = () => {
      // ws = new WebSocket('wss://b940-2001-250-401-6602-293e-4d81-958e-1793.ngrok-free.app/ws/dialog');
      ws = new WebSocket('ws://localhost:8000/ws/dialog');
      ws.onopen = () => {
        console.log('WebSocket 连接已建立');
        setWsError(null);
        setReconnectCount(0); // 连接成功后重置重连计数
      };

      // ws.onmessage = (event) => {
      //   try {
      //     const data = JSON.parse(event.data);

      //     // 更新对话记录
      //     if (data.dialogue && data.dialogue.length > 0) {
      //       // 为对话添加alert标记
      //       const dialogueWithAlerts = data.dialogue.map(msg => ({
      //         ...msg,
      //         alert: data.detection?.some(d => msg.text.includes(d.quote)) // 检测到的反移情类型
      //       }));
      //       setTranscript(dialogueWithAlerts);
      //     }

      //     // 更新反移情检测结果
      //     if (data.detection) {
      //       // 更新移情/反移情提醒
      //       setTransferenceAlerts(data.detection.map((item, index) => ({
      //         id: item.id,
      //         type: 'caution',
      //         message: `${item.cf_type}`,
      //         details: item.influence,
      //         time: item.time
      //       })));
      //       setDetection(data.detection);
      //     }

      //     console.log('收到新数据:', data); // 调试输出
      //   } catch (e) {
      //     console.error("处理WebSocket消息失败", e);
      //     setWsError("消息处理出错");
      //   }
      // };

      // ws.onmessage = (event) => {
      //   try {
      //     const data = JSON.parse(event.data);

      //     // 更新对话记录 - 保留历史记录
      //     if (data.dialogue && data.dialogue.length > 0) {
      //       setTranscript(prevTranscript => {
      //         // 创建一个Map来存储已有消息，使用id作为键
      //         const existingMessages = new Map();
      //         prevTranscript.forEach(msg => {
      //           existingMessages.set(msg.id, msg);
      //         });

      //         // 为新对话添加alert标记
      //         const dialogueWithAlerts = data.dialogue.map(msg => ({
      //           ...msg,
      //           alert: Array.isArray(data.detection) && data.detection.some(d => msg.text.includes(d.quote))

      //         }));

      //         // 合并现有消息和新消息，保留已有消息的alert状态
      //         dialogueWithAlerts.forEach(newMsg => {
      //           if (existingMessages.has(newMsg.id)) {
      //             // 如果消息已存在，保留其alert状态（除非新消息也有alert）
      //             const existingMsg = existingMessages.get(newMsg.id);
      //             if (!newMsg.alert && existingMsg.alert) {
      //               newMsg.alert = existingMsg.alert;
      //             }
      //           }
      //           existingMessages.set(newMsg.id, newMsg);
      //         });

      //         // 将Map转换回数组，并按某种方式排序（如时间或ID）
      //         return Array.from(existingMessages.values())
      //           .sort((a, b) => {
      //             // 按时间排序，假设有时间戳（如果没有，可以使用ID）
      //             return a.id - b.id;
      //           });
      //       });
      //     }

      //     // 更新反移情检测结果 - 同样需要保留历史记录
      //     if (data.detection) {
      //       setTransferenceAlerts(prevAlerts => {
      //         // 创建现有警告的Map
      //         const existingAlerts = new Map();
      //         prevAlerts.forEach(alert => {
      //           existingAlerts.set(alert.id, alert);
      //         });

      //         // 处理新警告
      //         const newAlerts = data.detection.map((item) => ({
      //           id: item.id,
      //           type: 'caution',
      //           message: `${item.cf_type}`,
      //           details: item.influence,
      //           time: item.time
      //         }));

      //         // 合并现有警告和新警告
      //         newAlerts.forEach(alert => {
      //           existingAlerts.set(alert.id, alert);
      //         });

      //         // 将Map转换回数组并排序
      //         return Array.from(existingAlerts.values())
      //           .sort((a, b) => a.id - b.id);
      //       });

      //       // detection状态可以直接更新或合并
      //       setDetection(prevDetection => {
      //         if (!prevDetection) return data.detection;

      //         // 合并检测结果，保留唯一ID
      //         const existingDetections = new Map();
      //         prevDetection.forEach(item => {
      //           existingDetections.set(item.id, item);
      //         });

      //         data.detection.forEach(item => {
      //           existingDetections.set(item.id, item);
      //         });

      //         return Array.from(existingDetections.values())
      //           .sort((a, b) => a.id - b.id);
      //       });
      //     }

      //     console.log('收到新数据:', data); // 调试输出
      //   } catch (e) {
      //     console.error("处理WebSocket消息失败", e);
      //     setWsError("消息处理出错");
      //   }
      // };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // 更新对话记录 - 保留历史记录
          if (data.dialogue && data.dialogue.length > 0) {
            console.log('收到对话:', data.dialogue); // 调试输出
            setTranscript(prevTranscript => {
              // 创建一个Map来存储已有消息，使用id作为键
              const existingMessages = new Map();
              prevTranscript.forEach(msg => {
                existingMessages.set(msg.id, msg);
              });

              // 为新对话添加alert标记
              const dialogueWithAlerts = data.dialogue.map(msg => ({
                ...msg,
                alert: Array.isArray(data.detection) && data.detection.some(d => msg.text.includes(d.quote))
              }));

              // 合并现有消息和新消息，保留已有消息的alert状态
              dialogueWithAlerts.forEach(newMsg => {
                if (existingMessages.has(newMsg.id)) {
                  // 如果消息已存在，保留其alert状态（除非新消息也有alert）
                  const existingMsg = existingMessages.get(newMsg.id);
                  if (!newMsg.alert && existingMsg.alert) {
                    newMsg.alert = existingMsg.alert;
                  }
                }
                existingMessages.set(newMsg.id, newMsg);
              });

              // 将Map转换回数组，并按某种方式排序
              return Array.from(existingMessages.values());
            });
          }

          // 更新反移情检测结果 - 同样需要保留历史记录
          if (data.detection) {
            setTransferenceAlerts(prevAlerts => {
              // 创建现有警告的Map
              const existingAlerts = new Map();
              prevAlerts.forEach(alert => {
                existingAlerts.set(alert.id, alert);
              });

              // 处理新警告
              const newAlerts = data.detection.map((item) => ({
                id: item.id,
                type: 'caution',
                message: `${item.cf_type}`,
                details: item.influence,
                time: item.time
              }));

              // 合并现有警告和新警告
              newAlerts.forEach(alert => {
                existingAlerts.set(alert.id, alert);
              });

              // 将Map转换回数组并排序
              return Array.from(existingAlerts.values())
                .sort((a, b) => a.id - b.id);
            });

            // detection状态可以直接更新或合并
            setDetection(prevDetection => {
              if (!prevDetection) return data.detection;

              // 合并检测结果，保留唯一ID
              const existingDetections = new Map();
              prevDetection.forEach(item => {
                existingDetections.set(item.id, item);
              });

              data.detection.forEach(item => {
                existingDetections.set(item.id, item);
              });

              return Array.from(existingDetections.values())
                .sort((a, b) => a.id - b.id);
            });
          }

          // 添加处理情绪数据的代码
          if (data.emotions) {
            setEmotionDetected(data.emotions);
          }
          if (data.culture) {
            setCultureData(data.culture);
          }

          // console.log('收到新数据:', data); // 调试输出
        } catch (e) {
          console.error("处理WebSocket消息失败", e);
          setWsError("消息处理出错");
        }

      };

      ws.onerror = (error) => {
        console.error('WebSocket错误:', error);
        setWsError("连接出错");
      };

      ws.onclose = () => {
        console.log('WebSocket连接已关闭');
        setWsError("连接已关闭");

        // 实现重连逻辑
        if (reconnectCount < MAX_RETRIES) {
          setReconnectCount(prev => prev + 1);
          console.log(`尝试重连... (${reconnectCount + 1}/${MAX_RETRIES})`);
          reconnectTimer = setTimeout(connect, RETRY_INTERVAL);
        }
      };
    };

    connect(); // 初始连接

    // 组件卸载时清理
    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [reconnectCount]); // 添加reconnectCount作为依赖

  // 一个用于解析和展示文化数据的辅助函数
  const renderCultureContent = () => {
    if (!cultureData) {
      return (
        <>
          <p className="mb-2">
            <span className="font-medium">提示:</span> 暂无文化敏感性数据。
          </p>
          <p>系统正在分析对话内容，稍后将提供文化敏感性建议。</p>
        </>
      );
    }

    try {
      // 尝试解析文化数据
      if (cultureData.issue && cultureData.description && cultureData.suggestion) {
        return (
          <div className="space-y-2">
            <div>
              <span className="font-medium">问题:</span> {cultureData.issue}
            </div>
            <div>
              <span className="font-medium">描述:</span> {cultureData.description}
            </div>
            <div>
              <span className="font-medium">建议:</span> {cultureData.suggestion}
            </div>
          </div>
        );
      } else {
        // 如果格式不符合预期，直接显示
        return (
          <pre className="text-xs overflow-auto max-h-24">
            {JSON.stringify(cultureData, null, 2)}
          </pre>
        );
      }
    } catch (e) {
      console.error("解析文化数据失败:", e);
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            {typeof cultureData === 'string' ? cultureData : '无法解析的文化数据'}
          </p>
        </div>
      );
    }
  };

  // 修改右侧面板布局，让文化敏感性提示部分变高并可调整

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 左侧: 对话记录和建议 */}
      <div className="w-2/3 flex flex-col border-r">
        {wsError && (
          <div className="p-2 bg-red-100 text-red-600 text-sm">
            连接错误: {wsError}
          </div>
        )}
        {/* 对话记录部分 */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="space-y-4">
            {transcript.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === '咨询师' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-md p-3 rounded-lg ${msg.role === '咨询师'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-white border text-gray-800'
                  } ${msg.alert ? 'border-yellow-400 border-2' : ''}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-xs">
                      {msg.role === '咨询师' ? '咨询师' : '来访者'}
                    </span>
                    <span className="text-xs text-gray-500">{msg.time}</span>
                  </div>
                  <p>{msg.text}</p>
                  {msg.alert && (
                    <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200">
                      <strong>提示:</strong> 检测到可能的反移情反应。您可能正在将自身的故事和情感投射到来访者身上。
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 建议与指导部分 - 增加高度并使其可调节 */}
        <div className="border-t bg-white overflow-hidden flex flex-col" style={{ height: "25%" }}>
          {/* 添加一个可拖拽的手柄，用于调整高度 */}
          <div className="bg-gray-200 h-1 cursor-ns-resize hover:bg-blue-300 transition-colors"
            title="拖动调整高度"></div>

          <div className="p-4 overflow-y-auto flex-1">
            <h3 className="font-medium text-gray-700 mb-2 flex items-center">
              <Info size={16} className="mr-2" />
              建议与指导
            </h3>
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              {detection && detection.length > 0 ? (
                <div className="space-y-3">
                  <p className="font-medium mb-2">可能的回应方式:</p>
                  {detection.map((item) => (
                    <div key={item.id}>
                      <div className="p-2 mb-2 bg-white rounded border border-blue-100 hover:border-blue-300 cursor-pointer">
                        {item.suggestion}
                      </div>
                      <div className="p-2 bg-white rounded border border-blue-100 hover:border-blue-300 cursor-pointer">
                        {item.example_response}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>暂无建议</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 右侧: 分析面板 */}
      <div className="w-1/3 flex flex-col overflow-hidden bg-white">
        {/* 情绪和反移情分析部分 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 情绪追踪 */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-3">情绪追踪</h3>
            <div className="flex space-x-4">
              <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">咨询师情绪</h4>
                <div className="flex items-center mb-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-sm">主要: {emotionDetected.therapist.primary}</span>
                </div>
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-300 mr-2"></div>
                  <span className="text-sm">次要: {emotionDetected.therapist.secondary}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${emotionDetected.therapist.intensity}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">来访者情绪</h4>
                <div className="flex items-center mb-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                  <span className="text-sm">主要: {emotionDetected.client.primary}</span>
                </div>
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 rounded-full bg-orange-300 mr-2"></div>
                  <span className="text-sm">次要: {emotionDetected.client.secondary}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-orange-500 rounded-full"
                    style={{ width: `${emotionDetected.client.intensity}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* 反移情提醒 - 展示详细信息 */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-3">反移情提醒</h3>
            <div className="space-y-4">
              {transferenceAlerts.length > 0 ? (
                transferenceAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg border border-yellow-300 bg-yellow-50 text-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-yellow-800">
                        反移情类型：{detection.find(d => d.id === alert.id).cf_type}
                      </span>
                      <span className="text-xs text-gray-500">{alert.time}</span>
                    </div>

                    {/* 添加更多字段展示 */}
                    {detection && detection.find(d => d.id === alert.id) && (
                      <div className="space-y-2 mt-2">
                        <div className="bg-white p-2 rounded border border-yellow-200">
                          <p className="text-xs font-medium text-gray-600 mb-1">原文引用:</p>
                          <p className="text-xs italic">"{detection.find(d => d.id === alert.id).quote}"</p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">潜在影响:</p>
                          <p className="text-xs">{alert.details}</p>
                        </div>

                        <div className="bg-white p-2 rounded border border-yellow-200">
                          <p className="text-xs font-medium text-gray-600 mb-1">建议:</p>
                          <p className="text-xs">{detection.find(d => d.id === alert.id).suggestion}</p>
                        </div>

                        <div className="bg-blue-50 p-2 rounded border border-blue-200">
                          <p className="text-xs font-medium text-blue-600 mb-1">替代表达示例:</p>
                          <p className="text-xs">{detection.find(d => d.id === alert.id).example_response}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                  暂未检测到反移情反应
                </div>
              )}
            </div>
          </div>

          {/* 文化敏感性提示 - 增加高度并使其可调节 */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <RefreshCw size={16} className="mr-2" />
              文化敏感性提示
              <div className="ml-auto flex space-x-1">
                <button className="text-xs text-blue-500 hover:text-blue-700" title="减小高度">-</button>
                <button className="text-xs text-blue-500 hover:text-blue-700" title="增大高度">+</button>
              </div>
            </h3>
            <div className="p-4 bg-purple-50 rounded-lg text-sm border border-purple-100 overflow-y-auto"
              style={{ maxHeight: "15rem" }}>
              {renderCultureContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

//   return (
//     <div className="flex-1 flex overflow-hidden">
//       {/* Transcript and Analysis */}
//       <div className="w-2/3 flex flex-col border-r">
//         {wsError && (
//           <div className="p-2 bg-red-100 text-red-600 text-sm">
//             连接错误: {wsError}
//           </div>
//         )}
//         {/* 对话记录部分 */}
//         <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
//           <div className="space-y-4">
//             {transcript.map(msg => (
//               <div
//                 key={msg.id}
//                 className={`flex ${msg.role === '咨询师' ? 'justify-end' : 'justify-start'}`}
//               >
//                 <div className={`max-w-md p-3 rounded-lg ${msg.role === '咨询师'
//                   ? 'bg-blue-100 text-blue-800'
//                   : 'bg-white border text-gray-800'
//                   } ${msg.alert ? 'border-yellow-400 border-2' : ''}`}>
//                   <div className="flex justify-between items-center mb-1">
//                     <span className="font-medium text-xs">
//                       {msg.role === '咨询师' ? '咨询师' : '来访者'}
//                     </span>
//                     <span className="text-xs text-gray-500">{msg.time}</span>
//                   </div>
//                   <p>{msg.text}</p>
//                   {msg.alert && (
//                     <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200">
//                       <strong>提示:</strong> 检测到可能的反移情反应。您可能正在将自身的故事和情感投射到来访者身上。
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Suggestions and guidance */}
//         <div className="h-48 border-t p-4 bg-white overflow-y-auto">
//           <h3 className="font-medium text-gray-700 mb-2 flex items-center">
//             <Info size={16} className="mr-2" />
//             建议与指导
//           </h3>
//           <div className="bg-blue-50 p-3 rounded-lg text-sm">
//             {detection && detection.length > 0 ? (
//               <div className="space-y-3">
//                 <p className="font-medium mb-2">可能的回应方式:</p>
//                 {detection.map((item) => (
//                   <div key={item.id}>
//                     <div className="p-2 mb-2 bg-white rounded border border-blue-100 hover:border-blue-300 cursor-pointer">
//                       {item.suggestion}
//                     </div>
//                     <div className="p-2 bg-white rounded border border-blue-100 hover:border-blue-300 cursor-pointer">
//                       {item.example_response}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p>暂无建议</p>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Real-time Analysis Panel */}
//       <div className="w-1/3 flex flex-col overflow-hidden bg-white">
//         {/* Emotions and Transference */}
//         <div className="flex-1 overflow-y-auto p-4">
//           {/* Emotion tracking */}
//           <div className="mb-6">
//             <h3 className="font-medium text-gray-700 mb-3">情绪追踪</h3>
//             <div className="flex space-x-4">
//               <div className="flex-1 p-3 bg-gray-50 rounded-lg">
//                 <h4 className="text-sm font-medium mb-2">咨询师情绪</h4>
//                 <div className="flex items-center mb-1">
//                   <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
//                   <span className="text-sm">主要: {emotionDetected.therapist.primary}</span>
//                 </div>
//                 <div className="flex items-center mb-2">
//                   <div className="w-2 h-2 rounded-full bg-blue-300 mr-2"></div>
//                   <span className="text-sm">次要: {emotionDetected.therapist.secondary}</span>
//                 </div>
//                 <div className="h-2 bg-gray-200 rounded-full">
//                   <div
//                     className="h-2 bg-blue-500 rounded-full"
//                     style={{ width: `${emotionDetected.therapist.intensity}%` }}
//                   ></div>
//                 </div>
//               </div>

//               <div className="flex-1 p-3 bg-gray-50 rounded-lg">
//                 <h4 className="text-sm font-medium mb-2">来访者情绪</h4>
//                 <div className="flex items-center mb-1">
//                   <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
//                   <span className="text-sm">主要: {emotionDetected.client.primary}</span>
//                 </div>
//                 <div className="flex items-center mb-2">
//                   <div className="w-2 h-2 rounded-full bg-orange-300 mr-2"></div>
//                   <span className="text-sm">次要: {emotionDetected.client.secondary}</span>
//                 </div>
//                 <div className="h-2 bg-gray-200 rounded-full">
//                   <div
//                     className="h-2 bg-orange-500 rounded-full"
//                     style={{ width: `${emotionDetected.client.intensity}%` }}
//                   ></div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Transference/Countertransference Alerts */}
//           <div>
//             <h3 className="font-medium text-gray-700 mb-3">移情/反移情提醒</h3>
//             <div className="space-y-3">
//               {transferenceAlerts.map(alert => (
//                 <div
//                   key={alert.id}
//                   className={`p-3 rounded-lg border text-sm ${alert.type === 'caution'
//                     ? 'bg-yellow-50 border-yellow-300'
//                     : 'bg-blue-50 border-blue-300'
//                     }`}
//                 >
//                   <div className="flex justify-between items-start">
//                     <span className="font-medium">
//                       可能的消极反移情：
//                       {alert.message}
//                     </span>
//                     <span className="text-xs text-gray-500">{alert.time}</span>
//                   </div>
//                   <p className="mt-1 text-xs">{alert.details}</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Cultural Sensitivity Panel */}
//         <div className="h-48 border-t p-4">
//           <h3 className="font-medium text-gray-700 mb-2 flex items-center">
//             <RefreshCw size={16} className="mr-2" />
//             文化敏感性提示
//           </h3>
//           <div className="p-3 bg-purple-50 rounded-lg text-sm border border-purple-100 overflow-y-auto max-h-32">
//             {renderCultureContent()}
//           </div>
//         </div>
//     </div>
//     </div>
//   );
// };



export default RealtimeAssistant;
