const toast = document.getElementById('toast');
const courseName = document.getElementById('courseName');
const newCourseFile = document.getElementById('newCourseFile');
const btnCreateCourse = document.getElementById('btnCreateCourse');
const btnRefresh = document.getElementById('btnRefresh');
const courseList = document.getElementById('courseList');

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = 'fixed top-4 right-4 bg-white border shadow px-4 py-2 rounded-lg text-sm';
  if (type === 'success') toast.classList.add('border-green-300');
  if (type === 'error') toast.classList.add('border-red-300');
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2200);
}

async function fetchCourses() {
  try {
    const res = await fetch('/api/courses');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function renderCourses(items) {
  courseList.innerHTML = '';
  if (!items.length) {
    const d = document.createElement('div');
    d.className = 'text-sm text-gray-500 py-4 my-4';
    d.textContent = 'No courses yet.';
    courseList.appendChild(d);
    return;
  }
  items.forEach(({ name, slug }) => {
    const row = document.createElement('div');
    row.className = 'flex items-center py-4';
    const left = document.createElement('div');
    left.className = 'font-medium';
    left.textContent = name;
    row.appendChild(left);
    courseList.appendChild(row);
  });
}

async function refreshList() {
  const items = await fetchCourses();
  renderCourses(items);
}

btnCreateCourse.addEventListener('click', async () => {
  const name = (courseName.value || '').trim();
  if (!name) { showToast('Enter course name.', 'error'); return; }
  if (!newCourseFile.files || newCourseFile.files.length === 0) { showToast('Choose an Excel file.', 'error'); return; }
  const fd = new FormData();
  fd.append('name', name);
  fd.append('file', newCourseFile.files[0]);
  try {
    const res = await fetch('/api/courses', { method: 'POST', body: fd });
    const data = await res.json();
    if (res.status === 409) throw new Error('Course already exists. Use Edit to update.');
    if (!res.ok || !data.success) throw new Error(data.message || 'Create failed');
    showToast('Course created.');
    courseName.value = '';
    newCourseFile.value = '';
    await refreshList();
  } catch (e) {
    showToast(e.message || 'Failed to create course.', 'error');
  }
});

btnRefresh.addEventListener('click', refreshList);

refreshList();
