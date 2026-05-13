export type PlaceCategory = 'historia' | 'naturaleza' | 'cultura' | 'gastronomia' | 'religion' | 'leyenda';

export interface TouristPlace {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  address: string;
  rating: number;
  points: number;
  qrCode: string;
  imageUrl: string;
  audioText: string;
  arType: 'legend' | 'history' | 'nature' | 'culture';
  badge: string;
  difficulty: 'facil' | 'medio' | 'dificil';
  visitDuration: string;
  tags: string[];
}

export const TOURIST_PLACES: TouristPlace[] = [
  {
    id: 'plaza-centenario',
    name: 'Plaza del Centenario',
    shortDescription: 'El corazón histórico de Ciénaga',
    description:
      'La Plaza del Centenario es el epicentro cultural e histórico de Ciénaga. Construida en el siglo XIX, fue testigo de los eventos más importantes de la historia local. Sus caminos empedrados, árboles centenarios y monumentos la convierten en un lugar de historia viva. Aquí se realizó la Masacre de las Bananeras en 1928, un hecho que marcó la historia de Colombia.',
    category: 'historia',
    latitude: 11.007,
    longitude: -74.2555,
    address: 'Cra. 17 #12-00, Ciénaga, Magdalena',
    rating: 4.8,
    points: 150,
    qrCode: 'QR_PLAZA_CENTENARIO_2024',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    audioText:
      'Bienvenido a la Plaza del Centenario de Ciénaga. Este icónico espacio fue construido en el siglo XIX y es el corazón histórico del municipio. En 1928, fue escenario de la trágica Masacre de las Bananeras, un evento que marcó profundamente la historia de Colombia y que Gabriel García Márquez inmortalizó en su novela Cien Años de Soledad. Hoy, la plaza alberga el monumento a los caídos y es punto de encuentro de la comunidad ciénaghera.',
    arType: 'history',
    badge: '🏛️ Guardián de la Historia',
    difficulty: 'facil',
    visitDuration: '45 min',
    tags: ['histórico', 'patrimonial', 'central'],
  },
  {
    id: 'malecon-cienaga',
    name: 'Malecón de Ciénaga',
    shortDescription: 'Paseo frente al Mar Caribe',
    description:
      'El Malecón de Ciénaga es una hermosa avenida costera que bordea la línea del litoral Caribe. Desde aquí puedes disfrutar de atardeceres espectaculares sobre el mar, degustar los mejores mariscos de la región y contemplar las embarcaciones tradicionales de los pescadores locales. Es el lugar favorito de los ciénagheros para el ocio y la socialización.',
    category: 'naturaleza',
    latitude: 11.0046,
    longitude: -74.2603,
    address: 'Calle del Malecón, Ciénaga, Magdalena',
    rating: 4.6,
    points: 100,
    qrCode: 'QR_MALECON_2024',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    audioText:
      'Estás en el Malecón de Ciénaga, uno de los paseos costeros más bellos del Caribe colombiano. Este bulevar frente al Mar Caribe es el corazón social de la ciudad. Aquí los pescadores han traído sus capturas durante generaciones, y los habitantes se reúnen al atardecer para contemplar los colores del mar. La tradición pesquera de Ciénaga data de tiempos precolombinos y sigue viva en cada embarcación que ves a lo lejos.',
    arType: 'nature',
    badge: '🌊 Explorador del Caribe',
    difficulty: 'facil',
    visitDuration: '60 min',
    tags: ['costera', 'naturaleza', 'gastronomía'],
  },
  {
    id: 'iglesia-san-juan',
    name: 'Iglesia San Juan Bautista',
    shortDescription: 'Joya arquitectónica colonial',
    description:
      'La Iglesia San Juan Bautista es una de las obras arquitectónicas más importantes del norte de Colombia. Construida en el período colonial, su fachada neoclásica y sus interiores ornamentados representan siglos de fe y tradición. La iglesia es Patrimonio Histórico Nacional y guarda en su interior reliquias y pinturas de incalculable valor cultural.',
    category: 'religion',
    latitude: 11.0065,
    longitude: -74.2548,
    address: 'Calle de la Iglesia, Ciénaga, Magdalena',
    rating: 4.7,
    points: 120,
    qrCode: 'QR_IGLESIA_SAN_JUAN_2024',
    imageUrl: 'https://images.unsplash.com/photo-1553701774-2af9bb3d4f2f?w=800&q=80',
    audioText:
      'Frente a ti se eleva la Iglesia San Juan Bautista, construida en el período colonial y declarada Patrimonio Histórico Nacional. Su impresionante fachada neoclásica y sus torres gemelas han guiado a los fieles por más de tres siglos. En su interior reposan pinturas coloniales, retablos dorados y la imagen del Santo Patrono que cada año es procesionada por las calles de Ciénaga en una festividad que reúne a miles de devotos.',
    arType: 'history',
    badge: '⛪ Guardián Espiritual',
    difficulty: 'facil',
    visitDuration: '30 min',
    tags: ['religioso', 'colonial', 'patrimonio'],
  },
  {
    id: 'casa-del-diablo',
    name: 'La Casa del Diablo',
    shortDescription: 'La leyenda más oscura de Ciénaga',
    description:
      'La Casa del Diablo es la construcción más misteriosa y legendaria de Ciénaga. Según cuenta la tradición oral, en esta casona colonial habitaba un poderoso terrateniente que hizo un pacto con el diablo a cambio de riquezas. Se dice que en las noches de luna llena se escuchan ruidos extraños y se ven luces espectrales en sus ventanas. Aunque la historia real es menos dramática, el misterio que la rodea la convierte en el punto más visitado por los turistas.',
    category: 'leyenda',
    latitude: 11.008,
    longitude: -74.254,
    address: 'Calle Oscura #13, Ciénaga, Magdalena',
    rating: 4.9,
    points: 200,
    qrCode: 'QR_CASA_DIABLO_2024',
    imageUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=800&q=80',
    audioText:
      'Bienvenido al lugar más misterioso de Ciénaga: La Casa del Diablo. Según la leyenda, a finales del siglo XIX vivía aquí Don Ezequiel Barros, un poderoso hacendado que según el pueblo vendió su alma al diablo a cambio de fortuna y poder. Se dice que en las noches sin luna, el diablo mismo viene a cobrar su parte del trato, y que las almas de los que murieron en esta casa aún vagan por sus pasillos. ¿Sentirás su presencia?',
    arType: 'legend',
    badge: '👹 Cazador de Leyendas',
    difficulty: 'medio',
    visitDuration: '45 min',
    tags: ['leyenda', 'misterio', 'terror', 'histórico'],
  },
  {
    id: 'cementerio-san-miguel',
    name: 'Cementerio San Miguel',
    shortDescription: 'Historia entre lápidas centenarias',
    description:
      'El Cementerio San Miguel de Ciénaga es uno de los cementerios más antiguos e históricos de la Costa Caribe colombiana. Sus mausoleos del siglo XIX, estatuas de mármol importadas de Europa y elaboradas criptas familiares hacen de este lugar un verdadero museo al aire libre. Aquí descansan los fundadores de la ciudad y personalidades que marcaron la historia regional.',
    category: 'historia',
    latitude: 11.003,
    longitude: -74.258,
    address: 'Av. del Cementerio, Ciénaga, Magdalena',
    rating: 4.3,
    points: 130,
    qrCode: 'QR_CEMENTERIO_2024',
    imageUrl: 'https://images.unsplash.com/photo-1509823523400-f49c252e9f94?w=800&q=80',
    audioText:
      'El Cementerio San Miguel es un museo de historia al aire libre. Fundado a principios del siglo XIX, sus mausoleos y tumbas cuentan la historia de las familias más influyentes de Ciénaga. Las estatuas de mármol traídas de Italia y los elaborados monumentos fúnebres son testigos del esplendor económico que vivió la región durante la bonanza bananera. En este lugar reposan los protagonistas de la historia local.',
    arType: 'history',
    badge: '⚰️ Arqueólogo Urbano',
    difficulty: 'medio',
    visitDuration: '60 min',
    tags: ['histórico', 'arquitectura', 'patrimonio'],
  },
  {
    id: 'mercado-publico',
    name: 'Mercado Público',
    shortDescription: 'Colores y sabores del Caribe',
    description:
      'El Mercado Público de Ciénaga es una explosión de colores, aromas y sabores del Caribe colombiano. Aquí encontrarás los productos más frescos del mar y la tierra: pescado recién capturado, frutas tropicales exóticas, especias y artesanías locales. Es el lugar donde la gastronomía tradicional ciénaghera cobra vida, con platos como el sancocho de pescado y el arroz con coco.',
    category: 'gastronomia',
    latitude: 11.0055,
    longitude: -74.256,
    address: 'Mercado Central, Ciénaga, Magdalena',
    rating: 4.4,
    points: 80,
    qrCode: 'QR_MERCADO_2024',
    imageUrl: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&q=80',
    audioText:
      'Bienvenido al Mercado Público de Ciénaga, el corazón gastronómico de la ciudad. Desde el amanecer, pescadores, campesinos y comerciantes traen lo mejor de su cosecha y sus capturas. El aroma a pescado fresco, especias tropicales y frutas exóticas crea una experiencia sensorial única. Prueba el sancocho de bocachico, el arroz con coco y los dulces de panela que son un orgullo de la gastronomía ciénaghera.',
    arType: 'culture',
    badge: '🍗 Gourmet Caribeño',
    difficulty: 'facil',
    visitDuration: '90 min',
    tags: ['gastronomía', 'cultura', 'artesanías', 'local'],
  },
  {
    id: 'costa-verde',
    name: 'Costa Verde',
    shortDescription: 'Paraíso natural entre el mar y la ciénaga',
    description:
      'Costa Verde es un espectacular ecosistema donde el Mar Caribe se encuentra con la Ciénaga Grande de Santa Marta, formando uno de los ecosistemas de manglar más importantes de Colombia. Declarado Reserva de la Biosfera por la UNESCO, este paraíso natural alberga cientos de especies de aves, reptiles y peces que puedes observar en recorridos en canoa por los canales de manglar.',
    category: 'naturaleza',
    latitude: 11.001,
    longitude: -74.262,
    address: 'Corregimiento Costa Verde, Ciénaga, Magdalena',
    rating: 4.9,
    points: 180,
    qrCode: 'QR_COSTA_VERDE_2024',
    imageUrl: 'https://images.unsplash.com/photo-1552083375-1447ce886485?w=800&q=80',
    audioText:
      'Estás en Costa Verde, uno de los ecosistemas más biodiversos de Colombia. El encuentro del Mar Caribe con la Ciénaga Grande de Santa Marta crea un paraíso natural de manglares declarado Reserva de la Biosfera por la UNESCO. Aquí puedes observar más de 200 especies de aves migratorias y residentes, incluyendo el flamenco rosado y la garza real. Los canales de manglar te transportan a un mundo prehistórico de una belleza incomparable.',
    arType: 'nature',
    badge: '🦜 Guardián del Ecosistema',
    difficulty: 'medio',
    visitDuration: '3 horas',
    tags: ['naturaleza', 'UNESCO', 'manglar', 'ecoturismo'],
  },
  {
    id: 'pueblo-viejo',
    name: 'Pueblo Viejo',
    shortDescription: 'Pueblo palafítico sobre el agua',
    description:
      'Pueblo Viejo es un fascinante corregimiento construido sobre palafitos en medio de la Ciénaga Grande de Santa Marta. Sus casas de madera elevadas sobre el agua, conectadas por puentes peatonales, crean una imagen única e irreal. Esta comunidad pesquera ha mantenido sus tradiciones ancestrales durante generaciones, viviendo en simbiosis perfecta con el ecosistema acuático que los rodea.',
    category: 'cultura',
    latitude: 10.999,
    longitude: -74.27,
    address: 'Corregimiento Pueblo Viejo, Ciénaga, Magdalena',
    rating: 4.7,
    points: 160,
    qrCode: 'QR_PUEBLO_VIEJO_2024',
    imageUrl: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&q=80',
    audioText:
      'Pueblo Viejo es una de las comunidades más singulares de Colombia. Sus habitantes construyeron sus casas sobre el agua de la Ciénaga Grande hace más de 400 años, creando un pueblo palafítico único en el Caribe. Hoy, sus más de 15,000 habitantes siguen viviendo de la pesca artesanal, navegando en canoas por las mismas rutas que usaron sus ancestros. Caminar por sus puentes de madera sobre el agua es como retroceder en el tiempo.',
    arType: 'culture',
    badge: '🏠 Explorador Palafítico',
    difficulty: 'dificil',
    visitDuration: '4 horas',
    tags: ['cultura', 'palafítico', 'pesca', 'tradicional'],
  },
  {
    id: 'laguna-grande',
    name: 'Laguna Grande',
    shortDescription: 'Espejo de agua y biodiversidad',
    description:
      'La Laguna Grande es uno de los cuerpos de agua más importantes del complejo lagunar de la Ciénaga Grande de Santa Marta. Sus aguas tranquilas reflejan el cielo y los manglares circundantes, creando paisajes de ensueño al amanecer y al atardecer. Es un sitio de reproducción de numerosas especies de peces y aves, y el lugar perfecto para practicar observación de fauna silvestre.',
    category: 'naturaleza',
    latitude: 11.01,
    longitude: -74.265,
    address: 'Laguna Grande, Ciénaga, Magdalena',
    rating: 4.5,
    points: 140,
    qrCode: 'QR_LAGUNA_GRANDE_2024',
    imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80',
    audioText:
      'La Laguna Grande es el corazón acuático de la Ciénaga Grande de Santa Marta. Este espejo de agua de más de 450 kilómetros cuadrados es el sistema lagunar costero más grande de Colombia y uno de los más importantes de Latinoamérica. Sus aguas son el hogar de más de 100 especies de peces, muchas de ellas endémicas, y sirve de refugio para aves migratorias que viajan desde Norteamérica cada año. Un tesoro natural que debemos proteger.',
    arType: 'nature',
    badge: '🦢 Naturalista Experto',
    difficulty: 'dificil',
    visitDuration: '5 horas',
    tags: ['naturaleza', 'laguna', 'aves', 'pesca'],
  },
];

