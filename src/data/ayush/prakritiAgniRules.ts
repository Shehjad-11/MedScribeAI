/**
 * MedScribeAI — AYUSH Thin Slice: Prakriti & Agni Assessment Rules
 *
 * STATUS: PENDING BAMS REVIEW
 * NOTICE: Unvalidated prototype. Contains zero real patient data.
 * Must be visibly tagged with "PENDING BAMS REVIEW" across all screens.
 * Clinician oversight is strictly mandatory. Never auto-diagnose or auto-prescribe.
 */

import { ClinicalFact, ProvenanceSource, ProvenanceMethod, AyushAssessment } from '../../types/clinicalCase';

export const AYUSH_REVIEW_STATUS = 'PENDING BAMS REVIEW';

export const AYUSH_DISCLAIMER =
  'NOTICE: This AYUSH Prakriti and Agni assessment is an unvalidated prototype under evaluation. ' +
  'It has NOT received formal BAMS practitioner sign-off. It is strictly informational for the treating ' +
  'physician and must never be used for autonomous clinical decision-making or prescribing.';

export interface AyushQuestionOption {
  id: string;
  label: {
    en: string;
    hi: string;
    mr: string;
  };
  dosha?: 'vata' | 'pitta' | 'kapha';
  agniType?: 'vishama' | 'tikshna' | 'manda' | 'sama';
  classicalReference?: string;
}

export interface AyushQuestion {
  id: string;
  category: 'prakriti' | 'agni';
  title: {
    en: string;
    hi: string;
    mr: string;
  };
  clinicalRationale: string;
  reviewStatus: typeof AYUSH_REVIEW_STATUS;
  options: AyushQuestionOption[];
}

