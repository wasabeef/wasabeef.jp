import 'package:flutter/material.dart';
import 'package:wasabeef_jp/app_theme.dart';
import 'package:wasabeef_jp/home_page.dart';

void main() => runApp(const App());

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Daichi Furiya (Wasabeef)',
      theme: appTheme,
      initialRoute: '/',
      routes: {'/': (context) => const HomePage()},
    );
  }
}
