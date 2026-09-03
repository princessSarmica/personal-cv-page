// src/i18n/ui.ts
//
// The single source of truth for every translated string on the site.
// This is the standard Astro i18n "recipe" pattern: routing (which URL
// serves which locale) is configured in astro.config.mjs, but the
// actual TEXT for each locale lives here, keyed by a short dotted name
// per string. src/components/HomePage.astro reads the current locale
// (via Astro.currentLocale) and looks strings up through the
// `useTranslations()` helper in ./utils.ts -- it never hardcodes text
// itself, and neither do any of the section components (they still
// just receive title/text/eyebrow props exactly as before; only WHERE
// those prop values come from has changed).
//
// The "*.text" keys for art/computer/education/achievement/hobby/bonus
// hold real HTML (bullet lists, and a few links) rather than plain
// text -- their section components render them with Astro's `set:html`
// directive instead of `{text}` interpolation, so the markup here is
// trusted, hand-written content, not user input.

export const languages = {
  en: "English",
  de: "Deutsch",
  sl: "Slovenščina",
} as const;

export const defaultLang = "en";

export const ui = {
  en: {
    "nav.title": "My CV",
    "nav.menuLabel": "Section navigation",
    "nav.toggleOpen": "Open section menu",
    "nav.toggleClose": "Close section menu",

    "intro.name": "Marko Matko Ficko",
    "intro.titles": "Programmer, Digital Artist",

    "art.eyebrow": "Island 02",
    "art.title": "Creative Skills",
    "art.text":
      "<ul><li>Digital art &amp; animation: Krita, Clip Studio Paint</li><li>Design: Affinity Designer, Figma, Canva</li><li>Video editing: CapCut</li><li>Presentations: Microsoft PowerPoint</li></ul>",

    "computer.eyebrow": "Island 03",
    "computer.title": "Computer Skills",
    "computer.text":
      "<ul><li>Programming languages: C, C++, Python, PHP, Kotlin</li><li>Web development: HTML, CSS, JavaScript, TypeScript, React, Next.js, Astro.js, Three.js, Node.js, Express, TailwindCSS, shadcn/ui, better-auth, next-intl</li><li>Databases: PostgreSQL, MySQL, MongoDB</li></ul>",

    "education.eyebrow": "Island 01",
    "education.title": "Education",
    "education.text":
      "<ul><li>Radenci Primary School (2007-2016)</li><li>Franc Miklošič Grammar School, Ljutomer (2016-2020)</li><li>Faculty of Electrical Engineering, Computer Science and Informatics, Maribor - FERI: Computer Science and Information Technologies, undergraduate (1st cycle) (2020-2023)</li><li>Media Communications, FERI, postgraduate – master's (2nd cycle) (2023-2026)</li></ul>",

    "achievement.eyebrow": "Island 04",
    "achievement.title": "Achievements",
    "achievement.text":
      '<ul><li><a href="https://www.lokalec.si/video-studentski-domovi-univerze-v-mariboru-nagradili-prvouvrscene-na-natecaju-za-poslikavo-prostorov/" target="_blank" rel="noopener noreferrer">1st place in a competition for a mural design in Student Dorm 1 in Maribor, concept realized in 2024</a></li><li>Storyboard artist for the student film <a href="https://www.imdb.com/title/tt36062438/" target="_blank" rel="noopener noreferrer">Vžig</a></li><li>Co-authored a research paper on recognizing and evaluating AI-generated images (<a href="https://www.igi-global.com/chapter/perception-of-the-aesthetic-value-of-art-in-the-context-of-artificial-intelligence-and-human-creation-among-higher-education-students/388879" target="_blank" rel="noopener noreferrer">IGI Global</a>)</li><li>Authored a paper on choosing a technology stack for web applications (<a href="https://ieeexplore.ieee.org/abstract/document/10959214" target="_blank" rel="noopener noreferrer">IEEE Xplore</a>)</li></ul>',

    "hobby.eyebrow": "Island 05",
    "hobby.title": "Hobbies",
    "hobby.text":
      '<ul><li>Drawing</li><li>Watching animated series and films</li><li>Playing video games</li><li>Building a <a href="https://feri-notes.netlify.app/" target="_blank" rel="noopener noreferrer">notes website</a></li><li>Learning digital illustration and design</li></ul>',

    "bonus.eyebrow": "Bonus",
    "bonus.title": "Other Skills and Finished Projects",
    "bonus.text":
      '<ul><li>German language diploma, level C1</li><li>Category B driving licence</li><li>Independently built a <a href="https://medijska-predilnica.netlify.app/" target="_blank" rel="noopener noreferrer">news website</a> for media communications students</li><li>Independently developed the dynamic web app <a href="https://nextjs-greentouch-app.vercel.app/en" target="_blank" rel="noopener noreferrer">GreenTouch</a>, as part of the project <a href="https://bsihlab.com/projects/greentouch/" target="_blank" rel="noopener noreferrer">GreenTouch: EcoMind Development for Higher Education Future</a></li></ul>',
  },
  de: {
    "nav.title": "Mein Lebenslauf",
    "nav.menuLabel": "Abschnittsnavigation",
    "nav.toggleOpen": "Menü öffnen",
    "nav.toggleClose": "Menü schließen",

    "intro.name": "Marko Matko Ficko",
    "intro.titles": "Programmierer, Digitalkünstler",

    "art.eyebrow": "Insel 02",
    "art.title": "Kreative Fähigkeiten",
    "art.text":
      "<ul><li>Digitale Kunst &amp; Animation: Krita, Clip Studio Paint</li><li>Design: Affinity Designer, Figma, Canva</li><li>Videobearbeitung: CapCut</li><li>Präsentationen: Microsoft PowerPoint</li></ul>",

    "computer.eyebrow": "Insel 03",
    "computer.title": "Computerkenntnisse",
    "computer.text":
      "<ul><li>Programmiersprachen: C, C++, Python, PHP, Kotlin</li><li>Webentwicklung: HTML, CSS, JavaScript, TypeScript, React, Next.js, Astro.js, Three.js, Node.js, Express, TailwindCSS, shadcn/ui, better-auth, next-intl</li><li>Datenbanken: PostgreSQL, MySQL, MongoDB</li></ul>",

    "education.eyebrow": "Insel 01",
    "education.title": "Ausbildung",
    "education.text":
      "<ul><li>Grundschule Radenci (2007-2016)</li><li>Gymnasium Franc Miklošič, Ljutomer (2016-2020)</li><li>Fakultät für Elektrotechnik, Informatik und Informationstechnologien, Maribor - FERI: Informatik und Informationstechnologien, Bachelor (1. Stufe) (2020-2023)</li><li>Medienkommunikation, FERI, Master (2. Stufe) (2023-2026)</li></ul>",

    "achievement.eyebrow": "Insel 04",
    "achievement.title": "Erfolge",
    "achievement.text":
      '<ul><li><a href="https://www.lokalec.si/video-studentski-domovi-univerze-v-mariboru-nagradili-prvouvrscene-na-natecaju-za-poslikavo-prostorov/" target="_blank" rel="noopener noreferrer">1. Platz bei einem Wettbewerb für die Gestaltung eines Wandbilds im Studentenwohnheim 1 in Maribor, Idee 2024 umgesetzt</a></li><li>Storyboard-Künstler für den Studentenfilm <a href="https://www.imdb.com/title/tt36062438/" target="_blank" rel="noopener noreferrer">Vžig</a></li><li>Mitautor eines wissenschaftlichen Artikels über die Erkennung und Bewertung von KI-generierten Bildern (<a href="https://www.igi-global.com/chapter/perception-of-the-aesthetic-value-of-art-in-the-context-of-artificial-intelligence-and-human-creation-among-higher-education-students/388879" target="_blank" rel="noopener noreferrer">IGI Global</a>)</li><li>Autor eines Fachartikels über die Wahl des Technologie-Stacks für Webanwendungen (<a href="https://ieeexplore.ieee.org/abstract/document/10959214" target="_blank" rel="noopener noreferrer">IEEE Xplore</a>)</li></ul>',

    "hobby.eyebrow": "Insel 05",
    "hobby.title": "Hobbys",
    "hobby.text":
      '<ul><li>Zeichnen</li><li>Animierte Serien und Filme schauen</li><li>Videospiele spielen</li><li>Eine <a href="https://feri-notes.netlify.app/" target="_blank" rel="noopener noreferrer">Notizen-Website</a> erstellt</li><li>Digitale Illustration und Gestaltung lernen</li></ul>',

    "bonus.eyebrow": "Bonus",
    "bonus.title": "Weitere Fähigkeiten und abgeschlossene Projekte",
    "bonus.text":
      '<ul><li>Deutsches Sprachdiplom, Niveau C1</li><li>Führerschein der Klasse B</li><li>Eigenständig eine <a href="https://medijska-predilnica.netlify.app/" target="_blank" rel="noopener noreferrer">Nachrichten-Website</a> für Studierende der Medienkommunikation entwickelt</li><li>Eigenständig die dynamische Webanwendung <a href="https://nextjs-greentouch-app.vercel.app/en" target="_blank" rel="noopener noreferrer">GreenTouch</a> entwickelt, im Rahmen des Projekts <a href="https://bsihlab.com/projects/greentouch/" target="_blank" rel="noopener noreferrer">GreenTouch: EcoMind Development for Higher Education Future</a></li></ul>',
  },
  sl: {
    "nav.title": "Moj življenjepis",
    "nav.menuLabel": "Navigacija po razdelkih",
    "nav.toggleOpen": "Odpri meni",
    "nav.toggleClose": "Zapri meni",

    "intro.name": "Marko Matko Ficko",
    "intro.titles": "Programmer, Digital Artist",

    "art.eyebrow": "Otok 02",
    "art.title": "Ustvarjalne kompetence",
    "art.text":
      "<ul><li>Digitalna umetnost in animacija: Krita, Clip Studio Paint</li><li>Oblikovanje: Affinity Designer, Figma, Canva</li><li>Urejanje videa: CapCut</li><li>Predstavitve: Microsoft PowerPoint</li></ul>",

    "computer.eyebrow": "Otok 03",
    "computer.title": "Računalniške kompetence",
    "computer.text":
      "<ul><li>Programski jeziki: C, C++, Python, PHP, Kotlin</li><li>Spletni razvoj: HTML, CSS, JavaScript, TypeScript, React, Next.js, Astro.js, Three.js, Node.js, Express, TailwindCSS, shadcn/ui, better-auth, next-intl</li><li>Baze podatkov: PostgreSQL, MySQL, MongoDB</li></ul>",

    "education.eyebrow": "Otok 01",
    "education.title": "Izobrazba",
    "education.text":
      "<ul><li>Osnovna šola Radenci (2007-2016)</li><li>Gimnazija Franca Miklošiča, Ljutomer (2016-2020)</li><li>Fakulteta za elektrotehniko, računalništvo in informatiko, Maribor - FERI: Računalništvo in informacijske tehnologije, UNI (1. stopnja) (2020-2023)</li><li>Medijske komunikacije, FERI (2. stopnja) (2023-2026)</li></ul>",

    "achievement.eyebrow": "Otok 04",
    "achievement.title": "Dosežki",
    "achievement.text":
      '<ul><li><a href="https://www.lokalec.si/video-studentski-domovi-univerze-v-mariboru-nagradili-prvouvrscene-na-natecaju-za-poslikavo-prostorov/" target="_blank" rel="noopener noreferrer">1. mesto na natečaju za poslikavo prostorov v Študentskem domu 1 v Mariboru, ideja realizirana leta 2024</a></li><li>Risar zgodborisa (storyboard) pri študentskem filmu <a href="https://www.imdb.com/title/tt36062438/" target="_blank" rel="noopener noreferrer">Vžig</a></li><li>Soavtor znanstvenega članka o prepoznavanju in vrednotenju slik, ustvarjenih z generativno umetno inteligenco (<a href="https://www.igi-global.com/chapter/perception-of-the-aesthetic-value-of-art-in-the-context-of-artificial-intelligence-and-human-creation-among-higher-education-students/388879" target="_blank" rel="noopener noreferrer">IGI Global</a>)</li><li>Avtor strokovnega članka o izbiri tehnološkega sklada za spletne aplikacije (<a href="https://ieeexplore.ieee.org/abstract/document/10959214" target="_blank" rel="noopener noreferrer">IEEE Xplore</a>)</li></ul>',

    "hobby.eyebrow": "Otok 05",
    "hobby.title": "Hobiji",
    "hobby.text":
      '<ul><li>Risanje</li><li>Gledanje animiranih serij in filmov</li><li>Igranje igric</li><li>Izdelava <a href="https://feri-notes.netlify.app/" target="_blank" rel="noopener noreferrer">spletne strani za zapiske</a></li><li>Učenje digitalne ilustracije in oblikovanja</li></ul>',

    "bonus.eyebrow": "Bonus",
    "bonus.title": "Druge kompetence in zaključeni projekti",
    "bonus.text":
      '<ul><li>Nemška jezikovna diploma s stopnjo C1</li><li>Vozniško dovoljenje kategorije B</li><li>Samostojno izdelal <a href="https://medijska-predilnica.netlify.app/" target="_blank" rel="noopener noreferrer">spletno stran za novice</a> študentov medijskih komunikacij</li><li>Samostojno razvil dinamično spletno aplikacijo <a href="https://nextjs-greentouch-app.vercel.app/en" target="_blank" rel="noopener noreferrer">GreenTouch</a>, v okviru projekta <a href="https://bsihlab.com/projects/greentouch/" target="_blank" rel="noopener noreferrer">GreenTouch: EcoMind Development for Higher Education Future</a></li></ul>',
  },
} as const;
