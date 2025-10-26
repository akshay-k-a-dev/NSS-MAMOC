import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Download, Search, Filter, Users } from 'lucide-react';
import { Program, RegisteredStudent } from '../types';
import { downloadCertificate } from '../utils/certificateGenerator';

interface StudentPortalProps {
  programs: Program[];
  currentStudent: RegisteredStudent;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ programs, currentStudent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'completed' | 'my-programs'>('all');
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [allPrograms, setAllPrograms] = useState<Program[]>(programs);
  const [loading, setLoading] = useState(false);

  // Fetch updated programs from server
  useEffect(() => {
    const fetchAllPrograms = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/programs');
        if (response.ok) {
          const data = await response.json();
          setAllPrograms(data);
        }
      } catch (error) {
        console.error('Failed to fetch programs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPrograms();
  }, [programs]);

  const handleEnrollment = async (programId: string, enroll: boolean) => {
    try {
      const endpoint = `http://localhost:3001/api/programs/${programId}/enroll/${currentStudent.id}`;
      
      const response = await fetch(endpoint, {
        method: enroll ? 'POST' : 'DELETE',
      });

      if (response.ok) {
        // Refresh programs
        const programsResponse = await fetch('http://localhost:3001/api/programs');
        if (programsResponse.ok) {
          const updatedPrograms = await programsResponse.json();
          setAllPrograms(updatedPrograms);
        }
        
        alert(enroll ? 'Successfully enrolled in program!' : 'Successfully unenrolled from program!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update enrollment');
      }
    } catch (error) {
      console.error('Error updating enrollment:', error);
      alert('Failed to update enrollment. Please try again.');
    }
  };

  const filteredPrograms = allPrograms.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (program.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const now = new Date();
    const programStartDate = new Date(program.startDate);
    const isParticipant = program.participantIds?.includes(currentStudent.id) || false;
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'upcoming' && programStartDate >= now) ||
                         (filterType === 'completed' && programStartDate < now) ||
                         (filterType === 'my-programs' && isParticipant);
    
    return matchesSearch && matchesFilter;
  });

  const sortedPrograms = [...filteredPrograms].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const handleDownloadCertificate = (program: Program) => {
    const certificate = {
      programId: program.id,
      studentName: currentStudent.name,
      studentDepartment: currentStudent.department,
      programTitle: program.title,
      date: program.startDate,
      time: new Date(program.startDate).toLocaleTimeString(),
      venue: program.department,
      coordinator: program.coordinator,
    };

    downloadCertificate(certificate);
  };

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch(`http://localhost:3001/api/students/${currentStudent.id}/photo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload photo');
      }

      const result = await response.json();
      
      // Update the current student object with new photo URL
      // Note: In a real app, this would trigger a re-fetch or state update
      Object.assign(currentStudent, { profileImageUrl: result.profilePhotoUrl });
      
      alert('Profile photo updated successfully!');
      setShowPhotoUpload(false);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert(`Failed to upload photo: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setUploading(false);
    }
  };

  const upcomingCount = allPrograms.filter(p => new Date(p.startDate) >= new Date()).length;
  const completedCount = allPrograms.filter(p => new Date(p.startDate) < new Date()).length;
  const myProgramsCount = allPrograms.filter(p => p.participantIds?.includes(currentStudent.id)).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 group">
            {currentStudent.profileImageUrl ? (
              <img src={currentStudent.profileImageUrl} alt={currentStudent.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">No Photo</div>
            )}
            <button
              onClick={() => setShowPhotoUpload(!showPhotoUpload)}
              className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
              title="Update Profile Photo"
            >
              <User className="text-white" size={20} />
            </button>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Student Portal</h1>
            <p className="text-gray-600">Welcome, {currentStudent.name} (ID: {currentStudent.id})</p>
            <p className="text-sm text-gray-500">{currentStudent.department}</p>
            {showPhotoUpload && (
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        alert('Please select an image under 5MB.');
                        return;
                      }
                      handlePhotoUpload(file);
                    }
                  }}
                  disabled={uploading}
                  className="text-sm text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Max size: 5MB. Supports JPG, PNG, WebP</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Programs</p>
                <p className="text-3xl font-bold text-gray-900">{allPrograms.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="text-blue-700" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Upcoming</p>
                <p className="text-3xl font-bold text-emerald-600">{upcomingCount}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full">
                <Clock className="text-emerald-700" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completed</p>
                <p className="text-3xl font-bold text-gray-600">{completedCount}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <Calendar className="text-gray-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">My Programs</p>
                <p className="text-3xl font-bold text-purple-600">{myProgramsCount}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <User className="text-purple-700" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search programs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="md:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-3 text-gray-400" size={20} />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'upcoming' | 'completed' | 'my-programs')}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="all">All Programs</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="my-programs">My Programs</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Programs List */}
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white p-12 rounded-xl shadow-lg text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading programs...</p>
            </div>
          ) : sortedPrograms.length === 0 ? (
            <div className="bg-white p-12 rounded-xl shadow-lg text-center">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No programs found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms' : 'No programs have been scheduled yet'}
              </p>
            </div>
          ) : (
            sortedPrograms.map((program) => {
              const isUpcoming = new Date(program.startDate) >= new Date();
              const participantCount = program.participantIds?.length || 0;
              const isParticipant = program.participantIds?.includes(currentStudent.id) || false;
              const isPastProgram = new Date(program.startDate) < new Date();
              
              return (
                <div
                  key={program.id}
                  className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                    <div className="flex-1 mb-4 lg:mb-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{program.title}</h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isUpcoming
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isUpcoming ? 'Upcoming' : 'Completed'}
                        </div>
                        {isParticipant && (
                          <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                            Participant
                          </div>
                        )}
                        {participantCount > 0 && (
                          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                            <Users size={14} />
                            <span>{participantCount} participants</span>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-600 mb-4 leading-relaxed">{program.description || 'No description available'}</p>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} />
                          <span>{new Date(program.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock size={16} />
                          <span>{new Date(program.startDate).toLocaleTimeString()} - {new Date(program.endDate).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin size={16} />
                          <span>{program.department}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User size={16} />
                          <span>{program.coordinator}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {isParticipant && isPastProgram ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleDownloadCertificate(program)}
                            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 shadow-lg"
                          >
                            <Download size={18} />
                            <span>Download Certificate</span>
                          </button>
                          <button
                            onClick={() => handleEnrollment(program.id, false)}
                            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm"
                          >
                            Unenroll
                          </button>
                        </div>
                      ) : isParticipant && isUpcoming ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="bg-blue-100 text-blue-700 px-6 py-3 rounded-lg flex items-center space-x-2">
                            <Calendar size={18} />
                            <span>Registered</span>
                          </div>
                          <button
                            onClick={() => handleEnrollment(program.id, false)}
                            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm"
                          >
                            Unenroll
                          </button>
                        </div>
                      ) : (() => {
                        // Show enrollment button or status
                        if (program.registrationOpen && participantCount < program.maxParticipants) {
                          return (
                            <button
                              onClick={() => handleEnrollment(program.id, true)}
                              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg"
                            >
                              <Calendar size={18} />
                              <span>Enroll Now</span>
                            </button>
                          );
                        } else {
                          return (
                            <div className="bg-gray-100 text-gray-500 px-6 py-3 rounded-lg flex items-center space-x-2">
                              <Users size={18} />
                              <span>
                                {!program.registrationOpen ? 'Registration Closed' : 
                                 participantCount >= program.maxParticipants ? 'Full Capacity' : 
                                 'Not Available'}
                              </span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};