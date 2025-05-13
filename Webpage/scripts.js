// Global variables
let currentUser = null;
let currentChatId = null;
let chats = [];
let typingTimer = null;
let isGenerating = false;
let currentConfirmCallback = null; // For custom confirm dialog
let isAuthenticated = false; // Flag to track if user is authenticated

// DOM Elements
const authModal = document.getElementById('auth-modal');
const settingsModal = document.getElementById('settings-modal');
const renameModal = document.getElementById('rename-modal');
const confirmModal = document.getElementById('confirm-modal');
let messageInput = document.getElementById('message-input');
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
const authToggle = document.getElementById('auth-toggle');
const toggleSlider = document.querySelector('.toggle-slider');
const loginOption = document.querySelector('.toggle-option.login');
const registerOption = document.querySelector('.toggle-option.register');
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

// Confirm dialog elements
const confirmTitle = document.getElementById('confirm-title');
const confirmMessage = document.getElementById('confirm-message');
const confirmOkBtn = document.getElementById('confirm-ok');
const confirmCancelBtn = document.getElementById('confirm-cancel');

// DOM Elements - Add new elements
const markdownToolbar = document.querySelector('.markdown-toolbar');
const formatButtons = document.querySelectorAll('.format-btn');
const shortcutsBtn = document.getElementById('shortcuts-btn');
const shortcutsModal = document.getElementById('shortcuts-modal');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const voiceInputBtn = document.getElementById('voice-input-btn');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Initialize font size defaults - ensures CSS class is applied right away
    document.body.classList.add('font-medium');
    
    // Force sidebar to compact mode
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.add('compact');
        document.documentElement.style.setProperty('--sidebar-width', '60px');
    }
    
    // Create the sidebar structure with circular new chat button and chats label
    initializeSidebarHeader();
    
    // Check auth status and set up event listeners
    checkAuthStatus();
    setupEventListeners();
    configureMarked();
    
    // Initialize all dynamic UI components
    setTimeout(() => {
        initializeInputArea();
        setupSettingsTabNavigation();
        setupThemePreviews();
        setupRangeSliders();
        setupKeyboardShortcuts();
        setupMarkdownToolbar();
        setupVoiceInput();
    }, 300);
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
                isAuthenticated = true;
                hideAuthModal();
                fetchUserData();
                loadChats();
            } else {
                isAuthenticated = false;
                showAuthModal();
            }
        })
        .catch(() => {
            isAuthenticated = false;
            showAuthModal();
        });
}

// Modal show function with theme support
function showModal(modal) {
    if (!modal) return;
    
    // Ensure the modal inherits current theme before showing
    document.body.classList.add('theme-transition');
    
    // Apply current theme colors to modal
    if (modal.classList.contains('modal')) {
        // Update any theme-dependent elements in the modal
        const themeColor = document.body.getAttribute('data-theme') || 'blue';
        const isLightTheme = document.body.classList.contains('light-theme');
        
        // Add theme information to modal for CSS targeting
        modal.setAttribute('data-theme', themeColor);
        modal.classList.toggle('light-theme', isLightTheme);
        
        // Show modal after brief delay to allow theme transition
        setTimeout(() => {
            modal.classList.add('active');
            document.body.classList.remove('theme-transition');
        }, 50);
    }
}

// Update show functions for all modals
function showAuthModal() {
    authTitle.textContent = 'Login'; // Reset to login mode
    authSubmit.textContent = 'Login';
    confirmPasswordGroup.classList.add('hidden');
    
    // Reset active state in toggle
    loginOption.classList.add('active');
    registerOption.classList.remove('active');
    
    // Clear form
    username.value = '';
    password.value = '';
    confirmPassword.value = '';
    
    // Show the modal
    showModal(authModal);
    
    // Focus the username field
    setTimeout(() => {
        username.focus();
    }, 300);
    
    document.body.style.overflow = 'hidden';
}

function showSettingsModal() {
    showModal(settingsModal);
    
    // Load all settings from currentUser object
    if (!currentUser) return;
    
    // Initialize base theme
    themeSelect.value = currentUser.theme || 'dark';
    
    // Initialize model
    modelSelect.value = currentUser.model || 'gemma3:1b';
    
    // Set active theme preview based on saved colorTheme
    const colorTheme = currentUser.colorTheme || 'blue';
    const themePreviews = document.querySelectorAll('.theme-preview');
    themePreviews.forEach(preview => {
        const themeValue = preview.dataset.theme.split('-')[1];
        preview.classList.toggle('active', themeValue === colorTheme);
    });
    
    // Initialize toggles from saved settings
    const animationsToggle = document.getElementById('animations-toggle');
    if (animationsToggle) {
        animationsToggle.checked = currentUser.animations !== false;
    }
    
    const lineNumbersToggle = document.getElementById('line-numbers-toggle');
    if (lineNumbersToggle) {
        lineNumbersToggle.checked = currentUser.showLineNumbers !== false;
    }
    
    const autoScrollToggle = document.getElementById('auto-scroll-toggle');
    if (autoScrollToggle) {
        autoScrollToggle.checked = currentUser.autoScroll !== false;
    }
    
    // Initialize font size from saved settings
    const fontSizeSelect = document.getElementById('font-size-select');
    if (fontSizeSelect) {
        fontSizeSelect.value = currentUser.fontSize || 'medium';
    }
    
    // Initialize compact sidebar from saved settings
    const compactSidebarToggle = document.getElementById('compact-sidebar-toggle');
    if (compactSidebarToggle) {
        compactSidebarToggle.checked = currentUser.compactSidebar === true;
    }
    
    // Clear password fields
    oldPassword.value = '';
    newPassword.value = '';
    confirmNewPassword.value = '';
    
    // Clear delete account password
    const deleteAccountPassword = document.getElementById('delete-account-password');
    if (deleteAccountPassword) {
        deleteAccountPassword.value = '';
    }
    
    // Make sure the first tab is active by removing active class from all
    // tabs first and then adding it to the first tab
    const navItems = document.querySelectorAll('.settings-nav-item');
    const sections = document.querySelectorAll('.settings-section');
    
    // First, remove active class from all tabs and sections
    navItems.forEach(navItem => navItem.classList.remove('active'));
    sections.forEach(section => section.classList.remove('active'));
    
    // Then activate the first tab and section
    if (navItems.length > 0) navItems[0].classList.add('active');
    if (sections.length > 0) sections[0].classList.add('active');
}

function showRenameModal(chatId, title) {
    if (chatId) {
        showModal(renameModal);
        newChatTitle.value = title || '';
        newChatTitle.dataset.chatId = chatId;
    }
}

// Update close functions for all modals
function hideAuthModal() {
    // Only hide the auth modal if user is authenticated
    if (isAuthenticated) {
        authModal.classList.remove('active');
        document.body.style.overflow = '';
        resetAuthForm();
    }
}

function hideSettingsModal() {
    settingsModal.classList.remove('active');
    settingsForm.reset();
}

function hideRenameModal() {
    renameModal.classList.remove('active');
    renameForm.reset();
}

function resetAuthForm() {
    authForm.reset();
    password.value = '';
    confirmPassword.value = '';
}

function toggleAuthMode() {
    const isLogin = authTitle.textContent === 'Login';
    
    // Add transition class for smooth animation
    authForm.classList.add('auth-transitioning');
    
    // Update active tab styling instead of moving a slider
    loginOption.classList.toggle('active', !isLogin);
    registerOption.classList.toggle('active', isLogin);
    
    // Use setTimeout to allow animation to complete
    setTimeout(() => {
        authTitle.textContent = isLogin ? 'Register' : 'Login';
        authSubmit.textContent = isLogin ? 'Register' : 'Login';
        confirmPasswordGroup.classList.toggle('hidden', !isLogin);
        
        // Add form field animation
        const formFields = authForm.querySelectorAll('.form-group');
        formFields.forEach(field => {
            field.classList.add('form-scale-animation');
            setTimeout(() => field.classList.remove('form-scale-animation'), 300);
        });
        
        // Remove transition class after animation
        setTimeout(() => {
            authForm.classList.remove('auth-transitioning');
            authForm.classList.add('auth-visible');
            setTimeout(() => authForm.classList.remove('auth-visible'), 300);
        }, 1500);
    }, 150);
}

function handleAuth(event) {
    event.preventDefault();
    const isLogin = authTitle.textContent === 'Login';
    const usernameValue = username.value.trim();
    const passwordValue = password.value;

    // Enhanced client-side validation
    if (!usernameValue) {
        showToast('Username is required', 'error');
        username.focus();
        return;
    }
    
    if (!passwordValue) {
        showToast('Password is required', 'error');
        password.focus();
        return;
    }

    if (!isLogin) {
        if (confirmPassword.value === '') {
            showToast('Please fill the confirm password field', 'error');
            confirmPassword.focus();
            return;
        }
        
        if (passwordValue !== confirmPassword.value) {
            showToast('Passwords do not match', 'error');
            confirmPassword.focus();
            return;
        }
        
        if (passwordValue.length < 6) {
            showToast('Password must be at least 6 characters long', 'error');
            password.focus();
            return;
        }
    }

    // Show loading indicator in button
    const originalButtonText = authSubmit.innerHTML;
    authSubmit.innerHTML = '<div class="spinner"></div>';
    authSubmit.disabled = true;

    fetch(isLogin ? '/api/login' : '/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameValue, password: passwordValue }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        // Reset button state
        authSubmit.innerHTML = originalButtonText;
        authSubmit.disabled = false;
        
        if (data.success) {
            currentUser = data.user || { username: usernameValue };
            isAuthenticated = true;
            hideAuthModal();
            showToast(isLogin ? 'Successfully logged in' : 'Account created successfully', 'success');
            updateUIAfterLogin(currentUser);
            loadChats();
        } else {
            // Improved error message mapping
            let errorMessage = data.message;
            if (data.error === 'user_exists') {
                errorMessage = 'Account with this username already exists';
            } else if (data.error === 'user_not_found') {
                errorMessage = 'Account doesn\'t exist in the database';
            } else if (data.error === 'invalid_password') {
                errorMessage = 'Password is incorrect';
            } else if (data.error === 'validation_error') {
                errorMessage = data.message || 'Invalid username or password format';
            }
            
            showToast(errorMessage, 'error');
        }
    })
    .catch(err => {
        // Reset button state
        authSubmit.innerHTML = originalButtonText;
        authSubmit.disabled = false;
        
        console.error('Auth error:', err);
        showToast('Connection error. Please try again later.', 'error');
    });
}

