export interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  password: string;
  token?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  username: string;
}

export interface LoginData {
  credential: string;
  password: string;
}
