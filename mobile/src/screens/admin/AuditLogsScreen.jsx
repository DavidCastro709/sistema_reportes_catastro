import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { request } from '../../api/client';
import { dateTime } from '../../utils/format';

const actionLabels = {
  LOGIN_SUCCEEDED: 'Inicio de sesión exitoso',
  REPORT_CREATED: 'Reporte creado',
  REPORT_DELETED: 'Reporte eliminado',
  REPORT_EXPORTED_PDF: 'Reporte exportado a PDF',
  REPORT_EXPORTED_EXCEL: 'Reporte exportado a Excel',
  USER_CREATED: 'Usuario creado',
  USER_DEACTIVATED: 'Usuario desactivado',
};

function formatValues(values) {
  if (!values) return 'Sin datos';
  try { return JSON.stringify(values, null, 2); } catch { return String(values); }
}

export default function AuditLogsScreen() {
  const [items, setItems] = useState([]); const [busy, setBusy] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { setError(''); try { const result = await request('/audit-logs?page=1&limit=50'); setItems(result.items); } catch (err) { setError(err.message); } finally { setBusy(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (busy) return <ActivityIndicator style={{ flex: 1 }} />;
  return <View style={styles.container}><Text style={styles.title}>Trazabilidad del sistema</Text>{error ? <Text style={styles.error}>{error}</Text> : null}<FlatList data={items} keyExtractor={(item) => item.id} refreshControl={<RefreshControl refreshing={busy} onRefresh={load} />} ListEmptyComponent={<Text>No hay movimientos registrados.</Text>} renderItem={({ item }) => <View style={styles.card}><Text style={styles.action}>{actionLabels[item.action] || item.action}</Text><Text style={styles.entity}>{item.entity} · ID: {item.entityId}</Text><Text style={styles.actor}>Usuario: {item.actor?.fullName || 'Usuario eliminado'}{item.actor?.email ? ` · ${item.actor.email}` : ''}</Text><Text style={styles.meta}>{dateTime(item.createdAt)}</Text>{item.oldValues ? <><Text style={styles.label}>Valores anteriores</Text><Text style={styles.values}>{formatValues(item.oldValues)}</Text></> : null}{item.newValues ? <><Text style={styles.label}>Valores nuevos</Text><Text style={styles.values}>{formatValues(item.newValues)}</Text></> : null}</View>} /></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 18, backgroundColor: '#f4f7fb' }, title: { fontSize: 24, fontWeight: '800', color: '#17365d', marginBottom: 12 }, card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginVertical: 6, borderWidth: 1, borderColor: '#e2e8f0' }, action: { fontWeight: '800', color: '#17365d', marginBottom: 4 }, entity: { color: '#4472c4', fontWeight: '700', marginBottom: 5 }, actor: { color: '#17365d', fontWeight: '700' }, meta: { color: '#607086', marginTop: 5 }, label: { marginTop: 9, color: '#17365d', fontWeight: '700' }, values: { color: '#475569', marginTop: 3, fontFamily: 'monospace', fontSize: 12 }, error: { color: '#b42318' } });
