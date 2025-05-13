from flask import Flask, request, jsonify, session, send_from_directory, make_response
from flask_cors import CORS
import os
import json
import uuid
import time
import requests
from cryptography.fernet import Fernet

app = Flask(__name__, static_folder=".")
app.secret_key = os.urandom(24)
CORS(app, supports_credentials=True)

# Add cache control headers to prevent caching issues
@app.after_request
def add_cache_control(response):
    # Prevent caching of sensitive pages
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# Default model
DEFAULT_MODEL = "gemma3:1b"

# Mock mode for development without Ollama
MOCK_MODE = False  # Set to True to use mock responses instead of Ollama

# Directories setup
users_dir = "Data/users"
chats_dir = "Data/chats"

os.makedirs(users_dir, exist_ok=True)
os.makedirs(chats_dir, exist_ok=True)

# Setup encryption
def get_encryption_key():
    key_file = "Key/encryption.key"
    if os.path.exists(key_file):
        with open(key_file, "rb") as f:
            return f.read()
    else:
        key = Fernet.generate_key()
        with open(key_file, "wb") as f:
            f.write(key)
        return key

encryption_key = get_encryption_key()
cipher_suite = Fernet(encryption_key)

# Helper functions
def encrypt_data(data):
    if isinstance(data, str):
        return cipher_suite.encrypt(data.encode()).decode()
    elif isinstance(data, dict):
        return cipher_suite.encrypt(json.dumps(data).encode()).decode()
    return None

def decrypt_data(encrypted_data):
    try:
        if isinstance(encrypted_data, str):
            return cipher_suite.decrypt(encrypted_data.encode()).decode()
        return None
    except Exception as e:
        print(f"Decryption error: {e}")
        return None

def get_user_data(username):
    user_file = os.path.join(users_dir, f"{username}.json")
    if not os.path.exists(user_file):
        return None
    
    with open(user_file, "r") as f:
        encrypted_data = f.read()
        decrypted_data = decrypt_data(encrypted_data)
        if decrypted_data:
            return json.loads(decrypted_data)
    return None

def save_user_data(username, data):
    user_file = os.path.join(users_dir, f"{username}.json")
    encrypted_data = encrypt_data(data)
    
    with open(user_file, "w") as f:
        f.write(encrypted_data)
    return True

def get_user_chats(username):
    user_chats_dir = os.path.join(chats_dir, username)
    os.makedirs(user_chats_dir, exist_ok=True)
    
    chats = []
    for file in os.listdir(user_chats_dir):
        if file.endswith(".json"):
            chat_id = file.split(".")[0]
            chat_path = os.path.join(user_chats_dir, file)
            
            with open(chat_path, "r") as f:
                encrypted_data = f.read()
                decrypted_data = decrypt_data(encrypted_data)
                if decrypted_data:
                    chat_data = json.loads(decrypted_data)
                    title = chat_data.get("title", "New Chat")
                    chats.append({"id": chat_id, "title": title})
    
    return chats

def get_chat_data(username, chat_id):
    chat_file = os.path.join(chats_dir, username, f"{chat_id}.json")
    if not os.path.exists(chat_file):
        return None
    
    with open(chat_file, "r") as f:
        encrypted_data = f.read()
        decrypted_data = decrypt_data(encrypted_data)
        if decrypted_data:
            return json.loads(decrypted_data)
    return None

def save_chat_data(username, chat_id, data):
    user_chats_dir = os.path.join(chats_dir, username)
    os.makedirs(user_chats_dir, exist_ok=True)
    
    chat_file = os.path.join(user_chats_dir, f"{chat_id}.json")
    encrypted_data = encrypt_data(data)
    
    with open(chat_file, "w") as f:
        f.write(encrypted_data)
    return True

