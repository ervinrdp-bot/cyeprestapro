/**
 * Utilidades de Exportación e Impresión PDF / CSV PrestaPro
 */
import { Formatters } from './formatters.js';

export class PdfExporter {
  /**
   * Abre una ventana de impresión estilizada para guardar como PDF o imprimir
   */
  static printHtml(title, htmlContent, customStyles = '') {
    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes en tu navegador para imprimir/descargar el documento.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Inter', sans-serif;
            color: #0F172A;
            background: #FFFFFF;
            padding: 30px;
            font-size: 13px;
            line-height: 1.5;
          }
          .mono { font-family: 'JetBrains Mono', monospace; }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #E2E8F0;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }
          .business-title { font-size: 22px; font-weight: 800; color: #0284C7; }
          .doc-badge {
            background: #F1F5F9;
            padding: 6px 14px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 14px;
            border: 1px solid #CBD5E1;
            text-align: right;
          }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
          .info-card {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 14px;
          }
          .info-card h4 {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748B;
            margin-bottom: 8px;
          }
          .info-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #E2E8F0; }
          .info-row:last-child { border-bottom: none; }
          .label { color: #64748B; font-weight: 500; }
          .value { font-weight: 600; color: #0F172A; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
          th {
            background: #F1F5F9;
            color: #334155;
            font-weight: 700;
            text-align: left;
            padding: 10px 12px;
            font-size: 11px;
            text-transform: uppercase;
            border-bottom: 2px solid #CBD5E1;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #E2E8F0;
            font-size: 12px;
          }
          tr:nth-child(even) td { background: #F8FAFC; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total-box {
            background: #EFF6FF;
            border: 2px solid #BFDBFE;
            border-radius: 8px;
            padding: 16px;
            text-align: right;
            margin-bottom: 30px;
          }
          .total-box .amount { font-size: 24px; font-weight: 800; color: #1D4ED8; }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 50px;
            margin-top: 60px;
            padding-top: 20px;
          }
          .sign-line {
            border-top: 1px solid #64748B;
            text-align: center;
            padding-top: 8px;
            font-weight: 600;
            color: #475569;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 11px;
            color: #94A3B8;
            border-top: 1px solid #E2E8F0;
            padding-top: 15px;
          }
          @media print {
            body { padding: 0; }
            @page { margin: 1.5cm; }
          }
          ${customStyles}
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  /**
   * Imprime o guarda como PDF el Recibo Oficial de Pago
   */
  static printReceipt(receipt, business) {
    const symbol = business.currencySymbol || '$';
    const content = `
      <div class="header">
        <div>
          <h1 class="business-title">${business.name || 'PRESTAPRO FINANZAS'}</h1>
          <p style="color: #64748B; font-size: 12px; margin-top: 3px;">${business.address || 'Servicios Financieros'}</p>
          <p style="color: #64748B; font-size: 12px;">Tel: ${business.phone || '—'} | ${business.email || ''}</p>
        </div>
        <div class="doc-badge">
          <div style="font-size: 11px; color: #0284C7;">RECIBO DE PAGO</div>
          <div class="mono" style="font-size: 18px; color: #0F172A;">${receipt.receiptNumber}</div>
          <div style="font-size: 11px; color: #64748B;">${Formatters.dateTime(receipt.date)}</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="info-card">
          <h4>Datos del Cliente</h4>
          <div class="info-row">
            <span class="label">Cliente:</span>
            <span class="value">${receipt.clientName}</span>
          </div>
          <div class="info-row">
            <span class="label">Teléfono:</span>
            <span class="value">${receipt.clientPhone || '—'}</span>
          </div>
          <div class="info-row">
            <span class="label">ID Cliente:</span>
            <span class="value mono">${receipt.clientId}</span>
          </div>
        </div>

        <div class="info-card">
          <h4>Detalles de la Operación</h4>
          <div class="info-row">
            <span class="label">Préstamo:</span>
            <span class="value mono">${receipt.loanId}</span>
          </div>
          <div class="info-row">
            <span class="label">Cuota:</span>
            <span class="value">${receipt.quotaNumber || 'Abono general'}</span>
          </div>
          <div class="info-row">
            <span class="label">Método de Pago:</span>
            <span class="value">${receipt.paymentMethod}</span>
          </div>
        </div>
      </div>

      <div class="total-box">
        <div style="font-size: 12px; color: #1E40AF; text-transform: uppercase; font-weight: 700;">MONTO PAGADO</div>
        <div class="amount mono">${Formatters.currency(receipt.amount, symbol)}</div>
        <div style="font-size: 12px; color: #475569; margin-top: 5px;">
          Saldo Restante del Préstamo: <strong class="mono" style="color: #0F172A;">${Formatters.currency(receipt.remainingBalance, symbol)}</strong>
        </div>
      </div>

      ${receipt.notes ? `
        <div style="background: #F8FAFC; padding: 12px; border-radius: 6px; border: 1px dashed #CBD5E1; margin-bottom: 25px;">
          <span style="font-weight: 600; color: #475569;">Notas:</span> ${receipt.notes}
        </div>
      ` : ''}

      <div class="signatures">
        <div class="sign-line">Firma del Cliente</div>
        <div class="sign-line">Firma Autorizada / Cobrador</div>
      </div>

      <div class="footer">
        Este documento es un comprobante de pago oficial emitido automáticamente por PrestaPro. Conserve este recibo para cualquier aclaración.
      </div>
    `;

    this.printHtml(`Recibo-${receipt.receiptNumber}`, content);
  }

  /**
   * Imprime o guarda como PDF la Tabla de Amortización completa
   */
  static printAmortization(loan, client, business) {
    const symbol = business.currencySymbol || '$';
    const rowsHtml = loan.schedule.map(item => `
      <tr>
        <td class="mono font-bold text-center">Cuota ${item.number} / ${loan.installmentsCount}</td>
        <td>${Formatters.date(item.date)}</td>
        <td class="text-right mono">${Formatters.currency(item.amount, symbol)}</td>
        <td class="text-right mono">${Formatters.currency(item.capital, symbol)}</td>
        <td class="text-right mono">${Formatters.currency(item.interest, symbol)}</td>
        <td class="text-center font-bold" style="color: ${item.status === 'PAGADA' ? '#059669' : item.status === 'ATRASADA' ? '#DC2626' : '#D97706'}">${item.status}</td>
        <td class="text-right mono font-bold">${Formatters.currency(item.balanceAfter, symbol)}</td>
      </tr>
    `).join('');

    const content = `
      <div class="header">
        <div>
          <h1 class="business-title">${business.name || 'PRESTAPRO FINANZAS'}</h1>
          <p style="color: #64748B; font-size: 12px; margin-top: 3px;">TABLA DE AMORTIZACIÓN Y CONDICIONES DE CRÉDITO</p>
        </div>
        <div class="doc-badge">
          <div style="font-size: 11px; color: #0284C7;">PRÉSTAMO</div>
          <div class="mono" style="font-size: 18px; color: #0F172A;">${loan.id}</div>
          <div style="font-size: 11px; color: #64748B;">Fecha: ${Formatters.date(loan.issueDate)}</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="info-card">
          <h4>Datos del Deudor</h4>
          <div class="info-row"><span class="label">Cliente:</span><span class="value">${client.name}</span></div>
          <div class="info-row"><span class="label">Teléfono:</span><span class="value">${client.phone || '—'}</span></div>
          <div class="info-row"><span class="label">Dirección:</span><span class="value">${client.address || '—'}</span></div>
        </div>
        <div class="info-card">
          <h4>Resumen Financiero</h4>
          <div class="info-row"><span class="label">Monto Prestado:</span><span class="value mono">${Formatters.currency(loan.principal, symbol)}</span></div>
          <div class="info-row"><span class="label">Tasa de Interés:</span><span class="value">${loan.interestRate}% Fijo</span></div>
          <div class="info-row"><span class="label">Interés Total:</span><span class="value mono">${Formatters.currency(loan.totalInterest, symbol)}</span></div>
          <div class="info-row"><span class="label">Total a Pagar:</span><span class="value mono">${Formatters.currency(loan.totalToPay, symbol)}</span></div>
          <div class="info-row"><span class="label">Frecuencia / Cuotas:</span><span class="value" style="text-transform: capitalize;">${loan.frequency} (${loan.installmentsCount} cuotas de ${Formatters.currency(loan.quotaAmount, symbol)})</span></div>
        </div>
      </div>

      <h3 style="font-size: 14px; font-weight: 700; color: #1E293B; margin-top: 20px;">Calendario de Pagos</h3>
      <table>
        <thead>
          <tr>
            <th class="text-center">Cuota</th>
            <th>Fecha Vencimiento</th>
            <th class="text-right">Monto Cuota</th>
            <th class="text-right">Capital</th>
            <th class="text-right">Interés</th>
            <th class="text-center">Estado</th>
            <th class="text-right">Saldo Restante</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="signatures">
        <div class="sign-line">Firma de Conformidad del Cliente</div>
        <div class="sign-line">Firma del Acreedor / Prestamista</div>
      </div>

      <div class="footer">
        El deudor reconoce y acepta el calendario de pagos aquí establecido y se compromete a saldar las cuotas en las fechas indicadas.
      </div>
    `;

    this.printHtml(`Amortizacion-${loan.id}`, content);
  }

  /**
   * Exporta cualquier arreglo de objetos a archivo CSV descargable
   */
  static exportCsv(filename, rows) {
    if (!rows || !rows.length) {
      alert('No hay datos disponibles para exportar.');
      return;
    }

    const keys = Object.keys(rows[0]);
    const csvContent = [
      keys.join(','),
      ...rows.map(row => keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k].toString();
        cell = cell.replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(','))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
