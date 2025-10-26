// API Service for NSS-MAMOC Backend Integration
import { 
  Program, 
  RegisteredStudent, 
  Coordinator, 
  Department, 
  StudentReport
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// API Response Types
interface ProgramApiResponse {
  id: string;
  title: string;
  description?: string;
  type: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  registrationOpen: boolean;
  department: string;
  coordinator: string;
  participantIds: string[];
  createdAt: string;
  updatedAt?: string;
}

interface CoordinatorApiResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  isActive: boolean;
  createdAt: string;
}

interface OfficerApiResponse {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface StudentReportApiResponse {
  id: string;
  studentId: string;
  studentName: string;
  department: string;
  year: string;
  activities: unknown[];
  coordinatedPrograms: unknown[];
  createdAt: string;
  updatedAt: string;
}



// Generic API call handler
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      error: `HTTP ${response.status}: ${response.statusText}` 
    }));
    throw new Error(error.error || error.message || 'API call failed');
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Students API
export const studentsApi = {
  async login(id: string, password: string): Promise<{ success: boolean; student?: RegisteredStudent }> {
    return apiCall<{ success: boolean; student?: RegisteredStudent }>('/students/login', {
      method: 'POST',
      body: JSON.stringify({ id, password }),
    });
  },

  async getAll(): Promise<RegisteredStudent[]> {
    return apiCall<RegisteredStudent[]>('/students');
  },

  async create(student: Omit<RegisteredStudent, 'createdAt'>): Promise<RegisteredStudent> {
    return apiCall<RegisteredStudent>('/students', {
      method: 'POST',
      body: JSON.stringify({
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone || '',
        department: student.department,
        year: student.year || '1',
        enrollmentNumber: student.enrollmentNumber || student.id
      }),
    });
  },

  async update(id: string, updates: Partial<RegisteredStudent>): Promise<RegisteredStudent> {
    return apiCall<RegisteredStudent>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        department: updates.department,
        year: updates.year,
        enrollmentNumber: updates.enrollmentNumber
      }),
    });
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/students/${id}`, {
      method: 'DELETE',
    });
  },
};

// Programs API
export const programsApi = {
  async getAll(): Promise<Program[]> {
    const programs = await apiCall<ProgramApiResponse[]>('/programs');
    // Map backend data to frontend Program interface
    return programs.map(program => ({
      id: program.id,
      title: program.title,
      description: program.description,
      type: program.type,
      startDate: program.startDate,
      endDate: program.endDate,
      maxParticipants: program.maxParticipants,
      registrationOpen: program.registrationOpen,
      department: program.department,
      coordinator: program.coordinator,
      participantIds: program.participantIds,
      createdAt: program.createdAt,
      // Legacy fields for backward compatibility
      date: program.startDate.split('T')[0],
      time: new Date(program.startDate).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      venue: program.department,
      coordinatorIds: [],
      updatedAt: program.updatedAt || program.createdAt,
    }));
  },

  async create(programData: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>): Promise<Program> {
    // Handle both old and new format input data
    const startDate = programData.startDate || new Date(`${programData.date}T${programData.time}`).toISOString();
    const endDate = programData.endDate || new Date(new Date(startDate).getTime() + 2 * 60 * 60 * 1000).toISOString();
    
    const program = await apiCall<ProgramApiResponse>('/programs', {
      method: 'POST',
      body: JSON.stringify({
        id: Date.now().toString(),
        title: programData.title,
        description: programData.description,
        type: programData.type || 'academic',
        startDate,
        endDate,
        maxParticipants: programData.maxParticipants || 100,
        registrationOpen: programData.registrationOpen !== undefined ? programData.registrationOpen : true,
        department: programData.department || programData.venue || 'General',
        coordinator: programData.coordinator,
      }),
    });

    // Return the full Program interface
    return {
      id: program.id,
      title: program.title,
      description: program.description,
      type: program.type,
      startDate: program.startDate,
      endDate: program.endDate,
      maxParticipants: program.maxParticipants,
      registrationOpen: program.registrationOpen,
      department: program.department,
      coordinator: program.coordinator,
      participantIds: program.participantIds,
      createdAt: program.createdAt,
      // Legacy fields for backward compatibility
      date: program.startDate.split('T')[0],
      time: new Date(program.startDate).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      venue: program.department,
      coordinatorIds: programData.coordinatorIds || [],
      updatedAt: program.updatedAt || program.createdAt,
    };
  },

  async update(id: string, programData: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>): Promise<Program> {
    // Handle both old and new format input data
    const startDate = programData.startDate || new Date(`${programData.date}T${programData.time}`).toISOString();
    const endDate = programData.endDate || new Date(new Date(startDate).getTime() + 2 * 60 * 60 * 1000).toISOString();
    
    const program = await apiCall<ProgramApiResponse>(`/programs/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: programData.title,
        description: programData.description,
        type: programData.type || 'academic',
        startDate,
        endDate,
        maxParticipants: programData.maxParticipants || 100,
        registrationOpen: programData.registrationOpen !== undefined ? programData.registrationOpen : true,
        department: programData.department || programData.venue || 'General',
        coordinator: programData.coordinator,
      }),
    });

    // Return the full Program interface
    return {
      id: program.id,
      title: program.title,
      description: program.description,
      type: program.type,
      startDate: program.startDate,
      endDate: program.endDate,
      maxParticipants: program.maxParticipants,
      registrationOpen: program.registrationOpen,
      department: program.department,
      coordinator: program.coordinator,
      participantIds: program.participantIds,
      createdAt: program.createdAt,
      // Legacy fields for backward compatibility
      date: program.startDate.split('T')[0],
      time: new Date(program.startDate).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      venue: program.department,
      coordinatorIds: programData.coordinatorIds || [],
      updatedAt: program.updatedAt || program.createdAt,
    };
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/programs/${id}`, {
      method: 'DELETE',
    });
  },
};

// Coordinators API
export const coordinatorsApi = {
  async login(id: string, password: string): Promise<{ success: boolean; coordinator?: Coordinator }> {
    return apiCall<{ success: boolean; coordinator?: Coordinator }>('/coordinators/login', {
      method: 'POST',
      body: JSON.stringify({ id, password }),
    });
  },

  async getAll(): Promise<Coordinator[]> {
    const coordinators = await apiCall<CoordinatorApiResponse[]>('/coordinators');
    // Transform backend data to frontend format
    return coordinators.map(coord => ({
      id: coord.id,
      name: coord.name,
      email: coord.email,
      phone: coord.phone,
      department: coord.department,
      position: coord.position,
      password: '', // Don't expose password
      isActive: coord.isActive,
      createdAt: coord.createdAt,
    }));
  },

  async create(coordinator: Omit<Coordinator, 'id' | 'createdAt'>): Promise<Coordinator> {
    const coord = await apiCall<CoordinatorApiResponse>('/coordinators', {
      method: 'POST',
      body: JSON.stringify({
        id: 'COORD' + Date.now().toString(),
        name: coordinator.name,
        email: coordinator.email || coordinator.name.toLowerCase().replace(/\s+/g, '.') + '@college.edu',
        phone: coordinator.phone || '9999999999',
        department: coordinator.department,
        position: coordinator.position || 'Coordinator',
        isActive: coordinator.isActive,
      }),
    });

    return {
      id: coord.id,
      name: coord.name,
      email: coord.email,
      phone: coord.phone,
      department: coord.department,
      position: coord.position,
      password: coordinator.password,
      isActive: coord.isActive,
      createdAt: coord.createdAt,
    };
  },

  async update(id: string, updates: Partial<Coordinator>): Promise<Coordinator> {
    const coord = await apiCall<CoordinatorApiResponse>(`/coordinators/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        department: updates.department,
        position: updates.position,
        isActive: updates.isActive,
      }),
    });

    return {
      id: coord.id,
      name: coord.name,
      email: coord.email,
      phone: coord.phone,
      department: coord.department,
      position: coord.position,
      password: updates.password || '',
      isActive: coord.isActive,
      createdAt: coord.createdAt,
    };
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/coordinators/${id}`, {
      method: 'DELETE',
    });
  },
};

// Departments API
export const departmentsApi = {
  async getAll(): Promise<Department[]> {
    return apiCall<Department[]>('/departments');
  },

  async create(name: string): Promise<Department> {
    return apiCall<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify({
        id: 'dept-' + Date.now().toString(),
        name,
        isActive: true,
      }),
    });
  },

  async update(id: string, name: string, isActive?: boolean): Promise<Department> {
    return apiCall<Department>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name,
        ...(isActive !== undefined && { isActive }),
      }),
    });
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>(`/departments/${id}`, {
      method: 'DELETE',
    });
  },
};

// Student Reports API
export const studentReportsApi = {
  async getAll(): Promise<StudentReportApiResponse[]> {
    return apiCall<StudentReportApiResponse[]>('/student-reports');
  },

  async getByStudentId(studentId: string): Promise<StudentReport | null> {
    try {
      return await apiCall<StudentReport>(`/student-reports/${studentId}`);
    } catch {
      // Return empty report if not found
      return {
        activities: [],
        coordinatedPrograms: [],
      };
    }
  },

  async create(report: unknown): Promise<StudentReportApiResponse> {
    return apiCall<StudentReportApiResponse>('/student-reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  },

  async update(studentId: string, report: unknown): Promise<StudentReportApiResponse> {
    return apiCall<StudentReportApiResponse>(`/student-reports/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(report),
    });
  },

  async delete(studentId: string): Promise<void> {
    return apiCall<void>(`/student-reports/${studentId}`, {
      method: 'DELETE',
    });
  },
};

// Officers API
export const officersApi = {
  async login(username: string, password: string): Promise<{ success: boolean; officer?: OfficerApiResponse }> {
    return apiCall<{ success: boolean; officer?: OfficerApiResponse }>('/officers/login', {
      method: 'POST',
      body: JSON.stringify({
        username,
        passwordHash: password, // In real app, this should be hashed
      }),
    });
  },

  async getAll(): Promise<OfficerApiResponse[]> {
    return apiCall<OfficerApiResponse[]>('/officers');
  },

  async create(officer: Omit<OfficerApiResponse, 'id' | 'createdAt'>): Promise<OfficerApiResponse> {
    return apiCall<OfficerApiResponse>('/officers', {
      method: 'POST',
      body: JSON.stringify(officer),
    });
  },

  async update(id: string, updates: Partial<OfficerApiResponse>): Promise<OfficerApiResponse> {
    return apiCall<OfficerApiResponse>(`/officers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};





// Health check
export const healthApi = {
  async check(): Promise<{ status: string; message: string; success: boolean }> {
    return apiCall<{ status: string; message: string; success: boolean }>('/health');
  }
};
