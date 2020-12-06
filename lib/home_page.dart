import 'dart:html';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:gap/gap.dart';

import 'app_theme.dart';
import 'component/social_button.dart';
import 'gen/assets.gen.dart';

class HomePage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Material(
      child: Stack(
        children: [
          Center(
              child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircleAvatar(
                backgroundImage: Assets.images.profile,
                backgroundColor: Colors.transparent,
                radius: 85,
              ),
              const Gap(12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Daichi Furiya',
                      style: Theme.of(context).textTheme.headline1),
                  const Gap(8),
                  const Text(
                    'Github account is Wasabeef',
                    style: bodyText1,
                  ),
                  const Gap(4),
                  const Text(
                    'Google Developers Expert for Android.',
                    style: bodyText1,
                  ),
                  const Gap(4),
                  Row(
                    children: [
                      const SocialButton(
                        icon: FontAwesomeIcons.medium,
                        link: 'http://wasabeef.medium.com',
                      ),
                      const SocialButton(
                        icon: FontAwesomeIcons.github,
                        link: 'https://github.com/wasabeef',
                      ),
                      const SocialButton(
                        icon: FontAwesomeIcons.twitter,
                        link: 'https://twitter.com/wasabeef_jp',
                      ),
                      const SocialButton(
                        icon: FontAwesomeIcons.speakerDeck,
                        link: 'https://speakerdeck.com/wasabeef',
                      ),
                      const SocialButton(
                        icon: FontAwesomeIcons.linkedin,
                        link: 'https://linkedin.com/in/wasabeef',
                      ),
                      const SocialButton(
                        icon: FontAwesomeIcons.stackOverflow,
                        link: 'https://stackoverflow.com/users/3089868',
                      ),
                    ],
                  ),
                ],
              ),
            ],
          )),
          Align(
            alignment: Alignment.bottomCenter,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Image.network(
                    'https://www.cutercounter.com/hit.php?id=grunxnap&nd=6&style=27'),
                const Gap(4),
                const Text(
                  'Running on Flutter Web',
                  style: TextStyle(fontSize: 10),
                ),
                const Gap(18)
              ],
            ),
          )
        ],
      ),
    );
  }
}
