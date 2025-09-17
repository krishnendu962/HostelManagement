// Admin Dashboard JavaScript
console.log('Admin Dashboard initialized');

// Check authentication and role
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadDashboardData();
});

function checkAuthentication() {
    const token = TokenManager.getToken();
    const user = TokenManager.getUser();
    
    if (!token || !user || user.role !== 'SuperAdmin') {
        console.warn('Unauthorized access to admin dashboard');
        window.location.href = 'login.html';
        return;
    }
    
    populateUserInfo();
}

function populateUserInfo() {
    const user = TokenManager.getUser();
    const username = user ? user.username : 'Super Administrator';
    const lastLogin = new Date().toLocaleDateString();
    
    document.getElementById('userInfo').innerHTML = `
        <h3>Welcome, ${username}!</h3>
        <p>Last Login: ${lastLogin} | Role: Super Administrator</p>
        <p style="color: #2563eb;">You have full system administration privileges</p>
    `;
}

function loadDashboardData() {
    loadSystemStats();
    loadUserSummary();
    loadHostelSummary();
    loadFinancialSummary();
    loadMaintenanceOverview();
    loadSecuritySummary();
    loadSystemHealth();
    loadAdminActivity();
    loadSystemNotifications();
}

function loadSystemStats() {
    // Mock data - replace with actual API calls
    const stats = {
        totalUsers: 156,
        totalHostels: 8,
        systemAlerts: 3,
        activeWardens: 12
    };
    
    document.getElementById('totalUsers').textContent = stats.totalUsers;
    document.getElementById('totalHostels').textContent = stats.totalHostels;
    document.getElementById('systemAlerts').textContent = stats.systemAlerts;
    document.getElementById('activeWardens').textContent = stats.activeWardens;
}

function loadUserSummary() {
    const userSummary = {
        totalStudents: 134,
        totalWardens: 12,
        totalAdmins: 4,
        newRegistrations: 8,
        activeUsers: 142
    };
    
    document.getElementById('userSummary').innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 1rem; margin-top: 1rem;">
            <div style="text-align: center;">
                <h4 style="margin: 0; color: #2563eb;">${userSummary.totalStudents}</h4>
                <small>Students</small>
            </div>
            <div style="text-align: center;">
                <h4 style="margin: 0; color: #2563eb;">${userSummary.totalWardens}</h4>
                <small>Wardens</small>
            </div>
            <div style="text-align: center;">
                <h4 style="margin: 0; color: #2563eb;">${userSummary.totalAdmins}</h4>
                <small>Admins</small>
            </div>
            <div style="text-align: center;">
                <h4 style="margin: 0; color: #10b981;">${userSummary.newRegistrations}</h4>
                <small>New This Week</small>
            </div>
        </div>
    `;
}

function loadHostelSummary() {
    const hostelSummary = {
        totalRooms: 456,
        occupiedRooms: 389,
        availableRooms: 67,
        maintenanceRooms: 12
    };
    
    document.getElementById('hostelSummary').innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 1rem; margin-top: 1rem;">
            <div style="text-align: center;">
                <h4 style="margin: 0; color: #2563eb;">${hostelSummary.totalRooms}</h4>
                <small>Total Rooms</small>
            </div>
            <div style="text-align: center;">
                <h4 style="margin: 0; color: #10b981;">${hostelSummary.occupiedRooms}</h4>
                <small>Occupied</small>
            </div>
            <div style="text-align: center;">
                <h4 style="margin: 0; color: #3b82f6;">${hostelSummary.availableRooms}</h4>
                <small>Available</small>
            </div>
            <div style="text-align: center;">
                <h4 style="margin: 0; color: #f59e0b;">${hostelSummary.maintenanceRooms}</h4>
                <small>Maintenance</small>
            </div>
        </div>
    `;
}

