# 🧩 Documentazione Componenti - BookingHSE

Documentazione completa dei componenti principali dell'applicazione BookingHSE.

## 📋 Indice

1. [Architettura Componenti](#architettura-componenti)
2. [Componenti Layout](#componenti-layout)
3. [Componenti UI](#componenti-ui)
4. [Componenti Business Logic](#componenti-business-logic)
5. [Componenti Storage](#componenti-storage)
6. [Hooks Personalizzati](#hooks-personalizzati)
7. [Context Providers](#context-providers)
8. [Utilities](#utilities)
9. [Convenzioni](#convenzioni)

## 🏗️ Architettura Componenti

### Struttura Directory
```
src/
├── components/
│   ├── ui/              # Componenti UI riutilizzabili
│   ├── layout/          # Componenti layout
│   ├── forms/           # Componenti form
│   ├── booking/         # Componenti specifici booking
│   ├── auth/            # Componenti autenticazione
│   └── common/          # Componenti comuni
├── hooks/               # Custom hooks
├── contexts/            # React contexts
├── lib/                 # Utilities e configurazioni
├── scripts/             # Script di utilità e popolamento database
└── types/               # TypeScript types
```

### Principi di Design
- **Composizione**: Componenti piccoli e riutilizzabili
- **Single Responsibility**: Ogni componente ha una responsabilità specifica
- **Props Interface**: Interfacce TypeScript ben definite
- **Accessibility**: Supporto completo a11y
- **Performance**: Ottimizzazioni React (memo, useMemo, useCallback)

## 🎨 Componenti Layout

### AppLayout
**Percorso**: `src/components/layout/AppLayout.tsx`

```typescript
interface AppLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
  showHeader?: boolean
  className?: string
}

export function AppLayout({ 
  children, 
  showSidebar = true, 
  showHeader = true,
  className 
}: AppLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {showHeader && <Header />}
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

**Caratteristiche**:
- Layout responsive
- Sidebar collassabile
- Header condizionale
- Supporto dark mode

### Header
**Percorso**: `src/components/layout/Header.tsx`

```typescript
interface HeaderProps {
  user?: User
  onMenuToggle?: () => void
  showNotifications?: boolean
}

export function Header({ user, onMenuToggle, showNotifications = true }: HeaderProps) {
  const { notifications } = useNotifications()
  
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Button variant="ghost" size="sm" onClick={onMenuToggle}>
          <Menu className="h-4 w-4" />
        </Button>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-2">
            {showNotifications && (
              <NotificationCenter notifications={notifications} />
            )}
            <UserMenu user={user} />
          </nav>
        </div>
      </div>
    </header>
  )
}
```

### Sidebar
**Percorso**: `src/components/layout/Sidebar.tsx`

```typescript
interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
  userRole?: UserRole
}

export function Sidebar({ isCollapsed, onToggle, userRole }: SidebarProps) {
  const navigation = getNavigationItems(userRole)
  
  return (
    <aside className={cn(
      "border-r bg-background transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <nav className="space-y-2 p-4">
        {navigation.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isCollapsed={isCollapsed}
            badge={item.badge}
          />
        ))}
      </nav>
    </aside>
  )
}
```

## 🎯 Componenti UI

### ContactPage
**Percorso**: `src/pages/Info/ContactPage.tsx`

```typescript
interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  privacy: boolean;
}

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactFormData>({
    resolver: yupResolver(contactSchema)
  });

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Errore durante l\'invio');
      }
      
      toast.success('Messaggio inviato con successo!');
      reset();
    } catch (error) {
      console.error('Errore invio contatto:', error);
      toast.error(error instanceof Error ? error.message : 'Errore durante l\'invio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      {/* Contact Form */}
      {/* Contact Info */}
      {/* FAQ Section */}
    </Layout>
  );
}
```

**Caratteristiche:**
- ✅ **Validazione completa**: Schema Yup con tutti i campi obbligatori
- ✅ **Gestione stati**: Loading state durante l'invio
- ✅ **Error handling**: Gestione errori con toast notifications
- ✅ **Reset form**: Pulizia automatica dopo invio successo
- ✅ **Responsive design**: Layout ottimizzato per mobile e desktop
- ✅ **SEO friendly**: Struttura semantica e meta tags

**Sezioni principali:**
1. **Hero Section**: Titolo e descrizione della pagina
2. **Contact Form**: Form con validazione e invio API
3. **Contact Info**: Informazioni di contatto alternative
4. **FAQ Section**: Domande frequenti con risposte

**Validazione Schema:**
```typescript
const contactSchema = yup.object({
  name: yup.string().required('Il nome è obbligatorio'),
  email: yup.string().email('Email non valida').required('Email obbligatoria'),
  phone: yup.string().optional(),
  company: yup.string().optional(),
  subject: yup.string().required('Il soggetto è obbligatorio'),
  message: yup.string().min(10, 'Minimo 10 caratteri').required('Il messaggio è obbligatorio'),
  privacy: yup.boolean().oneOf([true], 'Devi accettare la privacy policy').required()
});
```

**Utilizzo:**
```typescript
// Nel routing
<Route path="/contatti" element={<ContactPage />} />

// Navigazione programmatica
navigate('/contatti');
```

### Button
**Percorso**: `src/components/ui/Button.tsx`

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'default', 
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    )
  }
)
```

**Caratteristiche**:
- ✅ **Varianti multiple**: 6 stili diversi per ogni contesto
- ✅ **Loading state**: Spinner automatico durante operazioni async
- ✅ **Icone**: Supporto per icone a sinistra e destra
- ✅ **Accessibilità**: Gestione automatica dello stato disabled
- ✅ **TypeScript**: Tipizzazione completa con React.forwardRef

### FileUpload
**Percorso**: `src/components/ui/FileUpload.tsx`

```typescript
interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number
  label?: string
  error?: string
  loading?: boolean
  multiple?: boolean
}

export function FileUpload({
  onFileSelect,
  accept = 'image/*,.pdf,.doc,.docx',
  maxSize = 10 * 1024 * 1024, // 10MB
  label = 'Carica file',
  error,
  loading = false,
  multiple = false
}: FileUploadProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.size > maxSize) {
        toast.error(`File troppo grande. Dimensione massima: ${maxSize / 1024 / 1024}MB`)
        return
      }
      onFileSelect(file)
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center space-x-2">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
          multiple={multiple}
          disabled={loading}
        />
        <label
          htmlFor="file-upload"
          className={cn(
            "cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            loading && "opacity-50 cursor-not-allowed"
          )}
        >
          {loading ? 'Caricamento...' : 'Seleziona file'}
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Formati supportati: {accept}. Dimensione massima: {maxSize / 1024 / 1024}MB
      </p>
    </div>
  )
}
```

**Caratteristiche**:
- ✅ **Validazione file**: Controllo dimensione e tipo file
- ✅ **Loading state**: Gestione stato di caricamento
- ✅ **Accessibilità**: Label e descrizioni appropriate
- ✅ **TypeScript**: Tipizzazione completa dei props
- ✅ **Error handling**: Visualizzazione errori di validazione

## 🔄 Componenti Business Logic

### ArchiveServiceManager
**Percorso**: `src/lib/archiveService.ts`

```typescript
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
```

**Caratteristiche**:
- ✅ **Gestione archiviazione**: Funzioni complete per archiviazione/ripristino
- ✅ **Sicurezza**: Verifica ownership utente per tutte le operazioni
- ✅ **Error handling**: Gestione robusta degli errori con logging
- ✅ **Performance**: Query ottimizzate con RPC calls
- ✅ **TypeScript**: Tipizzazione completa dei dati restituiti

**Esempio di utilizzo**:
```typescript
import { archiveService, restoreService, loadArchivedServices } from '../lib/archiveService';

// Archivia un servizio
const success = await archiveService('service-123', 'user-456');
if (success) {
  toast.success('Servizio archiviato con successo');
}

// Carica servizi archiviati
const archivedServices = await loadArchivedServices('user-456');
console.log('Servizi archiviati:', archivedServices);
```

## 📄 Componenti Pagine

### ProviderServicesPage
**Percorso**: `src/pages/ProviderServicesPage.tsx`

**Funzionalità principali**:
- ✅ **Gestione servizi attivi**: Visualizzazione e modifica servizi attivi
- ✅ **Archiviazione servizi**: Funzionalità completa di archiviazione/ripristino
- ✅ **Tab navigazione**: Switch tra servizi attivi e archiviati
- ✅ **Real-time updates**: Aggiornamenti in tempo reale dello stato
- ✅ **Error handling**: Gestione completa degli errori con toast notifications

**Interfaccia utente**:
```typescript
interface ServiceTab {
  id: string
  label: string
  count: number
}

const tabs: ServiceTab[] = [
  { id: 'active', label: 'Servizi Attivi', count: activeServices.length },
  { id: 'archived', label: 'Archiviati', count: archivedServices.length }
];
```

**Flusso di archiviazione**:
1. **Conferma archiviazione**: Dialog di conferma con motivazione
2. **Esecuzione**: Chiamata a `archiveService` con validazione ownership
3. **Aggiornamento UI**: Rimozione dalla lista attivi e aggiunta agli archiviati
4. **Notifica**: Toast di successo/errore

### Dashboard
**Percorso**: `src/pages/Dashboard.tsx`

**Integrazione archiviazione**:
- ✅ **Filtro servizi**: Esclusione automatica servizi archiviati
- ✅ **Statistiche**: Conteggio separato servizi attivi/archiviati
- ✅ **Performance**: Query ottimizzate che escludono archived_services

**Esempio query**:
```typescript
const { data: activeServices } = await supabase
  .from('services')
  .select('*')
  .eq('provider_id', userId)
  .is('archived_at', null); // Solo servizi non archiviati
```

## 🔧 Utility Functions

### Service Validation
**Percorso**: `src/lib/validations.ts`

```typescript
/**
 * Valida i dati di un servizio prima del salvataggio
 * @param serviceData Dati del servizio da validare
 * @returns Array di errori di validazione
 */
export function validateService(serviceData: Partial<Service>): string[] {
  const errors: string[] = [];
  
  if (!serviceData.title?.trim()) {
    errors.push('Il titolo del servizio è obbligatorio');
  }
  
  if (!serviceData.description?.trim()) {
    errors.push('La descrizione del servizio è obbligatoria');
  }
  
  if (!serviceData.price || serviceData.price <= 0) {
    errors.push('Il prezzo deve essere maggiore di 0');
  }
  
  if (!serviceData.duration || serviceData.duration <= 0) {
    errors.push('La durata deve essere maggiore di 0');
  }
  
  return errors;
}

/**
 * Valida i file caricati per un servizio
 * @param files Array di file da validare
 * @param maxSize Dimensione massima in bytes (default: 10MB)
 * @returns Array di errori di validazione
 */
export function validateServiceFiles(
  files: File[], 
  maxSize: number = 10 * 1024 * 1024
): string[] {
  const errors: string[] = [];
  
  files.forEach(file => {
    if (file.size > maxSize) {
      errors.push(`File ${file.name} troppo grande. Massimo ${maxSize / 1024 / 1024}MB`);
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      errors.push(`Tipo file non supportato: ${file.name}`);
    }
  });
  
  return errors;
}
```

**Caratteristiche**:
- ✅ **Validazione completa**: Campi obbligatori, formati, dimensioni
- ✅ **Messaggi utente**: Errori descrittivi in italiano
- ✅ **TypeScript**: Tipizzazione completa degli input/output
- ✅ **Riusabilità**: Funzioni pure senza side effects

## 🎨 Design Patterns Implementati

### 1. Repository Pattern
**Componenti**: `archiveService.ts`, servizi API
**Vantaggi**: Separazione business logic da implementazione database

### 2. Strategy Pattern  
**Componenti**: Varianti di Button, diverse modalità di validazione
**Vantaggi**: Estensibilità senza modificare codice esistente

### 3. Observer Pattern
**Componenti**: Real-time updates con Supabase subscriptions
**Vantaggi**: UI sempre sincronizzata con stato database

### 4. Factory Pattern
**Componenti**: Creazione dinamica di form per diversi tipi di servizio
**Vantaggi**: Flessibilità nell'aggiunta di nuovi tipi di servizio

## 📊 Performance Considerations

### Ottimizzazioni Database
- ✅ **Indexing**: Indici su `provider_id` e `archived_at`
- ✅ **Query filtering**: Esclusione servizi archiviati nelle query principali
- ✅ **RPC calls**: Operazioni batch per archiviazione/ripristino
- ✅ **Pagination**: Caricamento lazy delle liste lunghe

### Ottimizzazioni Frontend
- ✅ **Memoization**: useMemo per dati derivati
- ✅ **Virtual scrolling**: Per liste con molti elementi
- ✅ **Lazy loading**: Caricamento immagini on demand
- ✅ **Code splitting**: Separazione bundle per pagine meno utilizzate

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'default', 
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    )
  }
)
```

**Caratteristiche**:
- ✅ **Varianti multiple**: 6 stili diversi per ogni contesto
- ✅ **Loading state**: Spinner automatico durante operazioni async
- ✅ **Icone**: Supporto per icone a sinistra e destra
- ✅ **Accessibilità**: Gestione automatica dello stato disabled
- ✅ **TypeScript**: Tipizzazione completa con React.forwardRef
```

