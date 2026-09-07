/**
 * Vista de Exportaciones PrestaPro
 * Descarga de datos en CSV (Excel compatible) y formato PDF
 */
import { db } from '../store/db.js';
import { PdfExporter } from '../utils/pdf_exporter.js';

export class ExportsView {
  static render(container) {
    container.innerHTML = `
      <div class="filter-bar">
        <div>
          <h3 style="font-size: 18px; font-weight: 700; color: #FFF;">Centro de Exportaciones de Datos</h3>
          <p style="font-size: 13px; color: var(--text-muted);">Descarga informes tabulares en formato CSV (compatible con Excel) o imprime en PDF</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
        
        <!-- Exportar Clientes -->
        <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <span style="font-size: 32px;">👥</span>
              <div>
                <h4 style="font-size: 16px; font-weight: 700; color: #FFF;">Directorio de Clientes</h4>
                <p style="font-size: 12px; color: var(--text-muted);">Datos de contacto, dirección y estado</p>
              </div>
            </div>
            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
              Exporta la lista completa de todos los clientes registrados junto con sus datos de contacto y fechas.
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-emerald" style="flex: 1;" onclick="window.exportsView.exportClientsCsv()">
              📊 Excel / CSV
            </button>
          </div>
        </div>

        <!-- Exportar Préstamos -->
        <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <span style="font-size: 32px;">📄</span>
              <div>
                <h4 style="font-size: 16px; font-weight: 700; color: #FFF;">Cartera de Préstamos</h4>
                <p style="font-size: 12px; color: var(--text-muted);">Montos, tasas, cuotas, saldos y estados</p>
              </div>
            </div>
            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
              Exporta el estado de toda la cartera de créditos: capital colocado, intereses, saldos pendientes y estado de mora.
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-emerald" style="flex: 1;" onclick="window.exportsView.exportLoansCsv()">
              📊 Excel / CSV
            </button>
          </div>
        </div>

        <!-- Exportar Pagos -->
        <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <span style="font-size: 32px;">💰</span>
              <div>
                <h4 style="font-size: 16px; font-weight: 700; color: #FFF;">Historial de Cobros / Pagos</h4>
                <p style="font-size: 12px; color: var(--text-muted);">Todos los recibos y abonos registrados</p>
              </div>
            </div>
            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
              Descarga el registro detallado de ingresos: folio de recibo, cliente, monto, fecha, método de pago y saldo restante.
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-emerald" style="flex: 1;" onclick="window.exportsView.exportPaymentsCsv()">
              📊 Excel / CSV
            </button>
          </div>
        </div>

        <!-- Exportar Amortizaciones -->
        <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <span style="font-size: 32px;">📅</span>
              <div>
                <h4 style="font-size: 16px; font-weight: 700; color: #FFF;">Todas las Cuotas y Amortizaciones</h4>
                <p style="font-size: 12px; color: var(--text-muted);">Desglose fila por fila de cada cuota</p>
              </div>
            </div>
            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
              Exporta la base de datos detallada de todas las cuotas generadas, incluyendo fecha de vencimiento, capital, interés y saldo.
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-emerald" style="flex: 1;" onclick="window.exportsView.exportAmortizationsCsv()">
              📊 Excel / CSV
            </button>
          </div>
        </div>

      </div>
    `;

    window.exportsView = this;
  }

  static exportClientsCsv() {
    const clients = db.getClients();
    const rows = clients.map(c => ({
      ID: c.id,
      Nombre: c.name,
      Telefono: c.phone,
      Direccion: c.address || '',
      FechaNacimiento: c.birthDate || '',
      FechaRegistro: c.createdAt || '',
      Observaciones: c.notes || ''
    }));
    PdfExporter.exportCsv(`Clientes_PrestaPro_${new Date().toISOString().split('T')[0]}`, rows);
    window.appRouter.showToast('Clientes exportados exitosamente a CSV.');
  }

  static exportLoansCsv() {
    const loans = db.getLoans();
    const rows = loans.map(l => ({
      ID_Prestamo: l.id,
      Cliente_ID: l.clientId,
      Cliente_Nombre: l.clientName,
      Telefono: l.clientPhone,
      Monto_Principal: l.principal,
      Tasa_Interes_Pct: l.interestRate,
      Interes_Total: l.totalInterest,
      Total_a_Pagar: l.totalToPay,
      Total_Pagado: l.totalPaid,
      Saldo_Restante: l.remainingBalance,
      Numero_Cuotas: l.installmentsCount,
      Valor_Cuota: l.quotaAmount,
      Frecuencia: l.frequency,
      Estado: l.status,
      Fecha_Entrega: l.issueDate,
      Fecha_Primer_Pago: l.firstPaymentDate
    }));
    PdfExporter.exportCsv(`Prestamos_PrestaPro_${new Date().toISOString().split('T')[0]}`, rows);
    window.appRouter.showToast('Préstamos exportados exitosamente a CSV.');
  }

  static exportPaymentsCsv() {
    const receipts = db.getReceipts();
    const rows = receipts.map(r => ({
      Folio_Recibo: r.receiptNumber,
      Fecha: r.date,
      ID_Prestamo: r.loanId,
      Cliente: r.clientName,
      Telefono: r.clientPhone || '',
      Cuota: r.quotaNumber,
      Monto_Pagado: r.amount,
      Metodo_Pago: r.paymentMethod,
      Saldo_Restante: r.remainingBalance,
      Notas: r.notes || ''
    }));
    PdfExporter.exportCsv(`Pagos_PrestaPro_${new Date().toISOString().split('T')[0]}`, rows);
    window.appRouter.showToast('Pagos exportados exitosamente a CSV.');
  }

  static exportAmortizationsCsv() {
    const loans = db.getLoans();
    const rows = [];

    loans.forEach(l => {
      l.schedule.forEach(inst => {
        rows.push({
          ID_Prestamo: l.id,
          Cliente: l.clientName,
          Numero_Cuota: `${inst.number}/${l.installmentsCount}`,
          Fecha_Vencimiento: inst.date,
          Monto_Cuota: inst.amount,
          Capital: inst.capital,
          Interes: inst.interest,
          Pagado: inst.paidAmount,
          Pendiente: inst.pendingAmount,
          Estado_Cuota: inst.status,
          Saldo_Despues: inst.balanceAfter
        });
      });
    });

    PdfExporter.exportCsv(`Amortizaciones_PrestaPro_${new Date().toISOString().split('T')[0]}`, rows);
    window.appRouter.showToast('Tabla de amortizaciones exportada a CSV.');
  }
}
