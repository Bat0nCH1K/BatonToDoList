let folders = JSON.parse(localStorage.getItem('btd2_folders') || '[{"id":"all","name":"Все задачи","color":"#5c6bc0"}]');
let tasks = JSON.parse(localStorage.getItem('btd2_tasks') || '[]');
let currentFolder = 'all', editingTaskId = null, editingFolderId = null;
let calYear, calMonth, selectedDate = null;

function save() { localStorage.setItem('btd2_folders', JSON.stringify(folders)); localStorage.setItem('btd2_tasks', JSON.stringify(tasks)); }

if (!localStorage.getItem('btd_onboarded')) { document.getElementById('onboarding').classList.remove('hidden'); document.getElementById('onboarding').querySelector('h2').textContent = t('welcome'); document.getElementById('onboarding').querySelector('p').textContent = t('welcomeText'); document.getElementById('onboardingBtn').textContent = t('gotIt'); }
document.getElementById('onboardingBtn').addEventListener('click', () => { document.getElementById('onboarding').classList.add('hidden'); localStorage.setItem('btd_onboarded', '1'); });
document.getElementById('resetOnboardingBtn').addEventListener('click', () => { localStorage.removeItem('btd_onboarded'); location.reload(); });

document.getElementById('hamburgerBtn').addEventListener('click', () => { document.getElementById('sidebar').classList.toggle('active'); document.getElementById('sidebarOverlay').classList.toggle('active'); });
document.getElementById('sidebarOverlay').addEventListener('click', () => { document.getElementById('sidebar').classList.remove('active'); document.getElementById('sidebarOverlay').classList.remove('active'); });

function renderFolders() {
    document.getElementById('folderList').innerHTML = folders.map(f => `
        <div class="folder-item ${currentFolder===f.id?'active':''}" onclick="selectFolder('${f.id}')">
            <span class="folder-color" style="background:${f.color}"></span>${f.id==='all'?t('allTasks'):f.name}
            ${f.id!=='all'?`<span style="margin-left:auto;opacity:0.5;cursor:pointer;font-size:14px;" onclick="event.stopPropagation();editFolder('${f.id}')">✎</span>`:''}
        </div>`).join('');
}

function selectFolder(id) { currentFolder=id; renderFolders(); renderTasks(); document.getElementById('sidebar').classList.remove('active'); document.getElementById('sidebarOverlay').classList.remove('active'); document.getElementById('currentFolderName').textContent = (folders.find(f=>f.id===id)?.id==='all')?t('allTasks'):folders.find(f=>f.id===id)?.name||t('allTasks'); }

function deleteFolder(id) { if (id==='all') return; folders = folders.filter(f=>f.id!==id); tasks = tasks.filter(t=>t.folderId!==id); if (currentFolder===id) currentFolder='all'; save(); renderFolders(); renderTasks(); document.getElementById('currentFolderName').textContent=t('allTasks'); }

document.getElementById('addFolderBtn').addEventListener('click', () => { editingFolderId=null; document.getElementById('folderNameInput').value=''; document.getElementById('folderColor').value='#4a90d9'; document.getElementById('folderModalTitle').textContent=t('newFolder'); const delBtn=document.getElementById('deleteFolderBtn'); if(delBtn)delBtn.style.display='none'; document.getElementById('folderModal').classList.add('active'); });

function editFolder(id) {
    const folder = folders.find(f => f.id === id); if (!folder) return;
    editingFolderId = id;
    document.getElementById('folderNameInput').value = folder.name;
    document.getElementById('folderColor').value = folder.color;
    document.getElementById('folderModalTitle').textContent = t('editFolder');
    const modalContent = document.querySelector('#folderModal .modal-content');
    let delBtn = document.getElementById('deleteFolderBtn');
    if (!delBtn) { delBtn = document.createElement('button'); delBtn.id = 'deleteFolderBtn'; delBtn.className = 'btn btn-cancel'; delBtn.style.marginTop = '10px'; delBtn.onclick = () => { if (confirm(t('confirmDelete'))) { deleteFolder(editingFolderId); document.getElementById('folderModal').classList.remove('active'); } }; modalContent.appendChild(delBtn); }
    delBtn.textContent = t('deleteFolder'); delBtn.style.display = 'block';
    document.getElementById('folderModal').classList.add('active');
}

