import React from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Animated,
  Image,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import styles from '../styles/SidebarDrawer.styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import appConfig from '../../app.config';
import useSidebarDrawer from '../hooks/useSidebarDrawer';

export default function SidebarDrawer({ isOpen, onClose, currentSource, onSelectSource, onOpenSettings }) {
  const insets = useSafeAreaInsets();
  const { visible, slideAnim, fadeAnim } = useSidebarDrawer({ isOpen });

  if (!visible) return null;

  const menuItems = [
    {
      id: 'local',
      label: 'Biblioteca Local',
      icon: 'folder-music-outline',
      description: 'Archivos locales del dispositivo',
    },
    {
      id: 'private',
      label: 'Nube Privada',
      icon: 'google-drive',
      description: 'Música en tu Google Drive',
    },
    {
      id: 'playlists',
      label: 'Mis Playlists',
      icon: 'playlist-music-outline',
      description: 'Tus listas de reproducción híbridas',
    },
  ];

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Drawer Body */}
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
              paddingTop: insets.top + 20,
              paddingBottom: Math.max(insets.bottom + 20, 20),
            },
          ]}
        >
          <View>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/AnthoFu-Icon-Purple.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>VULPIS</Text>
                <Text style={styles.subtitle}>Nube de Audio Híbrida</Text>
              </View>
            </View>

            {/* Separation Line */}
            <View style={styles.divider} />

            {/* Navigation Options */}
            <View style={styles.menuList}>
              <Text style={styles.sectionHeader}>FUENTES DE AUDIO</Text>
              {menuItems.map((item) => {
                const isActive = currentSource === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      onSelectSource(item.id);
                      onClose();
                    }}
                    style={[styles.menuItem, isActive && styles.menuItemActive]}
                    activeOpacity={0.8}
                  >
                    <View style={styles.menuItemContent}>
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={22}
                        color={isActive ? '#A78BFA' : '#8E8F9E'}
                      />
                      <View style={styles.menuItemTextCol}>
                        <Text style={[styles.menuItemLabel, isActive && styles.menuItemLabelActive]}>
                          {item.label}
                        </Text>
                        <Text style={styles.menuItemDesc}>{item.description}</Text>
                      </View>
                    </View>
                    {isActive && <View style={styles.activeIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.settingsButton} 
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                if (onOpenSettings) onOpenSettings();
              }}
            >
              <MaterialCommunityIcons name="cog-outline" size={20} color="#8E8F9E" />
              <Text style={styles.settingsLabel}>Ajustes</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>v{appConfig?.expo?.version }</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
