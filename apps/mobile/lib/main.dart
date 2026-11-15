import 'package:flutter/material.dart';

void main() {
  runApp(const MadisingApp());
}

class MadisingApp extends StatelessWidget {
  const MadisingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MADISING',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF19736F)),
        useMaterial3: true,
      ),
      home: const Scaffold(
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.health_and_safety_outlined, size: 64),
                  SizedBox(height: 16),
                  Text('MADISING', style: TextStyle(fontSize: 30, fontWeight: FontWeight.w700)),
                  SizedBox(height: 12),
                  Text(
                    'Fondasi pengembangan. Belum tersedia pendaftaran, booking, maupun akses data medis.',
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
