# Arabic still missing (English shown on Arabic pages)

Generated 13 Oct 2026 (mobile QA H2) by comparing every `src/data/content/<page>/<section>.en.json` with its `.ar.json` and every
`{ en, ar }` field in the entity files. Each value below has **no client-approved Arabic** in any project source (WordPress export,
saved live Arabic pages, client documents, Figma cache), so the site shows the English text on all three Arabic editions (Global, UAE,
KSA share these files). CLAUDE.md: Arabic must be exactly the client's text, never translated by us, so each one needs the client's
Arabic (docs/open-decisions.md WP2 / CT24 / CT31 / R053 / WP13). Add it to the `.ar.json` file at the given key; nothing else changes.

Reused on 13 Oct (same English term already approved elsewhere, not translated): form "E-mail" labels, the newsletter "Email" field,
the hospital map "Phone" label and the country pop-up "UAE" chip (see each file's `_note`).

## Page text: 310 strings

| File (`src/data/content/…`) | Key | English shown |
|---|---|---|
| `about/page.ar.json` | `meta.description` | Learn about Cambridge Hospital Group, our mission, accreditations, partnerships and commitment to specialized healthcare and rehabilitation  |
| `about/page.ar.json` | `intro.video.poster` | about/video-thumbnail |
| `about/page.ar.json` | `intro.video.playLabel` | Play video |
| `about/page.ar.json` | `timeline.prevLabel` | Previous |
| `about/page.ar.json` | `timeline.nextLabel` | Next |
| `accreditations/page.ar.json` | `meta.description` | Cambridge Hospital's care is guided by internationally recognised standards that ensure safety, consistency and measurable clinical outcomes |
| `accreditations/page.ar.json` | `pendingTab` | Content pending |
| `article/page.ar.json` | `meta.title` | {title} / Cambridge Hospital |
| `article/page.ar.json` | `meta.descriptionFallback` | {title} - Media Hub, Cambridge Hospital. |
| `article/page.ar.json` | `hero.button.label` | Consult for a Care Plan |
| `article/page.ar.json` | `date.label` | Published |
| `article/page.ar.json` | `pending.body` | Content pending: the full text of this post arrives with the news export. |
| `article/page.ar.json` | `doctors.listLabel` | Our doctors |
| `article/page.ar.json` | `video.playLabel` | Play video |
| `calculators/bmi.ar.json` | `$comment` | Live site calculator page (cambridgehospital.com, WordPress export 6 Oct 2026 for the hero and intro; the form text and result strings from  |
| `calculators/common.ar.json` | `$comment` | Shared text of the four health calculators. errors.invalid = the live heart-age script's only validation message, shown once above the butto |
| `calculators/heart-age.ar.json` | `$comment` | Live site calculator page (cambridgehospital.com, WordPress export 6 Oct 2026 for the hero and intro; the form text and result strings from  |
| `calculators/lung-health.ar.json` | `$comment` | Live site calculator page (cambridgehospital.com, WordPress export 6 Oct 2026 for the hero and intro; the form text and result strings from  |
| `calculators/stroke-risk.ar.json` | `$comment` | Live site calculator page (cambridgehospital.com, WordPress export 6 Oct 2026 for the hero and intro; the form text and result strings from  |
| `care/shared.ar.json` | `meta.title` | {title} / Cambridge Hospital |
| `care/shared.ar.json` | `meta.description` | {title} at Cambridge Hospital: specialised rehabilitation and long-term care with expert medical supervision. |
| `care/shared.ar.json` | `sub.topicsLabel` | Topics |
| `care/shared.ar.json` | `sub.cardsHeading` | Our {title} Programmes |
| `care/shared.ar.json` | `sub.conditionsHeading` | Conditions Treated by Our Specialists |
| `care/shared.ar.json` | `sub.conditionsLabel` | Programmes |
| `care/shared.ar.json` | `sub.button` | Know More |
| `care/shared.ar.json` | `doctors.listLabel` | Our doctors |
| `care/shared.ar.json` | `pending.service` | Content pending: this service page is generated from the care data until its text and photos are supplied. |
| `care/shared.ar.json` | `pending.sub` | Content pending: this page is generated from its card text until its document is supplied (Paediatric Care main page: not in the content fol |
| `careers/page.ar.json` | `meta.description` | Careers at Cambridge Hospital: join a team shaping recovery, restoring lives and redefining care across the region. |
| `careers/page.ar.json` | `pendingTab` | Content pending |
| `careers/page.ar.json` | `hero.button.label` | Join our Team |
| `careers/page.ar.json` | `life.join.label` | Join our Team |
| `careers/page.ar.json` | `life.openRoles.label` | View Open Roles |
| `careers/page.ar.json` | `talent.photo.alt` | An Emirati woman and man, Cambridge Hospital clinicians |
| `careers/page.ar.json` | `cta.openRoles.label` | View Open Roles |
| `careers/page.ar.json` | `cta.apply.label` | Apply Now |
| `condition-detail/shared.ar.json` | `tabsLabel` | Topics |
| `condition-detail/shared.ar.json` | `pending.note` | Content pending: this page is generated from the condition card until the full text is supplied. |
| `condition-detail/shared.ar.json` | `pending.tab` | Content pending for this topic. |
| `condition-detail/shared.ar.json` | `pending.banner` | Banner photo pending for this condition: the shared placeholder is shown until the page's own photo is supplied. |
| `condition-detail/shared.ar.json` | `generated.metaTitle` | {title} / Cambridge Hospital |
| `condition-detail/shared.ar.json` | `doctors.listLabel` | Our doctors |
| `conditions-specialities/page.ar.json` | `heading` | Our Specialities |
| `conditions-specialities/page.ar.json` | `filters.ariaLabel` | Filter conditions |
| `conditions-specialities/page.ar.json` | `filters.specialtyLabel` | Select speciality |
| `conditions-specialities/page.ar.json` | `filters.conditionLabel` | Select condition |
| `conditions-specialities/page.ar.json` | `filters.sortLabel` | A - Z |
| `conditions-specialities/page.ar.json` | `filters.sortSpecialtyAria` | Sort A to Z |
| `conditions-specialities/page.ar.json` | `filters.sortConditionAria` | Sort A to Z |
| `conditions-specialities/page.ar.json` | `results.listLabel` | Conditions |
| `conditions-specialities/page.ar.json` | `results.empty` | No conditions match your selection. |
| `conditions-specialities/page.ar.json` | `results.found` | {n} conditions shown |
| `contact/page.ar.json` | `hero.button.label` | Inquire Now |
| `contact/page.ar.json` | `form.ariaLabel` | Send an enquiry |
| `contact/page.ar.json` | `form.nameLabel` | Full Name* |
| `contact/page.ar.json` | `form.hospitalLabel` | Hospital* |
| `contact/page.ar.json` | `form.hospitalPlaceholder` | Select Hospital |
| `contact/page.ar.json` | `form.subjectLabel` | Subject* |
| `contact/page.ar.json` | `form.messagePlaceholder` | Type your Message* |
| `contact/page.ar.json` | `form.consent.before` | I have read the  |
| `contact/page.ar.json` | `form.consent.link.label` | Privacy policy |
| `contact/page.ar.json` | `form.consent.after` |  and I consent to the transfer and processing of |
| `contact/page.ar.json` | `form.consent.line2` | my personal data. |
| `contact/page.ar.json` | `form.submit` | SUBMIT |
| `contact/page.ar.json` | `details.email` | info@cambridgehospital.com |
| `doctors/page.ar.json` | `filters.ariaLabel` | Filter doctors |
| `doctors/page.ar.json` | `filters.countryLabel` | Filter doctors by country |
| `doctors/page.ar.json` | `filters.nameLabel` | Search for Doctors by Name |
| `doctors/page.ar.json` | `filters.clearName` | Clear doctor name |
| `doctors/page.ar.json` | `filters.specialtyLabel` | Search for Specialities |
| `doctors/page.ar.json` | `results.listLabel` | Doctors |
| `doctors/page.ar.json` | `results.found` | {n} doctors found |
| `doctors/page.ar.json` | `results.empty` | No doctors match your search. |
| `doctors/page.ar.json` | `profile.metaTitle` | {name} / Cambridge Hospital |
| `doctors/page.ar.json` | `profile.metaDescription` | {name}, {title}. Book an appointment at Cambridge Hospital. |
| `doctors/page.ar.json` | `profile.breadcrumbLabel` | Breadcrumb |
| `doctors/page.ar.json` | `profile.home` | Home |
| `faq/page.ar.json` | `hero.ariaLabel` | FAQ |
| `faq/page.ar.json` | `hero.button.label` | Consult for a Care Plan |
| `faq/page.ar.json` | `empty` | Questions for this category will be available soon. |
| `faq/page.ar.json` | `answerPending` | Answer pending. |
| `forms/book.ar.json` | `section` | Patient Details: |
| `forms/book.ar.json` | `fields.specialty.placeholder` | Select Speciality |
| `forms/book.ar.json` | `fields.doctor.placeholder` | Select a Doctor (Optional) |
| `forms/book.ar.json` | `fields.name.label` | Name* |
| `forms/book.ar.json` | `fields.dob.label` | DOB* |
| `forms/book.ar.json` | `fields.mobile.label` | Mobile* |
| `forms/book.ar.json` | `fields.mobile.placeholder` | xx xxx xxxx |
| `forms/book.ar.json` | `fields.gender.label` | Gender* |
| `forms/book.ar.json` | `fields.message.placeholder` | Other details.... |
| `forms/book.ar.json` | `submit` | SUBMIT |
| `forms/common.ar.json` | `$comment` | Shared form text. Figma has no design or copy for the close button, errors or success message: these strings are NOT from Figma and need Pra |
| `forms/common.ar.json` | `close` | Close |
| `forms/common.ar.json` | `dialCodeLabel` | Country code |
| `forms/common.ar.json` | `consent.before` | I have read the  |
| `forms/common.ar.json` | `consent.link.label` | Privacy policy |
| `forms/common.ar.json` | `consent.after` |  and I consent to the transfer and processing of |
| `forms/common.ar.json` | `consent.line2` | my personal data. |
| `forms/common.ar.json` | `errors.summary` | Please check the highlighted fields. |
| `forms/common.ar.json` | `errors.required` | This field is required. |
| `forms/common.ar.json` | `errors.invalid` | Please enter a valid value. |
| `forms/common.ar.json` | `errors.invalid_email` | Please enter a valid email address. |
| `forms/common.ar.json` | `errors.invalid_tel` | Please enter a valid mobile number. |
| `forms/common.ar.json` | `errors.invalid_date` | Please enter a valid date. |
| `forms/common.ar.json` | `errors.too_long` | This is too long. |
| `forms/common.ar.json` | `errors.consent` | Please accept the privacy policy to continue. |
| `forms/common.ar.json` | `errors.turnstile` | Please complete the security check and try again. |
| `forms/common.ar.json` | `errors.send_failed` | Sorry, your message could not be sent. Please try again later. |
| `forms/common.ar.json` | `errors.network` | Sorry, your message could not be sent. Please check your connection and try again. |
| `forms/common.ar.json` | `success.title` | Thank you |
| `forms/common.ar.json` | `success.text` | Your message has been sent. Our team will contact you soon. |
| `forms/common.ar.json` | `sending` | Sending… |
| `forms/feedback.ar.json` | `hero.button.label` | Consult for a Care Plan |
| `forms/feedback.ar.json` | `ariaLabel` | Patient feedback form |
| `forms/feedback.ar.json` | `fields.name.label` | Name* |
| `forms/feedback.ar.json` | `fields.hospital.label` | Hospital |
| `forms/feedback.ar.json` | `fields.mobile.label` | Mobile* |
| `forms/feedback.ar.json` | `fields.mobile.placeholder` | xx xxx xxxx |
| `forms/feedback.ar.json` | `fields.recommend.options.never` | Never |
| `forms/feedback.ar.json` | `fields.recommend.options.not-very-likely` | Not Very Likely |
| `forms/feedback.ar.json` | `fields.recommend.options.somewhat-likely` | Somewhat Likely |
| `forms/feedback.ar.json` | `fields.recommend.options.likely` | Likely |
| `forms/feedback.ar.json` | `fields.recommend.options.very-likely` | Very Likely |
| `forms/feedback.ar.json` | `matrix.columns.very-dissatisfied.0` | Very |
| `forms/feedback.ar.json` | `matrix.columns.very-dissatisfied.1` | Dissatisfied |
| `forms/feedback.ar.json` | `matrix.columns.dissatisfied.0` | Dissatisfied |
| `forms/feedback.ar.json` | `matrix.columns.neutral.0` | Neutral |
| `forms/feedback.ar.json` | `matrix.columns.satisfied.0` | Satisfied |
| `forms/feedback.ar.json` | `matrix.columns.very-satisfied.0` | Very |
| `forms/feedback.ar.json` | `matrix.columns.very-satisfied.1` | Satisfied |
| `forms/feedback.ar.json` | `submit` | SUBMIT |
| `forms/inquiry.ar.json` | `fields.name.label` | Name* |
| `forms/inquiry.ar.json` | `fields.mobile.label` | Mobile* |
| `forms/inquiry.ar.json` | `fields.mobile.placeholder` | xx xxx xxxx |
| `forms/inquiry.ar.json` | `fields.message.placeholder` | Tell us how we can help… |
| `forms/inquiry.ar.json` | `submit` | SUBMIT |
| `forms/international.ar.json` | `ariaLabel` | International patient inquiry form |
| `forms/international.ar.json` | `heading` | Submit Your Inquiry |
| `forms/international.ar.json` | `section` | Patient Details: |
| `forms/international.ar.json` | `fields.name.label` | Name |
| `forms/international.ar.json` | `fields.mobile.label` | Mobile |
| `forms/international.ar.json` | `fields.mobile.placeholder` | xx xxx xxxx |
| `forms/international.ar.json` | `fields.country.label` | Country |
| `forms/international.ar.json` | `fields.country.placeholder` | Select Country |
| `forms/international.ar.json` | `fields.gender.label` | Gender* |
| `forms/international.ar.json` | `fields.message.placeholder` | Query Details |
| `forms/international.ar.json` | `consent.before` | By proceeding you agree  |
| `forms/international.ar.json` | `consent.link` | Terms & conditions |
| `forms/international.ar.json` | `submit` | SUBMIT |
| `forms/opinion.ar.json` | `section` | Your Details: |
| `forms/opinion.ar.json` | `fields.specialty.placeholder` | Select Speciality |
| `forms/opinion.ar.json` | `fields.doctor.placeholder` | Select a Doctor (Optional) |
| `forms/opinion.ar.json` | `fields.name.label` | Name* |
| `forms/opinion.ar.json` | `fields.visit_date.label` | Date of Visit |
| `forms/opinion.ar.json` | `fields.mobile.label` | Mobile* |
| `forms/opinion.ar.json` | `fields.mobile.placeholder` | xx xxx xxxx |
| `forms/opinion.ar.json` | `fields.overall.label` | Overall Experience |
| `forms/opinion.ar.json` | `fields.staff.label` | Staff Friendliness |
| `forms/opinion.ar.json` | `fields.wait.label` | Wait Time |
| `forms/opinion.ar.json` | `fields.communication.label` | Communication |
| `forms/opinion.ar.json` | `fields.message.placeholder` | Share your opinion in detail..... |
| `forms/opinion.ar.json` | `ratingOptions.excellent` | Excellent |
| `forms/opinion.ar.json` | `ratingOptions.good` | Good |
| `forms/opinion.ar.json` | `ratingOptions.medium` | Medium |
| `forms/opinion.ar.json` | `ratingOptions.poor` | Poor |
| `forms/opinion.ar.json` | `submit` | SUBMIT FEEDBACK |
| `forms/refer.ar.json` | `tabsLabel` | Who is referring |
| `forms/refer.ar.json` | `ariaLabel.doctor` | Patient referral form for healthcare professionals |
| `forms/refer.ar.json` | `ariaLabel.other` | Patient referral form for you, family or friends |
| `forms/refer.ar.json` | `ariaLabel.corporate` | Patient referral form for corporate or organisations |
| `forms/refer.ar.json` | `sections.doctor` | Referring Doctor Details: |
| `forms/refer.ar.json` | `sections.requested` | Requested Speciality: |
| `forms/refer.ar.json` | `sections.patient` | Patient Details: |
| `forms/refer.ar.json` | `sections.info` | Referral Information: |
| `forms/refer.ar.json` | `sections.history` | Brief History: |
| `forms/refer.ar.json` | `fields.doctor_name.label` | Name* |
| `forms/refer.ar.json` | `fields.doctor_specialty.label` | Speciality |
| `forms/refer.ar.json` | `fields.doctor_mobile.label` | Mobile* |
| `forms/refer.ar.json` | `fields.doctor_mobile.placeholder` | xx xxx xxxx |
| `forms/refer.ar.json` | `fields.specialty.placeholder` | Select Speciality |
| `forms/refer.ar.json` | `fields.doctor.placeholder` | Select a Doctor (Optional) |
| `forms/refer.ar.json` | `fields.name.label` | Name* |
| `forms/refer.ar.json` | `fields.dob.label` | DOB* |
| `forms/refer.ar.json` | `fields.mobile.label` | Mobile* |
| `forms/refer.ar.json` | `fields.mobile.placeholder` | xx xxx xxxx |
| `forms/refer.ar.json` | `fields.gender.label` | Gender* |
| `forms/refer.ar.json` | `fields.eid.label` | EID / Passport No: |
| `forms/refer.ar.json` | `fields.referral_type.label` | Referral Type |
| `forms/refer.ar.json` | `fields.referral_type.placeholder` | Select Option |
| `forms/refer.ar.json` | `fields.referral_for.label` | Referral For |
| `forms/refer.ar.json` | `fields.referral_for.placeholder` | Select Option |
| `forms/refer.ar.json` | `fields.guardian_name.label` | Paediatrics Cases |
| `forms/refer.ar.json` | `fields.guardian_name.placeholder` | Guardian Name |
| `forms/refer.ar.json` | `fields.guardian_mobile.label` | Mobile* |
| `forms/refer.ar.json` | `fields.guardian_mobile.placeholder` | xx xxx xxxx |
| `forms/refer.ar.json` | `fields.diagnosis.placeholder` | Diagnosis (ICD Code if available)*: |
| `forms/refer.ar.json` | `fields.history.placeholder` | Please share relevant information.... |
| `forms/refer.ar.json` | `submit` | SUBMIT |
| `forms/welcome.ar.json` | `$comment` | `ae` = text exactly as in Figma 76:196 (UAE version; written for a visitor already ON the UAE site). `aeOnGlobal` = the same pop-up shown on |
| `forms/welcome.ar.json` | `ae.title` | You’re on Our UAE Website |
| `forms/welcome.ar.json` | `ae.continue` | Continue Here |
| `forms/welcome.ar.json` | `ae.or` | OR |
| `forms/welcome.ar.json` | `ae.global` | Go to Global Website |
| `forms/welcome.ar.json` | `aeOnGlobal.title` | Looks like you’re in the UAE |
| `forms/welcome.ar.json` | `aeOnGlobal.continue` | Go to UAE Website |
| `forms/welcome.ar.json` | `aeOnGlobal.or` | OR |
| `forms/welcome.ar.json` | `aeOnGlobal.global` | Stay on Global Website |
| `home/calculators.ar.json` | `photo.alt` | Patient receiving care at Cambridge Hospital |
| `home/contact.ar.json` | `email` | info@cambridgehospital.com |
| `home/contact.ar.json` | `addressLabel` | Address: |
| `home/contact.ar.json` | `address` | Prestige 17 Tower - Hamdan Bin Mohammed St - Mohamed Bin Zayed City - ME2 - Abu Dhabi |
| `home/contact.ar.json` | `social.alt` | Social media icons |
| `home/contact.ar.json` | `form.nameLabel` | Your Name |
| `home/contact.ar.json` | `form.emailLabel` | Email Address |
| `home/contact.ar.json` | `form.messageLabel` | Message |
| `home/contact.ar.json` | `form.messagePlaceholder` | Write Something... |
| `home/contact.ar.json` | `form.submit` | Send Message |
| `home/cta.ar.json` | `ariaLabel` | Quick actions |
| `home/doctors.ar.json` | `filterLabel` | Filter doctors by country |
| `home/facilities.ar.json` | `mapAlt` | Map of the region showing Cambridge Hospital locations in Saudi Arabia and the United Arab Emirates |
| `home/hero.ar.json` | `ariaLabel` | Hero |
| `home/hero.ar.json` | `banner.layers.background` | hero/banner3-bg |
| `home/hero.ar.json` | `banner.layers.subject` | hero/banner3-subject |
| `home/insurance.ar.json` | `logos.0.alt` | Thiqa |
| `home/insurance.ar.json` | `logos.1.alt` | Daman |
| `home/insurance.ar.json` | `logos.2.alt` | ADNIC – Abu Dhabi National Insurance Company |
| `home/insurance.ar.json` | `logos.3.alt` | Neuron |
| `home/insurance.ar.json` | `logos.4.alt` | Almadallah Healthcare Management |
| `home/insurance.ar.json` | `logos.5.alt` | SAICO |
| `home/insurance.ar.json` | `logos.6.alt` | Nextcare |
| `home/meta.ar.json` | `description` | Explore Cambridge Hospital Group’s specialized care services, hospitals, patient support and healthcare resources across the UAE and Saudi A |
| `hospital-detail/al-khobar.ar.json` | `hero.text` | An advanced rehabilitation and long-term care & hospital |
| `hospital-detail/al-khobar.ar.json` | `environment.text.0` | Cambridge Hospital Al Khobar is a specialised long-term care and rehabilitation hospital equipped to manage complex cases, including those r |
| `hospital-detail/al-khobar.ar.json` | `environment.text.1` | The hospital delivers integrated care through a multidisciplinary approach, supported by advanced diagnostic services and purpose-built clin |
| `hospital-detail/al-mudeef-abu-dhabi.ar.json` | `environment.text.0` | Al Mudeef Centre is operated through a partnership with the Zayed Authority for People of Determination, with Cambridge Hospital providing c |
| `hospital-detail/al-mudeef-abu-dhabi.ar.json` | `environment.text.1` | Through a coordinated, multidisciplinary approach, the centre provides comprehensive rehabilitation and ongoing clinical support. With an em |
| `hospital-detail/dhahran.ar.json` | `hero.text` | A specialised rehabilitation hub in the Eastern Province |
| `hospital-detail/dhahran.ar.json` | `environment.text.0` | Cambridge Hospital Dhahran is a purpose-built rehabilitation hospital serving as a regional centre for complex rehabilitation in the Eastern |
| `hospital-detail/dhahran.ar.json` | `environment.text.1` | The hospital is equipped to address complex medical and rehabilitation needs, with integrated services underpinned by international accredit |
| `hospital-detail/jeddah.ar.json` | `hero.text` | A leading long-term care & rehabilitation hospital in Western Saudi Arabia |
| `hospital-detail/jeddah.ar.json` | `environment.text.0` | Cambridge Hospital Jeddah is a leading long-term care and rehabilitation hospital in the Western Region of Saudi Arabia, providing specialis |
| `hospital-detail/jeddah.ar.json` | `environment.text.1` | Following its expansion and comprehensive refurbishment, the hospital has further strengthened its position as a regional provider of post-a |
| `hospital-detail/shared.ar.json` | `meta.title` | {name} / Cambridge Hospital |
| `hospital-detail/shared.ar.json` | `meta.description` | {name}: specialised rehabilitation and long-term care. Location, map and how to book an appointment. |
| `hospital-detail/shared.ar.json` | `hero.ariaLabel` | {name} |
| `hospital-detail/shared.ar.json` | `generated.title.0` | Advanced Care  |
| `hospital-detail/shared.ar.json` | `generated.title.1` | in {city} |
| `hospital-detail/shared.ar.json` | `environment.video.poster` | about/video-thumbnail |
| `hospital-detail/shared.ar.json` | `environment.video.playLabel` | Play the video |
| `hospital-detail/shared.ar.json` | `environment.tour.label` | Take a Tour |
| `hospital-detail/shared.ar.json` | `healing.heading` | Designed for Comfort, Recovery and Wellbeing |
| `hospital-detail/shared.ar.json` | `healing.selectLabel` | Choose an area |
| `hospital-detail/shared.ar.json` | `healing.galleryLabel` | Photos of {area} |
| `hospital-detail/shared.ar.json` | `healing.slideLabel` | Photo {n} of {total} |
| `hospital-detail/shared.ar.json` | `healing.showSlide` | Show photo {n} of {total} |
| `hospital-detail/shared.ar.json` | `healing.text.0` | Across Cambridge Hospital’s facilities, thoughtfully designed spaces support patients throughout their care and rehabilitation journey. Our  |
| `hospital-detail/shared.ar.json` | `healing.text.1` | Purpose designed rehabilitation gyms provide dedicated spaces for therapy, movement and functional training, supporting patients as they wor |
| `hospital-detail/shared.ar.json` | `map.ariaLabel` | Find us |
| `hospital-detail/shared.ar.json` | `map.hoursLabel` | Opening hours |
| `hospital-detail/shared.ar.json` | `map.addressLabel` | Address |
| `hospital-detail/shared.ar.json` | `care.listLabel` | Our services |
| `hospital-detail/shared.ar.json` | `doctors.listLabel` | Our doctors |
| `hospital-detail/shared.ar.json` | `pending.note` | Content pending: this hospital page is generated from the hospital data until its text, video and photos are supplied. |
| `hospitals/page.ar.json` | `list.empty` | No hospitals in this region yet. |
| `hospitals/page.ar.json` | `impact.photo.alt` | A nurse with her hand on a smiling patient's shoulder |
| `hospitals/page.ar.json` | `doctors.listLabel` | Our doctors |
| `insurance-providers/page.ar.json` | `filters.countryLabel` | Country |
| `insurance-providers/page.ar.json` | `results.empty` | The list of insurance providers for this country will be available soon. |
| `insurance-providers/page.ar.json` | `results.found` | {n} insurance providers shown |
| `layout/header.ar.json` | `navToggleLabel` | Toggle navigation menu |
| `layout/header.ar.json` | `logo.homeLabel` | Cambridge Hospital home |
| `layout/header.ar.json` | `menuLabel` | Main |
| `layout/header.ar.json` | `lang.en` | EN |
| `layout/header.ar.json` | `lang.ar` | AR |
| `layout/pagination.ar.json` | `scroll.label` | Pages |
| `layout/pagination.ar.json` | `scroll.dot` | Go to page {n} |
| `layout/pagination.ar.json` | `slides.label` | Photos |
| `layout/pagination.ar.json` | `slides.dot` | Go to photo {n} |
| `legal/shared.ar.json` | `meta.title` | {title} / Cambridge Hospital |
| `legal/shared.ar.json` | `meta.description` | {title} of Cambridge Hospital. |
| `legal/shared.ar.json` | `updatedLabel` | Last updated |
| `legal/shared.ar.json` | `pending` | Content pending: the text of this page arrives with the legal documents. |
| `media-hub/page.ar.json` | `explore.select.label` | Browse all categories |
| `media-hub/page.ar.json` | `explore.tiles.0.title` | Pre-Maturity Awareness Day |
| `media-hub/page.ar.json` | `explore.tiles.1.title` | 1st Fujairah ICU Symposium |
| `media-hub/page.ar.json` | `explore.tiles.2.title` | Newborn Brachial Plexus Injuries |
| `media-hub/page.ar.json` | `explore.tiles.3.title` | Lateral Epicondylitis |
| `media-hub/page.ar.json` | `latest.indexLabel` | Latest posts |
| `media-hub/page.ar.json` | `newsletter.ariaLabel` | Newsletter |
| `media-hub/page.ar.json` | `newsletter.emailPlaceholder` | youremail123@gmail.com |
| `not-found/page.ar.json` | `meta.title` | Page not found / Cambridge Hospital |
| `not-found/page.ar.json` | `meta.description` | The page you are looking for does not exist or has moved. |
| `not-found/page.ar.json` | `title` | Page not found |
| `not-found/page.ar.json` | `text` | The page you are looking for does not exist or has moved. These links will take you back to the main sections of the site. |
| `not-found/page.ar.json` | `linksLabel` | Key sections |
| `our-care/page.ar.json` | `specializations.heading` | Our Specializations |
| `our-care/page.ar.json` | `specializations.listLabel` | Our services |
| `our-care/page.ar.json` | `doctors.listLabel` | Our doctors |
| `patient-hub/page.ar.json` | `doctors.listLabel` | Our doctors |
| `patient-testimonials/page.ar.json` | `filters.countryLabel` | Country |
| `patient-testimonials/page.ar.json` | `results.listLabel` | Patient stories |
| `patient-testimonials/page.ar.json` | `results.empty` | Patient stories for this country will be available soon. |
| `patient-testimonials/page.ar.json` | `results.found` | {n} patient stories shown |
| `refer-patient/page.ar.json` | `doctors.listLabel` | Our doctors |
| `who-we-are/page.ar.json` | `meta.description` | A leading provider of specialized rehabilitation and long-term care across the UAE and Saudi Arabia: six hospitals, two countries, one stand |
| `who-we-are/page.ar.json` | `network.photo.alt` | A Cambridge Hospital nurse hugging a smiling young patient |
| `why/page.ar.json` | `meta.description` | A different standard of care: Cambridge Hospital is a specialized post-acute provider in the UAE and KSA, with multidisciplinary professiona |
| `why/page.ar.json` | `specialized.text` | For patients and families, choosing the right care means more than finding a specialist. It means having access to the right expertise, prog |
| `why/page.ar.json` | `team.photo.alt` | The Cambridge Hospital multidisciplinary team |
| `media-hub/page.ar.json` | `latest.seeLess` | See Less (bug 127, 14 Oct 2026: Media Hub grid toggle once expanded; its "See More" reuses the approved عرض المزيد, R053) |


## New strings awaiting client approval (EN + AR)

Not shown on the site yet. They are added by bug 088 (reopened 13 Oct 2026): the Careers "no openings" panel that "View Open Roles" and "Apply Now" open in place
instead of going to Contact. It stays OFF (`src/data/careers.json` → `noOpenings.enabled`) until the client confirms there are no open roles and approves
BOTH languages. Arabic pages show the panel only once its Arabic is filled in; until then they keep the old link.

| File | Key | English (proposed, to approve) | Arabic |
|---|---|---|---|
| `src/data/careers.json` | `noOpenings.text.ar` | There are no vacancies listed at the moment. Send us your details and we'll be in touch. | needed |
| `src/data/careers.json` | `noOpenings.link.label.ar` | Get in Touch (optional link to Contact; leave the Arabic empty to drop the link on Arabic pages) | needed |

## Entity data (fields with `en` but no `ar`)

| File (`src/data/…`) | Field | Missing |
|---|---|---|
| `doctors.json` | `doctors.sub_specialities` | 140 |
| `doctors.json` | `doctors.bio` | 27 |
| `doctors.json` | `doctors.name` | 26 |
| `doctors.json` | `doctors.title` | 15 |
| `doctors.json` | `doctors.home_title` | 1 |
| `specialties.json` | `specialties.name` | 7 |
| `specialties.json` | `specialties.role` | 7 |
| `insurers.json` | `insurers.name` | 28 |

RTL rendering of these English strings is handled in `src/components/forms/forms.css` (punctuation in its place, text kept on
the right); it needs no change when the Arabic arrives.

## Added 30 Oct 2026: article GEO blocks and author page (`article/page.ar.json`, key `geo.*`)

| Key | English shown |
|---|---|
| `geo.writtenBy` | Written by |
| `geo.reviewedBy` | Reviewed by |
| `geo.published` | Published |
| `geo.updated` | Last updated |
| `geo.takeaways` | Key takeaways |
| `geo.faq` | Frequently asked questions |
| `geo.sources` | Sources |
| `geo.author.meta.title` | {name} \| Cambridge Hospital |
| `geo.author.meta.descriptionFallback` | {name}, {role} at Cambridge Hospital. |
| `geo.author.articles` | Articles by {name} |
| `geo.author.none` | No articles yet. |
| `geo.author.linkedin` | LinkedIn profile |
