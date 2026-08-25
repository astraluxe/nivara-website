// ─── Everything adris OS can run, and how it gets there ──────────────────────
//
// The dock's six apps were never the plan; they were what happened to be installed. This is the
// real catalogue, and it draws a distinction that matters more than any list:
//
//   'installed'  — an ordinary Linux package. One apt command away. Runs as a normal window.
//   'service'    — a self-hosted web application (Odoo, ERPNext, Twenty…). These are SERVERS, not
//                  programs: a database, a runtime, usually Docker. They are enormously valuable
//                  and they are NOT a one-click install, and saying otherwise would be the exact
//                  kind of lie this project keeps trying not to tell.
//
// Both belong in the catalogue. What must never happen is a business owner clicking "Odoo" and
// getting a spinner that never resolves because nobody told them it needs a container stack.
//
// See plan.md §6 (agents drive real applications) and the app-store thread in §14.

export type AppKind = 'app' | 'service';
export type AppCategory =
  | 'Office' | 'Internet' | 'Media' | 'Graphics'
  | 'Business' | 'Developer' | 'System' | 'Utilities';

export interface CatalogueApp {
  id: string;
  name: string;
  category: AppCategory;
  kind: AppKind;
  /** One line, in plain words, for someone who has never heard of it. */
  blurb: string;
  /** For kind:'app' — the apt package and the command to run it. */
  pkg?: string;
  exec?: string;
  /** For kind:'service' — where it comes from and roughly what it needs. */
  repo?: string;
  needs?: string;
  /** Ships in the dock's front row. */
  pinned?: boolean;
  /** Installed by setup-desktop.sh on first run. */
  base?: boolean;
}

