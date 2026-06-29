import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, PanResponder } from 'react-native';
import TrackPlayer from '@rntp/player';

export default function ProgressBar({ position, duration }) {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const progressBarRef = useRef(null);
  const barLeft = useRef(0);
  const barWidth = useRef(0);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        setIsSeeking(true);
        progressBarRef.current?.measure((x, y, w, h, pageX, pageY) => {
          barLeft.current = pageX;
          barWidth.current = w;
          const touchX = evt.nativeEvent.pageX - pageX;
          const pct = touchX / w;
          const newPosition = Math.max(0, Math.min(pct * duration, duration));
          setSeekPosition(newPosition);
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        if (barWidth.current > 0) {
          const touchX = evt.nativeEvent.pageX - barLeft.current;
          const pct = touchX / barWidth.current;
          const newPosition = Math.max(0, Math.min(pct * duration, duration));
          setSeekPosition(newPosition);
        }
      },
      onPanResponderRelease: async (evt, gestureState) => {
        if (barWidth.current > 0) {
          const touchX = evt.nativeEvent.pageX - barLeft.current;
          const pct = touchX / barWidth.current;
          const newPosition = Math.max(0, Math.min(pct * duration, duration));
          try {
            await TrackPlayer.seekTo(newPosition);
          } catch (e) {
            console.error('Error seeking in TrackPlayer:', e);
          }
        }
        setIsSeeking(false);
      },
      onPanResponderTerminate: () => {
        setIsSeeking(false);
      },
    })
  ).current;

  const displayPosition = isSeeking ? seekPosition : position;
  const progressPercent = duration > 0 ? (displayPosition / duration) * 100 : 0;

  return (
    <View style={styles.progressContainer}>
      <View
        ref={progressBarRef}
        {...panResponder.panHandlers}
        style={styles.progressBarWrapper}
        collapsable={false}
      >
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarActive, { width: `${progressPercent}%` }]} />
          <View style={[styles.progressThumb, { left: `${progressPercent}%` }]} />
        </View>
      </View>
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
  progressBarWrapper: {
    paddingVertical: 10,
    width: '100%',
    justifyContent: 'center',
  },
  progressBarBackground: {
    height: 6,
    width: '100%',
    backgroundColor: '#2C2D3C',
    borderRadius: 3,
    position: 'relative',
  },
  progressBarActive: {
    height: 6,
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#A78BFA',
    position: 'absolute',
    top: -4,
    marginLeft: -7,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    color: '#8E8F9E',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
