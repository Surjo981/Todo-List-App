const urlParams = new URLSearchParams(window.location.search);
const listName = urlParams.get('name');

const listTitle = document.getElementById('list-name');
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

listTitle.textContent = listName;
document.title = `${listName} - Ultra To-Do List`;

let lists = JSON.parse(localStorage.getItem('lists')) || {};
let currentList = lists[listName] || [];

// Touch/swipe detection variables
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let isSwiping = false;
let currentSwipedItem = null;

// Detect if device is mobile/tablet
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
         ('ontouchstart' in window) || 
         (navigator.maxTouchPoints > 0) ||
         window.innerWidth <= 768;
}

todoForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const taskText = todoInput.value.trim();
  if (!taskText) return;

  const taskObj = { 
    text: taskText, 
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  currentList.push(taskObj);
  saveList();
  addTaskToDOM(taskObj);
  todoInput.value = '';
  updateProgress();
});

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function handleSwipeStart(e, item, taskObj) {
  if (!isMobileDevice()) return;
  
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  isSwiping = false;
  currentSwipedItem = item;
  
  // Reset any existing transforms
  item.style.transform = 'translateX(0px)';
  item.style.transition = 'none';
}

function handleSwipeMove(e, item, taskObj) {
  if (!isMobileDevice() || currentSwipedItem !== item) return;
  
  const touch = e.touches[0];
  touchEndX = touch.clientX;
  touchEndY = touch.clientY;
  
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  
  // Check if this is a horizontal swipe (not vertical scroll)
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
    isSwiping = true;
    e.preventDefault(); // Prevent scrolling
    
    // Limit swipe distance
    const maxSwipe = 120;
    const limitedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
    
    item.style.transform = `translateX(${limitedDelta}px)`;
    
    // Visual feedback for swipe direction
    if (limitedDelta > 30) {
      // Edit swipe (left to right)
      item.style.backgroundColor = 'rgba(240, 170, 58, 0.3)';
    } else if (limitedDelta < -30) {
      // Delete swipe (right to left)
      item.style.backgroundColor = 'rgba(192, 57, 43, 0.3)';
    } else {
      item.style.backgroundColor = 'var(--item)';
    }
  }
}

function handleSwipeEnd(e, item, taskObj) {
  if (!isMobileDevice() || currentSwipedItem !== item || !isSwiping) {
    return;
  }
  
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  
  // Only process if it's a horizontal swipe
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    const minSwipeDistance = 60;
    
    if (deltaX > minSwipeDistance) {
      // Left to right swipe - EDIT
      handleEdit(taskObj, item);
    } else if (deltaX < -minSwipeDistance) {
      // Right to left swipe - DELETE
      handleDelete(taskObj, item);
    }
  }
  
  // Reset item position and style
  item.style.transition = 'all 0.3s ease';
  item.style.transform = 'translateX(0px)';
  item.style.backgroundColor = 'var(--item)';
  
  // Clear swipe state
  isSwiping = false;
  currentSwipedItem = null;
}

function handleEdit(taskObj, item) {
  const span = item.querySelector('span');
  const newText = prompt("Edit your task:", span.textContent);
  if (newText !== null && newText.trim() !== "") {
    span.textContent = newText.trim();
    taskObj.text = newText.trim();
    saveList();
    
    // Show feedback
    showSwipeFeedback(item, '✏️ Edited', '#f0aa3aff');
  }
}

function handleDelete(taskObj, item) {
  if (confirm('Delete this task?')) {
    todoList.removeChild(item);
    currentList = currentList.filter(t => t !== taskObj);
    saveList();
    updateProgress();
    
    // Show feedback before removal
    showSwipeFeedback(item, '🗑️ Deleted', '#c0392b');
  }
}

function showSwipeFeedback(item, message, color) {
  const feedback = document.createElement('div');
  feedback.textContent = message;
  feedback.style.position = 'fixed';
  feedback.style.top = '50%';
  feedback.style.left = '50%';
  feedback.style.transform = 'translate(-50%, -50%)';
  feedback.style.backgroundColor = color;
  feedback.style.color = 'white';
  feedback.style.padding = '10px 20px';
  feedback.style.borderRadius = '20px';
  feedback.style.fontSize = '14px';
  feedback.style.fontWeight = 'bold';
  feedback.style.zIndex = '10000';
  feedback.style.opacity = '0';
  feedback.style.transition = 'opacity 0.3s ease';
  
  document.body.appendChild(feedback);
  
  // Animate in
  setTimeout(() => {
    feedback.style.opacity = '1';
  }, 10);
  
  // Remove after 1.5 seconds
  setTimeout(() => {
    feedback.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(feedback)) {
        document.body.removeChild(feedback);
      }
    }, 300);
  }, 1500);
}

