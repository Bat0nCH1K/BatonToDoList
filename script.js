// ====== ДАННЫЕ ======
let folders = JSON.parse(localStorage.getItem('btd2_folders') || '[{"id":"all","name":"Все задачи","color":"#5c6bc0"}]');
let tasks = JSON.parse(localStorage.getItem('btd2_tasks') || '[]');
let currentFolder = 'all';
let editingTaskId = null;
let editingFolderId = null;
let calYear, calMonth, selectedDate = null;

// ====== ЯЗЫК ======
const L = {
    ru: {
        welcome: '👋 Добро пожаловать в BatonToDoList!',
        welcomeText: 'Здесь ты можешь создавать папки для задач, добавлять задачи с дедлайнами, счётчиком повторений и картинками. Нажми ☰ чтобы открыть папки. Нажми 📅 чтобы посмотреть календарь. Нажми 📊 чтобы увидеть статистику. Удачи!',
        gotIt: 'Понятно!',
        newTask: 'Новая задача',
        editTask: 'Редактировать',
        save: 'Сохранить',
        cancel: 'Отмена',
        allTasks: 'Все задачи',
        noTasks: 'Нет задач. Нажми + чтобы добавить.',
        newFolder: 'Новая папка',
        editFolder: 'Редактировать папку',
        createTask: 'Создать задачу',
        tasksOnDate: 'Задачи на',
        noTasksOnDate: 'Нет задач на этот день',
        stats: '📊 Статистика',
        done: '✅ Сделано',
        active: '📋 Активно',
        overdue: '⏰ Просрочено',
        settings: '⚙️ Настройки',
        theme: 'Тема',
        light: 'Светлая',
        dark: 'Тёмная',
        lang: 'Язык',
        reset: 'Показать обучение заново',
        close: 'Закрыть'
    },
    en: {
        welcome: '👋 Welcome to BatonToDoList!',
        welcomeText: 'Here you can create folders for tasks, add tasks with deadlines, repeat counters and images. Press ☰ to open folders. Press 📅 to view calendar. Press 📊 to see statistics. Good luck!',
        gotIt: 'Got it!',
        newTask: 'New task',
        editTask: 'Edit',
        save: 'Save',
        cancel: 'Cancel',
        allTasks: 'All tasks',
        noTasks: 'No tasks. Press + to add.',
        newFolder: 'New folder',
        editFolder: 'Edit folder',
        createTask: 'Create task',
        tasksOnDate: 'Tasks on',
        noTasksOnDate: 'No tasks on this day',
        stats: '📊 Statistics',
        done: '✅ Done',
        active: '📋 Active',
        overdue: '⏰ Overdue',
        settings: '⚙️ Settings',
        theme: 'Theme',
        light: 'Light',
        dark: 'Dark',
        lang: 'Language',
        reset: 'Show onboarding again',
        close: 'Close'
    }
};
let lang = localStorage.getItem('btd_lang') || 'ru';
function t(key) { return L[lang][key] || key; }

// ====== ТЕМА ======
let currentTheme = localStorage.getItem('btd_theme') || 'light';
document.body.className = currentTheme;
if (document.getElementById('themeSelect')) document.getElementById('themeSelect').value = currentTheme;
if (document.getElementById('langSelect')) document.getElementById('langSelect').value = lang;

// ====== ОНБОРДИНГ ======
if (!localStorage.getItem('btd_onboarded')) {
    document.getElementById('onboarding').classList.remove('hidden');
    document.getElementById('onboarding').querySelector('h2').textContent = t('welcome');
    document.getElementById('onboarding').querySelector('p').textContent = t('welcomeText');
    document.getElementById('onboardingBtn').textContent = t('gotIt');
}
document.getElementById('onboardingBtn').addEventListener('click', () => {
    document.getElementById('onboarding').classList.add('hidden');
    localStorage.setItem('btd_onboarded', '1');
});
document.getElementById('resetOnboardingBtn')?.addEventListener('click', () => {
    localStorage.removeItem('btd_onboarded');
    location.reload();
});

// ====== САЙДБАР ======
document.getElementById('hamburgerBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebarOverlay').classList.toggle('active');
});
document.getElementById('sidebarOverlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
});

// ====== СОХРАНЕНИЕ ======
function save() { localStorage.setItem('btd2_folders', JSON.stringify(folders)); localStorage.setItem('btd2_tasks', JSON.stringify(tasks)); }

