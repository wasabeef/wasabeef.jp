import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:wasabeef_jp/app_theme.dart';
import 'package:wasabeef_jp/component/social_button.dart';
import 'package:wasabeef_jp/gen/assets.gen.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Material(
      child: SelectionArea(
        child: Stack(
          children: [
            Center(
                child: Wrap(
              alignment: WrapAlignment.center,
              crossAxisAlignment: WrapCrossAlignment.center,
              runAlignment: WrapAlignment.center,
              runSpacing: 24,
              spacing: 12,
              children: [
                CircleAvatar(
                  backgroundImage: Assets.images.profile.provider(),
                  backgroundColor: Colors.transparent,
                  radius: 85,
                ),
                Wrap(
                  alignment: WrapAlignment.center,
                  direction: Axis.vertical,
                  spacing: 4,
                  children: [
                    Text('Daichi Furiya',
                        style: Theme.of(context).textTheme.headline1),
                    const Text(
                      'GitHub account is Wasabeef',
                      style: bodyText1,
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Google Developers Expert for Android',
                      style: bodyText1,
                    ),
                    Wrap(
                      spacing: 2,
                      children: const [
                        SocialButton(
                          icon: FontAwesomeIcons.medium,
                          link: 'http://wasabeef.medium.com',
                        ),
                        SocialButton(
                          icon: FontAwesomeIcons.github,
                          link: 'https://github.com/wasabeef',
                        ),
                        SocialButton(
                          icon: FontAwesomeIcons.twitter,
                          link: 'https://twitter.com/wasabeef_jp',
                        ),
                        SocialButton(
                          icon: FontAwesomeIcons.speakerDeck,
                          link: 'https://speakerdeck.com/wasabeef',
                        ),
                        SocialButton(
                          icon: FontAwesomeIcons.linkedin,
                          link: 'https://linkedin.com/in/wasabeef',
                        ),
                        SocialButton(
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
                  const SizedBox(height: 8),
                  const Text(
                    'Running on Flutter Web',
                    style: TextStyle(fontSize: 10),
                  ),
                  const SizedBox(height: 18)
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}
