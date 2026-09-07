/**
 * Vista y Módulo de Registro de Pagos PrestaPro
 * Sincronización en cascada, pagos parciales, liquidación y recibo automático
 */
import { db } from '../store/db.js';
import { Formatters } from '../utils/formatters.js';
import { Notifications } from '../utils/notifications.js';

export class PaymentsView {
  static render(container, options = {}) {
    const receipts = db.getReceipts();
    const business = db.getBusinessSettings();
    const symbol = business.currencySymbol || '$';

    container.innerHTML = `
      <div class="filter-bar">
        <div>
          <h3 style="font-size: 18px; font-weight: 700; color: #FFF;">Historial General de Cobros y Pagos</h3>
          <p style="font-size: 13px; color: var(--text-muted);">Registro ordenado de todas las transacciones cobradas</p>
        </div>

        <button class="btn btn-emerald" onclick="window.paymentsView.openRegisterPaymentModal()">
          <span>💵</span> Registrar Nuevo Pago
        </button>
      </div>

      <!-- Tabla de Pagos Realizados -->
      <div class="glass-card" style="padding: 0; overflow: hidden;">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Recibo #</th>
                <th>Fecha y Hora</th>
                <th>Cliente</th>
                <th>Préstamo</th>
                <th>Concepto / Cuota</th>
                <th>Método</th>
                <th class="text-right">Monto Pagado</th>
                <th class="text-right">Saldo Restante</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${receipts.length === 0 ? `
                <tr>
                  <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-subtle);">
                    No se han registrado pagos aún.
                  </td>
                </tr>
              ` : receipts.map(r => `
                <tr>
                  <td>
                    <strong class="mono" style="color: var(--accent-cyan);">${r.receiptNumber}</strong>
                  </td>
                  <td>${Formatters.dateTime(r.date)}</td>
                  <td>
                    <strong>${r.clientName}</strong>
                    <div style="font-size: 11px; color: var(--text-subtle);">${r.clientPhone || ''}</div>
                  </td>
                  <td>
                    <span class="mono">${r.loanId}</span>
                  </td>
                  <td>${r.quotaNumber}</td>
                  <td>
                    <span class="badge badge-neutral">${r.paymentMethod}</span>
                  </td>
                  <td class="text-right mono font-bold" style="color: #34D399; font-size: 14px;">
                    ${Formatters.currency(r.amount, symbol)}
                  </td>
                  <td class="text-right mono" style="color: var(--text-muted);">
                    ${Formatters.currency(r.remainingBalance, symbol)}
                  </td>
                  <td class="text-center">
                    <div style="display: flex; gap: 6px; justify-content: center;">
                      <button class="btn btn-secondary btn-sm" onclick="window.appRouter.openReceipt('${r.receiptNumber}')" title="Ver e Imprimir Recibo">
                        🧾 Recibo
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    window.paymentsView = this;
  }

  /**
   * Modal Interactivo de Cobro / Registro de Pago
   */
  static openRegisterPaymentModal(targetLoanId = null, targetQuotaNumber = null) {
    const loans = db.getLoans().filter(l => l.remainingBalance > 0.01);
    const business = db.getBusinessSettings();
    const symbol = business.currencySymbol || '$';
    const nowLocal = new Date().toISOString().slice(0, 16);

    const selectedLoan = targetLoanId ? db.getLoanById(targetLoanId) : (loans.length > 0 ? loans[0] : null);

    const modal = document.getElementById('global-modal');
    const modalContent = document.getElementById('global-modal-content');

    modalContent.innerHTML = `
      <div class="modal-card modal-card-lg">
        <div class="modal-header">
          <h3 class="modal-title"><span>💵</span> Registrar Pago de Préstamo</h3>
          <button class="modal-close-btn" onclick="window.appRouter.closeModal()">✕</button>
        </div>

        <form id="payment-form" onsubmit="window.paymentsView.handleSubmitPayment(event)">
          <div class="modal-body">
            
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Seleccionar Préstamo Activo *</label>
                <select name="loanId" id="pay-loan-select" class="form-control" required onchange="window.paymentsView.handleLoanChange(this.value)">
                  ${loans.length === 0 ? '<option value="">No hay préstamos con saldo pendiente</option>' : ''}
                  ${loans.map(l => `
                    <option value="${l.id}" ${selectedLoan && selectedLoan.id === l.id ? 'selected' : ''}>
                      ${l.id} - ${l.clientName} (Saldo: ${Formatters.currency(l.remainingBalance, symbol)})
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Cuota a Pagar</label>
                <select name="quotaNumber" id="pay-quota-select" class="form-control" onchange="window.paymentsView.handleQuotaChange(this.value)">
                  <!-- Se llena dinámicamente -->
                </select>
              </div>
            </div>

            <!-- Accesos Rápidos de Monto -->
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 18px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">
                  Modo de Pago Rápido
                </span>
                <span id="loan-balance-indicator" class="mono" style="font-size: 13px; color: var(--accent-cyan);">
                  <!-- Balance actual -->
                </span>
              </div>

              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button type="button" class="btn btn-secondary btn-sm" id="btn-pay-quota" onclick="window.paymentsView.setQuotaAmount()">
                  Pagar Cuota Completa
                </button>
                <button type="button" class="btn btn-secondary btn-sm" id="btn-liquidate" onclick="window.paymentsView.setLiquidateAmount()">
                  ✨ Liquidar Préstamo Completo
                </button>
              </div>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label class="form-label">Monto a Registrar (${symbol}) *</label>
                <input type="number" step="0.01" name="amount" id="pay-amount" class="form-control mono font-bold" required style="font-size: 18px; color: #34D399;" />
              </div>

              <div class="form-group">
                <label class="form-label">Método de Pago *</label>
                <select name="paymentMethod" class="form-control" required>
                  <option value="Efectivo" selected>💵 Efectivo</option>
                  <option value="Transferencia">🏦 Transferencia Bancaria</option>
                  <option value="Tarjeta">💳 Tarjeta Débito/Crédito</option>
                  <option value="Otro">Otro medio</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Fecha y Hora *</label>
                <input type="datetime-local" name="date" class="form-control" required value="${nowLocal}" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Notas Opcionales / Referencia de Transferencia</label>
              <input type="text" name="notes" class="form-control" placeholder="Ej: No. de transferencia 489218 / Abono realizado en oficina" />
            </div>

          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="window.appRouter.closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-emerald">
              <span>🧾</span> Procesar Pago y Emitir Recibo
            </button>
          </div>
        </form>
      </div>
    `;

    modal.classList.add('active');

    if (selectedLoan) {
      this.populateQuotas(selectedLoan, targetQuotaNumber);
    }
  }

  static handleLoanChange(loanId) {
    const loan = db.getLoanById(loanId);
    if (loan) this.populateQuotas(loan);
  }

  static populateQuotas(loan, preferredQuota = null) {
    const quotaSelect = document.getElementById('pay-quota-select');
    const balanceIndicator = document.getElementById('loan-balance-indicator');
    const symbol = db.getBusinessSettings().currencySymbol || '$';

    if (balanceIndicator) {
      balanceIndicator.innerHTML = `Saldo pendiente del préstamo: <strong>${Formatters.currency(loan.remainingBalance, symbol)}</strong>`;
    }

    if (!quotaSelect) return;
    quotaSelect.innerHTML = '';

    // Opción abono general
    const generalOpt = document.createElement('option');
    generalOpt.value = '';
    generalOpt.textContent = `Abono General a Saldo Restante`;
    quotaSelect.appendChild(generalOpt);

    let defaultSelectInst = null;

    loan.schedule.forEach(inst => {
      if (inst.status !== 'PAGADA') {
        const opt = document.createElement('option');
        opt.value = inst.number;
        opt.textContent = `Cuota ${inst.number} (${Formatters.date(inst.date)}) - Pendiente: ${Formatters.currency(inst.pendingAmount, symbol)}`;
        if (preferredQuota && inst.number === preferredQuota) {
          opt.selected = true;
          defaultSelectInst = inst;
        } else if (!defaultSelectInst) {
          defaultSelectInst = inst;
        }
        quotaSelect.appendChild(opt);
      }
    });

    if (defaultSelectInst && !preferredQuota) {
      quotaSelect.value = defaultSelectInst.number;
    }

    this.handleQuotaChange(quotaSelect.value);
  }

  static handleQuotaChange(quotaNumber) {
    const loanId = document.getElementById('pay-loan-select')?.value;
    const loan = db.getLoanById(loanId);
    if (!loan) return;

    const amountInput = document.getElementById('pay-amount');
    if (!amountInput) return;

    if (quotaNumber) {
      const inst = loan.schedule.find(s => s.number === parseInt(quotaNumber, 10));
      if (inst) {
        amountInput.value = inst.pendingAmount;
        return;
      }
    }
    amountInput.value = loan.quotaAmount;
  }

  static setQuotaAmount() {
    const loanId = document.getElementById('pay-loan-select')?.value;
    const loan = db.getLoanById(loanId);
    const quotaNumber = document.getElementById('pay-quota-select')?.value;
    const amountInput = document.getElementById('pay-amount');
    if (!loan || !amountInput) return;

    if (quotaNumber) {
      const inst = loan.schedule.find(s => s.number === parseInt(quotaNumber, 10));
      if (inst) {
        amountInput.value = inst.pendingAmount;
        return;
      }
    }
    amountInput.value = loan.quotaAmount;
  }

  static setLiquidateAmount() {
    const loanId = document.getElementById('pay-loan-select')?.value;
    const loan = db.getLoanById(loanId);
    const amountInput = document.getElementById('pay-amount');
    if (loan && amountInput) {
      amountInput.value = loan.remainingBalance;
    }
  }

  static handleSubmitPayment(e) {
    e.preventDefault();
    const form = e.target;

    try {
      const { updatedLoan, receipt } = db.addPayment({
        loanId: form.loanId.value,
        amount: form.amount.value,
        paymentMethod: form.paymentMethod.value,
        notes: form.notes.value,
        installmentNumber: form.quotaNumber.value ? parseInt(form.quotaNumber.value, 10) : null,
        date: form.date.value ? new Date(form.date.value).toISOString() : null
      });

      window.appRouter.closeModal();
      window.appRouter.showToast(`Pago procesado con éxito. Recibo #${receipt.receiptNumber}`);
      Notifications.show('PrestaPro: pago registrado', {
        body: `Se registró un pago de ${receipt.amount} de ${receipt.clientName}.`,
        tag: `payment-${receipt.receiptNumber}`
      });
      
      // Abre inmediatamente el recibo generado
      window.appRouter.openReceipt(receipt.receiptNumber);
    } catch (err) {
      alert('Error al registrar pago: ' + err.message);
    }
  }
}
