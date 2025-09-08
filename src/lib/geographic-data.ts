// Geographic data for North America
// Used for dropdown options and validation in profile forms

export interface GeographicOption {
  value: string;
  label: string;
  code?: string;
}

export interface StateProvince {
  value: string;
  label: string;
  code: string;
  country: string;
}

export interface City {
  value: string;
  label: string;
  stateProvince: string;
  country: string;
}

// North American Countries
export const NORTH_AMERICAN_COUNTRIES: GeographicOption[] = [
  { value: 'United States', label: 'United States', code: 'US' },
  { value: 'Canada', label: 'Canada', code: 'CA' },
  { value: 'Mexico', label: 'Mexico', code: 'MX' },
  { value: 'Other', label: 'Other North American Country', code: 'OTHER' },
];

// US States
export const US_STATES: StateProvince[] = [
  { value: 'Alabama', label: 'Alabama', code: 'AL', country: 'United States' },
  { value: 'Alaska', label: 'Alaska', code: 'AK', country: 'United States' },
  { value: 'Arizona', label: 'Arizona', code: 'AZ', country: 'United States' },
  {
    value: 'Arkansas',
    label: 'Arkansas',
    code: 'AR',
    country: 'United States',
  },
  {
    value: 'California',
    label: 'California',
    code: 'CA',
    country: 'United States',
  },
  {
    value: 'Colorado',
    label: 'Colorado',
    code: 'CO',
    country: 'United States',
  },
  {
    value: 'Connecticut',
    label: 'Connecticut',
    code: 'CT',
    country: 'United States',
  },
  {
    value: 'Delaware',
    label: 'Delaware',
    code: 'DE',
    country: 'United States',
  },
  { value: 'Florida', label: 'Florida', code: 'FL', country: 'United States' },
  { value: 'Georgia', label: 'Georgia', code: 'GA', country: 'United States' },
  { value: 'Hawaii', label: 'Hawaii', code: 'HI', country: 'United States' },
  { value: 'Idaho', label: 'Idaho', code: 'ID', country: 'United States' },
  {
    value: 'Illinois',
    label: 'Illinois',
    code: 'IL',
    country: 'United States',
  },
  { value: 'Indiana', label: 'Indiana', code: 'IN', country: 'United States' },
  { value: 'Iowa', label: 'Iowa', code: 'IA', country: 'United States' },
  { value: 'Kansas', label: 'Kansas', code: 'KS', country: 'United States' },
  {
    value: 'Kentucky',
    label: 'Kentucky',
    code: 'KY',
    country: 'United States',
  },
  {
    value: 'Louisiana',
    label: 'Louisiana',
    code: 'LA',
    country: 'United States',
  },
  { value: 'Maine', label: 'Maine', code: 'ME', country: 'United States' },
  {
    value: 'Maryland',
    label: 'Maryland',
    code: 'MD',
    country: 'United States',
  },
  {
    value: 'Massachusetts',
    label: 'Massachusetts',
    code: 'MA',
    country: 'United States',
  },
  {
    value: 'Michigan',
    label: 'Michigan',
    code: 'MI',
    country: 'United States',
  },
  {
    value: 'Minnesota',
    label: 'Minnesota',
    code: 'MN',
    country: 'United States',
  },
  {
    value: 'Mississippi',
    label: 'Mississippi',
    code: 'MS',
    country: 'United States',
  },
  {
    value: 'Missouri',
    label: 'Missouri',
    code: 'MO',
    country: 'United States',
  },
  { value: 'Montana', label: 'Montana', code: 'MT', country: 'United States' },
  {
    value: 'Nebraska',
    label: 'Nebraska',
    code: 'NE',
    country: 'United States',
  },
  { value: 'Nevada', label: 'Nevada', code: 'NV', country: 'United States' },
  {
    value: 'New Hampshire',
    label: 'New Hampshire',
    code: 'NH',
    country: 'United States',
  },
  {
    value: 'New Jersey',
    label: 'New Jersey',
    code: 'NJ',
    country: 'United States',
  },
  {
    value: 'New Mexico',
    label: 'New Mexico',
    code: 'NM',
    country: 'United States',
  },
  {
    value: 'New York',
    label: 'New York',
    code: 'NY',
    country: 'United States',
  },
  {
    value: 'North Carolina',
    label: 'North Carolina',
    code: 'NC',
    country: 'United States',
  },
  {
    value: 'North Dakota',
    label: 'North Dakota',
    code: 'ND',
    country: 'United States',
  },
  { value: 'Ohio', label: 'Ohio', code: 'OH', country: 'United States' },
  {
    value: 'Oklahoma',
    label: 'Oklahoma',
    code: 'OK',
    country: 'United States',
  },
  { value: 'Oregon', label: 'Oregon', code: 'OR', country: 'United States' },
  {
    value: 'Pennsylvania',
    label: 'Pennsylvania',
    code: 'PA',
    country: 'United States',
  },
  {
    value: 'Rhode Island',
    label: 'Rhode Island',
    code: 'RI',
    country: 'United States',
  },
  {
    value: 'South Carolina',
    label: 'South Carolina',
    code: 'SC',
    country: 'United States',
  },
  {
    value: 'South Dakota',
    label: 'South Dakota',
    code: 'SD',
    country: 'United States',
  },
  {
    value: 'Tennessee',
    label: 'Tennessee',
    code: 'TN',
    country: 'United States',
  },
  { value: 'Texas', label: 'Texas', code: 'TX', country: 'United States' },
  { value: 'Utah', label: 'Utah', code: 'UT', country: 'United States' },
  { value: 'Vermont', label: 'Vermont', code: 'VT', country: 'United States' },
  {
    value: 'Virginia',
    label: 'Virginia',
    code: 'VA',
    country: 'United States',
  },
  {
    value: 'Washington',
    label: 'Washington',
    code: 'WA',
    country: 'United States',
  },
  {
    value: 'West Virginia',
    label: 'West Virginia',
    code: 'WV',
    country: 'United States',
  },
  {
    value: 'Wisconsin',
    label: 'Wisconsin',
    code: 'WI',
    country: 'United States',
  },
  { value: 'Wyoming', label: 'Wyoming', code: 'WY', country: 'United States' },
  {
    value: 'District of Columbia',
    label: 'District of Columbia',
    code: 'DC',
    country: 'United States',
  },
];

