export interface City {
  name: string;
  color: string;
  population: number;
}

export const cities: City[] = [
  {
    name: "Paris",
    color: "bg-gradient-to-br from-red-500 to-pink-600",
    population: 2161000,
  },
  {
    name: "Marseille",
    color: "bg-gradient-to-br from-blue-500 to-cyan-600",
    population: 870321,
  },
  {
    name: "Lyon",
    color: "bg-gradient-to-br from-green-500 to-emerald-600",
    population: 522250,
  },
  {
    name: "Toulouse",
    color: "bg-gradient-to-br from-purple-500 to-violet-600",
    population: 498003,
  },
  {
    name: "Nice",
    color: "bg-gradient-to-br from-yellow-500 to-orange-600",
    population: 342669,
  },
  {
    name: "Nantes",
    color: "bg-gradient-to-br from-indigo-500 to-blue-600",
    population: 323204,
  },
  {
    name: "Strasbourg",
    color: "bg-gradient-to-br from-pink-500 to-rose-600",
    population: 291313,
  },
  {
    name: "Montpellier",
    color: "bg-gradient-to-br from-teal-500 to-green-600",
    population: 302454,
  },
  {
    name: "Bordeaux",
    color: "bg-gradient-to-br from-orange-500 to-red-600",
    population: 260958,
  },
  {
    name: "Lille",
    color: "bg-gradient-to-br from-cyan-500 to-blue-600",
    population: 236234,
  },
  {
    name: "Rennes",
    color: "bg-gradient-to-br from-lime-500 to-green-600",
    population: 223347,
  },
  {
    name: "Reims",
    color: "bg-gradient-to-br from-emerald-500 to-teal-600",
    population: 182460,
  },
  {
    name: "Saint-Étienne",
    color: "bg-gradient-to-br from-violet-500 to-purple-600",
    population: 173089,
  },
  {
    name: "Toulon",
    color: "bg-gradient-to-br from-rose-500 to-pink-600",
    population: 176198,
  },
  {
    name: "Grenoble",
    color: "bg-gradient-to-br from-blue-500 to-indigo-600",
    population: 158346,
  },
  {
    name: "Dijon",
    color: "bg-gradient-to-br from-green-500 to-lime-600",
    population: 158002,
  },
  {
    name: "Angers",
    color: "bg-gradient-to-br from-purple-500 to-indigo-600",
    population: 157175,
  },
  {
    name: "Villeurbanne",
    color: "bg-gradient-to-br from-yellow-500 to-amber-600",
    population: 154781,
  },
  {
    name: "Saint-Denis",
    color: "bg-gradient-to-br from-indigo-500 to-purple-600",
    population: 112091,
  },
  {
    name: "Le Mans",
    color: "bg-gradient-to-br from-cyan-500 to-teal-600",
    population: 145004,
  },
  {
    name: "Aix-en-Provence",
    color: "bg-gradient-to-br from-pink-500 to-red-600",
    population: 147122,
  },
  {
    name: "Clermont-Ferrand",
    color: "bg-gradient-to-br from-teal-500 to-cyan-600",
    population: 147327,
  },
  {
    name: "Brest",
    color: "bg-gradient-to-br from-orange-500 to-yellow-600",
    population: 139676,
  },
  {
    name: "Limoges",
    color: "bg-gradient-to-br from-rose-500 to-orange-600",
    population: 128466,
  },
  {
    name: "Tours",
    color: "bg-gradient-to-br from-emerald-500 to-lime-600",
    population: 138268,
  },
];

// Helper function to get city color by name
export const getCityColor = (cityName: string): string => {
  const city = cities.find((c) => c.name === cityName);
  return city?.color || "bg-gradient-to-br from-gray-500 to-gray-600";
};

// Helper function to get city by name
export const getCity = (cityName: string): City | undefined => {
  return cities.find((c) => c.name === cityName);
};
