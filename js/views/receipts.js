/**
 * Vista de Recibos y Comprobantes Oficiales PrestaPro
 */
import { db } from '../store/db.js';
import { Formatters } from '../utils/formatters.js';
import { PdfExporter } from '../utils/pdf_exporter.js';
import { WhatsAppHelper } from '../utils/whatsapp_helper.js';

export class ReceiptsView {
  static searchQuery = '';

  static render(container, options = {}) {
    const receipts = db.getReceipts();
    const business = db.getBusinessSettings();
    const symbol = business.currencySymbol || '$';

    if (options.openReceiptNumber) {
      setTimeout(() => this.openReceiptModal(options.openReceiptNumber), 100);
    }

    const filtered = receipts.filter(r => {
      if (!this.searchQuery) return true;
      const q = this.searchQuery.toLowerCase();
      return r.receiptNumber.toLowerCase().includes(q) ||
        r.clientName.toLowerCase().includes(q) ||
        r.loanId.toLowerCase().includes(q);
    });

    container.innerHTML = `
      <div class="filter-bar">
        <div class="search-input-wrapper">
          <i>🔍</i>
          <input 
            type="text" 
            placeholder="Buscar por número de recibo, cliente o préstamo..." 
            value="${this.searchQuery}"
            oninput="window.receiptsView.handleSearch(this.value)"
          />
        </div>

        <div>
          <span class="badge badge-info" style="font-size: 13px;">
            Total Recibos Emitidos: ${receipts.length}
          </span>
        </div>
      </div>

      <!-- Cuadrícula de Recibos -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
        ${filtered.length === 0 ? `
          <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-subtle);">
            No se encontraron recibos.
          </div>
        ` : filtered.map(r => `
          <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <span class="mono font-bold" style="font-size: 15px; color: var(--accent-cyan);">${r.receiptNumber}</span>
                <span class="badge badge-neutral">${Formatters.date(r.date)}</span>
              </div>

              <h4 style="font-size: 16px; font-weight: 700; color: #FFF; margin-bottom: 4px;">${r.clientName}</h4>
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
                Préstamo: <strong class="mono">${r.loanId}</strong> • ${r.quotaNumber}
              </div>

