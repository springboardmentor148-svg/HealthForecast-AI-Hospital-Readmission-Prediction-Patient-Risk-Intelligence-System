import { UserProfile } from './types';

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'u-doc-1',
    name: 'Dr. Sarah Lin, MD',
    email: 'sarah.lin@healthforecast.ai',
    role: 'doctor',
    title: 'Attending Endocrinologist',
    department: 'Endocrinology',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'u-admin-1',
    name: 'Marcus Vance, MHA',
    email: 'marcus.vance@healthforecast.ai',
    role: 'hospital_admin',
    title: 'Director of Healthcare Quality & Outcomes',
    department: 'Administration',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'u-research-1',
    name: 'Dr. Elena Rostova, PhD',
    email: 'elena.rostova@healthforecast.ai',
    role: 'researcher',
    title: 'Lead Health Informatics Researcher',
    department: 'Clinical Data Analytics',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'u-sys-1',
    name: 'Alex Mercer',
    email: 'alex.mercer@healthforecast.ai',
    role: 'sysadmin',
    title: 'Chief MLOps Engineer & Admin',
    department: 'IT & Infrastructure',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  },
];