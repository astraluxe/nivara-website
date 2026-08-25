// ─── Everything adris OS can run ─────────────────────────────────────────────
//
// TWO RULES THIS FILE EXISTS TO ENFORCE.
//
// 1. NAMES PEOPLE ALREADY KNOW. The apps were previously called "Writer", "Calc" and "Impress",
//    which are LibreOffice's internal product names. Someone who has used a computer for twenty
//    years and never touched Linux reads "Calc" and reasonably assumes it is a calculator. So the
//    catalogue leads with the word for the THING — Documents, Spreadsheets, Slides — and keeps the
//    real product name underneath for anyone who wants it. Easy to learn was a stated requirement;
//    this is most of what that means in practice.
//
// 2. HOW IT GETS INSTALLED IS PART OF WHAT IT IS.
//    'app'    — an ordinary Linux package. One click, apt does the work.
//    'github' — a project from GitHub. One click; adris OS reads the repo, works out how it builds,
//               and installs it. THIS is the point of the OS: thousands of good free tools sit on
//               GitHub behind a README full of terminal commands, which is a wall for exactly the
//               people this is built for.
//    'bundled'— a web application that ships WITH adris OS: set up on first boot, already running,
//               opened by clicking it like anything else. The user never sees a container, a
//               database, or the upstream project's name — it is simply Customer Records, or
//               Invoicing, or Accounts. See vm/provision.sh.
//
// Icons: `icon` names a drawn tile from AppIcon.tsx. `iconUrl` points at the project's REAL logo,
// which is what a store should show — every app wearing the same generic square is exactly the
// "boring" the design feedback called out.

export type AppKind = 'app' | 'github' | 'bundled';
export type AppCategory =
  | 'Essentials' | 'Office' | 'Internet' | 'Media' | 'Graphics'
  | 'Business' | 'Developer' | 'System';

export interface CatalogueApp {
  id: string;
  /** What a normal person calls it. */
  name: string;
  /** The real product name, shown small underneath. Omit when they are the same. */
  realName?: string;
  category: AppCategory;
  kind: AppKind;
  blurb: string;

  /** kind:'app' — apt package + command. */
  pkg?: string;
  exec?: string;

  /** kind:'github' — the project to install from. */
  repo?: string;
  /** kind:'bundled' — the local port provision.sh runs it on. */
  port?: number;

  /** A drawn tile id (see AppIcon.tsx). */
  icon?: string;
  /** The project's own logo. Preferred over the drawn tile when it loads. */
  iconUrl?: string;

  pinned?: boolean;
  base?: boolean;
}