export const CATALOGUE: CatalogueApp[] = [
  // ── Office ────────────────────────────────────────────────────────────────
  { id: 'files',    name: 'Files',               category: 'System',  kind: 'app', pkg: 'nautilus',              exec: 'nautilus --new-window', blurb: 'Browse everything on this machine, including your Windows drive.', pinned: true, base: true },
  { id: 'writer',   name: 'LibreOffice Writer',  category: 'Office',  kind: 'app', pkg: 'libreoffice-writer',    exec: 'libreoffice --writer',  blurb: 'Documents. Opens and saves .docx.', pinned: true, base: true },
  { id: 'calc',     name: 'LibreOffice Calc',    category: 'Office',  kind: 'app', pkg: 'libreoffice-calc',      exec: 'libreoffice --calc',    blurb: 'Spreadsheets. Opens and saves .xlsx.', pinned: true, base: true },
  { id: 'impress',  name: 'LibreOffice Impress', category: 'Office',  kind: 'app', pkg: 'libreoffice-impress',   exec: 'libreoffice --impress', blurb: 'Presentations. Opens and saves .pptx.', pinned: true, base: true },
  { id: 'draw',     name: 'LibreOffice Draw',    category: 'Office',  kind: 'app', pkg: 'libreoffice-draw',      exec: 'libreoffice --draw',    blurb: 'Diagrams, and editing PDFs.' },
  { id: 'text',     name: 'Text Editor',         category: 'Office',  kind: 'app', pkg: 'gedit',                 exec: 'gedit',                 blurb: 'Plain notes and text files.', base: true },
  { id: 'evince',   name: 'PDF Viewer',          category: 'Office',  kind: 'app', pkg: 'evince',                exec: 'evince',                blurb: 'Read and print PDFs.' },
  { id: 'calendar', name: 'Calendar',            category: 'Office',  kind: 'app', pkg: 'gnome-calendar',        exec: 'gnome-calendar',        blurb: 'Appointments and reminders.' },

  // ── Internet ──────────────────────────────────────────────────────────────
  { id: 'browser',   name: 'Web Browser',   category: 'Internet', kind: 'app', pkg: 'epiphany-browser', exec: 'epiphany-browser', blurb: 'Browse the web.', pinned: true, base: true },
  { id: 'thunderbird', name: 'Email',       category: 'Internet', kind: 'app', pkg: 'thunderbird',      exec: 'thunderbird',      blurb: 'Your email, on this machine rather than in a browser tab.' },
  { id: 'transmission', name: 'Downloads',  category: 'Internet', kind: 'app', pkg: 'transmission-gtk', exec: 'transmission-gtk', blurb: 'Large file transfers.' },

  // ── Media & Graphics ──────────────────────────────────────────────────────
  { id: 'vlc',      name: 'Video Player',  category: 'Media',    kind: 'app', pkg: 'vlc',            exec: 'vlc',            blurb: 'Plays essentially any video or audio file.' },
  { id: 'rhythmbox', name: 'Music',        category: 'Media',    kind: 'app', pkg: 'rhythmbox',      exec: 'rhythmbox',      blurb: 'Your music library.' },
  { id: 'cheese',   name: 'Camera',        category: 'Media',    kind: 'app', pkg: 'cheese',         exec: 'cheese',         blurb: 'Photos and video from a webcam.' },
  { id: 'shotwell', name: 'Photos',        category: 'Media',    kind: 'app', pkg: 'shotwell',       exec: 'shotwell',       blurb: 'Organise and lightly edit photos.' },
  { id: 'gimp',     name: 'Image Editor',  category: 'Graphics', kind: 'app', pkg: 'gimp',           exec: 'gimp',           blurb: 'Full image editing — the Photoshop-shaped hole.' },
  { id: 'inkscape', name: 'Vector Design', category: 'Graphics', kind: 'app', pkg: 'inkscape',       exec: 'inkscape',       blurb: 'Logos and print artwork.' },

  // ── System & Utilities ────────────────────────────────────────────────────
  { id: 'terminal', name: 'Terminal',      category: 'System',    kind: 'app', pkg: 'xterm',                exec: 'xterm',                blurb: 'A command line, for when you want one.', pinned: true, base: true },
  { id: 'monitor',  name: 'System Monitor', category: 'System',   kind: 'app', pkg: 'gnome-system-monitor', exec: 'gnome-system-monitor', blurb: 'What is running, and what it is using.' },
  { id: 'disks',    name: 'Disks',         category: 'System',    kind: 'app', pkg: 'gnome-disk-utility',   exec: 'gnome-disks',          blurb: 'Drives, partitions and free space.' },
  { id: 'archive',  name: 'Archive Manager', category: 'Utilities', kind: 'app', pkg: 'file-roller',        exec: 'file-roller',          blurb: 'Open and make .zip files.' },
  { id: 'calculator', name: 'Calculator',  category: 'Utilities', kind: 'app', pkg: 'gnome-calculator',     exec: 'gnome-calculator',     blurb: 'Sums.' },
  { id: 'gparted',  name: 'Partitions',    category: 'System',    kind: 'app', pkg: 'gparted',              exec: 'gparted',              blurb: 'Resize and manage disks. Careful — this one can lose data.' },

  // ── Developer ─────────────────────────────────────────────────────────────
  { id: 'git',      name: 'Git',           category: 'Developer', kind: 'app', pkg: 'git',      exec: 'xterm -e git --help', blurb: 'Version control, and how agents pull code.' },
  { id: 'python',   name: 'Python',        category: 'Developer', kind: 'app', pkg: 'python3',  exec: 'xterm -e python3',    blurb: 'The language most automation is written in.' },

  // ── Business (self-hosted services, NOT one-click) ───────────────────────
  // These are the serious ones for the audience this OS is for — a real CRM, a real ERP, real
  // accounting, all open source and all running on the user's own hardware, which is exactly the
  // "your data stays yours" promise adris.tech already makes. Every one is a server stack, so they
  // are listed honestly as services with what they need stated.
  { id: 'odoo',     name: 'Odoo',          category: 'Business', kind: 'service', repo: 'https://github.com/odoo/odoo',            needs: 'Docker + PostgreSQL', blurb: 'The big one: CRM, inventory, sales, projects, HR — a whole business suite.' },
  { id: 'erpnext',  name: 'ERPNext',       category: 'Business', kind: 'service', repo: 'https://github.com/frappe/erpnext',       needs: 'Docker + MariaDB',    blurb: 'Accounting, manufacturing, payroll and stock. Strong in India.' },
  { id: 'twenty',   name: 'Twenty CRM',    category: 'Business', kind: 'service', repo: 'https://github.com/twentyhq/twenty',      needs: 'Docker + PostgreSQL', blurb: 'A modern, Notion-feeling CRM. The Salesforce alternative.' },
  { id: 'espocrm',  name: 'EspoCRM',       category: 'Business', kind: 'service', repo: 'https://github.com/espocrm/espocrm',      needs: 'Docker or PHP + MySQL', blurb: 'Light, quick CRM for leads, deals and support cases.' },
  { id: 'suitecrm', name: 'SuiteCRM',      category: 'Business', kind: 'service', repo: 'https://github.com/salesagility/SuiteCRM', needs: 'PHP + MySQL',        blurb: 'Mature, enterprise-grade CRM.' },
  { id: 'krayin',   name: 'Krayin CRM',    category: 'Business', kind: 'service', repo: 'https://github.com/krayin/laravel-crm',   needs: 'PHP + MySQL',         blurb: 'Free lead and sales management, built on Laravel.' },
  { id: 'dolibarr', name: 'Dolibarr',      category: 'Business', kind: 'service', repo: 'https://github.com/Dolibarr/dolibarr',    needs: 'PHP + MySQL',         blurb: 'ERP/CRM aimed squarely at small businesses and freelancers.' },
  { id: 'akaunting', name: 'Akaunting',    category: 'Business', kind: 'service', repo: 'https://github.com/akaunting/akaunting',  needs: 'PHP + MySQL',         blurb: 'Accounting and invoicing for small businesses.' },
  { id: 'invoiceninja', name: 'Invoice Ninja', category: 'Business', kind: 'service', repo: 'https://github.com/invoiceninja/invoiceninja', needs: 'Docker or PHP + MySQL', blurb: 'Invoice clients, track payments, log time.' },
];

export const BY_ID = Object.fromEntries(CATALOGUE.map((a) => [a.id, a])) as Record<string, CatalogueApp>;
export const PINNED = CATALOGUE.filter((a) => a.pinned);
export const BASE_APPS = CATALOGUE.filter((a) => a.base);

export const CATEGORIES: AppCategory[] =
  ['Office', 'Internet', 'Media', 'Graphics', 'Business', 'System', 'Utilities', 'Developer'];

/** Which icon tile to draw. Falls back to a category-shaped default so a new entry is never blank. */
export function iconFor(app: CatalogueApp): string {
  const known = ['files', 'writer', 'calc', 'impress', 'text', 'terminal', 'browser', 'council', 'calendar', 'settings', 'mail', 'apps'];
  if (known.includes(app.id)) return app.id;
  switch (app.category) {
    case 'Office':    return 'text';
    case 'Internet':  return 'browser';
    case 'Media':     return 'impress';
    case 'Graphics':  return 'impress';
    case 'Business':  return 'calc';
    case 'Developer': return 'terminal';
    case 'System':    return 'settings';
    default:          return 'apps';
  }
}
