import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, CheckCircle2, Circle, Calendar, BookOpen, Sparkles, Paintbrush } from 'lucide-react';
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
    <div className="app-container">
      <header className="header">
        <h1 className="logo">Hippo Tasks 🐘</h1>
        <p className="subtitle">Stay adorable and organized!</p>
      </header>

      <section className="form-section">
        <form onSubmit={handleSubmit} className="task-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="What needs to be done? ✨"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="title-input"
            />
          </div>

          <div className="form-row">
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="select-input"
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
              className="select-input"
            >
              <option value="routine">Daily Routine</option>
              <option value="next">Task for Next</option>
            </select>
          </div>

          {formData.type === 'next' && (
            <div className="date-picker-group">
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="date-input"
              />
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={!formData.title}>
            <Plus size={20} /> Add Task
          </button>
        </form>
      </section>

      <main className="tasks-grid">
        <div className="task-column">
          <h2 className="column-title"><BookOpen size={20} /> Daily Routine</h2>
          <div className="task-list">
            {routineTasks.map(task => (
              <TaskItem 
                key={task._id} 
                task={task} 
                onToggle={toggleComplete} 
                onDelete={deleteTask} 
              />
            ))}
            {routineTasks.length === 0 && <p className="empty-msg">No routine tasks yet! 🌸</p>}
          </div>
        </div>

        <div className="task-column">
          <h2 className="column-title"><Calendar size={20} /> Upcoming / Next</h2>
          <div className="task-list">
            {nextTasks.map(task => (
              <TaskItem 
                key={task._id} 
                task={task} 
                onToggle={toggleComplete} 
                onDelete={deleteTask} 
              />
            ))}
            {nextTasks.length === 0 && <p className="empty-msg">Nothing coming up! ☁️</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

function TaskItem({ task, onToggle, onDelete }) {
  return (
    <div className={`task-card ${task.completed ? 'completed' : ''}`}>
      <div className="task-content">
        <button 
          onClick={() => onToggle(task._id, task.completed)} 
          className="check-btn"
        >
          {task.completed ? <CheckCircle2 size={24} className="icon-pink" /> : <Circle size={24} />}
        </button>
        <div className="task-details">
          <h3 className="task-title">{task.title}</h3>
          <div className="task-meta">
            <span className="badge">{task.category}</span>
            {task.type === 'next' && <span className="date-badge">📅 {task.date}</span>}
          </div>
        </div>
      </div>
      <button onClick={() => onDelete(task._id)} className="delete-btn">
        <Trash2 size={20} />
      </button>
    </div>
  );
}

export default App;
