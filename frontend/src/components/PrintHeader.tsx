import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export function PrintHeader() {
  const { data: settings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data } = await api.get<{
        system_name: string
        email: string
        phone: string
        address: string
        logo_url: string | null
      }>('/system-settings')
      return data
    },
  })

  if (!settings) return null

  return (
    <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
            {settings.system_name || 'Sarafi Management System'}
          </h1>
          <div className="text-sm font-bold text-slate-600 space-y-0.5">
            {settings.phone && <p>Phone: {settings.phone}</p>}
            {settings.email && <p>Email: {settings.email}</p>}
            {settings.address && <p>Address: {settings.address}</p>}
          </div>
        </div>
        
        {settings.logo_url && (
          <div className="h-24 w-24">
            <img 
              src={settings.logo_url} 
              alt="System Logo" 
              className="h-full w-full object-contain"
            />
          </div>
        )}
      </div>
    </div>
  )
}
