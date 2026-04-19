import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PrintHeader } from '@/components/PrintHeader';

const schema = z.object({
  pay_type: z.enum(['cash', 'customer', 'branch', 'bank']),
  source_id: z.string().optional(),
  source_name: z.string().optional(),
  new_hawala_no: z.string().optional(),
  docs: z.array(z.any()).optional(),
});

type PayForm = z.infer<typeof schema>;

const SendHawalaConfirm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: hawala } = useQuery({
    queryKey: ['send-hawala', id],
    queryFn: () => api.get(`/send-hawala/${id}`).then(res => res.data),
    enabled: !!id,
  });

  const { data: payOptions } = useQuery({
    queryKey: ['pay-options'],
    queryFn: () => api.get('/send-hawala/pay-options').then(res => res.data),
  });

  const mutation = useMutation({
    mutationFn: (data: PayForm) => api.post(`/send-hawala/${id}/confirm`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['send-hawalas'] });
      // Open print preview
      const printWindow = window.open('', '_blank');
      api.get(`/send-hawala/${data.id}/print`).then(res => {
        printWindow?.document.write(res.data.html);
        printWindow?.document.close();
      });
      navigate('/transactions/send-hawala');
    },
  });

  const { register, handleSubmit, watch } = useForm<PayForm>({
    resolver: zodResolver(schema),
  });

  const payType = watch('pay_type');

  const getSourceOptions = (type: string) => {
    switch (type) {
      case 'customer': return payOptions?.customers;
      case 'branch': return payOptions?.branches;
      case 'bank': return payOptions?.banks;
      default: return [];
    }
  };

  const onSubmit = (data: PayForm) => mutation.mutate(data);

  if (!hawala || hawala.status !== 'pending') {
    return <div>حواله آماده پرداخت نیست</div>;
  }

  return (
    <ProtectedRoute requireRole={['admin', 'user']}>
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <PrintHeader title="تایید پرداخت حواله" />

        <div className="card p-8">
          <h2 className="text-2xl font-bold mb-8 text-center">
            تایید پرداخت - حواله #{hawala.hawala_no}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8 p-6 bg-blue-50 rounded-xl">
            <div className="text-center">
              <div className="text-sm text-gray-600">نمایندگی</div>
              <div className="font-bold">{hawala.Agency}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">فرستنده</div>
              <div className="font-bold">{hawala.sender}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">گیرنده</div>
              <div className="font-bold">{hawala.reciever}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">مبلغ</div>
              <div className="font-bold text-2xl text-green-600">
                {hawala.sender_amount} {hawala.RCurrency}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">
                  <span>نوع پرداخت *</span>
                </label>
                <select {...register('pay_type')} className="select select-bordered w-full">
                  <option value="cash">نقد</option>
                  <option value="customer">مشتری</option>
                  <option value="branch">شعبه</option>
                  <option value="bank">بانک</option>
                </select>
              </div>

              {payType !== 'cash' && (
                <div>
                  <label>منبع پرداخت</label>
                  <select 
                    {...register('source_id')}
                    className="select select-bordered w-full"
                  >
                    {getSourceOptions(payType)?.map((option: any) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {payType === 'customer' && (
                <div>
                  <label>شماره چک/حواله</label>
                  <input {...register('new_hawala_no')} className="input input-bordered w-full" />
                </div>
              )}
            </div>

            <div>
              <label>سند (اختیاری)</label>
              <input type="file" multiple className="file-input file-input-bordered w-full" />
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="submit" 
                disabled={mutation.isPending}
                className="btn btn-success btn-lg flex-1"
              >
                {mutation.isPending ? 'در حال تایید...' : 'تایید و پرداخت'}
              </button>
              <button 
                type="button"
                onClick={() => navigate('/transactions/send-hawala')}
                className="btn btn-secondary flex-1"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SendHawalaConfirm;