### Input
**Percorso**: `src/components/ui/Input.tsx`

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onRightIconClick?: () => void
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = 'text',
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    onRightIconClick,
    ...props 
  }, ref) => {
    const inputId = useId()
    
    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={inputId} className={error ? 'text-destructive' : ''}>
            {label}
          </Label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          <input
            id={inputId}
            type={type}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            ref={ref}
            {...props}
          />
          
          {rightIcon && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={onRightIconClick}
            >
              {rightIcon}
            </button>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    )
  }
)
```

### Card
**Percorso**: `src/components/ui/Card.tsx`

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'ghost'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  )
)

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
)

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
)
```

**Caratteristiche**:
- ✅ **Composizione modulare**: Header, Content e Footer separati
- ✅ **Varianti multiple**: Default, outline e ghost
- ✅ **Padding configurabile**: 4 livelli di spaziatura
- ✅ **Accessibilità**: Struttura semantica corretta
- ✅ **TypeScript**: Tipizzazione completa con React.forwardRef

### Badge
**Percorso**: `src/components/ui/Badge.tsx`

```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg'
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)
```

**Caratteristiche**:
- ✅ **6 varianti di colore**: Default, secondary, destructive, outline, success, warning
- ✅ **3 dimensioni**: Small, medium, large
- ✅ **Styling consistente**: Integrato con il design system
- ✅ **Accessibilità**: Supporto per screen reader
- ✅ **TypeScript**: Tipizzazione completa

