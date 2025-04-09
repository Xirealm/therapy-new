import random
import azure.cognitiveservices.speech as speechsdk
import config
import time
import threading
import pyaudio
import queue


class AzureSpeechRecognizer:
    def __init__(self):
        # Configure speech service
        self.speech_config = speechsdk.SpeechConfig(
            subscription=config.AZURE_SPEECH_KEY, 
            region=config.AZURE_SERVICE_REGION
        )
        self.speech_config.speech_recognition_language = config.AZURE_SPEECH_RECOGNITION_LANGUAGE
        self.speech_config.speech_synthesis_voice_name = config.AZURE_SPEECH_SYNTHESIS_VOICE_NAME
        
        # Create a speech recognizer
        self.speech_recognizer = speechsdk.SpeechRecognizer(speech_config=self.speech_config)
        
        # Recognition state
        self.done = False
        self.reco_cancelled = False
        self.recognized_speech = ""
        self.last_result = None
        self.last_update_time = 0
        self.final_results = []
        self.intermediate_content = ""
        self.timer = None

        # Initialize TTS attributes
        self.speech_synthesizer = None
        self.tts_request = None
        self.tts_task = None

    
    def start(self):
        """Start continuous speech recognition"""
        # Connect callbacks to the events fired by the speech recognizer
        self.speech_recognizer.recognizing.connect(self._recognizing_cb)
        self.speech_recognizer.recognized.connect(self._recognized_cb)
        self.speech_recognizer.session_started.connect(
            lambda evt: print('SESSION STARTED: {}'.format(evt))
        )
        self.speech_recognizer.session_stopped.connect(
            lambda evt: print('SESSION STOPPED {}'.format(evt))
        )
        self.speech_recognizer.canceled.connect(
            lambda evt: print('CANCELED {}'.format(evt))
        )
        
        # Stop continuous recognition on either session stopped or canceled events
        self.speech_recognizer.session_stopped.connect(self._stop_cb)
        self.speech_recognizer.canceled.connect(self._stop_cb)
        
        # Start continuous speech recognition
        print("Speak into your microphone. Say 'Stop' or press Ctrl+C to end the session.")
        self.speech_recognizer.start_continuous_recognition()
        
        # Start the timer to check for updates
        self._check_speech_updates()
        
        try:
            while not self.done:
                time.sleep(0.5)
        except KeyboardInterrupt:
            print("\nStopping recognition...")
            self.reco_cancelled = True
        finally:
            self.stop()
    
    def stop(self):
        """Stop speech recognition and clean up resources"""
        if self.timer:
            self.timer.cancel()
        self.speech_recognizer.stop_continuous_recognition()
        #self.stop_speaking()
    
    def _stop_cb(self, evt):
        """Callback to stop continuous recognition upon receiving an event"""
        print('CLOSING on {}'.format(evt))
        self.done = True
    
    def _recognizing_cb(self, evt):
        """Callback for intermediate recognition results"""
        result = evt.result.text
        if result != "":
            print(f"Intermediate result received: {result}")
            self.intermediate_content = result
            self.recognized_speech = " ".join([" ".join(self.final_results), self.intermediate_content]).strip()
            self.on_intermediate_result(self.recognized_speech)
            self.last_result = result
            self.last_update_time = time.time() * 1000  # Convert to milliseconds
    
    # def _recognized_cb(self, evt):
    #     """Callback for final recognition results"""
    #     result = evt.result.text
    #     if result != "":
    #         print(f"Final result received: {result}")
    #         self.final_results.append(result)
    #         self.recognized_speech = " ".join(self.final_results).strip()
    #         self.on_intermediate_result(self.recognized_speech)
    #         self.last_result = result
    #         self.last_update_time = time.time() * 1000  # Convert to milliseconds
    
    def _recognized_cb(self, evt):
        """Callback for final recognition results"""
        result = evt.result.text
        if result != "":
            print(f"Final result received: {result}")
            self.final_results.append(result)
            self.recognized_speech = " ".join(self.final_results).strip()

            self.on_intermediate_result(self.recognized_speech)

            self.on_final_result(result)

            self.last_result = result
            self.last_update_time = time.time() * 1000  # Convert to milliseconds

    
    def on_intermediate_result(self, text):
        """Handle intermediate recognition results"""
        print(f"Intermediate recognition: {text}")
        # Override this method in subclasses to handle intermediate results
    
    def on_final_result(self, text):
        """Handle final recognition results"""
        print(f"Final recognition result: {text}")
        # Override this method in subclasses to handle final results
        
    def on_recognition_cancelled(self):
        """Handle recognition cancellation"""
        print("Recognition cancelled")
        # Override this method in subclasses to handle cancellation
    
    def _check_speech_updates(self):
        """Periodically check if there are updates to speech recognition"""
        if self.reco_cancelled:
            self.on_recognition_cancelled()
            self.reco_cancelled = False
            
        # Check if no new results for 3000ms
        current_time = time.time() * 3000  # Convert to milliseconds
        if (self.last_result is not None and self.last_result != "" and 
            (current_time - self.last_update_time > 1000)):
            self.last_result = ""
            print(f"Final result: {self.recognized_speech}")
            # self.on_final_result(self.recognized_speech)
        
        # Schedule next check if recognition is still ongoing
        if not self.done:
            self.timer = threading.Timer(0.1, self._check_speech_updates)
            self.timer.daemon = True
            self.timer.start()

    def clear_pending_content(self):
        """Clear the pending content"""
        print("Clearing the pending content")
        self.final_results.clear()  # Clear the list of final results
        self.last_result = None

    # TTS methods

    def initialize_tts(self):


        speech_config1 = speechsdk.SpeechConfig(endpoint=f"wss://eastasia.tts.speech.microsoft.com/cognitiveservices/websocket/v2",
                                       subscription="FhEkDUfgYalVFzTWxYeZ9K5wFeuesbu8YB1rCUy2zhE9danak3OvJQQJ99BCAC3pKaRXJ3w3AAAYACOGOWC9")

        speech_config1.speech_synthesis_voice_name = config.AZURE_SPEECH_SYNTHESIS_VOICE_NAME
        self.speech_synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config1)
        self.speech_synthesizer.synthesizing.connect(lambda evt: print("[audio]", end=""))

        # Pre-connect to the speech service (this is the key part!)
        self.tts_connection = speechsdk.Connection.from_speech_synthesizer(self.speech_synthesizer)
        print("Pre-connecting to speech service...")
        self.tts_connection.open(True)
        print("TTS Connection established")


        # set timeout value to bigger ones to avoid sdk cancel the request when GPT latency too high
        properties = dict()
        properties["SpeechSynthesis_FrameTimeoutInterval"]="100000000"
        properties["SpeechSynthesis_RtfTimeoutThreshold"]="10"
        self.speech_config.set_properties_by_name(properties)

        # create request with TextStream input type
        self.tts_request = speechsdk.SpeechSynthesisRequest(input_type=speechsdk.SpeechSynthesisRequestInputType.TextStream)
        self.tts_task = self.speech_synthesizer.speak_async(self.tts_request)

    def speak_text(self, text):
        """Speak the given text using Azure TTS"""
        if not self.speech_synthesizer:
            self.initialize_tts()
        
        # Speak the text
        print(f"Speaking: {text}")
        self.tts_request.input_stream.write(text)
    
    def finish_speaking(self):
        """Close the TTS stream and wait for audio to finish"""
        if hasattr(self, 'tts_request') and self.tts_request:
            print("\nClosing TTS stream...")
            self.tts_request.input_stream.close()

            if hasattr(self, 'tts_task') and self.tts_task:
                # Wait for all audio to be processed
                result = self.tts_task.get()
                print("[TTS END]")
    
    