def get_current_model(username):
    user_data = get_user_data(username)
    if user_data and 'model' in user_data:
        # Check if the model is already a full name with version
        if ':' in user_data['model']:
            return user_data['model']
            
        # For backward compatibility, handle old short names
        model_map = {
            # Legacy model name mapping
            'mistral': 'mistral:latest',
            'gemma': 'gemma3:1b',
            'tinyllama': 'tinyllama:latest',
            'phi3': 'phi3:3.8b',
            'phi': 'phi:latest',
            'deepseek-coder': 'deepseek-coder:latest',
            'deepseek-r1': 'deepseek-r1:8b',
            'tinystories': 'gurubot/tinystories-656k-q8:latest',
            'llama2-uncensored': 'llama2-uncensored:latest',
            'llava': 'llava:7b',
            'phi4-mini': 'phi4-mini:latest',
            'phi4': 'phi4:latest',
            'codellama': 'codellama:latest',
            'smollm-1.7b': 'smollm:1.7b',
            'smollm-135m': 'smollm:135m',
            'qwen3-8b': 'qwen3:8b',
            'qwen3-0.6b': 'qwen3:0.6b',
            'deepscaler': 'deepscaler:latest',
            'dolphin-mistral': 'dolphin-mistral:latest',
            'dolphin-phi': 'dolphin-phi:latest'
        }

        return model_map.get(user_data['model'], DEFAULT_MODEL)
    return DEFAULT_MODEL

# API Endpoints
@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    
    if not username or not password:
        return jsonify({"success": False, "message": "Username and password are required"}), 400
    
    user_file = os.path.join(users_dir, f"{username}.json")
    if os.path.exists(user_file):
        return jsonify({"success": False, "message": "Username already exists"}), 400
    
    # Create user data with default settings for all preferences
    user_data = {
        "username": username,
        "password": encrypt_data(password),
        "theme": "dark",
        "colorTheme": "blue",
        "model": "gemma3:1b",
        "compactSidebar": True,
        "glassmorphism": True,
        "animations": True,
        "fontSize": "medium",
        "showLineNumbers": True,
        "autoScroll": True
    }
    
    save_user_data(username, user_data)
    session["username"] = username
    
    return jsonify({"success": True, "message": "User registered successfully"}), 201

@app.route("/api/current_user", methods=["GET"])
def current_user():
    if "username" not in session:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    
    username = session["username"]
    user_data = get_user_data(username)
    if not user_data:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    # Return all user settings, ensure defaults for any missing settings
    return jsonify({
        "success": True,
        "user": {
            "username": username,
            "theme": user_data.get("theme", "dark"),
            "colorTheme": user_data.get("colorTheme", "blue"),
            "model": user_data.get("model", "gemma3:1b"),
            "compactSidebar": user_data.get("compactSidebar", True),
            "glassmorphism": user_data.get("glassmorphism", True),
            "animations": user_data.get("animations", True),
            "fontSize": user_data.get("fontSize", "medium"),
            "showLineNumbers": user_data.get("showLineNumbers", True),
            "autoScroll": user_data.get("autoScroll", True)
        }
    }), 200

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    
    user_data = get_user_data(username)
    if not user_data:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401
    
    decrypted_password = decrypt_data(user_data["password"])
    if password != decrypted_password:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401
    
    session["username"] = username
    
    # Return all user settings, ensure defaults for any missing settings
    return jsonify({
        "success": True, 
        "message": "Login successful",
        "user": {
            "username": username,
            "theme": user_data.get("theme", "dark"),
            "colorTheme": user_data.get("colorTheme", "blue"),
            "model": user_data.get("model", "gemma3:1b"),
            "compactSidebar": user_data.get("compactSidebar", True),
            "glassmorphism": user_data.get("glassmorphism", True),
            "animations": user_data.get("animations", True),
            "fontSize": user_data.get("fontSize", "medium"),
            "showLineNumbers": user_data.get("showLineNumbers", True),
            "autoScroll": user_data.get("autoScroll", True)
        }
    }), 200

@app.route("/api/logout", methods=["POST"])
def logout():
    session.pop("username", None)
    return jsonify({"success": True, "message": "Logged out successfully"}), 200

@app.route("/api/change_password", methods=["POST"])
def change_password():
    if "username" not in session:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    
    data = request.json
    old_password = data.get("old_password")
    new_password = data.get("new_password")
    
    if not old_password or not new_password:
        return jsonify({"success": False, "message": "Old and new passwords are required"}), 400
    
    username = session["username"]
    user_data = get_user_data(username)
    
    decrypted_password = decrypt_data(user_data["password"])
    if old_password != decrypted_password:
        return jsonify({"success": False, "message": "Incorrect old password"}), 401
    
    user_data["password"] = encrypt_data(new_password)
    save_user_data(username, user_data)
    
    return jsonify({"success": True, "message": "Password changed successfully"}), 200

