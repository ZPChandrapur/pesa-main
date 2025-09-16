import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Camera, CheckCircle, Play, Pause, TrendingUp, Edit, ArrowLeft, Upload, X, Save, Eye } from 'lucide-react';
import { pesaWorkflowOperations, pesaWorkOperations, storageOperations } from '../../utils/supabase';
import { useLanguage } from '../../context/LanguageContext';

interface WorkflowStep {
  id: string;
  workflow_id: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  status: 'pending' | 'in_progress' | 'completed';
  completion_photos?: string[];
  location_data?: any;
  completed_at?: string;
  created_at?: string;
  location_name?: string;
}

interface Workflow {
  id: string;
  title: string;
  description: string;
  duration: number;
  status: 'draft' | 'active' | 'completed';
  work_id?: string;
  workflow_steps?: WorkflowStep[];
  work?: { work_name: string; taluka: string };
  created_at?: string;
  updated_at?: string;
}

const WorkflowProgress: React.FC = () => {
  const { t, language } = useLanguage();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);
  const [viewMode, setViewMode] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [stepForm, setStepForm] = useState({
    status: 'pending' as const,
    completion_photos: [] as string[],
    location_data: null as any,
    location_name: '',
  });

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const data = await pesaWorkflowOperations.getAll();
      setWorkflows(data.filter((workflow: Workflow) => workflow.status !== 'draft'));
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
  };

  const handleBackToList = () => {
    setSelectedWorkflow(null);
    setEditingStep(null);
    setViewMode(false);
    loadWorkflows();
  };

  const handleEditStep = (step: WorkflowStep) => {
    setEditingStep(step);
    setViewMode(false);
    setStepForm({
      status: step.status,
      completion_photos: step.completion_photos || [],
      location_data: step.location_data,
      location_name: step.location_name || step.location_data?.location_name || '',
    });
  };

  const handleViewStep = (step: WorkflowStep) => {
    setEditingStep(step);
    setViewMode(true);
    setStepForm({
      status: step.status,
      completion_photos: step.completion_photos || [],
      location_data: step.location_data,
      location_name: step.location_name || step.location_data?.location_name || '',
    });
  };

  const handleSaveStep = async () => {
    if (!editingStep) return;
    try {
      const updates: Partial<WorkflowStep> = {
        status: stepForm.status,
        completion_photos: stepForm.completion_photos,
        location_data: {
          ...stepForm.location_data,
          location_name: stepForm.location_name,
        },
        location_name: stepForm.location_name,
      };
      if (stepForm.status === 'completed' && editingStep.status !== 'completed') {
        updates.completed_at = new Date().toISOString();
      }
      await pesaWorkflowOperations.updateStep(editingStep.id, updates);
      const updatedWorkflows = await pesaWorkflowOperations.getAll();
      const updatedWorkflow = updatedWorkflows.find((w: Workflow) => w.id === selectedWorkflow?.id);
      setSelectedWorkflow(updatedWorkflow);
      setEditingStep(null);
      setViewMode(false);
      alert('Step updated successfully!');
    } catch (error) {
      console.error('Error updating step:', error);
      alert('Error updating step. Please try again.');
    }
  };

  const handleCaptureLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyDzOjsiqs6rRjSJWVdXfUBl4ckXayL8AbE`
            );
            const data = await response.json();
            let locationName = '';
            let fullAddress = '';
            if (data.results && data.results.length > 0) {
              const result = data.results[0];
              fullAddress = result.formatted_address;
              const addressComponents = result.address_components;
              if (addressComponents && addressComponents.length > 0) {
                const nameComponent = addressComponents.find(component =>
                  component.types.includes('establishment') ||
                  component.types.includes('point_of_interest') ||
                  component.types.includes('sublocality_level_1') ||
                  component.types.includes('locality')
                );
                locationName = nameComponent ? nameComponent.long_name : addressComponents[0].long_name;
              } else {
                locationName = fullAddress.split(',')[0];
              }
            } else {
              locationName = `Location ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              fullAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            }
            const locationData = {
              latitude: lat,
              longitude: lng,
              address: fullAddress,
              location_name: locationName,
            };
            setStepForm({
              ...stepForm,
              location_data: locationData,
              location_name: locationName
            });
            alert('Location captured and address resolved successfully!');
          } catch (error) {
            console.error('Error getting address from coordinates:', error);
            const locationData = {
              latitude: lat,
              longitude: lng,
              address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              location_name: `Location ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            };
            setStepForm({
              ...stepForm,
              location_data: locationData,
              location_name: locationData.location_name
            });
            alert('Location captured successfully!');
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Error capturing location. Please try again.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handlePlaceSelect = (event: any) => {
    const place = event.target.place;
    if (place && place.geometry) {
      const locationData = {
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        address: place.formatted_address || place.name,
        location_name: place.name || place.formatted_address,
        place_id: place.place_id,
      };
      setStepForm({
        ...stepForm,
        location_data: locationData,
        location_name: place.name || place.formatted_address
      });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && editingStep && selectedWorkflow) {
      setUploadingPhotos(true);
      try {
        const uploadPromises = Array.from(files).map(async (file) => {
          if (file.size > 5 * 1024 * 1024) {
            throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`);
          }
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
          if (!allowedTypes.includes(file.type)) {
            throw new Error(`File ${file.name} is not a supported image format.`);
          }
          return await storageOperations.uploadWorkflowPhoto(
            file,
            selectedWorkflow.id,
            editingStep.id
          );
        });
        const uploadedUrls = await Promise.all(uploadPromises);
        setStepForm({
          ...stepForm,
          completion_photos: [...stepForm.completion_photos, ...uploadedUrls]
        });
        alert(`Successfully uploaded ${uploadedUrls.length} photo(s)!`);
      } catch (error) {
        console.error('Error uploading photos:', error);
        alert(`Error uploading photos: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setUploadingPhotos(false);
      }
    }
  };

  const handleRemovePhoto = async (index: number) => {
    const photoUrl = stepForm.completion_photos[index];
    try {
      await storageOperations.removeWorkflowPhoto(photoUrl);
      const updatedPhotos = stepForm.completion_photos.filter((_, i) => i !== index);
      setStepForm({ ...stepForm, completion_photos: updatedPhotos });
    } catch (error) {
      console.error('Error removing photo:', error);
      alert('Error removing photo. Please try again.');
    }
  };

  const handleChangeWorkflowStatus = async (workflowId: string, newStatus: string) => {
    try {
      await pesaWorkflowOperations.updateWorkflow(workflowId, { status: newStatus });
      if (newStatus === 'completed' && selectedWorkflow) {
        if (selectedWorkflow.work_id) {
          await pesaWorkOperations.update(selectedWorkflow.work_id, { current_status: 'completed' });
        }
      }
      await loadWorkflows();
      const updatedWorkflows = await pesaWorkflowOperations.getAll();
      const updatedWorkflow = updatedWorkflows.find((w: Workflow) => w.id === workflowId);
      setSelectedWorkflow(updatedWorkflow);
      alert('Workflow status updated successfully!');
    } catch (error) {
      console.error('Error updating workflow status:', error);
      alert('Error updating workflow status. Please try again.');
    }
  };

  const getProgressPercentage = (steps: WorkflowStep[]) => {
    if (!steps || steps.length === 0) return 0;
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gradient-to-r from-gray-400 to-gray-500',
      active: 'bg-gradient-to-r from-blue-400 to-indigo-400',
      completed: 'bg-gradient-to-r from-green-400 to-emerald-400',
      pending: 'bg-gradient-to-r from-yellow-400 to-orange-400',
      in_progress: 'bg-gradient-to-r from-purple-400 to-pink-400',
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500"></div>
      </div>
    );
  }

  if (selectedWorkflow) {
    return (
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToList}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                aria-label="Back to workflows"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {selectedWorkflow.title}
                </h2>
                <p className="text-gray-600 mt-2">{selectedWorkflow.description}</p>
                {selectedWorkflow.work && (
                  <p className="text-sm text-gray-500 mt-1">
                    Work: {selectedWorkflow.work.work_name} | Taluka: {selectedWorkflow.work.taluka}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedWorkflow.status}
                onChange={(e) => handleChangeWorkflowStatus(selectedWorkflow.id, e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                aria-label="Change workflow status"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {getProgressPercentage(selectedWorkflow.workflow_steps)}%
              </div>
              <div className="text-gray-600">Progress</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {selectedWorkflow.workflow_steps?.length || 0}
              </div>
              <div className="text-gray-600">Total Steps</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {selectedWorkflow.workflow_steps?.filter((s: WorkflowStep) => s.status === 'completed').length || 0}
              </div>
              <div className="text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {selectedWorkflow.duration}
              </div>
              <div className="text-gray-600">Days</div>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercentage(selectedWorkflow.workflow_steps || [])}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="space-y-4">
          {selectedWorkflow.workflow_steps?.map((step: WorkflowStep, index: number) => (
            <div
              key={step.id}
              className={`p-6 rounded-3xl border-2 transition-all duration-200 ${
                step.status === 'completed'
                  ? 'bg-green-50 border-green-200'
                  : step.status === 'in_progress'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4 flex-1">
                  <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg">{step.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(step.status)}`}>
                    {t(step.status.replace('_', ''))}
                  </span>
                </div>
                {step.status === 'completed' ? (
                  <button
                    onClick={() => handleViewStep(step)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 ml-4"
                    aria-label={`View completed step ${step.title}`}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleEditStep(step)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200 ml-4"
                    aria-label={`Edit step ${step.title}`}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 mr-2" />
                  <span>{step.duration} Days</span>
                </div>
                {step.location_data && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 mr-2" />
                    <span>Location captured</span>
                  </div>
                )}
                {step.completion_photos && step.completion_photos.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Camera className="w-3 h-3 mr-2" />
                    <span>{step.completion_photos.length} photos</span>
                  </div>
                )}
                {step.completed_at && (
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 mr-2" />
                    <span>{new Date(step.completed_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Step Edit/View Modal */}
        {editingStep && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {viewMode ? `View Step: ${editingStep.title}` : `Edit Step: ${editingStep.title}`}
                  </h3>
                  <button
                    onClick={() => { setEditingStep(null); setViewMode(false); }}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                    aria-label="Close step modal"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-6">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={stepForm.status}
                      onChange={(e) => setStepForm({ ...stepForm, status: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-4 focus:ring-blue-500 focus:border-transparent"
                      disabled={viewMode}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Location Name
                      </label>
                      <input
                        type="text"
                        value={stepForm.location_name}
                        onChange={(e) => setStepForm({ ...stepForm, location_name: e.target.value })}
                        placeholder="Enter location name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-3xl focus:ring-4 focus:ring-blue-500 focus:border-transparent text-sm"
                        disabled={viewMode}
                      />
                    </div>
                    {!viewMode && (
                      <>
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Search Location
                          </label>
                          <div className="w-full">
                            <gmpx-place-picker
                              placeholder="Enter an address or place name"
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '14px'
                              }}
                              onPlaceChange={handlePlaceSelect}
                            ></gmpx-place-picker>
                          </div>
                        </div>
                        <div className="flex space-x-2 mb-3">
                          <button
                            type="button"
                            onClick={handleCaptureLocation}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-3xl hover:bg-blue-700 transition-colors duration-200 text-sm"
                          >
                            <MapPin className="w-4 h-4" />
                            <span>Capture Location</span>
                          </button>
                        </div>
                      </>
                    )}
                    {stepForm.location_data && (
                      <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-3xl text-sm">
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium text-green-800 mb-1">
                              {stepForm.location_data.location_name || 'Current Location'}
                            </div>
                            <div className="text-green-700 text-xs">
                              📍 {stepForm.location_data.address || `${stepForm.location_data.latitude}, ${stepForm.location_data.longitude}`}
                            </div>
                            {stepForm.location_data.latitude && stepForm.location_data.longitude && (
                              <div className="text-green-600 text-xs mt-1">
                                Coordinates: {stepForm.location_data.latitude.toFixed(6)}, {stepForm.location_data.longitude.toFixed(6)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Photos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Completion Photos
                    </label>
                    <div className="space-y-4">
                      {!viewMode && (
                        <div className="flex items-center space-x-4">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={uploadingPhotos}
                            className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-4 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                          />
                          {uploadingPhotos && (
                            <div className="flex items-center space-x-2 text-blue-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              <span className="text-sm">Uploading...</span>
                            </div>
                          )}
                        </div>
                      )}
                      {stepForm.completion_photos.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {stepForm.completion_photos.map((photo, index) => (
                            <div key={index} className="relative">
                              <img
                                src={photo}
                                alt={`Completion photo ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkM5Ljc5IDEzLjc5IDkuNzkgMTAuMjEgMTIgOEMxNC4yMSAxMC4yMSAxNC4yMSAxMy43OSAxMiAxNloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                                }}
                              />
                              {!viewMode && (
                                <button
                                  onClick={() => handleRemovePhoto(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                                  aria-label={`Remove photo ${index + 1}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Supported formats: PNG, JPEG, JPG, GIF, WebP (Max 5MB per file)
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
                  <button
                    type="button"
                    onClick={() => { setEditingStep(null); setViewMode(false); }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-3xl hover:bg-gray-50 transition-colors duration-200"
                  >
                    Close
                  </button>
                  {!viewMode && (
                    <button
                      type="button"
                      onClick={handleSaveStep}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-3xl hover:bg-blue-700 transition-colors duration-200"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Workflow List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-white/20">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {t('workflowProgress')}
            </h2>
            <p className="text-gray-600 mt-2">{t('selectPesaVillageWorkWorkflowToTrackProgressAndManageSteps')}</p>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-4 border border-white/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-3xl focus:ring-4 focus:ring-emerald-300 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-3xl focus:ring-4 focus:ring-emerald-300 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Workflows List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkflows.map((workflow) => (
          <div
            key={workflow.id}
            onClick={() => handleSelectWorkflow(workflow)}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-white/20 cursor-pointer hover:shadow-xl transition-shadow"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleSelectWorkflow(workflow)}
            aria-label={`Select workflow ${workflow.title}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{workflow.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{workflow.description}</p>
                {workflow.work && (
                  <p className="text-xs text-gray-500 mb-2">
                    {workflow.work.work_name} | {workflow.work.taluka}
                  </p>
                )}
              </div>
              <Eye className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
            </div>
            <div className="space-y-3">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-500">
                    {getProgressPercentage(workflow.workflow_steps || [])}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercentage(workflow.workflow_steps || [])}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {workflow.workflow_steps?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500">Steps</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {workflow.workflow_steps?.filter((s: WorkflowStep) => s.status === 'completed').length || 0}
                  </div>
                  <div className="text-xs text-gray-500">Done</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600">
                    {workflow.duration}
                  </div>
                  <div className="text-xs text-gray-500">Days</div>
                </div>
              </div>

              {/* Status */}
              <div className="flex justify-between items-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(workflow.status)}`}>
                  {t(workflow.status)}
                </span>
                <div className="text-xs text-gray-500">
                  {workflow.created_at ? new Date(workflow.created_at).toLocaleDateString() : '-'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredWorkflows.length === 0 && workflows.length > 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No workflows match your search</div>
          <p className="text-gray-500">Try adjusting your search terms or filters</p>
        </div>
      )}

      {workflows.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No workflows found</div>
          <p className="text-gray-500">Create workflows in Workflow Builder to track progress here</p>
        </div>
      )}
    </div>
  );
};

export default WorkflowProgress;
