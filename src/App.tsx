import React, { useEffect, useState } from 'react';
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
  const [roleId, setRoleId] = useState<number | null>(() => {
  const stored = localStorage.getItem('roleId');
  return stored ? Number(stored) : null;
});
const [roleName, setRoleName] = useState<string | null>(() => {
  return localStorage.getItem('roleName');
});

const [userId, setUserId] = useState<string | null>(() => {
  return localStorage.getItem('userId');
});


  // Update callback for LoginPage: set both roleId and roleName
  const handleRoleFetch = (roleId: number | null, roleName: string | null, userId: string | null) => {
    setRoleId(roleId);
     if (roleId !== null) {
      localStorage.setItem("roleId", String(roleId));
      localStorage.setItem("roleName", String(roleName));
      localStorage.setItem("userId", String(userId));
   }
    setRoleName(roleName);
    setUserId(userId);
  };
 
  useEffect(() => {
    if (!loading && !user) {
      setRoleId(null);
      setRoleName(null);
      localStorage.removeItem('roleId');
      localStorage.removeItem('roleName');
    }
  }, [user, loading]);



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

  if (!user) {
    // Pass the new callback to LoginPage
    return <LoginPage onRoleIdFetch={handleRoleFetch} />;
  }

  const renderContent = () => {
  switch (activeTab) {
    case 'dashboard':
      return <Dashboard />;
    case 'villages':
      return <VillagesList userId={userId} roleName={roleName} />;
    case 'gramPanchayat':
      return <GramPanchayat userId={userId} roleName={roleName} />;
    case 'taluka':
      return <Taluka userId={userId} roleName={roleName} />;
    case 'district':
      return <District userId={userId} />;
    // case 'funds':
    //   return <Funds userId={userId} />;
    case 'workProgress':
      return <WorkProgress userId={userId} roleName={roleName}/>;
    case 'tracking':
      return <Tracking userId={userId} />;
    case 'aarakhada':
      return <Aarakhada userId={userId} roleName={roleName} />;
    default:
      return <Dashboard />;
  }
};

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Pass roleId and roleName as props */}
      <Sidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        roleId={roleId}
        roleName={roleName}
        userId={userId}
      />
      <div className="flex-1 p-8 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