// Canadian Provinces and Territories
export const CANADIAN_PROVINCES: StateProvince[] = [
  { value: 'Alberta', label: 'Alberta', code: 'AB', country: 'Canada' },
  {
    value: 'British Columbia',
    label: 'British Columbia',
    code: 'BC',
    country: 'Canada',
  },
  { value: 'Manitoba', label: 'Manitoba', code: 'MB', country: 'Canada' },
  {
    value: 'New Brunswick',
    label: 'New Brunswick',
    code: 'NB',
    country: 'Canada',
  },
  {
    value: 'Newfoundland and Labrador',
    label: 'Newfoundland and Labrador',
    code: 'NL',
    country: 'Canada',
  },
  {
    value: 'Northwest Territories',
    label: 'Northwest Territories',
    code: 'NT',
    country: 'Canada',
  },
  { value: 'Nova Scotia', label: 'Nova Scotia', code: 'NS', country: 'Canada' },
  { value: 'Nunavut', label: 'Nunavut', code: 'NU', country: 'Canada' },
  { value: 'Ontario', label: 'Ontario', code: 'ON', country: 'Canada' },
  {
    value: 'Prince Edward Island',
    label: 'Prince Edward Island',
    code: 'PE',
    country: 'Canada',
  },
  { value: 'Quebec', label: 'Quebec', code: 'QC', country: 'Canada' },
  {
    value: 'Saskatchewan',
    label: 'Saskatchewan',
    code: 'SK',
    country: 'Canada',
  },
  { value: 'Yukon', label: 'Yukon', code: 'YT', country: 'Canada' },
];

