import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/web.styles';

export default function WebLyricsPanel({
  lyricsData,
  isLoading,
  activeLineIndex,
  onLineClick,
  onClose,
}) {
  const activeLineRef = useRef(null);

  // Auto-scroll hacia la línea activa
  useEffect(() => {
    if (activeLineRef.current && typeof activeLineRef.current.scrollIntoView === 'function') {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex]);

  return (
    <View style={styles.lyricsPanel}>
      {/* Cabecera del panel */}
      <View style={styles.lyricsPanelHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialCommunityIcons name="card-text-outline" size={20} color="#A78BFA" />
          <Text style={styles.lyricsTitle}>Letras</Text>
        </View>

        <TouchableOpacity onPress={onClose} style={styles.actionIconBtn}>
          <Feather name="x" size={20} color="#8E8F9E" />
        </TouchableOpacity>
      </View>

      {/* Contenido de las letras */}
      {isLoading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="small" color="#8B5CF6" />
          <Text style={styles.emptySubtitle}>Buscando letras en LRCLIB...</Text>
        </View>
      ) : lyricsData?.parsed && lyricsData.parsed.length > 0 ? (
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
          {lyricsData.parsed.map((line, idx) => {
            const isActive = idx === activeLineIndex;
            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => onLineClick(line.time)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  cursor: line.time !== null ? 'pointer' : 'default',
                  backgroundColor: isActive ? 'rgba(139, 92, 246, 0.18)' : 'transparent',
                  borderLeft: isActive ? '3px solid #8B5CF6' : '3px solid transparent',
                  marginBottom: 4,
                  transition: 'background-color 0.2s ease',
                }}
              >
                <Text
                  style={[
                    styles.lyricText,
                    isActive && styles.lyricTextActive,
                    line.isBreak && { fontStyle: 'italic', color: '#6F738E' },
                  ]}
                >
                  {line.text}
                </Text>
              </div>
            );
          })}
        </div>
      ) : lyricsData?.plain ? (
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
          <Text style={[styles.lyricText, { color: '#FFFFFF', lineHeight: 26 }]}>
            {lyricsData.plain}
          </Text>
        </div>
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="slash" size={32} color="#3B3E5B" />
          <Text style={styles.emptySubtitle}>
            No se encontraron letras disponibles para esta pista.
          </Text>
        </View>
      )}
    </View>
  );
}
