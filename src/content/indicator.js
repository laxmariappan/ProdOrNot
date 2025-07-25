// Storage keys
const STORAGE_KEY = 'prodornot_domains';
const STORAGE_ENVIRONMENTS_KEY = 'prodornot_environments';
const STORAGE_INDICATOR_SETTINGS_KEY = 'prodornot_indicator_settings';

// Default environments (fallback)
const DEFAULT_ENVIRONMENTS = [
    { id: 'dev', label: 'Development', color: '#4caf50', icon: '🛠️' },
    { id: 'staging', label: 'Staging', color: '#ffc107', icon: '🧪' },
    { id: 'prod', label: 'Production', color: '#f44336', icon: '🚨' }
];

// Default indicator settings
const DEFAULT_INDICATOR_SETTINGS = {
    style: 'ribbon',
    position: 'top-right'
};

// Check if the current domain is marked and inject the indicator if needed
async function checkAndInjectIndicator() {
    try {
        const currentDomain = window.location.hostname;
        console.log('Checking domain:', currentDomain);
        
        // Get all settings
        const storage = await chrome.storage.sync.get([
            STORAGE_KEY,
            STORAGE_ENVIRONMENTS_KEY,
            STORAGE_INDICATOR_SETTINGS_KEY
        ]);
        
        const domains = storage[STORAGE_KEY] || {};
        const environments = storage[STORAGE_ENVIRONMENTS_KEY] || DEFAULT_ENVIRONMENTS;
        const indicatorSettings = storage[STORAGE_INDICATOR_SETTINGS_KEY] || DEFAULT_INDICATOR_SETTINGS;
        
        console.log('Current indicator settings:', indicatorSettings);
        
        // Check if current domain is marked
        const domainSettings = domains[currentDomain];
        if (!domainSettings) {
            console.log('Domain not marked');
            return;
        }
        
        // Find environment settings
        const environment = environments.find(env => env.id === domainSettings.environmentId);
        if (!environment) {
            console.log('Environment not found');
            return;
        }
        
        // Inject the indicator
        injectIndicator(environment, indicatorSettings);
    } catch (error) {
        console.error('Error checking domain settings:', error);
    }
}

// Get CSS for different indicator styles
function getIndicatorStyles(environment, settings) {
    console.log('Applying styles with settings:', settings);
    
    const baseStyles = {
        position: 'fixed',
        top: '0',
        [settings.position === 'top-right' ? 'right' : 'left']: '0',
        [settings.position === 'top-right' ? 'left' : 'right']: 'auto', // Important: reset the opposite property
        'z-index': '999999',
        'font-family': '-apple-system, BlinkMacSystemFont, sans-serif',
        'font-size': '12px',
        'font-weight': 'bold',
        'box-shadow': '0 2px 4px rgba(0,0,0,0.2)',
        'user-select': 'none',
        'pointer-events': 'none',
        'color': 'white',
        'background-color': environment.color
    };

    if (settings.style === 'ribbon') {
        return {
            ...baseStyles,
            padding: '4px 12px',
            'border-bottom-left-radius': settings.position === 'top-right' ? '4px' : '0',
            'border-bottom-right-radius': settings.position === 'top-left' ? '4px' : '0',
            display: 'flex',
            'align-items': 'center',
            gap: '4px'
        };
    } else { // triangle
        const triangleStyles = {
            ...baseStyles,
            width: '0',
            height: '0',
            'border-style': 'solid',
            'border-width': '0 32px 32px 0',
            'border-color': `transparent ${environment.color} transparent transparent`,
            'background-color': 'transparent',
            padding: '0'
        };

        if (settings.position === 'top-left') {
            triangleStyles['border-width'] = '0 0 32px 32px';
            triangleStyles['border-color'] = `transparent transparent transparent ${environment.color}`;
        }

        return triangleStyles;
    }
}

// Inject the visual indicator
function injectIndicator(environment, settings) {
    // Remove any existing indicator
    const existingIndicator = document.getElementById('prodornot-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Create the indicator element
    const indicator = document.createElement('div');
    indicator.id = 'prodornot-indicator';
    indicator.setAttribute('aria-label', `Environment: ${environment.label}`);
    
    // Get and apply styles
    const styles = getIndicatorStyles(environment, settings);
    indicator.style.cssText = Object.entries(styles)
        .map(([key, value]) => `${key}: ${value}`)
        .join(';');
    
    // Add content based on style
    if (settings.style === 'ribbon') {
        indicator.innerHTML = `
            <span>${environment.icon}</span>
            <span>${environment.label}</span>
        `;
    }
    
    // Add to page
    document.body.appendChild(indicator);
    console.log('Indicator injected with styles:', styles);
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && (
        changes[STORAGE_KEY] ||
        changes[STORAGE_ENVIRONMENTS_KEY] ||
        changes[STORAGE_INDICATOR_SETTINGS_KEY]
    )) {
        console.log('Storage changes detected:', changes);
        // Remove existing indicator if present
        const existingIndicator = document.getElementById('prodornot-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Recheck and inject if needed
        checkAndInjectIndicator();
    }
});

// Listen for messages from the options page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'UPDATE_INDICATOR') {
        checkAndInjectIndicator();
    }
});

// Initial check when content script loads
// Wait for document body to be available
if (document.body) {
    checkAndInjectIndicator();
} else {
    document.addEventListener('DOMContentLoaded', checkAndInjectIndicator);
} 