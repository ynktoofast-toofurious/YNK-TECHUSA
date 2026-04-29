/**
 * Politico Chat Concierge
 * AI-powered assistant for DRC Government data queries
 */

(function() {
    'use strict';

    window.PoliticoConcierge = {
        chatHistory: [],
        
        // Initialize the concierge
        init() {
            console.log('Politico Concierge initialized');
        },
        
        // Process user question
        async askQuestion(question) {
            const lowerQuestion = question.toLowerCase();
            let response = '';
            
            // Add to history
            this.chatHistory.push({
                type: 'user',
                message: question,
                timestamp: new Date()
            });
            
            try {
                // Pattern matching for common queries
                if (lowerQuestion.includes('president') || lowerQuestion.includes('tshisekedi')) {
                    response = this.answerPresidentQuery();
                } else if (lowerQuestion.includes('prime minister') || lowerQuestion.includes('suminwa')) {
                    response = this.answerPrimeMinisterQuery();
                } else if (lowerQuestion.includes('how many') || lowerQuestion.includes('total')) {
                    response = this.answerCountQuery(lowerQuestion);
                } else if (lowerQuestion.includes('who is') || lowerQuestion.includes('who are')) {
                    response = this.answerWhoQuery(lowerQuestion);
                } else if (lowerQuestion.includes('chain of command') || lowerQuestion.includes('hierarchy')) {
                    response = this.answerHierarchyQuery(lowerQuestion);
                } else if (lowerQuestion.includes('minister') && !lowerQuestion.includes('prime')) {
                    response = this.answerMinisterQuery(lowerQuestion);
                } else if (lowerQuestion.includes('vice') || lowerQuestion.includes('vice-premier')) {
                    response = this.answerViceMinisterQuery();
                } else {
                    response = this.answerGeneralQuery(lowerQuestion);
                }
                
                // Add response to history
                this.chatHistory.push({
                    type: 'assistant',
                    message: response,
                    timestamp: new Date()
                });
                
                return response;
            } catch (error) {
                console.error('Error processing question:', error);
                const errorResponse = 'I apologize, but I encountered an error processing your question. Please try rephrasing it.';
                this.chatHistory.push({
                    type: 'assistant',
                    message: errorResponse,
                    timestamp: new Date()
                });
                return errorResponse;
            }
        },
        
        answerPresidentQuery() {
            const president = window.PoliticoData.persons.find(p => p.Person_ID === 'PER001');
            if (president) {
                return `The current President of the Democratic Republic of the Congo is ${president.Full_Name}. He serves as the Head of State.`;
            }
            return 'Information about the President is currently being loaded.';
        },
        
        answerPrimeMinisterQuery() {
            const pm = window.PoliticoData.persons.find(p => p.Person_ID === 'PER002');
            if (pm) {
                return `The current Prime Minister is ${pm.Full_Name}. According to official records, she has been serving since April 1, 2024, and the Suminwa II government was published in August 2025. She serves as the Head of Government.`;
            }
            return 'Information about the Prime Minister is currently being loaded.';
        },
        
        answerCountQuery(question) {
            const stats = window.PoliticoData.getStats();
            
            if (question.includes('minister')) {
                const ministers = window.PoliticoData.positions.filter(p => 
                    p.Role_Title.toLowerCase().includes('ministre') && p.Is_Named_Office_Holder === 'True'
                );
                return `There are ${ministers.length} ministers in the current Suminwa II government, including the Prime Minister, Vice Prime Ministers, and Ministers of State.`;
            } else if (question.includes('people') || question.includes('officials')) {
                return `The database contains ${stats.totalPeople} government officials, with ${stats.namedOfficeholders} named officeholders currently in positions.`;
            } else if (question.includes('position')) {
                return `There are ${stats.totalPositions} positions tracked in the government structure, including both named positions and structural/institutional rows.`;
            }
            
            return `The DRC government database contains: ${stats.totalPeople} officials, ${stats.totalPositions} positions across ${stats.branches} branches and ${stats.institutions} institutions.`;
        },
        
        answerWhoQuery(question) {
            // Extract potential name or role from question
            const searchResults = window.PoliticoData.search(question);
            
            if (searchResults.people.length > 0) {
                const person = searchResults.people[0];
                const position = window.PoliticoData.positions.find(p => p.Person_ID === person.Person_ID);
                
                if (position) {
                    return `${person.Full_Name} serves as ${position.Role_Title}. ${person.Notes || ''}`;
                }
                return `${person.Full_Name} is listed as ${person.Current_Role_Category}.`;
            }
            
            if (searchResults.positions.length > 0) {
                const position = searchResults.positions[0];
                if (position.Person_ID) {
                    const person = window.PoliticoData.getPerson(position.Person_ID);
                    if (person) {
                        return `The ${position.Role_Title} is currently held by ${person.Full_Name}.`;
                    }
                }
                return `The position of ${position.Role_Title} is tracked in our database.`;
            }
            
            return 'I could not find specific information about that person or role. Could you provide more details or try a different search term?';
        },
        
        answerHierarchyQuery(question) {
            return 'To view the complete chain of command and government hierarchy, please click the "Visualize Hierarchy" button below the chat. This will show you the organizational structure starting from the President down through all levels of government.';
        },
        
        answerMinisterQuery(question) {
            const ministers = window.PoliticoData.positions.filter(p => 
                p.Role_Title.toLowerCase().includes('ministre') && 
                p.Is_Named_Office_Holder === 'True' &&
                !p.Role_Title.toLowerCase().includes('premier')
            );
            
            if (question.includes('foreign') || question.includes('affairs') || question.includes('affaires étrangères')) {
                const fm = ministers.find(m => m.Role_Title.toLowerCase().includes('affaires étrangères'));
                if (fm) {
                    const person = window.PoliticoData.getPerson(fm.Person_ID);
                    return `${person.Full_Name} serves as ${fm.Role_Title}.`;
                }
            }
            
            if (question.includes('defense') || question.includes('défense')) {
                const dm = ministers.find(m => m.Role_Title.toLowerCase().includes('défense'));
                if (dm) {
                    const person = window.PoliticoData.getPerson(dm.Person_ID);
                    return `${person.Full_Name} serves as ${dm.Role_Title}.`;
                }
            }
            
            const ministerList = ministers.slice(0, 5).map(m => {
                const person = window.PoliticoData.getPerson(m.Person_ID);
                return `• ${person.Full_Name} - ${m.Role_Title}`;
            }).join('\n');
            
            return `Here are some of the ministers in the Suminwa II government:\n\n${ministerList}\n\nFor a complete list, please ask about specific ministries or use the hierarchy visualization.`;
        },
        
        answerViceMinisterQuery() {
            const viceMinsters = window.PoliticoData.positions.filter(p => 
                p.Role_Title.toLowerCase().includes('vice-premier') && 
                p.Is_Named_Office_Holder === 'True'
            );
            
            const vpList = viceMinsters.map(vp => {
                const person = window.PoliticoData.getPerson(vp.Person_ID);
                return `• ${person.Full_Name} - ${vp.Role_Title}`;
            }).join('\n');
            
            return `There are ${viceMinsters.length} Vice Prime Ministers in the current government:\n\n${vpList}`;
        },
        
        answerGeneralQuery(question) {
            // Try general search
            const searchResults = window.PoliticoData.search(question);
            
            if (searchResults.people.length > 0 || searchResults.positions.length > 0) {
                let response = 'I found the following relevant information:\n\n';
                
                if (searchResults.people.length > 0) {
                    response += 'People:\n';
                    searchResults.people.slice(0, 3).forEach(person => {
                        response += `• ${person.Full_Name} - ${person.Current_Role_Category}\n`;
                    });
                }
                
                if (searchResults.positions.length > 0) {
                    response += '\nPositions:\n';
                    searchResults.positions.slice(0, 3).forEach(position => {
                        const person = position.Person_ID ? window.PoliticoData.getPerson(position.Person_ID) : null;
                        response += `• ${position.Role_Title}${person ? ` (${person.Full_Name})` : ''}\n`;
                    });
                }
                
                return response;
            }
            
            return `I'm here to help you understand the DRC government structure. You can ask me about:
• Specific officials (e.g., "Who is the President?")
• Government positions (e.g., "Who are the Vice Prime Ministers?")
• Statistics (e.g., "How many ministers are there?")
• The chain of command

You can also visualize the hierarchy using the button below.`;
        },
        
        // Clear chat history
        clearHistory() {
            this.chatHistory = [];
        }
    };
})();
