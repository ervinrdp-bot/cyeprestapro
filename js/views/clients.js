/**
 * Vista de Clientes y Expediente Digital PrestaPro
 */
import { db } from '../store/db.js';
import { Formatters } from '../utils/formatters.js';

export class ClientsView {
  static currentFilter = 'ALL';
  static searchQuery = '';

  static render(container, options = {}) {
    const clients = db.getClients();
    const loans = db.getLoans();
    const business = db.getBusinessSettings();
    const symbol = business.currencySymbol || '$';

    if (options.openModal) {
      setTimeout(() => this.openNewClientModal(), 100);
    }
    if (options.viewClientId) {
      setTimeout(() => this.openClientDossier(options.viewClientId), 100);
    }

    // Calcular estado de cada cliente para los filtros
    const enrichedClients = clients.map(c => {
      const clientLoans = loans.filter(l => l.clientId === c.id);
      const activeLoans = clientLoans.filter(l => l.remainingBalance > 0.01);
      const finishedLoans = clientLoans.filter(l => l.remainingBalance <= 0.01);
      const hasOverdue = activeLoans.some(l => l.status === 'ATRASADO');
      
      let category = 'NO_LOAN';
      if (hasOverdue) category = 'OVERDUE';
      else if (activeLoans.length > 0) category = 'ACTIVE';
      else if (finishedLoans.length > 0) category = 'FINISHED';

      const totalBorrowed = clientLoans.reduce((sum, l) => sum + l.principal, 0);
      const totalPaid = clientLoans.reduce((sum, l) => sum + l.totalPaid, 0);
      const remainingBalance = clientLoans.reduce((sum, l) => sum + l.remainingBalance, 0);

      return {
        ...c,
        category,
        activeLoansCount: activeLoans.length,
        finishedLoansCount: finishedLoans.length,
        totalBorrowed,
        totalPaid,
        remainingBalance
      };
    });

    // Filtrar por término de búsqueda y categoría
    const filtered = enrichedClients.filter(c => {
      const matchesSearch = !this.searchQuery || 
        c.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.phone.includes(this.searchQuery) ||
        c.id.toLowerCase().includes(this.searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (this.currentFilter === 'ALL') return true;
      if (this.currentFilter === 'ACTIVE') return c.category === 'ACTIVE';
      if (this.currentFilter === 'OVERDUE') return c.category === 'OVERDUE';
      if (this.currentFilter === 'FINISHED') return c.category === 'FINISHED';
      if (this.currentFilter === 'NO_LOAN') return c.category === 'NO_LOAN';
      return true;
    });

    container.innerHTML = `
      <div class="filter-bar">
        <div class="search-input-wrapper">
          <i>🔍</i>
          <input 
            type="text" 
            placeholder="Buscar por nombre, teléfono o ID (ej: CLI-1001)..." 
            value="${this.searchQuery}"
            oninput="window.clientsView.handleSearch(this.value)"
          />
        </div>

        <div class="filter-tabs">
          <button class="filter-tab ${this.currentFilter === 'ALL' ? 'active' : ''}" onclick="window.clientsView.setFilter('ALL')">
            Todos (${clients.length})
          </button>
          <button class="filter-tab ${this.currentFilter === 'ACTIVE' ? 'active' : ''}" onclick="window.clientsView.setFilter('ACTIVE')">
            Préstamo Activo
          </button>
          <button class="filter-tab ${this.currentFilter === 'OVERDUE' ? 'active' : ''}" onclick="window.clientsView.setFilter('OVERDUE')">
            ⚠️ Atrasados
          </button>
          <button class="filter-tab ${this.currentFilter === 'FINISHED' ? 'active' : ''}" onclick="window.clientsView.setFilter('FINISHED')">
            ✅ Terminados
          </button>
          <button class="filter-tab ${this.currentFilter === 'NO_LOAN' ? 'active' : ''}" onclick="window.clientsView.setFilter('NO_LOAN')">
            Sin Préstamo
          </button>
        </div>

        <button class="btn btn-primary" onclick="window.clientsView.openNewClientModal()">
          <span>➕</span> Nuevo Cliente
        </button>
      </div>

      <!-- Cuadrícula de Tarjetas de Clientes -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
        ${filtered.length === 0 ? `
          <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
            <div style="font-size: 36px; margin-bottom: 10px;">👥</div>
            <h3>No se encontraron clientes con los filtros seleccionados</h3>
            <p style="font-size: 13px; margin-top: 5px;">Intenta con otro término o crea un nuevo cliente.</p>
          </div>
        ` : filtered.map(c => `
          <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; transition: transform 0.2s;" onclick="window.clientsView.openClientDossier('${c.id}')">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 28px;">${c.avatar || '👤'}</span>
                  <div>
                    <h4 style="font-size: 15px; font-weight: 700; color: #FFF;">${c.name}</h4>
                    <span class="mono" style="font-size: 11px; color: var(--accent-cyan);">${c.id}</span>
                  </div>
                </div>
                ${c.category === 'OVERDUE' ? '<span class="badge badge-danger">Atrasado</span>' :
                  c.category === 'ACTIVE' ? '<span class="badge badge-active">Al día</span>' :
                  c.category === 'FINISHED' ? '<span class="badge badge-success">Completado</span>' :
                  '<span class="badge badge-neutral">Sin préstamo</span>'}
              </div>

              <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px;">
                <div>📞 ${c.phone}</div>
                <div>📍 ${c.address || 'Sin dirección registrada'}</div>
              </div>

              <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
                <div>
                  <span style="color: var(--text-subtle);">Saldo Pendiente:</span>
                  <div class="mono font-bold" style="color: ${c.remainingBalance > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)'}; font-size: 13px;">
                    ${Formatters.currency(c.remainingBalance, symbol)}
                  </div>
                </div>
                <div>
                  <span style="color: var(--text-subtle);">Préstamos:</span>
                  <div style="color: var(--text-main); font-weight: 600; font-size: 13px;">
                    ${c.activeLoansCount} activos • ${c.finishedLoansCount} hist.
                  </div>
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 16px; border-top: 1px solid var(--border-subtle); padding-top: 12px;" onclick="event.stopPropagation()">
              <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="window.clientsView.openClientDossier('${c.id}')">
                📂 Expediente
              </button>
              <button class="btn btn-primary btn-sm" onclick="window.appRouter.navigate('loans', { openModal: true, prefillClientId: '${c.id}' })">
                ➕ Préstamo
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    window.clientsView = this;
  }

  static setFilter(filter) {
    this.currentFilter = filter;
    this.render(document.getElementById('content-area'));
  }

  static handleSearch(query) {
    this.searchQuery = query;
    this.render(document.getElementById('content-area'));
  }

  /**
   * Modal para Crear Nuevo Cliente con soporte de documentos y fotos
   */
  static openNewClientModal() {
    const modal = document.getElementById('global-modal');
    const modalContent = document.getElementById('global-modal-content');

    modalContent.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title"><span>➕</span> Registrar Nuevo Cliente</h3>
          <button class="modal-close-btn" onclick="window.appRouter.closeModal()">✕</button>
        </div>
        <form id="new-client-form" onsubmit="window.clientsView.handleCreateClient(event)">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Nombre Completo *</label>
              <input type="text" name="name" class="form-control" required placeholder="Ej: Juan Carlos Pérez" />
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Teléfono / WhatsApp *</label>
                <input type="tel" name="phone" class="form-control" required placeholder="Ej: +18095550199" />
              </div>
              <div class="form-group">
                <label class="form-label">Fecha de Nacimiento</label>
                <input type="date" name="birthDate" class="form-control" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Dirección Residencial</label>
              <input type="text" name="address" class="form-control" placeholder="Ej: Calle Principal #12, Apto 4" />
            </div>

            <div class="form-group">
              <label class="form-label">Información Adicional / Referencias</label>
              <textarea name="notes" class="form-control" rows="2" placeholder="Negocio, garantes, empleo o referencias comerciales..."></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Documentos y Fotografías (Expediente Digital)</label>
              <div style="border: 2px dashed var(--border-subtle); padding: 18px; border-radius: var(--radius-sm); text-align: center; background: rgba(255,255,255,0.02);">
                <div style="font-size: 24px; margin-bottom: 6px;">📄 📷</div>
                <p style="font-size: 12px; color: var(--text-muted);">
                  Adjunta cédula, comprobante de ingresos o fotografía del cliente
                </p>
                <input type="file" id="client-file-input" multiple style="margin-top: 10px; font-size: 12px; color: var(--text-muted);" />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="window.appRouter.closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Cliente</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.add('active');
  }

  static handleCreateClient(e) {
    e.preventDefault();
    const form = e.target;
    const fileInput = document.getElementById('client-file-input');
    const docNames = fileInput && fileInput.files ? Array.from(fileInput.files).map(f => f.name) : [];

    const newClient = db.addClient({
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      birthDate: form.birthDate.value,
      address: form.address.value.trim(),
      notes: form.notes.value.trim(),
      documents: docNames.length ? docNames : ['Cédula de Identidad (Digital)']
    });

    window.appRouter.closeModal();
    window.appRouter.showToast(`Cliente ${newClient.name} registrado exitosamente.`);
    this.render(document.getElementById('content-area'));
  }

  /**
   * EXPEDIENTE INDIVIDUAL DEL CLIENTE (DOSSIER DIGITAL)
   */
  static openClientDossier(clientId) {
    const client = db.getClientById(clientId);
    if (!client) return;

    const loans = db.getLoansByClientId(clientId);
    const receipts = db.getReceipts().filter(r => r.clientId === clientId);
    const business = db.getBusinessSettings();
    const symbol = business.currencySymbol || '$';

    const totalBorrowed = loans.reduce((sum, l) => sum + l.principal, 0);
    const totalPaid = loans.reduce((sum, l) => sum + l.totalPaid, 0);
    const remainingBalance = loans.reduce((sum, l) => sum + l.remainingBalance, 0);
    const activeLoans = loans.filter(l => l.remainingBalance > 0.01);
    const finishedLoans = loans.filter(l => l.remainingBalance <= 0.01);

    const modal = document.getElementById('global-modal');
    const modalContent = document.getElementById('global-modal-content');

    modalContent.innerHTML = `
      <div class="modal-card modal-card-lg">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 32px;">${client.avatar || '👤'}</span>
            <div>
              <h3 class="modal-title">${client.name}</h3>
              <div style="font-size: 12px; color: var(--accent-cyan);">Expediente Digital • <span class="mono">${client.id}</span></div>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary btn-sm" onclick="window.appRouter.closeModal(); window.appRouter.navigate('loans', { openModal: true, prefillClientId: '${client.id}' })">
              ➕ Crear Nuevo Préstamo
            </button>
            <button class="modal-close-btn" onclick="window.appRouter.closeModal()">✕</button>
          </div>
        </div>

        <div class="modal-body" style="display: flex; flex-direction: column; gap: 20px;">
          
          <!-- Resumen Financiero del Cliente -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;">
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px;">
              <div style="font-size: 11px; color: var(--text-subtle);">Total Prestado</div>
              <div class="mono font-bold" style="font-size: 16px; color: #FFF;">${Formatters.currency(totalBorrowed, symbol)}</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px;">
              <div style="font-size: 11px; color: var(--text-subtle);">Total Pagado</div>
              <div class="mono font-bold" style="font-size: 16px; color: #34D399;">${Formatters.currency(totalPaid, symbol)}</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px;">
              <div style="font-size: 11px; color: var(--text-subtle);">Saldo Pendiente</div>
              <div class="mono font-bold" style="font-size: 16px; color: var(--accent-cyan);">${Formatters.currency(remainingBalance, symbol)}</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px;">
              <div style="font-size: 11px; color: var(--text-subtle);">Préstamos</div>
              <div class="mono font-bold" style="font-size: 16px; color: #FFF;">${activeLoans.length} Activos / ${finishedLoans.length} Term.</div>
            </div>
          </div>

          <!-- Datos Personales & Documentos -->
          <div class="glass-card" style="padding: 16px;">
            <h4 style="font-size: 13px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px;">Información de Contacto y Archivos</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
              <div>📞 <strong>Teléfono:</strong> ${client.phone}</div>
              <div>🎂 <strong>Nacimiento:</strong> ${Formatters.date(client.birthDate)}</div>
              <div style="grid-column: 1 / -1;">📍 <strong>Dirección:</strong> ${client.address || '—'}</div>
              <div style="grid-column: 1 / -1;">📝 <strong>Notas:</strong> ${client.notes || 'Sin observaciones'}</div>
            </div>

            <div style="margin-top: 14px; border-top: 1px dashed var(--border-subtle); padding-top: 10px;">
              <span style="font-size: 12px; font-weight: 600; color: var(--text-muted);">Documentos en Expediente:</span>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px;">
                ${client.documents && client.documents.length ? client.documents.map(d => `
                  <span class="badge badge-neutral" style="cursor: pointer;" title="Documento digital">
                    📎 ${d}
                  </span>
                `).join('') : '<span style="font-size: 12px; color: var(--text-subtle);">No hay documentos adjuntos aún</span>'}
              </div>
            </div>
          </div>

          <!-- Historial Cronológico de Préstamos -->
          <div>
            <h4 style="font-size: 14px; font-weight: 700; color: #FFF; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
              <span>📜 Historial de Préstamos (${loans.length})</span>
            </h4>

            ${loans.length === 0 ? `
              <p style="font-size: 13px; color: var(--text-subtle);">Este cliente no tiene ningún préstamo registrado todavía.</p>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${loans.map(loan => `
                  <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <strong class="mono" style="color: #FFF;">${loan.id}</strong>
                        ${Formatters.statusBadge(loan.status)}
                      </div>
                      <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                        Monto: <strong class="mono">${Formatters.currency(loan.principal, symbol)}</strong> (${loan.interestRate}% int.) • 
                        Total: <strong class="mono">${Formatters.currency(loan.totalToPay, symbol)}</strong> • 
                        Saldo: <strong class="mono" style="color: var(--accent-cyan);">${Formatters.currency(loan.remainingBalance, symbol)}</strong>
                      </div>
                      <div style="font-size: 11px; color: var(--text-subtle); margin-top: 2px;">
                        Cuota actual: ${loan.currentQuotaDisplay} • Frecuencia: ${loan.frequency}
                      </div>
                    </div>

                    <div style="display: flex; gap: 8px;">
                      <button class="btn btn-secondary btn-sm" onclick="window.appRouter.closeModal(); window.appRouter.openLoanDetail('${loan.id}')">
                        Ver Préstamo
                      </button>
                      <button class="btn btn-emerald btn-sm" onclick="window.appRouter.closeModal(); window.appRouter.openPaymentModal('${loan.id}')">
                        Abonar
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Recibos del Cliente -->
          <div>
            <h4 style="font-size: 14px; font-weight: 700; color: #FFF; margin-bottom: 12px;">
              🧾 Recibos de Pago Emitidos (${receipts.length})
            </h4>
            ${receipts.length === 0 ? `
              <p style="font-size: 13px; color: var(--text-subtle);">No se han emitido pagos para este cliente aún.</p>
            ` : `
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px;">
                ${receipts.map(r => `
                  <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div class="mono" style="font-weight: 700; color: var(--accent-cyan); font-size: 13px;">${r.receiptNumber}</div>
                      <div style="font-size: 12px; color: var(--text-muted);">${Formatters.dateTime(r.date)}</div>
                      <div style="font-size: 12px; font-weight: 600; color: #34D399; margin-top: 2px;">${Formatters.currency(r.amount, symbol)}</div>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="window.appRouter.openReceipt('${r.receiptNumber}')">
                      Ver Recibo
                    </button>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="window.appRouter.closeModal()">Cerrar</button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }
}
