// ====== ДАННЫЕ ======
let folders = JSON.parse(localStorage.getItem('btd_folders') || '[{"id":"all","name":"Все задачи","color":"#5c6bc0"}]');
let tasks = JSON.parse(localStorage.getItem('btd_tasks') || '[]');
let currentFolder = 'all';
let editingTaskId = null;
let calYear, calMonth;

// ====== ЯЗЫК ======
const langs = {
    ru: { welcome: '👋 Добро пожаловать!', welcomeText: 'Это твой список задач. Создавай папки, добавляй задачи, ставь дедлайны и отслеживай прогресс.', gotIt: 'Понятно!', newTask: 'Новая задача', editTask: 'Редактировать', save: 'Сохранить', cancel: 'Отмена', folders: '📁 Папки', allTasks: 'Все задачи', settings: '⚙️ Настройки', theme: 'Тема', light: 'Светлая', dark: 'Тёмная', lang: 'Язык', resetOnboarding: 'Показать обучение заново', stats: '📊 Статистика', done: '✅ Сделано', active: '📋 Активно', overdue: '⏰ Просрочено', support: '💬 Поддержка', close: 'Закрыть', calendar: '📅 Календарь', repeat: 'Повторений', deadline: 'Дедлайн', color: 'Цвет', image: 'Картинка', name: 'Название задачи', desc: 'Описание', newFolder: 'Новая папка', folderName: 'Название папки' },
    en: { welcome: '👋 Welcome!', welcomeText: 'This is your to-do list. Create folders, add tasks, set deadlines and track progress.', gotIt: 'Got it!', newTask: 'New task', editTask: 'Edit', save: 'Save', cancel: 'Cancel', folders: '📁 Folders', allTasks: 'All tasks', settings: '⚙️ Settings', theme: 'Theme', light: 'Light', dark: 'Dark', lang: 'Language', resetOnboarding: 'Show onboarding again', stats: '📊 Statistics', done: '✅ Done', active: '📋 Active', overdue: '⏰ Overdue', support: '💬 Support', close: 'Close', calendar: '📅 Calendar', repeat: 'Repeat', deadline: 'Deadline', color: 'Color', image: 'Image', name: 'Task name', desc: 'Description', newFolder: 'New folder', folderName: 'Folder name' }
};
let currentLang = localStorage.getItem('btd_lang') || 'ru';
function t(key) { return langs[currentLang][key] || key; }

// ====== ТЕМА ======
let currentTheme = localStorage.getItem('btd_theme') || 'light';
document.body.className = currentTheme;
document.getElementById('themeSelect').value = currentTheme;
document.getElementById('langSelect').value = currentLang;

// ====== ОНБОРДИНГ ======
if (!localStorage.getItem('btd_onboarded')) {
    document.getElementById('onboarding').classList.remove('hidden');
}
document.getElementById('onboardingBtn').addEventListener('click', () => {
    document.getElementById('onboarding').classList.add('hidden');
    localStorage.setItem('btd_onboarded', '1');
});
document.getElementById('resetOnboardingBtn').addEventListener('click', () => {
    localStorage.removeItem('btd_onboarded');
    location.reload();
});

// ====== СОХРАНЕНИЕ ======
function save() { localStorage.setItem('btd_folders', JSON.stringify(folders)); localStorage.setItem('btd_tasks', JSON.stringify(tasks)); }

// ====== РЕНДЕР ПАПОК ======
function renderFolders() {
    const list = document.getElementById('folderList');
    list.innerHTML = folders.map(f => `
        <div class="folder-item ${currentFolder === f.id ? 'active' : ''}" onclick="selectFolder('${f.id}')">
            <span class="folder-color" style="background:${f.color}"></span>
            ${f.name}
            ${f.id !== 'all' ? `<span style="margin-left:auto;font-size:12px;opacity:0.6" onclick="event.stopPropagation();deleteFolder('${f.id}')">✕</span>` : ''}
        </div>
    `).join('');
    document.getElementById('currentFolderName').textContent = folders.find(f => f.id === currentFolder)?.name || t('allTasks');
}

