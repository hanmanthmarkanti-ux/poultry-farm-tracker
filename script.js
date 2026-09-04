// Check authentication
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
    window.location.href = 'login.html';
}

// Get user-specific storage key
function getUserDataKey() {
    return `farmData_${currentUser.id}`;
}

// Data Store
let farmData = {
    hens: [],
    chicks: [],
    production: [],
    inventory: [],
    health: [],
    mortality: [],
    expenses: [],
    vaccines: [],
    settings: {
        eggPrice: 6,
        henPrice: 350
    }
};

// Load data from localStorage (user-specific)
function loadData() {
    const saved = localStorage.getItem(getUserDataKey());
    if (saved) {
        const parsed = JSON.parse(saved);
        farmData = { ...farmData, ...parsed };
    }
}

// Clear all data
function clearAllData() {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
        localStorage.removeItem(getUserDataKey());
        farmData = {
            hens: [],
            chicks: [],
            production: [],
            inventory: [],
            health: [],
            mortality: [],
            expenses: [],
            vaccines: [],
            settings: { eggPrice: 6, henPrice: 350 }
        };
        updateAllSections();
        alert('All data cleared!');
    }
}

// Save data to localStorage (user-specific)
function saveData() {
    localStorage.setItem(getUserDataKey(), JSON.stringify(farmData));
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById(section).classList.add('active');
        
        document.getElementById('pageTitle').textContent = item.querySelector('span').textContent;
        
        updateAllSections();
    });
});

// Mobile menu toggle
document.getElementById('menuToggle').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('active');
});

// Set current date and user info
function setCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-IN', options);
    document.getElementById('userInfo').textContent = `👤 ${currentUser.name}`;
}

// Update All Sections
function updateAllSections() {
    updateDashboard();
    updateHensSection();
    updateChicksSection();
    updateProductionStats();
    updateProductionTable();
    updateInventoryStats();
    updateInventoryTable();
    updateHealthStats();
    updateHealthTable();
    updateMortalityTable();
    updateVaccineList();
    updateFinanceStats();
    updateExpenseList();
    updateWeeklyChart();
    updateHenHealthChart();
    updateChickGrowthChart();
}

// Update Dashboard
function updateDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const todayData = farmData.production.find(p => p.date === today);
    
    const totalHens = farmData.hens.reduce((sum, h) => sum + h.count, 0);
    const totalChicks = farmData.chicks.reduce((sum, c) => sum + c.currentCount, 0);
    const healthIssues = farmData.health.filter(h => h.status === 'active').length;
    
    document.getElementById('totalEggs').textContent = todayData ? todayData.collected : 0;
    document.getElementById('totalHens').textContent = totalHens;
    document.getElementById('totalChicks').textContent = totalChicks;
    document.getElementById('healthIssues').textContent = healthIssues;
    
    if (todayData) {
        document.getElementById('todayCollected').textContent = todayData.collected;
        document.getElementById('todayBroken').textContent = todayData.broken;
        document.getElementById('todaySold').textContent = todayData.sold;
        document.getElementById('todayRevenue').textContent = '₹' + (todayData.sold * farmData.settings.eggPrice);
    }
    
    updateActivityList();
}

// Update Activity List
function updateActivityList() {
    const list = document.getElementById('activityList');
    const recent = [...farmData.production].reverse().slice(0, 5);
    
    if (recent.length === 0) {
        list.innerHTML = '<p class="no-data">No recent activity. Add your first record!</p>';
        return;
    }
    
    list.innerHTML = recent.map(p => `
        <div class="activity-item">
            <div class="activity-icon" style="background: #e8f5e9;">
                <i class="fas fa-egg" style="color: #388e3c;"></i>
            </div>
            <div class="activity-info">
                <h4>${p.collected} eggs collected</h4>
                <p>${p.sold} sold, ${p.broken} broken</p>
            </div>
            <span class="activity-time">${formatDate(p.date)}</span>
        </div>
    `).join('');
}

