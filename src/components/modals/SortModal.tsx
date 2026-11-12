import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../../styles/QueueList.styles';
import {
  SortConfig,
  SortField,
  SORT_OPTIONS,
} from '../../models/SortOptions';

export interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  currentConfig: SortConfig;
  onSelectConfig: (config: SortConfig) => void;
}

/**
 * Modal interactivo para configurar el ordenamiento multicriterio de la biblioteca musical.
 */
export default function SortModal({
  visible,
  onClose,
  currentConfig,
  onSelectConfig,
}: SortModalProps): React.JSX.Element | null {
  if (!visible) return null;

  const handleSelectOption = (field: SortField): void => {
    if (field === currentConfig.field) {
      // Alternar dirección asc <-> desc
      const newOrder = currentConfig.order === 'asc' ? 'desc' : 'asc';
      onSelectConfig({ field, order: newOrder });
    } else {
      // Nuevo campo seleccionado con dirección inicial intuitiva
      const initialOrder = field === 'addedAt' ? 'desc' : 'asc';
      onSelectConfig({ field, order: initialOrder });
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Ordenar biblioteca</Text>
          <Text style={styles.modalSubtitle} numberOfLines={1}>
            Selecciona el criterio y dirección de ordenamiento
          </Text>

          <View style={styles.modalDivider} />

          {/* Opciones de ordenamiento */}
          {SORT_OPTIONS.map((opt) => {
            const isActive = currentConfig.field === opt.field;
            const currentOrder = isActive ? currentConfig.order : (opt.field === 'addedAt' ? 'desc' : 'asc');
            const directionLabel = currentOrder === 'asc' ? opt.ascLabel : opt.descLabel;

            return (
              <TouchableOpacity
                key={opt.field}
                style={[styles.sortOptionItem, isActive && styles.sortOptionItemActive]}
                onPress={() => handleSelectOption(opt.field)}
                activeOpacity={0.7}
              >
                <View style={styles.sortOptionLeft}>
                  <MaterialCommunityIcons
                    name={opt.icon}
                    size={22}
                    color={isActive ? '#A78BFA' : '#8E8F9E'}
                  />
                  <View style={styles.sortOptionTextCol}>
                    <Text
                      style={[styles.sortOptionTitle, isActive && styles.sortOptionTitleActive]}
                      numberOfLines={1}
                    >
                      {opt.label}
                    </Text>
                    <Text style={styles.sortOptionSubtitle} numberOfLines={1}>
                      {directionLabel}
                    </Text>
                  </View>
                </View>

                {isActive && (
                  <View style={styles.sortOrderBadge}>
                    <MaterialCommunityIcons
                      name={currentConfig.order === 'asc' ? 'arrow-up' : 'arrow-down'}
                      size={14}
                      color="#A78BFA"
                    />
                    <Text style={styles.sortOrderText}>
                      {currentConfig.order === 'asc' ? 'ASC' : 'DESC'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={onClose}
            style={[styles.modalOption, styles.modalCancelOption, { marginTop: 10 }]}
            activeOpacity={0.7}
          >
            <Text style={styles.modalCancelText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
