import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function AdminMenuScreen({ navigation }) {
  return <View style={styles.container}>
    <Text style={styles.title}>Administración</Text>
    <Text style={styles.description}>Herramientas de gestión disponibles para cuentas administradoras.</Text>
    <View style={styles.button}><Button title="Crear reporte" onPress={() => navigation.navigate('CreateReport')} /></View>
    <View style={styles.button}><Button title="Gestionar usuarios" onPress={() => navigation.navigate('UserManagement')} /></View>
    <View style={styles.button}><Button title="Consultar auditoría" onPress={() => navigation.navigate('AuditLogs')} /></View>
  </View>;
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 22, backgroundColor: '#f4f7fb' }, title: { color: '#17365d', fontSize: 26, fontWeight: '800', marginBottom: 8 }, description: { color: '#607086', marginBottom: 22 }, button: { backgroundColor: '#fff', borderRadius: 12, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' } });
