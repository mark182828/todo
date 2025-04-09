// تعريف المتغيرات العامة
let tasks = [];
let taskIdCounter = 0;

// الحصول على العناصر من DOM
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const tasksList = document.getElementById('tasks-list');
const resetTasksBtn = document.getElementById('reset-tasks-btn');
const clearTasksBtn = document.getElementById('clear-tasks-btn');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const taskTemplate = document.getElementById('task-template');

// تحميل المهام من التخزين المحلي عند بدء التطبيق
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    updateProgressBar();
    
    // إغلاق قوائم المهام عند النقر في أي مكان آخر
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.task-menu-btn') && !e.target.closest('.task-menu')) {
            document.querySelectorAll('.task-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
});

// إضافة مستمعي الأحداث
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});
resetTasksBtn.addEventListener('click', resetTasksStatus);
clearTasksBtn.addEventListener('click', clearAllTasks);

// وظيفة إضافة مهمة جديدة
function addTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText === '') {
        shakeElement(taskInput);
        return;
    }
    
    const taskId = taskIdCounter++;
    const newTask = {
        id: taskId,
        text: taskText,
        completionCount: 0,
        incompleted: false
    };
    
    tasks.push(newTask);
    renderTask(newTask);
    saveTasks();
    updateProgressBar();
    
    // مسح حقل الإدخال وإعادة التركيز إليه
    taskInput.value = '';
    taskInput.focus();
    
    // تمرير إلى أسفل القائمة لرؤية المهمة الجديدة
    tasksList.scrollTop = tasksList.scrollHeight;
}

// وظيفة عرض مهمة في القائمة
function renderTask(task) {
    // استنساخ قالب المهمة
    const taskElement = document.importNode(taskTemplate.content, true).querySelector('.task-item');
    
    // تعيين معرف المهمة كسمة بيانات
    taskElement.dataset.id = task.id;
    
    // تعيين نص المهمة وعداد الإنجاز
    const taskTextElement = taskElement.querySelector('.task-text');
    const taskCounterElement = taskElement.querySelector('.task-counter');
    
    taskTextElement.textContent = task.text;
    taskCounterElement.textContent = task.completionCount;
    
    // إضافة الفئات المناسبة إذا كانت المهمة مكتملة أو غير مكتملة
    if (task.completionCount > 0) {
        taskElement.classList.add('task-completed');
    } else if (task.incompleted) {
        taskElement.classList.add('task-incompleted');
    }
    
    // إضافة مستمعي الأحداث للأزرار
    const completeBtn = taskElement.querySelector('.task-complete-btn');
    const incompleteBtn = taskElement.querySelector('.task-incomplete-btn');
    const menuBtn = taskElement.querySelector('.task-menu-btn');
    const editBtn = taskElement.querySelector('.task-edit-btn');
    const deleteBtn = taskElement.querySelector('.task-delete-btn');
    const menuElement = taskElement.querySelector('.task-menu');
    
    completeBtn.addEventListener('click', () => incrementTaskCompletion(task.id));
    incompleteBtn.addEventListener('click', () => markTaskIncomplete(task.id));
    
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // إغلاق جميع القوائم المفتوحة الأخرى
        document.querySelectorAll('.task-menu.show').forEach(menu => {
            if (menu !== menuElement) {
                menu.classList.remove('show');
            }
        });
        // تبديل حالة القائمة الحالية
        menuElement.classList.toggle('show');
    });
    
    editBtn.addEventListener('click', () => {
        menuElement.classList.remove('show');
        editTask(task.id);
    });
    
    deleteBtn.addEventListener('click', () => {
        menuElement.classList.remove('show');
        deleteTask(task.id);
    });
    
    // إضافة المهمة إلى القائمة
    tasksList.appendChild(taskElement);
}

// وظيفة زيادة عداد إنجاز المهمة
function incrementTaskCompletion(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].completionCount++;
        tasks[taskIndex].incompleted = false;
        
        const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
        const taskCounterElement = taskElement.querySelector('.task-counter');
        
        taskCounterElement.textContent = tasks[taskIndex].completionCount;
        taskElement.classList.add('task-completed');
        taskElement.classList.remove('task-incompleted');
        
        // تأثير بصري للتأكيد
        taskCounterElement.classList.add('pulse');
        setTimeout(() => {
            taskCounterElement.classList.remove('pulse');
        }, 500);
        
        saveTasks();
        updateProgressBar();
    }
}

// وظيفة تحديد المهمة كغير مكتملة
function markTaskIncomplete(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].incompleted = true;
        
        const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
        taskElement.classList.remove('task-completed');
        taskElement.classList.add('task-incompleted');
        
        saveTasks();
        updateProgressBar();
    }
}