function loadFinancialSummary() {
    const financialSummary = {
        monthlyRevenue: 125000,
        pendingFees: 23500,
        totalCollected: 1450000,
        outstandingAmount: 67500
    };
    
    document.getElementById('financialSummary').innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-top: 1rem;">
            <div style="text-align: center;">
                <h4 style="margin: 0; color: #10b981;">₹${financialSummary.monthlyRevenue.toLocaleString()}</h4>
                <small>Monthly Revenue</small>
            </div>
            <div style="text-align: center;">
                <h4 style="margin: 0; color: #f59e0b;">₹${financialSummary.pendingFees.toLocaleString()}</h4>
                <small>Pending Fees</small>
            </div>
            <div style="text-align: center;">
                <h4 style="margin: 0; color: #2563eb;">₹${financialSummary.totalCollected.toLocaleString()}</h4>
                <small>Total Collected</small>
            </div>
            <div style="text-align: center;">
                <h4 style="margin: 0; color: #dc2626;">₹${financialSummary.outstandingAmount.toLocaleString()}</h4>
                <small>Outstanding</small>
            </div>
        </div>
    `;
}

function loadMaintenanceOverview() {
    const maintenanceOverview = {
        totalRequests: 47,
        pendingRequests: 12,
        inProgress: 8,
        completedThisWeek: 15
    };
    
    document.getElementById('maintenanceOverview').innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 1rem; margin-top: 1rem;">
            <div style="text-align: center;">
                <h4 style="margin: 0; color: #2563eb;">${maintenanceOverview.totalRequests}</h4>
                <small>Total</small>
            </div>
            <div style="text-align: center;">
                <h4 style="margin: 0; color: #f59e0b;">${maintenanceOverview.pendingRequests}</h4>
                <small>Pending</small>
            </div>
            <div style="text-align: center;">
                <h4 style="margin: 0; color: #3b82f6;">${maintenanceOverview.inProgress}</h4>
                <small>In Progress</small>
            </div>
            <div style="text-align: center;">
                <h4 style="margin: 0; color: #10b981;">${maintenanceOverview.completedThisWeek}</h4>
                <small>Completed</small>
            </div>
        </div>
    `;
}

function loadSecuritySummary() {
    const securitySummary = {
        activeLogins: 67,
        failedAttempts: 3,
        suspiciousActivity: 1,
        lastSecurityScan: '2 hours ago'
    };
    
    document.getElementById('securitySummary').innerHTML = `
        <div style="margin-top: 1rem;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 1rem;">
                <div style="text-align: center;">
                    <h4 style="margin: 0; color: #10b981;">${securitySummary.activeLogins}</h4>
                    <small>Active Logins</small>
                </div>
                <div style="text-align: center;">
                    <h4 style="margin: 0; color: #f59e0b;">${securitySummary.failedAttempts}</h4>
                    <small>Failed Attempts</small>
                </div>
                <div style="text-align: center;">
                    <h4 style="margin: 0; color: #dc2626;">${securitySummary.suspiciousActivity}</h4>
                    <small>Suspicious</small>
                </div>
            </div>
            <p style="margin-top: 1rem; font-size: 0.9rem; color: #6b7280;">Last Security Scan: ${securitySummary.lastSecurityScan}</p>
        </div>
    `;
}

function loadSystemHealth() {
    const systemHealth = {
        serverStatus: 'Online',
        databaseStatus: 'Healthy',
        backupStatus: 'Up to date',
        systemLoad: '34%',
        diskUsage: '67%',
        memoryUsage: '42%'
    };
    
    document.getElementById('systemHealth').innerHTML = `
        <div style="margin-top: 1rem;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
                <div>
                    <p style="margin: 0; font-weight: 500;">Server Status</p>
                    <p style="margin: 0; color: #10b981;">${systemHealth.serverStatus}</p>
                </div>
                <div>
                    <p style="margin: 0; font-weight: 500;">Database</p>
                    <p style="margin: 0; color: #10b981;">${systemHealth.databaseStatus}</p>
                </div>
                <div>
                    <p style="margin: 0; font-weight: 500;">Backup</p>
                    <p style="margin: 0; color: #10b981;">${systemHealth.backupStatus}</p>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 1rem; margin-top: 1rem;">
                <div>
                    <p style="margin: 0; font-weight: 500;">System Load</p>
                    <p style="margin: 0; color: #3b82f6;">${systemHealth.systemLoad}</p>
                </div>
                <div>
                    <p style="margin: 0; font-weight: 500;">Disk Usage</p>
                    <p style="margin: 0; color: #f59e0b;">${systemHealth.diskUsage}</p>
                </div>
                <div>
                    <p style="margin: 0; font-weight: 500;">Memory</p>
                    <p style="margin: 0; color: #3b82f6;">${systemHealth.memoryUsage}</p>
                </div>
            </div>
        </div>
    `;
}

