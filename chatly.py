from flask import Flask, request, jsonify, session, send_from_directory
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

# Default model
DEFAULT_MODEL = "gemma3:1b"

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
        model_map = {
            # Model : Actual model name
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
    
    user_data = {
        "username": username,
        "password": encrypt_data(password),
        "theme": "dark",
        "model": "gemma"
    }
    
    save_user_data(username, user_data)
    session["username"] = username
    
    return jsonify({"success": True, "message": "User registered successfully"}), 201

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
    
    return jsonify({
        "success": True, 
        "message": "Login successful",
        "user": {
            "username": username,
            "theme": user_data.get("theme", "dark"),
            "model": user_data.get("model", "gemma")
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
    
    username = session["username"]
    chat_data = get_chat_data(username, chat_id)
    
    if not chat_data:
        chat_data = {
            "title": "New Chat",
            "messages": []
        }
    
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
    ollama_response = process_with_ollama(chat_data["messages"], current_model)
    
    assistant_message = {
        "role": "assistant",
        "content": ollama_response,
        "timestamp": int(time.time())
    }
    chat_data["messages"].append(assistant_message)
    
    save_chat_data(username, chat_id, chat_data)
    
    return jsonify({
        "success": True,
        "message": assistant_message,
        "title": chat_data["title"]
    }), 200

def process_with_ollama(messages, model):
    ollama_messages = [{"role": msg["role"], "content": msg["content"]} for msg in messages]

    payload = {
        "model": model,
        "messages": ollama_messages,
        "stream": True
    }

    try:
        response = requests.post(
            "http://127.0.0.1:11434/api/chat",
            json=payload,
            stream=True
        )

        if response.status_code == 200:
            full_response = ""
            for line in response.iter_lines(decode_unicode=True):
                if line:
                    try:
                        data = json.loads(line)
                        content = data.get("message", {}).get("content", "")
                        full_response += content
                    except json.JSONDecodeError:
                        print("Could not decode line:", line)
            return full_response or "I couldn't process that. Please try again."
        else:
            return f"Error communicating with AI model: {response.status_code}"
    except Exception as e:
        return f"Error connecting to Ollama: {str(e)}"

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
    theme = data.get("theme")
    model = data.get("model")
    
    username = session["username"]
    user_data = get_user_data(username)
    
    if theme:
        user_data["theme"] = theme
    
    if model:
        user_data["model"] = model
    
    save_user_data(username, user_data)
    
    return jsonify({
        "success": True,
        "message": "Settings updated successfully",
        "user": {
            "username": username,
            "theme": user_data.get("theme", "dark"),
            "model": user_data.get("model", "gemma")
        }
    }), 200

# Static files
@app.route("/styles.css")
def serve_css():
    return send_from_directory(".", "Webpage/styles.css")

@app.route("/scripts.js")
def serve_js():
    return send_from_directory(".", "Webpage/scripts.js")

@app.route("/", methods=["GET"])
def serve_index():
    return send_from_directory(".", "Webpage/index.html")

if __name__ == "__main__":
    app.run(debug=False, port=5000)