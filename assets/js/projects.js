/* ===========================================================================
   Project data — powers the "View details" modal (extra data + screenshot
   gallery + store/archive links) for each project card.
   Cards in index.html carry data-project="<id>"; main.js opens the modal.
   Screenshots live in assets/img/shots/. Store facts sourced from the App
   Store / Google Play / APKPure (for delisted titles), July 2026.
   =========================================================================== */
window.PROJECTS = {
  clashup: {
    name: 'ClashUp',
    publisher: 'Adiel (solo)',
    publisherLogo: null,
    status: 'wip',
    statusLabel: '🔧 In development',
    tagline: 'A Brawl Stars–style portrait multiplayer brawler.',
    description:
      "ClashUp is a Brawl Stars–style portrait multiplayer brawler I'm building solo. " +
      "It runs on an authoritative server with my own deterministic physics engine — AetherNet — " +
      "that keeps every client perfectly in sync. Client, server, and physics, all of it. " +
      "Currently in development in a private repo, so there's no public build or store page yet.",
    facts: [
      ['Genre', 'Real-time multiplayer brawler'],
      ['Status', 'In active development'],
      ['Platforms', 'Mobile (planned)'],
      ['Tech', 'Authoritative server · deterministic physics (AetherNet)'],
    ],
    tags: ['Client', 'Server', 'Deterministic physics', 'Multiplayer'],
    links: [],
    shots: [],
    shotNote: "No public screenshots yet — ClashUp lives in a private repo while it's being built.",
  },

  pokerface: {
    name: 'Pokerface',
    publisher: 'Comunix',
    publisherLogo: 'assets/img/comunix.png',
    status: 'live',
    statusLabel: '✅ Live',
    tagline: 'Live group video-chat Texas Hold’em.',
    description:
      "Poker Face is a social Texas Hold'em game built around live group video chat — up to five " +
      "friends at one table, face to face. Daily free chips, mini-slot games between hands, and a VIP " +
      "program keep it social and casual. It's one of Comunix's flagship titles, enjoyed by millions of " +
      "players worldwide.",
    facts: [
      ['Publisher', 'Comunix Ltd'],
      ['Genre', 'Social poker'],
      ['Released', '2018'],
      ['Platforms', 'iOS · Android'],
      ['Rating', '★ 4.7 (62K on iOS)'],
      ['Installs', '5M+ on Google Play'],
    ],
    tags: ['Social', 'Live video chat', 'Poker'],
    links: [
      { label: 'App Store', href: 'https://apps.apple.com/us/app/poker-face-texas-holdem-live/id1364570884', kind: 'ios' },
      { label: 'Google Play', href: 'https://play.google.com/store/apps/details?id=com.comunix.pokerface', kind: 'android' },
    ],
    shots: [
      'assets/img/shots/pokerface_1.png',
      'assets/img/shots/pokerface_2.png',
      'assets/img/shots/pokerface_3.png',
      'assets/img/shots/pokerface_4.png',
      'assets/img/shots/pokerface_5.png',
    ],
  },

  royalbingo: {
    name: 'Royal Bingo',
    publisher: 'Comunix',
    publisherLogo: 'assets/img/comunix.png',
    status: 'unavailable',
    statusLabel: '⚠ No longer available',
    tagline: 'Live bingo with friends — quick rounds, big daubs.',
    description:
      "Royal Bingo is a casual live bingo game: fast rounds, big daubs, and live video chat with friends. " +
      "Thousands of levels across themed locations, plus tournaments and leaderboards to climb. Built by " +
      "Comunix — it has since been pulled from the App Store and Google Play, but the listing survives on " +
      "third-party archives.",
    facts: [
      ['Publisher', 'Comunix Ltd'],
      ['Genre', 'Casual · Bingo'],
      ['Released', '2023'],
      ['Platforms', 'was iOS · Android'],
      ['Installs', '100K+ (historical)'],
      ['Status', 'Delisted'],
    ],
    tags: ['Casual', 'Live video chat', 'Bingo'],
    links: [
      { label: 'APKPure (archive)', href: 'https://apkpure.com/royal-bingo-live-bingo-game/com.communix.royalbingo', kind: 'archive' },
      { label: 'Softonic (archive)', href: 'https://royal-bingo-live-bingo-game.en.softonic.com/android', kind: 'archive' },
    ],
    shots: [
      'assets/img/shots/royalbingo_1.jpg',
      'assets/img/shots/royalbingo_2.jpg',
      'assets/img/shots/royalbingo_3.jpg',
      'assets/img/shots/royalbingo_4.jpg',
      'assets/img/shots/royalbingo_5.jpg',
    ],
  },

  solaria: {
    name: 'Solaria: Dawn of Heroes',
    publisher: 'Glaive Games',
    publisherLogo: 'assets/img/glaive.png',
    status: 'unavailable',
    statusLabel: '⚠ No longer available',
    tagline: 'A hero-collector RPG about rebuilding the light.',
    description:
      "Solaria: Dawn of Heroes is a hero-collector action RPG — assemble a squad, master real-time squad " +
      "combat, and swap between heroes on the fly to adapt to any fight. Recruit and upgrade a roster of " +
      "heroes, each with distinct powers and stories. A Glaive Games title, now retired from the stores " +
      "but preserved on third-party archives.",
    facts: [
      ['Publisher', 'Glaive Games'],
      ['Genre', 'Hero-collector RPG'],
      ['Released', '2024'],
      ['Platforms', 'was Android'],
      ['Rating', '★ 3.3 (120 reviews)'],
      ['Status', 'Delisted'],
    ],
    tags: ['RPG', 'Hero collector', 'Real-time combat'],
    links: [
      { label: 'APKPure (archive)', href: 'https://apkpure.com/solaria-dawn-of-heroes/com.glaivegames.solaria', kind: 'archive' },
      { label: 'Softonic (archive)', href: 'https://solaria-dawn-of-heroes.en.softonic.com/android', kind: 'archive' },
      { label: 'Gameplay (YouTube)', href: 'https://www.youtube.com/watch?v=d6TeWrH3VOs', kind: 'video' },
      { label: 'Facebook', href: 'https://www.facebook.com/SolariaDawnOfHeroes/', kind: 'social' },
    ],
    shots: [
      'assets/img/shots/solaria_1.jpg',
      'assets/img/shots/solaria_2.jpg',
      'assets/img/shots/solaria_3.jpg',
      'assets/img/shots/solaria_4.jpg',
      'assets/img/shots/solaria_5.jpg',
    ],
  },

  swapheroes: {
    name: 'Swap Heroes: Eternal Legends',
    publisher: 'Glaive Games',
    publisherLogo: 'assets/img/glaive.png',
    status: 'live',
    statusLabel: '✅ Live · actively updated',
    tagline: 'Real-time squad ARPG — swap heroes mid-fight.',
    description:
      "Swap Heroes: Eternal Legends is a real-time squad ARPG where you switch between heroes mid-fight to " +
      "counter every threat — your bench is half your strategy. Collect and upgrade heroes, climb " +
      "leaderboards, and join guilds. Live globally on iOS and Android, and still in active development " +
      "at Glaive Games.",
    facts: [
      ['Publisher', 'Glaive Games'],
      ['Genre', 'Real-time squad ARPG'],
      ['Released', '2025'],
      ['Platforms', 'iOS · Android'],
      ['Rating', '★ 4.0 (new release)'],
      ['Status', 'Live · actively updated'],
    ],
    tags: ['ARPG', 'Squad combat', 'Guilds', 'Live'],
    links: [
      { label: 'App Store', href: 'https://apps.apple.com/us/app/swap-heroes-eternal-legends/id6755378713', kind: 'ios' },
      { label: 'Google Play', href: 'https://play.google.com/store/apps/details?id=com.glaivegames.swapheroes', kind: 'android' },
    ],
    shots: [
      'assets/img/shots/swapheroes_1.jpg',
      'assets/img/shots/swapheroes_2.jpg',
      'assets/img/shots/swapheroes_3.jpg',
      'assets/img/shots/swapheroes_4.jpg',
      'assets/img/shots/swapheroes_5.jpg',
    ],
  },
};