document.getElementById('saveFolderBtn').addEventListener('click', () => { const name=document.getElementById('folderNameInput').value.trim(); if(!name)return; if(editingFolderId){ const f=folders.find(f=>f.id===editingFolderId); if(f){f.name=name;f.color=document.getElementById('folderColor').value;} } else { folders.push({id:'f_'+Date.now(),name,color:document.getElementById('folderColor').value}); } save(); renderFolders(); document.getElementById('folderModal').classList.remove('active'); });
document.getElementById('cancelFolderBtn').addEventListener('click', () => { document.getElementById('folderModal').classList.remove('active'); const delBtn=document.getElementById('deleteFolderBtn'); if(delBtn)delBtn.style.display='none'; });

function renderTasks() {
    const filtered = currentFolder==='all'?tasks:tasks.filter(t=>t.folderId===currentFolder);
    if (!filtered.length) { document.getElementById('taskList').innerHTML = `<div style="text-align:center;color:var(--text-secondary);padding:40px;">${t('noTasks')}</div>`; return; }
    document.getElementById('taskList').innerHTML = filtered.map(task=>{
        const done=task.progress||0,total=task.repeat||1,pct=total>1?Math.round(done/total*100):(done>=total?100:0);
        return `<div class="task-item ${done>=total?'completed':''}" style="border-left:4px solid ${task.color||'#e94560'}">
            <input type="checkbox" class="task-checkbox" ${done>=total?'checked':''} onchange="toggleTask(${task.id})">
            <div class="task-info" onclick="openTask(${task.id})">
                <div class="task-name">${task.name}</div>
                <div class="task-meta">${task.deadline?'📅 '+new Date(task.deadline).toLocaleDateString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}${task.deadline&&new Date(task.deadline)<new Date()&&done<total?' ⚠️':''}</div>
                ${task.image?`<img src="${task.image}" class="task-image">`:''}
                ${total>1?`<div class="task-progress"><div class="task-progress-bar" style="width:${pct}%;background:${task.color}"></div></div><span style="font-size:12px;">${done}/${total}</span>`:''}
            </div>
            <button class="task-delete" onclick="event.stopPropagation();deleteTask(${task.id})">✕</button>
        </div>`;
    }).join('');
}

