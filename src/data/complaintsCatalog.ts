/**
 * 10 Deterministic Initial Complaint Catalog (Tier 1 SIH Spec)
 * Extensible configuration-driven stubs for patient kiosk intake.
 */

export interface ComplaintStub {
  id: string;
  code: string;
  category: 'respiratory' | 'cardiovascular' | 'gastrointestinal' | 'neurological' | 'musculoskeletal' | 'nephrology' | 'chronic_disease' | 'general';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  icon: string;
  title: {
    en: string;
    hi: string;
    mr: string;
    es: string;
  };
  shortDescription: {
    en: string;
    hi: string;
    mr: string;
    es: string;
  };
  sampleSymptoms: string[];
}

export const TEN_COMPLAINTS: ComplaintStub[] = [
  {
    id: 'comp_fever',
    code: 'FEVER',
    category: 'general',
    riskLevel: 'MEDIUM',
    icon: 'Thermometer',
    title: {
      en: 'Fever & Chills',
      hi: 'बुखार और ठंड लगना (Fever)',
      mr: 'ताप आणि थंडी वाजणे (Fever)',
      es: 'Fiebre y Escalofríos',
    },
    shortDescription: {
      en: 'High body temperature, sweating, body aches or rigors.',
      hi: 'शरीर का उच्च तापमान, पसीना, बदन दर्द या कंपकंपी।',
      mr: 'अंगात उष्णता, घाम येणे, अंगदुखी किंवा थरथरणे.',
      es: 'Temperatura corporal elevada, sudoración o dolores musculares.',
    },
    sampleSymptoms: ['High temperature', 'Chills/shivering', 'Headache', 'Body ache'],
  },
  {
    id: 'comp_cough',
    code: 'COUGH',
    category: 'respiratory',
    riskLevel: 'MEDIUM',
    icon: 'Activity',
    title: {
      en: 'Cough & Cold',
      hi: 'खांसी और जुकाम (Cough)',
      mr: 'खोकला आणि सर्दी (Cough)',
      es: 'Tos y Resfriado',
    },
    shortDescription: {
      en: 'Dry or productive chest cough, sore throat, or nasal congestion.',
      hi: 'सूखी या कफ वाली खांसी, गले में खराश या नाक बंद होना।',
      mr: 'कोरडा किंवा कफयुक्त खोकला, घसा खवखवणे किंवा नाक वाहणे.',
      es: 'Tos seca o productiva, dolor de garganta o congestión nasal.',
    },
    sampleSymptoms: ['Productive cough', 'Dry persistent cough', 'Sore throat', 'Phlegm'],
  },
  {
    id: 'comp_chest_pain',
    code: 'CHEST_PAIN',
    category: 'cardiovascular',
    riskLevel: 'HIGH',
    icon: 'Heart',
    title: {
      en: 'Chest Pain / Discomfort',
      hi: 'सीने में दर्द या भारीपन (Chest Pain)',
      mr: 'छातीत दुखणे किंवा जडपणा (Chest Pain)',
      es: 'Dolor en el Pecho',
    },
    shortDescription: {
      en: 'Pressure, tightness, squeezing, or radiating pain in chest.',
      hi: 'सीने में दबाव, जकड़न, भारीपन या बांह की तरफ फैलता दर्द।',
      mr: 'छातीवर दाब, अस्वस्थता, आवळल्यासारखे वाटणे किंवा हाताकडे जाणारे दुखणे.',
      es: 'Presión, opresión o dolor que se irradia en el pecho.',
    },
    sampleSymptoms: ['Retrosternal pressure', 'Left arm radiation', 'Sweating with pain', 'Breathlessness'],
  },
  {
    id: 'comp_abdominal_pain',
    code: 'ABDOMINAL_PAIN',
    category: 'gastrointestinal',
    riskLevel: 'MEDIUM',
    icon: 'ShieldAlert',
    title: {
      en: 'Abdominal / Stomach Pain',
      hi: 'पेट दर्द (Stomach Pain)',
      mr: 'पोटदुखी (Stomach Pain)',
      es: 'Dolor Abdominal / Estómago',
    },
    shortDescription: {
      en: 'Upper or lower abdominal cramps, burning sensation, or sharp spasms.',
      hi: 'पेट के ऊपरी या निचले हिस्से में दर्द, ऐंठन या जलन।',
      mr: 'पोटात दुखणे, जळजळ, मुरडा पडणे किंवा अचानक तीव्र कळा.',
      es: 'Cólicos abdominales superiores o inferiores, acidez o dolor punzante.',
    },
    sampleSymptoms: ['Epigastric burning', 'Lower quadrant cramping', 'Severe colic', 'Tenderness'],
  },
  {
    id: 'comp_headache',
    code: 'HEADACHE',
    category: 'neurological',
    riskLevel: 'MEDIUM',
    icon: 'Zap',
    title: {
      en: 'Headache',
      hi: 'सिर दर्द (Headache)',
      mr: 'डोकेदुखी (Headache)',
      es: 'Dolor de Cabeza',
    },
    shortDescription: {
      en: 'Throbbing, dull ache, migraine, or sudden onset severe headache.',
      hi: 'सिर में तेज दर्द, भारीपन, चक्कर आना या माइग्रेन की शिकायत।',
      mr: 'डोके जड होणे, एका बाजूला दुखणे किंवा अचानक तीव्र डोकेदुखी.',
      es: 'Dolor punzante o sordo en la cabeza, migraña o pesadez.',
    },
    sampleSymptoms: ['Unilateral throbbing', 'Occipital tension', 'Visual aura', 'Nausea with headache'],
  },
  {
    id: 'comp_breathlessness',
    code: 'BREATHLESSNESS',
    category: 'respiratory',
    riskLevel: 'HIGH',
    icon: 'Wind',
    title: {
      en: 'Breathlessness / Wheezing',
      hi: 'सांस फूलना या सांस लेने में तकलीफ (Breathlessness)',
      mr: 'दम लागणे किंवा धाप लागणे (Breathlessness)',
      es: 'Dificultad para Respirar',
    },
    shortDescription: {
      en: 'Shortness of breath on mild exertion or resting, wheezing, or tightness.',
      hi: 'हल्का चलने पर सांस फूलना, सीने से सीटी जैसी आवाज आना या दम घुटना।',
      mr: 'चालल्यावर दम भरणे, बसल्या जागी धाप लागणे किंवा छाती वाजणे.',
      es: 'Falta de aire en reposo o al caminar, sibilancias o ahogo.',
    },
    sampleSymptoms: ['Shortness of breath at rest', 'Wheezing sound', 'Orthopnea', 'Stridor'],
  },
  {
    id: 'comp_vomiting_diarrhea',
    code: 'VOMITING_DIARRHEA',
    category: 'gastrointestinal',
    riskLevel: 'MEDIUM',
    icon: 'RefreshCw',
    title: {
      en: 'Vomiting & Diarrhea',
      hi: 'उल्टी और दस्त (Vomiting & Diarrhea)',
      mr: 'उलट्या आणि जुलाब (Vomiting & Diarrhea)',
      es: 'Vómitos y Diarrea',
    },
    shortDescription: {
      en: 'Loose watery stools, frequent vomiting, dehydration, or weakness.',
      hi: 'पतले दस्त, बार-बार उल्टी, मुंह सूखना और अत्यधिक कमजोरी।',
      mr: 'पातळ जुलाब, वारंवार उलट्या, तोंड सुकणे आणि तीव्र थकवा.',
      es: 'Deposiciones líquidas frecuentes, vómitos, deshidratación y debilidad.',
    },
    sampleSymptoms: ['Watery diarrhea > 3 times', 'Persistent vomiting', 'Dry mouth', 'Dizziness on standing'],
  },
  {
    id: 'comp_joint_pain',
    code: 'JOINT_PAIN',
    category: 'musculoskeletal',
    riskLevel: 'LOW',
    icon: 'Crosshair',
    title: {
      en: 'Joint & Body Pain',
      hi: 'जोड़ों और बदन का दर्द (Joint Pain)',
      mr: 'सांधेदुखी आणि अंगदुखी (Joint Pain)',
      es: 'Dolor Articular y Corporal',
    },
    shortDescription: {
      en: 'Knee, hip, back, or multiple joint swelling, stiffness, and pain.',
      hi: 'घुटनों, कमर या जोड़ों में सूजन, अकड़न और चलने-फिरने में दर्द।',
      mr: 'गुडघे, कंबर किंवा सांधे सुजणे, सकाळी ताठरणे आणि हालचाली करताना त्रास.',
      es: 'Dolor, rigidez o inflamación en rodillas, espalda o articulaciones.',
    },
    sampleSymptoms: ['Knee swelling', 'Morning joint stiffness', 'Back pain', 'Difficulty walking'],
  },
  {
    id: 'comp_urinary_symptoms',
    code: 'URINARY_SYMPTOMS',
    category: 'nephrology',
    riskLevel: 'MEDIUM',
    icon: 'Droplets',
    title: {
      en: 'Urinary Complaints',
      hi: 'पेशाब में जलन या रुकावट (Urinary Problems)',
      mr: 'लघवी करताना जळजळ किंवा त्रास (Urinary Problems)',
      es: 'Molestias Urinarias',
    },
    shortDescription: {
      en: 'Burning during urination, increased frequency, foul smell, or hematuria.',
      hi: 'पेशाब करते समय तेज जलन, बार-बार पेशाब आना या पेशाब का रंग गहरा होना।',
      mr: 'लघवी करताना आग होणे, वारंवार जावे लागणे किंवा लघवीतून रक्त दिसणे.',
      es: 'Ardor al orinar, aumento en frecuencia, color oscuro o dolor pélvico.',
    },
    sampleSymptoms: ['Dysuria / Burning micturition', 'Urinary frequency', 'Fever with chills', 'Hematuria'],
  },
  {
    id: 'comp_diabetes_hypertension',
    code: 'DIABETES_HYPERTENSION',
    category: 'chronic_disease',
    riskLevel: 'LOW',
    icon: 'Clock',
    title: {
      en: 'Diabetes & BP Routine Checkup',
      hi: 'शुगर और बीपी की नियमित जांच (Diabetes & BP Follow-up)',
      mr: 'मधुमेह आणि रक्तदाब नियमित तपासणी (Diabetes & BP Follow-up)',
      es: 'Control de Diabetes y Presión Arterial',
    },
    shortDescription: {
      en: 'Regular chronic follow-up, refill of medications, or blood sugar monitoring.',
      hi: 'पुरानी बीमारियों की नियमित जांच, दवाओं का पर्चा दोबारा बनवाना या शुगर रीडिंग।',
      mr: 'नियमित फॉलो-अप, औषधांची पुन्हा नोंद किंवा साखर व बीपी मोजणी.',
      es: 'Control rutinario de diabetes e hipertensión y renovación de recetas.',
    },
    sampleSymptoms: ['Medication refill needed', 'Home BP high', 'Excessive thirst', 'Blurry vision check'],
  },
];