export const PRAKRITI_QUESTIONS: AyushQuestion[] = [
  {
    id: 'ayush_prakriti_frame',
    category: 'prakriti',
    title: {
      en: 'Body Frame & Physique',
      hi: 'शारीरिक बनावट (शरीर का ढांचा)',
      mr: 'शारीरिक रचना (शरीराची ठेवण)',
    },
    clinicalRationale: 'Assessment of Sharira Pramana and Samhanana per Charaka Samhita Vimana Sthana 8',
    reviewStatus: AYUSH_REVIEW_STATUS,
    options: [
      {
        id: 'frame_vata',
        label: {
          en: 'Lean, slender, prominent joints, difficulty gaining weight',
          hi: 'दुबला-पतला, हड्डियां उभरी हुई, वजन मुश्किल से बढ़ना',
          mr: 'बारीक, सडपातळ, सांधे स्पष्ट दिसणारे, वजन वाढण्यास कठीण',
        },
        dosha: 'vata',
        classicalReference: 'Charaka Vimana 8:98 (Alpa Sharira)',
      },
      {
        id: 'frame_pitta',
        label: {
          en: 'Medium athletic build, moderate muscle mass, stable weight',
          hi: 'मध्यम बनावट, सामान्य मांसपेशियां, स्थिर वजन',
          mr: 'मध्यम बांधा, स्नायूंची मध्यम वाढ, स्थिर वजन',
        },
        dosha: 'pitta',
        classicalReference: 'Charaka Vimana 8:97 (Madhya Sharira)',
      },
      {
        id: 'frame_kapha',
        label: {
          en: 'Broad, sturdy, well-developed bone frame, gains weight easily',
          hi: 'चौड़ा, भारी ढांचा, मजबूत हड्डियां, वजन तेजी से बढ़ना',
          mr: 'धष्टपुष्ट, रुंद बांधा, बळकट हाडे, वजन सहज वाढणारे',
        },
        dosha: 'kapha',
        classicalReference: 'Charaka Vimana 8:96 (Brihat Sharira)',
      },
    ],
  },
  {
    id: 'ayush_prakriti_skin_hair',
    category: 'prakriti',
    title: {
      en: 'Skin & Hair Characteristics',
      hi: 'त्वचा और बालों का प्रकार',
      mr: 'त्वचा आणि केसांचे प्रकार',
    },
    clinicalRationale: 'Assessment of Sparsha and Kesa lakshana per Ashtanga Hridaya Sutrasthana 1',
    reviewStatus: AYUSH_REVIEW_STATUS,
    options: [
      {
        id: 'skin_vata',
        label: {
          en: 'Dry, rough skin, prone to cracks; thin, brittle or frizzy hair',
          hi: 'सूखी, खुरदरी त्वचा; पतले, रूखे या घुंघराले बाल',
          mr: 'कोरडी, खडबडीत त्वचा; बारीक, कोरडे किंवा राठ केस',
        },
        dosha: 'vata',
        classicalReference: 'Ashtanga Hridaya Sutra 1 (Ruksha, Khara)',
      },
      {
        id: 'skin_pitta',
        label: {
          en: 'Warm, reddish/flushed skin, prone to moles/freckles; fine hair, early greying',
          hi: 'गर्म, लालिमा युक्त त्वचा, तिल या मुँहासे; पतले बाल, समय से पहले सफेद होना',
          mr: 'उबदार, लालसर त्वचा, तीळ किंवा मुरुमे; पातळ केस, अकाली पांढरे होणे',
        },
        dosha: 'pitta',
        classicalReference: 'Ashtanga Hridaya Sutra 1 (Ushna, Tikshna, Goura)',
      },
      {
        id: 'skin_kapha',
        label: {
          en: 'Thick, smooth, oily/cool skin; dense, dark, lustrous thick hair',
          hi: 'चिकनी, ठंडी और तैलीय त्वचा; घने, काले और चमकदार बाल',
          mr: 'मऊ, तेलकट आणि थंड त्वचा; दाट, काळे आणि चमकदार केस',
        },
        dosha: 'kapha',
        classicalReference: 'Ashtanga Hridaya Sutra 1 (Snigdha, Slakshna, Sandra)',
      },
    ],
  },
  {
    id: 'ayush_prakriti_weather',
    category: 'prakriti',
    title: {
      en: 'Weather & Temperature Sensitivity',
      hi: 'मौसम और तापमान की संवेदनशीलता',
      mr: 'हवामान आणि तापमानाची संवेदनशीलता',
    },
    clinicalRationale: 'Assessment of Sheeta/Ushna Satmya per Sushruta Samhita Sharira Sthana 4',
    reviewStatus: AYUSH_REVIEW_STATUS,
    options: [
      {
        id: 'weather_vata',
        label: {
          en: 'Dislikes cold and dry drafts; prefers warm, sunny weather',
          hi: 'ठंड और शुष्क हवा बर्दाश्त नहीं होती; गर्म मौसम पसंद है',
          mr: 'थंडी आणि कोरडी हवा सहन होत नाही; उबदार वातावरण आवडते',
        },
        dosha: 'vata',
        classicalReference: 'Sushruta Sharira 4:64 (Sheeta Asahatva)',
      },
      {
        id: 'weather_pitta',
        label: {
          en: 'Dislikes excessive heat and direct sunlight; prefers cool breezes',
          hi: 'अत्यधिक गर्मी और धूप बर्दाश्त नहीं होती; ठंडी जगह पसंद है',
          mr: 'अति उष्णता आणि प्रखर ऊन सहन होत नाही; थंड जागा आवडते',
        },
        dosha: 'pitta',
        classicalReference: 'Sushruta Sharira 4:68 (Ushna Asahatva)',
      },
      {
        id: 'weather_kapha',
        label: {
          en: 'Dislikes damp cold and humid rainy seasons; tolerates summer well',
          hi: 'गीला ठंडा या नमी वाला मौसम नापसंद; गर्मी आसानी से सहते हैं',
          mr: 'दमट थंडी आणि पावसाळा सहन होत नाही; उन्हाळा सहज सहन होतो',
        },
        dosha: 'kapha',
        classicalReference: 'Sushruta Sharira 4:72 (Kleda Asahatva)',
      },
    ],
  },
  {
    id: 'ayush_prakriti_temperament',
    category: 'prakriti',
    title: {
      en: 'Mental Temperament & Stress Response',
      hi: 'मानसिक स्वभाव और तनाव की स्थिति',
      mr: 'मानसिक स्वभाव आणि ताणतणावाची प्रतिक्रिया',
    },
    clinicalRationale: 'Assessment of Manasa Guna and Sattva per Charaka Sharira Sthana 4',
    reviewStatus: AYUSH_REVIEW_STATUS,
    options: [
      {
        id: 'temp_vata',
        label: {
          en: 'Quick learner, enthusiastic, quick to worry/anxiety under pressure',
          hi: 'तेजी से समझने वाले, उत्साही, तनाव में जल्दी चिंतित या बेचैन',
          mr: 'चपळ, उत्साही, तणावाखाली लगेच घाबरणारे किंवा अस्वस्थ होणारे',
        },
        dosha: 'vata',
        classicalReference: 'Charaka Sharira 4:36 (Chala Chitta, Bhaya)',
      },
      {
        id: 'temp_pitta',
        label: {
          en: 'Sharp intellect, decisive, ambitious, irritable or impatient when frustrated',
          hi: 'तेज बुद्धि, निर्णय लेने में तेज, काम न होने पर गुस्सा या चिड़चिड़ापन',
          mr: 'तीक्ष्ण बुद्धिमत्ता, महत्वाकांक्षी, काम रखडल्यास चटकन चिडणारे',
        },
        dosha: 'pitta',
        classicalReference: 'Charaka Sharira 4:37 (Krodha, Tejas)',
      },
      {
        id: 'temp_kapha',
        label: {
          en: 'Calm, patient, forgiving, slow to react, resistant to sudden change',
          hi: 'शांत, धैर्यवान, क्षमाशील, धीरे प्रतिक्रिया देने वाले, बदलाव नापसंद',
          mr: 'शांत, सहनशील, सावकाश प्रतिक्रिया देणारे, बदलास विरोध करणारे',
        },
        dosha: 'kapha',
        classicalReference: 'Charaka Sharira 4:38 (Dhriti, Gambhira)',
      },
    ],
  },
  {
    id: 'ayush_prakriti_sleep',
    category: 'prakriti',
    title: {
      en: 'Sleep Quality & Pattern',
      hi: 'नींद की गुणवत्ता और स्वभाव',
      mr: 'झोपेची गुणवत्ता आणि पद्धत',
    },
    clinicalRationale: 'Assessment of Nidra lakshana per Charaka Sutra Sthana 21',
    reviewStatus: AYUSH_REVIEW_STATUS,
    options: [
      {
        id: 'sleep_vata',
        label: {
          en: 'Light, interrupted sleep, easily awakened by small noises',
          hi: 'हल्की, टूटने वाली नींद, छोटी आवाज से भी जाग जाना',
          mr: 'हलकी, वारंवार उघडणारी झोप, लहानशा आवाजानेही जाग येणे',
        },
        dosha: 'vata',
        classicalReference: 'Charaka Sutra 21:35 (Alpa Nidra)',
      },
      {
        id: 'sleep_pitta',
        label: {
          en: 'Moderate sound sleep (6-7 hrs), wake refreshed, vivid dreams',
          hi: 'मध्यम गहरी नींद (6-7 घंटे), उठने पर ताजगी, स्पष्ट सपने',
          mr: 'मध्यम शांत झोप (६-७ तास), उठल्यावर ताजेतवाने, स्पष्ट स्वप्ने',
        },
        dosha: 'pitta',
        classicalReference: 'Charaka Sutra 21:36 (Madhya Nidra)',
      },
      {
        id: 'sleep_kapha',
        label: {
          en: 'Deep, heavy, prolonged sleep (>8 hrs), hard to wake up early',
          hi: 'गहरी, भारी नींद (8+ घंटे), सुबह जल्दी उठना मुश्किल',
          mr: 'गाढ, दीर्घ झोप (८+ तास), सकाळी लवकर उठणे जड वाटणे',
        },
        dosha: 'kapha',
        classicalReference: 'Charaka Sutra 21:37 (Ati Nidra)',
      },
    ],
  },
];

