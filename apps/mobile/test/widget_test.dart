import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:madising/main.dart';

void main() {
  testWidgets('foundation screen contains no active clinical workflow', (tester) async {
    await tester.pumpWidget(const MadisingApp());
    expect(find.text('MADISING'), findsOneWidget);
    expect(find.byType(TextField), findsNothing);
    expect(find.textContaining('Belum tersedia'), findsOneWidget);
  });
}
