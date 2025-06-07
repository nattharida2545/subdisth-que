
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { Patient, Queue } from '@/integrations/supabase/schema';
import PatientProfile from '@/components/patient-portal/PatientProfile';
import PatientQueueStatus from '@/components/patient-portal/PatientQueueStatus';
import PatientMedications from '@/components/patient-portal/PatientMedications';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface ActiveQueueViewProps {
  patient: Patient;
  queue: Queue;
  patients: Patient[];
  availableQueues?: Queue[];
  onLogout: () => void;
  onSwitchPatient: () => void;
  onSwitchQueue?: () => void;
  onClearQueueHistory?: () => void;
}

const ActiveQueueView: React.FC<ActiveQueueViewProps> = ({ 
  patient, 
  queue, 
  patients, 
  availableQueues = [],
  onLogout, 
  onSwitchPatient,
  onSwitchQueue,
  onClearQueueHistory
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Check if user has multiple queues
  const hasMultipleQueues = availableQueues.length > 1;

  // Add a function to determine if the queue is from today
  const isQueueFromToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const queueDate = new Date(queue.created_at);
    queueDate.setHours(0, 0, 0, 0);
    
    return queueDate >= today;
  };

  // Automatically clear outdated queues when component mounts
  useEffect(() => {
    if (!isQueueFromToday() && onClearQueueHistory) {
      onClearQueueHistory();
    }
  }, [queue, onClearQueueHistory]);

  // If queue is not from today, don't show it
  if (!isQueueFromToday()) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 p-2 sm:p-4">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-pharmacy-700`}>
            ระบบติดตามคิวผู้ป่วย
          </h1>
          <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={onLogout}>
            ออกจากระบบ
          </Button>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">ไม่พบคิวสำหรับวันนี้</h2>
          <p className="text-yellow-700">
            คิวที่แสดงอยู่เป็นคิวเก่าจากวันก่อนหน้า ระบบกำลังล้างข้อมูลคิวเก่า
          </p>
        </div>
        
        <div className="flex justify-between items-center mb-2 sm:mb-4">
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-800`}>
            ข้อมูลผู้ป่วย
          </h2>
          <div className="flex gap-2">
            {hasMultipleQueues && onSwitchQueue && (
              <Button variant="outline" size="sm" onClick={onSwitchQueue}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                กลับไปรายการคิว
              </Button>
            )}
            {patients.length > 1 && (
              <Button variant="outline" size="sm" onClick={onSwitchPatient}>
                เลือกผู้ป่วยอื่น
              </Button>
            )}
          </div>
        </div>
        
        <Tabs defaultValue="profile" className="flex-1">
          <TabsList className="mb-3 sm:mb-4 grid grid-cols-2 w-full">
            <TabsTrigger value="profile" className={isMobile ? "text-sm py-1.5" : ""}>
              ข้อมูลส่วนตัว
            </TabsTrigger>
            <TabsTrigger value="medications" className={isMobile ? "text-sm py-1.5" : ""}>
              รายการยา
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <PatientProfile patient={patient} />
          </TabsContent>
          
          <TabsContent value="medications">
            <PatientMedications patientId={patient.id} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-pharmacy-700`}>
          ระบบติดตามคิวผู้ป่วย
        </h1>
        <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={onLogout}>
          ออกจากระบบ
        </Button>
      </div>
      
      <PatientQueueStatus 
        queue={queue} 
        patient={patient} 
        className="mb-3 sm:mb-4" 
      />
      
      <div className="flex justify-between items-center mb-2 sm:mb-4">
        <div>
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-800`}>
            ข้อมูลผู้ป่วย
          </h2>
          {hasMultipleQueues && (
            <p className="text-sm text-gray-600 mt-1">
              คิวที่ติดตาม: คิว {availableQueues.findIndex(q => q.id === queue.id) + 1} จาก {availableQueues.length} คิว
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {hasMultipleQueues && onSwitchQueue && (
            <Button variant="outline" size="sm" onClick={onSwitchQueue}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              {isMobile ? "รายการคิว" : "กลับไปรายการคิว"}
            </Button>
          )}
          {patients.length > 1 && (
            <Button variant="outline" size="sm" onClick={onSwitchPatient}>
              เลือกผู้ป่วยอื่น
            </Button>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="profile" className="flex-1">
        <TabsList className="mb-3 sm:mb-4 grid grid-cols-2 w-full">
          <TabsTrigger value="profile" className={isMobile ? "text-sm py-1.5" : ""}>
            ข้อมูลส่วนตัว
          </TabsTrigger>
          <TabsTrigger value="medications" className={isMobile ? "text-sm py-1.5" : ""}>
            รายการยา
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <PatientProfile patient={patient} />
        </TabsContent>
        
        <TabsContent value="medications">
          <PatientMedications patientId={patient.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ActiveQueueView;
