/**
 * Vista del Módulo de Amortizaciones PrestaPro
 * Tablas detalladas, simulador y exportación
 */
import { db } from '../store/db.js';
import { LoanEngine } from '../models/loan_engine.js';
import { Formatters } from '../utils/formatters.js';
import { PdfExporter } from '../utils/pdf_exporter.js';
import { WhatsAppHelper } from '../utils/whatsapp_helper.js';

export class AmortizationsView {
  static selectedLoanId = null;

  static render(container, options = {}) {
    const loans = db.getLoans();
    const business = db.getBusinessSettings();
    const symbol = business.currencySymbol || '$';

    if (!this.selectedLoanId && loans.length > 0) {
      this.selectedLoanId = loans[0].id;
    }
    if (options.loanId) {
      this.selectedLoanId = options.loanId;
    }

    const currentLoan = db.getLoanById(this.selectedLoanId);

    container.innerHTML = `
      <div class="filter-bar">
        <div>
          <h3 style="font-size: 18px; font-weight: 700; color: #FFF;">Tablas de Amortización y Cronogramas</h3>
          <p style="font-size: 13px; color: var(--text-muted);">Visualiza, descarga y comparte los planes de pago</p>
        </div>

        <div style="display: flex; gap: 10px; align-items: center;">
          <select id="amort-loan-picker" class="form-control" style="width: auto; min-width: 250px;" onchange="window.amortizationsView.switchLoan(this.value)">
            ${loans.map(l => `
              <option value="${l.id}" ${this.selectedLoanId === l.id ? 'selected' : ''}>
                ${l.id} - ${l.clientName} (${l.currentQuotaDisplay})
              </option>
            `).join('')}
          </select>

          ${currentLoan ? `
            <button class="btn btn-secondary" onclick="window.amortizationsView.printCurrent()">
              🖨️ PDF / Imprimir
            </button>
            <button class="btn btn-emerald" onclick="window.amortizationsView.shareWhatsApp()">
              💬 Compartir WhatsApp
            </button>
          ` : ''}
        </div>
      </div>

      ${!currentLoan ? `
        <div class="glass-card" style="text-align: center; padding: 50px; color: var(--text-muted);">
          No hay préstamos disponibles para mostrar amortización.
        </div>
      ` : `
        <!-- Resumen del Préstamo Seleccionado -->
        <div class="glass-card" style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px;">
            <div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <h3 style="font-size: 18px; font-weight: 700; color: #FFF;">${currentLoan.clientName}</h3>
                <span class="mono" style="font-size: 13px; color: var(--accent-cyan);">${currentLoan.id}</span>
                ${Formatters.statusBadge(currentLoan.status)}
              </div>
              <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                Fecha de Entrega: <strong>${Formatters.date(currentLoan.issueDate)}</strong> • 
                Frecuencia: <strong style="text-transform: capitalize;">${currentLoan.frequency}</strong> • 
                Tasa de Interés: <strong>${currentLoan.interestRate}% Fijo</strong>
              </p>
            </div>

            <div style="display: flex; gap: 20px; font-size: 13px;">
              <div>
                <span style="color: var(--text-subtle); display: block;">Monto Prestado:</span>
                <strong class="mono" style="font-size: 16px; color: #FFF;">${Formatters.currency(currentLoan.principal, symbol)}</strong>
              </div>
              <div>
                <span style="color: var(--text-subtle); display: block;">Interés Total:</span>
                <strong class="mono" style="font-size: 16px; color: #FBBF24;">${Formatters.currency(currentLoan.totalInterest, symbol)}</strong>
              </div>
              <div>
                <span style="color: var(--text-subtle); display: block;">Total a Pagar:</span>
                <strong class="mono" style="font-size: 16px; color: #34D399;">${Formatters.currency(currentLoan.totalToPay, symbol)}</strong>
              </div>
              <div>
                <span style="color: var(--text-subtle); display: block;">Saldo Restante:</span>
                <strong class="mono" style="font-size: 16px; color: var(--accent-cyan);">${Formatters.currency(currentLoan.remainingBalance, symbol)}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabla Completa de Amortización -->
        <div class="glass-card" style="padding: 0; overflow: hidden;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="text-center">No. Cuota</th>
                  <th>Fecha de Vencimiento</th>
                  <th class="text-right">Monto Cuota</th>
                  <th class="text-right">Abono Capital</th>
                  <th class="text-right">Interés Fijo</th>
                  <th class="text-right">Pagado</th>
                  <th class="text-right">Pendiente</th>
                  <th class="text-center">Estado</th>
                  <th class="text-right">Saldo Posterior</th>
                  <th class="text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                ${currentLoan.schedule.map(inst => `
                  <tr>
                    <td class="text-center mono font-bold">${inst.number} / ${currentLoan.installmentsCount}</td>
                    <td>
                      <div>${Formatters.date(inst.date)}</div>
                      <div style="font-size: 11px; color: var(--text-subtle);">${Formatters.relativeDate(inst.date)}</div>
                    </td>
                    <td class="text-right mono font-bold" style="color: #FFF;">${Formatters.currency(inst.amount, symbol)}</td>
                    <td class="text-right mono">${Formatters.currency(inst.capital, symbol)}</td>
                    <td class="text-right mono">${Formatters.currency(inst.interest, symbol)}</td>
                    <td class="text-right mono font-bold" style="color: #34D399;">${Formatters.currency(inst.paidAmount, symbol)}</td>
                    <td class="text-right mono font-bold" style="color: ${inst.pendingAmount > 0 ? '#F87171' : 'var(--text-subtle)'};">${Formatters.currency(inst.pendingAmount, symbol)}</td>
                    <td class="text-center">${Formatters.statusBadge(inst.status)}</td>
                    <td class="text-right mono font-bold" style="color: var(--accent-cyan);">${Formatters.currency(inst.balanceAfter, symbol)}</td>
                    <td class="text-center">
                      ${inst.status !== 'PAGADA' ? `
                        <button class="btn btn-emerald btn-sm" onclick="window.appRouter.openPaymentModal('${currentLoan.id}', ${inst.number})">
                          Cobrar
                        </button>
                      ` : '✔️'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `}
    `;

    window.amortizationsView = this;
  }

  static switchLoan(loanId) {
    this.selectedLoanId = loanId;
    this.render(document.getElementById('content-area'));
  }

  static printCurrent() {
    const loan = db.getLoanById(this.selectedLoanId);
    if (!loan) return;
    const client = db.getClientById(loan.clientId) || { name: loan.clientName, phone: loan.clientPhone };
    const business = db.getBusinessSettings();
    PdfExporter.printAmortization(loan, client, business);
  }

  static shareWhatsApp() {
    const loan = db.getLoanById(this.selectedLoanId);
    if (!loan) return;
    const business = db.getBusinessSettings();
    const symbol = business.currencySymbol || '$';

    const message = `Hola ${loan.clientName}. Te compartimos el resumen de tu préstamo ${loan.id} en ${business.name}:
- Monto Prestado: ${Formatters.currency(loan.principal, symbol)}
- Total a Pagar: ${Formatters.currency(loan.totalToPay, symbol)}
- Cuota: ${Formatters.currency(loan.quotaAmount, symbol)} (${loan.installmentsCount} cuotas ${loan.frequency}es)
- Saldo Pendiente Actual: ${Formatters.currency(loan.remainingBalance, symbol)}
Para cualquier duda estamos a tu orden.`;

    WhatsAppHelper.openWhatsApp(loan.clientPhone, message);
  }
}
