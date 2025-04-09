import requests
import json
import time
import threading
import logging
from volcenginesdkarkruntime import Ark
import config

class DoubaoManager:
    def __init__(self):
        self.client = Ark(api_key=config.DOUBAO_SUBSCRIPTION_KEY)
        self.current_call = None  # Track the current ongoing request
        self.parallel_call = None  # Track parallel request for conversation history
        
        # Set up logging
        self.log_timestamp_tag = "VoiceCallTimeStamp"
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger("DoubaoManager")
        
        # Track statistics
        self.total_chars_sent_request = 0
        self.total_chars_received_request = 0
        self.total_chars_sent_parallel = 0
        self.total_chars_received_parallel = 0
        
        # Configuration
        self.model_id = config.DOUBAO_MODEL_ID
    
    def send_to_doubao(self, prompt, last_update_time, on_result):
        """Send message to Doubao API and get the response"""
        if self.current_call:
            self.cancel_request()
            
        # Create thread to handle request
        thread = threading.Thread(
            target=self._handle_request,
            args=(prompt, last_update_time, on_result)
        )
        thread.daemon = True
        thread.start()
    
    def _handle_request(self, message, last_update_time, on_result):
        """Thread function to handle the API request"""
        message_sent_time = int(time.time() * 1000)  # Timestamp 1
        self.logger.info(
            f"1. messageSentTime: {message_sent_time}, delay: {message_sent_time - last_update_time}ms"
        )
        
        # Send the request and get response
        response = self._send_request(message, last_update_time)
        
        if response:
            full_response_received_time = int(time.time() * 1000)  # Timestamp 3
            self.logger.info(
                f"3. fullResponseReceivedTime: {full_response_received_time}, delay: {full_response_received_time - last_update_time}ms"
            )
            on_result(response, last_update_time)
    
    def _send_request(self, message, last_update_time):
        """Send request to Doubao API and process the response"""
        try:
            # Prepare conversation context
            from conversation_recorder import ConversationRecorder
            prompt = f"{ConversationRecorder.get_readable_conversation()}\n我说: {message}"
            self.logger.info(f"Conversation: {prompt}")
            
            # Create system message
            messages = [
                {"role": "system", "content": config.INSTRUCTIONS},
                {"role": "user", "content": prompt}
            ]
            
            # Track character counts
            self.total_chars_sent_request += len(prompt) + len(config.INSTRUCTIONS)
            self.logger.info(f"sendRequest charsSent: {self.total_chars_sent_request}")
            
            # Create streaming request to Doubao API
            response_started_time = None
            full_text = ""
            
            stream = self.client.chat.completions.create(
                model=self.model_id,
                messages=messages,
                stream=True
            )
            
            # Process the stream response
            for chunk in stream:
                if not chunk.choices:
                    continue
                    
                # Record when we first get a response
                if response_started_time is None:
                    response_started_time = int(time.time() * 1000)
                    self.logger.info(
                        f"2. responseStartedTime: {response_started_time}, delay: {response_started_time - last_update_time}ms"
                    )
                
                # Extract the content from the chunk
                delta = chunk.choices[0].delta.content
                if delta:
                    full_text += delta
                
                # Check if we're done
                if hasattr(chunk.choices[0], 'finish_reason') and chunk.choices[0].finish_reason == "stop":
                    break
            
            # Track received character count
            self.total_chars_received_request += len(full_text)
            self.logger.info(f"sendRequest charsReceived: {self.total_chars_received_request}")
            
            return full_text
            
        except Exception as e:
            self.logger.error(f"Error in send_request: {str(e)}")
            return None
    
    def cancel_request(self):
        """Cancel the ongoing request"""
        self.current_call = None  # In Python we don't have direct cancel but we can set to None
        self.logger.info("Request has been canceled.")
    
    def send_to_doubao_parallel(self, prompt, on_result):
        """Send a parallel request to update conversation history"""
        # Create thread to handle parallel request
        thread = threading.Thread(
            target=self._handle_parallel_request,
            args=(prompt, on_result)
        )
        thread.daemon = True
        thread.start()
    
    def _handle_parallel_request(self, message, on_result):
        """Thread function to handle parallel API request"""
        response = self._send_request_parallel(message)
        if response:
            on_result(response)
    
    def _send_request_parallel(self, message):
        """Send parallel request to Doubao API for conversation history"""
        try:
            # Prepare conversation context
            from conversation_recorder import ConversationRecorder
            prompt = f"{ConversationRecorder.get_readable_conversation()}\n我说: {message}"
        
            
            # Create system message for history conversation
            messages = [
                {"role": "system", "content": config.HISTORY_INSTRUCTIONS},
                {"role": "user", "content": prompt}
            ]
            
            # Track character counts
            self.total_chars_sent_parallel += len(prompt) + len(config.HISTORY_INSTRUCTIONS)
            self.logger.info(f"sendRequestParallel charsSent: {self.total_chars_sent_parallel}")
            
            # Create streaming request to Doubao API
            full_text = ""
            
            stream = self.client.chat.completions.create(
                model=self.model_id,
                messages=messages,
                stream=True
            )
            
            # Process the stream response
            for chunk in stream:
                if not chunk.choices:
                    continue
                    
                # Extract the content from the chunk
                delta = chunk.choices[0].delta.content
                if delta:
                    full_text += delta
                
                # Check if we're done
                if hasattr(chunk.choices[0], 'finish_reason') and chunk.choices[0].finish_reason == "stop":
                    break
            
            # Track received character count
            self.total_chars_received_parallel += len(full_text)
            self.logger.info(f"sendRequestParallel charsReceived: {self.total_chars_received_parallel}")
            
            return full_text
            
        except Exception as e:
            self.logger.error(f"Error in send_request_parallel: {str(e)}")
            return None