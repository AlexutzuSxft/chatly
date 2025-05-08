// Global variables
let currentUser = null;
let currentChatId = null;
let chats = [];
let typingTimer = null;
let isGenerating = false;

// DOM Elements
const authModal = document.getElementById('auth-modal');
const settingsModal = document.getElementById('settings-modal');
const renameModal = document.getElementById('rename-modal');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messagesContainer = document.getElementById('messages-container');
const messagesDiv = document.getElementById('messages');
const welcomeScreen = document.getElementById('welcome-screen');
const chatList = document.getElementById('chat-list');
const currentChatTitle = document.getElementById('current-chat-title');
const newChatBtn = document.getElementById('new-chat-btn');
const clearChatsBtn = document.getElementById('clear-chats-btn');
const settingsBtn = document.getElementById('settings-btn');
const logoutBtn = document.getElementById('logout-btn');

// Auth form elements
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubmit = document.getElementById('auth-submit');
const authSwitchText = document.getElementById('auth-switch-text');
const authSwitchLink = document.getElementById('auth-switch-link');
const confirmPasswordGroup = document.getElementById('confirm-password-group');
const username = document.getElementById('username');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirm-password');

// File upload elements
const fileInput = document.getElementById('file-input');
const filePreview = document.getElementById('file-preview');
const fileNameSpan = document.getElementById('file-name');
const fileContentPreview = document.getElementById('file-content-preview');
const removeFileBtn = document.getElementById('remove-file-btn');
const attachFileBtn = document.getElementById('attach-file-btn');

// Settings form elements
const settingsForm = document.getElementById('settings-form');
const themeSelect = document.getElementById('theme-select');
const modelSelect = document.getElementById('model-select');
const oldPassword = document.getElementById('old-password');
const newPassword = document.getElementById('new-password');
const confirmNewPassword = document.getElementById('confirm-new-password');

// Rename form elements
const renameForm = document.getElementById('rename-form');
const newChatTitle = document.getElementById('new-chat-title');
const renameChatBtn = document.getElementById('rename-chat-btn');

// Close buttons
const closeButtons = document.querySelectorAll('.close');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupEventListeners();
    configureMarked();
});