function fetchUserData() {
    fetch('/api/current_user', {
        method: 'GET',
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
    
    console.log('Loaded user settings:', user);
    
    // Apply theme if available
    if (user.theme) {
        applyTheme(user.theme || 'dark');
        console.log('Applied base theme from user settings:', user.theme);
    }
    
    // Apply color theme if available
    if (user.colorTheme) {
        console.log('Setting color theme from user settings:', user.colorTheme);
        document.body.setAttribute('data-theme', user.colorTheme);
        
        // Also highlight the correct theme preview
        const previewSelector = `.theme-preview[data-theme="dark-${user.colorTheme}"]`;
        console.log('Looking for theme preview with selector:', previewSelector);
        const activePreview = document.querySelector(previewSelector);
        if (activePreview) {
            console.log('Found matching theme preview, activating it');
            document.querySelectorAll('.theme-preview').forEach(preview => {
                preview.classList.remove('active');
            });
            activePreview.classList.add('active');
        } else {
            console.warn('No matching theme preview found for:', previewSelector);
        }
    } else {
        console.warn('No color theme in user settings, fallback to default blue theme');
        document.body.setAttribute('data-theme', 'blue');
    }
    
    // Apply model settings
    updateModelDisplay(user.model || 'gemma3:1b');
    
    // Apply all UI settings with defaults for missing values
    toggleGlassmorphism(true); // Always enable glassmorphism
    toggleAnimations(user.animations !== false);
    
    // Apply font size settings
    if (user.fontSize) {
        changeFontSize(user.fontSize);
        
        // Apply class-based font sizing for better control
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        document.body.classList.add(`font-${user.fontSize}`);
        
        // Add direct styling for maximum compatibility
        const fontSizes = {
            small: '14px',
            medium: '16px',
            large: '18px'
        };
        document.body.style.fontSize = fontSizes[user.fontSize] || '16px';
        
        console.log(`Applied font size: ${user.fontSize} (${fontSizes[user.fontSize] || '16px'})`);
    } else {
        // Default to medium if no font size specified
        changeFontSize('medium');
        document.body.classList.add('font-medium');
        document.body.style.fontSize = '16px';
    }
    
    // Always force sidebar compact mode regardless of user setting
    console.log('Forcing sidebar to compact mode');
    // Set user setting to true for consistency
    user.compactSidebar = true;
    toggleCompactSidebar(true);
    
    // Force apply the class directly to ensure it takes effect
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.add('compact');
        console.log('Applied compact class directly to sidebar');
    }
    
    // Force all other settings to appropriate defaults if missing
    if (user.showLineNumbers === undefined) user.showLineNumbers = true;
    if (user.autoScroll === undefined) user.autoScroll = true;
    
    // Store these settings in currentUser for access throughout the app
    currentUser = {
        ...user,
        theme: user.theme || 'dark',
        colorTheme: user.colorTheme || 'blue',
        model: user.model || 'gemma3:1b',
        compactSidebar: true, // Always true
        glassmorphism: true, // Always true
        animations: user.animations !== false,
        fontSize: user.fontSize || 'medium',
        showLineNumbers: user.showLineNumbers !== false,
        autoScroll: user.autoScroll !== false
    };
}

function updateUserDisplay() {
    if (currentUser) {
        document.getElementById('username-display').textContent = currentUser.username;
    }
}

function updateModelDisplay(modelName) {
    // Map of model identifiers to display names
    const modelDisplayMap = {
        'mistral:latest': 'Mistral',
        'gemma3:1b': 'Gemma',
        'tinyllama:latest': 'TinyLlama',
        'phi3:3.8b': 'Phi3',
        'phi:latest': 'Phi2',
        'deepseek-coder:latest': 'DeepSeek Coder',
        'deepseek-r1:8b': 'DeepSeek',
        'tinystories': 'TinyStories',
        'llama2-uncensored': 'Llama2 Uncensored',
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
    
    // For backward compatibility, support old model names
    const legacyModelMap = {
        'mistral': 'Mistral',
        'gemma': 'Gemma',
        'tinyllama': 'TinyLlama',
        'phi3': 'Phi3',
        'phi': 'Phi2'
    };
        
    const displayElement = document.getElementById('current-model-display');
    if (displayElement) {
        // Try to get display name from the map, falling back to the full model name
        // First check new format, then legacy format
        const displayName = modelDisplayMap[modelName] || 
                           legacyModelMap[modelName] || 
                           modelName.split(':')[0] || 
                           'Gemma';
        
        displayElement.textContent = displayName;
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
            isAuthenticated = false;
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

// Update the renderChatList function to add chat count correctly
function renderChatList() {
    chatList.innerHTML = '';
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
        chatItem.dataset.id = chat.id;
        
        // Check if sidebar is in compact mode
        const isCompact = document.querySelector('.sidebar.compact') !== null;
        
        // Always add message icon to ensure consistency across themes/modes
        const icon = document.createElement('i');
        icon.className = 'fas fa-message';
        chatItem.appendChild(icon);
        
        // Add tooltip for both compact and regular modes for consistency
        const safeTitle = escapeHTML(chat.title || 'Chat');
        chatItem.setAttribute('data-tooltip', safeTitle);
        
        // Create content div with title
        const contentDiv = document.createElement('div');
        contentDiv.className = 'chat-item-content';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'chat-item-title';
        titleDiv.textContent = chat.title;
        contentDiv.appendChild(titleDiv);
        
        chatItem.appendChild(contentDiv);
        
        // Add action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'chat-item-actions';
        
        // Rename button
        const renameBtn = document.createElement('button');
        renameBtn.className = 'rename-chat';
        renameBtn.title = 'Rename';
        renameBtn.innerHTML = '<i class="fas fa-edit"></i>';
        renameBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showRenameModal(chat.id, chat.title);
        });
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-chat';
        deleteBtn.title = 'Delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        });
        
        actionsDiv.appendChild(renameBtn);
        actionsDiv.appendChild(deleteBtn);
        chatItem.appendChild(actionsDiv);
        
        // Main chat item click event
        chatItem.addEventListener('click', (e) => {
            // Don't trigger if clicking the action buttons
            if (!e.target.closest('.chat-item-actions')) {
                loadChat(chat.id);
            }
        });
        
        chatList.appendChild(chatItem);
    });
    
    // Apply staggered animation delays
    applyStaggeredAnimationDelays();
}

function createNewChat() {
    // Disable all buttons during creation to prevent multiple clicks
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(btn => btn.disabled = true);

    // Create a loading indicator to show something is happening
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    loadingDiv.innerHTML = '<div class="spinner"></div><span>Creating new chat...</span>';
    messagesDiv.innerHTML = '';
    messagesDiv.appendChild(loadingDiv);
    messagesDiv.style.display = 'flex';
    welcomeScreen.style.display = 'none';

    fetch('/api/new_chat', {
        method: 'POST',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Remove loading indicator
            loadingDiv.remove();
            
            // Create the new chat data object
            const newChat = { id: data.chat_id, title: data.title };
            
            // Add to the beginning of chats array
            chats.unshift(newChat);
            
            // Set current chat ID
            currentChatId = newChat.id;
            
            // Force a complete rebuild of the chat list with direct DOM manipulation
            // instead of using renderChatList to ensure we're not hitting any issues with that function
            rebuildChatList();
            
            // Update UI elements
            renameChatBtn.classList.remove('hidden');
            currentChatTitle.textContent = data.title;
            
            // Show welcome screen in the empty chat
            welcomeScreen.style.display = 'flex';
            welcomeScreen.classList.add('in-conversation');
            messagesDiv.style.display = 'flex';
            
            // Make sure the input container is visible
            const inputContainer = document.querySelector('.input-container');
            if (inputContainer) {
                inputContainer.style.display = '';
            }
            
            // Initialize the input area with all event listeners
            initializeInputArea();
            
            // Scroll to bottom
            scrollToBottom();
            
            // Re-enable buttons
            allButtons.forEach(btn => btn.disabled = false);
        } else {
            // Remove loading indicator
            loadingDiv.remove();
            
            showToast('Failed to create new chat', 'error');
            // Re-enable buttons on failure
            allButtons.forEach(btn => btn.disabled = false);
        }
    })
    .catch(err => {
        // Remove loading indicator
        if (loadingDiv.parentNode) {
            loadingDiv.remove();
        }
        
        console.error('Error creating new chat:', err);
        showToast('Failed to create new chat', 'error');
        // Re-enable buttons on failure
        allButtons.forEach(btn => btn.disabled = false);
    });
}

// New function to completely rebuild the chat list
function rebuildChatList() {
    // Clear the chat list
    chatList.innerHTML = '';
    
    // Check for compact mode
    const isCompact = document.querySelector('.sidebar.compact') !== null;
    
    // Manually build each chat item
    chats.forEach(chat => {
        // Create chat item
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
        chatItem.dataset.id = chat.id;
        
        // Always add message icon for consistency
        const icon = document.createElement('i');
        icon.className = 'fas fa-message';
        chatItem.appendChild(icon);
        
        // Add tooltip
        chatItem.setAttribute('data-tooltip', escapeHTML(chat.title || 'New Chat'));
        
        // Create content div
        const contentDiv = document.createElement('div');
        contentDiv.className = 'chat-item-content';
        
        // Add title div
        const titleDiv = document.createElement('div');
        titleDiv.className = 'chat-item-title';
        titleDiv.textContent = chat.title;
        contentDiv.appendChild(titleDiv);
        chatItem.appendChild(contentDiv);
        
        // Create actions div
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'chat-item-actions';
        
        // Add rename button
        const renameBtn = document.createElement('button');
        renameBtn.className = 'rename-chat';
        renameBtn.title = 'Rename';
        renameBtn.innerHTML = '<i class="fas fa-edit"></i>';
        renameBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showRenameModal(chat.id, chat.title);
        });
        actionsDiv.appendChild(renameBtn);
        
        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-chat';
        deleteBtn.title = 'Delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        });
        actionsDiv.appendChild(deleteBtn);
        chatItem.appendChild(actionsDiv);
        
        // Add click handler
        chatItem.addEventListener('click', (e) => {
            if (!e.target.closest('.chat-item-actions')) {
                loadChat(chat.id);
            }
        });
        
        // Add to chat list
        chatList.appendChild(chatItem);
    });
    
    // Apply animation delays
    applyStaggeredAnimationDelays();
}

function loadChat(chatId) {
    currentChatId = chatId;
    renameChatBtn.classList.remove('hidden');
    messagesDiv.innerHTML = '';
    
    // Make sure messages container is displayed
    messagesDiv.style.display = 'flex';
    
    // Make sure the input container is visible
    const inputContainer = document.querySelector('.input-container');
    if (inputContainer) {
        inputContainer.style.display = '';
    }

    // Clear any file attachments
    const fileInputEl = document.getElementById('file-input');
    const filePreviewEl = document.getElementById('file-preview');
    const fileNameEl = document.getElementById('file-name');
    const fileContentPreviewEl = document.getElementById('file-content-preview');
    
    if (fileInputEl) fileInputEl.value = '';
    if (filePreviewEl) filePreviewEl.classList.add('hidden');
    if (fileNameEl) fileNameEl.textContent = '';
    if (fileContentPreviewEl) fileContentPreviewEl.textContent = '';

    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === chatId);
    });

    // Disable UI during loading
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(btn => btn.disabled = true);

    fetch(`/api/get_chat/${chatId}`, { credentials: 'include' })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentChatTitle.textContent = data.chat.title;
            
            // Check if the chat has any messages
            if (data.chat.messages && data.chat.messages.length > 0) {
                // Has messages, hide welcome screen
                welcomeScreen.style.display = 'none';
                data.chat.messages.forEach(addMessageToUI);
            } else {
                // Empty chat, show welcome screen inside the messages container
                welcomeScreen.style.display = 'flex';
                welcomeScreen.classList.add('in-conversation');
            }
            
            scrollToBottom();
            
            // Initialize input area after chat is loaded
            initializeInputArea();
        } else {
            showToast('Failed to load chat', 'error');
            allButtons.forEach(btn => btn.disabled = false);
        }
    })
    .catch(err => {
        console.error('Error loading chat:', err);
        showToast('Failed to load chat', 'error');
        allButtons.forEach(btn => btn.disabled = false);
    });
}

function showWelcomeScreen() {
    // Force reset of chat state
    currentChatId = null;
    messagesDiv.innerHTML = '';
    messagesDiv.style.display = 'none';
    welcomeScreen.style.display = 'flex';
    welcomeScreen.classList.remove('in-conversation');
    currentChatTitle.textContent = 'New Chat';
    renameChatBtn.classList.add('hidden');
    
    // Clear any file attachments
    const fileInputEl = document.getElementById('file-input');
    const filePreviewEl = document.getElementById('file-preview');
    const fileNameEl = document.getElementById('file-name');
    const fileContentPreviewEl = document.getElementById('file-content-preview');
    
    if (fileInputEl) fileInputEl.value = '';
    if (filePreviewEl) filePreviewEl.classList.add('hidden');
    if (fileNameEl) fileNameEl.textContent = '';
    if (fileContentPreviewEl) fileContentPreviewEl.textContent = '';
    
    // Verify that chats actually exist on the server to prevent stale references
    fetch('/api/get_chats', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update chats array with server data
                chats = data.chats || [];
                console.log('Welcome screen loaded with', chats.length, 'chats');
                
                // If no chats, ensure we're in the proper welcome state
                if (chats.length === 0) {
                    currentChatId = null;
                    renderChatList();
                    
                    // Force clean state
                    document.querySelectorAll('.chat-item').forEach(item => {
                        item.classList.remove('active');
                    });
                }
            }
        })
        .catch(err => {
            console.error('Error fetching chats:', err);
            // If we can't fetch chats, assume no chats for safety
            chats = [];
            renderChatList();
        })
        .finally(() => {
            // Always initialize input area to ensure it's ready
            initializeInputArea();
        });
}

