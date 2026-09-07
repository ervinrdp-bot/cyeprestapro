/**
 * Vista de Reportes Financieros y Rendimiento PrestaPro
 */
import { db } from '../store/db.js';
import { Formatters } from '../utils/formatters.js';
import { PdfExporter } from '../utils/pdf_exporter.js';

export class ReportsView {
  static currentPeriod = 'month';
  static customStartDate = '';
  static customEndDate = '';

  static render(container) {
    const business = db.getBusinessSettings();
    const symbol = business.currencySymbol || '$';
    const reportData = this.calculateReportData(this.currentPeriod);

    container.innerHTML = `
      <div class="filter-bar">
        <div>
          <h3 style="font-size: 18px; font-weight: 700; color: #FFF;">Reportes Financieros y Rendimiento</h3>
          <p style="font-size: 13px; color: var(--text-muted);">Auditoría del portafolio de crédito, intereses y cobranza</p>
        </div>

        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <div class="filter-tabs">
            <button class="filter-tab ${this.currentPeriod === 'today' ? 'active' : ''}" onclick="window.reportsView.setPeriod('today')">Hoy</button>
            <button class="filter-tab ${this.currentPeriod === 'week' ? 'active' : ''}" onclick="window.reportsView.setPeriod('week')">Esta Semana</button>
            <button class="filter-tab ${this.currentPeriod === 'month' ? 'active' : ''}" onclick="window.reportsView.setPeriod('month')">Este Mes</button>
            <button class="filter-tab ${this.currentPeriod === 'last_month' ? 'active' : ''}" onclick="window.reportsView.setPeriod('last_month')">Mes Anterior</button>
            <button class="filter-tab ${this.currentPeriod === 'all' ? 'active' : ''}" onclick="window.reportsView.setPeriod('all')">Histórico Total</button>
          </div>

          <button class="btn btn-secondary" onclick="window.reportsView.printReport()">
            🖨️ Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      <!-- Tarjetas de Métricas del Periodo -->
      <div class="kpi-grid">
        <div class="glass-card kpi-card" style="--card-accent: #06B6D4;">
          <div class="kpi-top">
            <span class="kpi-label">Total Prestado</span>
            <div class="kpi-icon">💵</div>
          </div>
          <div class="kpi-value mono">${Formatters.currency(reportData.totalLent, symbol)}</div>
          <div class="kpi-subtext">${reportData.loansInPeriod.length} préstamos otorgados</div>
        </div>

        <div class="glass-card kpi-card" style="--card-accent: #10B981;">
          <div class="kpi-top">
            <span class="kpi-label">Total Cobrado</span>
            <div class="kpi-icon">💰</div>
          </div>
          <div class="kpi-value mono" style="color: #34D399;">${Formatters.currency(reportData.totalCollected, symbol)}</div>
          <div class="kpi-subtext">${reportData.paymentsInPeriod.length} pagos recibidos</div>
        </div>

        <div class="glass-card kpi-card" style="--card-accent: #F59E0B;">
          <div class="kpi-top">
            <span class="kpi-label">Intereses Generados</span>
            <div class="kpi-icon">📈</div>
          </div>
          <div class="kpi-value mono" style="color: #FBBF24;">${Formatters.currency(reportData.interestGenerated, symbol)}</div>
          <div class="kpi-subtext">Margen de ganancia estipulado</div>
        </div>

        <div class="glass-card kpi-card" style="--card-accent: #6366F1;">
          <div class="kpi-top">
            <span class="kpi-label">Por Cobrar en Cartera</span>
            <div class="kpi-icon">📊</div>
          </div>
          <div class="kpi-value mono" style="color: #818CF8;">${Formatters.currency(reportData.totalToCollect, symbol)}</div>
          <div class="kpi-subtext">Capital + intereses pendientes</div>
        </div>
      </div>

      <!-- Gráfico Visual de Distribución de Cartera -->
      <div class="glass-card" style="margin-bottom: 24px;">
        <h4 style="font-size: 16px; font-weight: 700; color: #FFF; margin-bottom: 16px;">
          📊 Salud y Rendimiento de Cartera
        </h4>

        <!-- Barra de progreso visual comparativa -->
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
            <span>Tasa de Recuperación sobre Préstamos Otorgados</span>
            <strong class="mono" style="color: #34D399;">${reportData.recoveryRate}%</strong>
          </div>
          <div style="height: 12px; background: rgba(255,255,255,0.08); border-radius: var(--radius-full); overflow: hidden; display: flex;">
            <div style="width: ${reportData.recoveryRate}%; background: linear-gradient(90deg, #10B981, #06B6D4);"></div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 20px;">
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); padding: 14px; border-radius: var(--radius-sm);">
            <div style="font-size: 12px; color: #34D399; font-weight: 600;">COBRADO EXITOSAMENTE</div>
            <div class="mono font-bold" style="font-size: 20px; color: #FFF; margin-top: 4px;">
              ${Formatters.currency(reportData.totalCollected, symbol)}
            </div>
          </div>

          <div style="background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.2); padding: 14px; border-radius: var(--radius-sm);">
            <div style="font-size: 12px; color: var(--accent-cyan); font-weight: 600;">PENDIENTE POR VENCER</div>
            <div class="mono font-bold" style="font-size: 20px; color: #FFF; margin-top: 4px;">
              ${Formatters.currency(reportData.totalToCollect - reportData.totalOverdue, symbol)}
            </div>
          </div>

          <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); padding: 14px; border-radius: var(--radius-sm);">
            <div style="font-size: 12px; color: #F87171; font-weight: 600;">TOTAL EN MORA (ATRASADO)</div>
            <div class="mono font-bold" style="font-size: 20px; color: #FFF; margin-top: 4px;">
              ${Formatters.currency(reportData.totalOverdue, symbol)}
            </div>
          </div>
        </div>
      </div>

      <!-- Detalle de Pagos Recibidos en el Período -->
      <div class="glass-card" style="padding: 0; overflow: hidden;">
        <div style="padding: 18px 20px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
          <h4 style="font-size: 15px; font-weight: 700; color: #FFF;">
            Transacciones Registradas en el Período (${reportData.paymentsInPeriod.length})
          </h4>
          <span class="badge badge-neutral">${this.getPeriodLabel(this.currentPeriod)}</span>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Recibo</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Préstamo</th>
                <th>Método</th>
                <th class="text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.paymentsInPeriod.length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align: center; padding: 30px; color: var(--text-subtle);">
                    No hay transacciones registradas en este intervalo de tiempo.
                  </td>
                </tr>
              ` : reportData.paymentsInPeriod.map(p => `
                <tr>
                  <td class="mono font-bold" style="color: var(--accent-cyan);">${p.receiptNumber}</td>
                  <td>${Formatters.dateTime(p.date)}</td>
                  <td><strong>${p.clientName}</strong></td>
                  <td class="mono">${p.loanId}</td>
                  <td>${p.paymentMethod}</td>
                  <td class="text-right mono font-bold" style="color: #34D399;">${Formatters.currency(p.amount, symbol)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    window.reportsView = this;
  }

  static setPeriod(p) {
    this.currentPeriod = p;
    this.render(document.getElementById('content-area'));
  }

  static getPeriodLabel(p) {
    switch (p) {
      case 'today': return 'Hoy';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mes';
      case 'last_month': return 'Mes Anterior';
      default: return 'Histórico Total';
    }
  }

  static calculateReportData(period) {
    const loans = db.getLoans();
    const receipts = db.getReceipts();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    let startDate = new Date(0); // Epoch
    if (period === 'today') {
      startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (period === 'last_month') {
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    }

    const paymentsInPeriod = receipts.filter(r => {
      if (period === 'all') return true;
      const rDate = new Date(r.date);
      return rDate >= startDate;
    });

    const loansInPeriod = loans.filter(l => {
      if (period === 'all') return true;
      const lDate = new Date(l.issueDate + 'T00:00:00');
      return lDate >= startDate;
    });

    let totalLent = loansInPeriod.reduce((sum, l) => sum + l.principal, 0);
    let interestGenerated = loansInPeriod.reduce((sum, l) => sum + l.totalInterest, 0);
    let totalCollected = paymentsInPeriod.reduce((sum, p) => sum + p.amount, 0);
    
    // Si es histórico o no hay préstamos en el rango corto, mostramos métricas globales de cartera
    if (totalLent === 0 && period !== 'all') {
      totalLent = loans.reduce((sum, l) => sum + l.principal, 0);
      interestGenerated = loans.reduce((sum, l) => sum + l.totalInterest, 0);
    }

    const totalToCollect = loans.reduce((sum, l) => sum + l.remainingBalance, 0);
    
    let totalOverdue = 0;
    loans.forEach(loan => {
      loan.schedule.forEach(inst => {
        if (inst.status !== 'PAGADA' && inst.date < todayStr) {
          totalOverdue += inst.pendingAmount;
        }
      });
    });

    const totalPortfolio = totalCollected + totalToCollect;
    const recoveryRate = totalPortfolio > 0 ? Math.round((totalCollected / totalPortfolio) * 100) : 0;

    return {
      totalLent,
      interestGenerated,
      totalCollected,
      totalToCollect,
      totalOverdue,
      recoveryRate,
      loansInPeriod,
      paymentsInPeriod
    };
  }

  static printReport() {
    const business = db.getBusinessSettings();
    const symbol = business.currencySymbol || '$';
    const report = this.calculateReportData(this.currentPeriod);
    const label = this.getPeriodLabel(this.currentPeriod);

    const rowsHtml = report.paymentsInPeriod.map(p => `
      <tr>
        <td class="mono">${p.receiptNumber}</td>
        <td>${Formatters.dateTime(p.date)}</td>
        <td>${p.clientName}</td>
        <td class="mono">${p.loanId}</td>
        <td>${p.paymentMethod}</td>
        <td class="text-right mono font-bold">${Formatters.currency(p.amount, symbol)}</td>
      </tr>
    `).join('');

    const content = `
      <div class="header">
        <div>
          <h1 class="business-title">${business.name || 'PRESTAPRO FINANZAS'}</h1>
          <p style="color: #64748B; font-size: 12px; margin-top: 3px;">REPORTE FINANCIERO Y AUDITORÍA DE CRÉDITO</p>
        </div>
        <div class="doc-badge">
          <div style="font-size: 11px; color: #0284C7;">PERÍODO</div>
          <div style="font-size: 16px; font-weight: 700;">${label}</div>
          <div style="font-size: 11px; color: #64748B;">Generado: ${Formatters.dateTime(new Date().toISOString())}</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="info-card">
          <h4>Colocación y Rentabilidad</h4>
          <div class="info-row"><span class="label">Total Prestado:</span><span class="value mono">${Formatters.currency(report.totalLent, symbol)}</span></div>
          <div class="info-row"><span class="label">Intereses Generados:</span><span class="value mono">${Formatters.currency(report.interestGenerated, symbol)}</span></div>
          <div class="info-row"><span class="label">Tasa de Recuperación:</span><span class="value">${report.recoveryRate}%</span></div>
        </div>

        <div class="info-card">
          <h4>Cobranza y Cartera</h4>
          <div class="info-row"><span class="label">Total Cobrado:</span><span class="value mono" style="color: #059669;">${Formatters.currency(report.totalCollected, symbol)}</span></div>
          <div class="info-row"><span class="label">Saldo Por Cobrar:</span><span class="value mono">${Formatters.currency(report.totalToCollect, symbol)}</span></div>
          <div class="info-row"><span class="label">Cartera en Mora:</span><span class="value mono" style="color: #DC2626;">${Formatters.currency(report.totalOverdue, symbol)}</span></div>
        </div>
      </div>

      <h3 style="font-size: 14px; font-weight: 700; color: #1E293B; margin-top: 25px;">Transacciones del Período</h3>
      <table>
        <thead>
          <tr>
            <th>Recibo</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Préstamo</th>
            <th>Método</th>
            <th class="text-right">Monto</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="6" class="text-center">No hay transacciones registradas</td></tr>'}
        </tbody>
      </table>

      <div class="footer">
        Reporte generado automáticamente por la plataforma PrestaPro.
      </div>
    `;

    PdfExporter.printHtml(`Reporte-Financiero-${label}`, content);
  }
}
