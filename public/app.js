let syllabusData = { topics: [] };
let courses = [];
let selectedCourseSlug = '';

const subjectSelect = document.getElementById('subject');
const moduleSelect = document.getElementById('module');
const topicsContainer = document.getElementById('topicsContainer');

const form = document.getElementById('trainingForm');
const trainingDate = document.getElementById('trainingDate');
const instructor = document.getElementById('instructor');
const batch = document.getElementById('batch');
const present = document.getElementById('present');
const total = document.getElementById('total');
const mode = document.getElementById('mode');
const course = document.getElementById('course');
const additionalNotes = document.getElementById('additionalNotes');

// Cancel form elements
const sectionTraining = document.getElementById('sectionTraining');
const sectionCancel = document.getElementById('sectionCancel');
const btnNavTraining = document.getElementById('btnNavTraining');
const btnNavCancel = document.getElementById('btnNavCancel');
const cancelForm = document.getElementById('cancelForm');
const c_date = document.getElementById('c_date');
const c_instructor = document.getElementById('c_instructor');
const c_reason = document.getElementById('c_reason');
const c_count = document.getElementById('c_count');
const c_affected = document.getElementById('c_affected');
const c_err_date = document.getElementById('c_err_date');
const c_err_instructor = document.getElementById('c_err_instructor');
const c_err_reason = document.getElementById('c_err_reason');
const c_err_count = document.getElementById('c_err_count');
const c_err_affected = document.getElementById('c_err_affected');
const c_btnGenerate = document.getElementById('c_btnGenerate');
const c_btnReset = document.getElementById('c_btnReset');

const errDate = document.getElementById('errDate');
const errInstructor = document.getElementById('errInstructor');
const errBatch = document.getElementById('errBatch');
const errPresent = document.getElementById('errPresent');
const errTotal = document.getElementById('errTotal');
const errMode = document.getElementById('errMode');
const errCourse = document.getElementById('errCourse');
const errSubject = document.getElementById('errSubject');
const errModule = document.getElementById('errModule');
const errTopics = document.getElementById('errTopics');

const btnGenerate = document.getElementById('btnGenerate');
const btnReset = document.getElementById('btnReset');
const btnCopy = document.getElementById('btnCopy');
const preview = document.getElementById('preview');
const panelGenerated = document.getElementById('panelGenerated');

function setSection(active) {
  if (!sectionTraining || !sectionCancel) return;
  const showTraining = active === 'training';
  sectionTraining.classList.toggle('hidden', !showTraining);
  sectionCancel.classList.toggle('hidden', showTraining);

  const activate = (btn) => {
    if (!btn) return;
    btn.classList.add('active');
    btn.setAttribute('aria-current','page');
  };
  const deactivate = (btn) => {
    if (!btn) return;
    btn.classList.remove('active');
    btn.removeAttribute('aria-current');
  };

  if (showTraining) {
    activate(btnNavTraining);
    deactivate(btnNavCancel);
  } else {
    activate(btnNavCancel);
    deactivate(btnNavTraining);
  }

  try { localStorage.setItem('activeSection', active); } catch (e) {}
}

btnNavTraining?.addEventListener('click', () => setSection('training'));
btnNavCancel?.addEventListener('click', () => setSection('cancel'));

{
  const initial = (() => { try { return localStorage.getItem('activeSection') || 'training'; } catch (e) { return 'training'; } })();
  setSection(initial);
}

function renderAffectedFields() {
  if (!c_affected) return;
  c_affected.innerHTML = '';
  const n = Math.max(0, Number(c_count?.value || 0));

  for (let i = 0; i < n; i++) {
    const wrapper = document.createElement('div');

    // One single horizontal line per batch (scrolls horizontally on small screens)
    wrapper.className = 'flex items-end gap-3 overflow-x-auto py-1 no-scrollbar';

    const nameId = `c_aff_name_${i}`;
    const timeId = `c_aff_time_${i}`;
    const modeId = `c_aff_mode_${i}`;

    wrapper.innerHTML = `
      <div class="min-w-[260px]">
        <label class="block text-xs font-medium mb-1"><b>Affected Batch Name ${i + 1}</b></label>
        <input
          type="text"
          id="${nameId}"
          class="w-[260px] border rounded-lg px-4 py-1.5 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Batch name"
          ${i === 0 ? 'required' : ''}
        >
      </div>

      <div class="min-w-[160px]">
        <label class="block text-xs font-medium mb-1"><b>Timing ${i + 1}</b></label>
        <input
          type="time"
          id="${timeId}"
          class="w-[160px] border rounded-lg px-2 py-1.5 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          ${i === 0 ? 'required' : ''}
        >
      </div>

      <div class="min-w-[180px]">
        <label class="block text-xs font-medium mb-1"><b>Training Mode ${i + 1}</b></label>
        <select
          id="${modeId}"
          class="w-[180px] border rounded-lg px-2 py-1.5 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          ${i === 0 ? 'required' : ''}
        >
          <option value="">Select mode</option>
          <option>Online</option>
          <option>Offline</option>
          <option>Hybrid</option>
        </select>
      </div>
    `;
    c_affected.appendChild(wrapper);
  }
}