// Update Hens Section
function updateHensSection() {
    const totalHens = farmData.hens.reduce((sum, h) => sum + h.count, 0);
    const healthyHens = farmData.hens.filter(h => h.health === 'healthy').reduce((sum, h) => sum + h.count, 0);
    const layingHens = farmData.hens.filter(h => h.status === 'laying').reduce((sum, h) => sum + h.count, 0);
    const moltingHens = farmData.hens.filter(h => h.status === 'molting').reduce((sum, h) => sum + h.count, 0);
    const deadHens = farmData.hens.reduce((sum, h) => sum + (h.dead || 0), 0);
    
    document.getElementById('healthyHens').textContent = healthyHens;
    document.getElementById('layingHens').textContent = layingHens;
    document.getElementById('moltingHens').textContent = moltingHens;
    document.getElementById('deadHens').textContent = deadHens;
    
    updateHenTable();
    updateHenDetails();
}

// Update Hen Table
function updateHenTable() {
    const tbody = document.getElementById('henTable');
    
    tbody.innerHTML = farmData.hens.map(hen => {
        const healthClass = hen.health === 'healthy' ? 'badge-success' : 'badge-warning';
        const genderIcon = hen.gender === 'female' ? '♀ Female' : hen.gender === 'male' ? '♂ Male' : 'Mixed';
        const dead = hen.dead || 0;
        
        return `
            <tr>
                <td>${hen.breed}</td>
                <td>${hen.count}</td>
                <td><span class="badge ${hen.gender === 'female' ? 'badge-success' : hen.gender === 'male' ? 'badge-info' : 'badge-warning'}">${genderIcon}</span></td>
                <td>${hen.ageMonths}</td>
                <td><span class="badge ${healthClass}">${hen.health}</span></td>
                <td><span class="badge ${dead > 0 ? 'badge-danger' : 'badge-success'}">${dead}</span></td>
                <td><button class="btn-delete" onclick="deleteHen(${hen.id})">Remove</button></td>
            </tr>
        `;
    }).join('');
}

// Update Hen Details
function updateHenDetails() {
    const grid = document.getElementById('henDetailsGrid');
    
    grid.innerHTML = farmData.hens.map(hen => {
        const statusDot = hen.health === 'healthy' ? 'status-healthy' : 'status-sick';
        const emoji = hen.gender === 'female' ? '🐔' : '🐓';
        const genderLabel = hen.gender === 'female' ? '♀ Female' : hen.gender === 'male' ? '♂ Male' : 'Mixed';
        
        return `
            <div class="hen-detail-card">
                <div class="hen-icon">${emoji}</div>
                <h4>${hen.breed}</h4>
                <p>${hen.count} hens (${genderLabel})</p>
                <p><span class="status-dot ${statusDot}"></span>${hen.ageMonths} months old</p>
            </div>
        `;
    }).join('');
}

// Delete Hen
function deleteHen(id) {
    if (confirm('Remove this hen batch?')) {
        farmData.hens = farmData.hens.filter(h => h.id !== id);
        saveData();
        updateAllSections();
    }
}

// Update Chicks Section
function updateChicksSection() {
    const totalChicks = farmData.chicks.reduce((sum, c) => sum + c.currentCount, 0);
    const healthyChicks = farmData.chicks.filter(c => c.health === 'healthy').reduce((sum, c) => sum + c.currentCount, 0);
    const sickChicks = farmData.chicks.filter(c => c.health === 'sick').reduce((sum, c) => sum + c.currentCount, 0);
    const deadChicks = farmData.chicks.reduce((sum, c) => sum + (c.mortality || 0), 0);
    
    document.getElementById('totalChicksCount').textContent = totalChicks;
    document.getElementById('healthyChicks').textContent = healthyChicks;
    document.getElementById('sickChicks').textContent = sickChicks;
    document.getElementById('deadChicks').textContent = deadChicks;
    
    updateChickTable();
    updateChickDetails();
}