document.getElementById('addTaskBtn').addEventListener('click',()=>{editingTaskId=null;document.getElementById('modalTitle').textContent=t('newTask');document.getElementById('taskNameInput').value='';document.getElementById('taskColor').value='#e94560';document.getElementById('taskRepeat').value='1';document.getElementById('taskDeadline').value='';document.getElementById('taskImage').value='';document.getElementById('imagePreview').style.display='none';document.getElementById('previewDeadline').textContent='';document.getElementById('colorPreview').style.background='#e94560';document.getElementById('taskModal').classList.add('active');});
function openTask(id){const task=tasks.find(t=>t.id===id);if(!task)return;editingTaskId=id;document.getElementById('modalTitle').textContent=t('editTask');document.getElementById('taskNameInput').value=task.name;document.getElementById('taskColor').value=task.color||'#e94560';document.getElementById('taskRepeat').value=task.repeat||1;document.getElementById('taskDeadline').value=task.deadline||'';document.getElementById('previewDeadline').textContent=task.deadline?new Date(task.deadline).toLocaleDateString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';document.getElementById('colorPreview').style.background=task.color||'#e94560';if(task.image){document.getElementById('imagePreview').src=task.image;document.getElementById('imagePreview').style.display='block';}else{document.getElementById('imagePreview').style.display='none';}document.getElementById('taskModal').classList.add('active');}
document.getElementById('saveTaskBtn').addEventListener('click',async()=>{const name=document.getElementById('taskNameInput').value.trim();if(!name)return alert('Введите название');let imageData='';const imgFile=document.getElementById('taskImage').files[0];if(imgFile){imageData=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(imgFile);});}const data={name,color:document.getElementById('taskColor').value,repeat:parseInt(document.getElementById('taskRepeat').value)||1,deadline:document.getElementById('taskDeadline').value||null,image:imageData||(editingTaskId?tasks.find(t=>t.id===editingTaskId)?.image:''),folderId:currentFolder==='all'?null:currentFolder,progress:editingTaskId?tasks.find(t=>t.id===editingTaskId)?.progress||0:0};if(editingTaskId){const i=tasks.findIndex(t=>t.id===editingTaskId);if(i!==-1)tasks[i]={...tasks[i],...data};}else{tasks.push({id:Date.now(),...data});}save();renderTasks();document.getElementById('taskModal').classList.remove('active');});
document.getElementById('cancelTaskBtn').addEventListener('click',()=>document.getElementById('taskModal').classList.remove('active'));
document.getElementById('taskDeadline').addEventListener('change',function(){document.getElementById('previewDeadline').textContent=this.value?new Date(this.value).toLocaleDateString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';});
document.getElementById('taskColor').addEventListener('input',function(){document.getElementById('colorPreview').style.background=this.value;});
document.getElementById('taskImage').addEventListener('change',function(){const f=this.files[0];if(f){const fr=new FileReader();fr.onload=e=>{document.getElementById('imagePreview').src=e.target.result;document.getElementById('imagePreview').style.display='block';};fr.readAsDataURL(f);}});
function toggleTask(id){const t=tasks.find(t=>t.id===id);if(!t)return;const total=t.repeat||1;t.progress=(t.progress||0)>=total?0:(t.progress||0)+1;save();renderTasks();}
function deleteTask(id){tasks=tasks.filter(t=>t.id!==id);save();renderTasks();}

document.getElementById('calendarBtn').addEventListener('click',()=>{const now=new Date();calYear=now.getFullYear();calMonth=now.getMonth();selectedDate=null;renderCalendar();document.getElementById('calendarScreen').classList.add('active');});
document.getElementById('closeCalendarBtn').addEventListener('click',()=>{document.getElementById('calendarScreen').classList.remove('active');renderTasks();});
document.getElementById('calPrev').addEventListener('click',()=>{calMonth--;if(calMonth<0){calMonth=11;calYear--;}selectedDate=null;renderCalendar();});
document.getElementById('calNext').addEventListener('click',()=>{calMonth++;if(calMonth>11){calMonth=0;calYear++;}selectedDate=null;renderCalendar();});
function renderCalendar(){document.getElementById('calMonthYear').textContent=new Date(calYear,calMonth).toLocaleString(lang==='ru'?'ru-RU':'en-US',{month:'long'})+' '+calYear;const grid=document.getElementById('calendarGrid'),firstDay=new Date(calYear,calMonth,1).getDay()||7,days=new Date(calYear,calMonth+1,0).getDate(),today=new Date();let html='';for(let i=1;i<firstDay;i++)html+='<div class="calendar-cell"></div>';for(let d=1;d<=days;d++){const ds=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;const has=tasks.some(t=>t.deadline&&t.deadline.startsWith(ds));const isToday=today.getFullYear()===calYear&&today.getMonth()===calMonth&&today.getDate()===d;html+=`<div class="calendar-cell ${has?'has-task':''} ${isToday?'today':''} ${selectedDate===ds?'selected':''}" onclick="selectCalendarDate('${ds}')">${d}</div>`;}grid.innerHTML=html;const tld=document.getElementById('calendarTaskList');if(selectedDate){const dt=tasks.filter(t=>t.deadline&&t.deadline.startsWith(selectedDate)).sort((a,b)=>(a.deadline||'').localeCompare(b.deadline||''));tld.innerHTML=dt.length===0?`<p style="color:var(--text-secondary);text-align:center;">${t('noTasksOnDate')}</p>`:`<p style="font-weight:600;margin-bottom:8px;">${t('tasksOnDate')} ${new Date(selectedDate).toLocaleDateString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</p>`+dt.map(task=>`<div class="task-item" style="border-left:4px solid ${task.color||'#e94560'};margin-bottom:6px;" onclick="openTaskFromCalendar(${task.id})"><div class="task-info"><div class="task-name">${task.name}</div><div class="task-meta">${new Date(task.deadline).toLocaleDateString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div></div></div>`).join('');tld.innerHTML+=`<button class="btn" style="margin-top:10px;width:100%;" onclick="addTaskForDate('${selectedDate}')">+ ${t('createTask')}</button>`;}else{tld.innerHTML='';}}
function selectCalendarDate(d){selectedDate=d;renderCalendar();}
function addTaskForDate(d){document.getElementById('calendarScreen').classList.remove('active');document.getElementById('taskDeadline').value=d+'T12:00';document.getElementById('previewDeadline').textContent=new Date(d+'T12:00').toLocaleDateString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});editingTaskId=null;document.getElementById('modalTitle').textContent=t('newTask');document.getElementById('taskNameInput').value='';document.getElementById('taskColor').value='#e94560';document.getElementById('taskRepeat').value='1';document.getElementById('taskImage').value='';document.getElementById('imagePreview').style.display='none';document.getElementById('colorPreview').style.background='#e94560';document.getElementById('taskModal').classList.add('active');}
function openTaskFromCalendar(id){document.getElementById('calendarScreen').classList.remove('active');openTask(id);}