@app.route("/api/new_chat", methods=["POST"])
def new_chat():
    if "username" not in session:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    
    username = session["username"]
    chat_id = f"chat_{int(time.time())}_{uuid.uuid4().hex[:8]}"
    
    chat_data = {
        "title": "New Chat",
        "messages": []
    }
    
    save_chat_data(username, chat_id, chat_data)
    
    return jsonify({
        "success": True,
        "chat_id": chat_id,
        "title": "New Chat"
    }), 201

@app.route("/api/send_message", methods=["POST"])
def send_message():
    if "username" not in session:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    
    data = request.json
    chat_id = data.get("chat_id")
    message = data.get("message")
    
    if not chat_id or not message:
        return jsonify({"success": False, "message": "Chat ID and message are required"}), 400
    
    print(f"[DEBUG] Processing message for chat ID: {chat_id}")
    print(f"[DEBUG] Message content: {message[:50]}...")
    
    username = session["username"]
    chat_data = get_chat_data(username, chat_id)
    
    if not chat_data:
        print(f"[DEBUG] No existing chat data found, creating new")
        chat_data = {
            "title": "New Chat",
            "messages": []
        }
    else:
        print(f"[DEBUG] Found existing chat with {len(chat_data.get('messages', []))} messages")
    
    user_message = {
        "role": "user",
        "content": message,
        "timestamp": int(time.time())
    }
    chat_data["messages"].append(user_message)
    
    if len(chat_data["messages"]) == 1:
        words = message.split()
        title = " ".join(words[:3]) + ("..." if len(words) > 3 else "")
        chat_data["title"] = title
    
    current_model = get_current_model(username)
    print(f"[DEBUG] Using model: {current_model}")
    print(f"[DEBUG] MOCK_MODE is currently: {MOCK_MODE}")
    
    # Call process_with_ollama with explicit try/except for better debugging
    try:
        ollama_response = process_with_ollama(chat_data["messages"], current_model)
        print(f"[DEBUG] Response received, length: {len(ollama_response)}")
    except Exception as e:
        print(f"[ERROR] Error in process_with_ollama: {str(e)}")
        ollama_response = f"Error processing your message: {str(e)}"
    
    assistant_message = {
        "role": "assistant",
        "content": ollama_response,
        "timestamp": int(time.time())
    }
    chat_data["messages"].append(assistant_message)
    
    try:
        save_chat_data(username, chat_id, chat_data)
        print(f"[DEBUG] Chat data saved successfully")
    except Exception as e:
        print(f"[ERROR] Error saving chat data: {str(e)}")
    
    return jsonify({
        "success": True,
        "message": assistant_message,
        "title": chat_data["title"]
    }), 200

