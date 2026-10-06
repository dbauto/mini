/* iQMS Mini V1 — workspace pages: Dashboard, Tasks (Board / List) and Team.
 *
 * One source of truth. Every number on these pages is derived from the application state:
 *   Q.S.documents, Q.S.workflows, Q.S.revisions, Q.S.activity, Q.S.people, Q.S.users, Q.S.roles, Q.S.processes.
 * Q.tasks() turns that state into one record per revision in progress; the Dashboard counts, the Tasks
 * board, the Tasks list, the Team workload and the sidebar badge all read Q.tasks(), so they cannot disagree.
 *
 * Components extend the existing kit (Q.ui, `ui-` classes in app.css) instead of starting a second one:
 *   reused ...... UI.card (Panel), UI.badge, UI.info, UI.list / UI.row, Q.seg, Q.table, .btn, .avatar, .empty
 *   added here .. UI.pageHeader, UI.metric, UI.stage, UI.avatars, UI.due2, UI.emptyState, UI.activity,
 *                 UI.columns, UI.gauge, UI.meter, UI.taskCard, UI.memberCard
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
  Q.myTasks = () => Q.tasks().filter(t => t.mine);
  // Where a task opens: the existing review page for a workflow, the existing document viewer for a draft.
  const openAttrs = t => t.w ? `href="#/review/${esc(t.w.id)}"` : `href="#/documents" data-action="open-doc" data-id="${esc(t.d.id)}"`;

  /* =========================================================================================
   * Kit extensions
   * ========================================================================================= */
  const shortDate = d => Q.S.settings?.regional?.dateFormat && Q.S.settings.regional.dateFormat !== 'd MMM yyyy' ? Q.fmt(d) : Q.fmt(d).replace(/ \d{4}$/, '');
  const shortName = id => { const [first, ...rest] = Q.pname(id).split(' '); return rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first; };
  const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;

  // PageHeader: title, a visible one-line description, and the page's actions (one primary at most).
  UI.pageHeader = ({ title, sub = '', actions = '' }) =>
    `<div class="page-head"><div><h1 tabindex="-1">${esc(title)}</h1>${sub ? `<p class="page-sub">${esc(sub)}</p>` : ''}</div>${actions ? `<div class="actions">${actions}</div>` : ''}</div>`;

  // Avatar(s): initials only, the person's name is always next to it or in the title.
  UI.avatar = (id, cls = '') => `<span class="avatar${cls ? ' ' + cls : ''}" title="${esc(Q.pname(id))}" aria-hidden="true">${esc(Q.initials(id))}</span>`;
  UI.avatars = (ids, max = 2) => `<span class="ui-avatars">${ids.slice(0, max).map(id => UI.avatar(id, 'sm')).join('')}${ids.length > max ? `<span class="avatar sm more" aria-hidden="true">+${ids.length - max}</span>` : ''}</span>`;

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

  // TaskCard (board): title, code + revision, process, who has the next action, due state, comment count.
  UI.taskCard = t => {
    const who = t.assignees.map(Q.pname).join(', ') || 'nobody';
    return `<a class="ui-task${t.mine ? ' mine' : ''}" ${openAttrs(t)} aria-label="${esc(`${t.d.title}, ${t.d.id} revision ${t.rev}, ${STAGE[t.stage].label}, ${t.due ? (t.state === 'overdue' ? 'overdue since ' : 'due ') + Q.fmt(t.due) : 'no due date'}, waiting on ${who}`)}">
      <span class="ui-task-title">${esc(t.d.title)}</span>
      <span class="ui-task-code tnum"><span>${esc(t.d.id)} · Rev ${esc(t.rev)}</span>${t.comments ? `<span class="ui-task-cm" title="${plural(t.comments, 'comment')}">${icon('message-square')}${t.comments}</span>` : ''}</span>
      <span class="ui-task-proc">${esc(Q.plabel(t.d.process))}</span>
      <span class="ui-task-foot"><span class="ui-task-who">${UI.avatars(t.assignees)}<span>${t.mine ? 'You' : esc(t.assignees[0] ? shortName(t.assignees[0]) : 'Unassigned')}</span></span>${UI.due2(t)}</span></a>`;
  };

  /* =========================================================================================
   * Shared: CSV export of the work in progress
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
      { label: 'Technical Review', value: stage('review').length, note: 'Awaiting technical review', flag: flag('review'), href: '#/tasks?stage=review' },
      { label: 'Awaiting Approval', value: stage('approval').length, note: 'Pending approval', flag: flag('approval'), href: '#/tasks?stage=approval' },
      { label: 'Ready to Publish', value: stage('publish').length, note: 'Approved revisions', flag: flag('publish'), href: '#/tasks?stage=publish' }
    ];

    /* ---- Document Workflow: revisions in progress per stage, plus the published share ---- */
    const pubPct = docs.length ? Math.round(published / docs.length * 100) : 0;
    const workflow = UI.card({
      title: 'Document Workflow', cls: 'dash-wf', link: { href: '#/tasks', text: 'Open Tasks' },
      info: 'Each document is counted once, by the stage of its current revision. Columns show revisions in progress; the bar below shows documents whose published revision has no change in progress.',
      body: `<p class="dash-lead"><b class="tnum">${tasks.length}</b> ${tasks.length === 1 ? 'revision' : 'revisions'} in progress</p>
        ${UI.columns(Q.STAGES.map(s => ({ label: s.label, value: stage(s.key).length, href: `#/tasks?stage=${s.key}`, stage: s.key })), 'Revisions in progress by lifecycle stage')}
        <a class="dash-pub" href="#/documents?status=published" title="Open published documents">
          ${UI.stage('published')}${UI.meter(pubPct)}<span class="dash-pub-v tnum"><b>${published}</b> of ${docs.length}</span></a>`
    });

    /* ---- Needs Attention: only rows with something to do, most urgent first ---- */
    const overdue = tasks.filter(t => t.state === 'overdue'), soon = tasks.filter(t => t.state === 'soon');
    const periodic = docs.filter(Q.docOverdue).sort((a, b) => a.nextReview.localeCompare(b.nextReview));
    const attention = [
      overdue.length && { tone: 'danger', icon: 'clock-alert', href: '#/tasks?show=overdue', n: overdue.length,
        title: `${plural(overdue.length, 'task')} past ${overdue.length === 1 ? 'its' : 'their'} due date`, meta: `Oldest was due ${Q.fmt(overdue[0].due)}` },
      periodic.length && { tone: 'danger', icon: 'calendar-clock', href: '#/documents?status=overdue', n: periodic.length,
        title: `${plural(periodic.length, 'document')} overdue for periodic review`, meta: `Oldest was due ${Q.fmt(periodic[0].nextReview)}` },
      soon.length && { tone: 'warning', icon: 'clock', href: '#/tasks?show=soon', n: soon.length,
        title: `${plural(soon.length, 'task')} due within ${DUE_SOON_DAYS} days`, meta: `Next: ${soon[0].d.title}` },
      stage('changes').length && { tone: 'warning', icon: 'reply', href: '#/tasks?stage=changes', n: stage('changes').length,
        title: `${plural(stage('changes').length, 'revision')} waiting on ${stage('changes').length === 1 ? 'its author' : 'authors'}`, meta: 'Changes requested during review' },
      stage('publish').length && { icon: 'send', href: '#/tasks?stage=publish', n: stage('publish').length,
        title: `${plural(stage('publish').length, 'approved revision')} ready to publish`, meta: 'Not effective until published' },
      stage('draft').length && { icon: 'pencil', href: '#/tasks?stage=draft', n: stage('draft').length,
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

    /* ---- My Work ---- */
    const mine = tasks.filter(t => t.mine);
    const myWork = UI.card({
      title: 'My Work', cls: 'dash-work', count: mine.length || null, flush: true, link: mine.length ? { href: '#/tasks?show=mine', text: 'View all' } : null,
      body: mine.length ? `<ul class="ui-worklist">${mine.slice(0, 5).map(t => `<li class="ui-work">
          <div class="ui-work-main"><b title="${esc(t.d.title)}">${esc(t.d.title)}</b><span class="tnum">${esc(t.d.id)} · Rev ${esc(t.rev)} · ${esc(t.role)}</span></div>
          ${UI.stage(t.stage)}${UI.due2(t)}
          <a class="btn sm" ${openAttrs(t)} aria-label="Open ${esc(t.d.title)}">Open</a></li>`).join('')}</ul>`
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

  /* =========================================================================================
   * Tasks — Board and List are two renderings of the same Q.tasks() records
   * ========================================================================================= */
  const SHOW = { all: () => true, mine: t => t.mine, soon: t => t.state === 'soon', overdue: t => t.state === 'overdue' };
  // "Documents in Review" keeps its QMS meaning as a filter: revisions with a reviewer or approver.
  const STAGE_GROUPS = { 'in-review': ['review', 'changes', 'approval'] };
  const stageKeys = v => STAGE_GROUPS[v] || (STAGE[v] ? [v] : Q.STAGES.map(s => s.key));
  const tasksHash = f => { const p = new URLSearchParams(); Object.entries(f).forEach(([k, v]) => { if (v && v !== 'all') p.set(k, v); }); const s = p.toString(); return '#/tasks' + (s ? '?' + s : ''); };
  let refocus = null;   // which filter control had focus before a re-render

  Q.views.tasks = (_, q) => {
    const all = Q.tasks();
    const f = {
      show: SHOW[q.show] ? q.show : 'all',
      process: Q.proc(q.process) ? q.process : 'all',
      who: Q.S.people[q.who] ? q.who : 'all',
      stage: STAGE[q.stage] || STAGE_GROUPS[q.stage] ? q.stage : 'all'
    };
    const view = ['board', 'list'].includes(q.view) ? q.view : Q.UI.tasksView === 'list' ? 'list' : 'board';
    const scoped = all.filter(t => Q.inProc(t.d.process, f.process) && (f.who === 'all' || t.assignees.includes(f.who)) && stageKeys(f.stage).includes(t.stage));
    const list = scoped.filter(SHOW[f.show]);
    const filtered = Object.values(f).some(v => v !== 'all');

    const people = [...new Set([...all.flatMap(t => t.assignees), ...(f.who !== 'all' ? [f.who] : [])])].sort((a, b) => Q.pname(a).localeCompare(Q.pname(b)));
    const bar = `<div class="ui-filterbar" role="search" aria-label="Filter tasks">
        ${Q.seg('Show', [['all', 'All', scoped.length], ['mine', 'My Tasks', scoped.filter(SHOW.mine).length], ['soon', 'Due Soon', scoped.filter(SHOW.soon).length], ['overdue', 'Overdue', scoped.filter(SHOW.overdue).length]], f.show)}
        <select class="select" data-f="process" aria-label="Process">${Q.processOptions(f.process)}</select>
        <select class="select" data-f="who" aria-label="Assignee"><option value="all">All assignees</option>${people.map(id => `<option value="${esc(id)}"${id === f.who ? ' selected' : ''}>${esc(Q.pname(id))}${id === Q.me() ? ' (you)' : ''}</option>`).join('')}</select>
        <select class="select" data-f="stage" aria-label="Stage"><option value="all">All stages</option><option value="in-review"${f.stage === 'in-review' ? ' selected' : ''}>Documents in Review</option>${Q.STAGES.map(s => `<option value="${s.key}"${s.key === f.stage ? ' selected' : ''}>${esc(s.label)}</option>`).join('')}</select>
        ${filtered ? `<a class="btn sm ghost" href="#/tasks">Clear filters</a>` : ''}
        <span class="ui-filterbar-sp"></span>
        ${view === 'list' ? `<button class="btn" type="button" data-export-list>${icon('download')}Export</button>` : ''}
        <div class="seg ui-viewtoggle" role="group" aria-label="View">
          <button type="button" data-view="board" aria-pressed="${view === 'board'}">${icon('kanban')}Board</button>
          <button type="button" data-view="list" aria-pressed="${view === 'list'}">${icon('rows-3')}List</button></div>
      </div>`;

    const emptyAll = UI.emptyState(filtered
      ? { icon: 'search-x', title: 'No tasks match these filters', text: 'Try another tab or clear the filters.', action: '<a class="btn sm" href="#/tasks">Clear filters</a>' }
      : { icon: 'circle-check', title: 'No revisions are in progress', text: 'Create or revise a document to start the controlled workflow.' });

    /* ---- Board ---- */
    const board = () => `<p class="v1-queue-note">${icon('lock')}Controlled workflow: a revision changes stage only through its review, approval and publish actions. Open a card to act on it.</p>
      <div class="ui-kanban-scroll" role="region" aria-label="Task board" tabindex="0"><div class="ui-kanban">${Q.STAGES.filter(s => stageKeys(f.stage).includes(s.key)).map(s => {
        const cards = list.filter(t => t.stage === s.key);
        return `<section class="ui-kcol" aria-labelledby="kc-${s.key}">
          <header><h2 class="ui-stage" data-stage="${s.key}" id="kc-${s.key}"><i aria-hidden="true"></i>${esc(s.label)}</h2><span class="ui-count tnum" aria-label="${plural(cards.length, 'task')}">${cards.length}</span></header>
          <p class="ui-kcol-hint">${esc(s.hint)}</p>
          ${cards.length ? `<ul class="ui-kcol-list">${cards.map(t => `<li>${UI.taskCard(t)}</li>`).join('')}</ul>` : `<p class="ui-kcol-empty">${filtered ? 'No matching tasks' : 'Nothing at this stage'}</p>`}
        </section>`; }).join('')}</div></div>`;

    /* ---- List: the operational table, same records ---- */
    const table = () => Q.table({
      id: 'tasks', rows: () => list, key: r => r.id, selectable: true, tight: true, noun: 'document tasks', caption: 'Documents in Review and other revisions in progress', rowLabel: r => r.d.title,
      board: { icon: r => ({ icon: STAGE[r.stage].icon, tone: r.state === 'overdue' ? 'danger' : r.state === 'soon' ? 'warning' : '' }) },
      columns: [
        { key: 'doc', label: 'Document', min: '230px', sort: r => r.d.title, render: r => `<span class="title">${esc(r.d.title)}</span><span class="sub tnum">${esc(r.d.id)} · Rev ${esc(r.rev)}</span>` },
        { key: 'process', label: 'Process / Area', sort: r => Q.proc(r.d.process)?.process_code, render: r => Q.pcell(r.d.process) },
        { key: 'stage', label: 'Stage', sort: r => Q.STAGES.findIndex(s => s.key === r.stage), render: r => UI.stage(r.stage) },
        { key: 'who', label: 'Waiting on', sort: r => Q.pname(r.assignees[0]), exportText: r => r.assignees.map(Q.pname).join('; '),
          render: r => r.assignees.map(x => `<span class="user-cell">${UI.avatar(x, 'sm')}<span class="nowrap">${Q.who(x)}</span></span>`).join('') + `<span class="sub">${esc(r.role)}</span>` },
        { key: 'due', label: 'Due', cls: 'c-date', sort: r => r.due || '9999', exportText: r => r.due || '', render: r => UI.due2(r) },
        { key: 'act', label: '', cls: 'c-actions', render: r => `<a class="btn sm" ${openAttrs(r)} aria-label="Open ${esc(r.d.title)}">Open</a>` }
      ],
      empty: emptyAll,
      selectionBar: keys => { const t = list.find(x => x.id === keys[0]); return keys.length === 1 && t ? `${t.w ? `<button class="btn sm" type="button" data-action="open-review" data-id="${esc(t.w.id)}">Open Review</button>` : ''}<button class="btn sm" type="button" data-action="open-doc" data-id="${esc(t.d.id)}">Open Document</button>` : ''; }
    });

    const html = UI.pageHeader({
      title: 'Tasks', sub: 'Document-control work assigned across the current lifecycle.',
      actions: `<button class="btn primary" type="button" data-action="connect-doc">${icon('file-plus')}New / Revise Document</button>`
    }) + bar + `<div class="tasks-body" data-view="${view}">${view === 'board' ? (list.length || !filtered ? board() : emptyAll) : table()}</div>`;

    const after = main => {
      const go = next => { history.replaceState(null, '', tasksHash(next)); Q.render({ noFocus: true }); };
      const barEl = main.querySelector('.ui-filterbar');
      barEl.querySelectorAll('[data-seg]').forEach(b => b.addEventListener('click', () => { refocus = `[data-seg="${b.dataset.seg}"]`; go({ ...f, show: b.dataset.seg }); }));
      barEl.querySelectorAll('[data-f]').forEach(s => s.addEventListener('change', () => { refocus = `[data-f="${s.dataset.f}"]`; go({ ...f, [s.dataset.f]: s.value }); }));
      barEl.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { Q.UI.tasksView = b.dataset.view; Q.saveUI(); refocus = `[data-view="${b.dataset.view}"]`; go(f); }));
      barEl.querySelector('[data-export-list]')?.addEventListener('click', () => exportTasks(list));
      if (refocus) {
        // Runs before selects are enhanced; wait a frame so focus lands on the visible control.
        const sel = refocus; refocus = null;
        requestAnimationFrame(() => { const el = main.querySelector(`.ui-filterbar ${sel}`); (el?._combo?.btn || el)?.focus({ preventScroll: true }); });
      }
    };
    return { title: 'Tasks', nav: 'tasks', html, after };
  };

  /* =========================================================================================
   * Team — the people who prepare, review, approve and control documents (not an HR directory)
   * ========================================================================================= */
  /* Document-control roles are read from what the system already knows; nothing is stored separately:
   *   ISO Coordinator ...... access role "QMS Manager"
   *   Document Controller .. the technical-review controller (Q.docController)
   *   Process Owner ........ owns an active process
   *   Reviewer ............. access role "Reviewer", or a reviewer on a workflow in progress
   *   Approver ............. access role allows approval, or an approver on a workflow in progress
   *   Administrator ........ access role "Administrator"                                              */
  const DC_ROLES = [
    { key: 'controller', label: 'Document Controller', tab: 'Document Control' },
    { key: 'coordinator', label: 'ISO Coordinator', tab: 'Coordinators' },
    { key: 'admin', label: 'Administrator' },
    { key: 'owner', label: 'Process Owner', tab: 'Process Owners' },
    { key: 'approver', label: 'Approver', tab: 'Approvers' },
    { key: 'reviewer', label: 'Reviewer', tab: 'Reviewers' }
  ];
  const TEAM_TABS = ['coordinator', 'controller', 'reviewer', 'approver', 'owner'];
  Q.dcRoles = u => {
    const id = u.id, perms = Q.S.roles[u.role]?.perms || [], wfs = Q.S.workflows;
    const has = {
      controller: id === Q.docController(),
      coordinator: u.role === 'QMS Manager',
      admin: u.role === 'Administrator',
      owner: Q.S.processes.some(p => p.owner === id && p.status === 'active'),
      approver: perms.includes('approve') || wfs.some(w => w.approvers.some(a => a.who === id)),
      reviewer: u.role === 'Reviewer' || wfs.some(w => w.reviewers.some(r => r.who === id))
    };
    return DC_ROLES.filter(r => has[r.key]);
  };

  // TeamCard: who they are, what they do in document control, how much is on them, and two actions.
  UI.memberCard = (m, canManage) => {
    const p = m.p, [primary, ...also] = m.roles;
    const stat = (n, label, cls = '') => `<div class="ui-member-stat${cls && n ? ' ' + cls : ''}"><b class="tnum">${n}</b><span>${label}</span></div>`;
    return `<article class="ui-member" aria-labelledby="tm-${esc(m.id)}">
      <header>${UI.avatar(m.id, 'lg')}${m.status === 'Invited' ? UI.badge('Invited', 'neutral', { title: 'Invitation sent, not yet signed in' }) : ''}</header>
      <h2 id="tm-${esc(m.id)}" title="${esc(p.name)}">${esc(p.name)}${m.id === Q.me() ? ' <span class="muted">(you)</span>' : ''}</h2>
      <p class="ui-member-role${primary && ['controller', 'coordinator'].includes(primary.key) ? ' key' : ''}">${esc(primary ? primary.label : m.role)}</p>
      <p class="ui-member-meta"><span title="${esc(p.title)}">${esc(p.title)}</span><span title="${esc(p.dept)}">${esc(p.dept)}</span></p>
      <p class="ui-member-also"${also.length ? ` aria-label="Also ${esc(also.map(r => r.label).join(', '))}"` : ''}>${also.slice(0, 2).map(r => `<span class="ui-badge neutral">${esc(r.label)}</span>`).join('')}${also.length > 2 ? `<span class="ui-badge neutral" title="${esc(also.slice(2).map(r => r.label).join(', '))}">+${also.length - 2}</span>` : ''}</p>
      <div class="ui-member-stats" role="group" aria-label="Workload">${stat(m.active, 'Active tasks')}${stat(m.soon, 'Due soon', 'warn')}${stat(m.overdue, 'Overdue', 'bad')}</div>
      <footer><a class="btn sm" href="#/tasks?who=${esc(m.id)}" aria-label="View work assigned to ${esc(p.name)}">View Work</a>${canManage ? `<button class="btn sm" type="button" data-action="edit-access" data-id="${esc(m.id)}" aria-label="Access for ${esc(p.name)}">Access</button>` : ''}</footer>
    </article>`;
  };

  Q.views.team = (_, q) => {
    const tasks = Q.tasks();
    const canManage = !!Q.teamScope?.().org;
    const members = Q.S.users.filter(u => u.status !== 'Deactivated' && Q.S.people[u.id]).map(u => {
      const roles = Q.dcRoles(u), mine = tasks.filter(t => t.assignees.includes(u.id));
      return { ...u, p: Q.person(u.id), roles, active: mine.length, soon: mine.filter(t => t.state === 'soon').length, overdue: mine.filter(t => t.state === 'overdue').length,
        rank: roles.length ? DC_ROLES.findIndex(r => r.key === roles[0].key) : DC_ROLES.length };
    }).sort((a, b) => a.rank - b.rank || a.p.name.localeCompare(b.p.name));

    const role = TEAM_TABS.includes(q.role) ? q.role : 'all';
    const depts = [...new Set(members.map(m => m.p.dept).filter(Boolean))].sort();
    const dept = depts.includes(q.dept) ? q.dept : 'all';
    const inDept = members.filter(m => dept === 'all' || m.p.dept === dept);
    const hasRole = (m, k) => m.roles.some(r => r.key === k);
    const shown = inDept.filter(m => role === 'all' || hasRole(m, role));
    const hash = (r, d) => { const p = new URLSearchParams(); if (r !== 'all') p.set('role', r); if (d !== 'all') p.set('dept', d); const s = p.toString(); return '#/team' + (s ? '?' + s : ''); };

    const bar = `<div class="ui-filterbar" role="search" aria-label="Filter team">
        ${Q.seg('Role', [['all', 'Everyone', inDept.length], ...TEAM_TABS.map(k => [k, DC_ROLES.find(r => r.key === k).tab, inDept.filter(m => hasRole(m, k)).length])], role)}
        <select class="select" data-f="dept" aria-label="Department"><option value="all">All departments</option>${depts.map(d => `<option${d === dept ? ' selected' : ''}>${esc(d)}</option>`).join('')}</select>
        <span class="ui-filterbar-sp"></span><span class="ui-filterbar-note tnum">${shown.length} of ${members.length} people</span>
      </div>`;

    const html = UI.pageHeader({
      title: 'Team', sub: 'People responsible for preparing, reviewing, approving and controlling documents.',
      actions: canManage ? `<a class="btn primary" href="#/settings/users">${icon('key-round')}Manage Access</a>` : ''
    }) + bar + (shown.length
      ? `<div class="ui-members">${shown.map(m => UI.memberCard(m, canManage)).join('')}</div>`
      : UI.emptyState({ icon: 'users', title: 'Nobody matches these filters', text: 'Choose another role or department.', action: '<a class="btn sm" href="#/team">Show everyone</a>' }));

    const after = main => {
      const go = (r, d) => { history.replaceState(null, '', hash(r, d)); Q.render({ noFocus: true }); };
      main.querySelectorAll('.ui-filterbar [data-seg]').forEach(b => b.addEventListener('click', () => { refocus = `[data-seg="${b.dataset.seg}"]`; go(b.dataset.seg, dept); }));
      main.querySelector('[data-f="dept"]').addEventListener('change', e => { refocus = '[data-f="dept"]'; go(role, e.target.value); });
      if (refocus) { const sel = refocus; refocus = null; requestAnimationFrame(() => { const el = main.querySelector(`.ui-filterbar ${sel}`); (el?._combo?.btn || el)?.focus({ preventScroll: true }); }); }
    };
    return { title: 'Team', nav: 'team', html, after };
  };
})();
