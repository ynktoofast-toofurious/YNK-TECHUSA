/**
 * DRC Government Politico Data Module
 * Manages the star schema data for government hierarchy
 */

(function() {
    'use strict';

    // Data will be loaded from CSV files
    window.PoliticoData = {
        persons: [],
        positions: [],
        institutions: [],
        branches: [],
        roleCategories: [],
        geography: [],
        relationships: [],
        measures: [],
        
        // Load all data from CSV files
        async loadData() {
            try {
                const baseUrl = '../Politico/drc_government_powerbi_star_schema_package/';
                
                const [
                    personsResp,
                    positionsResp,
                    institutionsResp,
                    branchesResp,
                    roleCategoriesResp,
                    geographyResp,
                    relationshipsResp,
                    measuresResp
                ] = await Promise.all([
                    fetch(baseUrl + 'Dim_Person.csv'),
                    fetch(baseUrl + 'Fact_GovernmentPosition.csv'),
                    fetch(baseUrl + 'Dim_Institution.csv'),
                    fetch(baseUrl + 'Dim_Branch.csv'),
                    fetch(baseUrl + 'Dim_RoleCategory.csv'),
                    fetch(baseUrl + 'Dim_Geography.csv'),
                    fetch(baseUrl + 'PowerBI_Relationships.csv'),
                    fetch(baseUrl + 'DAX_Measures.csv')
                ]);
                
                this.persons = this.parseCSV(await personsResp.text());
                this.positions = this.parseCSV(await positionsResp.text());
                this.institutions = this.parseCSV(await institutionsResp.text());
                this.branches = this.parseCSV(await branchesResp.text());
                this.roleCategories = this.parseCSV(await roleCategoriesResp.text());
                this.geography = this.parseCSV(await geographyResp.text());
                this.relationships = this.parseCSV(await relationshipsResp.text());
                this.measures = this.parseCSV(await measuresResp.text());
                
                console.log('Politico data loaded successfully');
                return true;
            } catch (error) {
                console.error('Error loading Politico data:', error);
                throw error;
            }
        },
        
        // Parse CSV string to array of objects
        parseCSV(csvText) {
            const lines = csvText.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const data = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length === headers.length) {
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = values[index];
                    });
                    data.push(obj);
                }
            }
            
            return data;
        },
        
        // Parse a single CSV line handling quoted commas
        parseCSVLine(line) {
            const result = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            
            result.push(current.trim());
            return result;
        },
        
        // Get person by ID
        getPerson(personId) {
            return this.persons.find(p => p.Person_ID === personId);
        },
        
        // Get position by ID
        getPosition(positionId) {
            return this.positions.find(p => p.Position_ID === positionId);
        },
        
        // Get all positions under a parent
        getChildPositions(parentPositionId) {
            return this.positions.filter(p => p.Parent_Position_ID === parentPositionId);
        },
        
        // Build hierarchy tree from a root position
        buildHierarchy(rootPositionId) {
            const root = this.getPosition(rootPositionId);
            if (!root) return null;
            
            const buildNode = (position) => {
                const person = position.Person_ID ? this.getPerson(position.Person_ID) : null;
                const children = this.getChildPositions(position.Position_ID);
                
                return {
                    position: position,
                    person: person,
                    children: children.map(child => buildNode(child))
                };
            };
            
            return buildNode(root);
        },
        
        // Search for people or positions
        search(query) {
            const lowerQuery = query.toLowerCase();
            const results = {
                people: [],
                positions: []
            };
            
            // Search people
            this.persons.forEach(person => {
                if (person.Full_Name.toLowerCase().includes(lowerQuery) ||
                    person.Current_Role_Category.toLowerCase().includes(lowerQuery)) {
                    results.people.push(person);
                }
            });
            
            // Search positions
            this.positions.forEach(position => {
                if (position.Role_Title.toLowerCase().includes(lowerQuery)) {
                    results.positions.push(position);
                }
            });
            
            return results;
        },
        
        // Get chain of command for a position
        getChainOfCommand(positionId) {
            const chain = [];
            let currentPosition = this.getPosition(positionId);
            
            while (currentPosition) {
                const person = currentPosition.Person_ID ? this.getPerson(currentPosition.Person_ID) : null;
                chain.unshift({
                    position: currentPosition,
                    person: person
                });
                
                if (currentPosition.Parent_Position_ID) {
                    currentPosition = this.getPosition(currentPosition.Parent_Position_ID);
                } else {
                    currentPosition = null;
                }
            }
            
            return chain;
        },
        
        // Get statistics
        getStats() {
            return {
                totalPeople: this.persons.length,
                totalPositions: this.positions.length,
                namedOfficeholders: this.positions.filter(p => p.Is_Named_Office_Holder === 'True').length,
                branches: this.branches.length,
                institutions: this.institutions.length
            };
        }
    };
})();
