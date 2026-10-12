import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const translations = {
  te: {
    'Postpartum & Maternal Care Tracker': 'ప్రసవానంతర & మాతృ సంరక్షణ ట్రాకర్',
    'Care at your pace': 'మీ వేగంతో సంరక్షణ',
    Home: 'హోమ్', Screening: 'ఆరోగ్య పరిశీలన', Notebook: 'నోట్‌బుక్', Recovery: 'కోలుకునే ప్రయాణం',
    'Baby logs': 'శిశువు వివరాలు', 'Care team': 'సంరక్షణ బృందం', Family: 'కుటుంబం',
    Reminders: 'రిమైండర్లు', Community: 'కమ్యూనిటీ', Admin: 'నిర్వాహకుడు', Lactation: 'తల్లిపాల సలహా',
    Account: 'ఖాతా', Contents: 'విషయ సూచిక', 'Care Plan': 'సంరక్షణ ప్రణాళిక',
    'Baby Logs': 'శిశువు వివరాలు', 'Wellbeing check-in': 'ఆరోగ్య తనిఖీ',
    'Family sharing': 'కుటుంబంతో పంచుకోవడం', 'Admin tools': 'నిర్వాహక సాధనాలు',
    'Your space': 'మీ స్థలం', 'My notebook': 'నా నోట్‌బుక్', 'A little reminder': 'ఒక చిన్న గుర్తుచేయింపు',
    'Your wellbeing matters, too. Take this one day at a time.': 'మీ ఆరోగ్యం కూడా ముఖ్యం. ఒక్కో రోజును ఒక్కోసారి చూసుకోండి.',
    'Gentle support for your postpartum journey · Your care, your pace': 'మీ ప్రసవానంతర ప్రయాణానికి సున్నితమైన తోడు · మీ సంరక్షణ, మీ వేగం',
    'Postpartum wellbeing': 'ప్రసవానంతర ఆరోగ్యం', 'Care for your baby.': 'మీ బిడ్డను చూసుకోండి.',
    ' And care for you.': ' మీ గురించి కూడా శ్రద్ధ వహించండి.',
    'The early days are a lot to hold. Find a quiet moment to check in, keep the little details together, and reach for support when you need it.': 'ప్రారంభ రోజులు కొంచెం కష్టంగా ఉండవచ్చు. మీ ఆరోగ్యాన్ని గమనించడానికి, చిన్న విషయాలను నమోదు చేయడానికి, అవసరమైనప్పుడు సహాయం పొందడానికి కొంత సమయం కేటాయించండి.',
    'Take a gentle check-in': 'ఆరోగ్యాన్ని సున్నితంగా పరిశీలించండి', 'Open my notebook': 'నా నోట్‌బుక్ తెరవండి',
    'Sign in or create account': 'సైన్ ఇన్ చేయండి లేదా ఖాతా సృష్టించండి',
    'Your journey is personal. Your health information stays private.': 'మీ ప్రయాణం మీది. మీ ఆరోగ్య సమాచారం గోప్యంగా ఉంటుంది.',
    'You matter, too.': 'మీరు కూడా ముఖ్యం.', 'One day at a time': 'ఒక్కో రోజు చొప్పున',
    'A little support': 'కొంత తోడు', 'Your care, all in one place': 'మీ సంరక్షణ వివరాలన్నీ ఒకే చోట',
    'Choose what feels helpful today': 'ఈ రోజు మీకు ఉపయోగపడేదాన్ని ఎంచుకోండి',
    'Your wellbeing': 'మీ ఆరోగ్యం', 'Pause & check in': 'ఆగి మీ ఆరోగ్యాన్ని గమనించండి',
    'A gentle, private reflection on how you have been feeling.': 'మీరు ఎలా ఉన్నారో వ్యక్తిగతంగా, ప్రశాంతంగా ఆలోచించండి.',
    'Start a check-in': 'ఆరోగ్య తనిఖీని ప్రారంభించండి', 'Your recovery': 'మీ కోలுதல்', 'Care plan': 'సంరక్షణ ప్రణాళిక',
    'Keep track of milestones and notice the progress you are making.': 'ముఖ్యమైన దశలను నమోదు చేసి మీ పురోగతిని గమనించండి.',
    'View care plan': 'సంరక్షణ ప్రణాళికను చూడండి', 'Little moments': 'చిన్న క్షణాలు',
    'Record feeds, sleep and diaper changes in one simple place.': 'పాలు, నిద్ర, డైపర్ మార్పులను ఒకే చోట నమోదు చేయండి.',
    'Open baby logs': 'శిశువు వివరాలు తెరవండి',
    'There is no perfect way to do postpartum. This space is here to meet you where you are, without pressure or judgment.': 'ప్రసవానంతర సంరక్షణకు ఒకే సరైన మార్గం లేదు. ఒత్తిడి లేదా తీర్పు లేకుండా, మీరు ఉన్న స్థితిలో మీకు తోడుగా ఉండటానికి ఈ స్థలం ఉంది.',
    'Your privacy matters': 'మీ గోప్యత ముఖ్యం', 'Welcome back': 'తిరిగి స్వాగతం', 'Create your account': 'మీ ఖాతాను సృష్టించండి',
    Name: 'పేరు', Email: 'ఇమెయిల్', Password: 'పాస్‌వర్డ్', 'Use 8 to 128 characters.': '8 నుండి 128 అక్షరాలను ఉపయోగించండి.',
    'Sign in': 'సైన్ ఇన్', 'Create account': 'ఖాతా సృష్టించండి',
    'New here? Create a mother account': 'కొత్తవారా? తల్లి ఖాతాను సృష్టించండి',
    'Already have an account? Sign in': 'ఇప్పటికే ఖాతా ఉందా? సైన్ ఇన్ చేయండి',
    'I understand this app stores sensitive wellbeing and care information so it can provide the features I choose. Screening is not a diagnosis. I agree to the': 'నేను ఎంచుకున్న సేవలను అందించడానికి ఈ యాప్ నా ఆరోగ్యం మరియు సంరక్షణకు సంబంధించిన సున్నితమైన సమాచారాన్ని నిల్వ చేస్తుందని అర్థం చేసుకున్నాను. ఈ పరిశీలన వైద్య నిర్ధారణ కాదు. నేను అంగీకరిస్తున్నాను:',
    'privacy notice': 'గోప్యతా నోటీసు',
    'Choose language': 'భాషను ఎంచుకోండి', English: 'ఇంగ్లీష్', Hindi: 'హిందీ', Telugu: 'తెలుగు',
    'How are you feeling?': 'మీకు ఎలా అనిపిస్తోంది?',
    'This private check-in is a chance to pause and notice how you have been feeling over the past seven days.': 'గత ఏడు రోజులుగా మీకు ఎలా అనిపించిందో గమనించడానికి ఈ ప్రైవేట్ తనిఖీ ఒక అవకాశం.',
    'A gentle check-in': 'సున్నితమైన ఆరోగ్య తనిఖీ', 'One page at a time, at your own pace.': 'ఒక్కో పేజీ చొప్పున, మీ వేగంతో.',
    'Your private wellbeing journal': 'మీ వ్యక్తిగత ఆరోగ్య డైరీ', 'Past 7 days': 'గత 7 రోజులు',
    Beginning: 'ప్రారంభం', 'Last page': 'చివరి పేజీ', 'Keep going gently': 'నెమ్మదిగా కొనసాగించండి',
    'Choose the answer that feels closest to your experience.': 'మీ అనుభవానికి దగ్గరగా అనిపించే సమాధానాన్ని ఎంచుకోండి.',
    'Previous page': 'మునుపటి పేజీ', 'Turn to next page': 'తదుపరి పేజీకి వెళ్లండి',
    'Finish check-in': 'తనిఖీని పూర్తి చేయండి', 'Your answers are private. You can go back and change an answer before finishing.': 'మీ సమాధానాలు గోప్యంగా ఉంటాయి. పూర్తి చేయడానికి ముందు వెనక్కి వెళ్లి సమాధానాన్ని మార్చవచ్చు.',
    'Your answers are still here.': 'మీ సమాధానాలు ఇక్కడే ఉన్నాయి.', 'to save this check-in and view your private screening history.': 'ఈ తనిఖీని భద్రపరచి మీ ప్రైవేట్ తనిఖీ చరిత్రను చూడటానికి.',
    'You can get help right now': 'మీరు ఇప్పుడే సహాయం పొందవచ్చు',
    'Your screening history': 'మీ తనిఖీ చరిత్ర', 'Scores are shown over time, from 0 to 30.': 'స్కోర్లు కాలక్రమంలో 0 నుండి 30 వరకు చూపబడతాయి.',
    'Thank you for checking in': 'మీ పరిస్థితిని పంచుకున్నందుకు ధన్యవాదాలు',
    'Your answers suggest fewer signs of distress right now. Your feelings still matter, and support is here whenever you need it.': 'ప్రస్తుతం మీ సమాధానాల్లో ఆందోళన సంకేతాలు తక్కువగా కనిపిస్తున్నాయి. అయినప్పటికీ మీ భావాలు ముఖ్యం. అవసరమైనప్పుడు సహాయం అందుబాటులో ఉంటుంది.',
    'You deserve support': 'మీకు సహాయం అందాలి',
    'Your answers suggest you may be having a difficult time. Consider sharing how you feel with someone you trust or your care team.': 'మీరు కష్టమైన సమయాన్ని ఎదుర్కొంటున్నట్లు మీ సమాధానాలు సూచిస్తున్నాయి. మీరు నమ్మే వ్యక్తితో లేదా సంరక్షణ బృందంతో మీ భావాలను పంచుకోండి.',
    'Please reach out for support': 'దయచేసి సహాయం కోసం సంప్రదించండి',
    'Please connect with support now': 'దయచేసి ఇప్పుడే సహాయం పొందండి',
    'Your answers suggest extra support could be helpful. If you can, contact your healthcare professional soon and let someone you trust know how you are feeling.': 'మీకు అదనపు సహాయం ఉపయోగపడవచ్చని మీ సమాధానాలు సూచిస్తున్నాయి. వీలైతే త్వరలో ఆరోగ్య నిపుణుడిని సంప్రదించి, మీరు నమ్మే వ్యక్తికి మీ పరిస్థితిని తెలియజేయండి.',
    'Your answers suggest you should speak with a healthcare professional as soon as possible. You do not have to manage this alone.': 'వీలైనంత త్వరగా ఆరోగ్య నిపుణుడితో మాట్లాడాలని మీ సమాధానాలు సూచిస్తున్నాయి. మీరు దీన్ని ఒంటరిగా ఎదుర్కోవాల్సిన అవసరం లేదు.'
  },
  hi: {
    'Postpartum & Maternal Care Tracker': 'प्रसवोत्तर एवं मातृ देखभाल ट्रैकर',
    'Care at your pace': 'आपकी गति से देखभाल',
    Home: 'होम', Screening: 'स्वास्थ्य जाँच', Notebook: 'नोटबुक', Recovery: 'स्वास्थ्य लाभ',
    'Baby logs': 'शिशु रिकॉर्ड', 'Care team': 'देखभाल टीम', Family: 'परिवार',
    Reminders: 'रिमाइंडर', Community: 'समुदाय', Admin: 'प्रशासक', Lactation: 'स्तनपान सलाह',
    Account: 'खाता', Contents: 'विषय सूची', 'Care Plan': 'देखभाल योजना',
    'Baby Logs': 'शिशु रिकॉर्ड', 'Wellbeing check-in': 'स्वास्थ्य जाँच',
    'Family sharing': 'परिवार के साथ साझा करें', 'Admin tools': 'प्रशासक के साधन',
    'Your space': 'आपकी जगह', 'My notebook': 'मेरी नोटबुक', 'A little reminder': 'एक छोटी सी याद दिलाना',
    'Your wellbeing matters, too. Take this one day at a time.': 'आपका स्वास्थ्य भी मायने रखता है। एक समय में एक दिन पर ध्यान दें।',
    'Gentle support for your postpartum journey · Your care, your pace': 'आपकी प्रसवोत्तर यात्रा में सहज सहयोग · आपकी देखभाल, आपकी गति',
    'Postpartum wellbeing': 'प्रसवोत्तर स्वास्थ्य', 'Care for your baby.': 'अपने शिशु की देखभाल करें.',
    ' And care for you.': ' और अपनी भी देखभाल करें.',
    'The early days are a lot to hold. Find a quiet moment to check in, keep the little details together, and reach for support when you need it.': 'शुरुआती दिन चुनौतीपूर्ण हो सकते हैं। अपना हाल जानने, छोटी बातों को सँभालने और ज़रूरत पड़ने पर मदद पाने के लिए एक शांत पल निकालें।',
    'Take a gentle check-in': 'सहज स्वास्थ्य जाँच करें', 'Open my notebook': 'मेरी नोटबुक खोलें',
    'Sign in or create account': 'साइन इन करें या खाता बनाएँ',
    'Your journey is personal. Your health information stays private.': 'आपकी यात्रा व्यक्तिगत है। आपकी स्वास्थ्य जानकारी गोपनीय रहती है।',
    'You matter, too.': 'आप भी महत्वपूर्ण हैं.', 'One day at a time': 'एक दिन में एक कदम',
    'A little support': 'थोड़ा सहारा', 'Your care, all in one place': 'आपकी देखभाल, एक ही जगह',
    'Choose what feels helpful today': 'आज जो उपयोगी लगे, उसे चुनें',
    'Your wellbeing': 'आपका स्वास्थ्य', 'Pause & check in': 'ठहरें और अपना हाल जानें',
    'A gentle, private reflection on how you have been feeling.': 'आप कैसा महसूस कर रही हैं, इस पर एक सहज और निजी विचार।',
    'Start a check-in': 'जाँच शुरू करें', 'Your recovery': 'आपका स्वास्थ्य लाभ', 'Care plan': 'देखभाल योजना',
    'Keep track of milestones and notice the progress you are making.': 'महत्वपूर्ण पड़ाव दर्ज करें और अपनी प्रगति देखें।',
    'View care plan': 'देखभाल योजना देखें', 'Little moments': 'नन्हे पल',
    'Record feeds, sleep and diaper changes in one simple place.': 'दूध पिलाने, नींद और डायपर बदलने का रिकॉर्ड एक ही जगह रखें।',
    'Open baby logs': 'शिशु रिकॉर्ड खोलें',
    'There is no perfect way to do postpartum. This space is here to meet you where you are, without pressure or judgment.': 'प्रसवोत्तर देखभाल का कोई एक सही तरीका नहीं है। यह जगह बिना दबाव या आलोचना के, आपकी स्थिति के अनुसार आपका साथ देने के लिए है।',
    'Your privacy matters': 'आपकी गोपनीयता मायने रखती है', 'Welcome back': 'वापसी पर स्वागत है', 'Create your account': 'अपना खाता बनाएँ',
    Name: 'नाम', Email: 'ईमेल', Password: 'पासवर्ड', 'Use 8 to 128 characters.': '8 से 128 अक्षरों का उपयोग करें.',
    'Sign in': 'साइन इन', 'Create account': 'खाता बनाएँ',
    'New here? Create a mother account': 'नई हैं? माँ का खाता बनाएँ',
    'Already have an account? Sign in': 'पहले से खाता है? साइन इन करें',
    'I understand this app stores sensitive wellbeing and care information so it can provide the features I choose. Screening is not a diagnosis. I agree to the': 'मैं समझती हूँ कि चुनी हुई सुविधाएँ देने के लिए यह ऐप मेरी स्वास्थ्य और देखभाल से जुड़ी संवेदनशील जानकारी सहेजता है। यह जाँच चिकित्सीय निदान नहीं है। मैं सहमत हूँ:',
    'privacy notice': 'गोपनीयता सूचना',
    'Choose language': 'भाषा चुनें', English: 'अंग्रेज़ी', Hindi: 'हिन्दी', Telugu: 'तेलुगु',
    'How are you feeling?': 'आप कैसा महसूस कर रही हैं?',
    'This private check-in is a chance to pause and notice how you have been feeling over the past seven days.': 'यह निजी जाँच पिछले सात दिनों में आपकी भावनाओं पर ध्यान देने का एक अवसर है।',
    'A gentle check-in': 'सहज स्वास्थ्य जाँच', 'One page at a time, at your own pace.': 'एक बार में एक पृष्ठ, अपनी गति से।',
    'Your private wellbeing journal': 'आपकी निजी स्वास्थ्य डायरी', 'Past 7 days': 'पिछले 7 दिन',
    Beginning: 'शुरुआत', 'Last page': 'आखिरी पृष्ठ', 'Keep going gently': 'धीरे-धीरे आगे बढ़ें',
    'Choose the answer that feels closest to your experience.': 'वह उत्तर चुनें जो आपके अनुभव के सबसे करीब हो।',
    'Previous page': 'पिछला पृष्ठ', 'Turn to next page': 'अगले पृष्ठ पर जाएँ',
    'Finish check-in': 'जाँच पूरी करें', 'Your answers are private. You can go back and change an answer before finishing.': 'आपके उत्तर निजी हैं। पूरा करने से पहले आप वापस जाकर उत्तर बदल सकती हैं।',
    'Your answers are still here.': 'आपके उत्तर अभी भी यहाँ हैं.', 'to save this check-in and view your private screening history.': 'इस जाँच को सहेजने और अपना निजी जाँच इतिहास देखने के लिए.',
    'You can get help right now': 'आप अभी सहायता पा सकती हैं',
    'Your screening history': 'आपका जाँच इतिहास', 'Scores are shown over time, from 0 to 30.': 'स्कोर समय के साथ 0 से 30 तक दिखाए जाते हैं।',
    'Thank you for checking in': 'अपना हाल बताने के लिए धन्यवाद',
    'Your answers suggest fewer signs of distress right now. Your feelings still matter, and support is here whenever you need it.': 'आपके उत्तरों में अभी परेशानी के कम संकेत दिखते हैं। फिर भी आपकी भावनाएँ मायने रखती हैं। ज़रूरत पड़ने पर सहायता उपलब्ध है।',
    'You deserve support': 'आपको सहायता मिलनी चाहिए',
    'Your answers suggest you may be having a difficult time. Consider sharing how you feel with someone you trust or your care team.': 'आपके उत्तर बताते हैं कि आप कठिन समय से गुज़र रही हो सकती हैं। किसी भरोसेमंद व्यक्ति या देखभाल टीम से अपनी भावनाएँ साझा करें।',
    'Please reach out for support': 'कृपया सहायता के लिए संपर्क करें',
    'Please connect with support now': 'कृपया अभी सहायता लें',
    'Your answers suggest extra support could be helpful. If you can, contact your healthcare professional soon and let someone you trust know how you are feeling.': 'आपके उत्तर बताते हैं कि अतिरिक्त सहायता उपयोगी हो सकती है। संभव हो तो जल्द ही स्वास्थ्य विशेषज्ञ से संपर्क करें और किसी भरोसेमंद व्यक्ति को अपनी स्थिति बताएँ।',
    'Your answers suggest you should speak with a healthcare professional as soon as possible. You do not have to manage this alone.': 'आपके उत्तर बताते हैं कि आपको जल्द से जल्द स्वास्थ्य विशेषज्ञ से बात करनी चाहिए। आपको यह अकेले सँभालने की ज़रूरत नहीं है।'
  }
};

const LocaleContext = createContext({ language: 'en', setLanguage: () => {}, t: (text) => text });

export function LocaleProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = window.localStorage.getItem('care-tracker-language');
    return ['en', 'hi', 'te'].includes(saved) ? saved : 'en';
  });

  useEffect(() => {
    window.localStorage.setItem('care-tracker-language', language);
    document.documentElement.lang = language === 'en' ? 'en' : language === 'hi' ? 'hi' : 'te';
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (text) => translations[language]?.[text] || text
  }), [language]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