export const AGNI_QUESTIONS: AyushQuestion[] = [
  {
    id: 'ayush_agni_appetite',
    category: 'agni',
    title: {
      en: 'Appetite Regularity',
      hi: 'भूख की नियमितता',
      mr: 'भुकेची नियमितता',
    },
    clinicalRationale: 'Assessment of Jarana Shakti & Abhyavaharana Shakti per Charaka Vimana 8',
    reviewStatus: AYUSH_REVIEW_STATUS,
    options: [
      {
        id: 'agni_app_vishama',
        label: {
          en: 'Irregular/Variable: ravenous on some days, zero appetite on others',
          hi: 'अनियमित: कभी बहुत तेज भूख, कभी बिल्कुल भूख नहीं लगती',
          mr: 'अनियमित: कधी खूप भूक लागते, तर कधी अजिबात लागत नाही',
        },
        agniType: 'vishama',
        classicalReference: 'Charaka Grahani Chikitsa 15:51 (Vishama Agni - Vata)',
      },
      {
        id: 'agni_app_tikshna',
        label: {
          en: 'Excessive/Intense: cannot tolerate delayed meals, irritable when hungry',
          hi: 'अत्यधिक तीव्र: खाना मिलने में देरी बर्दाश्त नहीं, भूख में चिड़चिड़ापन',
          mr: 'तीव्र: जेवणात उशीर अजिबात चालत नाही, भूक लागल्यावर चिडचिड होते',
        },
        agniType: 'tikshna',
        classicalReference: 'Charaka Grahani Chikitsa 15:52 (Tikshna Agni - Pitta)',
      },
      {
        id: 'agni_app_manda',
        label: {
          en: 'Sluggish/Low: feel full for many hours, eat out of habit not hunger',
          hi: 'मंद/धीमी: कई घंटों तक पेट भरा रहता है, भूख कम आदत से खाते हैं',
          mr: 'मंद/कमी: अनेक तास पोट भरल्यासारखे वाटते, भुकेपेक्षा सवयीने खाणे',
        },
        agniType: 'manda',
        classicalReference: 'Charaka Grahani Chikitsa 15:53 (Manda Agni - Kapha)',
      },
      {
        id: 'agni_app_sama',
        label: {
          en: 'Balanced: regular hunger at fixed meal times without distress',
          hi: 'संतुलित: निश्चित समय पर सामान्य भूख, कोई बेचैनी नहीं',
          mr: 'संतुलित: ठराविक वेळेला योग्य भूक, कोणतीही अस्वस्थता नाही',
        },
        agniType: 'sama',
        classicalReference: 'Charaka Grahani Chikitsa 15:50 (Sama Agni - Balanced)',
      },
    ],
  },
  {
    id: 'ayush_agni_post_meal',
    category: 'agni',
    title: {
      en: 'Post-Meal Digestive Sensation',
      hi: 'भोजन के बाद पेट की स्थिति',
      mr: 'जेवणानंतर पचनाची जाणीव',
    },
    clinicalRationale: 'Assessment of Pakvasthana and Grahani status per Ashtanga Hridaya Sharira 3',
    reviewStatus: AYUSH_REVIEW_STATUS,
    options: [
      {
        id: 'agni_post_vishama',
        label: {
          en: 'Bloating, gas, rumbling sounds, or colicky tightness',
          hi: 'पेट फूलना, गैस, गुड़गुड़ाहट या पेट में मरोड़',
          mr: 'पोट फुगणे, गॅस, पोटात आवाज येणे किंवा मुरडा होणे',
        },
        agniType: 'vishama',
        classicalReference: 'Ashtanga Hridaya Nidana 8 (Adhmana, Anaha)',
      },
      {
        id: 'agni_post_tikshna',
        label: {
          en: 'Heartburn, acid reflux, sour belching, or burning in stomach',
          hi: 'छाती में जलन, एसिडिटी, खट्टी डकारें या पेट में जलन',
          mr: 'छातीत जळजळ, आम्लपित्त, आंबट ढेकर किंवा पोटात उष्णता',
        },
        agniType: 'tikshna',
        classicalReference: 'Ashtanga Hridaya Nidana 8 (Amlika, Vidaha)',
      },
      {
        id: 'agni_post_manda',
        label: {
          en: 'Heavy fullness, sluggish lethargy, drowsiness after eating',
          hi: 'भारीपन, सुस्ती, आलस, भोजन के तुरंत बाद नींद आना',
          mr: 'पोटात जडपणा, सुस्ती, थकवा, जेवणानंतर झोप येणे',
        },
        agniType: 'manda',
        classicalReference: 'Ashtanga Hridaya Nidana 8 (Gourava, Tandra)',
      },
      {
        id: 'agni_post_sama',
        label: {
          en: 'Comfortable digestion, lightness in body within 2-3 hours',
          hi: 'आरामदायक पाचन, 2-3 घंटे में शरीर में हल्कापन',
          mr: 'सहज पचन, २-३ तासांत शरीराला हलकेपणा वाटणे',
        },
        agniType: 'sama',
        classicalReference: 'Ashtanga Hridaya Nidana 8 (Laghuta, Sukha)',
      },
    ],
  },
  {
    id: 'ayush_agni_bowel',
    category: 'agni',
    title: {
      en: 'Bowel Habits & Evacuation',
      hi: 'शौच और मल त्याग की प्रकृति (कोष्ठ)',
      mr: 'शौचाची सवय आणि मलप्रवृत्ती (कोष्ठ)',
    },
    clinicalRationale: 'Assessment of Koshtha lakshana (Krura, Mridu, Madhyama) per Charaka Samhita Sutra 11',
    reviewStatus: AYUSH_REVIEW_STATUS,
    options: [
      {
        id: 'agni_bowel_vishama',
        label: {
          en: 'Dry, hard stools, tendency to constipation, irregular days (Krura Koshtha)',
          hi: 'कड़ा सूखा मल, कब्ज की प्रवृत्ति, कभी रोज कभी नहीं (क्रूर कोष्ठ)',
          mr: 'कोरडा, घट्ट मल, बद्धकोष्ठतेची प्रवृत्ती, अनियमित दिवस (क्रूर कोष्ठ)',
        },
        agniType: 'vishama',
        classicalReference: 'Charaka Sutra 11:47 (Krura Koshtha)',
      },
      {
        id: 'agni_bowel_tikshna',
        label: {
          en: 'Loose or semi-solid stools, urgent, burning sensation (Mridu Koshtha)',
          hi: 'पतला या ढीला मल, मलत्याग में जलन, तुरंत हाजत होना (मृदु कोष्ठ)',
          mr: 'पातळ किंवा सैल मल, तीव्र घाई, मलमार्गात जळजळ (मृदु कोष्ठ)',
        },
        agniType: 'tikshna',
        classicalReference: 'Charaka Sutra 11:48 (Mridu Koshtha)',
      },
      {
        id: 'agni_bowel_manda',
        label: {
          en: 'Heavy, mucous-like, slow evacuation, incomplete feeling',
          hi: 'भारी, चिपचिपा मल, धीमी हाजत, पेट पूरी तरह साफ न लगना',
          mr: 'जड, बुळबुळीत मल, सावकाश संडास होणे, पोट अपूर्ण साफ झाल्याची भावना',
        },
        agniType: 'manda',
        classicalReference: 'Charaka Sutra 11:49 (Guru Pureesha)',
      },
      {
        id: 'agni_bowel_sama',
        label: {
          en: 'Formed, smooth, regular 1-2 times daily without strain (Madhyama Koshtha)',
          hi: 'सामान्य, बंधा हुआ मल, दिन में 1-2 बार सहज सफाई (मध्यम कोष्ठ)',
          mr: 'व्यवस्थित बांधलेला मल, दिवसातून १-२ वेळा सहज पोट साफ होणे (मध्यम कोष्ठ)',
        },
        agniType: 'sama',
        classicalReference: 'Charaka Sutra 11:50 (Madhyama Koshtha)',
      },
    ],
  },
];