c_count?.addEventListener('input', renderAffectedFields);

function clearCancelErrors() {
  [c_err_date, c_err_instructor, c_err_reason, c_err_count, c_err_affected]
    .forEach(el => { el && (el.textContent = ''); el && el.classList.add('hidden'); });
  [c_date, c_instructor, c_reason, c_count]
    .forEach(inp => inp?.classList.remove('border-red-500'));
}

function validateCancelForm() {
  clearCancelErrors();
  let ok = true;

  if (!c_date?.value) {
    if (c_err_date) { c_err_date.textContent = 'Date is required.'; c_err_date.classList.remove('hidden'); }
    c_date?.classList.add('border-red-500'); ok = false;
  }
  if (!c_instructor?.value.trim()) {
    if (c_err_instructor) { c_err_instructor.textContent = 'Instructor name is required.'; c_err_instructor.classList.remove('hidden'); }
    c_instructor?.classList.add('border-red-500'); ok = false;
  }
  if (!c_reason?.value.trim()) {
    if (c_err_reason) { c_err_reason.textContent = 'Cancellation reason is required.'; c_err_reason.classList.remove('hidden'); }
    c_reason?.classList.add('border-red-500'); ok = false;
  }

  const n = Number(c_count?.value || 0);
  if (!Number.isFinite(n) || n < 1) {
    if (c_err_count) { c_err_count.textContent = 'Enter at least 1 affected batch.'; c_err_count.classList.remove('hidden'); }
    c_count?.classList.add('border-red-500'); ok = false;
  }

  // At least one row must be filled (your original rule)
  let anyFilled = false;
  for (let i = 0; i < Math.max(0, n); i++) {
    const name = document.getElementById(`c_aff_name_${i}`)?.value?.trim() || '';
    const time = document.getElementById(`c_aff_time_${i}`)?.value?.trim() || '';
    const mode = document.getElementById(`c_aff_mode_${i}`)?.value?.trim() || '';
    if (name || time || mode) { anyFilled = true; break; }
  }
  if (!anyFilled) {
    if (c_err_affected) {
      c_err_affected.textContent = 'Provide details for at least one affected batch.';
      c_err_affected.classList.remove('hidden');
    }
    ok = false;
  }

  // NEW: Enforce row 1 fully complete (mandatory)
  if (n >= 1) {
    const name0 = document.getElementById('c_aff_name_0')?.value?.trim() || '';
    const time0 = document.getElementById('c_aff_time_0')?.value?.trim() || '';
    const mode0 = document.getElementById('c_aff_mode_0')?.value?.trim() || '';
    if (!name0 || !time0 || !mode0) {
      if (c_err_affected) {
        c_err_affected.textContent = 'Batch 1: name, time, and mode are required.';
        c_err_affected.classList.remove('hidden');
      }
      ['c_aff_name_0','c_aff_time_0','c_aff_mode_0'].forEach(id => {
        const el = document.getElementById(id);
        el?.classList.add('border-red-500');
      });
      ok = false;
    }
  }

  return { ok };
}

