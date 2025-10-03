// Dashboard management
class DashboardManager {
    static async loadDashboard() {
        await this.updateDashboard('monthly');
    }

    static async updateDashboard(rangeType = 'monthly', customStart = null, customEnd = null) {
        const dateRange = FinanceUtils.getDateRange(rangeType, customStart, customEnd);
        
        // Load data
        const transactions = await DataManager.loadData('transactions', []);
        const accounts = await DataManager.loadData('accounts', {});
        const budgets = await DataManager.loadData('budgets', []);
        
        // Calculate dashboard metrics
        this.calculateMetrics(transactions, dateRange);
        this.updateAccountBalances(accounts);
        this.updateRecentTransactions(transactions);
        this.updateCharts(transactions, dateRange);
        this.updateBudgetStatus(budgets, transactions, dateRange);
    }

    static calculateMetrics(transactions, dateRange) {
        let totalIncome = 0;
        let totalExpenses = 0;
        
        const filteredTransactions = transactions.filter(transaction => {
            const transactionDate = FinanceUtils.parseDate(transaction.date);
            const startDate = FinanceUtils.parseDate(dateRange.start);
            const endDate = FinanceUtils.parseDate(dateRange.end);
            return transactionDate >= startDate && transactionDate <= endDate;
        });

        filteredTransactions.forEach(transaction => {
            if (transaction.type === 'income') {
                totalIncome += parseFloat(transaction.amount);
            } else if (transaction.type === 'expense') {
                totalExpenses += parseFloat(transaction.amount);
            }
        });

        const netBalance = totalIncome - totalExpenses;

        // Update UI
        document.getElementById('totalIncome').textContent = FinanceUtils.formatCurrency(totalIncome);
        document.getElementById('totalExpenses').textContent = FinanceUtils.formatCurrency(totalExpenses);
        document.getElementById('netBalance').textContent = FinanceUtils.formatCurrency(netBalance);

        // Calculate changes (placeholder - would need historical data for real calculation)
        document.getElementById('incomeChange').textContent = '+0%';
        document.getElementById('expensesChange').textContent = '-0%';
        document.getElementById('balanceChange').textContent = netBalance >= 0 ? '+0%' : '-0%';
    }

    static updateAccountBalances(accounts) {
        const container = document.getElementById('accountBalances');
        
        if (Object.keys(accounts).length === 0) {
            container.innerHTML = '<p class="empty-state">No accounts set up. <a href="#" data-page="accounts">Add your first account</a></p>';
            return;
        }

        let html = '<div class="accounts-grid">';
        
        Object.values(accounts).forEach(account => {
            const icon = FinanceUtils.getAccountIcon(account.type);
            html += `
                <div class="account-item">
                    <div class="account-icon">
                        <i class="${icon}"></i>
                    </div>
                    <div class="account-info">
                        <h4>${account.name}</h4>
                        <p class="account-number">${account.lastFour ? `**** ${account.lastFour}` : ''}</p>
                    </div>
                    <div class="account-balance">
                        <strong>${FinanceUtils.formatCurrency(account.balance)}</strong>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    static updateRecentTransactions(transactions) {
        const container = document.getElementById('recentTransactions');
        
        if (transactions.length === 0) {
            container.innerHTML = '<p class="empty-state">No transactions yet. <a href="#" data-page="transactions">Add your first transaction</a></p>';
            return;
        }

        // Sort by date (newest first) and take first 5
        const recent = transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        let html = '<div class="transactions-list">';
        
        recent.forEach(transaction => {
            const icon = FinanceUtils.getCategoryIcon(transaction.category, transaction.type);
            const amountClass = transaction.type === 'income' ? 'positive' : 'negative';
            
            html += `
                <div class="transaction-item">
                    <div class="transaction-icon">
                        <i class="${icon}"></i>
                    </div>
                    <div class="transaction-details">
                        <h4>${transaction.description}</h4>
                        <p>${transaction.category} • ${FinanceUtils.formatDate(transaction.date)}</p>
                    </div>
                    <div class="transaction-amount ${amountClass}">
                        ${transaction.type === 'income' ? '+' : '-'}${FinanceUtils.formatCurrency(transaction.amount)}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    static updateCharts(transactions, dateRange) {
        // This would integrate with Chart.js to create visualizations
        // For now, we'll just create a placeholder
        const ctx = document.getElementById('incomeExpenseChart');
        if (ctx) {
            // In a real implementation, we would create charts here
            ctx.innerHTML = '<p style="text-align: center; padding: 2rem;">Chart visualization would appear here</p>';
        }
    }

    static updateBudgetStatus(budgets, transactions, dateRange) {
        // Calculate budget utilization
        if (budgets.length === 0) {
            document.getElementById('budgetStatus').textContent = '0/0';
            document.getElementById('budgetChange').textContent = 'No Budgets';
            return;
        }

        let totalBudget = 0;
        let totalSpent = 0;

        budgets.forEach(budget => {
            totalBudget += parseFloat(budget.amount);
            
            const categoryTransactions = transactions.filter(t => 
                t.type === 'expense' && 
                t.category === budget.category &&
                new Date(t.date) >= new Date(dateRange.start) &&
                new Date(t.date) <= new Date(dateRange.end)
            );
            
            const spent = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
            totalSpent += spent;
        });

        document.getElementById('budgetStatus').textContent = `${FinanceUtils.formatCurrency(totalSpent)}/${FinanceUtils.formatCurrency(totalBudget)}`;
        
        const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
        if (utilization > 100) {
            document.getElementById('budgetChange').textContent = 'Over Budget';
            document.getElementById('budgetChange').className = 'change negative';
        } else if (utilization > 80) {
            document.getElementById('budgetChange').textContent = 'Near Limit';
            document.getElementById('budgetChange').className = 'change warning';
        } else {
            document.getElementById('budgetChange').textContent = 'On Track';
            document.getElementById('budgetChange').className = 'change positive';
        }
    }
}