/**
 * Result of the deterministic scoring calculation
 */
export interface AyushScoreResult {
  prakriti: {
    dominantDosha: string;
    tally: { vata: number; pitta: number; kapha: number };
    totalAnswered: number;
    reviewStatus: typeof AYUSH_REVIEW_STATUS;
  };
  agni: {
    primaryAgni: string;
    tally: { vishama: number; tikshna: number; manda: number; sama: number };
    totalAnswered: number;
    reviewStatus: typeof AYUSH_REVIEW_STATUS;
  };
  disclaimer: string;
  isMock: boolean;
}

/**
 * Deterministic scoring engine for Prakriti and Agni responses.
 * Transparent, verifiable tally-based evaluation without LLM hallucinations.
 */
export function evaluateAyushAssessment(
  responses: Record<string, string> // questionId -> optionId
): AyushScoreResult {
  const prakritiTally = { vata: 0, pitta: 0, kapha: 0 };
  let prakritiAnswered = 0;

  for (const q of PRAKRITI_QUESTIONS) {
    const selectedId = responses[q.id];
    if (selectedId) {
      const opt = q.options.find((o) => o.id === selectedId);
      if (opt && opt.dosha) {
        prakritiTally[opt.dosha]++;
        prakritiAnswered++;
      }
    }
  }

  const agniTally = { vishama: 0, tikshna: 0, manda: 0, sama: 0 };
  let agniAnswered = 0;

  for (const q of AGNI_QUESTIONS) {
    const selectedId = responses[q.id];
    if (selectedId) {
      const opt = q.options.find((o) => o.id === selectedId);
      if (opt && opt.agniType) {
        agniTally[opt.agniType]++;
        agniAnswered++;
      }
    }
  }

  // Determine dominant dosha
  let dominantDosha = 'Unassessed / Incomplete';
  if (prakritiAnswered > 0) {
    const { vata, pitta, kapha } = prakritiTally;
    if (vata === pitta && pitta === kapha) {
      dominantDosha = 'Sama Prakriti (Tridoshic Balanced) [PENDING BAMS REVIEW]';
    } else if (vata > pitta && vata > kapha) {
      dominantDosha = 'Vata Dominant Prakriti [PENDING BAMS REVIEW]';
    } else if (pitta > vata && pitta > kapha) {
      dominantDosha = 'Pitta Dominant Prakriti [PENDING BAMS REVIEW]';
    } else if (kapha > vata && kapha > pitta) {
      dominantDosha = 'Kapha Dominant Prakriti [PENDING BAMS REVIEW]';
    } else if (vata === pitta && vata > kapha) {
      dominantDosha = 'Vata-Pitta Dvandvaja Prakriti [PENDING BAMS REVIEW]';
    } else if (pitta === kapha && pitta > vata) {
      dominantDosha = 'Pitta-Kapha Dvandvaja Prakriti [PENDING BAMS REVIEW]';
    } else if (vata === kapha && vata > pitta) {
      dominantDosha = 'Vata-Kapha Dvandvaja Prakriti [PENDING BAMS REVIEW]';
    }
  }

  // Determine primary Agni
  let primaryAgni = 'Unassessed / Incomplete';
  if (agniAnswered > 0) {
    const { vishama, tikshna, manda, sama } = agniTally;
    const maxVal = Math.max(vishama, tikshna, manda, sama);
    if (sama === maxVal && sama > 0) {
      primaryAgni = 'Sama Agni (Balanced/Regular Metabolism) [PENDING BAMS REVIEW]';
    } else if (vishama === maxVal) {
      primaryAgni = 'Vishama Agni (Irregular/Vata Type) [PENDING BAMS REVIEW]';
    } else if (tikshna === maxVal) {
      primaryAgni = 'Tikshna Agni (Intense/Pitta Type) [PENDING BAMS REVIEW]';
    } else if (manda === maxVal) {
      primaryAgni = 'Manda Agni (Sluggish/Kapha Type) [PENDING BAMS REVIEW]';
    }
  }

  return {
    prakriti: {
      dominantDosha,
      tally: prakritiTally,
      totalAnswered: prakritiAnswered,
      reviewStatus: AYUSH_REVIEW_STATUS,
    },
    agni: {
      primaryAgni,
      tally: agniTally,
      totalAnswered: agniAnswered,
      reviewStatus: AYUSH_REVIEW_STATUS,
    },
    disclaimer: AYUSH_DISCLAIMER,
    isMock: false,
  };
}

