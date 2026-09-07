/**
 * Vista de Configuración del Sistema, Negocio, Roles y Auditoría PrestaPro
 */
import { db } from '../store/db.js';
import { Formatters } from '../utils/formatters.js';

export class SettingsView {
  static render(container) {
    const business = db.getBusinessSettings();
    const activityLog = db.getActivityLog();
    const currentUser = db.data.currentUser || { name: 'Propietario', role: 'Propietario' };

    container.innerHTML = `
      <div class="filter-bar">
        <div>
          <h3 style="font-size: 18px; font-weight: 700; color: #FFF;">Configuración y Ajustes del Sistema</h3>
          <p style="font-size: 13px; color: var(--text-muted);">Administra la identidad de tu negocio, reglas financieras, usuarios y seguridad</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px;">
        
        <!-- Datos del Negocio -->
        <div class="glass-card">
          <h4 style="font-size: 16px; font-weight: 700; color: #FFF; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
            <span>🏢</span> Datos del Negocio
          </h4>

          <form onsubmit="window.settingsView.handleSaveBusiness(event)">
            <div class="form-group">
              <label class="form-label">Nombre Comercial del Negocio</label>
              <input type="text" name="name" class="form-control" value="${business.name || ''}" required />
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Teléfono de Contacto</label>
                <input type="tel" name="phone" class="form-control" value="${business.phone || ''}" required />
              </div>

              <div class="form-group">
                <label class="form-label">Símbolo de Moneda</label>
                <input type="text" name="currencySymbol" class="form-control mono font-bold" value="${business.currencySymbol || '$'}" required style="font-size: 16px; color: var(--accent-cyan);" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Dirección Física</label>
              <input type="text" name="address" class="form-control" value="${business.address || ''}" />
            </div>

            <div class="form-group">
              <label class="form-label">Correo Electrónico</label>
              <input type="email" name="email" class="form-control" value="${business.email || ''}" />
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%;">
              💾 Guardar Datos del Negocio
            </button>
          </form>
        </div>

        <!-- Parámetros de Préstamos y Recibos -->
        <div class="glass-card">
          <h4 style="font-size: 16px; font-weight: 700; color: #FFF; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
            <span>📐</span> Parámetros de Crédito y Recibos
          </h4>

          <form onsubmit="window.settingsView.handleSaveLoanSettings(event)">
            <div class="form-grid-2">
              <div class="form-group">
                <label class="form-label">Tasa Interés Sugerida (%)</label>
                <input type="number" step="0.1" name="defaultInterestRate" class="form-control mono" value="${business.defaultInterestRate || 10}" required />
              </div>

              <div class="form-group">
                <label class="form-label">Cuotas Sugeridas</label>
                <input type="number" name="defaultInstallments" class="form-control mono" value="${business.defaultInstallments || 5}" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Tipo de Interés Obligatorio</label>
              <input type="text" class="form-control" value="INTERÉS FIJO (Sobre Capital Original)" disabled />
              <p style="font-size: 11px; color: var(--accent-cyan); margin-top: 4px;">
                ✓ Protegido: Fórmulas transparentes inalterables de cálculo fijo.
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">Prefijo de Recibos de Pago</label>
              <input type="text" name="receiptPrefix" class="form-control mono" value="${business.receiptPrefix || 'REC-2026'}" required />
            </div>

            <div class="form-group">
              <label class="form-label">Permitir Pagos Parciales</label>
              <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">
                <input type="checkbox" name="allowPartialPayments" ${business.allowPartialPayments ? 'checked' : ''} style="width: 18px; height: 18px;" />
                <span style="font-size: 13px; color: var(--text-main);">Habilitar abonos libres y cuotas incompletas</span>
              </div>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%;">
              💾 Guardar Parámetros
            </button>
          </form>
        </div>

        <!-- Control de Usuarios y Roles (Preparado para Futuro) -->
        <div class="glass-card">
          <h4 style="font-size: 16px; font-weight: 700; color: #FFF; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
            <span>👥</span> Perfiles de Acceso y Roles
          </h4>

          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong>👑 Propietario / Dueño</strong>
                <div style="font-size: 11px; color: var(--text-muted);">Acceso total irrestricto, configuración y eliminación</div>
              </div>
              <span class="badge badge-success">Activo</span>
            </div>

            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong>🛠️ Administrador</strong>
                <div style="font-size: 11px; color: var(--text-muted);">Creación de clientes, préstamos y emisión de reportes</div>
              </div>
              <span class="badge badge-info">Listo</span>
            </div>

            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong>🛵 Cobrador en Ruta</strong>
                <div style="font-size: 11px; color: var(--text-muted);">Solo registro de pagos y emisión de recibos en calle</div>
              </div>
              <span class="badge badge-info">Listo</span>
            </div>

            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong>💼 Empleado de Oficina</strong>
                <div style="font-size: 11px; color: var(--text-muted);">Registro de clientes y consulta de estados de cuenta</div>
              </div>
              <span class="badge badge-info">Listo</span>
            </div>
          </div>

          <div style="margin-top: 14px; padding: 10px; background: rgba(6,182,212,0.08); border-radius: var(--radius-sm); font-size: 12px; color: var(--accent-cyan);">
            ℹ️ Tu sesión actual está autenticada como <strong>${currentUser.name} (${currentUser.role})</strong>.
          </div>
        </div>

        <!-- Copia de Seguridad y Restauración -->
        <div class="glass-card">
          <h4 style="font-size: 16px; font-weight: 700; color: #FFF; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
            <span>💾</span> Respaldo y Base de Datos
          </h4>

          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
            PrestaPro guarda toda la información localmente en tu dispositivo. Puedes exportar un respaldo completo en JSON o restaurarlo cuando desees.
          </p>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button class="btn btn-secondary" onclick="window.settingsView.downloadBackup()">
              📥 Descargar Copia de Seguridad (JSON)
            </button>

            <button class="btn btn-secondary" onclick="document.getElementById('backup-file-input').click()">
              📤 Restaurar Copia de Seguridad
            </button>
            <input type="file" id="backup-file-input" accept=".json" style="display: none;" onchange="window.settingsView.handleRestoreFile(event)" />

            <button class="btn btn-danger" style="margin-top: 10px;" onclick="window.settingsView.confirmResetData()">
              ⚠️ Vaciar Base de Datos
            </button>
          </div>
        </div>

      </div>

      <!-- Registro de Actividad y Auditoría (Audit Log) -->
      <div class="glass-card" style="margin-top: 24px; padding: 0; overflow: hidden;">
        <div style="padding: 18px 20px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
          <h4 style="font-size: 15px; font-weight: 700; color: #FFF; display: flex; align-items: center; gap: 8px;">
            <span>🛡️</span> Registro de Actividad y Auditoría de Seguridad
          </h4>
          <span class="badge badge-neutral">${activityLog.length} eventos</span>
        </div>

        <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>Tipo de Evento</th>
                <th>Descripción</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              ${activityLog.map(act => `
                <tr>
                  <td class="mono" style="font-size: 11px;">${Formatters.dateTime(act.timestamp)}</td>
                  <td>
                    <span class="badge ${act.type === 'PAYMENT' ? 'badge-success' : act.type.includes('CREATED') ? 'badge-info' : 'badge-neutral'}">
                      ${act.type}
                    </span>
                  </td>
                  <td>${act.description}</td>
                  <td><span class="mono">${act.user}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    window.settingsView = this;
  }

