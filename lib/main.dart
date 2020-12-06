import 'package:flutter/material.dart';

import 'app_theme.dart';
import 'home_page.dart';

void main() => runApp(App());

class App extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Daichi Furiya (Wasabeef)',
      theme: appTheme,
      home: HomePage(),
    );
  }
}
