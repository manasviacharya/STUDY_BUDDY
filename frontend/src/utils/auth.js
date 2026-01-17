import { userAPI } from '../services/api';

export const checkAuth = async () => {
  try {
    const response = await userAPI.getMe();
    return response.data.data;
  } catch (error) {
    return null;
  }
};

export const logout = async () => {
  try {
    await userAPI.logout();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