// Show typing indicator with pulsating dots
function showTypingIndicator() {
    removeTypingIndicator(); // Remove any existing indicator
    
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.id = 'typing-indicator';
    typingIndicator.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;
    
    messagesDiv.appendChild(typingIndicator);
    scrollToBottom();
}

// Remove typing indicator
function removeTypingIndicator() {
    const existingIndicator = document.getElementById('typing-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
}

// Update the sendMessage function to handle file uploads and handle missing chat ID
function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    if (!message) return;

    // Verify currentChatId is still valid by checking if it exists in the chats array
    if (currentChatId) {
        const chatExists = chats.some(chat => chat.id === currentChatId);
        if (!chatExists) {
            console.log('Current chat ID no longer exists, resetting to null');
            currentChatId = null;
        }
    }
    
    // Additional check: If we have no chats locally but have a currentChatId, something's wrong
    if (currentChatId && chats.length === 0) {
        console.log('Inconsistent state: currentChatId exists but chats array is empty, resetting');
        currentChatId = null;
        
        // Force verification of chats from server
        fetch('/api/get_chats', { credentials: 'include' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    chats = data.chats || [];
                    console.log('Refreshed chats from server, found', chats.length, 'chats');
                }
            })
            .catch(err => {
                console.error('Error verifying chats:', err);
            });
    }
    
    // Clear input and reset height
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // Add user message to UI
    const userMessage = {
        role: 'user',
        content: message,
        timestamp: Date.now() / 1000
    };
    addMessageToUI(userMessage);
    
    // Disable the send button while processing
    const sendButton = document.getElementById('send-button');
    if (sendButton) sendButton.disabled = true;
    
    // Show typing indicator
    showTypingIndicator();
    
    // Check if a file is attached
    const fileInput = document.getElementById('file-input');
    let fileContent = null;
    let fileName = null;
    
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        fileName = file.name;
        
        // Clear file input and preview
        document.getElementById('file-preview').classList.add('hidden');
        fileInput.value = '';
        
        // Read file content
        const reader = new FileReader();
        reader.onload = function(e) {
            fileContent = e.target.result;
            
            // Format message with file content
            const messageWithFile = `${message}\n\n---\nAttached File: ${fileName}\n\`\`\`\n${fileContent}\n\`\`\``;
            
            // Check if we need to create a new chat
            if (!currentChatId) {
                createNewChatForMessage(messageWithFile);
            } else {
                sendMessageToServer(messageWithFile);
            }
        };
        reader.readAsText(file);
    } else {
        // Check if we need to create a new chat
        if (!currentChatId) {
            createNewChatForMessage(message);
        } else {
            sendMessageToServer(message);
        }
    }
    
    // Scroll to bottom
    scrollToBottom();
}

// Creates a new chat and sends the message
function createNewChatForMessage(message) {
    // Reset application state to ensure we're working with a clean slate
    const lastDeletedChatId = localStorage.getItem('last_deleted_chat');
    const lastDeletionTime = localStorage.getItem('last_deletion_time');
    
    // If we deleted a chat very recently, make extra sure currentChatId is cleared
    if (lastDeletedChatId && lastDeletionTime) {
        const timeSinceDeletion = Date.now() - parseInt(lastDeletionTime);
        if (timeSinceDeletion < 10000) { // Within last 10 seconds
            console.log('Recent chat deletion detected, ensuring clean state');
            currentChatId = null;
        }
    }
    
    // First refresh the chats list to make sure we have the latest data
    fetch('/api/get_chats', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update chats array with server data
                chats = data.chats || [];
                
                // Double check that currentChatId is null
                if (currentChatId) {
                    console.warn('currentChatId should be null when creating new chat, forcing reset');
                    currentChatId = null;
                }
                
                // Now create the new chat
                createActualNewChat(message);
            } else {
                removeTypingIndicator();
                showToast('Failed to refresh chats list', 'error');
            }
        })
        .catch(error => {
            console.error('Error refreshing chats list:', error);
            removeTypingIndicator();
            // Force reset currentChatId just to be safe
            currentChatId = null;
            // Continue anyway to try to create the chat
            createActualNewChat(message);
        });
}

// Helper function to actually create the new chat
function createActualNewChat(message) {
    fetch('/api/new_chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentChatId = data.chat_id;
            
            // Add new chat to list
            const newChat = {
                id: data.chat_id,
                title: 'New Chat',
                timestamp: Date.now()
            };
            
            // Add to chats array and update UI
            chats.unshift(newChat);
            
            // Update chat list in sidebar
            renderChatList();
            
            // Set current chat as active in sidebar
            document.querySelectorAll('.chat-item').forEach(item => {
                item.classList.toggle('active', item.dataset.id === currentChatId);
            });
            
            // Update UI to show we're in a chat now
            renameChatBtn.classList.remove('hidden');
            currentChatTitle.textContent = 'New Chat';
            welcomeScreen.style.display = 'none';
            messagesDiv.style.display = 'flex';
            
            // Now send the message
            sendMessageToServer(message);
        } else {
            removeTypingIndicator();
            showToast('Failed to create new chat', 'error');
        }
    })
    .catch(error => {
        console.error('Error creating chat:', error);
        removeTypingIndicator();
        showToast('Error creating chat', 'error');
    });
}

// Update the sendMessageToServer function to handle typing indicator
function sendMessageToServer(message, fileContent = null, fileName = null) {
    if (!currentChatId) {
        console.error('No current chat ID');
        removeTypingIndicator();
        return;
    }
    
    const payload = {
        chat_id: currentChatId,
        message: message
    };
    
    // Add file data if available
    if (fileContent) {
        payload.file_content = fileContent;
        payload.file_name = fileName;
    }
    
    fetch('/api/send_message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        // Remove typing indicator before adding AI response
        removeTypingIndicator();
        
        if (data.success) {
            // Add the assistant's message to the UI
            addMessageToUI(data.message);
            
            // Update chat title if provided in the response
            if (data.title) {
                // Update the title in the UI
                document.getElementById('current-chat-title').textContent = data.title;
                
                // Find the current chat in the array and update its title
                const currentChatIndex = chats.findIndex(chat => chat.id === currentChatId);
                if (currentChatIndex !== -1) {
                    chats[currentChatIndex].title = data.title;
                    
                    // Update the chat list to show the new title
                    renderChatList();
                    
                    // Make sure the current chat is still marked as active
                    document.querySelectorAll('.chat-item').forEach(item => {
                        item.classList.toggle('active', item.dataset.id === currentChatId);
                    });
                }
            }
            
            // Scroll to bottom to show latest message
            scrollToBottom();
            
            // Ensure the input is properly reset and focused
            resetMessageInput();
        } else {
            showToast('Failed to send message', 'error');
            resetMessageInput();
        }
    })
    .catch(error => {
        console.error('Error sending message:', error);
        removeTypingIndicator();
        showToast('Error sending message', 'error');
        resetMessageInput();
    });
}