def process_with_ollama(messages, model):
    # Use mock mode if enabled
    global MOCK_MODE
    
    if MOCK_MODE:
        print("[DEBUG] Mock mode enabled, generating mock response")
        last_message = messages[-1]["content"] if messages else ""
        mock_response = generate_mock_response(last_message, model)
        print(f"[DEBUG] Generated mock response: {mock_response[:50]}...")
        return mock_response
        
    print("[DEBUG] Preparing Ollama API request")
    ollama_messages = [{"role": msg["role"], "content": msg["content"]} for msg in messages]

    payload = {
        "model": model,
        "messages": ollama_messages,
        "stream": True
    }
    print(f"[DEBUG] Payload prepared: {len(ollama_messages)} messages for model {model}")

    try:
        print("[DEBUG] Attempting to connect to Ollama API...")
        # Try to connect to Ollama with a longer timeout
        response = requests.post(
            "http://127.0.0.1:11434/api/chat",
            json=payload,
            stream=True,
            timeout=30  # Increased timeout to 30 seconds
        )
        print(f"[DEBUG] Ollama API response status: {response.status_code}")

        if response.status_code == 200:
            full_response = ""
            line_count = 0
            for line in response.iter_lines(decode_unicode=True):
                if line:
                    print(f"[DEBUG] Raw line from Ollama: {line[:100]}...")
                    try:
                        data = json.loads(line)
                        # Try different possible response formats
                        # Format 1: Newer Ollama versions with 'message'
                        content = data.get("message", {}).get("content", "")
                        # Format 2: Some versions may return 'response' directly
                        if not content and "response" in data:
                            content = data.get("response", "")
                        # Format 3: Older versions or different modes
                        if not content and "content" in data:
                            content = data.get("content", "")
                            
                        if content:
                            full_response += content
                            line_count += 1
                            print(f"[DEBUG] Parsed content: '{content[:30]}...'")
                    except json.JSONDecodeError:
                        print(f"[ERROR] Could not decode line: {line[:100]}")
            
            print(f"[DEBUG] Processed {line_count} response lines")
            if not full_response:
                print("[WARNING] Empty response from Ollama despite status 200")
                # Try one more time to extract any text from the response
                try:
                    # Make one more attempt to read the entire response as a single chunk
                    full_text_response = ""
                    for line in response.iter_lines(decode_unicode=True):
                        if line:
                            full_text_response += line.decode('utf-8') if isinstance(line, bytes) else line
                    
                    if full_text_response:
                        print(f"[DEBUG] Extracted raw text: {full_text_response[:100]}...")
                        return full_text_response
                except:
                    pass
                
                # If we still don't have a response, check if Ollama is actually running
                try:
                    health_check = requests.get("http://127.0.0.1:11434/api/version", timeout=2)
                    if health_check.status_code != 200:
                        return "Ollama seems to be running but not responding properly. Please check if the model is loaded correctly."
                except:
                    return "Ollama appears to be offline. Please make sure Ollama is running and try again."
                
                return "I couldn't generate a response. Please check server logs for details."
                
            print(f"[DEBUG] Final response length: {len(full_response)}")
            return full_response
        else:
            error_msg = f"Error communicating with AI model (HTTP {response.status_code}). Make sure Ollama is running and the selected model '{model}' is available."
            print(f"[ERROR] {error_msg}")
            return error_msg
    except requests.exceptions.ConnectionError:
        error_msg = "Could not connect to Ollama. Please make sure Ollama is running at http://127.0.0.1:11434."
        print(f"[ERROR] {error_msg}")
        
        # Auto-enable mock mode if connection fails
        MOCK_MODE = True
        print("[DEBUG] Auto-enabled mock mode due to connection failure")
        
        # Return a mock response instead
        last_message = messages[-1]["content"] if messages else ""
        return generate_mock_response(last_message, model)
    except requests.exceptions.Timeout:
        error_msg = "The request to Ollama timed out. Please check if the model is loaded with 'ollama pull " + model + "' and try again."
        print(f"[ERROR] {error_msg}")
        return error_msg
    except Exception as e:
        error_msg = f"Error connecting to Ollama: {str(e)}. Please make sure Ollama is running."
        print(f"[ERROR] {error_msg}")
        print(f"[ERROR] Exception details: {type(e).__name__}: {str(e)}")
        # Provide a fallback response when Ollama is unavailable
        last_user_message = next((msg["content"] for msg in reversed(messages) if msg["role"] == "user"), None)
        if last_user_message:
            # Return a simple echo response for debugging
            return f"FALLBACK RESPONSE (Ollama unavailable): I received your message: '{last_user_message}'. Please make sure Ollama is running with the '{model}' model loaded."
        return f"Error connecting to Ollama: {str(e)}. Please make sure Ollama is running."