document.getElementById('statsBtn').addEventListener('click',()=>{const done=tasks.filter(t=>(t.progress||0)>=(t.repeat||1)).length;const overdue=tasks.filter(t=>t.deadline&&new Date(t.deadline)<new Date()&&(t.progress||0)<(t.repeat||1)).length;const active=tasks.length-done-overdue;document.getElementById('statDone').textContent=done;document.getElementById('statActive').textContent=Math.max(0,active);document.getElementById('statOverdue').textContent=overdue;const canvas=document.getElementById('statsChart'),ctx=canvas.getContext('2d');ctx.clearRect(0,0,220,220);const total=tasks.length||1,colors=['#4caf84','#e94560','#ff9800'],values=[done,Math.max(0,active),overdue];let start=-Math.PI/2;values.forEach((v,i)=>{const slice=(v/total)*Math.PI*2;ctx.beginPath();ctx.moveTo(110,110);ctx.arc(110,110,90,start,start+slice);ctx.fillStyle=colors[i];ctx.fill();start+=slice;});ctx.beginPath();ctx.arc(110,110,45,0,Math.PI*2);ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--bg').trim();ctx.fill();document.getElementById('statsScreen').classList.add('active');});
document.getElementById('closeStatsBtn').addEventListener('click',()=>document.getElementById('statsScreen').classList.remove('active'));
document.getElementById('settingsBtn').addEventListener('click',()=>{document.getElementById('themeSelect').value=currentTheme;document.getElementById('langSelect').value=lang;document.getElementById('settingsScreen').classList.add('active');});
document.getElementById('closeSettingsBtn').addEventListener('click',()=>document.getElementById('settingsScreen').classList.remove('active'));
document.getElementById('themeSelect').addEventListener('change',function(){currentTheme=this.value;document.body.className=currentTheme;localStorage.setItem('btd_theme',currentTheme);});
document.getElementById('langSelect').addEventListener('change',function(){lang=this.value;localStorage.setItem('btd_lang',lang);location.reload();});
document.getElementById('supportBtn').addEventListener('click',()=>window.open('https://t.me/Baton_C_H_I_K','_blank'));

function translateUI() {
    document.getElementById('currentFolderName').textContent = t('allTasks');
    document.querySelector('.sidebar-header h3').textContent = t('foldersTitle');
    document.getElementById('calendarBtn').textContent = t('calendar');
    document.getElementById('statsBtn').textContent = t('stats');
    document.getElementById('supportBtn').textContent = t('support');
    document.getElementById('settingsBtn').textContent = t('settings');
    document.getElementById('closeCalendarBtn').textContent = t('close');
    document.getElementById('closeStatsBtn').textContent = t('close');
    document.getElementById('closeSettingsBtn').textContent = t('close');
    document.getElementById('resetOnboardingBtn').textContent = t('reset');
}

translateUI();
renderFolders(); renderTasks(); document.getElementById('currentFolderName').textContent=t('allTasks');