function addMessageToUI(message) {
    // If this is the first message, hide the welcome screen
    if (messagesDiv.children.length === 0 || messagesDiv.querySelector('.message') === null) {
        welcomeScreen.style.display = 'none';
        welcomeScreen.classList.remove('in-conversation');
        // Ensure messages container is visible
        messagesDiv.style.display = 'flex';
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${message.role}`;
    
    // Always store the raw content for both user and AI messages
    messageDiv.dataset.rawContent = message.content;
    
    // Process <think> tags
    const processedContent = message.content
        .replace(/<think>(.*?)<\/think>/gs, '<div class="think-box">$1</div>');
    
    messageDiv.innerHTML = `
        <div class="message-content">${marked.parse(processedContent)}</div>
        <div class="message-reactions">
            ${message.role === 'assistant' ? `
            <button class="reaction-btn" data-reaction="thumbs-up">
                <i class="fas fa-thumbs-up"></i>
                <span class="reaction-count">0</span>
            </button>
            <button class="reaction-btn" data-reaction="thumbs-down">
                <i class="fas fa-thumbs-down"></i>
                <span class="reaction-count">0</span>
            </button>
            <button class="reaction-btn" data-reaction="copy" title="Copy raw AI response to clipboard">
                <i class="fas fa-copy"></i>
            </button>
            <button class="reaction-btn" data-reaction="regenerate" title="Regenerate response">
                <i class="fas fa-redo-alt"></i>
            </button>
            ` : ''}
        </div>
    `;
    
    messagesDiv.appendChild(messageDiv);
    messageDiv.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
    
    // Double check that the message is visible and in the DOM
    if (!messageDiv.parentNode) {
        console.warn('Message not properly added to DOM, retrying');
        messagesDiv.appendChild(messageDiv);
    }
    
    // Scroll to the latest message
    scrollToBottom();
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
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        // Add fade out animation
        indicator.style.opacity = '0';
        indicator.style.transform = 'translateY(10px)';
        indicator.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        // Remove after animation completes
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 300);
    }
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Chat management functions
function showRenameModal(chatId, title) {
    if (chatId) {
        showModal(renameModal);
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

// Custom confirm dialog function
function showConfirmDialog(message, title, callback) {
    currentConfirmCallback = callback;
    
    if (title) confirmTitle.textContent = title;
    else confirmTitle.textContent = 'Confirm Action';
    
    confirmMessage.textContent = message;
    confirmModal.classList.add('active');
    
    // Setup keyboard handler
    const confirmKeyHandler = (e) => {
        if (e.key === 'Escape') {
            if (currentConfirmCallback) currentConfirmCallback(false);
            hideConfirmDialog();
            document.removeEventListener('keydown', confirmKeyHandler);
        } else if (e.key === 'Enter') {
            if (currentConfirmCallback) currentConfirmCallback(true);
            hideConfirmDialog();
            document.removeEventListener('keydown', confirmKeyHandler);
        }
    };
    
    // Add keyboard event listener
    document.addEventListener('keydown', confirmKeyHandler);
    
    // Focus the cancel button for safety
    setTimeout(() => {
        try {
            confirmCancelBtn.focus();
        } catch (e) {
            console.error('Focus error:', e);
        }
    }, 100);
}

function hideConfirmDialog() {
    confirmModal.classList.remove('active');
    currentConfirmCallback = null;
}

function deleteChat(chatId) {
    // Use custom confirm dialog instead of native confirm
    showConfirmDialog('Are you sure you want to delete this chat?', 'Delete Chat', (confirmed) => {
        if (!confirmed) return;
        
        // Disable UI elements during deletion to prevent race conditions
        const allButtons = document.querySelectorAll('button');
        allButtons.forEach(btn => btn.disabled = true);
        
        // Get the input container to rebuild later
        const inputContainer = document.querySelector('.input-container');
        if (inputContainer) {
            // Save current model display text
            const currentModelDisplay = document.getElementById('current-model-display');
            const modelDisplayText = currentModelDisplay ? currentModelDisplay.textContent : '';
            
            // Clear input container content completely
            inputContainer.innerHTML = `
                <div class="input-wrapper">
                    <button id="attach-file-btn" class="attach-button">
                        <i class="fas fa-paperclip"></i>
                    </button>
                    <textarea id="message-input" placeholder="Send a message..." rows="1"></textarea>
                    <button id="send-button" disabled>
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
                <div id="file-preview" class="file-preview hidden">
                    <div class="file-preview-header">
                        <span id="file-name">filename.txt</span>
                        <button id="remove-file-btn" class="remove-file-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div id="file-content-preview" class="file-content-preview">
                        File content preview...
                    </div>
                </div>
                <input type="file" id="file-input" class="hidden" accept=".txt,.js,.py,.html,.css,.json,.md,.csv">
                <div class="input-info">
                    <p>AI Model: <span id="current-model-display">${modelDisplayText}</span></p>
                </div>
            `;
        }

        fetch('/api/delete_chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId }),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update chats array
                chats = chats.filter(chat => chat.id !== chatId);
                
                // Update DOM
                const wasCurrent = chatId === currentChatId;
                
                // IMPORTANT: Forcefully reset currentChatId to null
                currentChatId = null;
                
                // Re-render chat list first
                renderChatList();
                
                // Check if we just deleted the last chat
                const isLastChat = chats.length === 0;
                
                // Then decide what to show next
                if (wasCurrent) {
                    if (isLastChat) {
                        // We just deleted the last chat - force welcome screen and reset state
                        showWelcomeScreen();
                        
                        // Force UI refresh
                        localStorage.setItem('last_deleted_chat', chatId);
                        localStorage.setItem('last_deletion_time', Date.now());
                        
                        // Make sure model display is correct
                        if (currentUser && currentUser.model) {
                            updateModelDisplay(currentUser.model);
                        }
                        
                        // Re-enable buttons
                        allButtons.forEach(btn => btn.disabled = false);
                        
                        // Initialize input area with fresh event listeners
                        initializeInputArea();
                    } else {
                        // Other chats exist, load the first one
                        currentChatId = chats[0].id; // Set this before loading
                        messagesDiv.innerHTML = '';
                        welcomeScreen.style.display = 'none';
                        messagesDiv.style.display = 'flex';
                        
                        document.querySelectorAll('.chat-item').forEach(item => {
                            item.classList.toggle('active', item.dataset.id === currentChatId);
                        });
                        
                        // Load selected chat
                        fetch(`/api/get_chat/${currentChatId}`, { credentials: 'include' })
                        .then(response => response.json())
                        .then(chatData => {
                            if (chatData.success) {
                                currentChatTitle.textContent = chatData.chat.title;
                                chatData.chat.messages.forEach(addMessageToUI);
                                scrollToBottom();
                                
                                // Make sure model display is correct
                                if (currentUser && currentUser.model) {
                                    updateModelDisplay(currentUser.model);
                                }
                                
                                // Re-enable UI after everything is loaded
                                initializeInputArea();
                            }
                        })
                        .catch(() => {
                            showToast('Failed to load chat', 'error');
                            showWelcomeScreen(); 
                        });
                    }
                } else {
                    // Re-enable UI if not the current chat
                    allButtons.forEach(btn => btn.disabled = false);
                }
                
                showToast('Chat deleted successfully', 'success');
            } else {
                showToast('Failed to delete chat', 'error');
                allButtons.forEach(btn => btn.disabled = false);
            }
        })
        .catch(err => {
            console.error('Error deleting chat:', err);
            showToast('Failed to delete chat', 'error');
            allButtons.forEach(btn => btn.disabled = false);
        });
    });
}

// New function to properly initialize the input area with all event listeners
function initializeInputArea() {
    // Get fresh elements
    const sendBtn = document.getElementById('send-button');
    const msgInput = document.getElementById('message-input');
    const attachBtn = document.getElementById('attach-file-btn');
    const removeFileBtn = document.getElementById('remove-file-btn');
    const fileInput = document.getElementById('file-input');
    
    // Clear any existing event listeners by creating new elements
    if (msgInput) {
        const newMsgInput = msgInput.cloneNode(true);
        msgInput.parentNode.replaceChild(newMsgInput, msgInput);
        
        // Add event listeners
        newMsgInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        newMsgInput.addEventListener('input', () => {
            newMsgInput.style.height = 'auto';
            newMsgInput.style.height = `${newMsgInput.scrollHeight}px`;
            
            if (sendBtn) {
                sendBtn.disabled = newMsgInput.value.trim() === '';
            }
        });
        
        // Focus the input
        setTimeout(() => {
            try {
                newMsgInput.focus();
            } catch (e) {
                console.error('Focus error:', e);
            }
        }, 200);
        
        // Update the global reference
        messageInput = newMsgInput;
    }
    
    // Re-add event listener for send button
    if (sendBtn) {
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        newSendBtn.addEventListener('click', sendMessage);
        newSendBtn.disabled = !msgInput || msgInput.value.trim() === '';
    }
    
    // Re-add event listener for attach button
    if (attachBtn) {
        const newAttachBtn = attachBtn.cloneNode(true);
        attachBtn.parentNode.replaceChild(newAttachBtn, attachBtn);
        newAttachBtn.addEventListener('click', () => {
            const fileInputEl = document.getElementById('file-input');
            if (fileInputEl) fileInputEl.click();
        });
    }
    
    // Re-add event listener for remove file button
    if (removeFileBtn) {
        const newRemoveFileBtn = removeFileBtn.cloneNode(true);
        removeFileBtn.parentNode.replaceChild(newRemoveFileBtn, removeFileBtn);
        newRemoveFileBtn.addEventListener('click', () => {
            const fileInputEl = document.getElementById('file-input');
            const filePreviewEl = document.getElementById('file-preview');
            const fileNameEl = document.getElementById('file-name');
            const fileContentPreviewEl = document.getElementById('file-content-preview');
            
            if (fileInputEl) fileInputEl.value = '';
            if (filePreviewEl) filePreviewEl.classList.add('hidden');
            if (fileNameEl) fileNameEl.textContent = '';
            if (fileContentPreviewEl) fileContentPreviewEl.textContent = '';
        });
    }
    
    // Re-add event listener for file input
    if (fileInput) {
        const newFileInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newFileInput, fileInput);
        newFileInput.addEventListener('change', () => {
            const file = newFileInput.files[0];
            if (file && file.size < 500000) {
                const reader = new FileReader();
                reader.onload = () => {
                    const previewEl = document.getElementById('file-preview');
                    const nameEl = document.getElementById('file-name');
                    const contentEl = document.getElementById('file-content-preview');
                    
                    if (previewEl) previewEl.classList.remove('hidden');
                    if (nameEl) nameEl.textContent = file.name;
                    if (contentEl) contentEl.textContent = reader.result;
                };
                reader.readAsText(file);
            }
        });
    }
    
    // Enable all buttons
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(btn => btn.disabled = false);
}

function clearAllChats() {
    // Use custom confirm dialog instead of native confirm
    showConfirmDialog('Are you sure you want to delete all chats? This cannot be undone.', 'Delete All Chats', (confirmed) => {
        if (!confirmed) return;

        fetch('/api/clear_chats', { method: 'POST', credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                chats = [];
                renderChatList();
                showWelcomeScreen();
                
                // Force a complete input reset
                setTimeout(() => {
                    initializeInputArea();
                }, 100);
                
                showToast('All chats cleared successfully', 'success');
            } else {
                showToast('Failed to clear chats', 'error');
            }
        })
        .catch(err => {
            console.error('Error clearing chats:', err);
            showToast('Failed to clear chats', 'error');
            
            // Try to recover UI even on error
            initializeInputArea();
        });
    });
}

// Settings functions
function updateSettings(event) {
    event.preventDefault();
    const theme = themeSelect.value;
    const model = modelSelect.value;
    let oldPasswordValue = oldPassword.value;
    let newPasswordValue = newPassword.value;
    let confirmNewPasswordValue = confirmNewPassword.value;
    
    // Get the selected color theme from the active theme preview
    const activeThemePreview = document.querySelector('.theme-preview.active');
    let colorTheme = 'blue'; // Default fallback
    
    if (activeThemePreview) {
        colorTheme = activeThemePreview.dataset.theme.split('-')[1];
        console.log('Selected color theme:', colorTheme);
        console.log('Theme preview data-theme:', activeThemePreview.dataset.theme);
    } else {
        console.warn('No active theme preview found, using default: blue');
    }
    
    // If light theme is selected, force blue color theme
    if (theme === 'light' && colorTheme !== 'blue') {
        colorTheme = 'blue';
        console.log('Light theme selected, forcing blue color theme');
        // Removing this toast notification to avoid duplication
        // showToast('Light theme only supports blue color scheme', 'info');
    }
    
    // Gather UI settings
    // const glassmorphism = document.getElementById('glassmorphism-toggle').checked;
    const glassmorphism = true; // Always enable glassmorphism
    const animations = document.getElementById('animations-toggle').checked;
    const fontSize = document.getElementById('font-size-select').value;
    const compactSidebar = true; // Always force compact sidebar
    
    // Interface settings
    const showLineNumbers = document.getElementById('line-numbers-toggle').checked;
    const autoScroll = document.getElementById('auto-scroll-toggle').checked;
    
    // Show a loading indicator
    const saveBtn = document.getElementById('settings-submit');
    const originalBtnText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<div class="spinner"></div>';
    saveBtn.disabled = true;

    // Create a settings object with all settings to save
    const settingsToSave = { 
        theme, 
        model,
        colorTheme,
        glassmorphism,
        animations,
        fontSize,
        compactSidebar,
        showLineNumbers,
        autoScroll
    };

    // Save all settings
    fetch('/api/update_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToSave),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUser = data.user;
            
            // Apply theme transition effect for smooth changes
            document.body.classList.add('theme-transition');
            
            // Apply all visual settings in the correct order
            applyTheme(theme);
            
            // Apply color theme via setAttribute
            document.body.setAttribute('data-theme', colorTheme);
            console.log('Applied data-theme attribute with value:', colorTheme);
            
            // Apply other UI settings
            // toggleGlassmorphism(glassmorphism);
            toggleAnimations(animations);
            changeFontSize(fontSize);
            updateModelDisplay(model);
            
            // Apply class-based styles to body and elements
            document.body.style.fontSize = fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px';
            
            // Apply sidebar compact mode directly
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.toggle('compact', compactSidebar);
            }
            
            // Update code theme based on light/dark mode
            updateCodeTheme(theme === 'light');
            
            // Force a complete rebuild of the chat list after all theme changes
            if (chats.length > 0) {
                rebuildChatList();
            }
            
            // Make sure event listeners still work
            setTimeout(() => {
                // Reset and rebuild input area
                initializeInputArea();
                
                // Remove transition class after animation
                document.body.classList.remove('theme-transition');
                
                // Re-enable the save button
                saveBtn.innerHTML = originalBtnText;
                saveBtn.disabled = false;
            }, 500);
            
            showToast('Settings updated successfully', 'success');
            
            // Then handle password change if needed
            if (oldPasswordValue || newPasswordValue || confirmNewPasswordValue) {
                // Validate password change fields
                if (!oldPasswordValue) {
                    showToast('Current password is required to change password', 'error');
                    return;
                }
                
                if (!newPasswordValue) {
                    showToast('New password is required', 'error');
                    return;
                }
                
                if (newPasswordValue.length < 6) {
                    showToast('New password must be at least 6 characters long', 'error');
                    return;
                }

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
        } else {
            // Reset button state
            saveBtn.innerHTML = originalBtnText;
            saveBtn.disabled = false;
            
            showToast('Failed to update settings', 'error');
        }
        return Promise.resolve();
    })
    .then(response => {
        if (response) {
            return response.json().then(data => {
                if (data.success) {
                    showToast('Password changed successfully', 'success');
                } else {
                    // Improved error message mapping
                    let errorMessage = data.message;
                    if (data.error === 'invalid_password') {
                        errorMessage = 'Current password is incorrect';
                    } else if (data.error === 'same_password') {
                        errorMessage = 'New password must be different from current password';
                    } else if (data.error === 'validation_error') {
                        errorMessage = 'Password format is invalid';
                    }
                    showToast(errorMessage, 'error');
                }
            });
        }
    })
    .catch(err => {
        // Reset button state
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
        
        console.error('Error updating settings:', err);
        showToast('Failed to update settings', 'error');
    })
    .finally(() => {
        hideSettingsModal();
    });
}

// New function to update code highlighting theme based on light/dark mode
function updateCodeTheme(isLightTheme) {
    const lightCodeTheme = document.getElementById('light-code-theme');
    if (lightCodeTheme) {
        lightCodeTheme.disabled = !isLightTheme;
    }
}

// Theme previews
function setupThemePreviews() {
    const themePreviews = document.querySelectorAll('.theme-preview');
    
    // Set initial active state based on currentUser
    let activeTheme = currentUser?.colorTheme || 'blue';
    
    // Set initial body data-theme attribute when page loads
    if (activeTheme) {
        document.body.setAttribute('data-theme', activeTheme);
    }
    
    // Check if we're in light theme - in light theme, only blue is allowed
    const isLightTheme = document.body.classList.contains('light-theme');
    
    // Mark the current theme as active
    themePreviews.forEach(preview => {
        const themeValue = preview.dataset.theme.split('-')[1]; // Extract 'blue', 'green', etc.
        
        // If in light theme, disable all non-blue themes
        if (isLightTheme) {
            if (themeValue !== 'blue') {
                preview.classList.add('disabled');
                preview.title = 'This theme is only available in dark mode';
            } else {
                preview.classList.add('active');
            }
        } else {
            // In dark theme, all themes are available
            preview.classList.remove('disabled');
            preview.title = '';
            if (themeValue === activeTheme) {
                preview.classList.add('active');
            }
        }
    });
    
    // Theme preview click handler
    themePreviews.forEach(preview => {
        preview.addEventListener('click', () => {
            // If in light theme and not blue, show a toast and don't change
            const themeValue = preview.dataset.theme.split('-')[1];
            const isLightTheme = document.body.classList.contains('light-theme');
            
            if (isLightTheme && themeValue !== 'blue') {
                // Add a check to prevent duplicate toasts
                if (!window.lightThemeToastShown) {
                    showToast('In light mode, only the blue theme is available', 'info');
                    window.lightThemeToastShown = true;
                    // Reset the flag after a delay
                    setTimeout(() => { window.lightThemeToastShown = false; }, 5000);
                }
                return;
            }
            
            applyColorTheme(preview);
        });
    });
}

// Enhance the applyTheme function to ensure consistent theme application
function applyTheme(theme) {
    // Store the original theme mode for comparison
    const wasLightTheme = document.body.classList.contains('light-theme');
    
    // Apply theme mode classes
    document.body.classList.toggle('light-theme', theme === 'light');
    document.body.classList.toggle('dark-theme', theme !== 'light');
    
    // Add a temporary transition class for smooth color changes
    document.body.classList.add('theme-transition');
    
    // If switching to light theme, force blue theme
    if (theme === 'light' && !wasLightTheme) {
        document.body.setAttribute('data-theme', 'blue');
        if (currentUser) currentUser.colorTheme = 'blue';
    }
    
    // Update code highlighting theme based on light/dark mode
    updateCodeTheme(theme === 'light');
    
    // Remove transition class after animation completes
    setTimeout(() => {
        document.body.classList.remove('theme-transition');
    }, 500);
    
    // If the theme mode changed, update theme previews
    if (wasLightTheme !== (theme === 'light')) {
        setupThemePreviews();
    }
    
    // Debug output
    console.log('Theme mode applied:', theme);
}

// Helper functions
function showToast(message, type = 'success') {
    // Get the toast container
    const toastContainer = document.getElementById('toast-container');
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Determine icon based on type
    let icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    else if (type === 'warning') icon = 'exclamation-triangle';
    else if (type === 'info') icon = 'info-circle';
    
    // Create toast content
    toast.innerHTML = `
        <i class="fas fa-${icon} toast-icon"></i>
        <div class="toast-content">${message}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Add entrance animation class
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Setup close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    });
    
    // Auto remove after timeout
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
    
    // Return the toast element in case we need to reference it
    return toast;
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

