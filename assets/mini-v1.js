/* iQMS Mini V1 — document-management-first product shell.
 * Keeps the full prototype code underneath, but exposes only the approved V1 core:
 * controlled documents, technical review, approval, publication, team, ISO structure and settings.
 * This file owns the shell (appearance, navigation, terminology) and the New / Revise / Submit dialogs;
 * the Dashboard, Tasks and Team pages are in mini-workspace.js.
 */
(() => {
  'use strict';
  const { esc, icon } = Q;

  /* ---------- Appearance: Light / Dark / System ---------- */
  const APPEARANCE_KEY = 'iqms.mini.appearance';
  const appearancePref = () => {
    try { return localStorage.getItem(APPEARANCE_KEY) || 'system'; } catch (_) { return 'system'; }
  };
  const resolvedAppearance = pref => pref === 'dark' || pref === 'light'
    ? pref
    : (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  Q.appearance = appearancePref;
  Q.resolvedAppearance = () => resolvedAppearance(appearancePref());

  const applyDarkBrandTokens = () => {
    const mode = document.documentElement.dataset.colorMode;
    if (mode !== 'dark') return;
    const palette = Q.PALETTES?.[Q.S.settings?.branding?.palette] || Q.PALETTES?.forest;
    if (!palette) return;
    const st = document.documentElement.style;
    st.setProperty('--accent', `color-mix(in srgb, ${palette.accent} 62%, white 38%)`);
    st.setProperty('--accent-hover', `color-mix(in srgb, ${palette.accent} 52%, white 48%)`);
    st.setProperty('--accent-soft', `color-mix(in srgb, ${palette.accent} 22%, #151c19)`);
    st.setProperty('--sb-bg', `color-mix(in srgb, ${palette.sb} 56%, #08110D)`);
    st.setProperty('--sb-bg-2', `color-mix(in srgb, ${palette.sb2} 58%, #060D0A)`);
    st.setProperty('--org-mark', `color-mix(in srgb, ${palette.mark} 72%, white 28%)`);
  };

  const baseApplyBranding = Q.applyBranding;
  Q.applyBranding = () => {
    baseApplyBranding?.();
    // The untouched brand colours stay available for surfaces that remain light in the dark theme (the document preview).
    const palette = Q.PALETTES?.[Q.S.settings?.branding?.palette] || Q.PALETTES?.forest;
    if (palette) {
      const st = document.documentElement.style;
      st.setProperty('--brand-accent', palette.accent); st.setProperty('--brand-accent-hover', palette.hover); st.setProperty('--brand-accent-soft', palette.soft);
    }
    applyDarkBrandTokens();
  };

  const syncAppearanceButton = () => {
    const btn = document.getElementById('appearanceBtn');
    if (!btn) return;
    const dark = document.documentElement.dataset.colorMode === 'dark';
    btn.innerHTML = icon(dark ? 'sun' : 'moon');
    btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    btn.title = dark ? 'Light theme' : 'Dark theme';
    btn.setAttribute('aria-pressed', String(dark));
    Q.refreshIcons?.();
  };

  Q.setAppearance = (pref, { save = true, announce = true } = {}) => {
    const clean = ['light', 'dark', 'system'].includes(pref) ? pref : 'system';
    if (save) { try { localStorage.setItem(APPEARANCE_KEY, clean); } catch (_) {} }
    const mode = resolvedAppearance(clean);
    document.documentElement.dataset.colorMode = mode;
    document.documentElement.style.colorScheme = mode;
    document.documentElement.dataset.appearancePref = clean;
    Q.applyBranding?.();
    syncAppearanceButton();
    if (announce) Q.toast?.(`${mode === 'dark' ? 'Dark' : 'Light'} theme applied`, clean === 'system' ? 'Following your device appearance.' : 'Saved for this browser.');
  };

  const addAppearanceButton = () => {
    if (document.getElementById('appearanceBtn')) return;
    const right = document.querySelector('.topbar-right');
    const help = document.getElementById('helpBtn')?.closest('.pop-wrap');
    if (!right) return;
    const btn = document.createElement('button');
    btn.className = 'icon-btn appearance-btn';
    btn.id = 'appearanceBtn';
    btn.type = 'button';
    btn.addEventListener('click', () => Q.setAppearance(document.documentElement.dataset.colorMode === 'dark' ? 'light' : 'dark'));
    right.insertBefore(btn, help || right.firstChild);
    syncAppearanceButton();
  };

  Q.setAppearance(appearancePref(), { save: false, announce: false });
  addAppearanceButton();
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if (appearancePref() === 'system') Q.setAppearance('system', { save: false, announce: false });
  });

  const nav = document.getElementById('sbNav');
  const foot = document.getElementById('sbFoot');

  /* ---------- Navigation ----------
   * Dashboard · DOCUMENT CONTROL (Documents, Tasks) · ORGANIZATION (Team, ISO QMS Structure) · Settings.
   * Later-phase modules (audits, risks, KPIs, CAPA, management review) stay in the code base but are not linked. */
  const navItem = (href, key, iconName, label, extra = '') =>
    `<a class="sb-item" href="${href}" data-nav="${key}" title="${esc(label)}">${icon(iconName)}<span class="lbl">${esc(label)}</span>${extra}</a>`;
  const navLabel = text => `<div class="sb-label" role="presentation">${esc(text)}</div>`;

  Q.renderSidebar = () => {
    const S = Q.S;
    document.getElementById('orgName').textContent = S.organization.name;
    document.getElementById('orgMeta').textContent = 'Document Control';
    document.getElementById('orgMark').textContent = S.organization.initials;
    const me = Q.person(Q.me());
    document.getElementById('meName').textContent = me.name;
    document.getElementById('meTitle').textContent = me.title;
    document.getElementById('meAvatar').textContent = Q.initials(Q.me());

    const mine = Q.myTasks().length;
    nav.innerHTML =
      navItem('#/overview', 'overview', 'layout-dashboard', 'Dashboard') +
      navLabel('Document Control') +
      navItem('#/documents', 'documents', 'files', 'Documents') +
      navItem('#/tasks', 'tasks', 'list-checks', 'Tasks',
        mine ? `<span class="count" title="${mine} assigned to you">${mine}<span class="sr-only"> assigned to you</span></span>` : '') +
      navLabel('Organization') +
      navItem('#/team', 'team', 'users', 'Team') +
      navItem('#/qms/processes', 'qms-processes', 'workflow', 'ISO QMS Structure');
    foot.innerHTML = navItem('#/settings', 'settings', 'settings', 'Settings');
    Q.refreshIcons();
    Q.syncSidebar();
  };

  Q.syncSidebar = (name, parts) => {
    const r = Q.route();
    const n = name || r.parts[0] || 'overview';
    const key = { process: 'qms-processes', qms: 'qms-processes', setup: 'settings', review: 'tasks', profile: '' }[n] ?? n;
    document.querySelectorAll('#sbNav [data-nav], #sbFoot [data-nav]').forEach(a => {
      const on = a.dataset.nav === key;
      a.classList.toggle('active', on);
      on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    });
  };

  /* The labelled sidebar is the default on desktop (people can still unpin it to the icon rail). */
  if (Q.UI.pinned === undefined) Q.UI.pinned = true;

  /* The Document Controller runs Technical Review and publishes. Read from the people data, not hard-coded. */
  Q.docController = () => Object.keys(Q.S.people).find(id => /document control/i.test(Q.S.people[id].title) && Q.S.users.some(u => u.id === id && u.status === 'Active'))
    || Q.S.users.find(u => u.role === 'QMS Manager' && u.status === 'Active')?.id || Q.me();

  /* V1 terminology: technical review is the document controller's gate. */
  Q.wfStatus = w => w.changesRequested ? 'Changes Requested'
    : w.stage === 'review' ? 'Technical Review'
    : w.stage === 'approval' ? 'Approval'
    : 'Ready to Publish';
  Q.wfStageLabel = w => w.changesRequested ? 'Technical Review — changes requested'
    : ({ review: 'Technical Review', approval: 'Approval', publication: 'Ready to Publish' }[w.stage]);
  Q.docStatus = d => {
    const label = d.status === 'In Review' ? 'Technical Review'
      : d.status === 'Approval in Progress' ? 'Approval'
      : d.status === 'Approved' ? 'Ready to Publish'
      : d.status;
    const kind = {
      'Published': 'success',
      'Draft': 'neutral',
      'Technical Review': 'info',
      'Changes Requested': 'orange',
      'Approval': 'warning',
      'Ready to Publish': 'success outline'
    }[label];
    return Q.st(label, kind);
  };

  /* Documents and Tasks are separate destinations in the sidebar, so the library no longer needs page tabs. */
  Q.docTabs = () => '';

  /* Keep documents in Microsoft 365 for this V1 demo. Existing sample uploads are
   * presented as linked records at runtime; no sample binary is migrated or stored. */
  Q.S.documents.forEach(d => {
    if (d.source && d.source.mode === 'upload') {
      d.source = {
        ...d.source,
        mode: 'link',
        system: 'SharePoint',
        site: 'Client Microsoft 365',
        library: 'Controlled Documents',
        state: 'connected',
        url: d.source.url || ''
      };
    }
  });

  /* Dashboard, Tasks and Team are defined in mini-workspace.js.
   * #/review (the old work-queue list) now lives at #/tasks; #/review/<id> is still the review page. */
  Q.views.review = (parts, q) => {
    if (parts[0]) return Q.reviewPage(parts[0]);
    const show = { mine: 'mine', all: '' }[q.show] ?? '';
    location.replace('#/tasks?view=list' + (show ? `&show=${show}` : ''));
    return { title: 'Tasks', nav: 'tasks', html: '' };
  };

  /* New / Revise entry point. */
  Q.actions['connect-doc'] = () => {
    const m = Q.openModal({
      size: 'm',
      title: 'New / Revise Document',
      sub: 'Choose what you are doing. Both paths use the same controlled workflow.',
      body: `<div class="modal-body"><div class="v1-choice-grid">
        <button class="v1-choice" type="button" data-v1-new>${icon('file-plus')}<span><b>Create New Document</b><small>Create Rev 00 and register its Microsoft 365 link.</small></span>${icon('chevron-right')}</button>
        <button class="v1-choice" type="button" data-v1-revise>${icon('git-branch-plus')}<span><b>Revise Existing Document</b><small>Select a published controlled document and create its next revision.</small></span>${icon('chevron-right')}</button>
      </div><div class="callout" style="margin-top:16px">${icon('shield-check')}<span>The QMS stores document metadata, workflow history and the approved link. The actual file remains in the client's Microsoft 365 environment.</span></div></div>`,
      foot: `<button class="btn" type="button" data-close>Cancel</button>`
    });
    m.querySelector('[data-v1-new]').addEventListener('click', () => { Q.closeModal(); newDocumentModal(); });
    m.querySelector('[data-v1-revise]').addEventListener('click', () => { Q.closeModal(); chooseRevisionModal(); });
  };

  const types = ['Manual', 'Procedure', 'Work Instruction', 'Form', 'Checklist', 'Policy', 'Plan', 'Register', 'Standard', 'Record'];
  const codeFor = { Manual: 'MAN', Procedure: 'PRO', 'Work Instruction': 'WI', Form: 'FRM', Checklist: 'CHK', Policy: 'POL', Plan: 'PLN', Register: 'REG', Standard: 'STD', Record: 'REC' };

  function sourceFrom(form, process) {
    const v = Q.formValues(form);
    const raw = v.url.trim();
    let filename = raw.split('/').pop() || 'Linked document';
    try { filename = decodeURIComponent(filename.split('?')[0]); } catch (_) {}
    return {
      mode: 'link',
      system: v.system,
      site: 'Client Microsoft 365',
      library: 'Controlled Documents',
      folder: Q.plabel(Q.rootId(process)),
      file: filename,
      url: raw,
      state: 'connected',
      verified: Q.today()
    };
  }

  function nextDocId(process, type) {
    const same = Q.S.documents.filter(x => Q.rootId(x.process) === Q.rootId(process));
    const prefix = same[0]?.id.split('-')[0] || 'DOC';
    let n = same.length + 1;
    let id;
    do { id = `${prefix}-${codeFor[type] || 'DOC'}-${String(n++).padStart(3, '0')}`; } while (Q.doc(id));
    return id;
  }

  function validHttpUrl(value) {
    try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol); } catch (_) { return false; }
  }

  function newDocumentModal() {
    const m = Q.openModal({
      size: 'l',
      title: 'Create New Controlled Document',
      sub: 'Rev 00 · Save the document record first, then submit it for Technical Review.',
      body: `<form class="modal-body" id="v1NewDoc"><div class="form-grid">
        <label class="field full"><span>Document title <span class="req">*</span></span><input class="input" name="title" required autofocus></label>
        <label class="field"><span>Process / Area <span class="req">*</span></span><select class="select" name="process" required><option value="">Select…</option>${Q.processOptions('', { all: '' })}</select></label>
        <label class="field"><span>Document type <span class="req">*</span></span><select class="select" name="type" required><option value="">Select…</option>${types.map(t => `<option>${esc(t)}</option>`).join('')}</select></label>
        <label class="field"><span>Prepared by / Owner <span class="req">*</span></span><select class="select" name="owner" required>${Q.peopleOptions(Q.me())}</select></label>
        <label class="field"><span>Department / Unit <span class="req">*</span></span><select class="select" name="department" required>${Q.departments().map(x => `<option${x === Q.person(Q.me()).dept ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
        <label class="field"><span>Section</span><input class="input" name="section" placeholder="Optional"></label>
        <label class="field"><span>Document code</span><input class="input tnum" name="code" placeholder="Auto-generate if blank"></label>
        <label class="field"><span>Revision</span><input class="input tnum" value="Rev 00" readonly></label>
        <label class="field"><span>Source <span class="req">*</span></span><select class="select" name="system"><option>SharePoint</option><option>OneDrive</option><option>Other approved repository</option></select></label>
        <label class="field full"><span>Document link <span class="req">*</span></span><input class="input" type="url" name="url" required placeholder="https://..."><span class="help">The QMS stores this link and does not upload a copy of the file.</span></label>
        <label class="field full"><span>Description / purpose <span class="req">*</span></span><textarea class="textarea" name="description" required rows="3" placeholder="What this controlled document covers and who uses it."></textarea></label>
      </div></form>`,
      foot: `<button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="button" data-ok>Save Draft</button>`
    });
    m.querySelector('[data-ok]').addEventListener('click', () => {
      const form = m.querySelector('form');
      if (!Q.validate(form)) return;
      const v = Q.formValues(form);
      if (!validHttpUrl(v.url)) { Q.toast('Check document link', 'Enter a valid http or https link.'); form.querySelector('[name="url"]').focus(); return; }
      let id = v.code.trim().toUpperCase().replace(/\s+/g, '-');
      if (!id) id = nextDocId(v.process, v.type);
      if (Q.doc(id)) { Q.toast('Document code already exists', id); form.querySelector('[name="code"]').focus(); return; }

      const doc = {
        id, organization_id: Q.S.organization.organization_id, title: v.title.trim(), process: v.process, type: v.type,
        rev: null, workingRev: '00', status: 'Draft', owner: v.owner, preparedBy: v.owner,
        classification: 'Internal', department: v.department, section: v.section.trim(), updated: Q.today(),
        nextReview: null, effective: null, description: v.description.trim(), declared: { by: Q.me(), date: Q.today() },
        iso: null, refs: [], related: [], evidence: [], source: sourceFrom(form, v.process)
      };
      Q.S.documents.push(doc);
      Q.S.revisions[id] = [{
        rev: '00', summary: 'Initial controlled document.', author: v.owner, preparedBy: v.owner,
        date: Q.today(), reviewers: [], approval: '', published: null, state: 'Draft', source: { ...doc.source }
      }];
      Q.S.activity.unshift({ date: Q.today(), who: Q.me(), process: doc.process, text: `created draft ${doc.title} Rev 00`, ref: doc.id });
      Q.save(); Q.closeModal(); Q.renderSidebar(); Q.render({ noFocus: true });
      Q.toast('Draft created', `${id} Rev 00 is ready to submit for Technical Review.`);
    });
  }

  function chooseRevisionModal() {
    const eligible = Q.S.documents.filter(d => d.status === 'Published' && !d.workingRev).sort((a, b) => a.title.localeCompare(b.title));
    const m = Q.openModal({
      size: 'm',
      title: 'Revise Existing Document',
      sub: 'Select the controlled document that needs a new revision.',
      body: `<form class="modal-body"><label class="field"><span>Controlled document <span class="req">*</span></span><select class="select" name="doc" required><option value="">Select…</option>${eligible.map(d => `<option value="${esc(d.id)}">${esc(d.id)} · ${esc(d.title)} · Rev ${esc(d.rev)}</option>`).join('')}</select><span class="help">${eligible.length} published documents are available for revision.</span></label></form>`,
      foot: `<button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="button" data-ok>Continue</button>`
    });
    m.querySelector('[data-ok]').addEventListener('click', () => {
      const form = m.querySelector('form');
      if (!Q.validate(form)) return;
      const doc = Q.doc(Q.formValues(form).doc);
      Q.closeModal();
      revisionModal(doc);
    });
  }

  function revisionModal(doc) {
    const chk = Q.canCreateRevision(doc);
    if (!chk.ok) { Q.toast('Revision not created', chk.why); return; }
    const next = Q.nextRev(doc.rev);
    const m = Q.openModal({
      size: 'l',
      title: `Create Revision ${esc(next)}`,
      sub: `${esc(doc.id)} · ${esc(doc.title)} · active Rev ${esc(doc.rev)}`,
      body: `<form class="modal-body"><div class="callout" style="margin-bottom:16px">${icon('info')}<span>Rev ${esc(doc.rev)} remains the active controlled version until Rev ${esc(next)} is reviewed, approved and published.</span></div><div class="form-grid">
        <label class="field"><span>Prepared by <span class="req">*</span></span><select class="select" name="author" required>${Q.peopleOptions(doc.owner)}</select></label>
        <label class="field"><span>Reason for revision <span class="req">*</span></span><select class="select" name="reason" required><option value="">Select…</option><option>Periodic review</option><option>Process change</option><option>Corrective action</option><option>Audit finding</option><option>Regulatory change</option><option>Customer requirement</option><option>Other</option></select></label>
        <label class="field"><span>Source</span><select class="select" name="system"><option${doc.source.system === 'SharePoint' ? ' selected' : ''}>SharePoint</option><option${doc.source.system === 'OneDrive' ? ' selected' : ''}>OneDrive</option><option>Other approved repository</option></select></label>
        <label class="field full"><span>Updated document link <span class="req">*</span></span><input class="input" type="url" name="url" required value="${esc(doc.source.url || '')}" placeholder="https://..."><span class="help">Use the link to the revised working document in Microsoft 365.</span></label>
        <label class="field full"><span>Change summary <span class="req">*</span></span><textarea class="textarea" name="summary" required rows="4" placeholder="What changed and why?"></textarea></label>
      </div></form>`,
      foot: `<button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="button" data-ok>Create Rev ${esc(next)}</button>`
    });
    m.querySelector('[data-ok]').addEventListener('click', () => {
      const form = m.querySelector('form');
      if (!Q.validate(form)) return;
      const v = Q.formValues(form);
      if (!validHttpUrl(v.url)) { Q.toast('Check document link', 'Enter a valid http or https link.'); return; }
      const src = sourceFrom(form, doc.process);
      doc.workingRev = next;
      doc.status = 'Draft';
      doc.updated = Q.today();
      doc.pendingSource = { ...src };
      doc.source = { ...src };
      Q.S.revisions[doc.id].push({
        rev: next, summary: v.summary.trim(), reason: v.reason, author: v.author, preparedBy: v.author,
        date: Q.today(), reviewers: [], approval: '', published: null, state: 'Draft', source: { ...src }
      });
      Q.S.activity.unshift({ date: Q.today(), who: Q.me(), process: doc.process, text: `created Rev ${next} of ${doc.title}`, ref: doc.id });
      Q.save(); Q.closeModal(); Q.render({ noFocus: true }); Q.renderSidebar();
      Q.toast(`Rev ${next} created`, 'Submit it for Technical Review when the revision is ready.');
    });
  }

  /* Replace the legacy create-revision modal so every V1 revision uses a document link. */
  Q.actions['create-revision'] = d => revisionModal(Q.doc(d.id));

  /* Technical review handoff: ISO Coordinator / author -> Document Controller. */
  Q.actions['request-review'] = d => {
    const doc = Q.doc(d.id), chk = Q.canStartWorkflow(doc);
    if (!chk.ok) { Q.toast('Technical Review not started', chk.why); return; }
    const controller = Q.docController();
    const processOwner = Q.proc(Q.rootId(doc.process))?.owner;
    const defaultApprover = processOwner && processOwner !== controller ? processOwner : 'maria';
    const m = Q.openModal({
      size: 'm',
      title: 'Submit for Technical Review',
      sub: `${esc(doc.id)} · Rev ${esc(doc.workingRev)} · ${esc(doc.title)}`,
      body: `<form class="modal-body"><div class="callout" style="margin-bottom:16px">${icon('send')}<span>The revision will be handed to <b>${esc(Q.pname(controller))}</b> as Document Controller for technical review. After completion it moves to approval.</span></div><div class="form-grid">
        <label class="field"><span>Technical reviewer</span><input class="input" value="${esc(Q.pname(controller))} · ${esc(Q.person(controller).title)}" readonly></label>
        <label class="field"><span>Approver <span class="req">*</span></span><select class="select" name="approver" required>${Q.peopleOptions(defaultApprover)}</select></label>
        <label class="field"><span>Due date <span class="req">*</span></span><input class="input" type="date" name="due" required value="${Q.addDays(Q.today(), 10)}"></label>
        <label class="field full"><span>Submission note</span><textarea class="textarea" name="msg" placeholder="Optional context for Document Control"></textarea></label>
      </div></form>`,
      foot: `<button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="button" data-ok>Submit for Technical Review</button>`
    });
    m.querySelector('[data-ok]').addEventListener('click', () => {
      const form = m.querySelector('form');
      if (!Q.validate(form)) return;
      if (Q.wfForDoc(doc.id)) { Q.closeModal(); Q.toast('Workflow already active', 'Another user started a workflow for this revision.'); return; }
      const v = Q.formValues(form);
      const w = {
        id: Q.uid('WF'), doc: doc.id, rev: doc.workingRev, stage: 'review', startedBy: Q.me(),
        started: Q.today(), due: v.due, reviewers: [{ who: controller, state: 'Pending' }],
        approvers: [{ who: v.approver, state: 'Not started' }], publisher: controller,
        comments: v.msg ? [{ who: Q.me(), date: Q.today(), text: v.msg }] : []
      };
      Q.S.workflows.push(w);
      doc.status = 'In Review';
      Q.S.activity.unshift({ date: Q.today(), who: Q.me(), process: doc.process, text: `submitted ${doc.title} Rev ${doc.workingRev} for technical review`, ref: doc.id });
      Q.save(); Q.closeModal(); Q.renderSidebar(); Q.go('#/tasks');
      Q.toast('Submitted for Technical Review', `Assigned to ${Q.pname(controller)}. Approval will follow after technical review.`);
    });
  };

  /* No direct bypass from Draft -> Approval in V1. */
  Q.docSelectionActions = d => {
    const w = Q.wfForDoc(d.id), rev = Q.canCreateRevision(d), wfOk = Q.canStartWorkflow(d);
    return `<button class="btn sm primary" type="button" data-action="open-doc" data-id="${esc(d.id)}">${icon('file-text')}Open Document</button>
      ${w ? `<button class="btn sm" type="button" data-action="open-review" data-id="${esc(w.id)}">${icon('file-check')}Open Review</button>` : ''}
      <button class="btn sm" type="button" data-action="create-revision" data-id="${esc(d.id)}" ${rev.ok ? '' : 'disabled'} title="${esc(rev.why || '')}">Create Revision</button>
      <button class="btn sm" type="button" data-action="request-review" data-id="${esc(d.id)}" ${wfOk.ok ? '' : 'disabled'} title="${esc(wfOk.why || '')}">Submit for Technical Review</button>`;
  };

  Q.docMenu = d => {
    const w = Q.wfForDoc(d.id), rev = Q.canCreateRevision(d), wfOk = Q.canStartWorkflow(d);
    return Q.menu(`Actions for ${d.id} ${d.title}`, [
      { label: 'Open Document', icon: 'file-text', data: { action: 'open-doc', id: d.id } },
      ...(w ? [{ label: 'Open Review', icon: 'file-check', data: { action: 'open-review', id: w.id } }] : []),
      '-',
      { label: 'Create Revision', icon: 'git-branch-plus', data: { action: 'create-revision', id: d.id }, disabled: !rev.ok, title: rev.why },
      { label: 'Submit for Technical Review', icon: 'send', data: { action: 'request-review', id: d.id }, disabled: !wfOk.ok, title: wfOk.why },
      '-',
      { label: Q.openLabel(d), icon: 'external-link', data: { action: 'open-source', id: d.id }, disabled: d.source.state !== 'connected' }
    ], { align: 'min-width:250px' });
  };

  Q.actions['open-source'] = d => {
    const doc = Q.doc(d.id);
    if (doc?.source?.url) window.open(doc.source.url, '_blank', 'noopener,noreferrer');
    else Q.toast(`Open in ${doc?.source?.system || 'Microsoft 365'}`, 'This sample record does not contain a live external URL.');
  };

  /* Appearance preference is per browser/user, unlike organization branding. */
  if (Q.settingsViews?.branding) {
    const baseBrandingView = Q.settingsViews.branding;
    Q.settingsViews.branding = () => {
      const view = baseBrandingView();
      const pref = appearancePref();
      const choices = [
        ['light', 'sun', 'Light', 'Bright surfaces for daytime use.'],
        ['dark', 'moon', 'Dark', 'Low-glare dark surfaces while document previews stay paper-white.'],
        ['system', 'monitor', 'System', 'Follow this device’s light or dark preference.']
      ];
      view.html += `<section class="panel section" id="appearanceSettings">
        <div class="panel-head"><div><h3>Appearance</h3><span class="muted small">Personal display preference for this browser</span></div></div>
        <div class="panel-pad"><div class="appearance-grid" role="radiogroup" aria-label="Appearance">
          ${choices.map(([value, ic, label, hint]) => `<label class="appearance-opt"><input type="radio" name="appearance" value="${value}" ${pref === value ? 'checked' : ''}><span class="appearance-icon">${icon(ic)}</span><span><b>${label}</b><small>${hint}</small></span></label>`).join('')}
        </div><p class="help" style="margin-top:10px">This does not change the organization’s brand palette or the controlled-document content.</p></div>
      </section>`;
      const after = view.after;
      view.after = main => {
        after?.(main);
        main.querySelectorAll('[name="appearance"]').forEach(r => r.addEventListener('change', () => {
          Q.setAppearance(r.value);
          main.querySelectorAll('[name="appearance"]').forEach(x => x.checked = x.value === r.value);
        }));
      };
      return view;
    };
  }

  /* Settings → UI Components documents the prototype's `ui-` kit. Point to the dashboard kit from there. */
  if (Q.settingsViews?.['ui-library']) {
    const baseLibrary = Q.settingsViews['ui-library'];
    Q.settingsViews['ui-library'] = q => {
      const view = baseLibrary(q);
      view.html = `<div class="callout" style="margin-bottom:16px">${icon('blocks')}<span><b>Dashboard Kit</b>The Dashboard is built from its own kit of tokens and components. <a href="kit/" target="_blank" rel="noopener">Open the kit reference</a> to see each one with the code to use it.</span></div>` + view.html;
      return view;
    };
  }

  /* ---------- Top bar scope ----------
   * Global search and notifications only cover what V1 exposes: documents, processes and people. */
  Q.searchScope = list => list.filter(r => ['Processes', 'Documents'].includes(r.g)).concat(
    Q.S.users.filter(u => u.status !== 'Deactivated' && Q.S.people[u.id]).map(u => {
      const p = Q.S.people[u.id];
      return { g: 'Team', icon: 'user-round', t: p.name, m: `${p.title} · ${p.dept}`, go: () => Q.go(`#/tasks?who=${u.id}`), s: `${p.name} ${p.title} ${p.dept} ${p.email || ''}` };
    }));
  Q.searchCovers = 'Search covers controlled documents, processes and people.';
  Q.notifScope = n => /^(wf-|od-)/.test(n.id);

  const search = document.getElementById('searchInput');
  if (search) search.placeholder = 'Search documents, processes, people…';
  document.title = 'Document Control · iQMS';
})();