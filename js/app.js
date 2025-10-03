// Main application controller
class FinanceApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.currentTheme = 'light';
        this.init();
    }

    async init() {
        // Initialize default data - no downloads
        await DataManager.initializeDefaultData();

        // Load settings
        this.settings = await DataManager.loadData('settings', {
            currency: '₹',
            timezone: 'IST',
            theme: 'light',
            dateFormat: 'dd/mm/yyyy'
        });

        // Apply theme
        this.applyTheme(this.settings.theme);

        // Initialize event listeners
        this.initializeEventListeners();

        // Load current page
        this.loadPage(this.currentPage);
    }

    initializeEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.getAttribute('data-page');
                this.loadPage(page);
            });
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Mobile menu toggle
        document.getElementById('mobileMenuToggle').addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // View all links
        document.addEventListener('click', (e) => {
            if (e.target.matches('.view-all') || e.target.closest('.view-all')) {
                e.preventDefault();
                const page = e.target.getAttribute('data-page') || 
                            e.target.closest('.view-all').getAttribute('data-page');
                this.loadPage(page);
            }
        });

        // Date range changes
        document.getElementById('dashboardDateRange')?.addEventListener('change', (e) => {
            this.handleDateRangeChange(e.target.value);
        });

        // Apply custom date range
        document.getElementById('applyCustomRange')?.addEventListener('click', () => {
            this.applyCustomDateRange();
        });
    }

    async loadPage(page) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Hide all pages
        document.querySelectorAll('.page').forEach(pageElement => {
            pageElement.classList.remove('active');
        });

        // Show current page
        document.getElementById(page).classList.add('active');

        // Load page-specific content
        switch (page) {
            case 'dashboard':
                if (typeof DashboardManager !== 'undefined') {
                    DashboardManager.loadDashboard();
                }
                break;
            case 'transactions':
                if (typeof TransactionManager !== 'undefined') {
                    TransactionManager.loadTransactions();
                }
                break;
            case 'accounts':
                if (typeof AccountManager !== 'undefined') {
                    AccountManager.loadAccounts();
                }
                break;
            case 'budgets':
                if (typeof BudgetManager !== 'undefined') {
                    BudgetManager.loadBudgets();
                }
                break;
            case 'categories':
                if (typeof CategoryManager !== 'undefined') {
                    CategoryManager.loadCategories();
                }
                break;
            case 'info':
                this.loadInfoPage();
                break;
        }

        this.currentPage = page;

        // Close mobile menu if open
        const nav = document.querySelector('.nav');
        nav.classList.remove('active');
    }

    loadInfoPage() {
        const infoPage = document.getElementById('info');
        infoPage.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-info-circle"></i> App Information</h2>
            </div>
            
            <div class="info-content">
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-shield-alt"></i> Security & Privacy</h3>
                    </div>
                    <div class="card-body">
                        <div class="security-features">
                            <div class="feature-item">
                                <i class="fas fa-lock"></i>
                                <div>
                                    <h4>Local Data Storage</h4>
                                    <p>All your financial data is stored as JSON files on your device. No data is sent to any server.</p>
                                </div>
                            </div>
                            <div class="feature-item">
                                <i class="fas fa-user-shield"></i>
                                <div>
                                    <h4>No Registration Required</h4>
                                    <p>Use the app immediately without creating an account or sharing personal information.</p>
                                </div>
                            </div>
                            <div class="feature-item">
                                <i class="fas fa-database"></i>
                                <div>
                                    <h4>Complete Control</h4>
                                    <p>You have full control over your data. Export or delete your information anytime.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-file-export"></i> Data Import/Export</h3>
                    </div>
                    <div class="card-body">
                        <div class="data-management">
                            <div class="export-section">
                                <h4>Export Your Data</h4>
                                <p>Save your financial data as JSON or CSV files to your computer.</p>
                                <div class="export-buttons">
                                    <div class="button-group">
                                        <button class="btn btn-secondary" id="exportAccountsJSON">Export Accounts (JSON)</button>
                                        <button class="btn btn-secondary" id="exportAccountsCSV">Export Accounts (CSV)</button>
                                    </div>
                                    <div class="button-group">
                                        <button class="btn btn-secondary" id="exportTransactionsJSON">Export Transactions (JSON)</button>
                                        <button class="btn btn-secondary" id="exportTransactionsCSV">Export Transactions (CSV)</button>
                                    </div>
                                    <div class="button-group">
                                        <button class="btn btn-secondary" id="exportBudgetsJSON">Export Budgets (JSON)</button>
                                        <button class="btn btn-secondary" id="exportBudgetsCSV">Export Budgets (CSV)</button>
                                    </div>
                                    <div class="button-group">
                                        <button class="btn btn-secondary" id="exportCategoriesJSON">Export Categories (JSON)</button>
                                        <button class="btn btn-secondary" id="exportCategoriesCSV">Export Categories (CSV)</button>
                                    </div>
                                    <div class="button-group">
                                        <button class="btn btn-secondary" id="exportSettingsJSON">Export Settings (JSON)</button>
                                    </div>
                                    <div class="button-group">
                                        <button class="btn btn-primary" id="exportAllJSON">Export All Data (JSON)</button>
                                    </div>
                                </div>
                            </div>
                            <div class="import-section">
                                <h4>Import Your Data</h4>
                                <p>Load your financial data from JSON or CSV files.</p>
                                <div class="import-buttons">
                                    <div class="button-group">
                                        <input type="file" id="importAccountsJSON" accept=".json" style="display: none;">
                                        <button class="btn btn-secondary" onclick="document.getElementById('importAccountsJSON').click()">Import Accounts (JSON)</button>
                                        
                                        <input type="file" id="importAccountsCSV" accept=".csv" style="display: none;">
                                        <button class="btn btn-secondary" onclick="document.getElementById('importAccountsCSV').click()">Import Accounts (CSV)</button>
                                    </div>
                                    
                                    <div class="button-group">
                                        <input type="file" id="importTransactionsJSON" accept=".json" style="display: none;">
                                        <button class="btn btn-secondary" onclick="document.getElementById('importTransactionsJSON').click()">Import Transactions (JSON)</button>
                                        
                                        <input type="file" id="importTransactionsCSV" accept=".csv" style="display: none;">
                                        <button class="btn btn-secondary" onclick="document.getElementById('importTransactionsCSV').click()">Import Transactions (CSV)</button>
                                    </div>
                                    
                                    <div class="button-group">
                                        <input type="file" id="importBudgetsJSON" accept=".json" style="display: none;">
                                        <button class="btn btn-secondary" onclick="document.getElementById('importBudgetsJSON').click()">Import Budgets (JSON)</button>
                                        
                                        <input type="file" id="importBudgetsCSV" accept=".csv" style="display: none;">
                                        <button class="btn btn-secondary" onclick="document.getElementById('importBudgetsCSV').click()">Import Budgets (CSV)</button>
                                    </div>
                                    
                                    <div class="button-group">
                                        <input type="file" id="importCategoriesJSON" accept=".json" style="display: none;">
                                        <button class="btn btn-secondary" onclick="document.getElementById('importCategoriesJSON').click()">Import Categories (JSON)</button>
                                        
                                        <input type="file" id="importCategoriesCSV" accept=".csv" style="display: none;">
                                        <button class="btn btn-secondary" onclick="document.getElementById('importCategoriesCSV').click()">Import Categories (CSV)</button>
                                    </div>
                                    
                                    <div class="button-group">
                                        <input type="file" id="importSettingsJSON" accept=".json" style="display: none;">
                                        <button class="btn btn-secondary" onclick="document.getElementById('importSettingsJSON').click()">Import Settings (JSON)</button>
                                    </div>
                                    
                                    <div class="button-group">
                                        <input type="file" id="importAllJSON" accept=".json" style="display: none;">
                                        <button class="btn btn-primary" onclick="document.getElementById('importAllJSON').click()">Import All Data (JSON)</button>
                                    </div>
                                </div>
                            </div>
                            <div class="examples-section">
                                <h4>View Example Files</h4>
                                <p>See examples of the file formats used by this application.</p>
                                <div class="example-buttons">
                                    <button class="btn btn-secondary" id="viewExampleFiles">
                                        <i class="fas fa-file-code"></i> View Example Files
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-question-circle"></i> Help & Support</h3>
                    </div>
                    <div class="card-body">
                        <div class="help-section">
                            <h4>How to Use Data Import/Export</h4>
                            <div class="help-steps">
                                <div class="help-step">
                                    <h5>Exporting Data</h5>
                                    <ol>
                                        <li>Navigate to the "Info" page</li>
                                        <li>Scroll to the "Data Import/Export" section</li>
                                        <li>Choose the data type you want to export</li>
                                        <li>Select the format (JSON for complete data, CSV for spreadsheet compatibility)</li>
                                        <li>Click the export button</li>
                                        <li>Save the file when prompted by your browser</li>
                                    </ol>
                                </div>
                                <div class="help-step">
                                    <h5>Importing Data</h5>
                                    <ol>
                                        <li>Navigate to the "Info" page</li>
                                        <li>Scroll to the "Data Import/Export" section</li>
                                        <li>Choose the data type you want to import</li>
                                        <li>Select the format of your file (JSON or CSV)</li>
                                        <li>Click the import button</li>
                                        <li>Select your file when prompted</li>
                                        <li>The data will be loaded automatically</li>
                                    </ol>
                                </div>
                                <div class="help-step">
                                    <h5>Viewing Example Files</h5>
                                    <ol>
                                        <li>Click the "View Example Files" button</li>
                                        <li>Browse the available example files</li>
                                        <li>Click "View" to see the file content</li>
                                        <li>Click "Download" to save the file to your computer</li>
                                    </ol>
                                </div>
                            </div>
                            
                            <h4>File Formats</h4>
                            <div class="format-info">
                                <div class="format-item">
                                    <h5>JSON Format</h5>
                                    <p>Complete data structure with all properties. Best for backups and transferring between devices.</p>
                                </div>
                                <div class="format-item">
                                    <h5>CSV Format</h5>
                                    <p>Tabular format compatible with spreadsheets. Best for analysis in Excel or Google Sheets.</p>
                                </div>
                            </div>
                            
                            <h4>Troubleshooting</h4>
                            <div class="troubleshooting">
                                <div class="trouble-item">
                                    <h5>Import Failed</h5>
                                    <p>Ensure your file is in the correct format (JSON or CSV) and matches the expected structure. Use the example files as a reference.</p>
                                </div>
                                <div class="trouble-item">
                                    <h5>Export Not Working</h5>
                                    <p>Check your browser's download settings. The file should be saved to your default download location.</p>
                                </div>
                                <div class="trouble-item">
                                    <h5>Data Not Updating</h5>
                                    <p>After importing data, navigate to the relevant section (Accounts, Transactions, etc.) to see the changes.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-rocket"></i> Features</h3>
                    </div>
                    <div class="card-body">
                        <div class="features-grid">
                            <div class="feature-card">
                                <i class="fas fa-exchange-alt"></i>
                                <h4>Transaction Management</h4>
                                <p>Track income, expenses, and transfers with detailed categorization.</p>
                            </div>
                            <div class="feature-card">
                                <i class="fas fa-credit-card"></i>
                                <h4>Account Management</h4>
                                <p>Manage multiple accounts including cash, bank accounts, and credit cards.</p>
                            </div>
                            <div class="feature-card">
                                <i class="fas fa-chart-pie"></i>
                                <h4>Budget Planning</h4>
                                <p>Set and monitor budgets for different spending categories.</p>
                            </div>
                            <div class="feature-card">
                                <i class="fas fa-chart-line"></i>
                                <h4>Financial Insights</h4>
                                <p>Visualize your financial data with charts and reports.</p>
                            </div>
                            <div class="feature-card">
                                <i class="fas fa-tags"></i>
                                <h4>Custom Categories</h4>
                                <p>Create and manage custom categories for better organization.</p>
                            </div>
                            <div class="feature-card">
                                <i class="fas fa-mobile-alt"></i>
                                <h4>Responsive Design</h4>
                                <p>Use the app on any device - desktop, tablet, or mobile.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-code"></i> Technical Information</h3>
                    </div>
                    <div class="card-body">
                        <div class="tech-info">
                            <div class="info-item">
                                <strong>Version:</strong> 1.0.1
                            </div>
                            <div class="info-item">
                                <strong>Data Format:</strong> JSON Files
                            </div>
                            <div class="info-item">
                                <strong>Browser Support:</strong> Chrome, Firefox, Safari, Edge
                            </div>
                            <div class="info-item">
                                <strong>Theme Support:</strong> Light & Dark Mode
                            </div>
                            <div class="info-item">
                                <strong>Date Format:</strong> DD/MM/YYYY HH:MM:SS
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-heart"></i> About</h3>
                    </div>
                    <div class="card-body">
                        <p>PaisaTrack is a personal finance management application designed to help you take control of your finances.</p>
                        <p>Built with modern web technologies and a focus on user privacy and data security.</p>
                        <div class="made-by">
                            <strong>Made with ❤️ for better financial management</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for export buttons (JSON) - explicitly request download
        document.getElementById('exportAccountsJSON')?.addEventListener('click', () => {
            DataManager.exportDataToFile('accounts'); // Explicitly download
        });

        document.getElementById('exportTransactionsJSON')?.addEventListener('click', () => {
            DataManager.exportDataToFile('transactions'); // Explicitly download
        });

        document.getElementById('exportBudgetsJSON')?.addEventListener('click', () => {
            DataManager.exportDataToFile('budgets'); // Explicitly download
        });

        document.getElementById('exportCategoriesJSON')?.addEventListener('click', () => {
            DataManager.exportDataToFile('categories'); // Explicitly download
        });

        document.getElementById('exportSettingsJSON')?.addEventListener('click', () => {
            DataManager.exportDataToFile('settings'); // Explicitly download
        });

        document.getElementById('exportAllJSON')?.addEventListener('click', async () => {
            const dataKeys = ['accounts', 'transactions', 'budgets', 'categories', 'settings'];
            for (const key of dataKeys) {
                await DataManager.exportDataToFile(key); // Explicitly download each
            }
            alert('All data exported successfully as JSON files!');
        });

        // Add event listeners for export buttons (CSV) - explicitly request download
        document.getElementById('exportAccountsCSV')?.addEventListener('click', async () => {
            const data = await DataManager.loadData('accounts', {});
            DataManager.saveDataAsCSV('accounts', data, true); // true = explicitly download
        });

        document.getElementById('exportTransactionsCSV')?.addEventListener('click', async () => {
            const data = await DataManager.loadData('transactions', []);
            DataManager.saveDataAsCSV('transactions', data, true); // true = explicitly download
        });

        document.getElementById('exportBudgetsCSV')?.addEventListener('click', async () => {
            const data = await DataManager.loadData('budgets', []);
            DataManager.saveDataAsCSV('budgets', data, true); // true = explicitly download
        });

        document.getElementById('exportCategoriesCSV')?.addEventListener('click', async () => {
            const data = await DataManager.loadData('categories', {});
            // Convert categories object to array for CSV export
            const categoriesArray = [];
            Object.keys(data).forEach(type => {
                data[type].forEach(category => {
                    categoriesArray.push({ type, category });
                });
            });
            DataManager.saveDataAsCSV('categories', categoriesArray, true); // true = explicitly download
        });

        // Add event listeners for import file inputs (JSON)
        document.getElementById('importAccountsJSON')?.addEventListener('change', (e) => {
            DataManager.importDataFromFile(e.target, 'accounts').then(() => {
                alert('Accounts imported successfully!');
                // Refresh accounts page if it's active
                if (typeof AccountManager !== 'undefined' && document.getElementById('accounts').classList.contains('active')) {
                    AccountManager.loadAccounts();
                }
            }).catch((error) => {
                alert('Error importing accounts: ' + error.message);
            });
        });

        document.getElementById('importTransactionsJSON')?.addEventListener('change', (e) => {
            DataManager.importDataFromFile(e.target, 'transactions').then(() => {
                alert('Transactions imported successfully!');
                // Refresh transactions page if it's active
                if (typeof TransactionManager !== 'undefined' && document.getElementById('transactions').classList.contains('active')) {
                    TransactionManager.loadTransactions();
                }
            }).catch((error) => {
                alert('Error importing transactions: ' + error.message);
            });
        });

        document.getElementById('importBudgetsJSON')?.addEventListener('change', (e) => {
            DataManager.importDataFromFile(e.target, 'budgets').then(() => {
                alert('Budgets imported successfully!');
                // Refresh budgets page if it's active
                if (typeof BudgetManager !== 'undefined' && document.getElementById('budgets').classList.contains('active')) {
                    BudgetManager.loadBudgets();
                }
            }).catch((error) => {
                alert('Error importing budgets: ' + error.message);
            });
        });

        document.getElementById('importCategoriesJSON')?.addEventListener('change', (e) => {
            DataManager.importDataFromFile(e.target, 'categories').then(() => {
                alert('Categories imported successfully!');
                // Refresh categories page if it's active
                if (typeof CategoryManager !== 'undefined' && document.getElementById('categories').classList.contains('active')) {
                    CategoryManager.loadCategories();
                }
            }).catch((error) => {
                alert('Error importing categories: ' + error.message);
            });
        });

        document.getElementById('importSettingsJSON')?.addEventListener('change', (e) => {
            DataManager.importDataFromFile(e.target, 'settings').then((data) => {
                alert('Settings imported successfully!');
                // Apply new settings
                if (data && data.theme) {
                    this.applyTheme(data.theme);
                }
            }).catch((error) => {
                alert('Error importing settings: ' + error.message);
            });
        });

        document.getElementById('importAllJSON')?.addEventListener('change', (e) => {
            // For simplicity, we'll just alert that this is a placeholder
            alert('Import all data functionality would be implemented here.');
        });

        // Add event listeners for import file inputs (CSV)
        document.getElementById('importAccountsCSV')?.addEventListener('change', (e) => {
            DataManager.importDataFromFile(e.target, 'accounts').then(() => {
                alert('Accounts imported successfully from CSV!');
                // Refresh accounts page if it's active
                if (typeof AccountManager !== 'undefined' && document.getElementById('accounts').classList.contains('active')) {
                    AccountManager.loadAccounts();
                }
            }).catch((error) => {
                alert('Error importing accounts from CSV: ' + error.message);
            });
        });

        document.getElementById('importTransactionsCSV')?.addEventListener('change', (e) => {
            DataManager.importDataFromFile(e.target, 'transactions').then(() => {
                alert('Transactions imported successfully from CSV!');
                // Refresh transactions page if it's active
                if (typeof TransactionManager !== 'undefined' && document.getElementById('transactions').classList.contains('active')) {
                    TransactionManager.loadTransactions();
                }
            }).catch((error) => {
                alert('Error importing transactions from CSV: ' + error.message);
            });
        });

        document.getElementById('importBudgetsCSV')?.addEventListener('change', (e) => {
            DataManager.importDataFromFile(e.target, 'budgets').then(() => {
                alert('Budgets imported successfully from CSV!');
                // Refresh budgets page if it's active
                if (typeof BudgetManager !== 'undefined' && document.getElementById('budgets').classList.contains('active')) {
                    BudgetManager.loadBudgets();
                }
            }).catch((error) => {
                alert('Error importing budgets from CSV: ' + error.message);
            });
        });

        document.getElementById('importCategoriesCSV')?.addEventListener('change', (e) => {
            DataManager.importDataFromFile(e.target, 'categories').then(() => {
                alert('Categories imported successfully from CSV!');
                // Refresh categories page if it's active
                if (typeof CategoryManager !== 'undefined' && document.getElementById('categories').classList.contains('active')) {
                    CategoryManager.loadCategories();
                }
            }).catch((error) => {
                alert('Error importing categories from CSV: ' + error.message);
            });
        });

        // Add event listener for viewing example files
        document.getElementById('viewExampleFiles')?.addEventListener('click', () => {
            this.showExampleFilesModal();
        });
    }

    // Show modal with example files
    showExampleFilesModal() {
        // Create modal HTML
        const modalHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3><i class="fas fa-file-code"></i> Example Files</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>View and download example files to understand the data structure used by this application.</p>
                    
                    <div class="example-files-grid">
                        <!-- Accounts Examples -->
                        <div class="example-file-card">
                            <div class="example-file-header">
                                <h4>Accounts (JSON)</h4>
                                <span class="file-type">JSON</span>
                            </div>
                            <div class="example-file-content">
                                <pre class="code-sample" id="accountsJsonPreview">Loading...</pre>
                            </div>
                            <div class="example-file-actions">
                                <button class="btn btn-secondary" onclick="window.financeApp.viewExampleFile('data/example_accounts.json')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="btn btn-primary" onclick="window.financeApp.downloadExampleFile('data/example_accounts.json', 'example_accounts.json')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                            </div>
                        </div>
                        
                        <div class="example-file-card">
                            <div class="example-file-header">
                                <h4>Accounts (CSV)</h4>
                                <span class="file-type">CSV</span>
                            </div>
                            <div class="example-file-content">
                                <pre class="code-sample" id="accountsCsvPreview">Loading...</pre>
                            </div>
                            <div class="example-file-actions">
                                <button class="btn btn-secondary" onclick="window.financeApp.viewExampleFile('data/example_accounts.csv')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="btn btn-primary" onclick="window.financeApp.downloadExampleFile('data/example_accounts.csv', 'example_accounts.csv')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                            </div>
                        </div>
                        
                        <!-- Transactions Examples -->
                        <div class="example-file-card">
                            <div class="example-file-header">
                                <h4>Transactions (JSON)</h4>
                                <span class="file-type">JSON</span>
                            </div>
                            <div class="example-file-content">
                                <pre class="code-sample" id="transactionsJsonPreview">Loading...</pre>
                            </div>
                            <div class="example-file-actions">
                                <button class="btn btn-secondary" onclick="window.financeApp.viewExampleFile('data/example_transactions.json')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="btn btn-primary" onclick="window.financeApp.downloadExampleFile('data/example_transactions.json', 'example_transactions.json')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                            </div>
                        </div>
                        
                        <div class="example-file-card">
                            <div class="example-file-header">
                                <h4>Transactions (CSV)</h4>
                                <span class="file-type">CSV</span>
                            </div>
                            <div class="example-file-content">
                                <pre class="code-sample" id="transactionsCsvPreview">Loading...</pre>
                            </div>
                            <div class="example-file-actions">
                                <button class="btn btn-secondary" onclick="window.financeApp.viewExampleFile('data/example_transactions.csv')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="btn btn-primary" onclick="window.financeApp.downloadExampleFile('data/example_transactions.csv', 'example_transactions.csv')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                            </div>
                        </div>
                        
                        <!-- Budgets Examples -->
                        <div class="example-file-card">
                            <div class="example-file-header">
                                <h4>Budgets (JSON)</h4>
                                <span class="file-type">JSON</span>
                            </div>
                            <div class="example-file-content">
                                <pre class="code-sample" id="budgetsJsonPreview">Loading...</pre>
                            </div>
                            <div class="example-file-actions">
                                <button class="btn btn-secondary" onclick="window.financeApp.viewExampleFile('data/example_budgets.json')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="btn btn-primary" onclick="window.financeApp.downloadExampleFile('data/example_budgets.json', 'example_budgets.json')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                            </div>
                        </div>
                        
                        <div class="example-file-card">
                            <div class="example-file-header">
                                <h4>Budgets (CSV)</h4>
                                <span class="file-type">CSV</span>
                            </div>
                            <div class="example-file-content">
                                <pre class="code-sample" id="budgetsCsvPreview">Loading...</pre>
                            </div>
                            <div class="example-file-actions">
                                <button class="btn btn-secondary" onclick="window.financeApp.viewExampleFile('data/example_budgets.csv')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="btn btn-primary" onclick="window.financeApp.downloadExampleFile('data/example_budgets.csv', 'example_budgets.csv')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                            </div>
                        </div>
                        
                        <!-- Categories Examples -->
                        <div class="example-file-card">
                            <div class="example-file-header">
                                <h4>Categories (JSON)</h4>
                                <span class="file-type">JSON</span>
                            </div>
                            <div class="example-file-content">
                                <pre class="code-sample" id="categoriesJsonPreview">Loading...</pre>
                            </div>
                            <div class="example-file-actions">
                                <button class="btn btn-secondary" onclick="window.financeApp.viewExampleFile('data/example_categories.json')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="btn btn-primary" onclick="window.financeApp.downloadExampleFile('data/example_categories.json', 'example_categories.json')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                            </div>
                        </div>
                        
                        <div class="example-file-card">
                            <div class="example-file-header">
                                <h4>Categories (CSV)</h4>
                                <span class="file-type">CSV</span>
                            </div>
                            <div class="example-file-content">
                                <pre class="code-sample" id="categoriesCsvPreview">Loading...</pre>
                            </div>
                            <div class="example-file-actions">
                                <button class="btn btn-secondary" onclick="window.financeApp.viewExampleFile('data/example_categories.csv')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="btn btn-primary" onclick="window.financeApp.downloadExampleFile('data/example_categories.csv', 'example_categories.csv')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                            </div>
                        </div>
                        
                        <!-- Settings Examples -->
                        <div class="example-file-card">
                            <div class="example-file-header">
                                <h4>Settings (JSON)</h4>
                                <span class="file-type">JSON</span>
                            </div>
                            <div class="example-file-content">
                                <pre class="code-sample" id="settingsJsonPreview">Loading...</pre>
                            </div>
                            <div class="example-file-actions">
                                <button class="btn btn-secondary" onclick="window.financeApp.viewExampleFile('data/example_settings.json')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="btn btn-primary" onclick="window.financeApp.downloadExampleFile('data/example_settings.json', 'example_settings.json')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="closeExampleModal">Close</button>
                </div>
            </div>
        `;

        // Show modal
        const modal = document.getElementById('exampleFilesModal');
        if (!modal) {
            // Create modal container if it doesn't exist
            const modalContainer = document.createElement('div');
            modalContainer.id = 'exampleFilesModal';
            modalContainer.className = 'modal active';
            modalContainer.innerHTML = modalHTML;
            document.body.appendChild(modalContainer);
        } else {
            modal.innerHTML = modalHTML;
            modal.classList.add('active');
        }

        // Add event listeners for modal
        document.querySelector('#exampleFilesModal .modal-close').addEventListener('click', () => {
            document.getElementById('exampleFilesModal').classList.remove('active');
        });

        document.getElementById('closeExampleModal').addEventListener('click', () => {
            document.getElementById('exampleFilesModal').classList.remove('active');
        });

        // Load example file previews
        this.loadExampleFilePreviews();
    }

    // Load previews of example files
    async loadExampleFilePreviews() {
        const exampleFiles = [
            { path: 'data/example_accounts.json', element: 'accountsJsonPreview' },
            { path: 'data/example_accounts.csv', element: 'accountsCsvPreview' },
            { path: 'data/example_transactions.json', element: 'transactionsJsonPreview' },
            { path: 'data/example_transactions.csv', element: 'transactionsCsvPreview' },
            { path: 'data/example_budgets.json', element: 'budgetsJsonPreview' },
            { path: 'data/example_budgets.csv', element: 'budgetsCsvPreview' },
            { path: 'data/example_categories.json', element: 'categoriesJsonPreview' },
            { path: 'data/example_categories.csv', element: 'categoriesCsvPreview' },
            { path: 'data/example_settings.json', element: 'settingsJsonPreview' }
        ];

        for (const file of exampleFiles) {
            try {
                const response = await fetch(file.path);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const content = await response.text();
                // Show first 5 lines for preview
                const lines = content.split('\n').slice(0, 5).join('\n');
                const preview = lines + (content.split('\n').length > 5 ? '\n...' : '');
                document.getElementById(file.element).textContent = preview;
            } catch (error) {
                console.error(`Error loading preview for ${file.path}:`, error);
                document.getElementById(file.element).textContent = 'Error loading preview. Click "View" to see the file.';
            }
        }
    }

    // View an example file in a new tab
    async viewExampleFile(filePath) {
        try {
            const response = await fetch(filePath);
            const content = await response.text();
            
            // Create a new window/tab to display the file content
            const newWindow = window.open('', '_blank');
            newWindow.document.write(`
                <html>
                    <head>
                        <title>Example File: ${filePath}</title>
                        <style>
                            body { font-family: monospace; padding: 20px; background: #f5f5f5; }
                            pre { background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                            .header { margin-bottom: 20px; }
                            .back-button { margin-bottom: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h2>Example File: ${filePath}</h2>
                            <button class="back-button" onclick="window.close()">← Back to App</button>
                        </div>
                        <pre>${this.escapeHtml(content)}</pre>
                    </body>
                </html>
            `);
            newWindow.document.close();
        } catch (error) {
            alert('Error viewing file: ' + error.message);
        }
    }

    // Download an example file
    async downloadExampleFile(filePath, fileName) {
        try {
            const response = await fetch(filePath);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
        } catch (error) {
            alert('Error downloading file: ' + error.message);
        }
    }

    // Helper function to escape HTML
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        
        // Update settings
        this.settings.theme = this.currentTheme;
        DataManager.saveData('settings', this.settings);
    }

    applyTheme(theme) {
        document.body.className = `${theme}-theme`;
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    toggleMobileMenu() {
        const nav = document.querySelector('.nav');
        nav.classList.toggle('active');
    }

    handleDateRangeChange(rangeType) {
        const customRange = document.getElementById('customDateRange');
        if (rangeType === 'custom') {
            customRange.style.display = 'flex';
        } else {
            customRange.style.display = 'none';
            if (typeof DashboardManager !== 'undefined') {
                DashboardManager.updateDashboard(rangeType);
            }
        }
    }

    applyCustomDateRange() {
        const startDate = document.getElementById('customStartDate').value;
        const endDate = document.getElementById('customEndDate').value;
        
        if (startDate && endDate) {
            if (typeof DashboardManager !== 'undefined') {
                DashboardManager.updateDashboard('custom', startDate, endDate);
            }
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.financeApp = new FinanceApp();
});