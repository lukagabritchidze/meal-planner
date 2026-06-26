/**
 * Service layer for communicating with the Spring Boot REST API for Authentication.
 */
const API_BASE_URL = 'http://localhost:8080/api/auth';

export const authApiService = {
  /**
   * Registers a new user account with email and password.
   *
   * @param {Object} payload { name, email, password }
   * @returns {Promise<Object>} The registered user details
   */
  async register(payload) {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to register account.');
    }
    return data;
  },

  /**
   * Logs in a user by validating their email and password credentials.
   *
   * @param {Object} payload { email, password }
   * @returns {Promise<Object>} The authenticated user details
   */
  async login(payload) {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to authenticate.');
    }
    return data;
  }
};
