// DOM элементы
const proxyToggle = document.getElementById('proxyToggle');
const statusText = document.getElementById('statusText');
const currentProxyEl = document.getElementById('currentProxy');
const rotateBtn = document.getElementById('rotateBtn');
const proxyListContainer = document.getElementById('proxyListContainer');
const addProxyForm = document.getElementById('addProxyForm');
const serverInput = document.getElementById('server');
const portInput = document.getElementById('port');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const enableBtn = document.getElementById('enableBtn');
const disableBtn = document.getElementById('disableBtn');
const statusDiv = document.getElementById('status');

// Состояние приложения
let state = {
  proxyList: [],
  currentProxyIndex: 0,
  isProxyEnabled: false
};

// Получение текущего состояния из background script
function getState() {
  chrome.runtime.sendMessage({ action: 'getState' }, response => {
    state = response;
    updateUI();
  });
}

// Обновление интерфейса на основе состояния
function updateUI() {
  // Обновляем переключатель
  proxyToggle.checked = state.isProxyEnabled;
  statusText.textContent = state.isProxyEnabled ? 'Включено' : 'Выключено';

  // Обновляем информацию о текущем прокси
  if (state.proxyList.length > 0 && state.isProxyEnabled) {
    const currentProxy = state.proxyList[state.currentProxyIndex];
    currentProxyEl.innerHTML = `
      <div class="proxy-protocol">${currentProxy.protocol.toUpperCase()}</div>
      <div>${currentProxy.host}:${currentProxy.port}</div>
      ${currentProxy.username ? `<div>Пользователь: ${currentProxy.username}</div>` : ''}
    `;
    rotateBtn.disabled = false;
  } else {
    currentProxyEl.textContent = state.isProxyEnabled ? 
      'Нет доступных прокси. Добавьте хотя бы один прокси сервер.' : 
      'Прокси отключен';
    rotateBtn.disabled = state.proxyList.length <= 1;
  }

  // Обновляем список прокси
  renderProxyList();
}

// Отображение списка прокси
function renderProxyList() {
  if (state.proxyList.length === 0) {
    proxyListContainer.innerHTML = '<div class="empty-list">Список прокси пуст</div>';
    return;
  }

  let html = '';
  state.proxyList.forEach((proxy, index) => {
    const isActive = state.isProxyEnabled && index === state.currentProxyIndex;
    html += `
      <div class="proxy-item" data-index="${index}" ${isActive ? 'style="border-left: 3px solid #4CAF50;"' : ''}>
        <div class="proxy-details">
          <span class="proxy-protocol">${proxy.protocol.toUpperCase()}</span>
          <span>${proxy.host}:${proxy.port}</span>
          ${proxy.username ? `<small>Пользователь: ${proxy.username}</small>` : ''}
        </div>
        <button class="btn danger delete-proxy" data-index="${index}">Удалить</button>
      </div>
    `;
  });

  proxyListContainer.innerHTML = html;

  // Добавляем обработчики событий для удаления прокси
  document.querySelectorAll('.delete-proxy').forEach(btn => {
    btn.addEventListener('click', handleDeleteProxy);
  });

  // Добавляем обработчики событий для выбора прокси при клике
  document.querySelectorAll('.proxy-item').forEach(item => {
    item.addEventListener('click', function(e) {
      if (!e.target.classList.contains('delete-proxy')) {
        const index = parseInt(this.dataset.index);
        selectProxy(index);
      }
    });
  });
}

// Обработчик переключения прокси
function handleProxyToggle() {
  const enabled = proxyToggle.checked;
  
  chrome.runtime.sendMessage(
    { action: 'toggleProxy', enabled },
    response => {
      if (response.success) {
        state.isProxyEnabled = enabled;
        updateUI();
      }
    }
  );
}

// Обработчик ротации прокси
function handleRotateProxy() {
  chrome.runtime.sendMessage(
    { action: 'rotateProxy' },
    response => {
      if (response.success) {
        state.currentProxyIndex = response.currentProxyIndex;
        updateUI();
      }
    }
  );
}

// Выбор конкретного прокси
function selectProxy(index) {
  if (index === state.currentProxyIndex) return;
  
  // Устанавливаем выбранный индекс
  state.currentProxyIndex = index;
  chrome.storage.local.set({ currentProxyIndex: index }, function() {
    // Обновляем настройки прокси, если прокси включен
    if (state.isProxyEnabled) {
      chrome.runtime.sendMessage({ action: 'rotateProxy' }, updateUI);
    } else {
      updateUI();
    }
  });
}

