/**
 * Utilidades de Formato PrestaPro
 */

export class Formatters {
  static currency(amount, currencySymbol = '$') {
    const val = parseFloat(amount) || 0;
    return `${currencySymbol}${val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  static date(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  static dateTime(isoStr) {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  }

  static relativeDate(dateStr) {
    if (!dateStr) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    const diffTime = target - today;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays === -1) return 'Ayer';
    if (diffDays > 1 && diffDays <= 7) return `En ${diffDays} días`;
    if (diffDays < -1) return `Hace ${Math.abs(diffDays)} días (Atrasado)`;
    return this.date(dateStr);
  }

  static statusBadge(status) {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'ACTIVO':
        return `<span class="badge badge-active"><span class="badge-dot dot-green"></span> Activo / Al día</span>`;
      case 'PROXIMO':
        return `<span class="badge badge-warning"><span class="badge-dot dot-amber"></span> Próximo a vencer</span>`;
      case 'ATRASADO':
        return `<span class="badge badge-danger"><span class="badge-dot dot-red"></span> Atrasado</span>`;
      case 'TERMINADO':
      case 'PAGADA':
        return `<span class="badge badge-success"><span class="badge-dot dot-emerald"></span> Pagado</span>`;
      case 'PARCIAL':
        return `<span class="badge badge-info"><span class="badge-dot dot-cyan"></span> Pago Parcial</span>`;
      case 'PENDIENTE':
        return `<span class="badge badge-neutral"><span class="badge-dot dot-gray"></span> Pendiente</span>`;
      default:
        return `<span class="badge badge-neutral">${status}</span>`;
    }
  }

  static cleanPhoneForWhatsApp(phone) {
    if (!phone) return '';
    // Remueve espacios, guiones, paréntesis
    let clean = phone.replace(/[^\d+]/g, '');
    if (!clean.startsWith('+')) {
      // Si no tiene código de país, asume que se puede agregar o usar como está
      clean = clean.replace(/^0+/, '');
    } else {
      clean = clean.substring(1);
    }
    return clean;
  }

  static generateId(prefix = 'ID') {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${random}`;
  }

  static generateReceiptNumber(seq = 1) {
    const year = new Date().getFullYear();
    const padded = String(seq).padStart(4, '0');
    return `REC-${year}-${padded}`;
  }
}
