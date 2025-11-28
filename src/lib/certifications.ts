// Sistema di certificazioni con verifica automatica per BookingHSE
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

type CertificationStatus = 'pending' | 'verified' | 'rejected' | 'expired' | 'suspended';
type CertificationType = 'safety' | 'environmental' | 'quality' | 'training' | 'professional' | 'custom';
type VerificationMethod = 'automatic' | 'manual' | 'api' | 'document' | 'third_party';
type DocumentType = 'certificate' | 'diploma' | 'license' | 'attestation' | 'report' | 'other';

interface Certification {
  id: string;
  providerId: string;
  title: string;
  type: CertificationType;
  issuingAuthority: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate?: string;
  status: CertificationStatus;
  verificationMethod: VerificationMethod;
  documentUrl?: string;
  documentType: DocumentType;
  verificationData?: Record<string, string | number | boolean>;
  autoRenewal: boolean;
  reminderDays: number;
  tags: string[];
  metadata?: Record<string, string | number | boolean>;
  createdAt: string;
  updatedAt: string;
}

interface CertificationTemplate {
  id: string;
  name: string;
  type: CertificationType;
  requiredFields: string[];
  validationRules: ValidationRule[];
  autoVerificationEnabled: boolean;
  apiEndpoint?: string;
  apiKey?: string;
  documentRequirements: DocumentRequirement[];
  expiryMonths?: number;
  isActive: boolean;
}

interface ValidationRule {
  field: string;
  type: 'regex' | 'length' | 'date' | 'number' | 'custom';
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  customValidator?: string;
  errorMessage: string;
}

interface DocumentRequirement {
  type: DocumentType;
  required: boolean;
  maxSizeMB: number;
  allowedFormats: string[];
  ocrEnabled: boolean;
  extractFields: string[];
}

interface VerificationResult {
  success: boolean;
  status: CertificationStatus;
  confidence: number;
  extractedData?: Record<string, string | number | boolean>;
  errors: string[];
  warnings: string[];
  verificationDetails: Record<string, string | number | boolean>;
  nextVerificationDate?: string;
}

interface CertificationAlert {
  id: string;
  certificationId: string;
  type: 'expiry_warning' | 'expired' | 'verification_failed' | 'renewal_required';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  isRead: boolean;
  createdAt: string;
}

interface CertificationStats {
  total: number;
  verified: number;
  pending: number;
  expired: number;
  expiringIn30Days: number;
  byType: Record<CertificationType, number>;
  verificationRate: number;
  averageVerificationTime: number;
}

class CertificationManager {
  private supabase: ReturnType<typeof createClient<Database>>;
  private cache: Map<string, {
    data: unknown;
    timestamp: number;
  }> = new Map();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes
  private ocrApiKey?: string;
  private verificationApis: Map<string, string> = new Map();

  constructor(supabaseUrl: string, supabaseKey: string, ocrApiKey?: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
    this.ocrApiKey = ocrApiKey;
    this.initializeVerificationApis();
  }

  // Inizializza API di verifica
  private initializeVerificationApis(): void {
    // API per verifica certificati ISO
    this.verificationApis.set('iso', 'https://api.iso.org/certificates/verify');
    // API per verifica certificati di sicurezza
    this.verificationApis.set('safety', 'https://api.safety-certs.com/verify');
    // API per verifica certificati ambientali
    this.verificationApis.set('environmental', 'https://api.env-certs.org/verify');
  }

