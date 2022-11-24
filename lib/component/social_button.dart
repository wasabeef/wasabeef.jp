import 'dart:html';

import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:wasabeef_jp/app_theme.dart';

class SocialButton extends StatelessWidget {
  const SocialButton({super.key, required this.icon, required this.link});

  final IconData icon;
  final String link;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: FaIcon(icon, color: secondaryColor),
      onPressed: () => window.open(link, 'Social link'),
    );
  }
}
