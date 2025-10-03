// Transaction management
class TransactionManager {
    static currentPage = 1;
    static itemsPerPage = 10;
    static currentFilter = 'all';

    static async loadTransactions() {
        const transactionsPage = document.getElementById('transactions');
        transactionsPage.innerHTML = this.getTransactionsHTML();
        
        await this.loadTransactionsList();
        this.initializeTransactionEvents();
    }

    static getTransactionsHTML() {
        return `
            <div class="page-header">
                <h2><i class="fas fa-exchange-alt"></i> Transactions</h2>
                <button class="btn btn-primary" id="addTransactionBtn">
                    <i class="fas fa-plus"></i> Add Transaction
                </button>
            </div>

            <div class="filters-section">
                <div class="filter-group">
                    <label>Filter by Type:</label>
                    <select id="transactionTypeFilter">
                        <option value="all">All Transactions</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                        <option value="transfer">Transfer</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Filter by Category:</label>
                    <select id="transactionCategoryFilter">
                        <option value="all">All Categories</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Date Range:</label>
                    <select id="transactionDateRange">
                        <option value="all">All Time</option>
                        <!-- <option value="daily">Today</option> -->
                        <option value="weekly">This Week</option>
                        <option value="monthly">This Month</option>
                        <option value="yearly">This Year</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>
                <div class="filter-group" id="transactionCustomDateRange" style="display: none;">
                    <label>Custom Date Range:</label>
                    <input type="date" id="transactionCustomStartDate">
                    <input type="date" id="transactionCustomEndDate">
                </div>
                <div class="filter-group">
                    <button class="btn btn-secondary" id="applyFiltersBtn">
                        <i class="fas fa-filter"></i> Apply Filters
                    </button>
                    <button class="btn btn-secondary" id="resetFiltersBtn">
                        <i class="fas fa-redo"></i> Reset
                    </button>
                </div>
            </div>

            <div class="transactions-container">
                <div class="table-container">
                    <table class="table" id="transactionsTable">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Account</th>
                                <th>Amount</th>
                                <th>Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="transactionsList">
                            <!-- Transactions will be loaded here -->
                        </tbody>
                    </table>
                </div>

                <div class="pagination" id="transactionsPagination">
                    <!-- Pagination will be loaded here -->
                </div>
            </div>
        `;
    }

    static async loadTransactionsList() {
        const transactions = await DataManager.loadData('transactions', []);
        const accounts = await DataManager.loadData('accounts', {});
        const categories = await DataManager.loadData('categories', {
            income: ["Salary", "Freelance", "Investment", "Gift", "Business", "Bonus", "Dividend", "Rental Income", "Other"],
            expense: ["Food", "Transport", "Entertainment", "Utilities", "Rent", "Healthcare", "Education", "Shopping", "Travel", "Personal Care", "Insurance", "Taxes", "Subscriptions", "Maintenance", "Charity", "Other"],
            transfer: ["Cash to Bank", "Bank to Card", "Card to Cash", "Between Accounts", "Credit Card Payment", "Bank Transfer", "Investment Transfer", "Loan Payment"]
        });
        
        // Apply filters
        let filteredTransactions = this.applyFilters(transactions);
        
        // Calculate pagination
        const totalPages = Math.ceil(filteredTransactions.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + this.itemsPerPage);
        
        // Update table
        this.updateTransactionsTable(paginatedTransactions, accounts);
        
        // Update pagination
        this.updatePagination(totalPages);
        
        // Update category filter options
        this.updateCategoryFilter(categories);
    }

    static applyFilters(transactions) {
        const typeFilter = document.getElementById('transactionTypeFilter')?.value || 'all';
        const categoryFilter = document.getElementById('transactionCategoryFilter')?.value || 'all';
        const dateRange = document.getElementById('transactionDateRange')?.value || 'all';
        
        let filtered = transactions;

        // Type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(t => t.type === typeFilter);
        }

