
import React, { useEffect, useState, useRef } from 'react';
import QueueBoardContainer from '@/components/queue/board/QueueBoardContainer';
import { supabase } from '@/integrations/supabase/client';
import { announceQueue } from '@/utils/textToSpeech';
import { Queue } from '@/integrations/supabase/schema';

const QueueBoard = () => {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const connectionTestTimerRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTestCountRef = useRef(0);
  const maxConnectionAttempts = 3;

  useEffect(() => {
    // Set up real-time subscription to queue changes
    const channel = supabase
      .channel('queue-board-changes')
      .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'queues' },
          (payload) => {
            console.log('Queue update received:', payload);
            
            // Check if a queue was just set to ACTIVE (meaning it was called)
            if (payload.new && payload.new.status === 'ACTIVE') {
              const queue = payload.new as Queue;
              
              // Get the counter number from the payload if available
              // Default to "1" if not available
              const counterName = queue.number?.toString() || "1";
              
              // Get announcement text from localStorage or use default
              const announcementText =
                localStorage.getItem("queue_announcement_text") ||
                "ขอเชิญหมายเลข {queueNumber} ที่ช่องบริการ {counter}";
              
              console.log('Announcing queue:', queue.number, 'at counter:', counterName);
              
              // Announce the queue
              announceQueue(
                queue.number,
                counterName,
                queue.type,
                announcementText
              ).catch(error => {
                console.error("Error announcing queue:", error);
              });
            }
          }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to queue changes');
          setConnectionError(null);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to queue changes');
          setConnectionError('Failed to connect to Supabase realtime. Please check your internet connection.');
        }
      });
      
    // Test the Supabase connection once, with limited retries
    const testConnection = async () => {
      try {
        // Increment the connection attempt counter
        connectionTestCountRef.current += 1;
        
        // Only attempt up to max connection attempts
        if (connectionTestCountRef.current > maxConnectionAttempts) {
          console.log(`Reached maximum connection test attempts (${maxConnectionAttempts})`);
          return;
        }
        
        console.log(`Testing Supabase connection (attempt ${connectionTestCountRef.current}/${maxConnectionAttempts})...`);
        
        const { error } = await supabase.from('queues').select('count').limit(1);
        if (error) {
          console.error('Supabase connection test failed:', error);
          setConnectionError(`Failed to connect to Supabase: ${error.message}`);
          
          // Schedule a retry after 5 seconds if we haven't reached max attempts
          if (connectionTestCountRef.current < maxConnectionAttempts) {
            connectionTestTimerRef.current = setTimeout(testConnection, 5000);
          }
        } else {
          console.log('Supabase connection test successful');
          setConnectionError(null);
          connectionTestCountRef.current = 0; // Reset counter on success
        }
      } catch (err) {
        console.error('Supabase connection test exception:', err);
        setConnectionError(`Connection error: ${err instanceof Error ? err.message : String(err)}`);
        
        // Schedule a retry after 5 seconds if we haven't reached max attempts
        if (connectionTestCountRef.current < maxConnectionAttempts) {
          connectionTestTimerRef.current = setTimeout(testConnection, 5000);
        }
      }
    };
    
    // Run the connection test once
    testConnection();
      
    return () => {
      console.log('Cleaning up Supabase channel');
      supabase.removeChannel(channel);
      
      // Clear any pending connection test timer
      if (connectionTestTimerRef.current) {
        clearTimeout(connectionTestTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {connectionError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded fixed top-0 left-0 right-0 z-50">
          <p><strong>Connection Error:</strong> {connectionError}</p>
          <p>Please check your internet connection and refresh the page.</p>
        </div>
      )}
      <QueueBoardContainer />
    </>
  );
};

export default QueueBoard;
