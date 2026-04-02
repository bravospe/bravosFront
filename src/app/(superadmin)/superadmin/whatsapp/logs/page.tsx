'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  GlobeAltIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'

interface WhatsAppLog {
  id: number
  recipient: string
  message: string
  type: 'IN' | 'OUT'
  status: string
  created_at: string
  instance_name: string
  provider: 'wa-sender' | 'Meta API'
}

export default function WhatsAppLogsPage() {
  const [logs, setLogs] = useState<WhatsAppLog[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [filterType, setType] = useState<string>('')

  const fetchLogs = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      const response = await api.get('/admin/whatsapp/logs', {
        params: { limit: 100, type: filterType }
      })
      if (response.data.success) {
        setLogs(response.data.data)
      }
    } catch (err: any) {
      console.error('Error fetching logs:', err)
      toast.error('No se pudieron cargar los logs de WhatsApp')
    } finally {
      setLoading(false)
    }
  }, [filterType])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    let interval: any
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchLogs(true)
      }, 5000)
    }
    return () => clearInterval(interval)
  }, [autoRefresh, fetchLogs])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-[#10b981]" />
            Logs de WhatsApp en Tiempo Real
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Visualiza mensajes de <strong>wa-sender</strong> y <strong>Meta API</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={filterType}
            onChange={(e) => setType(e.target.value)}
            className="bg-white dark:bg-[#1A1F2E] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Todos los tipos</option>
            <option value="OUT">Solo Salientes</option>
            <option value="IN">Solo Entrantes</option>
          </select>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh 
                ? 'bg-[#10b981]/10 text-[#10b981]' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <ArrowPathIcon className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>

          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className="p-2 bg-white dark:bg-[#1A1F2E] border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1A1F2E] border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#111827] border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Fecha / Hora</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Proveedor</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Canal / Instancia</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Destinatario</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Mensaje</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tipo / Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {logs.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron logs recientes.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={`${log.provider}-${log.id}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        {formatDate(log.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.provider === 'wa-sender' 
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' 
                          : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400'
                      }`}>
                        {log.provider === 'wa-sender' ? <CpuChipIcon className="w-3.5 h-3.5" /> : <GlobeAltIcon className="w-3.5 h-3.5" />}
                        {log.provider}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {log.instance_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                        <PhoneIcon className="w-4 h-4 text-[#10b981]" />
                        {log.recipient}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-300 max-w-md truncate" title={log.message}>
                        {log.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase ${
                          log.type === 'OUT' ? 'text-blue-500' : 'text-purple-500'
                        }`}>
                          {log.type === 'OUT' ? 'Saliente' : 'Entrante'}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                          log.status.toLowerCase() === 'sent' || log.status.toLowerCase() === 'received' || log.status.toLowerCase() === 'accepted'
                            ? 'text-green-600 dark:text-green-400'
                            : log.status.toLowerCase() === 'failed' || log.status.toLowerCase() === 'rejected'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
