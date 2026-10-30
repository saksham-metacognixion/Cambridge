# Client changes, 16 Oct 2026 (`Changes.docx`)

Source: the client's `Changes.docx` (Pramod, received 16 Oct 2026; staging links reviewed). Every request in the document is listed below with what was changed, where, how it was checked, and its status. English text was changed exactly as written in the document; Arabic was never translated (structural changes mirrored, approved Arabic strings reused where the document picked an existing line).

QA tooling for this round: `.astro/qc-changes-oct16/` (`check.mjs` = every string below on the rendered page, dev server and `dist/`; `resp.mjs` = horizontal-scroll check at 360/390/768/1024/1280/1440 + section screenshots; `shot.mjs` / `measure.mjs` = Careers and condition-card geometry). `npm test` passes; `astro build` = 1592 pages, no new warnings.

Status: **Done** = implemented and verified on the built pages · **Open** = needs the client / Pramod.

## Home (`/ae/`, same on Global and `/sa`)

| Request | Where | Change | Status |
|---|---|---|---|
| "Expert Doctors, One Collaborative Approach" (comma) | `content/home/doctors.en.json` | Full stop replaced by a comma. | Done |
| Stats: "OPD" -> "outpatient" | `content/home/facilities.en.json` (shared stat `opd`) | "Unique OPD Visits" -> "Unique Outpatient Visits". The Why Cambridge and Our Hospitals stat rows share this entry (`lib/stats.ts`), so all three show the new label. | Done |
| "Get in Touch" (title case, no "with us") | `content/home/contact.en.json` | Title -> "Get in Touch". | Done |

## About Cambridge

| Request | Where | Change | Status |
|---|---|---|---|
| "Personalised Care, Every Step of the Way": "of" on the next line | `content/about/page.en.json`, `components/about/Intro.astro` | Subtitle is now two fixed lines ("Personalised Care, Every Step" / "of the Way"); the component accepts a string or an array of lines. Arabic (one string) unchanged. | Done |

## Who We Are

| Request | Where | Change | Status |
|---|---|---|---|
| "Driven by Excellence" on the next line | `content/who-we-are/page.en.json`, `components/who-we-are/Intro.astro` | Heading = two fixed lines. | Done |
| "over 14 years" | `content/who-we-are/page.en.json` | "fourteen" -> "14". | Done |
| "our 6 purpose-built facilities" | same | "six" -> "6". | Done |
| "...across the UAE and the KSA, as part of..." | same | Comma added. | Done |
| "...enables patients with serious injuries..." | same | "individuals" -> "patients". | Done |

## Why Cambridge Hospital

| Request | Where | Change | Status |
|---|---|---|---|
| "Proven Outcomes, Measurable Results" | `content/why/page.en.json` | First feature title: "Proven Outcomes." -> "Proven Outcomes," (still two lines as drawn). | Done |

## Accreditations

| Request | Status |
|---|---|
| "Still waiting for feedback on JAWDA, I didn't work on this text" | Open: no change requested; JAWDA text waits for the client. |

## Careers