// Fixed setupEventListeners function
function setupEventListeners() {
    // Authentication
    authSwitchLink.addEventListener('click', toggleAuthMode);
    authToggle.addEventListener('click', toggleAuthMode);
    loginOption.addEventListener('click', () => {
        if (authTitle.textContent !== 'Login') toggleAuthMode();
    });
    registerOption.addEventListener('click', () => {
        if (authTitle.textContent !== 'Register') toggleAuthMode();
    });
    authForm.addEventListener('submit', handleAuth);

    // Initialize all buttons and inputs
    initializeInputArea();

    // Main action buttons
    const newChatBtnEl = document.getElementById('new-chat-btn');
    if (newChatBtnEl) {
        // Remove any existing listeners by cloning and replacing
        const newBtn = newChatBtnEl.cloneNode(true);
        newChatBtnEl.parentNode.replaceChild(newBtn, newChatBtnEl);
        newBtn.addEventListener('click', createNewChat);
    }
    
    clearChatsBtn.addEventListener('click', clearAllChats);
    settingsBtn.addEventListener('click', showSettingsModal);
    logoutBtn.addEventListener('click', logout);
    renameChatBtn.addEventListener('click', () => showRenameModal(currentChatId, currentChatTitle.textContent));

    // Forms
    settingsForm.addEventListener('submit', updateSettings);
    renameForm.addEventListener('submit', renameChat);

    // Settings tab navigation
    setupSettingsTabNavigation();
    
    // Settings theme previews
    setupThemePreviews();
    
    // Reset settings button
    document.getElementById('settings-reset')?.addEventListener('click', resetSettings);
    
    // Export chat history button
    document.getElementById('export-data-btn')?.addEventListener('click', exportChatHistory);
    
    // Delete account button
    document.getElementById('delete-account-btn')?.addEventListener('click', deleteAccount);

    // Confirmation dialog
    confirmOkBtn.addEventListener('click', () => {
        if (currentConfirmCallback) {
            currentConfirmCallback(true);
        }
        hideConfirmDialog();
    });
    
    confirmCancelBtn.addEventListener('click', () => {
        if (currentConfirmCallback) {
            currentConfirmCallback(false);
        }
        hideConfirmDialog();
    });

    // Close handlers
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            
            // Don't close auth modal if not authenticated
            if (modal.id === 'auth-modal' && !isAuthenticated) {
                showToast('Please login or register to continue', 'warning');
                return;
            }
            
            modal.classList.remove('active');
            
            // Handle confirm dialog close specially
            if (modal.id === 'confirm-modal' && currentConfirmCallback) {
                currentConfirmCallback(false); // Treat close as cancel
                currentConfirmCallback = null;
            }
        });
    });

    window.addEventListener('click', e => {
        if (e.target.classList.contains('modal')) {
            // Don't close auth modal if not authenticated
            if (e.target.id === 'auth-modal' && !isAuthenticated) {
                showToast('Please login or register to continue', 'warning');
                return;
            }
            
            e.target.classList.remove('active');
            
            // Handle confirm dialog backdrop click specially
            if (e.target.id === 'confirm-modal' && currentConfirmCallback) {
                currentConfirmCallback(false); // Treat backdrop click as cancel
                currentConfirmCallback = null;
            }
        }
    });
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Force input initialization when user returns to the page
            setTimeout(() => initializeInputArea(), 100);
        }
    });
    
    // New event listeners for the advanced features
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // Shortcuts button
    if (shortcutsBtn) {
        shortcutsBtn.addEventListener('click', () => {
            showModal(shortcutsModal);
        });
    }
    
    // Close shortcuts modal
    if (shortcutsModal) {
        shortcutsModal.querySelector('.close')?.addEventListener('click', () => {
            shortcutsModal.classList.remove('active');
        });
    }
    
    // Add event listeners for keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Add event listeners for markdown toolbar
    setupMarkdownToolbar();
    
    // Add voice input event listeners
    setupVoiceInput();
}

// Settings tab navigation
function setupSettingsTabNavigation() {
    const navItems = document.querySelectorAll('.settings-nav-item');
    const sections = document.querySelectorAll('.settings-section');
    
    // Make sure we have both nav items and sections
    if (navItems.length === 0 || sections.length === 0) {
        console.warn('Settings navigation elements not found');
        return;
    }
    
    // Store references to the original elements
    const navItemsArray = Array.from(navItems);
    
    // Cleanup any existing event listeners by cloning and replacing
    navItems.forEach((item, index) => {
        const newItem = item.cloneNode(true);
        if (item.parentNode) {
            item.parentNode.replaceChild(newItem, item);
            
            // Add event listener to the new item
            newItem.addEventListener('click', () => {
                const target = newItem.dataset.target;
                
                // Update active nav item - we need to get fresh references
                document.querySelectorAll('.settings-nav-item').forEach(navItem => {
                    navItem.classList.remove('active');
                });
                newItem.classList.add('active');
                
                // Show corresponding section
                sections.forEach(section => {
                    section.classList.toggle('active', section.id === `${target}-section`);
                });
                
                // Special case for model section - make sure sliders are initialized
                if (target === 'model') {
                    // Ensure model is selected correctly
                    const modelSelect = document.getElementById('model-select');
                    if (modelSelect && currentUser && currentUser.model) {
                        modelSelect.value = currentUser.model;
                    }
                    
                    // Re-initialize the sliders
                    setupRangeSliders();
                }
            });
        }
    });
    
    // Set the first tab as active by default
    const firstNavItem = document.querySelector('.settings-nav-item');
    if (firstNavItem) {
        firstNavItem.classList.add('active');
    }
    
    if (sections[0]) {
        sections[0].classList.add('active');
    }
    
    // Add event listener for theme select to update theme previews when light/dark mode changes
    const themeSelectEl = document.getElementById('theme-select');
    if (themeSelectEl) {
        themeSelectEl.addEventListener('change', () => {
            const isLightTheme = themeSelectEl.value === 'light';
            
            // If switching to light theme, force blue color theme
            if (isLightTheme) {
                // Update the preview UI
                document.querySelectorAll('.theme-preview').forEach(preview => {
                    const themeValue = preview.dataset.theme.split('-')[1];
                    preview.classList.toggle('disabled', themeValue !== 'blue');
                    preview.classList.toggle('active', themeValue === 'blue');
                    
                    if (themeValue !== 'blue') {
                        preview.title = 'This theme is only available in dark mode';
                    } else {
                        preview.title = '';
                    }
                });
                
                // Show a toast notification with protection against duplicates
                if (!window.lightThemeToastShown) {
                    showToast('Light theme only supports blue color scheme', 'info');
                    window.lightThemeToastShown = true;
                    setTimeout(() => { window.lightThemeToastShown = false; }, 5000);
                }
            } else {
                // If switching to dark theme, remove disabled state
                document.querySelectorAll('.theme-preview').forEach(preview => {
                    preview.classList.remove('disabled');
                    preview.title = '';
                    
                    // Keep the current active theme or default to blue
                    if (currentUser && currentUser.colorTheme) {
                        preview.classList.toggle('active', 
                            preview.dataset.theme.split('-')[1] === currentUser.colorTheme);
                    }
                });
            }
        });
    }
}

// Range slider value display
function setupRangeSliders() {
    const temperatureRange = document.getElementById('temperature-range');
    const temperatureValue = document.getElementById('temperature-value');
    
    if (temperatureRange && temperatureValue) {
        // Set initial value from user settings
        if (currentUser && currentUser.temperature) {
            temperatureRange.value = currentUser.temperature;
            temperatureValue.textContent = currentUser.temperature;
        }
        
        // Add input event listener
        temperatureRange.addEventListener('input', () => {
            temperatureValue.textContent = parseFloat(temperatureRange.value).toFixed(1);
        });
    }
    
    const maxTokensRange = document.getElementById('max-tokens-range');
    const maxTokensValue = document.getElementById('max-tokens-value');
    
    if (maxTokensRange && maxTokensValue) {
        // Set initial value from user settings
        if (currentUser && currentUser.maxTokens) {
            maxTokensRange.value = currentUser.maxTokens;
            maxTokensValue.textContent = currentUser.maxTokens;
        }
        
        // Add input event listener
        maxTokensRange.addEventListener('input', () => {
            maxTokensValue.textContent = maxTokensRange.value;
        });
    }
}

