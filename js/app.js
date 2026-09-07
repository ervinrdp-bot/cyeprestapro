/**
 * PrestaPro App Router y Orquestador Principal
 */
import { db } from './store/db.js';
import { DashboardView } from './views/dashboard.js';
import { ClientsView } from './views/clients.js';
import { LoansView } from './views/loans.js';
import { PaymentsView } from './views/payments.js';
import { AmortizationsView } from './views/amortizations.js';
import { ReceiptsView } from './views/receipts.js';
import { AutomationsView } from './views/automations.js';
import { ReportsView } from './views/reports.js';
import { ExportsView } from './views/exports.js';
import { SettingsView } from './views/settings.js';
import { Notifications } from './utils/notifications.js';

class AppRouter {
  constructor() {
    this.currentRoute = 'dashboard';
    this.routeParams = {};
    this.contentArea = document.getElementById('content-area');
    this.pageTitleEl = document.getElementById('page-title');
    this.sidebar = document.getElementById('sidebar');

    this.routes = {
      dashboard: { title: 'Centro de Control Financiero', view: DashboardView },
      clients: { title: 'Gestión de Clientes y Expedientes', view: ClientsView },
      loans: { title: 'Cartera y Solicitudes de Préstamo', view: LoansView },
      payments: { title: 'Caja y Cobranza de Pagos', view: PaymentsView },
      amortizations: { title: 'Planes y Tablas de Amortización', view: AmortizationsView },
      receipts: { title: 'Recibos y Comprobantes Oficiales', view: ReceiptsView },
      automations: { title: 'Automatizaciones y WhatsApp', view: AutomationsView },
      reports: { title: 'Reportes y Métricas Financieras', view: ReportsView },
      exports: { title: 'Exportación de Datos (Excel / PDF)', view: ExportsView },
      settings: { title: 'Configuración y Roles del Negocio', view: SettingsView }
    };

    this.init();
  }

  init() {
    // Reaccionar a cambios en la base de datos
    db.subscribe(() => {
      this.updateBadges();
      // Refrescar vista actual
      this.renderCurrentView();
    });

    // PWA Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').catch(err => {
        console.log('ServiceWorker registration error:', err);
      });
    }

    this.updateBadges();
    this.navigate('dashboard');
  }

  navigate(route, params = {}) {
    if (!this.routes[route]) route = 'dashboard';
    this.currentRoute = route;
    this.routeParams = params;

    // Actualizar título
    if (this.pageTitleEl) {
      this.pageTitleEl.textContent = this.routes[route].title;
    }

    // Actualizar elementos activos de navegación (sidebar & bottom nav)
    document.querySelectorAll('.nav-item').forEach(el => {
      if (el.dataset.route === route) el.classList.add('active');
      else el.classList.remove('active');
    });

    document.querySelectorAll('.bottom-nav-item').forEach(el => {
      if (el.dataset.route === route) el.classList.add('active');
      else el.classList.remove('active');
    });

    // Cerrar sidebar en móvil al navegar
    if (this.sidebar) this.sidebar.classList.remove('open');

    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderCurrentView() {
    if (!this.contentArea) return;
    const routeObj = this.routes[this.currentRoute];
    if (routeObj && routeObj.view) {
      routeObj.view.render(this.contentArea, this.routeParams);
    }
  }

  updateBadges() {
    const metrics = db.getDashboardMetrics();
    const overdueBadge = document.getElementById('badge-overdue');
    const todayBadge = document.getElementById('badge-today');

    if (overdueBadge) {
      if (metrics.overdueItems.length > 0) {
        overdueBadge.textContent = metrics.overdueItems.length;
        overdueBadge.style.display = 'inline-block';
      } else {
        overdueBadge.style.display = 'none';
      }
    }

    if (todayBadge) {
      if (metrics.scheduledPaymentsTodayCount > 0) {
        todayBadge.textContent = metrics.scheduledPaymentsTodayCount;
        todayBadge.style.display = 'inline-block';
      } else {
        todayBadge.style.display = 'none';
      }
    }
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.classList.toggle('open');
    }
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('prestapro_theme', next);
    this.showToast(`Modo ${next === 'dark' ? 'Oscuro Obsidian' : 'Claro'} activado`);
  }

  openPaymentModal(loanId = null, quotaNumber = null) {
    PaymentsView.openRegisterPaymentModal(loanId, quotaNumber);
  }

  openReceipt(receiptNumber) {
    ReceiptsView.openReceiptModal(receiptNumber);
  }

  openLoanDetail(loanId) {
    LoansView.openLoanDetail(loanId);
  }

  openWhatsAppReminder(loanId) {
    this.navigate('automations');
  }

  closeModal() {
    const modal = document.getElementById('global-modal');
    if (modal) modal.classList.remove('active');
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0F172A;
      color: #FFF;
      border: 1px solid var(--accent-cyan);
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      border-radius: var(--radius-sm);
      padding: 12px 20px;
      font-size: 13px;
      font-weight: 600;
      z-index: 9999;
      animation: fadeIn 0.2s ease;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    toast.innerHTML = `<span>✨</span> <div>${message}</div>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

// Inicialización cuando cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('prestapro_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const loginScreen = document.getElementById('login-screen');
  const app = document.getElementById('app');
  window.db = db;

  const startApp = () => {
    if (loginScreen) loginScreen.hidden = true;
    app.hidden = false;
    window.appRouter = new AppRouter();
  };

  startApp();
  db.connectFirebase().then((connected) => {
    if (!connected && window.appRouter) {
      window.appRouter.showToast('Modo local: Firebase no está conectado. Los datos no se compartirán entre teléfonos.', 'error');
    }
    Notifications.notifyDuePayments();
  });

  window.addEventListener('firebase-connection-error', () => {
    if (window.appRouter) {
      window.appRouter.showToast('Firebase rechazó la conexión. Activa Anonymous Authentication y revisa Firestore Rules.', 'error');
    }
  });

  window.addEventListener('firebase-sync-error', () => {
    if (window.appRouter) {
      window.appRouter.showToast('No se pudo sincronizar con Firebase. Revisa Firestore y vuelve a intentar.', 'error');
    }
  });
});
