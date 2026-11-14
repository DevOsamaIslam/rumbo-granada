// Notification Utilities

export function createNotificationContent(
  routeShortName: string,
  stopName: string,
  minutes: number
): { title: string; body: string } {
  return {
    title: `Bus ${routeShortName} llega en ${minutes} min`,
    body: `Tu parada "${stopName}" - Toca para ver detalles`,
  };
}

export function createTrackingNotificationContent(
  routeShortName: string,
  stopName: string,
  label: string
): { title: string; body: string } {
  return {
    title: `🚌 Bus ${routeShortName} llegando`,
    body: `Parada "${label || stopName}" - El bus está cerca`,
  };
}

export function getNotificationChannelId(type: 'arrival' | 'tracking' | 'general'): string {
  return `rumbo-granada-${type}`;
}

const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || 'Rumbo Granada';

export function getNotificationChannelName(type: 'arrival' | 'tracking' | 'general'): string {
  switch (type) {
    case 'arrival':
      return 'Llegadas de autobús';
    case 'tracking':
      return 'Seguimiento activo';
    case 'general':
      return APP_NAME;
    default:
      return APP_NAME;
  }
}