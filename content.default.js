/* Встроенный контент сайта. Всё, что вы меняете в /admin, хранится отдельно
   (в Vercel Blob) и накладывается поверх этого файла. */
(function () {
  const ASSET_FALLBACK = { IMG_6516:'IMG_6513', IMG_6517:'IMG_6514', IMG_6518_2:'IMG_6515', IMG_6519:'IMG_6513', IMG_6520:'IMG_6514', IMG_6521:'IMG_6515', IMG_6522:'IMG_6513', IMG_6523:'IMG_6514', IMG_6524:'IMG_6515', IMG_6525:'IMG_6526', IMG_6527:'IMG_6514', about:'IMG_6513' };
  const A = (n) => `assets/${ASSET_FALLBACK[n] || n}.jpg`;

  const DEFAULT = {
    site: {
      logo: 'KATE',
      tagline: 'Graphic Designer / Art Director',
      title: 'KATE — Graphic Designer / Art Director',
      description: 'Independent graphic designer and art director: brand identity, packaging, digital and campaign visuals.',
      year: '2026',
      headerSub: 'DESIGN BY KATELY',
      footerCredit: 'DESIGN BY KATELY',
    },

    nav: [
      { id: 'home', label: 'Home', visible: true },
      { id: 'work', label: 'Work', visible: true },
      { id: 'about', label: 'About', visible: true },
      { id: 'services', label: 'Services', visible: true },
      { id: 'contact', label: 'Contact', visible: true },
    ],

    ui: {
      viewCase: 'View case',
      back: 'Back to work',
      next: 'Next project',
      all: 'All',
      close: 'Close',
      top: 'Back to top',
    },

    home: {
      kicker: 'Graphic Designer / Art Director',
      title: 'Designing visual\nidentities with a\n*distinct point* of view.',
      sub: 'KATE — an independent graphic designer and art director working across brand identity, packaging, digital and campaign visuals.',
      heroImg: A('IMG_6513'),
      revealImg: A('IMG_6526'),
      cta: 'View work',
      cta2: 'Get in touch',
      featured: 'Selected Work',
      scrollLabel: 'Scroll to explore',
      showHero: true,
      showHeroImage: true,
      showProjects: true,
      showAbout: true,
    },

    work: {
      heading: 'Work',
      tag: 'Portfolio',
      allHeading: 'All works',
      allTag: 'Every image',
      allBtn: 'All projects',
    },

    about: {
      heading: 'About',
      tag: 'Studio',
      photo: 'assets/about.jpg',
      statement: "I'm a graphic designer and art director focused on visual identities, brand systems and art direction.",
      text:
        'My work moves between fashion, fragrance and culture — building visual languages that are quiet, precise and recognisable. I treat every project as an editorial composition: typography, image and space in balance.\n\nI work independently and take on a small number of projects at a time, so each one gets full attention — from the first sketch to the final files.',
      more: 'More about me',
      disciplinesTitle: 'Disciplines',
      disciplines: ['Brand Identity', 'Art Direction', 'Packaging', 'Digital Design', 'Campaign Visuals', 'Illustration'],
      toolsTitle: 'Programs I work in',
      toolsTag: 'Toolbox',
    },

    tools: [
      { name: 'Adobe Illustrator', mark: 'Ai', bg: '#330000', fg: '#FF9A00', level: 5 },
      { name: 'Adobe Photoshop', mark: 'Ps', bg: '#001E36', fg: '#31A8FF', level: 5 },
      { name: 'Adobe InDesign', mark: 'Id', bg: '#49021F', fg: '#FF3366', level: 5 },
      { name: 'Figma', mark: 'Fg', bg: '#1E1E1E', fg: '#F24E1E', level: 5 },
      { name: 'Tilda', mark: 'T', bg: '#111111', fg: '#F5F2EA', level: 4 },
      { name: 'Procreate', mark: 'Pc', bg: '#0F2A2E', fg: '#7EE0D4', level: 4 },
      { name: 'Adobe XD', mark: 'Xd', bg: '#470137', fg: '#FF61F6', level: 4 },
    ],

    services: {
      heading: 'Services',
      tag: 'Capabilities',
      items: [
        { t: 'Brand Identity', d: 'Creating visual systems that give brands a recognizable point of view.' },
        { t: 'Art Direction', d: 'Developing the visual language and direction of campaigns and brands.' },
        { t: 'Packaging', d: 'Creating physical packaging systems with a strong visual presence.' },
        { t: 'Digital Design', d: 'Designing digital experiences and visual systems for screens.' },
        { t: 'Campaign Visuals', d: 'Developing visual concepts and applications across campaigns.' },
        { t: 'Illustration', d: 'Creating distinctive illustration and visual assets.' },
      ],
    },

    contact: {
      heading: 'Contact',
      tag: 'Get in touch',
      big: 'Have a project\nworth making *visible?*',
      links: [
        { label: 'hello@kate.studio', url: 'mailto:hello@kate.studio' },
        { label: '@kate.studio', url: 'https://instagram.com/kate.studio' },
      ],
    },

    projects: [
      {
        id: 'chistota',
        t: 'CHISTOTÀ',
        cat: 'Brand Identity / Fashion',
        d: 'A monochrome identity for a fashion brand — built on restraint, materiality and the precision of a single wordmark.',
        theme: { bg: '#0d0d0d', fg: '#efece4', ac: '#cfcac0', shape: 'rect', font: 'serif', atmosphere: 'grain' },
        cover: A('IMG_6513'),
        images: [
          { src: A('IMG_6513'), alt: 'Fashion wordmark, monochrome identity', ty: 'full' },
          { src: A('IMG_6514'), alt: 'Moodboard of fabric, objects and neutral palette', ty: 'row', nt: 'Visual Direction', nd: 'Fashion imagery, fabric, objects and a neutral palette — the material world of the brand gathered into a single moodboard.' },
          { src: A('IMG_6515'), alt: 'Editorial composition of the identity', ty: 'center' },
        ],
      },
      {
        id: 'the-del-este',
        t: 'THE DEL ESTE',
        cat: 'Digital Media / Art Direction / Visual Identity',
        d: 'A visual identity system unfolding across architecture, screens, objects and the street — one language, many surfaces.',
        theme: { bg: '#2a211a', fg: '#efe3cd', ac: '#b8553a', shape: 'arch', font: 'caps', atmosphere: 'haze' },
        cover: A('IMG_6516'),
        images: [
          { src: A('IMG_6516'), alt: 'Arch installation carrying the identity', ty: 'full' },
          { src: A('IMG_6517'), alt: 'Identity applied across surfaces', ty: 'full' },
          { src: A('IMG_6518_2'), alt: 'Smartphone mockups of the mobile system', ty: 'row', nt: 'Digital', nd: 'The identity translated to mobile — a flexible visual system designed for screens first.' },
          { src: A('IMG_6519'), alt: 'Coffee-cup application', ty: 'row', nt: 'Object', nd: 'Everyday objects become carriers of the identity — quiet, consistent, present.' },
          { src: A('IMG_6520'), alt: 'Poster on a raw wall', ty: 'full' },
          { src: A('IMG_6521'), alt: 'Matchbox-style packaging', ty: 'row', rev: true, nt: 'Application', nd: 'Physical applications in warm, tactile tones extend the system into product.' },
        ],
      },
      {
        id: 'balhowaimil',
        t: 'BALHOWAIMIL',
        cat: 'Brand Identity / Packaging / Fragrance',
        d: 'Packaging and identity for a fragrance brand — warm, tactile and deliberately quiet.',
        theme: { bg: '#d9c59b', fg: '#2b2016', ac: '#7a5a2e', shape: 'oval', font: 'serif', atmosphere: 'dunes' },
        cover: A('IMG_6523'),
        images: [
          { src: A('IMG_6523'), alt: 'Monogram on ivory', ty: 'center' },
          { src: A('IMG_6524'), alt: 'Logotype against warm, raw material', ty: 'row', nt: 'Identity', nd: 'The logotype set against warm, raw material — identity as texture, not decoration.' },
          { src: A('IMG_6522'), alt: 'Typographic lockup of the brand', ty: 'center' },
        ],
      },
      {
        id: 'soul-of-the-east',
        t: 'THE SOUL OF THE EAST',
        cat: 'Brand Identity / Fragrance / Art Direction',
        d: 'An identity introduced through a single monogram — then expanded into a full editorial world.',
        theme: { bg: '#3b3b38', fg: '#f1efe9', ac: '#cbb88a', shape: 'soft', font: 'italic', atmosphere: 'haze' },
        cover: A('IMG_6525'),
        images: [
          { src: A('IMG_6525'), alt: 'Single monogram mark', ty: 'center' },
          { src: A('IMG_6526'), alt: 'Full editorial world of the identity', ty: 'full' },
          { src: A('IMG_6527'), alt: 'Editorial composition, monogram detail', ty: 'center' },
        ],
      },
    ],

    pages: [],
  };

  // Накладывает сохранённые правки поверх встроенного контента.
  function merge(base, over) {
    const out = JSON.parse(JSON.stringify(base));
    if (over && typeof over === 'object') {
      for (const k of Object.keys(over)) {
        if (k === 'empty' || k === 'error') continue;
        const v = over[k];
        if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
          out[k] = Object.assign(out[k], v);
        } else {
          out[k] = v;
        }
      }
    }
    return out;
  }

  window.DEFAULT_CONTENT = DEFAULT;
  window.mergeContent = merge;
})();
