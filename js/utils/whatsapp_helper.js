/**
 * Gestor de Enlaces y Plantillas de WhatsApp PrestaPro
 */
import { Formatters } from './formatters.js';

export class WhatsAppHelper {
  /**
   * Reemplaza variables dinámicas en la plantilla
   */
  static parseTemplate(templateText, data = {}) {
    let result = templateText || '';
    const replacements = {
      '\\[nombre\\]': data.clientName || 'Cliente',
      '\\[monto\\]': data.amount || '$0.00',
      '\\[fecha\\]': data.date || 'hoy',
      '\\[saldo\\]': data.balance || '$0.00',
      '\\[cuota\\]': data.quota || '1',
      '\\[negocio\\]': data.businessName || 'PrestaPro'
    };

    for (const [key, val] of Object.entries(replacements)) {
      result = result.replace(new RegExp(key, 'gi'), val);
    }
    return result;
  }

  /**
   * Genera el enlace wa.me para abrir la conversación en WhatsApp
   */
  static buildWhatsAppUrl(phone, message) {
    const cleanPhone = Formatters.cleanPhoneForWhatsApp(phone);
    const encodedMessage = encodeURIComponent(message);
    if (!cleanPhone) {
      return `https://wa.me/?text=${encodedMessage}`;
    }
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }

  /**
   * Abre directamente la ventana de WhatsApp
   */
  static openWhatsApp(phone, message) {
    const url = this.buildWhatsAppUrl(phone, message);
    window.open(url, '_blank');
  }
}
