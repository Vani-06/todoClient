import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, CheckCircle2, Circle, Calendar, BookOpen } from 'lucide-react';
import './App.css';

const API_BASE_URL = 'https://todoserver-qexi.onrender.com/api/tasks';
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

  const deleteTask = async (id) => {
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
      <header className="planner-header">
        <div className="title-section">
          <h1>To do list: Hippo Tasks 🦛</h1>
        </div>
        <button onClick={handleLogout} className="logout-btn">Log Out</button>
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
              <div key={task._id} className={`routine-item ${task.completed ? 'completed' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={task.completed} 
                  onChange={() => toggleComplete(task)}
                  className="checkbox-custom"
                />
                <span>{task.title}</span>
                {task.streak > 0 && <span className="streak-tag">🔥 {task.streak}</span>}
                <button onClick={() => deleteTask(task._id)} className="delete-btn">
                  <Trash2 size={20} />
                </button>
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
                  <StickyTask 
                    key={task._id} 
                    task={task} 
                    onToggle={toggleComplete} 
                    onDelete={deleteTask} 
                    isOverdue={task.date && task.date < todayString}
                  />
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

function StickyTask({ task, onToggle, onDelete, isOverdue }) {
  return (
    <div className={`sticky-task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
      <div className="sticky-title">
        <input 
          type="checkbox" 
          checked={task.completed} 
          onChange={() => onToggle(task)}
          className="checkbox-custom"
        />
        {isOverdue && <span className="overdue-icon">‼️</span>}
        {task.title}
      </div>
      <div className="sticky-meta">
        <span>📅 {task.date}</span>
        <button onClick={() => onDelete(task._id)} className="delete-btn">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

export default App;
