const STORAGE_KEY = 'taskflow_tasks';

const taskForm = document.querySelector('#taskForm');
const taskInput = document.querySelector('#taskInput');
const errorMessage = document.querySelector('#errorMessage');
const taskList = document.querySelector('#taskList');
const emptyState = document.querySelector('#emptyState');
const deleteAllBtn = document.querySelector('#deleteAllBtn');
const loadingState = document.querySelector('#loadingState');
const storageStatus = document.querySelector('#storageStatus');
const totalCount = document.querySelector('#totalCount');
const doneCount = document.querySelector('#doneCount');
const pendingCount = document.querySelector('#pendingCount');

let tasks = loadTasks();
let isDeletingAll = false;

function loadTasks() {
  const savedTasks = localStorage.getItem(STORAGE_KEY);

  if (!savedTasks) return [];

  try {
    return JSON.parse(savedTasks);
  } catch (error) {
    console.error('Unable to parse saved tasks:', error);
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  storageStatus.textContent = `Saved ${tasks.length} task${tasks.length === 1 ? '' : 's'} in Local Storage.`;
}

function createTask(name) {
  return {
    id: crypto.randomUUID(),
    name,
    isDone: false,
    createdAt: new Date().toISOString()
  };
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
  taskInput.classList.add('border-rose-300', 'focus:border-rose-300', 'focus:ring-rose-500/20');
}

function clearError() {
  errorMessage.textContent = '';
  errorMessage.classList.add('hidden');
  taskInput.classList.remove('border-rose-300', 'focus:border-rose-300', 'focus:ring-rose-500/20');
}

function addTask(event) {
  event.preventDefault();

  const taskName = taskInput.value.trim();

  if (!taskName) {
    showError('Please enter a task before submitting.');
    return;
  }

  tasks = [createTask(taskName), ...tasks];
  taskInput.value = '';
  clearError();
  saveTasks();
  renderTasks();
}

function toggleTaskDone(id) {
  tasks = tasks.map((task) => (
    task.id === id ? { ...task, isDone: !task.isDone } : task
  ));

  saveTasks();
  renderTasks();
}

function updateTaskName(id, newName) {
  const cleanName = newName.trim();

  if (!cleanName) {
    alert('Task name cannot be empty.');
    renderTasks();
    return;
  }

  tasks = tasks.map((task) => (
    task.id === id ? { ...task, name: cleanName } : task
  ));

  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

function deleteAllTasksAsync() {
  if (tasks.length === 0 || isDeletingAll) return;

  isDeletingAll = true;
  loadingState.classList.remove('hidden');
  deleteAllBtn.disabled = true;
  deleteAllBtn.textContent = 'Deleting...';

  setTimeout(() => {
    tasks = [];
    saveTasks();
    renderTasks();

    isDeletingAll = false;
    loadingState.classList.add('hidden');
    deleteAllBtn.disabled = false;
    deleteAllBtn.textContent = 'Delete All';
  }, 2000);
}

function updateStats() {
  const done = tasks.filter((task) => task.isDone).length;
  const pending = tasks.length - done;

  totalCount.textContent = tasks.length;
  doneCount.textContent = done;
  pendingCount.textContent = pending;
  emptyState.classList.toggle('hidden', tasks.length > 0);
  deleteAllBtn.disabled = tasks.length === 0 || isDeletingAll;
}

function renderTasks() {
  taskList.innerHTML = '';

  tasks.forEach((task) => {
    const taskItem = document.createElement('li');
    taskItem.className = `rounded-2xl border p-4 transition ${
      task.isDone
        ? 'border-emerald-300/20 bg-emerald-300/10'
        : 'border-white/10 bg-slate-950/50 hover:border-indigo-300/30'
    }`;

    const row = document.createElement('div');
    row.className = 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between';

    const left = document.createElement('div');
    left.className = 'flex min-w-0 items-start gap-3';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.isDone;
    checkbox.className = 'mt-1 h-5 w-5 rounded border-white/20 bg-slate-900 text-indigo-500 focus:ring-indigo-400';
    checkbox.setAttribute('aria-label', `Mark ${task.name} as done`);
    checkbox.addEventListener('change', () => toggleTaskDone(task.id));

    const textBox = document.createElement('div');
    textBox.className = 'min-w-0';

    const taskName = document.createElement('p');
    taskName.className = `break-words text-base font-semibold ${task.isDone ? 'text-emerald-100 line-through decoration-2' : 'text-white'}`;
    taskName.textContent = task.name;

    const date = document.createElement('p');
    date.className = 'mt-1 text-xs text-slate-500';
    date.textContent = `Created ${new Date(task.createdAt).toLocaleString()}`;

    textBox.append(taskName, date);
    left.append(checkbox, textBox);

    const actions = document.createElement('div');
    actions.className = 'flex shrink-0 gap-2';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'rounded-xl border border-indigo-300/30 bg-indigo-400/10 px-3 py-2 text-sm font-bold text-indigo-100 transition hover:bg-indigo-400/20';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => {
      const nextName = prompt('Update task name:', task.name);
      if (nextName !== null) updateTaskName(task.id, nextName);
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'rounded-xl border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-sm font-bold text-rose-100 transition hover:bg-rose-400/20';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteTask(task.id));

    actions.append(editButton, deleteButton);
    row.append(left, actions);
    taskItem.append(row);
    taskList.append(taskItem);
  });

  updateStats();
}

taskForm.addEventListener('submit', addTask);
taskInput.addEventListener('input', clearError);
deleteAllBtn.addEventListener('click', deleteAllTasksAsync);

saveTasks();
renderTasks();