export const CATALOGUE: CatalogueApp[] = [
  // ── Essentials — what a computer must have on day one ─────────────────────
  { id: 'files', name: 'Files', realName: 'Nautilus', category: 'Essentials', kind: 'app',
    pkg: 'nautilus', exec: 'nautilus --new-window', icon: 'files', pinned: true, base: true,
    blurb: 'Your documents, downloads and your Windows drive.' },

  { id: 'browser', name: 'Web Browser', realName: 'GNOME Web', category: 'Essentials', kind: 'app',
    // --new-window matters: adris OS itself runs in this browser, and Epiphany is single-instance,
    // so without it "open the browser" silently focuses the desktop and looks like nothing happened.
    pkg: 'epiphany-browser', exec: 'epiphany-browser --new-window', icon: 'browser', pinned: true, base: true,
    blurb: 'Browse the web.' },

  { id: 'writer', name: 'Documents', realName: 'LibreOffice Writer', category: 'Essentials', kind: 'app',
    pkg: 'libreoffice-writer', exec: 'libreoffice --writer', icon: 'writer', pinned: true, base: true,
    blurb: 'Letters, reports, anything written. Opens and saves Word files.' },

  { id: 'calc', name: 'Spreadsheets', realName: 'LibreOffice Calc', category: 'Essentials', kind: 'app',
    pkg: 'libreoffice-calc', exec: 'libreoffice --calc', icon: 'calc', pinned: true, base: true,
    blurb: 'Accounts, lists and sums. Opens and saves Excel files.' },

  { id: 'impress', name: 'Slides', realName: 'LibreOffice Impress', category: 'Essentials', kind: 'app',
    pkg: 'libreoffice-impress', exec: 'libreoffice --impress', icon: 'impress', pinned: true, base: true,
    blurb: 'Presentations. Opens and saves PowerPoint files.' },

  { id: 'calculator', name: 'Calculator', category: 'Essentials', kind: 'app',
    pkg: 'gnome-calculator', exec: 'gnome-calculator', icon: 'calc', base: true,
    blurb: 'A calculator. The actual one.' },

  { id: 'terminal', name: 'Terminal', category: 'Essentials', kind: 'app',
    pkg: 'xterm', exec: 'xterm', icon: 'terminal', pinned: true, base: true,
    blurb: 'A command line, for when you want one.' },

  // ── Office ────────────────────────────────────────────────────────────────
  { id: 'text', name: 'Notes', realName: 'Text Editor', category: 'Office', kind: 'app',
    pkg: 'gedit', exec: 'gedit', icon: 'text', base: true, blurb: 'Quick plain notes.' },
  { id: 'evince', name: 'PDF Reader', realName: 'Evince', category: 'Office', kind: 'app',
    pkg: 'evince', exec: 'evince', icon: 'text', base: true, blurb: 'Read and print PDFs.' },
  { id: 'draw', name: 'Drawings', realName: 'LibreOffice Draw', category: 'Office', kind: 'app',
    pkg: 'libreoffice-draw', exec: 'libreoffice --draw', icon: 'impress', blurb: 'Diagrams, and editing PDFs.' },
  { id: 'calendar', name: 'Calendar', category: 'Office', kind: 'app',
    pkg: 'gnome-calendar', exec: 'gnome-calendar', icon: 'calendar', blurb: 'Appointments and reminders.' },

  // ── Internet ──────────────────────────────────────────────────────────────
  { id: 'thunderbird', name: 'Email', realName: 'Thunderbird', category: 'Internet', kind: 'app',
    pkg: 'thunderbird', exec: 'thunderbird', icon: 'mail',
    iconUrl: 'https://raw.githubusercontent.com/thunderbird/thunderbird-android/main/app_metadata/net.thunderbird.android/en-US/images/icon.png',
    blurb: 'Your email, on this machine rather than in a browser tab.' },

  // ── Media ─────────────────────────────────────────────────────────────────
  { id: 'vlc', name: 'Video Player', realName: 'VLC', category: 'Media', kind: 'app',
    pkg: 'vlc', exec: 'vlc', icon: 'impress', blurb: 'Plays essentially any video or audio file.' },
  { id: 'rhythmbox', name: 'Music', realName: 'Rhythmbox', category: 'Media', kind: 'app',
    pkg: 'rhythmbox', exec: 'rhythmbox', icon: 'impress', blurb: 'Your music library.' },
  { id: 'cheese', name: 'Camera', realName: 'Cheese', category: 'Media', kind: 'app',
    pkg: 'cheese', exec: 'cheese', icon: 'impress', blurb: 'Photos and video from a webcam.' },
  { id: 'shotwell', name: 'Photos', realName: 'Shotwell', category: 'Media', kind: 'app',
    pkg: 'shotwell', exec: 'shotwell', icon: 'impress', blurb: 'Organise and lightly edit photos.' },

  // ── Graphics ──────────────────────────────────────────────────────────────
  { id: 'gimp', name: 'Photo Editor', realName: 'GIMP', category: 'Graphics', kind: 'app',
    pkg: 'gimp', exec: 'gimp', icon: 'impress', blurb: 'Full image editing — the Photoshop-shaped hole.' },
  { id: 'inkscape', name: 'Design', realName: 'Inkscape', category: 'Graphics', kind: 'app',
    pkg: 'inkscape', exec: 'inkscape', icon: 'impress', blurb: 'Logos and print artwork.' },

  // ── System ────────────────────────────────────────────────────────────────
  { id: 'monitor', name: 'System Monitor', category: 'System', kind: 'app',
    pkg: 'gnome-system-monitor', exec: 'gnome-system-monitor', icon: 'settings',
    blurb: 'What is running, and what it is using.' },
  { id: 'disks', name: 'Disks', category: 'System', kind: 'app',
    pkg: 'gnome-disk-utility', exec: 'gnome-disks', icon: 'settings', blurb: 'Drives and free space.' },
  { id: 'archive', name: 'Zip Files', realName: 'Archive Manager', category: 'System', kind: 'app',
    pkg: 'file-roller', exec: 'file-roller', icon: 'files', blurb: 'Open and make .zip files.' },

  // ── Developer ─────────────────────────────────────────────────────────────
  { id: 'python', name: 'Python', category: 'Developer', kind: 'app',
    pkg: 'python3', exec: 'xterm -e python3', icon: 'terminal',
    blurb: 'The language most automation is written in.' },
  { id: 'git', name: 'Git', category: 'Developer', kind: 'app',
    pkg: 'git', exec: 'xterm -e bash -lc "git --help; exec bash"', icon: 'terminal',
    blurb: 'Version control, and how agents fetch code.' },

  // ── From GitHub — one click, no terminal ──────────────────────────────────
  // The point of the OS. Every one of these is a genuinely good free tool whose README assumes you
  // are comfortable with a terminal. adris OS reads the repo, works out how it builds, and does it.
  { id: 'gh-stirlingpdf', name: 'PDF Tools', realName: 'Stirling PDF', category: 'Office', kind: 'github',
    repo: 'https://github.com/Stirling-Tools/Stirling-PDF', icon: 'text',
    iconUrl: 'https://raw.githubusercontent.com/Stirling-Tools/Stirling-PDF/main/docs/stirling.png',
    blurb: 'Merge, split, sign and convert PDFs — everything the paid tools charge for.' },

  { id: 'gh-shotcut', name: 'Video Editor', realName: 'Shotcut', category: 'Media', kind: 'github',
    repo: 'https://github.com/mltframework/shotcut', icon: 'impress',
    blurb: 'Cut and edit video. Free, and genuinely good.' },

  { id: 'gh-joplin', name: 'Notebook', realName: 'Joplin', category: 'Office', kind: 'github',
    repo: 'https://github.com/laurent22/joplin', icon: 'text',
    iconUrl: 'https://raw.githubusercontent.com/laurent22/joplin/dev/Assets/LinuxIcons/256x256.png',
    blurb: 'Notes and to-dos that stay on your machine.' },

  { id: 'gh-localsend', name: 'Send Files Nearby', realName: 'LocalSend', category: 'Internet', kind: 'github',
    repo: 'https://github.com/localsend/localsend', icon: 'files',
    iconUrl: 'https://raw.githubusercontent.com/localsend/localsend/main/assets/img/logo-128.png',
    blurb: 'Send files to any phone or laptop on your WiFi. No internet, no account.' },

  // ── Business — ships with adris OS, already running ───────────────────────
  //
  // These are set up on first boot by vm/provision.sh and are simply THERE, the way Mail is on a
  // Mac. No container to think about, no database to configure, no upstream product name on
  // screen: what the user sees is Customer Records, Accounts, Invoicing.
  //
  // `port` is where provision.sh runs it; clicking opens that address in a browser window.
  { id: 'crm', name: 'Customer Records', category: 'Business', kind: 'bundled',
    port: 3010, icon: 'council', base: true,
    blurb: 'Every customer, lead and deal in one place.' },

  { id: 'accounts', name: 'Accounts', category: 'Business', kind: 'bundled',
    port: 3011, icon: 'calc', base: true,
    blurb: 'Bookkeeping, ledgers and reports for the business.' },

  { id: 'invoicing', name: 'Invoicing', category: 'Business', kind: 'bundled',
    port: 3012, icon: 'calc', base: true,
    blurb: 'Send invoices, record payments, chase what is owed.' },
];

export const BY_ID = Object.fromEntries(CATALOGUE.map((a) => [a.id, a])) as Record<string, CatalogueApp>;
export const PINNED = CATALOGUE.filter((a) => a.pinned);
export const BASE_APPS = CATALOGUE.filter((a) => a.base);

export const CATEGORIES: AppCategory[] =
  ['Essentials', 'Office', 'Internet', 'Media', 'Graphics', 'Business', 'System', 'Developer'];

/** Which drawn tile to use when a project has no logo of its own. */
export function iconFor(app: CatalogueApp): string {
  if (app.icon) return app.icon;
  switch (app.category) {
    case 'Office':    return 'text';
    case 'Internet':  return 'browser';
    case 'Media':
    case 'Graphics':  return 'impress';
    case 'Business':  return 'calc';
    case 'Developer': return 'terminal';
    case 'System':    return 'settings';
    default:          return 'apps';
  }
}