function applyStaggeredAnimationDelays() {
    const chatItems = document.querySelectorAll('.chat-list .chat-item');
    chatItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.05}s`;
    });
}

// Authentication functions
function checkAuthStatus() {
    fetch('/api/get_chats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                hideAuthModal();
                fetchUserData();
                loadChats();
            } else {
                showAuthModal();
            }
        })
        .catch(() => showAuthModal());
}

function showAuthModal() {
    authModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideAuthModal() {
    authModal.classList.remove('active');
    document.body.style.overflow = '';
    resetAuthForm();
}

function resetAuthForm() {
    authForm.reset();
    password.value = '';
    confirmPassword.value = '';
}


function toggleAuthMode() {
    const isLogin = authTitle.textContent === 'Login';
    authTitle.textContent = isLogin ? 'Register' : 'Login';
    authSubmit.textContent = isLogin ? 'Register' : 'Login';
    confirmPasswordGroup.classList.toggle('hidden', !isLogin);
    authSwitchText.textContent = isLogin ? 'Don\'t have an account? ' : 'Already have an account? ';
    authSwitchLink.textContent = isLogin ? 'Register' : 'Login';
}

function handleAuth(event) {
    event.preventDefault();
    const isLogin = authTitle.textContent === 'Login';
    const usernameValue = username.value.trim();
    const passwordValue = password.value;

    if (!usernameValue || !passwordValue) {
        showToast('Username and password are required', 'error');
        return;
    }

    if (!isLogin && passwordValue !== confirmPassword.value) {
        showToast('Passwords do not match', 'error');
        return;
    }

    fetch(isLogin ? '/api/login' : '/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameValue, password: passwordValue }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUser = data.user || { username: usernameValue };
            hideAuthModal();
            showToast(data.message, 'success');
            updateUIAfterLogin(currentUser);
            loadChats();
        } else {
            showToast(data.message, 'error');
        }
    })
    .catch(err => {
        console.error('Auth error:', err);
        showToast('An error occurred during authentication', 'error');
    });
}

function fetchUserData() {
    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '', password: '' }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUser = data.user;
            updateUIAfterLogin(currentUser);
        }
    })
    .catch(console.error);
}

function updateUIAfterLogin(user) {
    updateUserDisplay();
    applyTheme(user.theme || 'dark');
    updateModelDisplay(user.model || 'gemma');
}

function updateUserDisplay() {
    if (currentUser) {
        document.getElementById('username-display').textContent = currentUser.username;
    }
}

function updateModelDisplay(modelName) {
    const modelDisplayMap = {
        'mistral:latest': 'Mistral',
        'gemma3:1b': 'Gemma',
        'tinyllama:latest': 'TinyLlama',
        'phi3:3.8b': 'Phi3',
        'phi:latest': 'Phi2',
        'deepseek-coder:latest': 'DeepSeek Coder',
        'deepseek-r1:8b': 'DeepSeek',
        'tinystories': 'TinyStories',
        'llama2-uncensored:latest': 'Llama2 Uncensored',
        'llava:7b': 'LLava',
        'phi4-mini:latest': 'Phi4 Mini',
        'phi4:latest': 'Phi4',
        'codellama:latest': 'CodeLlama',
        'smollm:1.7b': 'Smollm 1.7B',
        'smollm:135m': 'Smollm 135M',
        'qwen3:8b': 'Qwen3 8B',
        'qwen3:0.6b': 'Qwen3 0.6B',
        'deepscaler:latest': 'Deepscaler',
        'dolphin-mistral:latest': 'Dolphin Mistral',
        'dolphin-phi:latest': 'Dolphin Phi'
    };
        
    const displayElement = document.getElementById('current-model-display');
    if (displayElement) {
        displayElement.textContent = modelDisplayMap[modelName] || 'Gemma';
    }
}

function logout() {
    fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUser = null;
            currentChatId = null;
            chats = [];
            resetUI();
            showAuthModal();
            showToast('Logged out successfully', 'success');
        }
    })
    .catch(err => {
        console.error('Logout error:', err);
        showToast('An error occurred during logout', 'error');
    });
}

// Chat functions
function loadChats() {
    fetch('/api/get_chats', { credentials: 'include' })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            chats = data.chats || [];
            renderChatList();
            if (chats.length > 0 && !currentChatId) loadChat(chats[0].id);
            else if (chats.length === 0) showWelcomeScreen();
        }
    })
    .catch(console.error);
}

attachFileBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file && file.size < 500000) { // limit to ~500KB
        const reader = new FileReader();
        reader.onload = () => {
            filePreview.classList.remove('hidden');
            fileNameSpan.textContent = file.name;
            fileContentPreview.textContent = reader.result;
        };
        reader.readAsText(file);
    }
});

removeFileBtn.addEventListener('click', () => {
    fileInput.value = '';
    filePreview.classList.add('hidden');
    fileNameSpan.textContent = '';
    fileContentPreview.textContent = '';
});

function renderChatList() {
    chatList.innerHTML = '';
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
        chatItem.dataset.id = chat.id;
        chatItem.innerHTML = `
            <div class="chat-item-title">${escapeHTML(chat.title)}</div>
            <div class="chat-item-actions">
                <button class="rename-chat" title="Rename"><i class="fas fa-edit"></i></button>
                <button class="delete-chat" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        `;
        chatItem.addEventListener('click', () => loadChat(chat.id));
        chatItem.querySelector('.rename-chat').addEventListener('click', (e) => {
            e.stopPropagation();
            showRenameModal(chat.id, chat.title);
        });
        chatItem.querySelector('.delete-chat').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        });
        chatList.appendChild(chatItem); // Append chatItem to chatList
        applyStaggeredAnimationDelays(); // Apply animation delays
    });
}

function createNewChat() {
    fetch('/api/new_chat', {
        method: 'POST',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const newChat = { id: data.chat_id, title: data.title };
            chats.unshift(newChat);
            renderChatList();
            loadChat(newChat.id);
        }
    })
    .catch(err => {
        console.error('Error creating new chat:', err);
        showToast('Failed to create new chat', 'error');
    });
}

function loadChat(chatId) {
    currentChatId = chatId;
    renameChatBtn.classList.remove('hidden');
    messagesDiv.innerHTML = '';
    welcomeScreen.style.display = 'none';
    messagesDiv.style.display = 'flex';

    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === chatId);
    });

    fetch(`/api/get_chat/${chatId}`, { credentials: 'include' })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentChatTitle.textContent = data.chat.title;
            data.chat.messages.forEach(addMessageToUI);
            scrollToBottom();
        }
    })
    .catch(err => {
        console.error('Error loading chat:', err);
        showToast('Failed to load chat', 'error');
    });
}

function showWelcomeScreen() {
    currentChatId = null;
    messagesDiv.style.display = 'none';
    welcomeScreen.style.display = 'flex';
    currentChatTitle.textContent = 'New Chat';
    renameChatBtn.classList.add('hidden');
}

function sendMessage() {
    let message = messageInput.value.trim(); // ✅ use let here
    if (!message && fileInput.files.length === 0) return;

    if (fileInput.files.length > 0 && fileContentPreview.textContent) {
        message += `\n\n---\nAttached File Content:\n${fileContentPreview.textContent}`;
    }
    
    if (!currentChatId) {
        createNewChatForMessage(message);
    } else {
        processMessageSend(message);
    }
}

function createNewChatForMessage(message) {
    fetch('/api/new_chat', {
        method: 'POST',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentChatId = data.chat_id;
            chats.unshift({ id: data.chat_id, title: data.title });
            renderChatList();
            loadChat(data.chat_id);
            processMessageSend(message);
        }
    })
    .catch(err => {
        console.error('Error creating chat:', err);
        showToast('Failed to create chat', 'error');
    });
}

function processMessageSend(message) {
    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendButton.disabled = true;

    const userMessage = {
        role: 'user',
        content: message,
        timestamp: Date.now() / 1000
    };
    addMessageToUI(userMessage);
    scrollToBottom();
    showTypingIndicator();
    isGenerating = true;

    fetch('/api/send_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: currentChatId, message }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        removeTypingIndicator();
        if (data.success) {
            addMessageToUI(data.message);
            scrollToBottom();
            if (data.title && data.title !== 'New Chat') {
                currentChatTitle.textContent = data.title;
                const chatIndex = chats.findIndex(chat => chat.id === currentChatId);
                if (chatIndex !== -1) {
                    chats[chatIndex].title = data.title;
                    renderChatList();
                }
            }
        } else {
            showToast('Failed to send message', 'error');
        }
        isGenerating = false;
    })
    .catch(err => {
        console.error('Error sending message:', err);
        removeTypingIndicator();
        showToast('Failed to send message', 'error');
        isGenerating = false;
    });
}

function addMessageToUI(message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${message.role}`;
  // Process <think> tags
  const processedContent = message.content
      .replace(/<think>(.*?)<\/think>/gs, '<div class="think-box">$1</div>');
  messageDiv.innerHTML = `<div class="message-content">${marked.parse(processedContent)}</div>`;
  messagesDiv.appendChild(messageDiv);
  messageDiv.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `<span></span><span></span><span></span>`;
    messagesDiv.appendChild(typingDiv);
    scrollToBottom();
}

