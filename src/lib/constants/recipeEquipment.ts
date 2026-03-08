export const EQUIPMENT_OPTIONS = [
  { value: 'oven', label: 'Ugn' },
  { value: 'airfryer', label: 'Airfryer' },
  { value: 'stovetop', label: 'Spis' },
  { value: 'microwave', label: 'Mikrovågsugn' },
  { value: 'blender', label: 'Blender' },
  { value: 'no-cook', label: 'Ingen tillagning' },
] as const

export type EquipmentValue = (typeof EQUIPMENT_OPTIONS)[number]['value']

/** Vilka inställningsfält varje utrustning kan ha */
export const EQUIPMENT_SETTINGS_FIELDS: Partial<Record<EquipmentValue, EquipmentField[]>> = {
  oven: [
    { key: 'temp_c', label: 'Temperatur', unit: '°C', type: 'number', placeholder: '175' },
    { key: 'duration', label: 'Tid', unit: 'min', type: 'number', placeholder: '30' },
  ],
  airfryer: [
    { key: 'temp_c', label: 'Temperatur', unit: '°C', type: 'number', placeholder: '200' },
    { key: 'duration', label: 'Tid', unit: 'min', type: 'number', placeholder: '15' },
  ],
  stovetop: [
    { key: 'heat', label: 'Värmenivå', unit: '', type: 'text', placeholder: 'Medelhög värme' },
    { key: 'duration', label: 'Tid', unit: 'min', type: 'number', placeholder: '10' },
  ],
  microwave: [
    { key: 'watt', label: 'Effekt', unit: 'W', type: 'number', placeholder: '800' },
    { key: 'duration', label: 'Tid', unit: 'min', type: 'number', placeholder: '3' },
  ],
}

export interface EquipmentField {
  key: string
  label: string
  unit: string
  type: 'number' | 'text'
  placeholder: string
}

/** Typ för ett enskilt utrustningsobjekts inställningar */
export type EquipmentSettings = Record<EquipmentValue, Record<string, string | number> | undefined>
