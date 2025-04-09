import React, { useState, useEffect } from 'react';
import { Clock, User, FileText, Activity, Bell, Settings, MessageCircle, Calendar, PieChart, RefreshCw, Award, Info, Heart, Menu, ChevronRight } from 'lucide-react';

import RealtimeAssistant from './components/RealtimeAssistant';
import ChatHistory from './components/ChatHistory';

// 会话计时器组件
const SessionTimer = () => {
  const [seconds, setSeconds] = useState(0);
  
  useEffect(() => {
    const startTime = new Date();
    
    const timer = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now - startTime) / 1000);
      setSeconds(diff);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return formatTime(seconds);
};

const TherapyApp = () => {
  const [activeTab, setActiveTab] = useState('realtime');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'warning', message: '检测到消极反移情倾向', time: '刚刚' },
    { id: 2, type: 'info', message: '来访者情绪变化明显', time: '2分钟前' }
  ]);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const renderContent = () => {
    switch(activeTab) {
      case 'realtime':
        return <RealtimeAssistant />;
      case 'tracking':
        return <CaseTracking />;
      case 'selfcare':
        return <SelfCare />;
      case 'history':
        return <ChatHistory />;
      default:
        return <RealtimeAssistant />;
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 overflow-hidden">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg ${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b">
          <h1 className={`font-bold text-blue-600 ${sidebarOpen ? 'block' : 'hidden'}`}>心理咨询助手</h1>
          <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-gray-200">
            <Menu size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className={`mb-6 flex items-center ${sidebarOpen ? '' : 'justify-center'}`}>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                <User size={20} />
              </div>
              {sidebarOpen && (
                <div className="ml-3">
                  <p className="font-medium">咨询师1</p>
                  <p className="text-xs text-gray-500">资深心理咨询师</p>
                </div>
              )}
            </div>
            
            <nav>
              <button 
                onClick={() => setActiveTab('realtime')} 
                className={`w-full mb-2 p-3 flex items-center rounded-lg ${activeTab === 'realtime' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                <Activity size={20} />
                {sidebarOpen && <span className="ml-3">实时助手</span>}
              </button>
              
              <button 
                onClick={() => setActiveTab('tracking')} 
                className={`w-full mb-2 p-3 flex items-center rounded-lg ${activeTab === 'tracking' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                <FileText size={20} />
                {sidebarOpen && <span className="ml-3">个案追踪</span>}
              </button>
              
              <button 
                onClick={() => setActiveTab('selfcare')} 
                className={`w-full mb-2 p-3 flex items-center rounded-lg ${activeTab === 'selfcare' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                <Heart size={20} />
                {sidebarOpen && <span className="ml-3">自我关怀</span>}
              </button>
            </nav>
          </div>
        </div>
        
        <div className="p-4 border-t">
          <button className={`w-full p-3 flex items-center rounded-lg hover:bg-gray-100`}>
            <Settings size={20} />
            {sidebarOpen && <span className="ml-3">设置</span>}
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <h2 className="font-semibold text-xl">{
              activeTab === 'realtime' ? '实时助手' :
              activeTab === 'tracking' ? '个案追踪' :
              activeTab === 'history' ? '历史记录' :
              '自我关怀'
            }</h2>
            {/* <div className="ml-4 flex items-center text-sm text-gray-500">
              <Clock size={16} className="mr-1" />
              <span>当前会话: 45:12</span>
            </div> */}
            <div className="ml-4 flex items-center text-sm text-gray-500">
              <Clock size={16} className="mr-1" />
              <span>当前会话: <SessionTimer /></span>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="relative mr-4">
              <Bell size={20} className="cursor-pointer" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                {notifications.length}
              </span>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              开始新会话
            </button>
          </div>
        </header>
        
        {/* Main content area */}
        <div className="flex-1 overflow-hidden flex">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// const RealtimeAssistant = () => {
//   const [emotionDetected, setEmotionDetected] = useState({
//     therapist: { primary: '平静', secondary: '好奇', intensity: 60 },
//     client: { primary: '焦虑', secondary: '压力', intensity: 75 }
//   });
  
//   const [transferenceAlerts, setTransferenceAlerts] = useState([
//     { id: 1, type: 'caution', message: '可能的消极反移情: 与来访者相似的经历引发的过度认同', time: '3分钟前', details: '系统检测到您在谈论来访者家庭问题时语速加快，声调提高' },
//     { id: 2, type: 'info', message: '来访者可能展现移情: 寻求认可', time: '6分钟前', details: '来访者频繁询问"您觉得我这样做对吗？"' }
//   ]);
  
//   const [transcript, setTranscript] = useState([
//     { id: 1, speaker: 'client', text: '主要是工作和家庭的事情吧。我在一家互联网公司做产品经理，经常加班，最近公司又在裁员，我感觉自己也在那个名单上。回到家里，我妈妈又生病住院了，我爸年纪大了照顾不了，我还要照顾五岁的孩子...感觉自己快要被压垮了。我丈夫也帮不上什么忙，他在外地工作，一个月才回来一次。我常常觉得自己像是被困在一个无法逃脱的圈子里。', time: '14:23' },
//     { id: 2, speaker: 'therapist', text: '你的丈夫不在身边，确实会让你感到更加孤立无援。说起来，我之前也遇到过类似的情况，我妈生病的时候我几乎扛起了所有的责任，那段时间真的很痛苦。', time: '14:24' },
//     { id: 3, speaker: 'client', text: '您也经历过这种事情啊？那您是怎么度过那段时间的呢？', time: '14:25' },
//     { id: 4, speaker: 'therapist', text: '说实话，那段时间对我打击很大。家里人都指望着我，但我又要兼顾工作。我觉得你现在的处境和我当时很像，都是被家庭和工作同时压得喘不过气来。不过我后来意识到，有些责任其实可以寻求外界帮助的，比如我们可以请护工照顾老人。', time: '14:26', alert: true }
//   ]);
  
//   return (
//     <div className="flex-1 flex overflow-hidden">
//       {/* Transcript and Analysis */}
//       <div className="w-2/3 flex flex-col border-r">
//         {/* Conversation transcript */}
//         <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
//           <div className="mb-4">
//             <h3 className="font-medium text-gray-700 mb-2 flex items-center">
//               <MessageCircle size={16} className="mr-2" />
//               会话实录
//             </h3>
//             <div className="space-y-4">
//               {transcript.map(message => (
//                 <div key={message.id} className={`flex ${message.speaker === 'therapist' ? 'justify-end' : 'justify-start'}`}>
//                   <div className={`max-w-md p-3 rounded-lg ${
//                     message.speaker === 'therapist' 
//                       ? 'bg-blue-100 text-blue-800' 
//                       : 'bg-white border text-gray-800'
//                   } ${message.alert ? 'border-yellow-400 border-2' : ''}`}>
//                     <div className="flex justify-between items-center mb-1">
//                       <span className="font-medium text-xs">
//                         {message.speaker === 'therapist' ? '咨询师' : '来访者'}
//                       </span>
//                       <span className="text-xs text-gray-500">{message.time}</span>
//                     </div>
//                     <p>{message.text}</p>
//                     {message.alert && (
//                       <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200">
//                         <strong>提示:</strong> 检测到可能的反移情反应。您可能正在将自身的故事和情感投射到来访者身上。
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
        
//         {/* Suggestions and guidance */}
//         <div className="h-48 border-t p-4 bg-white">
//           <h3 className="font-medium text-gray-700 mb-2 flex items-center">
//             <Info size={16} className="mr-2" />
//             建议与指导
//           </h3>
//           <div className="bg-blue-50 p-3 rounded-lg text-sm">
//             <p className="font-medium mb-2">可能的回应方式:</p>
//             <ul className="space-y-2">
//               <li className="p-2 bg-white rounded border border-blue-100 hover:border-blue-300 cursor-pointer">
//                 "我理解你正面临工作和家庭的双重压力。能否具体谈谈这些压力如何影响你的日常生活和情绪？"
//               </li>
//               <li className="p-2 bg-white rounded border border-blue-100 hover:border-blue-300 cursor-pointer">
//                 "你提到照顾生病的母亲和年幼的孩子，同时还要应对工作压力。你曾经寻求过支持吗？"
//               </li>
//             </ul>
//           </div>
//         </div>
//       </div>

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
//                   className={`p-3 rounded-lg border text-sm ${
//                     alert.type === 'caution' 
//                       ? 'bg-yellow-50 border-yellow-300' 
//                       : 'bg-blue-50 border-blue-300'
//                   }`}
//                 >
//                   <div className="flex justify-between items-start">
//                     <span className="font-medium">{alert.message}</span>
//                     <span className="text-xs text-gray-500">{alert.time}</span>
//                   </div>
//                   <p className="mt-1 text-xs">{alert.details}</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
        
        // {/* Cultural Sensitivity Panel */}
//         <div className="h-48 border-t p-4">
//           <h3 className="font-medium text-gray-700 mb-2 flex items-center">
//             <RefreshCw size={16} className="mr-2" />
//             文化敏感性提示
//           </h3>
//           <div className="p-3 bg-purple-50 rounded-lg text-sm border border-purple-100">
//             <p className="mb-2">
//               <span className="font-medium">提示:</span> 来访者提到的家庭关系模式可能受到文化背景影响。
//             </p>
//             <p>您在回应中过多分享了自己的个人经历，并将焦点从来访者转移到了自己的故事上。在许多文化背景下，尤其是中国文化中，虽然适度的自我披露可以建立关系，但这种程度的分享可能不专业，并且减少了对来访者困境的关注。</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

const CaseTracking = () => {
  const [selectedClientId, setSelectedClientId] = useState(1);
  const [clients] = useState([
    { id: 1, name: '张先生', age: 34, sessions: 5, lastSession: '2025-03-20', issues: ['工作压力', '人际关系'] },
    { id: 2, name: '李女士', age: 28, sessions: 3, lastSession: '2025-03-18', issues: ['焦虑障碍', '家庭冲突'] },
    { id: 3, name: '王先生', age: 42, sessions: 8, lastSession: '2025-03-15', issues: ['抑郁症状', '婚姻问题'] }
  ]);
  
  const selectedClient = clients.find(c => c.id === selectedClientId);
  
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Client List */}
      <div className="w-1/4 border-r bg-white">
        <div className="p-4 border-b">
          <h3 className="font-medium text-gray-700 mb-3">来访者列表</h3>
          <div className="relative">
            <input 
              type="text" 
              placeholder="搜索来访者..." 
              className="w-full px-3 py-2 border rounded-lg pl-8"
            />
            <SearchIcon className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
          </div>
        </div>
        
        <div className="overflow-y-auto h-full">
          {clients.map(client => (
            <div 
              key={client.id}
              onClick={() => setSelectedClientId(client.id)}
              className={`p-4 border-b cursor-pointer ${
                client.id === selectedClientId ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
              }`}
            >
              <h4 className="font-medium">{client.name}</h4>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <span className="mr-3">年龄: {client.age}</span>
                <span>已进行: {client.sessions} 次咨询</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {client.issues.map((issue, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Case Details */}
      <div className="w-3/4 flex flex-col overflow-hidden">
        {/* Client Info */}
        <div className="p-4 bg-white border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">{selectedClient.name}</h2>
              <div className="mt-1 text-sm text-gray-500">
                <span className="mr-4">年龄: {selectedClient.age}</span>
                <span className="mr-4">已进行: {selectedClient.sessions} 次咨询</span>
                <span>上次咨询: {selectedClient.lastSession}</span>
              </div>
            </div>
            <div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                添加新记录
              </button>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-white border-b">
          <div className="flex px-4">
            <button className="px-4 py-3 border-b-2 border-blue-500 font-medium text-blue-600">
              反移情追踪
            </button>
            <button className="px-4 py-3 text-gray-500 hover:text-gray-700">
              会话记录
            </button>
            <button className="px-4 py-3 text-gray-500 hover:text-gray-700">
              治疗进展
            </button>
            <button className="px-4 py-3 text-gray-500 hover:text-gray-700">
              干预策略
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                <Activity size={16} className="mr-2" />
                反移情模式分析
              </h3>
              <div className="h-40 bg-gray-100 rounded flex items-center justify-center">
                [反移情模式图表]
              </div>
              <div className="mt-3 text-sm">
                <p className="font-medium">主要模式:</p>
                <ul className="mt-1 list-disc list-inside text-gray-600">
                  <li>过度认同 (43%)</li>
                  <li>救助者模式 (28%)</li>
                  <li>回避冲突 (15%)</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                <RefreshCw size={16} className="mr-2" />
                治疗关系动态
              </h3>
              <div className="h-40 bg-gray-100 rounded flex items-center justify-center">
                [治疗关系动态图表]
              </div>
              <div className="mt-3 text-sm">
                <p>治疗联盟评分: <span className="font-medium">7.2/10</span></p>
                <p className="mt-1 text-gray-600">
                  近期三次会话中，治疗联盟评分稳定上升，反移情模式的认知识别率提高了18%。
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <Calendar size={16} className="mr-2" />
              历史会话反移情记录
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">会话主题</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">反移情类型</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">管理策略</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">影响分析</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">2025-03-20</td>
                    <td className="px-4 py-3 text-sm">职场冲突</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">过度认同</span>
                    </td>
                    <td className="px-4 py-3 text-sm">认知重构, 督导讨论</td>
                    <td className="px-4 py-3 text-sm">干预后情绪稳定，边界感提升</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">2025-03-13</td>
                    <td className="px-4 py-3 text-sm">亲子关系</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">救助者模式</span>
                    </td>
                    <td className="px-4 py-3 text-sm">角色意识提升，自我反思</td>
                    <td className="px-4 py-3 text-sm">减少了解决问题的冲动，增加了倾听空间</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <Info size={16} className="mr-2" />
              专业边界管理建议
            </h3>
            <div className="p-3 bg-blue-50 rounded-lg text-sm border border-blue-100">
              <p className="mb-3">
                <span className="font-medium">系统分析:</span> 在讨论来访者职场冲突时，您表现出较高程度的情绪投入，这可能源于您自身的相似经历。
              </p>
              <p className="font-medium mb-2">建议:</p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <ChevronRight size={16} className="mr-1 mt-0.5 text-blue-500" />
                  通过定期督导讨论这一反移情模式
                </li>
                <li className="flex items-start">
                  <ChevronRight size={16} className="mr-1 mt-0.5 text-blue-500" />
                  在下次会话前进行5分钟的正念练习，增强情绪觉察
                </li>
                <li className="flex items-start">
                  <ChevronRight size={16} className="mr-1 mt-0.5 text-blue-500" />
                  记录对这类话题的身体反应，以提高自我意识
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SelfCare = () => {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center">
            <Activity size={16} className="mr-2" />
            压力水平追踪
          </h3>
          <div className="h-40 bg-gray-100 rounded flex items-center justify-center">
            [压力水平图表]
          </div>
          <div className="mt-3 text-sm">
            <p>本周压力水平: <span className="font-medium text-orange-500">中度 (6.4/10)</span></p>
            <p className="mt-1 text-gray-600">比上周上升了12%，建议增加自我关怀活动</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center">
            <PieChart size={16} className="mr-2" />
            工作负荷分析
          </h3>
          <div className="h-40 bg-gray-100 rounded flex items-center justify-center">
            [工作负荷分析图表]
          </div>
          <div className="mt-3 text-sm">
            <p>当前案例数: <span className="font-medium">18</span> (建议上限: 20)</p>
            <p className="mt-1 text-gray-600">高强度案例占比: 38% (较上月增加5%)</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center">
            <Heart size={16} className="mr-2" />
            自我关怀实践
          </h3>
          <div className="h-40 bg-gray-100 rounded flex items-center justify-center">
            [自我关怀实践图表]
          </div>
          <div className="mt-3 text-sm">
            <p>完成度: <span className="font-medium text-green-500">65%</span></p>
            <p className="mt-1 text-gray-600">建议增加: 正念练习, 督导会谈</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <h3 className="font-medium text-gray-700 mb-3 flex items-center">
          <RefreshCw size={16} className="mr-2" />
          情绪健康仪表板
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">职业倦怠风险</h4>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">低风险</span>
              <span className="text-sm text-gray-500">高风险</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-green-500 rounded-full w-1/4"></div>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">共情疲劳水平</h4>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">低</span>
              <span className="text-sm text-gray-500">高</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-yellow-500 rounded-full w-2/4"></div>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">工作满意度</h4>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">低</span>
              <span className="text-sm text-gray-500">高</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-blue-500 rounded-full w-3/4"></div>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">生活平衡感</h4>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">低</span>
              <span className="text-sm text-gray-500">高</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-blue-500 rounded-full w-2/4"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center">
            <Award size={16} className="mr-2" />
            专业发展资源
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="font-medium text-blue-800">反移情管理进阶课程</h4>
              <p className="mt-1 text-sm text-gray-600">由专家讲师带领的6周在线课程，专注于识别和利用反移情</p>
              <div className="mt-2">
                <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                  了解详情
                </button>
              </div>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
              <h4 className="font-medium text-purple-800">督导小组</h4>
              <p className="mt-1 text-sm text-gray-600">每月两次的小组督导会议，与同行分享案例并获得专业反馈</p>
              <div className="mt-2">
                <button className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700">
                  报名参加
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-medium text-gray-700 mb-3 flex items-center">
            <Heart size={16} className="mr-2" />
            自我关怀建议
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800">今日建议</h4>
              <p className="mt-1 text-sm text-gray-600">
                基于您的压力水平和当前工作量，建议：
              </p>
              <ul className="mt-2 space-y-2 text-sm">
                <li className="flex items-start">
                  <ChevronRight size={16} className="mr-1 mt-0.5 text-green-500" />
                  咨询间隙安排15分钟的静心冥想
                </li>
                <li className="flex items-start">
                  <ChevronRight size={16} className="mr-1 mt-0.5 text-green-500" />
                  记录反移情反应日志，识别模式
                </li>
                <li className="flex items-start">
                  <ChevronRight size={16} className="mr-1 mt-0.5 text-green-500" />
                  与督导分享本周的挑战性案例
                </li>
              </ul>
            </div>
            
            <div className="p-3 rounded-lg border border-gray-200">
              <h4 className="font-medium">日程提醒</h4>
              <p className="mt-1 text-sm text-gray-600">
                下一次督导会议: <span className="font-medium">2025年3月25日 15:00</span>
              </p>
              <p className="mt-1 text-sm text-gray-600">
                计划的休息日: <span className="font-medium">2025年3月30日 - 4月2日</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Utility icon component
const SearchIcon = ({ className, size }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

export default TherapyApp;