import { Metadata } from 'next';
import { SettingsSidebar } from '@/components/admin/settings/SettingsSidebar';

export const metadata: Metadata = {
  title: 'Settings',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-6 lg:gap-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="w-full md:w-64 lg:w-72 shrink-0">
        <SettingsSidebar />
      </div>
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
