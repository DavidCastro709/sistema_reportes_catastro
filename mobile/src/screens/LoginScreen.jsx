import React, { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { request, saveToken } from '../api/client';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setBusy(true); setError('');
    try {
      const result = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      await saveToken(result.token); onLogin(result.user);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <View style={styles.container}>
    <Text style={styles.eyebrow}>DIRECCIÓN MUNICIPAL DE CATASTRO</Text>
    <Text style={styles.title}>Sistema de reportes</Text>
    <TextInput style={styles.input} autoCapitalize="none" keyboardType="email-address" placeholder="Correo institucional" value={email} onChangeText={setEmail} />
    <TextInput style={styles.input} secureTextEntry placeholder="Contraseña" value={password} onChangeText={setPassword} />
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {busy ? <ActivityIndicator /> : <Button title="Iniciar sesión" onPress={submit} />}
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#f4f7fb' }, eyebrow: { color: '#4472c4', fontSize: 12, fontWeight: '700', letterSpacing: 1 }, title: { color: '#17365d', fontSize: 28, fontWeight: '800', marginVertical: 16 }, input: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginVertical: 7, borderWidth: 1, borderColor: '#dce4ef' }, error: { color: '#b42318', marginVertical: 8 } });
