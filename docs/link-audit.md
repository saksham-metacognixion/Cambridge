# Link audit

Generated 2026-10-06 by `node tools/qc/links.mjs` against the built site (`npm run build`, served by `tools/qc/serve.mjs`). Crawl start: the six edition home pages; every internal link followed; every pop-up hash (#book-appointment, #send-inquiry, #your-opinion) and in-page hash checked.

## Fixes made during this audit (5 Oct 2026)

All destinations are configuration (JSON `page` / `path` / `care` / `action` keys), never hard-coded in components, so each can be changed without code. Items with no real destination yet point to the closest existing page and are logged in `docs/open-decisions.md` (LA1-LA6).

| Where | Before | After | Log |
|---|---|---|---|
| Header + footer "Knowledge Center" | `#` | Media Hub, Health Articles category (`media-hub?category=health-articles#latest`) | LA1 (no Knowledge Center page in Figma or scope) |
| Home hero "Learn More" | `#` | About Cambridge | LA2 |
| Home doctors row | all six buttons `#` | "Book Now" opens the Book an Appointment pop-up with the doctor preselected; "See More" opens the doctor's profile | fixed |
| Home testimonials "View More Stories" | `#` | Patient Testimonials page | fixed |
| Home health calculators "Calculate Now" (4) | `#` | Patient Hub | LA4 (no calculator pages: not in scope) |
| Home "Services" cards, Our Care cards, hospital care cards, footer Services column | `#` | Our Care service pages (`our-care/<service>`) | OC3 |
| Header + footer "Our Care" | `#` | Our Care hub | OC3 |
| Home facilities "Visit Page", Our Hospitals "View Hospital", footer hospital names | Contact page / `#` | Hospital detail pages (own region when the current edition has none) | HD3 |
| Media Hub cards, Home News cards | `media-hub/<slug>` (no page) / `#` | Article pages; the three Home placeholder posts link to the 404 page until the export | AR5 |
| Footer "Compliance" / "Privacy Policy", every form's consent "Privacy policy" link (Contact page form included) | `#` | Legal pages | L1 |
| Language and region switches on hospital pages | 404 for a hospital the other region does not have | nearest existing parent (`our-hospitals` list) | LA5 |
| Post Acute "Know More" cards | new | condition detail pages / Conditions list | OC4 |

Still pointing to a stand-in page (needs an answer): Knowledge Center (LA1), Learn More (LA2), calculators (LA4), Home News placeholder posts (AR5). Social icons (LA6): linked to the live site's profiles since 6 Oct 2026 (`src/data/social.json`). URLs follow the live site since 6 Oct 2026 (WP1): `/faqs`, `/contact-us`, `/about/why-cambridge-hospital`, `/about/who-we-are`, `/patient-hub/find-a-doctor`, `/legal/<slug>`, `/care/home-healthcare`, `/care/in-school`.

## Summary

| Check | Result |
|---|---|
| Pages crawled | 1002 (200) |
| Internal links resolving | 47301 |
| In-page hash links resolving | 48 |
| Pop-up links (#book-appointment / #send-inquiry / #your-opinion) | 7104 |
| External / tel: / mailto: links valid | 4158 / 6 / 12 |
| Language + edition switches landing on the same page | 5010 (24 of them on the nearest existing parent, because the page has no version in that edition) |
| **Broken internal links** | **0** |
| **Hash links without a target** | **0** |
| **Malformed external / tel / mailto** | **0** |
| **href="#" links** | **0 occurrences (0 distinct labels)** |
| **Switch problems** | **0** |

## Pages

| Path | Status | Title | Links |
|---|---|---|---|
| / | 200 | Cambridge Hospital | 111 |
| /about | 200 | About Cambridge / Cambridge Hospital | 60 |
| /about/accreditations-partnerships | 200 | Accreditations &amp; Partnerships / Cambridge Hospital | 56 |
| /about/careers | 200 | Career Hub / Cambridge Hospital | 56 |
| /about/who-we-are | 200 | Who We Are / Cambridge Hospital | 56 |
| /about/why-cambridge-hospital | 200 | Why Cambridge / Cambridge Hospital | 59 |
| /ae | 200 | Cambridge Hospital | 111 |
| /ae/about | 200 | About Cambridge / Cambridge Hospital | 60 |
| /ae/about/accreditations-partnerships | 200 | Accreditations &amp; Partnerships / Cambridge Hospital | 56 |
| /ae/about/careers | 200 | Career Hub / Cambridge Hospital | 56 |
| /ae/about/who-we-are | 200 | Who We Are / Cambridge Hospital | 56 |
| /ae/about/why-cambridge-hospital | 200 | Why Cambridge / Cambridge Hospital | 59 |
| /ae/ar | 200 | مجموعة مستشفيات كامبريدج | 111 |
| /ae/ar/about | 200 | حول مستشفى كامبريدج / مستشفى كامبريدج | 60 |
| /ae/ar/about/accreditations-partnerships | 200 | الاعتمادات والشراكات / مستشفى كامبريدج | 56 |
| /ae/ar/about/careers | 200 | مركز التوظيف / مستشفى كامبريدج | 56 |
| /ae/ar/about/who-we-are | 200 | من نحن / مستشفى كامبريدج | 56 |
| /ae/ar/about/why-cambridge-hospital | 200 | لماذا مستشفى كامبريدج / مستشفى كامبريدج | 59 |
| /ae/ar/care | 200 | خدماتنا / مستشفى كامبريدج | 64 |
| /ae/ar/care/home-healthcare | 200 | خدمات الرعاية المنزلية / Cambridge Hospital | 60 |
| /ae/ar/care/in-school | 200 | خدمة الرعاية المدرسية / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient | 200 | خدمات المرضى الداخلية / Cambridge Hospital | 66 |
| /ae/ar/care/inpatient/icu-critical-care | 200 | ICU and Critical Care / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient/long-term-care-rehab | 200 | Long-Term Care &amp; Rehabilitation / Cambridge Hospital | 64 |
| /ae/ar/care/inpatient/long-term-care-rehab/geriatric-care | 200 | Geriatric Care / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient/long-term-care-rehab/long-term-acute-care | 200 | Long-Term Acute Care / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient/long-term-care-rehab/long-term-care | 200 | Long-Term Care / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient/long-term-care-rehab/paediatric-long-term-care | 200 | Paediatric Long-Term Care / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient/palliative-care | 200 | Palliative Care / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient/pediatric-rehab | 200 | Paediatric Care / Cambridge Hospital | 67 |
| /ae/ar/care/inpatient/pediatric-rehab/central-nervous-system | 200 | Central Nervous System Anomalies Rehabilitation / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient/pediatric-rehab/long-term-cardiac | 200 | Long-Term Cardiac Anomalies Rehabilitation / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient/pediatric-rehab/neuromuscular-rehab | 200 | Paediatric Neuromuscular Rehabilitation / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient/pediatric-rehab/paediatric-post-acute-rehab | 200 | Paediatric Post-Acute Rehabilitation / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient/pediatric-rehab/paediatric-transitional | 200 | Paediatric Transitional Care / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient/pediatric-rehab/pulmonary-rehab | 200 | Paediatric Pulmonary Rehabilitation / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient/pediatric-rehab/speech-language-rehab | 200 | Speech and Language Rehabilitation / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient/post-acute-rehabilitation | 200 | Post-Acute Rehabilitation / Cambridge Hospital | 64 |
| /ae/ar/care/inpatient/post-acute-rehabilitation/musculoskeletal-rehabilitation | 200 | Musculoskeletal Rehabilitation / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient/post-acute-rehabilitation/neurorehabilitation | 200 | Neurorehabilitation / Cambridge Hospital | 63 |
| /ae/ar/care/inpatient/post-acute-rehabilitation/neurorehabilitation/spinal-cord-injury-rehabilitation | 200 | Spinal Cord Injury Rehabilitation / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient/post-acute-rehabilitation/neurorehabilitation/stroke-rehabilitation | 200 | Stroke Rehabilitation / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient/post-acute-rehabilitation/neurorehabilitation/traumatic-brain-injury-rehabilitation | 200 | Traumatic Brain Injury Rehabilitation / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient/post-acute-rehabilitation/post-surgical-rehabilitation | 200 | Post-Surgical Rehabilitation / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient/post-acute-rehabilitation/road-traffic-accident-rehabilitation | 200 | Road Traffic Accident Rehabilitation / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient/ventilated-patients-care | 200 | Ventilated Patients Care / Cambridge Hospital | 62 |
| /ae/ar/care/inpatient/ventilated-patients-care/long-term-ventilated-care | 200 | Long-Term Ventilated Care / Cambridge Hospital | 60 |
| /ae/ar/care/inpatient/ventilated-patients-care/weaning-programme | 200 | Weaning Programme / Cambridge Hospital | 60 |
| /ae/ar/care/outpatient | 200 | خدمات العيادات الخارجية / Cambridge Hospital | 66 |
| /ae/ar/care/outpatient/cerebral-palsy-program | 200 | Cerebral Palsy Programme / Cambridge Hospital | 60 |
| /ae/ar/care/outpatient/occupational-therapy | 200 | Occupational Therapy / Cambridge Hospital | 60 |
| /ae/ar/care/outpatient/pediatric-care | 200 | Paediatric Care / Cambridge Hospital | 60 |
| /ae/ar/care/outpatient/physical-medicine-rehab-care | 200 | Physical Medicine and Rehabilitation Care / Cambridge Hospital | 60 |
| /ae/ar/care/outpatient/physiotherapy | 200 | Physiotherapy / Cambridge Hospital | 60 |
| /ae/ar/care/outpatient/speech-language-therapy | 200 | Speech and Language Therapy / Cambridge Hospital | 60 |
| /ae/ar/contact-us | 200 | اتصل بنا / مستشفى كامبريدج | 60 |
| /ae/ar/faqs | 200 | الأسئلة الشائعة / مستشفى كامبريدج | 52 |
| /ae/ar/hospitals | 200 | مستشفياتنا / مستشفى كامبريدج | 63 |
| /ae/ar/hospitals/al-mudeef-center-abu-dhabi | 200 | مركز المضيف أبوظبي / Cambridge Hospital | 66 |
| /ae/ar/hospitals/cambridge-hospital-abu-dhabi | 200 | مستشفى كامبريدج أبوظبي / Cambridge Hospital | 66 |
| /ae/ar/hospitals/cambridge-hospital-al-ain | 200 | مستشفى كامبريدج العين / Cambridge Hospital | 66 |
| /ae/ar/hospitals/cambridge-hospital-al-khobar | 404 | Page not found / Cambridge Hospital | 56 |
| /ae/ar/hospitals/cambridge-hospital-dhahran | 404 | Page not found / Cambridge Hospital | 56 |
| /ae/ar/hospitals/cambridge-hospital-jeddah | 404 | Page not found / Cambridge Hospital | 56 |
| /ae/ar/legal/gdpr-compliance | 200 | الامتثال للائحة البيانات العامة لحماية البيانات / Cambridge Hospital | 51 |
| /ae/ar/legal/privacy-policy | 200 | سياسة الخصوصية / Cambridge Hospital | 51 |
| /ae/ar/media-hub | 200 | المركز الإعلامي / مستشفى كامبريدج | 68 |
| /ae/ar/media-hub/16th-hot-topics-in-pediatrics-conference-and-exhibition | 200 | المؤتمر والمعرض السادس عشر للمواضيع الساخنة في طب الأطفال / Cambridge Hospital | 60 |
| /ae/ar/media-hub/17th-seha-international-pediatric-conference | 200 | المؤتمر الدولي السابع عشر لطب الأطفال SEHA / Cambridge Hospital | 60 |
| /ae/ar/media-hub/1st-ehs-international-critical-care-organ-donation-and-transplant-conference | 200 | المؤتمر الدولي الأول للرعاية الحرجة والتبرع بالأعضاء وزراعة الأعضاء / Cambridge Hospital | 60 |
| /ae/ar/media-hub/1st-seha-national-corporate-case-management-symposium | 200 | الندوة الوطنية الأولى لإدارة الحالات المؤسسية التابعة ل SEHA / Cambridge Hospital | 60 |
| /ae/ar/media-hub/20th-emirates-critical-care-conference | 200 | المؤتمر العشرون للرعاية الحرجة في الإمارات / Cambridge Hospital | 60 |
| /ae/ar/media-hub/2nd-international-pediatric-neurodisability-and-neurorehabilitation-conference | 200 | المؤتمر الدولي الثاني لعلاج الإعاقة العصبية للأطفال وإعادة التأهيل العصبي / Cambridge Hospital | 60 |
| /ae/ar/media-hub/8-exercises-for-easing-tennis-elbow-plus-prevention-tips | 200 | 8 تمارين لتخفيف نصائح الوقاية من كوع التنس بلس / Cambridge Hospital | 65 |
| /ae/ar/media-hub/a-family-reunion-supporting-emotional-recovery | 200 | لم شمل عائلي يدعم التعافي العاطفي / Cambridge Hospital | 60 |
| /ae/ar/media-hub/a-musical-parade-at-al-mudeef-center | 200 | موكب موسيقي في مركز المديف / Cambridge Hospital | 60 |
| /ae/ar/media-hub/abdullah-an-emirati-youth-a-beacon-of-hope-and-a-success-story | 200 | عبد الله، شاب إماراتي، منارة أمل وقصة نجاح / Cambridge Hospital | 60 |
| /ae/ar/media-hub/al-khobar-opening-and-employee-recognition | 200 | افتتاح الخبر وتكريم الموظفين / Cambridge Hospital | 60 |
| /ae/ar/media-hub/al-mudeef-centre-achieves-jci-accreditation-following-comprehensive-transformation | 200 | مركز المضيف يحصل على اعتماد JCI بعد تحول شامل / Cambridge Hospital | 61 |
| /ae/ar/media-hub/amanat-holdings-acquires-cambridge-hospital | 200 | استحواذ أمانات القابضة على مستشفى كامبريدج / Cambridge Hospital | 61 |
| /ae/ar/media-hub/brachial-plexus-injury-diagnosis-treatment-and-rehabilitation | 200 | إصابة الضفيرة العضدية: التشخيص، العلاج، وإعادة التأهيل / Cambridge Hospital | 64 |
| /ae/ar/media-hub/cambridge-health-group-announces-sar-100-million-jeddah-expansion | 200 | مجموعة كامبريدج للصحة تعلن عن توسعة جدة بقيمة 100 مليون ريال سعودي / Cambridge Hospital | 61 |
| /ae/ar/media-hub/carpal-tunnel-syndrome-and-other-entrapment-neuropathies-and-role-of-occupational-therapy | 200 | متلازمة النفق الرسغي وغيرها من الاعتلالات العصبية الحبس ودور العلاج الوظيفي / Cambridge Hospital | 67 |
| /ae/ar/media-hub/dr-rober-interview-al-arabiya-tv | 200 | مقابلة د. روبير – قناة العربية / Cambridge Hospital | 61 |
| /ae/ar/patient-hub | 200 | مركز المرضى / مستشفى كامبريدج | 66 |
| /ae/ar/patient-hub/conditions-specialities | 200 | الحالات والتخصصات / مستشفى كامبريدج | 76 |
| /ae/ar/patient-hub/conditions-specialities/acquired-brain-injury | 200 | إصابة الدماغ المكتسبة / مستشفى كامبريدج | 60 |
| /ae/ar/patient-hub/conditions-specialities/amputation-prosthetic-rehabilitation | 200 | البتر وإعادة التأهيل بالأطراف الصناعية / مستشفى كامبريدج | 60 |
| /ae/ar/patient-hub/conditions-specialities/back-pain-lumbar-rehabilitation | 200 | آلام الظهر وإعادة التأهيل القطني / مستشفى كامبريدج | 60 |
| /ae/ar/patient-hub/conditions-specialities/epilepsy | 200 | الصرع / مستشفى كامبريدج | 60 |
| /ae/ar/patient-hub/conditions-specialities/fracture-rehabilitation | 200 | إعادة تأهيل الكسور / مستشفى كامبريدج | 60 |
| /ae/ar/patient-hub/conditions-specialities/guillain-barre-syndrome | 200 | متلازمة غيلان-باري / مستشفى كامبريدج | 60 |
| /ae/ar/patient-hub/conditions-specialities/hip-fracture-rehabilitation | 200 | إعادة تأهيل كسر الورك وكسر عنق الفخذ / مستشفى كامبريدج | 60 |
| /ae/ar/patient-hub/conditions-specialities/hip-knee-replacement-recovery | 200 | التعافي من استبدال الورك والركبة / مستشفى كامبريدج | 60 |
| /ae/ar/patient-hub/conditions-specialities/knee-ligament-cartilage-injuries | 200 | إصابات أربطة الركبة والغضاريف / مستشفى كامبريدج | 60 |
| /ae/ar/patient-hub/conditions-specialities/motor-neuron-diseases | 200 | أمراض الخلايا العصبية الحركية / مستشفى كامبريدج | 60 |
| /ae/ar/patient-hub/conditions-specialities/multiple-sclerosis | 200 | التصلب المتعدد / مستشفى كامبريدج | 60 |
| /ae/ar/patient-hub/conditions-specialities/musculoskeletal-orthopaedic-rehabilitation | 200 | إعادة التأهيل العضلي الهيكلي والعظمي / مستشفى كامبريدج | 60 |
| /ae/ar/patient-hub/conditions-specialities/neck-pain-cervical-rehabilitation | 200 | آلام الرقبة وإعادة التأهيل العنقي / مستشفى كامبريدج | 60 |
| /ae/ar/patient-hub/conditions-specialities/neurorehabilitation | 200 | إعادة التأهيل العصبي / مستشفى كامبريدج | 60 |
| /ae/ar/patient-hub/conditions-specialities/parkinsons-disease | 200 | مرض باركنسون / مستشفى كامبريدج | 60 |
| /ae/ar/patient-hub/conditions-specialities/shoulder-rotator-cuff-rehabilitation | 200 | إصابة الكتف وإعادة تأهيل الكفة المدورة / مستشفى كامبريدج | 60 |
| /ae/ar/patient-hub/conditions-specialities/spinal-cord-injury | 200 | إصابة الحبل الشوكي / مستشفى كامبريدج | 60 |
| /ae/ar/patient-hub/conditions-specialities/stroke-rehabilitation | 200 | إعادة تأهيل السكتة الدماغية / مستشفى كامبريدج | 60 |
| /ae/ar/patient-hub/conditions-specialities/tennis-elbow | 200 | كوع التنس / مستشفى كامبريدج | 60 |
| /ae/ar/patient-hub/conditions-specialities/traumatic-brain-injury | 200 | إصابة الدماغ الرضحية / مستشفى كامبريدج | 60 |
| /ae/ar/patient-hub/find-a-doctor | 200 | ابحث عن طبيب / مستشفى كامبريدج | 126 |
| /ae/ar/patient-hub/find-a-doctor/abbas-khalid | 200 | Dr. Abbas Khalid / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/abdulaziz-almetrek | 200 | Dr. Abdulaziz Almetrek / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/abdulaziz-alqutub | 200 | Dr. Abdulaziz Alqutub / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/abdulrahman-batarfi | 200 | Dr. Abdulrahman Batarfi / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/adnan-bahakam | 200 | Dr. Adnan Bahakam / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/ahmad-al-khayer | 200 | Dr. Ahmad Al Khayer / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/ahmad-almohamady | 200 | Dr. Ahmad Almohamady / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/ahmed-abdallah | 200 | Dr. Ahmed Abdallah / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/ahmed-basunbul | 200 | Dr. Ahmed Basunbul / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/ahmed-eldadah | 200 | Dr. Ahmed Eldadah / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/ahmed-elenani | 200 | Dr. Ahmed Elenani / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/ahmed-eltahir | 200 | Dr. Ahmed Eltahir / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/ahmed-ibrahim | 200 | Dr. Ahmed Ibrahim / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/ahmed-morsy | 200 | Dr. Ahmed Morsy / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/ahmed-rohoma | 200 | Dr. Ahmed Rohoma / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/ali-mahmoud | 200 | Dr. Ali Mahmoud / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/amgad-ali | 200 | Dr. Amgad Ali / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/amjad-abdel-qader | 200 | Dr. Amjad Abdel Qader / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/asma-mohamed | 200 | Dr. Asma Mohamed / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/asmaa-abdullah | 200 | Dr. Asmaa Abdullah / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/asmaa-alalay | 200 | Dr. Asmaa Alalay / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/bader-al-qahtani | 200 | Dr. Bader Al Qahtani / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/ebtihal-mohammed | 200 | Dr. Ebtihal Mohammed / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/elsanosi-habour | 200 | Dr. Elsanosi Habour / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/farahim-chaudhary | 200 | Dr. Farahim Chaudhary / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/hasan-abueideh | 200 | Dr. Hasan Abueideh / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/hesham-mustafa | 200 | Dr. Hesham Mustafa / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/isra-adam | 200 | Dr. Isra Adam / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/kashif-ahmed | 200 | Dr. Kashif Ahmed / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/khalifa-swidan | 200 | Dr. Khalifa Swidan / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/majed-osaylan | 200 | Dr. Majed Osaylan / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/maysa-osman | 200 | Dr. Maysa Osman / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/medhat-hagras | 200 | Dr. Medhat Hagras / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/mehnaz-abdul-ghafoor | 200 | Dr. Mehnaz Abdul Ghafoor / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/mohamed-bahrudeen | 200 | Dr. Mohamed Bahrudeen / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/mohamed-fathi | 200 | Dr. Mohamed Fathi / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/mohamed-kallash | 200 | Dr. Mohamed Kallash / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/mohammed-alhayyan | 200 | Dr. Mohammed Alhayyan / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/mohammed-bawahal | 200 | Dr. Mohammed Bawahal / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/mohammed-esmail | 200 | Dr. Mohammed Esmail / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/mohammed-halawani | 200 | Dr. Mohammed Halawani / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/mohammed-mugahed | 200 | Dr. Mohammed Mugahed / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/nada-mohamed | 200 | Dr. Nada Mohamed / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/nader-bin-taleb | 200 | Dr. Nader Bin Taleb / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/nansy-elnaggar | 200 | Dr. Nansy Elnaggar / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/omar-baaqil | 200 | Dr. Omar Baaqil / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/rao-tariq | 200 | Dr. Rao Tariq / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/rasha-mahgoub | 200 | Dr. Rasha Mahgoub / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/rawiyah-abdalla | 200 | Dr. Rawiyah Abdalla / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/rober-kassab | 200 | Dr. Rober Kassab / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/safa-alsayed | 200 | Dr. Safa Alsayed / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/safa-mohamed | 200 | Dr. Safa Mohamed / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/saleh-damnan | 200 | Dr. Saleh Damnan / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/sami-alamin | 200 | Dr. Sami Alamin / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/samuel-tefera | 200 | Dr. Samuel Tefera / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/setelnesa-mohamed | 200 | Dr. Setelnesa Mohamed / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/shayma-marganie | 200 | Dr. Shayma Marganie / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/sheema-jeelani | 200 | Dr. Sheema Jeelani / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/souad-mohamed | 200 | Dr. Souad Mohamed / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/suhaila-kallada | 200 | Dr. Suhaila Kallada / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/suheib-ahmed | 200 | Dr. Suheib Ahmed / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/tamer-eissa | 200 | Dr. Tamer Eissa / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/wael-mabruk | 200 | Dr. Wael Mabruk / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/wael-sary | 200 | Dr. Wael Sary / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/wafaa-farag | 200 | Dr. Wafaa Farag / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/walaa-elgheriany | 200 | Dr. Walaa Elgheriany / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/walaa-mohamed | 200 | Dr. Walaa Mohamed / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/wissam-al-safi | 200 | Dr. Wissam Al Safi / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/find-a-doctor/youssef-haggag | 200 | Dr. Youssef Haggag / Cambridge Hospital | 54 |
| /ae/ar/patient-hub/insurance-providers | 200 | شركات التأمين / مستشفى كامبريدج | 52 |
| /ae/ar/patient-hub/international-patients | 200 | المرضى الدوليون / مستشفى كامبريدج | 53 |
| /ae/ar/patient-hub/refer-a-patient | 200 | إحالة مريض / مستشفى كامبريدج | 59 |
| /ae/ar/patient-hub/testimonials | 200 | قصص نجاح المرضى / مستشفى كامبريدج | 56 |
| /ae/ar/your-opinion-matters | 200 | رأيك يهمنا / مستشفى كامبريدج | 53 |
| /ae/care | 200 | Our Care / Cambridge Hospital | 64 |
| /ae/care/home-healthcare | 200 | Home Care / Cambridge Hospital | 60 |
| /ae/care/in-school | 200 | In-School Care / Cambridge Hospital | 60 |
| /ae/care/inpatient | 200 | Inpatient Care / Cambridge Hospital | 66 |
| /ae/care/inpatient/icu-critical-care | 200 | ICU and Critical Care / Cambridge Hospital | 60 |
| /ae/care/inpatient/long-term-care-rehab | 200 | Long-Term Care &amp; Rehabilitation / Cambridge Hospital | 64 |
| /ae/care/inpatient/long-term-care-rehab/geriatric-care | 200 | Geriatric Care / Cambridge Hospital | 60 |
| /ae/care/inpatient/long-term-care-rehab/long-term-acute-care | 200 | Long-Term Acute Care / Cambridge Hospital | 60 |
| /ae/care/inpatient/long-term-care-rehab/long-term-care | 200 | Long-Term Care / Cambridge Hospital | 60 |
| /ae/care/inpatient/long-term-care-rehab/paediatric-long-term-care | 200 | Paediatric Long-Term Care / Cambridge Hospital | 60 |
| /ae/care/inpatient/palliative-care | 200 | Palliative Care / Cambridge Hospital | 60 |
| /ae/care/inpatient/pediatric-rehab | 200 | Paediatric Care / Cambridge Hospital | 67 |
| /ae/care/inpatient/pediatric-rehab/central-nervous-system | 200 | Central Nervous System Anomalies Rehabilitation / Cambridge Hospital | 60 |
| /ae/care/inpatient/pediatric-rehab/long-term-cardiac | 200 | Long-Term Cardiac Anomalies Rehabilitation / Cambridge Hospital | 60 |
| /ae/care/inpatient/pediatric-rehab/neuromuscular-rehab | 200 | Paediatric Neuromuscular Rehabilitation / Cambridge Hospital | 60 |
| /ae/care/inpatient/pediatric-rehab/paediatric-post-acute-rehab | 200 | Paediatric Post-Acute Rehabilitation / Cambridge Hospital | 60 |
| /ae/care/inpatient/pediatric-rehab/paediatric-transitional | 200 | Paediatric Transitional Care / Cambridge Hospital | 60 |
| /ae/care/inpatient/pediatric-rehab/pulmonary-rehab | 200 | Paediatric Pulmonary Rehabilitation / Cambridge Hospital | 60 |
| /ae/care/inpatient/pediatric-rehab/speech-language-rehab | 200 | Speech and Language Rehabilitation / Cambridge Hospital | 60 |
| /ae/care/inpatient/post-acute-rehabilitation | 200 | Post-Acute Rehabilitation / Cambridge Hospital | 64 |
| /ae/care/inpatient/post-acute-rehabilitation/musculoskeletal-rehabilitation | 200 | Musculoskeletal Rehabilitation / Cambridge Hospital | 60 |
| /ae/care/inpatient/post-acute-rehabilitation/neurorehabilitation | 200 | Neurorehabilitation / Cambridge Hospital | 63 |
| /ae/care/inpatient/post-acute-rehabilitation/neurorehabilitation/spinal-cord-injury-rehabilitation | 200 | Spinal Cord Injury Rehabilitation / Cambridge Hospital | 60 |
| /ae/care/inpatient/post-acute-rehabilitation/neurorehabilitation/stroke-rehabilitation | 200 | Stroke Rehabilitation / Cambridge Hospital | 60 |
| /ae/care/inpatient/post-acute-rehabilitation/neurorehabilitation/traumatic-brain-injury-rehabilitation | 200 | Traumatic Brain Injury Rehabilitation / Cambridge Hospital | 60 |
| /ae/care/inpatient/post-acute-rehabilitation/post-surgical-rehabilitation | 200 | Post-Surgical Rehabilitation / Cambridge Hospital | 60 |
| /ae/care/inpatient/post-acute-rehabilitation/road-traffic-accident-rehabilitation | 200 | Road Traffic Accident Rehabilitation / Cambridge Hospital | 60 |
| /ae/care/inpatient/ventilated-patients-care | 200 | Ventilated Patients Care / Cambridge Hospital | 62 |
| /ae/care/inpatient/ventilated-patients-care/long-term-ventilated-care | 200 | Long-Term Ventilated Care / Cambridge Hospital | 60 |
| /ae/care/inpatient/ventilated-patients-care/weaning-programme | 200 | Weaning Programme / Cambridge Hospital | 60 |
| /ae/care/outpatient | 200 | Outpatient Care / Cambridge Hospital | 66 |
| /ae/care/outpatient/cerebral-palsy-program | 200 | Cerebral Palsy Programme / Cambridge Hospital | 60 |
| /ae/care/outpatient/occupational-therapy | 200 | Occupational Therapy / Cambridge Hospital | 60 |
| /ae/care/outpatient/pediatric-care | 200 | Paediatric Care / Cambridge Hospital | 60 |
| /ae/care/outpatient/physical-medicine-rehab-care | 200 | Physical Medicine and Rehabilitation Care / Cambridge Hospital | 60 |
| /ae/care/outpatient/physiotherapy | 200 | Physiotherapy / Cambridge Hospital | 60 |
| /ae/care/outpatient/speech-language-therapy | 200 | Speech and Language Therapy / Cambridge Hospital | 60 |
| /ae/contact-us | 200 | Contact Us / Cambridge Hospital | 60 |
| /ae/faqs | 200 | Frequently Asked Questions / Cambridge Hospital | 52 |
| /ae/hospitals | 200 | Our Hospitals / Cambridge Hospital | 63 |
| /ae/hospitals/al-mudeef-center-abu-dhabi | 200 | Al Mudeef Centre Abu Dhabi / Cambridge Hospital | 66 |
| /ae/hospitals/cambridge-hospital-abu-dhabi | 200 | Cambridge Hospital Abu Dhabi / Cambridge Hospital | 66 |
| /ae/hospitals/cambridge-hospital-al-ain | 200 | Cambridge Hospital Al Ain / Cambridge Hospital | 66 |
| /ae/hospitals/cambridge-hospital-al-khobar | 404 | Page not found / Cambridge Hospital | 56 |
| /ae/hospitals/cambridge-hospital-dhahran | 404 | Page not found / Cambridge Hospital | 56 |
| /ae/hospitals/cambridge-hospital-jeddah | 404 | Page not found / Cambridge Hospital | 56 |
| /ae/legal/gdpr-compliance | 200 | GDPR Compliance / Cambridge Hospital | 51 |
| /ae/legal/privacy-policy | 200 | Privacy Policy / Cambridge Hospital | 51 |
| /ae/media-hub | 200 | Media Hub / Cambridge Hospital | 68 |
| /ae/media-hub/16th-hot-topics-in-pediatrics-conference-and-exhibition | 200 | 16th Hot Topics in Pediatrics Conference and Exhibition / Cambridge Hospital | 60 |
| /ae/media-hub/17th-seha-international-pediatric-conference | 200 | 17th SEHA International Pediatric Conference / Cambridge Hospital | 60 |
| /ae/media-hub/1st-ehs-international-critical-care-organ-donation-and-transplant-conference | 200 | 1st EHS International Critical Care, Organ Donation and Transplant Conference / Cambridge Hospital | 60 |
| /ae/media-hub/1st-seha-national-corporate-case-management-symposium | 200 | 1st SEHA National Corporate Case Management Symposium / Cambridge Hospital | 60 |
| /ae/media-hub/20th-emirates-critical-care-conference | 200 | 20th Emirates Critical Care Conference / Cambridge Hospital | 60 |
| /ae/media-hub/2nd-international-pediatric-neurodisability-and-neurorehabilitation-conference | 200 | 2nd International Paediatric Neurodisability and Neurorehabilitation Conference / Cambridge Hospital | 60 |
| /ae/media-hub/8-exercises-for-easing-tennis-elbow-plus-prevention-tips | 200 | 8 Exercises for Easing Tennis Elbow Plus Prevention Tips / Cambridge Hospital | 65 |
| /ae/media-hub/a-family-reunion-supporting-emotional-recovery | 200 | A Family Reunion Supporting Emotional Recovery / Cambridge Hospital | 60 |
| /ae/media-hub/a-musical-parade-at-al-mudeef-center | 200 | A Musical Parade at Al Mudeef Center / Cambridge Hospital | 60 |
| /ae/media-hub/abdullah-an-emirati-youth-a-beacon-of-hope-and-a-success-story | 200 | Abdullah, an Emirati youth, a beacon of hope and a success story / Cambridge Hospital | 60 |
| /ae/media-hub/al-khobar-opening-and-employee-recognition | 200 | Al Khobar Opening and Employee Recognition / Cambridge Hospital | 60 |
| /ae/media-hub/al-mudeef-centre-achieves-jci-accreditation-following-comprehensive-transformation | 200 | Al Mudeef Centre Achieves JCI Accreditation Following Comprehensive Transformation / Cambridge Hospital | 61 |
| /ae/media-hub/amanat-holdings-acquires-cambridge-hospital | 200 | Amanat Holdings Acquires Cambridge Hospital / Cambridge Hospital | 61 |
| /ae/media-hub/brachial-plexus-injury-diagnosis-treatment-and-rehabilitation | 200 | Brachial Plexus Injury: Diagnosis, Treatment, and Rehabilitation / Cambridge Hospital | 65 |
| /ae/media-hub/cambridge-health-group-announces-sar-100-million-jeddah-expansion | 200 | Cambridge Health Group Announces SAR 100 Million Jeddah Expansion / Cambridge Hospital | 61 |
| /ae/media-hub/carpal-tunnel-syndrome-and-other-entrapment-neuropathies-and-role-of-occupational-therapy | 200 | Carpal Tunnel Syndrome and Other Entrapment Neuropathies and Role of Occupational Therapy / Cambridge Hospital | 67 |
| /ae/media-hub/dr-rober-interview-al-arabiya-tv | 200 | Dr. Rober Interview - Al Arabiya TV / Cambridge Hospital | 61 |
| /ae/patient-hub | 200 | Patient Hub / Cambridge Hospital | 66 |
| /ae/patient-hub/conditions-specialities | 200 | Conditions &amp; Specialities / Cambridge Hospital | 76 |
| /ae/patient-hub/conditions-specialities/acquired-brain-injury | 200 | Acquired Brain Injury / Cambridge Hospital | 60 |
| /ae/patient-hub/conditions-specialities/amputation-prosthetic-rehabilitation | 200 | Amputation &amp; Prosthetic Rehabilitation / Cambridge Hospital | 60 |
| /ae/patient-hub/conditions-specialities/back-pain-lumbar-rehabilitation | 200 | Back Pain &amp; Lumbar Rehabilitation / Cambridge Hospital | 60 |
| /ae/patient-hub/conditions-specialities/epilepsy | 200 | Epilepsy / Cambridge Hospital | 60 |
| /ae/patient-hub/conditions-specialities/fracture-rehabilitation | 200 | Fracture Rehabilitation / Cambridge Hospital | 60 |
| /ae/patient-hub/conditions-specialities/guillain-barre-syndrome | 200 | Guillain-Barré Syndrome / Cambridge Hospital | 60 |
| /ae/patient-hub/conditions-specialities/hip-fracture-rehabilitation | 200 | Hip Fracture &amp; Femoral Neck Fracture Rehabilitation / Cambridge Hospital | 60 |
| /ae/patient-hub/conditions-specialities/hip-knee-replacement-recovery | 200 | Hip &amp; Knee Replacement Recovery / Cambridge Hospital | 60 |
| /ae/patient-hub/conditions-specialities/knee-ligament-cartilage-injuries | 200 | Knee Ligament &amp; Cartilage Injuries / Cambridge Hospital | 60 |
| /ae/patient-hub/conditions-specialities/motor-neuron-diseases | 200 | Motor Neuron Diseases / Cambridge Hospital | 60 |
| /ae/patient-hub/conditions-specialities/multiple-sclerosis | 200 | Multiple Sclerosis / Cambridge Hospital | 60 |
| /ae/patient-hub/conditions-specialities/musculoskeletal-orthopaedic-rehabilitation | 200 | Musculoskeletal and Orthopaedic Rehabilitation / Cambridge Hospital | 60 |
| /ae/patient-hub/conditions-specialities/neck-pain-cervical-rehabilitation | 200 | Neck Pain &amp; Cervical Rehabilitation / Cambridge Hospital | 60 |
| /ae/patient-hub/conditions-specialities/neurorehabilitation | 200 | Neurorehabilitation / Cambridge Hospital | 60 |
| /ae/patient-hub/conditions-specialities/parkinsons-disease | 200 | Parkinson&#39;s Disease / Cambridge Hospital | 60 |
| /ae/patient-hub/conditions-specialities/shoulder-rotator-cuff-rehabilitation | 200 | Shoulder Injury &amp; Rotator Cuff Rehabilitation / Cambridge Hospital | 60 |
| /ae/patient-hub/conditions-specialities/spinal-cord-injury | 200 | Spinal Cord Injury / Cambridge Hospital | 60 |
| /ae/patient-hub/conditions-specialities/stroke-rehabilitation | 200 | Stroke Rehabilitation / Cambridge Hospital | 60 |
| /ae/patient-hub/conditions-specialities/tennis-elbow | 200 | Tennis Elbow / Cambridge Hospital | 60 |
| /ae/patient-hub/conditions-specialities/traumatic-brain-injury | 200 | Traumatic Brain Injury / Cambridge Hospital | 60 |
| /ae/patient-hub/find-a-doctor | 200 | Find a Doctor / Cambridge Hospital | 126 |
| /ae/patient-hub/find-a-doctor/abbas-khalid | 200 | Dr. Abbas Khalid / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/abdulaziz-almetrek | 200 | Dr. Abdulaziz Almetrek / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/abdulaziz-alqutub | 200 | Dr. Abdulaziz Alqutub / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/abdulrahman-batarfi | 200 | Dr. Abdulrahman Batarfi / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/adnan-bahakam | 200 | Dr. Adnan Bahakam / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/ahmad-al-khayer | 200 | Dr. Ahmad Al Khayer / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/ahmad-almohamady | 200 | Dr. Ahmad Almohamady / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/ahmed-abdallah | 200 | Dr. Ahmed Abdallah / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/ahmed-basunbul | 200 | Dr. Ahmed Basunbul / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/ahmed-eldadah | 200 | Dr. Ahmed Eldadah / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/ahmed-elenani | 200 | Dr. Ahmed Elenani / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/ahmed-eltahir | 200 | Dr. Ahmed Eltahir / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/ahmed-ibrahim | 200 | Dr. Ahmed Ibrahim / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/ahmed-morsy | 200 | Dr. Ahmed Morsy / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/ahmed-rohoma | 200 | Dr. Ahmed Rohoma / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/ali-mahmoud | 200 | Dr. Ali Mahmoud / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/amgad-ali | 200 | Dr. Amgad Ali / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/amjad-abdel-qader | 200 | Dr. Amjad Abdel Qader / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/asma-mohamed | 200 | Dr. Asma Mohamed / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/asmaa-abdullah | 200 | Dr. Asmaa Abdullah / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/asmaa-alalay | 200 | Dr. Asmaa Alalay / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/bader-al-qahtani | 200 | Dr. Bader Al Qahtani / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/ebtihal-mohammed | 200 | Dr. Ebtihal Mohammed / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/elsanosi-habour | 200 | Dr. Elsanosi Habour / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/farahim-chaudhary | 200 | Dr. Farahim Chaudhary / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/hasan-abueideh | 200 | Dr. Hasan Abueideh / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/hesham-mustafa | 200 | Dr. Hesham Mustafa / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/isra-adam | 200 | Dr. Isra Adam / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/kashif-ahmed | 200 | Dr. Kashif Ahmed / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/khalifa-swidan | 200 | Dr. Khalifa Swidan / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/majed-osaylan | 200 | Dr. Majed Osaylan / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/maysa-osman | 200 | Dr. Maysa Osman / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/medhat-hagras | 200 | Dr. Medhat Hagras / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/mehnaz-abdul-ghafoor | 200 | Dr. Mehnaz Abdul Ghafoor / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/mohamed-bahrudeen | 200 | Dr. Mohamed Bahrudeen / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/mohamed-fathi | 200 | Dr. Mohamed Fathi / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/mohamed-kallash | 200 | Dr. Mohamed Kallash / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/mohammed-alhayyan | 200 | Dr. Mohammed Alhayyan / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/mohammed-bawahal | 200 | Dr. Mohammed Bawahal / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/mohammed-esmail | 200 | Dr. Mohammed Esmail / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/mohammed-halawani | 200 | Dr. Mohammed Halawani / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/mohammed-mugahed | 200 | Dr. Mohammed Mugahed / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/nada-mohamed | 200 | Dr. Nada Mohamed / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/nader-bin-taleb | 200 | Dr. Nader Bin Taleb / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/nansy-elnaggar | 200 | Dr. Nansy Elnaggar / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/omar-baaqil | 200 | Dr. Omar Baaqil / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/rao-tariq | 200 | Dr. Rao Tariq / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/rasha-mahgoub | 200 | Dr. Rasha Mahgoub / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/rawiyah-abdalla | 200 | Dr. Rawiyah Abdalla / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/rober-kassab | 200 | Dr. Rober Kassab / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/safa-alsayed | 200 | Dr. Safa Alsayed / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/safa-mohamed | 200 | Dr. Safa Mohamed / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/saleh-damnan | 200 | Dr. Saleh Damnan / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/sami-alamin | 200 | Dr. Sami Alamin / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/samuel-tefera | 200 | Dr. Samuel Tefera / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/setelnesa-mohamed | 200 | Dr. Setelnesa Mohamed / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/shayma-marganie | 200 | Dr. Shayma Marganie / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/sheema-jeelani | 200 | Dr. Sheema Jeelani / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/souad-mohamed | 200 | Dr. Souad Mohamed / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/suhaila-kallada | 200 | Dr. Suhaila Kallada / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/suheib-ahmed | 200 | Dr. Suheib Ahmed / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/tamer-eissa | 200 | Dr. Tamer Eissa / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/wael-mabruk | 200 | Dr. Wael Mabruk / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/wael-sary | 200 | Dr. Wael Sary / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/wafaa-farag | 200 | Dr. Wafaa Farag / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/walaa-elgheriany | 200 | Dr. Walaa Elgheriany / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/walaa-mohamed | 200 | Dr. Walaa Mohamed / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/wissam-al-safi | 200 | Dr. Wissam Al Safi / Cambridge Hospital | 54 |
| /ae/patient-hub/find-a-doctor/youssef-haggag | 200 | Dr. Youssef Haggag / Cambridge Hospital | 54 |
| /ae/patient-hub/insurance-providers | 200 | Insurance Providers / Cambridge Hospital | 52 |
| /ae/patient-hub/international-patients | 200 | International Patients / Cambridge Hospital | 53 |
| /ae/patient-hub/refer-a-patient | 200 | Refer a Patient / Cambridge Hospital | 59 |
| /ae/patient-hub/testimonials | 200 | Patient Testimonials / Cambridge Hospital | 56 |
| /ae/your-opinion-matters | 200 | Your Experience Matters to Us / Cambridge Hospital | 53 |
| /ar | 200 | مجموعة مستشفيات كامبريدج | 111 |
| /ar/about | 200 | حول مستشفى كامبريدج / مستشفى كامبريدج | 60 |
| /ar/about/accreditations-partnerships | 200 | الاعتمادات والشراكات / مستشفى كامبريدج | 56 |
| /ar/about/careers | 200 | مركز التوظيف / مستشفى كامبريدج | 56 |
| /ar/about/who-we-are | 200 | من نحن / مستشفى كامبريدج | 56 |
| /ar/about/why-cambridge-hospital | 200 | لماذا مستشفى كامبريدج / مستشفى كامبريدج | 59 |
| /ar/care | 200 | خدماتنا / مستشفى كامبريدج | 64 |
| /ar/care/home-healthcare | 200 | خدمات الرعاية المنزلية / Cambridge Hospital | 60 |
| /ar/care/in-school | 200 | خدمة الرعاية المدرسية / Cambridge Hospital | 60 |
| /ar/care/inpatient | 200 | خدمات المرضى الداخلية / Cambridge Hospital | 66 |
| /ar/care/inpatient/icu-critical-care | 200 | ICU and Critical Care / Cambridge Hospital | 60 |
| /ar/care/inpatient/long-term-care-rehab | 200 | Long-Term Care &amp; Rehabilitation / Cambridge Hospital | 64 |
| /ar/care/inpatient/long-term-care-rehab/geriatric-care | 200 | Geriatric Care / Cambridge Hospital | 60 |
| /ar/care/inpatient/long-term-care-rehab/long-term-acute-care | 200 | Long-Term Acute Care / Cambridge Hospital | 60 |
| /ar/care/inpatient/long-term-care-rehab/long-term-care | 200 | Long-Term Care / Cambridge Hospital | 60 |
| /ar/care/inpatient/long-term-care-rehab/paediatric-long-term-care | 200 | Paediatric Long-Term Care / Cambridge Hospital | 60 |
| /ar/care/inpatient/palliative-care | 200 | Palliative Care / Cambridge Hospital | 60 |
| /ar/care/inpatient/pediatric-rehab | 200 | Paediatric Care / Cambridge Hospital | 67 |
| /ar/care/inpatient/pediatric-rehab/central-nervous-system | 200 | Central Nervous System Anomalies Rehabilitation / Cambridge Hospital | 60 |
| /ar/care/inpatient/pediatric-rehab/long-term-cardiac | 200 | Long-Term Cardiac Anomalies Rehabilitation / Cambridge Hospital | 60 |
| /ar/care/inpatient/pediatric-rehab/neuromuscular-rehab | 200 | Paediatric Neuromuscular Rehabilitation / Cambridge Hospital | 60 |
| /ar/care/inpatient/pediatric-rehab/paediatric-post-acute-rehab | 200 | Paediatric Post-Acute Rehabilitation / Cambridge Hospital | 60 |
| /ar/care/inpatient/pediatric-rehab/paediatric-transitional | 200 | Paediatric Transitional Care / Cambridge Hospital | 60 |
| /ar/care/inpatient/pediatric-rehab/pulmonary-rehab | 200 | Paediatric Pulmonary Rehabilitation / Cambridge Hospital | 60 |
| /ar/care/inpatient/pediatric-rehab/speech-language-rehab | 200 | Speech and Language Rehabilitation / Cambridge Hospital | 60 |
| /ar/care/inpatient/post-acute-rehabilitation | 200 | Post-Acute Rehabilitation / Cambridge Hospital | 64 |
| /ar/care/inpatient/post-acute-rehabilitation/musculoskeletal-rehabilitation | 200 | Musculoskeletal Rehabilitation / Cambridge Hospital | 60 |
| /ar/care/inpatient/post-acute-rehabilitation/neurorehabilitation | 200 | Neurorehabilitation / Cambridge Hospital | 63 |
| /ar/care/inpatient/post-acute-rehabilitation/neurorehabilitation/spinal-cord-injury-rehabilitation | 200 | Spinal Cord Injury Rehabilitation / Cambridge Hospital | 60 |
| /ar/care/inpatient/post-acute-rehabilitation/neurorehabilitation/stroke-rehabilitation | 200 | Stroke Rehabilitation / Cambridge Hospital | 60 |
| /ar/care/inpatient/post-acute-rehabilitation/neurorehabilitation/traumatic-brain-injury-rehabilitation | 200 | Traumatic Brain Injury Rehabilitation / Cambridge Hospital | 60 |
| /ar/care/inpatient/post-acute-rehabilitation/post-surgical-rehabilitation | 200 | Post-Surgical Rehabilitation / Cambridge Hospital | 60 |
| /ar/care/inpatient/post-acute-rehabilitation/road-traffic-accident-rehabilitation | 200 | Road Traffic Accident Rehabilitation / Cambridge Hospital | 60 |
| /ar/care/inpatient/ventilated-patients-care | 200 | Ventilated Patients Care / Cambridge Hospital | 62 |
| /ar/care/inpatient/ventilated-patients-care/long-term-ventilated-care | 200 | Long-Term Ventilated Care / Cambridge Hospital | 60 |
| /ar/care/inpatient/ventilated-patients-care/weaning-programme | 200 | Weaning Programme / Cambridge Hospital | 60 |
| /ar/care/outpatient | 200 | خدمات العيادات الخارجية / Cambridge Hospital | 66 |
| /ar/care/outpatient/cerebral-palsy-program | 200 | Cerebral Palsy Programme / Cambridge Hospital | 60 |
| /ar/care/outpatient/occupational-therapy | 200 | Occupational Therapy / Cambridge Hospital | 60 |
| /ar/care/outpatient/pediatric-care | 200 | Paediatric Care / Cambridge Hospital | 60 |
| /ar/care/outpatient/physical-medicine-rehab-care | 200 | Physical Medicine and Rehabilitation Care / Cambridge Hospital | 60 |
| /ar/care/outpatient/physiotherapy | 200 | Physiotherapy / Cambridge Hospital | 60 |
| /ar/care/outpatient/speech-language-therapy | 200 | Speech and Language Therapy / Cambridge Hospital | 60 |
| /ar/contact-us | 200 | اتصل بنا / مستشفى كامبريدج | 60 |
| /ar/faqs | 200 | الأسئلة الشائعة / مستشفى كامبريدج | 52 |
| /ar/hospitals | 200 | مستشفياتنا / مستشفى كامبريدج | 66 |
| /ar/hospitals/al-mudeef-center-abu-dhabi | 200 | مركز المضيف أبوظبي / Cambridge Hospital | 66 |
| /ar/hospitals/cambridge-hospital-abu-dhabi | 200 | مستشفى كامبريدج أبوظبي / Cambridge Hospital | 66 |
| /ar/hospitals/cambridge-hospital-al-ain | 200 | مستشفى كامبريدج العين / Cambridge Hospital | 66 |
| /ar/hospitals/cambridge-hospital-al-khobar | 200 | مستشفى كامبريدج الخبر / Cambridge Hospital | 66 |
| /ar/hospitals/cambridge-hospital-dhahran | 200 | مستشفى كامبريدج ظهران / Cambridge Hospital | 66 |
| /ar/hospitals/cambridge-hospital-jeddah | 200 | مستشفى كامبريدج جدة / Cambridge Hospital | 66 |
| /ar/legal/gdpr-compliance | 200 | الامتثال للائحة البيانات العامة لحماية البيانات / Cambridge Hospital | 51 |
| /ar/legal/privacy-policy | 200 | سياسة الخصوصية / Cambridge Hospital | 51 |
| /ar/media-hub | 200 | المركز الإعلامي / مستشفى كامبريدج | 68 |
| /ar/media-hub/16th-hot-topics-in-pediatrics-conference-and-exhibition | 200 | المؤتمر والمعرض السادس عشر للمواضيع الساخنة في طب الأطفال / Cambridge Hospital | 60 |
| /ar/media-hub/17th-seha-international-pediatric-conference | 200 | المؤتمر الدولي السابع عشر لطب الأطفال SEHA / Cambridge Hospital | 60 |
| /ar/media-hub/1st-ehs-international-critical-care-organ-donation-and-transplant-conference | 200 | المؤتمر الدولي الأول للرعاية الحرجة والتبرع بالأعضاء وزراعة الأعضاء / Cambridge Hospital | 60 |
| /ar/media-hub/1st-seha-national-corporate-case-management-symposium | 200 | الندوة الوطنية الأولى لإدارة الحالات المؤسسية التابعة ل SEHA / Cambridge Hospital | 60 |
| /ar/media-hub/20th-emirates-critical-care-conference | 200 | المؤتمر العشرون للرعاية الحرجة في الإمارات / Cambridge Hospital | 60 |
| /ar/media-hub/2nd-international-pediatric-neurodisability-and-neurorehabilitation-conference | 200 | المؤتمر الدولي الثاني لعلاج الإعاقة العصبية للأطفال وإعادة التأهيل العصبي / Cambridge Hospital | 60 |
| /ar/media-hub/8-exercises-for-easing-tennis-elbow-plus-prevention-tips | 200 | 8 تمارين لتخفيف نصائح الوقاية من كوع التنس بلس / Cambridge Hospital | 65 |
| /ar/media-hub/a-family-reunion-supporting-emotional-recovery | 200 | لم شمل عائلي يدعم التعافي العاطفي / Cambridge Hospital | 60 |
| /ar/media-hub/a-musical-parade-at-al-mudeef-center | 200 | موكب موسيقي في مركز المديف / Cambridge Hospital | 60 |
| /ar/media-hub/abdullah-an-emirati-youth-a-beacon-of-hope-and-a-success-story | 200 | عبد الله، شاب إماراتي، منارة أمل وقصة نجاح / Cambridge Hospital | 60 |
| /ar/media-hub/al-khobar-opening-and-employee-recognition | 200 | افتتاح الخبر وتكريم الموظفين / Cambridge Hospital | 60 |
| /ar/media-hub/al-mudeef-centre-achieves-jci-accreditation-following-comprehensive-transformation | 200 | مركز المضيف يحصل على اعتماد JCI بعد تحول شامل / Cambridge Hospital | 61 |
| /ar/media-hub/amanat-holdings-acquires-cambridge-hospital | 200 | استحواذ أمانات القابضة على مستشفى كامبريدج / Cambridge Hospital | 61 |
| /ar/media-hub/brachial-plexus-injury-diagnosis-treatment-and-rehabilitation | 200 | إصابة الضفيرة العضدية: التشخيص، العلاج، وإعادة التأهيل / Cambridge Hospital | 64 |
| /ar/media-hub/cambridge-health-group-announces-sar-100-million-jeddah-expansion | 200 | مجموعة كامبريدج للصحة تعلن عن توسعة جدة بقيمة 100 مليون ريال سعودي / Cambridge Hospital | 61 |
| /ar/media-hub/carpal-tunnel-syndrome-and-other-entrapment-neuropathies-and-role-of-occupational-therapy | 200 | متلازمة النفق الرسغي وغيرها من الاعتلالات العصبية الحبس ودور العلاج الوظيفي / Cambridge Hospital | 67 |
| /ar/media-hub/dr-rober-interview-al-arabiya-tv | 200 | مقابلة د. روبير – قناة العربية / Cambridge Hospital | 61 |
| /ar/patient-hub | 200 | مركز المرضى / مستشفى كامبريدج | 66 |
| /ar/patient-hub/conditions-specialities | 200 | الحالات والتخصصات / مستشفى كامبريدج | 76 |
| /ar/patient-hub/conditions-specialities/acquired-brain-injury | 200 | إصابة الدماغ المكتسبة / مستشفى كامبريدج | 60 |
| /ar/patient-hub/conditions-specialities/amputation-prosthetic-rehabilitation | 200 | البتر وإعادة التأهيل بالأطراف الصناعية / مستشفى كامبريدج | 60 |
| /ar/patient-hub/conditions-specialities/back-pain-lumbar-rehabilitation | 200 | آلام الظهر وإعادة التأهيل القطني / مستشفى كامبريدج | 60 |
| /ar/patient-hub/conditions-specialities/epilepsy | 200 | الصرع / مستشفى كامبريدج | 60 |
| /ar/patient-hub/conditions-specialities/fracture-rehabilitation | 200 | إعادة تأهيل الكسور / مستشفى كامبريدج | 60 |
| /ar/patient-hub/conditions-specialities/guillain-barre-syndrome | 200 | متلازمة غيلان-باري / مستشفى كامبريدج | 60 |
| /ar/patient-hub/conditions-specialities/hip-fracture-rehabilitation | 200 | إعادة تأهيل كسر الورك وكسر عنق الفخذ / مستشفى كامبريدج | 60 |
| /ar/patient-hub/conditions-specialities/hip-knee-replacement-recovery | 200 | التعافي من استبدال الورك والركبة / مستشفى كامبريدج | 60 |
| /ar/patient-hub/conditions-specialities/knee-ligament-cartilage-injuries | 200 | إصابات أربطة الركبة والغضاريف / مستشفى كامبريدج | 60 |
| /ar/patient-hub/conditions-specialities/motor-neuron-diseases | 200 | أمراض الخلايا العصبية الحركية / مستشفى كامبريدج | 60 |
| /ar/patient-hub/conditions-specialities/multiple-sclerosis | 200 | التصلب المتعدد / مستشفى كامبريدج | 60 |
| /ar/patient-hub/conditions-specialities/musculoskeletal-orthopaedic-rehabilitation | 200 | إعادة التأهيل العضلي الهيكلي والعظمي / مستشفى كامبريدج | 60 |
| /ar/patient-hub/conditions-specialities/neck-pain-cervical-rehabilitation | 200 | آلام الرقبة وإعادة التأهيل العنقي / مستشفى كامبريدج | 60 |
| /ar/patient-hub/conditions-specialities/neurorehabilitation | 200 | إعادة التأهيل العصبي / مستشفى كامبريدج | 60 |
| /ar/patient-hub/conditions-specialities/parkinsons-disease | 200 | مرض باركنسون / مستشفى كامبريدج | 60 |
| /ar/patient-hub/conditions-specialities/shoulder-rotator-cuff-rehabilitation | 200 | إصابة الكتف وإعادة تأهيل الكفة المدورة / مستشفى كامبريدج | 60 |
| /ar/patient-hub/conditions-specialities/spinal-cord-injury | 200 | إصابة الحبل الشوكي / مستشفى كامبريدج | 60 |
| /ar/patient-hub/conditions-specialities/stroke-rehabilitation | 200 | إعادة تأهيل السكتة الدماغية / مستشفى كامبريدج | 60 |
| /ar/patient-hub/conditions-specialities/tennis-elbow | 200 | كوع التنس / مستشفى كامبريدج | 60 |
| /ar/patient-hub/conditions-specialities/traumatic-brain-injury | 200 | إصابة الدماغ الرضحية / مستشفى كامبريدج | 60 |
| /ar/patient-hub/find-a-doctor | 200 | ابحث عن طبيب / مستشفى كامبريدج | 126 |
| /ar/patient-hub/find-a-doctor/abbas-khalid | 200 | Dr. Abbas Khalid / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/abdulaziz-almetrek | 200 | Dr. Abdulaziz Almetrek / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/abdulaziz-alqutub | 200 | Dr. Abdulaziz Alqutub / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/abdulrahman-batarfi | 200 | Dr. Abdulrahman Batarfi / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/adnan-bahakam | 200 | Dr. Adnan Bahakam / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/ahmad-al-khayer | 200 | Dr. Ahmad Al Khayer / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/ahmad-almohamady | 200 | Dr. Ahmad Almohamady / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/ahmed-abdallah | 200 | Dr. Ahmed Abdallah / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/ahmed-basunbul | 200 | Dr. Ahmed Basunbul / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/ahmed-eldadah | 200 | Dr. Ahmed Eldadah / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/ahmed-elenani | 200 | Dr. Ahmed Elenani / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/ahmed-eltahir | 200 | Dr. Ahmed Eltahir / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/ahmed-ibrahim | 200 | Dr. Ahmed Ibrahim / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/ahmed-morsy | 200 | Dr. Ahmed Morsy / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/ahmed-rohoma | 200 | Dr. Ahmed Rohoma / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/ali-mahmoud | 200 | Dr. Ali Mahmoud / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/amgad-ali | 200 | Dr. Amgad Ali / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/amjad-abdel-qader | 200 | Dr. Amjad Abdel Qader / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/asma-mohamed | 200 | Dr. Asma Mohamed / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/asmaa-abdullah | 200 | Dr. Asmaa Abdullah / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/asmaa-alalay | 200 | Dr. Asmaa Alalay / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/bader-al-qahtani | 200 | Dr. Bader Al Qahtani / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/ebtihal-mohammed | 200 | Dr. Ebtihal Mohammed / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/elsanosi-habour | 200 | Dr. Elsanosi Habour / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/farahim-chaudhary | 200 | Dr. Farahim Chaudhary / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/hasan-abueideh | 200 | Dr. Hasan Abueideh / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/hesham-mustafa | 200 | Dr. Hesham Mustafa / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/isra-adam | 200 | Dr. Isra Adam / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/kashif-ahmed | 200 | Dr. Kashif Ahmed / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/khalifa-swidan | 200 | Dr. Khalifa Swidan / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/majed-osaylan | 200 | Dr. Majed Osaylan / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/maysa-osman | 200 | Dr. Maysa Osman / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/medhat-hagras | 200 | Dr. Medhat Hagras / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/mehnaz-abdul-ghafoor | 200 | Dr. Mehnaz Abdul Ghafoor / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/mohamed-bahrudeen | 200 | Dr. Mohamed Bahrudeen / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/mohamed-fathi | 200 | Dr. Mohamed Fathi / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/mohamed-kallash | 200 | Dr. Mohamed Kallash / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/mohammed-alhayyan | 200 | Dr. Mohammed Alhayyan / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/mohammed-bawahal | 200 | Dr. Mohammed Bawahal / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/mohammed-esmail | 200 | Dr. Mohammed Esmail / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/mohammed-halawani | 200 | Dr. Mohammed Halawani / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/mohammed-mugahed | 200 | Dr. Mohammed Mugahed / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/nada-mohamed | 200 | Dr. Nada Mohamed / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/nader-bin-taleb | 200 | Dr. Nader Bin Taleb / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/nansy-elnaggar | 200 | Dr. Nansy Elnaggar / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/omar-baaqil | 200 | Dr. Omar Baaqil / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/rao-tariq | 200 | Dr. Rao Tariq / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/rasha-mahgoub | 200 | Dr. Rasha Mahgoub / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/rawiyah-abdalla | 200 | Dr. Rawiyah Abdalla / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/rober-kassab | 200 | Dr. Rober Kassab / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/safa-alsayed | 200 | Dr. Safa Alsayed / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/safa-mohamed | 200 | Dr. Safa Mohamed / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/saleh-damnan | 200 | Dr. Saleh Damnan / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/sami-alamin | 200 | Dr. Sami Alamin / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/samuel-tefera | 200 | Dr. Samuel Tefera / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/setelnesa-mohamed | 200 | Dr. Setelnesa Mohamed / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/shayma-marganie | 200 | Dr. Shayma Marganie / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/sheema-jeelani | 200 | Dr. Sheema Jeelani / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/souad-mohamed | 200 | Dr. Souad Mohamed / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/suhaila-kallada | 200 | Dr. Suhaila Kallada / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/suheib-ahmed | 200 | Dr. Suheib Ahmed / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/tamer-eissa | 200 | Dr. Tamer Eissa / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/wael-mabruk | 200 | Dr. Wael Mabruk / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/wael-sary | 200 | Dr. Wael Sary / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/wafaa-farag | 200 | Dr. Wafaa Farag / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/walaa-elgheriany | 200 | Dr. Walaa Elgheriany / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/walaa-mohamed | 200 | Dr. Walaa Mohamed / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/wissam-al-safi | 200 | Dr. Wissam Al Safi / Cambridge Hospital | 54 |
| /ar/patient-hub/find-a-doctor/youssef-haggag | 200 | Dr. Youssef Haggag / Cambridge Hospital | 54 |
| /ar/patient-hub/insurance-providers | 200 | شركات التأمين / مستشفى كامبريدج | 52 |
| /ar/patient-hub/international-patients | 200 | المرضى الدوليون / مستشفى كامبريدج | 53 |
| /ar/patient-hub/refer-a-patient | 200 | إحالة مريض / مستشفى كامبريدج | 59 |
| /ar/patient-hub/testimonials | 200 | قصص نجاح المرضى / مستشفى كامبريدج | 56 |
| /ar/your-opinion-matters | 200 | رأيك يهمنا / مستشفى كامبريدج | 53 |
| /care | 200 | Our Care / Cambridge Hospital | 64 |
| /care/home-healthcare | 200 | Home Care / Cambridge Hospital | 60 |
| /care/in-school | 200 | In-School Care / Cambridge Hospital | 60 |
| /care/inpatient | 200 | Inpatient Care / Cambridge Hospital | 66 |
| /care/inpatient/icu-critical-care | 200 | ICU and Critical Care / Cambridge Hospital | 60 |
| /care/inpatient/long-term-care-rehab | 200 | Long-Term Care &amp; Rehabilitation / Cambridge Hospital | 64 |
| /care/inpatient/long-term-care-rehab/geriatric-care | 200 | Geriatric Care / Cambridge Hospital | 60 |
| /care/inpatient/long-term-care-rehab/long-term-acute-care | 200 | Long-Term Acute Care / Cambridge Hospital | 60 |
| /care/inpatient/long-term-care-rehab/long-term-care | 200 | Long-Term Care / Cambridge Hospital | 60 |
| /care/inpatient/long-term-care-rehab/paediatric-long-term-care | 200 | Paediatric Long-Term Care / Cambridge Hospital | 60 |
| /care/inpatient/palliative-care | 200 | Palliative Care / Cambridge Hospital | 60 |
| /care/inpatient/pediatric-rehab | 200 | Paediatric Care / Cambridge Hospital | 67 |
| /care/inpatient/pediatric-rehab/central-nervous-system | 200 | Central Nervous System Anomalies Rehabilitation / Cambridge Hospital | 60 |
| /care/inpatient/pediatric-rehab/long-term-cardiac | 200 | Long-Term Cardiac Anomalies Rehabilitation / Cambridge Hospital | 60 |
| /care/inpatient/pediatric-rehab/neuromuscular-rehab | 200 | Paediatric Neuromuscular Rehabilitation / Cambridge Hospital | 60 |
| /care/inpatient/pediatric-rehab/paediatric-post-acute-rehab | 200 | Paediatric Post-Acute Rehabilitation / Cambridge Hospital | 60 |
| /care/inpatient/pediatric-rehab/paediatric-transitional | 200 | Paediatric Transitional Care / Cambridge Hospital | 60 |
| /care/inpatient/pediatric-rehab/pulmonary-rehab | 200 | Paediatric Pulmonary Rehabilitation / Cambridge Hospital | 60 |
| /care/inpatient/pediatric-rehab/speech-language-rehab | 200 | Speech and Language Rehabilitation / Cambridge Hospital | 60 |
| /care/inpatient/post-acute-rehabilitation | 200 | Post-Acute Rehabilitation / Cambridge Hospital | 64 |
| /care/inpatient/post-acute-rehabilitation/musculoskeletal-rehabilitation | 200 | Musculoskeletal Rehabilitation / Cambridge Hospital | 60 |
| /care/inpatient/post-acute-rehabilitation/neurorehabilitation | 200 | Neurorehabilitation / Cambridge Hospital | 63 |
| /care/inpatient/post-acute-rehabilitation/neurorehabilitation/spinal-cord-injury-rehabilitation | 200 | Spinal Cord Injury Rehabilitation / Cambridge Hospital | 60 |
| /care/inpatient/post-acute-rehabilitation/neurorehabilitation/stroke-rehabilitation | 200 | Stroke Rehabilitation / Cambridge Hospital | 60 |
| /care/inpatient/post-acute-rehabilitation/neurorehabilitation/traumatic-brain-injury-rehabilitation | 200 | Traumatic Brain Injury Rehabilitation / Cambridge Hospital | 60 |
| /care/inpatient/post-acute-rehabilitation/post-surgical-rehabilitation | 200 | Post-Surgical Rehabilitation / Cambridge Hospital | 60 |
| /care/inpatient/post-acute-rehabilitation/road-traffic-accident-rehabilitation | 200 | Road Traffic Accident Rehabilitation / Cambridge Hospital | 60 |
| /care/inpatient/ventilated-patients-care | 200 | Ventilated Patients Care / Cambridge Hospital | 62 |
| /care/inpatient/ventilated-patients-care/long-term-ventilated-care | 200 | Long-Term Ventilated Care / Cambridge Hospital | 60 |
| /care/inpatient/ventilated-patients-care/weaning-programme | 200 | Weaning Programme / Cambridge Hospital | 60 |
| /care/outpatient | 200 | Outpatient Care / Cambridge Hospital | 66 |
| /care/outpatient/cerebral-palsy-program | 200 | Cerebral Palsy Programme / Cambridge Hospital | 60 |
| /care/outpatient/occupational-therapy | 200 | Occupational Therapy / Cambridge Hospital | 60 |
| /care/outpatient/pediatric-care | 200 | Paediatric Care / Cambridge Hospital | 60 |
| /care/outpatient/physical-medicine-rehab-care | 200 | Physical Medicine and Rehabilitation Care / Cambridge Hospital | 60 |
| /care/outpatient/physiotherapy | 200 | Physiotherapy / Cambridge Hospital | 60 |
| /care/outpatient/speech-language-therapy | 200 | Speech and Language Therapy / Cambridge Hospital | 60 |
| /contact-us | 200 | Contact Us / Cambridge Hospital | 60 |
| /faqs | 200 | Frequently Asked Questions / Cambridge Hospital | 52 |
| /hospitals | 200 | Our Hospitals / Cambridge Hospital | 66 |
| /hospitals/al-mudeef-center-abu-dhabi | 200 | Al Mudeef Centre Abu Dhabi / Cambridge Hospital | 66 |
| /hospitals/cambridge-hospital-abu-dhabi | 200 | Cambridge Hospital Abu Dhabi / Cambridge Hospital | 66 |
| /hospitals/cambridge-hospital-al-ain | 200 | Cambridge Hospital Al Ain / Cambridge Hospital | 66 |
| /hospitals/cambridge-hospital-al-khobar | 200 | Cambridge Hospital Al Khobar / Cambridge Hospital | 66 |
| /hospitals/cambridge-hospital-dhahran | 200 | Cambridge Hospital Dhahran / Cambridge Hospital | 66 |
| /hospitals/cambridge-hospital-jeddah | 200 | Cambridge Hospital Jeddah / Cambridge Hospital | 66 |
| /legal/gdpr-compliance | 200 | GDPR Compliance / Cambridge Hospital | 51 |
| /legal/privacy-policy | 200 | Privacy Policy / Cambridge Hospital | 51 |
| /media-hub | 200 | Media Hub / Cambridge Hospital | 68 |
| /media-hub/16th-hot-topics-in-pediatrics-conference-and-exhibition | 200 | 16th Hot Topics in Pediatrics Conference and Exhibition / Cambridge Hospital | 60 |
| /media-hub/17th-seha-international-pediatric-conference | 200 | 17th SEHA International Pediatric Conference / Cambridge Hospital | 60 |
| /media-hub/1st-ehs-international-critical-care-organ-donation-and-transplant-conference | 200 | 1st EHS International Critical Care, Organ Donation and Transplant Conference / Cambridge Hospital | 60 |
| /media-hub/1st-seha-national-corporate-case-management-symposium | 200 | 1st SEHA National Corporate Case Management Symposium / Cambridge Hospital | 60 |
| /media-hub/20th-emirates-critical-care-conference | 200 | 20th Emirates Critical Care Conference / Cambridge Hospital | 60 |
| /media-hub/2nd-international-pediatric-neurodisability-and-neurorehabilitation-conference | 200 | 2nd International Paediatric Neurodisability and Neurorehabilitation Conference / Cambridge Hospital | 60 |
| /media-hub/8-exercises-for-easing-tennis-elbow-plus-prevention-tips | 200 | 8 Exercises for Easing Tennis Elbow Plus Prevention Tips / Cambridge Hospital | 65 |
| /media-hub/a-family-reunion-supporting-emotional-recovery | 200 | A Family Reunion Supporting Emotional Recovery / Cambridge Hospital | 60 |
| /media-hub/a-musical-parade-at-al-mudeef-center | 200 | A Musical Parade at Al Mudeef Center / Cambridge Hospital | 60 |
| /media-hub/abdullah-an-emirati-youth-a-beacon-of-hope-and-a-success-story | 200 | Abdullah, an Emirati youth, a beacon of hope and a success story / Cambridge Hospital | 60 |
| /media-hub/al-khobar-opening-and-employee-recognition | 200 | Al Khobar Opening and Employee Recognition / Cambridge Hospital | 60 |
| /media-hub/al-mudeef-centre-achieves-jci-accreditation-following-comprehensive-transformation | 200 | Al Mudeef Centre Achieves JCI Accreditation Following Comprehensive Transformation / Cambridge Hospital | 61 |
| /media-hub/amanat-holdings-acquires-cambridge-hospital | 200 | Amanat Holdings Acquires Cambridge Hospital / Cambridge Hospital | 61 |
| /media-hub/brachial-plexus-injury-diagnosis-treatment-and-rehabilitation | 200 | Brachial Plexus Injury: Diagnosis, Treatment, and Rehabilitation / Cambridge Hospital | 65 |
| /media-hub/cambridge-health-group-announces-sar-100-million-jeddah-expansion | 200 | Cambridge Health Group Announces SAR 100 Million Jeddah Expansion / Cambridge Hospital | 61 |
| /media-hub/carpal-tunnel-syndrome-and-other-entrapment-neuropathies-and-role-of-occupational-therapy | 200 | Carpal Tunnel Syndrome and Other Entrapment Neuropathies and Role of Occupational Therapy / Cambridge Hospital | 67 |
| /media-hub/dr-rober-interview-al-arabiya-tv | 200 | Dr. Rober Interview - Al Arabiya TV / Cambridge Hospital | 61 |
| /patient-hub | 200 | Patient Hub / Cambridge Hospital | 66 |
| /patient-hub/conditions-specialities | 200 | Conditions &amp; Specialities / Cambridge Hospital | 76 |
| /patient-hub/conditions-specialities/acquired-brain-injury | 200 | Acquired Brain Injury / Cambridge Hospital | 60 |
| /patient-hub/conditions-specialities/amputation-prosthetic-rehabilitation | 200 | Amputation &amp; Prosthetic Rehabilitation / Cambridge Hospital | 60 |
| /patient-hub/conditions-specialities/back-pain-lumbar-rehabilitation | 200 | Back Pain &amp; Lumbar Rehabilitation / Cambridge Hospital | 60 |
| /patient-hub/conditions-specialities/epilepsy | 200 | Epilepsy / Cambridge Hospital | 60 |
| /patient-hub/conditions-specialities/fracture-rehabilitation | 200 | Fracture Rehabilitation / Cambridge Hospital | 60 |
| /patient-hub/conditions-specialities/guillain-barre-syndrome | 200 | Guillain-Barré Syndrome / Cambridge Hospital | 60 |
| /patient-hub/conditions-specialities/hip-fracture-rehabilitation | 200 | Hip Fracture &amp; Femoral Neck Fracture Rehabilitation / Cambridge Hospital | 60 |
| /patient-hub/conditions-specialities/hip-knee-replacement-recovery | 200 | Hip &amp; Knee Replacement Recovery / Cambridge Hospital | 60 |
| /patient-hub/conditions-specialities/knee-ligament-cartilage-injuries | 200 | Knee Ligament &amp; Cartilage Injuries / Cambridge Hospital | 60 |
| /patient-hub/conditions-specialities/motor-neuron-diseases | 200 | Motor Neuron Diseases / Cambridge Hospital | 60 |
| /patient-hub/conditions-specialities/multiple-sclerosis | 200 | Multiple Sclerosis / Cambridge Hospital | 60 |
| /patient-hub/conditions-specialities/musculoskeletal-orthopaedic-rehabilitation | 200 | Musculoskeletal and Orthopaedic Rehabilitation / Cambridge Hospital | 60 |
| /patient-hub/conditions-specialities/neck-pain-cervical-rehabilitation | 200 | Neck Pain &amp; Cervical Rehabilitation / Cambridge Hospital | 60 |
| /patient-hub/conditions-specialities/neurorehabilitation | 200 | Neurorehabilitation / Cambridge Hospital | 60 |
| /patient-hub/conditions-specialities/parkinsons-disease | 200 | Parkinson&#39;s Disease / Cambridge Hospital | 60 |
| /patient-hub/conditions-specialities/shoulder-rotator-cuff-rehabilitation | 200 | Shoulder Injury &amp; Rotator Cuff Rehabilitation / Cambridge Hospital | 60 |
| /patient-hub/conditions-specialities/spinal-cord-injury | 200 | Spinal Cord Injury / Cambridge Hospital | 60 |
| /patient-hub/conditions-specialities/stroke-rehabilitation | 200 | Stroke Rehabilitation / Cambridge Hospital | 60 |
| /patient-hub/conditions-specialities/tennis-elbow | 200 | Tennis Elbow / Cambridge Hospital | 60 |
| /patient-hub/conditions-specialities/traumatic-brain-injury | 200 | Traumatic Brain Injury / Cambridge Hospital | 60 |
| /patient-hub/find-a-doctor | 200 | Find a Doctor / Cambridge Hospital | 126 |
| /patient-hub/find-a-doctor/abbas-khalid | 200 | Dr. Abbas Khalid / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/abdulaziz-almetrek | 200 | Dr. Abdulaziz Almetrek / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/abdulaziz-alqutub | 200 | Dr. Abdulaziz Alqutub / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/abdulrahman-batarfi | 200 | Dr. Abdulrahman Batarfi / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/adnan-bahakam | 200 | Dr. Adnan Bahakam / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/ahmad-al-khayer | 200 | Dr. Ahmad Al Khayer / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/ahmad-almohamady | 200 | Dr. Ahmad Almohamady / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/ahmed-abdallah | 200 | Dr. Ahmed Abdallah / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/ahmed-basunbul | 200 | Dr. Ahmed Basunbul / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/ahmed-eldadah | 200 | Dr. Ahmed Eldadah / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/ahmed-elenani | 200 | Dr. Ahmed Elenani / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/ahmed-eltahir | 200 | Dr. Ahmed Eltahir / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/ahmed-ibrahim | 200 | Dr. Ahmed Ibrahim / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/ahmed-morsy | 200 | Dr. Ahmed Morsy / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/ahmed-rohoma | 200 | Dr. Ahmed Rohoma / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/ali-mahmoud | 200 | Dr. Ali Mahmoud / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/amgad-ali | 200 | Dr. Amgad Ali / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/amjad-abdel-qader | 200 | Dr. Amjad Abdel Qader / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/asma-mohamed | 200 | Dr. Asma Mohamed / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/asmaa-abdullah | 200 | Dr. Asmaa Abdullah / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/asmaa-alalay | 200 | Dr. Asmaa Alalay / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/bader-al-qahtani | 200 | Dr. Bader Al Qahtani / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/ebtihal-mohammed | 200 | Dr. Ebtihal Mohammed / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/elsanosi-habour | 200 | Dr. Elsanosi Habour / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/farahim-chaudhary | 200 | Dr. Farahim Chaudhary / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/hasan-abueideh | 200 | Dr. Hasan Abueideh / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/hesham-mustafa | 200 | Dr. Hesham Mustafa / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/isra-adam | 200 | Dr. Isra Adam / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/kashif-ahmed | 200 | Dr. Kashif Ahmed / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/khalifa-swidan | 200 | Dr. Khalifa Swidan / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/majed-osaylan | 200 | Dr. Majed Osaylan / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/maysa-osman | 200 | Dr. Maysa Osman / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/medhat-hagras | 200 | Dr. Medhat Hagras / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/mehnaz-abdul-ghafoor | 200 | Dr. Mehnaz Abdul Ghafoor / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/mohamed-bahrudeen | 200 | Dr. Mohamed Bahrudeen / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/mohamed-fathi | 200 | Dr. Mohamed Fathi / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/mohamed-kallash | 200 | Dr. Mohamed Kallash / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/mohammed-alhayyan | 200 | Dr. Mohammed Alhayyan / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/mohammed-bawahal | 200 | Dr. Mohammed Bawahal / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/mohammed-esmail | 200 | Dr. Mohammed Esmail / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/mohammed-halawani | 200 | Dr. Mohammed Halawani / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/mohammed-mugahed | 200 | Dr. Mohammed Mugahed / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/nada-mohamed | 200 | Dr. Nada Mohamed / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/nader-bin-taleb | 200 | Dr. Nader Bin Taleb / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/nansy-elnaggar | 200 | Dr. Nansy Elnaggar / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/omar-baaqil | 200 | Dr. Omar Baaqil / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/rao-tariq | 200 | Dr. Rao Tariq / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/rasha-mahgoub | 200 | Dr. Rasha Mahgoub / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/rawiyah-abdalla | 200 | Dr. Rawiyah Abdalla / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/rober-kassab | 200 | Dr. Rober Kassab / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/safa-alsayed | 200 | Dr. Safa Alsayed / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/safa-mohamed | 200 | Dr. Safa Mohamed / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/saleh-damnan | 200 | Dr. Saleh Damnan / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/sami-alamin | 200 | Dr. Sami Alamin / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/samuel-tefera | 200 | Dr. Samuel Tefera / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/setelnesa-mohamed | 200 | Dr. Setelnesa Mohamed / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/shayma-marganie | 200 | Dr. Shayma Marganie / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/sheema-jeelani | 200 | Dr. Sheema Jeelani / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/souad-mohamed | 200 | Dr. Souad Mohamed / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/suhaila-kallada | 200 | Dr. Suhaila Kallada / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/suheib-ahmed | 200 | Dr. Suheib Ahmed / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/tamer-eissa | 200 | Dr. Tamer Eissa / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/wael-mabruk | 200 | Dr. Wael Mabruk / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/wael-sary | 200 | Dr. Wael Sary / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/wafaa-farag | 200 | Dr. Wafaa Farag / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/walaa-elgheriany | 200 | Dr. Walaa Elgheriany / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/walaa-mohamed | 200 | Dr. Walaa Mohamed / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/wissam-al-safi | 200 | Dr. Wissam Al Safi / Cambridge Hospital | 54 |
| /patient-hub/find-a-doctor/youssef-haggag | 200 | Dr. Youssef Haggag / Cambridge Hospital | 54 |
| /patient-hub/insurance-providers | 200 | Insurance Providers / Cambridge Hospital | 52 |
| /patient-hub/international-patients | 200 | International Patients / Cambridge Hospital | 53 |
| /patient-hub/refer-a-patient | 200 | Refer a Patient / Cambridge Hospital | 59 |
| /patient-hub/testimonials | 200 | Patient Testimonials / Cambridge Hospital | 56 |
| /sa | 200 | Cambridge Hospital | 111 |
| /sa/about | 200 | About Cambridge / Cambridge Hospital | 60 |
| /sa/about/accreditations-partnerships | 200 | Accreditations &amp; Partnerships / Cambridge Hospital | 56 |
| /sa/about/careers | 200 | Career Hub / Cambridge Hospital | 56 |
| /sa/about/who-we-are | 200 | Who We Are / Cambridge Hospital | 56 |
| /sa/about/why-cambridge-hospital | 200 | Why Cambridge / Cambridge Hospital | 59 |
| /sa/ar | 200 | مجموعة مستشفيات كامبريدج | 111 |
| /sa/ar/about | 200 | حول مستشفى كامبريدج / مستشفى كامبريدج | 60 |
| /sa/ar/about/accreditations-partnerships | 200 | الاعتمادات والشراكات / مستشفى كامبريدج | 56 |
| /sa/ar/about/careers | 200 | مركز التوظيف / مستشفى كامبريدج | 56 |
| /sa/ar/about/who-we-are | 200 | من نحن / مستشفى كامبريدج | 56 |
| /sa/ar/about/why-cambridge-hospital | 200 | لماذا مستشفى كامبريدج / مستشفى كامبريدج | 59 |
| /sa/ar/care | 200 | خدماتنا / مستشفى كامبريدج | 64 |
| /sa/ar/care/home-healthcare | 200 | خدمات الرعاية المنزلية / Cambridge Hospital | 60 |
| /sa/ar/care/in-school | 200 | خدمة الرعاية المدرسية / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient | 200 | خدمات المرضى الداخلية / Cambridge Hospital | 66 |
| /sa/ar/care/inpatient/icu-critical-care | 200 | ICU and Critical Care / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient/long-term-care-rehab | 200 | Long-Term Care &amp; Rehabilitation / Cambridge Hospital | 64 |
| /sa/ar/care/inpatient/long-term-care-rehab/geriatric-care | 200 | Geriatric Care / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient/long-term-care-rehab/long-term-acute-care | 200 | Long-Term Acute Care / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient/long-term-care-rehab/long-term-care | 200 | Long-Term Care / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient/long-term-care-rehab/paediatric-long-term-care | 200 | Paediatric Long-Term Care / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient/palliative-care | 200 | Palliative Care / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient/pediatric-rehab | 200 | Paediatric Care / Cambridge Hospital | 67 |
| /sa/ar/care/inpatient/pediatric-rehab/central-nervous-system | 200 | Central Nervous System Anomalies Rehabilitation / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient/pediatric-rehab/long-term-cardiac | 200 | Long-Term Cardiac Anomalies Rehabilitation / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient/pediatric-rehab/neuromuscular-rehab | 200 | Paediatric Neuromuscular Rehabilitation / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient/pediatric-rehab/paediatric-post-acute-rehab | 200 | Paediatric Post-Acute Rehabilitation / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient/pediatric-rehab/paediatric-transitional | 200 | Paediatric Transitional Care / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient/pediatric-rehab/pulmonary-rehab | 200 | Paediatric Pulmonary Rehabilitation / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient/pediatric-rehab/speech-language-rehab | 200 | Speech and Language Rehabilitation / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient/post-acute-rehabilitation | 200 | Post-Acute Rehabilitation / Cambridge Hospital | 64 |
| /sa/ar/care/inpatient/post-acute-rehabilitation/musculoskeletal-rehabilitation | 200 | Musculoskeletal Rehabilitation / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient/post-acute-rehabilitation/neurorehabilitation | 200 | Neurorehabilitation / Cambridge Hospital | 63 |
| /sa/ar/care/inpatient/post-acute-rehabilitation/neurorehabilitation/spinal-cord-injury-rehabilitation | 200 | Spinal Cord Injury Rehabilitation / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient/post-acute-rehabilitation/neurorehabilitation/stroke-rehabilitation | 200 | Stroke Rehabilitation / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient/post-acute-rehabilitation/neurorehabilitation/traumatic-brain-injury-rehabilitation | 200 | Traumatic Brain Injury Rehabilitation / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient/post-acute-rehabilitation/post-surgical-rehabilitation | 200 | Post-Surgical Rehabilitation / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient/post-acute-rehabilitation/road-traffic-accident-rehabilitation | 200 | Road Traffic Accident Rehabilitation / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient/ventilated-patients-care | 200 | Ventilated Patients Care / Cambridge Hospital | 62 |
| /sa/ar/care/inpatient/ventilated-patients-care/long-term-ventilated-care | 200 | Long-Term Ventilated Care / Cambridge Hospital | 60 |
| /sa/ar/care/inpatient/ventilated-patients-care/weaning-programme | 200 | Weaning Programme / Cambridge Hospital | 60 |
| /sa/ar/care/outpatient | 200 | خدمات العيادات الخارجية / Cambridge Hospital | 66 |
| /sa/ar/care/outpatient/cerebral-palsy-program | 200 | Cerebral Palsy Programme / Cambridge Hospital | 60 |
| /sa/ar/care/outpatient/occupational-therapy | 200 | Occupational Therapy / Cambridge Hospital | 60 |
| /sa/ar/care/outpatient/pediatric-care | 200 | Paediatric Care / Cambridge Hospital | 60 |
| /sa/ar/care/outpatient/physical-medicine-rehab-care | 200 | Physical Medicine and Rehabilitation Care / Cambridge Hospital | 60 |
| /sa/ar/care/outpatient/physiotherapy | 200 | Physiotherapy / Cambridge Hospital | 60 |
| /sa/ar/care/outpatient/speech-language-therapy | 200 | Speech and Language Therapy / Cambridge Hospital | 60 |
| /sa/ar/contact-us | 200 | اتصل بنا / مستشفى كامبريدج | 60 |
| /sa/ar/faqs | 200 | الأسئلة الشائعة / مستشفى كامبريدج | 52 |
| /sa/ar/hospitals | 200 | مستشفياتنا / مستشفى كامبريدج | 63 |
| /sa/ar/hospitals/al-mudeef-center-abu-dhabi | 404 | Page not found / Cambridge Hospital | 56 |
| /sa/ar/hospitals/cambridge-hospital-abu-dhabi | 404 | Page not found / Cambridge Hospital | 56 |
| /sa/ar/hospitals/cambridge-hospital-al-ain | 404 | Page not found / Cambridge Hospital | 56 |
| /sa/ar/hospitals/cambridge-hospital-al-khobar | 200 | مستشفى كامبريدج الخبر / Cambridge Hospital | 66 |
| /sa/ar/hospitals/cambridge-hospital-dhahran | 200 | مستشفى كامبريدج ظهران / Cambridge Hospital | 66 |
| /sa/ar/hospitals/cambridge-hospital-jeddah | 200 | مستشفى كامبريدج جدة / Cambridge Hospital | 66 |
| /sa/ar/legal/gdpr-compliance | 200 | الامتثال للائحة البيانات العامة لحماية البيانات / Cambridge Hospital | 51 |
| /sa/ar/legal/privacy-policy | 200 | سياسة الخصوصية / Cambridge Hospital | 51 |
| /sa/ar/media-hub | 200 | المركز الإعلامي / مستشفى كامبريدج | 68 |
| /sa/ar/media-hub/16th-hot-topics-in-pediatrics-conference-and-exhibition | 200 | المؤتمر والمعرض السادس عشر للمواضيع الساخنة في طب الأطفال / Cambridge Hospital | 60 |
| /sa/ar/media-hub/17th-seha-international-pediatric-conference | 200 | المؤتمر الدولي السابع عشر لطب الأطفال SEHA / Cambridge Hospital | 60 |
| /sa/ar/media-hub/1st-ehs-international-critical-care-organ-donation-and-transplant-conference | 200 | المؤتمر الدولي الأول للرعاية الحرجة والتبرع بالأعضاء وزراعة الأعضاء / Cambridge Hospital | 60 |
| /sa/ar/media-hub/1st-seha-national-corporate-case-management-symposium | 200 | الندوة الوطنية الأولى لإدارة الحالات المؤسسية التابعة ل SEHA / Cambridge Hospital | 60 |
| /sa/ar/media-hub/20th-emirates-critical-care-conference | 200 | المؤتمر العشرون للرعاية الحرجة في الإمارات / Cambridge Hospital | 60 |
| /sa/ar/media-hub/2nd-international-pediatric-neurodisability-and-neurorehabilitation-conference | 200 | المؤتمر الدولي الثاني لعلاج الإعاقة العصبية للأطفال وإعادة التأهيل العصبي / Cambridge Hospital | 60 |
| /sa/ar/media-hub/8-exercises-for-easing-tennis-elbow-plus-prevention-tips | 200 | 8 تمارين لتخفيف نصائح الوقاية من كوع التنس بلس / Cambridge Hospital | 65 |
| /sa/ar/media-hub/a-family-reunion-supporting-emotional-recovery | 200 | لم شمل عائلي يدعم التعافي العاطفي / Cambridge Hospital | 60 |
| /sa/ar/media-hub/a-musical-parade-at-al-mudeef-center | 200 | موكب موسيقي في مركز المديف / Cambridge Hospital | 60 |
| /sa/ar/media-hub/abdullah-an-emirati-youth-a-beacon-of-hope-and-a-success-story | 200 | عبد الله، شاب إماراتي، منارة أمل وقصة نجاح / Cambridge Hospital | 60 |
| /sa/ar/media-hub/al-khobar-opening-and-employee-recognition | 200 | افتتاح الخبر وتكريم الموظفين / Cambridge Hospital | 60 |
| /sa/ar/media-hub/al-mudeef-centre-achieves-jci-accreditation-following-comprehensive-transformation | 200 | مركز المضيف يحصل على اعتماد JCI بعد تحول شامل / Cambridge Hospital | 61 |
| /sa/ar/media-hub/amanat-holdings-acquires-cambridge-hospital | 200 | استحواذ أمانات القابضة على مستشفى كامبريدج / Cambridge Hospital | 61 |
| /sa/ar/media-hub/brachial-plexus-injury-diagnosis-treatment-and-rehabilitation | 200 | إصابة الضفيرة العضدية: التشخيص، العلاج، وإعادة التأهيل / Cambridge Hospital | 64 |
| /sa/ar/media-hub/cambridge-health-group-announces-sar-100-million-jeddah-expansion | 200 | مجموعة كامبريدج للصحة تعلن عن توسعة جدة بقيمة 100 مليون ريال سعودي / Cambridge Hospital | 61 |
| /sa/ar/media-hub/carpal-tunnel-syndrome-and-other-entrapment-neuropathies-and-role-of-occupational-therapy | 200 | متلازمة النفق الرسغي وغيرها من الاعتلالات العصبية الحبس ودور العلاج الوظيفي / Cambridge Hospital | 67 |
| /sa/ar/media-hub/dr-rober-interview-al-arabiya-tv | 200 | مقابلة د. روبير – قناة العربية / Cambridge Hospital | 61 |
| /sa/ar/patient-hub | 200 | مركز المرضى / مستشفى كامبريدج | 66 |
| /sa/ar/patient-hub/conditions-specialities | 200 | الحالات والتخصصات / مستشفى كامبريدج | 76 |
| /sa/ar/patient-hub/conditions-specialities/acquired-brain-injury | 200 | إصابة الدماغ المكتسبة / مستشفى كامبريدج | 60 |
| /sa/ar/patient-hub/conditions-specialities/amputation-prosthetic-rehabilitation | 200 | البتر وإعادة التأهيل بالأطراف الصناعية / مستشفى كامبريدج | 60 |
| /sa/ar/patient-hub/conditions-specialities/back-pain-lumbar-rehabilitation | 200 | آلام الظهر وإعادة التأهيل القطني / مستشفى كامبريدج | 60 |
| /sa/ar/patient-hub/conditions-specialities/epilepsy | 200 | الصرع / مستشفى كامبريدج | 60 |
| /sa/ar/patient-hub/conditions-specialities/fracture-rehabilitation | 200 | إعادة تأهيل الكسور / مستشفى كامبريدج | 60 |
| /sa/ar/patient-hub/conditions-specialities/guillain-barre-syndrome | 200 | متلازمة غيلان-باري / مستشفى كامبريدج | 60 |
| /sa/ar/patient-hub/conditions-specialities/hip-fracture-rehabilitation | 200 | إعادة تأهيل كسر الورك وكسر عنق الفخذ / مستشفى كامبريدج | 60 |
| /sa/ar/patient-hub/conditions-specialities/hip-knee-replacement-recovery | 200 | التعافي من استبدال الورك والركبة / مستشفى كامبريدج | 60 |
| /sa/ar/patient-hub/conditions-specialities/knee-ligament-cartilage-injuries | 200 | إصابات أربطة الركبة والغضاريف / مستشفى كامبريدج | 60 |
| /sa/ar/patient-hub/conditions-specialities/motor-neuron-diseases | 200 | أمراض الخلايا العصبية الحركية / مستشفى كامبريدج | 60 |
| /sa/ar/patient-hub/conditions-specialities/multiple-sclerosis | 200 | التصلب المتعدد / مستشفى كامبريدج | 60 |
| /sa/ar/patient-hub/conditions-specialities/musculoskeletal-orthopaedic-rehabilitation | 200 | إعادة التأهيل العضلي الهيكلي والعظمي / مستشفى كامبريدج | 60 |
| /sa/ar/patient-hub/conditions-specialities/neck-pain-cervical-rehabilitation | 200 | آلام الرقبة وإعادة التأهيل العنقي / مستشفى كامبريدج | 60 |
| /sa/ar/patient-hub/conditions-specialities/neurorehabilitation | 200 | إعادة التأهيل العصبي / مستشفى كامبريدج | 60 |
| /sa/ar/patient-hub/conditions-specialities/parkinsons-disease | 200 | مرض باركنسون / مستشفى كامبريدج | 60 |
| /sa/ar/patient-hub/conditions-specialities/shoulder-rotator-cuff-rehabilitation | 200 | إصابة الكتف وإعادة تأهيل الكفة المدورة / مستشفى كامبريدج | 60 |
| /sa/ar/patient-hub/conditions-specialities/spinal-cord-injury | 200 | إصابة الحبل الشوكي / مستشفى كامبريدج | 60 |
| /sa/ar/patient-hub/conditions-specialities/stroke-rehabilitation | 200 | إعادة تأهيل السكتة الدماغية / مستشفى كامبريدج | 60 |
| /sa/ar/patient-hub/conditions-specialities/tennis-elbow | 200 | كوع التنس / مستشفى كامبريدج | 60 |
| /sa/ar/patient-hub/conditions-specialities/traumatic-brain-injury | 200 | إصابة الدماغ الرضحية / مستشفى كامبريدج | 60 |
| /sa/ar/patient-hub/find-a-doctor | 200 | ابحث عن طبيب / مستشفى كامبريدج | 126 |
| /sa/ar/patient-hub/find-a-doctor/abbas-khalid | 200 | Dr. Abbas Khalid / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/abdulaziz-almetrek | 200 | Dr. Abdulaziz Almetrek / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/abdulaziz-alqutub | 200 | Dr. Abdulaziz Alqutub / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/abdulrahman-batarfi | 200 | Dr. Abdulrahman Batarfi / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/adnan-bahakam | 200 | Dr. Adnan Bahakam / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/ahmad-al-khayer | 200 | Dr. Ahmad Al Khayer / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/ahmad-almohamady | 200 | Dr. Ahmad Almohamady / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/ahmed-abdallah | 200 | Dr. Ahmed Abdallah / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/ahmed-basunbul | 200 | Dr. Ahmed Basunbul / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/ahmed-eldadah | 200 | Dr. Ahmed Eldadah / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/ahmed-elenani | 200 | Dr. Ahmed Elenani / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/ahmed-eltahir | 200 | Dr. Ahmed Eltahir / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/ahmed-ibrahim | 200 | Dr. Ahmed Ibrahim / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/ahmed-morsy | 200 | Dr. Ahmed Morsy / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/ahmed-rohoma | 200 | Dr. Ahmed Rohoma / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/ali-mahmoud | 200 | Dr. Ali Mahmoud / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/amgad-ali | 200 | Dr. Amgad Ali / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/amjad-abdel-qader | 200 | Dr. Amjad Abdel Qader / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/asma-mohamed | 200 | Dr. Asma Mohamed / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/asmaa-abdullah | 200 | Dr. Asmaa Abdullah / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/asmaa-alalay | 200 | Dr. Asmaa Alalay / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/bader-al-qahtani | 200 | Dr. Bader Al Qahtani / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/ebtihal-mohammed | 200 | Dr. Ebtihal Mohammed / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/elsanosi-habour | 200 | Dr. Elsanosi Habour / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/farahim-chaudhary | 200 | Dr. Farahim Chaudhary / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/hasan-abueideh | 200 | Dr. Hasan Abueideh / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/hesham-mustafa | 200 | Dr. Hesham Mustafa / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/isra-adam | 200 | Dr. Isra Adam / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/kashif-ahmed | 200 | Dr. Kashif Ahmed / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/khalifa-swidan | 200 | Dr. Khalifa Swidan / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/majed-osaylan | 200 | Dr. Majed Osaylan / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/maysa-osman | 200 | Dr. Maysa Osman / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/medhat-hagras | 200 | Dr. Medhat Hagras / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/mehnaz-abdul-ghafoor | 200 | Dr. Mehnaz Abdul Ghafoor / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/mohamed-bahrudeen | 200 | Dr. Mohamed Bahrudeen / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/mohamed-fathi | 200 | Dr. Mohamed Fathi / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/mohamed-kallash | 200 | Dr. Mohamed Kallash / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/mohammed-alhayyan | 200 | Dr. Mohammed Alhayyan / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/mohammed-bawahal | 200 | Dr. Mohammed Bawahal / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/mohammed-esmail | 200 | Dr. Mohammed Esmail / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/mohammed-halawani | 200 | Dr. Mohammed Halawani / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/mohammed-mugahed | 200 | Dr. Mohammed Mugahed / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/nada-mohamed | 200 | Dr. Nada Mohamed / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/nader-bin-taleb | 200 | Dr. Nader Bin Taleb / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/nansy-elnaggar | 200 | Dr. Nansy Elnaggar / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/omar-baaqil | 200 | Dr. Omar Baaqil / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/rao-tariq | 200 | Dr. Rao Tariq / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/rasha-mahgoub | 200 | Dr. Rasha Mahgoub / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/rawiyah-abdalla | 200 | Dr. Rawiyah Abdalla / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/rober-kassab | 200 | Dr. Rober Kassab / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/safa-alsayed | 200 | Dr. Safa Alsayed / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/safa-mohamed | 200 | Dr. Safa Mohamed / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/saleh-damnan | 200 | Dr. Saleh Damnan / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/sami-alamin | 200 | Dr. Sami Alamin / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/samuel-tefera | 200 | Dr. Samuel Tefera / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/setelnesa-mohamed | 200 | Dr. Setelnesa Mohamed / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/shayma-marganie | 200 | Dr. Shayma Marganie / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/sheema-jeelani | 200 | Dr. Sheema Jeelani / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/souad-mohamed | 200 | Dr. Souad Mohamed / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/suhaila-kallada | 200 | Dr. Suhaila Kallada / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/suheib-ahmed | 200 | Dr. Suheib Ahmed / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/tamer-eissa | 200 | Dr. Tamer Eissa / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/wael-mabruk | 200 | Dr. Wael Mabruk / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/wael-sary | 200 | Dr. Wael Sary / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/wafaa-farag | 200 | Dr. Wafaa Farag / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/walaa-elgheriany | 200 | Dr. Walaa Elgheriany / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/walaa-mohamed | 200 | Dr. Walaa Mohamed / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/wissam-al-safi | 200 | Dr. Wissam Al Safi / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/find-a-doctor/youssef-haggag | 200 | Dr. Youssef Haggag / Cambridge Hospital | 54 |
| /sa/ar/patient-hub/insurance-providers | 200 | شركات التأمين / مستشفى كامبريدج | 52 |
| /sa/ar/patient-hub/international-patients | 200 | المرضى الدوليون / مستشفى كامبريدج | 53 |
| /sa/ar/patient-hub/refer-a-patient | 200 | إحالة مريض / مستشفى كامبريدج | 59 |
| /sa/ar/patient-hub/testimonials | 200 | قصص نجاح المرضى / مستشفى كامبريدج | 56 |
| /sa/ar/your-opinion-matters | 200 | رأيك يهمنا / مستشفى كامبريدج | 53 |
| /sa/care | 200 | Our Care / Cambridge Hospital | 64 |
| /sa/care/home-healthcare | 200 | Home Care / Cambridge Hospital | 60 |
| /sa/care/in-school | 200 | In-School Care / Cambridge Hospital | 60 |
| /sa/care/inpatient | 200 | Inpatient Care / Cambridge Hospital | 66 |
| /sa/care/inpatient/icu-critical-care | 200 | ICU and Critical Care / Cambridge Hospital | 60 |
| /sa/care/inpatient/long-term-care-rehab | 200 | Long-Term Care &amp; Rehabilitation / Cambridge Hospital | 64 |
| /sa/care/inpatient/long-term-care-rehab/geriatric-care | 200 | Geriatric Care / Cambridge Hospital | 60 |
| /sa/care/inpatient/long-term-care-rehab/long-term-acute-care | 200 | Long-Term Acute Care / Cambridge Hospital | 60 |
| /sa/care/inpatient/long-term-care-rehab/long-term-care | 200 | Long-Term Care / Cambridge Hospital | 60 |
| /sa/care/inpatient/long-term-care-rehab/paediatric-long-term-care | 200 | Paediatric Long-Term Care / Cambridge Hospital | 60 |
| /sa/care/inpatient/palliative-care | 200 | Palliative Care / Cambridge Hospital | 60 |
| /sa/care/inpatient/pediatric-rehab | 200 | Paediatric Care / Cambridge Hospital | 67 |
| /sa/care/inpatient/pediatric-rehab/central-nervous-system | 200 | Central Nervous System Anomalies Rehabilitation / Cambridge Hospital | 60 |
| /sa/care/inpatient/pediatric-rehab/long-term-cardiac | 200 | Long-Term Cardiac Anomalies Rehabilitation / Cambridge Hospital | 60 |
| /sa/care/inpatient/pediatric-rehab/neuromuscular-rehab | 200 | Paediatric Neuromuscular Rehabilitation / Cambridge Hospital | 60 |
| /sa/care/inpatient/pediatric-rehab/paediatric-post-acute-rehab | 200 | Paediatric Post-Acute Rehabilitation / Cambridge Hospital | 60 |
| /sa/care/inpatient/pediatric-rehab/paediatric-transitional | 200 | Paediatric Transitional Care / Cambridge Hospital | 60 |
| /sa/care/inpatient/pediatric-rehab/pulmonary-rehab | 200 | Paediatric Pulmonary Rehabilitation / Cambridge Hospital | 60 |
| /sa/care/inpatient/pediatric-rehab/speech-language-rehab | 200 | Speech and Language Rehabilitation / Cambridge Hospital | 60 |
| /sa/care/inpatient/post-acute-rehabilitation | 200 | Post-Acute Rehabilitation / Cambridge Hospital | 64 |
| /sa/care/inpatient/post-acute-rehabilitation/musculoskeletal-rehabilitation | 200 | Musculoskeletal Rehabilitation / Cambridge Hospital | 60 |
| /sa/care/inpatient/post-acute-rehabilitation/neurorehabilitation | 200 | Neurorehabilitation / Cambridge Hospital | 63 |
| /sa/care/inpatient/post-acute-rehabilitation/neurorehabilitation/spinal-cord-injury-rehabilitation | 200 | Spinal Cord Injury Rehabilitation / Cambridge Hospital | 60 |
| /sa/care/inpatient/post-acute-rehabilitation/neurorehabilitation/stroke-rehabilitation | 200 | Stroke Rehabilitation / Cambridge Hospital | 60 |
| /sa/care/inpatient/post-acute-rehabilitation/neurorehabilitation/traumatic-brain-injury-rehabilitation | 200 | Traumatic Brain Injury Rehabilitation / Cambridge Hospital | 60 |
| /sa/care/inpatient/post-acute-rehabilitation/post-surgical-rehabilitation | 200 | Post-Surgical Rehabilitation / Cambridge Hospital | 60 |
| /sa/care/inpatient/post-acute-rehabilitation/road-traffic-accident-rehabilitation | 200 | Road Traffic Accident Rehabilitation / Cambridge Hospital | 60 |
| /sa/care/inpatient/ventilated-patients-care | 200 | Ventilated Patients Care / Cambridge Hospital | 62 |
| /sa/care/inpatient/ventilated-patients-care/long-term-ventilated-care | 200 | Long-Term Ventilated Care / Cambridge Hospital | 60 |
| /sa/care/inpatient/ventilated-patients-care/weaning-programme | 200 | Weaning Programme / Cambridge Hospital | 60 |
| /sa/care/outpatient | 200 | Outpatient Care / Cambridge Hospital | 66 |
| /sa/care/outpatient/cerebral-palsy-program | 200 | Cerebral Palsy Programme / Cambridge Hospital | 60 |
| /sa/care/outpatient/occupational-therapy | 200 | Occupational Therapy / Cambridge Hospital | 60 |
| /sa/care/outpatient/pediatric-care | 200 | Paediatric Care / Cambridge Hospital | 60 |
| /sa/care/outpatient/physical-medicine-rehab-care | 200 | Physical Medicine and Rehabilitation Care / Cambridge Hospital | 60 |
| /sa/care/outpatient/physiotherapy | 200 | Physiotherapy / Cambridge Hospital | 60 |
| /sa/care/outpatient/speech-language-therapy | 200 | Speech and Language Therapy / Cambridge Hospital | 60 |
| /sa/contact-us | 200 | Contact Us / Cambridge Hospital | 60 |
| /sa/faqs | 200 | Frequently Asked Questions / Cambridge Hospital | 52 |
| /sa/hospitals | 200 | Our Hospitals / Cambridge Hospital | 63 |
| /sa/hospitals/al-mudeef-center-abu-dhabi | 404 | Page not found / Cambridge Hospital | 56 |
| /sa/hospitals/cambridge-hospital-abu-dhabi | 404 | Page not found / Cambridge Hospital | 56 |
| /sa/hospitals/cambridge-hospital-al-ain | 404 | Page not found / Cambridge Hospital | 56 |
| /sa/hospitals/cambridge-hospital-al-khobar | 200 | Cambridge Hospital Al Khobar / Cambridge Hospital | 66 |
| /sa/hospitals/cambridge-hospital-dhahran | 200 | Cambridge Hospital Dhahran / Cambridge Hospital | 66 |
| /sa/hospitals/cambridge-hospital-jeddah | 200 | Cambridge Hospital Jeddah / Cambridge Hospital | 66 |
| /sa/legal/gdpr-compliance | 200 | GDPR Compliance / Cambridge Hospital | 51 |
| /sa/legal/privacy-policy | 200 | Privacy Policy / Cambridge Hospital | 51 |
| /sa/media-hub | 200 | Media Hub / Cambridge Hospital | 68 |
| /sa/media-hub/16th-hot-topics-in-pediatrics-conference-and-exhibition | 200 | 16th Hot Topics in Pediatrics Conference and Exhibition / Cambridge Hospital | 60 |
| /sa/media-hub/17th-seha-international-pediatric-conference | 200 | 17th SEHA International Pediatric Conference / Cambridge Hospital | 60 |
| /sa/media-hub/1st-ehs-international-critical-care-organ-donation-and-transplant-conference | 200 | 1st EHS International Critical Care, Organ Donation and Transplant Conference / Cambridge Hospital | 60 |
| /sa/media-hub/1st-seha-national-corporate-case-management-symposium | 200 | 1st SEHA National Corporate Case Management Symposium / Cambridge Hospital | 60 |
| /sa/media-hub/20th-emirates-critical-care-conference | 200 | 20th Emirates Critical Care Conference / Cambridge Hospital | 60 |
| /sa/media-hub/2nd-international-pediatric-neurodisability-and-neurorehabilitation-conference | 200 | 2nd International Paediatric Neurodisability and Neurorehabilitation Conference / Cambridge Hospital | 60 |
| /sa/media-hub/8-exercises-for-easing-tennis-elbow-plus-prevention-tips | 200 | 8 Exercises for Easing Tennis Elbow Plus Prevention Tips / Cambridge Hospital | 65 |
| /sa/media-hub/a-family-reunion-supporting-emotional-recovery | 200 | A Family Reunion Supporting Emotional Recovery / Cambridge Hospital | 60 |
| /sa/media-hub/a-musical-parade-at-al-mudeef-center | 200 | A Musical Parade at Al Mudeef Center / Cambridge Hospital | 60 |
| /sa/media-hub/abdullah-an-emirati-youth-a-beacon-of-hope-and-a-success-story | 200 | Abdullah, an Emirati youth, a beacon of hope and a success story / Cambridge Hospital | 60 |
| /sa/media-hub/al-khobar-opening-and-employee-recognition | 200 | Al Khobar Opening and Employee Recognition / Cambridge Hospital | 60 |
| /sa/media-hub/al-mudeef-centre-achieves-jci-accreditation-following-comprehensive-transformation | 200 | Al Mudeef Centre Achieves JCI Accreditation Following Comprehensive Transformation / Cambridge Hospital | 61 |
| /sa/media-hub/amanat-holdings-acquires-cambridge-hospital | 200 | Amanat Holdings Acquires Cambridge Hospital / Cambridge Hospital | 61 |
| /sa/media-hub/brachial-plexus-injury-diagnosis-treatment-and-rehabilitation | 200 | Brachial Plexus Injury: Diagnosis, Treatment, and Rehabilitation / Cambridge Hospital | 65 |
| /sa/media-hub/cambridge-health-group-announces-sar-100-million-jeddah-expansion | 200 | Cambridge Health Group Announces SAR 100 Million Jeddah Expansion / Cambridge Hospital | 61 |
| /sa/media-hub/carpal-tunnel-syndrome-and-other-entrapment-neuropathies-and-role-of-occupational-therapy | 200 | Carpal Tunnel Syndrome and Other Entrapment Neuropathies and Role of Occupational Therapy / Cambridge Hospital | 67 |
| /sa/media-hub/dr-rober-interview-al-arabiya-tv | 200 | Dr. Rober Interview - Al Arabiya TV / Cambridge Hospital | 61 |
| /sa/patient-hub | 200 | Patient Hub / Cambridge Hospital | 66 |
| /sa/patient-hub/conditions-specialities | 200 | Conditions &amp; Specialities / Cambridge Hospital | 76 |
| /sa/patient-hub/conditions-specialities/acquired-brain-injury | 200 | Acquired Brain Injury / Cambridge Hospital | 60 |
| /sa/patient-hub/conditions-specialities/amputation-prosthetic-rehabilitation | 200 | Amputation &amp; Prosthetic Rehabilitation / Cambridge Hospital | 60 |
| /sa/patient-hub/conditions-specialities/back-pain-lumbar-rehabilitation | 200 | Back Pain &amp; Lumbar Rehabilitation / Cambridge Hospital | 60 |
| /sa/patient-hub/conditions-specialities/epilepsy | 200 | Epilepsy / Cambridge Hospital | 60 |
| /sa/patient-hub/conditions-specialities/fracture-rehabilitation | 200 | Fracture Rehabilitation / Cambridge Hospital | 60 |
| /sa/patient-hub/conditions-specialities/guillain-barre-syndrome | 200 | Guillain-Barré Syndrome / Cambridge Hospital | 60 |
| /sa/patient-hub/conditions-specialities/hip-fracture-rehabilitation | 200 | Hip Fracture &amp; Femoral Neck Fracture Rehabilitation / Cambridge Hospital | 60 |
| /sa/patient-hub/conditions-specialities/hip-knee-replacement-recovery | 200 | Hip &amp; Knee Replacement Recovery / Cambridge Hospital | 60 |
| /sa/patient-hub/conditions-specialities/knee-ligament-cartilage-injuries | 200 | Knee Ligament &amp; Cartilage Injuries / Cambridge Hospital | 60 |
| /sa/patient-hub/conditions-specialities/motor-neuron-diseases | 200 | Motor Neuron Diseases / Cambridge Hospital | 60 |
| /sa/patient-hub/conditions-specialities/multiple-sclerosis | 200 | Multiple Sclerosis / Cambridge Hospital | 60 |
| /sa/patient-hub/conditions-specialities/musculoskeletal-orthopaedic-rehabilitation | 200 | Musculoskeletal and Orthopaedic Rehabilitation / Cambridge Hospital | 60 |
| /sa/patient-hub/conditions-specialities/neck-pain-cervical-rehabilitation | 200 | Neck Pain &amp; Cervical Rehabilitation / Cambridge Hospital | 60 |
| /sa/patient-hub/conditions-specialities/neurorehabilitation | 200 | Neurorehabilitation / Cambridge Hospital | 60 |
| /sa/patient-hub/conditions-specialities/parkinsons-disease | 200 | Parkinson&#39;s Disease / Cambridge Hospital | 60 |
| /sa/patient-hub/conditions-specialities/shoulder-rotator-cuff-rehabilitation | 200 | Shoulder Injury &amp; Rotator Cuff Rehabilitation / Cambridge Hospital | 60 |
| /sa/patient-hub/conditions-specialities/spinal-cord-injury | 200 | Spinal Cord Injury / Cambridge Hospital | 60 |
| /sa/patient-hub/conditions-specialities/stroke-rehabilitation | 200 | Stroke Rehabilitation / Cambridge Hospital | 60 |
| /sa/patient-hub/conditions-specialities/tennis-elbow | 200 | Tennis Elbow / Cambridge Hospital | 60 |
| /sa/patient-hub/conditions-specialities/traumatic-brain-injury | 200 | Traumatic Brain Injury / Cambridge Hospital | 60 |
| /sa/patient-hub/find-a-doctor | 200 | Find a Doctor / Cambridge Hospital | 126 |
| /sa/patient-hub/find-a-doctor/abbas-khalid | 200 | Dr. Abbas Khalid / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/abdulaziz-almetrek | 200 | Dr. Abdulaziz Almetrek / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/abdulaziz-alqutub | 200 | Dr. Abdulaziz Alqutub / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/abdulrahman-batarfi | 200 | Dr. Abdulrahman Batarfi / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/adnan-bahakam | 200 | Dr. Adnan Bahakam / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/ahmad-al-khayer | 200 | Dr. Ahmad Al Khayer / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/ahmad-almohamady | 200 | Dr. Ahmad Almohamady / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/ahmed-abdallah | 200 | Dr. Ahmed Abdallah / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/ahmed-basunbul | 200 | Dr. Ahmed Basunbul / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/ahmed-eldadah | 200 | Dr. Ahmed Eldadah / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/ahmed-elenani | 200 | Dr. Ahmed Elenani / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/ahmed-eltahir | 200 | Dr. Ahmed Eltahir / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/ahmed-ibrahim | 200 | Dr. Ahmed Ibrahim / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/ahmed-morsy | 200 | Dr. Ahmed Morsy / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/ahmed-rohoma | 200 | Dr. Ahmed Rohoma / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/ali-mahmoud | 200 | Dr. Ali Mahmoud / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/amgad-ali | 200 | Dr. Amgad Ali / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/amjad-abdel-qader | 200 | Dr. Amjad Abdel Qader / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/asma-mohamed | 200 | Dr. Asma Mohamed / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/asmaa-abdullah | 200 | Dr. Asmaa Abdullah / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/asmaa-alalay | 200 | Dr. Asmaa Alalay / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/bader-al-qahtani | 200 | Dr. Bader Al Qahtani / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/ebtihal-mohammed | 200 | Dr. Ebtihal Mohammed / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/elsanosi-habour | 200 | Dr. Elsanosi Habour / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/farahim-chaudhary | 200 | Dr. Farahim Chaudhary / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/hasan-abueideh | 200 | Dr. Hasan Abueideh / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/hesham-mustafa | 200 | Dr. Hesham Mustafa / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/isra-adam | 200 | Dr. Isra Adam / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/kashif-ahmed | 200 | Dr. Kashif Ahmed / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/khalifa-swidan | 200 | Dr. Khalifa Swidan / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/majed-osaylan | 200 | Dr. Majed Osaylan / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/maysa-osman | 200 | Dr. Maysa Osman / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/medhat-hagras | 200 | Dr. Medhat Hagras / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/mehnaz-abdul-ghafoor | 200 | Dr. Mehnaz Abdul Ghafoor / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/mohamed-bahrudeen | 200 | Dr. Mohamed Bahrudeen / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/mohamed-fathi | 200 | Dr. Mohamed Fathi / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/mohamed-kallash | 200 | Dr. Mohamed Kallash / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/mohammed-alhayyan | 200 | Dr. Mohammed Alhayyan / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/mohammed-bawahal | 200 | Dr. Mohammed Bawahal / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/mohammed-esmail | 200 | Dr. Mohammed Esmail / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/mohammed-halawani | 200 | Dr. Mohammed Halawani / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/mohammed-mugahed | 200 | Dr. Mohammed Mugahed / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/nada-mohamed | 200 | Dr. Nada Mohamed / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/nader-bin-taleb | 200 | Dr. Nader Bin Taleb / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/nansy-elnaggar | 200 | Dr. Nansy Elnaggar / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/omar-baaqil | 200 | Dr. Omar Baaqil / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/rao-tariq | 200 | Dr. Rao Tariq / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/rasha-mahgoub | 200 | Dr. Rasha Mahgoub / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/rawiyah-abdalla | 200 | Dr. Rawiyah Abdalla / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/rober-kassab | 200 | Dr. Rober Kassab / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/safa-alsayed | 200 | Dr. Safa Alsayed / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/safa-mohamed | 200 | Dr. Safa Mohamed / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/saleh-damnan | 200 | Dr. Saleh Damnan / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/sami-alamin | 200 | Dr. Sami Alamin / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/samuel-tefera | 200 | Dr. Samuel Tefera / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/setelnesa-mohamed | 200 | Dr. Setelnesa Mohamed / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/shayma-marganie | 200 | Dr. Shayma Marganie / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/sheema-jeelani | 200 | Dr. Sheema Jeelani / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/souad-mohamed | 200 | Dr. Souad Mohamed / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/suhaila-kallada | 200 | Dr. Suhaila Kallada / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/suheib-ahmed | 200 | Dr. Suheib Ahmed / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/tamer-eissa | 200 | Dr. Tamer Eissa / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/wael-mabruk | 200 | Dr. Wael Mabruk / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/wael-sary | 200 | Dr. Wael Sary / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/wafaa-farag | 200 | Dr. Wafaa Farag / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/walaa-elgheriany | 200 | Dr. Walaa Elgheriany / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/walaa-mohamed | 200 | Dr. Walaa Mohamed / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/wissam-al-safi | 200 | Dr. Wissam Al Safi / Cambridge Hospital | 54 |
| /sa/patient-hub/find-a-doctor/youssef-haggag | 200 | Dr. Youssef Haggag / Cambridge Hospital | 54 |
| /sa/patient-hub/insurance-providers | 200 | Insurance Providers / Cambridge Hospital | 52 |
| /sa/patient-hub/international-patients | 200 | International Patients / Cambridge Hospital | 53 |
| /sa/patient-hub/refer-a-patient | 200 | Refer a Patient / Cambridge Hospital | 59 |
| /sa/patient-hub/testimonials | 200 | Patient Testimonials / Cambridge Hospital | 56 |
| /sa/your-opinion-matters | 200 | Your Experience Matters to Us / Cambridge Hospital | 53 |
| /your-opinion-matters | 200 | Your Experience Matters to Us / Cambridge Hospital | 53 |