// Apply theme color based on selection using the theme previews
function applyColorTheme(themeElement) {
    // Get the theme value from the data attribute (dark-blue, dark-green, etc.)
    const theme = themeElement.dataset.theme;
    
    // Extract the color (blue, green, etc.)
    const colorTheme = theme.split('-')[1];
    
    // Debug for theme application
    console.log('Applying color theme:', colorTheme);
    console.log('Theme data attribute:', theme);
    console.log('Setting body data-theme to:', colorTheme);
    
    // Store the current theme color
    currentUser.colorTheme = colorTheme;
    
    // Remove active class from all previews and add to the selected one
    document.querySelectorAll('.theme-preview').forEach(preview => {
        preview.classList.remove('active');
    });
    themeElement.classList.add('active');
    
    // Set the data-theme attribute on the body element
    document.body.setAttribute('data-theme', colorTheme);
    
    // Add a temporary transition class for smooth color changes
    document.body.classList.add('theme-transition');
    
    // Force a complete rebuild of the chat list to ensure proper styling
    if (chats.length > 0) {
        // Use our more robust rebuild function
        rebuildChatList();
    }
    
    // Apply sidebar compact mode directly for consistency
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && currentUser) {
        sidebar.classList.toggle('compact', currentUser.compactSidebar === true);
    }
    
    // Update the code theme based on light/dark mode
    updateCodeTheme(document.body.classList.contains('light-theme'));
    
    // Always reset the input area for consistency and remove transition class after animation completes
    setTimeout(() => {
        initializeInputArea();
        document.body.classList.remove('theme-transition');
    }, 500);
}

// Toggle glassmorphism effects
function toggleGlassmorphism(enabled) {
    // Always enable glassmorphism regardless of the parameter
    enabled = true;
    
    // Store the current glassmorphism setting
    currentUser.glassmorphism = enabled;
    
    // Apply or remove glassmorphism classes to elements
    document.documentElement.classList.remove('no-glass');
    
    // Define glass styles for critical components
    document.documentElement.style.removeProperty('--glass-blur');
    document.documentElement.style.removeProperty('--glass-bg');
    document.documentElement.style.removeProperty('--glass-border');
}

// Toggle animations
function toggleAnimations(enabled) {
    // Store the current animation setting
    currentUser.animations = enabled;
    
    // Remove existing style if it exists (do this whether enabling or disabling)
    const existingStyle = document.getElementById('no-animations-style');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    if (enabled) {
        document.documentElement.classList.remove('no-animations');
    } else {
        document.documentElement.classList.add('no-animations');
        
        // Disable all animations and transitions
        const style = document.createElement('style');
        style.id = 'no-animations-style';
        style.textContent = `
            * {
                animation: none !important;
                transition: none !important;
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Change font size
function changeFontSize(size) {
    console.log('Changing font size to:', size);
    
    // Remove all font size classes first
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    
    // Add the appropriate class based on the size
    document.body.classList.add(`font-${size}`);
    
    // Update the select element if it exists
    const fontSizeSelect = document.getElementById('font-size-select');
    if (fontSizeSelect) {
        fontSizeSelect.value = size;
    }
    
    // For direct style setting on body as a fallback
    const fontSizes = {
        'small': '14px',
        'medium': '16px',
        'large': '18px'
    };
    
    // Apply direct inline style as well for maximum compatibility
    if (fontSizes[size]) {
        document.body.style.fontSize = fontSizes[size];
    }
    
    // Log the changes
    console.log(`Font size changed to ${size}, classes:`, document.body.classList.toString());
    return size;
}

// Toggle compact sidebar - IMPROVED with hover behavior
function toggleCompactSidebar(enabled) {
    // Store the current compact sidebar setting - always true
    currentUser.compactSidebar = true;
    enabled = true; // Force always enabled
    
    // Log for debugging
    console.log('Setting sidebar to compact mode');
    
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        // Apply compact mode by directly manipulating the class
        sidebar.classList.add('compact');
        
        // Set the CSS variable for sidebar width
        document.documentElement.style.setProperty('--sidebar-width', '60px');
        
        // Update the visibility of chats label based on compact mode
        const chatsLabel = document.querySelector('.chats-label');
        if (chatsLabel) {
            chatsLabel.style.display = 'none';
        }
        
        // Completely rebuild the chat list to ensure proper rendering in compact mode
        if (chats.length > 0) {
            rebuildChatList();
        }
        
        // Ensure the new chat button is properly styled in both modes
        const newChatBtn = document.getElementById('new-chat-btn');
        if (newChatBtn) {
            newChatBtn.className = 'new-chat-button circular';
            newChatBtn.style.marginRight = '0';
        }
    }
}

// Export chat history functionality
function exportChatHistory() {
    showToast('Preparing export...', 'info');
    
    // Fetch all chats for the user
    fetch('/api/get_chats', { credentials: 'include' })
    .then(response => response.json())
    .then(async data => {
        if (!data.success || !data.chats || data.chats.length === 0) {
            showToast('No chats to export', 'error');
            return;
        }
        
        try {
            // Create a text file for each chat
            const files = [];
            
            for (const chat of data.chats) {
                // Fetch full chat data with messages
                const chatResponse = await fetch(`/api/get_chat/${chat.id}`, { credentials: 'include' });
                const chatData = await chatResponse.json();
                
                if (chatData.success && chatData.chat) {
                    let chatContent = `# ${chatData.chat.title}\n`;
                    chatContent += `Exported: ${new Date().toLocaleString()}\n\n`;
                    
                    // Add messages
                    chatData.chat.messages.forEach(msg => {
                        chatContent += `## ${msg.role === 'user' ? 'User' : 'Assistant'} - ${new Date(msg.timestamp * 1000).toLocaleString()}\n\n`;
                        chatContent += msg.content + '\n\n';
                        chatContent += '---\n\n';
                    });
                    
                    files.push({
                        name: `${chatData.chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`,
                        content: chatContent
                    });
                }
            }
            
            // Create a summary file
            let summaryContent = `# Chatly Export\n`;
            summaryContent += `Exported: ${new Date().toLocaleString()}\n`;
            summaryContent += `User: ${currentUser.username}\n\n`;
            summaryContent += `Total Chats: ${files.length}\n\n`;
            summaryContent += `## Chats\n`;
            
            files.forEach(file => {
                summaryContent += `- ${file.name}\n`;
            });
            
            files.push({
                name: 'summary.md',
                content: summaryContent
            });
            
            // Use JSZip to create a zip file
            const zip = new JSZip();
            
            // Add files to the zip
            files.forEach(file => {
                zip.file(file.name, file.content);
            });
            
            // Generate the zip file
            zip.generateAsync({ type: 'blob' })
            .then(blob => {
                // Create a download link
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `chatly_export_${Date.now()}.zip`;
                
                // Trigger the download
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showToast('Export complete!', 'success');
            });
        } catch (error) {
            console.error('Export error:', error);
            showToast('Failed to export chats', 'error');
        }
    })
    .catch(err => {
        console.error('Export error:', err);
        showToast('Failed to export chats', 'error');
    });
}

// Delete account functionality
function deleteAccount() {
    const passwordInput = document.getElementById('delete-account-password');
    const password = passwordInput.value.trim();
    
    if (!password) {
        showToast('Please enter your password to confirm', 'error');
        passwordInput.focus();
        return;
    }
    
    showConfirmDialog(
        'Are you absolutely sure you want to delete your account? This action CANNOT be undone and will permanently delete all your data.',
        'Delete Account - Final Confirmation',
        (confirmed) => {
            if (!confirmed) return;
            
            // Show loading state
            const deleteBtn = document.getElementById('delete-account-btn');
            deleteBtn.innerHTML = '<div class="spinner"></div>';
            deleteBtn.disabled = true;
            
            // Reset error display
            console.log('Attempting to delete account for current user');
            
            // Call API to delete account
            fetch('/api/delete_account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
                credentials: 'include'
            })
            .then(response => {
                // Log response status for debugging
                console.log('Delete account response status:', response.status);
                
                // Try to parse the JSON response
                return response.json().then(data => {
                    return { 
                        status: response.status,
                        data: data
                    };
                }).catch(err => {
                    // Handle JSON parse errors
                    console.error('Error parsing response:', err);
                    return { 
                        status: response.status, 
                        data: { success: false, message: 'Invalid server response' } 
                    };
                });
            })
            .then(result => {
                const { status, data } = result;
                
                if (data.success) {
                    showToast('Account deleted successfully', 'success');
                    setTimeout(() => {
                        // Reset app state
                        currentUser = null;
                        currentChatId = null;
                        chats = [];
                        isAuthenticated = false;
                        resetUI();
                        hideSettingsModal();
                        showAuthModal();
                    }, 1000);
                } else {
                    // Reset button state
                    deleteBtn.innerHTML = '<i class="fas fa-user-slash"></i> Delete Account';
                    deleteBtn.disabled = false;
                    
                    // Show detailed error based on error code
                    let errorMessage = data.message || 'Failed to delete account';
                    if (data.error === 'invalid_password') {
                        errorMessage = 'Incorrect password';
                    } else if (data.error === 'user_not_found') {
                        errorMessage = 'User account not found';
                    } else if (data.error === 'file_error') {
                        errorMessage = 'Error deleting account files. Please try again.';
                    }
                    
                    console.error('Delete account error:', data);
                    showToast(errorMessage, 'error');
                }
            })
            .catch(err => {
                console.error('Network error deleting account:', err);
                deleteBtn.innerHTML = '<i class="fas fa-user-slash"></i> Delete Account';
                deleteBtn.disabled = false;
                showToast('Network error. Please check your connection and try again.', 'error');
            });
        }
    );
}

// Settings reset
function resetSettings() {
    if (!confirm('Reset all settings to default values?')) return;
    
    const defaultSettings = {
        theme: 'dark',
        colorTheme: 'blue',
        model: 'gemma3:1b',
        compactSidebar: true,
        glassmorphism: true, // Always true
        animations: true,
        fontSize: 'medium',
        showLineNumbers: true,
        autoScroll: true
    };
    
    // Show loading indicator
    const resetBtn = document.getElementById('reset-settings');
    const originalBtnText = resetBtn.innerHTML;
    resetBtn.innerHTML = '<div class="spinner"></div>';
    resetBtn.disabled = true;
    
    // Save to server
    fetch('/api/update_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultSettings),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Apply all settings
            currentUser = data.user;
            
            // Update UI with new settings
            applyTheme(defaultSettings.theme);
            document.body.setAttribute('data-theme', defaultSettings.colorTheme);
            toggleGlassmorphism(defaultSettings.glassmorphism);
            toggleAnimations(defaultSettings.animations);
            changeFontSize(defaultSettings.fontSize);
            updateModelDisplay(defaultSettings.model);
            
            // Apply class-based styles
            document.body.classList.remove('font-small', 'font-medium', 'font-large');
            document.body.classList.add(`font-${defaultSettings.fontSize}`);
            
            // Update UI components to reflect new settings
            if (themeSelect) themeSelect.value = defaultSettings.theme;
            if (modelSelect) modelSelect.value = defaultSettings.model;
            
            // Update toggles
            // glassmorphism is always enabled, no need to set toggle
            
            const animationsToggle = document.getElementById('animations-toggle');
            if (animationsToggle) animationsToggle.checked = defaultSettings.animations;
            
            const lineNumbersToggle = document.getElementById('line-numbers-toggle');
            if (lineNumbersToggle) lineNumbersToggle.checked = defaultSettings.showLineNumbers;
            
            const autoScrollToggle = document.getElementById('auto-scroll-toggle');
            if (autoScrollToggle) autoScrollToggle.checked = defaultSettings.autoScroll;
            
            const fontSizeSelect = document.getElementById('font-size-select');
            if (fontSizeSelect) fontSizeSelect.value = defaultSettings.fontSize;
            
            // Update theme previews
            document.querySelectorAll('.theme-preview').forEach(preview => {
                preview.classList.toggle('active', preview.dataset.theme === `dark-${defaultSettings.colorTheme}`);
            });
            
            // Show success message
            showToast('Settings reset to defaults', 'success');
        } else {
            showToast('Failed to reset settings', 'error');
        }
    })
    .catch(error => {
        console.error('Error resetting settings:', error);
        showToast('Error resetting settings', 'error');
    })
    .finally(() => {
        // Reset button
        resetBtn.innerHTML = originalBtnText;
        resetBtn.disabled = false;
    });
}

// Function to reset and enable the message input
function resetMessageInput() {
    const msgInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-button');
    
    if (msgInput) {
        msgInput.style.height = 'auto';
        msgInput.focus();
    }
    
    if (sendBtn) {
        sendBtn.disabled = false;
    }
}