        // Category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(t => t.category === categoryFilter);
        }

        // Date range filter
        if (dateRange !== 'all') {
            let range;
            if (dateRange === 'custom') {
                // Handle custom date range
                const startDate = document.getElementById('transactionCustomStartDate')?.value;
                const endDate = document.getElementById('transactionCustomEndDate')?.value;
                if (startDate && endDate) {
                    range = {
                        start: startDate,
                        end: endDate
                    };
                } else {
                    // If custom dates not set, use monthly as default
                    range = FinanceUtils.getDateRange('monthly');
                }
            } else {
                range = FinanceUtils.getDateRange(dateRange);
            }
            
            filtered = filtered.filter(t => {
                const transactionDate = FinanceUtils.parseDate(t.date);
                const startDate = FinanceUtils.parseDate(range.start);
                const endDate = FinanceUtils.parseDate(range.end);
                return transactionDate >= startDate && transactionDate <= endDate;
            });
        }

        // Sort by date (newest first)
        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    static updateTransactionsTable(transactions, accounts) {
        const container = document.getElementById('transactionsList');
        
        if (transactions.length === 0) {
            container.innerHTML = '<tr><td colspan="7" class="empty-state">No transactions found</td></tr>';
            return;
        }

        let html = '';
        transactions.forEach(transaction => {
            const account = accounts[transaction.accountId];
            const accountName = account ? account.name : 'Unknown Account';
            const amountClass = transaction.type === 'income' ? 'positive' : 'negative';
            const amountSign = transaction.type === 'income' ? '+' : '-';
            
            html += `
                <tr>
                    <td>${FinanceUtils.formatDate(transaction.date, 'dd/mm/yyyy')}</td>
                    <td>${transaction.description}</td>
                    <td>
                        <i class="${FinanceUtils.getCategoryIcon(transaction.category, transaction.type)}"></i>
                        ${transaction.category}
                    </td>
                    <td>${accountName}</td>
                    <td class="${amountClass}">${amountSign}${FinanceUtils.formatCurrency(transaction.amount)}</td>
                    <td>
                        <span class="transaction-type ${transaction.type}">${transaction.type}</span>
                    </td>
                    <td>
                        <button class="btn-icon edit-transaction" data-id="${transaction.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-transaction" data-id="${transaction.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        container.innerHTML = html;
    }

    static updatePagination(totalPages) {
        const container = document.getElementById('transactionsPagination');
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = `
            <button class="btn-pagination" id="prevPage" ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i> Previous
            </button>
            <span class="pagination-info">Page ${this.currentPage} of ${totalPages}</span>
            <button class="btn-pagination" id="nextPage" ${this.currentPage === totalPages ? 'disabled' : ''}>
                Next <i class="fas fa-chevron-right"></i>
            </button>
        `;

        container.innerHTML = html;

        // Add event listeners
        document.getElementById('prevPage').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadTransactionsList();
            }
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.loadTransactionsList();
            }
        });
    }

    static updateCategoryFilter(categories) {
        const filter = document.getElementById('transactionCategoryFilter');
        if (!filter) return;

        let html = '<option value="all">All Categories</option>';
        
        // Add income categories
        categories.income?.forEach(category => {
            html += `<option value="${category}">${category} (Income)</option>`;
        });
        
        // Add expense categories
        categories.expense?.forEach(category => {
            html += `<option value="${category}">${category} (Expense)</option>`;
        });
        
        // Add transfer categories
        categories.transfer?.forEach(category => {
            html += `<option value="${category}">${category} (Transfer)</option>`;
        });

        filter.innerHTML = html;
    }

    static initializeTransactionEvents() {
        // Add transaction button
        document.getElementById('addTransactionBtn').addEventListener('click', () => {
            this.showTransactionModal();
        });

        // Filter buttons
        document.getElementById('applyFiltersBtn').addEventListener('click', () => {
            this.currentPage = 1;
            this.loadTransactionsList();
        });

        document.getElementById('resetFiltersBtn').addEventListener('click', () => {
            this.resetFilters();
        });

        // Edit and delete events (delegated)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-transaction')) {
                const id = e.target.closest('.edit-transaction').getAttribute('data-id');
                this.editTransaction(id);
            }
            
            if (e.target.closest('.delete-transaction')) {
                const id = e.target.closest('.delete-transaction').getAttribute('data-id');
                this.deleteTransaction(id);
            }
        });
        
        // Handle date range change for custom dates
        document.getElementById('transactionDateRange').addEventListener('change', (e) => {
            const customDateRange = document.getElementById('transactionCustomDateRange');
            if (e.target.value === 'custom') {
                customDateRange.style.display = 'flex';
            } else {
                customDateRange.style.display = 'none';
            }
        });
    }

    static async showTransactionModal(transaction = null) {
        const accounts = await DataManager.loadData('accounts', {});
        const categories = await DataManager.loadData('categories', {
            income: ["Salary", "Freelance", "Investment", "Gift", "Business", "Bonus", "Dividend", "Rental Income", "Other"],
            expense: ["Food", "Transport", "Entertainment", "Utilities", "Rent", "Healthcare", "Education", "Shopping", "Travel", "Personal Care", "Insurance", "Taxes", "Subscriptions", "Maintenance", "Charity", "Other"],
            transfer: ["Cash to Bank", "Bank to Card", "Card to Cash", "Between Accounts", "Credit Card Payment", "Bank Transfer", "Investment Transfer", "Loan Payment"]
        });
        
        const isEdit = !!transaction;
        const modalTitle = isEdit ? 'Edit Transaction' : 'Add Transaction';
        
        const modalHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${modalTitle}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="transactionForm">
                        <div class="form-group">
                            <label for="transactionType">Type</label>
                            <select class="form-control" id="transactionType" required>
                                <option value="">Select Type</option>
                                <option value="income" ${transaction?.type === 'income' ? 'selected' : ''}>Income</option>
                                <option value="expense" ${transaction?.type === 'expense' ? 'selected' : ''}>Expense</option>
                                <option value="transfer" ${transaction?.type === 'transfer' ? 'selected' : ''}>Transfer</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="transactionCategory">Category</label>
                            <select class="form-control" id="transactionCategory" required>
                                <option value="">Select Category</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="transactionAmount">Amount</label>
                            <input type="number" class="form-control" id="transactionAmount" 
                                   step="0.01" min="0.01" required 
                                   value="${transaction?.amount || ''}">
                        </div>

                        <div class="form-group">
                            <label for="transactionDescription">Description</label>
                            <input type="text" class="form-control" id="transactionDescription" 
                                   required value="${transaction?.description || ''}">
                        </div>

                        <div class="form-group">
                            <label for="transactionAccount">Account</label>
                            <select class="form-control" id="transactionAccount" required>
                                <option value="">Select Account</option>
                            </select>
                        </div>

                        <div class="form-group" id="transferAccountGroup" style="display: none;">
                            <label for="transferToAccount">Transfer To Account</label>
                            <select class="form-control" id="transferToAccount">
                                <option value="">Select Account</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="transactionDate">Date</label>
                            <input type="datetime-local" class="form-control" id="transactionDate" 
                                   required value="${transaction?.date ? new Date(transaction.date).toISOString().slice(0, 16) : ''}">
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" id="cancelTransaction">Cancel</button>
                            <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Save'} Transaction</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const modal = document.getElementById('transactionModal');
        modal.innerHTML = modalHTML;
        modal.classList.add('active');

        // Populate accounts
        this.populateAccountOptions(accounts);
        
        // Set up type change handler
        document.getElementById('transactionType').addEventListener('change', (e) => {
            this.handleTransactionTypeChange(e.target.value, categories);
            
            // Show/hide transfer account field
            const transferGroup = document.getElementById('transferAccountGroup');
            transferGroup.style.display = e.target.value === 'transfer' ? 'block' : 'none';
        });

        // Set initial category options
        const initialType = transaction?.type || 'income';
        this.handleTransactionTypeChange(initialType, categories);
        
        if (transaction) {
            document.getElementById('transactionType').value = transaction.type;
            document.getElementById('transactionCategory').value = transaction.category;
            document.getElementById('transactionAccount').value = transaction.accountId;
            
            if (transaction.type === 'transfer' && transaction.toAccountId) {
                document.getElementById('transferToAccount').value = transaction.toAccountId;
            }
        }

        // Form submission
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction(transaction?.id);
        });

        // Close modal events
        document.querySelector('.modal-close').addEventListener('click', () => {
            modal.classList.remove('active');
        });

        document.getElementById('cancelTransaction').addEventListener('click', () => {
            modal.classList.remove('active');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    static populateAccountOptions(accounts) {
        const accountSelect = document.getElementById('transactionAccount');
        const transferSelect = document.getElementById('transferToAccount');
        
        let accountHTML = '<option value="">Select Account</option>';
        let transferHTML = '<option value="">Select Account</option>';
        
        Object.values(accounts).forEach(account => {
            const option = `<option value="${account.id}">${account.name} (${FinanceUtils.formatCurrency(account.balance)})</option>`;
            accountHTML += option;
            transferHTML += option;
        });
        
        accountSelect.innerHTML = accountHTML;
        transferSelect.innerHTML = transferHTML;
    }

    static handleTransactionTypeChange(type, categories) {
        const categorySelect = document.getElementById('transactionCategory');
        let categoryHTML = '<option value="">Select Category</option>';
        
        if (type && categories[type]) {
            categories[type].forEach(category => {
                categoryHTML += `<option value="${category}">${category}</option>`;
            });
        }
        
        categorySelect.innerHTML = categoryHTML;
    }

    static async saveTransaction(transactionId = null) {
        const form = document.getElementById('transactionForm');
        const formData = new FormData(form);
        
        const transactionData = {
            type: document.getElementById('transactionType').value,
            category: document.getElementById('transactionCategory').value,
            amount: parseFloat(document.getElementById('transactionAmount').value),
            description: document.getElementById('transactionDescription').value,
            accountId: document.getElementById('transactionAccount').value,
            date: document.getElementById('transactionDate').value,
            id: transactionId || FinanceUtils.generateId()
        };

        // For transfers, include toAccountId
        if (transactionData.type === 'transfer') {
            transactionData.toAccountId = document.getElementById('transferToAccount').value;
        }

        // Validate data
        if (!this.validateTransaction(transactionData)) {
            return;
        }

        // Save transaction - no download during normal operation
        const transactions = await DataManager.loadData('transactions', []);
        
        if (transactionId) {
            // Update existing transaction
            const index = transactions.findIndex(t => t.id === transactionId);
            if (index !== -1) {
                transactions[index] = transactionData;
            }
        } else {
            // Add new transaction
            transactions.push(transactionData);
        }

        await DataManager.saveData('transactions', transactions); // No download
        
        // Update account balances
        await this.updateAccountBalances(transactionData, transactionId ? 'update' : 'add');
        
        // Close modal and refresh
        document.getElementById('transactionModal').classList.remove('active');
        this.loadTransactionsList();
        
        // Refresh dashboard if it's active
        if (typeof DashboardManager !== 'undefined') {
            const dashboardElement = document.getElementById('dashboard');
            if (dashboardElement && dashboardElement.classList.contains('active')) {
                DashboardManager.loadDashboard();
            }
        }
    }

    static validateTransaction(transaction) {
        if (!transaction.type) {
            alert('Please select a transaction type');
            return false;
        }
        
        if (!transaction.category) {
            alert('Please select a category');
            return false;
        }
        
        if (!transaction.amount || transaction.amount <= 0) {
            alert('Please enter a valid amount');
            return false;
        }
        
        if (!transaction.description) {
            alert('Please enter a description');
            return false;
        }
        
        if (!transaction.accountId) {
            alert('Please select an account');
            return false;
        }
        
        if (transaction.type === 'transfer' && !transaction.toAccountId) {
            alert('Please select a destination account for transfer');
            return false;
        }
        
        if (transaction.type === 'transfer' && transaction.accountId === transaction.toAccountId) {
            alert('Cannot transfer to the same account');
            return false;
        }
        
        return true;
    }

    static async updateAccountBalances(transaction, action) {
        const accounts = await DataManager.loadData('accounts', {});
        
        if (action === 'add') {
            if (transaction.type === 'income') {
                accounts[transaction.accountId].balance += transaction.amount;
            } else if (transaction.type === 'expense') {
                accounts[transaction.accountId].balance -= transaction.amount;
            } else if (transaction.type === 'transfer') {
                accounts[transaction.accountId].balance -= transaction.amount;
                accounts[transaction.toAccountId].balance += transaction.amount;
            }
        }
        // For updates, we would need to calculate the difference from the previous transaction
        
        await DataManager.saveData('accounts', accounts); // No download
    }

    static async editTransaction(id) {
        const transactions = await DataManager.loadData('transactions', []);
        const transaction = transactions.find(t => t.id === id);
        
        if (transaction) {
            this.showTransactionModal(transaction);
        }
    }

    static async deleteTransaction(id) {
        if (!confirm('Are you sure you want to delete this transaction?')) {
            return;
        }

        const transactions = await DataManager.loadData('transactions', []);
        const transactionIndex = transactions.findIndex(t => t.id === id);
        
        if (transactionIndex !== -1) {
            const transaction = transactions[transactionIndex];
            transactions.splice(transactionIndex, 1);
            
            await DataManager.saveData('transactions', transactions); // No download
            
            // Update account balances (reverse the transaction)
            await this.reverseTransaction(transaction);
            
            this.loadTransactionsList();
            
            // Refresh dashboard if it's active
            if (typeof DashboardManager !== 'undefined') {
                const dashboardElement = document.getElementById('dashboard');
                if (dashboardElement && dashboardElement.classList.contains('active')) {
                    DashboardManager.loadDashboard();
                }
            }
        }
    }

    static async reverseTransaction(transaction) {
        const accounts = await DataManager.loadData('accounts', {});
        
        if (transaction.type === 'income') {
            accounts[transaction.accountId].balance -= transaction.amount;
        } else if (transaction.type === 'expense') {
            accounts[transaction.accountId].balance += transaction.amount;
        } else if (transaction.type === 'transfer') {
            accounts[transaction.accountId].balance += transaction.amount;
            accounts[transaction.toAccountId].balance -= transaction.amount;
        }
        
        await DataManager.saveData('accounts', accounts); // No download
    }

    static resetFilters() {
        document.getElementById('transactionTypeFilter').value = 'all';
        document.getElementById('transactionCategoryFilter').value = 'all';
        document.getElementById('transactionDateRange').value = 'all';
        
        this.currentPage = 1;
        this.loadTransactionsList();
    }
}