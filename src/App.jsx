import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, CheckCircle2, Circle, Calendar, BookOpen } from 'lucide-react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api/tasks';
const DEFAULT_CATEGORIES = ['Academic 📚', 'Hygiene & Self Care 🛁', 'Hobbies 🎨'];

function App() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    category: DEFAULT_CATEGORIES[0],
    type: 'routine',
    date: 'Everyday'
  });

  // Date Logic
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const dayIndex = today.getDay(); // 0 (Su) to 6 (Sa)
  const daysShort = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(API_BASE_URL);
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
      await axios.post(API_BASE_URL, { ...formData, category: finalCategory });
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

  const toggleComplete = async (id, currentStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/${id}`, { completed: !currentStatus });
      fetchTasks();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/${id}`);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const routineTasks = tasks.filter(t => t.type === 'routine');
  const nextTasks = tasks.filter(t => t.type === 'next');

  return (
    <div className="planner-sheet">
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
              <Plus size={18} /> Add to list
            </button>
          </form>

          <div className="lined-list">
            {routineTasks.map(task => (
              <div key={task._id} className={`routine-item ${task.completed ? 'completed' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={task.completed} 
                  onChange={() => toggleComplete(task._id, task.completed)}
                  className="checkbox-custom"
                />
                <span>{task.title}</span>
                <button onClick={() => deleteTask(task._id)} className="delete-btn">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {routineTasks.length === 0 && <p className="empty-msg">No routine tasks written yet...</p>}
          </div>
        </section>

        {/* Right Column: Upcoming Stickies */}
        <section className="upcoming-section">
          <h2 className="column-title">Upcoming / Next ☁️</h2>
          
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
                  <StickyTask key={task._id} task={task} onToggle={toggleComplete} onDelete={deleteTask} />
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

function StickyTask({ task, onToggle, onDelete }) {
  return (
    <div className={`sticky-task-item ${task.completed ? 'completed' : ''}`}>
      <div className="sticky-title">
        <input 
          type="checkbox" 
          checked={task.completed} 
          onChange={() => onToggle(task._id, task.completed)}
          className="checkbox-custom"
        />
        {task.title}
      </div>
      <div className="sticky-meta">
        <span>📅 {task.date}</span>
        <button onClick={() => onDelete(task._id)} className="delete-btn">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export default App;
