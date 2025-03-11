// DOM elements
const proxyToggle = document.getElementById('proxyToggle');
const statusText = document.getElementById('statusText');
const serverInput = document.getElementById('server');
const portInput = document.getElementById('port');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const enableBtn = document.getElementById('enableBtn');
const disableBtn = document.getElementById('disableBtn');
const statusDiv = document.getElementById('status');

// Application state
let state = {
  isProxyEnabled: false
};

// Get current state from background script
function getState() {
  chrome.runtime.sendMessage({ action: 'getState' }, response => {
    state = response;
    updateUI();
  });
}

// Update interface based on state
function updateUI() {
  // Update toggle
  proxyToggle.checked = state.isProxyEnabled;
  statusText.textContent = state.isProxyEnabled ? 'Enabled' : 'Disabled';
}

// Proxy toggle handler
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