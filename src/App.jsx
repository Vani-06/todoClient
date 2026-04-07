import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, CheckCircle2, Circle, Calendar, BookOpen } from 'lucide-react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api/tasks';

function App() {
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Academic 📚',
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
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return;

    try {
      await axios.post(API_BASE_URL, formData);
      setFormData({
        title: '',
        category: 'Academic 📚',
        type: 'routine',
        date: 'Everyday'
      });
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
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
              >
                <option value="Academic 📚">Academic 📚</option>
                <option value="Hygiene & Self Care 🛁">Hygiene & Self Care 🛁</option>
                <option value="Hobbies 🎨">Hobbies 🎨</option>
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
          <div className="sticky-note pink">
            <h3 className="sticky-hdr">Academic Needs</h3>
            {nextTasks.filter(t => t.category === 'Academic 📚').map(task => (
              <StickyTask key={task._id} task={task} onToggle={toggleComplete} onDelete={deleteTask} />
            ))}
          </div>

          <div className="sticky-note taupe">
            <h3 className="sticky-hdr">Self-Care</h3>
            {nextTasks.filter(t => t.category === 'Hygiene & Self Care 🛁').map(task => (
              <StickyTask key={task._id} task={task} onToggle={toggleComplete} onDelete={deleteTask} />
            ))}
          </div>

          <div className="sticky-note yellow">
            <h3 className="sticky-hdr">Hobbies & Fun</h3>
            {nextTasks.filter(t => t.category === 'Hobbies 🎨').map(task => (
              <StickyTask key={task._id} task={task} onToggle={toggleComplete} onDelete={deleteTask} />
            ))}
          </div>

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
