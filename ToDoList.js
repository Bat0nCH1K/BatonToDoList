let tasks = JSON.parse(localStorage.getItem('myTasksV2')) || [];
let currentFilter = 'all';
let currentSort = 'date';
let notificationTimers = {}; // Храним таймеры для уведомлений

function saveTasks() {
    localStorage.setItem('myTasksV2', JSON.stringify(tasks));
    rescheduleAllNotifications(); // Перезапускаем все таймеры при изменении задач
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Запрашиваем разрешение при первой загрузке
requestNotificationPermission();

function scheduleNotification(task) {
    // Отменяем старый таймер для этой задачи, если был
    cancelNotification(task.id);
    
    if (!task.deadline || task.completed) return;
    
    const deadlineTime = new Date(task.deadline).getTime();
    const now = Date.now();
    const delay = deadlineTime - now;
    
    // Если дедлайн уже прошел или в будущем — не ставим
    if (delay <= 0) return;
    
    // Уведомление ровно в момент дедлайна
    notificationTimers[task.id] = setTimeout(() => {
        showNotification(task);
    }, delay);
}

function cancelNotification(taskId) {
    if (notificationTimers[taskId]) {
        clearTimeout(notificationTimers[taskId]);
        delete notificationTimers[taskId];
    }
}

function showNotification(task) {
    // Системное уведомление
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('⏰ Дедлайн!', {
            body: task.text,
            icon: 'https://cdn-icons-png.flaticon.com/128/1827/1827343.png',
            badge: 'https://cdn-icons-png.flaticon.com/128/1827/1827343.png',
            tag: `task-${task.id}`, // чтобы не дублировалось
            requireInteraction: true, // не исчезнет само
            vibrate: [200, 100, 200] // вибрация на телефоне
        });
        
        notification.onclick = function() {
            window.focus();
            notification.close();
        };
    }
    
    // Звуковой сигнал (как бонус)
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 1);
    } catch(e) {
        // Без звука, если не получилось
    }
    
    // Удаляем отработанный таймер
    delete notificationTimers[task.id];
}

function rescheduleAllNotifications() {
    // Отменяем все текущие таймеры
    Object.keys(notificationTimers).forEach(id => {
        clearTimeout(notificationTimers[id]);
    });
    notificationTimers = {};
    
    // Ставим новые таймеры для всех активных задач с дедлайнами
    tasks.forEach(task => {
        if (!task.completed && task.deadline) {
            scheduleNotification(task);
        }
    });
}

function addTask() {
    const input = document.getElementById('taskInput');
    const deadlineInput = document.getElementById('deadlineInput');
    const text = input.value.trim();
    
    if (text === '') return;
    
    // Запрашиваем разрешение, если ещё не дали
    requestNotificationPermission();
    
    const newTask = {
        id: Date.now(),
        text: text,
        completed: false,
        deadline: deadlineInput.value || null,
        createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    
    input.value = '';
    deadlineInput.value = '';
    saveTasks();
    renderTasks();
    
    // Если есть дедлайн — сразу ставим таймер
    if (newTask.deadline) {
        scheduleNotification(newTask);
    }
    
    input.focus();
}

function deleteTask(id) {
    cancelNotification(id);
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

function toggleTask(id) {
    const task = tasks.find(task => task.id === id);
    if (task) {
        task.completed = !task.completed;
        // Если завершили — отменяем уведомление, если развернули — ставим заново
        if (task.completed) {
            cancelNotification(id);
        } else {
            scheduleNotification(task);
        }
        saveTasks();
        renderTasks();
    }
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filters button').forEach(btn => {
        btn.classList.remove('active');
        if ((filter === 'all' && btn.textContent === 'Все') ||
            (filter === 'active' && btn.textContent === 'Активные') ||
            (filter === 'completed' && btn.textContent === 'Завершённые')) {
            btn.classList.add('active');
        }
    });
    renderTasks();
}

function setSort(sort) {
    currentSort = sort;
    document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.sort-btn[onclick="setSort('${sort}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
    renderTasks();
}

function getDeadlineStatus(deadline) {
    if (!deadline) return 'none';
    const now = new Date();
    const dl = new Date(deadline);
    const diffMs = dl - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffMs < 0) return 'overdue';
    if (diffHours <= 24) return 'soon';
    return 'normal';
}

