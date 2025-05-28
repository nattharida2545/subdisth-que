
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Save } from 'lucide-react';
import { Medication } from '@/integrations/supabase/schema';
import { PatientMedication } from '@/hooks/usePatientMedications';
import { toast } from 'sonner';
import {
  MedicationSearchField,
  DosageField,
  InstructionsField,
  DispensedMedicationsList
} from './medication-dispense';
import PendingMedicationsList, { PendingMedication } from './medication-dispense/PendingMedicationsList';

interface MedicationDispenseFormProps {
  patientId: string;
  medications: Medication[];
  onDispenseMedication: (data: Omit<PatientMedication, 'id' | 'created_at' | 'updated_at'>) => Promise<PatientMedication | null>;
  dispensedMedications: PatientMedication[];
}

const MedicationDispenseForm: React.FC<MedicationDispenseFormProps> = ({
  patientId,
  medications = [],
  onDispenseMedication,
  dispensedMedications = []
}) => {
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [pendingMedications, setPendingMedications] = useState<PendingMedication[]>([]);
  const [isDispensing, setIsDispensing] = useState(false);
  const [open, setOpen] = useState(false);

  const safeMedications = Array.isArray(medications) ? medications : [];

  const handleAddToPending = () => {
    if (!selectedMedication || !dosage.trim()) {
      toast.error('กรุณาเลือกยาและใส่ขนาดยา');
      return;
    }

    // Check if medication is already in pending list
    const existingIndex = pendingMedications.findIndex(
      med => med.medication.id === selectedMedication.id
    );

    if (existingIndex >= 0) {
      toast.error('ยานี้อยู่ในรายการแล้ว');
      return;
    }

    const newPendingMedication: PendingMedication = {
      medication: selectedMedication,
      dosage: dosage.trim(),
      instructions: instructions.trim() || undefined
    };

    setPendingMedications(prev => [...prev, newPendingMedication]);
    setSelectedMedication(null);
    setDosage('');
    setInstructions('');
    toast.success('เพิ่มยาในรายการแล้ว');
  };

  const handleRemoveFromPending = (index: number) => {
    setPendingMedications(prev => prev.filter((_, i) => i !== index));
    toast.success('ลบยาออกจากรายการแล้ว');
  };

  const handleDispenseAll = async () => {
    if (pendingMedications.length === 0) {
      toast.error('ไม่มียาที่จะจ่าย');
      return;
    }

    setIsDispensing(true);
    let successCount = 0;
    
    try {
      for (const pendingMed of pendingMedications) {
        const medicationData = {
          patient_id: patientId,
          medication_id: pendingMed.medication.id,
          dosage: pendingMed.dosage,
          instructions: pendingMed.instructions,
          start_date: new Date().toISOString().split('T')[0],
          end_date: undefined,
          notes: undefined
        };

        const result = await onDispenseMedication(medicationData);
        if (result) {
          successCount++;
        }
      }

      if (successCount === pendingMedications.length) {
        setPendingMedications([]);
        toast.success(`จ่ายยาเรียบร้อย ${successCount} รายการ`);
      } else if (successCount > 0) {
        toast.warning(`จ่ายยาได้ ${successCount} จาก ${pendingMedications.length} รายการ`);
        // Remove successfully dispensed medications from pending list
        // This would require more complex state management
      } else {
        toast.error('ไม่สามารถจ่ายยาได้');
      }
    } catch (error) {
      console.error('Error dispensing medications:', error);
      toast.error('เกิดข้อผิดพลาดในการจ่ายยา');
    } finally {
      setIsDispensing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>จ่ายยา</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <MedicationSearchField
            medications={safeMedications}
            selectedMedication={selectedMedication}
            onSelectMedication={setSelectedMedication}
            open={open}
            setOpen={setOpen}
          />

          <DosageField
            value={dosage}
            onChange={setDosage}
            unit={selectedMedication?.unit}
          />

          <InstructionsField
            value={instructions}
            onChange={setInstructions}
          />

          <Button 
            onClick={handleAddToPending}
            disabled={!selectedMedication || !dosage.trim()}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มยาในรายการ
          </Button>
        </div>

        <PendingMedicationsList
          medications={pendingMedications}
          onRemoveMedication={handleRemoveFromPending}
        />

        {pendingMedications.length > 0 && (
          <Button 
            onClick={handleDispenseAll}
            disabled={isDispensing}
            className="w-full bg-pharmacy-600 hover:bg-pharmacy-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isDispensing ? 'กำลังจ่ายยา...' : `จ่ายยาทั้งหมด (${pendingMedications.length} รายการ)`}
          </Button>
        )}

        <DispensedMedicationsList 
          medications={dispensedMedications}
          allMedications={safeMedications}
        />
      </CardContent>
    </Card>
  );
};

export default MedicationDispenseForm;
