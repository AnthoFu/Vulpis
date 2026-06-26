import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useProgress } from '@rntp/player';

export default function ProgressBar() {
  const { position, duration } = useProgress();

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarActive, { width: `${progressPercent}%` }]} />
      </View>
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(position)}</Text>
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
  progressBarBackground: {
    height: 6,
    width: '100%',
    backgroundColor: '#2C2D3C',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarActive: {
    height: 6,
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    color: '#8E8F9E',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
