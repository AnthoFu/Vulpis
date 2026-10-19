import React, { useRef, useEffect } from 'react';
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/QueueSheet.styles';

/**
 * Fila individual reordenable de la cola de reproducción con soporte táctil para arrastre nativo.
 */
const QueueItemRow = React.memo(function QueueItemRow({
  item,
  index,
  isDragging,
  dragY,
  shiftY,
  defaultArtwork,
  onStartDrag,
  onMoveDrag,
  onEndDrag,
  onQuickMoveUp,
  onQuickMoveDown,
  onRemove,
  onSelect,
  isFirst,
  isLast,
}) {
  const indexRef = useRef(index);
  indexRef.current = index;

  const onStartDragRef = useRef(onStartDrag);
  onStartDragRef.current = onStartDrag;

  const onMoveDragRef = useRef(onMoveDrag);
  onMoveDragRef.current = onMoveDrag;

  const onEndDragRef = useRef(onEndDrag);
  onEndDragRef.current = onEndDrag;

  const titleRef = useRef(item.title);
  titleRef.current = item.title;

  // Animación suave de desplazamiento para los elementos adyacentes
  const shiftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isDragging) {
      Animated.timing(shiftAnim, {
        toValue: shiftY,
        duration: 140,
        useNativeDriver: true,
      }).start();
    }
  }, [shiftY, isDragging, shiftAnim]);

  // El PanResponder se instancia UNA SOLA VEZ mediante useRef
  // Esto previene que se reinicie o termine cuando el reproductor re-renderiza la vista
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 2,
      onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dy) > 2,
      onPanResponderGrant: () => {
        console.log(`[Queue Drag] 🎯 Touch concedido en índice ${indexRef.current}: "${titleRef.current}"`);
        onStartDragRef.current(indexRef.current);
      },
      onPanResponderMove: (_, gesture) => {
        onMoveDragRef.current(gesture.dy);
      },
      onPanResponderRelease: () => {
        console.log(`[Queue Drag] ✋ Touch soltado en índice ${indexRef.current}: "${titleRef.current}"`);
        onEndDragRef.current();
      },
      onPanResponderTerminate: () => {
        console.log(`[Queue Drag] ⚠️ Touch terminado/interrumpido en índice ${indexRef.current}`);
        onEndDragRef.current();
      },
    })
  ).current;

  const animatedStyle = isDragging
    ? {
        transform: [{ translateY: dragY }, { scale: 1.025 }],
        zIndex: 9999,
        elevation: 16,
      }
    : {
        transform: [{ translateY: shiftAnim }],
        zIndex: 1,
      };

  return (
    <Animated.View style={[styles.queueItem, isDragging && styles.queueItemDragging, animatedStyle]}>
      <TouchableOpacity
        onPress={() => onSelect(item, index)}
        style={styles.queueItemMainContent}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.artworkUrl || defaultArtwork }}
          style={styles.queueItemArtwork}
        />
        <View style={styles.queueItemDetails}>
          <Text style={styles.queueItemTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.queueItemArtist} numberOfLines={1}>
            {item.artist}
            {item.album && item.album !== 'Álbum Desconocido' && item.album !== 'Desconocido'
              ? ` • ${item.album}`
              : ''}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        {/* Botón rápido Subir */}
        <TouchableOpacity
          onPress={() => onQuickMoveUp(index)}
          disabled={isFirst}
          style={[styles.quickMoveBtn, isFirst && styles.quickMoveBtnDisabled]}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          activeOpacity={0.6}
        >
          <MaterialCommunityIcons
            name="chevron-up"
            size={20}
            color={isFirst ? '#3E4059' : '#A78BFA'}
          />
        </TouchableOpacity>

        {/* Botón rápido Bajar */}
        <TouchableOpacity
          onPress={() => onQuickMoveDown(index)}
          disabled={isLast}
          style={[styles.quickMoveBtn, isLast && styles.quickMoveBtnDisabled]}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          activeOpacity={0.6}
        >
          <MaterialCommunityIcons
            name="chevron-down"
            size={20}
            color={isLast ? '#3E4059' : '#A78BFA'}
          />
        </TouchableOpacity>

        {/* Botón Eliminar de la cola */}
        <TouchableOpacity
          onPress={() => onRemove(item, index)}
          style={styles.removeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          activeOpacity={0.6}
        >
          <MaterialCommunityIcons name="close" size={18} color="#8E8F9E" />
        </TouchableOpacity>

        {/* Mango de arrastre táctil */}
        <View {...panResponder.panHandlers} style={styles.dragHandle}>
          <MaterialCommunityIcons
            name="drag-horizontal-variant"
            size={22}
            color={isDragging ? '#A78BFA' : '#5F6070'}
          />
        </View>
      </View>
    </Animated.View>
  );
});

export default QueueItemRow;
