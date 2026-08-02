import React from 'react';
import { Text, View } from 'react-native';
import styles from '../styles/ProgressBar.styles';
import Slider from '@react-native-community/slider';
import useProgressBar from '../hooks/useProgressBar';

export default function ProgressBar({ position, duration }) {
  const {
    displayPosition,
    formatTime,
    handleValueChange,
    handleSlidingComplete,
  } = useProgressBar({ position, duration });

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
