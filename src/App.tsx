import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { UserProvider } from './context/UserContext';
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
  const [activeTab, setActiveTab] = useState('dashboard');

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
    <LanguageProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </LanguageProvider>
  );
}

export default App;