// src/services/line-notification.service.ts
import axios from 'axios';
import { Queue } from '@/integrations/supabase/schema';
import { supabase } from '@/integrations/supabase/client';

class LineNotificationService {
  /**
   * Sends a notification to a patient that their queue will be called soon
   */
  async sendQueueNotification(patientId: string, queue: Queue, estimatedWaitTime: number): Promise<boolean> {
    try {
      // Get the patient with LINE information
      const { data, error } = await supabase
        .from('patients')
        .select('line_id')  // Only select columns that exist in the database
        .eq('id', patientId)
        .single();
      
      if (error) {
        console.error('Error fetching patient LINE information:', error);
        return false;
      }

      // Use line_id only since line_user_id doesn't exist yet
      const lineUserId = data?.line_id;
      
      // Check if we have any LINE ID to send to
      if (!lineUserId) {
        console.error('No LINE user ID found for patient');
        return false;
      }
      
      // Validate LINE user ID format (should start with 'U')
      if (!lineUserId.startsWith('U')) {
        console.warn('LINE user ID does not start with U:', lineUserId);
      }
      
      console.log(`Sending queue notification to LINE user ID: ${lineUserId}`);
      
      const response = await axios.post('/api/line-send-notification', {
        lineUserId,
        message: this.createQueueNotificationMessage(queue, estimatedWaitTime),
        queueId: queue.id
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('Error sending LINE notification:', error);
      return false;
    }
  }

  /**
   * Sends a notification that patient's queue is now being called
   */
  async sendQueueCalledNotification(patientId: string, queue: Queue, counterNumber: number): Promise<boolean> {
    try {
      // Get the patient with LINE information
      const { data, error } = await supabase
        .from('patients')
        .select('line_id')  // Only select columns that exist in the database
        .eq('id', patientId)
        .single();
      
      if (error) {
        console.error('Error fetching patient LINE information:', error);
        return false;
      }

      // Use line_id only since line_user_id doesn't exist yet
      const lineUserId = data?.line_id;
      
      // Check if we have any LINE ID to send to
      if (!lineUserId) {
        console.error('No LINE user ID found for patient');
        return false;
      }
      
      // Validate LINE user ID format (should start with 'U')
      if (!lineUserId.startsWith('U')) {
        console.warn('LINE user ID does not start with U:', lineUserId);
      }
      
      console.log(`Sending queue called notification to LINE user ID: ${lineUserId}`);
      
      const response = await axios.post('/api/line-send-notification', {
        lineUserId,
        message: `แจ้งเตือน: คิวหมายเลข ${queue.number} ถึงคิวของคุณแล้ว กรุณามาที่ช่องบริการ ${counterNumber}`,
        queueId: queue.id
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('Error sending LINE notification:', error);
      return false;
    }
  }

  /**
   * Creates a formatted message for queue notifications
   */
  private createQueueNotificationMessage(queue: Queue, estimatedWaitTime: number): string {
    const waitTimeText = estimatedWaitTime <= 5 
      ? 'ประมาณ 5 นาที' 
      : `ประมาณ ${estimatedWaitTime} นาที`;
    
    return `🔔 แจ้งเตือนคิวของคุณ 🔔\n\n` +
      `คิวหมายเลข ${queue.number} ของคุณกำลังจะถูกเรียกในอีก${waitTimeText}\n\n` +
      `กรุณาเตรียมตัวและอยู่ในบริเวณที่สามารถได้ยินการเรียกคิว\n\n` +
      `หากคุณไม่อยู่ในสถานที่ กรุณากดปุ่ม "ขอเวลา" ในแอปพลิเคชัน`;
  }
}

export const lineNotificationService = new LineNotificationService();