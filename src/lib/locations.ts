export type RegionInfo = {
  name: string
  capitals: string[]
}

export const REGIONS: RegionInfo[] = [
  { name: 'Lombardia', capitals: ['Milano','Bergamo','Brescia','Como','Cremona','Lecco','Lodi','Mantova','Monza','Pavia','Sondrio','Varese'] },
  { name: 'Piemonte', capitals: ['Torino','Alessandria','Asti','Biella','Cuneo','Novara','Verbania','Vercelli'] },
  { name: 'Veneto', capitals: ['Venezia','Belluno','Padova','Rovigo','Treviso','Verona','Vicenza'] },
  { name: 'Emilia-Romagna', capitals: ['Bologna','Ferrara','Forlì','Modena','Parma','Piacenza','Ravenna','Reggio Emilia','Rimini'] },
  { name: 'Toscana', capitals: ['Firenze','Arezzo','Grosseto','Livorno','Lucca','Massa','Pisa','Pistoia','Prato','Siena'] },
  { name: 'Lazio', capitals: ['Roma','Frosinone','Latina','Rieti','Viterbo'] },
  { name: 'Liguria', capitals: ['Genova','Imperia','La Spezia','Savona'] },
  { name: 'Marche', capitals: ['Ancona','Ascoli Piceno','Fermo','Macerata','Pesaro'] },
  { name: 'Umbria', capitals: ['Perugia','Terni'] },
  { name: 'Abruzzo', capitals: ["L'Aquila",'Chieti','Pescara','Teramo'] },
  { name: 'Molise', capitals: ['Campobasso','Isernia'] },
  { name: 'Campania', capitals: ['Napoli','Avellino','Benevento','Caserta','Salerno'] },
  { name: 'Puglia', capitals: ['Bari','Barletta','Brindisi','Foggia','Lecce','Taranto','Andria','Trani'] },
  { name: 'Calabria', capitals: ['Catanzaro','Cosenza','Crotone','Reggio Calabria','Vibo Valentia'] },
  { name: 'Sicilia', capitals: ['Palermo','Agrigento','Caltanissetta','Catania','Enna','Messina','Ragusa','Siracusa','Trapani'] },
  { name: 'Sardegna', capitals: ['Cagliari','Sassari','Nuoro','Oristano'] },
  { name: 'Trentino-Alto Adige', capitals: ['Trento','Bolzano'] },
  { name: 'Friuli-Venezia Giulia', capitals: ['Trieste','Gorizia','Pordenone','Udine'] },
  { name: 'Basilicata', capitals: ['Potenza','Matera'] },
  { name: "Valle d'Aosta", capitals: ['Aosta'] }
]

export function getRegionByName(name: string): RegionInfo | undefined {
  const n = name.trim().toLowerCase()
  return REGIONS.find(r => r.name.toLowerCase() === n)
}

export function isRegionName(name: string): boolean {
  return !!getRegionByName(name)
}

export function getRegionCapitals(name: string): string[] {
  const r = getRegionByName(name)
  return r ? r.capitals : []
}