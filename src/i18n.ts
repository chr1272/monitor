export type Language = 'en' | 'de' | 'fr' | 'es' | 'it'

export type MetricKey = 'temp' | 'hum' | 'pres' | 'gas' | 'laeq1m'

export type TimeRangeKey =
  | 'all'
  | 'last7Days'
  | 'last24Hours'
  | 'last6Hours'
  | 'thisWeek'
  | 'lastWeek'
  | 'today'
  | 'yesterday'

export type Connectivity = 'Online' | 'Offline' | 'Unknown'

export type TimeRangeOption = {
  key: TimeRangeKey
  label: string
}

export type Translation = {
  stationType: string
  stationName: string
  pageTitle: string
  siteName: string
  viewTitle: string
  standbyMode: string
  language: string
  signOut: string
  decreaseFontSize: string
  increaseFontSize: string
  liveStatus: string
  radar: string
  sonometer: string
  lastHeartbeat: string
  noDataYet: string
  trafficFeed: string
  noEventsAvailable: string
  speed: string
  direction: string
  peakDba: string
  environmentalTelemetry: string
  latest: string
  resetZoom: string
  timespan: string
  zoomHint: string
  checkingAuthentication: string
  firebaseConfigMissing: string
  firebaseConfigDescription: string
  signInEyebrow: string
  signInHeading: string
  signInDescription: string
  signInWithGoogle: string
  signingIn: string
  notAvailable: string
  connectivity: Record<Connectivity, string>
  metricLabels: Record<MetricKey, string>
  timeRanges: Record<TimeRangeKey, string>
  authErrors: {
    popupClosed: string
    popupBlocked: string
    unauthorizedDomain: string
    operationNotAllowed: string
    invalidApiKey: string
    failed: string
  }
}

export const LANGUAGE_STORAGE_KEY = 'dashboard-language'

export const LANGUAGE_OPTIONS: Array<{ value: Language; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Francais' },
  { value: 'es', label: 'Espanol' },
  { value: 'it', label: 'Italiano' },
]

export const LANGUAGE_LOCALES: Record<Language, string> = {
  en: 'en-GB',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
}

