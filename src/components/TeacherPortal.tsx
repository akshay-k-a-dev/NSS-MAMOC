import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, Clock, MapPin, User, Save, X, Users, Search, Check, FileDown } from 'lucide-react';
import { Program, RegisteredStudent, Coordinator } from '../types';
import { downloadAttendanceSheet, AttendeeEntry } from '../utils/attendanceSheetGenerator';

interface TeacherPortalProps {
  programs: Program[];
  registeredStudents: RegisteredStudent[];
  coordinators: Coordinator[];
  onAddProgram: (program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onEditProgram: (id: string, program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteProgram: (id: string) => void;
  onAddParticipants: (programId: string, studentIds: string[]) => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  programs,
  registeredStudents,
  coordinators,
  onAddProgram,
  onEditProgram,
  onDeleteProgram,
  onAddParticipants,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [showParticipantSelection, setShowParticipantSelection] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    coordinator: '',
    coordinatorIds: [] as string[],
  });

  const [showCoordinatorSelection, setShowCoordinatorSelection] = useState(false);
  const [selectedCoordinatorIds, setSelectedCoordinatorIds] = useState<string[]>([]);

  // Department-wise attendance sheet UI state
  const [showAttendanceSheet, setShowAttendanceSheet] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedProgramIdForSheet, setSelectedProgramIdForSheet] = useState<string>('');
  const [attendees, setAttendees] = useState<AttendeeEntry[]>([]);
  const [newAttendeeName, setNewAttendeeName] = useState('');
  const [newAttendeeRemark, setNewAttendeeRemark] = useState('');



  // Auto-populate attendees when both department and program are selected
  useEffect(() => {
    const program = programs.find(p => p.id === selectedProgramIdForSheet);
    if (!program || !selectedDepartment) return;
    const participantSet = new Set(program.participantIds || []);
    const initial = registeredStudents
      .filter(s => s.department === selectedDepartment && participantSet.has(s.id))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(s => ({ name: s.name } as AttendeeEntry));
    setAttendees(initial);
  }, [selectedDepartment, selectedProgramIdForSheet, programs, registeredStudents]);

  const handleParticipantSelection = (programId: string) => {
    setShowParticipantSelection(programId);
    setSelectedStudentIds(programs.find(p => p.id === programId)?.participantIds || []);
    setSearchTerm('');
  };

  const handleStudentToggle = (studentId: string) => {
    const newSelectedIds = selectedStudentIds.includes(studentId) 
      ? selectedStudentIds.filter(id => id !== studentId)
      : [...selectedStudentIds, studentId];
    
    setSelectedStudentIds(newSelectedIds);
    
    // Apply changes immediately if we have a program selected
    if (showParticipantSelection) {
      onAddParticipants(showParticipantSelection, newSelectedIds);
    }
  };

  const handleCoordinatorToggle = (studentId: string) => {
    setSelectedCoordinatorIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleConfirmCoordinators = () => {
    setFormData(prev => ({ ...prev, coordinatorIds: selectedCoordinatorIds }));
    setShowCoordinatorSelection(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Set the coordinator field to the first selected coordinator's name
    const firstCoordinatorId = formData.coordinatorIds[0];
    const firstCoordinator = coordinators.find(c => c.id === firstCoordinatorId);
    const coordinatorName = firstCoordinator ? firstCoordinator.name : '';
    
    const programData = {
      ...formData,
      coordinator: coordinatorName,
      // Map old interface fields to new interface
      startDate: formData.date,
      endDate: formData.date, // For single-day events, end date same as start
      department: formData.venue || '', // Use venue as department for backward compatibility
      type: 'community-service' as const,
      participantIds: [],
      maxParticipants: 50, // Default value
      registrationOpen: true // Default value
    };
    
    if (editingProgram) {
      onEditProgram(editingProgram.id, programData);
      setEditingProgram(null);
    } else {
      onAddProgram(programData);
    }
    
    setFormData({ title: '', description: '', date: '', time: '', venue: '', coordinator: '', coordinatorIds: [] });
    setShowForm(false);
  };

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setFormData({
      title: program.title,
      description: program.description || '',
      date: program.startDate || program.date || '',
      time: program.endDate ? new Date(program.endDate).toLocaleTimeString() : (program.time || ''),
      venue: program.department || program.venue || '',
      coordinator: program.coordinator || '',
      coordinatorIds: program.coordinatorIds || [],
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProgram(null);
    setFormData({ title: '', description: '', date: '', time: '', venue: '', coordinator: '', coordinatorIds: [] });
  };

  const filteredStudents = registeredStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id.includes(searchTerm)
  ).sort((a, b) => parseInt(a.id) - parseInt(b.id));

  const filteredCoordinators = coordinators.filter(coordinator =>
    coordinator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coordinator.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coordinator.id.includes(searchTerm)
  ).sort((a, b) => a.name.localeCompare(b.name));

  const allFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every(student => selectedStudentIds.includes(student.id));

  const allFilteredCoordinatorsSelected =
    filteredCoordinators.length > 0 &&
    filteredCoordinators.every(coordinator => selectedCoordinatorIds.includes(coordinator.id));

  const handleToggleSelectAllFiltered = () => {
    const newSelectedIds = (() => {
      if (filteredStudents.length === 0) return selectedStudentIds;

      const filteredIdSet = new Set(filteredStudents.map(s => s.id));
      const isAllSelected = Array.from(filteredIdSet).every(id => selectedStudentIds.includes(id));

      if (isAllSelected) {
        // Deselect all filtered
        return selectedStudentIds.filter(id => !filteredIdSet.has(id));
      }

      // Select all filtered (merge, avoid duplicates)
      const merged = new Set(selectedStudentIds);
      filteredStudents.forEach(s => merged.add(s.id));
      return Array.from(merged);
    })();
    
    setSelectedStudentIds(newSelectedIds);
    
    // Apply changes immediately if we have a program selected
    if (showParticipantSelection) {
      onAddParticipants(showParticipantSelection, newSelectedIds);
    }
  };

  const handleToggleSelectAllCoordinators = () => {
    setSelectedCoordinatorIds(previousSelectedIds => {
      if (filteredCoordinators.length === 0) return previousSelectedIds;

      const filteredIdSet = new Set(filteredCoordinators.map(c => c.id));
      const isAllSelected = Array.from(filteredIdSet).every(id => previousSelectedIds.includes(id));

      if (isAllSelected) {
        // Deselect all filtered
        return previousSelectedIds.filter(id => !filteredIdSet.has(id));
      }

      // Select all filtered (merge, avoid duplicates)
      const merged = new Set(previousSelectedIds);
      filteredCoordinators.forEach(c => merged.add(c.id));
      return Array.from(merged);
    });
  };



  const sortedPrograms = [...programs].sort((a, b) => 
    new Date(b.startDate || b.date || '').getTime() - new Date(a.startDate || a.date || '').getTime()
  );

  const getCoordinatorNames = (coordinatorIds: string[]) => {
    return coordinatorIds.map(id => {
      const coordinator = coordinators.find(c => c.id === id);
      return coordinator ? `${coordinator.name} (${coordinator.department})` : `ID: ${id}`;
    }).join(', ');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Coordinator Portal</h1>
          <p className="text-gray-600">Manage NSS programs and select participants</p>
        </div>



        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2 shadow-lg"
          >
            <Plus size={20} />
            <span>Add New Program</span>
          </button>

          <button
            onClick={() => {
              // Reset state so previous session details don't persist
              setSelectedDepartment('');
              setSelectedProgramIdForSheet('');
              setAttendees([]);
              setNewAttendeeName('');
              setNewAttendeeRemark('');
              setShowAttendanceSheet(true);
            }}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 shadow-lg"
          >
            <FileDown size={20} />
            <span>Department-wise Attendance Sheet</span>
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProgram ? 'Edit Program' : 'Add New Program'}
              </h2>
              <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Program Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter program title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Coordinators</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      required
                      readOnly
                      value={getCoordinatorNames(formData.coordinatorIds)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                      placeholder="Click to select coordinators"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCoordinatorIds(formData.coordinatorIds);
                        setShowCoordinatorSelection(true);
                      }}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Select
                    </button>
                  </div>
                  {formData.coordinatorIds.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.coordinatorIds.length} coordinator(s) selected
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                  <input
                    type="text"
                    required
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter venue location"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter program description"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
                >
                  <Save size={20} />
                  <span>{editingProgram ? 'Update Program' : 'Add Program'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Coordinator Selection Modal */}
        {showCoordinatorSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Select Coordinators</h3>
                    <p className="text-gray-600 text-sm">Choose students to coordinate this program</p>
                  </div>
                  <button 
                    onClick={() => setShowCoordinatorSelection(false)}
                    className="text-gray-500 hover:text-gray-700 self-end sm:self-auto"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search coordinators by name, department, or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="text-sm text-gray-600">
                      {selectedCoordinatorIds.length} of {filteredCoordinators.length} coordinators selected
                    </div>
                    <button
                      onClick={handleToggleSelectAllCoordinators}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 self-start sm:self-auto"
                    >
                      {allFilteredCoordinatorsSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
                {filteredCoordinators.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-xl text-gray-500">No coordinators found</p>
                    <p className="text-gray-400 text-sm">
                      {searchTerm ? 'Try adjusting your search terms' : 'No coordinators have been registered by the Program Officer yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCoordinators.map((coordinator) => (
                      <div key={coordinator.id} className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                        <div className="flex items-start sm:items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedCoordinatorIds.includes(coordinator.id)}
                            onChange={() => handleCoordinatorToggle(coordinator.id)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-1 sm:mt-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold w-fit">
                                ID: {coordinator.id}
                              </div>
                              <h4 className="font-semibold text-gray-900 truncate">{coordinator.name}</h4>
                            </div>
                            <p className="text-sm text-gray-600">
                              {coordinator.department} • {coordinator.position}
                            </p>
                          </div>
                          {selectedCoordinatorIds.includes(coordinator.id) && (
                            <div className="text-green-600 flex-shrink-0">
                              <Check size={20} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-4 sm:p-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="text-sm text-gray-600">
                    {selectedCoordinatorIds.length} of {filteredCoordinators.length} coordinators selected
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setShowCoordinatorSelection(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmCoordinators}
                      className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Check size={16} />
                      <span>Confirm Coordinators</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Participant Selection Modal */}
        {showParticipantSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Select Participants</h3>
                    <p className="text-gray-600">Choose students to participate in this program</p>
                  </div>
                  <button 
                    onClick={() => setShowParticipantSelection(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search students by name, department, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleToggleSelectAllFiltered}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    {allFilteredSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-xl text-gray-500">No students found</p>
                    <p className="text-gray-400">
                      {searchTerm ? 'Try adjusting your search terms' : 'No students have been registered by the Program Officer yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredStudents.map((student) => (
                      <div key={student.id} className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={() => handleStudentToggle(student.id)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                            ID: {student.id}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{student.name}</h4>
                            <p className="text-sm text-gray-600">{student.department}</p>
                          </div>
                        </div>
                        {selectedStudentIds.includes(student.id) && (
                          <div className="text-green-600">
                            <Check size={20} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {selectedStudentIds.length} of {filteredStudents.length} students selected
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowParticipantSelection(null);
                      setSelectedStudentIds([]);
                      setSearchTerm('');
                    }}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Department-wise Attendance Sheet Modal */}
        {showAttendanceSheet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Department-wise Attendance Sheet</h3>
                    <p className="text-gray-600">Select department and program, manage list, then download</p>
                  </div>
                  <button onClick={() => setShowAttendanceSheet(false)} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select department</option>
                      {Array.from(new Set(registeredStudents.map(s => s.department))).map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
                    <select
                      value={selectedProgramIdForSheet}
                      onChange={(e) => setSelectedProgramIdForSheet(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select program</option>
                      {sortedPrograms.map(p => (
                        <option key={p.id} value={p.id}>{p.title} — {new Date(p.startDate || p.date || '').toLocaleDateString()}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[50vh]">
                {/* Student Selection Dropdown (only after department filter) */}
                {selectedDepartment && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quick Add from Department Students</label>
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <select
                          value=""
                          onChange={(e) => {
                            const studentId = e.target.value;
                            if (!studentId) return;
                            const student = registeredStudents.find(s => s.id === studentId);
                            if (!student) return;
                            
                            // Check if student is already in attendees list
                            const alreadyAdded = attendees.some(a => a.name === student.name);
                            if (alreadyAdded) {
                              alert('Student is already in the attendees list');
                              return;
                            }
                            
                            setAttendees(prev => [...prev, { name: student.name, remark: undefined }]);
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select student from {selectedDepartment}</option>
                          {registeredStudents
                            .filter(s => s.department === selectedDepartment)
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(student => (
                              <option key={student.id} value={student.id}>
                                {student.name} ({student.id})
                              </option>
                            ))}
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          // Add all students from selected department
                          const departmentStudents = registeredStudents
                            .filter(s => s.department === selectedDepartment)
                            .filter(s => !attendees.some(a => a.name === s.name)); // Avoid duplicates
                          
                          setAttendees(prev => [
                            ...prev,
                            ...departmentStudents.map(s => ({ name: s.name, remark: undefined }))
                          ]);
                        }}
                        className="px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                      >
                        Add All
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Manual Attendee Editor */}
                <div className="flex items-end gap-3 mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add Student Name (Manual)</label>
                    <input
                      type="text"
                      value={newAttendeeName}
                      onChange={(e) => setNewAttendeeName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="w-64">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Remark (optional)</label>
                    <input
                      type="text"
                      value={newAttendeeRemark}
                      onChange={(e) => setNewAttendeeRemark(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Winner, Volunteer Lead"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const trimmed = newAttendeeName.trim();
                      if (!trimmed) return;
                      setAttendees(prev => [...prev, { name: trimmed, remark: newAttendeeRemark.trim() || undefined }]);
                      setNewAttendeeName('');
                      setNewAttendeeRemark('');
                    }}
                    className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {attendees.length === 0 ? (
                  <div className="text-gray-500">No attendees added yet.</div>
                ) : (
                  <div className="space-y-2">
                    {attendees.map((a, i) => (
                      <div key={i} className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
                        <div className="w-10 text-gray-500">{i + 1}.</div>
                        <input
                          type="text"
                          value={a.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAttendees(prev => prev.map((x, idx) => idx === i ? { ...x, name: val } : x));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="text"
                          value={a.remark || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAttendees(prev => prev.map((x, idx) => idx === i ? { ...x, remark: val || undefined } : x));
                          }}
                          placeholder="Remark"
                          className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => setAttendees(prev => prev.filter((_, idx) => idx !== i))}
                          className="px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {attendees.length} attendee(s)
                </div>
                <div className="flex gap-3">
                  <button onClick={() => {
                    setShowAttendanceSheet(false);
                    // Clear session entries when closing
                    setAttendees([]);
                    setNewAttendeeName('');
                    setNewAttendeeRemark('');
                  }} className="px-4 py-2 text-gray-600 hover:text-gray-800">Close</button>
                  <button
                    onClick={async () => {
                      const program = programs.find(p => p.id === selectedProgramIdForSheet);
                      if (!selectedDepartment || !program || attendees.length === 0) {
                        alert('Please select department, program, and add at least one attendee.');
                        return;
                      }
                      await downloadAttendanceSheet({ departmentName: selectedDepartment, program, attendees });
                      // After confirming, clear details to avoid persisting on next open
                      setAttendees([]);
                      setNewAttendeeName('');
                      setNewAttendeeRemark('');
                      setSelectedDepartment('');
                      setSelectedProgramIdForSheet('');
                      setShowAttendanceSheet(false);
                    }}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                  >
                    <FileDown size={16} />
                    <span>Confirm & Download</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">All Programs</h2>
            <p className="text-gray-600 mt-1">{programs.length} programs total</p>
          </div>

          <div className="divide-y divide-gray-200">
            {sortedPrograms.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-xl text-gray-500">No programs created yet</p>
                <p className="text-gray-400">Click "Add New Program" to get started</p>
              </div>
            ) : (
              sortedPrograms.map((program) => (
                <div key={program.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-bold text-gray-900">{program.title}</h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          new Date(program.startDate || program.date || '') >= new Date()
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {new Date(program.startDate || program.date || '') >= new Date() ? 'Upcoming' : 'Completed'}
                        </div>
                        {program.participantIds && program.participantIds.length > 0 && (
                          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                            <Users size={14} />
                            <span>{program.participantIds.length} participants</span>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-600 mb-4">{program.description}</p>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} />
                          <span>{new Date(program.startDate || program.date || '').toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock size={16} />
                          <span>{program.endDate ? new Date(program.endDate).toLocaleDateString() : (program.time || 'TBD')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin size={16} />
                          <span>{program.venue}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User size={16} />
                          <span>{getCoordinatorNames(program.coordinatorIds || [])}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(program)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit program"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this program?')) {
                              onDeleteProgram(program.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete program"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <button
                        onClick={() => handleParticipantSelection(program.id)}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 text-sm"
                      >
                        <Users size={16} />
                        <span>Select Participants</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>


      </div>
    </div>
  );
};
