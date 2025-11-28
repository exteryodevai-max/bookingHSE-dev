import React from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { ServiceCategory } from '../../types';

const categories = [
  {
    id: 'consultation_management' as ServiceCategory,
    name: 'Consulenza & Gestione HSE',
    description: 'Consulenza strategica e operativa per la gestione integrata di salute, sicurezza e ambiente',
    icon: DocumentTextIcon,
    color: 'bg-blue-500',
    services: ['DVR/DUVRI', 'ISO 45001/14001', 'Audit HSE', 'Due Diligence'],
    count: '450+ servizi'
  },
  {
    id: 'workplace_safety' as ServiceCategory,
    name: 'Sicurezza sul Lavoro',
    description: 'Servizi per la prevenzione degli infortuni e la protezione dei lavoratori',
    icon: ShieldCheckIcon,
    color: 'bg-green-500',
    services: ['Valutazione Rischi', 'PSC/POS', 'DPI', 'Monitoraggi'],
    count: '380+ servizi'
  },
  {
    id: 'training_education' as ServiceCategory,
    name: 'Formazione & Addestramento',
    description: 'Programmi formativi obbligatori e specialistici per la sicurezza sul lavoro',
    icon: AcademicCapIcon,
    color: 'bg-purple-500',
    services: ['Corsi Lavoratori', 'RSPP/ASPP', 'Antincendio', 'Primo Soccorso'],
    count: '620+ servizi'
  },
  {
    id: 'environment' as ServiceCategory,
    name: 'Ambiente',
    description: 'Servizi per la gestione ambientale e la sostenibilità aziendale',
    icon: GlobeAltIcon,
    color: 'bg-emerald-500',
    services: ['Gestione Rifiuti', 'AUA/AIA', 'Monitoraggi', 'ESG'],
    count: '290+ servizi'
  },
  {
    id: 'occupational_health' as ServiceCategory,
    name: 'Salute Occupazionale',
    description: 'Servizi per la tutela della salute dei lavoratori',
    icon: HeartIcon,
    color: 'bg-red-500',
    services: ['Medico Competente', 'Sorveglianza Sanitaria', 'Ergonomia'],
    count: '180+ servizi'
  },
  {
    id: 'emergency_crisis' as ServiceCategory,
    name: 'Emergenza & Gestione Crisi',
    description: 'Preparazione e gestione delle situazioni di emergenza',
    icon: ExclamationTriangleIcon,
    color: 'bg-orange-500',
    services: ['Piani Emergenza', 'Gestione Incidenti', 'Business Continuity'],
    count: '120+ servizi'
  },
  {
    id: 'innovation_digital' as ServiceCategory,
    name: 'Innovazione & Digital HSE',
    description: 'Soluzioni tecnologiche avanzate per la gestione HSE',
    icon: CpuChipIcon,
    color: 'bg-indigo-500',
    services: ['Software HSE', 'IoT', 'Dashboard KPI', 'VR/AR Training'],
    count: '95+ servizi'
  },
  {
    id: 'specialized_services' as ServiceCategory,
    name: 'Servizi Specialistici',
    description: 'Consulenze altamente specializzate per normative e rischi specifici',
    icon: CogIcon,
    color: 'bg-gray-500',
    services: ['ATEX', 'Marcatura CE', 'Seveso III', 'Bonifiche'],
    count: '150+ servizi'
  }
];

export default function ServiceCategories() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Esplora i Nostri Servizi HSE
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Trova il servizio perfetto per le tue esigenze di sicurezza, salute e ambiente. 
            Tutti i nostri fornitori sono verificati e specializzati nel settore HSE.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Link
                key={category.id}
                to={`/search?category=${category.id}`}
                className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100 hover:border-gray-200"
              >
                <div className="flex items-center mb-4">
                  <div className={`${category.color} p-3 rounded-lg mr-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    {category.count}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {category.description}
                </p>
                
                <div className="flex flex-wrap gap-1">
                  {category.services.slice(0, 3).map((service) => (
                    <span
                      key={service}
                      className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                    >
                      {service}
                    </span>
                  ))}
                  {category.services.length > 3 && (
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                      +{category.services.length - 3}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/search"
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
          >
            Vedi Tutti i Servizi
            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}