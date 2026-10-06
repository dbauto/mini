/* iQMS Mini V1 — Dashboard (#/overview).
 *
 * One source of truth. Every number on the page is derived from the application state:
 *   Q.S.documents, Q.S.workflows, Q.S.revisions, Q.S.activity, Q.S.people.
 * Q.tasks() turns that state into one record per revision in progress. The KPI cards, the workflow
 * chart, Needs Attention and My Work all read Q.tasks(), and each one links to the matching filter of
 * the existing Documents in Review queue (#/review?show=…), so the dashboard and the queue cannot disagree.
 *
 * Components extend the existing kit (Q.ui, `ui-` classes in app.css) instead of starting a second one:
 *   reused ...... UI.card, UI.list / UI.row, UI.info, .btn, .avatar
 *   added here .. UI.pageHeader, UI.metric, UI.stage, UI.due2, UI.emptyState, UI.activity,
 *                 UI.columns, UI.gauge, UI.meter
 */
(() => {
  'use strict';
  const { esc, icon } = Q, UI = Q.ui;

  /* =========================================================================================
   * Lifecycle model
   * ========================================================================================= */
  // The operational stages, in lifecycle order. Published documents are not work in progress:
  // they live in the Document Library.
  Q.STAGES = [
    { key: 'draft', label: 'Draft', hint: 'Being prepared by the author', role: 'Author', icon: 'pencil' },
    { key: 'review', label: 'Technical Review', hint: 'With Document Control', role: 'Technical Reviewer', icon: 'search-check' },
    { key: 'changes', label: 'Changes Requested', hint: 'Returned to the author', role: 'Author', icon: 'reply' },
    { key: 'approval', label: 'Approval', hint: 'Awaiting authorization', role: 'Approver', icon: 'stamp' },
    { key: 'publish', label: 'Ready to Publish', hint: 'Approved, not yet effective', role: 'Publisher', icon: 'send' }
  ];
  const STAGE = Object.fromEntries(Q.STAGES.map(s => [s.key, s]));
  Q.wfStageKey = w => w.changesRequested ? 'changes' : w.stage === 'review' ? 'review' : w.stage === 'approval' ? 'approval' : 'publish';

  const DUE_SOON_DAYS = 7;
  const dueState = due => !due ? 'none' : due < Q.today() ? 'overdue' : Q.days(Q.today(), due) <= DUE_SOON_DAYS ? 'soon' : 'ok';
  const byUrgency = (a, b) => (a.due || '9999').localeCompare(b.due || '9999') || a.d.title.localeCompare(b.d.title);

  /* One record per revision in progress.
   *   draft ....... a working revision that has not been submitted (no workflow yet); assignee = its author
   *   everything else comes from the workflow: stage, assignees (Q.wfAssignees), due date, comments */
  Q.tasks = () => {
    const me = Q.me(), out = [];
    Q.S.documents.forEach(d => {
      if (!d.workingRev || Q.wfForDoc(d.id)) return;
      const rev = (Q.S.revisions[d.id] || []).find(r => r.rev === d.workingRev);
      out.push({ id: `draft-${d.id}`, kind: 'draft', stage: 'draft', d, w: null, rev: d.workingRev, assignees: [rev?.author || d.owner], due: null, comments: 0 });
    });
    Q.S.workflows.forEach(w => {
      const d = Q.doc(w.doc);
      if (d) out.push({ id: w.id, kind: 'workflow', stage: Q.wfStageKey(w), d, w, rev: w.rev, assignees: Q.wfAssignees(w), due: w.due, comments: w.comments.length });
    });
    return out.map(t => ({ ...t, state: dueState(t.due), mine: t.assignees.includes(me), role: STAGE[t.stage].role })).sort(byUrgency);
  };
  // Where each stage is listed: the existing queue's tabs (#/review?show=…) and, for drafts, the library's Draft view.
  const QUEUE = { draft: '#/documents?status=draft', review: '#/review?show=tech', changes: '#/review?show=changes', approval: '#/review?show=approval', publish: '#/review?show=publish' };
  // Where a task opens: the existing review page for a workflow, the existing document viewer for a draft.
  const openAttrs = t => t.w ? `href="#/review/${esc(t.w.id)}"` : `href="#/documents" data-action="open-doc" data-id="${esc(t.d.id)}"`;

  /* =========================================================================================
   * Kit extensions used by the dashboard
   * ========================================================================================= */
  const shortDate = d => Q.S.settings?.regional?.dateFormat && Q.S.settings.regional.dateFormat !== 'd MMM yyyy' ? Q.fmt(d) : Q.fmt(d).replace(/ \d{4}$/, '');
  const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;

  // PageHeader: title, a visible one-line description, and the page's actions (one primary at most).
  UI.pageHeader = ({ title, sub = '', actions = '' }) =>
    `<div class="page-head"><div><h1 tabindex="-1">${esc(title)}</h1>${sub ? `<p class="page-sub">${esc(sub)}</p>` : ''}</div>${actions ? `<div class="actions">${actions}</div>` : ''}</div>`;

  // Avatar: initials only, the person's name is always next to it or in the title.
  UI.avatar = (id, cls = '') => `<span class="avatar${cls ? ' ' + cls : ''}" title="${esc(Q.pname(id))}" aria-hidden="true">${esc(Q.initials(id))}</span>`;

  // StatusBadge for a lifecycle stage: a dot in the stage colour plus the name, so colour is never the only cue.
  UI.stage = key => `<span class="ui-stage" data-stage="${esc(key)}"><i aria-hidden="true"></i>${esc(key === 'published' ? 'Published' : STAGE[key]?.label || key)}</span>`;

  // Due date with its state spelled out. Overdue is the only red on these pages.
  UI.due2 = t => {
    if (!t.due) return '<span class="ui-due none">No due date</span>';
    if (t.state === 'overdue') return `<span class="ui-due overdue">${icon('clock-alert')}Overdue · ${shortDate(t.due)}</span>`;
    if (t.state === 'soon') return `<span class="ui-due soon">${icon('clock')}${Q.days(Q.today(), t.due) === 0 ? 'Due today' : `Due ${shortDate(t.due)}`}</span>`;
    return `<span class="ui-due">Due ${shortDate(t.due)}</span>`;
  };

  // MetricCard: label, one number, one short note. `feature` marks the single emphasised card.
  UI.metric = o => `<a class="ui-stat ui-metric${o.feature ? ' feature' : ''}" href="${esc(o.href)}" aria-label="${esc(`${o.label}: ${o.value}. ${o.note || ''}`)}">
      <span class="ui-stat-head"><span class="ui-stat-label">${esc(o.label)}</span><span class="ui-metric-go" aria-hidden="true">${icon('arrow-up-right')}</span></span>
      <span class="ui-stat-body"><span class="ui-stat-value tnum">${esc(String(o.value))}</span></span>
      <span class="ui-stat-foot">${o.flag ? `<span class="ui-metric-flag">${icon('clock-alert')}${esc(o.flag)}</span>` : `<span class="ui-stat-note">${esc(o.note || '')}</span>`}</span></a>`;

  // EmptyState: an icon, one line of what is (not) here and, optionally, the next step.
  UI.emptyState = ({ icon: ic = 'inbox', title, text = '', action = '' }) =>
    `<div class="ui-emptystate">${icon(ic)}<b>${esc(title)}</b>${text ? `<span>${esc(text)}</span>` : ''}${action}</div>`;

  // Thin meter: value against a limit on a same-hue track.
  UI.meter = (pct, tone = '') => `<span class="ui-meter${tone ? ' ' + tone : ''}" aria-hidden="true"><i style="--v:${Math.max(0, Math.min(100, pct))}%"></i></span>`;

  // Column chart with one clickable column per item: { label, value, href, stage }.
  UI.columns = (items, label) => {
    const max = Math.max(1, ...items.map(i => i.value));
    return `<ol class="ui-cols" aria-label="${esc(label)}">${items.map(i => `<li><a class="ui-col" href="${esc(i.href)}" title="${esc(`${i.label}: ${plural(i.value, 'document')}`)}">
        <span class="ui-col-plot"><span class="ui-col-v tnum">${i.value}</span><span class="ui-col-bar" data-stage="${esc(i.stage)}" style="--h:${(i.value / max * 100).toFixed(1)}%"></span></span>
        <span class="ui-col-l">${esc(i.label)}<span class="sr-only">: ${plural(i.value, 'document')}</span></span></a></li>`).join('')}</ol>`;
  };

  // Half-ring gauge for one ratio. The number is the message; the arc is context.
  UI.gauge = (pct, { label, tone = 'neutral', state = '' }) => {
    const v = pct == null ? 0 : Math.max(0, Math.min(100, pct)), r = 70, len = Math.PI * r;
    return `<div class="ui-gauge" role="img" aria-label="${esc(label)}: ${pct == null ? 'not enough data' : v + ' percent'}${state ? ', ' + esc(state) : ''}">
      <svg viewBox="0 0 160 88" aria-hidden="true"><path class="trk" d="M10 80a70 70 0 0 1 140 0"/>${v ? `<path class="val ${tone}" d="M10 80a70 70 0 0 1 140 0" stroke-dasharray="${(len * v / 100).toFixed(1)} ${len.toFixed(1)}"/>` : ''}</svg>
      <span class="ui-gauge-c"><b class="tnum">${pct == null ? '—' : v + '%'}</b>${state ? `<span class="ui-gauge-state ${tone}">${esc(state)}</span>` : ''}</span></div>`;
  };

  // ActivityItem: who did what to which document, and when.
  const relDate = d => { const n = Q.days(d, Q.today()); return n === 0 ? 'Today' : n === 1 ? 'Yesterday' : Q.fmt(d); };
  UI.activity = a => `<li class="ui-act">${UI.avatar(a.who, 'sm')}<div class="ui-act-main"><p><b>${esc(Q.pname(a.who))}</b> ${esc(a.text)}</p>
      <span class="ui-act-meta"><button class="link-btn tnum" type="button" data-action="open-doc" data-id="${esc(a.ref)}" aria-label="Open ${esc(a.ref)}">${esc(a.ref)}</button><span aria-hidden="true">·</span><time datetime="${esc(a.date)}">${esc(relDate(a.date))}</time></span></div></li>`;

  /* =========================================================================================
   * CSV export of the work in progress
   * ========================================================================================= */
  const exportTasks = (list, name = 'document-tasks') => {
    const cell = v => /[",\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
    const rows = [['Document', 'Code', 'Revision', 'Process / Area', 'Stage', 'Waiting on', 'Role', 'Due', 'Status', 'Comments'],
      ...list.map(t => [t.d.title, t.d.id, `Rev ${t.rev}`, Q.plabel(t.d.process), STAGE[t.stage].label, t.assignees.map(Q.pname).join('; '), t.role, t.due || '', { overdue: 'Overdue', soon: 'Due soon', ok: 'On track', none: 'No due date' }[t.state], t.comments])];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = `${name}-${Q.today()}.csv`;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    Q.toast('Export ready', `${plural(list.length, 'revision')} in progress · ${a.download}`);
  };
  Q.actions['export-tasks'] = () => exportTasks(Q.tasks(), 'document-control-status');

  /* =========================================================================================
   * Dashboard
   * ========================================================================================= */
  /* Document Control Health: an operational indicator for this workspace, NOT an ISO certification
   * or compliance score. It is the plain average of four checks that can be counted from the data. */
  const HEALTH_NOTE = 'Average of four operational checks counted from this workspace: periodic reviews on time, tasks within their due date, source links available and required document details filled in. It is an internal indicator, not an ISO certification or a compliance score.';
  Q.docControlHealth = (tasks = Q.tasks()) => {
    const docs = Q.S.documents;
    const reviewable = docs.filter(d => d.rev && d.nextReview && !['Obsolete', 'Superseded'].includes(d.status));
    const dated = tasks.filter(t => t.due);
    const REQUIRED = ['title', 'type', 'process', 'owner', 'description', 'classification'];
    const factors = [
      { label: 'Periodic reviews on time', ok: reviewable.filter(d => !Q.docOverdue(d)).length, of: reviewable.length },
      { label: 'Tasks within due date', ok: dated.filter(t => t.state !== 'overdue').length, of: dated.length },
      { label: 'Source links available', ok: docs.filter(d => d.source?.state === 'connected').length, of: docs.length },
      { label: 'Document details complete', ok: docs.filter(d => REQUIRED.every(k => String(d[k] ?? '').trim())).length, of: docs.length }
    ].map(f => ({ ...f, pct: f.of ? Math.round(f.ok / f.of * 100) : null }));
    const scored = factors.filter(f => f.pct != null);
    const pct = scored.length ? Math.round(scored.reduce((s, f) => s + f.pct, 0) / scored.length) : null;
    const tone = pct == null ? 'neutral' : pct >= 85 ? 'success' : pct >= 70 ? 'warning' : 'danger';
    return { pct, tone, state: { success: 'On track', warning: 'Needs attention', danger: 'At risk', neutral: 'Not enough data' }[tone], factors };
  };

  Q.views.overview = () => {
    const docs = Q.S.documents, tasks = Q.tasks();
    const stage = k => tasks.filter(t => t.stage === k);
    const published = docs.filter(d => !d.workingRev && d.status === 'Published').length;
    const overdueIn = k => stage(k).filter(t => t.state === 'overdue').length;
    const flag = k => overdueIn(k) ? `${overdueIn(k)} overdue` : '';

    /* ---- KPI cards ---- */
    const metrics = [
      { label: 'Controlled documents', value: docs.length, note: `${published} published · ${tasks.length} in progress`, href: '#/documents', feature: true },
      { label: 'Technical Review', value: stage('review').length, note: 'Awaiting technical review', flag: flag('review'), href: QUEUE.review },
      { label: 'Awaiting Approval', value: stage('approval').length, note: 'Pending approval', flag: flag('approval'), href: QUEUE.approval },
      { label: 'Ready to Publish', value: stage('publish').length, note: 'Approved revisions', flag: flag('publish'), href: QUEUE.publish }
    ];

    /* ---- Document Workflow: revisions in progress per stage, plus the published share ---- */
    const pubPct = docs.length ? Math.round(published / docs.length * 100) : 0;
    const workflow = UI.card({
      title: 'Document Workflow', cls: 'dash-wf', link: { href: '#/review?show=all', text: 'Open queue' },
      info: 'Each document is counted once, by the stage of its current revision. Columns show revisions in progress; the bar below shows documents whose published revision has no change in progress.',
      body: `<p class="dash-lead"><b class="tnum">${tasks.length}</b> ${tasks.length === 1 ? 'revision' : 'revisions'} in progress</p>
        ${UI.columns(Q.STAGES.map(s => ({ label: s.label, value: stage(s.key).length, href: QUEUE[s.key], stage: s.key })), 'Revisions in progress by lifecycle stage')}
        <a class="dash-pub" href="#/documents?status=published" title="Open published documents">
          ${UI.stage('published')}${UI.meter(pubPct)}<span class="dash-pub-v tnum"><b>${published}</b> of ${docs.length}</span></a>`
    });

    /* ---- Needs Attention: only rows with something to do, most urgent first ---- */
    const overdue = tasks.filter(t => t.state === 'overdue'), soon = tasks.filter(t => t.state === 'soon');
    const periodic = docs.filter(Q.docOverdue).sort((a, b) => a.nextReview.localeCompare(b.nextReview));
    const attention = [
      overdue.length && { tone: 'danger', icon: 'clock-alert', href: '#/review?show=all&due=overdue', n: overdue.length,
        title: `${plural(overdue.length, 'task')} past ${overdue.length === 1 ? 'its' : 'their'} due date`, meta: `Oldest was due ${Q.fmt(overdue[0].due)}` },
      periodic.length && { tone: 'danger', icon: 'calendar-clock', href: '#/documents?status=overdue', n: periodic.length,
        title: `${plural(periodic.length, 'document')} overdue for periodic review`, meta: `Oldest was due ${Q.fmt(periodic[0].nextReview)}` },
      soon.length && { tone: 'warning', icon: 'clock', href: '#/review?show=all&due=soon', n: soon.length,
        title: `${plural(soon.length, 'task')} due within ${DUE_SOON_DAYS} days`, meta: `Next: ${soon[0].d.title}` },
      stage('changes').length && { tone: 'warning', icon: 'reply', href: QUEUE.changes, n: stage('changes').length,
        title: `${plural(stage('changes').length, 'revision')} waiting on ${stage('changes').length === 1 ? 'its author' : 'authors'}`, meta: 'Changes requested during review' },
      stage('publish').length && { icon: 'send', href: QUEUE.publish, n: stage('publish').length,
        title: `${plural(stage('publish').length, 'approved revision')} ready to publish`, meta: 'Not effective until published' },
      stage('draft').length && { icon: 'pencil', href: QUEUE.draft, n: stage('draft').length,
        title: `${plural(stage('draft').length, 'draft')} not yet submitted`, meta: 'Submit for Technical Review when ready' }
    ].filter(Boolean).slice(0, 5);
    const needs = UI.card({
      title: 'Needs Attention', cls: 'dash-attn', count: attention.length || null, flush: true,
      body: UI.list(attention.map(a => ({ href: a.href, icon: a.icon, tone: a.tone, title: a.title, meta: a.meta })), { empty: 'Nothing needs attention right now.' })
    });

    /* ---- Document Control Health ---- */
    const h = Q.docControlHealth(tasks);
    const health = UI.card({
      title: 'Document Control Health', cls: 'dash-health', info: HEALTH_NOTE,
      body: `${UI.gauge(h.pct, { label: 'Document Control Health', tone: h.tone, state: h.state })}
        <ul class="dash-factors">${h.factors.map(f => `<li><span class="dash-factor-l">${esc(f.label)}</span><span class="dash-factor-v tnum">${f.of ? `${f.ok} of ${f.of}` : '—'}</span>${UI.meter(f.pct ?? 0, f.pct == null ? '' : f.pct >= 85 ? '' : f.pct >= 70 ? 'warning' : 'danger')}</li>`).join('')}</ul>`
    });

    /* ---- My Work ----
     * Everything waiting on the signed-in user: queue items where they have the next action, plus their own
     * unsubmitted drafts (drafts are not in the queue, so this card is where a new draft shows up). */
    const mine = tasks.filter(t => t.mine), MAX_WORK = 8, hidden = mine.slice(MAX_WORK), hiddenDrafts = hidden.filter(t => t.stage === 'draft').length;
    const myWork = UI.card({
      title: 'My Work', cls: 'dash-work', count: mine.length || null, flush: true, link: mine.length ? { href: '#/review?show=mine', text: 'Open queue' } : null,
      body: mine.length ? `<ul class="ui-worklist">${mine.slice(0, MAX_WORK).map(t => `<li class="ui-work">
          <div class="ui-work-main"><b title="${esc(t.d.title)}">${esc(t.d.title)}</b><span class="tnum">${esc(t.d.id)} · Rev ${esc(t.rev)} · ${esc(t.role)}</span></div>
          ${UI.stage(t.stage)}${UI.due2(t)}
          <a class="btn sm" ${openAttrs(t)} aria-label="Open ${esc(t.d.title)}">Open</a></li>`).join('')}</ul>${hidden.length ? `<p class="ui-work-more">${hidden.length} more: <a href="#/review?show=mine">open the queue</a>${hiddenDrafts ? ` · <a href="${QUEUE.draft}">${plural(hiddenDrafts, 'draft')}</a>` : ''}</p>` : ''}`
        : UI.emptyState({ icon: 'circle-check', title: 'No document actions are assigned to you', text: 'Reviews, approvals and drafts that need you appear here.' })
    });

    /* ---- Recent Activity ---- */
    const recent = Q.S.activity.filter(a => a.ref && Q.doc(a.ref)).slice(0, 5);
    const activity = UI.card({
      title: 'Recent Activity', cls: 'dash-activity',
      body: recent.length ? `<ul class="ui-acts">${recent.map(UI.activity).join('')}</ul>` : UI.emptyState({ icon: 'history', title: 'No document activity yet' })
    });

    const html = UI.pageHeader({
      title: 'Dashboard', sub: 'Document control activity and items requiring attention.',
      actions: `<button class="btn" type="button" data-action="export-tasks" title="Download the revisions in progress as a CSV file">${icon('download')}Export</button>
        <button class="btn primary" type="button" data-action="connect-doc">${icon('file-plus')}New / Revise Document</button>`
    }) + `<div class="dash-wrap"><div class="dash">
        <div class="dash-kpis">${metrics.map(UI.metric).join('')}</div>
        ${workflow}${needs}${health}${myWork}${activity}
      </div></div>`;
    return { title: 'Dashboard', nav: 'overview', html };
  };
})();
