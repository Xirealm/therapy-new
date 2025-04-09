import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MessageCircle } from 'lucide-react';

const ChatHistory = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/history")
      .then(res => setHistory(res.data))
      .catch(err => console.error("历史记录获取失败", err));
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 对话记录区域 */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="mb-4">
          <h3 className="font-medium text-gray-700 mb-2 flex items-center">
            <MessageCircle size={16} className="mr-2" />
            历史对话记录
          </h3>
          
          <div className="space-y-4">
            {history.map((session, sessionIndex) => (
              <div key={sessionIndex} className="mb-8">
                {/* 会话时间标记 */}
                <div className="text-center mb-4">
                  <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm">
                    {new Date(session.timestamp).toLocaleString()}
                  </span>
                </div>
                
                {/* 对话内容 */}
                {session.dialogue.map(message => (
                  <div key={message.id} 
                       className={`flex ${message.role === 'therapist' ? 'justify-end' : 'justify-start'} mb-4`}>
                    <div className={`max-w-md p-3 rounded-lg ${
                      message.role === 'therapist' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-white border text-gray-800'
                    }`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-xs">
                          {message.role === 'therapist' ? '咨询师' : '来访者'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p>{message.text}</p>
                    </div>
                  </div>
                ))}
                
                {/* 反移情检测结果 */}
                {/* {session.detection && (
                  <div className="flex justify-center my-4">
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg p-3 max-w-md">
                      <strong className="block mb-1">反移情检测结果：</strong>
                      <p>{typeof session.detection === 'string' 
                          ? session.detection 
                          : JSON.stringify(session.detection, null, 2)}</p>
                    </div>
                  </div>
                )} */}
                {Array.isArray(session.detection) && (
                  <div className="my-4 space-y-4">
                    {session.detection.length === 0 ? (
                      <div className="text-center text-sm text-gray-500">
                        <div className="inline-block px-4 py-2 bg-gray-100 border rounded-md">
                          暂无反移情反应记录
                        </div>
                      </div>
                    ) : (
                      session.detection.map((item, idx) => (
                        <div key={idx} className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-4 shadow rounded-md max-w-2xl mx-auto">
                          <div className="flex items-center mb-2">
                            <MessageCircle className="w-4 h-4 mr-2 text-yellow-600" />
                            <span className="font-semibold">反移情案例 {idx + 1}</span>
                          </div>
                          <div className="space-y-1 text-sm leading-relaxed">
                            <p><span className="font-medium">原文：</span>{item.quote}</p>
                            <p><span className="font-medium">反移情类型：</span>{item.cf_type}</p>
                            <p><span className="font-medium">潜在影响：</span>{item.influence}</p>
                            <p><span className="font-medium">建议：</span>{item.suggestion}</p>
                            <p><span className="font-medium">替代表达建议：</span>{item.example_response}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {/* 会话分隔线 */}
                {sessionIndex < history.length - 1 && (
                  <div className="my-8 border-b border-gray-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 底部工具栏 */}
      <div className="h-16 border-t bg-white p-4 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          共 {history.length} 条历史记录
        </div>
        <div className="space-x-2">
          <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
            导出记录
          </button>
          <button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
            清空历史
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHistory; 