### FileUpload
**Percorso**: `src/components/ui/FileUpload.tsx`

```typescript
interface FileUploadProps {
  onFileSelect: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxSize?: number
  maxFiles?: number
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({ 
    onFileSelect,
    accept = "*/*",
    multiple = false,
    maxSize = 10 * 1024 * 1024, // 10MB
    maxFiles = 1,
    disabled = false,
    className,
    children,
    ...props 
  }, ref) => {
    const [isDragOver, setIsDragOver] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [errors, setErrors] = useState<string[]>([])
    
    const handleFileValidation = useCallback((fileList: File[]) => {
      const validationErrors: string[] = []
      const validFiles: File[] = []
      
      for (const file of fileList) {
        const validation = validateFile(file, {
          maxSize,
          allowedTypes: accept !== "*/*" ? accept.split(',') : undefined
        })
        
        if (validation.isValid) {
          validFiles.push(file)
        } else {
          validationErrors.push(...validation.errors)
        }
      }
      
      if (validFiles.length > maxFiles) {
        validationErrors.push(`Massimo ${maxFiles} file${maxFiles > 1 ? 's' : ''} consentiti`)
        return { validFiles: validFiles.slice(0, maxFiles), errors: validationErrors }
      }
      
      return { validFiles, errors: validationErrors }
    }, [maxSize, maxFiles, accept])
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {/* Drag & Drop Area */}
        <div
          className="flex flex-col items-center justify-center space-y-4 text-center"
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled) setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragOver(false)
            if (disabled) return
            
            const droppedFiles = Array.from(e.dataTransfer.files)
            const { validFiles, errors } = handleFileValidation(droppedFiles)
            
            setErrors(errors)
            if (validFiles.length > 0) {
              setFiles(validFiles)
              onFileSelect(validFiles)
            }
          }}
        >
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Trascina i file qui o clicca per selezionare
            </p>
            <p className="text-xs text-muted-foreground">
              {accept !== "*/*" && `Formati supportati: ${accept}`}
              {maxSize && ` • Dimensione massima: ${formatFileSize(maxSize)}`}
            </p>
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = accept
              input.multiple = multiple
              input.onchange = (e) => {
                const target = e.target as HTMLInputElement
                if (target.files) {
                  const selectedFiles = Array.from(target.files)
                  const { validFiles, errors } = handleFileValidation(selectedFiles)
                  
                  setErrors(errors)
                  if (validFiles.length > 0) {
                    setFiles(validFiles)
                    onFileSelect(validFiles)
                  }
                }
              }
              input.click()
            }}
          >
            Seleziona file
          </Button>
        </div>
        
        {/* File List */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center space-x-2">
                  {isImageFile(file) ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileIcon className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newFiles = files.filter((_, i) => i !== index)
                    setFiles(newFiles)
                    onFileSelect(newFiles)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {/* Errors */}
        {errors.length > 0 && (
          <div className="mt-4 space-y-1">
            {errors.map((error, index) => (
              <p key={index} className="text-sm text-destructive">
                {error}
              </p>
            ))}
          </div>
        )}
        
        {children}
      </div>
    )
  }
)
```

**Caratteristiche**:
- ✅ **Drag & Drop**: Interfaccia intuitiva per il caricamento file
- ✅ **Validazione avanzata**: Controllo dimensioni, tipo e numero file
- ✅ **Preview file**: Anteprima dei file selezionati con icone
- ✅ **Gestione errori**: Messaggi di errore dettagliati
- ✅ **Accessibilità**: Supporto completo per keyboard navigation
- ✅ **TypeScript**: Tipizzazione completa con validazione runtime

### Modal
**Percorso**: `src/components/ui/Modal.tsx`

```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true
}: ModalProps) {
  useEffect(() => {
    if (!closeOnEscape) return
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, closeOnEscape, onClose])
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      <div className={cn(
        "relative bg-background rounded-lg shadow-lg border max-h-[90vh] overflow-auto",
        modalSizes[size]
      )}>
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              {title && <h2 className="text-lg font-semibold">{title}</h2>}
              {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            </div>
            
            {showCloseButton && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
```

## 🚀 Componenti Avanzati

### SmartCalendar
**Percorso**: `src/components/SmartCalendar.tsx`

