class Installment {
  final int number;
  final DateTime date;
  final double amount;
  final double capital;
  final double interest;
  double paidAmount;
  double pendingAmount;
  String status; // 'PENDIENTE' | 'PAGADA' | 'PARCIAL' | 'ATRASADA'
  double balanceAfter;

  Installment({
    required this.number,
    required this.date,
    required this.amount,
    required this.capital,
    required this.interest,
    this.paidAmount = 0.0,
    required this.pendingAmount,
    this.status = 'PENDIENTE',
    required this.balanceAfter,
  });

  Map<String, dynamic> toJson() => {
    'number': number,
    'date': date.toIso8601String().split('T')[0],
    'amount': amount,
    'capital': capital,
    'interest': interest,
    'paidAmount': paidAmount,
    'pendingAmount': pendingAmount,
    'status': status,
    'balanceAfter': balanceAfter,
  };

  factory Installment.fromJson(Map<String, dynamic> json) => Installment(
    number: json['number'],
    date: DateTime.parse(json['date']),
    amount: (json['amount'] as num).toDouble(),
    capital: (json['capital'] as num).toDouble(),
    interest: (json['interest'] as num).toDouble(),
    paidAmount: (json['paidAmount'] as num).toDouble(),
    pendingAmount: (json['pendingAmount'] as num).toDouble(),
    status: json['status'],
    balanceAfter: (json['balanceAfter'] as num).toDouble(),
  );
}
