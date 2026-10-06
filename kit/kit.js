/* Dashboard kit — components as plain functions that return HTML strings.
 *
 *   <link rel="stylesheet" href="kit/kit.css">
 *   <script src="kit/icons.js"></script>
 *   <script src="kit/kit.js"></script>
 *   <script>
 *     el.innerHTML = DK.metric({ label: 'Technical Review', value: 3, note: 'Awaiting technical review', href: '#/tasks?stage=review' });
 *   </script>
 *
 * Conventions
 *   - Every text option is escaped for you. Options documented as "html" (body, actions, tools, cells, right)
 *     are inserted as they are, so build them with other DK functions or escape them with DK.esc().
 *   - `attrs` on any component adds attributes to its root element: { 'data-action': 'export', id: 'x' }.
 *   - No framework and no state. Re-render by calling the function again. The only behaviour the kit
 *     attaches is listed at the bottom of this file (segmented control, mobile menu, theme).
 */
(() => {
  'use strict';
  const ICONS = window.DK_ICONS || {};
  const DK = window.DK = { version: '1.0.0' };

  /* ---------------------------------------------------------------- helpers */
  const esc = DK.esc = (v = '') => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const attrs = o => Object.entries(o || {}).filter(([, v]) => v != null && v !== false).map(([k, v]) => v === true ? ` ${k}` : ` ${k}="${esc(v)}"`).join('');
  const cls = (...parts) => parts.filter(Boolean).join(' ');
  const clamp = n => Math.max(0, Math.min(100, Number(n) || 0));
  const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;

  // Icon by name (see icons.js for the list; add more with scripts/kit-icons.cjs).
  DK.icon = (name, extra = '') => {
    if (!ICONS[name]) { console.warn(`DK.icon: "${name}" is not in kit/icons.js`); return ''; }
    return `<svg class="${cls('dk-icon', extra)}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
  };
  const icon = DK.icon;

  // Status tone for a percentage: fine from 85, warning from 70, danger below.
  DK.tone = pct => pct == null ? '' : pct >= 85 ? '' : pct >= 70 ? 'warning' : 'danger';

  /* ---------------------------------------------------------------- controls */
  // Button or link. { label, icon, variant: 'primary' | 'ghost', size: 'sm', href, title, attrs }
  // One `primary` per page: it is the single dominant action.
  DK.button = o => {
    const tag = o.href ? 'a' : 'button';
    return `<${tag} class="${cls('dk-btn', o.variant, o.size)}"${o.href ? ` href="${esc(o.href)}"` : ' type="button"'}${o.title ? ` title="${esc(o.title)}"` : ''}${attrs(o.attrs)}>${o.icon ? icon(o.icon) : ''}${esc(o.label)}</${tag}>`;
  };

  // Square icon-only button. { icon, label (read by screen readers), badge, attrs }
  DK.iconButton = o => `<button class="dk-iconbtn" type="button" aria-label="${esc(o.label)}" title="${esc(o.label)}"${attrs(o.attrs)}>${icon(o.icon)}${o.badge ? `<span class="dk-iconbtn-dot">${esc(o.badge)}</span>` : ''}</button>`;

  // Segmented control (tabs / quick filters). { label, value, items: [{ value, label, count }], attrs }
  // Fires a bubbling "dk:change" event with detail.value when the selection changes.
  DK.seg = o => `<div class="dk-seg" role="group" aria-label="${esc(o.label)}"${attrs(o.attrs)}>${o.items.map(i =>
    `<button type="button" data-value="${esc(i.value)}" aria-pressed="${i.value === o.value}">${esc(i.label)}${i.count != null ? `<small>${esc(i.count)}</small>` : ''}</button>`).join('')}</div>`;

  // Search field for the top bar. { placeholder, label, kbd, attrs (on the <input>) }
  DK.search = (o = {}) => `<label class="dk-search">${icon('search')}<span class="dk-sr">${esc(o.label || o.placeholder || 'Search')}</span><input type="search" placeholder="${esc(o.placeholder || 'Search…')}" autocomplete="off"${attrs(o.attrs)}>${o.kbd ? `<kbd aria-hidden="true">${esc(o.kbd)}</kbd>` : ''}</label>`;

  /* ---------------------------------------------------------------- small parts */
  // Avatar with initials. { initials, name, size: 'sm' | 'lg' }  The name must also be visible or in a label nearby.
  DK.avatar = o => `<span class="${cls('dk-avatar', o.size)}" title="${esc(o.name || '')}" aria-hidden="true">${esc(o.initials)}</span>`;
  // Overlapping avatars. people: [{ initials, name }], shows `max` then "+n".
  DK.avatars = (people, max = 2) => `<span class="dk-avatars">${people.slice(0, max).map(p => DK.avatar({ ...p, size: 'sm' })).join('')}${people.length > max ? `<span class="dk-avatar sm more" aria-hidden="true">+${people.length - max}</span>` : ''}</span>`;

  // Small rounded label. tone: 'success' | 'warning' | 'danger' | 'info' | 'accent' | '' (neutral)
  DK.badge = (text, tone = '', title = '') => `<span class="${cls('dk-badge', tone)}"${title ? ` title="${esc(title)}"` : ''}>${esc(text)}</span>`;
  // Quiet number next to a heading.
  DK.count = (n, label = '') => `<span class="dk-count"${label ? ` aria-label="${esc(label)}"` : ''}>${esc(n)}</span>`;
  // Explanation behind an (i), shown on hover and keyboard focus. { left: true } opens it leftwards (cards at the right edge).
  DK.info = (text, o = {}) => `<span class="${cls('dk-info', o.left && 'left')}" tabindex="0" role="note" aria-label="${esc(text)}" data-tip="${esc(text)}">${icon('info')}</span>`;

  // Lifecycle stages of a controlled document, in order. `published` is the end state, not work in progress.
  DK.STAGES = { draft: 'Draft', review: 'Technical Review', changes: 'Changes Requested', approval: 'Approval', publish: 'Ready to Publish', published: 'Published' };
  // Stage label: a dot in the stage colour plus the name, so colour is never the only cue.
  DK.stage = (key, label) => `<span class="dk-stage" data-stage="${esc(key)}"><i aria-hidden="true"></i>${esc(label || DK.STAGES[key] || key)}</span>`;

  // Due date with its state spelled out. { label, state: 'ok' | 'soon' | 'overdue' | 'none' }
  // Red is used for `overdue` and nothing else on the page.
  DK.due = o => {
    if (o.state === 'none' || !o.label) return `<span class="dk-due none">${esc(o.label || 'No due date')}</span>`;
    if (o.state === 'overdue') return `<span class="dk-due overdue">${icon('clock-alert')}${esc(o.label)}</span>`;
    if (o.state === 'soon') return `<span class="dk-due soon">${icon('clock')}${esc(o.label)}</span>`;
    return `<span class="dk-due">${esc(o.label)}</span>`;
  };
  // 'overdue' | 'soon' | 'ok' | 'none' for an ISO date (yyyy-mm-dd) against today's ISO date.
  DK.dueState = (date, today, soonDays = 7) => !date ? 'none' : date < today ? 'overdue' : (new Date(date) - new Date(today)) / 864e5 <= soonDays ? 'soon' : 'ok';

  // Thin meter: a value from 0 to 100 on a same-hue track. tone: '' | 'warning' | 'danger' | 'published'
  DK.meter = (value, tone = '') => `<span class="${cls('dk-meter', tone)}" aria-hidden="true"><i style="--v:${clamp(value)}%"></i></span>`;

  /* ---------------------------------------------------------------- cards */
  // Card (panel). { title, count, info, link: { href, text }, tools (html), body (html), flush, span, cls, attrs }
  //   flush ... body has no padding (for lists that draw their own rows)
  //   span .... columns it takes in DK.dash (3, 4, 5, 6, 7, 8 or 12)
  DK.card = o => `<section class="${cls('dk-card', o.span && `dk-span-${o.span}`, o.cls)}"${attrs(o.attrs)}>
      <header class="dk-card-head"><h2>${esc(o.title)}</h2>${o.count != null ? DK.count(o.count) : ''}${o.info ? DK.info(o.info, { left: o.infoLeft }) : ''}
        ${o.link || o.tools ? `<div class="dk-card-tools">${o.tools || ''}${o.link ? `<a class="dk-link" href="${esc(o.link.href)}">${esc(o.link.text)}${icon('chevron-right')}</a>` : ''}</div>` : ''}</header>
      <div class="${cls('dk-card-body', o.flush && 'flush')}">${o.body || ''}</div></section>`;

  // Metric card: label, one number, one short note. { label, value, note, flag, href, feature, attrs }
  //   flag ...... replaces the note with a red warning ("1 overdue")
  //   feature ... the one emphasised (dark) card on the page
  DK.metric = o => `<a class="${cls('dk-metric', o.feature && 'feature')}" href="${esc(o.href || '#')}" aria-label="${esc(`${o.label}: ${o.value}. ${o.flag || o.note || ''}`)}"${attrs(o.attrs)}>
      <span class="dk-metric-head"><span class="dk-metric-label">${esc(o.label)}</span><span class="dk-metric-go" aria-hidden="true">${icon('arrow-up-right')}</span></span>
      <span class="dk-metric-value">${esc(o.value)}</span>
      <span class="dk-metric-foot">${o.flag ? `<span class="dk-metric-flag">${icon('clock-alert')}${esc(o.flag)}</span>` : `<span class="dk-metric-note">${esc(o.note || '')}</span>`}</span></a>`;

  /* ---------------------------------------------------------------- data */
  // "9 revisions in progress": the headline figure above a chart.
  DK.lead = (value, text) => `<p class="dk-lead"><b>${esc(value)}</b>${esc(text)}</p>`;

  // Column chart. { label, unit: ['document', 'documents'], items: [{ label, value, href, stage }] }
  // Columns share one scale that starts at zero. Each column is a link when it has an href.
  DK.columns = o => {
    const max = Math.max(1, ...o.items.map(i => Number(i.value) || 0)), [one, many] = o.unit || ['item', 'items'];
    return `<ol class="dk-cols" aria-label="${esc(o.label)}">${o.items.map(i => {
      const tag = i.href ? 'a' : 'div', text = `${i.label}: ${plural(i.value, one, many)}`;
      return `<li><${tag} class="dk-col"${i.href ? ` href="${esc(i.href)}"` : ''} title="${esc(text)}">
        <span class="dk-col-plot"><span class="dk-col-value">${esc(i.value)}</span><span class="dk-col-bar"${i.stage ? ` data-stage="${esc(i.stage)}"` : ''} style="--h:${(i.value / max * 100).toFixed(1)}%"></span></span>
        <span class="dk-col-label">${esc(i.label)}<span class="dk-sr">: ${esc(plural(i.value, one, many))}</span></span></${tag}></li>`; }).join('')}</ol>`;
  };

  // Summary strip under a chart. { label (html, e.g. DK.stage('published')), value (0-100), tone, figure (html), href, title }
  DK.strip = o => {
    const tag = o.href ? 'a' : 'div';
    return `<${tag} class="dk-strip"${o.href ? ` href="${esc(o.href)}"` : ''}${o.title ? ` title="${esc(o.title)}"` : ''}>${o.label}${DK.meter(o.value, o.tone)}<span class="dk-strip-value">${o.figure || ''}</span></${tag}>`;
  };

  // Half-ring gauge for one ratio. { value (0-100 or null), label, state ("On track"), tone: 'success' | 'warning' | 'danger' | 'neutral' }
  DK.gauge = o => {
    const none = o.value == null, v = clamp(o.value), len = Math.PI * 70;
    return `<div class="dk-gauge" role="img" aria-label="${esc(o.label)}: ${none ? 'not enough data' : v + ' percent'}${o.state ? ', ' + esc(o.state) : ''}">
      <svg viewBox="0 0 160 88" aria-hidden="true"><path class="trk" d="M10 80a70 70 0 0 1 140 0"/>${v ? `<path class="${cls('val', o.tone)}" d="M10 80a70 70 0 0 1 140 0" stroke-dasharray="${(len * v / 100).toFixed(1)} ${len.toFixed(1)}"/>` : ''}</svg>
      <span class="dk-gauge-c"><b>${none ? '—' : v + '%'}</b>${o.state ? `<span class="${cls('dk-gauge-state', o.tone)}">${esc(o.state)}</span>` : ''}</span></div>`;
  };

  // What a score is made of. items: [{ label, ok, of }]  Shows "ok of of" and a meter toned by DK.tone().
  DK.factors = items => `<ul class="dk-factors">${items.map(f => {
    const pct = f.of ? Math.round(f.ok / f.of * 100) : null;
    return `<li><span>${esc(f.label)}</span><span>${f.of ? `${esc(f.ok)} of ${esc(f.of)}` : '—'}</span>${DK.meter(pct ?? 0, DK.tone(pct))}</li>`; }).join('')}</ul>`;

  /* ---------------------------------------------------------------- lists */
  // Empty state. { icon, title, text, action (html) }
  DK.empty = o => `<div class="dk-empty">${icon(o.icon || 'inbox')}<b>${esc(o.title)}</b>${o.text ? `<span>${esc(o.text)}</span>` : ''}${o.action || ''}</div>`;

  // Action rows: each row is one link. { items: [{ href, icon, tone: 'danger' | 'warning', title, meta, attrs }], empty: { ... } }
  DK.list = o => o.items.length ? `<ul class="dk-list">${o.items.map(r => `<li><a class="${cls('dk-row', r.tone)}" href="${esc(r.href || '#')}"${attrs(r.attrs)}>
      ${r.icon ? `<span class="dk-row-icon">${icon(r.icon)}</span>` : ''}
      <span class="dk-row-main"><span class="dk-row-title">${esc(r.title)}</span>${r.meta ? `<span class="dk-row-meta">${esc(r.meta)}</span>` : ''}</span>
      <span class="dk-row-go" aria-hidden="true">${icon('chevron-right')}</span></a></li>`).join('')}</ul>` : DK.empty(o.empty || { icon: 'circle-check', title: 'Nothing here' });

  // Work rows: what is assigned, its status cells, one quiet action.
  // { items: [{ title, meta, cells: [html, html], action: { label, href, attrs } }], empty: { ... } }
  DK.workList = o => o.items.length ? `<ul class="dk-worklist">${o.items.map(r => `<li class="dk-work">
      <div class="dk-work-main"><b title="${esc(r.title)}">${esc(r.title)}</b>${r.meta ? `<span>${esc(r.meta)}</span>` : ''}</div>
      ${(r.cells || []).join('')}
      ${r.action ? DK.button({ label: r.action.label, size: 'sm', href: r.action.href, attrs: { 'aria-label': `${r.action.label} ${r.title}`, ...r.action.attrs } }) : ''}</li>`).join('')}</ul>` : DK.empty(o.empty || { icon: 'circle-check', title: 'Nothing assigned' });

  // Activity feed. { items: [{ initials, name, text, ref: { label, href, attrs }, date (ISO), when (shown) }], empty: { ... } }
  DK.activity = o => o.items.length ? `<ul class="dk-acts">${o.items.map(a => {
    const ref = a.ref ? (a.ref.href ? `<a class="dk-act-ref" href="${esc(a.ref.href)}"${attrs(a.ref.attrs)}>${esc(a.ref.label)}</a>` : `<button class="dk-act-ref" type="button"${attrs(a.ref.attrs)}>${esc(a.ref.label)}</button>`) : '';
    return `<li class="dk-act">${DK.avatar({ initials: a.initials, name: a.name, size: 'sm' })}<div class="dk-act-main"><p><b>${esc(a.name)}</b> ${esc(a.text)}</p>
      <span class="dk-act-meta">${ref}${ref && a.when ? '<span aria-hidden="true">·</span>' : ''}${a.when ? `<time${a.date ? ` datetime="${esc(a.date)}"` : ''}>${esc(a.when)}</time>` : ''}</span></div></li>`; }).join('')}</ul>` : DK.empty(o.empty || { icon: 'history', title: 'No activity yet' });

  /* ---------------------------------------------------------------- page and layout */
  // Page header: title, one visible line of description, the page's actions. { title, sub, actions (html) }
  DK.pageHeader = o => `<div class="dk-pagehead"><div><h1 tabindex="-1">${esc(o.title)}</h1>${o.sub ? `<p>${esc(o.sub)}</p>` : ''}</div>${o.actions ? `<div class="dk-pagehead-actions">${o.actions}</div>` : ''}</div>`;

  // Dashboard grid. { kpis: [metric options, ...], body (html: cards with a `span`) }
  // The grid follows the width of the page it sits in, so it adapts when a sidebar opens or closes.
  DK.dash = o => `<div class="dk-dash-wrap"><div class="dk-dash">${o.kpis?.length ? `<div class="dk-kpis">${o.kpis.map(DK.metric).join('')}</div>` : ''}${o.body || ''}</div></div>`;

  /* ---------------------------------------------------------------- shell */
  // Sidebar. { brand: { mark, name, meta }, groups: [{ label, items: [{ href, icon, label, count, current, attrs }] }], foot: [items] }
  const navItem = i => `<a class="dk-nav-item" href="${esc(i.href || '#')}"${i.current ? ' aria-current="page"' : ''}${attrs(i.attrs)}>${i.icon ? icon(i.icon) : ''}<span>${esc(i.label)}</span>${i.count ? `<span class="dk-nav-count">${esc(i.count)}</span>` : ''}</a>`;
  DK.sidebar = o => `<aside class="dk-sidebar" aria-label="Main navigation">
      <div class="dk-sidebar-brand"><span class="dk-brand-mark" aria-hidden="true">${esc(o.brand.mark)}</span><span class="dk-brand-name"><b>${esc(o.brand.name)}</b>${o.brand.meta ? `<span>${esc(o.brand.meta)}</span>` : ''}</span></div>
      <nav class="dk-nav">${o.groups.map(g => `${g.label ? `<div class="dk-nav-label">${esc(g.label)}</div>` : ''}${g.items.map(navItem).join('')}`).join('')}</nav>
      ${o.foot?.length ? `<div class="dk-nav-foot">${o.foot.map(navItem).join('')}</div>` : ''}</aside>`;

  // Top bar. { search: { placeholder, kbd }, right (html), user: { initials, name, title } }
  DK.topbar = (o = {}) => `<header class="dk-topbar"><button class="dk-iconbtn dk-menu-btn" type="button" aria-label="Open navigation" data-dk-menu>${icon('menu')}</button>
      ${o.search ? DK.search(o.search) : ''}
      <div class="dk-topbar-right">${o.right || ''}${o.user ? `<button class="dk-user" type="button" aria-label="Account menu">${DK.avatar({ initials: o.user.initials, name: o.user.name })}<span><b>${esc(o.user.name)}</b><small>${esc(o.user.title || '')}</small></span>${icon('chevron-down')}</button>` : ''}</div></header>`;

  // Whole frame. { sidebar (html), topbar (html), main (html) }
  DK.shell = o => `<div class="dk-shell">${o.sidebar || ''}<div class="dk-main">${o.topbar || ''}<main class="dk-page" id="main" tabindex="-1">${o.main || ''}</main></div></div>`;

  /* ---------------------------------------------------------------- behaviour */
  // Theme: 'light' | 'dark' | 'system'. Stored per browser; sets data-theme on <html>.
  const THEME_KEY = 'dk.theme';
  const resolve = pref => pref === 'dark' || pref === 'light' ? pref : (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  DK.theme = {
    get: () => { try { return localStorage.getItem(THEME_KEY) || 'system'; } catch (_) { return 'system'; } },
    current: () => document.documentElement.dataset.theme || 'light',
    set(pref) {
      try { localStorage.setItem(THEME_KEY, pref); } catch (_) { /* storage unavailable: the choice lasts for this page */ }
      document.documentElement.dataset.theme = resolve(pref);
      document.dispatchEvent(new CustomEvent('dk:theme', { detail: { theme: resolve(pref), pref } }));
    },
    toggle() { DK.theme.set(DK.theme.current() === 'dark' ? 'light' : 'dark'); },
    // Call once on a kit-only page. Follows the device while the preference is 'system'.
    init() {
      document.documentElement.dataset.theme = resolve(DK.theme.get());
      window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (DK.theme.get() === 'system') DK.theme.set('system'); });
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('click', e => {
      // Segmented control: one pressed button per group, announces the change.
      const seg = e.target.closest?.('.dk-seg button');
      if (seg) {
        const group = seg.closest('.dk-seg');
        if (seg.getAttribute('aria-pressed') === 'true') return;
        group.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === seg)));
        group.dispatchEvent(new CustomEvent('dk:change', { bubbles: true, detail: { value: seg.dataset.value } }));
        return;
      }
      // Mobile navigation drawer.
      const shell = document.querySelector('.dk-shell');
      if (!shell) return;
      if (e.target.closest?.('[data-dk-menu]')) shell.classList.toggle('dk-nav-open');
      else if (shell.classList.contains('dk-nav-open') && (!e.target.closest?.('.dk-sidebar') || e.target.closest?.('.dk-nav-item'))) shell.classList.remove('dk-nav-open');
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelector('.dk-shell.dk-nav-open')?.classList.remove('dk-nav-open'); });
  }
})();
