const API_BASE_URL = (
    process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api/'
).trim();

export default API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
