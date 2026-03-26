## [0.2.2](https://github.com/emsrdl/tipsy/compare/v0.2.1...v0.2.2) (2026-03-26)


### Bug Fixes

* update permissions for gh api command and remove skip ci from release message ([e7f6287](https://github.com/emsrdl/tipsy/commit/e7f6287b561af10fe404600329c98863a3576233))

## [0.2.1](https://github.com/emsrdl/tipsy/compare/v0.2.0...v0.2.1) (2026-03-26)


### Bug Fixes

* dokploy tag detection deploy ([c5c7d51](https://github.com/emsrdl/tipsy/commit/c5c7d511122012b216db43a10d363f5d2b271d58))
* dokploy tag detection deploy ([#5](https://github.com/emsrdl/tipsy/issues/5)) ([4911547](https://github.com/emsrdl/tipsy/commit/4911547224455bccdbe77f5fefae4aa1c0a377b2))

## [0.2.0](https://github.com/emsrdl/tipsy/compare/v0.1.2...v0.2.0) (2026-03-26)


### Features

* add import/export functionality for shift data ([6d0dd36](https://github.com/emsrdl/tipsy/commit/6d0dd367481828047a274ecd331fe1f1c4532ba3))
* update guest mode references to signed out state and improve related logic across components ([263c856](https://github.com/emsrdl/tipsy/commit/263c8564c82a4e02ac2d472e74a901208944e160))


### Bug Fixes

* add 'user-plus' icon and update profile avatar component for profile switching ([270ac6d](https://github.com/emsrdl/tipsy/commit/270ac6d5d60a4b76b91b379acb944a4a68f158ce))
* add create profile button in guest mode when no profiles exist ([a8f5bd8](https://github.com/emsrdl/tipsy/commit/a8f5bd81129767754a6db75a1fab3e1e7c5c9c8a))
* add default kitchen percentage and update related settings in Smart Split functionality ([db070c9](https://github.com/emsrdl/tipsy/commit/db070c9988d86d1e0579f1a2b92e4bfdb29eba41))
* add guest variant to Badge component and update ProfileAvatar and SettingsScreen for guest mode ([43740de](https://github.com/emsrdl/tipsy/commit/43740de5be3ec4499e687a6dc49c675b848149d6))
* add lastUsedAt property to Profile and update related components for guest mode handling ([eb60c9a](https://github.com/emsrdl/tipsy/commit/eb60c9a3de6e6a509ac75f05a1812b58e1a2cf9f))
* add missing Bash(ls:*) permission and correct Dockerfile copy command ([b4c68dd](https://github.com/emsrdl/tipsy/commit/b4c68dda368e283570d1ef8b0b8e94668089d691))
* add reset all functionality with confirmation dialog across multiple screens ([839400b](https://github.com/emsrdl/tipsy/commit/839400bb225489071663f03a42cea232e1a5eaba))
* append 'development' label to app version in SettingsScreen for better clarity in dev mode ([4150d29](https://github.com/emsrdl/tipsy/commit/4150d29962d37bbc62158dee0cf84b3efe029380))
* disable remove button for profile owner and update employee group on reset ([26d91da](https://github.com/emsrdl/tipsy/commit/26d91da28ab690bc7e563f758775dc226ee12f15))
* enhance button styles and accessibility for role selection in SettingsScreen ([437e50a](https://github.com/emsrdl/tipsy/commit/437e50af97dc6437aad1a5b2da0d418ce010d9ad))
* enhance profile management and guest mode functionality ([#4](https://github.com/emsrdl/tipsy/issues/4)) ([ca3b399](https://github.com/emsrdl/tipsy/commit/ca3b39971255c4c3143375cf4c5491e987e6c2d2))
* enhance step navigation in ScreenContainer and related screens with clickable step pills ([e72ae3b](https://github.com/emsrdl/tipsy/commit/e72ae3b555acbe2d68647b19f5105c3cec123358))
* implement confirmation dialog for reset all functionality across multiple screens ([bb4cb3b](https://github.com/emsrdl/tipsy/commit/bb4cb3b36c5c1c0978ba0e5701be4d2d3d963db6))
* implement fallback name logic for employee display and normalize names across components ([cfa4450](https://github.com/emsrdl/tipsy/commit/cfa4450606a44ec40d5ad1b1a7e84fe604ead344))
* refactor threshold input handling in Results and Settings screens with new custom hook ([4dd5e57](https://github.com/emsrdl/tipsy/commit/4dd5e577392160573292a3accbb66bd91dc9021e))
* remove unused animations.css and integrate keyframes into globals.css ([88a9b53](https://github.com/emsrdl/tipsy/commit/88a9b53ce0982900c21a2362bbdfe1e1e152c6ee))
* remove unused smart split features and clean up SetupScreen component ([62dc885](https://github.com/emsrdl/tipsy/commit/62dc88530a86d31357258b061361fcfbe9458914))
* simplify nav element and enhance step pill styling in ScreenContainer ([f7d6bc8](https://github.com/emsrdl/tipsy/commit/f7d6bc8af464c7e60049dfc24803e28f46c3ee35))
* update badge and employee group colors, swap kitchen and service references in components ([7ec0f3e](https://github.com/emsrdl/tipsy/commit/7ec0f3e647d8489442a84b95774705dcab86eac9))
* update BadgeProps className type and sort employees in EmployeeForm for improved handling ([1b33cb0](https://github.com/emsrdl/tipsy/commit/1b33cb0889ce056c320dfe0c13e708180a6e51fc))
* update class names to remove unnecessary flex-shrink properties and improve consistency across components ([4d0ead2](https://github.com/emsrdl/tipsy/commit/4d0ead2258b047e1e1ade28d124c8a798283c65d))
* update dialog component styles for improved animations and layout consistency ([d83d37d](https://github.com/emsrdl/tipsy/commit/d83d37d531d18971629802fd09859735c1bbc0c7))
* update documentation with architecture, data model, i18n, smart split, styling, and testing details ([2c7f80d](https://github.com/emsrdl/tipsy/commit/2c7f80d7f401424e83b03d41e3bb6032b726ac54))
* update EmployeeRow component to enhance profile owner display and add initials functionality ([90debba](https://github.com/emsrdl/tipsy/commit/90debba315b5bec857d69b903a9b57f8712ce14b))
* update guest mode logic and permissions in Profile components and settings ([46ea97e](https://github.com/emsrdl/tipsy/commit/46ea97e8ff138ca4b8d130d25cdd2254583f7fdf))
* update HeaderBar component structure and improve logo navigation ([2475522](https://github.com/emsrdl/tipsy/commit/2475522c7b48e65dbcdd7bd59000e052e66ab855))
* update localization keys and improve reset functionality across screens ([3743b31](https://github.com/emsrdl/tipsy/commit/3743b310343a60a2166293f805cce5aec1e378fa))
* update settings.local.json permissions structure, add VITE_APP_VERSION to docker-compose.yml, and improve employee name resolution in ResultsScreen ([94cc26c](https://github.com/emsrdl/tipsy/commit/94cc26cb79697ae0f60c861b2f3241264f16de60))
* update styling for step pills and adjust color variables in Katzentempel theme ([e568a69](https://github.com/emsrdl/tipsy/commit/e568a692c023674962acc7487e8cb74d770370a2))
* update toast messages and improve localization in common and screens files ([7a80ecd](https://github.com/emsrdl/tipsy/commit/7a80ecdafb2f52756a52fbfdc425e29399c08167))

## [0.1.2](https://github.com/emsrdl/tipsy/compare/v0.1.1...v0.1.2) (2026-03-22)

### Bug Fixes

- update Dockerfile to ensure VITE_APP_VERSION falls back to package.json during build
  ([847d330](https://github.com/emsrdl/tipsy/commit/847d330326f6bf3ddfae1288423b24b1865e4d74))

## [0.1.1](https://github.com/emsrdl/tipsy/compare/v0.1.0...v0.1.1) (2026-03-22)

### Bug Fixes

- release version
  ([d395c45](https://github.com/emsrdl/tipsy/commit/d395c45ef80a8d5fe4564e7bf2182b547bcffd70))

## 0.1.0 (2026-03-22)

### Features

- add HistoryScreen for shift history visualization and management
  ([0ab88a8](https://github.com/emsrdl/tipsy/commit/0ab88a80fb7c4e7d47e7c8ab71bd10b9ed781159))
- add reset cash label to cash input screen and update related translations
  ([32a50a5](https://github.com/emsrdl/tipsy/commit/32a50a51aa8984c0ab45845c9a10a06c6ec53112))
- add smart splitting algorithm and related types
  ([9b01c32](https://github.com/emsrdl/tipsy/commit/9b01c3227065192f1cec2c8ce03c4eba33da9929))
- add tip distribution flow with setup, cash input, and results screens
  ([987c312](https://github.com/emsrdl/tipsy/commit/987c31217a77ed4b9ecf19fc00caf0022cea1977))
- add utility functions for calculations, export formatting, and validation
  ([11e0017](https://github.com/emsrdl/tipsy/commit/11e001751c760b47ae397e32c440e9b1b048f208))
- add VITE_APP_VERSION environment variable and update SettingsScreen to display it
  ([74a6520](https://github.com/emsrdl/tipsy/commit/74a6520b7f753b0b5ae877b366efb947c04506e3))
- enhance distribution logic and payout plans integration for smart splitting
  ([2a4f5ac](https://github.com/emsrdl/tipsy/commit/2a4f5ac3227bdfd36ee0e95f187e7acf50f158d4))
- enhance Dockerfile with ownership settings for built assets and add healthcheck; create
  .dockerignore for build exclusions
  ([c1f6d37](https://github.com/emsrdl/tipsy/commit/c1f6d370c87f405a9f464830f14c7db698294792))
- enhance export functionality with localized labels and improve CSV formatting
  ([7008c32](https://github.com/emsrdl/tipsy/commit/7008c32099db219d3956c553e24ef0588a9474a8))
- enhance import/export functionality and improve UI layout across multiple screens
  ([770e20e](https://github.com/emsrdl/tipsy/commit/770e20e4977c46a15498610fe4940cafb1cb0b6f))
- enhance settings and setup screens with confirmation dialogs and export functionality
  ([5405867](https://github.com/emsrdl/tipsy/commit/5405867fbbf5d738a321d0a32277c2d6958825b0))
- implement import functionality with ImportDialog component and enhance employee reset feature
  ([cb54207](https://github.com/emsrdl/tipsy/commit/cb5420780f42d8ba8c2992c31f515b6014b8cfaa))
- redesign EmployeeForm with Material UI components and touch-first interactions
  ([504b71e](https://github.com/emsrdl/tipsy/commit/504b71e28d7fbec03dafc79444f53666bb9d09db))
- update README to reflect Progressive Web App details and quick start instructions
  ([8c68c98](https://github.com/emsrdl/tipsy/commit/8c68c98c5d3334416ab34f0373f7a2dcb6a73895))

### Bug Fixes

- add newline at end of commit-msg script for proper execution
  ([392672f](https://github.com/emsrdl/tipsy/commit/392672fb21922162028348093bea5a3f71a4ac0e))
- adjust tab width and active indicator styles in AppLayout
  ([b475a36](https://github.com/emsrdl/tipsy/commit/b475a3689f27406a05527903f5f02aaa0cb645c1))
- adjust toast container position for improved visibility
  ([e8833b9](https://github.com/emsrdl/tipsy/commit/e8833b9f3c7d7722cca604acab0cc62eacf8095b))
- ensure commitlint runs correctly in the commit-msg hook
  ([4c98349](https://github.com/emsrdl/tipsy/commit/4c98349fe7b60bbc5c883ca54b4ca592a81c4acb))
- ensure IPv6 support by adding listen directive for [::]:80
  ([5aa1321](https://github.com/emsrdl/tipsy/commit/5aa132116cc1c5400ef518e272f74af3cc16b388))
- ensure newline at end of commit-msg script for proper execution
  ([a70580a](https://github.com/emsrdl/tipsy/commit/a70580ac41f6332f5c2a4851217a501f02d62146))
- format VITE_APP_VERSION definition for consistency
  ([5843e74](https://github.com/emsrdl/tipsy/commit/5843e7466c913906f998a2a5ba1756d40234545d))
- formatting
  ([bcc2afe](https://github.com/emsrdl/tipsy/commit/bcc2afe75e6484507e693ad55ccb049d84526a40))
- update .dockerignore and .env.example for improved deployment configuration
  ([8e4b5a2](https://github.com/emsrdl/tipsy/commit/8e4b5a2a53492cb398dddbe61f987cd100050443))
- update release workflow to use RELEASE_TOKEN for authentication
  ([5bc4808](https://github.com/emsrdl/tipsy/commit/5bc480803de7871fa4e58dfed51b2d2a06e9c46a))
- update version environment variable setup for consistency
  ([adf254f](https://github.com/emsrdl/tipsy/commit/adf254f4e230f20507a9a42ebcd3933d45f28f29))
- update VITE_APP_DOMAIN handling to support runtime resolution for local and preview deployments
  ([15aeccb](https://github.com/emsrdl/tipsy/commit/15aeccb1e0d5d0f8e25eaa083d6946338968eeee))
