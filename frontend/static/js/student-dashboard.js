// Student Dashboard JavaScript

// Initialize the student dashboard
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    StudentDashboard.init();
});

function checkAuthentication() {
    const token = TokenManager.getToken();
    const user = TokenManager.getUser();
    
    if (!token || !user) {
        console.warn('No authentication found');
        window.location.href = 'login.html';
        return false;
    }
    
    // Check if user is a student
    if (user.role !== 'Student') {
        console.warn('Access denied. This page is for students only.');
        window.location.href = getCorrectDashboard(user.role);
        return false;
    }
    
    return true;
}

// Helper function to get correct dashboard URL
function getCorrectDashboard(role) {
    switch (role) {
        case 'Student':
            return 'student-dashboard.html';
        case 'Warden':
            return 'warden-dashboard.html';
        case 'SuperAdmin':
        case 'Admin':
            return 'admin-dashboard.html';
        default:
            return 'dashboard.html';
    }
}

const StudentDashboard = {
    init() {
        this.loadUserInfo();
        this.loadRoomInfo();
        this.loadMaintenanceRequests();
        this.loadNotifications();
        this.loadRecentActivity();
        this.setupEventListeners();
    },

    setupEventListeners() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    TokenManager.clear();
                    window.location.href = 'login.html';
                }
            });
        }
    },

    loadUserInfo() {
        const user = TokenManager.getUser();
        const userInfo = document.getElementById('userInfo');
        
        if (userInfo && user) {
            userInfo.innerHTML = `
                <h3>Welcome back, ${user.username}! 👋</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
                    <div>
                        <p><strong>Username:</strong> ${user.username}</p>
                        <p><strong>Email:</strong> ${user.email || 'Not provided'}</p>
                    </div>
                    <div>
                        <p><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
                        <p><strong>Role:</strong> ${user.role}</p>
                    </div>
                </div>
            `;
        }
    },

    async loadRoomInfo() {
        try {
            // For now, we'll use mock data since we don't have room allocation API yet
            const mockRoomData = {
                roomNumber: 'A-101',
                hostelName: 'Sunrise Hostel',
                roomType: 'Double Sharing',
                occupancy: '2/2',
                floor: '1st Floor'
            };

            // Update quick stats
            document.getElementById('roomNumber').textContent = mockRoomData.roomNumber;
            document.getElementById('hostelName').textContent = mockRoomData.hostelName;

            // Update detailed room info
            document.getElementById('detailRoomNumber').textContent = mockRoomData.roomNumber;
            document.getElementById('detailHostelName').textContent = mockRoomData.hostelName;
            document.getElementById('roomType').textContent = mockRoomData.roomType;
            document.getElementById('occupancy').textContent = mockRoomData.occupancy;
            document.getElementById('floor').textContent = mockRoomData.floor;

        } catch (error) {
            console.error('Error loading room info:', error);
            // Show fallback data
            document.getElementById('roomNumber').textContent = 'Not Assigned';
            document.getElementById('hostelName').textContent = 'Not Assigned';
        }
    },

    async loadMaintenanceRequests() {
        try {
            // Mock data for maintenance requests
            const mockRequests = [
                { id: 1, title: 'Leaky Faucet', status: 'Pending', date: '2025-09-15' },
                { id: 2, title: 'AC Not Working', status: 'In Progress', date: '2025-09-10' },
                { id: 3, title: 'Light Bulb Replacement', status: 'Completed', date: '2025-09-08' }
            ];

            // Update stats
            const pending = mockRequests.filter(req => req.status === 'Pending' || req.status === 'In Progress').length;
            const completed = mockRequests.filter(req => req.status === 'Completed').length;
            
            document.getElementById('pendingRequests').textContent = pending;
            document.getElementById('completedRequests').textContent = completed;

            // Show recent requests
            const recentRequestsDiv = document.getElementById('recentRequests');
            if (recentRequestsDiv) {
                const recentHTML = mockRequests.slice(0, 3).map(req => `
                    <div style="padding: 0.5rem; border-left: 3px solid ${req.status === 'Completed' ? '#27ae60' : req.status === 'In Progress' ? '#f39c12' : '#e74c3c'}; margin: 0.5rem 0; background: #f8f9fa; border-radius: 4px;">
                        <strong>${req.title}</strong>
                        <div style="font-size: 0.9rem; color: #666;">
                            Status: ${req.status} | ${req.date}
                        </div>
                    </div>
                `).join('');
                
                recentRequestsDiv.innerHTML = recentHTML || '<p style="color: #666; font-style: italic;">No recent requests</p>';
            }

        } catch (error) {
            console.error('Error loading maintenance requests:', error);
        }
    },

    async loadNotifications() {
        try {
            // Mock notifications
            const mockNotifications = [
                { id: 1, title: 'Hostel Fee Due', message: 'Your hostel fee for this month is due on 25th September', type: 'warning', date: '2025-09-17' },
                { id: 2, title: 'Maintenance Completed', message: 'Your AC repair request has been completed', type: 'success', date: '2025-09-16' },
                { id: 3, title: 'Hostel Rules Update', message: 'New visiting hours have been updated', type: 'info', date: '2025-09-15' }
            ];

            const notificationsDiv = document.getElementById('notifications');
            if (notificationsDiv) {
                const notificationsHTML = mockNotifications.slice(0, 3).map(notif => `
                    <div style="padding: 0.75rem; border-left: 3px solid ${notif.type === 'success' ? '#27ae60' : notif.type === 'warning' ? '#f39c12' : '#3498db'}; margin: 0.5rem 0; background: #f8f9fa; border-radius: 4px;">
                        <strong>${notif.title}</strong>
                        <div style="font-size: 0.9rem; margin-top: 0.25rem;">${notif.message}</div>
                        <div style="font-size: 0.8rem; color: #666; margin-top: 0.25rem;">${notif.date}</div>
                    </div>
                `).join('');
                
                notificationsDiv.innerHTML = notificationsHTML || '<p style="color: #666; font-style: italic;">No new notifications</p>';
            }

        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    },

    async loadRecentActivity() {
        try {
            const mockActivity = [
                'Submitted maintenance request for AC repair',
                'Updated profile information',
                'Logged in to dashboard',
                'Viewed hostel rules'
            ];

            const activityDiv = document.getElementById('recentActivity');
            if (activityDiv) {
                const activityHTML = mockActivity.map((activity, index) => `
                    <div style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                        <span style="color: #666; font-size: 0.9rem;">• ${activity}</span>
                    </div>
                `).join('');
                
                activityDiv.innerHTML = activityHTML;
            }

        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }
};

// Dashboard Action Functions
function viewRoomDetails() {
    UIHelper.showAlert('Room details view coming soon!', 'info');
}

function newMaintenanceRequest() {
    UIHelper.showAlert('Maintenance request form coming soon!', 'info');
}

function viewAllRequests() {
    UIHelper.showAlert('All requests view coming soon!', 'info');
}

function viewAllNotifications() {
    UIHelper.showAlert('All notifications view coming soon!', 'info');
}

function editProfile() {
    UIHelper.showAlert('Profile editing coming soon!', 'info');
}

function changePassword() {
    UIHelper.showAlert('Password change form coming soon!', 'info');
}

function reportIssue() {
    UIHelper.showAlert('Issue reporting form coming soon!', 'info');
}

function viewHostelRules() {
    UIHelper.showAlert('Hostel rules page coming soon!', 'info');
}

function contactWarden() {
    UIHelper.showAlert('Warden contact form coming soon!', 'info');
}

function viewFacilities() {
    UIHelper.showAlert('Facilities information coming soon!', 'info');
}