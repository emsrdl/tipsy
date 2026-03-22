## [0.1.2](https://github.com/emsrdl/tipsy/compare/v0.1.1...v0.1.2) (2026-03-22)


### Bug Fixes

* update Dockerfile to ensure VITE_APP_VERSION falls back to package.json during build ([847d330](https://github.com/emsrdl/tipsy/commit/847d330326f6bf3ddfae1288423b24b1865e4d74))

## [0.1.1](https://github.com/emsrdl/tipsy/compare/v0.1.0...v0.1.1) (2026-03-22)


### Bug Fixes

* release version ([d395c45](https://github.com/emsrdl/tipsy/commit/d395c45ef80a8d5fe4564e7bf2182b547bcffd70))

## 1.0.0 (2026-03-22)


### Features

* add HistoryScreen for shift history visualization and management ([0ab88a8](https://github.com/emsrdl/tipsy/commit/0ab88a80fb7c4e7d47e7c8ab71bd10b9ed781159))
* add reset cash label to cash input screen and update related translations ([32a50a5](https://github.com/emsrdl/tipsy/commit/32a50a51aa8984c0ab45845c9a10a06c6ec53112))
* add smart splitting algorithm and related types ([9b01c32](https://github.com/emsrdl/tipsy/commit/9b01c3227065192f1cec2c8ce03c4eba33da9929))
* add tip distribution flow with setup, cash input, and results screens ([987c312](https://github.com/emsrdl/tipsy/commit/987c31217a77ed4b9ecf19fc00caf0022cea1977))
* add utility functions for calculations, export formatting, and validation ([11e0017](https://github.com/emsrdl/tipsy/commit/11e001751c760b47ae397e32c440e9b1b048f208))
* add VITE_APP_VERSION environment variable and update SettingsScreen to display it ([74a6520](https://github.com/emsrdl/tipsy/commit/74a6520b7f753b0b5ae877b366efb947c04506e3))
* enhance distribution logic and payout plans integration for smart splitting ([2a4f5ac](https://github.com/emsrdl/tipsy/commit/2a4f5ac3227bdfd36ee0e95f187e7acf50f158d4))
* enhance Dockerfile with ownership settings for built assets and add healthcheck; create .dockerignore for build exclusions ([c1f6d37](https://github.com/emsrdl/tipsy/commit/c1f6d370c87f405a9f464830f14c7db698294792))
* enhance export functionality with localized labels and improve CSV formatting ([7008c32](https://github.com/emsrdl/tipsy/commit/7008c32099db219d3956c553e24ef0588a9474a8))
* enhance import/export functionality and improve UI layout across multiple screens ([770e20e](https://github.com/emsrdl/tipsy/commit/770e20e4977c46a15498610fe4940cafb1cb0b6f))
* enhance settings and setup screens with confirmation dialogs and export functionality ([5405867](https://github.com/emsrdl/tipsy/commit/5405867fbbf5d738a321d0a32277c2d6958825b0))
* implement import functionality with ImportDialog component and enhance employee reset feature ([cb54207](https://github.com/emsrdl/tipsy/commit/cb5420780f42d8ba8c2992c31f515b6014b8cfaa))
* redesign EmployeeForm with Material UI components and touch-first interactions ([504b71e](https://github.com/emsrdl/tipsy/commit/504b71e28d7fbec03dafc79444f53666bb9d09db))
* update README to reflect Progressive Web App details and quick start instructions ([8c68c98](https://github.com/emsrdl/tipsy/commit/8c68c98c5d3334416ab34f0373f7a2dcb6a73895))


### Bug Fixes

* add newline at end of commit-msg script for proper execution ([392672f](https://github.com/emsrdl/tipsy/commit/392672fb21922162028348093bea5a3f71a4ac0e))
* adjust tab width and active indicator styles in AppLayout ([b475a36](https://github.com/emsrdl/tipsy/commit/b475a3689f27406a05527903f5f02aaa0cb645c1))
* adjust toast container position for improved visibility ([e8833b9](https://github.com/emsrdl/tipsy/commit/e8833b9f3c7d7722cca604acab0cc62eacf8095b))
* ensure commitlint runs correctly in the commit-msg hook ([4c98349](https://github.com/emsrdl/tipsy/commit/4c98349fe7b60bbc5c883ca54b4ca592a81c4acb))
* ensure IPv6 support by adding listen directive for [::]:80 ([5aa1321](https://github.com/emsrdl/tipsy/commit/5aa132116cc1c5400ef518e272f74af3cc16b388))
* ensure newline at end of commit-msg script for proper execution ([a70580a](https://github.com/emsrdl/tipsy/commit/a70580ac41f6332f5c2a4851217a501f02d62146))
* format VITE_APP_VERSION definition for consistency ([5843e74](https://github.com/emsrdl/tipsy/commit/5843e7466c913906f998a2a5ba1756d40234545d))
* formatting ([bcc2afe](https://github.com/emsrdl/tipsy/commit/bcc2afe75e6484507e693ad55ccb049d84526a40))
* update .dockerignore and .env.example for improved deployment configuration ([8e4b5a2](https://github.com/emsrdl/tipsy/commit/8e4b5a2a53492cb398dddbe61f987cd100050443))
* update release workflow to use RELEASE_TOKEN for authentication ([5bc4808](https://github.com/emsrdl/tipsy/commit/5bc480803de7871fa4e58dfed51b2d2a06e9c46a))
* update version environment variable setup for consistency ([adf254f](https://github.com/emsrdl/tipsy/commit/adf254f4e230f20507a9a42ebcd3933d45f28f29))
* update VITE_APP_DOMAIN handling to support runtime resolution for local and preview deployments ([15aeccb](https://github.com/emsrdl/tipsy/commit/15aeccb1e0d5d0f8e25eaa083d6946338968eeee))
