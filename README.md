# ProxySwitch 🔄

A browser extension for quick and easy proxy server management. ProxySwitch allows you to easily enable or disable proxy connection with a clean, user-friendly interface.

## Features ✨

- Support for multiple protocols:
  - HTTP
  - HTTPS
  - SOCKS4
  - SOCKS5
- Quick proxy control via browser address bar
- User-friendly interface for proxy configuration
- Optional authentication support (username/password)
- Settings persistence between browser sessions
- Real-time status indicators

## Usage 🚀

### Method 1: Using the Interface
1. Click the ProxySwitch icon in your browser toolbar
2. Select the proxy protocol (HTTP, HTTPS, SOCKS4, SOCKS5)
3. Enter the proxy server address and port
4. Add username and password if required
5. Click "Enable Proxy" to activate

### Method 2: Using the Address Bar ⚡
Quick enable proxy by typing in your browser's address bar:
```
https://setproxy/server:port
```

Examples:
- `https://setproxy/proxy.example.com:8080`
- `https://setproxy/127.0.0.1:1080`

With protocol and authentication:
```
https://setproxy/server:port?protocol=socks5&username=user&password=pass
```

To disable the proxy, type:
```
https://disableproxy
```

## Installation 🔧

1. Download the extension files
2. Open your browser's extension page
   - Chrome: chrome://extensions
   - Edge: edge://extensions
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder

## License 📝

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Version History 📅

- 1.0.0 (2025)
  - Initial release
  - Basic proxy management
  - Multiple protocol support
  - URL-based control

## Acknowledgments 🙏

- Built with Chrome Extensions API

## Support ⭐

If you find this extension helpful, please consider giving it a star! Your support helps others discover this project.

If you encounter any issues or have suggestions, please open an issue on GitHub. 