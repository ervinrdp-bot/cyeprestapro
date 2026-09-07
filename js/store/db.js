/**
 * Almacén de Datos Central y Persistente PrestaPro
 * Maneja LocalStorage, Datos Demo, Integridad Referencial y Reactividad.
 */
import { LoanEngine } from '../models/loan_engine.js';
import { Formatters } from '../utils/formatters.js';
import { anonymousSession, firestore } from '../firebase-config.js';
import { doc, getDoc, onSnapshot, setDoc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const STORAGE_KEY = 'prestapro_db_v1';

export class DB {
  constructor() {
    this.listeners = [];
    this.firebaseReady = false;
    this.firebaseSyncing = false;
    this.firebaseUnsubscribe = null;
    this.localChangesPending = false;
    this.data = this.load();
    if (!this.data.initialized) {
      this.seedInitialData();
    }
    if (!this.data.productionCleaned) {
      this.resetToEmpty();
    }
    this.localChangesPending = false;
  }

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading DB from localStorage:', e);
    }
    return { initialized: false };
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      this.notify();
      this.localChangesPending = true;
      if (this.firebaseReady && !this.firebaseSyncing) this.syncToFirebase();
    } catch (e) {
      console.error('Error saving DB to localStorage:', e);
    }
  }

  async connectFirebase() {
    try {
      await anonymousSession();
      const reference = doc(firestore, 'prestapro', 'main');
      const snapshot = await getDoc(reference);

      if (snapshot.exists() && !this.localChangesPending) {
        this.data = snapshot.data();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        this.notify();
      } else {
        await setDoc(reference, this.data);
        this.localChangesPending = false;
      }

      this.firebaseReady = true;
      window.dispatchEvent(new CustomEvent('firebase-sync-ready'));
      this.firebaseUnsubscribe = onSnapshot(reference, (updatedSnapshot) => {
        if (!updatedSnapshot.exists() || this.firebaseSyncing || this.localChangesPending) return;
        this.data = updatedSnapshot.data();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        this.notify();
      }, (error) => {
        console.error('Firebase realtime sync error:', error);
      });
      return true;
    } catch (error) {
      console.error('Firebase connection error:', error);
      window.dispatchEvent(new CustomEvent('firebase-connection-error', { detail: error }));
      return false;
    }
  }

  async syncToFirebase() {
    if (!this.firebaseReady || this.firebaseSyncing) return;
    this.firebaseSyncing = true;
    try {
      await setDoc(doc(firestore, 'prestapro', 'main'), this.data);
      this.localChangesPending = false;
    } catch (error) {
      console.error('Firebase sync error:', error);
      window.dispatchEvent(new CustomEvent('firebase-sync-error', { detail: error }));
    } finally {
      this.firebaseSyncing = false;
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => {
      try { fn(this.data); } catch (err) { console.error('Listener error:', err); }
    });
  }

  /**
   * Inicializa la base de datos con datos de demostración realistas
   */
  seedInitialData() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const pastDate7 = new Date(today);
    pastDate7.setDate(today.getDate() - 7);
    const past7Str = pastDate7.toISOString().split('T')[0];

    const pastDate14 = new Date(today);
    pastDate14.setDate(today.getDate() - 14);
    const past14Str = pastDate14.toISOString().split('T')[0];

    const futureDate3 = new Date(today);
    futureDate3.setDate(today.getDate() + 3);
    const future3Str = futureDate3.toISOString().split('T')[0];

    const futureDate7 = new Date(today);
    futureDate7.setDate(today.getDate() + 7);
    const future7Str = futureDate7.toISOString().split('T')[0];

    const clients = [
      {
        id: 'CLI-1001',
        name: 'Carlos Mendoza Ramos',
        phone: '+18095551234',
        address: 'Av. Las Américas #142, Santo Domingo',
        birthDate: '1988-04-15',
        notes: 'Comerciante de abarrotes. Excelente cliente, siempre paga puntual.',
        avatar: '👨‍💼',
        documents: ['Cédula de identidad.pdf', 'Comprobante de domicilio.png'],
        createdAt: past14Str
      },
      {
        id: 'CLI-1002',
        name: 'María Alejandra Gómez',
        phone: '+18095555678',
        address: 'Calle Primavera #45, Edif. Los Pinos Apt 3B',
        birthDate: '1992-09-20',
        notes: 'Dueña de salón de belleza. Préstamo para equipamiento.',
        avatar: '👩‍💼',
        documents: ['Contrato local.pdf'],
        createdAt: past14Str
      },
      {
        id: 'CLI-1003',
        name: 'Roberto Dávila Sánchez',
        phone: '+18095558901',
        address: 'Sector El Progreso, Calle 4ta #12',
        birthDate: '1982-12-05',
        notes: 'Taller mecánico. Reporta atraso por avería de máquina.',
        avatar: '👨‍🔧',
        documents: ['Registro mercantil.pdf'],
        createdAt: past14Str
      },
      {
        id: 'CLI-1004',
        name: 'Laura Patricia Vega',
        phone: '+18095553322',
        address: 'Residencial San Marino, Casa 8',
        birthDate: '1995-07-11',
        notes: 'Boutique de ropa. Préstamo anterior liquidado en su totalidad.',
        avatar: '👩‍🎨',
        documents: [],
        createdAt: past14Str
      },
      {
        id: 'CLI-1005',
        name: 'Andrés Felipe Morales',
        phone: '+18095554433',
        address: 'Av. Independencia #880',
        birthDate: '1990-01-30',
        notes: 'Cliente nuevo prospecto para préstamo semanal.',
        avatar: '👨‍💻',
        documents: [],
        createdAt: todayStr
      }
    ];

    // Préstamo 1: Activo / Al día (Carlos Mendoza)
    const p1Calc = LoanEngine.calculateLoanPreview({
      principal: 1000,
      interestRate: 10,
      installmentsCount: 5,
      frequency: 'semanal',
      issueDateStr: past14Str,
      firstPaymentDateStr: past7Str
    });
    let loan1 = {
      id: 'PREST-1001',
      clientId: 'CLI-1001',
      clientName: 'Carlos Mendoza Ramos',
      clientPhone: '+18095551234',
      ...p1Calc,
      createdAt: past14Str
    };
    // Aplicar pago de cuota 1
    loan1 = LoanEngine.applyPaymentToLoan(loan1, 220, 1);

    // Préstamo 2: Próximo a vencer hoy o en 3 días (María Gómez)
    const p2Calc = LoanEngine.calculateLoanPreview({
      principal: 2000,
      interestRate: 15,
      installmentsCount: 4,
      frequency: 'quincenal',
      issueDateStr: past7Str,
      firstPaymentDateStr: todayStr // Vence hoy!
    });
    const loan2 = {
      id: 'PREST-1002',
      clientId: 'CLI-1002',
      clientName: 'María Alejandra Gómez',
      clientPhone: '+18095555678',
      ...p2Calc,
      remainingBalance: p2Calc.totalToPay,
      totalPaid: 0,
      currentQuotaDisplay: '1 / 4',
      status: 'PROXIMO',
      createdAt: past7Str
    };

    // Préstamo 3: Atrasado (Roberto Dávila)
    const p3Calc = LoanEngine.calculateLoanPreview({
      principal: 1500,
      interestRate: 12,
      installmentsCount: 6,
      frequency: 'semanal',
      issueDateStr: past14Str,
      firstPaymentDateStr: past14Str // Venció hace 14 días
    });
    const loan3 = {
      id: 'PREST-1003',
      clientId: 'CLI-1003',
      clientName: 'Roberto Dávila Sánchez',
      clientPhone: '+18095558901',
      ...p3Calc,
      remainingBalance: p3Calc.totalToPay,
      totalPaid: 0,
      currentQuotaDisplay: '1 / 6',
      status: 'ATRASADO',
      createdAt: past14Str
    };
    // Marcar cuota atrasada
    loan3.schedule[0].status = 'ATRASADA';
    loan3.schedule[1].status = 'ATRASADA';

    // Préstamo 4: Terminado / Liquidado (Laura Patricia Vega)
    const p4Calc = LoanEngine.calculateLoanPreview({
      principal: 800,
      interestRate: 10,
      installmentsCount: 4,
      frequency: 'semanal',
      issueDateStr: past14Str,
      firstPaymentDateStr: past14Str
    });
    let loan4 = {
      id: 'PREST-1004',
      clientId: 'CLI-1004',
      clientName: 'Laura Patricia Vega',
      clientPhone: '+18095553322',
      ...p4Calc,
      createdAt: past14Str
    };
    // Liquidar completamente
    loan4 = LoanEngine.applyPaymentToLoan(loan4, 880);

    const loans = [loan1, loan2, loan3, loan4];

    // Recibos iniciales
    const receipts = [
      {
        receiptNumber: 'REC-2026-0001',
        loanId: 'PREST-1001',
        clientId: 'CLI-1001',
        clientName: 'Carlos Mendoza Ramos',
        clientPhone: '+18095551234',
        amount: 220,
        quotaNumber: 'Cuota 1 de 5',
        paymentMethod: 'Efectivo',
        remainingBalance: 880,
        date: new Date(today.getTime() - 2 * 3600000).toISOString(),
        notes: 'Pago puntual cuota 1'
      },
      {
        receiptNumber: 'REC-2026-0002',
        loanId: 'PREST-1004',
        clientId: 'CLI-1004',
        clientName: 'Laura Patricia Vega',
        clientPhone: '+18095553322',
        amount: 880,
        quotaNumber: 'Liquidación Total (Cuotas 1 a 4)',
        paymentMethod: 'Transferencia',
        remainingBalance: 0,
        date: new Date(today.getTime() - 48 * 3600000).toISOString(),
        notes: 'Liquidación total anticipada sin penalidad'
      }
    ];

    const activityLog = [
      {
        id: 'ACT-01',
        timestamp: new Date().toISOString(),
        type: 'PAYMENT',
        description: 'Pago registrado por $220.00 para Carlos Mendoza (REC-2026-0001)',
        user: 'Propietario'
      },
      {
        id: 'ACT-02',
        timestamp: past7Str + 'T10:00:00Z',
        type: 'LOAN_CREATED',
        description: 'Nuevo préstamo PREST-1002 creado para María Alejandra Gómez ($2,000.00)',
        user: 'Propietario'
      },
      {
        id: 'ACT-03',
        timestamp: past14Str + 'T09:30:00Z',
        type: 'CLIENT_CREATED',
        description: 'Nuevo cliente registrado: Carlos Mendoza Ramos',
        user: 'Propietario'
      }
    ];

    const business = {
      name: 'PrestaPro Inversiones',
      phone: '+1 (809) 555-0199',
      address: 'Torre Financiera Capital, Piso 8, Suite 802',
      email: 'contacto@prestapro.com',
      currencySymbol: '$',
      receiptPrefix: 'REC-2026',
      receiptSeq: 3,
      allowPartialPayments: true,
      defaultInterestRate: 10,
      defaultInstallments: 5,
      defaultFrequency: 'semanal'
    };

    const automations = {
      reminder3Days: {
        enabled: true,
        days: 3,
        template: 'Hola [nombre]. Te recordamos que tu próximo pago de [monto] vence el [fecha]. Para cualquier duda comunícate con [negocio].'
      },
      reminder1Day: {
        enabled: true,
        days: 1,
        template: 'Estimado/a [nombre], te recordamos que mañana vence tu cuota de [monto]. Tu saldo pendiente es [saldo]. Saludos de [negocio].'
      },
      reminderToday: {
        enabled: true,
        days: 0,
        template: 'Hola [nombre]. Hoy vence tu pago programado de [monto] en [negocio]. Recuerda reportar tu comprobante una vez realizado.'
      },
      reminderOverdue: {
        enabled: true,
        days: -1,
        template: 'Hola [nombre]. Tu pago de [monto] correspondiente al [fecha] aparece pendiente en [negocio]. Por favor comunícate a la brevedad.'
      },
      paymentConfirmed: {
        enabled: true,
        template: 'Hola [nombre]. Hemos recibido tu pago de [monto]. Tu saldo pendiente actual es de [saldo]. ¡Gracias por tu puntualidad!'
      },
      loanFinished: {
        enabled: true,
        template: '🎉 ¡Felicidades [nombre]! Tu préstamo en [negocio] ha sido pagado completamente. Tienes disponible una nueva línea de crédito inmediata.'
      }
    };

    this.data = {
      initialized: true,
      clients,
      loans,
      receipts,
      activityLog,
      business,
      automations,
      currentUser: {
        name: 'Administrador General',
        role: 'Propietario'
      }
    };

    this.save();
  }

  // --- MÉTODOS DE CONSULTA Y OPERACIÓN ---

  getClients() {
    return this.data.clients || [];
  }

  getClientById(id) {
    return this.getClients().find(c => c.id === id);
  }

  addClient(clientData) {
    const id = Formatters.generateId('CLI');
    const newClient = {
      id,
      ...clientData,
      avatar: clientData.avatar || '👤',
      documents: clientData.documents || [],
      createdAt: new Date().toISOString().split('T')[0]
    };
    this.data.clients.unshift(newClient);
    this.logActivity('CLIENT_CREATED', `Nuevo cliente registrado: ${newClient.name} (${id})`);
    this.save();
    return newClient;
  }

  updateClient(id, clientData) {
    const idx = this.data.clients.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.clients[idx] = { ...this.data.clients[idx], ...clientData };
      this.logActivity('CLIENT_UPDATED', `Datos del cliente actualizados: ${this.data.clients[idx].name}`);
      this.save();
      return this.data.clients[idx];
    }
    return null;
  }

  deleteClient(id) {
    const hasLoans = this.getLoansByClientId(id).length > 0;
    if (hasLoans) {
      throw new Error('No se puede eliminar un cliente con historial o préstamos vinculados.');
    }
    const client = this.getClientById(id);
    this.data.clients = this.data.clients.filter(c => c.id !== id);
    this.logActivity('CLIENT_DELETED', `Cliente eliminado: ${client?.name || id}`);
    this.save();
  }

  getLoans() {
    return this.data.loans || [];
  }

  getLoanById(id) {
    return this.getLoans().find(l => l.id === id);
  }

  getLoansByClientId(clientId) {
    return this.getLoans().filter(l => l.clientId === clientId);
  }

  addLoan(loanInput) {
    const client = this.getClientById(loanInput.clientId);
    if (!client) throw new Error('Cliente no encontrado.');

    const calc = LoanEngine.calculateLoanPreview({
      principal: loanInput.principal,
      interestRate: loanInput.interestRate,
      installmentsCount: loanInput.installmentsCount,
      frequency: loanInput.frequency,
      issueDateStr: loanInput.issueDate,
      firstPaymentDateStr: loanInput.firstPaymentDate
    });

    const id = Formatters.generateId('PREST');
    const newLoan = {
      id,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      ...calc,
      remainingBalance: calc.totalToPay,
      totalPaid: 0,
      currentQuotaDisplay: `1 / ${calc.installmentsCount}`,
      status: 'ACTIVO',
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Evaluar estado de inicio
    newLoan.status = LoanEngine.evaluateLoanStatus(newLoan, new Date().toISOString().split('T')[0]);

    this.data.loans.unshift(newLoan);
    this.logActivity('LOAN_CREATED', `Préstamo ${id} creado para ${client.name} por $${newLoan.principal}`);
    this.save();
    return newLoan;
  }

  updateLoan(id, updatedFields) {
    const idx = this.data.loans.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Préstamo no encontrado.');

    const existing = this.data.loans[idx];
    if (existing.totalPaid > 0 && (updatedFields.principal || updatedFields.interestRate || updatedFields.installmentsCount)) {
      // Registrar en auditoría el cambio sensible
      this.logActivity('LOAN_MODIFIED', `Modificación en préstamo con pagos previos ${id}`);
    }

    this.data.loans[idx] = { ...existing, ...updatedFields };
    this.save();
    return this.data.loans[idx];
  }

  deleteLoan(id) {
    const loan = this.getLoanById(id);
    if (!loan) return;
    if (loan.totalPaid > 0) {
      throw new Error('Por seguridad e integridad contable no se puede eliminar un préstamo con pagos registrados.');
    }
    this.data.loans = this.data.loans.filter(l => l.id !== id);
    this.logActivity('LOAN_DELETED', `Préstamo eliminado: ${id}`);
    this.save();
  }

  /**
   * Registro de Pagos con sincronización en cascada
   */
  addPayment({ loanId, amount, paymentMethod, notes, installmentNumber = null, date = null }) {
    const loan = this.getLoanById(loanId);
    if (!loan) throw new Error('Préstamo no encontrado');
    if (loan.remainingBalance <= 0) throw new Error('El préstamo ya está completamente liquidado.');

    const client = this.getClientById(loan.clientId);
    const payAmount = Math.min(parseFloat(amount) || 0, loan.remainingBalance);
    if (payAmount <= 0) throw new Error('El monto debe ser mayor a 0');

    // Aplicar al motor financiero
    const updatedLoan = LoanEngine.applyPaymentToLoan(loan, payAmount, installmentNumber);

    // Actualizar en el almacén de préstamos
    const loanIdx = this.data.loans.findIndex(l => l.id === loanId);
    this.data.loans[loanIdx] = updatedLoan;

    // Generar recibo oficial
    const receiptSeq = (this.data.business.receiptSeq || 1);
    const receiptNumber = Formatters.generateReceiptNumber(receiptSeq);
    this.data.business.receiptSeq = receiptSeq + 1;

    const receipt = {
      receiptNumber,
      loanId: loan.id,
      clientId: loan.clientId,
      clientName: loan.clientName,
      clientPhone: loan.clientPhone,
      amount: payAmount,
      quotaNumber: installmentNumber ? `Cuota ${installmentNumber} de ${loan.installmentsCount}` : `Abono a saldo`,
      paymentMethod: paymentMethod || 'Efectivo',
      remainingBalance: updatedLoan.remainingBalance,
      date: date || new Date().toISOString(),
      notes: notes || ''
    };

    this.data.receipts.unshift(receipt);

    // Registrar en auditoría
    this.logActivity(
      'PAYMENT',
      `Pago recibido de ${Formatters.currency(payAmount, this.data.business.currencySymbol)} por ${loan.clientName} (${receiptNumber})`
    );

    this.save();
    return { updatedLoan, receipt };
  }

  getReceipts() {
    return this.data.receipts || [];
  }

  getReceiptByNumber(num) {
    return this.getReceipts().find(r => r.receiptNumber === num);
  }

  getActivityLog() {
    return this.data.activityLog || [];
  }

  logActivity(type, description, user = null) {
    const entry = {
      id: Formatters.generateId('ACT'),
      timestamp: new Date().toISOString(),
      type,
      description,
      user: user || this.data.currentUser?.name || 'Sistema'
    };
    if (!this.data.activityLog) this.data.activityLog = [];
    this.data.activityLog.unshift(entry);
    // Mantener los últimos 200 eventos
    if (this.data.activityLog.length > 200) {
      this.data.activityLog.pop();
    }
  }

  getBusinessSettings() {
    return this.data.business || {};
  }

  updateBusinessSettings(newSettings) {
    this.data.business = { ...this.data.business, ...newSettings };
    this.logActivity('CONFIG_UPDATED', 'Configuración del negocio actualizada');
    this.save();
  }

  getAutomations() {
    return this.data.automations || {};
  }

  updateAutomations(newAutomations) {
    this.data.automations = { ...this.data.automations, ...newAutomations };
    this.logActivity('CONFIG_UPDATED', 'Plantillas y reglas de WhatsApp actualizadas');
    this.save();
  }

  /**
   * Cálculo de métricas e inteligencia en tiempo real para el Dashboard y Reportes
   */
  getDashboardMetrics() {
    const loans = this.getLoans();
    const clients = this.getClients();
    const receipts = this.getReceipts();
    const todayStr = new Date().toISOString().split('T')[0];

    let totalPrincipal = 0;
    let totalCollected = 0;
    let totalToCollect = 0;
    let totalOverdue = 0;
    let activeLoansCount = 0;
    let finishedLoansCount = 0;

    // Resumen inteligente de hoy
    const todayDueItems = [];
    const overdueItems = [];
    let expectedToday = 0;
    let receivedToday = 0;
    const attentionClients = new Set();
    const nearFinishLoans = [];
    const recentlyFinishedLoans = [];

    // Calcular montos recibidos hoy desde los recibos
    receipts.forEach(r => {
      const receiptDate = (r.date || '').split('T')[0];
      if (receiptDate === todayStr) {
        receivedToday += r.amount;
      }
    });

    loans.forEach(loan => {
      totalPrincipal += loan.principal;
      totalCollected += loan.totalPaid;
      totalToCollect += loan.remainingBalance;

      if (loan.remainingBalance <= 0.01) {
        finishedLoansCount++;
        // Si se terminó recientemente (últimos 7 días)
        recentlyFinishedLoans.push(loan);
      } else {
        activeLoansCount++;
        // Préstamo próximo a terminar si solo le queda 1 cuota o saldo <= 20%
        if (loan.remainingBalance <= (loan.totalToPay * 0.25)) {
          nearFinishLoans.push(loan);
        }
      }

      // Analizar cuotas
      loan.schedule.forEach(inst => {
        if (inst.paidAmount < inst.amount - 0.01) {
          const isToday = inst.date === todayStr;
          const isPast = inst.date < todayStr;

          if (isToday) {
            expectedToday += inst.pendingAmount;
            todayDueItems.push({
              loanId: loan.id,
              clientName: loan.clientName,
              clientPhone: loan.clientPhone,
              quotaNumber: inst.number,
              totalQuotas: loan.installmentsCount,
              amount: inst.pendingAmount,
              date: inst.date
            });
          }

          if (isPast) {
            totalOverdue += inst.pendingAmount;
            overdueItems.push({
              loanId: loan.id,
              clientName: loan.clientName,
              clientPhone: loan.clientPhone,
              quotaNumber: inst.number,
              totalQuotas: loan.installmentsCount,
              amount: inst.pendingAmount,
              date: inst.date
            });
            attentionClients.add(loan.clientId);
          }
        }
      });
    });

    return {
      totalPrincipal,
      totalCollected,
      totalToCollect,
      totalOverdue,
      totalClients: clients.length,
      activeLoansCount,
      finishedLoansCount,
      scheduledPaymentsTodayCount: todayDueItems.length,
      expectedToday,
      receivedToday,
      todayDueItems,
      overdueItems,
      attentionClientsCount: attentionClients.size,
      nearFinishLoans,
      recentlyFinishedLoans
    };
  }

  /**
   * Respaldo y Restauración de Base de Datos
   */
  exportBackupJson() {
    return JSON.stringify(this.data, null, 2);
  }

  importBackupJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.clients || !parsed.loans) {
        throw new Error('Estructura de respaldo inválida.');
      }
      this.data = parsed;
      this.save();
      return true;
    } catch (err) {
      throw new Error('Error al procesar el archivo JSON: ' + err.message);
    }
  }

  resetToEmpty() {
    this.data = {
      initialized: true,
      productionCleaned: true,
      clients: [],
      loans: [],
      receipts: [],
      activityLog: [],
      business: {
        name: '',
        phone: '',
        address: '',
        email: '',
        currencySymbol: '$',
        receiptPrefix: 'REC-2026',
        receiptSeq: 1,
        allowPartialPayments: true,
        defaultInterestRate: 10,
        defaultInstallments: 5,
        defaultFrequency: 'semanal'
      },
      automations: {},
      currentUser: {
        name: 'Administrador General',
        role: 'Propietario',
        username: 'admin'
      }
    };
    this.save();
  }

  resetToDemo() {
    this.resetToEmpty();
  }
}

// Singleton global
export const db = new DB();
