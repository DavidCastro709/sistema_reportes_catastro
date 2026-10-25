import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Platform, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getToken, request } from '../../api/client';
import { dateTime } from '../../utils/format';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
export default function ViewReportsScreen({ isAdmin = false }) {
  const [items, setItems] = useState([]); const [busy, setBusy] = useState(true); const [error, setError] = useState(''); const [pendingDelete, setPendingDelete] = useState(null);
  const load = useCallback(async () => { setBusy(true); setError(''); try { const result = await request('/reports?page=1&limit=20'); setItems(result.items); } catch (err) { setError(err.message); } finally { setBusy(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const download = async (report, format) => {
    setError('');
    try {
      const token = await getToken();
      if (Platform.OS === 'web') {
        const response = await fetch(`${API_URL}/reports/${report.id}/export/${format}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error('No se pudo descargar la exportación.');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${report.folio}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        return;
      }
      const [FileSystem, Sharing] = await Promise.all([import('expo-file-system/legacy'), import('expo-sharing')]);
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      const destination = `${FileSystem.cacheDirectory}${report.folio}.${extension}`;
      const result = await FileSystem.downloadAsync(`${API_URL}/reports/${report.id}/export/${format}`, destination, { headers: { Authorization: `Bearer ${token}` } });
      if (result.status !== 200) throw new Error('No se pudo descargar la exportación.');
      if (!(await Sharing.isAvailableAsync())) throw new Error('Compartir archivos no está disponible en este dispositivo.');
      await Sharing.shareAsync(result.uri, { mimeType: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf', dialogTitle: `Exportar ${report.folio}` });
    } catch (err) { setError(err.message); }
  };
  const deleteReport = async (report) => {
    try {
      await request(`/reports/${encodeURIComponent(report.id)}`, { method: 'DELETE' });
      setPendingDelete(null);
      await load();
    } catch (err) { setError(err.message); }
  };
  if (busy) return <ActivityIndicator style={{ flex: 1 }} />;
  return <View style={styles.container}><Text style={styles.title}>Reportes publicados</Text>{error ? <Text style={styles.error}>{error}</Text> : null}{pendingDelete ? <View style={styles.confirm}><Text style={styles.confirmText}>¿Eliminar {pendingDelete.title}? Esta acción no se puede deshacer.</Text><View style={styles.confirmActions}><Button title="Cancelar" onPress={() => setPendingDelete(null)} /><Button title="Confirmar eliminación" color="#b42318" onPress={() => deleteReport(pendingDelete)} /></View></View> : null}<FlatList data={items} keyExtractor={(item) => item.id} refreshControl={<RefreshControl refreshing={busy} onRefresh={load} />} ListEmptyComponent={<Text>No hay reportes disponibles.</Text>} renderItem={({ item }) => <View style={styles.card}><Text style={styles.name}>{item.title}</Text><Text style={styles.meta}>Folio {item.folio} · {item._count.rows} registros</Text><Text style={styles.meta}>{dateTime(item.createdAt)}</Text><View style={styles.actions}><Button title="PDF" onPress={() => download(item, 'pdf')} /><Button title="Excel" onPress={() => download(item, 'excel')} />{isAdmin ? <Button title="Eliminar" color="#b42318" onPress={() => setPendingDelete(item)} /> : null}</View></View>} /></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 18, backgroundColor: '#f4f7fb' }, title: { fontSize: 24, fontWeight: '800', color: '#17365d', marginBottom: 12 }, confirm: { backgroundColor: '#fff1f0', borderWidth: 1, borderColor: '#fda29b', borderRadius: 8, padding: 12, marginBottom: 10 }, confirmText: { color: '#912018', fontWeight: '700', marginBottom: 8 }, confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }, card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginVertical: 7, borderWidth: 1, borderColor: '#e2e8f0' }, name: { fontSize: 17, fontWeight: '700', color: '#17365d' }, meta: { color: '#607086', marginTop: 5 }, actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 14, marginTop: 12 }, error: { color: '#b42318' } });