// Update Chick Table
function updateChickTable() {
    const tbody = document.getElementById('chickTable');
    
    tbody.innerHTML = farmData.chicks.map(chick => {
        const healthClass = chick.health === 'healthy' ? 'badge-success' : 'badge-warning';
        const survivalRate = Math.round((chick.currentCount / chick.initialCount) * 100);
        const dead = chick.mortality || 0;
        
        return `
            <tr>
                <td>${chick.batchName}</td>
                <td>${formatDate(chick.receivedDate)}</td>
                <td>${chick.initialCount}</td>
                <td>${chick.currentCount}</td>
                <td><span class="badge ${dead > 0 ? 'badge-danger' : 'badge-success'}">${dead}</span></td>
                <td>${chick.ageWeeks}</td>
                <td><span class="badge ${healthClass}">${chick.health} (${survivalRate}%)</span></td>
                <td><button class="btn-delete" onclick="deleteChick(${chick.id})">Remove</button></td>
            </tr>
        `;
    }).join('');
}

// Update Chick Details
function updateChickDetails() {
    const grid = document.getElementById('chickDetailsGrid');
    
    grid.innerHTML = farmData.chicks.map(chick => {
        const emoji = chick.ageWeeks < 4 ? '🐥' : chick.ageWeeks < 8 ? '🐤' : '🐔';
        const statusDot = chick.health === 'healthy' ? 'status-healthy' : 'status-sick';
        const survivalRate = Math.round((chick.currentCount / chick.initialCount) * 100);
        
        return `
            <div class="chick-detail-card">
                <div class="chick-icon">${emoji}</div>
                <h4>${chick.batchName}</h4>
                <p>${chick.currentCount} chicks</p>
                <p><span class="status-dot ${statusDot}"></span>${chick.ageWeeks} weeks old</p>
                <p>Survival: ${survivalRate}%</p>
            </div>
        `;
    }).join('');
}

// Delete Chick
function deleteChick(id) {
    if (confirm('Remove this chick batch?')) {
        farmData.chicks = farmData.chicks.filter(c => c.id !== id);
        saveData();
        updateAllSections();
    }
}

// Update Production Stats
function updateProductionStats() {
    const totalHens = farmData.hens.filter(h => h.status === 'laying').reduce((sum, h) => sum + h.count, 0);
    const thisWeek = getLast7Days();
    const weeklyEggs = farmData.production
        .filter(p => thisWeek.includes(p.date))
        .reduce((sum, p) => sum + p.collected, 0);
    
    const thisMonth = getThisMonth();
    const monthlyEggs = farmData.production
        .filter(p => thisMonth.includes(p.date))
        .reduce((sum, p) => sum + p.collected, 0);
    
    const dailyAvg = farmData.production.length > 0 
        ? Math.round(farmData.production.reduce((sum, p) => sum + p.collected, 0) / farmData.production.length)
        : 0;
    
    const layingRate = totalHens > 0 ? Math.round((dailyAvg / totalHens) * 100) : 0;
    
    document.getElementById('dailyAvg').textContent = dailyAvg;
    document.getElementById('weeklyTotal').textContent = weeklyEggs;
    document.getElementById('monthlyTotal').textContent = monthlyEggs;
    document.getElementById('layingRate').textContent = layingRate + '%';
}

// Update Production Table
function updateProductionTable() {
    const tbody = document.getElementById('productionTable');
    const recent = [...farmData.production].reverse().slice(0, 10);
    
    tbody.innerHTML = recent.map(p => `
        <tr>
            <td>${formatDate(p.date)}</td>
            <td>${p.collected}</td>
            <td>${p.broken}</td>
            <td>${p.sold}</td>
            <td>₹${p.sold * farmData.settings.eggPrice}</td>
            <td><button class="btn-delete" onclick="deleteProduction('${p.date}')">Delete</button></td>
        </tr>
    `).join('');
}

function deleteProduction(date) {
    if (confirm('Delete this record?')) {
        farmData.production = farmData.production.filter(p => p.date !== date);
        saveData();
        updateAllSections();
    }
}

