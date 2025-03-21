const fs = require('fs').promises;
const path = require('path');

class DataManager {
    constructor(dataDir) {
        this.dataDir = dataDir;
    }

    async readData(fileName) {
        const filePath = path.join(this.dataDir, fileName);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return {};
            }
            throw error;
        }
    }

    async writeData(fileName, data) {
        const filePath = path.join(this.dataDir, fileName);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }

    async query(fileName, collection, filter = null) {
        const data = await this.readData(fileName);
        const items = data[collection] || [];
        if (!filter) return items;
        return items.filter(filter);
    }

    async insert(fileName, collection, item) {
        const data = await this.readData(fileName);
        if (!data[collection]) data[collection] = [];
        data[collection].push({ ...item, id: Date.now() });
        await this.writeData(fileName, data);
        return item;
    }

    async update(fileName, collection, id, updates) {
        const data = await this.readData(fileName);
        if (!data[collection]) return null;
        
        const index = data[collection].findIndex(item => item.id === id);
        if (index === -1) return null;

        data[collection][index] = { ...data[collection][index], ...updates };
        await this.writeData(fileName, data);
        return data[collection][index];
    }

    async delete(fileName, collection, id) {
        const data = await this.readData(fileName);
        if (!data[collection]) return false;
        
        const initialLength = data[collection].length;
        data[collection] = data[collection].filter(item => item.id !== id);
        
        if (data[collection].length === initialLength) return false;
        
        await this.writeData(fileName, data);
        return true;
    }
}

module.exports = new DataManager(path.join(__dirname, '..', 'data'));
