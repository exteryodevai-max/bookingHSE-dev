import { supabase } from './supabase';

/**
 * Archivia un servizio spostandolo dalla tabella services a archived_services
 * @param serviceId ID del servizio da archiviare
 * @param userId ID dell'utente che sta archiviando
 * @returns true se l'operazione è riuscita, false altrimenti
 */
export async function archiveService(serviceId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('archive_service', {
        p_service_id: serviceId,
        p_user_id: userId
      });

    if (error) {
      console.error('Errore nell\'archiviazione del servizio:', error);
      throw error;
    }

    return data === true;
  } catch (error) {
    console.error('Errore nell\'archiviazione del servizio:', error);
    throw error;
  }
}

/**
 * Ripristina un servizio spostandolo dalla tabella archived_services a services
 * @param serviceId ID del servizio da ripristinare
 * @param userId ID dell'utente che sta ripristinando
 * @returns true se l'operazione è riuscita, false altrimenti
 */
export async function restoreService(serviceId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('restore_service', {
        p_service_id: serviceId,
        p_user_id: userId
      });

    if (error) {
      console.error('Errore nel ripristino del servizio:', error);
      throw error;
    }

    return data === true;
  } catch (error) {
    console.error('Errore nel ripristino del servizio:', error);
    throw error;
  }
}

/**
 * Carica i servizi archiviati per un provider specifico
 * @param userId ID del provider
 * @returns Array di servizi archiviati con informazioni del provider
 */
export async function loadArchivedServices(userId: string) {
  try {
    // Carica i servizi archiviati
    const { data: archivedServices, error: servicesError } = await supabase
      .from('archived_services')
      .select('*')
      .eq('provider_id', userId)
      .order('created_at', { ascending: false });

    if (servicesError) {
      console.error('Errore nel caricamento dei servizi archiviati:', servicesError);
      throw servicesError;
    }

    if (!archivedServices || archivedServices.length === 0) {
      return [];
    }

    // Carica il profilo del provider
    const { data: providerProfile, error: profileError } = await supabase
      .from('provider_profiles')
      .select('business_name, verified')
      .eq('user_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Errore nel caricamento del profilo provider:', profileError);
      throw profileError;
    }

    // Combina i dati
    return archivedServices.map(service => ({
      ...service,
      provider_profiles: providerProfile || { business_name: '', verified: false }
    }));

  } catch (error) {
    console.error('Errore nel caricamento dei servizi archiviati:', error);
    throw error;
  }
}