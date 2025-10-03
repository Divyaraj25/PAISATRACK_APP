// Budget management
class BudgetManager {
    static async loadBudgets() {
        const budgetsPage = document.getElementById('budgets');
        budgetsPage.innerHTML = this.getBudgetsHTML();
        
        await this.loadBudgetsList();
        this.initializeBudgetEvents();
    }

    static getBudgetsHTML() {
        return `
            <div class="page-header">
                <h2><i class="fas fa-chart-pie"></i> Budgets</h2>
                <button class="btn btn-primary" id="addBudgetBtn">
                    <i class="fas fa-plus"></i> Add Budget
                </button>
            </div>

            <div class="budgets-container">
                <div class="budgets-grid" id="budgetsGrid">
                    <!-- Budgets will be loaded here -->
                </div>
            </div>
        `;
    }

    static async loadBudgetsList() {
        const budgets = await DataManager.loadData('budgets', []);
        const transactions = await DataManager.loadData('transactions', []);
        const categories = await DataManager.loadData('categories', {
            income: ["Salary", "Freelance", "Investment", "Gift", "Business", "Bonus", "Dividend", "Rental Income", "Other"],
            expense: ["Food", "Transport", "Entertainment", "Utilities", "Rent", "Healthcare", "Education", "Shopping", "Travel", "Personal Care", "Insurance", "Taxes", "Subscriptions", "Maintenance", "Charity", "Other"],
            transfer: ["Cash to Bank", "Bank to Card", "Card to Cash", "Between Accounts", "Credit Card Payment", "Bank Transfer", "Investment Transfer", "Loan Payment"]
        });
        
        this.updateBudgetsGrid(budgets, transactions, categories);
    }

