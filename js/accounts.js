// Account management
class AccountManager {
    static async loadAccounts() {
        const accountsPage = document.getElementById('accounts');
        accountsPage.innerHTML = this.getAccountsHTML();
        
        await this.loadAccountsList();
        this.initializeAccountEvents();
    }

    static getAccountsHTML() {
        return `
            <div class="page-header">
                <h2><i class="fas fa-credit-card"></i> Accounts</h2>
                <button class="btn btn-primary" id="addAccountBtn">
                    <i class="fas fa-plus"></i> Add Account
                </button>
            </div>

            <div class="accounts-container">
                <div class="accounts-grid" id="accountsGrid">
                    <!-- Accounts will be loaded here -->
                </div>
            </div>
        `;
    }

    static async loadAccountsList() {
        const accounts = await DataManager.loadData('accounts', {});
        this.updateAccountsGrid(accounts);
    }

    static updateAccountsGrid(accounts) {
        const container = document.getElementById('accountsGrid');
        
        if (Object.keys(accounts).length === 0) {
            container.innerHTML = '<p class="empty-state">No accounts set up. <a href="#" id="addFirstAccount">Add your first account</a></p>';
            return;
        }

        let html = '';
        Object.values(accounts).forEach(account => {
            const icon = FinanceUtils.getAccountIcon(account.type);
            const balanceClass = account.balance >= 0 ? 'positive' : 'negative';
            
            html += `
                <div class="account-card card">
                    <div class="account-header">
                        <div class="account-icon">
                            <i class="${icon}"></i>
                        </div>
                        <div class="account-actions">
                            <button class="btn-icon edit-account" data-id="${account.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon delete-account" data-id="${account.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="account-body">
                        <h3 class="account-name">${account.name}</h3>
                        <p class="account-type">${account.type}</p>
                        ${account.lastFour ? `<p class="account-number">**** ${account.lastFour}</p>` : ''}
                        ${account.bankName ? `<p class="bank-name">${account.bankName}</p>` : ''}
                        ${account.expiry ? `<p class="account-expiry">Expires: ${account.expiry}</p>` : ''}
                        ${account.description ? `<p class="account-description">${account.description}</p>` : ''}
                    </div>
                    <div class="account-footer">
                        <div class="account-balance ${balanceClass}">
                            ${FinanceUtils.formatCurrency(account.balance)}
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    static initializeAccountEvents() {
        // Add account button
        document.getElementById('addAccountBtn').addEventListener('click', () => {
            this.showAccountModal();
        });

        // Add first account link
        document.addEventListener('click', (e) => {
            if (e.target.id === 'addFirstAccount') {
                e.preventDefault();
                this.showAccountModal();
            }
        });

        // Edit and delete events (delegated)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-account')) {
                const id = e.target.closest('.edit-account').getAttribute('data-id');
                this.editAccount(id);
            }
            
            if (e.target.closest('.delete-account')) {
                const id = e.target.closest('.delete-account').getAttribute('data-id');
                this.deleteAccount(id);
            }
        });
    }

    static async showAccountModal(account = null) {
        const isEdit = !!account;
        const modalTitle = isEdit ? 'Edit Account' : 'Add Account';
        
        const modalHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${modalTitle}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="accountForm">
                        <div class="form-group">
                            <label for="accountName">Account Name</label>
                            <input type="text" class="form-control" id="accountName" 
                                   required value="${account?.name || ''}">
                        </div>

                        <div class="form-group">
                            <label for="accountType">Account Type</label>
                            <select class="form-control" id="accountType" required>
                                <option value="">Select Type</option>
                                <option value="Cash" ${account?.type === 'Cash' ? 'selected' : ''}>Cash</option>
                                <option value="Bank Account" ${account?.type === 'Bank Account' ? 'selected' : ''}>Bank Account</option>
                                <option value="Credit Card" ${account?.type === 'Credit Card' ? 'selected' : ''}>Credit Card</option>
                                <option value="Debit Card" ${account?.type === 'Debit Card' ? 'selected' : ''}>Debit Card</option>
                                <option value="Savings Account" ${account?.type === 'Savings Account' ? 'selected' : ''}>Savings Account</option>
                                <option value="Investment Account" ${account?.type === 'Investment Account' ? 'selected' : ''}>Investment Account</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="accountBalance">Initial Balance</label>
                            <input type="number" class="form-control" id="accountBalance" 
                                   step="0.01" value="${account?.balance || '0.00'}">
                        </div>

                        <div class="form-group" id="bankInfoGroup">
                            <label for="bankName">Bank Name</label>
                            <input type="text" class="form-control" id="bankName" 
                                   value="${account?.bankName || ''}">
                        </div>

                        <div class="form-group" id="cardInfoGroup">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="lastFourDigits">Last 4 Digits</label>
                                    <input type="text" class="form-control" id="lastFourDigits" 
                                           maxlength="4" pattern="[0-9]{4}" value="${account?.lastFour || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="expiryDate">Expiry Date</label>
                                    <input type="month" class="form-control" id="expiryDate" 
                                           value="${account?.expiry || ''}">
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="accountDescription">Description (Optional)</label>
                            <textarea class="form-control" id="accountDescription" 
                                      rows="3">${account?.description || ''}</textarea>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" id="cancelAccount">Cancel</button>
                            <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Save'} Account</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const modal = document.getElementById('accountModal');
        modal.innerHTML = modalHTML;
        modal.classList.add('active');

        // Set up account type change handler
        document.getElementById('accountType').addEventListener('change', (e) => {
            this.handleAccountTypeChange(e.target.value);
        });

        // Set initial state
        const initialType = account?.type || 'Cash';
        this.handleAccountTypeChange(initialType);

        // Form submission
        document.getElementById('accountForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAccount(account?.id);
        });

        // Close modal events
        document.querySelector('.modal-close').addEventListener('click', () => {
            modal.classList.remove('active');
        });

        document.getElementById('cancelAccount').addEventListener('click', () => {
            modal.classList.remove('active');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    static handleAccountTypeChange(type) {
        const bankInfoGroup = document.getElementById('bankInfoGroup');
        const cardInfoGroup = document.getElementById('cardInfoGroup');
        
        // Show/hide bank info for bank accounts and cards
        const showBankInfo = ['Bank Account', 'Credit Card', 'Debit Card', 'Savings Account'].includes(type);
        bankInfoGroup.style.display = showBankInfo ? 'block' : 'none';
        
        // Show/hide card info for credit/debit cards
        const showCardInfo = ['Credit Card', 'Debit Card'].includes(type);
        cardInfoGroup.style.display = showCardInfo ? 'block' : 'none';
    }

    static async saveAccount(accountId = null) {
        const form = document.getElementById('accountForm');
        const formData = new FormData(form);
        
        const accountData = {
            name: document.getElementById('accountName').value,
            type: document.getElementById('accountType').value,
            balance: parseFloat(document.getElementById('accountBalance').value) || 0,
            description: document.getElementById('accountDescription').value,
            id: accountId || FinanceUtils.generateId()
        };

        // Add bank info if applicable
        const bankName = document.getElementById('bankName').value;
        if (bankName) {
            accountData.bankName = bankName;
        }

        // Add card info if applicable
        const lastFour = document.getElementById('lastFourDigits').value;
        const expiry = document.getElementById('expiryDate').value;
        if (lastFour) {
            accountData.lastFour = lastFour;
        }
        if (expiry) {
            accountData.expiry = expiry;
        }

        // Validate data
        if (!this.validateAccount(accountData)) {
            return;
        }

        // Save account - no download during normal operation
        const accounts = await DataManager.loadData('accounts', {});
        
        if (accountId) {
            // Update existing account
            accounts[accountId] = accountData;
        } else {
            // Add new account
            accounts[accountData.id] = accountData;
        }

        await DataManager.saveData('accounts', accounts); // No download
        
        // Close modal and refresh
        document.getElementById('accountModal').classList.remove('active');
        this.loadAccountsList();
        
        // Refresh dashboard if it's active
        if (typeof DashboardManager !== 'undefined' && document.getElementById('dashboard').classList.contains('active')) {
            DashboardManager.loadDashboard();
        }
    }

    static validateAccount(account) {
        if (!account.name) {
            alert('Please enter an account name');
            return false;
        }
        
        if (!account.type) {
            alert('Please select an account type');
            return false;
        }
        
        if (isNaN(account.balance)) {
            alert('Please enter a valid balance');
            return false;
        }
        
        // Validate last four digits for cards
        if (account.lastFour && !/^\d{4}$/.test(account.lastFour)) {
            alert('Please enter valid last 4 digits (numbers only)');
            return false;
        }
        
        return true;
    }

    static async editAccount(id) {
        const accounts = await DataManager.loadData('accounts', {});
        const account = accounts[id];
        
        if (account) {
            this.showAccountModal(account);
        }
    }

    static async deleteAccount(id) {
        const accounts = await DataManager.loadData('accounts', {});
        const transactions = await DataManager.loadData('transactions', []);
        
        // Check if account has transactions
        const accountTransactions = transactions.filter(t => 
            t.accountId === id || t.toAccountId === id
        );
        
        if (accountTransactions.length > 0) {
            if (!confirm(`This account has ${accountTransactions.length} transaction(s). Deleting it will also remove these transactions. Are you sure?`)) {
                return;
            }
            
            // Remove transactions associated with this account
            const updatedTransactions = transactions.filter(t => 
                t.accountId !== id && t.toAccountId !== id
            );
            await DataManager.saveData('transactions', updatedTransactions); // No download
        } else {
            if (!confirm('Are you sure you want to delete this account?')) {
                return;
            }
        }
        
        delete accounts[id];
        await DataManager.saveData('accounts', accounts); // No download
        
        this.loadAccountsList();
        
        // Refresh dashboard if it's active
        if (typeof DashboardManager !== 'undefined' && document.getElementById('dashboard').classList.contains('active')) {
            DashboardManager.loadDashboard();
        }
    }
}