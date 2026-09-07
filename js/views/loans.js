/**
 * Vista de Gestión de Préstamos PrestaPro
 * Creación con cálculo de interés fijo en tiempo real, desglose, amortización y edición
 */
import { db } from '../store/db.js';
import { LoanEngine } from '../models/loan_engine.js';
import { Formatters } from '../utils/formatters.js';
import { PdfExporter } from '../utils/pdf_exporter.js';

export class LoansView {
  static currentFilter = 'ALL';
  static searchQuery = '';

  static render(container, options = {}) {
    const loans = db.getLoans();
    const business = db.getBusinessSettings();
    const symbol = business.currencySymbol || '$';

    if (options.openModal) {
      setTimeout(() => this.openNewLoanModal(options.prefillClientId), 100);
    }
    if (options.filter) {
      this.currentFilter = options.filter;
    }

    const filtered = loans.filter(l => {
      const matchesSearch = !this.searchQuery ||
        l.clientName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        l.id.toLowerCase().includes(this.searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (this.currentFilter === 'ALL') return true;
      if (this.currentFilter === 'ACTIVO') return l.status === 'ACTIVO';
      if (this.currentFilter === 'PROXIMO') return l.status === 'PROXIMO';
      if (this.currentFilter === 'ATRASADO') return l.status === 'ATRASADO';
      if (this.currentFilter === 'TERMINADO') return l.status === 'TERMINADO';
      return true;
    });

    container.innerHTML = `
      <div class="filter-bar">
        <div class="search-input-wrapper">
          <i>🔍</i>
          <input 
            type="text" 
            placeholder="Buscar por cliente o ID de préstamo..." 
            value="${this.searchQuery}"
            oninput="window.loansView.handleSearch(this.value)"
          />
        </div>

        <div class="filter-tabs">
          <button class="filter-tab ${this.currentFilter === 'ALL' ? 'active' : ''}" onclick="window.loansView.setFilter('ALL')">
            Todos (${loans.length})
          </button>
          <button class="filter-tab ${this.currentFilter === 'ACTIVO' ? 'active' : ''}" onclick="window.loansView.setFilter('ACTIVO')">
            🟢 Activos
          </button>
          <button class="filter-tab ${this.currentFilter === 'PROXIMO' ? 'active' : ''}" onclick="window.loansView.setFilter('PROXIMO')">
            🟡 Próximos
          </button>
          <button class="filter-tab ${this.currentFilter === 'ATRASADO' ? 'active' : ''}" onclick="window.loansView.setFilter('ATRASADO')">
            🔴 Atrasados
          </button>
          <button class="filter-tab ${this.currentFilter === 'TERMINADO' ? 'active' : ''}" onclick="window.loansView.setFilter('TERMINADO')">
            ✅ Pagados
          </button>
        </div>

        <button class="btn btn-primary" onclick="window.loansView.openNewLoanModal()">
          <span>➕</span> Nuevo Préstamo
        </button>
      </div>

      <!-- Tabla de Préstamos -->
      <div class="glass-card" style="padding: 0; overflow: hidden;">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Préstamo</th>
                <th>Cliente</th>
                <th class="text-right">Monto Original</th>
                <th class="text-right">Total a Pagar</th>
                <th class="text-right">Total Pagado</th>
                <th class="text-right">Saldo Pendiente</th>
                <th class="text-center">Cuota Actual</th>
                <th class="text-center">Estado</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-subtle);">
                    No se encontraron préstamos con el filtro seleccionado.
                  </td>
                </tr>
              ` : filtered.map(l => `
                <tr style="cursor: pointer;" onclick="window.loansView.openLoanDetail('${l.id}')">
                  <td>
                    <strong class="mono" style="color: var(--accent-cyan); font-size: 13px;">${l.id}</strong>
                    <div style="font-size: 11px; color: var(--text-subtle);">${Formatters.date(l.issueDate)}</div>
                  </td>
                  <td>
                    <strong style="color: var(--text-main); font-size: 14px;">${l.clientName}</strong>
                    <div style="font-size: 11px; color: var(--text-subtle);">${l.clientPhone}</div>
                  </td>
                  <td class="text-right mono font-bold">${Formatters.currency(l.principal, symbol)}</td>
                  <td class="text-right mono font-bold">${Formatters.currency(l.totalToPay, symbol)}</td>
                  <td class="text-right mono font-bold" style="color: #34D399;">${Formatters.currency(l.totalPaid, symbol)}</td>
                  <td class="text-right mono font-bold" style="color: ${l.remainingBalance > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)'};">
                    ${Formatters.currency(l.remainingBalance, symbol)}
                  </td>
                  <td class="text-center mono font-bold" style="color: #FFF;">
                    ${l.currentQuotaDisplay}
                  </td>
                  <td class="text-center">
                    ${Formatters.statusBadge(l.status)}
                  </td>
                  <td class="text-center" onclick="event.stopPropagation()">
                    <div style="display: flex; gap: 6px; justify-content: center;">
                      ${l.remainingBalance > 0 ? `
                        <button class="btn btn-emerald btn-sm" onclick="window.appRouter.openPaymentModal('${l.id}')" title="Registrar Pago">
                          💵 Pagar
                        </button>
                      ` : ''}
                      <button class="btn btn-secondary btn-sm" onclick="window.loansView.openLoanDetail('${l.id}')" title="Ver Detalle y Amortización">
                        👁️
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

    window.loansView = this;
  }

  static setFilter(f) {
    this.currentFilter = f;
    this.render(document.getElementById('content-area'));
  }

  static handleSearch(q) {
    this.searchQuery = q;
    this.render(document.getElementById('content-area'));
  }

  /**
   * Modal de Creación de Préstamo con Vista Previa en Vivo de Cálculos
   */
  static openNewLoanModal(prefillClientId = null) {
    const clients = db.getClients();
    const business = db.getBusinessSettings();
    const symbol = business.currencySymbol || '$';
    const todayStr = new Date().toISOString().split('T')[0];

    const modal = document.getElementById('global-modal');
    const modalContent = document.getElementById('global-modal-content');

    modalContent.innerHTML = `
      <div class="modal-card modal-card-lg">
        <div class="modal-header">
          <h3 class="modal-title"><span>➕</span> Crear Nuevo Préstamo</h3>
          <button class="modal-close-btn" onclick="window.appRouter.closeModal()">✕</button>
        </div>
        <form id="new-loan-form" onsubmit="window.loansView.handleCreateLoan(event)">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Seleccionar Cliente *</label>
              <select name="clientId" id="loan-client-select" class="form-control" required>
                <option value="">-- Seleccione un cliente registrado --</option>
                ${clients.map(c => `
                  <option value="${c.id}" ${prefillClientId === c.id ? 'selected' : ''}>
                    ${c.name} (${c.id}) - ${c.phone}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label class="form-label">Monto Prestado (${symbol}) *</label>
                <input type="number" step="0.01" name="principal" id="loan-principal" class="form-control mono" required value="1000" oninput="window.loansView.updatePreview()" />
              </div>

              <div class="form-group">
                <label class="form-label">Interés Mensual (%) *</label>
                <div style="position: relative;">
                  <input type="number" step="0.1" name="interestRate" id="loan-rate" class="form-control mono" required value="${business.defaultInterestRate || 10}" oninput="window.loansView.updatePreview()" />
                  <span style="position: absolute; right: 12px; top: 11px; font-size: 13px; color: var(--accent-cyan); font-weight: 700;">FIJO</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Número de Cuotas *</label>
                <input type="number" min="1" max="120" name="installmentsCount" id="loan-installments" class="form-control mono" required value="${business.defaultInstallments || 5}" oninput="window.loansView.updatePreview()" />
              </div>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label class="form-label">Frecuencia de Pago *</label>
                <select name="frequency" id="loan-frequency" class="form-control" onchange="window.loansView.updatePreview()">
                  <option value="semanal" selected>Semanal (cada 7 días)</option>
                  <option value="quincenal">Quincenal (cada 15 días)</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Fecha de Entrega *</label>
                <input type="date" name="issueDate" id="loan-issue-date" class="form-control" required value="${todayStr}" onchange="window.loansView.updatePreview()" />
              </div>

              <div class="form-group">
                <label class="form-label">Fecha Primer Pago *</label>
                <input type="date" name="firstPaymentDate" id="loan-first-payment" class="form-control" required value="${todayStr}" onchange="window.loansView.updatePreview()" />
              </div>
            </div>

            <!-- Caja de Previsualización Inteligente en Vivo -->
            <div class="calc-preview-card" id="loan-calc-preview">
              <!-- Se actualiza reactivamente por JS -->
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="window.appRouter.closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">
              <span>🚀</span> Confirmar y Crear Préstamo
            </button>
          </div>
        </form>
      </div>
    `;

    modal.classList.add('active');
    this.updatePreview();
  }

  static updatePreview() {
    const principal = parseFloat(document.getElementById('loan-principal')?.value) || 0;
    const rate = parseFloat(document.getElementById('loan-rate')?.value) || 0;
    const n = parseInt(document.getElementById('loan-installments')?.value, 10) || 1;
    const freq = document.getElementById('loan-frequency')?.value || 'semanal';
    const issueDate = document.getElementById('loan-issue-date')?.value;
    const firstDate = document.getElementById('loan-first-payment')?.value;
    const symbol = db.getBusinessSettings().currencySymbol || '$';

    const calc = LoanEngine.calculateLoanPreview({
      principal,
      interestRate: rate,
      installmentsCount: n,
      frequency: freq,
      issueDateStr: issueDate,
      firstPaymentDateStr: firstDate
    });

    const previewContainer = document.getElementById('loan-calc-preview');
    if (!previewContainer) return;

    previewContainer.innerHTML = `
      <div class="calc-preview-header">
        <span style="font-size: 13px; font-weight: 700; color: #FFF;">
          ⚡ Vista Previa del Cálculo (Regla de Interés Fijo Transparente)
        </span>
        <span class="badge badge-info">${calc.installmentsCount} Cuotas ${calc.frequency}es</span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <div class="calc-row">
            <span style="color: var(--text-muted);">Monto Prestado (Capital):</span>
            <span class="mono font-bold">${Formatters.currency(calc.principal, symbol)}</span>
          </div>
          <div class="calc-row">
            <span style="color: var(--text-muted);">Interés Mensual:</span>
            <span class="mono font-bold" style="color: var(--accent-cyan);">${calc.interestRate}%</span>
          </div>
          <div class="calc-row">
            <span style="color: var(--text-muted);">Interés Total a Cobrar:</span>
            <span class="mono font-bold" style="color: #FBBF24;">${Formatters.currency(calc.totalInterest, symbol)}</span>
          </div>
        </div>

        <div>
          <div class="calc-row">
            <span style="color: var(--text-muted);">Capital por Cuota:</span>
            <span class="mono">${Formatters.currency(calc.capitalPerQuota, symbol)}</span>
          </div>
          <div class="calc-row">
            <span style="color: var(--text-muted);">Interés por Cuota:</span>
            <span class="mono">${Formatters.currency(calc.interestPerQuota, symbol)}</span>
          </div>
          <div class="calc-row highlight">
            <span>Monto de Cada Cuota:</span>
            <span class="mono">${Formatters.currency(calc.quotaAmount, symbol)}</span>
          </div>
        </div>
      </div>

      <div style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 14px; font-weight: 700; color: #FFF;">TOTAL A PAGAR POR EL CLIENTE:</span>
        <span class="mono" style="font-size: 20px; font-weight: 800; color: #34D399;">
          ${Formatters.currency(calc.totalToPay, symbol)}
        </span>
      </div>
    `;
  }

  static handleCreateLoan(e) {
    e.preventDefault();
    const form = e.target;

    try {
      const newLoan = db.addLoan({
        clientId: form.clientId.value,
        principal: form.principal.value,
        interestRate: form.interestRate.value,
        installmentsCount: form.installmentsCount.value,
        frequency: form.frequency.value,
        issueDate: form.issueDate.value,
        firstPaymentDate: form.firstPaymentDate.value
      });

      window.appRouter.closeModal();
      window.appRouter.showToast(`Préstamo ${newLoan.id} creado con éxito para ${newLoan.clientName}`);
      this.openLoanDetail(newLoan.id);
    } catch (err) {
      alert('Error al crear préstamo: ' + err.message);
    }
  }

  /**
   * DETALLE DEL PRÉSTAMO: Visualizador de Amortización, Estados y Acciones
   */
  static openLoanDetail(loanId) {
    const loan = db.getLoanById(loanId);
    if (!loan) return;

    const client = db.getClientById(loan.clientId);
    const business = db.getBusinessSettings();
    const symbol = business.currencySymbol || '$';
    const isFinished = loan.remainingBalance <= 0.01;

    const modal = document.getElementById('global-modal');
    const modalContent = document.getElementById('global-modal-content');

    modalContent.innerHTML = `
      <div class="modal-card modal-card-lg">
        <div class="modal-header">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <h3 class="modal-title mono">${loan.id}</h3>
              ${Formatters.statusBadge(loan.status)}
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
              Cliente: <strong>${loan.clientName}</strong> (${loan.clientPhone})
            </div>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="window.loansView.handlePrintAmortization('${loan.id}')" title="Imprimir o Guardar PDF">
              🖨️ PDF Amortización
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.appRouter.openWhatsAppReminder('${loan.id}')" title="Recordatorio por WhatsApp">
              💬 WhatsApp
            </button>
            <button class="modal-close-btn" onclick="window.appRouter.closeModal()">✕</button>
          </div>
        </div>

        <div class="modal-body" style="display: flex; flex-direction: column; gap: 20px;">
          
          <!-- Banner de Préstamo Terminado si el saldo es 0 -->
          ${isFinished ? `
            <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%); border: 2px solid #10B981; border-radius: var(--radius-md); padding: 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <div>
                <h4 style="font-size: 16px; font-weight: 800; color: #34D399; display: flex; align-items: center; gap: 8px;">
                  <span>🎉</span> ¡PRÉSTAMO TERMINADO Y LIQUIDADO!
                </h4>
                <p style="font-size: 12px; color: var(--text-main); margin-top: 4px;">
                  El cliente ha saldado el 100% de la deuda. Puedes renovar su línea de crédito manteniendo todo su historial.
                </p>
              </div>
              <button class="btn btn-emerald" onclick="window.appRouter.closeModal(); window.appRouter.navigate('loans', { openModal: true, prefillClientId: '${loan.clientId}' })">
                <span>➕</span> Crear Nuevo Préstamo
              </button>
            </div>
          ` : ''}

          <!-- Tarjetas de Resumen Financiero del Préstamo -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px;">
              <div style="font-size: 11px; color: var(--text-subtle);">Monto Original</div>
              <div class="mono font-bold" style="font-size: 16px; color: #FFF;">${Formatters.currency(loan.principal, symbol)}</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px;">
              <div style="font-size: 11px; color: var(--text-subtle);">Interés (${loan.interestRate}%)</div>
              <div class="mono font-bold" style="font-size: 16px; color: #FBBF24;">${Formatters.currency(loan.totalInterest, symbol)}</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px;">
              <div style="font-size: 11px; color: var(--text-subtle);">Total Pagado</div>
              <div class="mono font-bold" style="font-size: 16px; color: #34D399;">${Formatters.currency(loan.totalPaid, symbol)}</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px;">
              <div style="font-size: 11px; color: var(--text-subtle);">Saldo Pendiente</div>
              <div class="mono font-bold" style="font-size: 16px; color: var(--accent-cyan);">${Formatters.currency(loan.remainingBalance, symbol)}</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px;">
              <div style="font-size: 11px; color: var(--text-subtle);">Cuota Actual</div>
              <div class="mono font-bold" style="font-size: 16px; color: #FFF;">${loan.currentQuotaDisplay}</div>
            </div>
          </div>

          <!-- TABLA DE AMORTIZACIÓN AUTOMÁTICA -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h4 style="font-size: 14px; font-weight: 700; color: #FFF; display: flex; align-items: center; gap: 8px;">
                <span>📅</span> Calendario de Amortización Oficial
              </h4>
              <span style="font-size: 12px; color: var(--text-muted);">
                ${loan.installmentsCount} cuotas de ${Formatters.currency(loan.quotaAmount, symbol)} (${loan.frequency})
              </span>
            </div>

            <div class="table-responsive" style="max-height: 350px; overflow-y: auto; border: 1px solid var(--border-subtle);">
              <table class="data-table">
                <thead>
                  <tr>
                    <th class="text-center"># Cuota</th>
                    <th>Vencimiento</th>
                    <th class="text-right">Monto Cuota</th>
                    <th class="text-right">Capital</th>
                    <th class="text-right">Interés</th>
                    <th class="text-right">Pagado</th>
                    <th class="text-right">Pendiente</th>
                    <th class="text-center">Estado</th>
                    <th class="text-right">Saldo Restante</th>
                    <th class="text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  ${loan.schedule.map(inst => `
                    <tr>
                      <td class="text-center mono font-bold">${inst.number} / ${loan.installmentsCount}</td>
                      <td>${Formatters.date(inst.date)}</td>
                      <td class="text-right mono font-bold">${Formatters.currency(inst.amount, symbol)}</td>
                      <td class="text-right mono">${Formatters.currency(inst.capital, symbol)}</td>
                      <td class="text-right mono">${Formatters.currency(inst.interest, symbol)}</td>
                      <td class="text-right mono" style="color: #34D399;">${Formatters.currency(inst.paidAmount, symbol)}</td>
                      <td class="text-right mono" style="color: ${inst.pendingAmount > 0 ? '#F87171' : 'var(--text-subtle)'};">${Formatters.currency(inst.pendingAmount, symbol)}</td>
                      <td class="text-center">${Formatters.statusBadge(inst.status)}</td>
                      <td class="text-right mono font-bold">${Formatters.currency(inst.balanceAfter, symbol)}</td>
                      <td class="text-center">
                        ${inst.status !== 'PAGADA' ? `
                          <button class="btn btn-emerald btn-sm" onclick="window.appRouter.closeModal(); window.appRouter.openPaymentModal('${loan.id}', ${inst.number})">
                            Cobrar
                          </button>
                        ` : '—'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="window.loansView.openEditModal('${loan.id}')">
            ✏️ Editar Préstamo
          </button>
          ${!isFinished ? `
            <button class="btn btn-emerald" onclick="window.appRouter.closeModal(); window.appRouter.openPaymentModal('${loan.id}')">
              💵 Registrar Pago
            </button>
          ` : ''}
          <button class="btn btn-secondary" onclick="window.appRouter.closeModal()">Cerrar</button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  static handlePrintAmortization(loanId) {
    const loan = db.getLoanById(loanId);
    if (!loan) return;
    const client = db.getClientById(loan.clientId) || { name: loan.clientName, phone: loan.clientPhone };
    const business = db.getBusinessSettings();
    PdfExporter.printAmortization(loan, client, business);
  }

  /**
   * EDICIÓN DEL PRÉSTAMO CON SALVAGUARDA DE INTEGRIDAD
   */
  static openEditModal(loanId) {
    const loan = db.getLoanById(loanId);
    if (!loan) return;

    const hasPayments = loan.totalPaid > 0;
    const modal = document.getElementById('global-modal');
    const modalContent = document.getElementById('global-modal-content');

    modalContent.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title"><span>✏️</span> Editar Préstamo ${loan.id}</h3>
          <button class="modal-close-btn" onclick="window.loansView.openLoanDetail('${loan.id}')">✕</button>
        </div>
        <form id="edit-loan-form" onsubmit="window.loansView.handleUpdateLoan(event, '${loan.id}')">
          <div class="modal-body">
            
            ${hasPayments ? `
              <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid #EF4444; border-radius: var(--radius-sm); padding: 14px; margin-bottom: 16px;">
                <h4 style="color: #F87171; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                  ⚠️ Protección de Integridad Financiera
                </h4>
                <p style="font-size: 12px; color: #FFF; margin-top: 4px;">
                  Este préstamo ya cuenta con pagos registrados (${Formatters.currency(loan.totalPaid, db.getBusinessSettings().currencySymbol)}). 
                  Para salvaguardar la contabilidad histórica no se permite cambiar el monto principal original ni el interés total ya acordado. 
                  Puedes modificar la frecuencia, notas o fechas futuras.
                </p>
              </div>
            ` : ''}

            <div class="form-group">
              <label class="form-label">Cliente</label>
              <input type="text" class="form-control" value="${loan.clientName}" disabled />
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Monto Prestado</label>
                <input type="number" name="principal" class="form-control mono" value="${loan.principal}" ${hasPayments ? 'disabled' : ''} />
              </div>
              <div class="form-group">
                <label class="form-label">Tasa de Interés (%)</label>
                <input type="number" name="interestRate" class="form-control mono" value="${loan.interestRate}" ${hasPayments ? 'disabled' : ''} />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Frecuencia de Pago</label>
              <select name="frequency" class="form-control">
                <option value="semanal" ${loan.frequency === 'semanal' ? 'selected' : ''}>Semanal</option>
                <option value="quincenal" ${loan.frequency === 'quincenal' ? 'selected' : ''}>Quincenal</option>
                <option value="mensual" ${loan.frequency === 'mensual' ? 'selected' : ''}>Mensual</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Notas / Observaciones del Préstamo</label>
              <textarea name="notes" class="form-control" rows="2">${loan.notes || ''}</textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="window.loansView.openLoanDetail('${loan.id}')">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Cambios</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.add('active');
  }

  static handleUpdateLoan(e, loanId) {
    e.preventDefault();
    const form = e.target;
    const loan = db.getLoanById(loanId);

    const updates = {
      frequency: form.frequency.value,
      notes: form.notes.value
    };

    if (loan.totalPaid === 0 && form.principal && form.interestRate) {
      updates.principal = parseFloat(form.principal.value);
      updates.interestRate = parseFloat(form.interestRate.value);
    }

    db.updateLoan(loanId, updates);
    window.appRouter.showToast(`Préstamo ${loanId} actualizado.`);
    this.openLoanDetail(loanId);
  }
}
