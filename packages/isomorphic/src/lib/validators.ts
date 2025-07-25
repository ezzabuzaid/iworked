import { isPast, startOfDay } from 'date-fns';
import { type RefinementCtx, z } from 'zod';

export const validatePhoneNumber = async (value: string) => {
  const { default: parsePhoneNumber } = await import('libphonenumber-js');
  const phoneNumber = parsePhoneNumber(value);
  return phoneNumber && phoneNumber.isValid();
};
export const phoneValidator =
  (options: { validateEmpty: boolean }) =>
  async (value: any, ctx: RefinementCtx) => {
    try {
      const isEmpty = !value || value.length === 0;
      if (isEmpty && !options.validateEmpty) {
        return true;
      }

      const isValid = await validatePhoneNumber(value);
      if (!isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'رقم الجوال غير صحيح',
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error(error);
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'رقم الجوال غير صحيح',
      });
      return false;
    }
  };

export const futureDateSchema = z
  .string()
  .datetime()
  .refine((date) => !isPast(startOfDay(date)), {
    message: 'Date must not be in the past',
  });

export const scheduledDateSchema = z
  .string()
  .datetime()
  .refine(
    (date) => {
      const parsedDate = new Date(date);

      // Check if datetime is not in the past
      if (isPast(parsedDate)) {
        return false;
      }

      // Check if time is within working hours (9:00 AM - 4:30 PM)
      const hour = parsedDate.getHours();
      const minute = parsedDate.getMinutes();
      if (hour < 9 || hour >= 17 || (hour === 16 && minute > 30)) {
        return false;
      }

      // Check if appointment is on 30-minute intervals
      if (minute !== 0 && minute !== 30) {
        return false;
      }

      return true;
    },
    {
      message:
        'Scheduled datetime must be in the future, within working hours (9:00 AM - 4:30 PM), and on 30-minute intervals',
    },
  );

export const pgTime = z.string().time();
