'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  InboxArrowDownIcon,
  UsersIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'
import api from '@/lib/api'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface Overview {
  total_conversations: number
  total_messages_sent: number
  total_messages_received: number
  total_contacts: number
}
interface VolumeItem { date: string; sent: number; received: number }

function KPI({ label, value, icon: Icon, color }: {
  label: string; value: number
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string
}) {
  return (
    <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-100 dark:border-[#232834] p-5 flex flex-col gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{(value ?? 0).toLocaleString()}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default function WhatsAppAnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [volume, setVolume] = useState<VolumeItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ovRes, volRes] = await Promise.all([
        api.get('/admin/whatsapp/analytics/overview'),
        api.get('/admin/whatsapp/analytics/volume'),
      ])
      setOverview(ovRes.data)
      setVolume(Array.isArray(volRes.data) ? volRes.data : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const chartOptions: ApexCharts.ApexOptions = {
    chart: { type: 'area', toolbar: { show: false }, background: 'transparent', animations: { enabled: true, speed: 700 } },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02, stops: [0, 90, 100] } },
    colors: ['#10B981', '#6366F1'],
    xaxis: {
      categories: volume.map(d => d.date),
      axisBorder: { show: false }, axisTicks: { show: false },
      labels: { style: { colors: '#6B7280', fontSize: '11px' }, rotate: -30 },
    },
    yaxis: { labels: { style: { colors: '#6B7280', fontSize: '11px' } } },
    grid: { borderColor: '#1F2937', strokeDashArray: 4, xaxis: { lines: { show: false } } },
    tooltip: { shared: true, intersect: false, theme: 'dark' },
    legend: { position: 'top', horizontalAlign: 'right', labels: { colors: '#9CA3AF' }, markers: { size: 8 } },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Métricas WhatsApp</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Actividad de los últimos 30 días</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-[#1A1F2E] text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-[#232834] transition-colors"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 dark:bg-[#1A1F2E] rounded-2xl" />)}
        </div>
      ) : overview ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Conversaciones" value={overview.total_conversations} icon={ChatBubbleLeftRightIcon} color="#10B981" />
          <KPI label="Mensajes Enviados" value={overview.total_messages_sent} icon={PaperAirplaneIcon} color="#6366F1" />
          <KPI label="Mensajes Recibidos" value={overview.total_messages_received} icon={InboxArrowDownIcon} color="#F59E0B" />
          <KPI label="Contactos" value={overview.total_contacts} icon={UsersIcon} color="#EC4899" />
        </div>
      ) : null}

      <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-100 dark:border-[#232834] p-6">
        <div className="mb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Volumen de mensajes</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Enviados vs Recibidos — últimos 30 días</p>
        </div>
        {loading ? (
          <div className="h-72 bg-gray-100 dark:bg-[#1A1F2E] rounded-xl animate-pulse" />
        ) : volume.length > 0 ? (
          <Chart type="area" series={[
            { name: 'Enviados', data: volume.map(d => d.sent) },
            { name: 'Recibidos', data: volume.map(d => d.received) },
          ]} options={chartOptions} height={288} />
        ) : (
          <div className="h-72 flex items-center justify-center text-sm text-gray-400">Sin datos de volumen aún</div>
        )}
      </div>

      {!loading && volume.length > 0 && (
        <div className="bg-white dark:bg-[#0D1117] rounded-2xl border border-gray-100 dark:border-[#232834] p-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Detalle diario (últimos 10 días)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#232834]">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-emerald-500 uppercase">Enviados</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-indigo-500 uppercase">Recibidos</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {volume.slice(-10).reverse().map((row) => (
                  <tr key={row.date} className="border-b border-gray-50 dark:border-[#1A1F2E] last:border-0 hover:bg-gray-50 dark:hover:bg-[#1A1F2E] transition-colors">
                    <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 font-mono">{row.date}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">{row.sent}</td>
                    <td className="py-2.5 px-3 text-right text-indigo-600 dark:text-indigo-400 font-semibold">{row.received}</td>
                    <td className="py-2.5 px-3 text-right text-gray-900 dark:text-white font-bold">{row.sent + row.received}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
