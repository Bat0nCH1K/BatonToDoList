const L = {
    ru: {
        welcome: '👋 Добро пожаловать в BatonToDoList!',
        welcomeText: 'Здесь ты можешь создавать папки для задач, добавлять задачи с дедлайнами, счётчиком повторений и картинками. Нажми ☰ чтобы открыть папки. Нажми 📅 чтобы посмотреть календарь. Нажми 📊 чтобы увидеть статистику. Удачи!',
        gotIt: 'Понятно!',
        newTask: 'Новая задача', editTask: 'Редактировать', save: 'Сохранить', cancel: 'Отмена',
        allTasks: 'Все задачи', noTasks: 'Нет задач. Нажми + чтобы добавить.',
        newFolder: 'Новая папка', editFolder: 'Редактировать папку', createTask: 'Создать задачу',
        tasksOnDate: 'Задачи на', noTasksOnDate: 'Нет задач на этот день',
        stats: '📊 Статистика', done: '✅ Сделано', active: '📋 Активно', overdue: '⏰ Просрочено',
        settings: '⚙️ Настройки', theme: 'Тема', light: 'Светлая', dark: 'Тёмная',
        lang: 'Язык', reset: 'Пройти обучение заново', close: 'Закрыть',
        foldersTitle: '📁 Папки', calendar: '📅 Календарь', support: '💬 Поддержка',
        taskName: 'Название задачи', repeat: '🔢 Количество раз', deadline: '📅 Дедлайн',
        color: '🎨 Цвет', image: '🖼 Картинка',
        deleteFolder: '🗑 Удалить папку', confirmDelete: 'Удалить папку и все задачи в ней?',

        // Новое: выполненные
        completed: '✅ Выполненные',
        noCompleted: 'Нет выполненных задач.',

        // Новое: напоминания
        reminder: '🔔 Напомнить',
        reminderNever: 'Не напоминать',
        reminderHour: 'За 1 час',
        reminder3h: 'За 3 часа',
        reminder6h: 'За 6 часов',
        reminder12h: 'За 12 часов',
        reminderDay: 'За 1 день',
        reminder2d: 'За 2 дня',
        notifTitle: 'BatonToDoList',
        notifBody: 'Дедлайн задачи:',
        notifDenied: 'Уведомления запрещены. Разрешите их в настройках браузера.'
    },
    en: {
        welcome: '👋 Welcome to BatonToDoList!',
        welcomeText: 'Here you can create folders for tasks, add tasks with deadlines, repeat counters and images. Press ☰ to open folders. Press 📅 to view calendar. Press 📊 to see statistics. Good luck!',
        gotIt: 'Got it!',
        newTask: 'New task', editTask: 'Edit', save: 'Save', cancel: 'Cancel',
        allTasks: 'All tasks', noTasks: 'No tasks. Press + to add.',
        newFolder: 'New folder', editFolder: 'Edit folder', createTask: 'Create task',
        tasksOnDate: 'Tasks on', noTasksOnDate: 'No tasks on this day',
        stats: '📊 Statistics', done: '✅ Done', active: '📋 Active', overdue: '⏰ Overdue',
        settings: '⚙️ Settings', theme: 'Theme', light: 'Light', dark: 'Dark',
        lang: 'Language', reset: 'Show onboarding again', close: 'Close',
        foldersTitle: '📁 Folders', calendar: '📅 Calendar', support: '💬 Support',
        taskName: 'Task name', repeat: '🔢 Times', deadline: '📅 Deadline',
        color: '🎨 Color', image: '🖼 Image',
        deleteFolder: '🗑 Delete folder', confirmDelete: 'Delete folder and all tasks in it?',

        completed: '✅ Completed',
        noCompleted: 'No completed tasks.',

        reminder: '🔔 Remind me',
        reminderNever: 'Do not remind',
        reminderHour: 'In 1 hour',
        reminder3h: 'In 3 hours',
        reminder6h: 'In 6 hours',
        reminder12h: 'In 12 hours',
        reminderDay: 'In 1 day',
        reminder2d: 'In 2 days',
        notifTitle: 'BatonToDoList',
        notifBody: 'Task deadline:',
        notifDenied: 'Notifications are blocked. Allow them in browser settings.'
    }
};
let lang = localStorage.getItem('btd_lang') || 'ru';
function t(key) { return L[lang][key] || key; }
let currentTheme = localStorage.getItem('btd_theme') || 'light';
document.body.className = currentTheme;
