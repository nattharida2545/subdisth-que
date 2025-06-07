
import React from 'react';
import Layout from '@/components/layout/Layout';
import SettingsTabs from '@/components/settings/SettingsTabs';
import SettingsHeader from '@/components/settings/SettingsHeader';
import SettingsLoading from '@/components/settings/SettingsLoading';
import SettingsForm from '@/components/settings/SettingsForm';
import { SettingsProvider, useSettingsContext } from '@/contexts/SettingsContext';

const SettingsContent: React.FC = () => {
  const { loading, loadingQueueTypes } = useSettingsContext();

  if (loading || loadingQueueTypes) {
    return <SettingsLoading />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <SettingsHeader />
      </div>
      <SettingsTabs>
        <SettingsForm />
      </SettingsTabs>
    </div>
  );
};

const Settings = () => {
  return (
    <SettingsProvider>
      <SettingsContent />
    </SettingsProvider>
  );
};

export default Settings;
