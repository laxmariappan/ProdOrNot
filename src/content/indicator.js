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

// Keep track of current state
let currentDomain = null;
let currentEnvironment = null;
let currentSettings = null;

// Initialize the indicator
async function initialize() {
    currentDomain = window.location.hostname;
    await checkAndInjectIndicator();
}

// Check if the current domain is marked and inject the indicator if needed
async function checkAndInjectIndicator() {
    try {
        // Get all settings
        const storage = await chrome.storage.sync.get([
            STORAGE_KEY,
            STORAGE_ENVIRONMENTS_KEY,
            STORAGE_INDICATOR_SETTINGS_KEY
        ]);
        
        const domains = storage[STORAGE_KEY] || {};
        const environments = storage[STORAGE_ENVIRONMENTS_KEY] || DEFAULT_ENVIRONMENTS;
        const indicatorSettings = storage[STORAGE_INDICATOR_SETTINGS_KEY] || DEFAULT_INDICATOR_SETTINGS;
        
        console.log('Current settings:', {
            domain: currentDomain,
            domainSettings: domains[currentDomain],
            indicatorSettings
        });
        
        // Remove existing indicator
        removeIndicator();
        
        // Check if current domain is marked
        const domainSettings = domains[currentDomain];
        if (!domainSettings) {
            console.log('Domain not marked:', currentDomain);
            return;
        }
        
        // Find environment settings
        const environment = environments.find(env => env.id === domainSettings.environmentId);
        if (!environment) {
            console.log('Environment not found for:', domainSettings.environmentId);
            return;
        }
        
        // Update current state
        currentEnvironment = environment;
        currentSettings = indicatorSettings;
        
        // Inject the indicator
        injectIndicator();
    } catch (error) {
        console.error('Error checking domain settings:', error);
    }
}

// Get CSS for different indicator styles
function getIndicatorStyles() {
    if (!currentEnvironment || !currentSettings) return null;
    
    console.log('Applying styles with settings:', currentSettings);
    
    const baseStyles = {
        position: 'fixed',
        top: '0',
        [currentSettings.position === 'top-right' ? 'right' : 'left']: '0',
        [currentSettings.position === 'top-right' ? 'left' : 'right']: 'auto',
        'z-index': '999999',
        'font-family': '-apple-system, BlinkMacSystemFont, sans-serif',
        'font-size': '12px',
        'font-weight': 'bold',
        'box-shadow': '0 2px 4px rgba(0,0,0,0.2)',
        'user-select': 'none',
        'pointer-events': 'none',
        'color': 'white',
        'background-color': currentEnvironment.color
    };

    if (currentSettings.style === 'ribbon') {
        return {
            ...baseStyles,
            padding: '4px 12px',
            'border-bottom-left-radius': currentSettings.position === 'top-right' ? '4px' : '0',
            'border-bottom-right-radius': currentSettings.position === 'top-left' ? '4px' : '0',
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
            'background-color': 'transparent',
            padding: '0'
        };

        if (currentSettings.position === 'top-left') {
            triangleStyles['border-width'] = '0 0 32px 32px';
            triangleStyles['border-color'] = `transparent transparent transparent ${currentEnvironment.color}`;
        } else {
            triangleStyles['border-width'] = '0 32px 32px 0';
            triangleStyles['border-color'] = `transparent ${currentEnvironment.color} transparent transparent`;
        }

        return triangleStyles;
    }
}

// Remove existing indicator
function removeIndicator() {
    const existingIndicator = document.getElementById('prodornot-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
}

// Inject the visual indicator
function injectIndicator() {
    if (!currentEnvironment || !currentSettings) return;
    
    // Remove any existing indicator
    removeIndicator();
    
    // Create the indicator element
    const indicator = document.createElement('div');
    indicator.id = 'prodornot-indicator';
    indicator.setAttribute('aria-label', `Environment: ${currentEnvironment.label}`);
    
    // Get and apply styles
    const styles = getIndicatorStyles();
    if (!styles) return;
    
    indicator.style.cssText = Object.entries(styles)
        .map(([key, value]) => `${key}: ${value}`)
        .join(';');
    
    // Add content based on style
    if (currentSettings.style === 'ribbon') {
        indicator.innerHTML = `
            <span>${currentEnvironment.icon}</span>
            <span>${currentEnvironment.label}</span>
        `;
    }
    
    // Add to page
    document.body.appendChild(indicator);
    console.log('Indicator injected with styles:', styles);
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        console.log('Storage changes detected:', changes);
        checkAndInjectIndicator();
    }
});

// Listen for messages from the options page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'UPDATE_INDICATOR') {
        checkAndInjectIndicator();
    }
});

// Initialize when the script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
} 