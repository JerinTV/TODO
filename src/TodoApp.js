// src/components/TodoApp.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios for API calls
import './TodoApp.css'; // Your original CSS styles are loaded here
import {
    FaTasks, FaCalendarAlt, FaCog, FaTachometerAlt, FaTrashAlt,
    FaEllipsisV, FaPlus, FaCheck, FaRegSquare, FaSun, FaClipboardList,
    FaStar, FaBoxOpen, FaUserCircle
} from 'react-icons/fa';

// Helper to get a ISO 8601,"%Y-%m-%d" string from a Date object
const getDateString = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const quotes = [
    "Stay focused and never give up.",
    "One task at a time. You got this!",
    "Little by little, progress is made.",
    "Great things take time.",
    "Keep your goals in sight!"
];

const defaultCategories = ['Work', 'Personal', 'Wishlist', 'Birthday'];
const categoryColors = ['#bfdbfe', '#ddd6fe', '#fecaca', '#fde68a']; // Corresponding colors for new categories

function TodoApp() {
    const navigate = useNavigate();
    const [todos, setTodos] = useState([]);
    const [input, setInput] = useState('');
    const [username, setUsername] = useState('User'); // Default username, will be updated from localStorage
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [categories, setCategories] = useState([...defaultCategories]);
    const [newCategory, setNewCategory] = useState('');
    const [categoryDropdown, setCategoryDropdown] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');

    const [activeMainFilter, setActiveMainFilter] = useState('Dashboard');
    const [activeTaskMenuIndex, setActiveTaskMenuIndex] = useState(null);

    // States for the modal (3-dots menu) task editing - KEPT as these are for editing existing tasks
    const [modalHour, setModalHour] = useState('');
    const [modalMinute, setModalMinute] = useState('');
    const [modalAmPm, setModalAmPm] = useState('');
    const [modalDescription, setModalDescription] = useState('');
    const [modalDueDate, setModalDueDate] = useState('');

    // State for simulated login
    const [isLoggedIn, setIsLoggedIn] = useState(true); // Set to true for initial display

    // State for the search query
    const [searchQuery, setSearchQuery] = useState('');

    const API_BASE_URL = 'http://127.0.0.1:8000/api/'; // Your Django API base URL

    // --- Effect to load tasks when the component mounts (on login) ---
    useEffect(() => {
        const storedUsername = localStorage.getItem('loggedInUsername');
        if (storedUsername) {
            setUsername(storedUsername);
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
            navigate('/'); // Redirect to landing page if not logged in
            return;
        }

        const fetchTasks = async () => {
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                console.error('No access token found. Please log in.');
                navigate('/');
                return;
            }
            try {
                // FETCHING ALL TASK DATA FROM THE BACKEND
                // This is where all properties (priority, category, time, description, dueDate)
                // are loaded if your Django API sends them in the response.
                const response = await axios.get(`${API_BASE_URL}tasks/`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                setTodos(response.data); // Set the entire task list from backend
                console.log("Fetched tasks from backend:", response.data);
            } catch (error) {
                console.error('Error fetching tasks:', error);
                if (error.response && error.response.status === 401) {
                    alert('Session expired. Please log in again.');
                    localStorage.clear();
                    navigate('/');
                }
            }
        };

        fetchTasks();
    }, [navigate]); // navigate is in dependencies to prevent lint warnings, though it doesn't change

    // Effect for quote rotation (existing)
    useEffect(() => {
        const timer = setInterval(() => {
            setQuoteIndex(prev => (prev + 1) % quotes.length);
        }, 10000);
        return () => clearInterval(timer);
    }, []);


    // Helper function to get authorization headers
    const getAuthHeaders = () => {
        const accessToken = localStorage.getItem('accessToken');
        return {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        };
    };

    // --- Task Management Functions (Includes backend saving logic) ---

    // Function to add a new todo with simplified initial properties
    const addTodo = async () => {
        if (input.trim() === '') return;

        // Simplified newTodo object - properties will be added/edited via the 3-dots modal
        const newTodo = {
            title: input,
            completed: false,
            priority: '', // Initialize empty
            category: '', // Initialize empty
            time: '',     // Initialize empty
            description: '', // Initialize empty
            dueDate: '',  // Initialize empty
            subtasks: [],
            trashed: false
        };

        try {
            // SENDING NEW TASK (with empty properties) TO THE BACKEND
            const response = await axios.post(`${API_BASE_URL}tasks/`, newTodo, { headers: getAuthHeaders() });
            setTodos(prev => [response.data, ...prev]);
            setInput('');
        } catch (error) {
            console.error('Error adding todo:', error.response ? error.response.data : error.message);
            alert('Failed to add task. Please try again or check your login.');
        }
    };

    // New function to add a todo with a specific due date (used by My Day)
    const addTodoWithDueDate = async (taskTitle, taskDueDate) => {
        if (taskTitle.trim() === '') return;

        const newTodo = {
            title: taskTitle,
            completed: false,
            priority: '',
            category: '',
            time: '',
            description: '',
            dueDate: taskDueDate, // Set the provided due date
            subtasks: [],
            trashed: false
        };

        try {
            const response = await axios.post(`${API_BASE_URL}tasks/`, newTodo, { headers: getAuthHeaders() });
            setTodos(prev => [response.data, ...prev]);
        } catch (error) {
            console.error('Error adding todo with due date:', error.response ? error.response.data : error.message);
            alert('Failed to add task. Please try again or check your login.');
        }
    };

    // Function to toggle task completion status
    const toggle = async (id) => {
        const todoToUpdate = todos.find(todo => todo.id === id);
        if (!todoToUpdate) return;
        const updatedTodo = { ...todoToUpdate, completed: !todoToUpdate.completed };
        try {
            // UPDATING TASK COMPLETION STATUS ON BACKEND
            await axios.put(`${API_BASE_URL}tasks/${id}/`, updatedTodo, { headers: getAuthHeaders() });
            setTodos(prev => prev.map(todo =>
                todo.id === id ? updatedTodo : todo
            ));
        } catch (error) {
            console.error('Error toggling todo:', error);
        }
    };

    // Function to move task to trash
    const moveToTrash = async (id) => {
        const todoToUpdate = todos.find(todo => todo.id === id);
        if (!todoToUpdate) return;
        const updatedTodo = { ...todoToUpdate, trashed: true };
        try {
            // UPDATING TASK TRASH STATUS ON BACKEND
            await axios.put(`${API_BASE_URL}tasks/${id}/`, updatedTodo, { headers: getAuthHeaders() });
            setTodos(prev => prev.map(todo =>
                todo.id === id ? updatedTodo : todo
            ));
        }
        catch (error) {
            console.error('Error moving to trash:', error);
        }
    };

    // Function to restore task from trash
    const restoreFromTrash = async (id) => {
        const todoToUpdate = todos.find(todo => todo.id === id);
        if (!todoToUpdate) return;
        const updatedTodo = { ...todoToUpdate, trashed: false };
        try {
            // UPDATING TASK TRASH STATUS ON BACKEND
            await axios.put(`${API_BASE_URL}tasks/${id}/`, updatedTodo, { headers: getAuthHeaders() });
            setTodos(prev => prev.map(todo =>
                todo.id === id ? updatedTodo : todo
            ));
        } catch (error) {
            console.error('Error restoring from trash:', error);
        }
    };

    // Function to permanently delete task
    const permanentlyDeleteTask = async (id) => {
        try {
            // DELETING TASK FROM BACKEND
            await axios.delete(`${API_BASE_URL}tasks/${id}/`, { headers: getAuthHeaders() });
            setTodos(prev => prev.filter(todo => todo.id !== id));
        } catch (error) {
            console.error('Error permanently deleting task:', error);
        }
    };

    // Function to update task priority
    const updatePriority = async (id, level) => {
        const todoToUpdate = todos.find(todo => todo.id === id);
        if (!todoToUpdate) return;
        const updatedTodo = { ...todoToUpdate, priority: level };
        try {
            // UPDATING TASK PRIORITY ON BACKEND
            await axios.put(`${API_BASE_URL}tasks/${id}/`, updatedTodo, { headers: getAuthHeaders() });
            setTodos(prev => prev.map(todo =>
                todo.id === id ? updatedTodo : todo
            ));
        } catch (error) {
            console.error('Error updating priority:', error);
        }
    };

    // Function to update task category
    const updateCategory = async (id, cat) => {
        const todoToUpdate = todos.find(todo => todo.id === id);
        if (!todoToUpdate) return;
        const updatedTodo = { ...todoToUpdate, category: cat };
        try {
            // UPDATING TASK CATEGORY ON BACKEND
            await axios.put(`${API_BASE_URL}tasks/${id}/`, updatedTodo, { headers: getAuthHeaders() });
            setTodos(prev => prev.map(todo =>
                todo.id === id ? updatedTodo : todo
            ));
        } catch (error) {
            console.error('Error updating category:', error);
        }
    };

    // Function to add a new category (frontend only for now)
    const addCategory = () => {
        if (newCategory.trim() && !categories.includes(newCategory)) {
            setCategories([...categories, newCategory]);
            setNewCategory('');
            // Note: Categories would typically also be stored per user in the backend.
            // This is currently handled only on the frontend.
        }
    };

    // Function to handle "Done" button click in the 3-dots modal
    const handleModalDone = async () => {
        if (activeTaskMenuIndex !== null) {
            const taskToUpdate = { ...todos[activeTaskMenuIndex] };

            // Format time for saving
            if (modalHour && modalMinute && modalAmPm) {
                const hourForSave = modalHour === '12' ? '12' : (parseInt(modalHour, 10)).toString().padStart(2, '0');
                taskToUpdate.time = `${hourForSave}:${modalMinute} ${modalAmPm}`;
            } else {
                taskToUpdate.time = '';
            }

            taskToUpdate.description = modalDescription.trim();
            taskToUpdate.dueDate = modalDueDate;

            try {
                // UPDATING ALL MODAL-EDITED TASK DETAILS ON BACKEND
                await axios.put(`${API_BASE_URL}tasks/${taskToUpdate.id}/`, taskToUpdate, { headers: getAuthHeaders() });
                setTodos(prev => prev.map(todo =>
                    todo.id === taskToUpdate.id ? taskToUpdate : todo
                ));
            } catch (error) {
                console.error('Error updating task details:', error);
            }
        }
        // Close modal and reset modal states
        setActiveTaskMenuIndex(null);
        setModalHour('');
        setModalMinute('');
        setModalAmPm('');
        setModalDescription('');
        setModalDueDate('');
    };

    // --- Counting Functions for Sidebar Filters & My Day Summary (operate on current `todos` state) ---
    const countCategory = (cat) => {
        return todos.filter(t => !t.completed && !t.trashed && (cat === 'All' || t.category === cat)).length;
    };

    const countFilter = (filterType) => {
        const todayStr = getDateString(new Date());

        if (filterType === 'My Day') {
            return todos.filter(t => !t.completed && !t.trashed && t.dueDate && t.dueDate === todayStr).length;
        } else if (filterType === 'Upcoming') {
            const today = new Date();
            const next7Days = new Date(today);
            next7Days.setDate(today.getDate() + 7);
            const next7DaysStr = getDateString(next7Days);

            return todos.filter(t => {
                if (!t.completed && !t.trashed && t.dueDate) {
                    const taskDateStr = t.dueDate;
                    return taskDateStr >= todayStr && taskDateStr <= next7DaysStr;
                }
                return false;
            }).length;
        } else if (filterType === 'Important') {
            // Corrected filter: returns the filtered array, not its length inside the filter condition
            return todos.filter(t => !t.completed && !t.trashed && (t.priority === 'hard' || t.priority === 'urgent')).length;
        } else if (filterType === 'All Tasks') {
            return todos.filter(t => !t.trashed).length;
        } else if (filterType === 'Completed') {
            return todos.filter(t => t.completed && !t.trashed).length;
        } else if (filterType === 'Trash') {
            return todos.filter(t => t.trashed).length;
        }
        return 0;
    };

    const getMyDayTasks = () => {
        const todayStr = getDateString(new Date());
        return todos.filter(t => t.dueDate === todayStr && !t.trashed);
    };

    const countMyDayTotal = () => getMyDayTasks().length;
    const countMyDayCompleted = () => getMyDayTasks().filter(t => t.completed).length;
    const countMyDayRemaining = () => getMyDayTasks().filter(t => !t.completed).length;

    const getMyDayCompletion = () => {
        const myDayTasks = getMyDayTasks();
        if (myDayTasks.length === 0) return 0;
        const completed = myDayTasks.filter(t => t.completed).length;
        const nonTrashedMyDayTasks = myDayTasks.filter(t => !t.trashed).length;
        return nonTrashedMyDayTasks > 0 ? Math.round((completed / nonTrashedMyDayTasks) * 100) : 0;
    };

    // Function to open the 3-dots task menu modal and pre-populate its fields
    const handleTaskMenuOpen = (id) => {
        const task = todos.find(todo => todo.id === id);
        if (!task) return;
        const index = todos.findIndex(todo => todo.id === id); // Get index for activeTaskMenuIndex

        setActiveTaskMenuIndex(index); // Set the index of the task being edited

        // Pre-populate modal states with current task data
        if (task.time) {
            const [timePart, ampmPart] = task.time.split(' ');
            const [hour, minute] = timePart.split(':');
            setModalHour(parseInt(hour, 10).toString());
            setModalMinute(minute);
            setModalAmPm(ampmPart);
        } else {
            setModalHour('');
            setModalMinute('');
            setModalAmPm('');
        }

        setModalDescription(task.description || '');
        setModalDueDate(task.dueDate || '');
        // Priority and Category are handled by updatePriority/updateCategory functions directly in the modal
    };

    const getOverallCompletion = () => {
        if (todos.length === 0) return 0;
        const completed = todos.filter(t => t.completed && !t.trashed).length;
        const nonTrashedTodos = todos.filter(t => !t.trashed).length;
        return nonTrashedTodos > 0 ? Math.round((completed / nonTrashedTodos) * 100) : 0;
    };

    // --- Filtering and Sorting Logic for Displayed Tasks (unchanged logic) ---
    const getFilteredAndSortedTodos = () => {
        let filtered = [...todos];
        const today = new Date();
        const todayStr = getDateString(today);

        if (activeMainFilter !== 'Trash') {
            filtered = filtered.filter(t => !t.trashed);
        } else {
            filtered = filtered.filter(t => t.trashed);
        }

        if (activeMainFilter === 'My Day') {
            filtered = filtered.filter(t => !t.completed && t.dueDate && t.dueDate === todayStr);
        } else if (activeMainFilter === 'Upcoming') {
            const next7Days = new Date();
            next7Days.setDate(today.getDate() + 7);
            const next7DaysStr = getDateString(next7Days);

            return filtered.filter(t => {
                if (!t.completed && !t.trashed && t.dueDate) {
                    const taskDateStr = t.dueDate;
                    return taskDateStr >= todayStr && taskDateStr <= next7DaysStr;
                }
                return false;
            });
        } else if (activeMainFilter === 'Important') {
            filtered = filtered.filter(t => !t.completed && !t.trashed && (t.priority === 'hard' || t.priority === 'urgent'));
        } else if (activeMainFilter === 'All Tasks') {
            // No additional filter, show all non-trashed tasks
        } else if (activeMainFilter === 'Completed') {
            filtered = filtered.filter(t => t.completed);
        }

        if ((activeMainFilter === 'Dashboard' || activeMainFilter === 'Categories') && selectedCategory !== 'All') {
            filtered = filtered.filter(t => t.category === selectedCategory);
        }

        if (!['Settings', 'Feedback', 'Trash', 'Categories'].includes(activeMainFilter) && searchQuery.trim() !== '') {
            const lowerCaseQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(lowerCaseQuery) ||
                (t.description && t.description.toLowerCase().includes(lowerCaseQuery))
            );
        }

        return filtered.sort((a, b) => {
            const parseTime = (timeStr) => {
                if (!timeStr) return null;
                const [timePart, ampmPart] = timeStr.split(' ');
                let [hours, minutes] = timePart.split(':').map(Number);
                if (ampmPart === 'PM' && hours !== 12) hours += 12;
                if (ampmPart === 'AM' && hours === 12) hours = 0;
                return hours * 60 + minutes;
            };

            const dateAStr = a.dueDate || '';
            const dateBStr = b.dueDate || '';

            if (dateAStr !== dateBStr) {
                if (!dateAStr) return 1;
                if (!dateBStr) return -1;
                return dateAStr.localeCompare(dateBStr);
            }

            const timeA = parseTime(a.time);
            const timeB = parseTime(b.time);
            if (timeA !== null && timeB !== null) {
                return timeA - timeB;
            }
            if (timeA === null && timeB !== null) return 1;
            if (timeA !== null && timeB === null) return -1;
            return 0;
        });
    };

    const today = new Date();
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const getUpcomingDates = () => [...Array(5)].map((_, i) => {
        const date = new Date();
        date.setDate(today.getDate() + i);
        return { day: weekdays[date.getDay()], date: date.getDate(), label: i === 0 ? 'today' : '' };
    });

    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));


    const currentFilteredTodos = getFilteredAndSortedTodos();

    const currentHour = today.getHours();
    let greeting = 'Good evening';
    if (currentHour < 12) {
        greeting = 'Good morning';
    } else if (currentHour < 18) {
        greeting = 'Good afternoon';
    }

    const todayWeekdayName = weekdays[today.getDay()].toLowerCase();
    const todayImage = `/${todayWeekdayName}.jpg`; // This image path might need to be relative to your public folder or a full URL

    const handleLogout = () => {
        localStorage.clear(); // Clear all user data from localStorage
        setIsLoggedIn(false);
        navigate('/'); // Redirect to landing page
    };

    const renderMainContent = () => {
        switch (activeMainFilter) {
            case 'Dashboard':
                return (
                    <div className="dashboard-page">
                        <div className="todo-welcome">
                            <div className="welcome-box premium-card">
                                <h2>Welcome</h2>
                                <p>Let's schedule your tasks</p>
                            </div>
                            <div className="quote-box premium-card">
                                💡 <span className="quote-text-only">{quotes[quoteIndex]}</span>
                            </div>
                            <div className="calendar-box premium-card">
                                <h3>{weekdays[today.getDay()]}, {today.toLocaleString('default', { month: 'long' })} {today.getDate()}</h3>
                                <div className="date-strip">
                                    {getUpcomingDates().map((d, i) => (
                                        <div key={i} className={`date-pill ${i === 0 ? 'today-highlight' : ''}`}>
                                            <span className="day-label">{d.day}</span>
                                            <span className="day-number">{d.date}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="todo-main-content">
                            <div className="today-panel premium-card">
                                <h3>TODAY</h3>
                                <div className="today-boxes">
                                    <div className="summary-box">To Do ({todos.filter(t => !t.completed && !t.trashed).length})</div>
                                    <div className="summary-box">Overdue (0)</div>
                                    <div className="summary-box">Unplanned ({todos.filter(t => !t.completed && !t.trashed && !t.category && !t.priority && !t.time && !t.dueDate).length})</div>
                                </div>
                                <div className="circular-progress" style={{ '--progress': `${getOverallCompletion() * 3.6}deg` }}>
                                    <span>{getOverallCompletion()}%</span>
                                </div>
                            </div>

                            <div className="todo-section">
                                <div className="gray-gradient-container premium-section-bg">
                                    <div className="todo-input-section">
                                        <input
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Create a new task..."
                                            className="create-task-input"
                                            onKeyPress={(e) => { if (e.key === 'Enter') addTodo(); }}
                                        />
                                        <button onClick={addTodo}>Add</button>
                                    </div>
                                    {/* Removed newTaskPriority, newTaskCategory, newTaskTime, newTaskDueDate, newTaskDescription inputs from here */}

                                    <div className="todo-list">
                                        {currentFilteredTodos.length === 0 && (
                                            <p className="no-tasks-message">No tasks in this view yet. Add one!</p>
                                        )}
                                        {currentFilteredTodos.map((todo) => (
                                            <React.Fragment key={todo.id}>
                                                <div
                                                    className={`todo-item ${todo.completed ? 'done' : ''} ${todo.priority || ''}`}
                                                >
                                                    <span className="toggle-check-box" onClick={() => toggle(todo.id)}>
                                                        {todo.completed ? <FaCheck /> : <FaRegSquare />}
                                                    </span>
                                                    <div className="todo-text" onClick={() => toggle(todo.id)}>{todo.title}</div>

                                                    <div className="task-labels-group">
                                                        {todo.category && <span className="task-label">{todo.category}</span>}
                                                        {todo.priority && <span className="task-label">{todo.priority}</span>}
                                                        {todo.dueDate && <span className="task-label due-date-label">📅 {todo.dueDate}</span>}
                                                    </div>

                                                    {todo.time && (
                                                        <span className="todo-time-display">🕒 {todo.time}</span>
                                                    )}

                                                    {(!todo.category && !todo.priority && !todo.time && !todo.dueDate && !todo.description) && <span className="unassigned-marker">!</span>}

                                                    <div className="task-options" onClick={() => handleTaskMenuOpen(todo.id)}>
                                                        <FaEllipsisV />
                                                    </div>

                                                    <button onClick={() => moveToTrash(todo.id)} className="delete-btn"><FaTrashAlt /></button>
                                                </div>

                                                {/* Task Menu Popup (3 dots menu) */}
                                                {activeTaskMenuIndex !== null && todos[activeTaskMenuIndex]?.id === todo.id && (
                                                    <div className="task-menu-popup-overlay">
                                                        <div className="task-menu-popup">
                                                            <h3>Edit Task</h3>
                                                            <div className="menu-column">
                                                                <span className="menu-header">Priority</span>
                                                                {['easy', 'medium', 'hard', 'urgent'].map(level => (
                                                                    <div key={level} className={`menu-item ${level}`} onClick={() => updatePriority(todo.id, level)}>{level}</div>
                                                                ))}
                                                            </div>
                                                            <div className="menu-column">
                                                                <span className="menu-header">Category</span>
                                                                {categories.map((cat, index) => (
                                                                    <div key={cat} className={`menu-item ${cat.toLowerCase()}`} onClick={() => updateCategory(todo.id, cat)}
                                                                        style={{ backgroundColor: categoryColors[index % categoryColors.length] || '#f1f5f9', color: '#333' }}>
                                                                    {cat}
                                                                </div>
                                                            ))}
                                                            </div>
                                                            <div className="menu-column">
                                                                <span className="menu-header">Schedule Time</span>
                                                                <div className="time-picker-custom">
                                                                    <div className="time-select-group">
                                                                        <select value={modalHour} onChange={(e) => setModalHour(e.target.value)} className="time-select">
                                                                            <option value="">Hour</option>
                                                                            {hours.map(h => (<option key={h} value={h}>{h}</option>))}
                                                                        </select>
                                                                        <span className="time-colon">:</span>
                                                                        <select value={modalMinute} onChange={(e) => setModalMinute(e.target.value)} className="time-select">
                                                                            <option value="">Min</option>
                                                                            {minutes.map(m => (<option key={m} value={m}>{m}</option>))}
                                                                        </select>
                                                                    </div>
                                                                    <div className="ampm-buttons-group">
                                                                        <button
                                                                            className={`ampm-button ${modalAmPm === 'AM' ? 'selected' : ''}`}
                                                                            onClick={() => setModalAmPm('AM')}>AM</button>
                                                                        <button
                                                                            className={`ampm-button ${modalAmPm === 'PM' ? 'selected' : ''}`}
                                                                            onClick={() => setModalAmPm('PM')}>PM</button>
                                                                    </div>
                                                                </div>
                                                                <span className="menu-header" style={{ marginTop: '1rem' }}>Due Date</span>
                                                                <input
                                                                    type="date"
                                                                    value={modalDueDate}
                                                                    onChange={(e) => setModalDueDate(e.target.value)}
                                                                    className="date-input"
                                                                />
                                                                <span className="menu-header" style={{ marginTop: '1rem' }}>Description/Notes</span>
                                                                <textarea
                                                                    value={modalDescription}
                                                                    onChange={(e) => setModalDescription(e.target.value)}
                                                                    placeholder="Add a description..."
                                                                    className="description-textarea"
                                                                ></textarea>
                                                            </div>
                                                            {/* This button saves all changes made in the modal to the backend */}
                                                            <button className="modal-done-btn" onClick={handleModalDone}>Done</button>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Displays description below task title if not in edit mode */}
                                                {!todo.completed && todo.description && (activeTaskMenuIndex === null || todos[activeTaskMenuIndex]?.id !== todo.id) && (
                                                    <div className="todo-description-display">
                                                        {todo.description}
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'My Day':
                return (
                    <>
                        <div className="my-day-combined-section">
                            <div className="my-day-info-panel premium-card">
                                <h2 className="my-day-greeting">{greeting}, {username}!</h2>

                                <div className="my-day-summary-boxes">
                                    <div className="summary-box">Total for Today ({countMyDayTotal()})</div>
                                    <div className="summary-box">Completed ({countMyDayCompleted()})</div>
                                    <div className="summary-box">Remaining ({countMyDayRemaining()})</div>
                                </div>

                                <div className="my-day-progress-quote">
                                    <div className="circular-progress my-day-progress" style={{ '--progress': `${getMyDayCompletion() * 3.6}deg` }}>
                                        <span>{getMyDayCompletion()}%</span>
                                    </div>
                                    <div className="quote-box my-day-quote-box">
                                        💡 <span className="quote-text-only">{quotes[quoteIndex]}</span>
                                    </div>
                                </div>
                            </div>

                            <img
                                src={todayImage}
                                alt={`${todayWeekdayName} illustration`}
                                className="my-day-weekday-image"
                                onError={(e) => e.target.src = 'https://placehold.co/120x120/cccccc/000000?text=Image Not Found'}
                            />
                        </div>

                        <div className="myday-tasks-section">
                            <div className="gray-gradient-container premium-section-bg">
                                <h2 className="section-title">My Day Tasks</h2>
                                <div className="todo-input-section">
                                    <input
                                        type="text"
                                        className="create-task-input"
                                        placeholder="Add a new task for My Day..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                // Auto-set due date to today for My Day tasks
                                                const tempInput = input;
                                                setInput(''); // Clear input immediately
                                                addTodoWithDueDate(tempInput, getDateString(new Date()));
                                            }
                                        }}
                                    />
                                    <button onClick={() => {
                                        // Auto-set due date to today for My Day tasks
                                        const tempInput = input;
                                        setInput(''); // Clear input immediately
                                        addTodoWithDueDate(tempInput, getDateString(new Date()));
                                    }}>Add</button>
                                </div>
                                {/* Removed newTaskPriority, newTaskCategory, newTaskTime, newTaskDueDate, newTaskDescription inputs from here */}

                                <div className="todo-list">
                                    {currentFilteredTodos.length === 0 && (
                                        <p className="myday-no-tasks-message">No tasks for My Day yet. Add one with today's date!</p>
                                    )}
                                    {currentFilteredTodos.map((todo) => (
                                        <React.Fragment key={todo.id}>
                                            <div
                                                className={`todo-item ${todo.completed ? 'done' : ''} ${todo.priority || ''}`}
                                            >
                                                <span className="toggle-check-box" onClick={() => toggle(todo.id)}>
                                                    {todo.completed ? <FaCheck /> : <FaRegSquare />}
                                                </span>
                                                <div className="todo-text" onClick={() => toggle(todo.id)}>{todo.title}</div>

                                                <div className="task-labels-group">
                                                    {todo.category && <span className="task-label">{todo.category}</span>}
                                                    {todo.priority && <span className="task-label">{todo.priority}</span>}
                                                    {todo.dueDate && <span className="task-label due-date-label">📅 {todo.dueDate}</span>}
                                                </div>

                                                {todo.time && (
                                                    <span className="todo-time-display">🕒 {todo.time}</span>
                                                )}

                                                {(!todo.category && !todo.priority && !todo.time && !todo.dueDate && !todo.description) && <span className="unassigned-marker">!</span>}

                                                <div className="task-options" onClick={() => handleTaskMenuOpen(todo.id)}>
                                                    <FaEllipsisV />
                                                </div>

                                                <button onClick={() => moveToTrash(todo.id)} className="delete-btn"><FaTrashAlt /></button>
                                            </div>

                                            {/* Task Menu Popup (3 dots menu) */}
                                            {activeTaskMenuIndex !== null && todos[activeTaskMenuIndex]?.id === todo.id && (
                                                <div className="task-menu-popup-overlay">
                                                    <div className="task-menu-popup">
                                                        <h3>Edit Task</h3>
                                                        <div className="menu-column">
                                                            <span className="menu-header">Priority</span>
                                                            {['easy', 'medium', 'hard', 'urgent'].map(level => (
                                                                <div key={level} className={`menu-item ${level}`} onClick={() => updatePriority(todo.id, level)}>{level}</div>
                                                            ))}
                                                        </div>
                                                        <div className="menu-column">
                                                            <span className="menu-header">Category</span>
                                                            {categories.map((cat, index) => (
                                                                <div key={cat} className={`menu-item ${cat.toLowerCase()}`} onClick={() => updateCategory(todo.id, cat)}
                                                                    style={{ backgroundColor: categoryColors[index % categoryColors.length] || '#f1f5f9', color: '#333' }}>
                                                                    {cat}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="menu-column">
                                                            <span className="menu-header">Schedule Time</span>
                                                            <div className="time-picker-custom">
                                                                <div className="time-select-group">
                                                                    <select value={modalHour} onChange={(e) => setModalHour(e.target.value)} className="time-select">
                                                                        <option value="">Hour</option>
                                                                        {hours.map(h => (<option key={h} value={h}>{h}</option>))}
                                                                    </select>
                                                                    <span className="time-colon">:</span>
                                                                    <select value={modalMinute} onChange={(e) => setModalMinute(e.target.value)} className="time-select">
                                                                        <option value="">Min</option>
                                                                        {minutes.map(m => (<option key={m} value={m}>{m}</option>))}
                                                                    </select>
                                                                </div>
                                                                <div className="ampm-buttons-group">
                                                                    <button
                                                                        className={`ampm-button ${modalAmPm === 'AM' ? 'selected' : ''}`}
                                                                        onClick={() => setModalAmPm('AM')}>AM</button>
                                                                    <button
                                                                        className={`ampm-button ${modalAmPm === 'PM' ? 'selected' : ''}`}
                                                                        onClick={() => setModalAmPm('PM')}>PM</button>
                                                                </div>
                                                            </div>
                                                            <span className="menu-header" style={{ marginTop: '1rem' }}>Due Date</span>
                                                            <input
                                                                type="date"
                                                                value={modalDueDate}
                                                                onChange={(e) => setModalDueDate(e.target.value)}
                                                                className="date-input"
                                                            />
                                                            <span className="menu-header" style={{ marginTop: '1rem' }}>Description/Notes</span>
                                                            <textarea
                                                                value={modalDescription}
                                                                onChange={(e) => setModalDescription(e.target.value)}
                                                                placeholder="Add a description..."
                                                                className="description-textarea"
                                                            ></textarea>
                                                        </div>
                                                        {/* This button saves all changes made in the modal to the backend */}
                                                        <button className="modal-done-btn" onClick={handleModalDone}>Done</button>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Displays description below task title if not in edit mode */}
                                            {!todo.completed && todo.description && (activeTaskMenuIndex === null || todos[activeTaskMenuIndex]?.id !== todo.id) && (
                                                <div className="todo-description-display">
                                                    {todo.description}
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                );
            case 'Upcoming':
            case 'Important':
            case 'All Tasks':
            case 'Completed':
            case 'Categories':
                const pageTitle = activeMainFilter === 'All Tasks' ? 'All Tasks' : activeMainFilter;
                const emptyMessage = activeMainFilter === 'Trash' ? 'Trash is empty.' : `No ${pageTitle.toLowerCase()} tasks.`;

                return (
                    <div className="filtered-tasks-view">
                        <h2 className="section-title">{activeMainFilter} Tasks</h2>
                        <div className="gray-gradient-container premium-section-bg">
                            {/* New Task Property Inputs for Filtered Views */}
                            <div className="todo-input-section">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Create a new task..."
                                    className="create-task-input"
                                    onKeyPress={(e) => { if (e.key === 'Enter') addTodo(); }}
                                />
                                <button onClick={addTodo}>Add</button>
                            </div>
                            {/* Removed newTaskPriority, newTaskCategory, newTaskTime, newTaskDueDate, newTaskDescription inputs from here */}

                            <div className="todo-list">
                                {currentFilteredTodos.length === 0 && (
                                    <p className="no-tasks-message">No tasks in this category/filter yet!</p>
                                )}
                                {currentFilteredTodos.map((todo) => (
                                    <React.Fragment key={todo.id}>
                                        <div
                                            className={`todo-item ${todo.completed ? 'done' : ''} ${todo.priority || ''}`}
                                        >
                                            <span className="toggle-check-box" onClick={() => toggle(todo.id)}>
                                                {todo.completed ? <FaCheck /> : <FaRegSquare />}
                                            </span>
                                            <div className="todo-text" onClick={() => toggle(todo.id)}>{todo.title}</div>

                                            <div className="task-labels-group">
                                                {todo.category && <span className="task-label">{todo.category}</span>}
                                                {todo.priority && <span className="task-label">{todo.priority}</span>}
                                                {todo.dueDate && <span className="task-label due-date-label">📅 {todo.dueDate}</span>}
                                            </div>

                                            {todo.time && (
                                                <span className="todo-time-display">🕒 {todo.time}</span>
                                            )}

                                            {(!todo.category && !todo.priority && !todo.time && !todo.dueDate && !todo.description) && <span className="unassigned-marker">!</span>}

                                            <div className="task-options" onClick={() => handleTaskMenuOpen(todo.id)}>
                                                <FaEllipsisV />
                                            </div>

                                            <button onClick={() => moveToTrash(todo.id)} className="delete-btn"><FaTrashAlt /></button>
                                        </div>

                                        {/* Task Menu Popup (3 dots menu) */}
                                        {activeTaskMenuIndex !== null && todos[activeTaskMenuIndex]?.id === todo.id && (
                                            <div className="task-menu-popup-overlay">
                                                <div className="task-menu-popup">
                                                    <h3>Edit Task</h3>
                                                    <div className="menu-column">
                                                        <span className="menu-header">Priority</span>
                                                        {['easy', 'medium', 'hard', 'urgent'].map(level => (
                                                            <div key={level} className={`menu-item ${level}`} onClick={() => updatePriority(todo.id, level)}>{level}</div>
                                                        ))}
                                                    </div>
                                                    <div className="menu-column">
                                                        <span className="menu-header">Category</span>
                                                        {categories.map((cat, index) => (
                                                            <div key={cat} className={`menu-item ${cat.toLowerCase()}`} onClick={() => updateCategory(todo.id, cat)}
                                                                style={{ backgroundColor: categoryColors[index % categoryColors.length] || '#f1f5f9', color: '#333' }}>
                                                                {cat}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="menu-column">
                                                        <span className="menu-header">Schedule Time</span>
                                                        <div className="time-picker-custom">
                                                            <div className="time-select-group">
                                                                <select value={modalHour} onChange={(e) => setModalHour(e.target.value)} className="time-select">
                                                                    <option value="">Hour</option>
                                                                    {hours.map(h => (<option key={h} value={h}>{h}</option>))}
                                                                </select>
                                                                <span className="time-colon">:</span>
                                                                <select value={modalMinute} onChange={(e) => setModalMinute(e.target.value)} className="time-select">
                                                                    <option value="">Min</option>
                                                                    {minutes.map(m => (<option key={m} value={m}>{m}</option>))}
                                                                </select>
                                                            </div>
                                                            <div className="ampm-buttons-group">
                                                                <button
                                                                    className={`ampm-button ${modalAmPm === 'AM' ? 'selected' : ''}`}
                                                                    onClick={() => setModalAmPm('AM')}>AM</button>
                                                                <button
                                                                    className={`ampm-button ${modalAmPm === 'PM' ? 'selected' : ''}`}
                                                                    onClick={() => setModalAmPm('PM')}>PM</button>
                                                            </div>
                                                        </div>
                                                        <span className="menu-header" style={{ marginTop: '1rem' }}>Due Date</span>
                                                        <input
                                                            type="date"
                                                            value={modalDueDate}
                                                            onChange={(e) => setModalDueDate(e.target.value)}
                                                            className="date-input"
                                                        />
                                                        <span className="menu-header" style={{ marginTop: '1rem' }}>Description/Notes</span>
                                                        <textarea
                                                            value={modalDescription}
                                                            onChange={(e) => setModalDescription(e.target.value)}
                                                            placeholder="Add a description..."
                                                            className="description-textarea"
                                                        ></textarea>
                                                    </div>
                                                    {/* This button saves all changes made in the modal to the backend */}
                                                    <button className="modal-done-btn" onClick={handleModalDone}>Done</button>
                                                </div>
                                            </div>
                                        )}
                                        {/* Displays description below task title if not in edit mode */}
                                        {!todo.completed && todo.description && (activeTaskMenuIndex === null || todos[activeTaskMenuIndex]?.id !== todo.id) && (
                                            <div className="todo-description-display">
                                                {todo.description}
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'Trash':
                return (
                    <div className="trash-view">
                        <h2 className="section-title">Trash</h2>
                        <div className="gray-gradient-container premium-section-bg">
                            <div className="todo-list">
                                {currentFilteredTodos.length === 0 && (
                                    <p className="empty-message">Your trash is empty. No deleted tasks here!</p>
                                )}
                                {currentFilteredTodos.map((todo) => (
                                    <div key={todo.id} className="todo-item trashed-item">
                                        <div className="todo-text">{todo.title}</div>
                                        <div className="trash-actions">
                                            <button onClick={() => restoreFromTrash(todo.id)} className="restore-btn">Restore</button>
                                            <button onClick={() => { if (window.confirm('Are you sure you want to permanently delete this task?')) { permanentlyDeleteTask(todo.id); } }} className="permanently-delete-btn">Permanently Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'Settings':
                return (
                    <div className="settings-view">
                        <h2 className="section-title">Settings</h2>
                        <div className="settings-panel premium-card">
                            <div className="setting-item">
                                <label htmlFor="username-input">Change Username:</label>
                                <input
                                    id="username-input"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter new username"
                                    className="setting-input"
                                />
                            </div>
                            <div className="setting-item">
                                <label htmlFor="default-category-select">Default Category:</label>
                                <select id="default-category-select" className="setting-select">
                                    <option value="none">None</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="setting-item">
                                <label htmlFor="sort-order-select">Default Sort Order:</label>
                                <select id="sort-order-select" className="setting-select">
                                    <option value="dueDate">Due Date</option>
                                    <option value="priority">Priority</option>
                                    <option value="alphabetical">Alphabetical</option>
                                    <option value="creationDate">Creation Date</option>
                                </select>
                            </div>
                            <div className="setting-item">
                                <label>Notifications:</label>
                                <input type="checkbox" id="notifications-toggle" className="setting-checkbox" defaultChecked />
                                <label htmlFor="notifications-toggle">Enable Daily Reminders</label>
                            </div>
                            <button className="premium-button">Save Settings</button>
                        </div>
                    </div>
                );
            case 'Feedback':
                return (
                    <div className="feedback-view">
                        <h2 className="section-title">Send Feedback</h2>
                        <div className="feedback-panel premium-card">
                            <p className="feedback-intro">We'd love to hear your thoughts and suggestions to improve ZenTodo!</p>
                            <textarea
                                placeholder="Share your feedback here..."
                                className="feedback-textarea"
                                rows="8"
                            ></textarea>
                            <button className="premium-button">Submit Feedback</button>
                            <p className="feedback-note">Thank you for helping us make ZenTodo better!</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="todo-main">
            <div className="sidebar">
                <h2 className="logo-animated">ZenTodo</h2>

                {/* Profile Section */}
                {isLoggedIn ? (
                    <div className="profile-section">
                        <FaUserCircle className="profile-icon" />
                        <span className="profile-name">{username}</span> {/* Displays username from state */}
                        <button className="profile-logout-btn" onClick={handleLogout}>Sign Out</button>
                    </div>
                ) : (
                    <div className="profile-section guest-mode">
                        <FaUserCircle className="profile-icon guest" />
                        <span className="profile-name">Guest</span>
                        <button className="profile-login-btn" onClick={() => navigate('/')}>Sign In</button>
                    </div>
                )}

                <ul className="sidebar-menu">
                    <li className={activeMainFilter === 'Dashboard' ? 'active' : ''}
                        onClick={() => { setActiveMainFilter('Dashboard'); setSelectedCategory('All'); }}>
                        <FaTachometerAlt /> Dashboard
                    </li>
                    <li className={activeMainFilter === 'My Day' ? 'active' : ''}
                        onClick={() => { setActiveMainFilter('My Day'); setSelectedCategory('All'); }}>
                        <FaSun /> My Day <span className="count">({countFilter('My Day')})</span>
                    </li>
                    <li className={activeMainFilter === 'Upcoming' ? 'active' : ''}
                        onClick={() => { setActiveMainFilter('Upcoming'); setSelectedCategory('All'); }}>
                        <FaCalendarAlt /> Upcoming <span className="count">({countFilter('Upcoming')})</span>
                    </li>
                    <li className={activeMainFilter === 'Important' ? 'active' : ''}
                        onClick={() => { setActiveMainFilter('Important'); setSelectedCategory('All'); }}>
                        <FaStar /> Important <span className="count">({countFilter('Important')})</span>
                    </li>
                    <li className={activeMainFilter === 'All Tasks' ? 'active' : ''}
                        onClick={() => { setActiveMainFilter('All Tasks'); setSelectedCategory('All'); }}>
                        <FaClipboardList /> All Tasks <span className="count">({countFilter('All Tasks')})</span>
                    </li>
                    <li className={activeMainFilter === 'Completed' ? 'active' : ''}
                        onClick={() => { setActiveMainFilter('Completed'); setSelectedCategory('All'); }}>
                        <FaCheck /> Completed <span className="count">({countFilter('Completed')})</span>
                    </li>
                    <li className={activeMainFilter === 'Trash' ? 'active' : ''}
                        onClick={() => { setActiveMainFilter('Trash'); setSelectedCategory('All'); }}>
                        <FaTrashAlt /> Trash <span className="count">({countFilter('Trash')})</span>
                    </li>

                    <li className={activeMainFilter === 'Categories' ? 'active' : ''}
                        onClick={() => { setCategoryDropdown(!categoryDropdown); setActiveMainFilter('Categories'); }}>
                        <FaTasks /> Categories
                    </li>
                    {categoryDropdown && (
                        <div className="sidebar-dropdown">
                            {categories.map((cat, index) => (
                                <li key={cat}
                                    className={selectedCategory === cat ? 'active-category' : ''}
                                    onClick={() => setSelectedCategory(cat)}
                                    // Apply background color from categoryColors for active category in dropdown
                                    style={{ backgroundColor: selectedCategory === cat ? categoryColors[index % categoryColors.length] : '', color: selectedCategory === cat ? '#333' : '' }}
                                >
                                    {cat} <span className="count">({countCategory(cat)})</span>
                                </li>
                            ))}
                            <li className="add-category-input-row">
                                <input
                                    type="text"
                                    placeholder="New category"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    onKeyPress={(e) => { if (e.key === 'Enter') addCategory(); }}
                                />
                                <button onClick={addCategory}><FaPlus /></button>
                            </li>
                        </div>
                    )}
                    <li className={activeMainFilter === 'Settings' ? 'active' : ''}
                        onClick={() => { setActiveMainFilter('Settings'); setSelectedCategory('All'); }}>
                        <FaCog /> Settings
                    </li>
                    <li className={activeMainFilter === 'Feedback' ? 'active' : ''}
                        onClick={() => { setActiveMainFilter('Feedback'); setSelectedCategory('All'); }}>
                        <FaCog /> Feedback
                    </li>
                </ul>
            </div>
            <div className="content-area">
                <header className="todo-header">
                    <div className="header-title-group">
                        <h2 className="section-title">
                            {activeMainFilter === 'Dashboard' ? 'Welcome to ZenTodo' : activeMainFilter === 'My Day' ? 'My Day' : activeMainFilter}
                        </h2>
                    </div>
                    {!['Settings', 'Feedback', 'Trash', 'Categories', 'My Day', 'Upcoming', 'Important', 'All Tasks', 'Completed'].includes(activeMainFilter) && (
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            🔍
                        </div>
                    )}
                </header>

                {renderMainContent()}
            </div>
        </div>
    );
}

export default TodoApp;