```typescript
interface SmartCalendarProps {
  onDateSelect?: (date: Date) => void
  onSlotSelect?: (slot: BookingSlot) => void
  availabilityRules?: AvailabilityRule[]
  existingBookings?: CalendarEvent[]
  showSuggestions?: boolean
}

export function SmartCalendar({ 
  onDateSelect, 
  onSlotSelect,
  availabilityRules = [],
  existingBookings = [],
  showSuggestions = true
}: SmartCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([])
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  
  const availabilityManager = getAvailabilityManager()
  
  // Calcola disponibilità intelligente
  const calculateAvailability = useCallback(async (date: Date) => {
    const query: AvailabilityQuery = {
      date,
      duration: 60, // default
      rules: availabilityRules,
      existingBookings
    }
    
    const slots = await availabilityManager.getAvailableSlots(query)
    setAvailableSlots(slots)
    
    if (showSuggestions) {
      const smartSuggestions = await availabilityManager.getSuggestions(query)
      setSuggestions(smartSuggestions)
    }
  }, [availabilityRules, existingBookings, showSuggestions])
  
  return (
    <div className="space-y-6">
      {/* Calendario principale */}
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => {
          setSelectedDate(date)
          if (date) {
            calculateAvailability(date)
            onDateSelect?.(date)
          }
        }}
        disabled={(date) => {
          return date < new Date() || !AvailabilityHelpers.isDateAvailable(date, availabilityRules)
        }}
        className="rounded-md border"
      />
      
      {/* Slot disponibili */}
      {selectedDate && availableSlots.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium">Orari disponibili</h3>
          <div className="grid grid-cols-3 gap-2">
            {availableSlots.map((slot) => (
              <Button
                key={slot.id}
                variant="outline"
                size="sm"
                onClick={() => onSlotSelect?.(slot)}
                className="justify-start"
              >
                <Clock className="h-4 w-4 mr-2" />
                {slot.startTime} - {slot.endTime}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Suggerimenti intelligenti */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Suggerimenti intelligenti
          </h3>
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => {
                  setSelectedDate(suggestion.date)
                  calculateAvailability(suggestion.date)
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{suggestion.title}</p>
                    <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                  </div>
                  <Badge variant="secondary">{suggestion.confidence}% match</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Caratteristiche**:
- ✅ **Disponibilità intelligente**: Calcolo automatico degli slot liberi
- ✅ **Suggerimenti AI**: Raccomandazioni basate su pattern e preferenze
- ✅ **Regole personalizzabili**: Supporto per regole di disponibilità complesse
- ✅ **Integrazione booking**: Considera prenotazioni esistenti
- ✅ **Performance ottimizzata**: Calcoli asincroni con caching

### NotificationCenter
**Percorso**: `src/components/NotificationCenter.tsx`

```typescript
interface NotificationCenterProps {
  maxVisible?: number
  autoHide?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export function NotificationCenter({ 
  maxVisible = 5,
  autoHide = true,
  position = 'top-right'
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  
  const notificationManager = getNotificationManager()
  
  // Gestione notifiche real-time
  useEffect(() => {
    if (!user) return
    
    const unsubscribe = notificationManager.subscribe(user.id, (notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, maxVisible - 1)])
      
      // Auto-hide dopo 5 secondi per notifiche non critiche
      if (autoHide && notification.priority !== 'high') {
        setTimeout(() => {
          removeNotification(notification.id)
        }, 5000)
      }
    })
    
    return unsubscribe
  }, [user, maxVisible, autoHide])
  
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])
  
  const markAsRead = useCallback(async (id: string) => {
    await notificationManager.markAsRead(id)
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])
  
  const unreadCount = notifications.filter(n => !n.read).length
  
  return (
    <div className="relative">
      {/* Trigger button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      {/* Dropdown panel */}
      {isOpen && (
        <div className={cn(
          "absolute z-50 w-80 bg-background border rounded-lg shadow-lg",
          position.includes('right') ? 'right-0' : 'left-0',
          position.includes('top') ? 'top-full mt-2' : 'bottom-full mb-2'
        )}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Notifiche</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => notificationManager.markAllAsRead(user!.id)}
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Segna tutte
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nessuna notifica</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={() => markAsRead(notification.id)}
                    onRemove={() => removeNotification(notification.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Caratteristiche**:
- ✅ **Real-time**: Aggiornamenti istantanei via WebSocket
- ✅ **Priorità intelligente**: Gestione automatica basata su importanza
- ✅ **Auto-hide**: Rimozione automatica per notifiche non critiche
- ✅ **Badge counter**: Contatore visuale per notifiche non lette
- ✅ **Posizionamento flessibile**: 4 posizioni configurabili

### CertificationManager
**Percorso**: `src/components/CertificationManager.tsx`

```typescript
interface CertificationManagerProps {
  userId: string
  userType: 'provider' | 'client'
  onCertificationUpdate?: (stats: CertificationStats) => void
}

export function CertificationManager({ 
  userId, 
  userType,
  onCertificationUpdate
}: CertificationManagerProps) {
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [stats, setStats] = useState<CertificationStats>()
  const [isUploading, setIsUploading] = useState(false)
  
  const certificationManager = getCertificationManager()
  
  // Carica certificazioni esistenti
  useEffect(() => {
    const loadCertifications = async () => {
      const userCertifications = await certificationManager.getUserCertifications(userId)
      setCertifications(userCertifications)
      
      const certStats = await certificationManager.getStats(userId)
      setStats(certStats)
      onCertificationUpdate?.(certStats)
    }
    
    loadCertifications()
  }, [userId])
  
  const handleUpload = useCallback(async (files: File[], type: CertificationType) => {
    setIsUploading(true)
    try {
      const uploadPromises = files.map(file => 
        certificationManager.uploadCertification({
          userId,
          file,
          type,
          autoVerify: true
        })
      )
      
      const newCertifications = await Promise.all(uploadPromises)
      setCertifications(prev => [...prev, ...newCertifications])
      
      toast.success(`${files.length} certificazione/i caricate con successo`)
    } catch (error) {
      toast.error('Errore durante il caricamento')
    } finally {
      setIsUploading(false)
    }
  }, [userId])
  
  const getStatusIcon = (status: CertificationStatus) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />
      case 'expired': return <AlertTriangle className="h-5 w-5 text-red-500" />
      default: return <X className="h-5 w-5 text-gray-400" />
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Stats overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.verified}</p>
                  <p className="text-sm text-muted-foreground">Verificate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">In verifica</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.expiring}</p>
                  <p className="text-sm text-muted-foreground">In scadenza</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.complianceScore}%</p>
                  <p className="text-sm text-muted-foreground">Compliance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Upload area */}
      {userType === 'provider' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Carica Nuove Certificazioni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              onUpload={(files) => handleUpload(files, 'safety')}
              loading={isUploading}
              maxSize={10 * 1024 * 1024} // 10MB
            />
          </CardContent>
        </Card>
      )}
      
      {/* Certifications list */}
      <Card>
        <CardHeader>
          <CardTitle>Certificazioni Attuali</CardTitle>
        </CardHeader>
        <CardContent>
          {certifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessuna certificazione caricata</p>
            </div>
          ) : (
            <div className="space-y-4">
              {certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(cert.status)}
                    <div>
                      <h4 className="font-medium">{cert.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Scadenza: {format(new Date(cert.expiryDate), 'PPP', { locale: it })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizza
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Scarica
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

**Caratteristiche**:
- ✅ **Verifica automatica**: AI-powered document verification
- ✅ **Monitoraggio scadenze**: Alert automatici per certificazioni in scadenza
- ✅ **Compliance scoring**: Punteggio di conformità in tempo reale
- ✅ **Upload multipli**: Caricamento batch con validazione
- ✅ **Stats dashboard**: Panoramica completa dello stato certificazioni

## 🧩 Componenti Business Logic

### SearchForm
**Percorso**: `src/components/Search/SearchForm.tsx`

```typescript
interface SearchFormProps {
  initialFilters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onSearch: () => void;
}

export default function SearchForm({ 
  initialFilters, 
  onFiltersChange, 
  onSearch 
}: SearchFormProps) {
  const [query, setQuery] = useState(initialFilters.query || '');
  const [location, setLocation] = useState(initialFilters.location.city || '');
  const [category, setCategory] = useState(initialFilters.category || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedQuery = query.trim();
    const trimmedLocation = location.trim();
    
    // Validazione: almeno uno tra query e location deve essere fornito
    if (!trimmedQuery && !trimmedLocation) {
      return;
    }
    
    onFiltersChange({
      query: trimmedQuery || undefined,
      location: { 
        city: trimmedLocation || undefined,
        coordinates: undefined,
        radius_km: undefined
      },
      category: category as ServiceCategory || undefined,
    });
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} role="search" className="w-full">
      {/* Form content */}
    </form>
  );
}
```

**Caratteristiche**:
- **Form di ricerca principale**: Gestisce query, località e categoria
- **Validazione integrata**: Previene submit con campi vuoti
- **Accessibilità**: Attributo `role="search"` per screen reader
- **Responsive design**: Layout adattivo per mobile e desktop
- **Gestione stato**: Sincronizzazione con filtri di ricerca globali

**Fix Implementati (v1.0.2)**:
- ✅ **Form Validation**: Aggiunta validazione per prevenire submit senza query o location
- ✅ **Accessibility**: Aggiunto attributo `role="search"` per migliorare l'accessibilità
- ✅ **State Management**: Ottimizzata gestione stato con trim() per evitare spazi vuoti
- ✅ **Test Coverage**: Implementati test completi con mock appropriati

**Test Associati**:
- `SearchForm.test.tsx`: 6 test passati
  - Rendering corretto degli elementi
  - Gestione valori iniziali
  - Aggiornamento input utente
  - Invio form con dati validi
  - Prevenzione submit campi vuoti
  - Accessibilità (ruolo search)

### BookingCard
**Percorso**: `src/components/booking/BookingCard.tsx`

```typescript
interface BookingCardProps {
  booking: Booking
  onEdit?: (booking: Booking) => void
  onCancel?: (booking: Booking) => void
  onComplete?: (booking: Booking) => void
  showActions?: boolean
  variant?: 'default' | 'compact'
}

export function BookingCard({ 
  booking, 
  onEdit, 
  onCancel, 
  onComplete,
  showActions = true,
  variant = 'default'
}: BookingCardProps) {
  const { user } = useAuth()
  const canEdit = user?.id === booking.client_id && booking.status === 'pending'
  const canCancel = user?.id === booking.client_id && ['pending', 'confirmed'].includes(booking.status)
  const canComplete = user?.id === booking.provider_id && booking.status === 'confirmed'
  
  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      variant === 'compact' && "p-4"
    )}>
      <CardHeader className={variant === 'compact' ? 'pb-2' : undefined}>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{booking.service.name}</CardTitle>
            <CardDescription>
              {format(new Date(booking.scheduled_date), 'PPP', { locale: it })}
              {' alle '}
              {booking.scheduled_time}
            </CardDescription>
          </div>
          
          <BookingStatusBadge status={booking.status} />
        </div>
      </CardHeader>
      
      {variant === 'default' && (
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{booking.location}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                €{booking.total_amount.toFixed(2)}
              </span>
            </div>
            
            {booking.notes && (
              <div className="flex items-start space-x-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">{booking.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      )}
      
      {showActions && (canEdit || canCancel || canComplete) && (
        <CardFooter className="flex space-x-2">
          {canEdit && onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(booking)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifica
            </Button>
          )}
          
          {canComplete && onComplete && (
            <Button size="sm" onClick={() => onComplete(booking)}>
              <Check className="h-4 w-4 mr-2" />
              Completa
            </Button>
          )}
          
          {canCancel && onCancel && (
            <Button variant="destructive" size="sm" onClick={() => onCancel(booking)}>
              <X className="h-4 w-4 mr-2" />
              Annulla
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
```

### ServiceCard
**Percorso**: `src/components/services/ServiceCard.tsx`

```typescript
interface ServiceCardProps {
  service: Service
  onBook?: (service: Service) => void
  onEdit?: (service: Service) => void
  onDelete?: (service: Service) => void
  showActions?: boolean
  isOwner?: boolean
}

export function ServiceCard({ 
  service, 
  onBook, 
  onEdit, 
  onDelete,
  showActions = true,
  isOwner = false
}: ServiceCardProps) {
  const [imageError, setImageError] = useState(false)
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <div className="aspect-video relative overflow-hidden">
        {service.images?.[0] && !imageError ? (
          <img
            src={service.images[0]}
            alt={service.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {service.featured && (
          <Badge className="absolute top-2 right-2" variant="secondary">
            <Star className="h-3 w-3 mr-1" />
            In evidenza
          </Badge>
        )}
      </div>
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="line-clamp-1">{service.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {service.description}
            </CardDescription>
          </div>
          
          <div className="text-right">
            <p className="text-2xl font-bold">€{service.price}</p>
            <p className="text-sm text-muted-foreground">{service.duration}min</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{service.location}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{service.provider.business_name}</span>
          </div>
          
          {service.rating && (
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm">
                {service.rating.toFixed(1)} ({service.review_count} recensioni)
              </span>
            </div>
          )}
        </div>
      </CardContent>
      
      {showActions && (
        <CardFooter className="flex space-x-2">
          {isOwner ? (
            <>
              {onEdit && (
                <Button variant="outline" className="flex-1" onClick={() => onEdit(service)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifica
                </Button>
              )}
              
              {onDelete && (
                <Button variant="destructive" size="icon" onClick={() => onDelete(service)}>
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </>
          ) : (
            onBook && (
              <Button className="w-full" onClick={() => onBook(service)}>
                <Calendar className="h-4 w-4 mr-2" />
                Prenota
              </Button>
            )
          )}
        </CardFooter>
      )}
    </Card>
  )
}
```

### NotificationCenter
**Percorso**: `src/components/notifications/NotificationCenter.tsx`

```typescript
interface NotificationCenterProps {
  notifications: Notification[]
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  onDelete?: (id: string) => void
}

export function NotificationCenter({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead,
  onDelete 
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const unreadCount = notifications.filter(n => !n.read).length
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifiche</h3>
            
            {unreadCount > 0 && onMarkAllAsRead && (
              <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
                Segna tutte come lette
              </Button>
            )}
          </div>
        </div>
        
        <div className="max-h-96 overflow-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nessuna notifica</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

## 📁 Componenti Storage

Componenti dedicati alla gestione dei file e dello storage Supabase.

### FileUpload
**Percorso**: `src/components/ui/FileUpload.tsx`

```typescript
interface FileUploadProps {
  bucket: string
  path?: string
  accept?: string
  maxSize?: number
  multiple?: boolean
  onUpload?: (files: UploadedFile[]) => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
}

export function FileUpload({
  bucket,
  path = '',
  accept = '*/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  multiple = false,
  onUpload,
  onError,
  className,
  disabled = false
}: FileUploadProps) {
  const { uploadFile, uploading, progress } = useFileUpload()
  const [dragActive, setDragActive] = useState(false)
  
  const handleFiles = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      if (file.size > maxSize) {
        onError?.(`File ${file.name} troppo grande (max ${formatFileSize(maxSize)})`)
        return false
      }
      return true
    })
    
    if (validFiles.length === 0) return
    
    try {
      const uploadedFiles = await Promise.all(
        validFiles.map(file => uploadFile(file, bucket, path))
      )
      onUpload?.(uploadedFiles)
    } catch (error) {
      onError?.(error.message)
    }
  }
  
  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
        dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onDragEnter={() => setDragActive(true)}
      onDragLeave={() => setDragActive(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        setDragActive(false)
        if (!disabled) handleFiles(e.dataTransfer.files)
      }}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled || uploading}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
        id="file-upload"
      />
      
      <label htmlFor="file-upload" className="cursor-pointer">
        {uploading ? (
          <div className="space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Caricamento... {progress}%
            </p>
            <Progress value={progress} className="w-full" />
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium">
              Trascina i file qui o clicca per selezionare
            </p>
            <p className="text-xs text-muted-foreground">
              {accept !== '*/*' && `Formati supportati: ${accept}`}
              {maxSize && ` • Max ${formatFileSize(maxSize)}`}
              {multiple && ` • File multipli supportati`}
            </p>
          </div>
        )}
      </label>
    </div>
  )
}
```

**Caratteristiche**:
- Drag & drop support
- Validazione file (tipo, dimensione)
- Progress indicator
- Upload multipli
- Gestione errori
- Accessibilità completa

### FilePreview
**Percorso**: `src/components/ui/FilePreview.tsx`

```typescript
interface FilePreviewProps {
  file: UploadedFile
  onDelete?: (fileId: string) => void
  onDownload?: (fileId: string) => void
  showActions?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function FilePreview({
  file,
  onDelete,
  onDownload,
  showActions = true,
  size = 'md'
}: FilePreviewProps) {
  const isImage = file.type.startsWith('image/')
  const isPdf = file.type === 'application/pdf'
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }
  
  return (
    <div className="group relative border rounded-lg p-2 hover:shadow-md transition-shadow">
      <div className={cn("flex items-center justify-center rounded", sizeClasses[size])}>
        {isImage ? (
          <img
            src={file.url}
            alt={file.name}
            className="w-full h-full object-cover rounded"
            loading="lazy"
          />
        ) : isPdf ? (
          <FileText className="h-8 w-8 text-red-500" />
        ) : (
          <File className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      
      <div className="mt-2 space-y-1">
        <p className="text-xs font-medium truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </p>
      </div>
      
      {showActions && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex space-x-1">
            {onDownload && (
              <Button
                variant="secondary"
                size="icon"
                className="h-6 w-6"
                onClick={() => onDownload(file.id)}
              >
                <Download className="h-3 w-3" />
              </Button>
            )}
            
            {onDelete && (
              <Button
                variant="destructive"
                size="icon"
                className="h-6 w-6"
                onClick={() => onDelete(file.id)}
              >
                <Trash className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

### StorageManager
**Percorso**: `src/components/storage/StorageManager.tsx`

```typescript
interface StorageManagerProps {
  bucket: string
  path?: string
  allowUpload?: boolean
  allowDelete?: boolean
  maxFiles?: number
  accept?: string
  onFilesChange?: (files: UploadedFile[]) => void
}

export function StorageManager({
  bucket,
  path = '',
  allowUpload = true,
  allowDelete = true,
  maxFiles,
  accept = '*/*',
  onFilesChange
}: StorageManagerProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)
  const { listFiles, deleteFile } = useStorage()
  
  useEffect(() => {
    loadFiles()
  }, [bucket, path])
  
  const loadFiles = async () => {
    try {
      setLoading(true)
      const fileList = await listFiles(bucket, path)
      setFiles(fileList)
      onFilesChange?.(fileList)
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleUpload = (newFiles: UploadedFile[]) => {
    const updatedFiles = [...files, ...newFiles]
    setFiles(updatedFiles)
    onFilesChange?.(updatedFiles)
  }
  
  const handleDelete = async (fileId: string) => {
    try {
      await deleteFile(bucket, fileId)
      const updatedFiles = files.filter(f => f.id !== fileId)
      setFiles(updatedFiles)
      onFilesChange?.(updatedFiles)
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }
  
  const canUploadMore = !maxFiles || files.length < maxFiles
  
  return (
    <div className="space-y-4">
      {allowUpload && canUploadMore && (
        <FileUpload
          bucket={bucket}
          path={path}
          accept={accept}
          onUpload={handleUpload}
          onError={(error) => console.error('Upload error:', error)}
        />
      )}
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Caricamento file...</span>
        </div>
      ) : files.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.map((file) => (
            <FilePreview
              key={file.id}
              file={file}
              onDelete={allowDelete ? handleDelete : undefined}
              onDownload={(fileId) => {
                const file = files.find(f => f.id === fileId)
                if (file) window.open(file.url, '_blank')
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nessun file presente</p>
        </div>
      )}
      
      {maxFiles && (
        <p className="text-xs text-muted-foreground text-center">
          {files.length} di {maxFiles} file caricati
        </p>
      )}
    </div>
  )
}
```

**Caratteristiche**:
- Gestione completa file (upload, visualizzazione, eliminazione)
- Limiti configurabili
- Filtri per tipo file
- Interfaccia responsive
- Stato di caricamento

## 🎣 Hooks Personalizzati

### useAuth
**Percorso**: `src/hooks/useAuth.ts`

```typescript
interface UseAuthReturn {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: UserData) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          setUser(profile)
        } else {
          setUser(null)
        }
        
        setLoading(false)
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }
  
  const signUp = async (email: string, password: string, userData: UserData) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: userData
      }
    })
    if (error) throw error
  }
  
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
  
  const updateProfile = async (data: Partial<User>) => {
    if (!user) throw new Error('User not authenticated')
    
    const { error } = await supabase
      .from('users')
      .update(data)
      .eq('id', user.id)
    
    if (error) throw error
    
    setUser({ ...user, ...data })
  }
  
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }
  
  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword
  }
}
```

### useBookings
**Percorso**: `src/hooks/useBookings.ts`

```typescript
interface UseBookingsOptions {
  userId?: string
  status?: BookingStatus
  dateRange?: { start: Date; end: Date }
  limit?: number
}

interface UseBookingsReturn {
  bookings: Booking[]
  loading: boolean
  error: string | null
  createBooking: (data: CreateBookingData) => Promise<Booking>
  updateBooking: (id: string, data: Partial<Booking>) => Promise<void>
  cancelBooking: (id: string, reason?: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useBookings(options: UseBookingsOptions = {}): UseBookingsReturn {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      let query = supabase
        .from('bookings')
        .select(`
          *,
          service:services(*),
          client:users!bookings_client_id_fkey(*),
          provider:users!bookings_provider_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
      
      if (options.userId) {
        query = query.or(`client_id.eq.${options.userId},provider_id.eq.${options.userId}`)
      }
      
      if (options.status) {
        query = query.eq('status', options.status)
      }
      
      if (options.dateRange) {
        query = query
          .gte('scheduled_date', options.dateRange.start.toISOString())
          .lte('scheduled_date', options.dateRange.end.toISOString())
      }
      
      if (options.limit) {
        query = query.limit(options.limit)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      setBookings(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento')
    } finally {
      setLoading(false)
    }
  }, [options])
  
  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])
  
  const createBooking = async (data: CreateBookingData): Promise<Booking> => {
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(data)
      .select(`
        *,
        service:services(*),
        client:users!bookings_client_id_fkey(*),
        provider:users!bookings_provider_id_fkey(*)
      `)
      .single()
    
    if (error) throw error
    
    setBookings(prev => [booking, ...prev])
    return booking
  }
  
  const updateBooking = async (id: string, data: Partial<Booking>) => {
    const { error } = await supabase
      .from('bookings')
      .update(data)
      .eq('id', id)
    
    if (error) throw error
    
    setBookings(prev => 
      prev.map(booking => 
        booking.id === id ? { ...booking, ...data } : booking
      )
    )
  }
  
  const cancelBooking = async (id: string, reason?: string) => {
    await updateBooking(id, { 
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString()
    })
  }
  
  return {
    bookings,
    loading,
    error,
    createBooking,
    updateBooking,
    cancelBooking,
    refetch: fetchBookings
  }
}
```

### useFileUpload
**Percorso**: `src/hooks/useFileUpload.ts`

```typescript
interface UseFileUploadReturn {
  uploadFile: (file: File, bucket: string, path?: string) => Promise<UploadedFile>
  uploading: boolean
  progress: number
  error: string | null
}

export function useFileUpload(): UseFileUploadReturn {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const uploadFile = async (file: File, bucket: string, path = '') => {
    try {
      setUploading(true)
      setProgress(0)
      setError(null)
      
      // Validate file
      const validation = validateFile(file, bucket)
      if (!validation.valid) {
        throw new Error(validation.error)
      }
      
      // Generate unique filename
      const fileName = generateFileName(file.name)
      const filePath = path ? `${path}/${fileName}` : fileName
      
      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            setProgress(Math.round((progress.loaded / progress.total) * 100))
          }
        })
      
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)
      
      const uploadedFile: UploadedFile = {
        id: data.path,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        bucket,
        path: data.path,
        uploadedAt: new Date().toISOString()
      }
      
      return uploadedFile
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }
  
  return {
    uploadFile,
    uploading,
    progress,
    error
  }
}
```

### useStorage
**Percorso**: `src/hooks/useStorage.ts`

```typescript
interface UseStorageReturn {
  listFiles: (bucket: string, path?: string) => Promise<UploadedFile[]>
  deleteFile: (bucket: string, filePath: string) => Promise<void>
  getFileUrl: (bucket: string, filePath: string) => string
  downloadFile: (bucket: string, filePath: string) => Promise<Blob>
  getStorageUsage: (bucket?: string) => Promise<StorageUsage>
}

export function useStorage(): UseStorageReturn {
  const listFiles = async (bucket: string, path = '') => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })
      
      if (error) throw error
      
      return data.map(file => ({
        id: file.name,
        name: file.name,
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || 'application/octet-stream',
        url: getFileUrl(bucket, path ? `${path}/${file.name}` : file.name),
        bucket,
        path: path ? `${path}/${file.name}` : file.name,
        uploadedAt: file.created_at
      }))
    } catch (error) {
      console.error('Error listing files:', error)
      return []
    }
  }
  
  const deleteFile = async (bucket: string, filePath: string) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])
    
    if (error) throw error
  }
  
  const getFileUrl = (bucket: string, filePath: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)
    
    return data.publicUrl
  }
  
  const downloadFile = async (bucket: string, filePath: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath)
    
    if (error) throw error
    return data
  }
  
  const getStorageUsage = async (bucket?: string) => {
    // Implementation for getting storage usage statistics
    // This would require custom database functions or API endpoints
    return {
      totalSize: 0,
      fileCount: 0,
      buckets: []
    }
  }
  
  return {
    listFiles,
    deleteFile,
    getFileUrl,
    downloadFile,
    getStorageUsage
  }
}
```

**Caratteristiche hooks storage**:
- **Upload con progress**: Monitoraggio real-time del progresso upload
- **Validazione file**: Controllo automatico tipo e dimensione
- **Gestione errori**: Error handling completo
- **URL pubblici**: Generazione automatica URL accessibili
- **Operazioni CRUD**: Create, Read, Update, Delete per file
- **Statistiche storage**: Monitoraggio utilizzo spazio

## 🌐 Context Providers

### AuthProvider
**Percorso**: `src/contexts/AuthContext.tsx`

```typescript
interface SignUpData {
  email: string;
  password: string;
  userType: 'client' | 'provider';
  companyName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptTerms: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (userData: SignUpData) => Promise<{ error?: { message: string } }>;
  signIn: (email: string, password: string) => Promise<{ error?: { message: string } }>;
  signOut: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}
```

**Funzionalità principali:**
- **Gestione stato utente**: Mantiene lo stato dell'utente autenticato con profilo completo
- **Caricamento profilo automatico**: Carica automaticamente i dati del profilo (client_profiles o provider_profiles)
- **Registrazione avanzata**: Supporta registrazione con dati aggiuntivi per clienti e fornitori
- **Gestione sessioni**: Monitora le sessioni Supabase e aggiorna lo stato di conseguenza
- **Reset password**: Funzionalità completa di reset e aggiornamento password
- **Aggiornamento profilo**: Permette l'aggiornamento dei dati utente

**Esempio di utilizzo:**
```typescript
const { user, signUp, signIn, loading } = useAuth();

// Registrazione
const handleSignUp = async () => {
  const { error } = await signUp({
    email: 'user@example.com',
    password: 'password123',
    userType: 'client',
    companyName: 'Azienda SRL',
    firstName: 'Mario',
    lastName: 'Rossi',
    acceptTerms: true
  });
  
  if (error) {
    toast.error(error.message);
  }
};

// Login
const handleSignIn = async () => {
  const { error } = await signIn('user@example.com', 'password123');
  if (error) {
    toast.error(error.message);
  }
};
```

**Caratteristiche avanzate:**
- **Caricamento profilo intelligente**: Carica automaticamente i dati specifici del tipo utente
- **Gestione errori**: Gestione robusta degli errori con messaggi user-friendly
- **Performance ottimizzata**: Uso di useCallback per evitare re-render inutili
- **Sincronizzazione real-time**: Aggiornamenti automatici quando cambia lo stato di autenticazione

### ThemeProvider
**Percorso**: `src/contexts/ThemeContext.tsx`

```typescript
type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme
    return stored || 'system'
  })
  
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')
  
  useEffect(() => {
    const root = window.document.documentElement
    
    const updateTheme = () => {
      let resolvedTheme: 'light' | 'dark'
      
      if (theme === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
          ? 'dark' 
          : 'light'
      } else {
        resolvedTheme = theme
      }
      
      setActualTheme(resolvedTheme)
      
      root.classList.remove('light', 'dark')
      root.classList.add(resolvedTheme)
    }
    
    updateTheme()
    
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', updateTheme)
      return () => mediaQuery.removeEventListener('change', updateTheme)
    }
  }, [theme])
  
  useEffect(() => {
    localStorage.setItem('theme', theme)
  }, [theme])
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
```

### NotificationProvider
**Percorso**: `src/contexts/NotificationContext.tsx`

```typescript
interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { user } = useAuth()
  
  // Fetch notifications from database
  useEffect(() => {
    if (!user) return
    
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (data) setNotifications(data)
    }
    
    fetchNotifications()
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotifications(prev => [payload.new as Notification, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setNotifications(prev => 
            prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
          )
        } else if (payload.eventType === 'DELETE') {
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id))
        }
      })
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [user])
  
  const addNotification = async (notification: Omit<Notification, 'id' | 'created_at'>) => {
    if (!user) return
    
    const { data } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        user_id: user.id
      })
      .select()
      .single()
    
    if (data) {
      setNotifications(prev => [data, ...prev])
    }
  }
  
  const removeNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }
  
  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
    
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }
  
  const markAllAsRead = async () => {
    if (!user) return
    
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }
  
  const clearAll = async () => {
    if (!user) return
    
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
    
    setNotifications([])
  }
  
  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      markAsRead,
      markAllAsRead,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
```

## 🛠️ Utilities

### cn (Class Names)
**Percorso**: `src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### formatters
**Percorso**: `src/lib/formatters.ts`

```typescript
export const formatters = {
  currency: (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency
    }).format(amount)
  },
  
  date: (date: Date | string, format: 'short' | 'long' | 'time' = 'short') => {
    const d = typeof date === 'string' ? new Date(date) : date
    
    switch (format) {
      case 'short':
        return d.toLocaleDateString('it-IT')
      case 'long':
        return d.toLocaleDateString('it-IT', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      case 'time':
        return d.toLocaleTimeString('it-IT', {
          hour: '2-digit',
          minute: '2-digit'
        })
      default:
        return d.toLocaleDateString('it-IT')
    }
  },
  
  duration: (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours === 0) return `${mins}min`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}min`
  },
  
  fileSize: (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }
}
```

## 📝 Convenzioni

### Naming Conventions
- **Componenti**: PascalCase (`BookingCard`, `UserProfile`)
- **Hooks**: camelCase con prefisso `use` (`useAuth`, `useBookings`)
- **Utilities**: camelCase (`formatDate`, `validateEmail`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_FILE_SIZE`)
- **Types/Interfaces**: PascalCase (`User`, `BookingStatus`)

### File Organization
```
ComponentName/
├── index.ts          # Export principale
├── ComponentName.tsx # Componente principale
├── ComponentName.test.tsx # Test
├── ComponentName.stories.tsx # Storybook (opzionale)
└── types.ts          # Types specifici (se necessario)
```

### Props Interface
```typescript
// ✅ Buono
interface ComponentNameProps {
  // Props obbligatorie prima
  title: string
  onSubmit: (data: FormData) => void
  
  // Props opzionali dopo
  description?: string
  loading?: boolean
  className?: string
  
  // Children sempre ultimo
  children?: React.ReactNode
}

// ❌ Evitare
interface Props {
  // Nome generico
}
```

### Error Boundaries

#### SupabaseErrorBoundary
**Percorso**: `src/lib/errors/errorBoundary.tsx`

Componente React Error Boundary specializzato per la gestione degli errori Supabase nell'applicazione BookingHSE.

```typescript
interface SupabaseErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  hasError: boolean;
}

export class SupabaseErrorBoundary extends React.Component<
  SupabaseErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: SupabaseErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log automatico dell'errore
    logSupabaseError(error, 'ERROR_BOUNDARY_CATCH', {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'SupabaseErrorBoundary'
    });

    // Callback personalizzato
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={this.resetError}
          hasError={this.state.hasError}
        />
      );
    }

    return this.props.children;
  }
}
```

**Caratteristiche**:
- ✅ **Cattura errori non gestiti**: Previene crash dell'applicazione
- ✅ **Logging automatico**: Registra errori con contesto dettagliato
- ✅ **Fallback personalizzabile**: UI di errore configurabile
- ✅ **Reset automatico**: Possibilità di recupero senza reload
- ✅ **Integrazione Sentry**: Invio automatico errori a Sentry

**Utilizzo Base**:
```typescript
import { SupabaseErrorBoundary } from '../lib/errors';

function App() {
  return (
    <SupabaseErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bookings" element={<BookingsPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </SupabaseErrorBoundary>
  );
}
```

**Utilizzo Avanzato con Fallback Personalizzato**:
```typescript
import { SupabaseErrorBoundary } from '../lib/errors';

function CustomErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
          <h1 className="text-xl font-semibold text-gray-900">
            Oops! Qualcosa è andato storto
          </h1>
        </div>
        
        <p className="text-gray-600 mb-6">
          Si è verificato un errore imprevisto. Il nostro team è stato notificato.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-4">
            <summary className="cursor-pointer text-sm text-gray-500">
              Dettagli tecnici
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
              {error.message}
              {error.stack}
            </pre>
          </details>
        )}
        
        <div className="flex space-x-3">
          <Button onClick={resetError} variant="default">
            Riprova
          </Button>
          <Button 
            onClick={() => window.location.href = '/'} 
            variant="outline"
          >
            Torna alla Home
          </Button>
        </div>
      </div>
    </div>
  );
}

function BookingApp() {
  return (
    <SupabaseErrorBoundary 
      fallback={CustomErrorFallback}
      onError={(error, errorInfo) => {
        // Logging personalizzato
        console.error('Booking app error:', error);
        
        // Analytics personalizzati
        analytics.track('error_boundary_triggered', {
          error: error.message,
          component: errorInfo.componentStack
        });
      }}
    >
      <BookingProvider>
        <BookingDashboard />
      </BookingProvider>
    </SupabaseErrorBoundary>
  );
}
```

**Integrazione con Hook useSupabaseError**:
```typescript
import { SupabaseErrorBoundary, useSupabaseError } from '../lib/errors';

function BookingForm() {
  const { handleError, clearError } = useSupabaseError();
  const [booking, setBooking] = useState(null);

  const createBooking = async (data: BookingData) => {
    try {
      const { data: newBooking, error } = await supabase
        .from('bookings')
        .insert(data)
        .select()
        .single();

      if (error) {
        // Gestione errore controllata
        handleError(error, 'BOOKING_CREATION_FAILED');
        return;
      }

      setBooking(newBooking);
      clearError(); // Pulisce errori precedenti
    } catch (error) {
      // Errori non previsti vengono catturati dall'Error Boundary
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit(createBooking)}>
      {/* Form content */}
    </form>
  );
}

// Wrapping con Error Boundary
function BookingPage() {
  return (
    <SupabaseErrorBoundary>
      <BookingForm />
    </SupabaseErrorBoundary>
  );
}
```

**Pattern di Utilizzo Raccomandati**:

1. **App Level**: Wrapper principale per tutta l'applicazione
```typescript
<SupabaseErrorBoundary fallback={GlobalErrorFallback}>
  <App />
</SupabaseErrorBoundary>
```

2. **Feature Level**: Boundary per sezioni specifiche
```typescript
<SupabaseErrorBoundary fallback={BookingErrorFallback}>
  <BookingSection />
</SupabaseErrorBoundary>
```

3. **Component Level**: Per componenti critici
```typescript
<SupabaseErrorBoundary fallback={FormErrorFallback}>
  <CriticalForm />
</SupabaseErrorBoundary>
```

**Configurazione Avanzata**:
```typescript
// Hook per reset automatico su cambio route
function useErrorBoundaryReset() {
  const location = useLocation();
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    setResetKey(prev => prev + 1);
  }, [location.pathname]);

  return resetKey;
}

function AppWithAutoReset() {
  const resetKey = useErrorBoundaryReset();

  return (
    <SupabaseErrorBoundary 
      key={resetKey} // Reset automatico su cambio route
      resetOnPropsChange={true}
    >
      <Router>
        <Routes>
          {/* Routes */}
        </Routes>
      </Router>
    </SupabaseErrorBoundary>
  );
}
```

#### DefaultErrorFallback
**Percorso**: `src/lib/errors/DefaultErrorFallback.tsx`

Componente fallback predefinito utilizzato quando non viene specificato un fallback personalizzato.

```typescript
export function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Errore dell'Applicazione
          </CardTitle>
          <CardDescription>
            Si è verificato un errore imprevisto. Puoi provare a ricaricare la pagina.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4">
              <Label className="text-sm font-medium">Dettagli Errore:</Label>
              <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                {error.message}
              </pre>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex gap-2">
          <Button onClick={resetError} size="sm">
            Riprova
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            Ricarica Pagina
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

#### Esempi di Implementazione

**Error Boundary per Sezioni Critiche**:
```typescript
// Ogni sezione principale dovrebbe avere un Error Boundary
<SupabaseErrorBoundary fallback={BookingErrorFallback}>
  <BookingSection />
</SupabaseErrorBoundary>

<SupabaseErrorBoundary fallback={PaymentErrorFallback}>
  <PaymentSection />
</SupabaseErrorBoundary>
```

### Performance
- Usa `React.memo` per componenti che ricevono props stabili
- Usa `useMemo` per calcoli costosi
- Usa `useCallback` per funzioni passate come props
- Implementa lazy loading per componenti pesanti

```typescript
// ✅ Ottimizzato
const ExpensiveComponent = React.memo(({ data, onUpdate }) => {
  const processedData = useMemo(() => {
    return expensiveCalculation(data)
  }, [data])
  
  const handleUpdate = useCallback((id: string) => {
    onUpdate(id)
  }, [onUpdate])
  
  return (
    <div>
      {processedData.map(item => (
        <Item key={item.id} data={item} onUpdate={handleUpdate} />
      ))}
    </div>
  )
})
```

### Accessibility
- Sempre fornire `aria-label` per elementi interattivi
- Usare semantic HTML quando possibile
- Supportare navigazione da tastiera
- Fornire alternative testuali per contenuti visivi

```typescript
// ✅ Accessibile
<button
  aria-label="Elimina prenotazione"
  onClick={handleDelete}
  className="p-2 text-red-500 hover:bg-red-50"
>
  <Trash className="h-4 w-4" aria-hidden="true" />
</button>
```

---

**📚 Risorse Aggiuntive**
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/docs)
- [React Hook Form](https://react-hook-form.com/)