  // Crea certificazione
  async createCertification(
    certData: Omit<Certification, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<Certification | null> {
    try {
      const { data, error } = await this.supabase
        .from('certifications')
        .insert({
          provider_id: certData.providerId,
          title: certData.title,
          type: certData.type,
          issuing_authority: certData.issuingAuthority,
          certificate_number: certData.certificateNumber,
          issue_date: certData.issueDate,
          expiry_date: certData.expiryDate,
          status: 'pending',
          verification_method: certData.verificationMethod,
          document_url: certData.documentUrl,
          document_type: certData.documentType,
          verification_data: certData.verificationData,
          auto_renewal: certData.autoRenewal,
          reminder_days: certData.reminderDays,
          tags: certData.tags,
          metadata: certData.metadata
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Errore creazione certificazione:', error);
        return null;
      }

      const certification = data as Certification;
      
      // Avvia verifica automatica se abilitata
      if (certData.verificationMethod === 'automatic') {
        await this.verifyAutomatically(certification.id);
      }

      // Invalida cache
      this.invalidateCache(certData.providerId);

      return certification;
    } catch (error) {
      console.error('Errore creazione certificazione:', error);
      return null;
    }
  }

  // Verifica automatica
  async verifyAutomatically(certificationId: string): Promise<VerificationResult> {
    try {
      const { data: cert, error } = await this.supabase
        .from('certifications')
        .select('*')
        .eq('id', certificationId)
        .maybeSingle();

      if (error || !cert) {
        return {
          success: false,
          status: 'rejected',
          confidence: 0,
          errors: ['Certificazione non trovata'],
          warnings: [],
          verificationDetails: {}
        };
      }

      const certification = cert as Certification;
      let verificationResult: VerificationResult;

      // Verifica tramite OCR se presente documento
      if (certification.documentUrl) {
        const ocrResult = await this.performOCRVerification(certification);
        if (ocrResult.success) {
          verificationResult = ocrResult;
        } else {
          // Fallback a verifica API
          verificationResult = await this.performAPIVerification(certification);
        }
      } else {
        // Verifica solo tramite API
        verificationResult = await this.performAPIVerification(certification);
      }

      // Aggiorna stato certificazione
      await this.supabase
        .from('certifications')
        .update({
          status: verificationResult.status,
          verification_data: {
            ...certification.verification_data,
            lastVerification: new Date().toISOString(),
            confidence: verificationResult.confidence,
            method: 'automatic',
            details: verificationResult.verificationDetails
          }
        })
        .eq('id', certificationId);

      // Crea alert se necessario
      if (!verificationResult.success) {
        await this.createAlert({
          certificationId,
          type: 'verification_failed',
          message: `Verifica automatica fallita: ${verificationResult.errors.join(', ')}`,
          severity: 'high'
        });
      }

      return verificationResult;
    } catch (error) {
      console.error('Errore verifica automatica:', error);
      return {
        success: false,
        status: 'rejected',
        confidence: 0,
        errors: ['Errore durante la verifica automatica'],
        warnings: [],
        verificationDetails: { error: error.message }
      };
    }
  }

  // Verifica tramite OCR
  private async performOCRVerification(certification: Certification): Promise<VerificationResult> {
    if (!this.ocrApiKey || !certification.documentUrl) {
      return {
        success: false,
        status: 'pending',
        confidence: 0,
        errors: ['OCR non configurato o documento mancante'],
        warnings: [],
        verificationDetails: {}
      };
    }

    try {
      // Simula chiamata OCR (sostituire con API reale)
      const ocrResponse = await this.callOCRAPI(certification.documentUrl);
      
      if (!ocrResponse.success) {
        return {
          success: false,
          status: 'pending',
          confidence: 0,
          errors: ['Errore OCR: ' + ocrResponse.error],
          warnings: [],
          verificationDetails: { ocrError: ocrResponse.error }
        };
      }

      const extractedData = ocrResponse.data;
      const validationResult = this.validateExtractedData(certification, extractedData);

      return {
        success: validationResult.isValid,
        status: validationResult.isValid ? 'verified' : 'rejected',
        confidence: validationResult.confidence,
        extractedData,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        verificationDetails: {
          method: 'ocr',
          extractedFields: Object.keys(extractedData),
          validationScore: validationResult.confidence
        }
      };
    } catch (error) {
      return {
        success: false,
        status: 'rejected',
        confidence: 0,
        errors: ['Errore durante verifica OCR'],
        warnings: [],
        verificationDetails: { error: error.message }
      };
    }
  }

  // Chiamata API OCR (mock)
  private async callOCRAPI(): Promise<{ 
    success: boolean; 
    data?: Record<string, string | number | boolean>; 
    error?: string 
  }> {
    try {
      // Mock response - sostituire con chiamata reale
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        data: {
          certificateNumber: 'ISO-9001-2024-001',
          issuingAuthority: 'ISO International',
          issueDate: '2024-01-15',
          expiryDate: '2027-01-15',
          holderName: 'Example Company Ltd',
          scope: 'Quality Management Systems',
          confidence: 0.95
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verifica tramite API esterna
  private async performAPIVerification(certification: Certification): Promise<VerificationResult> {
    try {
      const apiUrl = this.verificationApis.get(certification.type);
      
      if (!apiUrl) {
        return {
          success: false,
          status: 'pending',
          confidence: 0,
          errors: ['API di verifica non disponibile per questo tipo di certificazione'],
          warnings: [],
          verificationDetails: { reason: 'no_api_available' }
        };
      }

      // Mock API call - sostituire con chiamata reale
      const apiResponse = await this.callVerificationAPI(apiUrl, certification);
      
      return {
        success: apiResponse.valid,
        status: apiResponse.valid ? 'verified' : 'rejected',
        confidence: apiResponse.confidence || 0.8,
        errors: apiResponse.errors || [],
        warnings: apiResponse.warnings || [],
        verificationDetails: {
          method: 'api',
          apiUrl,
          response: apiResponse
        }
      };
    } catch (error) {
      return {
        success: false,
        status: 'rejected',
        confidence: 0,
        errors: ['Errore durante verifica API'],
        warnings: [],
        verificationDetails: { error: error.message }
      };
    }
  }

  // Chiamata API verifica (mock)
  private async callVerificationAPI(): Promise<{
    valid: boolean;
    confidence: number;
    errors: string[];
    warnings: string[];
    details: Record<string, string | number | boolean>;
  }> {
    // Mock response - sostituire con chiamata reale
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      valid: Math.random() > 0.2, // 80% di successo
      confidence: 0.85,
      errors: [],
      warnings: [],
      details: {
        verifiedAt: new Date().toISOString(),
        apiVersion: '1.0',
        certificateStatus: 'active'
      }
    };
  }

  // Valida dati estratti
  private validateExtractedData(
    certification: Certification, 
    extractedData: Record<string, string | number | boolean>
  ): { isValid: boolean; confidence: number; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidence = 100;

    // Verifica numero certificato
    if (extractedData.certificateNumber !== certification.certificateNumber) {
      if (extractedData.certificateNumber) {
        warnings.push('Numero certificato estratto differisce da quello inserito');
        confidence -= 10;
      } else {
        errors.push('Numero certificato non trovato nel documento');
        confidence -= 30;
      }
    }

    // Verifica autorità emittente
    if (extractedData.issuingAuthority) {
      const similarity = this.calculateStringSimilarity(
        extractedData.issuingAuthority.toLowerCase(),
        certification.issuingAuthority.toLowerCase()
      );
      
      if (similarity < 0.8) {
        warnings.push('Autorità emittente estratta potrebbe non corrispondere');
        confidence -= 15;
      }
    } else {
      errors.push('Autorità emittente non trovata nel documento');
      confidence -= 25;
    }

    // Verifica date
    if (extractedData.issueDate) {
      const extractedIssueDate = new Date(extractedData.issueDate);
      const certIssueDate = new Date(certification.issueDate);
      const daysDiff = Math.abs(extractedIssueDate.getTime() - certIssueDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 7) {
        warnings.push('Data di emissione estratta differisce significativamente');
        confidence -= 10;
      }
    }

    if (extractedData.expiryDate && certification.expiryDate) {
      const extractedExpiryDate = new Date(extractedData.expiryDate);
      const certExpiryDate = new Date(certification.expiryDate);
      const daysDiff = Math.abs(extractedExpiryDate.getTime() - certExpiryDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 7) {
        warnings.push('Data di scadenza estratta differisce significativamente');
        confidence -= 10;
      }
    }

    // Verifica scadenza
    if (certification.expiryDate) {
      const expiryDate = new Date(certification.expiryDate);
      if (expiryDate < new Date()) {
        errors.push('Certificazione scaduta');
        confidence = 0;
      }
    }

    return {
      isValid: errors.length === 0 && confidence >= 60,
      confidence: Math.max(0, confidence) / 100,
      errors,
      warnings
    };
  }

  // Calcola similarità stringhe
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // Distanza di Levenshtein
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Ottieni certificazioni provider
  async getProviderCertifications(
    providerId: string,
    filters?: {
      status?: CertificationStatus[];
      type?: CertificationType[];
      expiringInDays?: number;
      search?: string;
    }
  ): Promise<Certification[]> {
    try {
      const cacheKey = `certs_${providerId}_${JSON.stringify(filters)}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      let query = this.supabase
        .from('certifications')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.type && filters.type.length > 0) {
        query = query.in('type', filters.type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Errore caricamento certificazioni:', error);
        return [];
      }

      let certifications = (data as Certification[]) || [];

      // Filtro per scadenza
      if (filters?.expiringInDays) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + filters.expiringInDays);
        
        certifications = certifications.filter(cert => 
          cert.expiryDate && new Date(cert.expiryDate) <= futureDate
        );
      }

      // Filtro per ricerca
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        certifications = certifications.filter(cert =>
          cert.title.toLowerCase().includes(searchLower) ||
          cert.issuingAuthority.toLowerCase().includes(searchLower) ||
          cert.certificateNumber.toLowerCase().includes(searchLower)
        );
      }

      this.setCache(cacheKey, certifications);
      return certifications;
    } catch (error) {
      console.error('Errore caricamento certificazioni:', error);
      return [];
    }
  }

  // Rinnova certificazione
  async renewCertification(
    certificationId: string,
    renewalData: {
      newExpiryDate: string;
      newDocumentUrl?: string;
      notes?: string;
    }
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('certifications')
        .update({
          expiry_date: renewalData.newExpiryDate,
          document_url: renewalData.newDocumentUrl,
          status: 'pending',
          metadata: {
            renewalDate: new Date().toISOString(),
            renewalNotes: renewalData.notes
          }
        })
        .eq('id', certificationId);

      if (error) {
        console.error('Errore rinnovo certificazione:', error);
        return false;
      }

      // Avvia nuova verifica
      await this.verifyAutomatically(certificationId);

      return true;
    } catch (error) {
      console.error('Errore rinnovo certificazione:', error);
      return false;
    }
  }

  // Crea alert
  async createAlert(
    alertData: Omit<CertificationAlert, 'id' | 'isRead' | 'createdAt'>
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('certification_alerts')
        .insert({
          certification_id: alertData.certificationId,
          type: alertData.type,
          message: alertData.message,
          severity: alertData.severity,
          due_date: alertData.dueDate,
          is_read: false
        });

      return !error;
    } catch (error) {
      console.error('Errore creazione alert:', error);
      return false;
    }
  }

  // Controlla scadenze
  async checkExpirations(): Promise<void> {
    try {
      const { data: certifications } = await this.supabase
        .from('certifications')
        .select('*')
        .eq('status', 'verified')
        .not('expiry_date', 'is', null);

      if (!certifications) return;

      const now = new Date();
      
      for (const cert of certifications as Certification[]) {
        const expiryDate = new Date(cert.expiryDate!);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Certificazione scaduta
        if (daysUntilExpiry < 0) {
          await this.supabase
            .from('certifications')
            .update({ status: 'expired' })
            .eq('id', cert.id);

          await this.createAlert({
            certificationId: cert.id,
            type: 'expired',
            message: `Certificazione "${cert.title}" è scaduta`,
            severity: 'critical'
          });
        }
        // Avviso scadenza
        else if (daysUntilExpiry <= cert.reminderDays) {
          await this.createAlert({
            certificationId: cert.id,
            type: 'expiry_warning',
            message: `Certificazione "${cert.title}" scadrà tra ${daysUntilExpiry} giorni`,
            severity: daysUntilExpiry <= 7 ? 'high' : 'medium',
            dueDate: cert.expiryDate
          });
        }
      }
    } catch (error) {
      console.error('Errore controllo scadenze:', error);
    }
  }

  // Ottieni statistiche
  async getCertificationStats(providerId: string): Promise<CertificationStats> {
    try {
      const { data: certifications } = await this.supabase
        .from('certifications')
        .select('*')
        .eq('provider_id', providerId);

      if (!certifications) {
        return {
          total: 0,
          verified: 0,
          pending: 0,
          expired: 0,
          expiringIn30Days: 0,
          byType: {} as Record<CertificationType, number>,
          verificationRate: 0,
          averageVerificationTime: 0
        };
      }

      const certs = certifications as Certification[];
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const stats: CertificationStats = {
        total: certs.length,
        verified: certs.filter(c => c.status === 'verified').length,
        pending: certs.filter(c => c.status === 'pending').length,
        expired: certs.filter(c => c.status === 'expired').length,
        expiringIn30Days: certs.filter(c => 
          c.expiryDate && new Date(c.expiryDate) <= in30Days && new Date(c.expiryDate) > now
        ).length,
        byType: {} as Record<CertificationType, number>,
        verificationRate: 0,
        averageVerificationTime: 0
      };

      // Statistiche per tipo
      const types: CertificationType[] = ['safety', 'environmental', 'quality', 'training', 'professional', 'custom'];
      types.forEach(type => {
        stats.byType[type] = certs.filter(c => c.type === type).length;
      });

      // Tasso di verifica
      stats.verificationRate = stats.total > 0 ? (stats.verified / stats.total) * 100 : 0;

      // Tempo medio di verifica (mock)
      stats.averageVerificationTime = 2.5; // giorni

      return stats;
    } catch (error) {
      console.error('Errore statistiche certificazioni:', error);
      return {
        total: 0,
        verified: 0,
        pending: 0,
        expired: 0,
        expiringIn30Days: 0,
        byType: {} as Record<CertificationType, number>,
        verificationRate: 0,
        averageVerificationTime: 0
      };
    }
  }

  // Gestione cache
  private getFromCache(key: string): unknown {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private invalidateCache(providerId: string): void {
    const keysToDelete = Array.from(this.cache.keys())
      .filter(key => key.includes(providerId));
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Funzioni di utilità
export const CertificationHelpers = {
  // Formatta stato
  formatStatus(status: CertificationStatus): string {
    const statusMap = {
      pending: 'In attesa',
      verified: 'Verificata',
      rejected: 'Rifiutata',
      expired: 'Scaduta',
      suspended: 'Sospesa'
    };
    return statusMap[status] || status;
  },

  // Formatta tipo
  formatType(type: CertificationType): string {
    const typeMap = {
      safety: 'Sicurezza',
      environmental: 'Ambientale',
      quality: 'Qualità',
      training: 'Formazione',
      professional: 'Professionale',
      custom: 'Personalizzata'
    };
    return typeMap[type] || type;
  },

  // Ottieni colore stato
  getStatusColor(status: CertificationStatus): string {
    const colorMap = {
      pending: '#f59e0b',
      verified: '#10b981',
      rejected: '#ef4444',
      expired: '#6b7280',
      suspended: '#f97316'
    };
    return colorMap[status] || '#6b7280';
  },

  // Calcola giorni alla scadenza
  getDaysUntilExpiry(expiryDate: string): number {
    const expiry = new Date(expiryDate);
    const now = new Date();
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  },

  // Verifica se è in scadenza
  isExpiringSoon(expiryDate: string, warningDays: number = 30): boolean {
    const daysUntilExpiry = this.getDaysUntilExpiry(expiryDate);
    return daysUntilExpiry <= warningDays && daysUntilExpiry > 0;
  },

  // Verifica se è scaduta
  isExpired(expiryDate: string): boolean {
    return this.getDaysUntilExpiry(expiryDate) < 0;
  },

  // Genera numero certificato
  generateCertificateNumber(type: CertificationType, authority: string): string {
    const typePrefix = type.toUpperCase().substring(0, 3);
    const authorityPrefix = authority.replace(/\s+/g, '').toUpperCase().substring(0, 3);
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `${typePrefix}-${authorityPrefix}-${year}-${random}`;
  },

  // Valida formato numero certificato
  validateCertificateNumber(number: string): boolean {
    // Formato: XXX-XXX-YYYY-NNNN
    const pattern = /^[A-Z]{3}-[A-Z]{3}-\d{4}-\d{4}$/;
    return pattern.test(number);
  }
};

// Istanza singleton
let certificationManagerInstance: CertificationManager | null = null;

export function getCertificationManager(): CertificationManager {
  if (!certificationManagerInstance) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const ocrApiKey = import.meta.env.VITE_OCR_API_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configurazione Supabase mancante per la gestione certificazioni');
    }
    
    certificationManagerInstance = new CertificationManager(supabaseUrl, supabaseKey, ocrApiKey);
  }
  
  return certificationManagerInstance;
}

export type {
  Certification,
  CertificationTemplate,
  ValidationRule,
  DocumentRequirement,
  VerificationResult,
  CertificationAlert,
  CertificationStats,
  CertificationStatus,
  CertificationType,
  VerificationMethod,
  DocumentType
};

export { CertificationManager };