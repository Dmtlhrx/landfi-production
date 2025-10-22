import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ky from 'ky';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  displayName: string;
}

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const { login: setAuthUser } = useAuthStore();
  const navigate = useNavigate();

  const login = async (data: LoginData) => {
    setLoading(true);
    try {
      const response = await ky.post('api/auth/login', {
        json: data,
        prefixUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
      }).json<{ user: any; accessToken: string }>();

      setAuthUser(response.user, response.accessToken);
      toast.success('Connexion réussie !');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Erreur de connexion');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    try {
      const response = await ky.post('api/auth/register', {
        json: data,
        prefixUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
      }).json<{ user: any; accessToken: string }>();

      setAuthUser(response.user, response.accessToken);
      toast.success('Compte créé avec succès !');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Erreur lors de la création du compte');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { login, register, loading };
};