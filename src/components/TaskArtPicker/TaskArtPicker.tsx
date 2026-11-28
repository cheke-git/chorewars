import { Image, Pressable, Text, View } from 'react-native';

import { TASK_ART_MAP } from '@/constants/taskArt';

import { styles } from './TaskArtPicker.styles';

const ART_ENTRIES = Object.entries(TASK_ART_MAP);

interface TaskArtPickerProps {
  selectedKey: string;
  onSelect: (key: string) => void;
}

export function TaskArtPicker({ selectedKey, onSelect }: TaskArtPickerProps) {
  return (
    <View style={styles.grid}>
      {ART_ENTRIES.map(([key, meta]) => {
        const isSelected = selectedKey === key;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Mission illustration ${key.replace('_', ' ')}`}
            style={[styles.tile, isSelected && styles.tileSelected]}>
            {meta.image ? (
              <Image source={meta.image} style={styles.image} resizeMode="contain" />
            ) : (
              <Text style={styles.symbol}>{meta.symbol}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
