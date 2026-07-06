import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Image,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import appConfig from '../../app.json';

export default function SidebarDrawer({ isOpen, onClose, currentSource, onSelectSource }) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(isOpen);
  const slideAnim = useRef(new Animated.Value(-290)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Avoid running the animation on the initial render if the drawer is closed
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!isOpen) {
        return;
      }
    }

    if (isOpen) {
      setVisible(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.65,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -290,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setVisible(false);
        }
      });
    }
  }, [isOpen]);

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
      label: 'Nube Privada (NAS)',
      icon: 'cloud-lock-outline',
      description: 'Tu almacenamiento privado',
    },
    {
      id: 'public',
      label: 'Nube Pública',
      icon: 'earth',
      description: 'Stream global y compartidos',
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
          <TouchableOpacity style={styles.settingsButton} activeOpacity={0.8}>
            <MaterialCommunityIcons name="cog-outline" size={20} color="#8E8F9E" />
            <Text style={styles.settingsLabel}>Ajustes</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>v{appConfig.expo.version}</Text>
        </View>
      </Animated.View>
    </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999, // Ensure it draws above all other layers
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
  },
  drawer: {
    width: 290,
    height: '100%',
    backgroundColor: '#0C0D14',
    borderRightWidth: 1,
    borderRightColor: '#1F202E',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#5F6070',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#1A1C29',
    marginBottom: 25,
  },
  sectionHeader: {
    color: '#4B4D63',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 12,
    paddingLeft: 8,
  },
  menuList: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  menuItemActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  menuItemLabel: {
    color: '#8E8F9E',
    fontSize: 14,
    fontWeight: '600',
  },
  menuItemLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  menuItemDesc: {
    color: '#5F6070',
    fontSize: 10,
    marginTop: 2,
  },
  activeIndicator: {
    width: 3,
    height: 16,
    borderRadius: 1.5,
    backgroundColor: '#8B5CF6',
    position: 'absolute',
    left: 0,
    top: '50%',
    marginTop: -8, // Centers indicator vertically
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#1A1C29',
    paddingTop: 15,
    gap: 12,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  settingsLabel: {
    color: '#8E8F9E',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  versionText: {
    color: '#3F4052',
    fontSize: 10,
    fontFamily: 'monospace',
    paddingLeft: 8,
  },
});
