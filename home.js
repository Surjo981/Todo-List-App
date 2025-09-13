const listForm = document.getElementById('list-form');
const listTitleInput = document.getElementById('list-title');
const listLinks = document.getElementById('list-links');

let lists = JSON.parse(localStorage.getItem('lists')) || {};

// Rename/Edit list functionality
function renameList(oldName) {
  const newName = prompt(`Rename "${oldName}" to:`, oldName);
  
  if (!newName || newName.trim() === '') {
    return; // User cancelled or entered empty name
  }
  
  const trimmedNewName = newName.trim();
  
  // Check if new name is same as old name
  if (trimmedNewName === oldName) {
    return; // No change needed
  }
  
  // Check if new name already exists
  if (lists[trimmedNewName]) {
    const overwrite = confirm(`A list named "${trimmedNewName}" already exists.\n\nDo you want to merge the tasks?\n• Yes = Merge both lists\n• No = Cancel rename`);
    if (!overwrite) {
      return;
    }
    
    // Merge tasks if user confirms
    const oldTasks = lists[oldName] || [];
    const existingTasks = lists[trimmedNewName] || [];
    lists[trimmedNewName] = [...existingTasks, ...oldTasks];
  } else {
    // Simply rename the list
    lists[trimmedNewName] = lists[oldName];
  }
  
  // Remove old list
  delete lists[oldName];
  
  // Save updated lists
  localStorage.setItem('lists', JSON.stringify(lists));
  
  // Refresh the display
  renderListLinks();
  
  // Success notification
  if (Notification.permission === 'granted') {
    new Notification('✏️ List Renamed', { 
      body: `"${oldName}" renamed to "${trimmedNewName}"` 
    });
  }
  
  alert(`✅ List renamed successfully!\n"${oldName}" → "${trimmedNewName}"`);
}

// Enhanced delete function with better confirmation
function deleteList(listName) {
  const taskCount = (lists[listName] || []).length;
  const completedCount = (lists[listName] || []).filter(task => task.completed).length;
  
  const confirmMessage = `🗑️ Delete "${listName}"?\n\n📊 List contains:\n• ${taskCount} total tasks\n• ${completedCount} completed tasks\n• ${taskCount - completedCount} pending tasks\n\n⚠️ This action cannot be undone!`;
  
  if (confirm(confirmMessage)) {
    delete lists[listName];
    localStorage.setItem('lists', JSON.stringify(lists));
    renderListLinks();
    
    if (Notification.permission === 'granted') {
      new Notification('🗑️ List Deleted', { 
        body: `"${listName}" has been deleted` 
      });
    }
    
    alert(`✅ "${listName}" deleted successfully!`);
  }
}