  static handleSaveBusiness(e) {
    e.preventDefault();
    const form = e.target;
    db.updateBusinessSettings({
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      currencySymbol: form.currencySymbol.value.trim() || '$',
      address: form.address.value.trim(),
      email: form.email.value.trim()
    });
    window.appRouter.showToast('Datos del negocio actualizados exitosamente.');
    this.render(document.getElementById('content-area'));
  }

  static handleSaveLoanSettings(e) {
    e.preventDefault();
    const form = e.target;
    db.updateBusinessSettings({
      defaultInterestRate: parseFloat(form.defaultInterestRate.value) || 10,
      defaultInstallments: parseInt(form.defaultInstallments.value, 10) || 5,
      receiptPrefix: form.receiptPrefix.value.trim(),
      allowPartialPayments: form.allowPartialPayments.checked
    });
    window.appRouter.showToast('Parámetros de crédito guardados.');
    this.render(document.getElementById('content-area'));
  }

  static downloadBackup() {
    const jsonStr = db.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `PrestaPro_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.appRouter.showToast('Copia de seguridad descargada.');
  }

  static handleRestoreFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        db.importBackupJson(evt.target.result);
        window.appRouter.showToast('Base de datos restaurada correctamente.');
        window.appRouter.navigate('dashboard');
      } catch (err) {
        alert('Error al restaurar: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  static confirmResetData() {
    if (confirm('¿Estás seguro de vaciar la base de datos? Se eliminarán clientes, préstamos, pagos y recibos.')) {
      db.resetToEmpty();
      window.appRouter.showToast('Base de datos vaciada correctamente.');
      window.appRouter.navigate('dashboard');
    }
  }
}