// Mexican States
export const MEXICAN_STATES: StateProvince[] = [
  {
    value: 'Aguascalientes',
    label: 'Aguascalientes',
    code: 'AG',
    country: 'Mexico',
  },
  {
    value: 'Baja California',
    label: 'Baja California',
    code: 'BC',
    country: 'Mexico',
  },
  {
    value: 'Baja California Sur',
    label: 'Baja California Sur',
    code: 'BS',
    country: 'Mexico',
  },
  { value: 'Campeche', label: 'Campeche', code: 'CM', country: 'Mexico' },
  { value: 'Chiapas', label: 'Chiapas', code: 'CS', country: 'Mexico' },
  { value: 'Chihuahua', label: 'Chihuahua', code: 'CH', country: 'Mexico' },
  { value: 'Coahuila', label: 'Coahuila', code: 'CO', country: 'Mexico' },
  { value: 'Colima', label: 'Colima', code: 'CL', country: 'Mexico' },
  { value: 'Durango', label: 'Durango', code: 'DG', country: 'Mexico' },
  { value: 'Guanajuato', label: 'Guanajuato', code: 'GT', country: 'Mexico' },
  { value: 'Guerrero', label: 'Guerrero', code: 'GR', country: 'Mexico' },
  { value: 'Hidalgo', label: 'Hidalgo', code: 'HG', country: 'Mexico' },
  { value: 'Jalisco', label: 'Jalisco', code: 'JA', country: 'Mexico' },
  { value: 'Mexico', label: 'Mexico', code: 'MX', country: 'Mexico' },
  { value: 'Michoacan', label: 'Michoacan', code: 'MI', country: 'Mexico' },
  { value: 'Morelos', label: 'Morelos', code: 'MO', country: 'Mexico' },
  { value: 'Nayarit', label: 'Nayarit', code: 'NA', country: 'Mexico' },
  { value: 'Nuevo Leon', label: 'Nuevo Leon', code: 'NL', country: 'Mexico' },
  { value: 'Oaxaca', label: 'Oaxaca', code: 'OA', country: 'Mexico' },
  { value: 'Puebla', label: 'Puebla', code: 'PU', country: 'Mexico' },
  { value: 'Queretaro', label: 'Queretaro', code: 'QE', country: 'Mexico' },
  {
    value: 'Quintana Roo',
    label: 'Quintana Roo',
    code: 'QR',
    country: 'Mexico',
  },
  {
    value: 'San Luis Potosi',
    label: 'San Luis Potosi',
    code: 'SL',
    country: 'Mexico',
  },
  { value: 'Sinaloa', label: 'Sinaloa', code: 'SI', country: 'Mexico' },
  { value: 'Sonora', label: 'Sonora', code: 'SO', country: 'Mexico' },
  { value: 'Tabasco', label: 'Tabasco', code: 'TB', country: 'Mexico' },
  { value: 'Tamaulipas', label: 'Tamaulipas', code: 'TM', country: 'Mexico' },
  { value: 'Tlaxcala', label: 'Tlaxcala', code: 'TL', country: 'Mexico' },
  { value: 'Veracruz', label: 'Veracruz', code: 'VE', country: 'Mexico' },
  { value: 'Yucatan', label: 'Yucatan', code: 'YU', country: 'Mexico' },
  { value: 'Zacatecas', label: 'Zacatecas', code: 'ZA', country: 'Mexico' },
];

// Combined states and provinces for all North American countries
export const ALL_STATES_PROVINCES: StateProvince[] = [
  ...US_STATES,
  ...CANADIAN_PROVINCES,
  ...MEXICAN_STATES,
];

// Helper functions
export const getStatesProvincesByCountry = (
  country: string
): StateProvince[] => {
  switch (country) {
    case 'United States':
      return US_STATES;
    case 'Canada':
      return CANADIAN_PROVINCES;
    case 'Mexico':
      return MEXICAN_STATES;
    default:
      return [];
  }
};

export const getStateProvinceByCode = (
  code: string,
  country: string
): StateProvince | undefined => {
  const statesProvinces = getStatesProvincesByCountry(country);
  return statesProvinces.find((sp) => sp.code === code);
};