// New function to reattach all critical event listeners
function reattachEventListeners() {
    // Reset settings button listener
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        const newSettingsBtn = settingsBtn.cloneNode(true);
        settingsBtn.parentNode.replaceChild(newSettingsBtn, settingsBtn);
        newSettingsBtn.addEventListener('click', showSettingsModal);
    }
    
    // Reset other critical button listeners
    const newChatBtn = document.getElementById('new-chat-btn');
    if (newChatBtn) {
        const newBtn = newChatBtn.cloneNode(true);
        newChatBtn.parentNode.replaceChild(newBtn, newChatBtn);
        newBtn.addEventListener('click', createNewChat);
    }
    
    const clearChatsBtn = document.getElementById('clear-chats-btn');
    if (clearChatsBtn) {
        const newBtn = clearChatsBtn.cloneNode(true);
        clearChatsBtn.parentNode.replaceChild(newBtn, clearChatsBtn);
        newBtn.addEventListener('click', clearAllChats);
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        const newBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
        newBtn.addEventListener('click', logout);
    }
    
    const renameChatBtn = document.getElementById('rename-chat-btn');
    if (renameChatBtn) {
        const newBtn = renameChatBtn.cloneNode(true);
        renameChatBtn.parentNode.replaceChild(newBtn, renameChatBtn);
        newBtn.addEventListener('click', () => showRenameModal(currentChatId, currentChatTitle.textContent));
    }
    
    // Reattach event listeners to all chat item action buttons
    document.querySelectorAll('.chat-item').forEach(item => {
        const chatId = item.dataset.id;
        
        // Replace rename button
        const renameBtn = item.querySelector('.rename-chat');
        if (renameBtn) {
            const newRenameBtn = renameBtn.cloneNode(true);
            renameBtn.parentNode.replaceChild(newRenameBtn, renameBtn);
            newRenameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showRenameModal(chatId, item.querySelector('.chat-item-title')?.textContent || 'Chat');
            });
        }
        
        // Replace delete button
        const deleteBtn = item.querySelector('.delete-chat');
        if (deleteBtn) {
            const newDeleteBtn = deleteBtn.cloneNode(true);
            deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
            newDeleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteChat(chatId);
            });
        }
        
        // Replace the main chat item click handler
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        // Re-add event listener to the new item
        newItem.addEventListener('click', (e) => {
            if (!e.target.closest('.chat-item-actions')) {
                loadChat(chatId);
            }
        });
        
        // Make sure rename and delete buttons in the new item have their event listeners
        const newRenameBtn = newItem.querySelector('.rename-chat');
        if (newRenameBtn) {
            newRenameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showRenameModal(chatId, newItem.querySelector('.chat-item-title')?.textContent || 'Chat');
            });
        }
        
        const newDeleteBtn = newItem.querySelector('.delete-chat');
        if (newDeleteBtn) {
            newDeleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteChat(chatId);
            });
        }
    });
    
    // Also re-initialize the input area to ensure all input events work correctly
    initializeInputArea();
}

// Test utility for themes - will be accessible via console
window.testThemes = function() {
    const themes = ['blue', 'green', 'purple', 'teal', 'orange', 'rose', 'monochrome'];
    let currentIndex = 0;
    
    // Create a status indicator
    const indicator = document.createElement('div');
    indicator.style.position = 'fixed';
    indicator.style.top = '10px';
    indicator.style.left = '50%';
    indicator.style.transform = 'translateX(-50%)';
    indicator.style.background = 'rgba(0,0,0,0.8)';
    indicator.style.color = 'white';
    indicator.style.padding = '10px 20px';
    indicator.style.borderRadius = '5px';
    indicator.style.zIndex = '10000';
    indicator.style.fontWeight = 'bold';
    
    document.body.appendChild(indicator);
    
    // Test function that cycles through themes
    function testNextTheme() {
        if (currentIndex >= themes.length) {
            indicator.textContent = 'Theme testing complete!';
            setTimeout(() => {
                document.body.removeChild(indicator);
            }, 2000);
            return;
        }
        
        const theme = themes[currentIndex];
        indicator.textContent = `Testing theme: ${theme}`;
        
        // Set theme directly on body
        document.body.setAttribute('data-theme', theme);
        
        console.log(`Applied theme: ${theme}`);
        console.log(`Body data-theme attribute is now: ${document.body.getAttribute('data-theme')}`);
        
        // Capture screenshot if available
        if (window.html2canvas) {
            html2canvas(document.body).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                console.log(`Screenshot with ${theme} theme:`, imgData);
            });
        }
        
        // Increment and schedule next test
        currentIndex++;
        setTimeout(testNextTheme, 1500);
    }
    
    // Start the test
    testNextTheme();
};

// Log a message that theme test is available
console.log("Theme test utility available. Run window.testThemes() to test all themes.");
console.log("Or press Ctrl+Alt+T to toggle the theme test panel.");

// Markdown Formatting Toolbar
function setupMarkdownToolbar() {
    if (!markdownToolbar) return;
    
    formatButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const format = btn.dataset.format;
            applyFormat(format);
        });
    });
}

function applyFormat(format) {
    const textarea = document.getElementById('message-input');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let replacement = '';
    
    // Check if text is selected
    const hasSelection = selectedText.length > 0;
    
    // Only apply formatting if text is selected
    if (!hasSelection) {
        return; // Do nothing if no text is selected
    }
    
    switch (format) {
        case 'bold':
            replacement = `**${selectedText}**`;
            break;
        case 'italic':
            replacement = `*${selectedText}*`;
            break;
        case 'heading':
            replacement = `\n## ${selectedText}\n`;
            break;
        case 'code':
            replacement = `\`${selectedText}\``;
            break;
        case 'codeblock':
            replacement = `\n\`\`\`\n${selectedText}\n\`\`\`\n`;
            break;
        case 'link':
            replacement = `[${selectedText}](url)`;
            break;
        case 'list':
            replacement = `\n- ${selectedText}\n`;
            break;
        case 'quote':
            replacement = `\n> ${selectedText}\n`;
            break;
        default:
            return;
    }
    
    // Replace the selected text with the formatted text
    if (textarea.setRangeText) {
        // Modern browsers
        textarea.setRangeText(replacement, start, end);
        
        // Set selection to end of inserted text
        const newCursorPos = start + replacement.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
    } else {
        // Fallback for older browsers
        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);
        textarea.value = before + replacement + after;
        
        // Set cursor position after the inserted text
        textarea.selectionStart = textarea.selectionEnd = start + replacement.length;
    }
    
    // Focus the textarea
    textarea.focus();
    
    // Auto-adjust height
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    
    // Enable send button if there's content
    const sendBtn = document.getElementById('send-button');
    if (sendBtn) {
        sendBtn.disabled = !textarea.value.trim();
    }
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
    // Show shortcuts modal
    if (shortcutsBtn) {
        shortcutsBtn.addEventListener('click', () => {
            showModal(shortcutsModal);
        });
    }
    
    // Register global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts when typing in text input
        const isInputActive = document.activeElement.tagName === 'INPUT' || 
                             document.activeElement.tagName === 'TEXTAREA';
        
        // Formatting shortcuts (allow in textarea)
        if (e.ctrlKey && document.activeElement.id === 'message-input') {
            let format = null;
            
            if (e.key === 'b') format = 'bold';
            else if (e.key === 'i') format = 'italic';
            else if (e.key === 'k') format = e.shiftKey ? 'codeblock' : 'code';
            else if (e.key === 'h') format = 'heading';
            else if (e.key === 'l') format = 'link';
            else if (e.key === 'u') format = 'list';
            else if (e.key === 'q') format = 'quote';
            
            if (format) {
                e.preventDefault();
                applyFormat(format);
                return;
            }
        }
        
        // Navigation shortcuts (prevent in input fields)
        if (!isInputActive) {
            // Alt + N: New Chat
            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                createNewChat();
                return;
            }
            
            // Alt + S: Settings
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                showSettingsModal();
                return;
            }
            
            // Alt + D: Toggle Dark/Light Mode
            if (e.altKey && e.key === 'd') {
                e.preventDefault();
                toggleTheme();
                return;
            }
            
            // Alt + Up/Down: Navigate chats
            if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowUp')) {
                e.preventDefault();
                navigateChats(e.key === 'ArrowUp' ? -1 : 1);
                return;
            }
        }
        
        // Send message with Ctrl+Enter (allow in textarea)
        if (e.ctrlKey && e.key === 'Enter' && document.activeElement.id === 'message-input') {
            e.preventDefault();
            sendMessage();
            return;
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            const activeModals = document.querySelectorAll('.modal.active');
            if (activeModals.length > 0) {
                e.preventDefault();
                activeModals.forEach(modal => {
                    modal.classList.remove('active');
                });
                return;
            }
        }
    });
}

// Navigate between chats
function navigateChats(direction) {
    if (!chats.length) return;
    
    // Find the index of the current chat
    const currentIndex = chats.findIndex(chat => chat.id === currentChatId);
    if (currentIndex === -1) return;
    
    // Calculate new index
    let newIndex = currentIndex + direction;
    
    // Wrap around
    if (newIndex < 0) newIndex = chats.length - 1;
    if (newIndex >= chats.length) newIndex = 0;
    
    // Load the new chat
    loadChat(chats[newIndex].id);
}

// Theme Toggle functionality
function toggleTheme() {
    const isLightTheme = document.body.classList.contains('light-theme');
    const newTheme = isLightTheme ? 'dark' : 'light';
    
    // Apply theme
    applyTheme(newTheme);
    
    // If switching to light mode, also force blue theme
    if (newTheme === 'light') {
        // Force blue theme when in light mode
        document.body.setAttribute('data-theme', 'blue');
        currentUser.colorTheme = 'blue';
        
        // Update the theme preview selection if settings modal is open
        document.querySelectorAll('.theme-preview').forEach(preview => {
            preview.classList.toggle('active', preview.dataset.theme === 'dark-blue');
        });
    }
    
    // Save to user settings if we have a current user
    if (currentUser) {
        currentUser.theme = newTheme;
        
        // When changing to light mode, ensure colorTheme is set to blue
        const settingsToUpdate = { 
            theme: newTheme 
        };
        
        // When switching to light mode, enforce blue theme
        if (newTheme === 'light') {
            settingsToUpdate.colorTheme = 'blue';
        }
        
        // Save to server
        fetch('/api/update_settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsToUpdate),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.warn('Failed to save theme preference');
            }
        })
        .catch(err => {
            console.error('Error saving theme preference:', err);
        });
    }
}

// Voice input functionality
function setupVoiceInput() {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.log('Voice input not supported in this browser');
        if (voiceInputBtn) {
            voiceInputBtn.style.display = 'none';
        }
        return;
    }
    
    // Create speech recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    let isRecording = false;
    
    // Voice input button click handler
    if (voiceInputBtn) {
        voiceInputBtn.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
                voiceInputBtn.classList.remove('recording');
                isRecording = false;
            } else {
                recognition.start();
                voiceInputBtn.classList.add('recording');
                isRecording = true;
            }
        });
    }
    
    // Handle recognition results
    recognition.onresult = (event) => {
        const textarea = document.getElementById('message-input');
        if (!textarea) return;
        
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                transcript += event.results[i][0].transcript + ' ';
            }
        }
        
        if (transcript) {
            // Insert at cursor position or append
            const cursorPos = textarea.selectionStart;
            const textBefore = textarea.value.substring(0, cursorPos);
            const textAfter = textarea.value.substring(cursorPos);
            
            textarea.value = textBefore + transcript + textAfter;
            
            // Update cursor position
            textarea.selectionStart = cursorPos + transcript.length;
            textarea.selectionEnd = cursorPos + transcript.length;
            
            // Enable send button
            const sendBtn = document.getElementById('send-button');
            if (sendBtn) {
                sendBtn.disabled = !textarea.value.trim();
            }
            
            // Auto-adjust height
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };
    
    // Handle recognition errors
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        if (voiceInputBtn) {
            voiceInputBtn.classList.remove('recording');
        }
        
        isRecording = false;
    };
    
    // Stop recording when recognition ends
    recognition.onend = () => {
        if (voiceInputBtn) {
            voiceInputBtn.classList.remove('recording');
        }
        
        isRecording = false;
    };
}

