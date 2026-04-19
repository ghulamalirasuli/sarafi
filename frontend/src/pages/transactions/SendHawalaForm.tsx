import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { toast } from 'sonner';

const schema = z.object({
  reciever_agency: z.string().min(1, 'نمایندگی الزامی است'),
  sender: z.string().min(1, 'فرستنده الزامی است'),
  reciever: z.string().min(1, 'گیرنده الزامی است'),
  sender_currency: z.string().min(1),
  sender_amount: z.coerce.number().positive('مبلغ مثبت وارد کنید'),
  hawala_type: z.enum(['Simple', 'Exchange']),
  rate: z.coerce.number().optional(),
  exchange_currency: z.string().optional(),
  formula: z.enum(['', 'Multiply', 'Division']).optional(),
  comission: z.enum(['Manual', 'Percentage']),
  com_amount: z.coerce.number().positive(),
  com_currency: z.string().min(1),
  percent_amount: z.coerce.number().optional(),
  description: z.string().optional(),
  comment: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const SendHawalaForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  
  const [hawalaNo, setHawalaNo] = useState(1);
  const [agencyId, setAgencyId] = useState('');
  
  const { data: hawala } = useQuery({
    queryKey: ['send-hawala', id],
    queryFn: () => id ? api.get(`/send-hawala/${id}`).then(res => res.data) : null,
    enabled: !!id,
  });

  const { data: currencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => api.get('/currencies').then(res => res.data.data),
  });

  const { data: agencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => api.get('/agencies').then(res => res.data.data),
  });

  useEffect(() => {
    if (hawala) {
      setAgencyId(hawala.reciever_agency || '');
    }
  }, [hawala]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => 
      isEdit 
        ? api.put(`/send-hawala/${id}`, data)
        : api.post('/send-hawala', data),
    onSuccess: () => {
      toast.success(isEdit ? 'حواله به روز شد' : 'حواله ایجاد شد');
      queryClient.invalidateQueries({ queryKey: ['send-hawalas'] });
      navigate('/transactions/send-hawala');
    },
  });

  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: hawala,
  });

  const watchedAgency = watch('reciever_agency');
  const watchedHawalaType = watch('hawala_type');
  const watchedComission = watch('comission');
  const watchedSenderAmount = watch('sender_amount') || 0;
  const watchedRate = watch('rate') || 1;
  const watchedFormula = watch('formula') || '';

  // Auto-fetch hawala_no
  useEffect(() => {
    if (watchedAgency && watchedAgency !== agencyId) {
      api.get(`/send-hawala/agency/${watchedAgency}/next-no`)
        .then(res => setHawalaNo(res.data.hawala_no));
      setAgencyId(watchedAgency);
    }
  }, [watchedAgency]);

  // Commission calc
  useEffect(() => {
    if (watchedComission === 'Percentage' && watchedPercentAmount) {
      const com = (watchedSenderAmount * (watchedPercentAmount / 100));
      setValue('com_amount', com);
    }
  }, [watchedSenderAmount, watchedComission, watchedPercentAmount]);

  // Exchange calc
  useEffect(() => {
    let exchangeAmount = watchedSenderAmount;
    if (watchedHawalaType === 'Exchange' && watchedFormula && watchedRate) {
      exchangeAmount = watchedFormula === 'Multiply' 
        ? watchedSenderAmount * watchedRate 
        : watchedSenderAmount / watchedRate;
    }
    setValue('exchange_amount', exchangeAmount);
  }, [watchedHawalaType, watchedSenderAmount, watchedRate, watchedFormula]);

  const onSubmit = (data: FormData) => mutation.mutate(data);

  const payOptions = useQuery({
    queryKey: ['pay-options'],
    queryFn: () => api.get('/send-hawala/pay-options').then(res => res.data),
  });

  return (
    <ProtectedRoute requireRole={['admin', 'user']}>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            {isEdit ? 'ویرایش حواله' : 'حواله جدید'}
          </h1>
          <button 
            onClick={() => navigate('/transactions/send-hawala')}
            className="btn btn-secondary"
          >
            بازگشت
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label>نمایندگی *</label>
              <select 
                {...register('reciever_agency')}
                className="select select-bordered w-full"
                onChange={(e) => setAgencyId(e.target.value)}
              >
                <option value="">انتخاب...</option>
                {agencies?.map((agency: any) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.agency_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>شماره حواله</label>
              <input 
                value={hawalaNo}
                readOnly
                className="input input-bordered w-full bg-gray-100"
              />
              <input type="hidden" {...register('hawala_no')} value={hawalaNo} />
            </div>

            <div>
              <label>فرستنده *</label>
              <input {...register('sender')} className="input input-bordered w-full" />
            </div>

            <div>
              <label>گیرنده *</label>
              <input {...register('reciever')} className="input input-bordered w-full" />
            </div>

            <div>
              <label>ارز فرستنده *</label>
              <select {...register('sender_currency')} className="select select-bordered w-full">
                {currencies?.map((cur: any) => (
                  <option key={cur.id} value={cur.id}>{cur.currency_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label>مبلغ فرستنده *</label>
              <input 
                type="number" 
                step="0.01"
                {...register('sender_amount', { valueAsNumber: true })}
                className="input input-bordered w-full"
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setValue('sender_amount', value);
                }}
              />
            </div>

            <div>
              <label className="flex items-center gap-1">
                <input 
                  type="radio" 
                  value="Simple" 
                  {...register('hawala_type')}
                  className="radio"
                />
                ساده
              </label>
              <label className="flex items-center gap-1">
                <input 
                  type="radio" 
                  value="Exchange" 
                  {...register('hawala_type')}
                  className="radio"
                />
                تبادله
              </label>
            </div>
          </div>

          {watchedHawalaType === 'Exchange' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 bg-blue-50 rounded-lg">
              <div>
                <label>فرمول</label>
                <select {...register('formula')} className="select select-bordered w-full">
                  <option value="">هیچ</option>
                  <option value="Multiply">ضرب</option>
                  <option value="Division">تقسیم</option>
                </select>
              </div>
              <div>
                <label>نرخ</label>
                <input type="number" step="0.01" {...register('rate', { valueAsNumber: true })} className="input input-bordered w-full" />
              </div>
              <div>
                <label>ارز تبادله</label>
                <select {...register('exchange_currency')} className="select select-bordered w-full">
                  {currencies?.map((cur: any) => (
                    <option key={cur.id} value={cur.id}>{cur.currency_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>مبلغ تبادله</label>
                <input 
                  readOnly 
                  value={watch('exchange_amount')?.toFixed(2) || ''}
                  className="input input-bordered w-full bg-gray-100"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="flex items-center gap-1">
                <input type="radio" value="Manual" {...register('comission')} className="radio" />
                دستی
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" value="Percentage" {...register('comission')} className="radio" />
                فیصدی
              </label>
            </div>
            
            {watchedComission === 'Percentage' && (
              <div>
                <label>فیصدی</label>
                <input 
                  type="number" 
                  step="0.01" 
                  {...register('percent_amount', { valueAsNumber: true })}
                  className="input input-bordered w-full"
                />
              </div>
            )}
            
            <div>
              <label>مبلغ کمیشن *</label>
              <input 
                type="number" 
                step="0.01"
                {...register('com_amount', { valueAsNumber: true })}
                className="input input-bordered w-full"
              />
            </div>

            <div>
              <label>ارز کمیشن *</label>
              <select {...register('com_currency')} className="select select-bordered w-full">
                {currencies?.map((cur: any) => (
                  <option key={cur.id} value={cur.id}>{cur.currency_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label>توضیحات</label>
              <textarea {...register('description')} rows={3} className="textarea textarea-bordered w-full" />
            </div>
            <div>
              <label>ملاحظات</label>
              <textarea {...register('comment')} rows={3} className="textarea textarea-bordered w-full" />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="submit" 
              disabled={mutation.isPending}
              className="btn btn-primary"
            >
              {mutation.isPending ? 'در حال ارسال...' : (isEdit ? 'بروزرسانی' : 'ایجاد')}
            </button>
            <button 
              type="button"
              onClick={() => navigate('/transactions/send-hawala')}
              className="btn btn-secondary"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
};

export default SendHawalaForm;

