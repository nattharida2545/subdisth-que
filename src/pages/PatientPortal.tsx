
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Patient, Queue, QueueStatus, QueueType } from '@/integrations/supabase/schema';
import PatientPortalLoading from '@/components/patient-portal/PatientPortalLoading';
import PatientPortalAuth from '@/components/patient-portal/PatientPortalAuth';
import ActiveQueueView from '@/components/patient-portal/ActiveQueueView';
import PatientSelectionView from '@/components/patient-portal/PatientSelectionView';
import { useIsMobile } from '@/hooks/use-mobile';
import LineLoginButton from '../components/LineLoginButton';

const PatientPortal: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeQueue, setActiveQueue] = useState<Queue | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isStaffMode, setIsStaffMode] = useState<boolean>(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check for LINE authentication state on component mount
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Check if there's a LINE auth token in localStorage
        const lineToken = localStorage.getItem('lineToken');
        const userPhone = localStorage.getItem('userPhone');
        
        if (lineToken && userPhone) {
          setIsAuthenticated(true);
          setPhoneNumber(userPhone);
          
          // Fetch patients associated with this phone number
          const { data: patientData, error: patientError } = await supabase
            .from('patients')
            .select('*')
            .eq('phone', userPhone);
          
          if (patientError) throw patientError;
          
          if (patientData && patientData.length > 0) {
            setPatients(patientData);
            
            // Check if there's an active queue for any of these patients
            const patientIds = patientData.map(p => p.id);
            const { data: queueData, error: queueError } = await supabase
              .from('queues')
              .select('*')
              .in('patient_id', patientIds)
              .in('status', ['WAITING', 'ACTIVE'])
              .order('created_at', { ascending: false })
              .limit(1);
            
            if (queueError) throw queueError;
            
            if (queueData && queueData.length > 0) {
              // Convert string type to QueueType and string status to QueueStatus
              const typedQueue: Queue = {
                ...queueData[0],
                type: queueData[0].type as QueueType,
                status: queueData[0].status as QueueStatus
              };
              
              setActiveQueue(typedQueue);
              
              // Find which patient this queue belongs to
              const queuePatient = patientData.find(p => p.id === typedQueue.patient_id);
              if (queuePatient) {
                setSelectedPatient(queuePatient);
              } else {
                // If no active queue patient found, select first patient
                setSelectedPatient(patientData[0]);
              }
            } else {
              // No active queue, select first patient
              setSelectedPatient(patientData[0]);
            }
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        toast.error('เกิดข้อผิดพลาดในการตรวจสอบการเข้าสู่ระบบ');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleLineLoginSuccess = async (token: string, userPhone: string) => {
    localStorage.setItem('lineToken', token);
    localStorage.setItem('userPhone', userPhone);
    setIsAuthenticated(true);
    setPhoneNumber(userPhone);
    setIsStaffMode(false);
    
    // Reload the page to fetch patient data
    window.location.reload();
  };

  const handlePatientFound = async (patient: Patient) => {
    setIsAuthenticated(true);
    setIsStaffMode(true);
    setSelectedPatient(patient);
    setPatients([patient]);
    
    // Check if there's an active queue for this patient
    try {
      const { data: queueData, error: queueError } = await supabase
        .from('queues')
        .select('*')
        .eq('patient_id', patient.id)
        .in('status', ['WAITING', 'ACTIVE'])
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (queueError) throw queueError;
      
      if (queueData && queueData.length > 0) {
        // Convert string type to QueueType and string status to QueueStatus
        const typedQueue: Queue = {
          ...queueData[0],
          type: queueData[0].type as QueueType,
          status: queueData[0].status as QueueStatus
        };
        
        setActiveQueue(typedQueue);
      }
    } catch (error) {
      console.error('Error fetching patient queue:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('lineToken');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('stepOutData'); // Also clear step out data
    setIsAuthenticated(false);
    setSelectedPatient(null);
    setPatients([]);
    setActiveQueue(null);
    setPhoneNumber(null);
    setIsStaffMode(false);
  };

  const handleSwitchPatient = () => {
    setActiveQueue(null);
  };

  if (loading) {
    return <PatientPortalLoading />;
  }

  if (!isAuthenticated) {
    return (
      <PatientPortalAuth 
        onLoginSuccess={handleLineLoginSuccess} 
        onPatientSelect={handlePatientFound}
      />
    );
  }

  if (activeQueue && selectedPatient) {
    return (
      <ActiveQueueView
        patient={selectedPatient}
        queue={activeQueue}
        patients={patients}
        onLogout={handleLogout}
        onSwitchPatient={handleSwitchPatient}
      />
    );
  }

  return (
    <PatientSelectionView
      patients={patients}
      selectedPatient={selectedPatient}
      onSelectPatient={handlePatientSelect}
      onLogout={handleLogout}
    />
  );
};

export default PatientPortal;
