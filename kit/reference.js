/* Dashboard kit — reference page.
 * Every example below is a real function: the page runs it for the preview and prints its source as the
 * code sample, so what you read is exactly what produced what you see. */
(() => {
  'use strict';
  const { esc, icon } = DK;
  DK.theme.init();

  /* ------------------------------------------------------------------ examples */
  const SECTIONS = [
    /* ---------------- Foundations ---------------- */
    { id: 'colour', group: 'Foundations', title: 'Colour', kind: 'colour',
      lede: 'Every colour is a token. Components never use a literal colour, so switching <code>data-theme</code> on <code>&lt;html&gt;</code> re-themes the whole page. Values shown are the ones in use right now.' },
    { id: 'type', group: 'Foundations', title: 'Type', kind: 'type',
      lede: 'One system font, five sizes. Nothing on a dashboard is larger than the page title.' },
    { id: 'shape', group: 'Foundations', title: 'Shape and elevation', kind: 'shape',
      lede: 'Controls are 8px, cards 12px. Cards are a hairline border with an almost-flat shadow; only floating layers (tooltips, menus) cast a real one.' },
    { id: 'icons', group: 'Foundations', title: 'Icons', kind: 'icons',
      lede: 'Inline SVG from <code>icons.js</code>, drawn with <code>DK.icon(name)</code>. To add one, put its name in <code>scripts/kit-icons.cjs</code> and run the script.' },

    /* ---------------- Components ---------------- */
    { id: 'page-header', group: 'Components', title: 'Page header',
      lede: 'Title, one visible line that says what the page is for, and the page’s actions. Exactly one action is <code>primary</code>.',
      demos: [{ title: 'Page header',
        run: () => DK.pageHeader({
          title: 'Dashboard',
          sub: 'Document control activity and items requiring attention.',
          actions: DK.button({ label: 'Export', icon: 'download' })
            + DK.button({ label: 'New / Revise Document', icon: 'file-plus', variant: 'primary' })
        }),
        opts: [['title', 'Page name. Rendered as the only <code>h1</code>.'], ['sub', 'One sentence. Always visible, never a tooltip.'], ['actions', 'HTML. Buttons, quiet first, the primary last.']] }] },

    { id: 'button', group: 'Components', title: 'Button',
      lede: 'One solid green button per page. Everything else is the default (quiet) style, so the main action is never in doubt.',
      demos: [{ title: 'Variants and sizes', cls: 'row',
        run: () => DK.button({ label: 'New / Revise Document', icon: 'file-plus', variant: 'primary' })
          + DK.button({ label: 'Export', icon: 'download' })
          + DK.button({ label: 'Clear filters', variant: 'ghost' })
          + DK.button({ label: 'Open', size: 'sm' })
          + DK.iconButton({ icon: 'bell', label: 'Notifications', badge: 6 }),
        opts: [['label', 'Text on the button.'], ['icon', 'Icon name, drawn before the label.'], ['variant', '<code>primary</code> (once per page) or <code>ghost</code>. Omit for the default.'], ['size', '<code>sm</code> for buttons inside rows and cards.'], ['href', 'Renders a link that looks like a button.'], ['attrs', 'Extra attributes, e.g. <code>{ \'data-action\': \'export\' }</code>.']] }] },

    { id: 'seg', group: 'Components', title: 'Segmented control',
      lede: 'Tabs and quick filters. Counts are optional and quiet. Listen for <code>dk:change</code> on the group or any parent.',
      demos: [{ title: 'Quick filter', cls: 'row',
        run: () => DK.seg({
          label: 'Show',
          value: 'all',
          items: [
            { value: 'all', label: 'All', count: 9 },
            { value: 'mine', label: 'My Tasks', count: 5 },
            { value: 'soon', label: 'Due Soon', count: 5 },
            { value: 'overdue', label: 'Overdue', count: 2 }
          ]
        }),
        opts: [['label', 'Name of the group for screen readers.'], ['value', 'The selected item.'], ['items', '<code>{ value, label, count }</code> each.']] }] },

    { id: 'metric', group: 'Components', title: 'Metric card',
      lede: 'A label, one number, one short note. It is always a link to the list behind the number. At most one card per page is the dark <code>feature</code> card; a red <code>flag</code> replaces the note when something is overdue.',
      demos: [{ title: 'KPI row',
        run: () => DK.dash({
          kpis: [
            { label: 'Controlled documents', value: 63, note: '54 published · 9 in progress', href: '#metric', feature: true },
            { label: 'Technical Review', value: 3, flag: '1 overdue', href: '#metric' },
            { label: 'Awaiting Approval', value: 3, note: 'Pending approval', href: '#metric' },
            { label: 'Ready to Publish', value: 1, note: 'Approved revisions', href: '#metric' }
          ]
        }),
        opts: [['label', 'What is counted.'], ['value', 'The number. Calculate it from data, never type it in.'], ['note', 'One short line of context.'], ['flag', 'Red warning shown instead of the note, e.g. <code>1 overdue</code>.'], ['href', 'Where the same items are listed.'], ['feature', 'The one emphasised card on the page.']] }] },

    { id: 'card', group: 'Components', title: 'Card',
      lede: 'The container for everything below the KPI row: a quiet header (title, optional count, an explanation behind ⓘ, one link) and a body.',
      demos: [{ title: 'Card', cls: 'w460',
        run: () => DK.card({
          title: 'Needs Attention',
          count: 2,
          info: 'Only rows with something to do are listed, most urgent first.',
          link: { href: '#card', text: 'Open Tasks' },
          body: 'Any HTML goes here: a chart, a list, a gauge.'
        }),
        opts: [['title', 'Card heading (<code>h2</code>).'], ['count', 'Quiet number after the title.'], ['info', 'Explanation shown on hover or focus of ⓘ.'], ['link', '<code>{ href, text }</code>, right-aligned.'], ['body', 'HTML.'], ['flush', 'No body padding, for lists that draw their own rows.'], ['span', 'Columns in the dashboard grid: 3, 4, 5, 6, 7, 8 or 12.']] }] },

    { id: 'columns', group: 'Components', title: 'Column chart',
      lede: 'Counts per stage on one scale that starts at zero. Thin columns, the value on the cap, the label underneath, and each column links to its items. A figure on a very different scale goes in the strip below instead of flattening the columns.',
      demos: [{ title: 'Workflow distribution', cls: 'w460',
        run: () => DK.card({
          title: 'Document Workflow',
          body: DK.lead(9, 'revisions in progress')
            + DK.columns({
              label: 'Revisions in progress by lifecycle stage',
              unit: ['document', 'documents'],
              items: [
                { label: 'Draft', value: 1, stage: 'draft', href: '#columns' },
                { label: 'Technical Review', value: 3, stage: 'review', href: '#columns' },
                { label: 'Changes Requested', value: 1, stage: 'changes', href: '#columns' },
                { label: 'Approval', value: 3, stage: 'approval', href: '#columns' },
                { label: 'Ready to Publish', value: 1, stage: 'publish', href: '#columns' }
              ]
            })
            + DK.strip({
              label: DK.stage('published'),
              value: 54 / 63 * 100,
              tone: 'published',
              figure: '<b>54</b> of 63',
              href: '#columns'
            })
        }),
        opts: [['label', 'What the chart shows, for screen readers.'], ['unit', 'Singular and plural of what is counted.'], ['items', '<code>{ label, value, stage, href }</code>. <code>stage</code> picks the colour.']] }] },

    { id: 'gauge', group: 'Components', title: 'Gauge and factors',
      lede: 'One ratio as a half ring, with the checks it is made of listed underneath so the score can be explained. Say what the score is and is not in the card’s ⓘ.',
      demos: [{ title: 'Document Control Health', cls: 'w320',
        run: () => DK.card({
          title: 'Document Control Health',
          info: 'Average of four operational checks. An internal indicator, not an ISO certification or a compliance score.',
          body: DK.gauge({ value: 91, label: 'Document Control Health', state: 'On track', tone: 'success' })
            + DK.factors([
              { label: 'Periodic reviews on time', ok: 56, of: 62 },
              { label: 'Tasks within due date', ok: 6, of: 8 },
              { label: 'Source links available', ok: 62, of: 63 },
              { label: 'Document details complete', ok: 63, of: 63 }
            ])
        }),
        opts: [['value', '0 to 100, or <code>null</code> when there is not enough data.'], ['state', 'The same information in words: On track, Needs attention, At risk.'], ['tone', '<code>success</code>, <code>warning</code> or <code>danger</code>.'], ['DK.factors', '<code>[{ label, ok, of }]</code>. The meter turns amber under 85% and red under 70%.']] }] },

    { id: 'stage', group: 'Components', title: 'Stage and due date',
      lede: 'Lifecycle stage is a coloured dot plus its name; Draft is hollow because it has not entered the workflow. Due dates spell out their state, and overdue is the only red on the page.',
      demos: [{ title: 'Stages', cls: 'row',
        run: () => ['draft', 'review', 'changes', 'approval', 'publish', 'published'].map(key => DK.stage(key)).join('') },
      { title: 'Due states', cls: 'row',
        run: () => DK.due({ label: 'Overdue · 5 Oct', state: 'overdue' })
          + DK.due({ label: 'Due 8 Oct', state: 'soon' })
          + DK.due({ label: 'Due 15 Oct', state: 'ok' })
          + DK.due({ state: 'none' }),
        opts: [['DK.stage(key, label)', 'Key is one of draft, review, changes, approval, publish, published.'], ['DK.due({ label, state })', 'State is <code>overdue</code>, <code>soon</code>, <code>ok</code> or <code>none</code>.'], ['DK.dueState(date, today)', 'Works the state out from two ISO dates.']] }] },

    { id: 'small', group: 'Components', title: 'Badge, count, avatar, meter',
      lede: 'The small parts. Badges are neutral unless they carry a status.',
      demos: [{ title: 'Small parts', cls: 'row',
        run: () => DK.badge('Invited')
          + DK.badge('On track', 'success')
          + DK.badge('Due soon', 'warning')
          + DK.badge('Overdue', 'danger')
          + DK.count(5)
          + DK.info('Explanations live behind this icon instead of in a sentence on the page.')
          + DK.avatar({ initials: 'MS', name: 'Maria Santos' })
          + DK.avatars([{ initials: 'NF', name: 'Nina Flores' }, { initials: 'EN', name: 'Eric Navarro' }, { initials: 'DR', name: 'Daniel Reyes' }])
          + '<span style="width:160px">' + DK.meter(72, 'warning') + '</span>' }] },

    { id: 'list', group: 'Components', title: 'Action list',
      lede: 'For things that need doing. The whole row is one link and the tone tints only the icon square. Leave out rows with nothing to do instead of showing zeros.',
      demos: [{ title: 'Needs Attention', cls: 'w460',
        run: () => DK.card({
          title: 'Needs Attention', count: 3, flush: true,
          body: DK.list({
            items: [
              { tone: 'danger', icon: 'clock-alert', href: '#list', title: '2 tasks past their due date', meta: 'Oldest was due 3 Oct 2026' },
              { tone: 'warning', icon: 'clock', href: '#list', title: '5 tasks due within 7 days', meta: 'Next: Contract Review Procedure' },
              { icon: 'send', href: '#list', title: '1 approved revision ready to publish', meta: 'Not effective until published' }
            ],
            empty: { icon: 'circle-check', title: 'Nothing needs attention right now' }
          })
        }),
        opts: [['items', '<code>{ href, icon, tone, title, meta }</code>. Tone is <code>danger</code>, <code>warning</code> or omitted.'], ['empty', 'Options for the empty state shown when there are no rows.']] }] },

    { id: 'worklist', group: 'Components', title: 'Work list',
      lede: 'What is assigned to someone: title and reference, up to two status cells, and one quiet action per row.',
      demos: [{ title: 'My Work', cls: 'w720',
        run: () => DK.card({
          title: 'My Work', count: 2, flush: true, link: { href: '#worklist', text: 'View all' },
          body: DK.workList({
            items: [
              { title: 'Roles & Responsibilities Matrix', meta: 'QMS-PRO-002 · Rev 04 · Technical Reviewer',
                cells: [DK.stage('review'), DK.due({ label: 'Overdue · 5 Oct', state: 'overdue' })],
                action: { label: 'Open', href: '#worklist' } },
              { title: 'Contract Review Procedure', meta: 'SAL-PRO-003 · Rev 03 · Approver',
                cells: [DK.stage('approval'), DK.due({ label: 'Due 8 Oct', state: 'soon' })],
                action: { label: 'Open', href: '#worklist' } }
            ]
          })
        }),
        opts: [['items', '<code>{ title, meta, cells: [html, html], action: { label, href, attrs } }</code>.'], ['empty', 'Options for the empty state.']] }] },

    { id: 'activity', group: 'Components', title: 'Activity',
      lede: 'Who did what to which record, and when. Kept light: no card per item, no icons competing with the avatars.',
      demos: [{ title: 'Recent Activity', cls: 'w460',
        run: () => DK.card({
          title: 'Recent Activity',
          body: DK.activity({
            items: [
              { initials: 'MS', name: 'Maria Santos', text: 'approved Commissioning Report Template Rev 03', ref: { label: 'TST-TPL-004', href: '#activity' }, date: '2026-10-04', when: '4 Oct 2026' },
              { initials: 'BC', name: 'Ben Castillo', text: 'created draft Control of Nonconforming Materials Rev 00', ref: { label: 'WHS-PRO-005', href: '#activity' }, date: '2026-10-02', when: '2 Oct 2026' }
            ]
          })
        }),
        opts: [['items', '<code>{ initials, name, text, ref: { label, href }, date, when }</code>. <code>when</code> is the text shown; <code>date</code> is the ISO date behind it.']] }] },

    { id: 'empty', group: 'Components', title: 'Empty state',
      lede: 'Say what would be here and, where there is one, the next step.',
      demos: [{ title: 'Empty state', cls: 'w460',
        run: () => DK.card({
          title: 'My Work', flush: true,
          body: DK.empty({
            icon: 'circle-check',
            title: 'No document actions are assigned to you',
            text: 'Reviews, approvals and drafts that need you appear here.'
          })
        }),
        opts: [['icon', 'Defaults to <code>inbox</code>.'], ['title', 'What is (not) here.'], ['text', 'One more line, optional.'], ['action', 'HTML, usually one small button.']] }] },

    { id: 'grid', group: 'Layout', title: 'Dashboard grid',
      lede: 'Twelve columns. KPI cards sit in their own row; every other card says how many columns it takes with <code>span</code>. The grid measures the page it is in, not the window, so it regroups when a sidebar opens. Under about 1040px wide cards go full width, under 720px everything stacks.',
      demos: [{ title: 'Spans',
        run: () => DK.dash({
          body: DK.card({ title: 'span: 5', span: 5, body: 'Chart' })
            + DK.card({ title: 'span: 4', span: 4, body: 'Action list' })
            + DK.card({ title: 'span: 3', span: 3, body: 'Gauge' })
            + DK.card({ title: 'span: 7', span: 7, body: 'Work list' })
            + DK.card({ title: 'span: 5', span: 5, body: 'Activity' })
        }),
        opts: [['kpis', 'Array of metric card options. Four reads best.'], ['body', 'HTML: cards with a <code>span</code>. Spans in a row add up to 12.']] }] },

    { id: 'shell', group: 'Layout', title: 'Shell',
      lede: 'The frame this page is built with: a dark sidebar with labelled groups, a compact top bar (search, a few icon buttons, the account) and the page. Under 1024px the sidebar becomes a drawer opened from the menu button.',
      demos: [{ title: 'Shell', noPreview: true,
        run: () => DK.shell({
          sidebar: DK.sidebar({
            brand: { mark: 'HS', name: 'Helios Solar Installations', meta: 'Document Control' },
            groups: [
              { items: [{ href: '#/overview', icon: 'layout-dashboard', label: 'Dashboard', current: true }] },
              { label: 'Document Control', items: [
                { href: '#/documents', icon: 'files', label: 'Documents' },
                { href: '#/tasks', icon: 'list-checks', label: 'Tasks', count: 5 }] },
              { label: 'Organization', items: [
                { href: '#/team', icon: 'users', label: 'Team' },
                { href: '#/qms', icon: 'workflow', label: 'ISO QMS Structure' }] }
            ],
            foot: [{ href: '#/settings', icon: 'settings', label: 'Settings' }]
          }),
          topbar: DK.topbar({
            search: { placeholder: 'Search documents, processes, people…', kbd: 'Ctrl K' },
            right: DK.iconButton({ icon: 'moon', label: 'Switch theme' }) + DK.iconButton({ icon: 'bell', label: 'Notifications', badge: 6 }),
            user: { initials: 'MS', name: 'Maria Santos', title: 'Quality & Compliance Manager' }
          }),
          main: '…page header and dashboard…'
        }),
        opts: [['DK.sidebar', '<code>{ brand, groups: [{ label, items }], foot }</code>. Mark the page you are on with <code>current: true</code>.'], ['DK.topbar', '<code>{ search, right (html), user }</code>.'], ['DK.shell', '<code>{ sidebar, topbar, main }</code>. Put <code>class="dk-app"</code> on <code>&lt;body&gt;</code>.']] }] },

    /* ---------------- Example ---------------- */
    { id: 'example', group: 'Example', title: 'A whole dashboard',
      lede: 'Everything above, assembled. This is the Document Control dashboard with sample figures; in the application the same calls are fed from live data.',
      demos: [{ title: 'Dashboard',
        run: () => DK.pageHeader({
          title: 'Dashboard',
          sub: 'Document control activity and items requiring attention.',
          actions: DK.button({ label: 'Export', icon: 'download' })
            + DK.button({ label: 'New / Revise Document', icon: 'file-plus', variant: 'primary' })
        }) + DK.dash({
          kpis: [
            { label: 'Controlled documents', value: 63, note: '54 published · 9 in progress', href: '#example', feature: true },
            { label: 'Technical Review', value: 3, flag: '1 overdue', href: '#example' },
            { label: 'Awaiting Approval', value: 3, note: 'Pending approval', href: '#example' },
            { label: 'Ready to Publish', value: 1, note: 'Approved revisions', href: '#example' }
          ],
          body: DK.card({
            title: 'Document Workflow', span: 5, link: { href: '#example', text: 'Open Tasks' },
            info: 'Each document is counted once, by the stage of its current revision.',
            body: DK.lead(9, 'revisions in progress')
              + DK.columns({
                label: 'Revisions in progress by lifecycle stage', unit: ['document', 'documents'],
                items: [
                  { label: 'Draft', value: 1, stage: 'draft', href: '#example' },
                  { label: 'Technical Review', value: 3, stage: 'review', href: '#example' },
                  { label: 'Changes Requested', value: 1, stage: 'changes', href: '#example' },
                  { label: 'Approval', value: 3, stage: 'approval', href: '#example' },
                  { label: 'Ready to Publish', value: 1, stage: 'publish', href: '#example' }
                ]
              })
              + DK.strip({ label: DK.stage('published'), value: 54 / 63 * 100, tone: 'published', figure: '<b>54</b> of 63', href: '#example' })
          }) + DK.card({
            title: 'Needs Attention', span: 4, count: 5, flush: true,
            body: DK.list({ items: [
              { tone: 'danger', icon: 'clock-alert', href: '#example', title: '2 tasks past their due date', meta: 'Oldest was due 3 Oct 2026' },
              { tone: 'danger', icon: 'calendar-clock', href: '#example', title: '6 documents overdue for periodic review', meta: 'Oldest was due 8 Sep 2026' },
              { tone: 'warning', icon: 'clock', href: '#example', title: '5 tasks due within 7 days', meta: 'Next: Contract Review Procedure' },
              { tone: 'warning', icon: 'reply', href: '#example', title: '1 revision waiting on its author', meta: 'Changes requested during review' },
              { icon: 'send', href: '#example', title: '1 approved revision ready to publish', meta: 'Not effective until published' }
            ] })
          }) + DK.card({
            title: 'Document Control Health', span: 3, infoLeft: true,
            info: 'Average of four operational checks. An internal indicator, not an ISO certification or a compliance score.',
            body: DK.gauge({ value: 91, label: 'Document Control Health', state: 'On track', tone: 'success' })
              + DK.factors([
                { label: 'Periodic reviews on time', ok: 56, of: 62 },
                { label: 'Tasks within due date', ok: 6, of: 8 },
                { label: 'Source links available', ok: 62, of: 63 },
                { label: 'Document details complete', ok: 63, of: 63 }
              ])
          }) + DK.card({
            title: 'My Work', span: 7, count: 3, flush: true, link: { href: '#example', text: 'View all' },
            body: DK.workList({ items: [
              { title: 'Roles & Responsibilities Matrix', meta: 'QMS-PRO-002 · Rev 04 · Technical Reviewer', cells: [DK.stage('review'), DK.due({ label: 'Overdue · 5 Oct', state: 'overdue' })], action: { label: 'Open', href: '#example' } },
              { title: 'Contract Review Procedure', meta: 'SAL-PRO-003 · Rev 03 · Approver', cells: [DK.stage('approval'), DK.due({ label: 'Due 8 Oct', state: 'soon' })], action: { label: 'Open', href: '#example' } },
              { title: 'Commissioning Report Template', meta: 'TST-TPL-004 · Rev 03 · Publisher', cells: [DK.stage('publish'), DK.due({ label: 'Due 9 Oct', state: 'soon' })], action: { label: 'Open', href: '#example' } }
            ] })
          }) + DK.card({
            title: 'Recent Activity', span: 5,
            body: DK.activity({ items: [
              { initials: 'MS', name: 'Maria Santos', text: 'approved Commissioning Report Template Rev 03', ref: { label: 'TST-TPL-004', href: '#example' }, date: '2026-10-04', when: '4 Oct 2026' },
              { initials: 'MS', name: 'Maria Santos', text: 'requested changes to Design Output & Verification Procedure Rev 03', ref: { label: 'ENG-PRO-003', href: '#example' }, date: '2026-10-03', when: '3 Oct 2026' },
              { initials: 'BC', name: 'Ben Castillo', text: 'created draft Control of Nonconforming Materials Rev 00', ref: { label: 'WHS-PRO-005', href: '#example' }, date: '2026-10-02', when: '2 Oct 2026' }
            ] })
          })
        }) }] }
  ];

  const RULES = [
    ['One green action per page', 'Only one button is <code>primary</code>. Secondary controls stay quiet so the main action is never in doubt.'],
    ['One feature card', 'The dark card marks the most important number. A second one cancels the first.'],
    ['Colour has a job', 'The green ramp is progress through the lifecycle. Amber means someone must act. Red means overdue, and nothing else.'],
    ['Never colour alone', 'Every state also has a word or an icon: “Overdue · 5 Oct”, a hollow dot for Draft, “On track” under the gauge.'],
    ['Numbers come from data', 'A metric is calculated, links to the list behind it, and shows the same count that list shows.'],
    ['Operational, not decorative', 'A card earns its place by answering a question: what needs me, what stage is it in, who has it, what is late.'],
    ['Flat and consistent', 'Cards are 12px with a hairline border; controls are 8px. No gradients, glows or oversized headings.'],
    ['Explain behind ⓘ', 'One visible sentence under the page title. Longer explanations go behind the info icon.']
  ];

  const TOKENS = [
    ['Surfaces', ['bg', 'surface', 'surface-2', 'border', 'border-strong', 'hover', 'neutral-bg']],
    ['Text', ['text', 'text-2', 'text-3']],
    ['Brand', ['accent', 'accent-hover', 'accent-soft', 'on-accent', 'sidebar-bg', 'feature-bg']],
    ['Status', ['success', 'success-bg', 'warning', 'warning-bg', 'danger', 'danger-bg', 'info', 'info-bg']],
    ['Lifecycle', ['stage-draft', 'stage-review', 'stage-changes', 'stage-approval', 'stage-publish', 'stage-published', 'track']]
  ];
  const TYPE = [['Page title', 'page', 'Dashboard', 600], ['Metric', 'metric', '63', 600], ['Section title', 'section', 'Document Workflow', 600], ['Body', 'body', 'Document control activity and items requiring attention.', 400], ['Small', 'small', 'Maria Santos approved Commissioning Report Template Rev 03', 400], ['Meta', 'meta', 'QMS-PRO-002 · Rev 04 · Technical Reviewer', 400]];

  /* ------------------------------------------------------------------ rendering */
  // The source of an example, without the arrow and with its indentation removed.
  const source = fn => {
    const lines = String(fn).replace(/^\(\)\s*=>\s*/, '').split('\n');
    const indent = Math.min(...lines.slice(1).filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
    return lines.map((l, i) => i && Number.isFinite(indent) ? l.slice(indent) : l).join('\n');
  };
  const demo = d => `<div class="ref-demo">
      <div class="ref-demo-head"><h3>${esc(d.title)}</h3></div>
      ${d.noPreview ? '' : `<div class="ref-preview ${d.cls || ''}">${d.run()}</div>`}
      <div class="ref-code"><pre><code>${esc(source(d.run))}</code></pre>${DK.button({ label: 'Copy', icon: 'copy', size: 'sm', attrs: { 'data-copy': '' } })}</div>
      ${d.opts ? `<dl class="ref-opts">${d.opts.map(([k, v]) => `<dt><code>${esc(k)}</code></dt><dd>${v}</dd>`).join('')}</dl>` : ''}</div>`;

  const colour = () => `<div class="ref-demo">${TOKENS.map(([name, list]) => `<div class="ref-demo-head"><h3>${name}</h3></div>
      <div class="ref-swatches">${list.map(t => `<div class="ref-swatch"><i style="background:var(--dk-${t})" data-token="${t}"></i><span><code>--dk-${t}</code><small data-value="${t}"></small></span></div>`).join('')}</div>`).join('')}</div>`;
  const type = () => `<div class="ref-demo"><div class="ref-type">${TYPE.map(([name, key, text, weight]) =>
    `<div><small>${name} · --dk-fs-${key}</small><span style="font-size:var(--dk-fs-${key});line-height:var(--dk-lh-${key});font-weight:${weight}">${esc(text)}</span></div>`).join('')}</div></div>`;
  const shape = () => `<div class="ref-demo"><div class="ref-shapes">
      <div class="ref-shape" style="border-radius:var(--dk-r-sm)">--dk-r-sm<br>6px · chips</div>
      <div class="ref-shape" style="border-radius:var(--dk-r-md)">--dk-r-md<br>8px · controls</div>
      <div class="ref-shape" style="border-radius:var(--dk-r-lg);box-shadow:var(--dk-shadow-card)">--dk-r-lg<br>12px · cards<br>--dk-shadow-card</div>
      <div class="ref-shape" style="border-radius:var(--dk-r-lg);box-shadow:var(--dk-shadow-float)">--dk-shadow-float<br>tooltips, menus</div></div></div>`;
  const icons = () => `<div class="ref-demo"><div class="ref-icons">${Object.keys(window.DK_ICONS).map(n => `<span title="${n}">${icon(n)}${n}</span>`).join('')}</div></div>`;
  const KIND = { colour, type, shape, icons };

  const groups = [...new Set(SECTIONS.map(s => s.group))];
  const body = `
    <div class="ref-intro ref-section" id="top">${DK.pageHeader({ title: 'Dashboard Kit', sub: 'The tokens and components the Document Control dashboard is built from. Use them to build any other page in the same design.' })}
      <div class="ref-demo"><div class="ref-demo-head"><h3>Use it</h3><span>three files, no build step, no framework</span></div>
        <div class="ref-code"><pre><code>${esc(`<link rel="stylesheet" href="kit/kit.css">
<script src="kit/icons.js"></script>
<script src="kit/kit.js"></script>

<body class="dk-app">
  <div id="page"></div>
  <script>
    DK.theme.init();
    document.getElementById('page').innerHTML =
      DK.pageHeader({ title: 'Dashboard', sub: 'What needs attention today.' }) +
      DK.dash({
        kpis: [{ label: 'Technical Review', value: 3, note: 'Awaiting review', href: '#/tasks' }],
        body: DK.card({ title: 'My Work', span: 12, body: DK.empty({ title: 'Nothing assigned' }) })
      });
  </script>
</body>`)}</code></pre>${DK.button({ label: 'Copy', icon: 'copy', size: 'sm', attrs: { 'data-copy': '' } })}</div>
        <dl class="ref-opts"><dt><code>DK.x(options)</code></dt><dd>Every component is a function that returns an HTML string. Text options are escaped for you; options described as HTML are inserted as they are.</dd>
          <dt><code>dk-</code></dt><dd>Every class and every <code>--dk-</code> token is prefixed, so the kit can sit inside an existing application without touching its styles.</dd>
          <dt><code>data-theme</code></dt><dd><code>light</code> or <code>dark</code> on <code>&lt;html&gt;</code>. <code>DK.theme.set('dark' | 'light' | 'system')</code> stores the choice.</dd></dl></div>
    </div>
    <section class="ref-section" id="rules"><h2>Rules of the design</h2><p class="ref-lede">The look depends on these more than on any one component. Break one and the page starts to read like a template.</p>
      <ul class="ref-rules">${RULES.map(([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`).join('')}</ul></section>
    ${groups.map(g => `<h2 class="ref-group">${esc(g)}</h2>${SECTIONS.filter(s => s.group === g).map(s => `<section class="ref-section" id="${s.id}" data-search="${esc((s.title + ' ' + s.lede).toLowerCase())}">
        <h2>${esc(s.title)}</h2><p class="ref-lede">${s.lede}</p>${s.kind ? KIND[s.kind]() : s.demos.map(demo).join('')}</section>`).join('')}`).join('')}`;

  document.getElementById('app').innerHTML = DK.shell({
    sidebar: DK.sidebar({
      brand: { mark: 'DK', name: 'Dashboard Kit', meta: `iQMS Document Control · v${DK.version}` },
      groups: [{ items: [{ href: '#top', icon: 'home', label: 'Start' }, { href: '#rules', icon: 'shield-check', label: 'Rules' }] },
        ...groups.map(g => ({ label: g, items: SECTIONS.filter(s => s.group === g).map(s => ({ href: '#' + s.id, label: s.title })) }))],
      foot: [{ href: '../', icon: 'external-link', label: 'Open the application' }]
    }),
    topbar: DK.topbar({
      search: { placeholder: 'Filter components…', attrs: { id: 'refSearch' } },
      right: DK.iconButton({ icon: DK.theme.current() === 'dark' ? 'sun' : 'moon', label: 'Switch theme', attrs: { id: 'refTheme' } })
    }),
    main: body
  });

  /* ------------------------------------------------------------------ behaviour */
  // Resolved token values next to each swatch.
  const paintValues = () => document.querySelectorAll('[data-token]').forEach(el => {
    const css = getComputedStyle(el).backgroundColor, unit = css.startsWith('color(') ? 255 : 1;   // color-mix() computes to color(srgb r g b), 0..1
    const rgb = css.replace(/^color\(srgb/, '').match(/[\d.]+/g) || [];
    const hex = '#' + rgb.slice(0, 3).map(v => Math.round(Number(v) * unit).toString(16).padStart(2, '0')).join('').toUpperCase();
    el.parentElement.querySelector('[data-value]').textContent = rgb[3] != null && Number(rgb[3]) < 1 ? `${hex} · ${Math.round(rgb[3] * 100)}%` : hex;
  });
  paintValues();

  const themeBtn = document.getElementById('refTheme');
  themeBtn.addEventListener('click', () => DK.theme.toggle());
  document.addEventListener('dk:theme', e => {
    themeBtn.innerHTML = icon(e.detail.theme === 'dark' ? 'sun' : 'moon');
    themeBtn.setAttribute('aria-pressed', String(e.detail.theme === 'dark'));
    paintValues();
  });

  // Copy a code sample.
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const pre = btn.parentElement.querySelector('pre'), done = () => { btn.lastChild.textContent = 'Copied'; setTimeout(() => { btn.lastChild.textContent = 'Copy'; }, 1400); };
    const select = () => { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(pre.textContent).then(done, select); else select();
  });

  // Filter sections by name or description.
  document.getElementById('refSearch').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll('.ref-section[data-search]').forEach(s => { s.hidden = !!q && !s.dataset.search.includes(q); });
    document.querySelectorAll('.ref-group').forEach(g => { let n = g.nextElementSibling, any = false; while (n && n.classList.contains('ref-section')) { any = any || !n.hidden; n = n.nextElementSibling; } g.hidden = !any; });
    document.getElementById('rules').hidden = !!q; document.getElementById('top').hidden = !!q;
  });

  // Mark the section in view in the sidebar.
  const links = new Map([...document.querySelectorAll('.dk-nav-item[href^="#"]')].map(a => [a.getAttribute('href').slice(1), a]));
  const mark = id => links.forEach((a, key) => key === id ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  mark(location.hash.slice(1) && links.has(location.hash.slice(1)) ? location.hash.slice(1) : 'top');
  if ('IntersectionObserver' in window) {
    const seen = new IntersectionObserver(entries => { const top = entries.filter(x => x.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]; if (top) mark(top.target.id); }, { rootMargin: '-64px 0px -70% 0px' });
    document.querySelectorAll('.ref-section').forEach(s => seen.observe(s));
  }
  // Examples link to their own section; keep those clicks from jumping the page.
  document.addEventListener('click', e => { const a = e.target.closest('.ref-preview a[href^="#"]'); if (a) e.preventDefault(); });
})();
