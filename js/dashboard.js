// Dashboard management
class DashboardManager {
    static incomeExpenseChart = null;
    static categoryChart = null;
    static accountChart = null;
    
    static destroyChart() {
        if (this.incomeExpenseChart) {
            this.incomeExpenseChart.destroy();
            this.incomeExpenseChart = null;
        }
        if (this.categoryChart) {
            this.categoryChart.destroy();
            this.categoryChart = null;
        }
        if (this.accountChart) {
            this.accountChart.destroy();
            this.accountChart = null;
        }
    }
    static async loadDashboard() {
        // Clean up any existing chart
        this.destroyChart();
        await this.updateDashboard('monthly');
    }

    static async updateDashboard(rangeType = 'monthly', customStart = null, customEnd = null) {
        const dateRange = FinanceUtils.getDateRange(rangeType, customStart, customEnd);
        
        // Load data
        const transactions = await DataManager.loadData('transactions', []);
        const accounts = await DataManager.loadData('accounts', {});
        const budgets = await DataManager.loadData('budgets', []);
        
        // Calculate dashboard metrics
        this.calculateMetrics(transactions, dateRange, accounts);
        this.updateAccountBalances(accounts);
        this.updateRecentTransactions(transactions);
        this.updateCharts(transactions, dateRange);
        this.updateCategoryChart(transactions, dateRange, accounts);
        this.updateBudgetStatus(budgets, transactions, dateRange);
    }

