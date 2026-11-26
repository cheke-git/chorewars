import { Redirect } from 'expo-router';

import { useApp } from '@/context/AppContext';
import { FortWizardScreen } from '@/screens/FortWizardScreen/FortWizardScreen';

export default function WizardRoute() {
  const { token, fortState } = useApp();

  if (!token) {
    return <Redirect href="/" />;
  }
  if (fortState) {
    return <Redirect href="/profiles" />;
  }

  return <FortWizardScreen />;
}
