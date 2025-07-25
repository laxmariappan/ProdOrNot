// Storage keys
const STORAGE_KEY = 'prodornot_domains';
const STORAGE_ENVIRONMENTS_KEY = 'prodornot_environments';
const STORAGE_INDICATOR_SETTINGS_KEY = 'prodornot_indicator_settings';

// Default environments
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

// DOM Elements
const environmentsList = document.getElementById('environments-list');
const domainsList = document.getElementById('domains-list');
const addEnvironmentButton = document.getElementById('add-environment');
const environmentModal = document.getElementById('environment-modal');
const environmentForm = document.getElementById('environment-form');
const cancelEnvironmentButton = document.getElementById('cancel-environment');
const saveIndicatorSettingsButton = document.getElementById('save-indicator-settings');

// State
let environments = [];
let domains = {};
let editingEnvironmentId = null;

// Initialize the options page
async function initializeOptions() {
    try {
        // Load data from storage
        const storage = await chrome.storage.sync.get([
            STORAGE_KEY,
            STORAGE_ENVIRONMENTS_KEY,
            STORAGE_INDICATOR_SETTINGS_KEY
        ]);
        
        environments = storage[STORAGE_ENVIRONMENTS_KEY] || DEFAULT_ENVIRONMENTS;
        domains = storage[STORAGE_KEY] || {};
        
        // Load indicator settings
        const indicatorSettings = storage[STORAGE_INDICATOR_SETTINGS_KEY] || DEFAULT_INDICATOR_SETTINGS;
        document.querySelector(`input[name="indicator-style"][value="${indicatorSettings.style}"]`).checked = true;
        document.querySelector(`input[name="indicator-position"][value="${indicatorSettings.position}"]`).checked = true;
        
        // Render lists
        renderEnvironments();
        renderDomains();
        
        // Setup event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing options:', error);
    }
}

// Render environments list
function renderEnvironments() {
    environmentsList.innerHTML = environments.map(env => `
        <div class="environment-item">
            <div class="environment-info">
                <div class="environment-color" style="background-color: ${env.color}"></div>
                <span>${env.icon}</span>
                <span>${env.label}</span>
            </div>
            <div class="environment-actions">
                <button class="secondary-button" data-action="edit-environment" data-id="${env.id}">Edit</button>
                <button class="secondary-button" data-action="delete-environment" data-id="${env.id}">Delete</button>
            </div>
        </div>
    `).join('');
}

// Render domains list
function renderDomains() {
    const domainItems = Object.entries(domains).map(([domain, settings]) => {
        const environment = environments.find(env => env.id === settings.environmentId);
        if (!environment) return '';
        
        return `
            <div class="domain-item">
                <div class="domain-info">
                    <span>${environment.icon}</span>
                    <span>${domain}</span>
                </div>
                <button class="secondary-button" data-action="delete-domain" data-domain="${domain}">Remove</button>
            </div>
        `;
    });
    
    domainsList.innerHTML = domainItems.join('');
}

// Setup event listeners
function setupEventListeners() {
    // Environment list event delegation
    environmentsList.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const environmentId = button.dataset.id;

        if (action === 'edit-environment') {
            editEnvironment(environmentId);
        } else if (action === 'delete-environment') {
            deleteEnvironment(environmentId);
        }
    });

    // Domains list event delegation
    domainsList.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const domain = button.dataset.domain;

        if (action === 'delete-domain') {
            deleteDomain(domain);
        }
    });

    // Other event listeners
    addEnvironmentButton.addEventListener('click', () => showEnvironmentModal());
    cancelEnvironmentButton.addEventListener('click', hideEnvironmentModal);
    environmentForm.addEventListener('submit', handleEnvironmentSubmit);
    saveIndicatorSettingsButton.addEventListener('click', saveIndicatorSettings);
}

// Show environment modal
function showEnvironmentModal(environmentId = null) {
    editingEnvironmentId = environmentId;
    
    if (environmentId) {
        const environment = environments.find(env => env.id === environmentId);
        if (environment) {
            document.getElementById('env-label').value = environment.label;
            document.getElementById('env-color').value = environment.color;
            document.getElementById('env-icon').value = environment.icon;
        }
    } else {
        environmentForm.reset();
    }
    
    environmentModal.classList.add('active');
}

