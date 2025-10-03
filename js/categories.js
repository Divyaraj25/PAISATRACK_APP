// Category management
class CategoryManager {
    static async loadCategories() {
        const categoriesPage = document.getElementById('categories');
        categoriesPage.innerHTML = this.getCategoriesHTML();
        
        await this.loadCategoriesList();
        this.initializeCategoryEvents();
    }

    static getCategoriesHTML() {
        return `
            <div class="page-header">
                <h2><i class="fas fa-tags"></i> Categories</h2>
                <button class="btn btn-primary" id="addCategoryBtn">
                    <i class="fas fa-plus"></i> Add Category
                </button>
            </div>

            <div class="categories-container">
                <div class="categories-tabs">
                    <button class="tab-btn active" data-tab="income">Income Categories</button>
                    <button class="tab-btn" data-tab="expense">Expense Categories</button>
                    <button class="tab-btn" data-tab="transfer">Transfer Categories</button>
                </div>

                <div class="categories-content">
                    <div id="incomeCategories" class="tab-content active">
                        <!-- Income categories will be loaded here -->
                    </div>
                    <div id="expenseCategories" class="tab-content">
                        <!-- Expense categories will be loaded here -->
                    </div>
                    <div id="transferCategories" class="tab-content">
                        <!-- Transfer categories will be loaded here -->
                    </div>
                </div>
            </div>
        `;
    }

    static async loadCategoriesList() {
        const categories = await DataManager.loadData('categories', {
            income: ["Salary", "Freelance", "Investment", "Gift", "Business", "Bonus", "Dividend", "Rental Income", "Other"],
            expense: ["Food", "Transport", "Entertainment", "Utilities", "Rent", "Healthcare", "Education", "Shopping", "Travel", "Personal Care", "Insurance", "Taxes", "Subscriptions", "Maintenance", "Charity", "Other"],
            transfer: ["Cash to Bank", "Bank to Card", "Card to Cash", "Between Accounts", "Credit Card Payment", "Bank Transfer", "Investment Transfer", "Loan Payment"]
        });
        
        this.updateCategoriesDisplay(categories);
    }

    static updateCategoriesDisplay(categories) {
        // Income categories
        const incomeContainer = document.getElementById('incomeCategories');
        incomeContainer.innerHTML = this.getCategoryListHTML(categories.income, 'income');
        
        // Expense categories
        const expenseContainer = document.getElementById('expenseCategories');
        expenseContainer.innerHTML = this.getCategoryListHTML(categories.expense, 'expense');
        
        // Transfer categories
        const transferContainer = document.getElementById('transferCategories');
        transferContainer.innerHTML = this.getCategoryListHTML(categories.transfer, 'transfer');
    }

