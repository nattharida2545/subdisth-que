
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QueueAlgorithmType } from '@/utils/queueAlgorithms';
import { algorithmOptions } from './schemas';

interface QueueConfigSectionProps {
  form: UseFormReturn<any>;
}

const QueueConfigSection: React.FC<QueueConfigSectionProps> = ({ form }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="queue_start_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>เริ่มนับคิวจากหมายเลข</FormLabel>
              <FormControl>
                <Input type="number" min="1" {...field} />
              </FormControl>
              <FormDescription>
                กำหนดหมายเลขเริ่มต้นของคิวในแต่ละวัน
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="queue_reset_daily"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">รีเซ็ตคิวรายวัน</FormLabel>
                <FormDescription>
                  ระบบจะรีเซ็ตหมายเลขคิวใหม่ทุกวัน
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div>
        <FormField
          control={form.control}
          name="queue_algorithm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>อัลกอริทึมการเรียกคิวหลัก</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="เลือกอัลกอริทึมการเรียกคิว" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {algorithmOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div>{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                อัลกอริทึมการเรียกคิวหลักที่ใช้ในการเรียกคิวรวม กรณีที่มีคิวหลายประเภท
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default QueueConfigSection;
