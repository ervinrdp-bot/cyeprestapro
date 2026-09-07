/**
 * Motor Financiero PrestaPro
 * Implementa la regla estricta de INTERÉS FIJO sobre el capital original.
 * Genera y recalcula tablas de amortización, cuotas y estados en tiempo real.
 */

export class LoanEngine {
  /**
   * Calcula el desglose preliminar de un préstamo
   * @param {number} principal - Monto original prestado (P)
   * @param {number} interestRate - Porcentaje de interés (r) ej: 10 para 10%
   * @param {number} installmentsCount - Número de cuotas (N)
   * @param {string} frequency - 'semanal' | 'quincenal' | 'mensual'
   * @param {string} issueDateStr - Fecha de entrega (YYYY-MM-DD)
   * @param {string} firstPaymentDateStr - Fecha del primer pago (YYYY-MM-DD)
   */
  static calculateLoanPreview({
    principal,
    interestRate,
    installmentsCount,
    frequency = 'semanal',
    issueDateStr,
    firstPaymentDateStr
  }) {
    const P = parseFloat(principal) || 0;
    const rate = parseFloat(interestRate) || 0;
    const N = parseInt(installmentsCount, 10) || 1;
    const months = this.getLoanMonths(N, frequency);
    const totalToPay = Math.round((P + (P * (rate / 100) * months)) * 100) / 100;
    const totalInterest = Math.round((totalToPay - P) * 100) / 100;
    const rawQuota = totalToPay / N;
    const quotaAmount = Math.round(rawQuota * 100) / 100;
    const capitalPerQuota = Math.round((P / N) * 100) / 100;
    const interestPerQuota = Math.round((totalInterest / N) * 100) / 100;

    // Generación de fechas proyectadas
    const firstDate = firstPaymentDateStr ? new Date(firstPaymentDateStr + 'T00:00:00') : new Date();
    const schedule = [];
    let currentBalance = totalToPay;

    for (let i = 1; i <= N; i++) {
      const paymentDate = this.addPeriod(firstDate, i - 1, frequency);
      // Para la última cuota, ajustar cualquier residuo por redondeo de centavos
      let thisQuota = quotaAmount;
      if (i === N) {
        const sumPrevious = quotaAmount * (N - 1);
        thisQuota = Math.round((totalToPay - sumPrevious) * 100) / 100;
      }

      currentBalance = Math.round((currentBalance - thisQuota) * 100) / 100;
      if (currentBalance < 0 || i === N) currentBalance = 0;

      schedule.push({
        number: i,
        date: paymentDate.toISOString().split('T')[0],
        formattedDate: this.formatDateReadable(paymentDate),
        amount: thisQuota,
        capital: capitalPerQuota,
        interest: interestPerQuota,
        paidAmount: 0,
        pendingAmount: thisQuota,
        status: 'PENDIENTE', // PENDIENTE | PAGADA | PARCIAL | ATRASADA
        balanceAfter: currentBalance
      });
    }

    return {
      principal: P,
      interestRate: rate,
      interestPeriodMonths: months,
      totalInterest,
      totalToPay,
      installmentsCount: N,
      quotaAmount,
      capitalPerQuota,
      interestPerQuota,
      frequency,
      issueDate: issueDateStr || new Date().toISOString().split('T')[0],
      firstPaymentDate: firstPaymentDateStr || firstDate.toISOString().split('T')[0],
      schedule
    };
  }

  static getLoanMonths(installmentsCount, frequency) {
    const periodsPerMonth = {
      semanal: 4,
      quincenal: 2,
      mensual: 1
    };
    return installmentsCount / (periodsPerMonth[frequency] || 4);
  }

  /**
   * Suma períodos según la frecuencia elegida
   */
  static addPeriod(baseDate, periodsCount, frequency) {
    const d = new Date(baseDate.getTime());
    if (periodsCount === 0) return d;

    switch (frequency) {
      case 'semanal':
        d.setDate(d.getDate() + (periodsCount * 7));
        break;
      case 'quincenal':
        d.setDate(d.getDate() + (periodsCount * 15));
        break;
      case 'mensual':
        d.setMonth(d.getMonth() + periodsCount);
        break;
      default:
        d.setDate(d.getDate() + (periodsCount * 7));
    }
    return d;
  }

