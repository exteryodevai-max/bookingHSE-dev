// Componente gestione certificazioni con verifica automatica per BookingHSE
import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Upload, CheckCircle, AlertTriangle, Clock, X, Plus, Eye, Download, RefreshCw, Search, Award, FileText, Calendar, TrendingUp } from 'lucide-react';
import { getCertificationManager, CertificationHelpers } from '../lib/certifications';
import FileUpload from './FileUpload/FileUpload';
import { toast } from 'react-hot-toast';
import type { 
  Certification, 
  CertificationStats, 
  CertificationStatus,
  CertificationType
} from '../lib/certifications';

interface CertificationManagerProps {
  providerId: string;
  mode?: 'list' | 'upload' | 'verify' | 'stats';
  className?: string;
}

interface CertificationFormData {
  title: string;
  type: CertificationType;
  issuingAuthority: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  documentUrl?: string;
  documentFile?: File;
  autoRenewal: boolean;
  reminderDays: number;
  tags: string[];
}

const CertificationManager: React.FC<CertificationManagerProps> = ({
  providerId,
  mode = 'list',
  className = ''
}) => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [stats, setStats] = useState<CertificationStats | null>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showVerificationDetails, setShowVerificationDetails] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  
  const [formData, setFormData] = useState<CertificationFormData>({
    title: '',
    type: 'safety',
    issuingAuthority: '',
    certificateNumber: '',
    issueDate: '',
    expiryDate: '',
    autoRenewal: false,
    reminderDays: 30,
    tags: []
  });

  const [filters, setFilters] = useState({
    status: [] as CertificationStatus[],
    type: [] as CertificationType[],
    search: '',
    expiringInDays: 0
  });

  const certificationManager = getCertificationManager();

  // Carica certificazioni
  const loadCertifications = useCallback(async () => {
    if (!providerId) return;
    
    setLoading(true);
    try {
      const certs = await certificationManager.getProviderCertifications(providerId, {
        status: filters.status.length > 0 ? filters.status : [],
        type: filters.type.length > 0 ? filters.type : [],
        search: filters.search || '',
        expiringInDays: filters.expiringInDays || 0
      });
      
      setCertifications(certs);
    } catch (error: unknown) {
      console.error('Errore caricamento certificazioni:', error);
    } finally {
      setLoading(false);
    }
  }, [providerId, filters, certificationManager]);

  // Carica statistiche
  const loadStats = useCallback(async () => {
    if (!providerId) return;
    
    try {
      const certStats = await certificationManager.getCertificationStats(providerId);
      setStats(certStats);
    } catch (error: unknown) {
      console.error('Errore caricamento statistiche:', error);
    }
  }, [providerId, certificationManager]);

  useEffect(() => {
    loadCertifications();
    loadStats();
  }, [loadCertifications, loadStats]);

  // Upload certificazione
  const handleUpload = async () => {
    if (!formData.title || !formData.issuingAuthority || !formData.certificateNumber) {
      alert('Compila tutti i campi obbligatori');
      return;
    }

    setUploading(true);
    try {
      let documentUrl = '';
      
      // Upload documento se presente
      if (formData.documentFile) {
        // Simula upload - sostituire con upload reale
        documentUrl = `https://storage.example.com/certs/${Date.now()}_${formData.documentFile.name}`;
      }

      const certification = await certificationManager.createCertification({
        providerId,
        title: formData.title,
        type: formData.type,
        issuingAuthority: formData.issuingAuthority,
        certificateNumber: formData.certificateNumber,
        issueDate: formData.issueDate,
        expiryDate: formData.expiryDate,
        verificationMethod: 'automatic',
        documentUrl,
        documentType: 'certificate',
        autoRenewal: formData.autoRenewal,
        reminderDays: formData.reminderDays,
        tags: formData.tags
      });

      if (certification) {
        setCertifications(prev => [certification, ...prev]);
        setShowUploadForm(false);
        setFormData({
          title: '',
          type: 'safety',
          issuingAuthority: '',
          certificateNumber: '',
          issueDate: '',
          expiryDate: '',
          autoRenewal: false,
          reminderDays: 30,
          tags: []
        });
        loadStats();
      }
    } catch (error: unknown) {
      console.error('Errore upload certificazione:', error);
      alert('Errore durante l\'upload della certificazione');
    } finally {
      setUploading(false);
    }
  };

  // Verifica manuale
  const handleManualVerification = async (certificationId: string) => {
    try {
      setLoading(true);
      await certificationManager.verifyAutomatically(certificationId);
      await loadCertifications();
    } catch (error: unknown) {
      console.error('Errore verifica manuale:', error);
    } finally {
      setLoading(false);
    }
  };

  // Rinnova certificazione
  const handleRenewal = async (certificationId: string) => {
    const newExpiryDate = prompt('Inserisci la nuova data di scadenza (YYYY-MM-DD):');
    if (!newExpiryDate) return;

    try {
      const success = await certificationManager.renewCertification(certificationId, {
        newExpiryDate,
        notes: 'Rinnovo manuale'
      });
      
      if (success) {
        await loadCertifications();
        await loadStats();
      }
    } catch (error: unknown) {
      console.error('Errore rinnovo certificazione:', error);
    }
  };

  // Render lista certificazioni
  const renderCertificationList = () => (
    <div className="space-y-4">
      {/* Header con filtri */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Le Tue Certificazioni</h3>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
            {certifications.length} totali
          </span>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca certificazioni..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filters.status[0] || ''}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              status: e.target.value ? [e.target.value as CertificationStatus] : []
            }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tutti gli stati</option>
            <option value="verified">Verificate</option>
            <option value="pending">In attesa</option>
            <option value="expired">Scadute</option>
            <option value="rejected">Rifiutate</option>
          </select>
          
          <button
            onClick={() => setShowUploadForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Aggiungi
          </button>
        </div>
      </div>

      {/* Lista certificazioni */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            <span className="ml-2">Caricamento...</span>
          </div>
        ) : certifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nessuna certificazione trovata</p>
            <button
              onClick={() => setShowUploadForm(true)}
              className="mt-2 text-blue-600 hover:text-blue-700"
            >
              Aggiungi la prima certificazione
            </button>
          </div>
        ) : (
          certifications.map(cert => (
            <div key={cert.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: CertificationHelpers.getStatusColor(cert.status) }} />
                    <h4 className="font-medium text-lg">{cert.title}</h4>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {CertificationHelpers.formatType(cert.type)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="w-4 h-4" />
                        <span>Autorità: {cert.issuingAuthority}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4" />
                        <span>N°: {cert.certificateNumber}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span>Emessa: {new Date(cert.issueDate).toLocaleDateString('it-IT')}</span>
                      </div>
                      {cert.expiryDate && (
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4" />
                          <span>Scade: {new Date(cert.expiryDate).toLocaleDateString('it-IT')}</span>
                          {CertificationHelpers.isExpiringSoon(cert.expiryDate) && (
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                          )}
                          {CertificationHelpers.isExpired(cert.expiryDate) && (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium`} style={{
                      backgroundColor: CertificationHelpers.getStatusColor(cert.status) + '20',
                      color: CertificationHelpers.getStatusColor(cert.status)
                    }}>
                      {CertificationHelpers.formatStatus(cert.status)}
                    </span>
                    
                    {cert.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedCertification(cert);
                      setShowVerificationDetails(true);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    title="Visualizza dettagli"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  {cert.status === 'pending' && (
                    <button
                      onClick={() => handleManualVerification(cert.id)}
                      className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Verifica manuale"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  
                  {cert.expiryDate && CertificationHelpers.isExpiringSoon(cert.expiryDate, 60) && (
                    <button
                      onClick={() => handleRenewal(cert.id)}
                      className="p-2 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                      title="Rinnova"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  
                  {cert.documentUrl && (
                    <button
                      onClick={() => window.open(cert.documentUrl, '_blank')}
                      className="p-2 text-green-400 hover:text-green-600 hover:bg-green-50 rounded"
                      title="Scarica documento"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Render form upload
  const renderUploadForm = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Nuova Certificazione</h3>
        <button
          onClick={() => setShowUploadForm(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Titolo *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Es. Certificazione ISO 9001"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Tipo *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as CertificationType }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="safety">Sicurezza</option>
              <option value="environmental">Ambientale</option>
              <option value="quality">Qualità</option>
              <option value="training">Formazione</option>
              <option value="professional">Professionale</option>
              <option value="custom">Personalizzata</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Autorità Emittente *</label>
            <input
              type="text"
              value={formData.issuingAuthority}
              onChange={(e) => setFormData(prev => ({ ...prev, issuingAuthority: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Es. ISO International"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Numero Certificato *</label>
            <input
              type="text"
              value={formData.certificateNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, certificateNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Es. ISO-9001-2024-001"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Data Emissione *</label>
            <input
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Data Scadenza</label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Documento</label>
            <FileUpload
              bucket="certifications"
              path={`${providerId}/certificates`}
              accept=".pdf,.jpg,.jpeg,.png"
              maxSize={10 * 1024 * 1024} // 10MB
              onUploadComplete={(url) => {
                setFormData(prev => ({ ...prev, documentUrl: url }));
                toast.success('Documento caricato con successo!');
              }}
              onUploadError={(error: unknown) => {
                console.error('Errore upload documento:', error);
                toast.error('Errore durante l\'upload del documento');
              }}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (max 10MB)</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Giorni Promemoria</label>
            <input
              type="number"
              value={formData.reminderDays}
              onChange={(e) => setFormData(prev => ({ ...prev, reminderDays: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="365"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoRenewal"
              checked={formData.autoRenewal}
              onChange={(e) => setFormData(prev => ({ ...prev, autoRenewal: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="autoRenewal" className="text-sm">Rinnovo automatico</label>
          </div>
        </div>
      </div>
      
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => setShowUploadForm(false)}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Annulla
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Caricamento...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Carica Certificazione
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Render statistiche
  const renderStats = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Statistiche Certificazioni</h3>
      
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Totali</span>
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">Verificate</span>
              </div>
              <div className="text-2xl font-bold">{stats.verified}</div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="font-medium">In Attesa</span>
              </div>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-medium">In Scadenza</span>
              </div>
              <div className="text-2xl font-bold">{stats.expiringIn30Days}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-medium mb-4">Certificazioni per Tipo</h4>
              <div className="space-y-3">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="capitalize">{CertificationHelpers.formatType(type as CertificationType)}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }} 
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-medium mb-4">Metriche di Performance</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Tasso di Verifica</span>
                  <span className="font-bold text-green-600">{stats.verificationRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tempo Medio Verifica</span>
                  <span className="font-bold">{stats.averageVerificationTime} giorni</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Certificazioni Scadute</span>
                  <span className="font-bold text-red-600">{stats.expired}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Gestione Certificazioni</h2>
          <div className="flex bg-white rounded-lg border border-gray-200">
            {[
              { key: 'list', label: 'Lista', icon: Shield },
              { key: 'upload', label: 'Carica', icon: Upload },
              { key: 'stats', label: 'Statistiche', icon: TrendingUp }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setShowUploadForm(key === 'upload')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg ${
                  (key === 'upload' && showUploadForm) || (key === 'list' && !showUploadForm && mode === 'list') || (key === 'stats' && mode === 'stats')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenuto principale */}
      {showUploadForm ? renderUploadForm() : mode === 'stats' ? renderStats() : renderCertificationList()}

      {/* Modal dettagli verifica */}
      {showVerificationDetails && selectedCertification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Dettagli Certificazione</h3>
              <button
                onClick={() => setShowVerificationDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Titolo:</span>
                  <p>{selectedCertification.title}</p>
                </div>
                <div>
                  <span className="font-medium">Tipo:</span>
                  <p>{CertificationHelpers.formatType(selectedCertification.type)}</p>
                </div>
                <div>
                  <span className="font-medium">Stato:</span>
                  <p className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: CertificationHelpers.getStatusColor(selectedCertification.status) }} />
                    {CertificationHelpers.formatStatus(selectedCertification.status)}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Metodo Verifica:</span>
                  <p className="capitalize">{selectedCertification.verificationMethod}</p>
                </div>
              </div>
              
              {selectedCertification.verificationData && (
                <div>
                  <span className="font-medium">Dati Verifica:</span>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(selectedCertification.verificationData, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedCertification.expiryDate && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium">Scadenza:</span>
                  </div>
                  <p className="text-sm mt-1">
                    {CertificationHelpers.isExpired(selectedCertification.expiryDate) 
                      ? 'Certificazione scaduta' 
                      : `Scade tra ${CertificationHelpers.getDaysUntilExpiry(selectedCertification.expiryDate)} giorni`
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificationManager;
export type { CertificationManagerProps };