// ====== ПАПКИ ======
function renderFolders() {
    const list = document.getElementById('folderList');
    list.innerHTML = folders.map(f => `
        <div class="folder-item ${currentFolder === f.id ? 'active' : ''}" onclick="selectFolder('${f.id}')">
            <span class="folder-color" style="background:${f.color}"></span>
            ${f.name}
            ${f.id !== 'all' ? `<span style="margin-left:auto;opacity:0.5;cursor:pointer;font-size:14px;" onclick="event.stopPropagation();editFolder('${f.id}')">✎</span>` : ''}
        </div>
    `).join('');
}

function selectFolder(id) {
    currentFolder = id;
    renderFolders();
    renderTasks();
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
    document.getElementById('currentFolderName').textContent = folders.find(f => f.id === id)?.name || t('allTasks');
}

document.getElementById('addFolderBtn').addEventListener('click', () => {
    editingFolderId = null;
    document.getElementById('folderNameInput').value = '';
    document.getElementById('folderColor').value = '#4a90d9';
    document.getElementById('folderModalTitle').textContent = t('newFolder');
    document.getElementById('folderModal').classList.add('active');
});

function editFolder(id) {
    const folder = folders.find(f => f.id === id);
    if (!folder) return;
    editingFolderId = id;
    document.getElementById('folderNameInput').value = folder.name;
    document.getElementById('folderColor').value = folder.color;
    document.getElementById('folderModalTitle').textContent = t('editFolder');
    document.getElementById('folderModal').classList.add('active');
}

document.getElementById('saveFolderBtn').addEventListener('click', () => {
    const name = document.getElementById('folderNameInput').value.trim();
    if (!name) return;
    if (editingFolderId) {
        const f = folders.find(f => f.id === editingFolderId);
        if (f) { f.name = name; f.color = document.getElementById('folderColor').value; }
    } else {
        folders.push({ id: 'f_' + Date.now(), name, color: document.getElementById('folderColor').value });
    }
    save(); renderFolders();
    document.getElementById('folderModal').classList.remove('active');
});

document.getElementById('cancelFolderBtn').addEventListener('click', () => {
    document.getElementById('folderModal').classList.remove('active');
});

// ====== РЕНДЕР ЗАДАЧ ======
function renderTasks() {
    const list = document.getElementById('taskList');
    const filtered = currentFolder === 'all' ? tasks : tasks.filter(t => t.folderId === currentFolder);
    
    if (filtered.length === 0) {
        list.innerHTML = `<div style="text-align:center;color:var(--text-secondary);padding:40px;">${t('noTasks')}</div>`;
        return;
    }

    list.innerHTML = filtered.map(task => {
        const done = task.progress || 0;
        const total = task.repeat || 1;
        const pct = total > 1 ? Math.round((done / total) * 100) : (done >= total ? 100 : 0);
        const cls = done >= total ? 'completed' : '';
        const overdue = task.deadline && new Date(task.deadline) < new Date() && done < total;
        
        return `
            <div class="task-item ${cls}" style="border-left:4px solid ${task.color || '#e94560'}">
                <input type="checkbox" class="task-checkbox" ${done >= total ? 'checked' : ''} onchange="event.stopPropagation();toggleTask(${task.id})">
                <div class="task-info" onclick="event.stopPropagation();openTask(${task.id})">
                    <div class="task-name">${escapeHtml(task.name)}</div>
                    <div class="task-meta">
                        ${task.deadline ? '📅 ' + formatDate(task.deadline) : ''}
                        ${overdue ? ' ⚠️' : ''}
                    </div>
                    ${task.image ? `<img src="${task.image}" class="task-image">` : ''}
                    ${total > 1 ? `<div class="task-progress"><div class="task-progress-bar" style="width:${pct}%;background:${task.color}"></div></div><span style="font-size:12px;">${done}/${total}</span>` : ''}
                </div>
                <button class="task-delete" onclick="event.stopPropagation();deleteTask(${task.id})">✕</button>
            </div>
        `;
    }).join('');
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ====== ЗАДАЧИ ======
document.getElementById('addTaskBtn').addEventListener('click', () => {
    editingTaskId = null;
    document.getElementById('modalTitle').textContent = t('newTask');
    document.getElementById('taskNameInput').value = '';
    document.getElementById('taskColor').value = '#e94560';
    document.getElementById('taskRepeat').value = '1';
    document.getElementById('taskDeadline').value = '';
    document.getElementById('taskImage').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('previewDeadline').textContent = '';
    document.getElementById('colorPreview').style.background = '#e94560';
    document.getElementById('taskModal').classList.add('active');
});

function openTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    editingTaskId = id;
    document.getElementById('modalTitle').textContent = t('editTask');
    document.getElementById('taskNameInput').value = task.name;
    document.getElementById('taskColor').value = task.color || '#e94560';
    document.getElementById('taskRepeat').value = task.repeat || 1;
    document.getElementById('taskDeadline').value = task.deadline || '';
    document.getElementById('previewDeadline').textContent = task.deadline ? formatDate(task.deadline) : '';
    document.getElementById('colorPreview').style.background = task.color || '#e94560';
    if (task.image) {
        document.getElementById('imagePreview').src = task.image;
        document.getElementById('imagePreview').style.display = 'block';
    } else {
        document.getElementById('imagePreview').style.display = 'none';
    }
    document.getElementById('taskModal').classList.add('active');
}

