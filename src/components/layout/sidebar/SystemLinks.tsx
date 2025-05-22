
import React from 'react';
import { BarChart, Settings } from 'lucide-react';
import SidebarNavLink from './SidebarNavLink';
import SidebarSection from './SidebarSection';

interface SystemLinksProps {
  isActiveRoute: (path: string) => boolean;
  closeSidebar: () => void;
}

const SystemLinks: React.FC<SystemLinksProps> = ({
  isActiveRoute,
  closeSidebar,
}) => {
  return (
    <SidebarSection title="ระบบ">
      <SidebarNavLink
        to="/analytics"
        icon={BarChart}
        isActive={isActiveRoute}
        onClick={closeSidebar}
      >
        รายงาน
      </SidebarNavLink>

      <SidebarNavLink
        to="/settings"
        icon={Settings}
        isActive={isActiveRoute}
        onClick={closeSidebar}
      >
        ตั้งค่า
      </SidebarNavLink>
    </SidebarSection>
  );
};

export default SystemLinks;