function formatDeadline(deadline) {
    if (!deadline) return '';
    const dl = new Date(deadline);
    const now = new Date();
    const diffMs = dl - now;
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    const options = { 
        day: 'numeric', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    
    if (dl.getFullYear() !== now.getFullYear()) {
        options.year = 'numeric';
    }
    
    const formatted = dl.toLocaleDateString('ru-RU', options);
    
    if (diffMs < 0) {
        if (diffDays === 0) return `⚠️ Просрочено (сегодня)`;
        return `⚠️ Просрочено (${Math.abs(diffDays)} дн. назад)`;
    }
    if (diffHours <= 24) {
        if (diffHours <= 1) return `⏰ Через ${Math.round(diffMs / 60000)} мин.`;
        return `⏰ Через ${diffHours} ч.`;
    }
    if (diffDays <= 3) return `📅 ${formatted} (через ${diffDays} дн.)`;
    return `📅 ${formatted}`;
}

function renderTasks() {
    const list = document.getElementById('tasksList');
    const counter = document.getElementById('counter');
    
    let filtered = tasks;
    if (currentFilter === 'active') filtered = tasks.filter(t => !t.completed);
    if (currentFilter === 'completed') filtered = tasks.filter(t => t.completed);
    
    if (currentSort === 'date') {
        filtered.sort((a, b) => b.id - a.id);
    } else if (currentSort === 'deadline') {
        filtered.sort((a, b) => {
            if (!a.deadline && !b.deadline) return b.id - a.id;
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline) - new Date(b.deadline);
        });
    } else if (currentSort === 'alpha') {
        filtered.sort((a, b) => a.text.localeCompare(b.text, 'ru'));
    }
    
    if (filtered.length === 0) {
        const messages = {
            'all': ['📝', 'У вас пока нет задач', 'Добавьте первую задачу выше'],
            'active': ['✅', 'Все задачи выполнены!', 'Отличная работа!'],
            'completed': ['📦', 'Нет завершённых задач', 'Отмечайте задачи галочкой']
        };
        const [icon, title, subtitle] = messages[currentFilter];
        list.innerHTML = `
            <div class="empty-state">
                <div class="icon">${icon}</div>
                <p><strong>${title}</strong><br>${subtitle}</p>
            </div>`;
    } else {
        list.innerHTML = filtered.map(task => {
            const status = getDeadlineStatus(task.deadline);
            let rowClass = '';
            if (task.completed) rowClass = 'completed';
            else if (status === 'overdue') rowClass = 'overdue';
            else if (status === 'soon') rowClass = 'due-soon';
            
            let deadlineClass = 'normal';
            if (status === 'overdue') deadlineClass = 'overdue-text';
            else if (status === 'soon') deadlineClass = 'soon-text';
            
            return `
                <li class="${rowClass}">
                    <input type="checkbox" class="task-checkbox" 
                        ${task.completed ? 'checked' : ''} 
                        onchange="toggleTask(${task.id})">
                    <div class="task-content">
                        <span class="task-text">${escapeHtml(task.text)}</span>
                        ${task.deadline ? `<span class="task-deadline ${deadlineClass}">${formatDeadline(task.deadline)}</span>` : ''}
                    </div>
                    <button class="delete-btn" onclick="deleteTask(${task.id})" title="Удалить">✕</button>
                </li>`;
        }).join('');
    }
    
    const active = tasks.filter(t => !t.completed).length;
    const overdue = tasks.filter(t => !t.completed && getDeadlineStatus(t.deadline) === 'overdue').length;
    let counterText = `Активных: ${active} из ${tasks.length}`;
    if (overdue > 0) {
        counterText += ` | <span class="overdue-count">⚠️ Просрочено: ${overdue}</span>`;
    }
    counter.innerHTML = counterText;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Enter в поле ввода
document.getElementById('taskInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addTask();
});

// Первая отрисовка
renderTasks();

// Восстанавливаем все таймеры при загрузке страницы
rescheduleAllNotifications();

// Автообновление отображения дедлайнов
setInterval(() => {
    renderTasks();
}, 30000);