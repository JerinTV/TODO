// src/components/LandingPage.js

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCheckCircle, FaRocket, FaShieldAlt, FaLightbulb, FaEnvelope, FaInfoCircle, FaUsers, FaCloudUploadAlt, FaSyncAlt } from 'react-icons/fa';
import './LandingPage.css';

function LandingPage() {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [activeSection, setActiveSection] = useState('home');
    const [drifterContainerHeight, setDrifterContainerHeight] = useState(window.innerHeight);

    // --- UPDATED STATE FOR FORM INPUTS ---
    const [username, setUsername] = useState(''); // Used for both login and signup username
    const [email, setEmail] = useState('');     // Only for signup email
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState(''); // <--- NEW STATE FOR PASSWORD CONFIRMATION
    const [errorMessage, setErrorMessage] = useState(''); // To display login/signup errors
    const [successMessage, setSuccessMessage] = useState(''); // To display success messages (e.g., after signup)


    // Refs for all sections (existing code)
    const landingContainerRef = useRef(null);
    const homeRef = useRef(null);
    const featuresRef = useRef(null);
    const aboutRef = useRef(null);
    const contactRef = useRef(null);

    const calculateDrifterHeight = () => {
        if (landingContainerRef.current) {
            setDrifterContainerHeight(landingContainerRef.current.scrollHeight + window.innerHeight * 0.5);
        }
    };

    useEffect(() => {
        calculateDrifterHeight();
        window.addEventListener('resize', calculateDrifterHeight);
        const loadTimeout = setTimeout(calculateDrifterHeight, 500);

        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1,
        };

        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                console.log(`Section ${entry.target.id} is intersecting: ${entry.isIntersecting}`);
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                    entry.target.classList.add('animated');
                    if (entry.target.id === 'features') {
                        console.log('Features section active detected, applying features-active class.');
                        entry.target.classList.add('features-active');
                        entry.target.classList.remove('features-inactive');
                    }
                } else {
                    entry.target.classList.remove('animated');
                    if (entry.target.id === 'features') {
                        console.log('Features section leaving detected, applying features-inactive class.');
                        entry.target.classList.add('features-inactive');
                        entry.target.classList.remove('features-active');
                    }
                }
            });
        }, observerOptions);

        if (homeRef.current) sectionObserver.observe(homeRef.current);
        if (featuresRef.current) sectionObserver.observe(featuresRef.current);
        if (aboutRef.current) sectionObserver.observe(aboutRef.current);
        if (contactRef.current) sectionObserver.observe(contactRef.current);

        return () => {
            window.removeEventListener('resize', calculateDrifterHeight);
            clearTimeout(loadTimeout);
            if (homeRef.current) sectionObserver.unobserve(homeRef.current);
            if (featuresRef.current) sectionObserver.unobserve(featuresRef.current);
            if (aboutRef.current) sectionObserver.unobserve(aboutRef.current);
            if (contactRef.current) sectionObserver.unobserve(contactRef.current);
        };
    }, []);

    const scrollToSection = (ref, sectionId) => {
        if (ref && ref.current) {
            const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 80;
            const elementPosition = ref.current.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            setActiveSection(sectionId);
        } else if (sectionId === 'home') {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
            setActiveSection('home');
        }
    };

    // Define animation names for drifters (existing code)
    const animationNames = ['drift1', 'drift2', 'drift3', 'drift4', 'drift5', 'drift6', 'drift7', 'drift8',
                            'drift9', 'drift10', 'drift11', 'drift12', 'drift13', 'drift14', 'drift15', 'drift16'];

    // --- UPDATED: Handle Form Submission (Login/Signup) ---
    const handleAuthSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission to avoid page reload
        setErrorMessage(''); // Clear previous errors
        setSuccessMessage(''); // Clear previous success messages

        const BASE_URL = 'http://127.0.0.1:8000/api/'; // Your Django API base URL

        if (isLogin) {
            // --- LOGIN LOGIC ---
            try {
                // For login, typically username (or email if configured) and password
                const response = await axios.post(`${BASE_URL}token/`, {
                    username: username, // Use the username state for login username
                    password: password,
                });

                // Axios automatically parses JSON and throws for non-2xx status
                console.log('Login successful:', response.data);
                localStorage.setItem('accessToken', response.data.access);
                localStorage.setItem('refreshToken', response.data.refresh);
                // Store the username in localStorage after successful login
                localStorage.setItem('loggedInUsername', username);

                setShowModal(false); // Close modal
                navigate('/todo'); // Navigate to the todo app

            } catch (error) {
                console.error('Error during login:', error);
                if (error.response) {
                    // Server responded with an error (e.g., 401, 400)
                    setErrorMessage(error.response.data.detail || 'Login failed. Please check your credentials.');
                } else if (error.request) {
                    // Request was made but no response received
                    setErrorMessage('No response from server. Please check your network connection.');
                } else {
                    // Something else happened
                    setErrorMessage('An unexpected error occurred during login.');
                }
            }
        } else {
            // --- SIGNUP LOGIC ---
            if (password !== password2) {
                setErrorMessage("Passwords do not match.");
                return;
            }

            try {
                const response = await axios.post(`${BASE_URL}register/`, {
                    username: username,
                    email: email,
                    password: password,
                    password2: password2, // Include password2 for confirmation
                });

                // Axios automatically parses JSON and throws for non-2xx status
                if (response.status === 201) {
                    console.log('Signup successful:', response.data);
                    setSuccessMessage('Registration successful! Please log in.');
                    // Optionally clear form fields
                    setUsername('');
                    setEmail('');
                    setPassword('');
                    setPassword2('');
                    setIsLogin(true); // Switch to login mode
                    // You might want to automatically log them in here or navigate to login page
                }
            } catch (error) {
                console.error('Error during signup:', error);
                if (error.response) {
                    // Server responded with an error (e.g., 400 Bad Request)
                    const data = error.response.data;
                    let errorMsg = 'Signup failed: ';
                    if (data.username) errorMsg += `Username: ${data.username[0]} `;
                    if (data.email) errorMsg += `Email: ${data.email[0]} `;
                    if (data.password) errorMsg += `Password: ${data.password[0]} `;
                    if (data.password2) errorMsg += `Password confirmation: ${data.password2[0]} `;
                    if (data.detail) errorMsg = data.detail; // General error
                    setErrorMessage(errorMsg || 'Signup failed. Please try again.');
                } else if (error.request) {
                    setErrorMessage('No response from server. Please check your network connection.');
                } else {
                    setErrorMessage('An unexpected error occurred during signup.');
                }
            }
        }
    };


    const handleModalToggle = (isLoginMode) => {
        setShowModal(true);
        setIsLogin(isLoginMode);
        setErrorMessage(''); // Clear errors when opening/toggling modal
        setSuccessMessage(''); // Clear success messages
        // Clear form fields when toggling mode
        setUsername('');
        setEmail('');
        setPassword('');
        setPassword2('');
    };

    return (
        <div className="landing-container" ref={landingContainerRef}>
            {/* Navbar (existing code) */}
            <nav className="navbar">
                <div className="logo">ZenTodo</div>
                <div className="nav-links">
                    <a onClick={() => scrollToSection(homeRef, 'home')} className={activeSection === 'home' ? 'active-link' : ''}>Home</a>
                    <a onClick={() => scrollToSection(featuresRef, 'features')} className={activeSection === 'features' ? 'active-link' : ''}>Features</a>
                    <a onClick={() => scrollToSection(aboutRef, 'about')} className={activeSection === 'about' ? 'active-link' : ''}>About</a>
                    <a onClick={() => scrollToSection(contactRef, 'contact')} className={activeSection === 'contact' ? 'active-link' : ''}>Contact</a>
                    <button className="auth-btn" onClick={() => handleModalToggle(true)}>Sign In</button> {/* Updated onClick */}
                </div>
            </nav>

            {/* Auth Modal (UPDATED) */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="auth-modal">
                        <h2>{isLogin ? 'Login to ZenTodo' : 'Create your ZenTodo account'}</h2>
                        {errorMessage && <p className="error-message">{errorMessage}</p>}
                        {successMessage && <p className="success-message">{successMessage}</p>} {/* Added success message display */}
                        <form onSubmit={handleAuthSubmit}>
                            {/* Username input - always present */}
                            <input
                                type="text"
                                placeholder="Username"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            {/* Email input - only for Signup */}
                            {!isLogin && (
                                <input
                                    type="email"
                                    placeholder="Email"
                                    required={!isLogin} // Required only for signup
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            )}
                            {/* Password input - always present */}
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {/* Confirm Password input - only for Signup */}
                            {!isLogin && (
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    required={!isLogin} // Required only for signup
                                    value={password2}
                                    onChange={(e) => setPassword2(e.target.value)}
                                />
                            )}
                            <button type="submit">{isLogin ? 'Login' : 'Sign Up'}</button>
                        </form>
                        <p>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <span onClick={() => handleModalToggle(!isLogin)} style={{ cursor: 'pointer', textDecoration: 'underline' }}> {/* Updated onClick */}
                                {isLogin ? 'Sign Up' : 'Login'}
                            </span>
                        </p>
                        <button className="close-btn" onClick={() => { setShowModal(false); setErrorMessage(''); setSuccessMessage(''); }}>✖</button> {/* Updated onClick */}
                    </div>
                </div>
            )}

            {/* Background Floating Images (existing code) */}
            <div className="floating-random" style={{ height: `${drifterContainerHeight}px` }}>
                {[...Array(16)].map((_, i) => {
                    const randomTop = Math.random() * (drifterContainerHeight - 180);
                    const randomLeft = Math.random() * 100;
                    const randomDuration = 15 + Math.random() * 10;
                    const randomDelay = Math.random() * 10;
                    const animationName = animationNames[i % animationNames.length];
                    return (
                        <img
                            key={i}
                            src={`/img${(i % 8) + 1}.jpg`}
                            className="drifter"
                            alt={`drifter-${i + 1}`}
                            style={{
                                top: `${randomTop}px`,
                                left: `${randomLeft}vw`,
                                animation: `${animationName} ${randomDuration}s ease-in-out ${randomDelay}s infinite alternate`
                            }}
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/150x150/1a1a1a/ffffff?text=Orb"; }}
                        />
                    );
                })}
            </div>

            {/* Hero Card (existing code) */}
            <div className="landing-content" id="home" ref={homeRef}>
                <img src="/todologo.jpg" alt="ZenTodo Logo" className="hero-image" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/160x160/cccccc/000000?text=Logo"; }} />
                <h1>Welcome to ZenTodo</h1>
                <p>Organize your tasks effortlessly. Minimal, elegant, and powerful.</p>
                <button onClick={() => navigate('/todo')} className="start-btn">
                    Go to Todo App →
                </button>
            </div>

            {/* Features Section (corrected - removed stray character) */}
            <section id="features" ref={featuresRef} className="landing-section">
                <h2>Key Features</h2>
                <p>ZenTodo is designed to simplify your life with powerful and intuitive tools.</p>
                <div className="features-grid">
                    <div className="feature-item">
                        <FaCheckCircle className="feature-icon" />
                        <h3>Intuitive Task Management</h3>
                        <p>Easily add, organize, and complete your tasks with a clean and simple interface.</p>
                    </div>
                    <div className="feature-item">
                        <FaRocket className="feature-icon" />
                        <h3>Boost Productivity</h3>
                        <p>Stay on top of your deadlines and priorities with smart reminders and categorization.</p>
                    </div>
                    <div className="feature-item">
                        <FaShieldAlt className="feature-icon" />
                        <h3>Secure & Private</h3>
                        <p>Your data is safe with us. We prioritize your privacy and data security.</p>
                    </div>
                    <div className="feature-item">
                        <FaLightbulb className="feature-icon" />
                        <h3>Smart Suggestions</h3>
                        <p>Get intelligent insights and suggestions to help you manage your day better.</p>
                    </div>
                    <div className="feature-item">
                        <FaCloudUploadAlt className="feature-icon" />
                        <h3>Cloud Sync</h3>
                        <p>Access your tasks from anywhere, on any device, with seamless cloud synchronization.</p>
                    </div>
                    <div className="feature-item">
                        <FaUsers className="feature-icon" />
                        <h3>Collaboration Tools</h3>
                        <p>Share tasks and collaborate with your team or friends to achieve goals together.</p>
                    </div>
                </div>
            </section>

            {/* About Section (existing code) */}
            <section id="about" ref={aboutRef} className="landing-section">
                <h2>About ZenTodo</h2>
                <div className="about-content">
                    <div className="about-text">
                        <p>ZenTodo was born from a simple idea: task management shouldn't be complicated. In a world full of distractions, we believe in creating tools that bring clarity and focus.</p>
                        <p>Our mission is to provide a beautiful, minimal, yet powerful todo application that helps you achieve your goals without feeling overwhelmed. We are committed to continuous improvement and listening to our users.</p>
                    </div>
                    <img src="/about.jpg" alt="About Us" className="about-image" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/350x300/a7d9f7/ffffff?text=About Us"; }} />
                </div>
            </section>

            {/* Contact Section (existing code) */}
            <section id="contact" ref={contactRef} className="landing-section">
                <h2>Contact Us</h2>
                <p>Have questions, feedback, or just want to say hello? Reach out to us!</p>
                <div className="contact-main-content">
                    <img src="/customer.jpg" alt="Customer Support" className="contact-image" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/350x200/cccccc/000000?text=Customer"; }} />
                    <form className="contact-form">
                        <input type="text" placeholder="Your Name" required />
                        <input type="email" placeholder="Your Email" required />
                        <textarea placeholder="Your Message" required></textarea>
                        <button type="submit" className="contact-submit-btn">Send Message</button>
                    </form>
                </div>
            </section>
        </div>
    );
}

export default LandingPage;