// Обработчик добавления нового прокси
function handleAddProxy(e) {
  e.preventDefault();
  
  const protocol = document.getElementById('proxyProtocol').value;
  const host = document.getElementById('proxyHost').value.trim();
  const port = document.getElementById('proxyPort').value.trim();
  const username = document.getElementById('proxyUsername').value.trim();
  const password = document.getElementById('proxyPassword').value.trim();
  
  if (!host || !port) {
    alert('Пожалуйста, заполните обязательные поля: хост и порт');
    return;
  }
  
  const newProxy = { protocol, host, port };
  if (username) newProxy.username = username;
  if (password) newProxy.password = password;
  
  chrome.runtime.sendMessage(
    { action: 'addProxy', proxy: newProxy },
    response => {
      if (response.success) {
        addProxyForm.reset();
        getState(); // Обновляем состояние и интерфейс
      }
    }
  );
}

// Обработчик удаления прокси
function handleDeleteProxy(e) {
  e.stopPropagation();
  const index = parseInt(e.target.dataset.index);
  
  if (confirm('Вы действительно хотите удалить этот прокси?')) {
    chrome.runtime.sendMessage(
      { action: 'removeProxy', index },
      response => {
        if (response.success) {
          getState(); // Обновляем состояние и интерфейс
        }
      }
    );
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Form elements
  const protocolSelect = document.getElementById('protocol');
  const serverInput = document.getElementById('server');
  const portInput = document.getElementById('port');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const enableBtn = document.getElementById('enableBtn');
  const disableBtn = document.getElementById('disableBtn');
  const statusMessage = document.getElementById('status-message');
  const statusIndicator = document.getElementById('status-indicator');
  
  // Tab navigation
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Show status message
  function showStatusMessage(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message ' + (isError ? 'error' : 'success');
    statusMessage.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  }
  
  // Update status indicator
  function updateStatusIndicator(enabled) {
    statusIndicator.textContent = enabled ? 'Enabled' : 'Disabled';
    statusIndicator.className = 'status-pill ' + (enabled ? 'status-on' : 'status-off');
  }
  
  // Load current proxy configuration
  function loadProxyConfig() {
    chrome.runtime.sendMessage({ action: 'getStatus' }, function(response) {
      if (response.success) {
        updateStatusIndicator(response.enabled);
        
        if (response.enabled) {
          protocolSelect.value = response.protocol || 'http';
          serverInput.value = response.server || '';
          portInput.value = response.port || '';
          usernameInput.value = response.username || '';
          passwordInput.value = response.password || '';
        }
      }
    });
  }
  
  // Enable proxy
  enableBtn.addEventListener('click', function() {
    const server = serverInput.value.trim();
    const port = portInput.value.trim();
    
    if (!server || !port) {
      showStatusMessage('Please enter server address and port', true);
      return;
    }
    
    const config = {
      action: 'setProxy',
      protocol: protocolSelect.value,
      server: server,
      port: parseInt(port, 10),
      username: usernameInput.value.trim(),
      password: passwordInput.value.trim()
    };
    
    chrome.runtime.sendMessage(config, function(response) {
      if (response.success) {
        showStatusMessage(response.message);
        updateStatusIndicator(true);
      } else {
        showStatusMessage(response.message || 'Failed to enable proxy', true);
      }
    });
  });
  
  // Disable proxy
  disableBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'disableProxy' }, function(response) {
      if (response.success) {
        showStatusMessage(response.message);
        updateStatusIndicator(false);
      } else {
        showStatusMessage(response.message || 'Failed to disable proxy', true);
      }
    });
  });
  
  // Tab navigation
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      console.log('Tab clicked:', button.dataset.tab);
      
      // Deactivate all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Activate selected tab
      button.classList.add('active');
      const targetTab = document.getElementById(button.dataset.tab);
      if (targetTab) {
        targetTab.classList.add('active');
      } else {
        console.error('Tab content not found:', button.dataset.tab);
      }
    });
  });
  
  // Check for URL parameters (from URL-based activation)
  const params = new URLSearchParams(window.location.search);
  if (params.has('status')) {
    if (params.get('status') === 'enabled') {
      const server = params.get('server');
      const port = params.get('port');
      const protocol = params.get('protocol') || 'http';
      
      showStatusMessage(`Proxy enabled: ${protocol.toUpperCase()} ${server}:${port}`, false);
      updateStatusIndicator(true);
      
      // Fill form fields
      serverInput.value = server || '';
      portInput.value = port || '';
      if (protocol) {
        protocolSelect.value = protocol;
      }
    } else if (params.get('status') === 'disabled') {
      showStatusMessage('Proxy disabled', false);
      updateStatusIndicator(false);
    }
  }
  
  // Load current proxy configuration on startup
  loadProxyConfig();
}); 