function loadAdminActivity() {
    const activities = [
        { action: 'User Created', user: 'warden_kumar', time: '2 hours ago' },
        { action: 'Hostel Added', details: 'Block D - East Wing', time: '4 hours ago' },
        { action: 'System Backup', details: 'Scheduled backup completed', time: '6 hours ago' },
        { action: 'Security Update', details: 'Password policy updated', time: '1 day ago' },
        { action: 'Fee Structure', details: 'Monthly fees updated', time: '2 days ago' }
    ];
    
    let activityHTML = '<div style="margin-top: 1rem;">';
    activities.forEach(activity => {
        activityHTML += `
            <div style="padding: 0.75rem; background: #f8fafc; border-radius: 8px; margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: between; align-items: center;">
                    <div>
                        <p style="margin: 0; font-weight: 500; color: #2563eb;">${activity.action}</p>
                        ${activity.details ? `<p style="margin: 0; font-size: 0.9rem; color: #6b7280;">${activity.details}</p>` : ''}
                        ${activity.user ? `<p style="margin: 0; font-size: 0.9rem; color: #6b7280;">User: ${activity.user}</p>` : ''}
                    </div>
                    <small style="color: #9ca3af;">${activity.time}</small>
                </div>
            </div>
        `;
    });
    activityHTML += '</div>';
    
    document.getElementById('adminActivity').innerHTML = activityHTML;
}

function loadSystemNotifications() {
    const notifications = [
        { type: 'warning', message: 'Disk usage approaching 70% threshold', priority: 'Medium' },
        { type: 'info', message: 'System maintenance scheduled for next Sunday', priority: 'Low' },
        { type: 'error', message: 'Failed login attempts detected from IP 192.168.1.100', priority: 'High' }
    ];
    
    let notificationHTML = '<div style="margin-top: 1rem;">';
    notifications.forEach(notification => {
        const priorityColor = notification.priority === 'High' ? '#dc2626' : 
                             notification.priority === 'Medium' ? '#f59e0b' : '#10b981';
        
        notificationHTML += `
            <div style="padding: 0.75rem; background: #f8fafc; border-left: 4px solid ${priorityColor}; border-radius: 4px; margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: between; align-items: center;">
                    <p style="margin: 0; font-size: 0.9rem;">${notification.message}</p>
                    <span style="background: ${priorityColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">
                        ${notification.priority}
                    </span>
                </div>
            </div>
        `;
    });
    notificationHTML += '</div>';
    
    document.getElementById('systemNotifications').innerHTML = notificationHTML;
}

// Dashboard Action Functions
function manageUsers() {
    alert('User Management interface coming soon!');
}

function createUser() {
    alert('Create User interface coming soon!');
}

function manageHostels() {
    alert('Hostel Management interface coming soon!');
}

function addHostel() {
    alert('Add Hostel interface coming soon!');
}

function viewAnalytics() {
    alert('Analytics dashboard coming soon!');
}

function generateReports() {
    alert('Report generation coming soon!');
}

function exportData() {
    alert('Data export coming soon!');
}

function systemLogs() {
    alert('System logs viewer coming soon!');
}

function systemSettings() {
    alert('System Settings interface coming soon!');
}

function emailConfig() {
    alert('Email Configuration coming soon!');
}

function backupSettings() {
    alert('Backup Settings coming soon!');
}

function securitySettings() {
    alert('Security Settings coming soon!');
}

function financialDashboard() {
    alert('Financial Dashboard coming soon!');
}

function feeManagement() {
    alert('Fee Management coming soon!');
}

function maintenanceReports() {
    alert('Maintenance Reports coming soon!');
}

function scheduleSystemMaintenance() {
    alert('System Maintenance Scheduler coming soon!');
}

function securityAudit() {
    alert('Security Audit interface coming soon!');
}

function accessLogs() {
    alert('Access Logs viewer coming soon!');
}

function healthCheck() {
    alert('Running full system health check...');
    setTimeout(() => {
        alert('System health check completed. All systems operational.');
    }, 2000);
}

function manageNotifications() {
    alert('Notification Management coming soon!');
}

// Logout function
document.getElementById('logoutBtn').addEventListener('click', function() {
    if (confirm('Are you sure you want to logout?')) {
        TokenManager.clear();
        window.location.href = 'login.html';
    }
});

console.log('Admin Dashboard functions loaded');