function buildCancelMessage() {
  const date = c_date?.value || '';
  const instructorName = toTitleCase(c_instructor?.value || '');
  const reason = (c_reason?.value || '').trim();
  const countVal = Math.max(0, Number(c_count?.value || 0));

  const affected = [];
  for (let i = 0; i < countVal; i++) {
    const nameEl = document.getElementById(`c_aff_name_${i}`);
    const timeEl = document.getElementById(`c_aff_time_${i}`);
    const modeEl = document.getElementById(`c_aff_mode_${i}`);
    const name = nameEl?.value?.trim() || '';
    const time = timeEl?.value?.trim() || '';
    const mode = modeEl?.value?.trim() || '';
    if (name || time || mode) affected.push({ name, time, mode });
  }

  const numberAffected = affected.length;

  const lines = [];
  lines.push('⚠️ CDEC Batch Cancellation Notice');
  lines.push('');
  lines.push(`📅 Cancellation date: ${date}`);
  lines.push(`👨‍🏫 Instructor name: ${instructorName}`);
  lines.push(`📝 Cancellation Reason: ${reason}`);
  lines.push(`🔢 Number of affected batches: ${numberAffected}`);
  lines.push('');
  lines.push('📦 Affected Batches:');
  affected.forEach((b, idx) => {
    lines.push(`Batch ${idx + 1}: ${b.name || '-'}`);
    lines.push(`  • Timing: ${b.time || '-'}`);
    lines.push(`  • Mode: ${b.mode || '-'}`);
  });

  const html = `
    <h3 class="font-semibold text-base">⚠️ CDEC Batch Cancellation Notice</h3>
    <div class="space-y-1">
      <div>📅 <strong>Cancellation date:</strong> ${escapeHtml(date)}</div>
      <div>👨‍🏫 <strong>Instructor name:</strong> ${escapeHtml(instructorName)}</div>
      <div>📝 <strong>Cancellation Reason:</strong> ${escapeHtml(reason)}</div>
      <div>🔢 <strong>Number of affected batches:</strong> ${numberAffected}</div>
      <div class="pt-1">📦 <strong>Affected Batches:</strong></div>
      <div>${affected.map((b, i) => `<div class="pl-1"><div>Batch ${i + 1}: ${escapeHtml(b.name || '-')}</div><div class=\"pl-3\">• Timing: ${escapeHtml(b.time || '-')}</div><div class=\"pl-3\">• Mode: ${escapeHtml(b.mode || '-')}</div></div>`).join('')}</div>
    </div>
  `;

  return { text: lines.join('\n'), html };
}

async function loadSyllabus(slug) {
  try {
    if (!slug) { syllabusData = { topics: [] }; populateSubjects(); return; }
    const res = await fetch(`/api/syllabus?course=${encodeURIComponent(slug)}`);
    syllabusData = await res.json();
    populateSubjects();
  } catch (e) {
    console.error('Failed to fetch syllabus', e);
    syllabusData = { topics: [] };
  }
}

async function loadCourses() {
  try {
    const res = await fetch('/api/courses');
    courses = await res.json();
    populateCourses();
  } catch (e) {
    console.error('Failed to fetch courses', e);
    courses = [];
    populateCourses();
  }
}

function populateCourses() {
  if (!course) return;
  course.innerHTML = '<option value="">Select course</option>';
  (courses || []).forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.slug;
    opt.textContent = c.name;
    course.appendChild(opt);
  });
}

function populateSubjects() {
  subjectSelect.innerHTML = '<option value="">Select subject</option>';
  (syllabusData.topics || []).forEach((t, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = t.name || `Subject ${idx + 1}`;
    subjectSelect.appendChild(opt);
  });
  moduleSelect.innerHTML = '<option value="">Select module</option>';
  moduleSelect.disabled = true;
  topicsContainer.innerHTML = '';
}

function populateModules(topicIdx) {
  moduleSelect.innerHTML = '<option value="">Select module</option>';
  topicsContainer.innerHTML = '';
  if (topicIdx === '' || topicIdx == null) {
    moduleSelect.disabled = true;
    return;
  }
  const topic = syllabusData.topics[Number(topicIdx)];
  if (!topic) return;
  (topic.main_topics || []).forEach((m, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = m.name || `Module ${idx + 1}`;
    moduleSelect.appendChild(opt);
  });
  moduleSelect.disabled = false;
}

function populateTopics(topicIdx, moduleIdx) {
  topicsContainer.innerHTML = '';
  if (topicIdx === '' || moduleIdx === '' || topicIdx == null || moduleIdx == null) return;
  const topic = syllabusData.topics[Number(topicIdx)];
  const mod = topic?.main_topics?.[Number(moduleIdx)];
  (mod?.subtopics || []).forEach((s, i) => {
    const id = `topic_${i}`;
    const label = document.createElement('label');
    label.className = 'inline-flex items-center gap-2';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = s;
    cb.id = id;
    cb.className = 'w-4 h-4';
    label.appendChild(cb);
    const span = document.createElement('span');
    span.textContent = s;
    label.appendChild(span);
    topicsContainer.appendChild(label);
  });
}

subjectSelect.addEventListener('change', (e) => {
  populateModules(e.target.value);
});

moduleSelect.addEventListener('change', (e) => {
  populateTopics(subjectSelect.value, e.target.value);
});

course.addEventListener('change', (e) => {
  selectedCourseSlug = e.target.value;
  // reset dependent selects and topics
  subjectSelect.value = '';
  moduleSelect.value = '';
  populateSubjects();
  loadSyllabus(selectedCourseSlug);
});

function clearErrors() {
  [errDate, errInstructor, errBatch, errPresent, errTotal, errMode, errCourse, errSubject, errModule, errTopics]
    .forEach(el => { el.textContent = ''; el.classList.add('hidden'); });
}

function validateForm() {
  clearErrors();
  let ok = true;
  if (!trainingDate.value) { errDate.textContent = 'Training date is required.'; errDate.classList.remove('hidden'); ok = false; }
  if (!instructor.value.trim()) { errInstructor.textContent = 'Instructor name is required.'; errInstructor.classList.remove('hidden'); ok = false; }
  if (!batch.value.trim()) { errBatch.textContent = 'Batch name is required.'; errBatch.classList.remove('hidden'); ok = false; }
  if (!mode.value) { errMode.textContent = 'Training mode is required.'; errMode.classList.remove('hidden'); ok = false; }
  if (!course.value) { errCourse.textContent = 'Course is required.'; errCourse.classList.remove('hidden'); ok = false; }
  const presentVal = Number(present.value || 0);
  const totalVal = Number(total.value || 0);
  if (isNaN(presentVal)) { errPresent.textContent = 'Enter present count.'; errPresent.classList.remove('hidden'); ok = false; }
  if (!total.value) { errTotal.textContent = 'Enter total students.'; errTotal.classList.remove('hidden'); ok = false; }
  if (presentVal > totalVal) { errPresent.textContent = 'Present cannot exceed Total.'; errPresent.classList.remove('hidden'); ok = false; }
  if (!subjectSelect.value) { errSubject.textContent = 'Select a subject.'; errSubject.classList.remove('hidden'); ok = false; }
  if (!moduleSelect.value) { errModule.textContent = 'Select a module.'; errModule.classList.remove('hidden'); ok = false; }
  const selectedTopics = Array.from(topicsContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
  if (selectedTopics.length === 0) { errTopics.textContent = 'Select at least one topic covered.'; errTopics.classList.remove('hidden'); ok = false; }
  return { ok, presentVal, totalVal, selectedTopics };
}

function buildMessage({ presentVal, totalVal, selectedTopics, extraNotes }) {
  const pct = totalVal > 0 ? Math.round((presentVal / totalVal) * 100) : 0;
  const subjectName = syllabusData.topics[Number(subjectSelect.value)]?.name || '';
  const moduleName = syllabusData.topics[Number(subjectSelect.value)]?.main_topics?.[Number(moduleSelect.value)]?.name || '';
  const instructorName = toTitleCase(instructor.value.trim());
  const batchName = toTitleCase(batch.value.trim());
  // Plain text with emojis in requested order and labels with colons
  const textLines = [
    `Daily Training Update (${trainingDate.value}):`,
    `🧑‍🏫 Instructor: ${instructorName}`,
    `👥 Batch: ${batchName}`,
    `🌐 Mode: ${mode.value}`,
    `📊 Attendance: ${presentVal} / ${totalVal} (${pct}%)`,
    `🎓 Course: ${getSelectedCourseName()}`,
    `📘 Subject: ${subjectName}`,
    `🗓️ Module: ${moduleName}`,
    `📝 Topics Covered:`,
    ...selectedTopics.map((t, i) => `${i + 1}. ${t}`),
    ...(extraNotes ? [`🧭 Notes: ${extraNotes}`] : [])
  ];

  // HTML with emojis in the same order and labels with colons
  const html = `
    <h3 class="font-semibold text-base">Daily Training Update (${escapeHtml(trainingDate.value)}):</h3>
    <div class="space-y-1">
      <div>🧑‍🏫 <strong>Instructor:</strong> ${escapeHtml(instructorName)}</div>
      <div>👥 <strong>Batch:</strong> ${escapeHtml(batchName)}</div>
      <div>🌐 <strong>Mode:</strong> ${escapeHtml(mode.value)}</div>
      <div>📊 <strong>Attendance:</strong> ${presentVal} / ${totalVal} (${pct}%)</div>
      <div>🎓 <strong>Course:</strong> ${escapeHtml(getSelectedCourseName())}</div>
      <div>📘 <strong>Subject:</strong> ${escapeHtml(subjectName)}</div>
      <div>🗓️ <strong>Module:</strong> ${escapeHtml(moduleName)}</div>
      <div>📝 <strong>Topics Covered:</strong></div>
      <ol class="list-decimal pl-5 m-0">${selectedTopics.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ol>
      ${extraNotes ? `<div>🧭 <strong>Notes:</strong> ${escapeHtml(extraNotes)}</div>` : ''}
    </div>
  `;

  return { html, text: textLines.join('\n') };
}

let lastGeneratedText = '';

btnGenerate.addEventListener('click', () => {
  const { ok, presentVal, totalVal, selectedTopics } = validateForm();
  if (!ok) return;
  const extraNotes = (additionalNotes?.value || '').trim();
  const { html, text } = buildMessage({ presentVal, totalVal, selectedTopics, extraNotes });
  preview.innerHTML = html;
  lastGeneratedText = text;
});

btnReset.addEventListener('click', () => {
  form.reset();
  populateSubjects();
  preview.textContent = 'Your formatted message will appear here...';
  lastGeneratedText = '';
  if (additionalNotes) additionalNotes.value = '';
  selectedCourseSlug = '';
});

btnCopy.addEventListener('click', async () => {
  try {
    // copy the canonical message with emojis and controlled newlines
    await navigator.clipboard.writeText(lastGeneratedText || preview?.innerText || '');
    btnCopy.textContent = 'Copied!';
    setTimeout(() => (btnCopy.textContent = 'Copy Message'), 1200);
  } catch (e) {}
});

c_btnGenerate?.addEventListener('click', () => {
  const { ok } = validateCancelForm();
  if (!ok) return;
  const { html, text } = buildCancelMessage();
  if (preview) {
    preview.classList.add('opacity-0');
    preview.innerHTML = html;
    setTimeout(() => preview.classList.remove('opacity-0'), 0);
  }
  lastGeneratedText = text;
});

c_btnReset?.addEventListener('click', () => {
  cancelForm?.reset();
  c_affected && (c_affected.innerHTML = '');
  if (preview) preview.textContent = 'Your formatted message will appear here...';
  lastGeneratedText = '';
  clearCancelErrors();
  if (c_count) { c_count.value = '1'; renderAffectedFields(); }
});

// Init
loadCourses().then(() => {
  selectedCourseSlug = course?.value || '';
  return loadSyllabus(selectedCourseSlug);
});

// Ensure at least one affected batch by default
if (c_count) {
  if (!c_count.value) c_count.value = '1';
  renderAffectedFields();
}

// WhatsApp integration
const btnWhatsApp = document.getElementById('btnWhatsApp');
function toWhatsAppSafe(text) {
  if (!text) return text;
  return text
    .replace(/🧑‍🏫/g, '👤')
    .replace(/🗓️/g, '📅')
    .replace(/️/g, '')
  ;
}
function updateWhatsAppButtonState() {
  if (!btnWhatsApp) return;
  if (lastGeneratedText) {
    btnWhatsApp.removeAttribute('disabled');
  } else {
    btnWhatsApp.setAttribute('disabled', 'true');
  }
}

btnWhatsApp?.addEventListener('click', () => {
  if (!lastGeneratedText) { alert('Generate a message first.'); return; }
  // Open WhatsApp composer without preselecting a number; user will pick a contact
  const safe = toWhatsAppSafe(lastGeneratedText);
  const url = `https://wa.me/?text=${encodeURIComponent(safe)}`;
  window.open(url, '_blank');
});

// ensure state reflects availability after generation and reset
btnGenerate?.addEventListener('click', () => setTimeout(updateWhatsAppButtonState, 0));
btnReset?.addEventListener('click', () => setTimeout(updateWhatsAppButtonState, 0));
c_btnGenerate?.addEventListener('click', () => setTimeout(updateWhatsAppButtonState, 0));
c_btnReset?.addEventListener('click', () => setTimeout(updateWhatsAppButtonState, 0));

// initial state
updateWhatsAppButtonState();

// Helpers
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function toTitleCase(str) {
  return String(str)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

function getSelectedCourseName() {
  const slug = selectedCourseSlug || (course ? course.value : '');
  const bySlug = (courses || []).find(c => c.slug === slug)?.name;
  if (bySlug) return bySlug;
  const optText = course?.selectedOptions?.[0]?.textContent || '';
  return optText || '';
}
