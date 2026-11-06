import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/QueueList.styles';

export interface TabItem {
  id: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

export interface LibraryTabsProps {
  tabs?: TabItem[];
  activeTab: string;
  onTabChange?: (tabId: string) => void;
  trackCount?: number;
}

/**
 * Selector de pestañas superior: Canciones, Artistas, Álbumes y Playlists.
 */
export default function LibraryTabs({
  tabs = [],
  activeTab,
  onTabChange,
  trackCount = 0,
}: LibraryTabsProps): React.JSX.Element {
  return (
    <View style={styles.tabsContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScrollContent}
        bounces={false}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const showCount = tab.id === 'songs' && trackCount > 0;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => onTabChange && onTabChange(tab.id)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={15}
                color={isActive ? '#A78BFA' : '#8E8F9E'}
              />
              <Text
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
              {showCount && (
                <View style={[styles.tabCountBadge, isActive && styles.tabCountBadgeActive]}>
                  <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                    {trackCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