function removeTypingIndicator() {
    document.getElementById('typing-indicator')?.remove();
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Chat management functions
function showRenameModal(chatId, title) {
    if (chatId) {
        renameModal.classList.add('active');
        newChatTitle.value = title || '';
        newChatTitle.dataset.chatId = chatId;
    }
}

function renameChat(event) {
    event.preventDefault();
    const chatId = newChatTitle.dataset.chatId;
    const title = newChatTitle.value.trim();

    if (!chatId || !title) return;

    fetch('/api/rename_chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, title }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (chatId === currentChatId) currentChatTitle.textContent = title;
            const chatIndex = chats.findIndex(chat => chat.id === chatId);
            if (chatIndex !== -1) {
                chats[chatIndex].title = title;
                renderChatList();
            }
            hideRenameModal();
            showToast('Chat renamed successfully', 'success');
        }
    })
    .catch(err => {
        console.error('Error renaming chat:', err);
        showToast('Failed to rename chat', 'error');
    });
}

function hideRenameModal() {
    renameModal.classList.remove('active');
    renameForm.reset();
}

function deleteChat(chatId) {
    if (!confirm('Are you sure you want to delete this chat?')) return;

    fetch('/api/delete_chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            chats = chats.filter(chat => chat.id !== chatId);
            if (chatId === currentChatId) {
                chats.length > 0 ? loadChat(chats[0].id) : showWelcomeScreen();
            }
            renderChatList();
            showToast('Chat deleted successfully', 'success');
        }
    })
    .catch(err => {
        console.error('Error deleting chat:', err);
        showToast('Failed to delete chat', 'error');
    });
}