document.getElementById('saveTaskBtn').addEventListener('click', async () => {
    const name = document.getElementById('taskNameInput').value.trim();
    if (!name) return alert('Введите название');
    
    let imageData = '';
    const imgFile = document.getElementById('taskImage').files[0];
    if (imgFile) {
        imageData = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(imgFile);
        });
    }

    const taskData = {
        name,
        color: document.getElementById('taskColor').value,
        repeat: parseInt(document.getElementById('taskRepeat').value) || 1,
        deadline: document.getElementById('taskDeadline').value || null,
        image: imageData || (editingTaskId ? tasks.find(t => t.id === editingTaskId)?.image : ''),
        folderId: currentFolder === 'all' ? null : currentFolder,
        progress: editingTaskId ? tasks.find(t => t.id === editingTaskId)?.progress || 0 : 0,
    };

    if (editingTaskId) {
        const idx = tasks.findIndex(t => t.id === editingTaskId);
        if (idx !== -1) tasks[idx] = { ...tasks[idx], ...taskData };
    } else {
        tasks.push({ id: Date.now(), ...taskData });
    }
    
    save(); renderTasks();
    document.getElementById('taskModal').classList.remove('active');
});

document.getElementById('cancelTaskBtn').addEventListener('click', () => {
    document.getElementById('taskModal').classList.remove('active');
});

document.getElementById('taskDeadline').addEventListener('change', function() {
    document.getElementById('previewDeadline').textContent = this.value ? formatDate(this.value) : '';
});

document.getElementById('taskColor').addEventListener('input', function() {
    document.getElementById('colorPreview').style.background = this.value;
});

document.getElementById('taskImage').addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('imagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const total = task.repeat || 1;
    task.progress = (task.progress || 0) >= total ? 0 : (task.progress || 0) + 1;
    save(); renderTasks();
}

function deleteTask(id) { tasks = tasks.filter(t => t.id !== id); save(); renderTasks(); }

// ====== КАЛЕНДАРЬ ======
document.getElementById('calendarBtn').addEventListener('click', () => {
    const now = new Date();
    calYear = now.getFullYear(); calMonth = now.getMonth();
    selectedDate = null;
    renderCalendar();
    document.getElementById('calendarScreen').classList.add('active');
});
document.getElementById('closeCalendarBtn').addEventListener('click', () => {
    document.getElementById('calendarScreen').classList.remove('active');
    renderTasks();
});
document.getElementById('calPrev').addEventListener('click', () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } selectedDate = null; renderCalendar(); });
document.getElementById('calNext').addEventListener('click', () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } selectedDate = null; renderCalendar(); });

