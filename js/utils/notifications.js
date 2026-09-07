export class Notifications {
  static isSupported() {
    return 'Notification' in window;
  }

  static async requestPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.requestPermission();
  }

  static async show(title, options = {}) {
    if (!this.isSupported()) return false;
    if (Notification.permission !== 'granted') return false;

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: './assets/logo.svg',
        badge: './assets/logo.svg',
        vibrate: [180, 80, 180],
        ...options
      });
      return true;
    }

    new Notification(title, options);
    return true;
  }

  static async notifyDuePayments() {
    const dueItems = window.db?.getDashboardMetrics?.().todayDueItems || [];
    if (dueItems.length === 0) return;
    const first = dueItems[0];
    const extra = dueItems.length > 1 ? ` y ${dueItems.length - 1} más` : '';
    await this.show('PrestaPro: cuota pendiente', {
      body: `${first.clientName} tiene un abono de ${first.amount} para hoy${extra}.`,
      tag: `due-${first.date}`,
      data: { route: 'amortizations' }
    });
  }
}