/**
 * Builds structured AyushAssessment ClinicalFacts with full provenance
 */
export function buildAyushClinicalFacts(
  assessmentResult: AyushScoreResult,
  patientConfirmed = true
): AyushAssessment {
  const timestamp = new Date().toISOString();

  const prakritiFact: ClinicalFact<string> = {
    field: 'prakriti',
    value: assessmentResult.prakriti.dominantDosha,
    category: 'ayush',
    provenance: {
      source: 'PATIENT_REPORTED' as ProvenanceSource,
      method: 'touch' as ProvenanceMethod,
      timestamp,
      verificationState: patientConfirmed ? 'patient_confirmed' : 'unverified',
      confidence: 1.0,
      rawFragment: `Prakriti responses: Vata=${assessmentResult.prakriti.tally.vata}, Pitta=${assessmentResult.prakriti.tally.pitta}, Kapha=${assessmentResult.prakriti.tally.kapha}`,
      verifiedBy: undefined, // Unverified by clinician until BAMS sign-off
    },
  };

  const agniFact: ClinicalFact<string> = {
    field: 'agni',
    value: assessmentResult.agni.primaryAgni,
    category: 'ayush',
    provenance: {
      source: 'PATIENT_REPORTED' as ProvenanceSource,
      method: 'touch' as ProvenanceMethod,
      timestamp,
      verificationState: patientConfirmed ? 'patient_confirmed' : 'unverified',
      confidence: 1.0,
      rawFragment: `Agni responses: Vishama=${assessmentResult.agni.tally.vishama}, Tikshna=${assessmentResult.agni.tally.tikshna}, Manda=${assessmentResult.agni.tally.manda}, Sama=${assessmentResult.agni.tally.sama}`,
      verifiedBy: undefined,
    },
  };

  return {
    prakriti: prakritiFact,
    agni: agniFact,
    reviewedBy: undefined,
    reviewedAt: undefined,
  };
}
