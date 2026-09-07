import '../models/loan.dart';
import '../models/installment.dart';

class LoanEngineDart {
  /// Calcula el desglose preliminar respetando la regla de interés fijo
  static Map<String, dynamic> calculateLoanPreview({
    required double principal,
    required double interestRate,
    required int installmentsCount,
    String frequency = 'semanal',
    required DateTime issueDate,
    required DateTime firstPaymentDate,
  }) {
    final months = getLoanMonths(installmentsCount, frequency);
    final totalToPay = double.parse(
      (principal + (principal * (interestRate / 100) * months)).toStringAsFixed(2),
    );
    final totalInterest = double.parse((totalToPay - principal).toStringAsFixed(2));
    
    final quotaAmount = double.parse((totalToPay / installmentsCount).toStringAsFixed(2));
    final capitalPerQuota = double.parse((principal / installmentsCount).toStringAsFixed(2));
    final interestPerQuota = double.parse((totalInterest / installmentsCount).toStringAsFixed(2));

    final schedule = <Installment>[];
    double currentBalance = totalToPay;

    for (int i = 1; i <= installmentsCount; i++) {
      final paymentDate = addPeriod(firstPaymentDate, i - 1, frequency);
      double thisQuota = quotaAmount;
      if (i == installmentsCount) {
        final sumPrev = quotaAmount * (installmentsCount - 1);
        thisQuota = double.parse((totalToPay - sumPrev).toStringAsFixed(2));
      }

      currentBalance = double.parse((currentBalance - thisQuota).toStringAsFixed(2));
      if (currentBalance < 0 || i == installmentsCount) currentBalance = 0.0;

      schedule.add(Installment(
        number: i,
        date: paymentDate,
        amount: thisQuota,
        capital: capitalPerQuota,
        interest: interestPerQuota,
        pendingAmount: thisQuota,
        balanceAfter: currentBalance,
      ));
    }

    return {
      'principal': principal,
      'interestRate': interestRate,
      'interestPeriodMonths': months,
      'totalInterest': totalInterest,
      'totalToPay': totalToPay,
      'installmentsCount': installmentsCount,
      'quotaAmount': quotaAmount,
      'capitalPerQuota': capitalPerQuota,
      'interestPerQuota': interestPerQuota,
      'frequency': frequency,
      'schedule': schedule,
    };
  }

  static double getLoanMonths(int installmentsCount, String frequency) {
    const periodsPerMonth = {
      'semanal': 4,
      'quincenal': 2,
      'mensual': 1,
    };
    return installmentsCount / (periodsPerMonth[frequency] ?? 4);
  }

  static DateTime addPeriod(DateTime baseDate, int count, String frequency) {
    if (count == 0) return baseDate;
    switch (frequency) {
      case 'semanal':
        return baseDate.add(Duration(days: count * 7));
      case 'quincenal':
        return baseDate.add(Duration(days: count * 15));
      case 'mensual':
        return DateTime(baseDate.year, baseDate.month + count, baseDate.day);
      default:
        return baseDate.add(Duration(days: count * 7));
    }
  }
}
