from flask import Flask, request, jsonify
from flask_cors import CORS
from AzureSpeechService import AzureSpeechRecognizer
from doubao_manager import DoubaoManager
from conversation_recorder import ConversationRecorder
import threading
import queue
import time

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# Queue for storing speech recognition results
result_queue = queue.Queue()

# Global variables to control speech recognition
active_recognizer = None
recognition_thread = None
doubao_manager = DoubaoManager()
conversation_recorder = ConversationRecorder()

# Global variables for text-to-speech synthesis
synthesis_thread = None
tts_ready = False


# State flags
is_agent_responding = False
is_agent_voice_responding = False


class WebSpeechRecognizer(AzureSpeechRecognizer):
    """Custom speech recognizer that puts results in a queue for the web API and integrates with Doubao"""
    
    def on_intermediate_result(self, text):
        """Handle intermediate recognition results"""
        global is_agent_responding, is_agent_voice_responding
        
        result_queue.put({
            "type": "intermediate",
            "text": text,
            "timestamp": time.time()
        })
        
        # If agent is responding, user is interrupting
        if is_agent_responding:
            if is_agent_voice_responding:
                conversation_recorder.add_system_message("用户打断了对话。")
            cancel_ongoing_requests()
    
    def on_final_result(self, text):
        """Handle final recognition results"""
        global is_agent_responding
        
        result_queue.put({
            "type": "final", 
            "text": text,
            "timestamp": time.time()
        })
        
    def on_recognition_cancelled(self):
        """Handle recognition cancellation"""
        result_queue.put({
            "type": "cancelled",
            "timestamp": time.time()
        })


def cancel_ongoing_requests():
    """Cancel any ongoing Doubao requests and speech synthesis"""
    global is_agent_responding, is_agent_voice_responding
    
    is_agent_voice_responding = False
    is_agent_responding = False
    
    try:
        doubao_manager.cancel_request()  # Cancel Doubao request if it exists
    except Exception as e:
        print(f"Error cancelling Doubao request: {e}")


def recognition_worker():
    """Worker function to run speech recognition in a separate thread"""
    global active_recognizer
    recognizer = WebSpeechRecognizer()
    active_recognizer = recognizer

    try:
        recognizer.start()
    finally:
        active_recognizer = None


def create_speech_service():
    global active_recognizer
    if (not active_recognizer): 
        recognizer = WebSpeechRecognizer()
        active_recognizer = recognizer
    return

@app.route('/start', methods=['POST'])
def start_recognition():
    """Start speech recognition"""
    global recognition_thread, active_recognizer
    
    # if active_recognizer:
    #     return jsonify({"error": "Recognition already in progress"}), 400
    
    # Clear any old results
    while not result_queue.empty():
        result_queue.get()
    
    # Start recognition in a separate thread
    recognition_thread = threading.Thread(target=recognition_worker)
    recognition_thread.daemon = True
    recognition_thread.start()

    # Wait a short moment for the recognizer to initialize
    time.sleep(0.5)
    
    # Start synthesis in a separate thread
    # synthesis_thread = threading.Thread(target=synthesis_worker)
    # synthesis_thread.daemon = True
    # synthesis_thread.start()
    
    return jsonify({"status": "started"})


@app.route('/stop', methods=['POST'])
def stop_recognition():
    """Stop speech recognition"""
    global active_recognizer
    
    if active_recognizer:
        active_recognizer.done = True  # Signal the recognizer to stop
        cancel_ongoing_requests()
        active_recognizer = None
        return jsonify({"status": "stopping"})
    else:
        return jsonify({"error": "No active recognition to stop"}), 400


@app.route('/results', methods=['GET'])
def get_results():
    """Get all available speech recognition results"""
    results = []
    
    # Get all available results without blocking
    while not result_queue.empty():
        results.append(result_queue.get())
    
    return jsonify({"results": results})


@app.route('/status', methods=['GET'])
def get_status():
    """Get current status of speech recognition"""
    return jsonify({
        "active": active_recognizer is not None,
        "results_available": not result_queue.empty(),
        "agent_responding": is_agent_responding,
        "agent_speaking": is_agent_voice_responding
    })


@app.route('/wait-result', methods=['GET'])
def wait_for_result():
    """Wait for the next result (long polling)"""
    # Optional timeout parameter (in seconds)
    timeout = request.args.get('timeout', default=30, type=float)
    
    try:
        # Wait for a result with timeout
        result = result_queue.get(timeout=timeout)
        return jsonify({"result": result})
    except queue.Empty:
        return jsonify({"result": None})


@app.route('/clear', methods=['POST'])
def clear_conversation():
    """Clear the conversation history"""
    conversation_recorder.clear_conversation()
    if active_recognizer:
        active_recognizer.clear_pending_content()
    return jsonify({"status": "cleared"})

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == '__main__':
    create_speech_service()
    app.run(debug=True, host='0.0.0.0', port=31415)
