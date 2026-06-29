import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
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

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    marginBottom: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161722',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C2D3C',
  },
  iconButtonPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161722',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  titleContainer: {
    alignItems: 'center',
  },
  headerSubtitle: {
    color: '#8B5CF6',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 3,
    marginTop: 2,
  },
});
