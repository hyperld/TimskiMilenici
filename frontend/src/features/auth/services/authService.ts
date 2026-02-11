import { User } from '../../user/types';

const API_URL = 'http://localhost:8080/api/auth';

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  fullName: string;
  username: string;
  role: 'USER' | 'OWNER' | 'ADMIN' | 'BUSINESS_OWNER';
  phoneNumber?: string;
  address?: string;
  profileImageUrl?: string;
  profilePictureUrl?: string;
}

export interface SignupData {
  email: string;
  password?: string;
  role: string;
  fullName: string;
  username: string;
  profilePictureUrl?: string;
}

export interface PasswordData {
  oldPassword?: string;
  newPassword?: string;
}

export const authService = {
  login: async (identifier: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }

    return await response.json();
  },

  register: async (userData: any): Promise<AuthResponse> => {
    const roleMapping: Record<string, string> = {
      'user': 'USER',
      'owner': 'OWNER',
      'admin': 'ADMIN'
    };

    const signupData: SignupData = {
      email: userData.email,
      password: userData.password,
      role: roleMapping[userData.role] || 'USER',
      fullName: userData.fullName,
      username: userData.username,
      profilePictureUrl: userData.profilePictureUrl
    };

    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Registration failed');
    }

    return await response.json();
  },

  updateProfile: async (profileData: any): Promise<any> => {
    const userDataStr = localStorage.getItem('petpal_user');
    const token = userDataStr ? JSON.parse(userDataStr)?.token : null;

    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...profileData,
        userId: profileData.id // Backend expects userId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Failed to update profile');
    }

    return await response.json();
  },

  changePassword: async (passwordData: PasswordData): Promise<{ message: string }> => {
    const userDataStr = localStorage.getItem('petpal_user');
    const token = userDataStr ? JSON.parse(userDataStr)?.token : null;

    const response = await fetch(`${API_URL}/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(passwordData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Failed to change password');
    }

    return await response.json();
  }
};
