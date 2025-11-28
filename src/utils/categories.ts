export const serviceCategories = [
  { value: 'consultation_management', label: 'Consulenza & Gestione HSE' },
  { value: 'workplace_safety', label: 'Sicurezza sul Lavoro' },
  { value: 'training_education', label: 'Formazione & Addestramento' },
  { value: 'environment', label: 'Ambiente' },
  { value: 'occupational_health', label: 'Salute Occupazionale' },
  { value: 'emergency_crisis', label: 'Emergenza & Gestione Crisi' },
  { value: 'innovation_digital', label: 'Innovazione & Digital HSE' },
  { value: 'specialized_services', label: 'Servizi Specialistici' },
];

export const pricingUnits = [
  { value: 'fixed', label: 'Prezzo Fisso' },
  { value: 'hourly', label: 'Orario' },
  { value: 'daily', label: 'Giornaliero' },
  { value: 'per_participant', label: 'Per Partecipante' },
  { value: 'per_sqm', label: 'Per Metro Quadro' },
];

export const locationTypes = [
  { value: 'on_site', label: 'Presso il cliente' },
  { value: 'provider_location', label: 'Presso il fornitore' },
  { value: 'remote', label: 'Remoto/Online' },
  { value: 'flexible', label: 'Flessibile' },
];

export const serviceTypes = [
  { value: 'instant', label: 'Prenotazione Immediata' },
  { value: 'on_request', label: 'Su Richiesta' },
  { value: 'scheduled', label: 'Programmato' },
];

// Utility function to get category label by value
export const getCategoryLabel = (value: string): string => {
  const category = serviceCategories.find(cat => cat.value === value);
  return category ? category.label : value;
};

// Utility function to get pricing unit label by value
export const getPricingUnitLabel = (value: string): string => {
  const unit = pricingUnits.find(u => u.value === value);
  return unit ? unit.label : value;
};

// Utility function to get location type label by value
export const getLocationTypeLabel = (value: string): string => {
  const type = locationTypes.find(t => t.value === value);
  return type ? type.label : value;
};

// Utility function to get service type label by value
export const getServiceTypeLabel = (value: string): string => {
  const type = serviceTypes.find(t => t.value === value);
  return type ? type.label : value;
};