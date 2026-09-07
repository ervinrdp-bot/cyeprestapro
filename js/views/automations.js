/**
 * Vista de Automatizaciones y Recordatorios de WhatsApp PrestaPro
 */
import { db } from '../store/db.js';
import { Formatters } from '../utils/formatters.js';
import { WhatsAppHelper } from '../utils/whatsapp_helper.js';
import { Notifications } from '../utils/notifications.js';

export class AutomationsView {
  static render(container) {
    const automations = db.getAutomations();
    const loans = db.getLoans();
    const business = db.getBusinessSettings();
    const symbol = business.currencySymbol || '$';
    const todayStr = new Date().toISOString().split('T')[0];

    // Detectar qué clientes califican para mensajes en este momento
    const pendingActions = [];

    loans.forEach(loan => {
      if (loan.remainingBalance <= 0.01) return;

      loan.schedule.forEach(inst => {
        if (inst.status !== 'PAGADA') {
          const isToday = inst.date === todayStr;
          const isOverdue = inst.date < todayStr;
          
          if (isToday) {
            pendingActions.push({
              type: 'TODAY',
              typeLabel: 'Vence Hoy',
              badgeClass: 'badge-warning',
              loanId: loan.id,
              clientName: loan.clientName,
              clientPhone: loan.clientPhone,
              amount: inst.pendingAmount,
              date: inst.date,
              quotaNumber: inst.number,
              balance: loan.remainingBalance
            });
          } else if (isOverdue) {
            pendingActions.push({
              type: 'OVERDUE',
              typeLabel: 'Atrasado / Mora',
              badgeClass: 'badge-danger',
              loanId: loan.id,
              clientName: loan.clientName,
              clientPhone: loan.clientPhone,
              amount: inst.pendingAmount,
              date: inst.date,
              quotaNumber: inst.number,
              balance: loan.remainingBalance
            });
          }
        }
      });
    });

    container.innerHTML = `
      <div class="filter-bar">
        <div>
          <h3 style="font-size: 18px; font-weight: 700; color: #FFF;">Centro de Automatizaciones y Recordatorios WhatsApp</h3>
          <p style="font-size: 13px; color: var(--text-muted);">Envío inteligente de cobranza y avisos automáticos con plantillas dinámicas</p>
        </div>

        <button class="btn btn-emerald" onclick="window.automationsView.sendBatchToday()">
          <span>⚡</span> Enviar Todos los Avisos de Hoy
        </button>
        <button class="btn btn-secondary" onclick="window.automationsView.enableNotifications()">
          <span>🔔</span> Activar Notificaciones
        </button>
      </div>

      <!-- Bandeja de Mensajes Sugeridos para Enviar Hoy -->
      <div class="glass-card" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <h4 style="font-size: 16px; font-weight: 700; color: #FFF; display: flex; align-items: center; gap: 8px;">
              <span>💬</span> Clientes Listos para Enviar Recordatorio
            </h4>
            <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
              Clientes con cuotas para hoy o con pagos atrasados que requieren atención
            </p>
          </div>
          <span class="badge badge-info">${pendingActions.length} pendientes</span>
        </div>

        ${pendingActions.length === 0 ? `
          <div style="text-align: center; padding: 30px; color: var(--text-subtle);">
            <div style="font-size: 32px; margin-bottom: 8px;">🎉</div>
            <p>¡Excelente! No hay clientes con pagos vencidos ni vencimientos pendientes sin atender hoy.</p>
          </div>
        ` : `
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Motivo</th>
                  <th class="text-right">Monto Cuota</th>
                  <th class="text-right">Saldo Total</th>
                  <th class="text-center">Mensaje Dinámico</th>
                  <th class="text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                ${pendingActions.map((item, idx) => `
                  <tr>
                    <td>
                      <strong>${item.clientName}</strong>
                      <div style="font-size: 11px; color: var(--text-subtle);">${item.loanId} (Cuota ${item.quotaNumber})</div>
                    </td>
                    <td class="mono">${item.clientPhone}</td>
                    <td>
                      <span class="badge ${item.badgeClass}">${item.typeLabel}</span>
                    </td>
                    <td class="text-right mono font-bold" style="color: #F87171;">
                      ${Formatters.currency(item.amount, symbol)}
                    </td>
                    <td class="text-right mono font-bold" style="color: var(--accent-cyan);">
                      ${Formatters.currency(item.balance, symbol)}
                    </td>
                    <td style="max-width: 250px; font-size: 11px; color: var(--text-muted); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                      ${this.previewMessage(item, automations, business)}
                    </td>
                    <td class="text-center">
                      <button class="btn btn-emerald btn-sm" onclick="window.automationsView.sendDirectMessage(${idx})">
                        💬 Enviar WhatsApp
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Configuración de Reglas y Plantillas Dinámicas -->
      <div class="glass-card">
        <h4 style="font-size: 16px; font-weight: 700; color: #FFF; margin-bottom: 6px;">
          ⚙️ Plantillas Dinámicas y Reglas de Envío
        </h4>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 20px;">
          Personaliza los textos. Variables disponibles: <code style="color: var(--accent-cyan); font-family: monospace;">[nombre]</code>, <code style="color: var(--accent-cyan); font-family: monospace;">[monto]</code>, <code style="color: var(--accent-cyan); font-family: monospace;">[fecha]</code>, <code style="color: var(--accent-cyan); font-family: monospace;">[saldo]</code>, <code style="color: var(--accent-cyan); font-family: monospace;">[negocio]</code>
        </p>

        <form id="automations-form" onsubmit="window.automationsView.saveAutomations(event)" style="display: flex; flex-direction: column; gap: 16px;">
          
          <!-- Regla: Recordatorio 3 días antes -->
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="font-weight: 700; font-size: 14px; color: #FFF;">
                📅 3 Días Antes del Vencimiento
              </label>
              <input type="checkbox" name="reminder3Days_enabled" ${automations.reminder3Days?.enabled ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
            </div>
            <textarea name="reminder3Days_template" class="form-control" rows="2">${automations.reminder3Days?.template || ''}</textarea>
          </div>

          <!-- Regla: Recordatorio 1 día antes -->
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="font-weight: 700; font-size: 14px; color: #FFF;">
                ⏰ 1 Día Antes del Vencimiento
              </label>
              <input type="checkbox" name="reminder1Day_enabled" ${automations.reminder1Day?.enabled ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
            </div>
            <textarea name="reminder1Day_template" class="form-control" rows="2">${automations.reminder1Day?.template || ''}</textarea>
          </div>

          <!-- Regla: Día del vencimiento -->
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="font-weight: 700; font-size: 14px; color: #FFF;">
                🚨 Día del Vencimiento (Hoy)
              </label>
              <input type="checkbox" name="reminderToday_enabled" ${automations.reminderToday?.enabled ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
            </div>
            <textarea name="reminderToday_template" class="form-control" rows="2">${automations.reminderToday?.template || ''}</textarea>
          </div>

          <!-- Regla: Pago Vencido / Atrasado -->
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="font-weight: 700; font-size: 14px; color: #F87171;">
                ⚠️ Aviso de Pago Vencido (Atrasado)
              </label>
              <input type="checkbox" name="reminderOverdue_enabled" ${automations.reminderOverdue?.enabled ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
            </div>
            <textarea name="reminderOverdue_template" class="form-control" rows="2">${automations.reminderOverdue?.template || ''}</textarea>
          </div>

          <!-- Regla: Confirmación de Pago -->
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="font-weight: 700; font-size: 14px; color: #34D399;">
                💰 Confirmación Inmediata de Pago
              </label>
              <input type="checkbox" name="paymentConfirmed_enabled" ${automations.paymentConfirmed?.enabled ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
            </div>
            <textarea name="paymentConfirmed_template" class="form-control" rows="2">${automations.paymentConfirmed?.template || ''}</textarea>
          </div>

          <!-- Regla: Préstamo Terminado -->
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="font-weight: 700; font-size: 14px; color: var(--accent-cyan);">
                🎉 Felicitación por Préstamo Terminado / Invitación a Renovación
              </label>
              <input type="checkbox" name="loanFinished_enabled" ${automations.loanFinished?.enabled ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
            </div>
            <textarea name="loanFinished_template" class="form-control" rows="2">${automations.loanFinished?.template || ''}</textarea>
          </div>

          <div style="text-align: right; margin-top: 10px;">
            <button type="submit" class="btn btn-primary">
              💾 Guardar Plantillas y Configuración
            </button>
          </div>
        </form>
      </div>
    `;

    this.pendingActionsCache = pendingActions;
    window.automationsView = this;
  }

  static async enableNotifications() {
    const permission = await Notifications.requestPermission();
    const message = permission === 'granted'
      ? 'Notificaciones activadas en este dispositivo.'
      : 'No se concedió permiso para notificaciones.';
    window.appRouter.showToast(message, permission === 'granted' ? 'info' : 'error');
    if (permission === 'granted') Notifications.notifyDuePayments();
  }

  static previewMessage(item, automations, business) {
    const symbol = business.currencySymbol || '$';
    const template = item.type === 'OVERDUE' 
      ? automations.reminderOverdue?.template 
      : automations.reminderToday?.template;

    return WhatsAppHelper.parseTemplate(template, {
      clientName: item.clientName,
      amount: Formatters.currency(item.amount, symbol),
      date: Formatters.date(item.date),
      saldo: Formatters.currency(item.balance, symbol),
      businessName: business.name
    });
  }

  static sendDirectMessage(index) {
    const item = this.pendingActionsCache[index];
    if (!item) return;

    const automations = db.getAutomations();
    const business = db.getBusinessSettings();
    const message = this.previewMessage(item, automations, business);

    WhatsAppHelper.openWhatsApp(item.clientPhone, message);
  }

  static sendBatchToday() {
    if (!this.pendingActionsCache || this.pendingActionsCache.length === 0) {
      alert('No hay recordatorios pendientes en este momento.');
      return;
    }
    // Abrir el primero
    this.sendDirectMessage(0);
    window.appRouter.showToast(`Abriendo recordatorio para ${this.pendingActionsCache[0].clientName}`);
  }

  static saveAutomations(e) {
    e.preventDefault();
    const form = e.target;

    const newAutomations = {
      reminder3Days: {
        enabled: form.reminder3Days_enabled.checked,
        template: form.reminder3Days_template.value
      },
      reminder1Day: {
        enabled: form.reminder1Day_enabled.checked,
        template: form.reminder1Day_template.value
      },
      reminderToday: {
        enabled: form.reminderToday_enabled.checked,
        template: form.reminderToday_template.value
      },
      reminderOverdue: {
        enabled: form.reminderOverdue_enabled.checked,
        template: form.reminderOverdue_template.value
      },
      paymentConfirmed: {
        enabled: form.paymentConfirmed_enabled.checked,
        template: form.paymentConfirmed_template.value
      },
      loanFinished: {
        enabled: form.loanFinished_enabled.checked,
        template: form.loanFinished_template.value
      }
    };

    db.updateAutomations(newAutomations);
    window.appRouter.showToast('Automatizaciones y plantillas guardadas correctamente.');
  }
}
