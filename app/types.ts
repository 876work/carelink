export type UserRole = 'parent' | 'babysitter' | 'admin';

export type AppProfile = {
  id: string;
  full_name: string;
  role: UserRole;
};

export type BabysitterProfile = {
  id: string;
  profile_id: string;
  bio: string;
  hourly_rate: number;
  location: string;
  is_approved: boolean;
};
