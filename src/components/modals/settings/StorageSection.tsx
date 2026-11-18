import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../../styles/SettingsModal.styles';
import {
  getStorageBreakdown,
  clearDriveAudioCache,
  clearArtworkCache,
  clearLyricsStorageCache,
  clearAllStorageCache,
  StorageBreakdown,
  formatBytes,
} from '../../../services/storage';

export interface StorageSectionProps {
  onShowToast?: (message: string) => void;
}

/**
 * Sección modular de configuración para auditar y gestionar el almacenamiento y la caché de Vulpis.
 */
export default function StorageSection({ onShowToast }: StorageSectionProps): React.JSX.Element {
  const [breakdown, setBreakdown] = useState<StorageBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isClearing, setIsClearing] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getStorageBreakdown();
      setBreakdown(data);
    } catch (e) {
      console.error('[StorageSection] Error cargando desglose de almacenamiento:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleClearCategory = (category: 'driveAudio' | 'artwork' | 'lyrics') => {
    if (!breakdown || isClearing) return;

    let title = '';
    let message = '';
    let actionFn: () => Promise<{ freedBytes: number; itemCount: number }>;

    if (category === 'driveAudio') {
      title = 'Limpiar Música de Google Drive';
      message = `¿Deseas eliminar las canciones descargadas en caché (${breakdown.driveAudio.formattedSize})? Podrás volver a reproducirlas o descargarlas desde tu Google Drive.`;
      actionFn = clearDriveAudioCache;
    } else if (category === 'artwork') {
      title = 'Limpiar Carátulas en Caché';
      message = `¿Deseas eliminar las portadas en caché (${breakdown.artwork.formattedSize})? La aplicación las volverá a obtener automáticamente según sea necesario.`;
      actionFn = clearArtworkCache;
    } else {
      title = 'Limpiar Caché de Letras';
      message = `¿Deseas eliminar las letras en línea guardadas (${breakdown.lyrics.formattedSize})? Se volverán a consultar en LRCLIB cuando las reproduzcas.`;
      actionFn = clearLyricsStorageCache;
    }

    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setIsClearing(category);
          try {
            const result = await actionFn();
            if (onShowToast) {
              onShowToast(`Se liberaron ${formatBytes(result.freedBytes)} de espacio.`);
            }
            await loadStats();
          } catch (err) {
            console.error('[StorageSection] Error al limpiar caché:', err);
            if (onShowToast) onShowToast('Error al limpiar el almacenamiento.');
          } finally {
            setIsClearing(null);
          }
        },
      },
    ]);
  };

  const handleClearAll = () => {
    if (!breakdown || breakdown.total.sizeBytes === 0 || isClearing) return;

    Alert.alert(
      'Vaciar Todo el Almacenamiento en Caché',
      `¿Deseas eliminar todas las canciones de Drive en caché, carátulas y letras? Se liberarán aproximadamente ${breakdown.total.formattedSize}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Vaciar Todo',
          style: 'destructive',
          onPress: async () => {
            setIsClearing('all');
            try {
              const result = await clearAllStorageCache();
              if (onShowToast) {
                onShowToast(`Se liberaron ${result.formattedFreed} en total.`);
              }
              await loadStats();
            } catch (err) {
              console.error('[StorageSection] Error vaciando todo el almacenamiento:', err);
              if (onShowToast) onShowToast('Error al vaciar el almacenamiento.');
            } finally {
              setIsClearing(null);
            }
          },
        },
      ]
    );
  };

  const isAnyClearActive = Boolean(isClearing);
  const totalBytes = breakdown?.total.sizeBytes || 0;

  return (
    <View style={styles.settingSection}>
      <View style={styles.settingRow}>
        <View style={styles.settingTextCol}>
          <Text style={styles.settingLabel}>Almacenamiento y Caché</Text>
          <Text style={styles.settingDescription}>
            Espacio en disco ocupado por canciones descargadas, portadas y letras.
          </Text>
        </View>
        <TouchableOpacity
          onPress={loadStats}
          disabled={isLoading || isAnyClearActive}
          style={{ padding: 6 }}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#8B5CF6" />
          ) : (
            <MaterialCommunityIcons name="refresh" size={20} color="#8E8F9E" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.storageCard}>
        {/* Cabecera de la tarjeta con total general */}
        <View style={styles.storageHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="database-outline" size={18} color="#A78BFA" />
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
              Caché Ocupada
            </Text>
          </View>
          <View style={styles.storageTotalBadge}>
            <MaterialCommunityIcons name="chart-pie" size={14} color="#A78BFA" />
            <Text style={styles.storageTotalText}>
              {breakdown ? breakdown.total.formattedSize : 'Calculando...'}
            </Text>
          </View>
        </View>

        {/* Fila 1: Música de Google Drive */}
        <View style={styles.storageItemRow}>
          <View style={styles.storageItemLeft}>
            <View style={styles.storageItemIcon}>
              <MaterialCommunityIcons name="cloud-download-outline" size={18} color="#60A5FA" />
            </View>
            <View style={styles.storageItemTexts}>
              <Text style={styles.storageItemTitle}>Música de Google Drive</Text>
              <Text style={styles.storageItemSubtitle}>
                {breakdown
                  ? `${breakdown.driveAudio.formattedSize} • ${breakdown.driveAudio.count} canciones`
                  : '...'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.storageItemClearBtn,
              (isClearing === 'driveAudio' || (breakdown?.driveAudio.sizeBytes === 0)) &&
                styles.storageItemClearBtnDisabled,
            ]}
            onPress={() => handleClearCategory('driveAudio')}
            disabled={isAnyClearActive || breakdown?.driveAudio.sizeBytes === 0}
            activeOpacity={0.7}
          >
            {isClearing === 'driveAudio' ? (
              <ActivityIndicator size="small" color="#F87171" />
            ) : (
              <Text style={styles.storageItemClearText}>Limpiar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Fila 2: Carátulas de álbumes */}
        <View style={styles.storageItemRow}>
          <View style={styles.storageItemLeft}>
            <View style={styles.storageItemIcon}>
              <MaterialCommunityIcons name="image-multiple-outline" size={18} color="#F472B6" />
            </View>
            <View style={styles.storageItemTexts}>
              <Text style={styles.storageItemTitle}>Portadas de álbumes</Text>
              <Text style={styles.storageItemSubtitle}>
                {breakdown
                  ? `${breakdown.artwork.formattedSize} • ${breakdown.artwork.count} imágenes`
                  : '...'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.storageItemClearBtn,
              (isClearing === 'artwork' || (breakdown?.artwork.sizeBytes === 0)) &&
                styles.storageItemClearBtnDisabled,
            ]}
            onPress={() => handleClearCategory('artwork')}
            disabled={isAnyClearActive || breakdown?.artwork.sizeBytes === 0}
            activeOpacity={0.7}
          >
            {isClearing === 'artwork' ? (
              <ActivityIndicator size="small" color="#F87171" />
            ) : (
              <Text style={styles.storageItemClearText}>Limpiar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Fila 3: Letras en línea */}
        <View style={[styles.storageItemRow, { borderBottomWidth: 0 }]}>
          <View style={styles.storageItemLeft}>
            <View style={styles.storageItemIcon}>
              <MaterialCommunityIcons name="text-box-outline" size={18} color="#34D399" />
            </View>
            <View style={styles.storageItemTexts}>
              <Text style={styles.storageItemTitle}>Letras en línea (LRCLIB)</Text>
              <Text style={styles.storageItemSubtitle}>
                {breakdown
                  ? `${breakdown.lyrics.formattedSize} • ${breakdown.lyrics.count} letras`
                  : '...'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.storageItemClearBtn,
              (isClearing === 'lyrics' || (breakdown?.lyrics.sizeBytes === 0)) &&
                styles.storageItemClearBtnDisabled,
            ]}
            onPress={() => handleClearCategory('lyrics')}
            disabled={isAnyClearActive || breakdown?.lyrics.sizeBytes === 0}
            activeOpacity={0.7}
          >
            {isClearing === 'lyrics' ? (
              <ActivityIndicator size="small" color="#F87171" />
            ) : (
              <Text style={styles.storageItemClearText}>Limpiar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Botón de Limpieza Global */}
        <TouchableOpacity
          style={[
            styles.storageCleanAllBtn,
            (isAnyClearActive || totalBytes === 0) && styles.storageCleanAllBtnDisabled,
          ]}
          onPress={handleClearAll}
          disabled={isAnyClearActive || totalBytes === 0}
          activeOpacity={0.7}
        >
          {isClearing === 'all' ? (
            <ActivityIndicator size="small" color="#F87171" />
          ) : (
            <>
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#F87171" />
              <Text style={styles.storageCleanAllText}>Vaciar todo el almacenamiento en caché</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
