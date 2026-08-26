/**
 * Dispatches a custom window event to trigger notification re-fetching 
 * across the application.
 */
export function triggerNotificationRefresh() {
  window.dispatchEvent(new CustomEvent('refresh-notifications'));
}