    static calculateMetrics(transactions, dateRange, accounts = {}) {
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

        // Calculate net balance based on current account balances
        let totalAccountBalance = 0;
        Object.values(accounts).forEach(account => {
            totalAccountBalance += parseFloat(account.balance || 0);
        });

        const netBalance = totalAccountBalance;

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
            const balanceClass = account.balance >= 0 ? 'positive' : 'negative';
            html += `
                <div class="account-item">
                    <div class="account-icon">
                        <i class="${icon}"></i>
                    </div>
                    <div class="account-info">
                        <h4>${account.name}</h4>
                        <p class="account-number">${account.lastFour ? `**** ${account.lastFour}` : ''}</p>
                    </div>
                    <div class="account-balance ${balanceClass}">
                        ${FinanceUtils.formatCurrency(account.balance)}
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
        const ctx = document.getElementById('incomeExpenseChart');
        if (ctx) {
            // Filter transactions by date range
            const filteredTransactions = transactions.filter(transaction => {
                const transactionDate = FinanceUtils.parseDate(transaction.date);
                const startDate = FinanceUtils.parseDate(dateRange.start);
                const endDate = FinanceUtils.parseDate(dateRange.end);
                return transactionDate >= startDate && transactionDate <= endDate;
            });
            
            // Group transactions by date (daily)
            const dailyData = {};
            filteredTransactions.forEach(transaction => {
                const date = transaction.date.split('T')[0]; // Get date part only
                if (!dailyData[date]) {
                    dailyData[date] = { income: 0, expense: 0 };
                }
                if (transaction.type === 'income') {
                    dailyData[date].income += parseFloat(transaction.amount);
                } else if (transaction.type === 'expense') {
                    dailyData[date].expense += parseFloat(transaction.amount);
                }
            });
            
            // Sort dates
            const sortedDates = Object.keys(dailyData).sort();
            
            // Prepare chart data
            const incomeData = sortedDates.map(date => dailyData[date].income);
            const expenseData = sortedDates.map(date => dailyData[date].expense);
            
            // Format dates for display
            const formattedDates = sortedDates.map(date => {
                const d = new Date(date);
                return `${d.getDate()}/${d.getMonth() + 1}`;
            });
            
            // Destroy existing chart if it exists
            this.destroyChart();
            
            // Create new chart
            this.incomeExpenseChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: formattedDates,
                    datasets: [
                        {
                            label: 'Income',
                            data: incomeData,
                            backgroundColor: 'rgba(40, 167, 69, 0.7)',
                            borderColor: 'rgba(40, 167, 69, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Expenses',
                            data: expenseData,
                            backgroundColor: 'rgba(220, 53, 69, 0.7)',
                            borderColor: 'rgba(220, 53, 69, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '₹' + value.toLocaleString();
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    static updateCategoryChart(transactions, dateRange, accounts) {
        // Create container for additional charts if it doesn't exist
        let additionalChartsContainer = document.getElementById('additionalCharts');
        if (!additionalChartsContainer) {
            const dashboardContent = document.querySelector('.dashboard-content');
            const recentSection = document.querySelector('.recent-section');
            
            additionalChartsContainer = document.createElement('div');
            additionalChartsContainer.id = 'additionalCharts';
            additionalChartsContainer.className = 'additional-charts';
            
            // Insert before recent transactions on desktop, after on mobile
            if (window.innerWidth <= 768) {
                dashboardContent.parentNode.insertBefore(additionalChartsContainer, dashboardContent.nextSibling);
            } else {
                dashboardContent.parentNode.insertBefore(additionalChartsContainer, recentSection);
            }
        } else {
            // Re-position the additional charts container on window resize
            const dashboardContent = document.querySelector('.dashboard-content');
            const recentSection = document.querySelector('.recent-section');
            
            if (window.innerWidth <= 768) {
                // Move to after dashboard content on mobile
                if (additionalChartsContainer.previousElementSibling !== dashboardContent) {
                    dashboardContent.parentNode.insertBefore(additionalChartsContainer, dashboardContent.nextSibling);
                }
            } else {
                // Move to before recent transactions on desktop
                if (additionalChartsContainer.nextElementSibling !== recentSection) {
                    dashboardContent.parentNode.insertBefore(additionalChartsContainer, recentSection);
                }
            }
        }
        
        // Create category chart HTML
        let categoryChartHTML = `
            <div class="chart-card">
                <div class="card-header">
                    <h3>Expenses by Category</h3>
                </div>
                <div class="card-body">
                    <canvas id="categoryChart"></canvas>
                </div>
            </div>
        `;
        
        // Create account chart HTML
        let accountChartHTML = `
            <div class="chart-card">
                <div class="card-header">
                    <h3>Account Balances</h3>
                </div>
                <div class="card-body">
                    <canvas id="accountChart"></canvas>
                </div>
            </div>
        `;
        
        additionalChartsContainer.innerHTML = categoryChartHTML + accountChartHTML;
        
        // Create category chart
        const categoryCtx = document.getElementById('categoryChart');
        if (categoryCtx) {
            // Filter transactions by date range and type
            const filteredTransactions = transactions.filter(transaction => {
                const transactionDate = FinanceUtils.parseDate(transaction.date);
                const startDate = FinanceUtils.parseDate(dateRange.start);
                const endDate = FinanceUtils.parseDate(dateRange.end);
                return transactionDate >= startDate && transactionDate <= endDate && transaction.type === 'expense';
            });
            
            // Group by category
            const categoryData = {};
            filteredTransactions.forEach(transaction => {
                if (!categoryData[transaction.category]) {
                    categoryData[transaction.category] = 0;
                }
                categoryData[transaction.category] += parseFloat(transaction.amount);
            });
            
            // Prepare chart data
            const categories = Object.keys(categoryData);
            const amounts = categories.map(category => categoryData[category]);
            
            // Destroy existing chart if it exists
            if (this.categoryChart) {
                this.categoryChart.destroy();
            }
            
            // Create new chart
            this.categoryChart = new Chart(categoryCtx, {
                type: 'doughnut',
                data: {
                    labels: categories,
                    datasets: [{
                        data: amounts,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(255, 205, 86, 0.7)',
                            'rgba(75, 192, 192, 0.7)',
                            'rgba(153, 102, 255, 0.7)',
                            'rgba(255, 159, 64, 0.7)',
                            'rgba(199, 199, 199, 0.7)',
                            'rgba(83, 102, 255, 0.7)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 205, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)',
                            'rgba(199, 199, 199, 1)',
                            'rgba(83, 102, 255, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ₹' + context.parsed.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Update account chart
        this.updateAccountChart(accounts);
    }

    static updateAccountChart(accounts) {
        const accountCtx = document.getElementById('accountChart');
        if (accountCtx) {
            // Prepare chart data from accounts
            const accountNames = Object.values(accounts).map(account => account.name);
            const accountBalances = Object.values(accounts).map(account => parseFloat(account.balance || 0));
            
            // Destroy existing chart if it exists
            if (this.accountChart) {
                this.accountChart.destroy();
            }
            
            // Create new chart
            this.accountChart = new Chart(accountCtx, {
                type: 'bar',
                data: {
                    labels: accountNames,
                    datasets: [{
                        label: 'Account Balance',
                        data: accountBalances,
                        backgroundColor: [
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(255, 205, 86, 0.7)',
                            'rgba(75, 192, 192, 0.7)',
                            'rgba(153, 102, 255, 0.7)',
                            'rgba(255, 159, 64, 0.7)',
                            'rgba(199, 199, 199, 0.7)',
                            'rgba(83, 102, 255, 0.7)'
                        ],
                        borderColor: [
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 99, 132, 1)',
                            'rgba(255, 205, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)',
                            'rgba(199, 199, 199, 1)',
                            'rgba(83, 102, 255, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '₹' + value.toLocaleString();
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
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