// Warden Dashboard JavaScript

// Initialize the warden dashboard
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    WardenDashboard.init();
});

function checkAuthentication() {
    const token = TokenManager.getToken();
    const user = TokenManager.getUser();
    
    if (!token || !user) {
        console.warn('No authentication found');
        window.location.href = 'login.html';
        return false;
    }
    
    // Check if user is a warden
    if (user.role !== 'Warden') {
        console.warn('Access denied. This page is for wardens only.');
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

const WardenDashboard = {
    init() {
        this.loadUserInfo();
        this.loadStats();
        this.loadRoomSummary();
        this.loadMaintenanceQueue();
        this.loadStudentSummary();
        this.loadRecentActivity();
        this.loadPendingApprovals();
        this.loadRecentAnnouncements();
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
                <h3>Welcome back, Warden ${user.username}! 👨‍💼</h3>
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

    async loadStats() {
        try {
            // Mock data for dashboard stats
            const mockStats = {
                totalStudents: 85,
                availableRooms: 12,
                pendingRequests: 7,
                todayTasks: 5
            };

            document.getElementById('totalStudents').textContent = mockStats.totalStudents;
            document.getElementById('availableRooms').textContent = mockStats.availableRooms;
            document.getElementById('pendingRequests').textContent = mockStats.pendingRequests;
            document.getElementById('todayTasks').textContent = mockStats.todayTasks;

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },

    async loadRoomSummary() {
        try {
            const mockRoomData = {
                totalRooms: 100,
                occupiedRooms: 88,
                availableRooms: 12,
                underMaintenance: 2
            };

            const roomSummaryDiv = document.getElementById('roomSummary');
            if (roomSummaryDiv) {
                roomSummaryDiv.innerHTML = `
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin: 1rem 0;">
                        <div style="text-align: center; padding: 1rem; background: #e8f5e8; border-radius: 8px;">
                            <h4 style="margin: 0; color: #27ae60;">${mockRoomData.occupiedRooms}</h4>
                            <p style="margin: 0; font-size: 0.9rem;">Occupied</p>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: #e3f2fd; border-radius: 8px;">
                            <h4 style="margin: 0; color: #3498db;">${mockRoomData.availableRooms}</h4>
                            <p style="margin: 0; font-size: 0.9rem;">Available</p>
                        </div>
                    </div>
                    <p style="font-size: 0.9rem; color: #666;">
                        ${mockRoomData.underMaintenance} rooms under maintenance
                    </p>
                `;
            }

        } catch (error) {
            console.error('Error loading room summary:', error);
        }
    },

    async loadMaintenanceQueue() {
        try {
            const mockRequests = [
                { id: 1, student: 'John Doe', room: 'A-101', issue: 'AC not working', priority: 'High', date: '2025-09-17' },
                { id: 2, student: 'Jane Smith', room: 'B-205', issue: 'Leaky faucet', priority: 'Medium', date: '2025-09-16' },
                { id: 3, student: 'Mike Johnson', room: 'C-301', issue: 'Light bulb replacement', priority: 'Low', date: '2025-09-15' }
            ];

            const maintenanceQueueDiv = document.getElementById('maintenanceQueue');
            if (maintenanceQueueDiv) {
                const requestsHTML = mockRequests.map(req => `
                    <div style="padding: 0.75rem; border-left: 3px solid ${req.priority === 'High' ? '#e74c3c' : req.priority === 'Medium' ? '#f39c12' : '#27ae60'}; margin: 0.5rem 0; background: #f8f9fa; border-radius: 4px;">
                        <div style="display: flex; justify-content: between; align-items: center;">
                            <div style="flex: 1;">
                                <strong>${req.issue}</strong>
                                <div style="font-size: 0.9rem; color: #666;">
                                    ${req.student} - Room ${req.room} | ${req.priority} Priority
                                </div>
                            </div>
                            <button class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="approveRequest(${req.id})">
                                Approve
                            </button>
                        </div>
                    </div>
                `).join('');
                
                maintenanceQueueDiv.innerHTML = requestsHTML || '<p style="color: #666; font-style: italic;">No pending requests</p>';
            }

        } catch (error) {
            console.error('Error loading maintenance queue:', error);
        }
    },

    async loadStudentSummary() {
        try {
            const mockStudentData = {
                totalStudents: 85,
                newThisMonth: 5,
                graduatingThisMonth: 3,
                issuesThisWeek: 2
            };

            const studentSummaryDiv = document.getElementById('studentSummary');
            if (studentSummaryDiv) {
                studentSummaryDiv.innerHTML = `
                    <div style="margin: 1rem 0;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; font-size: 0.9rem;">
                            <p>✅ <strong>${mockStudentData.newThisMonth}</strong> new students this month</p>
                            <p>🎓 <strong>${mockStudentData.graduatingThisMonth}</strong> graduating this month</p>
                        </div>
                        <p style="margin-top: 0.5rem; font-size: 0.9rem; color: ${mockStudentData.issuesThisWeek > 0 ? '#e74c3c' : '#27ae60'};">
                            📋 <strong>${mockStudentData.issuesThisWeek}</strong> disciplinary issues this week
                        </p>
                    </div>
                `;
            }

        } catch (error) {
            console.error('Error loading student summary:', error);
        }
    },

    async loadRecentActivity() {
        try {
            const mockActivity = [
                'Approved maintenance request for Room A-101',
                'Allocated Room B-205 to new student',
                'Sent announcement about hostel rules',
                'Completed room inspection for Floor 3',
                'Reviewed student complaint'
            ];

            const activityDiv = document.getElementById('recentActivity');
            if (activityDiv) {
                const activityHTML = mockActivity.map(activity => `
                    <div style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                        <span style="color: #666; font-size: 0.9rem;">• ${activity}</span>
                    </div>
                `).join('');
                
                activityDiv.innerHTML = activityHTML;
            }

        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    },

    async loadPendingApprovals() {
        try {
            const mockApprovals = [
                { type: 'Room Change Request', student: 'Sarah Wilson', details: 'A-101 to B-202' },
                { type: 'Late Entry Permission', student: 'David Brown', details: 'Until 11:30 PM' },
                { type: 'Guest Visit Request', student: 'Emma Davis', details: 'Parents visit on weekend' }
            ];

            const approvalsDiv = document.getElementById('pendingApprovals');
            if (approvalsDiv) {
                const approvalsHTML = mockApprovals.map((approval, index) => `
                    <div style="padding: 0.75rem; border: 1px solid #e3f2fd; margin: 0.5rem 0; background: #f8f9fa; border-radius: 4px;">
                        <div style="display: flex; justify-content: between; align-items: center;">
                            <div style="flex: 1;">
                                <strong>${approval.type}</strong>
                                <div style="font-size: 0.9rem; color: #666;">
                                    ${approval.student} - ${approval.details}
                                </div>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="approveItem(${index})">
                                    Approve
                                </button>
                                <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="rejectItem(${index})">
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
                
                approvalsDiv.innerHTML = approvalsHTML || '<p style="color: #666; font-style: italic;">No pending approvals</p>';
            }

        } catch (error) {
            console.error('Error loading pending approvals:', error);
        }
    },

    async loadRecentAnnouncements() {
        try {
            const mockAnnouncements = [
                { title: 'Hostel Fee Due Date', date: '2025-09-15' },
                { title: 'New Visiting Hours', date: '2025-09-12' },
                { title: 'Maintenance Schedule', date: '2025-09-10' }
            ];

            const announcementsDiv = document.getElementById('recentAnnouncements');
            if (announcementsDiv) {
                const announcementsHTML = mockAnnouncements.map(announcement => `
                    <div style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                        <strong style="font-size: 0.9rem;">${announcement.title}</strong>
                        <div style="font-size: 0.8rem; color: #666;">${announcement.date}</div>
                    </div>
                `).join('');
                
                announcementsDiv.innerHTML = announcementsHTML || '<p style="color: #666; font-style: italic;">No recent announcements</p>';
            }

        } catch (error) {
            console.error('Error loading recent announcements:', error);
        }
    }
};

// Dashboard Action Functions
function manageRooms() {
    UIHelper.showAlert('Room management interface coming soon!', 'info');
}

function allocateRoom() {
    UIHelper.showAlert('Room allocation form coming soon!', 'info');
}

function reviewRequests() {
    UIHelper.showAlert('Maintenance request review interface coming soon!', 'info');
}

function viewMaintenanceHistory() {
    UIHelper.showAlert('Maintenance history view coming soon!', 'info');
}

function viewAllStudents() {
    UIHelper.showAlert('Student management interface coming soon!', 'info');
}

function addStudent() {
    UIHelper.showAlert('Add student form coming soon!', 'info');
}

function createAnnouncement() {
    UIHelper.showAlert('Announcement creation form coming soon!', 'info');
}

function viewAllAnnouncements() {
    UIHelper.showAlert('All announcements view coming soon!', 'info');
}

function occupancyReport() {
    UIHelper.showAlert('Occupancy report generation coming soon!', 'info');
}

function maintenanceReport() {
    UIHelper.showAlert('Maintenance report generation coming soon!', 'info');
}

function studentReport() {
    UIHelper.showAlert('Student report generation coming soon!', 'info');
}

function financialReport() {
    UIHelper.showAlert('Financial report generation coming soon!', 'info');
}

function emergencyAlert() {
    UIHelper.showAlert('Emergency alert system coming soon!', 'info');
}

function bulkNotification() {
    UIHelper.showAlert('Bulk notification system coming soon!', 'info');
}

function roomInspection() {
    UIHelper.showAlert('Room inspection scheduler coming soon!', 'info');
}

function updateRules() {
    UIHelper.showAlert('Rules update interface coming soon!', 'info');
}

function reviewApprovals() {
    UIHelper.showAlert('Approval review interface coming soon!', 'info');
}

function approveRequest(requestId) {
    UIHelper.showAlert(`Maintenance request ${requestId} approved!`, 'success');
}

function approveItem(itemIndex) {
    UIHelper.showAlert(`Approval item ${itemIndex + 1} approved!`, 'success');
}

function rejectItem(itemIndex) {
    UIHelper.showAlert(`Approval item ${itemIndex + 1} rejected!`, 'info');
}