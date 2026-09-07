// contents.js — the book's table of contents, in one place.
//
// Load this BEFORE sidebar_darkmode.js:
//   <script src="contents.js"></script>
//   <script src="sidebar_darkmode.js"></script>
//
// Items with an `href` become links; items without one render as plain text,
// so "drafting" and "planned" chapters can sit in the list without going
// anywhere. The chapter whose href matches the current page is marked active.
//
// If this file is absent, the sidebar falls back to on-page headings only.

window.YAW_CONTENTS = {
  title: 'SIQP II',
  href: 'index.html',

  parts: [
    {
      name: 'Basics',
      items: [
        { n: '1.1', label: 'Algebras',             href: 'algebras.html',    status: 'live' },
        { n: '1.2', label: 'Operators and states', href: 'operators.html',   status: 'live' },
        { n: '1.3', label: 'Laws of composition',  href: 'composition.html', status: 'live' }
      ]
    },
    {
      name: 'Algorithms',
      items: [
        { n: '2.1', label: 'Send',      href: 'send.html',     status: 'live' },
        { n: '2.2', label: 'Search',    href: 'search.html',   status: 'live' },
        { n: '2.3', label: 'Sample',    href: 'sample.html',   status: 'live' },
        { n: '2.4', label: 'Simulate',                         status: 'drafting' },
        { n: '2.5', label: 'Salvage',                          status: 'drafting' },
        { n: '2.6', label: 'Subgroup',                         status: 'planned' },
        { n: '2.7', label: 'Shadow',                           status: 'planned' },
        { n: '2.8', label: 'Signal',                           status: 'planned' },
        { n: '2.9', label: 'Sparsity',                         status: 'planned' }
      ]
    },
    {
      name: 'Appendices',
      items: [
        { n: 'A', label: 'Exercises',          href: 'exercises.html', status: 'live' },
        { n: 'B', label: 'Solutions',                                  status: 'drafting' },
        { n: 'C', label: 'Circuit diagrams',                           status: 'planned' },
        { n: 'D', label: 'Reference programs',                         status: 'planned' }
      ]
    }
  ]
};
