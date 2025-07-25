// Storage keys
const STORAGE_KEY = 'prodornot_domains';
const STORAGE_ENVIRONMENTS_KEY = 'prodornot_environments';

// Default environments
const DEFAULT_ENVIRONMENTS = [
    { id: 'dev', label: 'Development', color: '#4caf50', icon: '🛠️' },
    { id: 'staging', label: 'Staging', color: '#ffc107', icon: '🧪' },
    { id: 'prod', label: 'Production', color: '#f44336', icon: '🚨' }
];

// DOM Elements
const currentDomainElement = document.getElementById('current-domain');
const environmentSelect = document.getElementById('environment-select');
const saveButton = document.getElementById('save-environment');
const removeButton = document.getElementById('remove-environment');
const settingsLink = document.getElementById('open-settings');

// Current domain state
let currentDomain = '';
let currentTab = null;

// Initialize the popup
async function initializePopup() {
    try {
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        currentTab = tab;
        currentDomain = new URL(tab.url).hostname;
        currentDomainElement.textContent = currentDomain;

        // Load environments
        await loadEnvironments();
        
        // Load domain settings
        await loadDomainSettings();

        // Setup event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing popup:', error);
    }
}

// Load environments from storage or defaults
async function loadEnvironments() {
    try {
        const storage = await chrome.storage.sync.get(STORAGE_ENVIRONMENTS_KEY);
        const environments = storage[STORAGE_ENVIRONMENTS_KEY] || DEFAULT_ENVIRONMENTS;
        
        // Clear existing options except the placeholder
        environmentSelect.innerHTML = '<option value="">Select Environment</option>';
        
        // Add environment options
        environments.forEach(env => {
            const option = document.createElement('option');
            option.value = env.id;
            option.textContent = `${env.icon} ${env.label}`;
            environmentSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading environments:', error);
    }
}

// Load domain settings
async function loadDomainSettings() {
    try {
        const storage = await chrome.storage.sync.get(STORAGE_KEY);
        const domains = storage[STORAGE_KEY] || {};
        
        if (domains[currentDomain]) {
            environmentSelect.value = domains[currentDomain].environmentId;
            removeButton.style.display = 'block';
        } else {
            environmentSelect.value = '';
            removeButton.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading domain settings:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    saveButton.addEventListener('click', saveDomainSettings);
    removeButton.addEventListener('click', removeDomainSettings);
    settingsLink.addEventListener('click', openSettings);
}

// Save domain settings
async function saveDomainSettings() {
    try {
        const environmentId = environmentSelect.value;
        if (!environmentId) return;

        const storage = await chrome.storage.sync.get(STORAGE_KEY);
        const domains = storage[STORAGE_KEY] || {};

        domains[currentDomain] = {
            environmentId,
            updatedAt: new Date().toISOString()
        };

        await chrome.storage.sync.set({ [STORAGE_KEY]: domains });
        
        // Reload the current tab to apply changes
        chrome.tabs.reload(currentTab.id);
        
        // Close the popup
        window.close();
    } catch (error) {
        console.error('Error saving domain settings:', error);
    }
}

// Remove domain settings
async function removeDomainSettings() {
    try {
        const storage = await chrome.storage.sync.get(STORAGE_KEY);
        const domains = storage[STORAGE_KEY] || {};

        delete domains[currentDomain];
        await chrome.storage.sync.set({ [STORAGE_KEY]: domains });
        
        // Reload the current tab to apply changes
        chrome.tabs.reload(currentTab.id);
        
        // Close the popup
        window.close();
    } catch (error) {
        console.error('Error removing domain settings:', error);
    }
}

// Open settings page
function openSettings() {
    chrome.runtime.openOptionsPage();
}

// Initialize the popup when the document is loaded
document.addEventListener('DOMContentLoaded', initializePopup); 