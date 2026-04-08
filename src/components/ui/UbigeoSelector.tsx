'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '@/utils/apiConfig';

// Ubigeo routes live at /api/ubigeo (no /v1 prefix)
const ubigeoBase = getApiUrl().replace('/v1', '');

interface UbigeoOption {
  id: string;
  name: string;
}

interface Props {
  label?: string;
  value: string; // 6-char ubigeo code (district id)
  onChange: (ubigeo: string, label: string) => void;
  required?: boolean;
  className?: string;
}

export default function UbigeoSelector({ label, value, onChange, required, className = '' }: Props) {
  const [departments, setDepartments] = useState<UbigeoOption[]>([]);
  const [provinces, setProvinces] = useState<UbigeoOption[]>([]);
  const [districts, setDistricts] = useState<UbigeoOption[]>([]);

  const [deptId, setDeptId] = useState('');
  const [provId, setProvId] = useState('');
  const [distId, setDistId] = useState('');

  // Load departments once
  useEffect(() => {
    axios.get(`${ubigeoBase}/ubigeo/departments`).then(r => setDepartments(r.data.data || []));
  }, []);

  // If there's an initial value, resolve it to dept/prov/dist
  useEffect(() => {
    if (!value || value.length !== 6) return;
    axios.get(`${ubigeoBase}/ubigeo/${value}`).then(r => {
      const d = r.data.data;
      if (!d) return;
      setDeptId(d.department_id);
      setProvId(d.province_id);
      setDistId(d.district_id);
    }).catch(() => {});
  }, []); // only on mount

  // Load provinces when dept changes
  useEffect(() => {
    if (!deptId) { setProvinces([]); setProvId(''); setDistricts([]); setDistId(''); return; }
    axios.get(`${ubigeoBase}/ubigeo/provinces`, { params: { department_id: deptId } })
      .then(r => setProvinces(r.data.data || []));
    setProvId('');
    setDistricts([]);
    setDistId('');
  }, [deptId]);

  // Load districts when province changes
  useEffect(() => {
    if (!provId) { setDistricts([]); setDistId(''); return; }
    axios.get(`${ubigeoBase}/ubigeo/districts`, { params: { province_id: provId } })
      .then(r => setDistricts(r.data.data || []));
    setDistId('');
  }, [provId]);

  const handleDistrictChange = (id: string) => {
    setDistId(id);
    if (!id) { onChange('', ''); return; }
    const dept = departments.find(d => d.id === deptId);
    const prov = provinces.find(p => p.id === provId);
    const dist = districts.find(d => d.id === id);
    const label = [dept?.name, prov?.name, dist?.name].filter(Boolean).join(' › ');
    onChange(id, label);
  };

  const selectCls = `w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#232834] bg-white dark:bg-black text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none`;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}{required && ' *'}
        </label>
      )}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Departamento</p>
          <select
            value={deptId}
            onChange={e => setDeptId(e.target.value)}
            className={selectCls}
          >
            <option value="">— Selecciona —</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Provincia</p>
          <select
            value={provId}
            onChange={e => setProvId(e.target.value)}
            disabled={!deptId}
            className={selectCls}
          >
            <option value="">— Selecciona —</option>
            {provinces.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Distrito</p>
          <select
            value={distId}
            onChange={e => handleDistrictChange(e.target.value)}
            disabled={!provId}
            className={selectCls}
          >
            <option value="">— Selecciona —</option>
            {districts.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>
      {distId && (
        <p className="mt-1 text-[10px] text-gray-400 font-mono">
          Ubigeo: <span className="text-emerald-500 font-bold">{distId}</span>
        </p>
      )}
    </div>
  );
}