              <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <span style="font-size: 11px; color: var(--text-subtle); display: block;">Monto Pagado:</span>
                  <span class="mono font-bold" style="font-size: 18px; color: #34D399;">${Formatters.currency(r.amount, symbol)}</span>
                </div>
                <div style="text-align: right;">
                  <span style="font-size: 11px; color: var(--text-subtle); display: block;">Saldo Restante:</span>
                  <span class="mono font-bold" style="font-size: 14px; color: var(--text-main);">${Formatters.currency(r.remainingBalance, symbol)}</span>
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 16px; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
              <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="window.receiptsView.openReceiptModal('${r.receiptNumber}')">
                👁️ Ver / Imprimir
              </button>
              <button class="btn btn-emerald btn-sm" onclick="window.receiptsView.sendWhatsApp('${r.receiptNumber}')" title="Enviar comprobante por WhatsApp">
                💬 WhatsApp
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    window.receiptsView = this;
  }

  static handleSearch(q) {
    this.searchQuery = q;
    this.render(document.getElementById('content-area'));
  }

  /**
   * Modal del Recibo con diseño profesional listo para Imprimir o Guardar PDF
   */
  static openReceiptModal(receiptNumber) {
    const receipt = db.getReceiptByNumber(receiptNumber);
    if (!receipt) return;
    const business = db.getBusinessSettings();
    const symbol = business.currencySymbol || '$';

    const modal = document.getElementById('global-modal');
    const modalContent = document.getElementById('global-modal-content');

    modalContent.innerHTML = `
      <div class="modal-card" style="max-width: 550px;">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">🧾</span>
            <div>
              <h3 class="modal-title">Comprobante de Pago</h3>
              <div class="mono" style="font-size: 12px; color: var(--accent-cyan);">${receipt.receiptNumber}</div>
            </div>
          </div>
          <button class="modal-close-btn" onclick="window.appRouter.closeModal()">✕</button>
        </div>

        <div class="modal-body">
          <!-- Vista del Recibo -->
          <div style="background: #FFFFFF; color: #0F172A; border-radius: 12px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); font-family: 'Inter', sans-serif;">
            
            <div style="text-align: center; border-bottom: 2px dashed #CBD5E1; padding-bottom: 16px; margin-bottom: 16px;">
              <h2 style="font-size: 20px; font-weight: 800; color: #0284C7; letter-spacing: 0.5px;">${business.name || 'PRESTAPRO FINANZAS'}</h2>
              <p style="font-size: 12px; color: #64748B;">${business.address || ''}</p>
              <p style="font-size: 12px; color: #64748B;">Tel: ${business.phone || ''}</p>
              <div class="mono" style="display: inline-block; background: #F1F5F9; border: 1px solid #CBD5E1; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 700; margin-top: 8px;">
                ${receipt.receiptNumber}
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 4px;">
                <span style="color: #64748B;">Fecha y Hora:</span>
                <strong>${Formatters.dateTime(receipt.date)}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 4px;">
                <span style="color: #64748B;">Cliente:</span>
                <strong>${receipt.clientName}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 4px;">
                <span style="color: #64748B;">Préstamo Relacionado:</span>
                <strong class="mono">${receipt.loanId}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 4px;">
                <span style="color: #64748B;">Concepto:</span>
                <strong>${receipt.quotaNumber}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 4px;">
                <span style="color: #64748B;">Método de Pago:</span>
                <strong>${receipt.paymentMethod}</strong>
              </div>
            </div>

            <div style="background: #EFF6FF; border: 2px solid #BFDBFE; border-radius: 8px; padding: 14px; text-align: center; margin-bottom: 16px;">
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #1D4ED8;">CANTIDAD PAGADA</div>
              <div class="mono font-bold" style="font-size: 28px; color: #1E40AF; margin-top: 2px;">
                ${Formatters.currency(receipt.amount, symbol)}
              </div>
              <div style="font-size: 12px; color: #475569; margin-top: 4px;">
                Saldo Restante del Préstamo: <strong class="mono" style="color: #0F172A;">${Formatters.currency(receipt.remainingBalance, symbol)}</strong>
              </div>
            </div>

            ${receipt.notes ? `
              <div style="font-size: 12px; color: #64748B; background: #F8FAFC; padding: 8px; border-radius: 4px; margin-bottom: 14px;">
                <strong>Nota:</strong> ${receipt.notes}
              </div>
            ` : ''}

            <div style="text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px dashed #CBD5E1; padding-top: 12px;">
              ¡Gracias por su pago puntual! Este comprobante digital certifica la transacción realizada.
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="window.receiptsView.printReceipt('${receipt.receiptNumber}')">
            🖨️ Descargar PDF / Imprimir
          </button>
          <button class="btn btn-emerald" onclick="window.receiptsView.sendWhatsApp('${receipt.receiptNumber}')">
            💬 Enviar al Cliente (WhatsApp)
          </button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  static printReceipt(receiptNumber) {
    const receipt = db.getReceiptByNumber(receiptNumber);
    if (!receipt) return;
    const business = db.getBusinessSettings();
    PdfExporter.printReceipt(receipt, business);
  }

  static sendWhatsApp(receiptNumber) {
    const receipt = db.getReceiptByNumber(receiptNumber);
    if (!receipt) return;
    const business = db.getBusinessSettings();
    const symbol = business.currencySymbol || '$';

    const message = `Hola ${receipt.clientName}. Hemos recibido tu pago de ${Formatters.currency(receipt.amount, symbol)} correspondiente al préstamo ${receipt.loanId} (${receipt.quotaNumber}). 
Comprobante No: ${receipt.receiptNumber}. 
Tu saldo pendiente actual es de ${Formatters.currency(receipt.remainingBalance, symbol)}. 
¡Gracias por tu pago a ${business.name}!`;

    WhatsAppHelper.openWhatsApp(receipt.clientPhone, message);
  }
}