function clearAllChats() {
    if (!confirm('Are you sure you want to delete all chats? This cannot be undone.')) return;

    fetch('/api/clear_chats', { method: 'POST', credentials: 'include' })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            chats = [];
            renderChatList();
            showWelcomeScreen();
            showToast('All chats cleared successfully', 'success');
        }
    })
    .catch(err => {
        console.error('Error clearing chats:', err);
        showToast('Failed to clear chats', 'error');
    });
}

// Settings functions
function showSettingsModal() {
    settingsModal.classList.add('active');
    themeSelect.value = currentUser?.theme || 'dark';
    modelSelect.value = currentUser?.model || 'gemma';
    oldPassword.value = '';
    newPassword.value = '';
    confirmNewPassword.value = '';
}

function hideSettingsModal() {
    settingsModal.classList.remove('active');
    settingsForm.reset();
}

function updateSettings(event) {
    event.preventDefault();
    const theme = themeSelect.value;
    const model = modelSelect.value;
    const oldPasswordValue = oldPassword.value;
    const newPasswordValue = newPassword.value;
    const confirmNewPasswordValue = confirmNewPassword.value;

    // First update theme and model
    fetch('/api/update_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, model }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUser = data.user;
            applyTheme(theme);
            updateModelDisplay(model);
            showToast('Settings updated successfully', 'success');
            
            // Then handle password change if needed
            if (oldPasswordValue && newPasswordValue) {
                if (newPasswordValue !== confirmNewPasswordValue) {
                    showToast('New passwords do not match', 'error');
                    return;
                }

                return fetch('/api/change_password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        old_password: oldPasswordValue, 
                        new_password: newPasswordValue 
                    }),
                    credentials: 'include'
                });
            }
        }
        return Promise.resolve();
    })
    .then(response => {
        if (response) {
            return response.json().then(data => {
                if (data.success) {
                    showToast('Password changed successfully', 'success');
                } else {
                    showToast(data.message, 'error');
                }
            });
        }
    })
    .catch(err => {
        console.error('Error updating settings:', err);
        showToast('Failed to update settings', 'error');
    })
    .finally(() => {
        hideSettingsModal();
    });
}

function applyTheme(theme) {
    document.body.classList.toggle('light-theme', theme === 'light');
    document.body.classList.toggle('dark-theme', theme !== 'light');
}

// Helper functions
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function configureMarked() {
  marked.setOptions({
      renderer: new marked.Renderer(),
      highlight: (code, language) => {
          const validLang = language && hljs.getLanguage(language) ? language : 'plaintext';
          return hljs.highlight(code, { language: validLang }).value;
      },
      breaks: true,
      gfm: true,
      sanitize: false // Allow HTML tags
  });
}

function resetUI() {
    chatList.innerHTML = '';
    messagesDiv.innerHTML = '';
    showWelcomeScreen();
}

function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function setupEventListeners() {
    // Authentication
    authSwitchLink.addEventListener('click', toggleAuthMode);
    authForm.addEventListener('submit', handleAuth);

    // Message input
    messageInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = `${messageInput.scrollHeight}px`;
        sendButton.disabled = messageInput.value.trim() === '';
    });

    // Button clicks
    sendButton.addEventListener('click', sendMessage);
    newChatBtn.addEventListener('click', createNewChat);
    clearChatsBtn.addEventListener('click', clearAllChats);
    settingsBtn.addEventListener('click', showSettingsModal);
    logoutBtn.addEventListener('click', logout);
    renameChatBtn.addEventListener('click', () => showRenameModal(currentChatId, currentChatTitle.textContent));

    // Forms
    settingsForm.addEventListener('submit', updateSettings);
    renameForm.addEventListener('submit', renameChat);

    // Close handlers
    closeButtons.forEach(button => {
        button.addEventListener('click', () => button.closest('.modal').classList.remove('active'));
    });

    window.addEventListener('click', e => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}