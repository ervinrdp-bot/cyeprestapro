class Client {
  final String id;
  final String name;
  final String phone;
  final String address;
  final String birthDate;
  final String notes;
  final String avatar;
  final List<String> documents;

  Client({
    required this.id,
    required this.name,
    required this.phone,
    this.address = '',
    this.birthDate = '',
    this.notes = '',
    this.avatar = '👤',
    this.documents = const [],
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'phone': phone,
    'address': address,
    'birthDate': birthDate,
    'notes': notes,
    'avatar': avatar,
    'documents': documents,
  };

  factory Client.fromJson(Map<String, dynamic> json) => Client(
    id: json['id'],
    name: json['name'],
    phone: json['phone'],
    address: json['address'] ?? '',
    birthDate: json['birthDate'] ?? '',
    notes: json['notes'] ?? '',
    avatar: json['avatar'] ?? '👤',
    documents: List<String>.from(json['documents'] ?? []),
  );
}
