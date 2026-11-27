import { ActivityIndicator, View } from 'react-native';

import { Colors } from '@/constants/theme';

export default function IndexRoute() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <ActivityIndicator size="large" color={Colors.brandOrange} />
    </View>
  );
}
