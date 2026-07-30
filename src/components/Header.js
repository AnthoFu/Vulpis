import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import styles from '../styles/Header.styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Header({ onMenuPress }) {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={onMenuPress} style={styles.iconButton} activeOpacity={0.7}>
        <MaterialCommunityIcons name="menu" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      <View style={styles.titleContainer}>
        <Text style={styles.headerSubtitle}>REPRODUCTOR NATIVO</Text>
        <Text style={styles.headerTitle}>VULPIS</Text>
      </View>
      
      <View style={styles.iconButtonPlaceholder}>
        <MaterialCommunityIcons name="cloud-sync-outline" size={22} color="#8B5CF6" />
      </View>
    </View>
  );
}


