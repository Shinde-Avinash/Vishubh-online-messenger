import React from 'react';
import { AppProvider } from './context/AppContext';
import LoginScreen from './components/Auth/LoginScreen';
import Sidebar from './components/Sidebar/Sidebar';
import ChatArea from './components/Chat/ChatArea';
import { useApp } from './context/AppContext';

const App = () => {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <ChatArea />
    </div>
  );
};

export default function VishubhMessenger() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}