  /**
   * Determina el estado actual de una cuota en base a pagos y fecha actual
   */
  static evaluateInstallmentStatus(installment, todayStr) {
    if (installment.paidAmount >= installment.amount - 0.01) {
      return 'PAGADA';
    }
    if (installment.paidAmount > 0) {
      return 'PARCIAL';
    }
    if (installment.date < todayStr) {
      return 'ATRASADA';
    }
    return 'PENDIENTE';
  }

  /**
   * Evalúa el estado global del préstamo
   * Estados: 'TERMINADO' | 'ATRASADO' | 'PROXIMO' | 'ACTIVO'
   */
  static evaluateLoanStatus(loan, todayStr) {
    if (loan.remainingBalance <= 0.01) {
      return 'TERMINADO';
    }

    const today = new Date(todayStr + 'T00:00:00');
    let hasOverdue = false;
    let hasUpcoming = false;

    for (const inst of loan.schedule) {
      if (inst.paidAmount < inst.amount - 0.01) {
        const dueDate = new Date(inst.date + 'T00:00:00');
        if (inst.date < todayStr) {
          hasOverdue = true;
          break;
        }
        const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 3) {
          hasUpcoming = true;
        }
      }
    }

    if (hasOverdue) return 'ATRASADO';
    if (hasUpcoming) return 'PROXIMO';
    return 'ACTIVO';
  }

  /**
   * Recalcula el préstamo después de aplicar un pago
   */
  static applyPaymentToLoan(loan, paymentAmount, installmentNumber = null) {
    let amountToApply = parseFloat(paymentAmount) || 0;
    const schedule = loan.schedule.map(item => ({ ...item }));
    const todayStr = new Date().toISOString().split('T')[0];

    // Si se especificó una cuota en particular
    if (installmentNumber !== null) {
      const target = schedule.find(s => s.number === installmentNumber);
      if (target) {
        const needed = Math.round((target.amount - target.paidAmount) * 100) / 100;
        const toPay = Math.min(amountToApply, needed);
        target.paidAmount = Math.round((target.paidAmount + toPay) * 100) / 100;
        target.pendingAmount = Math.max(0, Math.round((target.amount - target.paidAmount) * 100) / 100);
        target.status = this.evaluateInstallmentStatus(target, todayStr);
        amountToApply -= toPay;
      }
    }

    // Si queda saldo o no se especificó cuota, aplicar en orden cronológico a cuotas pendientes
    if (amountToApply > 0) {
      for (const inst of schedule) {
        if (amountToApply <= 0) break;
        const pending = Math.round((inst.amount - inst.paidAmount) * 100) / 100;
        if (pending > 0) {
          const applied = Math.min(amountToApply, pending);
          inst.paidAmount = Math.round((inst.paidAmount + applied) * 100) / 100;
          inst.pendingAmount = Math.max(0, Math.round((inst.amount - inst.paidAmount) * 100) / 100);
          inst.status = this.evaluateInstallmentStatus(inst, todayStr);
          amountToApply -= applied;
        }
      }
    }

    // Recalcular saldo restante y total pagado
    const totalPaid = schedule.reduce((sum, inst) => sum + inst.paidAmount, 0);
    const roundedTotalPaid = Math.round(totalPaid * 100) / 100;
    const remainingBalance = Math.max(0, Math.round((loan.totalToPay - roundedTotalPaid) * 100) / 100);

    // Actualizar saldos progresivos de la tabla
    let runningBalance = loan.totalToPay;
    schedule.forEach(inst => {
      runningBalance = Math.max(0, Math.round((runningBalance - inst.paidAmount) * 100) / 100);
      inst.balanceAfter = runningBalance;
    });

    // Encontrar número de cuota activa actual (primera no pagada)
    const nextUnpaid = schedule.find(s => s.status !== 'PAGADA');
    const currentQuotaIndex = nextUnpaid ? nextUnpaid.number : schedule.length;

    const updatedLoan = {
      ...loan,
      schedule,
      totalPaid: roundedTotalPaid,
      remainingBalance,
      currentQuotaDisplay: `${currentQuotaIndex} / ${schedule.length}`,
      nextDueDate: nextUnpaid ? nextUnpaid.date : null,
      nextDueAmount: nextUnpaid ? nextUnpaid.pendingAmount : 0
    };

    updatedLoan.status = this.evaluateLoanStatus(updatedLoan, todayStr);
    return updatedLoan;
  }

  static formatDateReadable(d) {
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