    static getCategoryListHTML(categories, type) {
        if (!categories || categories.length === 0) {
            return '<p class="empty-state">No categories found</p>';
        }

        let html = '<div class="categories-grid">';
        
        categories.forEach(category => {
            const icon = FinanceUtils.getCategoryIcon(category, type);
            
            html += `
                <div class="category-card">
                    <div class="category-icon">
                        <i class="${icon}"></i>
                    </div>
                    <div class="category-name">
                        <h4>${category}</h4>
                    </div>
                    <div class="category-actions">
                        <button class="btn-icon edit-category" data-type="${type}" data-category="${category}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-category" data-type="${type}" data-category="${category}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    static initializeCategoryEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        // Add category button
        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            this.showCategoryModal();
        });

        // Edit and delete events (delegated)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-category')) {
                const button = e.target.closest('.edit-category');
                const type = button.getAttribute('data-type');
                const category = button.getAttribute('data-category');
                this.editCategory(type, category);
            }
            
            if (e.target.closest('.delete-category')) {
                const button = e.target.closest('.delete-category');
                const type = button.getAttribute('data-type');
                const category = button.getAttribute('data-category');
                this.deleteCategory(type, category);
            }
        });
    }

    static switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tab}Categories`).classList.add('active');
    }

    static async showCategoryModal(categoryData = null) {
        const isEdit = !!categoryData;
        const modalTitle = isEdit ? 'Edit Category' : 'Add Category';
        
        const modalHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${modalTitle}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="categoryForm">
                        <div class="form-group">
                            <label for="categoryType">Category Type</label>
                            <select class="form-control" id="categoryType" required>
                                <option value="">Select Type</option>
                                <option value="income" ${categoryData?.type === 'income' ? 'selected' : ''}>Income</option>
                                <option value="expense" ${categoryData?.type === 'expense' ? 'selected' : ''}>Expense</option>
                                <option value="transfer" ${categoryData?.type === 'transfer' ? 'selected' : ''}>Transfer</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="categoryName">Category Name</label>
                            <input type="text" class="form-control" id="categoryName" 
                                   required value="${categoryData?.name || ''}">
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" id="cancelCategory">Cancel</button>
                            <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Save'} Category</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const modal = document.getElementById('categoryModal');
        modal.innerHTML = modalHTML;
        modal.classList.add('active');

        // Form submission
        document.getElementById('categoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory(categoryData);
        });

        // Close modal events
        document.querySelector('.modal-close').addEventListener('click', () => {
            modal.classList.remove('active');
        });

        document.getElementById('cancelCategory').addEventListener('click', () => {
            modal.classList.remove('active');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    static async saveCategory(categoryData = null) {
        const form = document.getElementById('categoryForm');
        
        const categoryInfo = {
            type: document.getElementById('categoryType').value,
            name: document.getElementById('categoryName').value
        };

        // Validate data
        if (!this.validateCategory(categoryInfo)) {
            return;
        }

        // Save category - no download during normal operation
        // Load existing categories with default values to preserve existing categories
        const categories = await DataManager.loadData('categories', {
            income: ["Salary", "Freelance", "Investment", "Gift", "Business", "Bonus", "Dividend", "Rental Income", "Other"],
            expense: ["Food", "Transport", "Entertainment", "Utilities", "Rent", "Healthcare", "Education", "Shopping", "Travel", "Personal Care", "Insurance", "Taxes", "Subscriptions", "Maintenance", "Charity", "Other"],
            transfer: ["Cash to Bank", "Bank to Card", "Card to Cash", "Between Accounts", "Credit Card Payment", "Bank Transfer", "Investment Transfer", "Loan Payment"]
        });

        if (categoryData) {
            // Update existing category
            const oldType = categoryData.type;
            const oldName = categoryData.name;
            
            // Remove from old position
            const oldIndex = categories[oldType].indexOf(oldName);
            if (oldIndex !== -1) {
                categories[oldType].splice(oldIndex, 1);
            }
            
            // Add to new position
            if (!categories[categoryInfo.type].includes(categoryInfo.name)) {
                categories[categoryInfo.type].push(categoryInfo.name);
            }
        } else {
            // Add new category
            if (!categories[categoryInfo.type].includes(categoryInfo.name)) {
                categories[categoryInfo.type].push(categoryInfo.name);
            } else {
                alert('This category already exists');
                return;
            }
        }

        await DataManager.saveData('categories', categories); // No download
        
        // Close modal and refresh
        document.getElementById('categoryModal').classList.remove('active');
        this.loadCategoriesList();
    }

    static validateCategory(category) {
        if (!category.type) {
            alert('Please select a category type');
            return false;
        }
        
        if (!category.name) {
            alert('Please enter a category name');
            return false;
        }
        
        return true;
    }

    static editCategory(type, categoryName) {
        this.showCategoryModal({
            type: type,
            name: categoryName
        });
    }

    static async deleteCategory(type, categoryName) {
        // Check if category is used in transactions
        const transactions = await DataManager.loadData('transactions', []);
        const categoryTransactions = transactions.filter(t => 
            t.type === type && t.category === categoryName
        );
        
        if (categoryTransactions.length > 0) {
            alert(`Cannot delete category "${categoryName}" as it is used in ${categoryTransactions.length} transaction(s).`);
            return;
        }
        
        // Check if category is used in budgets
        const budgets = await DataManager.loadData('budgets', []);
        const categoryBudgets = budgets.filter(b => b.category === categoryName);
        
        if (categoryBudgets.length > 0) {
            alert(`Cannot delete category "${categoryName}" as it is used in ${categoryBudgets.length} budget(s).`);
            return;
        }
        
        if (!confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
            return;
        }

        // Load existing categories with default values to preserve existing categories
        const categories = await DataManager.loadData('categories', {
            income: ["Salary", "Freelance", "Investment", "Gift", "Business", "Bonus", "Dividend", "Rental Income", "Other"],
            expense: ["Food", "Transport", "Entertainment", "Utilities", "Rent", "Healthcare", "Education", "Shopping", "Travel", "Personal Care", "Insurance", "Taxes", "Subscriptions", "Maintenance", "Charity", "Other"],
            transfer: ["Cash to Bank", "Bank to Card", "Card to Cash", "Between Accounts", "Credit Card Payment", "Bank Transfer", "Investment Transfer", "Loan Payment"]
        });
        
        const index = categories[type].indexOf(categoryName);
        if (index !== -1) {
            categories[type].splice(index, 1);
            await DataManager.saveData('categories', categories); // No download
            this.loadCategoriesList();
        }
    }
}