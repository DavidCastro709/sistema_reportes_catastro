import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import RootNavigator from './src/navigation/RootNavigator';
import { clearToken, request } from './src/api/client';

export default function App() {
  const [user, setUser] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => { request('/auth/me').then((result) => setUser(result.user)).catch(async () => { await clearToken(); }).finally(() => setLoading(false)); }, []);
  if (loading) return <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></SafeAreaView>;
  if (!user) return <LoginScreen onLogin={setUser} />;
  return <RootNavigator user={user} onLogout={async () => { await clearToken(); setUser(null); }} />;
}
