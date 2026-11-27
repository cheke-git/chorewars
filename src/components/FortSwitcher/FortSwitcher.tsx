import { Pressable, ScrollView, Text, View } from 'react-native';

import { useApp } from '@/context/AppContext';

import { styles } from './FortSwitcher.styles';

export function FortSwitcher() {
  const { availableFortsForActiveUser, activeFortId, selectFort } = useApp();

  if (availableFortsForActiveUser.length <= 1) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {availableFortsForActiveUser.map((fort) => {
          const isActive = fort.id === activeFortId;
          return (
            <Pressable
              key={fort.id}
              onPress={() => {
                if (!isActive) {
                  void selectFort(fort.id);
                }
              }}
              style={[styles.pill, isActive && styles.pillActive]}>
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {fort.name}
              </Text>
              {fort.role === 'coch' ? (
                <Text style={[styles.roleDot, isActive && styles.roleDotActive]}>CoCh</Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