// Update Inventory
function updateInventoryStats() {
    const feed = farmData.inventory.find(i => i.name === 'Poultry Feed');
    const trays = farmData.inventory.find(i => i.name === 'Egg Trays');
    const lowStock = farmData.inventory.filter(i => i.stock < i.minRequired).length;
    
    document.getElementById('feedKg').textContent = feed ? feed.stock + ' kg' : '0 kg';
    document.getElementById('eggTrays').textContent = trays ? trays.stock : 0;
    document.getElementById('lowStock').textContent = lowStock;
}

function updateInventoryTable() {
    const tbody = document.getElementById('inventoryTable');
    
    tbody.innerHTML = farmData.inventory.map(item => {
        const status = item.stock >= item.minRequired ? 'In Stock' : 'Low Stock';
        const badgeClass = item.stock >= item.minRequired ? 'badge-success' : 'badge-danger';
        
        return `
            <tr>
                <td>${item.name}</td>
                <td>${item.stock}</td>
                <td>${item.minRequired}</td>
                <td>${item.unit}</td>
                <td><span class="badge ${badgeClass}">${status}</span></td>
                <td>${formatDate(item.lastUpdated)}</td>
            </tr>
        `;
    }).join('');
}

// Update Health
function updateHealthStats() {
    const totalHens = farmData.hens.reduce((sum, h) => sum + h.count, 0);
    const totalChicks = farmData.chicks.reduce((sum, c) => sum + c.currentCount, 0);
    const sickHens = farmData.hens.filter(h => h.health === 'sick').reduce((sum, h) => sum + h.count, 0);
    const sickChicks = farmData.chicks.filter(c => c.health === 'sick').reduce((sum, c) => sum + c.currentCount, 0);
    const mortalityMonth = farmData.mortality.filter(m => {
        const mDate = new Date(m.date);
        const now = new Date();
        return mDate.getMonth() === now.getMonth() && mDate.getFullYear() === now.getFullYear();
    }).reduce((sum, m) => sum + m.count, 0);
    
    document.getElementById('healthyAll').textContent = (totalHens + totalChicks) - (sickHens + sickChicks);
    document.getElementById('sickAll').textContent = sickHens + sickChicks;
    document.getElementById('mortalityMonth').textContent = mortalityMonth;
    
    const upcoming = farmData.vaccines.find(v => new Date(v.date) > new Date());
    document.getElementById('nextVaccine').textContent = upcoming ? formatDateShort(upcoming.date) : '--';
}

function updateHealthTable() {
    const tbody = document.getElementById('healthTable');
    
    if (farmData.health.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No health issues recorded</td></tr>';
        return;
    }
    
    tbody.innerHTML = farmData.health.slice(0, 10).map(h => {
        const statusClass = h.status === 'active' ? 'badge-warning' : 'badge-success';
        return `
            <tr>
                <td>${formatDate(h.date)}</td>
                <td>${h.type}</td>
                <td>${h.issue}</td>
                <td>${h.affected}</td>
                <td>${h.treatment}</td>
                <td><span class="badge ${statusClass}">${h.status}</span></td>
            </tr>
        `;
    }).join('');
}

function updateMortalityTable() {
    const tbody = document.getElementById('mortalityTable');
    
    if (farmData.mortality.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No mortality recorded</td></tr>';
        return;
    }
    
    tbody.innerHTML = farmData.mortality.slice(0, 10).map(m => `
        <tr>
            <td>${formatDate(m.date)}</td>
            <td>${m.type}</td>
            <td>${m.count}</td>
            <td>${m.cause}</td>
            <td>${m.action}</td>
        </tr>
    `).join('');
}

