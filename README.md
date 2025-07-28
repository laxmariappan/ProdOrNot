# ProdOrNot - Chrome Environment Indicator

A minimal Chrome extension that helps you visually identify different environments (Development, Staging, Production) for your web applications.

**Set the environment**  

<img width="553" height="262" alt="Screenshot 2025-07-28 at 5 20 00 AM" src="https://github.com/user-attachments/assets/bdf45d02-c17b-484c-a661-e5baee146212" />  

**Indicator in action**  

<img width="582" height="151" alt="Screenshot 2025-07-28 at 5 20 58 AM" src="https://github.com/user-attachments/assets/ed8cc8bc-2d9f-4a00-9789-9eb6aa75baf7" />  

**Settings**  
<img width="992" height="904" alt="Screenshot 2025-07-28 at 5 22 46 AM" src="https://github.com/user-attachments/assets/42df4a05-2ed3-405d-a436-309b4e3f5d93" />  



## Features

- Mark any domain or subdomain with a visual environment indicator
- Customizable environments with labels, colors, and icons
- Quick access through popup menu
- Full settings page for managing environments and domains
- Customizable indicator style (Ribbon 🎗 or Triangle ◤)
- Configurable indicator position (Top Right or Top Left)
- Syncs across devices using Chrome Storage Sync
- Minimal performance impact - only runs on marked domains

## Installation

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

### Quick Marking (Popup)

1. Click the ProdOrNot icon in your Chrome toolbar
2. The popup will show the current domain
3. Select an environment from the dropdown
4. Click "Save" to mark the domain or "Remove" to unmark it

### Managing Environments (Settings)

1. Click the ProdOrNot icon in your Chrome toolbar
2. Click "Manage All Settings" at the bottom
3. In the settings page, you can:
   - Add new environments
   - Edit existing environments (label, color, icon)
   - Delete environments
   - View and manage marked domains

### Customizing the Indicator

1. In the settings page, under "Indicator Settings", you can:
   - Choose between Ribbon 🎗 (shows label and icon) or Triangle ◤ (compact)
   - Set the position to Top Right or Top Left
2. Changes apply immediately to all marked domains
3. Settings sync across all your devices

### Default Environments

The extension comes with three default environments:
- Development (🛠️ Green)
- Staging (🧪 Yellow)
- Production (🚨 Red)

You can customize these or add your own through the settings page.

## Storage

ProdOrNot uses Chrome's storage sync API to save your settings and domain markings. This means:
- Your settings sync across all your Chrome instances where you're signed in
- Settings persist even if you uninstall and reinstall the extension
- If sync is unavailable, it falls back to local storage

## Development

The extension is built using vanilla JavaScript and follows Chrome's Manifest V3 guidelines. The code is organized as follows:

```
ProdOrNot/
├─ src/
│   ├─ popup/           # Extension icon popup
│   ├─ options/         # Full settings page
│   ├─ content/         # Overlay indicator scripts
├─ public/              # Icons and assets
├─ manifest.json        # Extension manifest
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - See LICENSE file for details
