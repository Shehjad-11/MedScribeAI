/**
 * Deterministic Interview Templates for 10 Primary Care Complaints
 * Tier 1 SIH Spec — Extensible Clinical Question Graph
 * All questions flagged as PENDING MBBS REVIEW in docs/CLINICAL_SPEC.md
 */

export type QuestionType =
  | 'yes_no'
  | 'single_choice'
  | 'multiple_choice'
  | 'numeric_scale'
  | 'duration'
  | 'free_text'
  | 'confirmation';

export type FactRiskCategory = 'HIGH' | 'LOW';

export interface QuestionOption {
  value: string;
  label: {
    en: string;
    hi: string;
    mr: string;
    es: string;
  };
}

export interface QuestionNode {
  id: string;
  fieldKey: string;
  type: QuestionType;
  prompt: {
    en: string;
    hi: string;
    mr: string;
    es: string;
  };
  options?: QuestionOption[];
  required: boolean;
  riskCategory: FactRiskCategory;
  redFlagRisk?: boolean;
  condition?: {
    dependsOnField: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than';
    value: any;
  };
  nextQuestionId?: string;
}

export interface ComplaintInterviewTemplate {
  complaintCode: string;
  title: string;
  questions: QuestionNode[];
}

export const INTERVIEW_TEMPLATES: Record<string, ComplaintInterviewTemplate> = {
  // 1. FEVER
  FEVER: {
    complaintCode: 'FEVER',
    title: 'Fever & Acute Febrile Illness',
    questions: [
      {
        id: 'q_fever_duration',
        fieldKey: 'duration_days',
        type: 'duration',
        prompt: {
          en: 'How many days have you had fever?',
          hi: 'आपको कितने दिनों से बुखार है?',
          mr: 'तुम्हाला किती दिवसांपासून ताप आहे?',
          es: '¿Cuántos días ha tenido fiebre?',
        },
        required: true,
        riskCategory: 'HIGH',
        redFlagRisk: true,
      },
      {
        id: 'q_fever_chills',
        fieldKey: 'chills_rigors',
        type: 'yes_no',
        prompt: {
          en: 'Do you have shivering, chills, or cold sensation with fever?',
          hi: 'क्या बुखार के साथ ठंड, कंपकंपी या थरथराहट होती है?',
          mr: 'तापाबरोबर थंडी वाजून येते का किंवा हुडहुडी भरते का?',
          es: '¿Tiene escalofríos o temblores con la fiebre?',
        },
        required: true,
        riskCategory: 'LOW',
      },
      {
        id: 'q_fever_pattern',
        fieldKey: 'fever_pattern',
        type: 'single_choice',
        prompt: {
          en: 'Is the fever continuous throughout the day or comes and goes in spikes?',
          hi: 'क्या बुखार दिनभर लगातार रहता है या रुक-रुक कर आता है?',
          mr: 'ताप दिवसभर सतत असतो की ठराविक वेळी चढ-उतार होतो?',
          es: '¿La fiebre es continua o va y viene en picos?',
        },
        options: [
          { value: 'continuous', label: { en: 'Continuous', hi: 'लगातार (Continuous)', mr: 'सतत', es: 'Continua' } },
          { value: 'intermittent', label: { en: 'Comes and goes (Intermittent)', hi: 'रुक-रुक कर (Intermittent)', mr: 'चढ-उतार होणारा', es: 'Intermitente' } },
          { value: 'evening_spikes', label: { en: 'Evening spikes only', hi: 'केवल शाम को चढ़ता है', mr: 'फक्त संध्याकाळी', es: 'Picos vespertinos' } },
        ],
        required: false,
        riskCategory: 'LOW',
      },
      {
        id: 'q_fever_red_flag_rash',
        fieldKey: 'petechiae_bleeding',
        type: 'yes_no',
        prompt: {
          en: 'Have you noticed any red skin spots, unusual bruising, or bleeding from nose/gums?',
          hi: 'क्या त्वचा पर लाल चकत्ते, नीले निशान या मसूड़ों/नाक से खून आ रहा है?',
          mr: 'अंगावर लाल पुरळ, काळे-निळे डाग किंवा नाक/हिरड्यांतून रक्त येते का?',
          es: '¿Ha notado manchas rojas en la piel o sangrado?',
        },
        required: true,
        riskCategory: 'HIGH',
        redFlagRisk: true,
      },
    ],
  },

  // 2. COUGH
  COUGH: {
    complaintCode: 'COUGH',
    title: 'Cough & Respiratory Symptoms',
    questions: [
      {
        id: 'q_cough_duration',
        fieldKey: 'cough_duration',
        type: 'duration',
        prompt: {
          en: 'For how long have you been coughing?',
          hi: 'आपको कितने समय से खांसी आ रही है?',
          mr: 'तुम्हाला किती दिवसांपासून खोकला आहे?',
          es: '¿Cuánto tiempo lleva tosiendo?',
        },
        required: true,
        riskCategory: 'HIGH',
        redFlagRisk: true,
      },
      {
        id: 'q_cough_type',
        fieldKey: 'cough_nature',
        type: 'single_choice',
        prompt: {
          en: 'Is your cough dry or producing sputum/phlegm?',
          hi: 'खांसी सूखी है या बलगम/कफ निकल रहा है?',
          mr: 'खोकला कोरडा आहे की कफ पडतो?',
          es: '¿La tos es seca o con flema?',
        },
        options: [
          { value: 'dry', label: { en: 'Dry cough', hi: 'सूखी खांसी', mr: 'कोरडा खोकला', es: 'Tos seca' } },
          { value: 'productive', label: { en: 'Productive with phlegm', hi: 'कफ/बलगम वाली', mr: 'कफयुक्त खोकला', es: 'Tos con flema' } },
        ],
        required: true,
        riskCategory: 'LOW',
      },
      {
        id: 'q_cough_hemoptysis',
        fieldKey: 'hemoptysis',
        type: 'yes_no',
        prompt: {
          en: 'Have you seen any blood in your sputum / phlegm?',
          hi: 'क्या बलगम या थूक में कभी खून दिखाई दिया है?',
          mr: 'कफातून कधी रक्त पडताना दिसले आहे का?',
          es: '¿Ha visto sangre en su flema?',
        },
        required: true,
        riskCategory: 'HIGH',
        redFlagRisk: true,
      },
    ],
  },

  // 3. CHEST PAIN
  CHEST_PAIN: {
    complaintCode: 'CHEST_PAIN',
    title: 'Acute Chest Pain / Angina Protocol',
    questions: [
      {
        id: 'q_cp_onset',
        fieldKey: 'chest_pain_onset',
        type: 'single_choice',
        prompt: {
          en: 'Did this chest pain start suddenly or build up gradually?',
          hi: 'क्या यह सीने का दर्द अचानक शुरू हुआ या धीरे-धीरे बढ़ा?',
          mr: 'छातीतील दुखणे अचानक सुरू झाले की हळूहळू वाढले?',
          es: '¿El dolor empezó de repente o poco a poco?',
        },
        options: [
          { value: 'sudden_acute', label: { en: 'Sudden & Severe', hi: 'अचानक व तीव्र', mr: 'अचानक व तीव्र', es: 'Súbito y severo' } },
          { value: 'gradual', label: { en: 'Gradual onset', hi: 'धीरे-धीरे', mr: 'हळूहळू', es: 'Gradual' } },
        ],
        required: true,
        riskCategory: 'HIGH',
        redFlagRisk: true,
      },
      {
        id: 'q_cp_radiation',
        fieldKey: 'chest_pain_radiation',
        type: 'multiple_choice',
        prompt: {
          en: 'Does the pain spread or radiate to any of these areas?',
          hi: 'क्या दर्द इनमें से किसी अंग की तरफ फैलता है?',
          mr: 'दुखणे खालीलपैकी कुठल्या भागात पसरते का?',
          es: '¿El dolor se extiende hacia alguna de estas zonas?',
        },
        options: [
          { value: 'left_arm', label: { en: 'Left Arm / Shoulder', hi: 'बायां हाथ / कंधा', mr: 'डावा हात / खांदा', es: 'Brazo izquierdo' } },
          { value: 'jaw_neck', label: { en: 'Jaw or Neck', hi: 'जबड़ा या गर्दन', mr: 'हनुवटी किंवा मान', es: 'Mandíbula o cuello' } },
          { value: 'back', label: { en: 'Upper Back', hi: 'पीठ का ऊपरी हिस्सा', mr: 'पाठीचा वरचा भाग', es: 'Espalda superior' } },
          { value: 'none', label: { en: 'No radiation (stays localized)', hi: 'कहीं नहीं फैलता', mr: 'कुठेही पसरत नाही', es: 'No se irradia' } },
        ],
        required: true,
        riskCategory: 'HIGH',
        redFlagRisk: true,
      },
      {
        id: 'q_cp_associated_sweat',
        fieldKey: 'diaphoresis',
        type: 'yes_no',
        prompt: {
          en: 'Are you sweating profusely or feeling cold and clammy with the pain?',
          hi: 'क्या दर्द के साथ ठंडा पसीना आ रहा है या घबराहट हो रही है?',
          mr: 'दुखण्यासोबत थंड घाम येत आहे का किंवा अस्वस्थ वाटत आहे का?',
          es: '¿Está sudando frío o siente mareo?',
        },
        required: true,
        riskCategory: 'HIGH',
        redFlagRisk: true,
      },
      {
        id: 'q_cp_severity',
        fieldKey: 'pain_score',
        type: 'numeric_scale',
        prompt: {
          en: 'Rate your chest pain severity on a scale from 1 (mild) to 10 (worst ever):',
          hi: 'दर्द की तीव्रता 1 से 10 के पैमाने पर बताएं:',
          mr: 'दुखण्याची तीव्रता १ ते १० च्या प्रमाणात सांगा:',
          es: 'Califique el dolor de 1 a 10:',
        },
        required: true,
        riskCategory: 'HIGH',
      },
    ],
  },

  // 4. ABDOMINAL PAIN
  ABDOMINAL_PAIN: {
    complaintCode: 'ABDOMINAL_PAIN',
    title: 'Abdominal & Gastrointestinal Pain',
    questions: [
      {
        id: 'q_abdo_location',
        fieldKey: 'pain_location',
        type: 'single_choice',
        prompt: {
          en: 'Where is the stomach pain most severe?',
          hi: 'पेट में दर्द सबसे ज्यादा किस जगह पर है?',
          mr: 'पोटात सर्वात जास्त दुखणे नेमके कुठे आहे?',
          es: '¿En qué parte del estómago le duele más?',
        },
        options: [
          { value: 'epigastric', label: { en: 'Upper Middle (Epigastric)', hi: 'ऊपर बीच में (छाती के नीचे)', mr: 'वरच्या मध्यभागी', es: 'Parte superior media' } },
          { value: 'right_lower', label: { en: 'Right Lower Quadrant (RLQ)', hi: 'निचले दाहिने हिस्से में', mr: 'उजव्या बाजूला खाली', es: 'Parte inferior derecha' } },
          { value: 'periumbilical', label: { en: 'Around Navel', hi: 'नाभि के चारों ओर', mr: 'बेंबीभोवती', es: 'Alrededor del ombligo' } },
          { value: 'diffuse', label: { en: 'All over entire abdomen', hi: 'पूरे पेट में फैला हुआ', mr: 'संपूर्ण पोटात', es: 'Todo el abdomen' } },
        ],
        required: true,
        riskCategory: 'LOW',
      },
      {
        id: 'q_abdo_rigidity',
        fieldKey: 'rebound_tenderness',
        type: 'yes_no',
        prompt: {
          en: 'Does your stomach feel rock hard, or hurt terribly when touched or coughing?',
          hi: 'क्या पेट पत्थर की तरह सख्त है या छूने / खांसने पर असहनीय दर्द होता है?',
          mr: 'पोट दगडासारखे कडक झाले आहे का किंवा हात लावल्यावर अतिशय दुखते का?',
          es: '¿Siente el abdomen duro como piedra o duele al tocarlo?',
        },
        required: true,
        riskCategory: 'HIGH',
        redFlagRisk: true,
      },
    ],
  },

  // 5. HEADACHE
  HEADACHE: {
    complaintCode: 'HEADACHE',
    title: 'Headache & Neurological Triage',
    questions: [
      {
        id: 'q_ha_thunderclap',
        fieldKey: 'thunderclap_onset',
        type: 'yes_no',
        prompt: {
          en: 'Did this headache reach peak maximum severity within seconds ("thunderclap")?',
          hi: 'क्या यह सिरदर्द कुछ ही सेकंडों में असहनीय तेज हो गया था?',
          mr: 'ही डोकेदुखी काही सेकंदांत अत्यंत तीव्र झाली का (विजेसारखी चमकून)?',
          es: '¿El dolor alcanzó su máxima intensidad en segundos?',
        },
        required: true,
        riskCategory: 'HIGH',
        redFlagRisk: true,
      },
      {
        id: 'q_ha_neck_stiffness',
        fieldKey: 'neck_stiffness_fever',
        type: 'yes_no',
        prompt: {
          en: 'Do you have difficulty bending your chin to your chest (stiff neck) or high fever?',
          hi: 'क्या गर्दन में अकड़न है जिससे ठोड़ी सीने तक नहीं झुक पा रही, या तेज बुखार है?',
          mr: 'मान ताठ झाली आहे का किंवा हनुवटी छातीला टेकवणे कठीण जात आहे का?',
          es: '¿Tiene rigidez en el cuello o fiebre alta?',
        },
        required: true,
        riskCategory: 'HIGH',
        redFlagRisk: true,
      },
    ],
  },

  // 6. BREATHLESSNESS
  BREATHLESSNESS: {
    complaintCode: 'BREATHLESSNESS',
    title: 'Acute Dyspnea & Respiratory Distress',
    questions: [
      {
        id: 'q_dyspnea_rest',
        fieldKey: 'shortness_of_breath_at_rest',
        type: 'yes_no',
        prompt: {
          en: 'Are you struggling to breathe even while sitting still and resting?',
          hi: 'क्या शांत बैठे रहने पर भी सांस लेने में तकलीफ हो रही है?',
          mr: 'शांत बसलेले असतानाही श्वास घेण्यास त्रास होत आहे का?',
          es: '¿Le falta el aire incluso estando en reposo?',
        },
        required: true,
        riskCategory: 'HIGH',
        redFlagRisk: true,
      },
      {
        id: 'q_dyspnea_stridor_cyanosis',
        fieldKey: 'cyanosis_stridor',
        type: 'yes_no',
        prompt: {
          en: 'Have you noticed blue lips/fingertips or a harsh whistling sound while inhaling?',
          hi: 'क्या होंठ या उंगलियां नीली पड़ रही हैं या सांस खींचते समय सीटी जैसी आवाज आ रही है?',
          mr: 'ओठ किंवा नखे निळसर पडत आहेत का किंवा श्वास घेताना शिटीसारखा आवाज येतो का?',
          es: '¿Tiene labios o uñas azuladas o silbido al respirar?',
        },
        required: true,
        riskCategory: 'HIGH',
        redFlagRisk: true,
      },
    ],
  },

  // 7. VOMITING / DIARRHEA
  VOMITING_DIARRHEA: {
    complaintCode: 'VOMITING_DIARRHEA',
    title: 'Acute Gastroenteritis & Dehydration',
    questions: [
      {
        id: 'q_gi_frequency',
        fieldKey: 'stool_frequency_24h',
        type: 'single_choice',
        prompt: {
          en: 'How many loose stools or vomiting episodes in the last 24 hours?',
          hi: 'पिछले 24 घंटों में कितनी बार पतले दस्त या उल्टी हुई?',
          mr: 'गेल्या २४ तासांत किती वेळा जुलाब किंवा उलट्या झाल्या?',
          es: '¿Cuántos episodios de vómito o diarrea en 24 horas?',
        },
        options: [
          { value: '1_3', label: { en: '1 to 3 times', hi: '1 से 3 बार', mr: '१ ते ३ वेळा', es: '1 a 3 veces' } },
          { value: '4_6', label: { en: '4 to 6 times', hi: '4 से 6 बार', mr: '४ ते ६ वेळा', es: '4 a 6 veces' } },
          { value: 'severe_7_plus', label: { en: 'More than 6 times (Frequent)', hi: '6 से अधिक बार (लगातार)', mr: '६ पेक्षा जास्त वेळा', es: 'Más de 6 veces' } },
        ],
        required: true,
        riskCategory: 'LOW',
      },
      {
        id: 'q_gi_dehydration',
        fieldKey: 'anuria_lethargy',
        type: 'yes_no',
        prompt: {
          en: 'Has the patient stopped urinating, or is extremely drowsy / unable to drink fluids?',
          hi: 'क्या पेशाब आना बंद हो गया है या मरीज बहुत सुस्त / पानी पीने में असमर्थ है?',
          mr: 'लघवी होणे बंद झाले आहे का किंवा रुग्ण अत्यंत गळून गेला आहे का?',
          es: '¿No ha orinado o está demasiado débil para tomar líquidos?',
        },
        required: true,
        riskCategory: 'HIGH',
        redFlagRisk: true,
      },
    ],
  },

  // 8. JOINT PAIN
  JOINT_PAIN: {
    complaintCode: 'JOINT_PAIN',
    title: 'Musculoskeletal & Arthritis Triage',
    questions: [
      {
        id: 'q_joint_swelling',
        fieldKey: 'joint_swelling_redness',
        type: 'yes_no',
        prompt: {
          en: 'Is there noticeable swelling, heat, or redness over the painful joint?',
          hi: 'क्या दर्द वाले जोड़ में सूजन, लालिमा या गर्माहट महसूस हो रही है?',
          mr: 'दुखणाऱ्या सांध्यावर सूज, लालसरपणा किंवा उष्णता जाणवते का?',
          es: '¿Hay hinchazón, calor o enrojecimiento en la articulación?',
        },
        required: true,
        riskCategory: 'LOW',
      },
      {
        id: 'q_joint_weightbearing',
        fieldKey: 'inability_to_bear_weight',
        type: 'yes_no',
        prompt: {
          en: 'Are you completely unable to stand or bear weight on the affected leg/joint?',
          hi: 'क्या आप उस पैर या जोड़ पर बिल्कुल भी वजन नहीं डाल पा रहे हैं?',
          mr: 'त्या पायावर किंवा सांध्यावर जराही भार देणे अशक्य झाले आहे का?',
          es: '¿Es completamente incapaz de apoyar peso sobre la articulación?',
        },
        required: true,
        riskCategory: 'HIGH',
        redFlagRisk: true,
      },
    ],
  },

  // 9. URINARY SYMPTOMS
  URINARY_SYMPTOMS: {
    complaintCode: 'URINARY_SYMPTOMS',
    title: 'Urinary Tract & Renal Evaluation',
    questions: [
      {
        id: 'q_uri_dysuria',
        fieldKey: 'burning_micturition',
        type: 'yes_no',
        prompt: {
          en: 'Do you feel a painful burning sensation when urinating?',
          hi: 'क्या पेशाब करते समय जलन या तेज दर्द होता है?',
          mr: 'लघवी करताना जळजळ किंवा वेदना होतात का?',
          es: '¿Siente ardor o dolor al orinar?',
        },
        required: true,
        riskCategory: 'LOW',
      },
      {
        id: 'q_uri_hematuria',
        fieldKey: 'frank_hematuria',
        type: 'yes_no',
        prompt: {
          en: 'Have you noticed red or tea-colored blood in your urine?',
          hi: 'क्या पेशाब में खून या गहरा लाल / चाय जैसा रंग दिखा है?',
          mr: 'लघवीतून रक्त किंवा चहासारखा गडद लाल रंग दिसला आहे का?',
          es: '¿Ha visto sangre o color rojizo oscuro en su orina?',
        },
        required: true,
        riskCategory: 'HIGH',
        redFlagRisk: true,
      },
    ],
  },

  // 10. DIABETES / HYPERTENSION FOLLOW-UP
  DIABETES_HYPERTENSION: {
    complaintCode: 'DIABETES_HYPERTENSION',
    title: 'Chronic Cardiometabolic Routine Surveillance',
    questions: [
      {
        id: 'q_chronic_med_compliance',
        fieldKey: 'medication_adherence',
        type: 'single_choice',
        prompt: {
          en: 'Have you been taking your daily BP or Sugar medications regularly?',
          hi: 'क्या आप अपनी बीपी या शुगर की दवाएं नियमित रूप से ले रहे हैं?',
          mr: 'तुम्ही रक्तदाब किंवा मधुमेहाची औषधे नियमित घेत आहात का?',
          es: '¿Ha estado tomando sus medicamentos para la presión o azúcar puntualmente?',
        },
        options: [
          { value: 'always', label: { en: 'Always regular', hi: 'हाँ, हमेशा नियमित', mr: 'होय, नियमित', es: 'Siempre puntual' } },
          { value: 'missed_sometimes', label: { en: 'Missed some doses', hi: 'कभी-कभी छूट जाती है', mr: 'कधीतरी सुटतात', es: 'Olvido a veces' } },
          { value: 'stopped', label: { en: 'Stopped taking them', hi: 'दवा बंद कर दी है', mr: 'बंद केली आहेत', es: 'Los suspendí' } },
        ],
        required: true,
        riskCategory: 'LOW',
      },
      {
        id: 'q_chronic_acute_headache_vision',
        fieldKey: 'blurred_vision_chest_tightness',
        type: 'yes_no',
        prompt: {
          en: 'Are you currently experiencing sudden blurry vision, severe occipital headache, or chest heaviness?',
          hi: 'क्या आपको अचानक धुंधला दिखना, सिर के पिछले हिस्से में तेज दर्द या सीने में भारीपन लग रहा है?',
          mr: 'धुसर दिसणे, डोक्याच्या पाठीमागे तीव्र डोकेदुखी किंवा छातीवर जडपणा जाणवत आहे का?',
          es: '¿Tiene visión borrosa repentina, dolor de cabeza severo o pesadez en el pecho?',
        },
        required: true,
        riskCategory: 'HIGH',
        redFlagRisk: true,
      },
    ],
  },
};