def generate_mock_response(message, model):
    """Generate a mock response for development without Ollama"""
    import random
    
    greetings = ["hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening"]
    if any(greeting in message.lower() for greeting in greetings):
        responses = [
            f"Hello there! I'm a mock {model} bot. How can I help you today?",
            f"Hi! This is a simulated response from {model}. Ollama isn't connected.",
            "Greetings! I'm running in mock mode because Ollama isn't available."
        ]
        return random.choice(responses)
    
    questions = ["what", "how", "why", "when", "where", "who", "can you", "could you"]
    if any(q in message.lower() for q in questions):
        responses = [
            f"That's an interesting question! In mock mode I can't provide a real answer, but with Ollama running, {model} could help with this.",
            "I'd need to connect to Ollama to properly answer this question. This is just a mock response.",
            "Great question! Once Ollama is configured properly, I can give you a proper response."
        ]
        return random.choice(responses)
    
    # Default response
    return f"This is a mock response from the {model} model. To get real responses, make sure Ollama is running and properly configured. I received your message: '{message[:50]}{'...' if len(message) > 50 else ''}'."

@app.route("/api/get_chats", methods=["GET"])
def get_chats():
    if "username" not in session:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    
    username = session["username"]
    chats = get_user_chats(username)
    
    return jsonify({
        "success": True,
        "chats": chats
    }), 200

@app.route("/api/get_chat/<chat_id>", methods=["GET"])
def get_chat(chat_id):
    if "username" not in session:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    
    username = session["username"]
    chat_data = get_chat_data(username, chat_id)
    
    if not chat_data:
        return jsonify({"success": False, "message": "Chat not found"}), 404
    
    return jsonify({
        "success": True,
        "chat": chat_data
    }), 200

@app.route("/api/rename_chat", methods=["POST"])
def rename_chat():
    if "username" not in session:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    
    data = request.json
    chat_id = data.get("chat_id")
    new_title = data.get("title")
    
    if not chat_id or not new_title:
        return jsonify({"success": False, "message": "Chat ID and title are required"}), 400
    
    username = session["username"]
    chat_data = get_chat_data(username, chat_id)
    
    if not chat_data:
        return jsonify({"success": False, "message": "Chat not found"}), 404
    
    chat_data["title"] = new_title
    save_chat_data(username, chat_id, chat_data)
    
    return jsonify({
        "success": True,
        "message": "Chat renamed successfully"
    }), 200

@app.route("/api/delete_chat", methods=["POST"])
def delete_chat():
    if "username" not in session:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    
    data = request.json
    chat_id = data.get("chat_id")
    
    if not chat_id:
        return jsonify({"success": False, "message": "Chat ID is required"}), 400
    
    username = session["username"]
    chat_file = os.path.join(chats_dir, username, f"{chat_id}.json")
    
    if os.path.exists(chat_file):
        os.remove(chat_file)
    
    return jsonify({
        "success": True,
        "message": "Chat deleted successfully"
    }), 200

@app.route("/api/clear_chats", methods=["POST"])
def clear_chats():
    if "username" not in session:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    
    username = session["username"]
    user_chats_dir = os.path.join(chats_dir, username)
    
    if os.path.exists(user_chats_dir):
        for file in os.listdir(user_chats_dir):
            if file.endswith(".json"):
                os.remove(os.path.join(user_chats_dir, file))
    
    return jsonify({
        "success": True,
        "message": "All chats cleared successfully"
    }), 200

@app.route("/api/update_settings", methods=["POST"])
def update_settings():
    if "username" not in session:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    
    data = request.json
    username = session["username"]
    user_data = get_user_data(username)
    
    # Update all received settings
    for key, value in data.items():
        user_data[key] = value
    
    save_user_data(username, user_data)
    
    return jsonify({
        "success": True,
        "message": "Settings updated successfully",
        "user": user_data
    }), 200

@app.route("/api/delete_account", methods=["POST"])
def delete_account():
    if "username" not in session:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    
    data = request.json
    password = data.get("password")
    
    if not password:
        return jsonify({"success": False, "message": "Password is required", "error": "missing_password"}), 400
    
    username = session["username"]
    user_data = get_user_data(username)
    
    if not user_data:
        return jsonify({"success": False, "message": "User not found", "error": "user_not_found"}), 404
    
    # Verify password
    decrypted_password = decrypt_data(user_data["password"])
    if password != decrypted_password:
        return jsonify({"success": False, "message": "Incorrect password", "error": "invalid_password"}), 401
    
    # Delete user chats
    user_chats_dir = os.path.join(chats_dir, username)
    if os.path.exists(user_chats_dir):
        for file in os.listdir(user_chats_dir):
            if file.endswith(".json"):
                try:
                    os.remove(os.path.join(user_chats_dir, file))
                except Exception as e:
                    print(f"Error deleting chat file {file}: {e}")
        
        # Remove the empty directory
        try:
            os.rmdir(user_chats_dir)
        except Exception as e:
            print(f"Error removing chats directory: {e}")
    
    # Delete user account file
    user_file = os.path.join(users_dir, f"{username}.json")
    if os.path.exists(user_file):
        try:
            os.remove(user_file)
        except Exception as e:
            print(f"Error deleting user file: {e}")
            return jsonify({"success": False, "message": "Failed to delete account", "error": "file_error"}), 500
    
    # Clear session
    session.pop("username", None)
    
    return jsonify({"success": True, "message": "Account deleted successfully"}), 200

