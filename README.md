# 🧠 Chatly

**Chatly** is a sleek, responsive web application that enables seamless conversations with AI models. Designed for simplicity and power, it provides an intuitive chat interface for interacting with local AI, especially models hosted with [Ollama](https://ollama.com/).

---

## ✨ Features

- 🧠 Supports multiple local or remote AI models
- 💬 Start, save, and resume conversations
- 📎 Supports text and file input
- 🌍 Multi-language support (depends on AI capabilities)
- 📱 Fully responsive design (mobile + desktop)

---

## ⚙️ Requirements

Make sure the following dependencies are installed:

### 🐍 Python & Libraries
- Python `3.6+`
- Flask `1.1.2+`
- Flask-CORS `3.0.8+`
- requests `2.23.0+`
- cryptography `3.1+`

---

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/alexutzusxft/chatly.git
   cd chatly
   ```

2. **Install required Python packages**
   ```bash
   pip install -r requirements.txt
   ```

3. **Download and set up [Ollama](https://ollama.com/download)**

4. **Install desired AI models**
   > Note: All models combined may require ~50GB+ of disk space.

5. **Run the application**
   ```bash
   python chatly.py
   ```

6. **Access Chatly**
   ```bash
   http://localhost:5000
   ```

---

## 🛠️ Development Notes

Chatly is built with Python and Flask and API Requests for real-time communication.  
It securely handles sessions, supports encryption, and uses Fernet for data security.

---

## 📌 Future Plans

- 🌐 Built-in multilingual UI
- 🔒 Optional user authentication (for example, Guest user support)
- 🧩 Plugin & tools system
- 📊 Model benchmarking support
- 📈 Model fine-tuning support
- 🎉 More AI models support
- 📷 Media upload support
- 🎨 UI theme customization

---

## 💻 Credits

- @AlexutzuSxft, main developer of the web-app.

---

## 📄 License

MIT License – See [`LICENSE`](LICENSE) for more information.