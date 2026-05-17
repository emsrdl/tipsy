## [0.6.5](https://github.com/emsrdl/tipsy/compare/v0.6.4...v0.6.5) (2026-05-17)


### Bug Fixes

* centralize scroll container ID for consistent access across components ([246b32a](https://github.com/emsrdl/tipsy/commit/246b32a7c67ba11bb8e42432efc0914656d01de9))
* replace direct DOM manipulation with getScrollEl for smooth scro… ([#25](https://github.com/emsrdl/tipsy/issues/25)) ([d77f473](https://github.com/emsrdl/tipsy/commit/d77f473106cc9d7e567f0a85fd88bd1cb3e24ffb))
* replace direct DOM manipulation with getScrollEl for smooth scrolling after adding an employee ([8335913](https://github.com/emsrdl/tipsy/commit/83359133a0e1b90254ee4706d185db55195335cc))
* replace setTimeout with requestAnimationFrame for smoother scrolling after adding an employee ([9fb1650](https://github.com/emsrdl/tipsy/commit/9fb1650b4bb2a158ae655cbd2d77938d3e632952))

## [0.6.4](https://github.com/emsrdl/tipsy/compare/v0.6.3...v0.6.4) (2026-05-14)


### Bug Fixes

* ensure smooth scrolling to the bottom after adding an employee ([a5b7ca7](https://github.com/emsrdl/tipsy/commit/a5b7ca7fa4331c81589f3019dbb81b9e60d0318c))
* ensure smooth scrolling to the bottom after adding an employee ([#24](https://github.com/emsrdl/tipsy/issues/24)) ([56ab80e](https://github.com/emsrdl/tipsy/commit/56ab80e56ef30b3f0e65549a247957bb37f18621))

## [0.6.3](https://github.com/emsrdl/tipsy/compare/v0.6.2...v0.6.3) (2026-05-14)


### Bug Fixes

* enhance shadow elevation clipping for HeaderBar and clarify CSS comments ([c89a8e6](https://github.com/emsrdl/tipsy/commit/c89a8e6e78bc2ffca4c17d92131f397b06bb7cb4))
* implement elevation shadow clipping for HeaderBar and update theme color handling ([5d38b5f](https://github.com/emsrdl/tipsy/commit/5d38b5f45392d0ca90999e540d30b886960f7f64))
* remove status-bar strip and restore elevation shadow on HeaderBar ([#23](https://github.com/emsrdl/tipsy/issues/23)) ([a9e263e](https://github.com/emsrdl/tipsy/commit/a9e263e17cd3edadf3cb76c0ac73aa346d279785))
* update HeaderBar to use elevation shadow and remove border styling ([5f85365](https://github.com/emsrdl/tipsy/commit/5f853659fdf73447c5c639f2ae5ea4ad25e405c2))
* update theme color handling and sync with active accent color ([6b3196d](https://github.com/emsrdl/tipsy/commit/6b3196d2ddd2dac128522c55133d5923e0b89051))
* update theme color handling to sync with active accent color ([6496b41](https://github.com/emsrdl/tipsy/commit/6496b4147fe7a96ca164bf75bf040c730b428ccf))

## [0.6.2](https://github.com/emsrdl/tipsy/compare/v0.6.1...v0.6.2) (2026-05-11)


### Bug Fixes

* prevent overscroll behavior in main scroll container of AppLayout ([e422783](https://github.com/emsrdl/tipsy/commit/e4227834bc2a7432ecb3b4f81956972d0111a8a3))
* remove sticky positioning from HeaderBar and update AppLayout scroll container ([88cd643](https://github.com/emsrdl/tipsy/commit/88cd643d9f3f185f84170546abdb261e12b2af8c))
* update overscroll behavior in main scroll container of AppLayout ([ecc3cbc](https://github.com/emsrdl/tipsy/commit/ecc3cbc5276cabc42d2c886bdb0ff4847ba2ef8b))
* vanishing navbar ([#22](https://github.com/emsrdl/tipsy/issues/22)) ([a5de06d](https://github.com/emsrdl/tipsy/commit/a5de06dcdec9627d0e8659664a076cf62f91e4b6))

## [0.6.1](https://github.com/emsrdl/tipsy/compare/v0.6.0...v0.6.1) (2026-05-10)


### Bug Fixes

* 18 uiux fixes code cleanup ([#19](https://github.com/emsrdl/tipsy/issues/19)) ([b5d61a7](https://github.com/emsrdl/tipsy/commit/b5d61a77f63fc0885fd54cf8355d61cbf46e8865))
* add names and aria-labels to input fields for better accessibility ([709878d](https://github.com/emsrdl/tipsy/commit/709878d03dfb2ad10da33534ba94ea72c2cd2a37))
* adjust ProfileAvatar size and improve layout spacing in ScreenContainer ([15178aa](https://github.com/emsrdl/tipsy/commit/15178aa50c804b29408513b6c56f470a0c2f67a7))
* centralize theme color management and remove hardcoded values ([4ae573e](https://github.com/emsrdl/tipsy/commit/4ae573e3090549c9a56231fddb621342a975c3ba))
* enhance accessibility by adding labels to SliderBadge components ([c795a4e](https://github.com/emsrdl/tipsy/commit/c795a4e98d7c39c1cfb973711890c87c23b4e92b))
* enhance layout and styling for DistributionTable and ResultsScreen components ([2bac065](https://github.com/emsrdl/tipsy/commit/2bac0651978fe76e8f41c5305a0d7e1ea4e158fd))
* enhance PWA support with theme and status bar synchronization ([b41a194](https://github.com/emsrdl/tipsy/commit/b41a1941c8343976832c0272cba7711643c6082a))
* enhance theme pre-paint logic with accent support to prevent flicker ([3a886aa](https://github.com/emsrdl/tipsy/commit/3a886aafd25258b222411cf0a00716c34220184e))
* enhance viewport meta tag for better mobile experience ([0f5cf1e](https://github.com/emsrdl/tipsy/commit/0f5cf1ed582bed529579b02d772a2deace61484b))
* expose getScrollEl function and improve scroll handling in ResultsScreen ([d878cfb](https://github.com/emsrdl/tipsy/commit/d878cfb0df53ac20213dd391a0f9254e8c57ed1e))
* improve layout and spacing of transfer items in ResultsScreen ([ef77fcf](https://github.com/emsrdl/tipsy/commit/ef77fcf75054b65dacf9a435e5ff66bb5b7e8cc3))
* improve layout of transfers section in ResultsScreen for better responsiveness ([9903255](https://github.com/emsrdl/tipsy/commit/9903255adaabfade579112c8c9a2bc0201c6b6b9))
* improve navigation behavior by scrolling to top on active tab click ([a3e1086](https://github.com/emsrdl/tipsy/commit/a3e108621b8c14f2190efc5e9045555d2cf1940f))
* improve scroll handling and layout for better user experience ([edff447](https://github.com/emsrdl/tipsy/commit/edff447635cde2f019bd7854990ef4d355947d5d))
* refactor Badge and Slider components to use centralized color configuration and improve accessibility ([ff6c6e5](https://github.com/emsrdl/tipsy/commit/ff6c6e5417ab7929f89552a368a0121dbb6992aa))
* remove deprecated baseUrl ([c6a75aa](https://github.com/emsrdl/tipsy/commit/c6a75aaaa4439faecf00e6e3d63609b57a7ac42f))
* remove unnecessary overscroll behavior from main scroll container ([3058d7b](https://github.com/emsrdl/tipsy/commit/3058d7bfd3de8c0b6be292c4550c38a0b606bbfa))
* simplify tailwind classes ([11450d1](https://github.com/emsrdl/tipsy/commit/11450d1c608ba1d27a71edf005c4d7a2d38e5312))

## [0.6.0](https://github.com/emsrdl/tipsy/compare/v0.5.1...v0.6.0) (2026-04-27)


### Features

* implement scroll preservation for multi-step navigation and enhance navigation state management ([4778b9f](https://github.com/emsrdl/tipsy/commit/4778b9f4bf3c569fb4afda6e8530537fcd4aaf58))


### Bug Fixes

* 16 uiux misc bug fixes and polish ([#17](https://github.com/emsrdl/tipsy/issues/17)) ([ee3baff](https://github.com/emsrdl/tipsy/commit/ee3baff365b8f68cb7797ba6f639e109a40b0fc6))
* enhance button hover styles in ImportDialog and add comment to usePreserveScroll for clarity ([31d4dd9](https://github.com/emsrdl/tipsy/commit/31d4dd937c5fc9310f0ad71c61a1e1a02a3a1de0))
* implement last calculate route tracking and update button actions in ResultsScreen ([8973c27](https://github.com/emsrdl/tipsy/commit/8973c27f240182034845e88b2dd46521fe4d9697))
* implement scroll preservation across multiple screens and enhance button layouts ([eaeaa29](https://github.com/emsrdl/tipsy/commit/eaeaa2950cc81de895d98d3c72befed76beeaee5))
* improve scroll restoration handling and update last calculate route logic in AppLayout ([0b52867](https://github.com/emsrdl/tipsy/commit/0b528679daf83c40d16b1b923e770b4e9036d73c))
* refine scroll preservation logic in usePreserveScroll and clarify reset behavior ([5cba255](https://github.com/emsrdl/tipsy/commit/5cba255ffecb77af006243fc4ee26f0b8a1aeac6))
* update button height in ConfirmDialog and Stepper, add translations for stepper actions, enhance input focus styles in SettingsScreen ([e6971dd](https://github.com/emsrdl/tipsy/commit/e6971dd35f433c1f0be05be651ac5a8fa2ec0925))
* update button heights in ImportDialog and ExportDialog for consistency ([6e5d84b](https://github.com/emsrdl/tipsy/commit/6e5d84b963a39915c95b4ca362bceadc7c6163c9))

## [0.5.1](https://github.com/emsrdl/tipsy/compare/v0.5.0...v0.5.1) (2026-04-26)


### Bug Fixes

* gate PWA dev service worker behind VITE_PWA_DEV env flag ([0ea7c0f](https://github.com/emsrdl/tipsy/commit/0ea7c0f82eb5daeec69cf56e35c236d492f69d12))
* PWA support with vite-plugin-pwa and update manifest for icons ([4cf0c4a](https://github.com/emsrdl/tipsy/commit/4cf0c4aff76d95a555bdafa06ef7bb6248671b3c))
* PWA support with vite-plugin-pwa and update manifest for icons ([#15](https://github.com/emsrdl/tipsy/issues/15)) ([8f9f92a](https://github.com/emsrdl/tipsy/commit/8f9f92aa393bc89f3074bfc18e3f8f75e8c62be2))

## [0.5.0](https://github.com/emsrdl/tipsy/compare/v0.4.0...v0.5.0) (2026-04-11)


### Features

* add smart split mode with localStorage support and enhance CSV/PDF exports ([1283f09](https://github.com/emsrdl/tipsy/commit/1283f094aff85fddfd13537aae4413b960bde19e))
* enhance history with localStorage support and enhance CSV/PDF exports ([#13](https://github.com/emsrdl/tipsy/issues/13)) ([871755a](https://github.com/emsrdl/tipsy/commit/871755a28392a3b7cd4ca78e3210d2b83e3f9256))


### Bug Fixes

* improve CSV export to prevent formula injection and improve data safety ([477ea4f](https://github.com/emsrdl/tipsy/commit/477ea4fc554d70e23fc5205c2de280f4047ddad7))
* update EUR denominations to reflect accurate values and counts ([eba9778](https://github.com/emsrdl/tipsy/commit/eba977870b9bb56f0b076f28a4485e809c608ea1))

## [0.4.0](https://github.com/emsrdl/tipsy/compare/v0.3.4...v0.4.0) (2026-03-28)


### Features

* enhance distribution table and fairness scoring logic ([104b9b3](https://github.com/emsrdl/tipsy/commit/104b9b3a08bbda39251dd25d83a31550919ad419))
* working tip splitting ([#12](https://github.com/emsrdl/tipsy/issues/12)) ([e8590a2](https://github.com/emsrdl/tipsy/commit/e8590a2c57b5a60cd30dae468a98c3e3bc4a93c5))


### Bug Fixes

* refactor group display for improved layout and styling ([9a4aa38](https://github.com/emsrdl/tipsy/commit/9a4aa38603853815d878f97d002a55c2dcc10eab))
* update default threshold value in useSmartSplitter tests ([ec6528f](https://github.com/emsrdl/tipsy/commit/ec6528f8787bf7aa32e6c567cb90e5dd49cb2d70))
* update smart split logic and enhance distribution handling ([675d8a1](https://github.com/emsrdl/tipsy/commit/675d8a1fb34c9d64e825f246c181260340b2b9a7))

## [0.3.4](https://github.com/emsrdl/tipsy/compare/v0.3.3...v0.3.4) (2026-03-26)


### Bug Fixes

* add pull-requests write permission in preview cleanup workflow ([afbc298](https://github.com/emsrdl/tipsy/commit/afbc298d75cea28127c98e568fb4ac53401030d1))
* add pull-requests write permission in preview cleanup workflow ([#11](https://github.com/emsrdl/tipsy/issues/11)) ([b1c2a0e](https://github.com/emsrdl/tipsy/commit/b1c2a0e8dbc23e91ce6f1c2f9b3706613e496f76))

## [0.3.3](https://github.com/emsrdl/tipsy/compare/v0.3.2...v0.3.3) (2026-03-26)


### Bug Fixes

* enhance preview cleanup workflow to handle unlabeled pull requests and remove preview label ([f26ee44](https://github.com/emsrdl/tipsy/commit/f26ee44bcb73f38352125b7618720fb6928c5813))
* enhance preview cleanup workflow to handle unlabeled pull requests and remove preview label ([#10](https://github.com/emsrdl/tipsy/issues/10)) ([e1fd4c8](https://github.com/emsrdl/tipsy/commit/e1fd4c8ad102f8dcea2fdee227ad5e78fa4c069c))
* update preview cleanup workflow to handle label removal errors ([31a6954](https://github.com/emsrdl/tipsy/commit/31a69540ae9a76cc7e7e732fadbbbe379b74efbf))

## [0.3.2](https://github.com/emsrdl/tipsy/compare/v0.3.1...v0.3.2) (2026-03-26)


### Bug Fixes

* improve git version resolution logic in Vite config ([46e581e](https://github.com/emsrdl/tipsy/commit/46e581ed44795be403b3e895868a641cb98bea09))
* improve git version resolution logic in Vite config ([#9](https://github.com/emsrdl/tipsy/issues/9)) ([59fa631](https://github.com/emsrdl/tipsy/commit/59fa631596c92a816ab7c8d7145faf3aba950ca4))
* update Vite config to improve version resolution logic for dev server ([357aa42](https://github.com/emsrdl/tipsy/commit/357aa4263fe0739968df98a8de1ed25bd757a30d))

## [0.3.1](https://github.com/emsrdl/tipsy/compare/v0.3.0...v0.3.1) (2026-03-26)


### Bug Fixes

* enhance Dokploy preview cleanup workflow with improved API request handling and concurrency management ([dc5b2b0](https://github.com/emsrdl/tipsy/commit/dc5b2b03f2c6ee5ea37a68b9f9677b62b67807cd))
* update Dokploy preview cleanup workflow to include CF client credentials in API requests ([20809a8](https://github.com/emsrdl/tipsy/commit/20809a8578d01c2f9eae6d0ab2fca82405ee7893))
* update Dokploy preview cleanup workflow to include CF client credentials in API requests ([#8](https://github.com/emsrdl/tipsy/issues/8)) ([168cf74](https://github.com/emsrdl/tipsy/commit/168cf74bbfe28f7979aebe526638f03956587d61))

## [0.3.0](https://github.com/emsrdl/tipsy/compare/v0.2.2...v0.3.0) (2026-03-26)


### Features

* add workflow for cleaning up preview deployments on pull request closure ([6e74156](https://github.com/emsrdl/tipsy/commit/6e741569c877b1d66692b2dcb1968cf786645055))


### Bug Fixes

* add CI workflow for build, lint, and test processes ([81feedf](https://github.com/emsrdl/tipsy/commit/81feedf90e1900b95dfbff180abe70ede778c1e8))
* add workflow for cleaning up preview deployments on pull request closure ([#7](https://github.com/emsrdl/tipsy/issues/7)) ([7db2fdb](https://github.com/emsrdl/tipsy/commit/7db2fdb702c37de30fb813bedcd72e844d552365))
* clean up workflow configurations and improve permissions handling ([177524e](https://github.com/emsrdl/tipsy/commit/177524ea55a0c3718e4d2a3634e01a1935ad30b7))
* enhance CI workflow with fetch depth for checkout; update Dockerfile to fetch git tags; modify git describe command in Vite config ([8e0b0a5](https://github.com/emsrdl/tipsy/commit/8e0b0a5ffd8f1de0223f1605f76edc0699aac60f))
* enhance preview cleanup workflow with error handling and support for multiple deployments ([6a65fb1](https://github.com/emsrdl/tipsy/commit/6a65fb18a182576e78031bcae9b06c4a44141dbb))
* optimize git fetch in Dockerfile to reduce network I/O; update version resolution comment in Vite config ([27bfdc4](https://github.com/emsrdl/tipsy/commit/27bfdc4a17fecc378eac4137c08f09ad84e44761))
* update .dockerignore to exclude .git; enhance Vite config version resolution context ([73bdc46](https://github.com/emsrdl/tipsy/commit/73bdc46894f34ea2b30e02de8c876943c0686933))
* update CI workflow with concurrency settings and timeout for jobs; refactor preview cleanup script for improved readability; enhance version resolution in Vite config ([b954152](https://github.com/emsrdl/tipsy/commit/b9541524a65b428323af4975d64ec44c3cf960de))

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
