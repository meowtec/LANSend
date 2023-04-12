import { User } from '../types';
import { request } from '../utils/request';

export const fetchUserInfo = () => request<User>('/api/user-info');

export const fetchUsers = () => request<User[]>('/api/users');

export const updateUserInfo = (data: User) => request<User>('/api/user-info', {
  method: 'POST',
  body: data,
});