// وظيفة تعديل المهمة
function editTask(taskId) {
    const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
    const taskTextElement = taskElement.querySelector('.task-text');
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) return;
    
    // التحقق مما إذا كانت المهمة بالفعل في وضع التعديل
    if (taskElement.classList.contains('edit-mode')) {
        const editInput = taskElement.querySelector('.edit-input');
        const newText = editInput.value.trim();
        
        if (newText !== '') {
            tasks[taskIndex].text = newText;
            taskTextElement.textContent = newText;
            saveTasks();
        }
        
        // إزالة حقل الإدخال وإعادة عرض النص
        taskElement.classList.remove('edit-mode');
        editInput.remove();
        taskTextElement.style.display = 'block';
    } else {
        // إنشاء حقل إدخال للتعديل
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'edit-input';
        editInput.value = tasks[taskIndex].text;
        
        // إخفاء النص وإضافة حقل الإدخال
        taskTextElement.style.display = 'none';
        taskElement.querySelector('.task-content').appendChild(editInput);
        taskElement.classList.add('edit-mode');
        
        // تحديد النص بالكامل وتركيز حقل الإدخال
        editInput.select();
        
        // مستمعي الأحداث لحقل الإدخال
        editInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                editTask(taskId); // استدعاء الوظيفة مرة أخرى لحفظ التغييرات
            }
        });
        
        editInput.addEventListener('blur', () => {
            editTask(taskId); // حفظ التغييرات عند فقدان التركيز
        });
    }
}

// وظيفة حذف المهمة
function deleteTask(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        tasks.splice(taskIndex, 1);
        
        const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
        taskElement.classList.add('fade-out');
        
        // إزالة العنصر بعد انتهاء التأثير
        setTimeout(() => {
            taskElement.remove();
        }, 300);
        
        saveTasks();
        updateProgressBar();
    }
}

// وظيفة إعادة تعيين حالة جميع المهام
function resetTasksStatus() {
    if (tasks.length === 0) return;
    
    tasks.forEach(task => {
        task.completionCount = 0;
        task.incompleted = false;
    });
    
    // تحديث واجهة المستخدم
    document.querySelectorAll('.task-item').forEach(taskElement => {
        taskElement.classList.remove('task-completed', 'task-incompleted');
        const taskCounter = taskElement.querySelector('.task-counter');
        taskCounter.textContent = '0';
    });
    
    saveTasks();
    updateProgressBar();
    
    // إظهار تأثير بصري للتأكيد
    const container = document.querySelector('.app-container');
    container.classList.add('reset-flash');
    setTimeout(() => {
        container.classList.remove('reset-flash');
    }, 300);
}

// وظيفة حذف جميع المهام
function clearAllTasks() {
    if (tasks.length === 0) return;
    
    if (confirm('هل أنت متأكد من حذف جميع المهام؟')) {
        tasks = [];
        tasksList.innerHTML = '';
        saveTasks();
        updateProgressBar();
    }
}

// وظيفة تحديث شريط التقدم
function updateProgressBar() {
    if (tasks.length === 0) {
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        return;
    }
    
    // حساب نسبة المهام التي تم إنجازها مرة واحدة على الأقل
    const completedCount = tasks.filter(task => task.completionCount > 0).length;
    const progressPercentage = Math.round((completedCount / tasks.length) * 100);
    
    progressBar.style.width = `${progressPercentage}%`;
    progressText.textContent = `${progressPercentage}%`;
    
    // تغيير لون شريط التقدم بناءً على النسبة المئوية
    if (progressPercentage < 30) {
        progressBar.style.backgroundColor = 'var(--danger-color)';
    } else if (progressPercentage < 70) {
        progressBar.style.backgroundColor = 'var(--warning-color)';
    } else {
        progressBar.style.backgroundColor = 'var(--success-color)';
    }
}

// وظائف التخزين المحلي
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('taskIdCounter', taskIdCounter);
}

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    const savedCounter = localStorage.getItem('taskIdCounter');
    
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        
        // تحديث نموذج البيانات القديم إذا لزم الأمر
        tasks.forEach(task => {
            if (task.completed && !('completionCount' in task)) {
                task.completionCount = 1;
                delete task.completed;
            } else if (!('completionCount' in task)) {
                task.completionCount = 0;
            }
        });
        
        // عرض المهام المحفوظة
        tasksList.innerHTML = '';
        tasks.forEach(task => renderTask(task));
    }
    
    if (savedCounter) {
        taskIdCounter = parseInt(savedCounter);
    }
}

// وظيفة مساعدة لتأثير الاهتزاز
function shakeElement(element) {
    element.classList.add('shake');
    setTimeout(() => {
        element.classList.remove('shake');
    }, 500);
}

// إضافة تأثيرات CSS إضافية
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    .shake {
        animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }
    
    @keyframes fade-out {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
    }
    
    .fade-out {
        animation: fade-out 0.3s ease forwards;
    }
    
    @keyframes reset-flash {
        0% { background-color: var(--card-bg); }
        50% { background-color: rgba(241, 250, 140, 0.2); }
        100% { background-color: var(--card-bg); }
    }
    
    .reset-flash {
        animation: reset-flash 0.3s ease;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); background-color: var(--success-color); }
        100% { transform: scale(1); }
    }
    
    .pulse {
        animation: pulse 0.5s ease;
    }
`;
document.head.appendChild(style);