// Enhanced renderListLinks with edit/rename functionality
function renderListLinks() {
  listLinks.innerHTML = '';
  Object.keys(lists).forEach(title => {
    const taskCount = lists[title].length;
    const completedCount = lists[title].filter(task => task.completed).length;
    const percentage = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;
    
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.justifyContent = 'space-between';
    li.style.padding = '15px';
    li.style.margin = '10px 0';
    li.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    li.style.borderRadius = '12px';
    li.style.border = '2px solid rgba(255, 255, 255, 0.1)';
    li.style.transition = 'all 0.3s ease';
    
    // Hover effects
    li.onmouseenter = function() {
      this.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
      this.style.transform = 'translateY(-3px)';
      this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
      this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    };
    
    li.onmouseleave = function() {
      this.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = 'none';
      this.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    };

    // Left side: List info with link
    const listInfo = document.createElement('div');
    listInfo.style.flex = '1';
    listInfo.style.cursor = 'pointer';
    
    const link = document.createElement('a');
    link.href = `list.html?name=${encodeURIComponent(title)}`;
    link.textContent = title;
    link.style.fontSize = '24px';
    link.style.fontWeight = 'bold';
    link.style.color = 'var(--text-color)';
    link.style.textDecoration = 'none';
    link.style.display = 'block';
    link.style.marginBottom = '5px';
    
    // Hover effect for link
    link.onmouseenter = function() {
      this.style.color = '#3498db';
    };
    link.onmouseleave = function() {
      this.style.color = 'var(--text-color)';
    };
    
    // Stats display
    const stats = document.createElement('div');
    stats.style.fontSize = '14px';
    stats.style.color = '#aeb1b3ff';
    stats.innerHTML = `📊 ${completedCount}/${taskCount} completed (${percentage}%) ${taskCount === 0 ? '• Empty list' : ''}`;
    
    // Progress bar
    if (taskCount > 0) {
      const progressBar = document.createElement('div');
      progressBar.style.width = '200px';
      progressBar.style.height = '6px';
      progressBar.style.backgroundColor = 'rgba(255,255,255,0.2)';
      progressBar.style.borderRadius = '3px';
      progressBar.style.marginTop = '8px';
      progressBar.style.overflow = 'hidden';
      
      const progressFill = document.createElement('div');
      progressFill.style.width = `${percentage}%`;
      progressFill.style.height = '100%';
      progressFill.style.backgroundColor = percentage === 100 ? '#2ecc71' : '#3498db';
      progressFill.style.borderRadius = '3px';
      progressFill.style.transition = 'width 0.3s ease';
      
      progressBar.appendChild(progressFill);
      listInfo.appendChild(link);
      listInfo.appendChild(stats);
      listInfo.appendChild(progressBar);
    } else {
      listInfo.appendChild(link);
      listInfo.appendChild(stats);
    }

    // Right side: Action buttons
    const actionButtons = document.createElement('div');
    actionButtons.style.display = 'flex';
    actionButtons.style.gap = '8px';
    actionButtons.style.alignItems = 'center';
    
    // Edit/Rename button
    const editBtn = document.createElement('button');
    editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
    editBtn.title = `Rename "${title}"`;
    editBtn.style.backgroundColor = '#f0aa3aff';
    editBtn.style.color = 'white';
    editBtn.style.border = 'none';
    editBtn.style.borderRadius = '8px';
    editBtn.style.cursor = 'pointer';
    editBtn.style.fontSize = '20px';
    editBtn.style.transition = 'all 0.2s ease';
    
    editBtn.onmouseenter = function() {
      this.style.backgroundColor = '#e6c612ff';
      this.style.transform = 'scale(1.1)';
    };
    editBtn.onmouseleave = function() {
      this.style.backgroundColor = '#f0aa3aff';
      this.style.transform = 'scale(1)';
    };
    
    editBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      renameList(title);
    };

    // Delete button (enhanced)
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteBtn.title = `Delete "${title}"`;
    deleteBtn.style.backgroundColor = '#c0392b';
    deleteBtn.style.border = 'none';
    deleteBtn.style.color = 'white';
    deleteBtn.style.borderRadius = '8px';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.fontSize = '20px';
    deleteBtn.style.transition = 'all 0.2s ease';
    
    deleteBtn.onmouseenter = function() {
      this.style.backgroundColor = '#e74c3c';
      this.style.transform = 'scale(1.1)';
    };
    deleteBtn.onmouseleave = function() {
      this.style.backgroundColor = '#c0392b';
      this.style.transform = 'scale(1)';
    };
    
    deleteBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      deleteList(title);
    };

    actionButtons.appendChild(editBtn);
    actionButtons.appendChild(deleteBtn);
    
    li.appendChild(listInfo);
    li.appendChild(actionButtons);
    listLinks.appendChild(li);
  });
  
  // Show empty state if no lists
  if (Object.keys(lists).length === 0) {
    const emptyState = document.createElement('div');
    emptyState.style.textAlign = 'center';
    emptyState.style.padding = '50px 20px';
    emptyState.style.color = '#7f8c8d';
    emptyState.style.fontSize = '18px';
    emptyState.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">📝</div>
      <h3 style="margin: 0 0 10px 0;">No Todo Lists Yet</h3>
      <p style="margin: 0;">Create your first list above to get started!</p>
    `;
    listLinks.appendChild(emptyState);
  }
}

// Enhanced list creation with validation
listForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const title = listTitleInput.value.trim();
  
  if (!title) {
    alert('❌ Please enter a list name!');
    return;
  }
  
  if (lists[title]) {
    alert(`❌ A list named "${title}" already exists!\nPlease choose a different name.`);
    return;
  }
  
  if (title.length > 50) {
    alert('❌ List name is too long!\nPlease keep it under 50 characters.');
    return;
  }

  lists[title] = [];
  localStorage.setItem('lists', JSON.stringify(lists));
  listTitleInput.value = '';
  renderListLinks();
  
  // Success notification
  if (Notification.permission === 'granted') {
    new Notification('✅ List Created', { 
      body: `"${title}" list created successfully!` 
    });
  }
  
  // Optional: Auto-redirect to new list
  // window.location.href = `list.html?name=${encodeURIComponent(title)}`;
});

// Initial render
renderListLinks();

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

// Import/Export Functions (Enhanced)
function importCompleteTodoLists() {
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
        
        // Handle both single list and multiple lists import
        let listsToImport = {};
        
        if (importedData.exportType === 'complete_lists') {
          listsToImport = importedData.lists;
        } else if (importedData.tasks && Array.isArray(importedData.tasks)) {
          const listName = importedData.listName || 'Imported List';
          listsToImport[listName] = importedData.tasks;
        } else {
          alert('❌ Invalid file format!\nPlease select a valid todo lists export file.');
          return;
        }
        
        // Show import preview
        const listNames = Object.keys(listsToImport);
        const totalTasks = Object.values(listsToImport).reduce((sum, tasks) => sum + tasks.length, 0);
        const completedTasks = Object.values(listsToImport).reduce((sum, tasks) => 
          sum + tasks.filter(task => task.completed).length, 0);
        
        const confirmMessage = `📥 Import ${listNames.length} todo list(s)?\n\n📋 Lists to import:\n${listNames.map(name => `• ${name}`).join('\n')}\n\n📊 Statistics:\n• ${totalTasks} total tasks\n• ${completedTasks} completed tasks\n\n⚠️ This will merge with existing lists.\nLists with same names will be replaced!`;
        
        if (confirm(confirmMessage)) {
          let importedCount = 0;
          let replacedCount = 0;
          
          Object.entries(listsToImport).forEach(([listName, tasks]) => {
            if (lists[listName]) {
              replacedCount++;
            } else {
              importedCount++;
            }
            
            const processedTasks = tasks.map(task => ({
              text: task.text || 'Imported Task',
              completed: task.completed || false,
              createdAt: task.createdAt || new Date().toISOString(),
              completedAt: task.completedAt || null
            }));
            
            lists[listName] = processedTasks;
          });
          
          localStorage.setItem('lists', JSON.stringify(lists));
          renderListLinks();
          
          const successMessage = `✅ Import Successful!\n\n• ${importedCount} new lists imported\n• ${replacedCount} existing lists replaced\n• ${totalTasks} total tasks imported`;
          alert(successMessage);
          
          if (Notification.permission === 'granted') {
            new Notification('📥 Lists Imported Successfully', { 
              body: `${listNames.length} lists with ${totalTasks} tasks imported!` 
            });
          }
        }
      } catch (error) {
        alert('❌ Error reading file!\nPlease make sure it\'s a valid JSON export file.');
        console.error('Import error:', error);
      }
    };
    
    reader.readAsText(file);
  };
  
  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

function exportAllLists() {
  if (Object.keys(lists).length === 0) {
    alert('❌ No lists found to export!\nCreate some lists first.');
    return;
  }
  
  let totalTasks = 0;
  let totalCompleted = 0;
  const listStats = {};
  
  Object.entries(lists).forEach(([name, tasks]) => {
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
    totalLists: Object.keys(lists).length,
    totalTasks: totalTasks,
    totalCompleted: totalCompleted,
    statistics: listStats,
    lists: lists
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `all_todo_lists_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  const message = `📤 All Lists Exported!\n\n• ${Object.keys(lists).length} lists\n• ${totalTasks} total tasks\n• ${totalCompleted} completed tasks`;
  alert(message);
  
  if (Notification.permission === 'granted') {
    new Notification('📤 All Lists Exported', { 
      body: `${Object.keys(lists).length} lists with ${totalTasks} tasks exported!` 
    });
  }
}

// Create Import/Export buttons
  // Insert after form
  listForm.parentNode.insertBefore(container, listForm.nextSibling);


// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
  createImportExportButtons();
  
  // Request notification permission
  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
});

// Alternative initialization if DOMContentLoaded already fired
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createImportExportButtons);
} else {
  createImportExportButtons();
}




