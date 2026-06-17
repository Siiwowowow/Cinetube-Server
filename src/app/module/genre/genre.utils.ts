/* eslint-disable @typescript-eslint/no-explicit-any */
// Predefined list of common movie genres for seeding
export const DEFAULT_GENRES = [
  { name: 'Action', description: 'High-energy films featuring physical feats, chase scenes, and battles' },
  { name: 'Adventure', description: 'Exciting journeys and exploration in exotic locations' },
  { name: 'Comedy', description: 'Light-hearted entertainment designed to amuse and provoke laughter' },
  { name: 'Drama', description: 'Character-driven narratives focusing on emotional development' },
  { name: 'Horror', description: 'Designed to frighten, scare, or disgust viewers' },
  { name: 'Sci-Fi', description: 'Speculative fiction exploring futuristic concepts and technology' },
  { name: 'Fantasy', description: 'Magical and supernatural elements in imaginary worlds' },
  { name: 'Romance', description: 'Love stories and romantic relationships' },
  { name: 'Thriller', description: 'Suspenseful, tense, and exciting narratives' },
  { name: 'Mystery', description: 'Whodunit stories and puzzling events to solve' },
  { name: 'Documentary', description: 'Non-fictional educational or informative content' },
  { name: 'Animation', description: 'Animated films and series for all ages' },
  { name: 'Crime', description: 'Criminal activities, law enforcement, and justice' },
  { name: 'Family', description: 'Entertainment suitable for all ages' },
  { name: 'Biography', description: 'Dramatized accounts of real people\'s lives' },
  { name: 'History', description: 'Period pieces and historical events' },
  { name: 'War', description: 'Military conflicts and wartime experiences' },
  { name: 'Musical', description: 'Films featuring songs and dance numbers' },
  { name: 'Western', description: 'Cowboys, outlaws, and the American frontier' },
  { name: 'Sport', description: 'Athletic competitions and sports-related stories' }
];

// Helper to validate genre name
export const isValidGenreName = (name: string): boolean => {
  const validPattern = /^[a-zA-Z\s\-&]+$/;
  return validPattern.test(name) && name.length >= 2 && name.length <= 50;
};

// Helper to format genre for display
export const formatGenre = (genre: any) => {
  return {
    id: genre.id,
    name: genre.name,
    slug: genre.slug,
    description: genre.description,
    mediaCount: genre._count?.media || 0
  };
};