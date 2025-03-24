
import React from 'react';
import { Button } from '@/components/ui/button';
import { Queue, QueueStatus } from '@/integrations/supabase/schema';
import { 
  PhoneOutgoing, 
  RefreshCw, 
  Check, 
  SkipForward, 
  AlertTriangle, 
  Pause,
  Volume2
} from 'lucide-react';
import { announceQueue } from '@/utils/textToSpeech';
import { useToast } from '@/hooks/use-toast';

interface QueueControlsProps {
  queue: Queue;
  onUpdateStatus: (queueId: string, status: QueueStatus) => void;
  onCallQueue: (queueId: string) => void;
  onRecallQueue: (queueId: string) => void;
  className?: string;
  patientName?: string;
  counterName?: string;
}

const QueueControls: React.FC<QueueControlsProps> = ({ 
  queue, 
  onUpdateStatus, 
  onCallQueue, 
  onRecallQueue,
  className,
  patientName,
  counterName = '1'
}) => {
  const { toast } = useToast();

  // Function to handle queue announcement
  const handleAnnounceQueue = async () => {
    try {
      await announceQueue(queue.number, counterName, queue.type);
      toast({
        title: "ประกาศเสียงเรียกคิว",
        description: `ประกาศเสียงเรียกคิวหมายเลข ${queue.number} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error('Error announcing queue:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถประกาศเสียงเรียกคิวได้",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {queue.status === 'WAITING' && (
        <Button 
          onClick={() => onCallQueue(queue.id)} 
          className="bg-pharmacy-600 hover:bg-pharmacy-700 text-white"
          size="sm"
        >
          <PhoneOutgoing className="h-4 w-4 mr-1" />
          เรียกคิว
        </Button>
      )}
      
      {queue.status === 'ACTIVE' && (
        <>
          <Button 
            onClick={() => onRecallQueue(queue.id)} 
            variant="outline" 
            size="sm"
            className="border-pharmacy-200 text-pharmacy-700 hover:bg-pharmacy-50"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            เรียกซ้ำ
          </Button>
          
          <Button 
            onClick={handleAnnounceQueue} 
            variant="outline" 
            size="sm"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Volume2 className="h-4 w-4 mr-1" />
            ประกาศเสียง
          </Button>
          
          <Button 
            onClick={() => onUpdateStatus(queue.id, 'COMPLETED')} 
            variant="outline" 
            size="sm"
            className="border-green-200 text-green-700 hover:bg-green-50"
          >
            <Check className="h-4 w-4 mr-1" />
            เสร็จสิ้น
          </Button>
          
          <Button 
            onClick={() => onUpdateStatus(queue.id, 'SKIPPED')} 
            variant="outline" 
            size="sm"
            className="border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            <SkipForward className="h-4 w-4 mr-1" />
            ข้ามคิว
          </Button>
          
          <Button 
            onClick={() => onUpdateStatus(queue.id, 'WAITING')} 
            variant="outline" 
            size="sm"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Pause className="h-4 w-4 mr-1" />
            พัก
          </Button>
        </>
      )}
      
      {queue.status === 'SKIPPED' && (
        <Button 
          onClick={() => onCallQueue(queue.id)} 
          variant="outline" 
          size="sm"
          className="border-pharmacy-200 text-pharmacy-700 hover:bg-pharmacy-50"
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          เรียกอีกครั้ง
        </Button>
      )}
      
      {queue.status === 'COMPLETED' && (
        <span className="text-sm text-gray-500 italic">เสร็จสิ้นการให้บริการ</span>
      )}
    </div>
  );
};

export default QueueControls;