// Hide environment modal
function hideEnvironmentModal() {
    environmentModal.classList.remove('active');
    environmentForm.reset();
    editingEnvironmentId = null;
}

// Handle environment form submit
async function handleEnvironmentSubmit(event) {
    event.preventDefault();
    
    const label = document.getElementById('env-label').value;
    const color = document.getElementById('env-color').value;
    const icon = document.getElementById('env-icon').value;
    
    if (editingEnvironmentId) {
        // Update existing environment
        const index = environments.findIndex(env => env.id === editingEnvironmentId);
        if (index !== -1) {
            environments[index] = {
                ...environments[index],
                label,
                color,
                icon
            };
        }
    } else {
        // Add new environment
        const id = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
        environments.push({ id, label, color, icon });
    }
    
    try {
        await chrome.storage.sync.set({ [STORAGE_ENVIRONMENTS_KEY]: environments });
        renderEnvironments();
        hideEnvironmentModal();
    } catch (error) {
        console.error('Error saving environment:', error);
    }
}

// Edit environment
function editEnvironment(environmentId) {
    showEnvironmentModal(environmentId);
}

// Delete environment
async function deleteEnvironment(environmentId) {
    if (!confirm('Are you sure you want to delete this environment? This will also remove all domain markings using this environment.')) {
        return;
    }
    
    try {
        // Remove environment
        environments = environments.filter(env => env.id !== environmentId);
        await chrome.storage.sync.set({ [STORAGE_ENVIRONMENTS_KEY]: environments });
        
        // Remove domain markings using this environment
        for (const [domain, settings] of Object.entries(domains)) {
            if (settings.environmentId === environmentId) {
                delete domains[domain];
            }
        }
        await chrome.storage.sync.set({ [STORAGE_KEY]: domains });
        
        // Update UI
        renderEnvironments();
        renderDomains();
    } catch (error) {
        console.error('Error deleting environment:', error);
    }
}

// Delete domain
async function deleteDomain(domain) {
    if (!confirm('Are you sure you want to remove this domain marking?')) {
        return;
    }
    
    try {
        // Get current domains
        const storage = await chrome.storage.sync.get(STORAGE_KEY);
        const domains = storage[STORAGE_KEY] || {};
        
        // Delete the domain
        delete domains[domain];
        
        // Save updated domains
        await chrome.storage.sync.set({ [STORAGE_KEY]: domains });
        
        // Notify all tabs to update
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            try {
                if (tab.url && new URL(tab.url).hostname === domain) {
                    // Reload tabs with this domain
                    chrome.tabs.reload(tab.id);
                } else {
                    // Just update indicator for other tabs
                    chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_INDICATOR' });
                }
            } catch (error) {
                // Ignore errors for tabs where content script is not running
                console.log('Error updating tab:', error);
            }
        }
        
        // Update the UI
        renderDomains();
    } catch (error) {
        console.error('Error deleting domain:', error);
        alert('Failed to delete domain. Please try again.');
    }
}

// Save indicator settings
async function saveIndicatorSettings() {
    try {
        const style = document.querySelector('input[name="indicator-style"]:checked').value;
        const position = document.querySelector('input[name="indicator-position"]:checked').value;
        
        const indicatorSettings = { style, position };
        console.log('Saving indicator settings:', indicatorSettings);
        
        await chrome.storage.sync.set({ [STORAGE_INDICATOR_SETTINGS_KEY]: indicatorSettings });
        
        // Show success message
        saveIndicatorSettingsButton.textContent = 'Saved!';
        
        // Notify all tabs to update their indicators
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            try {
                await chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_INDICATOR' });
            } catch (error) {
                // Ignore errors for tabs where content script is not running
            }
        }
        
        setTimeout(() => {
            saveIndicatorSettingsButton.textContent = 'Save Indicator Settings';
        }, 2000);
    } catch (error) {
        console.error('Error saving indicator settings:', error);
        saveIndicatorSettingsButton.textContent = 'Error Saving!';
        setTimeout(() => {
            saveIndicatorSettingsButton.textContent = 'Save Indicator Settings';
        }, 2000);
    }
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', initializeOptions); 