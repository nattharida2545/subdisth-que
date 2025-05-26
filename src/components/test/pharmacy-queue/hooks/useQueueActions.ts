
import { useCallback } from 'react';
import { createLogger } from '@/utils/logger';
import { formatQueueNumber } from '@/utils/queueFormatters';
import { toast } from 'sonner';

const logger = createLogger('useQueueActions');

interface UseQueueActionsProps {
  selectedServicePoint: any;
  servicePointQueues: any[];
  servicePoints: any[];
  callQueue: (queueId: string, servicePointId: string) => Promise<any>;
  updateQueueStatus: (queueId: string, status: any) => Promise<any>;
  recallQueue: (queueId: string) => void;
  transferQueueToServicePoint: (queueId: string, targetServicePointId: string) => Promise<void>;
  returnSkippedQueueToWaiting: (queueId: string) => Promise<void>;
}

export const useQueueActions = ({
  selectedServicePoint,
  servicePointQueues,
  servicePoints,
  callQueue,
  updateQueueStatus,
  recallQueue,
  transferQueueToServicePoint,
  returnSkippedQueueToWaiting
}: UseQueueActionsProps) => {
  // Enhanced queue action handlers with proper formatting
  const handleCallQueue = useCallback(async (queueId: string): Promise<any> => {
    if (!selectedServicePoint) return null;
    
    const queue = servicePointQueues.find(q => q.id === queueId);
    const formattedNumber = queue ? formatQueueNumber(queue.type as any, queue.number) : queueId;
    
    logger.debug(`Calling queue ${formattedNumber} for service point ${selectedServicePoint.code}`);
    
    try {
      const result = await callQueue(queueId, selectedServicePoint.id);
      if (result) {
        toast.success(`เรียกคิว ${formattedNumber} เรียบร้อยแล้ว`);
      }
      return result;
    } catch (error) {
      toast.error(`ไม่สามารถเรียกคิว ${formattedNumber} ได้`);
      throw error;
    }
  }, [selectedServicePoint, callQueue, servicePointQueues]);

  const handleUpdateStatus = useCallback(async (queueId: string, status: any) => {
    const queue = servicePointQueues.find(q => q.id === queueId);
    const formattedNumber = queue ? formatQueueNumber(queue.type as any, queue.number) : queueId;
    
    logger.debug(`Updating queue ${formattedNumber} status to ${status}`);
    
    try {
      const result = await updateQueueStatus(queueId, status);
      if (result) {
        let message = '';
        switch (status) {
          case 'COMPLETED':
            message = `คิว ${formattedNumber} เสร็จสิ้นการให้บริการแล้ว`;
            break;
          case 'SKIPPED':
            message = `คิว ${formattedNumber} ถูกข้ามแล้ว`;
            break;
          case 'WAITING':
            message = `คิว ${formattedNumber} ถูกนำกลับมารอคิวแล้ว`;
            break;
          default:
            message = `อัปเดตสถานะคิว ${formattedNumber} เรียบร้อยแล้ว`;
        }
        toast.success(message);
      }
      return result;
    } catch (error) {
      toast.error(`ไม่สามารถอัปเดตสถานะคิว ${formattedNumber} ได้`);
      throw error;
    }
  }, [updateQueueStatus, servicePointQueues]);

  const handleRecallQueue = useCallback((queueId: string) => {
    const queue = servicePointQueues.find(q => q.id === queueId);
    const formattedNumber = queue ? formatQueueNumber(queue.type as any, queue.number) : queueId;
    
    logger.debug(`Recalling queue ${formattedNumber}`);
    if (selectedServicePoint) {
      recallQueue(queueId);
      toast.info(`เรียกซ้ำคิว ${formattedNumber}`);
    }
  }, [recallQueue, servicePointQueues, selectedServicePoint]);

  const handleHoldQueue = useCallback(async (queueId: string) => {
    const queue = servicePointQueues.find(q => q.id === queueId);
    const formattedNumber = queue ? formatQueueNumber(queue.type as any, queue.number) : queueId;
    
    try {
      if (selectedServicePoint) {
        // Use updateQueueStatus with SKIPPED and add PAUSED note
        await updateQueueStatus(queueId, 'SKIPPED');
        toast.success(`พักคิว ${formattedNumber} เรียบร้อยแล้ว`);
      }
    } catch (error) {
      toast.error(`ไม่สามารถพักคิว ${formattedNumber} ได้`);
    }
  }, [updateQueueStatus, servicePointQueues, selectedServicePoint]);

  const handleTransferQueue = useCallback(async (queueId: string, targetServicePointId: string) => {
    const queue = servicePointQueues.find(q => q.id === queueId);
    const formattedNumber = queue ? formatQueueNumber(queue.type as any, queue.number) : queueId;
    const targetServicePoint = servicePoints.find(sp => sp.id === targetServicePointId);
    
    try {
      await transferQueueToServicePoint(queueId, targetServicePointId);
      toast.success(`โอนคิว ${formattedNumber} ไปยัง ${targetServicePoint?.name || 'จุดบริการอื่น'} เรียบร้อยแล้ว`);
    } catch (error) {
      toast.error(`ไม่สามารถโอนคิว ${formattedNumber} ได้`);
    }
  }, [transferQueueToServicePoint, servicePointQueues, servicePoints]);

  const handleReturnToWaiting = useCallback(async (queueId: string) => {
    const queue = servicePointQueues.find(q => q.id === queueId);
    const formattedNumber = queue ? formatQueueNumber(queue.type as any, queue.number) : queueId;
    
    try {
      await returnSkippedQueueToWaiting(queueId);
      toast.success(`นำคิว ${formattedNumber} กลับมารอเรียบร้อยแล้ว`);
    } catch (error) {
      toast.error(`ไม่สามารถนำคิว ${formattedNumber} กลับมารอได้`);
    }
  }, [returnSkippedQueueToWaiting, servicePointQueues]);

  return {
    handleCallQueue,
    handleUpdateStatus,
    handleRecallQueue,
    handleHoldQueue,
    handleTransferQueue,
    handleReturnToWaiting
  };
};