export const CATEGORIES: { id: PlaceCategory; label: string; icon: string; color: string }[] = [
  { id: 'historia', label: 'Historia', icon: 'account-balance', color: '#F59E0B' },
  { id: 'naturaleza', label: 'Naturaleza', icon: 'park', color: '#10B981' },
  { id: 'cultura', label: 'Cultura', icon: 'palette', color: '#8B5CF6' },
  { id: 'gastronomia', label: 'Gastronomía', icon: 'restaurant', color: '#EF4444' },
  { id: 'religion', label: 'Religión', icon: 'church', color: '#3B82F6' },
  { id: 'leyenda', label: 'Leyendas', icon: 'auto-fix-high', color: '#EC4899' },
];

export const LEVELS = [
  { name: 'Viajero Curioso', minPoints: 0, maxPoints: 199, icon: '🗺️', color: '#9CA3AF' },
  { name: 'Explorador Inicial', minPoints: 200, maxPoints: 499, icon: '🧭', color: '#3B82F6' },
  { name: 'Aventurero', minPoints: 500, maxPoints: 899, icon: '⚡', color: '#10B981' },
  { name: 'Historiador', minPoints: 900, maxPoints: 1399, icon: '📚', color: '#F59E0B' },
  { name: 'Maestro Turístico', minPoints: 1400, maxPoints: 1999, icon: '🏆', color: '#8B5CF6' },
  { name: 'Leyenda de Ciénaga', minPoints: 2000, maxPoints: 99999, icon: '⭐', color: '#EC4899' },
];

export const getCategoryColor = (category: PlaceCategory): string => {
  const cat = CATEGORIES.find((c) => c.id === category);
  return cat ? cat.color : '#3B82F6';
};

export const getCategoryLabel = (category: PlaceCategory): string => {
  const cat = CATEGORIES.find((c) => c.id === category);
  return cat ? cat.label : category;
};
