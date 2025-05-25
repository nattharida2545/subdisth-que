
import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { Queue, QueueStatus } from '@/integrations/supabase/schema';
import { useQueues } from '@/hooks/useQueues';
import { usePatients } from '@/hooks/usePatients';
import { useServicePointContext } from '@/contexts/ServicePointContext';
import { useServicePointQueueTypes } from '@/hooks/useServicePointQueueTypes';
import { useQueueTypes } from '@/hooks/useQueueTypes';
import { useQueueRealtime } from '@/hooks/useQueueRealtime';
import { ServicePointCapability } from '@/utils/queueAlgorithms';
import { createLogger } from '@/utils/logger';

const logger = createLogger('useQueueManagement');

export const useQueueManagement = () => {
  const { 
    queues, 
    updateQueueStatus, 
    callQueue, 
    recallQueue, 
    sortQueues,
    transferQueueToServicePoint,
    putQueueOnHold,
    returnSkippedQueueToWaiting,
    fetchQueues
  } = useQueues();
  
  const { patients } = usePatients();
  const { queueTypes } = useQueueTypes();
  const { 
    selectedServicePoint,
    setSelectedServicePoint,
    servicePoints
  } = useServicePointContext();
  
  // Get mappings for all service points
  const { mappings } = useServicePointQueueTypes();
  
  // Show ALL queues regardless of service point selection
  const [waitingQueues, setWaitingQueues] = useState<Queue[]>([]);
  const [activeQueues, setActiveQueues] = useState<Queue[]>([]);
  const [completedQueues, setCompletedQueues] = useState<Queue[]>([]);
  const [skippedQueues, setSkippedQueues] = useState<Queue[]>([]);
  
  // Add real-time updates specifically for queue management
  useQueueRealtime({
    onQueueChange: useCallback(() => {
      logger.debug('Queue management detected real-time change, refreshing');
      fetchQueues(true); // Force refresh
    }, [fetchQueues]),
    channelName: 'queue-management',
    enabled: true,
    debounceMs: 150
  });
  
  // Memoize service point capabilities to prevent unnecessary recalculations
  const servicePointCapabilities = useMemo<ServicePointCapability[]>(() => {
    logger.debug('Processing mappings for service point capabilities:', mappings);
    
    if (mappings.length === 0) {
      logger.debug('No mappings found, returning empty capabilities');
      return [];
    }

    // Group mappings by service point ID
    const capabilities: Record<string, string[]> = {};
    
    mappings.forEach(mapping => {
      if (!capabilities[mapping.service_point_id]) {
        capabilities[mapping.service_point_id] = [];
      }
      capabilities[mapping.service_point_id].push(mapping.queue_type_id);
    });
    
    // Convert to array format
    const capabilitiesArray = Object.entries(capabilities).map(([servicePointId, queueTypeIds]) => ({
      servicePointId,
      queueTypeIds
    }));
    
    logger.debug('Service point capabilities processed:', capabilitiesArray);
    return capabilitiesArray;
  }, [mappings]);

  // Memoize the intelligent service point suggestion function
  const getIntelligentServicePointSuggestion = useCallback((queue: Queue) => {
    // If queue already has a service point, return it
    if (queue.service_point_id) {
      return servicePoints.find(sp => sp.id === queue.service_point_id);
    }

    // Find queue type for this queue
    const queueType = queueTypes.find(qt => qt.code === queue.type);
    if (!queueType) {
      logger.warn(`Queue type not found for queue ${queue.id}: ${queue.type}`);
      // Fallback: suggest first available service point
      return servicePoints.find(sp => sp.enabled) || null;
    }

    // Find service points that can handle this queue type
    const compatibleServicePoints = servicePointCapabilities
      .filter(cap => cap.queueTypeIds.includes(queueType.id))
      .map(cap => servicePoints.find(sp => sp.id === cap.servicePointId))
      .filter(Boolean);

    if (compatibleServicePoints.length === 0) {
      logger.warn(`No compatible service points found for queue type ${queueType.code}, suggesting fallback`);
      // Fallback: suggest first available service point
      return servicePoints.find(sp => sp.enabled) || null;
    }

    // Return the first compatible service point
    return compatibleServicePoints[0] || null;
  }, [servicePoints, queueTypes, servicePointCapabilities]);

  // Update filtered queues to show ALL queues (no service point filtering)
  useEffect(() => {
    logger.debug('useEffect for queue filtering triggered');
    
    if (!queues) {
      logger.debug('No queues available, skipping update');
      return;
    }

    const waiting = queues.filter(q => q.status === 'WAITING');
    const active = queues.filter(q => q.status === 'ACTIVE');
    const completed = queues.filter(q => q.status === 'COMPLETED');
    const skipped = queues.filter(q => q.status === 'SKIPPED');
    
    // Count assigned vs unassigned queues
    const assignedWaiting = waiting.filter(q => q.service_point_id);
    const unassignedWaiting = waiting.filter(q => !q.service_point_id);
    
    logger.debug('Showing all queues (no service point filtering):', {
      totalWaiting: waiting.length,
      assignedWaiting: assignedWaiting.length,
      unassignedWaiting: unassignedWaiting.length,
      totalActive: active.length,
      totalCompleted: completed.length,
      totalSkipped: skipped.length
    });
    
    if (unassignedWaiting.length > 0) {
      logger.info(`Found ${unassignedWaiting.length} unassigned waiting queues`);
    }
    
    // Apply sorting algorithm to waiting queues (but show all)
    if (sortQueues) {
      const sortedQueues = sortQueues(waiting, servicePointCapabilities);
      logger.debug('Sorted all waiting queues:', {
        originalCount: waiting.length,
        sortedCount: sortedQueues.length
      });
      setWaitingQueues(sortedQueues);
    } else {
      setWaitingQueues(waiting);
    }
    
    setActiveQueues(active);
    setCompletedQueues(completed);
    setSkippedQueues(skipped);
  }, [queues, sortQueues, servicePointCapabilities]);
  
  // Handler for recalling queue
  const handleRecallQueue = useCallback((queueId: string) => {
    recallQueue(queueId);
    
    // Find the queue for the toast notification
    const queue = queues?.find(q => q.id === queueId);
    if (queue) {
      // Find the patient for this queue
      const patient = patients.find(p => p.id === queue.patient_id);
      if (patient) {
        toast.info(`เรียกซ้ำคิวหมายเลข ${queue.number} - ${patient.name}`);
      } else {
        toast.info(`เรียกซ้ำคิวหมายเลข ${queue.number}`);
      }
    }
  }, [recallQueue, queues, patients]);
  
  // Enhanced handler for calling queue with intelligent service point suggestion
  const handleCallQueue = useCallback(async (queueId: string, manualServicePointId?: string): Promise<Queue | null> => {
    const queue = queues?.find(q => q.id === queueId);
    if (!queue) {
      toast.error('ไม่พบคิวที่ต้องการเรียก');
      return null;
    }

    // Use manual service point if provided, otherwise get intelligent suggestion
    let targetServicePointId = manualServicePointId;
    
    if (!targetServicePointId && !queue.service_point_id) {
      const suggestedServicePoint = getIntelligentServicePointSuggestion(queue);
      if (suggestedServicePoint) {
        targetServicePointId = suggestedServicePoint.id;
        logger.info(`Auto-assigning queue ${queue.id} to suggested service point ${suggestedServicePoint.code}`);
      }
    }
    
    // Call queue with the determined service point
    const result = await callQueue(queueId, targetServicePointId);
    
    if (result) {
      const servicePoint = servicePoints.find(sp => sp.id === targetServicePointId);
      toast.success(`เรียกคิวหมายเลข ${queue.number} ไปยัง${servicePoint?.name || 'จุดบริการ'}`);
    }
    
    return result;
  }, [queues, servicePoints, getIntelligentServicePointSuggestion, callQueue]);
  
  // Handler for transferring queue with recalculation
  const handleTransferQueue = useCallback(async (
    queueId: string, 
    sourceServicePointId: string,
    targetServicePointId: string,
    notes?: string,
    newQueueType?: string
  ): Promise<boolean> => {
    const result = await transferQueueToServicePoint(
      queueId, 
      sourceServicePointId,
      targetServicePointId,
      notes,
      newQueueType
    );
    
    if (result) {
      // Trigger recalculation of queue assignments for affected service points
      logger.info('Queue transfer completed, triggering algorithm recalculation');
      toast.success('โอนคิวเรียบร้อยแล้ว และปรับปรุงลำดับคิวอัตโนมัติ');
      return true;
    }
    
    return false;
  }, [transferQueueToServicePoint]);
  
  // Handler for holding queue
  const handleHoldQueue = useCallback(async (queueId: string, servicePointId: string, reason?: string): Promise<boolean> => {
    const result = await putQueueOnHold(queueId, servicePointId, reason);
    return !!result;
  }, [putQueueOnHold]);
  
  // Handler for returning skipped queue to waiting
  const handleReturnToWaiting = useCallback(async (queueId: string): Promise<boolean> => {
    const result = await returnSkippedQueueToWaiting(queueId);
    return !!result;
  }, [returnSkippedQueueToWaiting]);
  
  // Handler for service point change (for manual assignment)
  const handleServicePointChange = useCallback((value: string) => {
    const servicePoint = servicePoints.find(sp => sp.id === value);
    if (servicePoint) {
      logger.debug('Service point changed to:', servicePoint);
      setSelectedServicePoint(servicePoint);
    }
  }, [servicePoints, setSelectedServicePoint]);

  return {
    // State - now showing ALL queues
    waitingQueues,
    activeQueues,
    completedQueues,
    skippedQueues,
    patients,
    queueTypes,
    selectedServicePoint,
    servicePoints,
    servicePointCapabilities,
    
    // Handlers
    handleRecallQueue,
    handleCallQueue,
    handleTransferQueue,
    handleHoldQueue,
    handleReturnToWaiting,
    handleServicePointChange,
    updateQueueStatus,
    
    // New utility functions
    getIntelligentServicePointSuggestion
  };
};
