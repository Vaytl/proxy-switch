// Global variable to store current proxy configuration
let currentProxyConfig = null;
let isProxyEnabled = false;

// Load saved settings on startup
chrome.storage.local.get(['proxyConfig', 'isProxyEnabled'], function(result) {
  if (result.proxyConfig) {
    currentProxyConfig = result.proxyConfig;
    if (currentProxyConfig.enabled) {
      enableProxy(currentProxyConfig);
    }
  }
  if (result.isProxyEnabled !== undefined) {
    isProxyEnabled = result.isProxyEnabled;
  }
});

// Enable proxy with the specified configuration
async function enableProxy(config) {
  try {
    const proxyConfig = {
      mode: "fixed_servers",
      rules: {
        singleProxy: {
          scheme: config.protocol || "http",
          host: config.server || config.host,
          port: parseInt(config.port, 10)
        },
        bypassList: ["localhost", "127.0.0.1"]
      }
    };

    // Save configuration for status checks
    currentProxyConfig = {
      enabled: true,
      protocol: config.protocol || "http",
      server: config.server || config.host,
      port: parseInt(config.port, 10),
      username: config.username || '',
      password: config.password || ''
    };

    // Save to storage
    await chrome.storage.local.set({ 
      proxyConfig: currentProxyConfig,
      isProxyEnabled: true 
    });
    isProxyEnabled = true;

    // Apply proxy settings
    await chrome.proxy.settings.set({
      value: proxyConfig,
      scope: 'regular'
    });

    // Set up authentication if credentials provided
    if (currentProxyConfig.username && currentProxyConfig.password) {
      chrome.webRequest.onAuthRequired.addListener(
        proxyAuthHandler,
        { urls: ["<all_urls>"] }
      );
    }

    console.log('Proxy enabled:', currentProxyConfig.server + ':' + currentProxyConfig.port);
    return { success: true, message: "Proxy enabled successfully" };
  } catch (error) {
    console.error('Error enabling proxy:', error);
    return { success: false, message: "Failed to enable proxy" };
  }
}

// Disable proxy
async function disableProxy() {
  try {
    // Clear proxy settings
    await chrome.proxy.settings.set({
      value: { mode: "direct" },
      scope: 'regular'
    });

    // Remove authentication handler if exists
    try {
      chrome.webRequest.onAuthRequired.removeListener(proxyAuthHandler);
    } catch (e) {}

    // Clear current config
    currentProxyConfig = null;
    isProxyEnabled = false;
    
    // Update storage
    await chrome.storage.local.set({ 
      proxyConfig: null,
      isProxyEnabled: false 
    });

    console.log('Proxy disabled');
    return { success: true, message: "Proxy disabled successfully" };
  } catch (error) {
    console.error('Error disabling proxy:', error);
    return { success: false, message: "Failed to disable proxy" };
  }
}

// Handle proxy authentication
function proxyAuthHandler(details) {
  if (currentProxyConfig && currentProxyConfig.username && currentProxyConfig.password) {
    return {
      authCredentials: {
        username: currentProxyConfig.username,
        password: currentProxyConfig.password
      }
    };
  }
  return {};
}

// Handle URL-based proxy control
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  try {
    const url = new URL(details.url);
    
    // Enable proxy via URL (old format: https://setproxy/server:port)
    if (url.hostname === 'setproxy') {
      const proxyString = url.pathname.substring(1);
      const [server, port] = proxyString.split(':');
      
      if (server && port) {
        const params = new URLSearchParams(url.search);
        await enableProxy({
          protocol: params.get('protocol') || 'http',
          server: server,
          port: parseInt(port, 10),
          username: params.get('username'),
          password: params.get('password')
        });
        
        // Redirect to popup with status
        chrome.tabs.update(details.tabId, {
          url: chrome.runtime.getURL("popup.html") + 
               "?status=enabled&server=" + server + 
               "&port=" + port
        });
      }
    }
    // Disable proxy (old format: https://disableproxy)
    else if (url.hostname === 'disableproxy') {
      await disableProxy();
      
      // Redirect to popup with status
      chrome.tabs.update(details.tabId, {
        url: chrome.runtime.getURL("popup.html") + "?status=disabled"
      });
    }
  } catch (error) {
    console.error('Error handling navigation:', error);
  }
}, {
  url: [
    { hostEquals: 'setproxy' },
    { hostEquals: 'disableproxy' }
  ]
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.action) {
        case 'setProxy':
          const result = await enableProxy(request);
          sendResponse(result);
          break;
          
        case 'disableProxy':
          const disableResult = await disableProxy();
          sendResponse(disableResult);
          break;
          
        case 'getStatus':
          sendResponse({
            success: true,
            enabled: currentProxyConfig !== null,
            ...currentProxyConfig
          });
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, message: error.message });
    }
  })();
  return true; // Keep message channel open for async response
});

// Load saved configuration on startup
chrome.runtime.onStartup.addListener(async () => {
  try {
    const { proxyConfig } = await chrome.storage.local.get('proxyConfig');
    if (proxyConfig && proxyConfig.enabled) {
      await enableProxy(proxyConfig);
    }
  } catch (error) {
    console.error('Error loading saved configuration:', error);
  }
}); 