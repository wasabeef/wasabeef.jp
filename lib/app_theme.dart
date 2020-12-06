import 'package:flutter/material.dart';

import 'gen/fonts.gen.dart';

const headline1 = TextStyle(
  fontSize: 24,
  fontFamily: FontFamily.rotunda,
  fontWeight: FontWeight.bold,
  color: Colors.black,
);

const bodyText1 = TextStyle(
  fontSize: 12,
  color: secondaryColor,
);

const secondaryColor = Color(0xff555555);

ThemeData get appTheme {
  return ThemeData.light().copyWith(
    visualDensity: VisualDensity.adaptivePlatformDensity,
    textTheme: ThemeData.light()
        .textTheme
        .copyWith(
          headline1: headline1,
          bodyText1: bodyText1,
        )
        .apply(bodyColor: secondaryColor),
  );
}
