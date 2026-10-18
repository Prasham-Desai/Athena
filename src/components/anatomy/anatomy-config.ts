export type AnatomyGender = 'male' | 'female';

export interface AnatomySystemOption {
  id: string;
  name: string;
  systemKey: string;
  description: string;
  modelId: string;
  structures: string[];
}

export interface GenderAnatomyConfig {
  gender: AnatomyGender;
  label: string;
  badge: string;
  description: string;
  color: string;
  activeGradient: string;
  activeShadow: string;
  systems: AnatomySystemOption[];
}

export const ANATOMY_GENDER_CONFIGS: Record<AnatomyGender, GenderAnatomyConfig> = {
  male: {
    gender: 'male',
    label: 'Male Anatomy',
    badge: 'XY',
    description: 'Explore male anatomical structures, full-body musculoskeletal systems, and regional organs.',
    color: '#06b6d4',
    activeGradient: 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600',
    activeShadow: 'shadow-lg shadow-cyan-500/25',
    systems: [
      {
        id: 'male-bio-full',
        name: 'Full Body Tour',
        systemKey: 'full-body',
        description: 'Comprehensive 3D tour covering full-body skeletal, muscular, cardiovascular, and internal organ systems.',
        modelId: process.env.NEXT_PUBLIC_BIODIGITAL_MALE_MODEL_ID || 'production/maleAdult/male_anatomy_tour',
        structures: [
          'Skeletal System',
          'Muscular Layers',
          'Cardiovascular Vessels',
          'Thoracic & Abdominal Viscera',
          'Nervous Pathways',
        ],
      },
      {
        id: 'male-bio-pelvis',
        name: 'Pelvis & Reproductive',
        systemKey: 'pelvis-reproductive',
        description: 'Detailed male pelvic anatomy, reproductive organs, urinary bladder, pelvic floor musculature, and neurovascular network.',
        modelId: 'production/maleAdult/male_region_pelvis_17',
        structures: [
          'Bony Pelvis & Ligaments',
          'Bladder & Urethra',
          'Prostate & Seminal Vesicles',
          'Pelvic Floor Musculature',
          'Iliac Vessels & Nerves',
        ],
      },
      {
        id: 'male-bio-cardio',
        name: 'Cardiovascular & Heart',
        systemKey: 'cardiovascular',
        description: 'Interactive 3D model of the human heart, coronary circulation, cardiac valves, and great vessels.',
        modelId: 'production/maleAdult/beating_heart_02',
        structures: [
          'Atria & Ventricles',
          'Coronary Arteries & Veins',
          'Aortic & Mitral Valves',
          'Ascending Aorta & Vena Cava',
          'Conduction Nodes',
        ],
      },
    ],
  },
  female: {
    gender: 'female',
    label: 'Female Anatomy',
    badge: 'XX',
    description: 'Explore female anatomical systems, pelvic and reproductive organs, abdominal viscera, and musculature.',
    color: '#ec4899',
    activeGradient: 'bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600',
    activeShadow: 'shadow-lg shadow-pink-500/25',
    systems: [
      {
        id: 'female-bio-pelvis',
        name: 'Pelvis & Reproductive',
        systemKey: 'pelvis-reproductive',
        description: 'Comprehensive female reproductive and pelvic anatomy with uterus, ovaries, fallopian tubes, bladder, and vascular supply.',
        modelId: process.env.NEXT_PUBLIC_BIODIGITAL_FEMALE_MODEL_ID || 'production/femaleAdult/female_region_pelvis_17',
        structures: [
          'Uterus & Myometrium',
          'Ovaries & Ovarian Ligaments',
          'Fallopian Tubes (Uterine Tubes)',
          'Vaginal Canal & Perineum',
          'Urinary Bladder & Pelvic Floor',
        ],
      },
      {
        id: 'female-bio-abdomen',
        name: 'Abdomen & Viscera',
        systemKey: 'abdomen-digestive',
        description: 'Female abdominal cavity showing digestive organs, liver, biliary tree, spleen, kidneys, and abdominal wall musculature.',
        modelId: 'production/femaleAdult/female_region_abdomen_17',
        structures: [
          'Stomach & Intestinal Loops',
          'Liver & Gallbladder',
          'Pancreas & Spleen',
          'Kidneys & Ureters',
          'Abdominal Wall Layers',
        ],
      },
    ],
  },
};

/**
 * Builds the BioDigital Human Viewer embed URL with UI parameters
 */
export function buildBioDigitalUrl(modelId: string, developerKey?: string): string {
  const baseUrl = 'https://human.biodigital.com/viewer/';
  const params = new URLSearchParams({
    id: modelId,
    'ui-info': 'true',
    'ui-menu': 'true',
    'ui-tools': 'true',
    'ui-all': 'true',
    'ui-nav': 'true',
    'ui-fullscreen': 'true',
    'ui-help': 'true',
  });

  const dk = developerKey || process.env.NEXT_PUBLIC_BIODIGITAL_KEY;
  if (dk) {
    params.set('dk', dk);
  }

  return `${baseUrl}?${params.toString()}`;
}
