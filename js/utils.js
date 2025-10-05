// Utility functions
class FinanceUtils {
    // This class provides utility functions for formatting and date handling
    // It does NOT perform any file operations or trigger downloads
    
    static formatCurrency(amount, currency = '₹') {
        if (amount < 0) {
            return `-${currency}${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `${currency}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    static formatDate(dateString, format = 'dd/mm/yyyy') {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        if (format === 'dd/mm/yyyy') {
            return date.toLocaleDateString('en-GB');
        } else if (format === 'dd/mm/yyyy hh:mm:ss') {
            return date.toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        }
        return dateString;
    }

    static parseDate(dateString) {
        if (!dateString) return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        
        // Handle dd/mm/yyyy format
        if (dateString.includes('/')) {
            const [day, month, year] = dateString.split('/');
            // Create date in UTC and then convert to IST
            const date = new Date(Date.UTC(year, month - 1, day));
            return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        }
        
        // Handle yyyy-mm-dd format (date-only)
        if (dateString.includes('-') && !dateString.includes('T')) {
            // For date-only strings like '2025-10-03'
            // We want this to represent the start of the day in IST
            const [year, month, day] = dateString.split('-');
            const date = new Date(Date.UTC(year, month - 1, day));
            const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
            // Set to beginning of the day
            istDate.setHours(0, 0, 0, 0);
            return istDate;
        }
        
        // Handle datetime strings like '2025-10-03T09:10'
        if (dateString.includes('T')) {
            const date = new Date(dateString);
            return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        }
        
        // Fallback
        const date = new Date(dateString);
        return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    }

    static getDateRange(rangeType, customStart = null, customEnd = null) {
        // Use IST timezone for all date calculations
        const today = new Date();
        // Convert to IST
        const istToday = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        let startDate, endDate;

        switch (rangeType) {
            case 'daily':
                // Set start date to beginning of today in IST
                startDate = new Date(istToday);
                startDate.setHours(0, 0, 0, 0);
                // Set end date to end of today in IST
                endDate = new Date(istToday);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'weekly':
                startDate = new Date(istToday);
                startDate.setDate(istToday.getDate() - istToday.getDay());
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                break;
            case 'monthly':
                startDate = new Date(istToday.getFullYear(), istToday.getMonth(), 1);
                endDate = new Date(istToday.getFullYear(), istToday.getMonth() + 1, 0);
                break;
            case 'yearly':
                startDate = new Date(istToday.getFullYear(), 0, 1);
                endDate = new Date(istToday.getFullYear(), 11, 31);
                break;
            case 'custom':
                startDate = customStart ? this.parseDate(customStart) : new Date(istToday);
                endDate = customEnd ? this.parseDate(customEnd) : new Date(istToday);
                break;
            default:
                startDate = new Date(istToday.getFullYear(), istToday.getMonth(), 1);
                endDate = new Date(istToday.getFullYear(), istToday.getMonth() + 1, 0);
        }

        // Return date strings in yyyy-mm-dd format
        const startString = startDate.getFullYear() + '-' + 
            String(startDate.getMonth() + 1).padStart(2, '0') + '-' + 
            String(startDate.getDate()).padStart(2, '0');
            
        const endString = endDate.getFullYear() + '-' + 
            String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
            String(endDate.getDate()).padStart(2, '0');
            
        return {
            start: startString,
            end: endString
        };
    }

    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static validateAmount(amount) {
        return !isNaN(amount) && amount > 0;
    }

    static getCategoryIcon(category, type) {
        const icons = {
            income: {
                'Salary': 'fas fa-money-bill',
                'Freelance': 'fas fa-laptop-code',
                'Investment': 'fas fa-chart-line',
                'Gift': 'fas fa-gift',
                'Business': 'fas fa-briefcase',
                'Bonus': 'fas fa-star',
                'Dividend': 'fas fa-coins',
                'Rental Income': 'fas fa-home',
                'Other': 'fas fa-money-bill-wave'
            },
            expense: {
                'Food': 'fas fa-utensils',
                'Transport': 'fas fa-car',
                'Entertainment': 'fas fa-film',
                'Utilities': 'fas fa-bolt',
                'Rent': 'fas fa-home',
                'Healthcare': 'fas fa-heartbeat',
                'Education': 'fas fa-graduation-cap',
                'Shopping': 'fas fa-shopping-bag',
                'Travel': 'fas fa-plane',
                'Personal Care': 'fas fa-user',
                'Insurance': 'fas fa-shield-alt',
                'Taxes': 'fas fa-receipt',
                'Subscriptions': 'fas fa-newspaper',
                'Maintenance': 'fas fa-tools',
                'Charity': 'fas fa-hand-holding-heart',
                'Other': 'fas fa-receipt'
            },
            transfer: {
                'Cash to Bank': 'fas fa-university',
                'Bank to Card': 'fas fa-credit-card',
                'Card to Cash': 'fas fa-money-bill',
                'Between Accounts': 'fas fa-exchange-alt',
                'Credit Card Payment': 'fas fa-credit-card',
                'Bank Transfer': 'fas fa-university',
                'Investment Transfer': 'fas fa-chart-line',
                'Loan Payment': 'fas fa-hand-holding-usd'
            }
        };

        return icons[type]?.[category] || 'fas fa-receipt';
    }

    static getAccountIcon(accountType) {
        const icons = {
            'Cash': 'fas fa-money-bill',
            'Bank Account': 'fas fa-university',
            'Credit Card': 'fas fa-credit-card',
            'Debit Card': 'fas fa-credit-card',
            'Investment Account': 'fas fa-chart-line',
            'Savings Account': 'fas fa-piggy-bank'
        };

        return icons[accountType] || 'fas fa-wallet';
    }
}

// Data storage management
class DataManager {
    // This class manages data storage operations
    // It provides methods for saving/loading data to/from localStorage
    // File download operations are only triggered when explicitly requested by the user
    
    // Map data keys to file names
    static getFileMap() {
        // This method only provides a mapping between data keys and file names
        // It does NOT trigger any file operations
        
        return {
            'accounts': 'accounts.json',
            'transactions': 'transactions.json',
            'budgets': 'budgets.json',
            'categories': 'categories.json',
            'settings': 'settings.json'
        };
    }

    // Convert array of objects to CSV format
    static arrayToCSV(data) {
        // This method only converts data to CSV format
        // It does NOT trigger any file operations
        
        if (!data || data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [];
        
        // Add headers
        csvRows.push(headers.join(','));
        
        // Add rows
        for (const row of data) {
            const values = headers.map(header => {
                const escaped = ('' + (row[header] || '')).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
    }

    // Convert CSV string to array of objects
    static csvToArray(csv) {
        // This method only converts CSV data to array format
        // It does NOT trigger any file operations
        
        const lines = csv.split('\n');
        if (lines.length < 2) return [];
        
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const result = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const currentline = lines[i].split(',');
            const obj = {};
            
            for (let j = 0; j < headers.length; j++) {
                // Remove quotes and trim
                let value = currentline[j] ? currentline[j].replace(/^"|"$/g, '').trim() : '';
                // Handle escaped quotes
                value = value.replace(/""/g, '"');
                obj[headers[j]] = value;
            }
            
            result.push(obj);
        }
        
        return result;
    }

    // Save data to a JSON file (downloads to user's computer)
    static async saveToJSON(filename, data) {
        // This method ALWAYS triggers a file download to the user's computer
        // It should only be called when explicit download is requested by the user
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Save data to a CSV file (downloads to user's computer)
    static async saveToCSV(filename, data) {
        // This method ALWAYS triggers a file download to the user's computer
        // It should only be called when explicit download is requested by the user
        
        let csvData;
        
        if (Array.isArray(data)) {
            csvData = this.arrayToCSV(data);
        } else if (typeof data === 'object') {
            // For objects like accounts, convert to array format
            const dataArray = Object.values(data);
            csvData = this.arrayToCSV(dataArray);
        } else {
            throw new Error('Unsupported data format for CSV export');
        }
        
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.replace('.json', '.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Load data from a JSON file
    static async loadFromJSON(file) {
        // This method loads data from a user-selected file
        // It does NOT trigger any file downloads
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }

    // Load data from a CSV file
    static async loadFromCSV(file) {
        // This method loads data from a user-selected file
        // It does NOT trigger any file downloads
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = this.csvToArray(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }

    // Save data to localStorage (no download)
    static async saveToLocalStorage(key, data) {
        // This method only saves data to localStorage for persistence
        // It does NOT trigger any file downloads
        
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
            return false;
        }
    }

    // Save data to a file (JSON format) - only downloads when explicitly requested
    static async saveData(key, data, download = false) {
        try {
            // Always save to localStorage first for data persistence
            await this.saveToLocalStorage(key, data);
            
            // Only download if explicitly requested AND we're in a browser environment
            // This prevents automatic downloads during initialization/page refresh
            if (download && typeof window !== 'undefined' && window.document) {
                const fileMap = this.getFileMap();
                const filename = fileMap[key] || `${key}.json`;
                await this.saveToJSON(filename, data);
            }
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    // Save data to a CSV file - only downloads when explicitly requested
    static async saveDataAsCSV(key, data, download = false) {
        try {
            // Always save to localStorage first for data persistence
            await this.saveToLocalStorage(key, data);
            
            // Only download if explicitly requested AND we're in a browser environment
            // This prevents automatic downloads during initialization/page refresh
            if (download && typeof window !== 'undefined' && window.document) {
                const fileMap = this.getFileMap();
                const filename = fileMap[key] || `${key}.json`;
                await this.saveToCSV(filename, data);
            }
            return true;
        } catch (error) {
            console.error('Error saving data as CSV:', error);
            return false;
        }
    }

    // Load data - try localStorage first, fallback to defaultValue
    static async loadData(key, defaultValue = null) {
        // This method only loads data from localStorage
        // It does NOT trigger any file downloads
        
        try {
            // Try to get from localStorage
            if (typeof localStorage !== 'undefined') {
                const data = localStorage.getItem(key);
                if (data) {
                    return JSON.parse(data);
                }
            }
            return defaultValue;
        } catch (error) {
            console.error('Error loading data:', error);
            return defaultValue;
        }
    }

    // Initialize default data - only saves to localStorage, no downloads
    static async initializeDefaultData() {
        // This method initializes default data in localStorage only
        // It does NOT trigger any file downloads to prevent unwanted downloads on page refresh
        
        const defaultCategories = {
            income: ["Salary", "Freelance", "Investment", "Gift", "Business", "Bonus", "Dividend", "Rental Income", "Other"],
            expense: ["Food", "Transport", "Entertainment", "Utilities", "Rent", "Healthcare", "Education", "Shopping", "Travel", "Personal Care", "Insurance", "Taxes", "Subscriptions", "Maintenance", "Charity", "Other"],
            transfer: ["Cash to Bank", "Bank to Card", "Card to Cash", "Between Accounts", "Credit Card Payment", "Bank Transfer", "Investment Transfer", "Loan Payment"]
        };

        const defaultSettings = {
            currency: '₹',
            timezone: 'IST',
            theme: 'light',
            dateFormat: 'dd/mm/yyyy'
        };

        // Initialize categories if not exists
        let categories = await this.loadData('categories');
        if (!categories) {
            await this.saveData('categories', defaultCategories, false); // Explicitly no download
        }

        // Initialize settings if not exists
        let settings = await this.loadData('settings');
        if (!settings) {
            await this.saveData('settings', defaultSettings, false); // Explicitly no download
        }

        // Initialize other data structures if not exists
        const dataStructures = ['accounts', 'transactions', 'budgets'];
        for (const structure of dataStructures) {
            let data = await this.loadData(structure);
            if (!data) {
                await this.saveData(structure, structure === 'accounts' ? {} : [], false); // Explicitly no download
            }
        }
    }

    // Method to import data from a file
    static async importDataFromFile(fileInput, key) {
        // This method imports data from a file and saves it to localStorage
        // It does NOT trigger any file downloads
        
        return new Promise((resolve, reject) => {
            if (!fileInput.files || fileInput.files.length === 0) {
                reject(new Error('No file selected'));
                return;
            }

            const file = fileInput.files[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    let data;
                    if (file.name.endsWith('.json')) {
                        data = JSON.parse(e.target.result);
                    } else if (file.name.endsWith('.csv')) {
                        data = this.csvToArray(e.target.result);
                        // For accounts, we need to convert array back to object
                        if (key === 'accounts' && Array.isArray(data)) {
                            const accountsObj = {};
                            data.forEach(account => {
                                if (account.id) {
                                    accountsObj[account.id] = account;
                                }
                            });
                            data = accountsObj;
                        }
                    } else {
                        throw new Error('Unsupported file format');
                    }
                    
                    // Save to localStorage only (no automatic download)
                    this.saveToLocalStorage(key, data);
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = (error) => reject(error);
            
            if (file.name.endsWith('.json')) {
                reader.readAsText(file);
            } else if (file.name.endsWith('.csv')) {
                reader.readAsText(file);
            } else {
                reject(new Error('Unsupported file format'));
            }
        });
    }

    // Method to export data to a file (downloads file)
    static async exportDataToFile(key) {
        // Only allow export in browser environment
        // if (typeof window === 'undefined' || !window.document) {
        //     console.warn('Export functionality only available in browser environment');
        //     return false;
        // }
        
        try {
            const data = await this.loadData(key);
            if (data) {
                const fileMap = this.getFileMap();
                const filename = fileMap[key] || `${key}.json`;
                await this.saveToJSON(filename, data); // Explicitly download
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error exporting data:', error);
            return false;
        }
    }

    // Method to export data to a CSV file (downloads file)
    static async exportDataToCSV(key) {
        // Only allow export in browser environment
        // if (typeof window === 'undefined' || !window.document) {
        //     console.warn('Export functionality only available in browser environment');
        //     return false;
        // }
        
        try {
            const data = await this.loadData(key);
            if (data) {
                const fileMap = this.getFileMap();
                const filename = fileMap[key] || `${key}.json`;
                await this.saveToCSV(filename, data); // Explicitly download
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error exporting data to CSV:', error);
            return false;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FinanceUtils, DataManager };
}