| Request | Where | Change | Status |
|---|---|---|---|
| Section under the hero: the last sentence sits on the white/grey divider | `components/careers/Intro.astro` | The client's three paragraphs are taller than the photo, so the copy ended exactly on the band edge (measured: last line bottom = band top at 1440). The copy column now keeps 41 units (56 px at 1440) above the band. | Done |
| "Alignment in the next two sections needs to be reworked" | `components/careers/Life.astro` | Interpreted as what is visibly wrong at 1440: in "Life at Cambridge Hospital" the two buttons touched the last text line (Figma: an 83-high text box + 1; the client's longer text filled the box). Now a 20-unit gap under the text (the Figma height is kept for a short text: 64 + 20). "What Sets Us Apart" keeps its Figma geometry (tabs x106, panel 27 below the tab top). | Done, interpretation to confirm (CH4) |

## Our Care

| Request | Where | Change | Status |
|---|---|---|---|
| "Continuity of Care": "home healthcare" -> "homecare" | `content/our-care/page.en.json` | Changed in the paragraph. The page's meta description (live SEO text in `seo.json`) still says "home healthcare"; not in the request, left as is (CH6). | Done |
| "Our Specialisations" | same | "Our Specializations" -> "Our Specialisations". | Done |

## Inpatient Care

| Request | Where | Change | Status |
|---|---|---|---|
| Banner: "Comprehensive inpatient care for children and adults, ..." | `content/care/inpatient.en.json` + `care.json` (the Our Care card) | "for adults, adolescents and children" -> "for children and adults". | Done |
| ICU card: "life-threatening" | `care.json` | Hyphen added. | Done |

## Outpatient Care

| Request | Where | Change | Status |
|---|---|---|---|
| Banner: "Comprehensive outpatient rehabilitation for children and adults, ..." | `content/care/outpatient.en.json` + `care.json` | As the inpatient banner. | Done |
| Physical Medicine: "Physician-led" | `care.json` | Hyphen. | Done |
| Paediatric Care: "...affecting movement or function." | `care.json` | "movement, function and daily activities" -> "movement or function". | Done |
| Physiotherapy: "Movement-based" | `care.json` | Hyphen. | Done |
| Occupational Therapy: "self-care" | `care.json` | Hyphen. | Done |

## Homecare

| Request | Where | Change | Status |
|---|---|---|---|
| Banner: "Comprehensive home-based care for children and adults, ..." | `content/care/homecare.en.json`, `homecare.sa.en.json`, `care.json` | Changed on Global/UAE and KSA. | Done |
| Title case: "A True Continuum of Care" | both homecare files | Tab label changed. | Done |
| "Home Physiotherapy", "Newborn Nursing Care", "Medical Examination Care": first-paragraph spacing | both EN files + both AR files | These three tabs opened with a `lead` block (the condition pages' teal line: 22 px line height, no gap before its list); every other tab opens with a plain paragraph. All first paragraphs are now plain paragraphs (same line height and the normal gap before the list). Arabic files carry the same block structure, so they were changed the same way (no text touched). | Done |

## In-School Care

| Request | Where | Change | Status |
|---|---|---|---|
| Overview first line: "in-school" | `content/care/in-school.en.json` | "Our In-School therapy programme" -> "Our in-school therapy programme". | Done |
| "Programme Structure": no title case in the main points | same | "Referral and identification", "Clinical assessment", "Individualised therapy plan", "Therapy delivery" ("Progress monitoring" was already lower case). | Done |
| First-paragraph spacing consistent across all tabs | EN + AR files | Same `lead` -> paragraph fix as Homecare (5 tabs). | Done |

## Our Hospitals

| Request | Where | Change | Status |
|---|---|---|---|
| Hospitals not in a specific order, Al Mudeef last | `src/data/hospitals.json` | Order is now the live site's: Abu Dhabi, Al Ain, Al Mudeef Centre (UAE), then Dhahran, Al Khobar, Jeddah (KSA). The same list feeds the header menu, Home map cards, Contact and doctor filters, so the order is identical everywhere. | Done |
| Updated banner text for all hospital pages (UAE + KSA) "placed in shared drive" | | The shared-drive file is not in the project. Blocked until the text is shared (CH1). | Open |

## Patient Hub

| Request | Where | Change | Status |
|---|---|---|---|
| One description per box (no double descriptions) | `content/patient-hub/page.en.json` | Cards now show exactly the document's lines: "Explore conditions we treat", "Find the right specialist", "Simple referral process", "Care beyond borders", "Trusted insurance partners", "Real patient recovery stories". | Done |
| (Arabic) | `content/patient-hub/page.ar.json` | One line per card as well, using the existing approved Arabic line that matches the kept English one (first line for five cards, the second line for Insurance). "Real patient recovery stories" has no Arabic: the card keeps its approved first line "تجارب المرضى الحقيقية" (Real patient experiences) until the client sends the Arabic (CH2). | Done, CH2 open |

## Conditions & Specialities

| Request | Where | Change | Status |
|---|---|---|---|
| The blue banner on each card makes the card look unbalanced; centre it to the grey box | `components/conditions/ConditionCard.astro` | The navy body of the folder tab (the part under the lip) was 14 px from the left of the grey box and 42 px from the right at 1440. The body is now centred (31 px each side) and the lip's end meets the box edge; the title is centred on the body. This supersedes bug 110's "Figma folder-tab offset kept". Artwork unchanged. | Done |

## Refer a Patient

| Request | Where | Change | Status |
|---|---|---|---|
| "For You, Family or Friends" / "For Corporate/Organisations" (screenshot: the second pill overflowed) | `content/forms/refer.en.json` | Pill labels changed (capital F; "or" -> "/"), screen-reader label of the corporate form updated. Both pills fit at every width. | Done |

## Insurance Providers

| Request | Where | Change | Status |
|---|---|---|---|
| "Alrajhi" -> "Al Rajhi" | `src/data/insurers.json` | "Al Rajhi Takaful" (KSA list). | Done |

## Patient Testimonials

| Request | Where | Change | Status |
|---|---|---|---|
| Banner: "of" on the next line | `content/patient-testimonials/page.en.json` | Title lines "Real Stories" / "of Recovery". | Done |

## Contact Us

| Request | Where | Change | Status |
|---|---|---|---|
| Global banner lists only the UAE number; list both UAE and KSA | `content/contact/page.en.json`, `page.ar.json`, `components/contact/ContactHero.astro` | Global banner shows two click-to-call lines: "800-692273 - UAE" and "9200-13122 - KSA" (labels as on the Home contact card; Arabic labels = the Home card's approved "الإمارات" / "السعودية"). `/ae` keeps the UAE line, `/sa` the KSA line. The details row under the form still shows one number per edition (not in the request, CH5). | Done |

## Speech & Language Therapy (outpatient)

| Request | Where | Change | Status |
|---|---|---|---|
| "Therapies and Techniques": no title case in the bold lead-ins | `content/care/speech-language-therapy.en.json` | "Articulation therapy:", "Language comprehension therapy:", "Oral, swallowing and feeding therapy:". | Done |
| "Supporting Children": "Learning disabilities" | same | Lower case. | Done |

## Cerebral Palsy Programme

| Request | Where | Change | Status |
|---|---|---|---|
| Shorter banner description | `content/care/cerebral-palsy-program.en.json` | Banner text = "A specialised programme for cerebral palsy patients, using the internationally-recognised Kozyavkin Method, introduced for the first time in the GCC at Cambridge Hospital." (The Outpatient page's card keeps its own short description.) | Done |

## Post-Acute Rehabilitation

| Request | Where | Change | Status |
|---|---|---|---|
| Headline: "Rehabilitation" on the next line | `content/care/post-acute-rehab(.ae/.sa).en.json`, `components/care/ConditionCards.astro`, `SubServiceGrid.astro` | "Our Post-Acute" / "Rehabilitation Programmes" as two fixed lines on Global, UAE and KSA. | Done |
| Shorter programme descriptions (4) | `care.json` | Neurorehabilitation, Musculoskeletal, Post-Surgical, Road Traffic Accident = the document's text. | Done |

## Long-Term Care and Rehabilitation

| Request | Where | Change | Status |
|---|---|---|---|
| Overview paragraph 2: "individual" -> "patient" | `content/care/long-term-care-rehab.en.json` | "tailored to the patient". | Done |
| Programme descriptions (4) | `care.json` | Long-Term Care, Long-Term Acute Care, Geriatric Care, Paediatric Long-Term Care = the document's text. The document's Long-Term Acute Care line has no full stop; one was added so all four cards match (CH3). | Done |

## Ventilated Patient Care

| Request | Where | Change | Status |
|---|---|---|---|
| Programme descriptions (2) | `care.json` | Weaning / Long-Term Ventilated Care cards = the document's text. The document calls them "Ventilator Weaning Programme" and "Long-Term Ventilation Programme"; the card titles ("Weaning Programme", "Long-Term Ventilated Care") were not asked to change and are kept (CH3). | Done |

## Paediatric Care (inpatient)

| Request | Where | Change | Status |
|---|---|---|---|
| Programme descriptions (7) | `care.json` | All seven cards = the document's text. | Done |

## ICU and Critical Care

| Request | Where | Change | Status |
|---|---|---|---|
| "critically-ill" in the banner and overview | `content/care/icu-critical-care.en.json` | Hyphen in both. | Done |
| "What is ICU and Critical Care" | same | "&" -> "and". | Done |

## Palliative Care

| Request | Where | Change | Status |
|---|---|---|---|
| "home health care services" -> "homecare services" | `content/care/palliative-care.en.json` | Done in "Care Built Around Changing Needs". | Done |
| "and with you" -> "and with the patient and their family" | same | Done in "Our Multidisciplinary Team". | Done |

## Long-Term Acute Care

| Request | Where | Change | Status |
|---|---|---|---|
| Delete "where possible" (Ventilator Weaning tab) | `content/care/long-term-acute-care.en.json` | Sentence now ends "...breathe independently again." | Done |

## Neurorehabilitation

| Request | Where | Change | Status |
|---|---|---|---|
| Programme descriptions (3) | `care.json` | Stroke, Traumatic Brain Injury, Spinal Cord Injury cards = the document's text. | Done |

## Musculoskeletal Rehabilitation

| Request | Where | Change | Status |
|---|---|---|---|
| "What is Musculoskeletal Rehabilitation?" | `content/care/musculoskeletal-rehabilitation.en.json` | Question mark added. | Done |

## Traumatic Brain Injury Rehabilitation

| Request | Where | Change | Status |
|---|---|---|---|
| Banner headline: "brain" on the next line | `content/care/traumatic-brain-injury-rehabilitation.en.json` | Lines "Traumatic" / "Brain Injury" / "Rehabilitation". | Done |

## Speech and Language Rehabilitation (inpatient)

| Request | Where | Change | Status |
|---|---|---|---|
| "What Is Speech and Language Rehabilitation?" (title case + question mark) | `content/care/speech-language-rehab.en.json` | "language" -> "Language", "?" added. | Done |
| Delete "At Cambridge Hospital" from "Our Approach" | same | Tab label "Our Approach at Cambridge Hospital" -> "Our Approach". | Done |

## Paediatric Neuromuscular Rehabilitation

| Request | Where | Change | Status |
|---|---|---|---|
| "Spasticity Management": bold sub-headlines | `content/care/neuromuscular-rehab.en.json` | "Botulinum toxin injections", "Intrathecal baclofen", "Selective dorsal rhizotomy" are bold lead-ins (`**...**`, rendered as `<b>` by `lib/richtext.ts`). | Done |

## Central Nervous System Anomalies Rehabilitation

| Request | Where | Change | Status |
|---|---|---|---|
| "What Is Central Nervous System Anomalies Rehabilitation?" | `content/care/central-nervous-system.en.json` | Question mark added. | Done |
| "familycented" -> "family-centred" | same | Fixed. | Done |

## Long-Term Cardiac Anomalies Rehabilitation

| Request | Where | Change | Status |
|---|---|---|---|
| "How Our Programme Helps": full stop at the end of each point | `content/care/long-term-cardiac.en.json` | Points 4 and 5 had none; added (1-3 already had one). | Done |

## Open items for the client (CH1-CH6)

| ID | Item | Needs |
|---|---|---|
| CH1 | **Hospital page banner text** (UAE + KSA): "placed in shared drive"; nothing in the project. | The file / text from Pramod. |
| CH2 | **Arabic for "Real patient recovery stories"** (Patient Hub, Testimonials card): the card keeps the approved "تجارب المرضى الحقيقية" until the Arabic line arrives. | Arabic wording. |
| CH3 | **Programme card details**: a full stop was added to the Long-Term Acute Care description (the only one without one in the document); the Ventilated Patient Care card titles stay "Weaning Programme" / "Long-Term Ventilated Care" (the document names them "Ventilator Weaning Programme" / "Long-Term Ventilation Programme" but asks only for the descriptions). | Confirm both. |
| CH4 | **Careers "alignment in the next two sections"**: read as the buttons touching the text in "Life at Cambridge Hospital" (fixed) while "What Sets Us Apart" keeps its Figma geometry. | Confirm, or say what else should move. |
| CH5 | **Contact Us details row** (under the form) on Global still shows the UAE number only; the request named the banner. | Say if the row should also list both. |
| CH6 | **Our Care meta description** (search snippet, from the live site) still says "home healthcare". | Say if SEO text should follow the copy edits. |

Also seen, not in the request (left unchanged): Homecare "Home Physiotherapy" first sentence reads "across in the UAE".
