class Message:
    def __init__(self, type, message):
        self.type = type
        self.message = message

class ConversationRecorder:
    _instance = None
    _conversation = []
    _history_summary = ""
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ConversationRecorder, cls).__new__(cls)
        return cls._instance
    
    @classmethod
    def add_user_message(cls, message):
        cls._conversation.append(Message("user", message))
        cls.check_conversation_size()
        
    @classmethod
    def add_agent_message(cls, message):
        cls._conversation.append(Message("agent", message))
        cls.check_conversation_size()
        
    @classmethod
    def add_system_message(cls, message):
        cls._conversation.append(Message("system", message))
        cls.check_conversation_size()
        
    @classmethod
    def check_conversation_size(cls):
        size = len(cls._conversation)
        if size > 0 and size % 5 == 0:
            prompt = cls.get_full_readable_conversation()
            
            # Import here to avoid circular imports
            from doubao_manager import DoubaoManager
            
            # Run a parallel Doubao request
            doubao_manager = DoubaoManager()
            def callback(response):
                cls._history_summary = response
                
            doubao_manager.send_to_doubao_parallel(prompt, callback)
    
    @classmethod
    def get_last_five_messages(cls):
        return cls._conversation[-5:] if len(cls._conversation) >= 5 else cls._conversation
        
    @classmethod
    def get_conversation(cls):
        return cls._conversation
        
    @classmethod
    def get_readable_conversation(cls):
        if not cls._conversation:
            return ""
            
        result = ""
        if cls._history_summary:
            result = f"历史总结是：\n{cls._history_summary}"
        
        result += "\n\n对话内容是(最后的五个):\n"
        
        last_five = cls.get_last_five_messages()
        messages = []
        for message in last_five:
            if message.type == "user":
                messages.append(f"来访者: {message.message}")
            elif message.type == "agent":
                messages.append(f"心理咨询专家: {message.message}")
            elif message.type == "system":
                messages.append(f"系统: {message.message}")
            else:
                messages.append(f"Unknown: {message.message}")
                
        result += "\n".join(messages)
        return result
        
    @classmethod
    def get_full_readable_conversation(cls):
        if not cls._conversation:
            return ""
            
        result = f"之前的历史总结是：\n{cls._history_summary}\n\n近五条历史消息：\n"
        
        messages = []
        for message in cls._conversation:
            if message.type == "user":
                messages.append(f"来访者: {message.message}")
            elif message.type == "agent":
                messages.append(f"心理咨询专家: {message.message}")
            elif message.type == "system":
                messages.append(f"系统: {message.message}")
            else:
                messages.append(f"Unknown: {message.message}")
                
        result += "\n".join(messages)
        return result
        
    @classmethod
    def clear_conversation(cls):
        cls._conversation.clear()
        cls._history_summary = ""