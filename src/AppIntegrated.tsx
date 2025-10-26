import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { TeacherPortal } from './components/TeacherPortal';
import { StudentPortal } from './components/StudentPortal';
import { ProgramOfficerPortal } from './components/ProgramOfficerPortal';
import { LoginPage } from './components/LoginPage';
import { ProgramsPage } from './components/ProgramsPage';
import { Program, RegisteredStudent, Coordinator, StudentReport, Department } from './types';



// Import API services
import {
  studentsApi,
  programsApi,
  coordinatorsApi,
  departmentsApi,
  studentReportsApi,
  officersApi,
  healthApi
} from './services/api';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'programs' | 'login' | 'student' | 'coordinator' | 'officer'>('home');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [studentReports, setStudentReports] = useState<Record<string, StudentReport>>({});
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    type: 'student' | 'coordinator' | 'officer';
    data: RegisteredStudent | Coordinator | { id: string; name: string; role?: string };
  } | null>(null);

  // Program Officer credentials (hardcoded for demo + fallback)
  const [officerCredentials, setOfficerCredentials] = useState([
    { id: 'OFFICER001', username: 'OFFICER001', password: 'NSS@OFFICER2025', role: 'super admin' },
    { id: 'officer001', username: 'officer001', password: 'nss@mamo', role: 'super admin' }
  ]);

  // Auto-logout functionality
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  // Load initial data from APIs
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        setLoadingError(null);

        // Check backend health first
        await healthApi.check();

        // Load all initial data in parallel
        const [
          programsData,
          studentsData,
          coordinatorsData,
          departmentsData,
        ] = await Promise.all([
          programsApi.getAll(),
          studentsApi.getAll(),
          coordinatorsApi.getAll(),
          departmentsApi.getAll(),
        ]);

        setPrograms(programsData);
        setRegisteredStudents(studentsData);
        setCoordinators(coordinatorsData);
        setDepartments(departmentsData);

        // Load student reports
        const reportsData = await studentReportsApi.getAll().catch(() => []);
        const reportsMap: Record<string, StudentReport> = {};
        reportsData.forEach((report) => {
          reportsMap[report.studentId] = {
            activities: (report.activities as StudentReport['activities']) || [],
            coordinatedPrograms: (report.coordinatedPrograms as StudentReport['coordinatedPrograms']) || [],
          };
        });
        setStudentReports(reportsMap);

      } catch (error) {
        console.error('Failed to load initial data:', error);
        setLoadingError(error instanceof Error ? error.message : 'Failed to connect to server');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Auto-logout function
  const handleAutoLogout = useCallback(() => {
    alert('You have been automatically logged out due to inactivity (30 minutes).');
    handleLogout();
  }, []);

  // Reset logout timer on user activity
  const resetLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    
    if (isLoggedIn) {
      logoutTimerRef.current = setTimeout(() => {
        handleAutoLogout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [isLoggedIn, INACTIVITY_TIMEOUT, handleAutoLogout]);

  // Set up activity listeners when user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      resetLogoutTimer();
      
      // Add event listeners for user activity
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      const handleUserActivity = () => {
        resetLogoutTimer();
      };
      
      events.forEach(event => {
        document.addEventListener(event, handleUserActivity, true);
      });
      
      // Cleanup function
      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleUserActivity, true);
        });
        if (logoutTimerRef.current) {
          clearTimeout(logoutTimerRef.current);
        }
      };
    } else {
      // Clear timer when not logged in
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    }
  }, [isLoggedIn, resetLogoutTimer]);

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, []);

  const handleLogin = async (credentials: { id: string; password: string }) => {
    try {
      // Try Officer login first
      try {
        const officerResult = await officersApi.login(credentials.id, credentials.password);
        if (officerResult.success && officerResult.officer) {
          setCurrentUser({ 
            type: 'officer', 
            data: officerResult.officer
          });
          setIsLoggedIn(true);
          setCurrentView('officer');
          return;
        }
      } catch (loginError) {
        console.log('Officer API login failed:', loginError);
        // Try fallback credentials for officers
        const matchingOfficer = officerCredentials.find(oc => 
          (credentials.id === oc.id || credentials.id === oc.username) && 
          credentials.password === oc.password
        );
        if (matchingOfficer) {
          setCurrentUser({ 
            type: 'officer', 
            data: { 
              id: matchingOfficer.id, 
              name: 'Program Officer',
              role: matchingOfficer.role
            } 
          });
          setIsLoggedIn(true);
          setCurrentView('officer');
          return;
        }
      }

      // Try Coordinator login
      try {
        const coordinatorResult = await coordinatorsApi.login(credentials.id, credentials.password);
        if (coordinatorResult.success && coordinatorResult.coordinator) {
          setCurrentUser({ 
            type: 'coordinator', 
            data: coordinatorResult.coordinator
          });
          setIsLoggedIn(true);
          setCurrentView('coordinator');
          return;
        }
      } catch (loginError) {
        console.log('Coordinator API login failed:', loginError);
      }

      // Try Student login
      try {
        const studentResult = await studentsApi.login(credentials.id, credentials.password);
        if (studentResult.success && studentResult.student) {
          setCurrentUser({ 
            type: 'student', 
            data: studentResult.student
          });
          setIsLoggedIn(true);
          setCurrentView('student');
          return;
        }
      } catch (loginError) {
        console.log('Student API login failed:', loginError);
      }

      alert('Invalid credentials');
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentView('home');
    
    // Clear the logout timer
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const handleAddProgram = async (programData: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newProgram = await programsApi.create(programData);
      setPrograms(prev => [newProgram, ...prev]);
      
      // Update student reports for coordinators
      if (programData.coordinatorIds && programData.coordinatorIds.length > 0) {
        setStudentReports(prev => {
          const updated = { ...prev };
          (programData.coordinatorIds || []).forEach(studentId => {
            const existingReport = updated[studentId];
            const coordinatedProgram = {
              id: newProgram.id,
              title: newProgram.title,
              description: newProgram.description || '',
              date: newProgram.date || newProgram.startDate?.split('T')[0] || '',
              time: newProgram.time || (newProgram.startDate ? new Date(newProgram.startDate).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : ''),
              venue: newProgram.venue || newProgram.department || '',
              createdAt: newProgram.createdAt,
            };
            
            if (existingReport) {
              updated[studentId] = {
                ...existingReport,
                coordinatedPrograms: [coordinatedProgram, ...existingReport.coordinatedPrograms],
              };
            } else {
              updated[studentId] = {
                activities: [],
                coordinatedPrograms: [coordinatedProgram],
              };
            }
          });
          return updated;
        });
        
        // Update reports in backend
        for (const studentId of programData.coordinatorIds) {
          try {
            const report = studentReports[studentId] || { activities: [], coordinatedPrograms: [] };
            await studentReportsApi.update(studentId, report);
          } catch (error) {
            console.error('Failed to update student report:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to add program:', error);
      alert('Failed to add program. Please try again.');
    }
  };

  const handleEditProgram = async (id: string, programData: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Get the old program to compare coordinators
      const oldProgram = programs.find(p => p.id === id);
      
      const updatedProgram = await programsApi.update(id, programData);
      setPrograms(prev => prev.map(program => 
        program.id === id ? updatedProgram : program
      ));
      
      // Update student reports if coordinators changed
      if (oldProgram && programData.coordinatorIds) {
        // Remove program from old coordinators' reports
        if (oldProgram.coordinatorIds) {
          setStudentReports(prev => {
            const updated = { ...prev };
            (oldProgram.coordinatorIds || []).forEach(studentId => {
              if (updated[studentId]) {
                updated[studentId] = {
                  ...updated[studentId],
                  coordinatedPrograms: (updated[studentId].coordinatedPrograms || []).filter(p => p.id !== id)
                };
              }
            });
            return updated;
          });
        }
        
        // Add program to new coordinators' reports
        if (programData.coordinatorIds.length > 0) {
          setStudentReports(prev => {
            const updated = { ...prev };
            const coordinatedProgram = {
              id: id,
              title: programData.title,
              description: programData.description || '',
              date: programData.date || '',
              time: programData.time || '',
              venue: programData.venue || '',
              createdAt: oldProgram.createdAt,
            };
            
            (programData.coordinatorIds || []).forEach(studentId => {
              const existingReport = updated[studentId];
              if (existingReport) {
                updated[studentId] = {
                  ...existingReport,
                  coordinatedPrograms: [coordinatedProgram, ...existingReport.coordinatedPrograms.filter(p => p.id !== id)]
                };
              } else {
                updated[studentId] = {
                  activities: [],
                  coordinatedPrograms: [coordinatedProgram]
                };
              }
            });
            return updated;
          });
        }
      }
    } catch (error) {
      console.error('Failed to edit program:', error);
      alert('Failed to edit program. Please try again.');
    }
  };

  const handleDeleteProgram = async (id: string) => {
    try {
      await programsApi.delete(id);
      setPrograms(prev => prev.filter(program => program.id !== id));
    } catch (error) {
      console.error('Failed to delete program:', error);
      alert('Failed to delete program. Please try again.');
    }
  };

  const handleAddParticipants = (programId: string, studentIds: string[]) => {
    setPrograms(prev => prev.map(program => 
      program.id === programId 
        ? { ...program, participantIds: studentIds, updatedAt: new Date().toISOString() }
        : program
    ));
  };

  const handleAddStudent = async (studentData: Omit<RegisteredStudent, 'createdAt'>) => {
    try {
      const newStudent = await studentsApi.create(studentData);
      setRegisteredStudents(prev => [...prev, newStudent]);
    } catch (error) {
      console.error('Failed to add student:', error);
      alert('Failed to add student. Please try again.');
    }
  };

  const handleAddCoordinator = async (coordinatorData: Omit<Coordinator, 'id' | 'createdAt'>) => {
    try {
      const newCoordinator = await coordinatorsApi.create(coordinatorData);
      setCoordinators(prev => [...prev, newCoordinator]);
    } catch (error) {
      console.error('Failed to add coordinator:', error);
      alert('Failed to add coordinator. Please try again.');
    }
  };

  const handleToggleCoordinatorAccess = async (id: string) => {
    try {
      const coordinator = coordinators.find(c => c.id === id);
      if (coordinator) {
        const updatedCoordinator = await coordinatorsApi.update(id, { 
          ...coordinator, 
          isActive: !coordinator.isActive 
        });
        setCoordinators(prev => prev.map(c =>
          c.id === id ? updatedCoordinator : c
        ));
      }
    } catch (error) {
      console.error('Failed to toggle coordinator access:', error);
      alert('Failed to update coordinator access. Please try again.');
    }
  };

  const handleEditStudent = async (id: string, updates: { name: string; department: string; password?: string; profileImageUrl?: string }) => {
    try {
      const updatedStudent = await studentsApi.update(id, updates);
      setRegisteredStudents(prev => prev.map(student =>
        student.id === id ? updatedStudent : student
      ));
    } catch (error) {
      console.error('Failed to edit student:', error);
      alert('Failed to edit student. Please try again.');
    }
  };

  const handleEditCoordinator = async (id: string, updates: { name: string; department: string; password?: string }) => {
    try {
      const updatedCoordinator = await coordinatorsApi.update(id, updates);
      setCoordinators(prev => prev.map(coordinator =>
        coordinator.id === id ? updatedCoordinator : coordinator
      ));
    } catch (error) {
      console.error('Failed to edit coordinator:', error);
      alert('Failed to edit coordinator. Please try again.');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await studentsApi.delete(id);
      setRegisteredStudents(prev => prev.filter(student => student.id !== id));
      
      // Also remove from all program participants
      setPrograms(prev => prev.map(program => ({
        ...program,
        participantIds: program.participantIds?.filter(participantId => participantId !== id) || []
      })));
      
      // Remove report data for this student
      try {
        await studentReportsApi.delete(id);
      } catch (error) {
        console.error('Failed to delete student report:', error);
      }
      
      setStudentReports(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (error) {
      console.error('Failed to delete student:', error);
      alert('Failed to delete student. Please try again.');
    }
  };

  const handleDeleteCoordinator = async (id: string) => {
    try {
      await coordinatorsApi.delete(id);
      setCoordinators(prev => prev.filter(coordinator => coordinator.id !== id));
    } catch (error) {
      console.error('Failed to delete coordinator:', error);
      alert('Failed to delete coordinator. Please try again.');
    }
  };

  const handleUpdateOfficerPassword = (newPassword: string) => {
    setOfficerCredentials(prev => prev.map(oc => 
      oc.id === 'OFFICER001' ? { ...oc, password: newPassword } : oc
    ));
    // TODO: Update in backend when officer management is implemented
  };

  // Department management functions
  const handleAddDepartment = async (name: string) => {
    try {
      const newDepartment = await departmentsApi.create(name);
      setDepartments(prev => [...prev, newDepartment]);
    } catch (error) {
      console.error('Failed to add department:', error);
      alert('Failed to add department. Please try again.');
    }
  };

  const handleEditDepartment = async (id: string, newName: string) => {
    try {
      const oldDepartment = departments.find(d => d.id === id);
      if (!oldDepartment) return;

      const updatedDepartment = await departmentsApi.update(id, newName);
      setDepartments(prev => prev.map(d => 
        d.id === id ? updatedDepartment : d
      ));

      // Propagate department name change to all students
      setRegisteredStudents(prev => prev.map(student => 
        student.department === oldDepartment.name 
          ? { ...student, department: newName }
          : student
      ));
    } catch (error) {
      console.error('Failed to edit department:', error);
      alert('Failed to edit department. Please try again.');
    }
  };

  const handleToggleDepartment = async (id: string) => {
    try {
      const department = departments.find(d => d.id === id);
      if (department) {
        const updatedDepartment = await departmentsApi.update(id, department.name, !department.isActive);
        setDepartments(prev => prev.map(d => 
          d.id === id ? updatedDepartment : d
        ));
      }
    } catch (error) {
      console.error('Failed to toggle department:', error);
      alert('Failed to update department status. Please try again.');
    }
  };

  // Show loading screen while initial data loads
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading NSS-MAMOC...</p>
        </div>
      </div>
    );
  }

  // Show error screen if initial load failed
  if (loadingError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{loadingError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage programs={programs} />;
      case 'programs':
        return <ProgramsPage programs={programs} />;

      case 'login':
        return <LoginPage onLogin={handleLogin} onBack={() => setCurrentView('home')} />;
      case 'student':
        if (isLoggedIn && currentUser?.type === 'student') {
          return (
            <StudentPortal 
              programs={programs} 
              currentStudent={currentUser.data as RegisteredStudent}
            />
          );
        }
        return <LoginPage onLogin={handleLogin} onBack={() => setCurrentView('home')} />;
      case 'coordinator':
        if (isLoggedIn && (currentUser?.type === 'coordinator' || currentUser?.type === 'officer')) {
          return (
            <TeacherPortal
              programs={programs}
              registeredStudents={registeredStudents}
              coordinators={coordinators}
              onAddProgram={handleAddProgram}
              onEditProgram={handleEditProgram}
              onDeleteProgram={handleDeleteProgram}
              onAddParticipants={handleAddParticipants}
            />
          );
        }
        return <LoginPage onLogin={handleLogin} onBack={() => setCurrentView('home')} />;
      case 'officer':
        if (isLoggedIn && currentUser?.type === 'officer') {
          return (
            <ProgramOfficerPortal
              students={registeredStudents}
              coordinators={coordinators}
              departments={departments}
              onAddStudent={handleAddStudent}
              onAddCoordinator={handleAddCoordinator}
              onToggleCoordinatorAccess={handleToggleCoordinatorAccess}
              onDeleteStudent={handleDeleteStudent}
              onDeleteCoordinator={handleDeleteCoordinator}
              onUpdateOfficerPassword={handleUpdateOfficerPassword}
              onEditStudent={handleEditStudent}
              onEditCoordinator={handleEditCoordinator}
              onAddDepartment={handleAddDepartment}
              onEditDepartment={handleEditDepartment}
              onToggleDepartment={handleToggleDepartment}
              studentReports={studentReports}
              programs={programs}
              onAddStudentActivity={async (studentId, activity) => {
                setStudentReports(prev => {
                  const report = prev[studentId] || { activities: [], coordinatedPrograms: [] };
                  const updatedReport = {
                    activities: [
                      ...report.activities,
                      { ...activity, id: Date.now().toString(), createdAt: new Date().toISOString() },
                    ],
                    coordinatedPrograms: report.coordinatedPrograms || [],
                  };
                  
                  // Update in backend
                  studentReportsApi.update(studentId, updatedReport).catch(console.error);
                  
                  return {
                    ...prev,
                    [studentId]: updatedReport,
                  };
                });
              }}
              onEditStudentActivity={async (studentId, activityId, updates) => {
                setStudentReports(prev => {
                  const report = prev[studentId];
                  if (!report) return prev;
                  
                  const updatedReport = {
                    ...report,
                    activities: report.activities.map(a => a.id === activityId ? { ...a, ...updates } : a),
                  };
                  
                  // Update in backend
                  studentReportsApi.update(studentId, updatedReport).catch(console.error);
                  
                  return {
                    ...prev,
                    [studentId]: updatedReport,
                  };
                });
              }}
            />
          );
        }
        return <LoginPage onLogin={handleLogin} onBack={() => setCurrentView('home')} />;
      default:
        return <HomePage programs={programs} />;
    }
  };

  const getUserInfo = () => {
    if (!currentUser) return undefined;
    return {
      name: currentUser.type === 'officer' 
        ? (currentUser.data as { name: string }).name
        : (currentUser.data as RegisteredStudent | Coordinator).name,
      type: currentUser.type
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentView={currentView} 
        onViewChange={setCurrentView}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        userInfo={getUserInfo()}
      />
      {renderCurrentView()}
    </div>
  );
}

export default App;
