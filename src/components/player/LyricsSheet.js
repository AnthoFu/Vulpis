import React from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useSheetAnimation from '../../hooks/useSheetAnimation';
import styles from '../../styles/PlayerCard.styles';

/**
 * Hoja modal inferior para visualización, auto-scroll interactivo y edición de letras.
 */
export default function LyricsSheet({
  visible,
  onClose,
  insets,
  currentTrackTitle,
  currentTrackArtist,
  lyricsText,
  isLoadingLyrics,
  parsedLines,
  hasTimestamps,
  activeIndex,
  isUserScrolled,
  lyricsScrollRef,
  lineLayoutsRef,
  containerHeightRef,
  handleScrollBeginDrag,
  handleScrollEndDrag,
  handleManualSyncPress,
  handleLyricLinePress,
  onOpenEditLyrics,
}) {
  const {
    visible: sheetVisible,
    translateY: sheetTranslateY,
    backdropOpacity,
  } = useSheetAnimation({ isOpen: visible });

  if (!sheetVisible) return null;

  return (
    <View style={styles.bottomSheetOverlay}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.bottomSheetBackdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.lyricsSheetContent,
          {
            paddingBottom: Math.max(insets?.bottom || 0, 20),
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        <View style={styles.bottomSheetHandleWrapper}>
          <View style={styles.bottomSheetHandle} />
        </View>

        <View style={styles.lyricsHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.lyricsTitle} numberOfLines={1}>
                Letras
              </Text>
              {hasTimestamps && (
                <View style={styles.syncedBadge}>
                  <MaterialCommunityIcons name="lightning-bolt" size={12} color="#A78BFA" />
                  <Text style={styles.syncedBadgeText}>Sincronizadas</Text>
                </View>
              )}
            </View>
            <Text style={styles.lyricsTrackSub} numberOfLines={1}>
              {currentTrackTitle} • {currentTrackArtist}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity
              onPress={onOpenEditLyrics}
              style={styles.lyricsCloseBtn}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="pencil-outline" size={22} color="#A78BFA" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.lyricsCloseBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={24} color="#8E8F9E" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          ref={lyricsScrollRef}
          style={styles.lyricsScrollView}
          contentContainerStyle={styles.lyricsScrollContent}
          showsVerticalScrollIndicator={false}
          onLayout={(e) => {
            if (containerHeightRef) {
              containerHeightRef.current = e.nativeEvent.layout.height;
            }
          }}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollEnd={handleScrollEndDrag}
        >
          {isLoadingLyrics ? (
            <View style={styles.lyricsLoadingContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.lyricsLoadingText}>Cargando letra de la canción...</Text>
            </View>
          ) : lyricsText ? (
            hasTimestamps ? (
              <View>
                {parsedLines.map((line, idx) => {
                  const isActive = idx === activeIndex;
                  const isPassed = hasTimestamps && activeIndex >= 0 && idx < activeIndex;
                  return (
                    <TouchableOpacity
                      key={idx}
                      onLayout={(e) => {
                        if (lineLayoutsRef?.current) {
                          lineLayoutsRef.current[idx] = e.nativeEvent.layout;
                        }
                      }}
                      onPress={() => handleLyricLinePress(line.time)}
                      disabled={line.time === null}
                      activeOpacity={0.7}
                      style={[
                        styles.lyricLineRow,
                        isActive && styles.lyricLineRowActive,
                        line.isBreak && styles.lyricLineRowBreak,
                      ]}
                    >
                      <Text
                        style={[
                          styles.lyricLineText,
                          isPassed && styles.lyricLinePassedText,
                          isActive && styles.lyricLineActiveText,
                          line.isBreak && styles.lyricLineBreakText,
                        ]}
                      >
                        {line.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.lyricsBodyText}>{lyricsText}</Text>
            )
          ) : (
            <View style={styles.emptyLyricsContainer}>
              <View style={styles.emptyLyricsIconCircle}>
                <MaterialCommunityIcons name="microphone-off" size={36} color="#A78BFA" />
              </View>
              <Text style={styles.emptyLyricsTitle}>Parece que no hay letras para esta canción</Text>
              <Text style={styles.emptyLyricsSub}>
                No se encontraron letras integradas en los metadatos de esta canción ni en línea.
              </Text>
              <TouchableOpacity
                style={styles.addLyricsBtn}
                onPress={onOpenEditLyrics}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="pencil" size={18} color="#FFFFFF" />
                <Text style={styles.addLyricsBtnText}>Escribir o editar letra</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Botón flotante para sincronizar si el usuario scrolleó manualmente */}
        {isUserScrolled && hasTimestamps && activeIndex >= 0 && (
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleManualSyncPress}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={16}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.syncButtonText}>Sincronizar</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}
