/**
 * Politico Page Controller
 * Main controller for the Politico section
 */

(function() {
    'use strict';

    window.PoliticoController = {
        initialized: false,
        
        // Initialize the Politico page
        async init() {
            if (this.initialized) return;
            
            try {
                // Show loading state
                this.showLoading();
                
                // Load data
                await window.PoliticoData.loadData();
                
                // Initialize components
                window.PoliticoConcierge.init();
                window.PoliticoVisualization.init('politico-viz-container');
                
                // Render initial UI
                this.renderStats();
                this.renderChat();
                this.renderVisualization();
                
                // Set up event listeners
                this.setupEventListeners();
                
                this.initialized = true;
                this.hideLoading();
                
                console.log('Politico page initialized successfully');
            } catch (error) {
                console.error('Error initializing Politico page:', error);
                this.showError('Failed to load Politico data. Please refresh the page.');
            }
        },
        
        showLoading() {
            const container = document.getElementById('view-politico');
            if (container) {
                container.innerHTML = `
                    <div class="politico-loading">
                        <div class="politico-loading-spinner"></div>
                        <p>Loading DRC Government Data...</p>
                    </div>
                `;
            }
        },
        
        hideLoading() {
            // Loading state will be replaced by actual content
        },
        
        showError(message) {
            const container = document.getElementById('view-politico');
            if (container) {
                container.innerHTML = `
                    <div class="politico-header">
                        <h1>Error</h1>
                        <p style="color: #ff4444;">${message}</p>
                    </div>
                `;
            }
        },
        
        renderStats() {
            const stats = window.PoliticoData.getStats();
            const statsContainer = document.getElementById('politico-stats');
            
            if (statsContainer) {
                statsContainer.innerHTML = `
                    <div class="politico-stat-card">
                        <span class="politico-stat-value">${stats.totalPeople}</span>
                        <span class="politico-stat-label">Officials</span>
                    </div>
                    <div class="politico-stat-card">
                        <span class="politico-stat-value">${stats.totalPositions}</span>
                        <span class="politico-stat-label">Positions</span>
                    </div>
                    <div class="politico-stat-card">
                        <span class="politico-stat-value">${stats.namedOfficeholders}</span>
                        <span class="politico-stat-label">Named Roles</span>
                    </div>
                    <div class="politico-stat-card">
                        <span class="politico-stat-value">${stats.branches}</span>
                        <span class="politico-stat-label">Branches</span>
                    </div>
                    <div class="politico-stat-card">
                        <span class="politico-stat-value">${stats.institutions}</span>
                        <span class="politico-stat-label">Institutions</span>
                    </div>
                `;
            }
        },
        
        renderChat() {
            const messagesContainer = document.getElementById('politico-chat-messages');
            
            if (messagesContainer) {
                // Show welcome message
                if (window.PoliticoConcierge.chatHistory.length === 0) {
                    messagesContainer.innerHTML = `
                        <div class="politico-chat-message assistant">
                            <div class="politico-chat-avatar">AI</div>
                            <div class="politico-chat-bubble">
                                Welcome to the DRC Government Information System! I'm your dedicated concierge for questions about the Democratic Republic of the Congo's government structure.
                                
                                I can help you with:
                                • Information about specific officials
                                • Government positions and roles
                                • The chain of command
                                • Statistics about the government structure
                                
                                What would you like to know?
                            </div>
                        </div>
                    `;
                } else {
                    this.updateChatMessages();
                }
            }
        },
        
        renderVisualization() {
            // Initial render of tree view
            window.PoliticoVisualization.renderTree();
        },
        
        setupEventListeners() {
            // Chat send button
            const sendBtn = document.getElementById('politico-chat-send');
            const chatInput = document.getElementById('politico-chat-input');
            
            if (sendBtn && chatInput) {
                sendBtn.addEventListener('click', () => this.handleSendMessage());
                chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.handleSendMessage();
                    }
                });
            }
            
            // Visualization view toggle buttons
            const treeViewBtn = document.getElementById('viz-tree-view');
            const listViewBtn = document.getElementById('viz-list-view');
            
            if (treeViewBtn) {
                treeViewBtn.addEventListener('click', () => {
                    window.PoliticoVisualization.toggleView('tree');
                    treeViewBtn.classList.add('active');
                    if (listViewBtn) listViewBtn.classList.remove('active');
                });
            }
            
            if (listViewBtn) {
                listViewBtn.addEventListener('click', () => {
                    window.PoliticoVisualization.toggleView('list');
                    listViewBtn.classList.add('active');
                    if (treeViewBtn) treeViewBtn.classList.remove('active');
                });
            }
            
            // Show hierarchy button
            const showHierarchyBtn = document.getElementById('show-hierarchy-btn');
            if (showHierarchyBtn) {
                showHierarchyBtn.addEventListener('click', () => {
                    document.getElementById('politico-viz-section').scrollIntoView({ 
                        behavior: 'smooth' 
                    });
                });
            }
        },
        
        async handleSendMessage() {
            const input = document.getElementById('politico-chat-input');
            const question = input.value.trim();
            
            if (!question) return;
            
            // Clear input
            input.value = '';
            
            // Add user message to UI
            this.addMessageToUI('user', question);
            
            // Get response from concierge
            const response = await window.PoliticoConcierge.askQuestion(question);
            
            // Add assistant response to UI
            this.addMessageToUI('assistant', response);
        },
        
        addMessageToUI(type, message) {
            const messagesContainer = document.getElementById('politico-chat-messages');
            if (!messagesContainer) return;
            
            const messageDiv = document.createElement('div');
            messageDiv.className = `politico-chat-message ${type}`;
            
            const avatar = type === 'user' ? 'YOU' : 'AI';
            
            messageDiv.innerHTML = `
                <div class="politico-chat-avatar">${avatar}</div>
                <div class="politico-chat-bubble">${this.escapeHtml(message)}</div>
            `;
            
            messagesContainer.appendChild(messageDiv);
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        },
        
        updateChatMessages() {
            const messagesContainer = document.getElementById('politico-chat-messages');
            if (!messagesContainer) return;
            
            messagesContainer.innerHTML = '';
            
            window.PoliticoConcierge.chatHistory.forEach(msg => {
                this.addMessageToUI(msg.type, msg.message);
            });
        },
        
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        clearChat() {
            window.PoliticoConcierge.clearHistory();
            this.renderChat();
        }
    };
})();