function addTaskToDOM(taskObj) {
  const item = document.createElement('li');
  item.style.display = 'flex';
  item.style.flexDirection = 'column';
  item.style.marginBottom = '8px';
  item.style.padding = '12px';
  item.style.borderRadius = '8px';
  item.style.backgroundColor = 'var(--item)';
  item.style.transition = 'all 0.3s ease';
  item.style.position = 'relative';
  item.style.overflow = 'hidden';

  // Add swipe hint for mobile
  if (isMobileDevice()) {
    item.style.cursor = 'grab';
    
    // Add subtle visual hint
    const swipeHint = document.createElement('div');
    swipeHint.innerHTML = '← Swipe to edit • Swipe to delete →';
    swipeHint.style.position = 'absolute';
    swipeHint.style.top = '50%';
    swipeHint.style.left = '50%';
    swipeHint.style.transform = 'translate(-50%, -50%)';
    swipeHint.style.fontSize = '11px';
    swipeHint.style.color = '#888';
    swipeHint.style.opacity = '0';
    swipeHint.style.pointerEvents = 'none';
    swipeHint.style.transition = 'opacity 0.3s ease';
    swipeHint.style.textAlign = 'center';
    swipeHint.style.whiteSpace = 'nowrap';
    item.appendChild(swipeHint);
  }

  // Top row: complete-btn, task-name, and edit/delete buttons for desktop
  const topRow = document.createElement('div');
  topRow.style.display = 'flex';
  topRow.style.alignItems = 'flex-start';
  topRow.style.gap = '8px';
  topRow.style.width = '100%';
  topRow.style.position = 'relative';
  topRow.style.zIndex = '1';

  const span = document.createElement('span');
  span.textContent = taskObj.text;
  span.classList.toggle('completed', taskObj.completed);
  span.style.wordBreak = 'break-word';
  span.style.lineHeight = '1.4';
  span.style.paddingTop = '6px';
  span.style.paddingRight = '8px';
  span.style.flex = '1';

  // Timestamp display
  const timestampDiv = document.createElement('div');
  timestampDiv.style.fontSize = '0.75em';
  timestampDiv.style.color = '#888';
  timestampDiv.style.marginTop = '8px';
  timestampDiv.style.textAlign = 'right';
  timestampDiv.style.width = '100%';
  timestampDiv.style.paddingRight = '0px';
  
  if (taskObj.completed && taskObj.completedAt) {
    timestampDiv.innerHTML = `<i class="fa-solid fa-check"></i> ${formatTimestamp(taskObj.completedAt)}`;
    timestampDiv.style.color = 'var(--green)';
  } else {
    timestampDiv.innerHTML = `<i class="fa-solid fa-calendar-days"></i> ${formatTimestamp(taskObj.createdAt)}`;
  }

  const completeBtn = document.createElement('button');
  completeBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
  completeBtn.style.backgroundColor = 'var(--green)';
  completeBtn.style.borderRadius = '6px';
  completeBtn.style.border = 'none';
  completeBtn.style.flexShrink = '0';
  completeBtn.style.padding = '8px';
  completeBtn.style.cursor = 'pointer';
  completeBtn.onclick = function() {
    taskObj.completed = !taskObj.completed;
    
    if (taskObj.completed) {
      taskObj.completedAt = new Date().toISOString();
      timestampDiv.innerHTML = `<i class="fa-solid fa-check"></i> ${formatTimestamp(taskObj.completedAt)}`;
      timestampDiv.style.color = 'var(--green)';
    } else {
      taskObj.completedAt = null;
      timestampDiv.innerHTML = `<i class="fa-solid fa-calendar-days"></i> ${formatTimestamp(taskObj.createdAt)}`;
      timestampDiv.style.color = '#888';
    }
    
    span.classList.toggle('completed', taskObj.completed);
    saveList();
    
    setTimeout(() => {
      updateProgress();
      checkIfAllCompleted();
    }, 50);
  };

  // Add edit and delete buttons only for desktop
  if (!isMobileDevice()) {
    const editBtn = document.createElement("button");
    editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
    editBtn.style.backgroundColor = '#f0aa3aff';
    editBtn.style.borderRadius = '6px';
    editBtn.style.border = 'none';
    editBtn.style.flexShrink = '0';
    editBtn.style.padding = '8px';
    editBtn.style.cursor = 'pointer';
    editBtn.onclick = function() {
      handleEdit(taskObj, item);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteBtn.style.backgroundColor = '#c0392b';
    deleteBtn.style.borderRadius = '6px';
    deleteBtn.style.border = 'none';
    deleteBtn.style.flexShrink = '0';
    deleteBtn.style.padding = '8px';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.onclick = function() {
      handleDelete(taskObj, item);
    };

    topRow.appendChild(completeBtn);
    topRow.appendChild(span);
    topRow.appendChild(editBtn);
    topRow.appendChild(deleteBtn);
  } else {
    // Mobile layout - only complete button and text
    topRow.appendChild(completeBtn);
    topRow.appendChild(span);
    
    // Add touch event listeners for mobile
    item.addEventListener('touchstart', (e) => handleSwipeStart(e, item, taskObj), { passive: false });
    item.addEventListener('touchmove', (e) => handleSwipeMove(e, item, taskObj), { passive: false });
    item.addEventListener('touchend', (e) => handleSwipeEnd(e, item, taskObj), { passive: false });
    
    // Prevent context menu on mobile
    item.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Assemble the entire item
  item.appendChild(topRow);
  item.appendChild(timestampDiv);
  todoList.appendChild(item);
}

function saveList() {
  lists[listName] = currentList;
  localStorage.setItem('lists', JSON.stringify(lists));
}

function checkIfAllCompleted() {
  const allDone = currentList.length > 0 && currentList.every(t => t.completed);
  if (allDone && Notification.permission === 'granted') {
    new Notification('✅ List Completed', { body: `${listName} is fully completed! 🎉`});
  }
}

if (Notification.permission !== 'granted') {
  Notification.requestPermission();
}

// Enhanced progress functionality
function updateProgress() {
  let progressDisplay = document.getElementById("progress-display");
  
  if (!progressDisplay) {
    progressDisplay = document.createElement("div");
    progressDisplay.id = "progress-display";
    progressDisplay.style.margin = "15px 0";
    progressDisplay.style.padding = "15px";
    progressDisplay.style.borderRadius = "8px";
    progressDisplay.style.backgroundColor = "var(--item)";
    progressDisplay.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
    
    const todoContainer = todoList.parentNode;
    todoContainer.insertBefore(progressDisplay, todoList);
  }
  
  const totalTasks = currentList.length;
  const completedTasks = currentList.filter(task => task.completed).length;
  
  if (totalTasks === 0) {
    progressDisplay.innerHTML = `<div style="text-align: center; color: #888;">
    <img src="https://ultratodolist.pages.dev/no-task.svg" alt="No tasks" style="max-width: 300px; height: auto;" />
    <h4 style="margin: 0px; padding: 0px;"> No tasks yet.</h4>
    <small>Add tasks to get started${isMobileDevice() ? '<br>📱 Swipe tasks left/right to edit/delete' : ''}</small>
    </div>`;
    return;
  }

  const percentage = Math.round((completedTasks / totalTasks) * 100);
  
  const progressHTML = `
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
      <div style="flex: 1; background: rgba(255,255,255,0.1); border-radius: 10px; height: 10px; overflow: hidden; min-width: 100px;">
        <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, #41b945ff, #64f368ff); transition: width 0.3s ease; border-radius: 10px;"></div>
      </div>
      <span style="font-weight: bold; min-width: 45px; font-size: 0.9em;">${percentage}%</span>
    </div>
    <div style="text-align: center; font-size: 0.85em;">
      ${completedTasks} of ${totalTasks} tasks completed
      ${isMobileDevice() ? '<br><small style="color: #888; font-size: 0.75em;">💡 Swipe ← to edit • Swipe → to delete</small>' : ''}
      ${completedTasks > 0 && completedTasks < totalTasks ? `<br><small style="color: #888; font-size: 0.8em;">Keep it up! 💪</small>` : ''}
      ${completedTasks === totalTasks ? `<br><small style="color: var(--green); font-size: 0.8em;">All done! 🎉</small>` : ''}
    </div>
  `;
  
  progressDisplay.innerHTML = progressHTML;

  if (completedTasks === totalTasks && totalTasks > 0) {
    progressDisplay.style.color = "var(--green)";
  } else {
    progressDisplay.style.color = "var(--text-color)";
  }
}

// Load existing tasks and update progress
currentList.forEach(addTaskToDOM);
updateProgress();

// Import/Export functionality with Real File Share
function exportCurrentList() {
  const listData = {
    exportType: 'single_list',
    listName: listName,
    tasks: currentList,
    exportedAt: new Date().toISOString(),
    totalTasks: currentList.length,
    completedTasks: currentList.filter(task => task.completed).length
  };
  
  const dataStr = JSON.stringify(listData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const fileName = `${listName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showSharePopup('single', fileName, dataBlob);
  
  if (Notification.permission === 'granted') {
    new Notification('📤 List Exported', { 
      body: `${listName} exported successfully!` 
    });
  }
}

function exportAllLists() {
  const allLists = JSON.parse(localStorage.getItem('lists')) || {};
  
  if (Object.keys(allLists).length === 0) {
    alert('No lists found to export!');
    return;
  }
  
  let totalTasks = 0;
  let totalCompleted = 0;
  const listStats = {};
  
  Object.entries(allLists).forEach(([name, tasks]) => {
    const completed = tasks.filter(task => task.completed).length;
    totalTasks += tasks.length;
    totalCompleted += completed;
    listStats[name] = {
      total: tasks.length,
      completed: completed,
      pending: tasks.length - completed
    };
  });
  
  const exportData = {
    exportType: 'complete_lists',
    exportedAt: new Date().toISOString(),
    totalLists: Object.keys(allLists).length,
    totalTasks: totalTasks,
    totalCompleted: totalCompleted,
    statistics: listStats,
    lists: allLists
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const fileName = `all_todo_lists_${new Date().toISOString().split('T')[0]}.json`;
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showSharePopup('all', fileName, dataBlob);
  
  const message = `📤 All Lists Exported!\n\n• ${Object.keys(allLists).length} lists\n• ${totalTasks} total tasks\n• ${totalCompleted} completed tasks`;
  alert(message);
  
  if (Notification.permission === 'granted') {
    new Notification('📤 All Lists Exported', { 
      body: `${Object.keys(allLists).length} lists with ${totalTasks} tasks exported!` 
    });
  }
}

function showSharePopup(exportType, fileName, fileBlob) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  overlay.style.zIndex = '10000';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  
  const popup = document.createElement('div');
  popup.style.backgroundColor = '#2c3e50';
  popup.style.borderRadius = '12px';
  popup.style.padding = '25px';
  popup.style.maxWidth = '400px';
  popup.style.width = '90%';
  popup.style.color = 'white';
  popup.style.textAlign = 'center';
  popup.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
  
  const title = document.createElement('h3');
  title.textContent = '📤 Your todo list file has been saved!';
  title.style.margin = '0 0 20px 0';
  title.style.color = '#ecf0f1';
  
  const desc = document.createElement('p');
  desc.innerHTML = exportType === 'all' 
    ? `Your complete todo lists have been saved as <strong>${fileName}</strong>. Share this file directly!` 
    : `Your "${listName}" list has been saved as <strong>${fileName}</strong>.`;
  desc.style.margin = '0 0 25px 0';
  desc.style.color = '#bdc3c7';
  desc.style.lineHeight = '1.4';
  
  const shareContainer = document.createElement('div');
  shareContainer.style.display = 'grid';
  shareContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(100px, 1fr))';
  shareContainer.style.gap = '12px';
  shareContainer.style.marginBottom = '20px';
  
  const shareOptions = [{
    name: 'Download Again',
    icon: '💾',
    color: '#34acdbff',
    width: '120px',
    action: () => downloadFileAgain(fileName, fileBlob)
  }];
  
  shareOptions.forEach(option => {
    const btn = document.createElement('button');
    btn.innerHTML = `${option.icon}<br><span style="font-size: 11px;">${option.name}</span>`;
    btn.style.backgroundColor = option.color;
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '8px';
    btn.style.padding = '12px 8px';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '14px';
    btn.style.fontWeight = 'bold';
    btn.style.transition = 'transform 0.2s';
    btn.style.minHeight = '70px';
    btn.onmouseenter = function() { this.style.transform = 'scale(1.05)'; };
    btn.onmouseleave = function() { this.style.transform = 'scale(1)'; };
    btn.onclick = option.action;
    shareContainer.appendChild(btn);
  });
  
  const instructions = document.createElement('p');
  instructions.innerHTML = '💡 <strong>Tip:</strong> The file has been downloaded to your device. You can share it from your Downloads folder.';
  instructions.style.fontSize = '12px';
  instructions.style.color = '#7f8c8d';
  instructions.style.margin = '15px 0';
  instructions.style.lineHeight = '1.3';
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.backgroundColor = '#e74c3c';
  closeBtn.style.color = 'white';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '6px';
  closeBtn.style.padding = '12px 30px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontSize = '14px';
  closeBtn.style.fontWeight = 'bold';
  closeBtn.onclick = () => document.body.removeChild(overlay);
  
  popup.appendChild(title);
  popup.appendChild(desc);
  popup.appendChild(shareContainer);
  popup.appendChild(instructions);
  popup.appendChild(closeBtn);
  overlay.appendChild(popup);
  
  overlay.onclick = function(e) {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  };
  
  document.body.appendChild(overlay);
}

function downloadFileAgain(fileName, fileBlob) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(fileBlob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  alert(`💾 File "${fileName}" downloaded again!`);
}

function importList() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.style.display = 'none';
  
  input.onchange = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const importedData = JSON.parse(e.target.result);
        
        if (!importedData.tasks || !Array.isArray(importedData.tasks)) {
          alert('Invalid file format. Please select a valid todo list export file.');
          return;
        }
        
        const confirmMessage = `Import "${importedData.listName || 'Unknown'}" list?\n\nThis will replace current list with:\n- ${importedData.totalTasks || importedData.tasks.length} tasks\n- ${importedData.completedTasks || importedData.tasks.filter(t => t.completed).length} completed tasks\n\nCurrent list will be lost!`;
        
        if (confirm(confirmMessage)) {
          const processedTasks = importedData.tasks.map(task => ({
            text: task.text || 'Imported Task',
            completed: task.completed || false,
            createdAt: task.createdAt || new Date().toISOString(),
            completedAt: task.completedAt || null
          }));
          
          currentList = processedTasks;
          saveList();
          
          todoList.innerHTML = '';
          currentList.forEach(addTaskToDOM);
          updateProgress();
          
          if (Notification.permission === 'granted') {
            new Notification('📥 List Imported', { 
              body: `${importedData.listName || 'List'} imported successfully!` 
            });
          }
          
          alert(`Successfully imported ${processedTasks.length} tasks!`);
        }
      } catch (error) {
        alert('Error reading file. Please make sure it\'s a valid JSON file.');
        console.error('Import error:', error);
      }
    };
    
    reader.readAsText(file);
  };
  
  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

function createImportExportButtons() {
  if (document.getElementById('export-btn')) return;
  
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '10px';
  buttonContainer.style.margin = '15px 0';
  buttonContainer.style.justifyContent = 'center';
  buttonContainer.style.flexWrap = 'wrap';
  
  const exportCurrentBtn = document.createElement('button');
  exportCurrentBtn.id = 'export-btn';
  exportCurrentBtn.innerHTML = '📤 Export This List';
  exportCurrentBtn.style.backgroundColor = '#2980b9';
  exportCurrentBtn.style.color = 'white';
  exportCurrentBtn.style.border = 'none';
  exportCurrentBtn.style.padding = '10px 16px';
  exportCurrentBtn.style.borderRadius = '6px';
  exportCurrentBtn.style.cursor = 'pointer';
  exportCurrentBtn.style.fontSize = '13px';
  exportCurrentBtn.style.fontWeight = 'bold';
  exportCurrentBtn.onclick = exportCurrentList;
  
  const exportAllBtn = document.createElement('button');
  exportAllBtn.id = 'export-all-btn';
  exportAllBtn.innerHTML = '📦 Export All Lists';
  exportAllBtn.style.backgroundColor = '#e74c3c';
  exportAllBtn.style.color = 'white';
  exportAllBtn.style.border = 'none';
  exportAllBtn.style.padding = '10px 16px';
  exportAllBtn.style.borderRadius = '6px';
  exportAllBtn.style.cursor = 'pointer';
  exportAllBtn.style.fontSize = '13px';
  exportAllBtn.style.fontWeight = 'bold';
  exportAllBtn.onclick = exportAllLists;
  
  const importBtn = document.createElement('button');
  importBtn.id = 'import-btn';
  importBtn.innerHTML = '📥 Import List';
  importBtn.style.backgroundColor = '#27ae60';
  importBtn.style.color = 'white';
  importBtn.style.border = 'none';
  importBtn.style.padding = '10px 16px';
  importBtn.style.borderRadius = '6px';
  importBtn.style.cursor = 'pointer';
  importBtn.style.fontSize = '13px';
  importBtn.style.fontWeight = 'bold';
  importBtn.onclick = importList;
  
  buttonContainer.appendChild(exportCurrentBtn);
  buttonContainer.appendChild(exportAllBtn);
  buttonContainer.appendChild(importBtn);
  
  const progressDisplay = document.getElementById('progress-display');
  if (progressDisplay && progressDisplay.parentNode) {
    progressDisplay.parentNode.insertBefore(buttonContainer, progressDisplay.nextSibling);
  } else {
    const todoContainer = todoList.parentNode;
    todoContainer.insertBefore(buttonContainer, todoList);
  }
}

createImportExportButtons();

// Fullscreen functionality
const fullscreenBtn = document.getElementById('fullscreen-btn');

fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      alert(`Error attempting to enable full-screen mode: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
});

// Update timestamps every minute
setInterval(() => {
  currentList.forEach((task, index) => {
    const taskItems = document.querySelectorAll('#todo-list li');
    const timestampDiv = taskItems[index]?.querySelector('div:last-child');
    
    if (timestampDiv && task) {
      if (task.completed && task.completedAt) {
        timestampDiv.innerHTML = `✅ ${formatTimestamp(task.completedAt)}`;
      } else {
        timestampDiv.innerHTML = `📝 ${formatTimestamp(task.createdAt)}`;
      }
    }
  });
}, 60000); // Update every minute

// Loader functionality
window.addEventListener("load", function () {
  document.getElementById("loader").style.display = "none";
  document.getElementById("main-content").style.display = "block";
});

window.addEventListener("beforeunload", function () {
  document.getElementById("loader").style.display = "block";
  document.getElementById("main-content").style.display = "none";
});

window.addEventListener("load", function () {
  const loaderParent = document.querySelector(".loader-parent");
  const content = document.getElementById("main-content");
  if (loaderParent) loaderParent.style.display = "none";
  if (content) content.style.display = "block";
});

// Prevent accidental page refresh when swiping
document.addEventListener('touchmove', function(e) {
  if (isSwiping) {
    e.preventDefault();
  }
}, { passive: false });

// Add visual feedback for mobile users on first load
if (isMobileDevice()) {
  setTimeout(() => {
    const items = document.querySelectorAll('#todo-list li');
    if (items.length > 0 && currentList.length > 0) {
      const firstItem = items[0];
      const hint = document.createElement('div');
      hint.innerHTML = '👆 Try swiping this task left or right!';
      hint.style.position = 'fixed';
      hint.style.bottom = '20px';
      hint.style.left = '50%';
      hint.style.transform = 'translateX(-50%)';
      hint.style.backgroundColor = '#3498db';
      hint.style.color = 'white';
      hint.style.padding = '10px 15px';
      hint.style.borderRadius = '20px';
      hint.style.fontSize = '12px';
      hint.style.fontWeight = 'bold';
      hint.style.zIndex = '1000';
      hint.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      hint.style.animation = 'pulse 2s infinite';
      
      document.body.appendChild(hint);
      
      // Remove hint after 5 seconds or on first swipe
      const removeHint = () => {
        if (document.body.contains(hint)) {
          hint.style.opacity = '0';
          setTimeout(() => {
            if (document.body.contains(hint)) {
              document.body.removeChild(hint);
            }
          }, 300);
        }
      };
      
      setTimeout(removeHint, 5000);
      
      // Listen for first swipe
      const handleFirstSwipe = () => {
        removeHint();
        document.removeEventListener('touchstart', handleFirstSwipe);
      };
      
      document.addEventListener('touchstart', handleFirstSwipe);
    }
  }, 2000);
}