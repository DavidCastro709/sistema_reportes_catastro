import React from 'react';
import { Button, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ViewReportsScreen from '../screens/user/ViewReportsScreen';
import AdminMenuScreen from './AdminMenuScreen';
import CreateReportScreen from '../screens/admin/CreateReportScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import AuditLogsScreen from '../screens/admin/AuditLogsScreen';

const Stack = createNativeStackNavigator();
export default function RootNavigator({ user, onLogout }) {
  return <NavigationContainer><Stack.Navigator screenOptions={{ headerTintColor: '#17365d' }}>
    <Stack.Screen name="Reports" options={({ navigation }) => ({ title: 'Reportes', headerRight: () => <View style={{ flexDirection: 'row', gap: 8 }}>{user.role === 'ADMIN' ? <Button title="Admin" onPress={() => navigation.navigate('AdminMenu')} /> : null}<Button title="Salir" onPress={onLogout} /></View> })}>{(props) => <ViewReportsScreen {...props} isAdmin={user.role === 'ADMIN'} />}</Stack.Screen>
    {user.role === 'ADMIN' ? <>
      <Stack.Screen name="AdminMenu" component={AdminMenuScreen} options={{ title: 'Administración' }} />
      <Stack.Screen name="CreateReport" options={{ title: 'Nuevo reporte' }}>{(props) => <CreateReportScreen {...props} />}</Stack.Screen>
      <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{ title: 'Usuarios' }} />
      <Stack.Screen name="AuditLogs" component={AuditLogsScreen} options={{ title: 'Auditoría' }} />
    </> : null}
  </Stack.Navigator></NavigationContainer>;
}
