
import { supabase } from '@/integrations/supabase/client';
import { ServicePointQueueType } from '@/integrations/supabase/schema';
import { createLogger } from '@/utils/logger';

const logger = createLogger('ServicePointQueueTypesService');

export const fetchServicePointQueueTypes = async (servicePointId: string): Promise<ServicePointQueueType[]> => {
  logger.debug(`Fetching mappings for service point: ${servicePointId}`);

  const { data, error } = await supabase
    .from('service_point_queue_types')
    .select(`
      *,
      queue_type:queue_types(id, name, code),
      service_point:service_points(id, name, code)
    `)
    .eq('service_point_id', servicePointId);

  if (error) {
    logger.error('Supabase error during fetch:', error);
    throw error;
  }

  logger.debug(`Successfully fetched ${data?.length || 0} mappings:`, data);
  return data || [];
};

export const createServicePointQueueTypeMapping = async (
  servicePointId: string, 
  queueTypeId: string
): Promise<ServicePointQueueType> => {
  logger.debug(`Adding mapping: servicePointId=${servicePointId}, queueTypeId=${queueTypeId}`);

  const { data, error } = await supabase
    .from('service_point_queue_types')
    .insert({
      service_point_id: servicePointId,
      queue_type_id: queueTypeId
    })
    .select(`
      *,
      queue_type:queue_types(id, name, code),
      service_point:service_points(id, name, code)
    `);

  if (error) {
    logger.error('Supabase error during insert:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('No data returned after adding mapping');
  }

  logger.debug('Successfully added mapping:', data[0]);
  return data[0];
};

export const deleteServicePointQueueTypeMapping = async (id: string): Promise<boolean> => {
  logger.debug(`Attempting to delete mapping with id: ${id}`);

  // First check if the record exists
  const { data: existingRecord, error: checkError } = await supabase
    .from('service_point_queue_types')
    .select('id')
    .eq('id', id)
    .single();

  if (checkError || !existingRecord) {
    logger.warn(`Record with id ${id} does not exist in database`);
    return false; // Record doesn't exist, consider it "deleted"
  }

  const { error, count } = await supabase
    .from('service_point_queue_types')
    .delete({ count: 'exact' })
    .eq('id', id);

  if (error) {
    logger.error('Supabase error during delete:', error);
    throw error;
  }

  logger.debug(`Delete operation completed. Rows affected: ${count}`);
  return count > 0;
};

export const getQueueTypesForServicePoint = async (servicePointId: string) => {
  const { data, error } = await supabase
    .from('service_point_queue_types')
    .select(`
      queue_type_id,
      queue_type:queue_types(*)
    `)
    .eq('service_point_id', servicePointId);

  if (error) {
    throw error;
  }

  return data?.map(item => item.queue_type) || [];
};

export const getServicePointsForQueueType = async (queueTypeId: string) => {
  const { data, error } = await supabase
    .from('service_point_queue_types')
    .select(`
      service_point_id,
      service_point:service_points(*)
    `)
    .eq('queue_type_id', queueTypeId);

  if (error) {
    throw error;
  }

  return data?.map(item => item.service_point) || [];
};