export const TRANSLATIONS: Record<Language, Translation> = {
  en: {
    stationType: 'Traffic Monitoring Station',
    stationName: 'Prototype',
    pageTitle: 'Traffic Monitoring Station - Prototype Dashboard',
    siteName: 'Traffic Monitoring Station - Prototype Dashboard',
    viewTitle: 'Live Operations View',
    standbyMode: 'Standby mode (no Firestore reads)',
    language: 'Language',
    signOut: 'Sign out',
    decreaseFontSize: 'Decrease font size',
    increaseFontSize: 'Increase font size',
    liveStatus: 'Live Status',
    radar: 'Radar',
    sonometer: 'Sonometer',
    lastHeartbeat: 'Last heartbeat',
    noDataYet: 'No data yet',
    trafficFeed: 'Traffic Feed',
    noEventsAvailable: 'No events available.',
    speed: 'Speed',
    direction: 'Direction',
    peakDba: 'Peak dBA',
    environmentalTelemetry: 'Environmental Telemetry',
    latest: 'Latest',
    resetZoom: 'Reset zoom',
    timespan: 'timespan',
    zoomHint: 'Shift+scroll to zoom · drag to pan',
    checkingAuthentication: 'Checking authentication...',
    firebaseConfigMissing: 'Firebase Config Missing',
    firebaseConfigDescription: 'Add the missing variables to your local .env file and to GitHub Secrets for CI deploys.',
    signInEyebrow: 'Traffic Monitoring Station - Prototype',
    signInHeading: 'Real-time Traffic and Environment Monitor',
    signInDescription: 'Sign in with Google to access live telemetry from Firestore. Access is restricted by Firestore security rules to authenticated users only.',
    signInWithGoogle: 'Sign in with Google',
    signingIn: 'Signing in...',
    notAvailable: 'N/A',
    connectivity: { Online: 'Online', Offline: 'Offline', Unknown: 'Unknown' },
    metricLabels: {
      temp: 'Temperature',
      hum: 'Humidity',
      pres: 'Pressure',
      gas: 'Gas',
      laeq1m: 'LAeq, 1m',
    },
    timeRanges: {
      all: 'All loaded records',
      last7Days: 'Last 7 days',
      last24Hours: 'Last 24 h',
      last6Hours: 'Last 6 h',
      thisWeek: 'This week',
      lastWeek: 'Last week',
      today: 'Today',
      yesterday: 'Yesterday',
    },
    authErrors: {
      popupClosed: 'Sign-in popup was closed before login completed.',
      popupBlocked: 'Popup was blocked by the browser. Allow popups for this site and try again.',
      unauthorizedDomain: 'This domain is not authorized in Firebase Auth. Add monitor.pixelking.io to Authorized domains.',
      operationNotAllowed: 'Google sign-in is not enabled in Firebase Authentication -> Sign-in method.',
      invalidApiKey: 'Firebase API key is invalid. Check VITE_FIREBASE_API_KEY in your GitHub secrets.',
      failed: 'Authentication failed. Please check Firebase Auth settings and try again.',
    },
  },
  de: {
    stationType: 'Verkehrsueberwachungsstation',
    stationName: 'Prototyp',
    pageTitle: 'Verkehrsueberwachungsstation - Prototyp Dashboard',
    siteName: 'Verkehrsueberwachungsstation - Prototyp Dashboard',
    viewTitle: 'Live-Betriebsansicht',
    standbyMode: 'Standby-Modus (keine Firestore-Lesezugriffe)',
    language: 'Sprache',
    signOut: 'Abmelden',
    decreaseFontSize: 'Schriftgroesse verkleinern',
    increaseFontSize: 'Schriftgroesse vergroessern',
    liveStatus: 'Live-Status',
    radar: 'Radar',
    sonometer: 'Sonometer',
    lastHeartbeat: 'Letzter Heartbeat',
    noDataYet: 'Noch keine Daten',
    trafficFeed: 'Verkehrs-Feed',
    noEventsAvailable: 'Keine Ereignisse verfuegbar.',
    speed: 'Geschwindigkeit',
    direction: 'Richtung',
    peakDba: 'Spitzenwert dBA',
    environmentalTelemetry: 'Umwelttelemetrie',
    latest: 'Aktuell',
    resetZoom: 'Zoom zuruecksetzen',
    timespan: 'Zeitraum',
    zoomHint: 'Umschalt+Scroll zum Zoomen · ziehen zum Verschieben',
    checkingAuthentication: 'Authentifizierung wird geprueft...',
    firebaseConfigMissing: 'Firebase-Konfiguration fehlt',
    firebaseConfigDescription: 'Fuege die fehlenden Variablen in deine lokale .env-Datei und in die GitHub-Secrets fuer CI-Deploys ein.',
    signInEyebrow: 'Verkehrsueberwachungsstation - Prototyp',
    signInHeading: 'Echtzeit-Monitor fuer Verkehr und Umwelt',
    signInDescription: 'Melde dich mit Google an, um Live-Telemetrie aus Firestore zu sehen. Der Zugriff ist durch Firestore-Sicherheitsregeln auf authentifizierte Nutzer beschraenkt.',
    signInWithGoogle: 'Mit Google anmelden',
    signingIn: 'Anmeldung laeuft...',
    notAvailable: 'k. A.',
    connectivity: { Online: 'Online', Offline: 'Offline', Unknown: 'Unbekannt' },
    metricLabels: {
      temp: 'Temperatur',
      hum: 'Luftfeuchtigkeit',
      pres: 'Luftdruck',
      gas: 'Gas',
      laeq1m: 'LAeq, 1m',
    },
    timeRanges: {
      all: 'Alle geladenen Datensaetze',
      last7Days: 'Letzte 7 Tage',
      last24Hours: 'Letzte 24 h',
      last6Hours: 'Letzte 6 h',
      thisWeek: 'Diese Woche',
      lastWeek: 'Letzte Woche',
      today: 'Heute',
      yesterday: 'Gestern',
    },
    authErrors: {
      popupClosed: 'Das Anmelde-Popup wurde geschlossen, bevor die Anmeldung abgeschlossen war.',
      popupBlocked: 'Das Popup wurde vom Browser blockiert. Erlaube Popups fuer diese Seite und versuche es erneut.',
      unauthorizedDomain: 'Diese Domain ist in Firebase Auth nicht autorisiert. Fuege monitor.pixelking.io zu den autorisierten Domains hinzu.',
      operationNotAllowed: 'Google-Anmeldung ist in Firebase Authentication -> Sign-in method nicht aktiviert.',
      invalidApiKey: 'Der Firebase-API-Schluessel ist ungueltig. Pruefe VITE_FIREBASE_API_KEY in deinen GitHub-Secrets.',
      failed: 'Authentifizierung fehlgeschlagen. Bitte pruefe die Firebase-Auth-Einstellungen.',
    },
  },
  fr: {
    stationType: 'Station de surveillance du trafic',
    stationName: 'Prototype',
    pageTitle: 'Station de surveillance du trafic - Prototype Dashboard',
    siteName: 'Station de surveillance du trafic - Prototype Dashboard',
    viewTitle: 'Vue operations en direct',
    standbyMode: 'Mode veille (aucune lecture Firestore)',
    language: 'Langue',
    signOut: 'Se deconnecter',
    decreaseFontSize: 'Diminuer la taille du texte',
    increaseFontSize: 'Augmenter la taille du texte',
    liveStatus: 'Statut en direct',
    radar: 'Radar',
    sonometer: 'Sonometer',
    lastHeartbeat: 'Dernier heartbeat',
    noDataYet: 'Pas encore de donnees',
    trafficFeed: 'Flux trafic',
    noEventsAvailable: 'Aucun evenement disponible.',
    speed: 'Vitesse',
    direction: 'Direction',
    peakDba: 'Pic dBA',
    environmentalTelemetry: 'Telemetrie environnementale',
    latest: 'Derniere valeur',
    resetZoom: 'Reinitialiser le zoom',
    timespan: 'periode',
    zoomHint: 'Maj+molette pour zoomer · glisser pour deplacer',
    checkingAuthentication: 'Verification de l authentification...',
    firebaseConfigMissing: 'Configuration Firebase manquante',
    firebaseConfigDescription: 'Ajoutez les variables manquantes dans votre fichier .env local et dans les secrets GitHub pour les deploiements CI.',
    signInEyebrow: 'Station de surveillance du trafic - Prototype',
    signInHeading: 'Moniteur trafic et environnement en temps reel',
    signInDescription: 'Connectez-vous avec Google pour acceder a la telemetrie Firestore en direct. L acces est reserve aux utilisateurs authentifies.',
    signInWithGoogle: 'Se connecter avec Google',
    signingIn: 'Connexion en cours...',
    notAvailable: 'N/D',
    connectivity: { Online: 'En ligne', Offline: 'Hors ligne', Unknown: 'Inconnu' },
    metricLabels: {
      temp: 'Temperature',
      hum: 'Humidite',
      pres: 'Pression',
      gas: 'Gaz',
      laeq1m: 'LAeq, 1m',
    },
    timeRanges: {
      all: 'Tous les enregistrements charges',
      last7Days: '7 derniers jours',
      last24Hours: 'Dernieres 24 h',
      last6Hours: 'Dernieres 6 h',
      thisWeek: 'Cette semaine',
      lastWeek: 'Semaine derniere',
      today: 'Aujourd hui',
      yesterday: 'Hier',
    },
    authErrors: {
      popupClosed: 'La fenetre de connexion a ete fermee avant la fin de l authentification.',
      popupBlocked: 'La fenetre popup a ete bloquee par le navigateur. Autorisez les popups pour ce site.',
      unauthorizedDomain: 'Ce domaine n est pas autorise dans Firebase Auth. Ajoutez monitor.pixelking.io aux domaines autorises.',
      operationNotAllowed: 'La connexion Google n est pas activee dans Firebase Authentication -> Sign-in method.',
      invalidApiKey: 'La cle API Firebase est invalide. Verifiez VITE_FIREBASE_API_KEY dans vos secrets GitHub.',
      failed: 'Echec de l authentification. Verifiez la configuration Firebase Auth.',
    },
  },
  es: {
    stationType: 'Estacion de monitoreo de trafico',
    stationName: 'Prototipo',
    pageTitle: 'Estacion de monitoreo de trafico - Prototipo Dashboard',
    siteName: 'Estacion de monitoreo de trafico - Prototipo Dashboard',
    viewTitle: 'Vista operativa en vivo',
    standbyMode: 'Modo en espera (sin lecturas de Firestore)',
    language: 'Idioma',
    signOut: 'Cerrar sesion',
    decreaseFontSize: 'Disminuir tamano de fuente',
    increaseFontSize: 'Aumentar tamano de fuente',
    liveStatus: 'Estado en vivo',
    radar: 'Radar',
    sonometer: 'Sonometer',
    lastHeartbeat: 'Ultimo heartbeat',
    noDataYet: 'Sin datos aun',
    trafficFeed: 'Flujo de trafico',
    noEventsAvailable: 'No hay eventos disponibles.',
    speed: 'Velocidad',
    direction: 'Direccion',
    peakDba: 'Pico dBA',
    environmentalTelemetry: 'Telemetria ambiental',
    latest: 'Ultimo valor',
    resetZoom: 'Restablecer zoom',
    timespan: 'periodo',
    zoomHint: 'Mayus+rueda para zoom · arrastrar para desplazar',
    checkingAuthentication: 'Comprobando autenticacion...',
    firebaseConfigMissing: 'Falta configuracion de Firebase',
    firebaseConfigDescription: 'Agrega las variables faltantes a tu archivo .env local y a los secretos de GitHub para despliegues CI.',
    signInEyebrow: 'Estacion de monitoreo de trafico - Prototipo',
    signInHeading: 'Monitor de trafico y entorno en tiempo real',
    signInDescription: 'Inicia sesion con Google para acceder a la telemetria en vivo desde Firestore. El acceso esta restringido a usuarios autenticados.',
    signInWithGoogle: 'Iniciar sesion con Google',
    signingIn: 'Iniciando sesion...',
    notAvailable: 'N/D',
    connectivity: { Online: 'En linea', Offline: 'Sin conexion', Unknown: 'Desconocido' },
    metricLabels: {
      temp: 'Temperatura',
      hum: 'Humedad',
      pres: 'Presion',
      gas: 'Gas',
      laeq1m: 'LAeq, 1m',
    },
    timeRanges: {
      all: 'Todos los registros cargados',
      last7Days: 'Ultimos 7 dias',
      last24Hours: 'Ultimas 24 h',
      last6Hours: 'Ultimas 6 h',
      thisWeek: 'Esta semana',
      lastWeek: 'Semana pasada',
      today: 'Hoy',
      yesterday: 'Ayer',
    },
    authErrors: {
      popupClosed: 'La ventana de acceso se cerro antes de completar el inicio de sesion.',
      popupBlocked: 'El navegador bloqueo la ventana emergente. Permite popups para este sitio e intentalo de nuevo.',
      unauthorizedDomain: 'Este dominio no esta autorizado en Firebase Auth. Agrega monitor.pixelking.io a los dominios autorizados.',
      operationNotAllowed: 'El acceso con Google no esta habilitado en Firebase Authentication -> Sign-in method.',
      invalidApiKey: 'La clave API de Firebase no es valida. Revisa VITE_FIREBASE_API_KEY en tus secretos de GitHub.',
      failed: 'Error de autenticacion. Revisa la configuracion de Firebase Auth.',
    },
  },
  it: {
    stationType: 'Stazione di monitoraggio del traffico',
    stationName: 'Prototipo',
    pageTitle: 'Stazione di monitoraggio del traffico - Prototipo Dashboard',
    siteName: 'Stazione di monitoraggio del traffico - Prototipo Dashboard',
    viewTitle: 'Vista operativa live',
    standbyMode: 'Modalita standby (nessuna lettura Firestore)',
    language: 'Lingua',
    signOut: 'Disconnetti',
    decreaseFontSize: 'Riduci dimensione testo',
    increaseFontSize: 'Aumenta dimensione testo',
    liveStatus: 'Stato live',
    radar: 'Radar',
    sonometer: 'Sonometer',
    lastHeartbeat: 'Ultimo heartbeat',
    noDataYet: 'Nessun dato disponibile',
    trafficFeed: 'Feed traffico',
    noEventsAvailable: 'Nessun evento disponibile.',
    speed: 'Velocita',
    direction: 'Direzione',
    peakDba: 'Picco dBA',
    environmentalTelemetry: 'Telemetria ambientale',
    latest: 'Ultimo valore',
    resetZoom: 'Reimposta zoom',
    timespan: 'intervallo',
    zoomHint: 'Shift+rotella per zoom · trascina per spostare',
    checkingAuthentication: 'Controllo autenticazione...',
    firebaseConfigMissing: 'Configurazione Firebase mancante',
    firebaseConfigDescription: 'Aggiungi le variabili mancanti al file .env locale e ai secrets GitHub per i deploy CI.',
    signInEyebrow: 'Stazione di monitoraggio del traffico - Prototipo',
    signInHeading: 'Monitor traffico e ambiente in tempo reale',
    signInDescription: 'Accedi con Google per visualizzare la telemetria live da Firestore. Accesso riservato agli utenti autenticati.',
    signInWithGoogle: 'Accedi con Google',
    signingIn: 'Accesso in corso...',
    notAvailable: 'N/D',
    connectivity: { Online: 'Online', Offline: 'Offline', Unknown: 'Sconosciuto' },
    metricLabels: {
      temp: 'Temperatura',
      hum: 'Umidita',
      pres: 'Pressione',
      gas: 'Gas',
      laeq1m: 'LAeq, 1m',
    },
    timeRanges: {
      all: 'Tutti i record caricati',
      last7Days: 'Ultimi 7 giorni',
      last24Hours: 'Ultime 24 h',
      last6Hours: 'Ultime 6 h',
      thisWeek: 'Questa settimana',
      lastWeek: 'Settimana scorsa',
      today: 'Oggi',
      yesterday: 'Ieri',
    },
    authErrors: {
      popupClosed: 'La finestra di accesso e stata chiusa prima del completamento.',
      popupBlocked: 'La finestra popup e stata bloccata dal browser. Consenti i popup per questo sito e riprova.',
      unauthorizedDomain: 'Questo dominio non e autorizzato in Firebase Auth. Aggiungi monitor.pixelking.io ai domini autorizzati.',
      operationNotAllowed: 'L accesso Google non e abilitato in Firebase Authentication -> Sign-in method.',
      invalidApiKey: 'La chiave API Firebase non e valida. Controlla VITE_FIREBASE_API_KEY nei secrets GitHub.',
      failed: 'Autenticazione non riuscita. Verifica la configurazione Firebase Auth.',
    },
  },
}

export function getTimeRangeOptions(translation: Translation): TimeRangeOption[] {
  return [
    { key: 'all', label: translation.timeRanges.all },
    { key: 'last7Days', label: translation.timeRanges.last7Days },
    { key: 'last24Hours', label: translation.timeRanges.last24Hours },
    { key: 'last6Hours', label: translation.timeRanges.last6Hours },
    { key: 'thisWeek', label: translation.timeRanges.thisWeek },
    { key: 'lastWeek', label: translation.timeRanges.lastWeek },
    { key: 'today', label: translation.timeRanges.today },
    { key: 'yesterday', label: translation.timeRanges.yesterday },
  ]
}

export function getInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored === 'en' || stored === 'de' || stored === 'fr' || stored === 'es' || stored === 'it') {
    return stored
  }

  const browser = window.navigator.language.toLowerCase()
  if (browser.startsWith('de')) return 'de'
  if (browser.startsWith('fr')) return 'fr'
  if (browser.startsWith('es')) return 'es'
  if (browser.startsWith('it')) return 'it'

  return 'en'
}