function renderCalendar() {
    document.getElementById('calMonthYear').textContent = new Date(calYear, calMonth).toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
    const grid = document.getElementById('calendarGrid');
    const firstDay = new Date(calYear, calMonth, 1).getDay() || 7;
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const today = new Date();
    let html = '';
    for (let i = 1; i < firstDay; i++) html += '<div class="calendar-cell"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const hasTask = tasks.some(t => t.deadline && t.deadline.startsWith(dateStr));
        const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === d;
        const isSelected = selectedDate === dateStr;
        html += `<div class="calendar-cell ${hasTask ? 'has-task' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" onclick="selectCalendarDate('${dateStr}')">${d}</div>`;
    }
    grid.innerHTML = html;
    
    // Показываем задачи на выбранную дату
    const taskListDiv = document.getElementById('calendarTaskList');
    if (selectedDate) {
        const dateTasks = tasks.filter(t => t.deadline && t.deadline.startsWith(selectedDate)).sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''));
        if (dateTasks.length === 0) {
            taskListDiv.innerHTML = `<p style="color:var(--text-secondary);text-align:center;">${t('noTasksOnDate')}</p>`;
        } else {
            taskListDiv.innerHTML = `<p style="font-weight:600;margin-bottom:8px;">${t('tasksOnDate')} ${formatDate(selectedDate)}</p>` + dateTasks.map(task => `
                <div class="task-item" style="border-left:4px solid ${task.color || '#e94560'};margin-bottom:6px;" onclick="openTaskFromCalendar(${task.id})">
                    <div class="task-info">
                        <div class="task-name">${escapeHtml(task.name)}</div>
                        <div class="task-meta">${formatDate(task.deadline)}</div>
                    </div>
                </div>
            `).join('');
        }
        taskListDiv.innerHTML += `<button class="btn" style="margin-top:10px;width:100%;" onclick="addTaskForDate('${selectedDate}')">+ ${t('createTask')}</button>`;
    } else {
        taskListDiv.innerHTML = '';
    }
}

function selectCalendarDate(dateStr) {
    selectedDate = dateStr;
    renderCalendar();
}

function addTaskForDate(dateStr) {
    document.getElementById('calendarScreen').classList.remove('active');
    editingTaskId = null;
    document.getElementById('modalTitle').textContent = t('newTask');
    document.getElementById('taskNameInput').value = '';
    document.getElementById('taskColor').value = '#e94560';
    document.getElementById('taskRepeat').value = '1';
    document.getElementById('taskDeadline').value = dateStr + 'T12:00';
    document.getElementById('taskImage').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('previewDeadline').textContent = formatDate(dateStr + 'T12:00');
    document.getElementById('colorPreview').style.background = '#e94560';
    document.getElementById('taskModal').classList.add('active');
}

function openTaskFromCalendar(id) {
    document.getElementById('calendarScreen').classList.remove('active');
    openTask(id);
}

// ====== СТАТИСТИКА ======
document.getElementById('statsBtn').addEventListener('click', () => {
    renderStats();
    document.getElementById('statsScreen').classList.add('active');
});
document.getElementById('closeStatsBtn').addEventListener('click', () => {
    document.getElementById('statsScreen').classList.remove('active');
});

function renderStats() {
    const done = tasks.filter(t => (t.progress || 0) >= (t.repeat || 1)).length;
    const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && (t.progress || 0) < (t.repeat || 1)).length;
    const active = tasks.length - done - overdue;
    document.getElementById('statDone').textContent = done;
    document.getElementById('statActive').textContent = Math.max(0, active);
    document.getElementById('statOverdue').textContent = overdue;

    const canvas = document.getElementById('statsChart');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 220, 220);
    const total = tasks.length || 1;
    const colors = ['#4caf84', '#e94560', '#ff9800'];
    const values = [done, Math.max(0, active), overdue];
    let startAngle = -Math.PI / 2;
    values.forEach((v, i) => {
        const sliceAngle = (v / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(110, 110);
        ctx.arc(110, 110, 90, startAngle, startAngle + sliceAngle);
        ctx.fillStyle = colors[i];
        ctx.fill();
        startAngle += sliceAngle;
    });
    ctx.beginPath();
    ctx.arc(110, 110, 45, 0, Math.PI * 2);
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg').trim();
    ctx.fill();
}

// ====== НАСТРОЙКИ ======
document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('themeSelect').value = currentTheme;
    document.getElementById('langSelect').value = lang;
    document.getElementById('settingsScreen').classList.add('active');
});
document.getElementById('closeSettingsBtn').addEventListener('click', () => {
    document.getElementById('settingsScreen').classList.remove('active');
});
document.getElementById('themeSelect').addEventListener('change', function() {
    currentTheme = this.value;
    document.body.className = currentTheme;
    localStorage.setItem('btd_theme', currentTheme);
});
document.getElementById('langSelect').addEventListener('change', function() {
    lang = this.value;
    localStorage.setItem('btd_lang', lang);
    location.reload();
});

// ====== ПОДДЕРЖКА ======
document.getElementById('supportBtn').addEventListener('click', () => {
    window.open('https://t.m