// Handle message reactions
function handleReaction(button, reaction) {
    // Toggle active state
    if (reaction === 'thumbs-up' || reaction === 'thumbs-down') {
        const isActive = button.classList.contains('active');
        
        // Remove active from all reaction buttons in this group
        const reactionsContainer = button.closest('.message-reactions');
        reactionsContainer.querySelectorAll('.reaction-btn[data-reaction="thumbs-up"], .reaction-btn[data-reaction="thumbs-down"]')
            .forEach(btn => {
                btn.classList.remove('active');
                btn.querySelector('.reaction-count').textContent = '0';
            });
        
        // If not already active, set this one as active
        if (!isActive) {
            button.classList.add('active');
            button.querySelector('.reaction-count').textContent = '1';
        }
    }
}

// Regenerate AI response
function regenerateResponse(message) {
    // Find the last user message and resend it
    if (!currentChatId) return;
    
    showToast('Regenerating response...', 'info');
    
    // Find all messages in the current chat
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return;
    
    // Get the last user message
    let lastUserMessage = null;
    const messageElements = messagesDiv.querySelectorAll('.message');
    for (let i = messageElements.length - 1; i >= 0; i--) {
        const element = messageElements[i];
        if (element.classList.contains('message-user')) {
            lastUserMessage = element.querySelector('.message-content').textContent;
            break;
        }
    }
    
    if (!lastUserMessage) {
        showToast('No user message found to regenerate response', 'error');
        return;
    }
    
    // Remove the last assistant message from UI
    const lastElement = messagesDiv.lastElementChild;
    if (lastElement && lastElement.classList.contains('message-assistant')) {
        messagesDiv.removeChild(lastElement);
    }
    
    // Show typing indicator
    showTypingIndicator();
    
    // Resend the last user message
    fetch('/api/send_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            chat_id: currentChatId, 
            message: lastUserMessage,
            regenerate: true
        }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        removeTypingIndicator();
        if (data.success) {
            addMessageToUI(data.message);
            scrollToBottom();
        } else {
            showToast('Failed to regenerate response', 'error');
        }
    })
    .catch(err => {
        console.error('Error regenerating response:', err);
        removeTypingIndicator();
        showToast('Failed to regenerate response', 'error');
    });
}

// Function to update the chats list in the UI
function updateChatsList() {
    // Sort chats by most recent first (if they have timestamp)
    chats.sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA;
    });
    
    // Update the DOM
    renderChatList();
    
    // Make sure the current chat is marked as active
    if (currentChatId) {
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === currentChatId);
        });
    }
}

// Helper function to escape HTML for displaying in the dialog
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Function to show a fallback copy dialog with full text
function showCopyDialog(text) {
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'copy-fallback-modal';
    
    // Modal content
    modal.innerHTML = `
        <div class="modal-content" style="width: 80%; max-width: 800px;">
            <div class="modal-header">
                <h2>Copy Raw Text</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <p>Copy the text below (Ctrl+C or Cmd+C):</p>
                <textarea id="copy-text-area" readonly style="width: 100%; height: 300px; padding: 10px; margin-top: 10px; font-family: monospace; white-space: pre-wrap;">${escapeHTML(text)}</textarea>
                <div style="margin-top: 15px; text-align: right;">
                    <button id="copy-done-btn" class="secondary-button">Done</button>
                </div>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(modal);
    
    // Focus and select the text
    setTimeout(() => {
        const textarea = document.getElementById('copy-text-area');
        if (textarea) {
            textarea.focus();
            textarea.select();
        }
    }, 100);
    
    // Close button handler
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }
    
    // Done button handler
    const doneBtn = document.getElementById('copy-done-btn');
    if (doneBtn) {
        doneBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

function createMessageActions(message, messageDiv) {
    if (!message || !messageDiv) return;
    
    const isAI = message.role === 'assistant';
    
    if (isAI) {
        // Make sure the raw content is stored
        messageDiv.dataset.rawContent = message.content;
        
        // Create reactions container
        const reactionsDiv = document.createElement('div');
        reactionsDiv.className = 'message-reactions';
        
        // Create copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'reaction-btn';
        copyBtn.dataset.reaction = 'copy';
        copyBtn.title = 'Copy raw AI response to clipboard';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        
        // Add direct click handler to the copy button
        copyBtn.addEventListener('click', function() {
            const content = messageDiv.dataset.rawContent;
            
            // Simple direct clipboard copy with fallback
            try {
                // Create a temporary text area
                const textarea = document.createElement('textarea');
                textarea.value = content;
                textarea.setAttribute('readonly', '');
                textarea.style.position = 'absolute';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                
                // Select and copy the text
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                
                // Visual feedback
                const originalIcon = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i>';
                this.classList.add('copy-success');
                
                showToast('Copied to clipboard', 'success');
                
                // Reset after a short delay
                setTimeout(() => {
                    this.innerHTML = originalIcon;
                    this.classList.remove('copy-success');
                }, 1000);
            } catch (err) {
                console.error('Copy failed:', err);
                showToast('Failed to copy', 'error');
            }
        });
        
        // Add regenerate button
        const regenerateBtn = document.createElement('button');
        regenerateBtn.className = 'reaction-btn';
        regenerateBtn.dataset.reaction = 'regenerate';
        regenerateBtn.title = 'Regenerate response';
        regenerateBtn.innerHTML = '<i class="fas fa-redo-alt"></i>';
        
        // Add click handler for regenerate button
        regenerateBtn.addEventListener('click', function() {
            // Find the preceding user message
            let userMessage = '';
            let previousEl = messageDiv.previousElementSibling;
            
            // Look for the closest previous user message
            while (previousEl) {
                if (previousEl.classList.contains('message-user')) {
                    userMessage = previousEl.dataset.rawContent || '';
                    break;
                }
                previousEl = previousEl.previousElementSibling;
            }
            
            if (!userMessage) {
                showToast('No user message found to regenerate from', 'error');
                return;
            }
            
            // Show processing state
            showToast('Regenerating response...', 'info');
            
            // Add typing indicator
            showTypingIndicator();
            
            // Remove the current AI message
            messageDiv.remove();
            
            // Send regeneration request
            fetch('/api/send_message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: currentChatId,
                    message: userMessage,
                    regenerate: true
                }),
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                removeTypingIndicator();
                if (data.success) {
                    addMessageToUI(data.message);
                    scrollToBottom();
                } else {
                    showToast('Failed to regenerate response', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                removeTypingIndicator();
                showToast('Failed to regenerate response', 'error');
            });
        });
        
        // Add buttons to reactions div
        reactionsDiv.appendChild(copyBtn);
        reactionsDiv.appendChild(regenerateBtn);
        
        // Add reactions to message
        messageDiv.appendChild(reactionsDiv);
    }
}

// Set up event delegation for message reactions
document.addEventListener('click', function(e) {
    // Handle reaction buttons
    if (e.target.closest('.reaction-btn')) {
        const btn = e.target.closest('.reaction-btn');
        const reaction = btn.dataset.reaction;
        const messageElement = btn.closest('.message');
        
        if (!messageElement) return;
        
        const message = {
            role: messageElement.classList.contains('message-assistant') ? 'assistant' : 'user',
            content: messageElement.dataset.rawContent || ''
        };
        
        if (reaction === 'copy') {
            // Copy raw message content to clipboard
            const messageElement = btn.closest('.message');
            const rawContent = messageElement.dataset.rawContent || '';
            
            if (!rawContent) {
                // Add a guard against multiple notifications
                if (!window.copyToastShown) {
                    showToast('No content to copy', 'error');
                    window.copyToastShown = true;
                    setTimeout(() => { window.copyToastShown = false; }, 3000);
                }
                return;
            }
            
            // Add visual feedback
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            btn.classList.add('copy-success');
            
            // Try using the modern Clipboard API first
            const copyToClipboard = async (text) => {
                try {
                    // Primary method - Clipboard API
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(text);
                        return true;
                    }
                    
                    // Fallback method - Create text area, select, and execute copy command
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    textArea.style.position = 'fixed';
                    textArea.style.opacity = '0';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    
                    // Execute the copy command
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    
                    if (!successful) throw new Error('execCommand copy failed');
                    return true;
                } catch (err) {
                    console.error('Copy failed:', err);
                    return false;
                }
            };
            
            // Attempt to copy text
            copyToClipboard(rawContent)
                .then(success => {
                    if (success) {
                        showToast('Raw AI response copied to clipboard', 'success');
                    } else {
                        showToast('Failed to copy - opening copy dialog', 'warning');
                        // Show dialog with selectable text as ultimate fallback
                        showCopyDialog(rawContent);
                    }
                    
                    // Reset the button after a delay
                    setTimeout(() => {
                        btn.innerHTML = originalIcon;
                        btn.classList.remove('copy-success');
                    }, 1500);
                })
                .catch(() => {
                    showToast('Failed to copy content', 'error');
                    // Reset the button on error
                    btn.innerHTML = originalIcon;
                    btn.classList.remove('copy-success');
                });
        } else if (reaction === 'manual-copy') {
            // Always open the copy dialog for manual copying
            const rawContent = messageElement.dataset.rawContent || '';
            if (!rawContent) {
                // Add a guard against multiple notifications
                if (!window.copyToastShown) {
                    showToast('No content to copy', 'error');
                    window.copyToastShown = true;
                    setTimeout(() => { window.copyToastShown = false; }, 3000);
                }
                return;
            }
            
            // Visual feedback
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            btn.classList.add('copy-success');
            
            // Show dialog
            showCopyDialog(rawContent);
            
            // Reset button after delay
            setTimeout(() => {
                btn.innerHTML = originalIcon;
                btn.classList.remove('copy-success');
            }, 1500);
        } else if (reaction === 'regenerate') {
            // Get the user message before this one
            let userMessage = '';
            let userMessageEl = messageElement.previousElementSibling;
            
            // Look for the closest previous user message
            while (userMessageEl) {
                if (userMessageEl.classList.contains('message-user')) {
                    // First try to get the raw content from dataset
                    userMessage = userMessageEl.dataset.rawContent || '';
                    
                    // If that fails, try to get it from the message content
                    if (!userMessage) {
                        const contentEl = userMessageEl.querySelector('.message-content');
                        if (contentEl) {
                            userMessage = contentEl.textContent || '';
                        }
                    }
                    break;
                }
                userMessageEl = userMessageEl.previousElementSibling;
            }
            
            if (!userMessage) {
                showToast('No user message found to regenerate from', 'error');
                return;
            }
            
            // Send regeneration request
            const payload = {
                chat_id: currentChatId,
                message: userMessage,
                regenerate: true
            };
            
            // Show processing state
            showToast('Regenerating response...', 'info');
            
            // Add typing indicator
            showTypingIndicator();
            
            // Remove the current AI message
            messageElement.remove();
            
            // Send regeneration request to server
            fetch('/api/send_message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                removeTypingIndicator();
                if (data.success) {
                    // Add the message to the UI
                    addMessageToUI(data.message);
                    scrollToBottom();
                } else {
                    showToast(data.message || 'Failed to regenerate response', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                removeTypingIndicator();
                showToast('Failed to regenerate response', 'error');
            });
        }
    }
});

// New function to initialize the sidebar header
function initializeSidebarHeader() {
    const sidebarHeader = document.querySelector('.sidebar-header');
    if (sidebarHeader) {
        // Clear existing content
        sidebarHeader.innerHTML = '';
        
        // Create new chat button (circular)
        const newChatBtn = document.createElement('button');
        newChatBtn.id = 'new-chat-btn';
        newChatBtn.className = 'new-chat-button circular';
        newChatBtn.innerHTML = '<i class="fas fa-plus"></i>';
        newChatBtn.title = 'New Chat';
        
        // Add to sidebar header - remove the chats label completely
        sidebarHeader.appendChild(newChatBtn);
    }
}

// Add global keyboard event listener for Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Check if auth modal is open and user is not authenticated
        if (authModal.classList.contains('active') && !isAuthenticated) {
            e.preventDefault();
            e.stopPropagation();
            showToast('Please login or register to continue', 'warning');
        }
    }
});