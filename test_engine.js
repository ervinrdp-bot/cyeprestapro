/**
 * Script de Verificación Automatizada del Motor Financiero PrestaPro
 */
import { LoanEngine } from './js/models/loan_engine.js';

function runTests() {
  console.log('🧪 INICIANDO PRUEBAS DE REGLAS DE NEGOCIO Y MATEMÁTICA FINANCIERA...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASÓ: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FALLÓ: ${message}`);
      failed++;
    }
  }

  // PRUEBA 1: Regla fundamental de interés fijo
  // Ejemplo: Monto: $1,000, Interés: 1% mensual, 10 cuotas mensuales
  const preview = LoanEngine.calculateLoanPreview({
    principal: 1000,
    interestRate: 1,
    installmentsCount: 10,
    frequency: 'mensual',
    issueDateStr: '2026-09-01',
    firstPaymentDateStr: '2026-09-08'
  });

  assert(preview.principal === 1000, 'Capital original es 1,000');
  assert(preview.totalInterest === 100, 'Interés total es exactamente $100 (1% mensual x 10 meses)');
  assert(preview.totalToPay === 1100, 'Total a pagar es $1,100 ($1,000 + $100)');
  assert(preview.quotaAmount === 110, 'Monto por cuota es $110 ($1,100 / 10)');
  assert(preview.capitalPerQuota === 100, 'Abono a capital por cuota es $100 ($1,000 / 10)');
  assert(preview.interestPerQuota === 10, 'Abono a interés por cuota es $10 ($100 / 10)');
  assert(preview.schedule.length === 10, 'Se generaron 10 cuotas en el cronograma');

  // Verificar amortización acumulada
  const sumQuotas = preview.schedule.reduce((s, c) => s + c.amount, 0);
  assert(Math.abs(sumQuotas - 1100) < 0.01, 'La suma de todas las cuotas es exactamente $1,100');

  // PRUEBA 2: Pagos parciales y actualización en cascada
  let loan = {
    id: 'PREST-TEST',
    clientId: 'CLI-TEST',
    clientName: 'Cliente Test',
    clientPhone: '+18090000000',
    ...preview,
    remainingBalance: preview.totalToPay,
    totalPaid: 0,
    currentQuotaDisplay: '1 / 10',
    status: 'ACTIVO'
  };

  // Aplicar pago parcial de $50 a la cuota 1 (que es de $110)
  loan = LoanEngine.applyPaymentToLoan(loan, 50, 1);
  assert(loan.schedule[0].paidAmount === 50, 'Cuota 1 tiene $50 pagados');
  assert(loan.schedule[0].pendingAmount === 60, 'Cuota 1 tiene $60 pendientes');
  assert(loan.schedule[0].status === 'PARCIAL', 'Estado de cuota 1 es PARCIAL');
  assert(loan.totalPaid === 50, 'Total pagado del préstamo es $50');
  assert(loan.remainingBalance === 1050, 'Saldo restante del préstamo es $1,050 ($1,100 - $50)');

  // Completar cuota 1 con otro abono de $60
  loan = LoanEngine.applyPaymentToLoan(loan, 60, 1);
  assert(loan.schedule[0].paidAmount === 110, 'Cuota 1 completada con $110 pagados');
  assert(loan.schedule[0].pendingAmount === 0, 'Cuota 1 tiene $0 pendiente');
  assert(loan.schedule[0].status === 'PAGADA', 'Estado de cuota 1 es PAGADA');
  assert(loan.remainingBalance === 990, 'Saldo restante es $990');

  // PRUEBA 3: Liquidación total del préstamo
  loan = LoanEngine.applyPaymentToLoan(loan, loan.remainingBalance);
  assert(loan.remainingBalance === 0, 'Saldo restante tras liquidación es $0');
  assert(loan.totalPaid === 1100, 'Total pagado alcanza el 100% ($1,100)');
  assert(loan.status === 'TERMINADO', 'Estado del préstamo pasa automáticamente a TERMINADO');

  // PRUEBA 4: Interés mensual aplicado según la frecuencia
  const monthlyPreview = LoanEngine.calculateLoanPreview({
    principal: 10000,
    interestRate: 10,
    installmentsCount: 5,
    frequency: 'mensual',
    issueDateStr: '2026-09-01',
    firstPaymentDateStr: '2026-10-01'
  });
  const biweeklyPreview = LoanEngine.calculateLoanPreview({
    principal: 10000,
    interestRate: 10,
    installmentsCount: 12,
    frequency: 'quincenal',
    issueDateStr: '2026-09-01',
    firstPaymentDateStr: '2026-09-15'
  });

  assert(monthlyPreview.totalInterest === 5000, 'Mensual: interés total es $5,000');
  assert(monthlyPreview.totalToPay === 15000, 'Mensual: total a pagar es $15,000');
  assert(monthlyPreview.quotaAmount === 3000, 'Mensual: cuota es $3,000');
  assert(biweeklyPreview.totalInterest === 6000, 'Quincenal: interés total es $6,000');
  assert(biweeklyPreview.totalToPay === 16000, 'Quincenal: total a pagar es $16,000');
  assert(biweeklyPreview.quotaAmount === 1333.33, 'Quincenal: cuota es $1,333.33');
  assert(biweeklyPreview.schedule[1].date === '2026-09-30', 'Quincenal avanza exactamente 15 días');

  console.log(`\n========================================`);
  console.log(`RESUMEN: ${passed} pruebas superadas, ${failed} fallos.`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests();