// ====== РЕНДЕР ЗАДАЧ ======
function renderTasks() {
    const list = document.getElementById('taskList');
    const filtered = currentFolder === 'all' ? tasks : tasks.filter(t => t.folderId === currentFolder);
    
    if (filtered.length === 0) {
        list.innerHTML = `<div style="text-align:center;color:var(--text-secondary);padding:40px;">Нет задач. Нажми + чтобы добавить.</div>`;
        return;
    }

    list.innerHTML = filtered.map(task => {
        const done = task.progress || 0;
        const total = task.repeat || 1;
        const pct = Math.round((done / total) * 100);
        const overdue = task.deadline && new Date(task.deadline) < new Date() && done < total;
        const cls = done >= total ? 'completed' : '';
        
        return `
            <div class="task-item ${cls}" style="border-left:4px solid ${task.color || '#e94560'}">
                <input type="checkbox" class="task-checkbox" ${done >= total ? 'checked' : ''} onchange="toggleTask(${task.id})" onclick="event.stopPropagation()">
                <div class="task-info" onclick="openTask(${task.id})">
                    <div class="task-name">${escapeHtml(task.name)}</div>
                    <div class="task-meta">
                        ${task.deadline ? '⏰ ' + new Date(task.deadline).toLocaleString('ru-RU') : ''}
                        ${overdue ? ' ⚠️ Просрочено' : ''}
                        ${task.subtasks ? ' 📋 ' + task.subtasks.filter(s => s.done).length + '/' + task.subtasks.length : ''}
                    </div>
                    ${total > 1 ? `<div class="task-progress"><div class="task-progress-bar" style="width:${pct}%;background:${task.color || '#e94560'}"></div></div> <span style="font-size:12px;margin-left:6px;">${done}/${total}</span>` : ''}
                </div>
                <button class="task-delete" onclick="deleteTask(${task.id})">✕</button>
            </div>
        `;
    }).join('');
}

// ====== ДЕЙСТВИЯ С ЗАДАЧАМИ ======
function addTask() {
    editingTaskId = null;
    document.getElementById('modalTitle').textContent = t('newTask');
    document.getElementById('taskNameInput').value = '';
    document.getElementById('taskDescInput').value = '';
    document.getElementById('taskColor').value = '#e94560';
    document.getElementById('taskRepeat').value = '1';
    document.getElementById('taskDeadline').value = '';
    document.getElementById('taskImage').value = '';
    document.getElementById('taskModal').classList.add('active');
}

function openTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    editingTaskId = id;
    document.getElementById('modalTitle').textContent = t('editTask');
    document.getElementById('taskNameInput').value = task.name;
    document.getElementById('taskDescInput').value = task.desc || '';
    document.getElementById('taskColor').value = task.color || '#e94560';
    document.getElementById('taskRepeat').value = task.repeat || 1;
    document.getElementById('taskDeadline').value = task.deadline || '';
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
        desc: document.getElementById('taskDescInput').value,
        color: document.getElementById('taskColor').value,
        repeat: parseInt(document.getElementById('taskRepeat').value) || 1,
        deadline: document.getElementById('taskDeadline').value || null,
        image: imageData || (editingTaskId ? tasks.find(t => t.id === editingTaskId)?.image : ''),
        folderId: currentFolder === 'all' ? null : currentFolder,
        progress: editingTaskId ? tasks.find(t => t.id === editingTaskId)?.progress || 0 : 0,
        subtasks: editingTaskId ? tasks.find(t => t.id === editingTaskId)?.subtasks || [] : []
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

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const total = task.repeat || 1;
    task.progress = (task.progress || 0) >= total ? 0 : (task.progress || 0) + 1;
    save(); renderTasks();
}

function deleteTask(id) { tasks = tasks.filter(t => t.id !== id); save(); renderTasks(); }