# if __name__ == "__main__":
#     recognizer = AzureSpeechRecognizer()

#     def simulate_chat_completion():
#         chinese_text = "你好！欢迎使用微软的语音服务。人工智能正在改变我们的生活方式。今天的天气真好，我们可以出去散步。"
        
#         # Split the Chinese text by characters (since Chinese doesn't use spaces)
#         # We'll group characters to simulate more natural chunks
#         chunks = []
#         current_chunk = ""
        
#         for char in chinese_text:
#             current_chunk += char
#             # Create chunks of random sizes between 1-4 characters
#             if len(current_chunk) >= random.randint(1, 4) or char in "，。！？":
#                 chunks.append(current_chunk)
#                 current_chunk = ""
        
#         if current_chunk:  # Add any remaining text
#             chunks.append(current_chunk)
        
#         for chunk in chunks:
#             # Simulate varying delays between chunks
#             time.sleep(random.uniform(0.1, 0.2))
#             yield chunk

#     # Example: Streaming text in chunks (like from a chat)
#     for chunk in simulate_chat_completion():
#         print(chunk, end="", flush=True)
#         recognizer.speak_text(chunk)

#     # Finish speaking and wait for audio to complete
#     recognizer.finish_speaking()

    
#     print("[TTS END]", end="")
#     # Clean up
#     recognizer.stop()