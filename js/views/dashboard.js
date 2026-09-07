/**
 * Vista de Inicio / Dashboard PrestaPro
 * Centro de control financiero inteligente en tiempo real
 */
import { db } from '../store/db.js';
import { Formatters } from '../utils/formatters.js';

export class DashboardView {
  static render(container) {
    const metrics = db.getDashboardMetrics();
    const business = db.getBusinessSettings();
    const symbol = business.currencySymbol || '$';

    container.innerHTML = `
      <!-- Acciones Rápidas -->
      <div class="quick-actions-bar">
        <button class="quick-action-chip" onclick="window.appRouter.navigate('clients', { openModal: true })">
          <span>➕</span> Nuevo Cliente
        </button>
        <button class="quick-action-chip" onclick="window.appRouter.navigate('loans', { openModal: true })">
          <span>📝</span> Nuevo Préstamo
        </button>
        <button class="quick-action-chip" onclick="window.appRouter.openPaymentModal()">
          <span>💵</span> Registrar Pago
        </button>
        <button class="quick-action-chip" onclick="window.appRouter.navigate('loans', { filter: 'ATRASADO' })">
          <span>⚠️</span> Ver Atrasados (${metrics.overdueItems.length})
        </button>
        <button class="quick-action-chip" onclick="window.appRouter.navigate('amortizations', { filter: 'today' })">
          <span>📅</span> Pagos de Hoy (${metrics.scheduledPaymentsTodayCount})
        </button>
        <button class="quick-action-chip" onclick="window.appRouter.navigate('reports')">
          <span>📊</span> Generar Reporte
        </button>
      </div>

      <!-- Resumen Inteligente de Hoy -->
      <div class="glass-card today-summary-card">
        <div class="today-summary-header">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: #FFF; display: flex; align-items: center; gap: 8px;">
              <span>⚡</span> Resumen Inteligente de Hoy
            </h3>
            <p style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">
              Diagnóstico en tiempo real para cobranza y operaciones
            </p>
          </div>
          <span class="badge badge-info" style="font-size: 12px;">
            ${new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div class="today-pills">
          <div class="summary-pill">
            <div class="summary-pill-icon">📅</div>
            <div class="summary-pill-info">
              <h4>${metrics.scheduledPaymentsTodayCount} pagos programados</h4>
              <p>Esperado: <strong class="mono" style="color: var(--accent-cyan);">${Formatters.currency(metrics.expectedToday, symbol)}</strong></p>
            </div>
          </div>

          <div class="summary-pill">
            <div class="summary-pill-icon">💰</div>
            <div class="summary-pill-info">
              <h4>${Formatters.currency(metrics.receivedToday, symbol)}</h4>
              <p>Cobrado efectivamente hoy</p>
            </div>
          </div>

          <div class="summary-pill" style="border-color: ${metrics.overdueItems.length > 0 ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)'}">
            <div class="summary-pill-icon">⚠️</div>
            <div class="summary-pill-info">
              <h4 style="color: ${metrics.overdueItems.length > 0 ? '#F87171' : 'var(--text-main)'};">${metrics.overdueItems.length} cuotas en mora</h4>
              <p>Total atrasado: <strong class="mono" style="color: #F87171;">${Formatters.currency(metrics.totalOverdue, symbol)}</strong></p>
            </div>
          </div>

          <div class="summary-pill">
            <div class="summary-pill-icon">👥</div>
            <div class="summary-pill-info">
              <h4>${metrics.attentionClientsCount} clientes</h4>
              <p>Requieren gestión de cobranza</p>
            </div>
          </div>
        </div>

        <!-- Mensajes Conversacionales Inteligentes -->
        <div style="margin-top: 18px; padding-top: 14px; border-top: 1px dashed rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 13px; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--accent-cyan);">●</span>
            ${metrics.scheduledPaymentsTodayCount > 0 
              ? `Hoy tienes <strong>${metrics.scheduledPaymentsTodayCount} pago(s) programados</strong> por un total de <strong>${Formatters.currency(metrics.expectedToday, symbol)}</strong>.` 
              : 'No hay pagos regulares programados para vencer el día de hoy.'}
          </div>
          ${metrics.overdueItems.length > 0 ? `
            <div style="font-size: 13px; color: #FCA5A5; display: flex; align-items: center; gap: 8px;">
              <span style="color: var(--accent-red);">●</span>
              <strong>${metrics.overdueItems.length} cuota(s) están atrasadas</strong> por un monto total de <strong>${Formatters.currency(metrics.totalOverdue, symbol)}</strong>. Te sugerimos enviar recordatorios por WhatsApp.
            </div>
          ` : ''}
          ${metrics.receivedToday > 0 ? `
            <div style="font-size: 13px; color: #6EE7B7; display: flex; align-items: center; gap: 8px;">
              <span style="color: var(--accent-emerald);">●</span>
              Has recibido <strong>${Formatters.currency(metrics.receivedToday, symbol)}</strong> el día de hoy.
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Indicadores Principales (KPI Cards) -->
      <div class="kpi-grid">
        <div class="glass-card kpi-card" style="--card-accent: #06B6D4;">
          <div class="kpi-top">
            <span class="kpi-label">Dinero Prestado</span>
            <div class="kpi-icon">💵</div>
          </div>
          <div class="kpi-value mono">${Formatters.currency(metrics.totalPrincipal, symbol)}</div>
          <div class="kpi-subtext">Capital original colocado</div>
        </div>

        <div class="glass-card kpi-card" style="--card-accent: #10B981;">
          <div class="kpi-top">
            <span class="kpi-label">Dinero Cobrado</span>
            <div class="kpi-icon">💰</div>
          </div>
          <div class="kpi-value mono" style="color: #34D399;">${Formatters.currency(metrics.totalCollected, symbol)}</div>
          <div class="kpi-subtext">Capital + intereses recuperados</div>
        </div>

        <div class="glass-card kpi-card" style="--card-accent: #6366F1;">
          <div class="kpi-top">
            <span class="kpi-label">Dinero Por Cobrar</span>
            <div class="kpi-icon">📊</div>
          </div>
          <div class="kpi-value mono" style="color: #818CF8;">${Formatters.currency(metrics.totalToCollect, symbol)}</div>
          <div class="kpi-subtext">Saldo pendiente total en cartera</div>
        </div>

        <div class="glass-card kpi-card" style="--card-accent: #EF4444;">
          <div class="kpi-top">
            <span class="kpi-label">Dinero Atrasado</span>
            <div class="kpi-icon">⚠️</div>
          </div>
          <div class="kpi-value mono" style="color: #F87171;">${Formatters.currency(metrics.totalOverdue, symbol)}</div>
          <div class="kpi-subtext">Cuotas vencidas no pagadas</div>
        </div>

        <div class="glass-card kpi-card" style="--card-accent: #38BDF8;">
          <div class="kpi-top">
            <span class="kpi-label">Total Clientes</span>
            <div class="kpi-icon">👥</div>
          </div>
          <div class="kpi-value mono">${metrics.totalClients}</div>
          <div class="kpi-subtext">Registrados en el sistema</div>
        </div>

        <div class="glass-card kpi-card" style="--card-accent: #F59E0B;">
          <div class="kpi-top">
            <span class="kpi-label">Préstamos Activos</span>
            <div class="kpi-icon">📄</div>
          </div>
          <div class="kpi-value mono">${metrics.activeLoansCount}</div>
          <div class="kpi-subtext">Préstamos con saldo pendiente</div>
        </div>

        <div class="glass-card kpi-card" style="--card-accent: #10B981;">
          <div class="kpi-top">
            <span class="kpi-label">Préstamos Terminados</span>
            <div class="kpi-icon">✅</div>
          </div>
          <div class="kpi-value mono">${metrics.finishedLoansCount}</div>
          <div class="kpi-subtext">Pagados en su totalidad</div>
        </div>

        <div class="glass-card kpi-card" style="--card-accent: #EC4899;">
          <div class="kpi-top">
            <span class="kpi-label">Pagos Para Hoy</span>
            <div class="kpi-icon">📅</div>
          </div>
          <div class="kpi-value mono">${metrics.scheduledPaymentsTodayCount}</div>
          <div class="kpi-subtext">Cuotas que vencen hoy</div>
        </div>
      </div>

      <!-- Cuadrícula Inferior: Pagos de Hoy y Préstamos Próximos a Terminar -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 20px;">
        
        <!-- Lista de Pagos Programados para Hoy -->
        <div class="glass-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 16px; font-weight: 700; color: #FFF; display: flex; align-items: center; gap: 8px;">
              <span>📅</span> Vencimientos de Hoy
            </h3>
            <span class="badge badge-info">${metrics.todayDueItems.length} cuotas</span>
          </div>

          ${metrics.todayDueItems.length === 0 ? `
            <div style="text-align: center; padding: 30px; color: var(--text-subtle);">
              <div style="font-size: 32px; margin-bottom: 8px;">✨</div>
              <p>No tienes cuotas programadas con fecha de hoy.</p>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Cuota</th>
                    <th class="text-right">Monto</th>
                    <th class="text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  ${metrics.todayDueItems.map(item => `
                    <tr>
                      <td>
                        <strong>${item.clientName}</strong>
                        <div style="font-size: 11px; color: var(--text-subtle);">${item.loanId}</div>
                      </td>
                      <td>${item.quotaNumber} / ${item.totalQuotas}</td>
                      <td class="text-right mono font-bold" style="color: var(--accent-cyan);">${Formatters.currency(item.amount, symbol)}</td>
                      <td class="text-center">
                        <button class="btn btn-emerald btn-sm" onclick="window.appRouter.openPaymentModal('${item.loanId}', ${item.quotaNumber})">
                          Cobrar
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <!-- Préstamos Próximos a Terminar / Terminados -->
        <div class="glass-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 16px; font-weight: 700; color: #FFF; display: flex; align-items: center; gap: 8px;">
              <span>🎯</span> Oportunidades de Renovación
            </h3>
            <span class="badge badge-success">${metrics.nearFinishLoans.length} por liquidar</span>
          </div>

          ${metrics.nearFinishLoans.length === 0 ? `
            <div style="text-align: center; padding: 30px; color: var(--text-subtle);">
              <div style="font-size: 32px; margin-bottom: 8px;">🎯</div>
              <p>No hay préstamos al borde de liquidación en este momento.</p>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${metrics.nearFinishLoans.map(loan => `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="color: var(--text-main); font-size: 14px;">${loan.clientName}</strong>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                      Saldo rest: <strong class="mono" style="color: var(--accent-cyan);">${Formatters.currency(loan.remainingBalance, symbol)}</strong> • Cuota ${loan.currentQuotaDisplay}
                    </div>
                  </div>
                  <button class="btn btn-secondary btn-sm" onclick="window.appRouter.openLoanDetail('${loan.id}')">
                    Ver Detalle
                  </button>
                </div>
              `).join('')}
            </div>
          `}
        </div>

      </div>
    `;
  }
}
