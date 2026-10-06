/* iQMS Mini V1 — document-management-first product shell.
 * Keeps the full prototype code underneath, but exposes only the approved V1 core:
 * controlled documents, technical review, approval, publication, ISO structure and settings.
 */
(() => {
  'use strict';
  const { esc, icon } = Q;
  const nav = document.getElementById('sbNav');
  const foot = document.getElementById('sbFoot');

  const v1Item = (href, key, iconName, label, extra = '') =>
    `<a class="sb-item" href="${href}" data-nav="${key}" title="${esc(label)}">${icon(iconName)}<span class="lbl">${esc(label)}</span>${extra}</a>`;

  Q.renderSidebar = () => {
    const S = Q.S;
    document.getElementById('orgName').textContent = S.organization.name;
    document.getElementById('orgMeta').textContent = 'Document Control · ISO QMS';
    document.getElementById('orgMark').textContent = S.organization.initials;
    const me = Q.person(Q.me());
    document.getElementById('meName').textContent = me.name;
    document.getElementById('meTitle').textContent = me.title;
    document.getElementById('meAvatar').textContent = Q.initials(Q.me());

    const mine = Q.myWorkflows().length;
    nav.innerHTML =
      `<div class="v1-nav-label">Core module · V1</div>` +
      v1Item('#/overview', 'overview', 'layout-dashboard', 'Overview') +
      v1Item('#/documents', 'documents', 'files', 'Document Control') +
      v1Item('#/review', 'review', 'file-check-2', 'Documents in Review',
        mine ? `<span class="count" title="${mine} awaiting your action">${mine}</span>` : '') +
      v1Item('#/qms/processes', 'qms-processes', 'workflow', 'ISO QMS Structure');
    foot.innerHTML = v1Item('#/settings', 'settings', 'settings', 'Settings');
    Q.refreshIcons();
    Q.syncSidebar();
  };

  Q.syncSidebar = (name, parts) => {
    const r = Q.route();
    const n = name || r.name;
    const p = parts || r.parts || [];
    let key = n;
    if (n === 'process') key = 'qms-processes';
    if (n === 'qms') key = p[1] === 'processes' ? 'qms-processes' : 'qms-processes';
    if (n === 'setup') key = 'settings';
    document.querySelectorAll('#sbNav [data-nav], #sbFoot [data-nav]').forEach(a => {
      const on = a.dataset.nav === key;
      a.classList.toggle('active', on);
      on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    });
  };

  /* V1 terminology: technical review is the document controller's gate. */
  Q.wfStatus = w => w.changesRequested ? 'Changes Requested'
    : w.stage === 'review' ? 'Technical Review'
    : w.stage === 'approval' ? 'Approval in Progress'
    : 'Ready to Publish';
  Q.wfStageLabel = w => w.changesRequested ? 'Technical Review — changes requested'
    : ({ review: 'Technical Review', approval: 'Approval', publication: 'Ready to Publish' }[w.stage]);
  Q.docStatus = d => {
    const label = d.status === 'In Review' ? 'Technical Review'
      : d.status === 'Approved' ? 'Ready to Publish'
      : d.status;
    const kind = {
      'Published': 'success',
      'Draft': 'neutral',
      'Technical Review': 'info',
      'Changes Requested': 'orange',
      'Approval in Progress': 'warning',
      'Ready to Publish': 'success outline'
    }[label];
    return Q.st(label, kind);
  };

  Q.docTabs = cur => {
    const mine = Q.myWorkflows().length;
    return `<div class="tabs page-tabs" role="tablist" aria-label="Document control">
      <a role="tab" href="${Q.UI.docsView && Q.UI.docsView.startsWith('#/documents') ? Q.UI.docsView : '#/documents'}" aria-selected="${cur === 'library'}">${icon('library')}Document Library<span class="muted small tnum">${Q.S.documents.length}</span></a>
      <a role="tab" href="#/review" aria-selected="${cur === 'routing'}">${icon('file-check-2')}Documents in Review<span class="muted small tnum">${Q.S.workflows.length}</span>${mine ? `<span class="tab-note">${mine} for you</span>` : ''}</a>
    </div>`;
  };

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

  const currentUserWork = () => Q.S.workflows.filter(w => Q.wfAssignees(w).includes(Q.me()));
  const docActivity = () => Q.S.activity.filter(a => a.ref && Q.doc(a.ref)).slice(0, 7);
  const workflowStep = w => w.changesRequested ? 'Changes Requested'
    : w.stage === 'review' ? 'Technical Review'
    : w.stage === 'approval' ? 'Approval'
    : 'Ready to Publish';

  Q.views.overview = () => {
    const docs = Q.S.documents;
    const workflows = Q.S.workflows;
    const published = docs.filter(d => d.status === 'Published').length;
    const technical = workflows.filter(w => w.stage === 'review' && !w.changesRequested).length;
    const changes = workflows.filter(w => w.changesRequested).length;
    const approval = workflows.filter(w => w.stage === 'approval').length;
    const publish = workflows.filter(w => w.stage === 'publication').length;
    const overdue = docs.filter(Q.docOverdue).length;
    const mine = currentUserWork();

    const stats = [
      ['Published documents', published, 'circle-check', 'Controlled and active'],
      ['Technical review', technical, 'search-check', 'With Document Control'],
      ['Changes requested', changes, 'message-square-warning', 'Waiting for revision'],
      ['Approval', approval, 'stamp', 'Awaiting authorization'],
      ['Ready to publish', publish, 'send', 'Approved revisions'],
      ['Review overdue', overdue, 'calendar-clock', 'Periodic review required']
    ];

    const workRows = mine.length ? mine.map(w => {
      const d = Q.doc(w.doc);
      return `<button class="v1-work-row" type="button" data-go-review="${esc(w.id)}">
        <span class="v1-work-icon">${icon(w.stage === 'review' ? 'search-check' : w.stage === 'approval' ? 'stamp' : 'send')}</span>
        <span class="v1-work-main"><b>${esc(d?.title || w.doc)}</b><span>${esc(d?.id || w.doc)} · Rev ${esc(w.rev)} · ${esc(workflowStep(w))}</span></span>
        <span class="v1-work-due">Due ${Q.fmt(w.due)}</span>${icon('chevron-right')}
      </button>`;
    }).join('') : '<div class="v1-empty">No document actions are currently assigned to you.</div>';

    const recent = docActivity().length ? docActivity().map(a => `<div class="v1-activity-row">
      <span class="avatar sm">${esc(Q.initials(a.who))}</span>
      <span><b>${esc(Q.pname(a.who))}</b> ${esc(a.text)}<small>${Q.fmt(a.date)}</small></span>
    </div>`).join('') : '<div class="v1-empty">No recent document activity.</div>';

    const html = Q.pageHead({
      title: 'Document Control Overview',
      sub: 'V1 focuses on controlled documents first. Client-specific QMS modules are added only after their functions and UI are approved.',
      actions: `<button class="btn primary" type="button" data-action="connect-doc">${icon('file-plus-2')}New / Revise Document</button>`
    }) + `
      <div class="v1-phase-banner">
        <div><span class="v1-kicker">APPROVED CORE SCOPE</span><h2>Document Management + ISO QMS foundation</h2>
        <p>Create or revise controlled documents, link them to Microsoft 365, route them through technical review and approval, then publish with a complete revision trail.</p></div>
        <div class="v1-scope-chips"><span>Document library</span><span>Revision control</span><span>Technical review</span><span>Approval</span><span>Publication</span><span>Audit trail</span></div>
      </div>
      <div class="v1-stats">${stats.map(([label, value, ic, hint]) => `<div class="v1-stat"><span class="v1-stat-icon">${icon(ic)}</span><div><b class="tnum">${value}</b><span>${esc(label)}</span><small>${esc(hint)}</small></div></div>`).join('')}</div>
      <div class="v1-grid">
        <section class="panel v1-panel"><div class="panel-head"><div><h2>Needs your action</h2><p>Current document-control work queue</p></div><a class="btn sm" href="#/review">Open queue</a></div><div class="v1-list">${workRows}</div></section>
        <section class="panel v1-panel"><div class="panel-head"><div><h2>Document lifecycle</h2><p>One controlled route per revision</p></div></div>
          <div class="v1-flow">
            <div><span>1</span><b>Draft</b><small>Create new or revise existing</small></div>
            ${icon('chevron-right')}
            <div><span>2</span><b>Technical Review</b><small>Document Controller checks content</small></div>
            ${icon('chevron-right')}
            <div><span>3</span><b>Approval</b><small>Authorized approver signs off</small></div>
            ${icon('chevron-right')}
            <div><span>4</span><b>Publish</b><small>Revision becomes controlled</small></div>
          </div>
          <div class="v1-rule">${icon('lock')}The current published revision remains effective until the approved revision is published.</div>
        </section>
        <section class="panel v1-panel"><div class="panel-head"><div><h2>Recent document activity</h2><p>Traceable changes in the core module</p></div></div><div class="v1-activity">${recent}</div></section>
        <section class="panel v1-panel"><div class="panel-head"><div><h2>ISO QMS structure</h2><p>Documents remain connected to the processes and clauses they support.</p></div><a class="btn sm" href="#/qms/processes">View structure</a></div>
          <div class="v1-iso-summary"><div><b>${Q.topProcesses().length}</b><span>Top-level processes</span></div><div><b>${docs.filter(d => Q.docIso(d).length).length}</b><span>Documents mapped to ISO clauses</span></div><div><b>${docs.length}</b><span>Controlled document records</span></div></div>
        </section>
      </div>`;

    return {
      title: 'Document Control Overview',
      nav: 'overview',
      html,
      after: main => main.querySelectorAll('[data-go-review]').forEach(b => b.addEventListener('click', () => Q.go('#/review/' + b.dataset.goReview)))
    };
  };

  /* V1 work queue with explicit business states instead of a generic "Routing" list. */
  const v1ReviewTable = (seg = 'mine') => {
    const rows = () => Q.S.workflows.map(w => ({ ...w, d: Q.doc(w.doc) })).filter(r => r.d);
    const all = rows();
    const segs = {
      mine: r => Q.wfAssignees(r).includes(Q.me()),
      tech: r => r.stage === 'review' && !r.changesRequested,
      changes: r => !!r.changesRequested,
      approval: r => r.stage === 'approval',
      publish: r => r.stage === 'publication',
      all: () => true
    };
    const tools = Q.seg('Work queue', [
      ['mine', 'My action', all.filter(segs.mine).length],
      ['tech', 'Technical review', all.filter(segs.tech).length],
      ['changes', 'Changes requested', all.filter(segs.changes).length],
      ['approval', 'Approval', all.filter(segs.approval).length],
      ['publish', 'Ready to publish', all.filter(segs.publish).length],
      ['all', 'All', all.length]
    ], seg) + `<select class="select" data-filter="process" aria-label="Process">${Q.processOptions()}</select>`;

    return Q.table({
      id: 'v1-wf',
      rows,
      key: r => r.id,
      selectable: true,
      tight: true,
      noun: 'document workflows',
      caption: 'Documents in Review',
      rowLabel: r => r.d.title,
      tools,
      segDefault: seg,
      segs,
      filters: { process: (r, v) => Q.inProc(r.d.process, v) },
      columns: [
        { key: 'doc', label: 'Document', min: '220px', sort: r => r.d.title, render: r => `<span class="title">${esc(r.d.title)}</span><span class="sub tnum">${esc(r.d.id)} · Rev ${esc(r.rev)}</span>` },
        { key: 'process', label: 'Process', sort: r => Q.proc(r.d.process)?.process_code, render: r => Q.pcell(r.d.process) },
        { key: 'stage', label: 'Current step', sort: r => workflowStep(r), render: r => Q.st(workflowStep(r), r.changesRequested ? 'orange' : r.stage === 'review' ? 'info' : r.stage === 'approval' ? 'warning' : 'success outline') },
        { key: 'who', label: 'Waiting on', render: r => Q.wfAssignees(r).map(x => `<span class="nowrap">${Q.who(x)}</span>`).join('<br>') || '—' },
        { key: 'due', label: 'Due', cls: 'c-date', sort: r => r.due, render: r => Q.dueDate(r.due) },
        { key: 'act', label: '', cls: 'c-actions', render: r => `<button class="btn sm ${Q.wfAssignees(r).includes(Q.me()) ? 'primary' : ''}" type="button" data-action="open-review" data-id="${esc(r.id)}">Open Review</button>` }
      ],
      empty: '<h3>No documents in this queue</h3><p>Items appear here after a draft is submitted for technical review.</p>',
      selectionBar: keys => keys.length === 1 ? `<button class="btn sm primary" type="button" data-action="open-review" data-id="${keys[0]}">Open Review</button><button class="btn sm" type="button" data-action="open-doc" data-id="${esc(Q.wf(keys[0]).doc)}">Open Document</button>` : ''
    });
  };

  Q.views.review = (parts, q) => {
    if (parts[0]) return Q.reviewPage(parts[0]);
    return {
      title: 'Documents in Review',
      nav: 'review',
      html: Q.pageHead({
        crumbs: [['Document Control', '#/documents'], ['Documents in Review']],
        title: 'Documents in Review',
        sub: 'Operational work queue for Technical Review → Approval → Publish.',
        actions: `<button class="btn primary" type="button" data-action="connect-doc">${icon('file-plus-2')}New / Revise Document</button>`
      }) + Q.docTabs('routing') + `<div class="v1-queue-note">${icon('info')}A second workflow cannot start while a revision is already in review or approval.</div>` + v1ReviewTable(q.show || (currentUserWork().length ? 'mine' : 'all'))
    };
  };

  /* New / Revise entry point. */
  Q.actions['connect-doc'] = () => {
    const m = Q.openModal({
      size: 'm',
      title: 'New / Revise Document',
      sub: 'Choose what you are doing. Both paths use the same controlled workflow.',
      body: `<div class="modal-body"><div class="v1-choice-grid">
        <button class="v1-choice" type="button" data-v1-new>${icon('file-plus-2')}<span><b>Create New Document</b><small>Create Rev 00 and register its Microsoft 365 link.</small></span>${icon('chevron-right')}</button>
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
    const controller = Q.S.people?.nina ? 'nina' : (Object.keys(Q.S.people || {}).find(id => /document control/i.test(Q.person(id).title)) || Q.me());
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
      Q.save(); Q.closeModal(); Q.renderSidebar(); Q.go('#/review');
      Q.toast('Submitted for Technical Review', `Assigned to ${Q.pname(controller)}. Approval will follow after technical review.`);
    });
  };

  /* No direct bypass from Draft -> Approval in V1. */
  Q.docSelectionActions = d => {
    const w = Q.wfForDoc(d.id), rev = Q.canCreateRevision(d), wfOk = Q.canStartWorkflow(d);
    return `<button class="btn sm primary" type="button" data-action="open-doc" data-id="${esc(d.id)}">${icon('file-text')}Open Document</button>
      ${w ? `<button class="btn sm" type="button" data-action="open-review" data-id="${esc(w.id)}">${icon('file-check-2')}Open Review</button>` : ''}
      <button class="btn sm" type="button" data-action="create-revision" data-id="${esc(d.id)}" ${rev.ok ? '' : 'disabled'} title="${esc(rev.why || '')}">Create Revision</button>
      <button class="btn sm" type="button" data-action="request-review" data-id="${esc(d.id)}" ${wfOk.ok ? '' : 'disabled'} title="${esc(wfOk.why || '')}">Submit for Technical Review</button>`;
  };

  Q.docMenu = d => {
    const w = Q.wfForDoc(d.id), rev = Q.canCreateRevision(d), wfOk = Q.canStartWorkflow(d);
    return Q.menu(`Actions for ${d.id} ${d.title}`, [
      { label: 'Open Document', icon: 'file-text', data: { action: 'open-doc', id: d.id } },
      ...(w ? [{ label: 'Open Review', icon: 'file-check-2', data: { action: 'open-review', id: w.id } }] : []),
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

  /* Small product text cleanup. */
  const search = document.getElementById('searchInput');
  if (search) search.placeholder = 'Search controlled documents, processes, owners…';
  document.title = 'Document Control · iQMS';
})();