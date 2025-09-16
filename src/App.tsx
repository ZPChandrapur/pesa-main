import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { UserProvider } from './context/UserContext';
import { LoginPage } from './components/Auth/LoginPage';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { VillagesList } from './components/Villages/VillagesList';
import { GramPanchayat } from './components/Aarakhada/GramPanchayat';
import { Taluka } from './components/Aarakhada/Taluka';
import { District } from './components/Aarakhada/District';
import { Funds } from './components/Placeholders/Funds';
import { WorkProgress } from './components/Placeholders/WorkProgress';
import { Tracking } from './components/Placeholders/Tracking';
import { Aarakhada } from './components/Placeholders/Aarakhada';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
  case 'dashboard':
    return <Dashboard />;
  case 'villages':
    return <VillagesList />;
  case 'gramPanchayat':
    return <GramPanchayat />;
  case 'taluka':
    return <Taluka />;
  case 'district':
    return <District />;
  case 'funds':
    return <Funds />;
  case 'workProgress':
    return <WorkProgress />;
  case 'tracking':
    return <Tracking />;
  case 'aarakhada':
    return <Aarakhada />;
  default:
    return <Dashboard />;
}

  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 p-8 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;