// ====== ПАПКИ ======
document.getElementById('addFolderBtn').addEventListener('click', () => {
    document.getElementById('folderModal').classList.add('active');
});
document.getElementById('saveFolderBtn').addEventListener('click', () => {
    const name = document.getElementById('folderNameInput').value.trim();
    if (!name) return;
    folders.push({ id: 'f_' + Date.now(), name, color: document.getElementById('folderColor').value });
    save(); renderFolders();
    document.getElementById('folderModal').classList.remove('active');
});
document.getElementById('cancelFolderBtn').addEventListener('click', () => {
    document.getElementById('folderModal').classList.remove('active');
});

function selectFolder(id) { currentFolder = id; renderFolders(); renderTasks(); }
function deleteFolder(id) { folders = folders.filter(f => f.id !== id); if (currentFolder === id) currentFolder = 'all'; tasks = tasks.filter(t => t.folderId !== id); save(); renderFolders(); renderTasks(); }

// ====== КАЛЕНДАРЬ ======
document.getElementById('calendarBtn').addEventListener('click', () => {
    const now = new Date();
    calYear = now.getFullYear(); calMonth = now.getMonth();
    renderCalendar();
    document.getElementById('calendarScreen').classList.add('active');
});
document.getElementById('closeCalendarBtn').addEventListener('click', () => {
    document.getElementById('calendarScreen').classList.remove('active');
});
document.getElementById('calPrev').addEventListener('click', () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); });
document.getElementById('calNext').addEventListener('click', () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); });

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
        html += `<div class="calendar-cell ${hasTask ? 'has-task' : ''} ${isToday ? 'today' : ''}" onclick="showDayTasks('${dateStr}')">${d}</div>`;
    }
    grid.innerHTML = html;
}

function showDayTasks(dateStr) {
    const dayTasks = tasks.filter(t => t.deadline && t.deadline.startsWith(dateStr));
    if (dayTasks.length === 0) {
        alert('Нет задач на этот день. Хотите добавить?');
        document.getElementById('taskDeadline').value = dateStr + 'T00:00';
        document.getElementById('calendarScreen').classList.remove('active');
        addTask();
    } else {
        currentFolder = 'all';
        renderFolders();
        tasks = tasks.filter(t => t.deadline && t.deadline.startsWith(dateStr));
        renderTasks();
        document.getElementById('calendarScreen').classList.remove('active');
    }
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
    document.getElementById('statActive').textContent = active;
    document.getElementById('statOverdue').textContent = overdue;

    const canvas = document.getElementById('statsChart');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 200, 200);
    const total = tasks.length || 1;
    const colors = ['#4caf84', '#e94560', '#ff9800'];
    const values = [done, active, overdue];
    let startAngle = -Math.PI / 2;
    values.forEach((v, i) => {
        const sliceAngle = (v / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(100, 100);
        ctx.arc(100, 100, 80, startAngle, startAngle + sliceAngle);
        ctx.fillStyle = colors[i];
        ctx.fill();
        startAngle += sliceAngle;
    });
    ctx.beginPath();
    ctx.arc(100, 100, 40, 0, Math.PI * 2);
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg').trim();
    ctx.fill();
}

// ====== НАСТРОЙКИ ======
document.getElementById('settingsBtn').addEventListener('click', () => {
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
    currentLang = this.value;
    localStorage.setItem('btd_lang', currentLang);
    location.reload();
});

// ====== ПОДДЕРЖКА ======
document.getElementById('supportBtn').addEventListener('click', () => {
    window.open('https://t.me/Baton_C_H_I_K', '_blank');
});

// ====== ОСНОВНЫЕ КНОПКИ ======
document.getElementById('addTaskBtn').addEventListener('click', addTask);

function escapeHtml(text) { const d = document.createElement('div'); d.textContent = text; return d.innerHTML; }

// ====== ЗАГРУЗКА ======
renderFolders();
renderTasks();