    static updateBudgetsGrid(budgets, transactions, categories) {
        const container = document.getElementById('budgetsGrid');
        
        if (budgets.length === 0) {
            container.innerHTML = '<p class="empty-state">No budgets set up. <a href="#" id="addFirstBudget">Create your first budget</a></p>';
            return;
        }

        let html = '';
        budgets.forEach(budget => {
            const spent = this.calculateBudgetSpending(budget, transactions);
            const percentage = (spent / budget.amount) * 100;
            const progressClass = percentage > 100 ? 'over-budget' : percentage > 80 ? 'near-limit' : 'on-track';
            
            html += `
                <div class="budget-card card">
                    <div class="budget-header">
                        <h3 class="budget-category">${budget.category}</h3>
                        <div class="budget-actions">
                            <button class="btn-icon edit-budget" data-id="${budget.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon delete-budget" data-id="${budget.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="budget-body">
                        <div class="budget-amounts">
                            <div class="budget-spent">
                                <span>Spent:</span>
                                <strong>${FinanceUtils.formatCurrency(spent)}</strong>
                            </div>
                            <div class="budget-total">
                                <span>Budget:</span>
                                <strong>${FinanceUtils.formatCurrency(budget.amount)}</strong>
                            </div>
                        </div>
                        <div class="budget-progress">
                            <div class="progress-bar">
                                <div class="progress-fill ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                            </div>
                            <span class="progress-text">${percentage.toFixed(1)}%</span>
                        </div>
                        <div class="budget-remaining">
                            <span>Remaining:</span>
                            <strong class="${budget.amount - spent < 0 ? 'negative' : 'positive'}">
                                ${FinanceUtils.formatCurrency(budget.amount - spent)}
                            </strong>
                        </div>
                    </div>
                    <div class="budget-footer">
                        <small>Period: ${budget.period}</small>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    static calculateBudgetSpending(budget, transactions) {
        const dateRange = FinanceUtils.getDateRange(budget.period);
        
        return transactions
            .filter(t => 
                t.type === 'expense' && 
                t.category === budget.category &&
                new Date(t.date) >= new Date(dateRange.start) &&
                new Date(t.date) <= new Date(dateRange.end)
            )
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    }

    static initializeBudgetEvents() {
        // Add budget button
        document.getElementById('addBudgetBtn').addEventListener('click', () => {
            this.showBudgetModal();
        });

        // Add first budget link
        document.addEventListener('click', (e) => {
            if (e.target.id === 'addFirstBudget') {
                e.preventDefault();
                this.showBudgetModal();
            }
        });

        // Edit and delete events (delegated)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-budget')) {
                const id = e.target.closest('.edit-budget').getAttribute('data-id');
                this.editBudget(id);
            }
            
            if (e.target.closest('.delete-budget')) {
                const id = e.target.closest('.delete-budget').getAttribute('data-id');
                this.deleteBudget(id);
            }
        });
    }

    static async showBudgetModal(budget = null) {
        const categories = await DataManager.loadData('categories', {
            income: ["Salary", "Freelance", "Investment", "Gift", "Business", "Bonus", "Dividend", "Rental Income", "Other"],
            expense: ["Food", "Transport", "Entertainment", "Utilities", "Rent", "Healthcare", "Education", "Shopping", "Travel", "Personal Care", "Insurance", "Taxes", "Subscriptions", "Maintenance", "Charity", "Other"],
            transfer: ["Cash to Bank", "Bank to Card", "Card to Cash", "Between Accounts", "Credit Card Payment", "Bank Transfer", "Investment Transfer", "Loan Payment"]
        });
        
        const isEdit = !!budget;
        const modalTitle = isEdit ? 'Edit Budget' : 'Add Budget';
        
        const modalHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${modalTitle}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="budgetForm">
                        <div class="form-group">
                            <label for="budgetCategory">Category</label>
                            <select class="form-control" id="budgetCategory" required>
                                <option value="">Select Category</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="budgetAmount">Budget Amount</label>
                            <input type="number" class="form-control" id="budgetAmount" 
                                   step="0.01" min="0.01" required 
                                   value="${budget?.amount || ''}">
                        </div>

                        <div class="form-group">
                            <label for="budgetPeriod">Budget Period</label>
                            <select class="form-control" id="budgetPeriod" required>
                                <option value="monthly" ${budget?.period === 'monthly' ? 'selected' : ''}>Monthly</option>
                                <option value="weekly" ${budget?.period === 'weekly' ? 'selected' : ''}>Weekly</option>
                                <option value="yearly" ${budget?.period === 'yearly' ? 'selected' : ''}>Yearly</option>
                            </select>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" id="cancelBudget">Cancel</button>
                            <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Save'} Budget</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const modal = document.getElementById('budgetModal');
        modal.innerHTML = modalHTML;
        modal.classList.add('active');

        // Populate category options
        this.populateBudgetCategories(categories.expense || []);

        if (budget) {
            document.getElementById('budgetCategory').value = budget.category;
            document.getElementById('budgetPeriod').value = budget.period;
        }

        // Form submission
        document.getElementById('budgetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBudget(budget?.id);
        });

        // Close modal events
        document.querySelector('.modal-close').addEventListener('click', () => {
            modal.classList.remove('active');
        });

        document.getElementById('cancelBudget').addEventListener('click', () => {
            modal.classList.remove('active');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    static populateBudgetCategories(expenseCategories) {
        const categorySelect = document.getElementById('budgetCategory');
        let categoryHTML = '<option value="">Select Category</option>';
        
        expenseCategories.forEach(category => {
            categoryHTML += `<option value="${category}">${category}</option>`;
        });
        
        categorySelect.innerHTML = categoryHTML;
    }

    static async saveBudget(budgetId = null) {
        const form = document.getElementById('budgetForm');
        
        const budgetData = {
            category: document.getElementById('budgetCategory').value,
            amount: parseFloat(document.getElementById('budgetAmount').value),
            period: document.getElementById('budgetPeriod').value,
            id: budgetId || FinanceUtils.generateId()
        };

        // Validate data
        if (!this.validateBudget(budgetData)) {
            return;
        }

        // Save budget - no download during normal operation
        const budgets = await DataManager.loadData('budgets', []);
        
        if (budgetId) {
            // Update existing budget
            const index = budgets.findIndex(b => b.id === budgetId);
            if (index !== -1) {
                budgets[index] = budgetData;
            }
        } else {
            // Check if budget already exists for this category and period
            const existingBudget = budgets.find(b => 
                b.category === budgetData.category && b.period === budgetData.period
            );
            
            if (existingBudget) {
                if (!confirm('A budget already exists for this category and period. Do you want to replace it?')) {
                    return;
                }
                
                // Remove existing budget
                const index = budgets.findIndex(b => 
                    b.category === budgetData.category && b.period === budgetData.period
                );
                budgets.splice(index, 1);
            }
            
            // Add new budget
            budgets.push(budgetData);
        }

        await DataManager.saveData('budgets', budgets); // No download
        
        // Close modal and refresh
        document.getElementById('budgetModal').classList.remove('active');
        this.loadBudgetsList();
        
        // Refresh dashboard if it's active
        if (typeof DashboardManager !== 'undefined' && document.getElementById('dashboard').classList.contains('active')) {
            DashboardManager.loadDashboard();
        }
    }

    static validateBudget(budget) {
        if (!budget.category) {
            alert('Please select a category');
            return false;
        }
        
        if (!budget.amount || budget.amount <= 0) {
            alert('Please enter a valid budget amount');
            return false;
        }
        
        if (!budget.period) {
            alert('Please select a budget period');
            return false;
        }
        
        return true;
    }

    static async editBudget(id) {
        const budgets = await DataManager.loadData('budgets', []);
        const budget = budgets.find(b => b.id === id);
        
        if (budget) {
            this.showBudgetModal(budget);
        }
    }

    static async deleteBudget(id) {
        if (!confirm('Are you sure you want to delete this budget?')) {
            return;
        }

        const budgets = await DataManager.loadData('budgets', []);
        const updatedBudgets = budgets.filter(b => b.id !== id);
        
        await DataManager.saveData('budgets', updatedBudgets); // No download
        this.loadBudgetsList();
        
        // Refresh dashboard if it's active
        if (typeof DashboardManager !== 'undefined' && document.getElementById('dashboard').classList.contains('active')) {
            DashboardManager.loadDashboard();
        }
    }
}