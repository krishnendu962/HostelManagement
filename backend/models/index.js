// Export all models for easy importing
const UserModel = require('./UserModel');
const StudentModel = require('./StudentModel');
const HostelModel = require('./HostelModel');
const RoomModel = require('./RoomModel');
const RoomAllotmentModel = require('./RoomAllotmentModel');
const MaintenanceRequestModel = require('./MaintenanceRequestModel');
const NotificationModel = require('./NotificationModel');

module.exports = {
  UserModel,
  StudentModel,
  HostelModel,
  RoomModel,
  RoomAllotmentModel,
  MaintenanceRequestModel,
  NotificationModel
};