/**
 * Politico Hierarchy Visualization
 * Interactive visualization of DRC government structure
 */

(function() {
    'use strict';

    window.PoliticoVisualization = {
        currentView: 'tree',
        
        // Initialize visualization
        init(containerId) {
            this.container = document.getElementById(containerId);
            if (!this.container) {
                console.error('Visualization container not found');
                return;
            }
        },
        
        // Render the hierarchy tree
        renderTree() {
            if (!this.container) return;
            
            // Build hierarchy starting from President
            const hierarchy = window.PoliticoData.buildHierarchy('POS001');
            
            this.container.innerHTML = '';
            this.container.className = 'hierarchy-container';
            
            const treeDiv = document.createElement('div');
            treeDiv.className = 'hierarchy-tree';
            
            this.renderNode(hierarchy, treeDiv, 0);
            
            this.container.appendChild(treeDiv);
        },
        
        // Render a single node and its children
        renderNode(node, parentElement, level) {
            const nodeWrapper = document.createElement('div');
            nodeWrapper.className = 'hierarchy-node-wrapper';
            nodeWrapper.dataset.level = level;
            
            const nodeCard = document.createElement('div');
            nodeCard.className = 'hierarchy-node';
            nodeCard.dataset.positionId = node.position.Position_ID;
            
            // Add level-specific styling
            if (level === 0) nodeCard.classList.add('node-level-0');
            else if (level === 1) nodeCard.classList.add('node-level-1');
            else if (level === 2) nodeCard.classList.add('node-level-2');
            else nodeCard.classList.add('node-level-3');
            
            // Node content
            const nodeContent = document.createElement('div');
            nodeContent.className = 'hierarchy-node-content';
            
            // Role title
            const roleTitle = document.createElement('div');
            roleTitle.className = 'hierarchy-node-title';
            roleTitle.textContent = node.position.Role_Title;
            nodeContent.appendChild(roleTitle);
            
            // Person name if available
            if (node.person) {
                const personName = document.createElement('div');
                personName.className = 'hierarchy-node-person';
                personName.textContent = node.person.Full_Name;
                nodeContent.appendChild(personName);
            } else {
                const vacant = document.createElement('div');
                vacant.className = 'hierarchy-node-vacant';
                vacant.textContent = '(Structural position)';
                nodeContent.appendChild(vacant);
            }
            
            // Position details
            if (node.position.Level) {
                const level = document.createElement('div');
                level.className = 'hierarchy-node-meta';
                level.textContent = `Level ${node.position.Level}`;
                nodeContent.appendChild(level);
            }
            
            nodeCard.appendChild(nodeContent);
            
            // Add click handler for details
            nodeCard.addEventListener('click', () => {
                this.showNodeDetails(node);
            });
            
            nodeWrapper.appendChild(nodeCard);
            
            // Render children
            if (node.children && node.children.length > 0) {
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'hierarchy-children';
                
                node.children.forEach(child => {
                    this.renderNode(child, childrenContainer, level + 1);
                });
                
                nodeWrapper.appendChild(childrenContainer);
            }
            
            parentElement.appendChild(nodeWrapper);
        },
        
        // Show detailed information about a node
        showNodeDetails(node) {
            const modal = document.createElement('div');
            modal.className = 'hierarchy-modal';
            modal.innerHTML = `
                <div class="hierarchy-modal-content">
                    <div class="hierarchy-modal-header">
                        <h3>${node.position.Role_Title}</h3>
                        <button class="hierarchy-modal-close" onclick="this.closest('.hierarchy-modal').remove()">×</button>
                    </div>
                    <div class="hierarchy-modal-body">
                        ${node.person ? `
                            <div class="detail-section">
                                <strong>Officeholder:</strong>
                                <p>${node.person.Full_Name}</p>
                            </div>
                            <div class="detail-section">
                                <strong>Role Category:</strong>
                                <p>${node.person.Current_Role_Category}</p>
                            </div>
                            ${node.person.Notes ? `
                                <div class="detail-section">
                                    <strong>Notes:</strong>
                                    <p>${node.person.Notes}</p>
                                </div>
                            ` : ''}
                            ${node.person.Source_Label ? `
                                <div class="detail-section">
                                    <strong>Source:</strong>
                                    <p>${node.person.Source_Label}</p>
                                </div>
                            ` : ''}
                        ` : '<p class="text-muted">This is a structural position without a named officeholder.</p>'}
                        
                        <div class="detail-section">
                            <strong>Position Details:</strong>
                            <p>Level: ${node.position.Level || 'N/A'}</p>
                            <p>Rank Order: ${node.position.Rank_Order || 'N/A'}</p>
                            <p>Position ID: ${node.position.Position_ID}</p>
                        </div>
                        
                        ${node.position.Source_URL ? `
                            <div class="detail-section">
                                <strong>Reference:</strong>
                                <p><a href="${node.position.Source_URL}" target="_blank" rel="noopener">${node.position.Source_URL}</a></p>
                            </div>
                        ` : ''}
                        
                        <div class="detail-section">
                            <button class="hierarchy-btn" onclick="PoliticoVisualization.showChainOfCommand('${node.position.Position_ID}')">
                                View Chain of Command
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        },
        
        // Show chain of command for a position
        showChainOfCommand(positionId) {
            const chain = window.PoliticoData.getChainOfCommand(positionId);
            
            // Close any existing modals
            document.querySelectorAll('.hierarchy-modal').forEach(m => m.remove());
            
            const modal = document.createElement('div');
            modal.className = 'hierarchy-modal';
            
            let chainHTML = '<div class="chain-of-command">';
            
            chain.forEach((item, index) => {
                chainHTML += `
                    <div class="chain-item">
                        <div class="chain-rank">Level ${item.position.Level || index + 1}</div>
                        <div class="chain-card">
                            <div class="chain-title">${item.position.Role_Title}</div>
                            ${item.person ? `
                                <div class="chain-person">${item.person.Full_Name}</div>
                            ` : '<div class="chain-vacant">(Structural)</div>'}
                        </div>
                        ${index < chain.length - 1 ? '<div class="chain-arrow">↓</div>' : ''}
                    </div>
                `;
            });
            
            chainHTML += '</div>';
            
            modal.innerHTML = `
                <div class="hierarchy-modal-content">
                    <div class="hierarchy-modal-header">
                        <h3>Chain of Command</h3>
                        <button class="hierarchy-modal-close" onclick="this.closest('.hierarchy-modal').remove()">×</button>
                    </div>
                    <div class="hierarchy-modal-body">
                        <p class="modal-description">This shows the reporting structure from the top leadership down to the selected position.</p>
                        ${chainHTML}
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        },
        
        // Render list view
        renderList() {
            if (!this.container) return;
            
            this.container.innerHTML = '';
            this.container.className = 'hierarchy-list-container';
            
            const positions = window.PoliticoData.positions
                .filter(p => p.Is_Named_Office_Holder === 'True')
                .sort((a, b) => (a.Rank_Order || 999) - (b.Rank_Order || 999));
            
            const listDiv = document.createElement('div');
            listDiv.className = 'hierarchy-list';
            
            positions.forEach(position => {
                const person = position.Person_ID ? window.PoliticoData.getPerson(position.Person_ID) : null;
                
                const card = document.createElement('div');
                card.className = 'hierarchy-list-card';
                card.innerHTML = `
                    <div class="list-card-header">
                        <span class="list-card-rank">Rank ${position.Rank_Order || 'N/A'}</span>
                        <span class="list-card-level">Level ${position.Level || 'N/A'}</span>
                    </div>
                    <div class="list-card-title">${position.Role_Title}</div>
                    ${person ? `
                        <div class="list-card-person">${person.Full_Name}</div>
                    ` : '<div class="list-card-vacant">(Vacant)</div>'}
                    <button class="list-card-btn" data-position-id="${position.Position_ID}">View Details</button>
                `;
                
                card.querySelector('.list-card-btn').addEventListener('click', () => {
                    const hierarchy = window.PoliticoData.buildHierarchy(position.Position_ID);
                    this.showNodeDetails(hierarchy);
                });
                
                listDiv.appendChild(card);
            });
            
            this.container.appendChild(listDiv);
        },
        
        // Toggle between views
        toggleView(viewType) {
            this.currentView = viewType;
            
            if (viewType === 'tree') {
                this.renderTree();
            } else if (viewType === 'list') {
                this.renderList();
            }
        }
    };
})();
