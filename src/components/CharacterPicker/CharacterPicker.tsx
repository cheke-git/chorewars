import { Image, Pressable, View } from 'react-native';

import { AVATAR_PRESETS, type CharacterArchetypeKey } from '@/constants/characterArt';

import { styles } from './CharacterPicker.styles';

interface CharacterPickerProps {
  selectedKey: string;
  onSelect: (key: CharacterArchetypeKey) => void;
}

export function CharacterPicker({ selectedKey, onSelect }: CharacterPickerProps) {
  return (
    <View style={styles.row}>
      {AVATAR_PRESETS.map((preset) => {
        const isSelected = selectedKey === preset.key;
        const portrait = preset.tiers[1];

        return (
          <Pressable
            key={preset.key}
            onPress={() => onSelect(preset.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            style={[styles.tile, isSelected && styles.tileSelected]}>
            {portrait ? (
              <Image source={portrait} style={styles.portrait} resizeMode="contain" />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
