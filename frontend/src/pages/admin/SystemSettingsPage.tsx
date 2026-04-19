import { useMutation, useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { useLocale } from '../../context/LocaleContext'
import { toast } from 'sonner'
import { errorMessage } from '../../lib/errorMessage'
import { PhotoIcon } from '@heroicons/react/24/outline'

type SystemSettings = {
  system_name: string
  email: string
  phone: string
  address: string
  logo_url: string | null
}

export function SystemSettingsPage() {
  const { t } = useLocale()
  const [logo, setLogo] = useState<File | null>(null)
  const [preview, setLogoPreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    system_name: '',
    email: '',
    phone: '',
    address: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data } = await api.get<SystemSettings>('/system-settings')
      return data
    },
  })

  useEffect(() => {
    if (data) {
      setForm({
        system_name: data.system_name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
      })
      setLogoPreview(data.logo_url)
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData()
      fd.append('system_name', form.system_name)
      fd.append('email', form.email)
      fd.append('phone', form.phone)
      fd.append('address', form.address)
      if (logo) fd.append('logo', logo)

      await api.post('/system-settings', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      toast.success(t('common.success'))
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogo(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  if (isLoading) return <div className="p-8 text-center">{t('common.loading')}...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('nav.systemSettings')}</h1>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 space-y-8">
          {/* Logo Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Logo</label>
            <div className="flex items-center gap-6">
              <div className="h-32 w-32 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950">
                {preview ? (
                  <img src={preview} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <PhotoIcon className="h-10 w-10 text-slate-400" />
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="file"
                  id="logo-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-sm transition-colors"
                >
                  Change Logo
                </label>
                <p className="text-xs text-slate-500">JPG, PNG or GIF. Max 2MB.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">System Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                value={form.system_name}
                onChange={(e) => setForm((s) => ({ ...s, system_name: e.target.value }))}
                placeholder="e.g. Sarafi of Rasuli"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                placeholder="info@rasuli-sarafi.com"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                value={form.phone}
                onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                placeholder="+93 7xx xxx xxx"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                value={form.address}
                onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                placeholder="Full business address..."
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={() => void mutation.mutateAsync()}
            disabled={mutation.isPending}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-500 active:scale-95 disabled:opacity-50 transition-all"
          >
            {mutation.isPending ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
