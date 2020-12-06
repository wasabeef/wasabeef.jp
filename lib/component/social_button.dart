import 'dart:html';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

import '../app_theme.dart';

class SocialButton extends StatelessWidget {
  const SocialButton({IconData icon, String link})
      : _icon = icon,
        _link = link;

  final IconData _icon;
  final String _link;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: FaIcon(_icon, color: secondaryColor),
      onPressed: () => window.open(_link, 'Social link'),
    );
  }
}