# Static files
@app.route("/styles.css")
def serve_css():
    return send_from_directory(".", "Webpage/styles.css")

@app.route("/scripts.js")
def serve_js():
    return send_from_directory(".", "Webpage/scripts.js")

@app.route("/", methods=["GET"])
def serve_index():
    response = make_response(send_from_directory(".", "Webpage/index.html"))
    # Ensure no caching for the main page
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

def check_ollama_status():
    """Check if Ollama is running and available"""
    print("[DEBUG] Checking Ollama status...")
    try:
        response = requests.get("http://127.0.0.1:11434/api/version", timeout=2)
        if response.status_code == 200:
            version_info = response.json()
            print(f"[DEBUG] Ollama is available, version: {version_info.get('version', 'unknown')}")
            return {
                "available": True,
                "version": version_info.get("version", "unknown"),
                "message": "Ollama is running"
            }
        else:
            print(f"[DEBUG] Ollama returned error status: {response.status_code}")
            return {
                "available": False,
                "message": f"Ollama returned an error: HTTP {response.status_code}"
            }
    except requests.exceptions.ConnectionError:
        print("[DEBUG] Connection error when checking Ollama")
        return {
            "available": False,
            "message": "Could not connect to Ollama"
        }
    except requests.exceptions.Timeout:
        print("[DEBUG] Timeout when checking Ollama")
        return {
            "available": False,
            "message": "Connection to Ollama timed out"
        }
    except Exception as e:
        print(f"[DEBUG] Exception when checking Ollama: {str(e)}")
        return {
            "available": False,
            "message": f"Error checking Ollama: {str(e)}"
        }

@app.route("/api/system/status", methods=["GET"])
def system_status():
    """Get system status, including Ollama availability"""
    if "username" not in session:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    
    ollama_status = check_ollama_status()
    
    return jsonify({
        "success": True,
        "ollama": ollama_status,
        "mock_mode": MOCK_MODE,
        "version": "0.5.0"
    })

@app.route("/api/system/toggle_mock", methods=["POST"])
def toggle_mock_mode():
    """Toggle the mock mode for development without Ollama"""
    if "username" not in session:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    
    # Access MOCK_MODE at module level without using global keyword
    print(f"[DEBUG] Toggle mock mode requested, current mode: {MOCK_MODE}")
    globals()["MOCK_MODE"] = not globals()["MOCK_MODE"]
    print(f"[DEBUG] Mock mode is now: {MOCK_MODE}")
    
    return jsonify({
        "success": True,
        "mock_mode": globals()["MOCK_MODE"],
        "message": f"Mock mode {'enabled' if globals()['MOCK_MODE'] else 'disabled'}"
    })

if __name__ == "__main__":
    print("\n===== Starting Chatly =====")
    # Check if Ollama is available and enable mock mode automatically if not
    print("Checking Ollama availability...")
    ollama_status = check_ollama_status()
    
    # Modify MOCK_MODE at module level 
    if not ollama_status["available"]:
        globals()["MOCK_MODE"] = True
        print(f"Ollama not available: {ollama_status['message']}")
        print("MOCK MODE ENABLED: Using mock responses instead of Ollama API")
    else:
        print(f"Ollama is available: version {ollama_status.get('version', 'unknown')}")
        print("Using Ollama for AI responses")
    
    print(f"Starting server on port 19125")
    app.run(host="0.0.0.0", debug=False, port=19125)