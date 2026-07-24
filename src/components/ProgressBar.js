import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import TrackPlayer from '@rntp/player';

export default function ProgressBar({ position, duration }) {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleValueChange = (val) => {
    setSeekPosition(val);
    if (!isSeeking) {
      setIsSeeking(true);
    }
  };

  const handleSlidingComplete = async (val) => {
    try {
      await TrackPlayer.seekTo(val);
    } catch (e) {
      console.error('Error al buscar posición en TrackPlayer:', e);
    } finally {
      setIsSeeking(false);
    }
  };

  const displayPosition = isSeeking ? seekPosition : position;

  return (
    <View style={styles.progressContainer}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration > 0 ? duration : 0}
        value={displayPosition}
        onValueChange={handleValueChange}
        onSlidingComplete={handleSlidingComplete}
        minimumTrackTintColor="#8B5CF6"
        maximumTrackTintColor="#2C2D3C"
        thumbTintColor="#A78BFA"
      />
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(displayPosition)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4, // Ajustar ligeramente ya que el deslizador tiene un relleno incorporado
    paddingHorizontal: 4,
  },
  timeText: {
    color: '#8E8F9E',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

