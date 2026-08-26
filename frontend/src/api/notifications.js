import { apiRequest } from './client';

export function getNotifications() {
  return apiRequest('/notifications', {
    method: 'GET',
    auth: true,
  });
}

export function markNotificationAsRead(id) {
  return apiRequest(`/notifications/${id}/read`, {
    method: 'PATCH',
    auth: true,
  });
}

export function markAllNotificationsAsRead() {
  return apiRequest('/notifications/mark-all-read', {
    method: 'POST',
    auth: true,
  });
}
