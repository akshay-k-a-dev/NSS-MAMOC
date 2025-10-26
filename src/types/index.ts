export interface Program {
  id: string;
  title: string;
  description?: string;
  type: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  registrationOpen: boolean;
  department: string;
  coordinator: string; // Name of the coordinator
  participantIds: string[]; // Array of student IDs who are participants
  createdAt: string;
  // Legacy fields for backward compatibility
  date?: string;
  time?: string;
  venue?: string;
  coordinatorIds?: string[];
  updatedAt?: string;
  students?: Student[];
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  year: string;
  department: string;
  programId: string;
}

// New interfaces for the authentication system
export interface RegisteredStudent {
  id: string; // Custom alphanumeric ID
  name: string;
  email: string;
  phone: string;
  department: string;
  year: string;
  enrollmentNumber: string;
  password?: string; // Optional for frontend use
  createdAt: string;
  profileImageUrl?: string; // Optional profile picture
}

export interface Coordinator {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  password?: string; // Optional for frontend use
  isActive: boolean;
  createdAt: string;
}

export interface OfficerCredential {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface Certificate {
  programId: string;
  studentName: string;
  studentDepartment: string;
  programTitle: string;
  date: string;
  time: string;
  venue: string;
  coordinator: string;
}

// Reporting structures for Program Officer
export interface StudentExtraActivity {
  id: string;
  badge: 'green' | 'yellow';
  title: string;
  content: string;
  createdAt: string;
}

export interface CoordinatedProgram {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  createdAt: string;
}

export interface StudentReport {
  activities: StudentExtraActivity[];
  coordinatedPrograms: CoordinatedProgram[]; // Programs where this student is a coordinator
}

// Department management
export interface Department {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

