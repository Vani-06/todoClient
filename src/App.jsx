import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, CheckCircle2, Circle, Calendar, BookOpen } from 'lucide-react';
import './App.css';

const API_BASE_URL = 'https://todoserver-qexi.onrender.com/api/tasks';
const SERVER_URL = 'https://todoserver-qexi.onrender.com'; // Useful for static files
// If running locally, you might want to use:
// const SERVER_URL = 'http://localhost:5000';
// const API_BASE_URL = `${SERVER_URL}/api/tasks`;
const DEFAULT_CATEGORIES = ['Academic 📚', 'Hygiene & Self Care 🛁', 'Hobbies 🎨'];

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('hippoUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [authFormData, setAuthFormData] = useState({ name: '', pin: '' });
  const [loginError, setLoginError] = useState('');
  const [expandedTasks, setExpandedTasks] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    category: DEFAULT_CATEGORIES[0],
    type: 'routine',
    date: 'Everyday'
  });

  // Date Logic
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const todayString = getTodayString();
  const dateString = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const dayIndex = today.getDay(); // 0 (Su) to 6 (Sa)
  const daysShort = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  useEffect(() => {
    if (currentUser) {
      fetchTasks();
    }
  }, [currentUser]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(API_BASE_URL, {
        headers: { 'x-user-id': currentUser._id }
      });
      const fetchedTasks = response.data;
      setTasks(fetchedTasks);

      // Dynamic Category Extraction
      const uniqueFetched = [...new Set(fetchedTasks.map(t => t.category))];
      const merged = [...new Set([...DEFAULT_CATEGORIES, ...uniqueFetched])];
      setCategories(merged);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return;

    // Use custom category if provided
    const finalCategory = showCustomInput ? customCategory : formData.category;
    if (showCustomInput && !customCategory) return;

    try {
      await axios.post(API_BASE_URL, 
        { ...formData, category: finalCategory },
        { headers: { 'x-user-id': currentUser._id } }
      );
      setFormData({
        title: '',
        category: finalCategory, // Keep the last used category
        type: 'routine',
        date: 'Everyday'
      });
      setCustomCategory('');
      setShowCustomInput(false);
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleComplete = async (task) => {
    try {
      const headers = { 'x-user-id': currentUser._id };
      if (task.type === 'next') {
        // Feature: Auto-Delete on Check for "next" tasks
        await axios.delete(`${API_BASE_URL}/${task._id}`, { headers });
      } else {
        // Standard PUT for "routine" tasks
        await axios.put(`${API_BASE_URL}/${task._id}`, { completed: !task.completed }, { headers });
      }
      // Freshly fetch tasks to ensure the UI is in sync with the server
      fetchTasks();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (e, id) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      await axios.delete(`${API_BASE_URL}/${id}`, {
        headers: { 'x-user-id': currentUser._id }
      });
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await axios.post(`${API_BASE_URL.replace('/tasks', '/auth')}/login`, authFormData);
      const user = response.data;
      setCurrentUser(user);
      localStorage.setItem('hippoUser', JSON.stringify(user));
    } catch (error) {
      setLoginError(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('hippoUser');
    setTasks([]);
  };

  const toggleExpand = (e, id) => {
    e.stopPropagation();
    setExpandedTasks(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const updateTaskDetails = async (id, updates) => {
    try {
      await axios.put(`${API_BASE_URL}/${id}`, updates, {
        headers: { 'x-user-id': currentUser._id }
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task details:', error);
    }
  };

  const handleFileUpload = async (taskId, file) => {
    const formData = new FormData();
    formData.append('document', file);
    try {
      await axios.post(`${API_BASE_URL}/${taskId}/upload`, formData, {
        headers: { 
          'x-user-id': currentUser._id,
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchTasks();
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const routineTasks = tasks.filter(t => t.type === 'routine');
  const nextTasks = tasks
    .filter(t => t.type === 'next')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Overdue Logic
  const overdueCount = nextTasks.filter(t => t.date && t.date < todayString).length;

  // Global Streak Stats
  const totalStreaks = routineTasks.reduce((sum, t) => sum + (t.streak || 0), 0);
  const activeHabits = routineTasks.filter(t => t.streak > 0).length;

  if (!currentUser) {
    return (
      <div className="login-overlay">
        <div className="login-box">
          <h2>Hippo Tasks 🦛</h2>
          <p>Sign in to see your private planner</p>
          
          {loginError && <div className="error-msg">{loginError}</div>}
          
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="text"
              placeholder="Your Name"
              value={authFormData.name}
              onChange={(e) => setAuthFormData({ ...authFormData, name: e.target.value })}
              className="input-field"
              required
            />
            <input
              type="password"
              placeholder="4-Digit PIN"
              maxLength={4}
              value={authFormData.pin}
              onChange={(e) => setAuthFormData({ ...authFormData, pin: e.target.value })}
              className="input-field"
              required
            />
            <button type="submit" className="submit-btn">Enter Planner</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="planner-sheet">
      <button onClick={handleLogout} className="logout-btn">Log Out</button>
      <header className="planner-header">
        <div className="title-section">
          <h1>To do list: Hippo Tasks 🦛</h1>
        </div>
        <div className="date-section">
          <div className="date-text">{dateString}</div>
          <div className="weekday-grid">
            {daysShort.map((day, idx) => (
              <span key={day} className={`day ${idx === dayIndex ? 'active' : ''}`}>
                {day}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Streak Stats Summary */}
      <div className="streak-stats-row">
        <div className="stat-card">
          <span className="stat-label">Total 🔥 Collected:</span>
          <span className="stat-value">{totalStreaks}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Habits:</span>
          <span className="stat-value">{activeHabits}</span>
        </div>
        <div className="stat-card decor">
        </div>
      </div>

      <main className="planner-grid">
        {/* Left Column: Brain Dump & Routine */}
        <section className="brain-dump">
          <h2 className="column-title">Brain dump... 🎀</h2>
          
          <form onSubmit={handleSubmit} className="task-form">
            <input
              type="text"
              placeholder="Write a task here..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
            />
            
            <div className="form-row">
              <select
                value={showCustomInput ? 'ADD_CUSTOM' : formData.category}
                onChange={(e) => {
                  if (e.target.value === 'ADD_CUSTOM') {
                    setShowCustomInput(true);
                  } else {
                    setShowCustomInput(false);
                    setFormData({ ...formData, category: e.target.value });
                  }
                }}
                className="input-field"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="ADD_CUSTOM">➕ Add Custom Category...</option>
              </select>

              <select
                value={formData.type}
                onChange={(e) => {
                  const type = e.target.value;
                  setFormData({ 
                    ...formData, 
                    type, 
                    date: type === 'routine' ? 'Everyday' : '' 
                  });
                }}
                className="input-field"
              >
                <option value="routine">Daily Routine</option>
                <option value="next">Task for Next</option>
              </select>
            </div>

            {showCustomInput && (
              <input
                type="text"
                placeholder="Category name (e.g. Cooking 🍳)"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="input-field custom-cat-input"
                autoFocus
              />
            )}

            {formData.type === 'next' && (
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input-field"
              />
            )}

            <button type="submit" className="submit-btn" disabled={!formData.title}>
              <Plus size={22} /> Add to list
            </button>
          </form>

          <div className="lined-list">
            {routineTasks.map(task => (
              <div key={task._id} className="task-container">
                <div className={`routine-item-wrapper ${task.completed ? 'completed' : ''}`}>
                  <div className="routine-item">
                    <div className="task-info-left">
                      <input 
                        type="checkbox" 
                        checked={task.completed} 
                        onChange={() => toggleComplete(task)}
                        className="checkbox-custom"
                      />
                      <span className="task-title-text">{task.title}</span>
                      {task.streak > 0 && <span className="streak-tag">🔥 {task.streak}</span>}
                    </div>

                    <div className="task-actions-right">
                      <button 
                        onClick={(e) => toggleExpand(e, task._id)} 
                        className={`expand-toggle ${expandedTasks.includes(task._id) ? 'open' : ''}`}
                      >
                        🔽
                      </button>
                      <button 
                        onClick={(e) => deleteTask(e, task._id)} 
                        className="delete-btn"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Permanent Display Area (Inline) */}
                  <TaskSubItems 
                    task={task} 
                    onUpdate={(updates) => updateTaskDetails(task._id, updates)}
                    isSticky={false}
                    serverUrl={SERVER_URL}
                  />
                  
                  {/* Creation Area (Dropdown) */}
                  {expandedTasks.includes(task._id) && (
                    <TaskDetails 
                      task={task} 
                      onUpdate={(updates) => updateTaskDetails(task._id, updates)} 
                      onUpload={(file) => handleFileUpload(task._id, file)}
                    />
                  )}
                </div>
              </div>
            ))}
            {routineTasks.length === 0 && <p className="empty-msg">No routine tasks written yet...</p>}
          </div>
        </section>

        {/* Right Column: Upcoming Stickies */}
        <section className="upcoming-section">
          <h2 className="column-title">
            Upcoming / Next ☁️
            {overdueCount > 0 && <span className="overdue-counter">🚨 {overdueCount} Overdue</span>}
          </h2>
          
          {/* Categorized Sticky Notes */}
          {categories.map((cat, index) => {
            const catTasks = nextTasks.filter(t => t.category === cat);
            if (catTasks.length === 0) return null;

            // Cycle colors for stickies
            const colorClass = index % 3 === 0 ? 'pink' : index % 3 === 1 ? 'taupe' : 'yellow';

            return (
              <div key={cat} className={`sticky-note ${colorClass}`}>
                <h3 className="sticky-hdr">{cat}</h3>
                {catTasks.map(task => (
                  <div key={task._id} className="sticky-task-container">
                    <StickyTask 
                      task={task} 
                      onToggle={toggleComplete} 
                      onDelete={deleteTask} 
                      onExpand={(e) => toggleExpand(e, task._id)}
                      isExpanded={expandedTasks.includes(task._id)}
                      isOverdue={task.date && task.date < todayString}
                      isToday={task.date === todayString}
                    >
                      {/* Permanent Display Area (Inline) */}
                      <TaskSubItems 
                        task={task} 
                        onUpdate={(updates) => updateTaskDetails(task._id, updates)}
                        isSticky={true}
                        serverUrl={SERVER_URL}
                      />

                      {/* Creation Area (Dropdown) */}
                      {expandedTasks.includes(task._id) && (
                        <TaskDetails 
                          task={task} 
                          onUpdate={(updates) => updateTaskDetails(task._id, updates)} 
                          onUpload={(file) => handleFileUpload(task._id, file)}
                        />
                      )}
                    </StickyTask>
                  </div>
                ))}
              </div>
            );
          })}

          {nextTasks.length === 0 && <p className="empty-msg">No upcoming tasks today!</p>}
        </section>
      </main>
    </div>
  );
}

function StickyTask({ task, onToggle, onDelete, isOverdue, isToday, onExpand, isExpanded, children }) {
  return (
    <div className={`sticky-task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''} ${isToday ? 'task-today' : ''}`}>
      <div className="sticky-title">
        <input 
          type="checkbox" 
          checked={task.completed} 
          onChange={() => onToggle(task)}
          className="checkbox-custom"
        />
        {isOverdue && <span className="overdue-icon">‼️</span>}
        <span className="task-text">{task.title}</span>
        <button 
          onClick={onExpand} 
          className={`expand-btn ${isExpanded ? 'open' : ''}`}
        >
          🔽
        </button>
      </div>
      <div className="sticky-meta">
        <span>📅 {task.date}</span>
        <button onClick={(e) => onDelete(e, task._id)} className="delete-btn">
          <Trash2 size={18} />
        </button>
      </div>
      {children}
    </div>
  );
}

function TaskSubItems({ task, onUpdate, isSticky, serverUrl }) {
  const toggleSubtask = (e, index) => {
    e.stopPropagation();
    const updatedSubtasks = [...task.subtasks];
    updatedSubtasks[index].completed = !updatedSubtasks[index].completed;
    onUpdate({ subtasks: updatedSubtasks, completed: task.completed });
  };

  const removeSubtask = (e, index) => {
    e.stopPropagation();
    const updatedSubtasks = task.subtasks.filter((_, i) => i !== index);
    onUpdate({ subtasks: updatedSubtasks, completed: task.completed });
  };

  const removeLink = (e, index) => {
    e.stopPropagation();
    const updatedLinks = task.links.filter((_, i) => i !== index);
    onUpdate({ links: updatedLinks, completed: task.completed });
  };

  if ((!task.subtasks || task.subtasks.length === 0) && (!task.links || task.links.length === 0)) {
    return null;
  }

  const containerStyle = isSticky ? { marginTop: '5px' } : { marginLeft: '45px', marginBottom: '10px' };

  return (
    <div className="task-sub-items-permanent" style={containerStyle} onClick={(e) => e.stopPropagation()}>
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="subtasks-list">
          {task.subtasks.map((sub, idx) => (
            <div key={idx} className={`subtask-item ${sub.completed ? 'completed' : ''}`}>
              <input 
                type="checkbox" 
                checked={sub.completed} 
                onChange={(e) => toggleSubtask(e, idx)}
                className="checkbox-tiny"
              />
              <span style={{ fontSize: '0.85rem' }}>{sub.title}</span>
              <button 
                onClick={(e) => removeSubtask(e, idx)} 
                className="delete-mini"
                style={{ marginLeft: 'auto' }}
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {task.links && task.links.length > 0 && (
        <div className="links-list" style={{ marginTop: '5px' }}>
          {task.links.map((link, idx) => {
            const linkUrl = typeof link === 'string' ? link : link.url;
            const linkName = typeof link === 'string' ? link : (link.name || link.url);
            return (
              <div key={idx} className="link-item">
                <span>🔗</span>
                <a 
                  href={linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`} 
                  target="_blank" 
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="task-link"
                >
                  {linkName}
                </a>
                <button onClick={(e) => removeLink(e, idx)} className="delete-mini">x</button>
              </div>
            );
          })}
        </div>
      )}

      {task.document && (
        <div className="document-item" style={{ marginTop: '5px' }}>
          <span>📄</span>
          <a 
            href={`${serverUrl}${task.document.url}`} 
            target="_blank" 
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="task-link"
          >
            {task.document.name}
          </a>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ document: null, completed: task.completed });
            }} 
            className="delete-mini"
          >
            x
          </button>
        </div>
      )}
    </div>
  );
}

function TaskDetails({ task, onUpdate, onUpload }) {
  const [newSubtask, setNewSubtask] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newLinkName, setNewLinkName] = useState('');

  const handleAddSubtask = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newSubtask) return;
    const updatedSubtasks = [...(task.subtasks || []), { title: newSubtask, completed: false }];
    onUpdate({ subtasks: updatedSubtasks, completed: task.completed });
    setNewSubtask('');
  };

  const handleAddLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newLink) return;
    const updatedLinks = [...(task.links || []), { url: newLink, name: newLinkName }];
    onUpdate({ links: updatedLinks, completed: task.completed });
    setNewLink('');
    setNewLinkName('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="task-details" onClick={(e) => e.stopPropagation()}>
      <div className="subtasks-section">
        <span className="details-subtitle">Add items:</span>
        <div onClick={(e) => e.stopPropagation()}>
          <form onSubmit={handleAddSubtask} className="mini-input-group">
            <input 
              type="text" 
              placeholder="New subtask..." 
              value={newSubtask}
              onChange={(e) => {
                e.stopPropagation();
                setNewSubtask(e.target.value);
              }}
              className="mini-input"
            />
            <button type="submit" className="mini-add-btn">+</button>
          </form>
        </div>
      </div>

      <div className="links-section">
        <div onClick={(e) => e.stopPropagation()}>
          <form onSubmit={handleAddLink} className="mini-input-group stack">
            <input 
              type="text" 
              placeholder="Add URL..." 
              value={newLink}
              onChange={(e) => {
                e.stopPropagation();
                setNewLink(e.target.value);
              }}
              className="mini-input"
            />
            <div className="link-name-row">
              <input 
                type="text" 
                placeholder="Name (optional)..." 
                value={newLinkName}
                onChange={(e) => {
                  e.stopPropagation();
                  setNewLinkName(e.target.value);
                }}
                className="mini-input"
              />
              <button type="submit" className="mini-add-btn">+</button>
            </div>
          </form>
        </div>
      </div>

      <div className="file-section">
        <span className="details-subtitle">Attach Document:</span>
        <div className="file-upload-wrapper">
          <input 
            type="file" 
            id={`file-upload-${task._id}`}
            onChange={handleFileChange}
            className="file-input-hidden"
          />
          <label htmlFor={`file-upload-${task._id}`} className="file-upload-btn">
             📁 {task.document ? 'Change Document' : 'Upload PDF/Doc'}
          </label>
        </div>
      </div>
    </div>
  );
}

export default App;
