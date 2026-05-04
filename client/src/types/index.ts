export interface BaseEntity {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User extends BaseEntity {
  id?: string; // Sometimes used by frontend state interchangeably with _id
  name: string;
  email: string;
  role: string;
  clientId: string;
  isActive?: boolean;
}

export interface Project extends BaseEntity {
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'on_hold';
  createdBy?: {
    _id?: string;
    name: string;
    email?: string;
  };
}