function updateVaccineList() {
    const list = document.getElementById('vaccineList');
    
    list.innerHTML = farmData.vaccines.map(v => {
        const date = new Date(v.date);
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });
        const typeLabel = v.type === 'hen' ? '🐔 Hens' : '🐥 Chicks';
        
        return `
            <div class="vaccine-item">
                <div class="vaccine-date">
                    <span class="day">${day}</span>
                    <span class="month">${month}</span>
                </div>
                <div class="vaccine-info">
                    <h4>${v.name}</h4>
                    <p>${typeLabel} - ${formatDate(v.date)}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Update Finance
function updateFinanceStats() {
    const thisMonth = getThisMonth();
    const monthlyEggs = farmData.production
        .filter(p => thisMonth.includes(p.date))
        .reduce((sum, p) => sum + p.sold, 0);
    
    const revenue = monthlyEggs * farmData.settings.eggPrice;
    const expenses = farmData.expenses.reduce((sum, e) => sum + e.amount, 0);
    const profit = revenue - expenses;
    
    document.getElementById('totalRevenue').textContent = '₹' + revenue.toLocaleString();
    document.getElementById('totalExpenses').textContent = '₹' + expenses.toLocaleString();
    document.getElementById('profit').textContent = '₹' + profit.toLocaleString();
    document.getElementById('eggPrice').textContent = '₹' + farmData.settings.eggPrice;
    
    document.getElementById('profit').style.color = profit >= 0 ? '#388e3c' : '#d32f2f';
}

function updateExpenseList() {
    const list = document.getElementById('expenseList');
    const total = farmData.expenses.reduce((sum, e) => sum + e.amount, 0);
    
    list.innerHTML = farmData.expenses.map(e => {
        const percent = Math.round((e.amount / total) * 100);
        return `
            <div class="expense-item">
                <div class="expense-icon" style="background: ${e.color}20;">
                    <i class="fas fa-receipt" style="color: ${e.color};"></i>
                </div>
                <div class="expense-info">
                    <h4>${e.name}</h4>
                    <div class="expense-bar">
                        <div class="expense-bar-fill" style="width: ${percent}%; background: ${e.color};"></div>
                    </div>
                </div>
                <span class="expense-amount">₹${e.amount.toLocaleString()}</span>
            </div>
        `;
    }).join('');
}

// Charts
function updateWeeklyChart() {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;
    
    const last7 = getLast7Days();
    const data = last7.map(date => {
        const record = farmData.production.find(p => p.date === date);
        return record ? record.collected : 0;
    });
    
    const labels = last7.map(d => {
        const date = new Date(d);
        return date.toLocaleDateString('en-IN', { weekday: 'short' });
    });
    
    if (window.weeklyChartInstance) {
        window.weeklyChartInstance.destroy();
    }
    
    window.weeklyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Eggs Collected',
                data: data,
                borderColor: '#2c5f2d',
                backgroundColor: 'rgba(44, 95, 45, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: false } }
        }
    });
}

function updateHenHealthChart() {
    const ctx = document.getElementById('henHealthChart');
    if (!ctx) return;
    
    const healthy = farmData.hens.filter(h => h.health === 'healthy').reduce((sum, h) => sum + h.count, 0);
    const sick = farmData.hens.filter(h => h.health === 'sick').reduce((sum, h) => sum + h.count, 0);
    const molting = farmData.hens.filter(h => h.status === 'molting').reduce((sum, h) => sum + h.count, 0);
    
    if (window.henHealthChartInstance) {
        window.henHealthChartInstance.destroy();
    }
    
    window.henHealthChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Healthy', 'Sick', 'Molting'],
            datasets: [{
                data: [healthy, sick, molting],
                backgroundColor: ['#4caf50', '#f44336', '#2196f3']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function updateChickGrowthChart() {
    const ctx = document.getElementById('chickGrowthChart');
    if (!ctx) return;
    
    const labels = farmData.chicks.map(c => c.batchName);
    const initial = farmData.chicks.map(c => c.initialCount);
    const current = farmData.chicks.map(c => c.currentCount);
    
    if (window.chickGrowthChartInstance) {
        window.chickGrowthChartInstance.destroy();
    }
    
    window.chickGrowthChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Initial', data: initial, backgroundColor: '#90caf9' },
                { label: 'Current', data: current, backgroundColor: '#4caf50' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// Helpers
function getLast7Days() {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
}

function getThisMonth() {
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const days = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
        days.push(date.toISOString().split('T')[0]);
        date.setDate(date.getDate() + 1);
    }
    return days;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateShort(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// Modal
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');

document.getElementById('addRecord').addEventListener('click', () => showAddModal());
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('clearAll').addEventListener('click', clearAllData);
document.getElementById('reportHenDeath').addEventListener('click', () => showDeathModal('hen'));
document.getElementById('reportChickDeath').addEventListener('click', () => showDeathModal('chick'));
document.getElementById('logoutBtn').addEventListener('click', logout);

function closeModal() {
    modal.classList.remove('active');
}

function showDeathModal(type) {
    const isHen = type === 'hen';
    modalTitle.textContent = isHen ? 'Report Hen Death' : 'Report Chick Death';
    
    const options = isHen 
        ? farmData.hens.map(h => `<option value="${h.id}">${h.breed} (${h.count} alive)</option>`).join('')
        : farmData.chicks.map(c => `<option value="${c.id}">${c.batchName} (${c.currentCount} alive)</option>`).join('');
    
    const formHTML = `
        <form id="deathForm">
            <div class="form-group">
                <label>Select ${isHen ? 'Hen Batch' : 'Chick Batch'}</label>
                <select id="deathBatchId" required>
                    ${options || '<option value="">No batches available</option>'}
                </select>
            </div>
            <div class="form-group">
                <label>Number of Deaths</label>
                <input type="number" id="deathCount" placeholder="e.g., 5" min="1" required>
            </div>
            <div class="form-group">
                <label>Date</label>
                <input type="date" id="deathDate" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
            <div class="form-group">
                <label>Cause of Death</label>
                <select id="deathCause">
                    <option value="Disease">Disease</option>
                    <option value="Predator">Predator Attack</option>
                    <option value="Accident">Accident</option>
                    <option value="Starvation">Starvation</option>
                    <option value="Cold/Heat">Cold/Heat Stress</option>
                    <option value="Unknown">Unknown</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div class="form-group">
                <label>Notes (optional)</label>
                <textarea id="deathNotes" rows="2" placeholder="Any additional details..."></textarea>
            </div>
            <button type="submit" class="btn-submit">Record Deaths</button>
        </form>
    `;
    
    modalBody.innerHTML = formHTML;
    modal.classList.add('active');
    
    setTimeout(() => {
        const form = modalBody.querySelector('form');
        if (form) form.addEventListener('submit', (e) => handleDeathSubmit(e, type));
    }, 100);
}

function handleDeathSubmit(e, type) {
    e.preventDefault();
    
    const batchId = parseInt(document.getElementById('deathBatchId').value);
    const deathCount = parseInt(document.getElementById('deathCount').value);
    const deathDate = document.getElementById('deathDate').value;
    const cause = document.getElementById('deathCause').value;
    const notes = document.getElementById('deathNotes').value;
    
    if (type === 'hen') {
        const hen = farmData.hens.find(h => h.id === batchId);
        if (hen) {
            hen.dead = (hen.dead || 0) + deathCount;
            hen.count = Math.max(0, hen.count - deathCount);
        }
    } else {
        const chick = farmData.chicks.find(c => c.id === batchId);
        if (chick) {
            chick.mortality = (chick.mortality || 0) + deathCount;
            chick.currentCount = Math.max(0, chick.currentCount - deathCount);
        }
    }
    
    // Add to mortality log
    farmData.mortality.unshift({
        date: deathDate,
        type: type === 'hen' ? 'Hen' : 'Chick',
        count: deathCount,
        cause: cause,
        action: notes || 'Recorded'
    });
    
    saveData();
    closeModal();
    updateAllSections();
    alert(`Recorded ${deathCount} ${type} death(s)`);
}

function showAddModal() {
    const activeSection = document.querySelector('.content-section.active').id;
    let formHTML = '';
    
    switch(activeSection) {
        case 'dashboard':
        case 'production':
            modalTitle.textContent = 'Add Production Record';
            formHTML = `
                <form id="productionForm">
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" id="prodDate" value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Eggs Collected</label>
                            <input type="number" id="prodCollected" placeholder="e.g., 400" required>
                        </div>
                        <div class="form-group">
                            <label>Broken</label>
                            <input type="number" id="prodBroken" placeholder="e.g., 5" value="0">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Eggs Sold</label>
                        <input type="number" id="prodSold" placeholder="e.g., 350">
                    </div>
                    <button type="submit" class="btn-submit">Save Record</button>
                </form>
            `;
            break;
            
        case 'hens':
            modalTitle.textContent = 'Add Hen Batch';
            formHTML = `
                <form id="henForm">
                    <div class="form-group">
                        <label>Breed</label>
                        <input type="text" id="henBreed" placeholder="e.g., Rhode Island Red" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Count</label>
                            <input type="number" id="henCount" placeholder="e.g., 100" required>
                        </div>
                        <div class="form-group">
                            <label>Gender</label>
                            <select id="henGender">
                                <option value="female">Female (Hens)</option>
                                <option value="male">Male (Roosters)</option>
                                <option value="mixed">Mixed</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Age (months)</label>
                            <input type="number" id="henAge" placeholder="e.g., 12" required>
                        </div>
                        <div class="form-group">
                            <label>Health</label>
                            <select id="henHealth">
                                <option value="healthy">Healthy</option>
                                <option value="sick">Sick</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="henStatus">
                            <option value="laying">Laying</option>
                            <option value="molting">Molting</option>
                            <option value="growing">Growing</option>
                            <option value="old">Old</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-submit">Save Hen Batch</button>
                </form>
            `;
            break;
            
        case 'chicks':
            modalTitle.textContent = 'Add Chick Batch';
            formHTML = `
                <form id="chickForm">
                    <div class="form-group">
                        <label>Batch Name</label>
                        <input type="text" id="chickBatch" placeholder="e.g., Batch D - Sep" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Received Date</label>
                            <input type="date" id="chickDate" value="${new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label>Initial Count</label>
                            <input type="number" id="chickCount" placeholder="e.g., 200" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Health</label>
                        <select id="chickHealth">
                            <option value="healthy">Healthy</option>
                            <option value="sick">Sick</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-submit">Save Chick Batch</button>
                </form>
            `;
            break;
            
        case 'inventory':
            modalTitle.textContent = 'Update Inventory';
            formHTML = `
                <form id="inventoryForm">
                    <div class="form-group">
                        <label>Select Item</label>
                        <select id="invItem" required>
                            ${farmData.inventory.map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>New Stock Quantity</label>
                        <input type="number" id="invStock" placeholder="Enter quantity" required>
                    </div>
                    <button type="submit" class="btn-submit">Update Stock</button>
                </form>
            `;
            break;
            
        case 'health':
            modalTitle.textContent = 'Add Health Record';
            formHTML = `
                <form id="healthForm">
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" id="healthDate" value="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Type</label>
                            <select id="healthType">
                                <option value="Hen">Hen</option>
                                <option value="Chick">Chick</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Issue</label>
                            <input type="text" id="healthIssue" placeholder="e.g., Respiratory infection" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Affected Count</label>
                        <input type="number" id="healthAffected" placeholder="e.g., 10" required>
                    </div>
                    <div class="form-group">
                        <label>Treatment</label>
                        <input type="text" id="healthTreatment" placeholder="e.g., Antibiotics course">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="healthStatus">
                            <option value="active">Active</option>
                            <option value="recovered">Recovered</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-submit">Save Record</button>
                </form>
            `;
            break;
            
        case 'finance':
            modalTitle.textContent = 'Add Expense';
            formHTML = `
                <form id="expenseForm">
                    <div class="form-group">
                        <label>Category</label>
                        <select id="expCategory">
                            <option value="Feed">Feed</option>
                            <option value="Medicine">Medicine</option>
                            <option value="Labor">Labor</option>
                            <option value="Utilities">Utilities</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Amount (₹)</label>
                        <input type="number" id="expAmount" placeholder="e.g., 5000" required>
                    </div>
                    <button type="submit" class="btn-submit">Save Expense</button>
                </form>
            `;
            break;
    }
    
    modalBody.innerHTML = formHTML;
    modal.classList.add('active');
    
    setTimeout(() => {
        const form = modalBody.querySelector('form');
        if (form) form.addEventListener('submit', handleFormSubmit);
    }, 100);
}

function handleFormSubmit(e) {
    e.preventDefault();
    const formId = e.target.id;
    
    switch(formId) {
        case 'productionForm': addProduction(); break;
        case 'henForm': addHen(); break;
        case 'chickForm': addChick(); break;
        case 'inventoryForm': updateInventory(); break;
        case 'healthForm': addHealthRecord(); break;
        case 'expenseForm': updateExpense(); break;
    }
    
    closeModal();
    updateAllSections();
}

function addProduction() {
    const date = document.getElementById('prodDate').value;
    const collected = parseInt(document.getElementById('prodCollected').value) || 0;
    const broken = parseInt(document.getElementById('prodBroken').value) || 0;
    const sold = parseInt(document.getElementById('prodSold').value) || 0;
    
    const existing = farmData.production.findIndex(p => p.date === date);
    if (existing >= 0) {
        farmData.production[existing] = { date, collected, broken, sold };
    } else {
        farmData.production.push({ date, collected, broken, sold });
    }
    saveData();
}

function addHen() {
    const hen = {
        id: Date.now(),
        breed: document.getElementById('henBreed').value,
        count: parseInt(document.getElementById('henCount').value),
        gender: document.getElementById('henGender').value,
        ageMonths: parseInt(document.getElementById('henAge').value),
        health: document.getElementById('henHealth').value,
        status: document.getElementById('henStatus').value,
        vaccinated: false
    };
    farmData.hens.push(hen);
    saveData();
}

function addChick() {
    const chick = {
        id: Date.now(),
        batchName: document.getElementById('chickBatch').value,
        receivedDate: document.getElementById('chickDate').value,
        initialCount: parseInt(document.getElementById('chickCount').value),
        currentCount: parseInt(document.getElementById('chickCount').value),
        ageWeeks: 0,
        health: document.getElementById('chickHealth').value,
        mortality: 0
    };
    farmData.chicks.push(chick);
    saveData();
}

function updateInventory() {
    const itemId = parseInt(document.getElementById('invItem').value);
    const stock = parseInt(document.getElementById('invStock').value);
    const item = farmData.inventory.find(i => i.id === itemId);
    if (item) {
        item.stock = stock;
        item.lastUpdated = new Date().toISOString().split('T')[0];
    }
    saveData();
}

function addHealthRecord() {
    const record = {
        id: Date.now(),
        date: document.getElementById('healthDate').value,
        type: document.getElementById('healthType').value,
        issue: document.getElementById('healthIssue').value,
        affected: parseInt(document.getElementById('healthAffected').value),
        treatment: document.getElementById('healthTreatment').value,
        status: document.getElementById('healthStatus').value
    };
    farmData.health.unshift(record);
    saveData();
}

function updateExpense() {
    const category = document.getElementById('expCategory').value;
    const amount = parseInt(document.getElementById('expAmount').value);
    const existing = farmData.expenses.find(e => e.name === category);
    if (existing) {
        existing.amount += amount;
    } else {
        const colors = { Feed: '#f57c00', Medicine: '#d32f2f', Labor: '#1976d2', Utilities: '#388e3c', Other: '#666' };
        farmData.expenses.push({ name: category, amount, color: colors[category] || '#666' });
    }
    saveData();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setCurrentDate();
    updateAllSections();
});
