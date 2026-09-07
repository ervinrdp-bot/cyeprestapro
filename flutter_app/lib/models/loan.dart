import 'installment.dart';

class Loan {
  final String id;
  final String clientId;
  final String clientName;
  final String clientPhone;
  final double principal;
  final double interestRate;
  final double totalInterest;
  final double totalToPay;
  double totalPaid;
  double remainingBalance;
  final int installmentsCount;
  final double quotaAmount;
  final double capitalPerQuota;
  final double interestPerQuota;
  final String frequency;
  final DateTime issueDate;
  final DateTime firstPaymentDate;
  final List<Installment> schedule;
  String currentQuotaDisplay;
  String status; // 'ACTIVO' | 'PROXIMO' | 'ATRASADO' | 'TERMINADO'

  Loan({
    required this.id,
    required this.clientId,
    required this.clientName,
    required this.clientPhone,
    required this.principal,
    required this.interestRate,
    required this.totalInterest,
    required this.totalToPay,
    this.totalPaid = 0.0,
    required this.remainingBalance,
    required this.installmentsCount,
    required this.quotaAmount,
    required this.capitalPerQuota,
    required this.interestPerQuota,
    required this.frequency,
    required this.issueDate,
    required this.firstPaymentDate,
    required this.schedule,
    required this.currentQuotaDisplay,
    this.status = 'ACTIVO',
  });
}