export const getStateProvinceByValue = (
  value: string,
  country: string
): StateProvince | undefined => {
  const statesProvinces = getStatesProvincesByCountry(country);
  return statesProvinces.find((sp) => sp.value === value);
};

// Major cities for each state/province (sample data - can be expanded)
export const MAJOR_CITIES: { [key: string]: string[] } = {
  // US States
  California: [
    'Los Angeles',
    'San Francisco',
    'San Diego',
    'San Jose',
    'Fresno',
    'Sacramento',
    'Long Beach',
    'Oakland',
    'Bakersfield',
    'Anaheim',
  ],
  Texas: [
    'Houston',
    'San Antonio',
    'Dallas',
    'Austin',
    'Fort Worth',
    'El Paso',
    'Arlington',
    'Corpus Christi',
    'Plano',
    'Lubbock',
  ],
  'New York': [
    'New York City',
    'Buffalo',
    'Rochester',
    'Yonkers',
    'Syracuse',
    'Albany',
    'New Rochelle',
    'Mount Vernon',
    'Schenectady',
    'Utica',
  ],
  Florida: [
    'Jacksonville',
    'Miami',
    'Tampa',
    'Orlando',
    'St. Petersburg',
    'Hialeah',
    'Tallahassee',
    'Fort Lauderdale',
    'Port St. Lucie',
    'Cape Coral',
  ],
  Illinois: [
    'Chicago',
    'Aurora',
    'Rockford',
    'Joliet',
    'Naperville',
    'Springfield',
    'Peoria',
    'Elgin',
    'Waukegan',
    'Cicero',
  ],

  // Canadian Provinces
  Ontario: [
    'Toronto',
    'Ottawa',
    'Mississauga',
    'Brampton',
    'Hamilton',
    'London',
    'Markham',
    'Vaughan',
    'Kitchener',
    'Windsor',
  ],
  Quebec: [
    'Montreal',
    'Quebec City',
    'Laval',
    'Gatineau',
    'Longueuil',
    'Sherbrooke',
    'Saguenay',
    'Levis',
    'Trois-Rivieres',
    'Terrebonne',
  ],
  'British Columbia': [
    'Vancouver',
    'Surrey',
    'Burnaby',
    'Richmond',
    'Abbotsford',
    'Coquitlam',
    'Saanich',
    'Delta',
    'Kelowna',
    'Langley',
  ],
  Alberta: [
    'Calgary',
    'Edmonton',
    'Red Deer',
    'Lethbridge',
    'St. Albert',
    'Medicine Hat',
    'Grande Prairie',
    'Airdrie',
    'Spruce Grove',
    'Leduc',
  ],

  // Mexican States
  Jalisco: [
    'Guadalajara',
    'Zapopan',
    'Tlaquepaque',
    'Tonala',
    'Puerto Vallarta',
    'Lagos de Moreno',
    'Ocotlan',
    'Tepatitlan',
    'Arandas',
    'San Juan de los Lagos',
  ],
  Mexico: [
    'Ecatepec',
    'Nezahualcoyotl',
    'Naucalpan',
    'Tlalnepantla',
    'Chimalhuacan',
    'Atizapan',
    'Cuautitlan Izcalli',
    'Tultitlan',
    'Ixtapaluca',
    'Nicolas Romero',
  ],
  'Nuevo Leon': [
    'Monterrey',
    'Guadalupe',
    'Apodaca',
    'San Nicolas de los Garza',
    'General Escobedo',
    'Santa Catarina',
    'Juarez',
    'Garcia',
    'Salinas Victoria',
    'Cadereyta Jimenez',
  ],
};

export const getCitiesByStateProvince = (stateProvince: string): string[] => {
  return MAJOR_CITIES[stateProvince] || [];
};

export const getCitiesByCountry = (country: string): string[] => {
  const statesProvinces = getStatesProvincesByCountry(country);
  const allCities: string[] = [];

  statesProvinces.forEach((state) => {
    const cities = getCitiesByStateProvince(state.value);
    allCities.push(...cities);
  });

  return allCities;
};
