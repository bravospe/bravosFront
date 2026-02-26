import { useState, useEffect, useCallback } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useUbigeoStore } from '../../stores/ubigeoStore';
import clsx from 'clsx';

export interface UbigeoValue {
  department_id: string;
  department_name: string;
  province_id: string;
  province_name: string;
  district_id: string; // UBIGEO code (6 digits)
  district_name: string;
  full_location: string;
}

interface UbigeoSelectorProps {
  value?: Partial<UbigeoValue>;
  onChange: (value: UbigeoValue | null) => void;
  required?: boolean;
  disabled?: boolean;
  showLabels?: boolean;
  layout?: 'horizontal' | 'vertical' | 'grid';
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  className?: string;
}

export default function UbigeoSelector({
  value,
  onChange,
  required = false,
  disabled = false,
  showLabels = true,
  layout = 'horizontal',
  size = 'md',
  error,
  className,
}: UbigeoSelectorProps) {
  const {
    departments,
    fetchDepartments,
    fetchProvinces,
    fetchDistricts,
    getProvincesByDepartment,
    getDistrictsByProvince,
    isLoadingDepartments,
    isLoadingProvinces,
    isLoadingDistricts,
  } = useUbigeoStore();

  const [selectedDepartment, setSelectedDepartment] = useState(value?.department_id || '');
  const [selectedProvince, setSelectedProvince] = useState(value?.province_id || '');
  const [selectedDistrict, setSelectedDistrict] = useState(value?.district_id || '');

  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Fetch provinces when department changes
  useEffect(() => {
    if (selectedDepartment) {
      fetchProvinces(selectedDepartment);
    }
  }, [selectedDepartment, fetchProvinces]);

  // Fetch districts when province changes
  useEffect(() => {
    if (selectedProvince) {
      fetchDistricts(selectedProvince);
    }
  }, [selectedProvince, fetchDistricts]);

  // Sync with external value
  useEffect(() => {
    if (value?.department_id && value.department_id !== selectedDepartment) {
      setSelectedDepartment(value.department_id);
    }
    if (value?.province_id && value.province_id !== selectedProvince) {
      setSelectedProvince(value.province_id);
    }
    if (value?.district_id && value.district_id !== selectedDistrict) {
      setSelectedDistrict(value.district_id);
    }
  }, [value]);

  const provinces = getProvincesByDepartment(selectedDepartment);
  const districts = getDistrictsByProvince(selectedProvince);

  const handleDepartmentChange = useCallback((departmentId: string) => {
    setSelectedDepartment(departmentId);
    setSelectedProvince('');
    setSelectedDistrict('');
    onChange(null);
  }, [onChange]);

  const handleProvinceChange = useCallback((provinceId: string) => {
    setSelectedProvince(provinceId);
    setSelectedDistrict('');
    onChange(null);
  }, [onChange]);

  const handleDistrictChange = useCallback((districtId: string) => {
    setSelectedDistrict(districtId);
    
    if (districtId) {
      const department = departments.find(d => d.id === selectedDepartment);
      const province = provinces.find(p => p.id === selectedProvince);
      const district = districts.find(d => d.id === districtId);

      if (department && province && district) {
        onChange({
          department_id: department.id,
          department_name: department.name,
          province_id: province.id,
          province_name: province.name,
          district_id: district.id,
          district_name: district.name,
          full_location: `${department.name}, ${province.name}, ${district.name}`,
        });
      }
    } else {
      onChange(null);
    }
  }, [departments, provinces, districts, selectedDepartment, selectedProvince, onChange]);

  // Size classes
  const sizeClasses = {
    sm: 'py-1.5 px-2 text-sm',
    md: 'py-2 px-3 text-sm',
    lg: 'py-2.5 px-4 text-base',
  };

  // Layout classes
  const layoutClasses = {
    horizontal: 'flex flex-wrap gap-3',
    vertical: 'flex flex-col gap-3',
    grid: 'grid grid-cols-1 md:grid-cols-3 gap-3',
  };

  const selectClasses = clsx(
    'block w-full rounded-lg border bg-white dark:bg-black appearance-none cursor-pointer',
    'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
    'disabled:bg-gray-100 dark:disabled:bg-zinc-900 disabled:cursor-not-allowed',
    error
      ? 'border-red-300 dark:border-red-600'
      : 'border-gray-300 dark:border-[#232834]',
    sizeClasses[size]
  );

  const SelectWrapper = ({ children, label, loading }: { children: React.ReactNode; label: string; loading?: boolean }) => (
    <div className="flex-1 min-w-0">
      {showLabels && (
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {children}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          {loading ? (
            <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={clsx(className)}>
      <div className={layoutClasses[layout]}>
        {/* Department Select */}
        <SelectWrapper label="Departamento" loading={isLoadingDepartments}>
          <select
            value={selectedDepartment}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            disabled={disabled || isLoadingDepartments}
            className={selectClasses}
          >
            <option value="">Seleccionar departamento</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </SelectWrapper>

        {/* Province Select */}
        <SelectWrapper label="Provincia" loading={isLoadingProvinces}>
          <select
            value={selectedProvince}
            onChange={(e) => handleProvinceChange(e.target.value)}
            disabled={disabled || !selectedDepartment || isLoadingProvinces}
            className={selectClasses}
          >
            <option value="">Seleccionar provincia</option>
            {provinces.map((prov) => (
              <option key={prov.id} value={prov.id}>
                {prov.name}
              </option>
            ))}
          </select>
        </SelectWrapper>

        {/* District Select */}
        <SelectWrapper label="Distrito" loading={isLoadingDistricts}>
          <select
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            disabled={disabled || !selectedProvince || isLoadingDistricts}
            className={selectClasses}
          >
            <option value="">Seleccionar distrito</option>
            {districts.map((dist) => (
              <option key={dist.id} value={dist.id}>
                {dist.name}
              </option>
            ))}
          </select>
        </SelectWrapper>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Hidden input with UBIGEO value for forms */}
      <input type="hidden" name="ubigeo" value={selectedDistrict} />
    </div>
  );
}
