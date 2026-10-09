// src/data/forms.json
var forms_default = {
  $comment: "ONE config per form, shared by the serverless function (functions/api/forms/[form].ts) and the form UI. Fields are the ones in Figma until Pramod shares his list; apply his list here (name/type/required/max) and the layout follows. `inbox` picks the recipient env variable FORM_TO_<INBOX> (see .env.example), so two UIs of the same scope form (Contact page + pop-up) reach the same inbox. `label` is the English field name used in the email to staff. `ui.group` places a field in the form's Figma layout block; `ui.inputAt` is where the input box starts in its row (Figma px from the label start). `ui.group: hidden` = a hidden input the page fills (Book an Appointment `hospital`: set from the data-hospital of the link that opened the pop-up on a hospital page / Home facility row, shown in the email, never typed by the visitor). `consent` (required checkbox + privacy link) is added to every form by the UI and enforced by the server. Selects with `source` take their options from src/data (specialties / doctors / hospitals). Fields of type `tel` also post `<name>_code` (a code from src/data/dial-codes.json). A form may be a variant of another (`variantOf` + `omitGroups`: the same fields minus whole ui groups), resolved by src/lib/form-config.ts for the UI and the server. Refer a Patient: referral_type / referral_for options are NOT in Figma (empty until Pramod sends them); guardian_mobile is required because Figma marks it 'Mobile*' (flagged: probably only for paediatric cases). International Patients ('international-enquiry', a 5th form beyond the scope's 4, flagged): required = Figma's stars (Gender only, flagged); recipients in env INTERNATIONAL_INBOX (`inboxEnv`); country options = ISO 3166 country names (src/data/countries.json).",
  forms: {
    "book-appointment": {
      subject: "Book an Appointment",
      inbox: "book-appointment",
      fields: [
        {
          name: "specialty",
          label: "Speciality",
          type: "select",
          source: "specialties",
          required: false,
          ui: {
            group: "choose"
          }
        },
        {
          name: "doctor",
          label: "Doctor",
          type: "select",
          source: "doctors",
          required: false,
          ui: {
            group: "choose"
          }
        },
        {
          name: "name",
          label: "Name",
          type: "text",
          required: true,
          max: 120,
          autocomplete: "name",
          ui: {
            group: "details",
            inputAt: 54.99,
            strong: true
          }
        },
        {
          name: "email",
          label: "E-mail",
          type: "email",
          required: false,
          max: 200,
          autocomplete: "email",
          ui: {
            group: "details",
            inputAt: 56.8
          }
        },
        {
          name: "dob",
          label: "Date of birth",
          type: "date",
          required: true,
          autocomplete: "bday",
          ui: {
            group: "details",
            inputAt: 55.9
          }
        },
        {
          name: "mobile",
          label: "Mobile",
          type: "tel",
          required: true,
          max: 20,
          autocomplete: "tel-national",
          ui: {
            group: "details",
            inputAt: 56.8
          }
        },
        {
          name: "gender",
          label: "Gender",
          type: "radio",
          options: [
            "male",
            "female"
          ],
          required: true,
          ui: {
            group: "gender"
          }
        },
        {
          name: "message",
          label: "Other details",
          type: "textarea",
          required: false,
          max: 4e3,
          ui: {
            group: "message"
          }
        },
        {
          name: "hospital",
          label: "Hospital (page)",
          type: "select",
          source: "hospitals",
          required: false,
          ui: {
            group: "hidden"
          }
        }
      ]
    },
    "send-enquiry": {
      subject: "Send an Enquiry",
      inbox: "send-enquiry",
      fields: [
        {
          name: "name",
          label: "Full name",
          type: "text",
          required: true,
          max: 120
        },
        {
          name: "email",
          label: "E-mail",
          type: "email",
          required: true,
          max: 200
        },
        {
          name: "hospital",
          label: "Hospital",
          type: "select",
          source: "hospitals",
          required: true,
          max: 120
        },
        {
          name: "subject",
          label: "Subject",
          type: "text",
          required: true,
          max: 200
        },
        {
          name: "message",
          label: "Message",
          type: "textarea",
          required: true,
          max: 4e3
        }
      ]
    },
    "send-enquiry-popup": {
      subject: "Send an Enquiry",
      inbox: "send-enquiry",
      fields: [
        {
          name: "name",
          label: "Name",
          type: "text",
          required: true,
          max: 120,
          autocomplete: "name",
          ui: {
            group: "details",
            inputAt: 54.99,
            strong: true
          }
        },
        {
          name: "mobile",
          label: "Mobile",
          type: "tel",
          required: true,
          max: 20,
          autocomplete: "tel-national",
          ui: {
            group: "details",
            inputAt: 56.8
          }
        },
        {
          name: "email",
          label: "E-mail",
          type: "email",
          required: true,
          max: 200,
          autocomplete: "email",
          ui: {
            group: "details",
            inputAt: 56.8
          }
        },
        {
          name: "message",
          label: "Message",
          type: "textarea",
          required: false,
          max: 4e3,
          ui: {
            group: "details"
          }
        }
      ]
    },
    "home-contact": {
      subject: "Get in touch with us (Home)",
      inbox: "send-enquiry",
      fields: [
        {
          name: "name",
          label: "Your Name",
          type: "text",
          required: true,
          max: 120,
          autocomplete: "name"
        },
        {
          name: "email",
          label: "Email Address",
          type: "email",
          required: true,
          max: 200,
          autocomplete: "email"
        },
        {
          name: "message",
          label: "Message",
          type: "textarea",
          required: true,
          max: 4e3
        }
      ]
    },
    "refer-patient": {
      subject: "Refer a Patient (doctor referral)",
      inbox: "refer-patient",
      fields: [
        {
          name: "doctor_name",
          label: "Referring doctor: name",
          type: "text",
          required: true,
          max: 120,
          autocomplete: "name",
          ui: {
            group: "doctor"
          }
        },
        {
          name: "doctor_specialty",
          label: "Referring doctor: speciality",
          type: "text",
          required: false,
          max: 120,
          ui: {
            group: "doctor"
          }
        },
        {
          name: "doctor_mobile",
          label: "Referring doctor: mobile",
          type: "tel",
          required: true,
          max: 20,
          autocomplete: "tel-national",
          ui: {
            group: "doctor"
          }
        },
        {
          name: "doctor_email",
          label: "Referring doctor: e-mail",
          type: "email",
          required: false,
          max: 200,
          autocomplete: "email",
          ui: {
            group: "doctor"
          }
        },
        {
          name: "specialty",
          label: "Requested speciality",
          type: "select",
          source: "specialties",
          required: false,
          ui: {
            group: "requested"
          }
        },
        {
          name: "doctor",
          label: "Requested doctor",
          type: "select",
          source: "doctors",
          required: false,
          ui: {
            group: "requested"
          }
        },
        {
          name: "name",
          label: "Patient name",
          type: "text",
          required: true,
          max: 120,
          ui: {
            group: "patient"
          }
        },
        {
          name: "email",
          label: "Patient e-mail",
          type: "email",
          required: false,
          max: 200,
          ui: {
            group: "patient"
          }
        },
        {
          name: "dob",
          label: "Patient date of birth",
          type: "date",
          required: true,
          ui: {
            group: "patient"
          }
        },
        {
          name: "mobile",
          label: "Patient mobile",
          type: "tel",
          required: true,
          max: 20,
          ui: {
            group: "patient"
          }
        },
        {
          name: "gender",
          label: "Patient gender",
          type: "radio",
          options: [
            "male",
            "female"
          ],
          required: true,
          ui: {
            group: "patient"
          }
        },
        {
          name: "eid",
          label: "EID / Passport No",
          type: "text",
          required: false,
          max: 40,
          ui: {
            group: "patient"
          }
        },
        {
          name: "referral_type",
          label: "Referral type",
          type: "select",
          options: [],
          required: false,
          ui: {
            group: "patient"
          }
        },
        {
          name: "referral_for",
          label: "Referral for",
          type: "select",
          options: [],
          required: false,
          ui: {
            group: "patient"
          }
        },
        {
          name: "guardian_name",
          label: "Paediatrics: guardian name",
          type: "text",
          required: false,
          max: 120,
          ui: {
            group: "patient"
          }
        },
        {
          name: "guardian_mobile",
          label: "Paediatrics: guardian mobile",
          type: "tel",
          required: true,
          max: 20,
          ui: {
            group: "patient"
          }
        },
        {
          name: "diagnosis",
          label: "Diagnosis (ICD code if available)",
          type: "textarea",
          required: true,
          max: 4e3,
          ui: {
            group: "info"
          }
        },
        {
          name: "history",
          label: "Brief history",
          type: "textarea",
          required: false,
          max: 4e3,
          ui: {
            group: "info"
          }
        }
      ]
    },
    "refer-patient-other": {
      variantOf: "refer-patient",
      omitGroups: [
        "doctor"
      ],
      subject: "Refer a Patient (other referrer)"
    },
    "international-enquiry": {
      subject: "International Patients: inquiry",
      inbox: "international",
      inboxEnv: "INTERNATIONAL_INBOX",
      fields: [
        {
          name: "name",
          label: "Name",
          type: "text",
          required: false,
          max: 120,
          autocomplete: "name",
          ui: {
            group: "patient"
          }
        },
        {
          name: "email",
          label: "E-mail",
          type: "email",
          required: false,
          max: 200,
          autocomplete: "email",
          ui: {
            group: "patient"
          }
        },
        {
          name: "mobile",
          label: "Mobile",
          type: "tel",
          required: false,
          max: 20,
          autocomplete: "tel-national",
          ui: {
            group: "patient"
          }
        },
        {
          name: "age",
          label: "Age",
          type: "text",
          required: false,
          max: 3,
          ui: {
            group: "patient"
          }
        },
        {
          name: "country",
          label: "Country",
          type: "select",
          source: "countries",
          required: false,
          ui: {
            group: "patient"
          }
        },
        {
          name: "gender",
          label: "Gender",
          type: "radio",
          options: [
            "male",
            "female"
          ],
          required: true,
          ui: {
            group: "patient"
          }
        },
        {
          name: "message",
          label: "Query details",
          type: "textarea",
          required: false,
          max: 4e3,
          ui: {
            group: "message"
          }
        }
      ]
    },
    "feedback-popup": {
      subject: "Your Opinion Matters",
      inbox: "feedback",
      fields: [
        {
          name: "specialty",
          label: "Speciality",
          type: "select",
          source: "specialties",
          required: false,
          ui: {
            group: "choose"
          }
        },
        {
          name: "doctor",
          label: "Doctor",
          type: "select",
          source: "doctors",
          required: false,
          ui: {
            group: "choose"
          }
        },
        {
          name: "name",
          label: "Name",
          type: "text",
          required: true,
          max: 120,
          autocomplete: "name",
          ui: {
            group: "details",
            inputAt: 54.99,
            strong: true
          }
        },
        {
          name: "email",
          label: "E-mail",
          type: "email",
          required: false,
          max: 200,
          autocomplete: "email",
          ui: {
            group: "details",
            inputAt: 56.8
          }
        },
        {
          name: "visit_date",
          label: "Date of visit",
          type: "date",
          required: false,
          ui: {
            group: "details",
            inputAt: 96.69
          }
        },
        {
          name: "mobile",
          label: "Mobile",
          type: "tel",
          required: true,
          max: 20,
          autocomplete: "tel-national",
          ui: {
            group: "details",
            inputAt: 56.8
          }
        },
        {
          name: "overall",
          label: "Overall Experience",
          type: "rating",
          options: [
            "excellent",
            "good",
            "medium",
            "poor"
          ],
          required: false,
          ui: {
            group: "ratings"
          }
        },
        {
          name: "staff",
          label: "Staff Friendliness",
          type: "rating",
          options: [
            "excellent",
            "good",
            "medium",
            "poor"
          ],
          required: false,
          ui: {
            group: "ratings"
          }
        },
        {
          name: "wait",
          label: "Wait Time",
          type: "rating",
          options: [
            "excellent",
            "good",
            "medium",
            "poor"
          ],
          required: false,
          ui: {
            group: "ratings"
          }
        },
        {
          name: "communication",
          label: "Communication",
          type: "rating",
          options: [
            "excellent",
            "good",
            "medium",
            "poor"
          ],
          required: false,
          ui: {
            group: "ratings"
          }
        },
        {
          name: "message",
          label: "Opinion",
          type: "textarea",
          required: false,
          max: 4e3,
          ui: {
            group: "message"
          }
        }
      ]
    },
    feedback: {
      subject: "Patient Feedback",
      inbox: "feedback",
      fields: [
        {
          name: "name",
          label: "Name",
          type: "text",
          required: true,
          max: 120,
          autocomplete: "name",
          ui: {
            group: "contact"
          }
        },
        {
          name: "hospital",
          label: "Hospital",
          type: "select",
          source: "hospitals",
          required: false,
          ui: {
            group: "contact"
          }
        },
        {
          name: "mobile",
          label: "Mobile",
          type: "tel",
          required: true,
          max: 20,
          autocomplete: "tel-national",
          ui: {
            group: "contact"
          }
        },
        {
          name: "email",
          label: "Email",
          type: "email",
          required: false,
          max: 200,
          autocomplete: "email",
          ui: {
            group: "contact"
          }
        },
        {
          name: "recommend",
          label: "How likely to recommend us",
          type: "radio",
          options: [
            "never",
            "not-very-likely",
            "somewhat-likely",
            "likely",
            "very-likely"
          ],
          required: false,
          ui: {
            group: "recommend"
          }
        },
        {
          name: "quality",
          label: "The overall quality of care received",
          type: "rating",
          options: [
            "very-dissatisfied",
            "dissatisfied",
            "neutral",
            "satisfied",
            "very-satisfied"
          ],
          required: false,
          ui: {
            group: "matrix"
          }
        },
        {
          name: "communication",
          label: "Communication & Clarity of information provided",
          type: "rating",
          options: [
            "very-dissatisfied",
            "dissatisfied",
            "neutral",
            "satisfied",
            "very-satisfied"
          ],
          required: false,
          ui: {
            group: "matrix"
          }
        },
        {
          name: "cleanliness",
          label: "Cleanliness & Maintenance of hospital facilities",
          type: "rating",
          options: [
            "very-dissatisfied",
            "dissatisfied",
            "neutral",
            "satisfied",
            "very-satisfied"
          ],
          required: false,
          ui: {
            group: "matrix"
          }
        },
        {
          name: "information",
          label: "Information provided for diagnosis and treatment",
          type: "rating",
          options: [
            "very-dissatisfied",
            "dissatisfied",
            "neutral",
            "satisfied",
            "very-satisfied"
          ],
          required: false,
          ui: {
            group: "matrix"
          }
        },
        {
          name: "admission",
          label: "Efficiency of admission & discharge process",
          type: "rating",
          options: [
            "very-dissatisfied",
            "dissatisfied",
            "neutral",
            "satisfied",
            "very-satisfied"
          ],
          required: false,
          ui: {
            group: "matrix"
          }
        },
        {
          name: "responsiveness",
          label: "Responsiveness of our staff to your needs",
          type: "rating",
          options: [
            "very-dissatisfied",
            "dissatisfied",
            "neutral",
            "satisfied",
            "very-satisfied"
          ],
          required: false,
          ui: {
            group: "matrix"
          }
        },
        {
          name: "message",
          label: "Tell us more",
          type: "textarea",
          required: false,
          max: 4e3,
          ui: {
            group: "message"
          }
        }
      ]
    },
    "refer-patient-corporate": {
      variantOf: "refer-patient",
      omitGroups: [
        "doctor"
      ],
      subject: "Refer a Patient (corporate or organisation referral)"
    }
  }
};

// src/data/specialties.json
var specialties_default = {
  $comment: `Doctor specialties = the live site's doctor_specialty terms that have doctors (WordPress export, 6 Oct 2026, tools/import-wp-cpt.mjs). id = term slug. No Arabic names in the export. role = the line shown under a doctor's name when the doctor has no designation (user request 6 Oct 2026: full role, not the short filter name such as "GP").`,
  specialties: [
    {
      id: "pmr",
      name: {
        en: "PM&R",
        ar: ""
      },
      role: {
        en: "Physical Medicine & Rehab Specialist",
        ar: ""
      }
    },
    {
      id: "internal-medicine",
      name: {
        en: "Internal Medicine",
        ar: ""
      },
      role: {
        en: "Internal Medicine Specialist",
        ar: ""
      }
    },
    {
      id: "pediatric",
      name: {
        en: "Pediatric",
        ar: ""
      },
      role: {
        en: "Pediatrician",
        ar: ""
      }
    },
    {
      id: "gp",
      name: {
        en: "GP",
        ar: ""
      },
      role: {
        en: "General Practitioner",
        ar: ""
      }
    },
    {
      id: "neurology",
      name: {
        en: "Neurology",
        ar: ""
      },
      role: {
        en: "Neuro Specialist",
        ar: ""
      }
    },
    {
      id: "intensive-care",
      name: {
        en: "Intensive Care",
        ar: ""
      },
      role: {
        en: "Intensive Care Specialist",
        ar: ""
      }
    },
    {
      id: "psychiatry",
      name: {
        en: "Psychiatry",
        ar: ""
      },
      role: {
        en: "Psychiatrist",
        ar: ""
      }
    }
  ]
};

// src/data/doctors.json
var doctors_default = {
  $comment: 'Doctors from the live site (WordPress REST export docs/doctor.json, 6 Oct 2026) via tools/import-wp-cpt.mjs; do not edit by hand, re-run the importer. Schema: id (wp-<post id>), slug (WordPress slug), old_url (the live profile URL /<ae|sa>/doctor/<live slug>/ where known: bug 059, from the live Our Care page and condition-page links; kept on re-import; 301 map in src/lib/redirects.ts), name{en,ar}, title{en,ar} (designation; WordPress keeps it in the doctor_designation field, which is not in the export: filled for the 15 Figma doctors only, the card falls back to the specialty name), specialties[] (ids in specialties.json = doctor_specialty term slugs), hospital_id (not in WordPress, empty), country ae|sa ("" = no country in WordPress: Global list only), languages[], bio{en,ar} (HTML), sub_specialities[{en,ar}] (doctor_condition terms), photo (image key under src/assets; Figma photos for the 15 Figma doctors), photo_alt, wp_media (WordPress featured image id, for the image import). DESIGN-ONLY extras from Figma: card_photo, home_photo, home_title, show_book_now.',
  doctors: [
    {
      id: "wp-19833",
      slug: "ahmad-al-khayer",
      old_url: "",
      name: {
        en: "Dr. Ahmad Al Khayer",
        ar: "\u062F. \u0623\u062D\u0645\u062F \u0627\u0644\u062E\u064A\u0631"
      },
      title: {
        en: "Physical Medicine & Rehab Specialist",
        ar: ""
      },
      specialties: [
        "pmr"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Ahmad Al Khayer serves as Chief Executive Officer and Chair of Rehabilitation Medicine at Cambridge Medical & Rehabilitation Center (CMRC) in the United Arab Emirates, bringing more than 25 years of international clinical and healthcare leadership experience across the full continuum of care.</p><p>A Consultant in Physical and Rehabilitation Medicine, Dr. Al Khayer completed his specialty training in the United Kingdom and pursued advanced fellowships in Pain Medicine and Spinal Disorders. He also holds postgraduate master's degrees in Orthopaedic Sciences and Business Administration, reflecting a strong integration of clinical expertise and executive leadership.<br>His professional career spans the UAE, the United Kingdom, Qatar, Saudi Arabia, the Republic of Ireland, and Syria, with a sustained focus on delivering high-quality, patient-centred rehabilitation and long-term care services.</p><p>Throughout his leadership journey, Dr. Al Khayer has guided large-scale transformation initiatives, including service expansion governance development, and implementation of comprehensive quality and safety systems. These efforts have advanced specialised rehabilitation services, strengthened patient experience, and supported sustainable organisational performance.</p><p>As CEO, he provides strategic oversight across CMRC UAE facilities, ensuring clinical excellence, operational performance, and <br>long-term growth while fostering multidisciplinary collaboration aligned with international best practices. He remains committed to delivering compassionate, comprehensive, and outcomes-driven care for patients and their families.</p>",
        ar: "<p>\u0643\u0645\u0633\u062A\u0634\u0627\u0631 \u0641\u064A \u0627\u0644\u0637\u0628 \u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0626\u064A \u0648\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644\u060C \u0623\u0643\u0645\u0644 \u062A\u062F\u0631\u064A\u0628\u0647 \u0627\u0644\u062A\u062E\u0635\u0635\u064A \u0641\u064A \u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0645\u062A\u062D\u062F\u0629 \u0648\u062A\u0627\u0628\u0639 \u0632\u0645\u0627\u0644\u0627\u062A \u0645\u062A\u0642\u062F\u0645\u0629 \u0641\u064A \u0637\u0628 \u0627\u0644\u0623\u0644\u0645 \u0648\u0627\u0636\u0637\u0631\u0627\u0628\u0627\u062A \u0627\u0644\u0639\u0645\u0648\u062F \u0627\u0644\u0641\u0642\u0631\u064A. \u0643\u0645\u0627 \u064A\u062D\u0645\u0644 \u062F\u0631\u062C\u0627\u062A \u0627\u0644\u0645\u0627\u062C\u0633\u062A\u064A\u0631 \u0627\u0644\u0639\u0644\u064A\u0627 \u0641\u064A \u0639\u0644\u0648\u0645 \u0627\u0644\u0639\u0638\u0627\u0645 \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0639\u0645\u0627\u0644\u060C \u0645\u0645\u0627 \u064A\u0639\u0643\u0633 \u062A\u0643\u0627\u0645\u0644\u0627 \u0642\u0648\u064A\u0627 \u0628\u064A\u0646 \u0627\u0644\u062E\u0628\u0631\u0629 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0648\u0627\u0644\u0642\u064A\u0627\u062F\u0629 \u0627\u0644\u062A\u0646\u0641\u064A\u0630\u064A\u0629.</p><p>\u062A\u0645\u062A\u062F \u0645\u0633\u064A\u0631\u062A\u0647 \u0627\u0644\u0645\u0647\u0646\u064A\u0629 \u0639\u0628\u0631 \u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0645\u062A\u062D\u062F\u0629 \u0648\u0642\u0637\u0631 \u0648\u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629 \u0648\u062C\u0645\u0647\u0648\u0631\u064A\u0629 \u0623\u064A\u0631\u0644\u0646\u062F\u0627 \u0648\u0633\u0648\u0631\u064A\u0627\u060C \u0645\u0639 \u062A\u0631\u0643\u064A\u0632 \u0645\u0633\u062A\u0645\u0631 \u0639\u0644\u0649 \u062A\u0642\u062F\u064A\u0645 \u062E\u062F\u0645\u0627\u062A \u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u062C\u0648\u062F\u0629 \u062A\u0631\u0643\u0632 \u0639\u0644\u0649 \u0627\u0644\u0645\u0631\u064A\u0636 \u0648\u062E\u062F\u0645\u0627\u062A \u0631\u0639\u0627\u064A\u0629 \u0637\u0648\u064A\u0644\u0629 \u0627\u0644\u0623\u0645\u062F.</p><p>\u062E\u0644\u0627\u0644 \u0631\u062D\u0644\u062A\u0647 \u0627\u0644\u0642\u064A\u0627\u062F\u064A\u0629\u060C \u0642\u0627\u062F \u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u0627\u0644\u062E\u064A\u0631 \u0645\u0628\u0627\u062F\u0631\u0627\u062A \u062A\u062D\u0648\u0644 \u0648\u0627\u0633\u0639\u0629 \u0627\u0644\u0646\u0637\u0627\u0642\u060C \u0628\u0645\u0627 \u0641\u064A \u0630\u0644\u0643 \u062A\u0648\u0633\u064A\u0639 \u0627\u0644\u062E\u062F\u0645\u0627\u062A\u060C \u0648\u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u062D\u0648\u0643\u0645\u0629\u060C \u0648\u062A\u0646\u0641\u064A\u0630 \u0623\u0646\u0638\u0645\u0629 \u0634\u0627\u0645\u0644\u0629 \u0644\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u0633\u0644\u0627\u0645\u0629. \u0648\u0642\u062F \u0633\u0627\u0647\u0645\u062A \u0647\u0630\u0647 \u0627\u0644\u062C\u0647\u0648\u062F \u0641\u064A \u062A\u0637\u0648\u064A\u0631 \u062E\u062F\u0645\u0627\u062A \u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0645\u062A\u062E\u0635\u0635\u0629\u060C \u0648\u062A\u0639\u0632\u064A\u0632 \u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u0645\u0631\u0636\u0649\u060C \u0648\u062F\u0639\u0645 \u0627\u0644\u0623\u062F\u0627\u0621 \u0627\u0644\u062A\u0646\u0638\u064A\u0645\u064A \u0627\u0644\u0645\u0633\u062A\u062F\u0627\u0645.</p><p>\u0628\u0635\u0641\u062A\u0647 \u0627\u0644\u0631\u0626\u064A\u0633 \u0627\u0644\u062A\u0646\u0641\u064A\u0630\u064A\u060C \u064A\u0642\u062F\u0645 \u0627\u0644\u0625\u0634\u0631\u0627\u0641 \u0627\u0644\u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A \u0639\u0644\u0649 \u0645\u0631\u0627\u0641\u0642 \u0645\u0633\u062A\u0634\u0641\u0649 \u0643\u0627\u0645\u0628\u0631\u064A\u062F\u062C \u0641\u064A \u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0645\u062A\u062D\u062F\u0629\u060C \u0644\u0636\u0645\u0627\u0646 \u0627\u0644\u062A\u0645\u064A\u0632 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u060C \u0648\u0627\u0644\u0623\u062F\u0627\u0621 \u0627\u0644\u062A\u0634\u063A\u064A\u0644\u064A\u060C \u0648\u0627\u0644\u0646\u0645\u0648 \u0637\u0648\u064A\u0644 \u0627\u0644\u0623\u0645\u062F\u060C \u0645\u0639 \u062A\u0639\u0632\u064A\u0632 \u0627\u0644\u062A\u0639\u0627\u0648\u0646 \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0628\u0645\u0627 \u064A\u062A\u0645\u0627\u0634\u0649 \u0645\u0639 \u0623\u0641\u0636\u0644 \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0627\u062A \u0627\u0644\u062F\u0648\u0644\u064A\u0629. \u064A\u0638\u0644 \u0645\u0644\u062A\u0632\u0645\u0627 \u0628\u062A\u0642\u062F\u064A\u0645 \u0631\u0639\u0627\u064A\u0629 \u0645\u062A\u0639\u0627\u0637\u0641\u0629 \u0648\u0634\u0627\u0645\u0644\u0629 \u0648\u0645\u0648\u062C\u0647\u0629 \u0646\u062D\u0648 \u0627\u0644\u0646\u062A\u0627\u0626\u062C \u0644\u0644\u0645\u0631\u0636\u0649 \u0648\u0639\u0627\u0626\u0644\u0627\u062A\u0647\u0645.</p>"
      },
      sub_specialities: [
        {
          en: "Physical Rehabilitation",
          ar: ""
        },
        {
          en: "Spinal Cord Injury Care",
          ar: ""
        },
        {
          en: "Brain Injury Rehabilitation",
          ar: ""
        },
        {
          en: "Sports Injury Treatment",
          ar: ""
        },
        {
          en: "EMG & Nerve Studies",
          ar: ""
        },
        {
          en: "Pain Management",
          ar: ""
        },
        {
          en: "Acupuncture Therapy",
          ar: ""
        }
      ],
      photo: "doctors/dr-ahmad",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 20041,
      card_photo: {
        w: 134.879,
        h: 153.118,
        dx: -0.6
      },
      home_photo: "doctors/dr-ahmad",
      show_book_now: true
    },
    {
      id: "wp-19638",
      slug: "wael-sary",
      old_url: "",
      name: {
        en: "Dr. Wael Sary",
        ar: "\u062F. \u0648\u0627\u0626\u0644 \u0633\u0627\u0631\u064A"
      },
      title: {
        en: "ICU & Anesthesia Specialist",
        ar: ""
      },
      specialties: [
        "internal-medicine"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Wael Mohamed Mokhtar Sary is the Facility Medical Director for Abu Dhabi and a Specialist Anesthesia and ICU at Cambridge Hospital. He has an experience of over 18 years as a healthcare professional.</p>\n<p>He has previously worked in various hospitals in Kuwait, Egypt, and the UAE. He has a bachelor\u2019s degree in Medicine, a master\u2019s degree in anesthesia. He is also a member of the Royal College of Emergency Medicine.</p>\n<p>He is experienced in: \u2013 Ventilator management including experience with various modes and continuous positive airway pressure therapies ( BiPAP and CPAP ) \u2013 Management of thrombolytic therapy \u2013 Wound care including simple superficial debridement, suture and general care for wounds and general care for wounds including the performance of topical or field infiltration of anesthetic solution.</p>",
        ar: "<p>\u064A\u0642\u062F\u0645 \u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u0648\u0627\u0626\u0644 \u0633\u0627\u0631\u064A \u0631\u0639\u0627\u064A\u0629 \u0645\u062A\u062E\u0635\u0635\u0629 \u0641\u064A \u0627\u0644\u062A\u062E\u062F\u064A\u0631 \u0648\u0627\u0644\u0639\u0646\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629\u060C \u0628\u0645\u0627 \u0641\u064A \u0630\u0644\u0643 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u0645\u0631\u0636\u0649 \u0641\u064A \u062D\u0627\u0644\u0629 \u062D\u0631\u062C\u0629 \u0648\u0627\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u0630\u064A\u0646 \u062A\u0645 \u062A\u0646\u0641\u0633\u0647\u0645\u060C \u0648\u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062A\u062D\u0636\u064A\u0631\u064A\u0629 \u062D\u0648\u0644 \u0627\u0644\u0639\u0645\u0644\u064A\u0627\u062A\u060C \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0644\u0645.</p><p>\u0628\u0635\u0641\u062A\u0647 \u0627\u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0637\u0628\u064A \u0644\u0644\u0645\u0646\u0634\u0623\u0629\u060C \u064A\u0634\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0639\u0645\u0644\u064A\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629\u060C \u0648\u064A\u0636\u0645\u0646 \u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0648\u0627\u0644\u0627\u0645\u062A\u062B\u0627\u0644 \u0644\u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629\u060C \u0648\u064A\u0642\u0648\u062F \u0641\u0631\u0642\u0627 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0644\u062A\u0642\u062F\u064A\u0645 \u0631\u0639\u0627\u064A\u0629 \u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u062C\u0648\u062F\u0629 \u0642\u0627\u0626\u0645\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u062F\u0644\u0629.</p>"
      },
      sub_specialities: [],
      photo: "doctors/list/wael-sary",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 626,
      card_photo: {
        size: 167.351,
        dx: 0.6
      },
      home_photo: "doctors/dr-wael"
    },
    {
      id: "wp-19639",
      slug: "suhaila-kallada",
      old_url: "",
      name: {
        en: "Dr. Suhaila Kallada",
        ar: "\u062F. \u0633\u0647\u064A\u0644\u0629 \u0643\u0627\u0644\u0627\u062F\u0627"
      },
      title: {
        en: "Physical Medicine & Rehab Specialist",
        ar: ""
      },
      specialties: [
        "pmr"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Suhaila Kallada provides specialist rehabilitation care focusing on the assessment, diagnosis, and management of neurological, musculoskeletal, and orthopaedic conditions. Her scope includes rehabilitation of spinal cord and brain injuries, chronic pain management, and functional recovery programs.</p><p>She performs interventional procedures such as joint and soft tissue injections, nerve blocks, and Botox therapy, while coordinating multidisciplinary care to optimize patient outcomes and improve functional independence in both inpatient and outpatient settings.</p>",
        ar: "<p>\u062A\u0642\u062F\u0645 \u0627\u0644\u062F\u0643\u062A\u0648\u0631\u0629 \u0633\u0647\u064A\u0644\u0629 \u0643\u0644\u0627\u062F\u0629 \u0631\u0639\u0627\u064A\u0629 \u062A\u0623\u0647\u064A\u0644\u064A\u0629 \u0645\u062A\u062E\u0635\u0635\u0629 \u062A\u0631\u0643\u0632 \u0639\u0644\u0649 \u062A\u0642\u064A\u064A\u0645 \u0648\u062A\u0634\u062E\u064A\u0635 \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0639\u0635\u0628\u064A\u0629 \u0648\u0627\u0644\u0639\u0636\u0644\u064A\u0629 \u0627\u0644\u0647\u064A\u0643\u0644\u064A\u0629 \u0648\u0627\u0644\u0639\u0638\u0627\u0645\u064A\u0629. \u064A\u0634\u0645\u0644 \u0646\u0637\u0627\u0642 \u0639\u0645\u0644\u0647\u0627 \u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062D\u0628\u0644 \u0627\u0644\u0634\u0648\u0643\u064A \u0648\u0627\u0644\u062F\u0645\u0627\u063A\u060C \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0644\u0645 \u0627\u0644\u0645\u0632\u0645\u0646\u060C \u0648\u0628\u0631\u0627\u0645\u062C \u0627\u0644\u062A\u0639\u0627\u0641\u064A \u0627\u0644\u0648\u0638\u064A\u0641\u064A.</p><p>\u062A\u062C\u0631\u064A \u0625\u062C\u0631\u0627\u0621\u0627\u062A \u062A\u062F\u062E\u0644\u064A\u0629 \u0645\u062B\u0644 \u062D\u0642\u0646 \u0627\u0644\u0645\u0641\u0627\u0635\u0644 \u0648\u0627\u0644\u0623\u0646\u0633\u062C\u0629 \u0627\u0644\u0631\u062E\u0648\u0629\u060C \u0648\u062D\u0642\u0646 \u0627\u0644\u0623\u0639\u0635\u0627\u0628\u060C \u0648\u0639\u0644\u0627\u062C \u0627\u0644\u0628\u0648\u062A\u0648\u0643\u0633\u060C \u0645\u0639 \u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0644\u062A\u062D\u0633\u064A\u0646 \u0646\u062A\u0627\u0626\u062C \u0627\u0644\u0645\u0631\u0636\u0649 \u0648\u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u0627\u0633\u062A\u0642\u0644\u0627\u0644\u064A\u0629 \u0627\u0644\u0648\u0638\u064A\u0641\u064A\u0629 \u0641\u064A \u0643\u0644 \u0645\u0646 \u0627\u0644\u0628\u064A\u0626\u0627\u062A \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629 \u0648\u0627\u0644\u062E\u0627\u0631\u062C\u064A\u0629.</p>"
      },
      sub_specialities: [],
      photo: "doctors/list/suhaila-kallada",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19687,
      card_photo: {
        size: 169.676,
        dx: 2.9
      },
      home_photo: "doctors/dr-suhaila"
    },
    {
      id: "wp-19647",
      slug: "rober-kassab",
      old_url: "",
      name: {
        en: "Dr. Rober Kassab",
        ar: "\u062F. \u0631\u0648\u0628\u0631 \u0643\u0633\u0627\u0628"
      },
      title: {
        en: "Physical Medicine & Rehab Specialist",
        ar: ""
      },
      specialties: [
        "pmr"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Rober Hanna Kassab delivers specialized rehabilitation services with a focus on restoring functional ability and improving quality of life for patients with physical impairments. His scope includes comprehensive rehabilitation planning, management of neurological and musculoskeletal disorders, and supervision of individualized therapy programs.</p><p>He contributes to multidisciplinary care by guiding rehabilitation interventions, supporting long-term recovery goals, and ensuring adherence to clinical standards, while integrating evidence-based practices within inpatient and outpatient rehabilitation pathways.</p>",
        ar: "<p>\u064A\u0642\u062F\u0645 \u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u0631\u0648\u0628\u0631 \u0647\u0627\u0646\u0627 \u0643\u0633\u0627\u0628 \u062E\u062F\u0645\u0627\u062A \u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0645\u062A\u062E\u0635\u0635\u0629 \u0645\u0639 \u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0639\u0644\u0649 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u0642\u062F\u0631\u0629 \u0627\u0644\u0648\u0638\u064A\u0641\u064A\u0629 \u0648\u062A\u062D\u0633\u064A\u0646 \u062C\u0648\u062F\u0629 \u0627\u0644\u062D\u064A\u0627\u0629 \u0644\u0644\u0645\u0631\u0636\u0649 \u0630\u0648\u064A \u0627\u0644\u0625\u0639\u0627\u0642\u0627\u062A \u0627\u0644\u062C\u0633\u062F\u064A\u0629. \u064A\u0634\u0645\u0644 \u0646\u0637\u0627\u0642 \u0639\u0645\u0644\u0647 \u062A\u062E\u0637\u064A\u0637\u0627 \u0634\u0627\u0645\u0644\u0627 \u0644\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644\u060C \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0627\u0636\u0637\u0631\u0627\u0628\u0627\u062A \u0627\u0644\u0639\u0635\u0628\u064A\u0629 \u0648\u0627\u0644\u0639\u0636\u0644\u064A\u0629 \u0627\u0644\u0647\u064A\u0643\u0644\u064A\u0629\u060C \u0648\u0627\u0644\u0625\u0634\u0631\u0627\u0641 \u0639\u0644\u0649 \u0628\u0631\u0627\u0645\u062C \u0627\u0644\u0639\u0644\u0627\u062C \u0627\u0644\u0641\u0631\u062F\u064A\u0629.</p><p>\u064A\u0633\u0627\u0647\u0645 \u0641\u064A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0645\u0646 \u062E\u0644\u0627\u0644 \u062A\u0648\u062C\u064A\u0647 \u062A\u062F\u062E\u0644\u0627\u062A \u0627\u0644\u062A\u0623\u0647\u064A\u0644\u060C \u0648\u062F\u0639\u0645 \u0623\u0647\u062F\u0627\u0641 \u0627\u0644\u062A\u0639\u0627\u0641\u064A \u0637\u0648\u064A\u0644\u0629 \u0627\u0644\u0623\u0645\u062F\u060C \u0648\u0636\u0645\u0627\u0646 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0627\u0644\u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629\u060C \u0645\u0639 \u062F\u0645\u062C \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0627\u062A \u0627\u0644\u0645\u0628\u0646\u064A\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u062F\u0644\u0629 \u0636\u0645\u0646 \u0645\u0633\u0627\u0631\u0627\u062A \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629 \u0648\u0627\u0644\u062E\u0627\u0631\u062C\u064A\u0629.</p>"
      },
      sub_specialities: [],
      photo: "doctors/list/rober-hanna-kassab",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19661,
      card_photo: {
        size: 174.324,
        dx: 4.1
      },
      home_photo: "doctors/dr-rober"
    },
    {
      id: "wp-19644",
      slug: "elsanosi-habour",
      old_url: "",
      name: {
        en: "Dr. Elsanosi Habour",
        ar: "\u062F. \u0625\u0644\u0633\u0627\u0646\u0648\u0633\u064A \u062D\u0628\u0648\u0631"
      },
      title: {
        en: "Pediatrician",
        ar: ""
      },
      specialties: [
        "pediatric"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Elsanosi Ali Babiker Ali Habour provides specialized pediatric care across inpatient and outpatient settings, focusing on the comprehensive evaluation and management of neonatal, infant, and childhood conditions.</p><p>His scope includes diagnosis, treatment planning, and ongoing monitoring of pediatric patients, addressing both acute illnesses and chronic conditions while ensuring appropriate growth and developmental follow-up. He coordinates with multidisciplinary teams to deliver holistic, evidence-based care and ensures adherence to clinical guidelines, safety standards, and best practices in pediatrics.</p>",
        ar: "<p>\u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u0627\u0644\u0633\u0646\u0648\u0633\u064A \u0639\u0644\u064A \u0628\u0627\u0628\u0643\u0631 \u0639\u0644\u064A \u062D\u0628\u0648\u0631 \u064A\u0642\u062F\u0645 \u0631\u0639\u0627\u064A\u0629 \u0645\u062A\u062E\u0635\u0635\u0629 \u0644\u0644\u0623\u0637\u0641\u0627\u0644 \u0639\u0628\u0631 \u0627\u0644\u0628\u064A\u0626\u0627\u062A \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629 \u0648\u0627\u0644\u062E\u0627\u0631\u062C\u064A\u0629\u060C \u0645\u0639 \u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0639\u0644\u0649 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0648\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0634\u0627\u0645\u0644\u0629 \u0644\u062D\u0627\u0644\u0627\u062A \u062D\u062F\u064A\u062B\u064A \u0627\u0644\u0648\u0644\u0627\u062F\u0629 \u0648\u0627\u0644\u0631\u0636\u0639 \u0648\u0627\u0644\u0623\u0637\u0641\u0627\u0644.</p><p>\u064A\u0634\u0645\u0644 \u0646\u0637\u0627\u0642 \u0639\u0645\u0644\u0647 \u0627\u0644\u062A\u0634\u062E\u064A\u0635\u060C \u0648\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0639\u0644\u0627\u062C\u060C \u0648\u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u0645\u0633\u062A\u0645\u0631\u0629 \u0644\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u0623\u0637\u0641\u0627\u0644\u060C \u0645\u0639 \u0645\u0639\u0627\u0644\u062C\u0629 \u0627\u0644\u0623\u0645\u0631\u0627\u0636 \u0627\u0644\u062D\u0627\u062F\u0629 \u0648\u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0645\u0632\u0645\u0646\u0629 \u0645\u0639 \u0636\u0645\u0627\u0646 \u0627\u0644\u0646\u0645\u0648 \u0648\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0644\u0646\u0645\u0648. \u064A\u0646\u0633\u0642 \u0645\u0639 \u0641\u0631\u0642 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0644\u062A\u0642\u062F\u064A\u0645 \u0631\u0639\u0627\u064A\u0629 \u0634\u0627\u0645\u0644\u0629 \u0642\u0627\u0626\u0645\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u062F\u0644\u0629 \u0648\u064A\u0636\u0645\u0646 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0627\u0644\u0625\u0631\u0634\u0627\u062F\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0648\u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u0633\u0644\u0627\u0645\u0629 \u0648\u0623\u0641\u0636\u0644 \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0627\u062A \u0641\u064A \u0637\u0628 \u0627\u0644\u0623\u0637\u0641\u0627\u0644.</p>"
      },
      sub_specialities: [],
      photo: "doctors/list/elsanosi-ali-babiker",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19663,
      card_photo: {
        size: 169,
        dx: 0
      }
    },
    {
      id: "wp-19645",
      slug: "amjad-abdel-qader",
      old_url: "",
      name: {
        en: "Dr. Amjad Abdel Qader",
        ar: "\u062F. \u0623\u0645\u062C\u062F \u0639\u0628\u062F \u0627\u0644\u0642\u0627\u062F\u0631"
      },
      title: {
        en: "General Practitioner",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Amjad Abdel Qader provides inpatient medical services focused on the comprehensive management of admitted patients. His scope includes clinical assessment, development of treatment plans, and regular review of patient progress to ensure optimal recovery.</p><p>He supports the management of acute conditions, coordinates care with senior physicians and allied health teams, and ensures adherence to established clinical pathways, documentation standards, and patient safety protocols within the inpatient setting.</p>",
        ar: "<p>\u064A\u0642\u062F\u0645 \u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u0623\u0645\u062C\u062F \u0639\u0628\u062F \u0627\u0644\u0642\u0627\u062F\u0631 \u062E\u062F\u0645\u0627\u062A \u0637\u0628\u064A\u0629 \u062F\u0627\u062E\u0644\u064A\u0629 \u062A\u0631\u0643\u0632 \u0639\u0644\u0649 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0634\u0627\u0645\u0644\u0629 \u0644\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u0645\u0642\u0628\u0648\u0644\u064A\u0646. \u064A\u0634\u0645\u0644 \u0646\u0637\u0627\u0642 \u0639\u0645\u0644\u0647 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u060C \u0648\u062A\u0637\u0648\u064A\u0631 \u062E\u0637\u0637 \u0627\u0644\u0639\u0644\u0627\u062C\u060C \u0648\u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u062F\u0648\u0631\u064A\u0629 \u0644\u062A\u0642\u062F\u0645 \u0627\u0644\u0645\u0631\u0636\u0649 \u0644\u0636\u0645\u0627\u0646 \u0627\u0644\u062A\u0639\u0627\u0641\u064A \u0627\u0644\u0623\u0645\u062B\u0644.</p><p>\u064A\u062F\u0639\u0645 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u062D\u0627\u062F\u0629\u060C \u0648\u064A\u0646\u0633\u0642 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0645\u0639 \u0627\u0644\u0623\u0637\u0628\u0627\u0621 \u0627\u0644\u0643\u0628\u0627\u0631 \u0648\u0641\u0631\u0642 \u0627\u0644\u0635\u062D\u0629 \u0627\u0644\u0645\u0633\u0627\u0639\u062F\u0629\u060C \u0648\u064A\u0636\u0645\u0646 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629\u060C \u0648\u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u062A\u0648\u062B\u064A\u0642\u060C \u0648\u0628\u0631\u0648\u062A\u0648\u0643\u0648\u0644\u0627\u062A \u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u062F\u0627\u062E\u0644 \u0628\u064A\u0626\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629.</p>"
      },
      sub_specialities: [],
      photo: "doctors/list/amjad-abdelqader",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19685,
      card_photo: {
        size: 167.351,
        dx: -1.7
      },
      home_photo: "doctors/dr-amjed",
      home_title: {
        en: "General Physician",
        ar: ""
      }
    },
    {
      id: "wp-19637",
      slug: "sheema-jeelani",
      old_url: "",
      name: {
        en: "Dr. Sheema Jeelani",
        ar: "\u062F. \u0634\u064A\u0645\u0627 \u062C\u064A\u0644\u0627\u0646\u064A"
      },
      title: {
        en: "General Practitioner",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Sheema Jeelani, working as a General Practitioner at Cambridge Hospital since May 2017, is responsible for providing comprehensive inpatient (IP) medical care.</p><p>Her scope includes assessment, diagnosis, and management of admitted patients with acute and chronic medical conditions. She is involved in daily patient monitoring, treatment planning, coordination with multidisciplinary teams, and timely referral to specialists when required.</p><p>Additionally, she provides basic emergency care, supports continuity of care, and ensures adherence to clinical protocols and patient safety standards.</p>",
        ar: "<p>\u0627\u0644\u062F\u0643\u062A\u0648\u0631\u0629 \u0634\u064A\u0645\u0627 \u062C\u064A\u0644\u0627\u0646\u064A\u060C \u0627\u0644\u062A\u064A \u062A\u0639\u0645\u0644 \u0643\u0637\u0628\u064A\u0628\u0629 \u0639\u0627\u0645\u0629 \u0641\u064A \u0645\u0633\u062A\u0634\u0641\u0649 \u0643\u0627\u0645\u0628\u0631\u064A\u062F\u062C \u0645\u0646\u0630 \u0645\u0627\u064A\u0648 2017\u060C \u0645\u0633\u0624\u0648\u0644\u0629 \u0639\u0646 \u062A\u0642\u062F\u064A\u0645 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0634\u0627\u0645\u0644\u0629 \u0644\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u064A\u0646 (IP). \u064A\u0634\u0645\u0644 \u0646\u0637\u0627\u0642 \u0639\u0645\u0644\u0647\u0627 \u062A\u0642\u064A\u064A\u0645 \u0648\u062A\u0634\u062E\u064A\u0635 \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u0645\u0642\u0628\u0648\u0644\u064A\u0646 \u0627\u0644\u0630\u064A\u0646 \u064A\u0639\u0627\u0646\u0648\u0646 \u0645\u0646 \u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u062D\u0627\u062F\u0629 \u0648\u0627\u0644\u0645\u0632\u0645\u0646\u0629. \u062A\u0634\u0627\u0631\u0643 \u0641\u064A \u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u064A\u0648\u0645\u064A\u0629\u060C \u0648\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0639\u0644\u0627\u062C\u060C \u0648\u0627\u0644\u062A\u0646\u0633\u064A\u0642 \u0645\u0639 \u0627\u0644\u0641\u0631\u0642 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A\u060C \u0648\u0627\u0644\u0625\u062D\u0627\u0644\u0629 \u0641\u064A \u0627\u0644\u0648\u0642\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0644\u0644\u0623\u062E\u0635\u0627\u0626\u064A\u064A\u0646 \u0639\u0646\u062F \u0627\u0644\u062D\u0627\u062C\u0629. \u0628\u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0630\u0644\u0643\u060C \u062A\u0642\u062F\u0645 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0637\u0627\u0631\u0626\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629\u060C \u0648\u062A\u062F\u0639\u0645 \u0627\u0633\u062A\u0645\u0631\u0627\u0631\u064A\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629\u060C \u0648\u062A\u0636\u0645\u0646 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0627\u0644\u0628\u0631\u0648\u062A\u0648\u0643\u0648\u0644\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0648\u0645\u0639\u0627\u064A\u064A\u0631 \u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u0636\u0649.</p>"
      },
      sub_specialities: [],
      photo: "doctors/list/sheema-jeelani",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19682,
      card_photo: {
        size: 169,
        dx: -6
      }
    },
    {
      id: "wp-18747",
      slug: "sami-alamin",
      old_url: "https://cambridgehospital.com/ae/doctor/sami-alamin/",
      name: {
        en: "Dr. Sami Alamin",
        ar: "\u062F. \u0633\u0627\u0645\u064A \u0639\u0627\u0644\u0645\u064A\u0646"
      },
      title: {
        en: "Internal medicine specialist",
        ar: ""
      },
      specialties: [
        "internal-medicine"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Sami Ali Alamin is an Internal Medicine Specialist in Abu Dhabi with 15+ years\u2019 experience in critical care, rehabilitation, renal medicine, and complex patient management.</p>",
        ar: "<p>\u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u0633\u0627\u0645\u064A \u0639\u0644\u064A \u0647\u062F\u0627\u0628\u0627\u064A \u0639\u0627\u0644\u0645\u064A\u0646 \u0647\u0648 \u0623\u062E\u0635\u0627\u0626\u064A \u0637\u0628 \u0627\u0644\u0628\u0627\u0637\u0646\u064A \u0641\u064A \u0645\u0631\u0643\u0632 \u0643\u0627\u0645\u0628\u0631\u064A\u062F\u062C \u0627\u0644\u0637\u0628\u064A \u0648\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644 (CMRC)\u060C \u0623\u0628\u0648\u0638\u0628\u064A\u060C \u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0645\u062A\u062D\u062F\u0629\u060C \u0648\u0644\u062F\u064A\u0647 \u0623\u0643\u062B\u0631 \u0645\u0646 15 \u0639\u0627\u0645\u0627 \u0645\u0646 \u0627\u0644\u062E\u0628\u0631\u0629 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0641\u064A \u0627\u0644\u0637\u0628 \u0627\u0644\u0628\u0627\u0637\u0646\u064A\u060C \u0648\u0627\u0644\u0639\u0646\u0627\u064A\u0629 \u0627\u0644\u062D\u0631\u062C\u0629\u060C \u0648\u0637\u0628 \u0627\u0644\u0637\u0648\u0627\u0631\u0626\u060C \u0648\u0637\u0628 \u0627\u0644\u0643\u0644\u0649\u060C \u0648\u0637\u0628 \u0627\u0644\u062A\u0623\u0647\u064A\u0644.</p><p>\u064A\u0639\u0631\u0641 \u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u0633\u0627\u0645\u064A \u0628\u062E\u0628\u0631\u062A\u0647 \u0627\u0644\u0648\u0627\u0633\u0639\u0629 \u0641\u064A \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u062D\u0631\u062C\u064A\u0646 \u0648\u0627\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u0645\u0639\u0642\u062F\u064A\u0646 \u0637\u0628\u064A\u0627 \u0627\u0644\u0630\u064A\u0646 \u064A\u062D\u062A\u0627\u062C\u0648\u0646 \u0625\u0644\u0649 \u0631\u0639\u0627\u064A\u0629 \u0637\u0628\u064A\u0629 \u0645\u062A\u0642\u062F\u0645\u0629 \u0648\u062A\u0646\u0633\u064A\u0642 \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A. \u062A\u0645\u062A\u062F \u0645\u0645\u0627\u0631\u0633\u062A\u0647 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0639\u0628\u0631 \u0643\u0627\u0645\u0644 \u0646\u0637\u0627\u0642 \u0627\u0644\u0631\u0639\u0627\u064A\u0629\u060C \u0648\u062A\u0634\u0645\u0644 \u0627\u0644\u0627\u0633\u062A\u0634\u0641\u0627\u0621 \u0627\u0644\u062D\u0627\u062F\u060C \u0648\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644\u060C \u0648\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0637\u0648\u064A\u0644\u0629 \u0627\u0644\u0623\u0645\u062F \u0644\u062D\u0627\u0644\u0627\u062A \u0645\u062B\u0644 \u0642\u0635\u0648\u0631 \u0627\u0644\u062C\u0647\u0627\u0632 \u0627\u0644\u062A\u0646\u0641\u0633\u064A\u060C \u062A\u0639\u0641\u0646 \u0627\u0644\u062F\u0645 \u0648\u0627\u0644\u0635\u062F\u0645\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u0646\u064A\u0629\u060C \u0648\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0637\u0648\u0627\u0631\u0626 \u0627\u0644\u0642\u0644\u0628\u064A\u0629\u060C \u0648\u0623\u0645\u0631\u0627\u0636 \u0627\u0644\u0643\u0644\u0649\u060C \u0648\u0627\u0644\u0627\u0636\u0637\u0631\u0627\u0628\u0627\u062A \u0627\u0644\u0639\u0635\u0628\u064A\u0629\u060C \u0648\u0627\u0644\u0633\u0643\u062A\u0629 \u0627\u0644\u062F\u0645\u0627\u063A\u064A\u0629\u060C \u0648\u0627\u0644\u0633\u0643\u0631\u064A\u060C \u0648\u0627\u0631\u062A\u0641\u0627\u0639 \u0636\u063A\u0637 \u0627\u0644\u062F\u0645\u060C \u0648\u0641\u0634\u0644 \u0627\u0644\u0623\u0639\u0636\u0627\u0621 \u0627\u0644\u0645\u062A\u0639\u062F\u062F\u0629.</p><p>\u064A\u0645\u062A\u0644\u0643 \u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u0633\u0627\u0645\u064A \u062E\u0628\u0631\u0629 \u0643\u0628\u064A\u0631\u0629 \u0641\u064A \u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u0630\u064A\u0646 \u064A\u062D\u062A\u0627\u062C\u0648\u0646 \u0625\u0644\u0649 \u062A\u0647\u0648\u064A\u0629 \u0645\u064A\u0643\u0627\u0646\u064A\u0643\u064A\u0629 \u0637\u0648\u064A\u0644\u0629 \u0627\u0644\u0623\u0645\u062F\u060C \u0648\u062F\u0639\u0645 \u062A\u0646\u0641\u0633\u064A \u0645\u062A\u0642\u062F\u0645\u060C \u0648\u0645\u0631\u0627\u0642\u0628\u0629 \u0637\u0628\u064A\u0629 \u0645\u0643\u062B\u0641\u0629\u060C \u0648\u0628\u0631\u0627\u0645\u062C \u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A. \u0644\u062F\u064A\u0647 \u0627\u0647\u062A\u0645\u0627\u0645 \u062E\u0627\u0635 \u0628\u0637\u0628 \u0627\u0644\u0645\u0633\u0646\u064A\u0646\u060C \u0648\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0631\u0626\u0648\u064A\u060C \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0639\u0644\u0649 \u0627\u0644\u0645\u062F\u0649 \u0627\u0644\u0637\u0648\u064A\u0644\u060C \u0648\u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0641\u0631\u062F\u064A \u0644\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062A\u064A \u062A\u0647\u062F\u0641 \u0625\u0644\u0649 \u062A\u0639\u0638\u064A\u0645 \u0627\u0644\u062A\u0639\u0627\u0641\u064A\u060C \u0648\u0627\u0644\u0627\u0633\u062A\u0642\u0644\u0627\u0644\u064A\u0629 \u0627\u0644\u0648\u0638\u064A\u0641\u064A\u0629\u060C \u0648\u062C\u0648\u062F\u0629 \u0627\u0644\u062D\u064A\u0627\u0629.</p><p>\u0639\u0644\u0649 \u0645\u062F\u0627\u0631 \u0645\u0633\u064A\u0631\u062A\u0647 \u0627\u0644\u0645\u0647\u0646\u064A\u0629\u060C \u0637\u0648\u0631 \u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u0633\u0627\u0645\u064A \u0645\u0647\u0627\u0631\u0627\u062A \u0625\u062C\u0631\u0627\u0626\u064A\u0629 \u0645\u062A\u0642\u062F\u0645\u0629\u060C \u0628\u0645\u0627 \u0641\u064A \u0630\u0644\u0643 \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0642\u0633\u0637\u0631\u0629 \u0627\u0644\u0648\u0631\u064A\u062F\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u064A\u0629\u060C \u0648\u0627\u0644\u062A\u0646\u0628\u064A\u0628 \u0641\u064A \u0627\u0644\u0642\u0635\u0628\u0629 \u0627\u0644\u0647\u0648\u0627\u0626\u064A\u0629\u060C \u0648\u0627\u0644\u0628\u0632\u0644 \u0627\u0644\u0642\u0637\u0646\u064A\u060C \u0648\u0633\u062D\u0628 \u0627\u0644\u0633\u0627\u0626\u0644 \u0627\u0644\u062C\u0646\u0628\u064A \u0648\u0627\u0644\u0627\u0633\u062A\u0633\u0642\u064A\u060C \u0648\u0625\u062F\u0627\u0631\u0629 \u0648\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0623\u0646\u0627\u0628\u064A\u0628 \u0627\u0644\u0642\u0635\u0628\u0629 \u0627\u0644\u0647\u0648\u0627\u0626\u064A\u0629\u060C \u0648\u0631\u0639\u0627\u064A\u0629 \u0623\u0646\u0628\u0648\u0628 \u0627\u0644\u0645\u0639\u062F\u0629 \u0628\u0627\u0644\u0645\u0646\u0638\u0627\u0631 \u0639\u0628\u0631 \u0627\u0644\u062C\u0644\u062F.</p><p>\u0628\u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0645\u0645\u0627\u0631\u0633\u062A\u0647 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629\u060C \u0639\u0645\u0644 \u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u0633\u0627\u0645\u064A \u0641\u064A \u0645\u0624\u0633\u0633\u0627\u062A \u0631\u0639\u0627\u064A\u0629 \u0635\u062D\u064A\u0629 \u0631\u0627\u0626\u062F\u0629 \u0641\u064A \u062C\u0645\u064A\u0639 \u0623\u0646\u062D\u0627\u0621 \u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0645\u062A\u062D\u062F\u0629\u060C \u0648\u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629\u060C \u0648\u0627\u0644\u0633\u0648\u062F\u0627\u0646\u060C \u0645\u0643\u062A\u0633\u0628\u0627 \u062E\u0628\u0631\u0629 \u0648\u0627\u0633\u0639\u0629 \u0641\u064A \u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0627\u0644\u0645\u062A\u0646\u0648\u0639\u0629 \u0648\u0627\u0644\u0641\u0626\u0627\u062A \u0627\u0644\u0645\u0639\u0642\u062F\u0629 \u0645\u0646 \u0627\u0644\u0645\u0631\u0636\u0649. \u0643\u0645\u0627 \u0634\u0627\u0631\u0643 \u0641\u064A \u0627\u0644\u0639\u062F\u064A\u062F \u0645\u0646 \u0645\u0634\u0627\u0631\u064A\u0639 \u0648\u062F\u0631\u0627\u0633\u0627\u062A \u0627\u0644\u0623\u0628\u062D\u0627\u062B \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0641\u064A \u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0645\u0644\u0643 \u0641\u064A\u0635\u0644 \u0627\u0644\u0645\u062A\u062E\u0635\u0635 \u0641\u064A \u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629\u060C \u0645\u0633\u0627\u0647\u0645\u0627 \u0641\u064A \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0629 \u0627\u0644\u0645\u0628\u0646\u064A\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u062F\u0644\u0629 \u0648\u062A\u0637\u0648\u064A\u0631 \u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0636\u0649.</p><p>\u062A\u0644\u062A\u0632\u0645 \u0627\u0644\u062F\u0643\u062A\u0648\u0631\u0629 \u0633\u0627\u0645\u064A \u0628\u062A\u0642\u062F\u064A\u0645 \u0631\u0639\u0627\u064A\u0629 \u0635\u062D\u064A\u0629 \u0642\u0627\u0626\u0645\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u062F\u0644\u0629 \u0648\u062A\u0631\u0643\u0632 \u0639\u0644\u0649 \u0627\u0644\u0645\u0631\u064A\u0636\u060C \u0648\u062A\u0639\u0632\u0632 \u0628\u0646\u0634\u0627\u0637 \u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u0636\u0649\u060C \u0648\u0627\u0644\u0648\u0642\u0627\u064A\u0629 \u0645\u0646 \u0627\u0644\u0639\u062F\u0648\u0649\u060C \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0636\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u064A\u0643\u0631\u0648\u0628\u064A\u0629\u060C \u0648\u0627\u0644\u062A\u0639\u0627\u0648\u0646 \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A. \u064A\u0634\u0627\u0631\u0643 \u0628\u0627\u0646\u062A\u0638\u0627\u0645 \u0641\u064A \u0627\u0644\u062A\u062F\u0642\u064A\u0642\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629\u060C \u0648\u0645\u0628\u0627\u062F\u0631\u0627\u062A \u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u062C\u0648\u062F\u0629\u060C \u0648\u0645\u0631\u0627\u062C\u0639\u0627\u062A \u0627\u0644\u062D\u0627\u0644\u0627\u062A\u060C \u0648\u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629\u060C \u0648\u062A\u0646\u0641\u064A\u0630 \u0623\u0641\u0636\u0644 \u0625\u0631\u0634\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0627\u062A \u0644\u062A\u062D\u0633\u064A\u0646 \u0646\u062A\u0627\u0626\u062C \u0627\u0644\u0645\u0631\u0636\u0649 \u0648\u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629.</p>"
      },
      sub_specialities: [
        {
          en: "Antimicrobial Stewardship",
          ar: ""
        },
        {
          en: "Cardiac Rehabilitation",
          ar: ""
        },
        {
          en: "Complex Patient Care",
          ar: ""
        },
        {
          en: "Critical Care",
          ar: ""
        },
        {
          en: "Geriatric Medicine",
          ar: ""
        },
        {
          en: "Infection Control",
          ar: ""
        },
        {
          en: "Invasive Bedside Procedures",
          ar: ""
        },
        {
          en: "Mechanical Ventilator Management",
          ar: ""
        },
        {
          en: "Neurology Care",
          ar: ""
        },
        {
          en: "Pulmonary Rehabilitation",
          ar: ""
        },
        {
          en: "Renal Disease & Dialysis",
          ar: ""
        },
        {
          en: "Respiratory Disease",
          ar: ""
        },
        {
          en: "Shock & Hemodynamic Management",
          ar: ""
        },
        {
          en: "Stroke Management",
          ar: ""
        }
      ],
      photo: "doctors/list/sami-al-amin",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19327,
      card_photo: {
        size: 169,
        dx: 0
      }
    },
    {
      id: "wp-19640",
      slug: "rao-tariq",
      old_url: "",
      name: {
        en: "Dr. Rao Tariq",
        ar: "\u062F. \u0631\u0627\u0648 \u0637\u0627\u0631\u0642"
      },
      title: {
        en: "General Practitioner",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Rao Muhammad Tariq provides medical care in the ICU setting, including the assessment, monitoring, and management of critically ill patients. His scope includes handling medical emergencies, supporting mechanically ventilated patients, and performing essential clinical procedures.</p><p>He collaborates with multidisciplinary teams to ensure continuous patient care, stabilization, and adherence to clinical protocols and patient safety standards.</p>",
        ar: "<p>\u064A\u0642\u062F\u0645 \u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u0631\u0627\u0648 \u0645\u062D\u0645\u062F \u0637\u0627\u0631\u0642 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 \u0641\u064A \u0648\u062D\u062F\u0629 \u0627\u0644\u0639\u0646\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629\u060C \u0628\u0645\u0627 \u0641\u064A \u0630\u0644\u0643 \u062A\u0642\u064A\u064A\u0645 \u0648\u0645\u0631\u0627\u0642\u0628\u0629 \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0641\u064A \u062D\u0627\u0644\u0627\u062A \u062D\u0631\u062C\u0629. \u064A\u0634\u0645\u0644 \u0646\u0637\u0627\u0642 \u0639\u0645\u0644\u0647 \u0627\u0644\u062A\u0639\u0627\u0645\u0644 \u0645\u0639 \u0627\u0644\u0637\u0648\u0627\u0631\u0626 \u0627\u0644\u0637\u0628\u064A\u0629\u060C \u0648\u062F\u0639\u0645 \u0627\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u0630\u064A\u0646 \u064A\u062A\u0645 \u062A\u0647\u0648\u064A\u062A\u0647\u0645 \u0645\u064A\u0643\u0627\u0646\u064A\u0643\u064A\u0627\u060C \u0648\u0623\u062F\u0627\u0621 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629.</p><p>\u064A\u062A\u0639\u0627\u0648\u0646 \u0645\u0639 \u0641\u0631\u0642 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0644\u0636\u0645\u0627\u0646 \u0627\u0633\u062A\u0645\u0631\u0627\u0631 \u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0636\u0649\u060C \u0648\u0627\u0633\u062A\u0642\u0631\u0627\u0631 \u0627\u0644\u0648\u0636\u0639\u060C \u0648\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0627\u0644\u0628\u0631\u0648\u062A\u0648\u0643\u0648\u0644\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0648\u0645\u0639\u0627\u064A\u064A\u0631 \u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u0636\u0649.</p>"
      },
      sub_specialities: [],
      photo: "doctors/list/rao-muhammad-tariq",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19691,
      card_photo: {
        size: 174.324,
        dx: 5.2
      }
    },
    {
      id: "wp-19646",
      slug: "rasha-mahgoub",
      old_url: "",
      name: {
        en: "Dr. Rasha Mahgoub",
        ar: "\u062F. \u0631\u0634\u0627 \u0645\u062D\u0644\u0648\u0628"
      },
      title: {
        en: "General Physician",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Rasha Hassan Mahgoub delivers inpatient medical care with responsibility for evaluating patient conditions, initiating appropriate management, and ensuring ongoing clinical review.</p><p>The role involves supporting the treatment of acute and stable patients, contributing to care planning, and maintaining accurate medical documentation. Dr. Rasha works collaboratively within a multidisciplinary environment to ensure safe, consistent, and patient-focused care aligned with established clinical standards.</p>",
        ar: "<p>\u064A\u0642\u062F\u0645 \u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u0631\u0634\u0627 \u062D\u0633\u0646 \u0645\u062D\u062C\u0648\u0628 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629 \u0645\u0639 \u0645\u0633\u0624\u0648\u0644\u064A\u0629 \u062A\u0642\u064A\u064A\u0645 \u062D\u0627\u0644\u0629 \u0627\u0644\u0645\u0631\u0636\u0649\u060C \u0648\u0628\u062F\u0621 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629\u060C \u0648\u0636\u0645\u0627\u0646 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u0645\u0631\u0629.</p><p>\u064A\u0634\u0645\u0644 \u0647\u0630\u0627 \u0627\u0644\u062F\u0648\u0631 \u062F\u0639\u0645 \u0639\u0644\u0627\u062C \u0627\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u062D\u0627\u062F\u064A\u0646 \u0648\u0627\u0644\u0645\u0633\u062A\u0642\u0631\u064A\u0646\u060C \u0648\u0627\u0644\u0645\u0633\u0627\u0647\u0645\u0629 \u0641\u064A \u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0631\u0639\u0627\u064A\u0629\u060C \u0648\u0627\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0648\u062B\u0627\u0626\u0642 \u0637\u0628\u064A\u0629 \u062F\u0642\u064A\u0642\u0629. \u062A\u0639\u0645\u0644 \u0627\u0644\u062F\u0643\u062A\u0648\u0631\u0629 \u0631\u0634\u0627 \u0628\u0634\u0643\u0644 \u062A\u0639\u0627\u0648\u0646\u064A \u0636\u0645\u0646 \u0628\u064A\u0626\u0629 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0644\u0636\u0645\u0627\u0646 \u0631\u0639\u0627\u064A\u0629 \u0622\u0645\u0646\u0629 \u0648\u0645\u062A\u0633\u0642\u0629 \u0648\u062A\u0631\u0643\u0632 \u0639\u0644\u0649 \u0627\u0644\u0645\u0631\u064A\u0636 \u0648\u062A\u062A\u0645\u0627\u0634\u0649 \u0645\u0639 \u0627\u0644\u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629.</p>"
      },
      sub_specialities: [],
      photo: "doctors/list/rasha-hassan",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19680,
      card_photo: {
        size: 160,
        dx: 4.5
      }
    },
    {
      id: "wp-19641",
      slug: "walaa-mohamed",
      old_url: "",
      name: {
        en: "Dr. Walaa Mohamed",
        ar: "\u062F. \u0648\u0644\u0627\u0621 \u0645\u062D\u0645\u062F"
      },
      title: {
        en: "General Practitioner ICU",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Walaa Ahmed Farah Mohamed provides comprehensive medical care in ICU, inpatient, and outpatient settings. Her scope includes evaluation, diagnosis, and management of acute and chronic conditions, including critically ill patients.</p><p>She is responsible for patient monitoring, initial stabilization, treatment planning, and follow-up care, while collaborating with multidisciplinary teams to ensure safe, effective, and continuous patient management in line with clinical standards.</p>",
        ar: "<p>\u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u0648\u0644\u0627\u0621 \u0623\u062D\u0645\u062F \u0641\u0631\u062D \u0645\u062D\u0645\u062F \u064A\u0642\u062F\u0645 \u0631\u0639\u0627\u064A\u0629 \u0637\u0628\u064A\u0629 \u0634\u0627\u0645\u0644\u0629 \u0641\u064A \u0627\u0644\u0639\u0646\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629\u060C \u0648\u0627\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u064A\u0646\u060C \u0648\u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0627\u0644\u062E\u0627\u0631\u062C\u064A\u0629. \u064A\u0634\u0645\u0644 \u0646\u0637\u0627\u0642 \u0639\u0645\u0644\u0647\u0627 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0648\u0627\u0644\u062A\u0634\u062E\u064A\u0635 \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u062D\u0627\u062F\u0629 \u0648\u0627\u0644\u0645\u0632\u0645\u0646\u0629\u060C \u0628\u0645\u0627 \u0641\u064A \u0630\u0644\u0643 \u0627\u0644\u0645\u0631\u0636\u0649 \u0641\u064A \u062D\u0627\u0644\u0627\u062A \u062D\u0631\u062C\u0629.</p><p>\u062A\u062A\u062D\u0645\u0644 \u0645\u0633\u0624\u0648\u0644\u064A\u0629 \u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u0645\u0631\u0636\u0649\u060C \u0648\u0627\u0644\u0627\u0633\u062A\u0642\u0631\u0627\u0631 \u0627\u0644\u0623\u0648\u0644\u064A\u060C \u0648\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0639\u0644\u0627\u062C\u060C \u0648\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629\u060C \u0628\u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u062A\u0639\u0627\u0648\u0646 \u0645\u0639 \u0641\u0631\u0642 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0644\u0636\u0645\u0627\u0646 \u0625\u062F\u0627\u0631\u0629 \u0622\u0645\u0646\u0629 \u0648\u0641\u0639\u0627\u0644\u0629 \u0648\u0645\u0633\u062A\u0645\u0631\u0629 \u0644\u0644\u0645\u0631\u0636\u0649 \u0628\u0645\u0627 \u064A\u062A\u0645\u0627\u0634\u0649 \u0645\u0639 \u0627\u0644\u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629.</p>"
      },
      sub_specialities: [],
      photo: "doctors/list/wala-mohammed",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19662,
      card_photo: {
        size: 159,
        dx: 0
      }
    },
    {
      id: "wp-18749",
      slug: "ebtihal-mohammed",
      old_url: "https://cambridgehospital.com/ae/doctor/ebtihal-mohammed/",
      name: {
        en: "Dr. Ebtihal Mohammed",
        ar: ""
      },
      title: {
        en: "General Practitioner ICU",
        ar: ""
      },
      specialties: [
        "internal-medicine"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Ebtihal Rahma Mohammed is an Internal Medicine Specialist in Abu Dhabi with 13+ years\u2019 experience in ICU, emergency care, renal medicine, and rehabilitation.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Acute/Chronic Care",
          ar: ""
        },
        {
          en: "Cardiac Care",
          ar: ""
        },
        {
          en: "Critical Care",
          ar: ""
        },
        {
          en: "Dialysis Complications",
          ar: ""
        },
        {
          en: "Geriatric Medicine",
          ar: ""
        },
        {
          en: "Invasive Procedures",
          ar: ""
        },
        {
          en: "Neurological Emergencies",
          ar: ""
        },
        {
          en: "Renal Disease",
          ar: ""
        },
        {
          en: "Sepsis Control",
          ar: ""
        },
        {
          en: "Shock Management",
          ar: ""
        },
        {
          en: "Stroke Management",
          ar: ""
        },
        {
          en: "Ventilator Management",
          ar: ""
        }
      ],
      photo: "doctors/list/ebtihal-rahma-ahmed",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19326,
      card_photo: {
        size: 174.324,
        dx: 5.2
      }
    },
    {
      id: "wp-19643",
      slug: "samuel-tefera",
      old_url: "",
      name: {
        en: "Dr. Samuel Tefera",
        ar: "\u062F. \u0635\u0645\u0648\u0626\u064A\u0644 \u062A\u064A\u0641\u064A\u0631\u0627"
      },
      title: {
        en: "General Practitioner",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Samuel Tesfaye Tefera provides inpatient medical care with a focus on managing complex and high-dependency cases. His responsibilities include comprehensive clinical assessment, formulation of management plans, and ongoing monitoring of patient progress.</p><p>He is actively involved in managing acute conditions, supporting critical care needs, and performing essential diagnostic and therapeutic procedures. He collaborates closely with specialists and allied healthcare teams to ensure coordinated, patient-centered care in accordance with clinical standards and best practices.</p>",
        ar: "<p>\u064A\u0642\u062F\u0645 \u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u0635\u0645\u0648\u0626\u064A\u0644 \u062A\u0633\u0641\u0627\u064A \u062A\u064A\u0641\u064A\u0631\u0627 \u0631\u0639\u0627\u064A\u0629 \u0637\u0628\u064A\u0629 \u062F\u0627\u062E\u0644\u064A\u0629 \u0645\u0639 \u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0639\u0644\u0649 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0645\u0639\u0642\u062F\u0629 \u0648\u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F. \u062A\u0634\u0645\u0644 \u0645\u0633\u0624\u0648\u0644\u064A\u0627\u062A\u0647 \u062A\u0642\u064A\u064A\u0645\u0627 \u0633\u0631\u064A\u0631\u064A\u0627 \u0634\u0627\u0645\u0644\u0627\u060C \u0648\u0648\u0636\u0639 \u062E\u0637\u0637 \u0644\u0644\u0625\u062F\u0627\u0631\u0629\u060C \u0648\u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u0645\u0633\u062A\u0645\u0631\u0629 \u0644\u062A\u0642\u062F\u0645 \u0627\u0644\u0645\u0631\u0636\u0649.</p><p>\u064A\u0634\u0627\u0631\u0643 \u0628\u0646\u0634\u0627\u0637 \u0641\u064A \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u062D\u0627\u062F\u0629\u060C \u0648\u062F\u0639\u0645 \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062D\u0631\u062C\u0629\u060C \u0648\u0625\u062C\u0631\u0627\u0621 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u062A\u0634\u062E\u064A\u0635\u064A\u0629 \u0648\u0627\u0644\u0639\u0644\u0627\u062C\u064A\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629. \u064A\u062A\u0639\u0627\u0648\u0646 \u0628\u0634\u0643\u0644 \u0648\u062B\u064A\u0642 \u0645\u0639 \u0627\u0644\u0645\u062A\u062E\u0635\u0635\u064A\u0646 \u0648\u0641\u0631\u0642 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0627\u0644\u0645\u062A\u0631\u0627\u0628\u0637\u0629 \u0644\u0636\u0645\u0627\u0646 \u0631\u0639\u0627\u064A\u0629 \u0645\u0646\u0633\u0642\u0629 \u062A\u0631\u0643\u0632 \u0639\u0644\u0649 \u0627\u0644\u0645\u0631\u064A\u0636 \u0648\u0641\u0642\u0627 \u0644\u0644\u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0648\u0623\u0641\u0636\u0644 \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0627\u062A.</p>"
      },
      sub_specialities: [],
      photo: "doctors/list/samuel-tesfaye",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19675,
      card_photo: {
        size: 165,
        dx: 0
      }
    },
    {
      id: "wp-19642",
      slug: "hasan-abueideh",
      old_url: "",
      name: {
        en: "Dr. Hasan Abueideh",
        ar: "\u062F. \u062D\u0633\u0646 \u0623\u0628\u0648\u064A\u0636\u0629"
      },
      title: {
        en: "General Practitioner",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Hasan Mousa Abed provides medical care in outpatient clinics and inpatient settings, including the assessment, diagnosis, and management of acute and chronic medical conditions.</p><p>He is responsible for patient evaluation, treatment planning, and follow-up care, as well as handling medical emergencies and performing essential clinical procedures. He works closely with multidisciplinary teams to ensure continuity of care and adherence to clinical protocols and patient safety standards.</p>",
        ar: "<p>\u064A\u0642\u062F\u0645 \u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u062D\u0633\u0646 \u0645\u0648\u0633\u0649 \u0639\u0627\u0628\u062F \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 \u0641\u064A \u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0627\u0644\u062E\u0627\u0631\u062C\u064A\u0629 \u0648\u0627\u0644\u0628\u064A\u0626\u0627\u062A \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629\u060C \u0628\u0645\u0627 \u0641\u064A \u0630\u0644\u0643 \u062A\u0642\u064A\u064A\u0645 \u0648\u062A\u0634\u062E\u064A\u0635 \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u062D\u0627\u062F\u0629 \u0648\u0627\u0644\u0645\u0632\u0645\u0646\u0629.</p><p>\u0647\u0648 \u0645\u0633\u0624\u0648\u0644 \u0639\u0646 \u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0645\u0631\u0636\u0649\u060C \u0648\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0639\u0644\u0627\u062C\u060C \u0648\u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629\u060C \u0628\u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u062A\u0639\u0627\u0645\u0644 \u0645\u0639 \u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0637\u0627\u0631\u0626\u0629 \u0648\u0625\u062C\u0631\u0627\u0621 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629. \u064A\u0639\u0645\u0644 \u0639\u0646 \u0643\u062B\u0628 \u0645\u0639 \u0641\u0631\u0642 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0644\u0636\u0645\u0627\u0646 \u0627\u0633\u062A\u0645\u0631\u0627\u0631\u064A\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0648\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0627\u0644\u0628\u0631\u0648\u062A\u0648\u0643\u0648\u0644\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0648\u0645\u0639\u0627\u064A\u064A\u0631 \u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u0636\u0649.</p>"
      },
      sub_specialities: [],
      photo: "doctors/list/hasan-abu-eidah",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19676,
      card_photo: {
        size: 165,
        dx: 0
      }
    },
    {
      id: "wp-19657",
      slug: "mohammed-halawani",
      old_url: "",
      name: {
        en: "Dr. Mohammed Halawani",
        ar: "\u062F. \u0645\u062D\u0645\u062F \u062D\u0644\u0627\u0648\u0627\u0646\u064A"
      },
      title: {
        en: "Neuro Specialist",
        ar: ""
      },
      specialties: [
        "neurology"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Dr. Mohammed Halawani is a distinguished neurosurgeon, academic, and healthcare executive whose career spans two decades of clinical excellence and organizational transformation. As KSA CEO of Cambridge Health Group, he leads the organization&#8217;s strategy, operations, and growth across all facilities in the Kingdom, with a mandate to expand access, enhance quality, and deliver sustainable impact. A Fellow of the Royal College of Physicians and Surgeons of Canada, Dr. Halawani completed advanced neurosurgical training at the University of Ottawa and the University of Calgary. His leadership portfolio includes serving as Chairman of Spine Surgery at King Fahad Medical City and Head of Neurosurgery and Spine Divisions at several leading hospitals in Saudi Arabia. He also played a pivotal role in establishing the Johns Hopkins National Guard Epilepsy Surgery Program and the Arab Spine Association, advancing neurosurgical care regionally. Clinically, Dr. Halawani is recognized as a pioneer in minimally invasive and oncological spine surgeries, with more than 3,000 complex procedures performed. His academic contributions include textbook chapters, peer-reviewed publications, and advancements in surgical innovation. At Cambridge Health Group, he anchors the Kingdom&#8217;s growth agenda on patient-centered outcomes, disciplined governance, and a vision to set new standards for long-term and rehabilitative care in the region.</p>",
        ar: "<p>\u064A\u0639\u0645\u0644 \u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u0645\u062D\u0645\u062F \u062D\u0644\u0627\u0648\u0627\u0646\u064A \u0643\u0645\u0633\u062A\u0634\u0627\u0631 \u0644\u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u0623\u0639\u0635\u0627\u0628 \u0648\u0627\u0644\u0639\u0645\u0648\u062F \u0627\u0644\u0641\u0642\u0631\u064A \u0641\u064A \u0645\u0633\u062A\u0634\u0641\u0649 \u0643\u0627\u0645\u0628\u0631\u064A\u062F\u062C\u060C \u0648\u062C\u0644\u0628 \u0623\u0643\u062B\u0631 \u0645\u0646 \u0639\u0634\u0631\u064A\u0646 \u0639\u0627\u0645\u0627 \u0645\u0646 \u0627\u0644\u062E\u0628\u0631\u0629 \u0627\u0644\u0645\u062A\u0642\u062F\u0645\u0629 \u0641\u064A \u062C\u0631\u0627\u062D\u0629 \u0627\u0644\u0623\u0639\u0635\u0627\u0628 \u0625\u0644\u0649 \u0627\u0644\u0645\u0646\u0638\u0645\u0629. \u0643\u0627\u0646 \u0632\u0645\u064A\u0644\u0627 \u0641\u064A \u0627\u0644\u0643\u0644\u064A\u0629 \u0627\u0644\u0645\u0644\u0643\u064A\u0629 \u0644\u0644\u0623\u0637\u0628\u0627\u0621 \u0648\u0627\u0644\u062C\u0631\u0627\u062D\u064A\u0646 \u0641\u064A \u0643\u0646\u062F\u0627\u060C \u0648\u0623\u0643\u0645\u0644 \u062A\u062F\u0631\u064A\u0628\u0627 \u0645\u062A\u062E\u0635\u0635\u0627 \u0641\u064A \u062C\u0631\u0627\u062D\u0629 \u0627\u0644\u0623\u0639\u0635\u0627\u0628 \u0641\u064A \u062C\u0627\u0645\u0639\u0629 \u0623\u0648\u062A\u0627\u0648\u0627 \u0648\u062C\u0627\u0645\u0639\u0629 \u0643\u0627\u0644\u063A\u0627\u0631\u064A\u060C \u0648\u0628\u0646\u0649 \u0623\u0633\u0627\u0633\u0627 \u0642\u0648\u064A\u0627 \u0641\u064A \u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062F\u0645\u0627\u063A \u0648\u0627\u0644\u0639\u0645\u0648\u062F \u0627\u0644\u0641\u0642\u0631\u064A \u0627\u0644\u0645\u0639\u0642\u062F\u0629.</p><p>\u0637\u0648\u0627\u0644 \u0645\u0633\u064A\u0631\u062A\u0647 \u0627\u0644\u0645\u0647\u0646\u064A\u0629\u060C \u0634\u063A\u0644 \u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u062D\u0644\u0627\u0648\u0627\u0646\u064A \u0645\u0646\u0627\u0635\u0628 \u0642\u064A\u0627\u062F\u064A\u0629 \u0628\u0627\u0631\u0632\u0629 \u0641\u064A \u0645\u0624\u0633\u0633\u0627\u062A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0627\u0644\u0643\u0628\u0631\u0649 \u0641\u064A \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629\u060C \u0628\u0645\u0627 \u0641\u064A \u0630\u0644\u0643 \u062E\u062F\u0645\u0627\u062A \u062C\u0631\u0627\u062D\u0629 \u0627\u0644\u0639\u0645\u0648\u062F \u0627\u0644\u0641\u0642\u0631\u064A \u0648\u0623\u0642\u0633\u0627\u0645 \u062C\u0631\u0627\u062D\u0629 \u0627\u0644\u0623\u0639\u0635\u0627\u0628. \u0643\u0627\u0646 \u0644\u0647 \u062F\u0648\u0631 \u0641\u0639\u0627\u0644 \u0641\u064A \u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u0628\u0631\u0627\u0645\u062C \u0627\u0644\u0648\u0637\u0646\u064A\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629\u060C \u062D\u064A\u062B \u0633\u0627\u0647\u0645 \u0641\u064A \u062A\u0623\u0633\u064A\u0633 \u0628\u0631\u0646\u0627\u0645\u062C \u062C\u0631\u0627\u062D\u0629 \u0627\u0644\u0635\u0631\u0639 \u0641\u064A \u0627\u0644\u062D\u0631\u0633 \u0627\u0644\u0648\u0637\u0646\u064A \u0644\u062C\u0627\u0645\u0639\u0629 \u062C\u0648\u0646\u0632 \u0647\u0648\u0628\u0643\u0646\u0632 \u0648\u062F\u0639\u0645 \u062A\u0623\u0633\u064A\u0633 \u062C\u0645\u0639\u064A\u0629 \u0627\u0644\u0639\u0645\u0648\u062F \u0627\u0644\u0641\u0642\u0631\u064A \u0627\u0644\u0639\u0631\u0628\u064A\u0629.</p><p>\u0623\u062C\u0631\u0649 \u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u062D\u0644\u0627\u0648\u0627\u0646\u064A \u0623\u0643\u062B\u0631 \u0645\u0646 3000 \u0625\u062C\u0631\u0627\u0621 \u062C\u0631\u0627\u062D\u064A \u0639\u0635\u0628\u064A \u0648\u0639\u0645\u0648\u062F \u0641\u0642\u0631\u064A \u0645\u0639\u0642\u062F\u060C \u0648\u0647\u0648 \u0645\u0639\u0631\u0648\u0641 \u0639\u0644\u0649 \u0646\u0637\u0627\u0642 \u0648\u0627\u0633\u0639 \u0628\u062E\u0628\u0631\u062A\u0647 \u0641\u064A \u062C\u0631\u0627\u062D\u0629 \u0627\u0644\u0639\u0645\u0648\u062F \u0627\u0644\u0641\u0642\u0631\u064A \u0642\u0644\u064A\u0644\u0629 \u0627\u0644\u062A\u0648\u063A\u0644 \u0648\u0627\u0644\u0623\u0648\u0631\u0627\u0645. \u062A\u0634\u0645\u0644 \u0645\u0633\u0627\u0647\u0645\u0627\u062A\u0647 \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0627\u0644\u0639\u062F\u064A\u062F \u0645\u0646 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0648\u0641\u0635\u0648\u0644 \u0627\u0644\u0643\u062A\u0628 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629 \u0627\u0644\u062A\u064A \u062A\u0631\u0643\u0632 \u0639\u0644\u0649 \u062A\u0642\u0646\u064A\u0627\u062A \u062C\u0631\u0627\u062D\u064A\u0629 \u0645\u0628\u062A\u0643\u0631\u0629 \u0648\u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u0646\u062A\u0627\u0626\u062C \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629.</p><p>\u0628\u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u062F\u0648\u0631\u0647 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u060C \u064A\u0634\u063A\u0644 \u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u062D\u0644\u0627\u0648\u0627\u0646\u064A \u0645\u0646\u0635\u0628 \u0627\u0644\u0631\u0626\u064A\u0633 \u0627\u0644\u062A\u0646\u0641\u064A\u0630\u064A \u0644\u0643\u0627\u0645\u0628\u0631\u064A\u062F\u062C \u0647\u064A\u0644\u062B \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629\u060C \u062D\u064A\u062B \u064A\u0642\u0648\u062F \u0627\u0644\u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u060C \u0648\u0645\u0628\u0627\u062F\u0631\u0627\u062A \u0627\u0644\u062A\u0645\u064A\u0632 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u060C \u0648\u062A\u0648\u0633\u064A\u0639 \u062E\u062F\u0645\u0627\u062A \u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0645\u062A\u062E\u0635\u0635\u0629 \u0648\u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0637\u0648\u064A\u0644\u0629 \u0627\u0644\u0623\u0645\u062F \u0641\u064A \u062C\u0645\u064A\u0639 \u0623\u0646\u062D\u0627\u0621 \u0627\u0644\u0645\u0645\u0644\u0643\u0629.</p>"
      },
      sub_specialities: [],
      photo: "doctors/dr-halawani",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19257,
      card_photo: {
        size: 174.324,
        dx: 0
      }
    },
    {
      id: "wp-20262",
      slug: "saleh-damnan",
      old_url: "https://cambridgehospital.com/sa/doctor/dr-saleh-awadh-mohamed-damnan/",
      name: {
        en: "Dr. Saleh Damnan",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "intensive-care"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>As an Intensive Care Consultant specializing in Critical Care Medicine, Dr. SALEH AWADH MOHAMED DAMNAN provides expert care for critically ill and medically complex patients in the Intensive Care Department at Cambridge Hospital. This work spans mechanical ventilation and ventilator weaning, long-term ventilated patients, respiratory failure, sepsis and multi-organ support, and post-surgical critical care, with continuous monitoring and close collaboration across the intensive care and rehabilitation teams to stabilize patients and support their recovery.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Mechanical Ventilation",
          ar: ""
        },
        {
          en: "Ventilator Weaning",
          ar: ""
        },
        {
          en: "Long-Term Ventilated Patients",
          ar: ""
        },
        {
          en: "Respiratory Failure",
          ar: ""
        },
        {
          en: "Sepsis & Multi-Organ Support",
          ar: ""
        },
        {
          en: "Tracheostomy Care",
          ar: ""
        },
        {
          en: "Post-Surgical Critical Care",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20261",
      slug: "mehnaz-abdul-ghafoor",
      old_url: "https://cambridgehospital.com/sa/doctor/dr-mehnaz-abdul-ghafoor/",
      name: {
        en: "Dr. Mehnaz Abdul Ghafoor",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "intensive-care"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>As an Intensive Care Resident in Internal Medicine, Dr. MEHNAZ ABDUL GHAFOOR manages adult acute and chronic medical conditions in the Intensive Care Department at Cambridge Hospital. This work covers chronic disease management \u2014 including diabetes, hypertension, and cardiac, respiratory, and renal conditions \u2014 alongside complex comorbidities and post-acute medical stabilization, keeping patients medically optimized throughout their rehabilitation and long-term care journey.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Chronic Disease Management",
          ar: ""
        },
        {
          en: "Diabetes & Hypertension",
          ar: ""
        },
        {
          en: "Cardiac, Respiratory & Renal Conditions",
          ar: ""
        },
        {
          en: "Management of Comorbidities",
          ar: ""
        },
        {
          en: "Post-Acute Medical Stabilization",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20260",
      slug: "nader-bin-taleb",
      old_url: "https://cambridgehospital.com/sa/doctor/dr-nader-yaslam-mubarak-bin-taleb/",
      name: {
        en: "Dr. Nader Bin Taleb",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "intensive-care"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>As an Intensive Care Consultant with a background in General Surgery, Dr. Nader Yaslam Mubarak Bin Taleb provides surgical and critical care in the Intensive Care Department at Cambridge Hospital. This work covers surgical critical care, post-surgical rehabilitation and recovery, wound and stoma care, and the management of surgical complications in medically complex patients, supporting safe recovery and a smooth transition into rehabilitation.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Surgical Critical Care",
          ar: ""
        },
        {
          en: "Post-Surgical Rehabilitation & Recovery",
          ar: ""
        },
        {
          en: "Wound & Stoma Care",
          ar: ""
        },
        {
          en: "Management of Surgical Complications",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20258",
      slug: "ali-mahmoud",
      old_url: "https://cambridgehospital.com/sa/doctor/dr-ali-mohamed-ali-mahmoud/",
      name: {
        en: "Dr. Ali Mahmoud",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Dr. Ali Mohamed Ali Mahmoud is a General Practitioner in the Pediatric Extended Care Department at Cambridge Hospital, providing first-line medical care for infants and children in long-term and extended care. This role focuses on chronic childhood conditions, post-acute pediatric care, and preventive and developmental follow-up, in close coordination with the pediatric rehabilitation team to support each child\u2019s growth and recovery.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Pediatric Long-Term & Extended Care",
          ar: ""
        },
        {
          en: "Chronic Childhood Conditions",
          ar: ""
        },
        {
          en: "Post-Acute Pediatric Care",
          ar: ""
        },
        {
          en: "Preventive & Developmental Care",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20256",
      slug: "mohamed-bahrudeen",
      old_url: "https://cambridgehospital.com/sa/doctor/dr-mohamed-arshadh-mohamed-bahrudeen/",
      name: {
        en: "Dr. Mohamed Bahrudeen",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Dr. MOHAMED ARSHADH MOHAMED BAHRUDEEN is a General Practitioner supporting the Intensive Care Department at Cambridge Hospital, caring for critically ill and medically complex patients. Day-to-day responsibilities include ongoing patient assessment, monitoring of ventilated and tracheostomy patients, management of chronic conditions, and post-surgical recovery, delivered in close coordination with the critical care and rehabilitation teams.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Long-Term & Extended Care",
          ar: ""
        },
        {
          en: "Chronic Disease Management",
          ar: ""
        },
        {
          en: "Post-Stroke & Post-Injury Care",
          ar: ""
        },
        {
          en: "Post-Surgical Recovery",
          ar: ""
        },
        {
          en: "Preventive Care",
          ar: ""
        },
        {
          en: "Monitoring & Complication Prevention",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20253",
      slug: "ahmad-almohamady",
      old_url: "https://cambridgehospital.com/sa/doctor/dr-ahmad-mohamad-almohamady/",
      name: {
        en: "Dr. Ahmad Almohamady",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "intensive-care"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>As an Intensive Care Specialist specializing in Critical Care Medicine, Dr. Ahmad Mohamad Almohamady provides expert care for critically ill and medically complex patients in the Intensive Care Department at Cambridge Hospital. This work spans mechanical ventilation and ventilator weaning, long-term ventilated patients, respiratory failure, sepsis and multi-organ support, and post-surgical critical care, with continuous monitoring and close collaboration across the intensive care and rehabilitation teams to stabilize patients and support their recovery.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Mechanical Ventilation",
          ar: ""
        },
        {
          en: "Ventilator Weaning",
          ar: ""
        },
        {
          en: "Long-Term Ventilated Patients",
          ar: ""
        },
        {
          en: "Respiratory Failure",
          ar: ""
        },
        {
          en: "Sepsis & Multi-Organ Support",
          ar: ""
        },
        {
          en: "Tracheostomy Care",
          ar: ""
        },
        {
          en: "Post-Surgical Critical Care",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20252",
      slug: "hesham-mustafa",
      old_url: "https://cambridgehospital.com/sa/doctor/dr-hesham-abdulhai-mohammed-mustafa/",
      name: {
        en: "Dr. Hesham Mustafa",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "intensive-care"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>As an Intensive Care Resident specializing in Critical Care Medicine, Dr. Hesham Abdulhai Mohammed Mustafa provides expert care for critically ill and medically complex patients in the Intensive Care Department at Cambridge Hospital. This work spans mechanical ventilation and ventilator weaning, long-term ventilated patients, respiratory failure, sepsis and multi-organ support, and post-surgical critical care, with continuous monitoring and close collaboration across the intensive care and rehabilitation teams to stabilize patients and support their recovery.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Mechanical Ventilation",
          ar: ""
        },
        {
          en: "Ventilator Weaning",
          ar: ""
        },
        {
          en: "Long-Term Ventilated Patients",
          ar: ""
        },
        {
          en: "Respiratory Failure",
          ar: ""
        },
        {
          en: "Sepsis & Multi-Organ Support",
          ar: ""
        },
        {
          en: "Tracheostomy Care",
          ar: ""
        },
        {
          en: "Post-Surgical Critical Care",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20247",
      slug: "wafaa-farag",
      old_url: "https://cambridgehospital.com/sa/doctor/dr-wafaa-elsayed-abdelmageed-farag/",
      name: {
        en: "Dr. Wafaa Farag",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "pediatric"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>As a Pediatric Specialist in Pediatrics, Dr. Wafaa Elsayed Abdelmageed Farag cares for infants and children in the Pediatric Extended Care Department at Cambridge Hospital. This work spans pediatric rehabilitation, pulmonary and neuromuscular rehabilitation, central nervous system anomalies, long-term care of cardiac anomalies, and pediatric transitional and post-acute care, delivered through a family-centered approach that supports each child\u2019s development, recovery, and quality of life.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Pediatric Rehabilitation",
          ar: ""
        },
        {
          en: "Pulmonary Rehabilitation",
          ar: ""
        },
        {
          en: "Neuromuscular Rehabilitation",
          ar: ""
        },
        {
          en: "Central Nervous System Anomalies",
          ar: ""
        },
        {
          en: "Long-Term Care of Cardiac Anomalies",
          ar: ""
        },
        {
          en: "Pediatric Transitional & Post-Acute Care",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20245",
      slug: "abdulaziz-alqutub",
      old_url: "https://cambridgehospital.com/sa/doctor/dr-abdulaziz-tariq-abdulsalam-alqutub/",
      name: {
        en: "Dr. Abdulaziz Alqutub",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "intensive-care"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>As an Intensive Care Specialist specializing in Critical Care Medicine, Dr. Abdulaziz Tariq Abdulsalam Alqutub provides expert care for critically ill and medically complex patients in the Intensive Care Department at Cambridge Hospital. This work spans mechanical ventilation and ventilator weaning, long-term ventilated patients, respiratory failure, sepsis and multi-organ support, and post-surgical critical care, with continuous monitoring and close collaboration across the intensive care and rehabilitation teams to stabilize patients and support their recovery.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Mechanical Ventilation",
          ar: ""
        },
        {
          en: "Ventilator Weaning",
          ar: ""
        },
        {
          en: "Long-Term Ventilated Patients",
          ar: ""
        },
        {
          en: "Respiratory Failure",
          ar: ""
        },
        {
          en: "Sepsis & Multi-Organ Support",
          ar: ""
        },
        {
          en: "Tracheostomy Care",
          ar: ""
        },
        {
          en: "Post-Surgical Critical Care",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20241",
      slug: "setelnesa-mohamed",
      old_url: "https://cambridgehospital.com/sa/doctor/dr-setelnesa-elzubeir-saeed-mohamed/",
      name: {
        en: "Dr. Setelnesa Mohamed",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "intensive-care"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>As an Intensive Care Specialist with a background in Anesthesia, Dr. SETELNESA ELZUBEIR SAEED MOHAMED provides critical and perioperative care in the Intensive Care Department at Cambridge Hospital. This work focuses on airway management, sedation and analgesia, mechanical ventilation, and pain management for critically ill and medically complex patients, delivered in close coordination with the intensive care and rehabilitation teams.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Critical Care Sedation & Analgesia",
          ar: ""
        },
        {
          en: "Airway Management",
          ar: ""
        },
        {
          en: "Mechanical Ventilation",
          ar: ""
        },
        {
          en: "Pain Management",
          ar: ""
        },
        {
          en: "Perioperative Care",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20239",
      slug: "majed-osaylan",
      old_url: "https://cambridgehospital.com/sa/doctor/dr-majed-taha-majed-osaylan/",
      name: {
        en: "Dr. Majed Osaylan",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Dr. Majed Taha Majed Osaylan is a General Practitioner in the Extended Care Department at Cambridge Hospital, providing comprehensive, patient-centered care for individuals in long-term and extended care. This role covers the day-to-day management of medically stable and chronically ill patients \u2014 including those recovering from stroke, injury, or major surgery \u2014 with a focus on close monitoring, prevention of complications, and continuity of care in coordination with the multidisciplinary rehabilitation team.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Chronic Disease Management",
          ar: ""
        },
        {
          en: "Post-Stroke & Post-Injury Care",
          ar: ""
        },
        {
          en: "Post-Surgical Recovery",
          ar: ""
        },
        {
          en: "Preventive Care",
          ar: ""
        },
        {
          en: "Monitoring & Complication Prevention",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20238",
      slug: "wissam-al-safi",
      old_url: "https://cambridgehospital.com/sa/doctor/dr-wissam-abdullah-al-safi/",
      name: {
        en: "Dr. Wissam Al Safi",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "psychiatry"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>As a Psychiatric Consultant in Psychiatry, Dr. Wissam Abdullah Al Safi leads mental health care across the hospital\u2019s rehabilitation and long-term care programs at Cambridge Hospital. This work addresses depression, anxiety, and adjustment disorders, the neuropsychiatric effects of stroke and brain injury, and the psychological impact of chronic illness and disability, with compassionate support for patients and their families throughout recovery.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Depression & Anxiety",
          ar: ""
        },
        {
          en: "Adjustment Disorders",
          ar: ""
        },
        {
          en: "Neuropsychiatric Care after Stroke & Brain Injury",
          ar: ""
        },
        {
          en: "Psychological Support in Rehabilitation",
          ar: ""
        },
        {
          en: "Patient & Family Support",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20237",
      slug: "omar-baaqil",
      old_url: "",
      name: {
        en: "Dr. Omar Baaqil",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "pmr"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>As Medical Director for Physical Medicine and Rehabilitation, Dr. Omar Hussain Baaqil leads the hospital\u2019s rehabilitation medicine services at Cambridge Hospital, combining clinical leadership with hands-on specialist care. This work covers neuro rehabilitation \u2014 including stroke, traumatic brain injury, and spinal cord injury \u2014 as well as musculoskeletal, post-surgical, and road traffic accident rehabilitation, along with pain and spasticity management, with the goal of restoring function, independence, and quality of life for every patient.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Neuro Rehabilitation",
          ar: ""
        },
        {
          en: "Stroke Rehabilitation",
          ar: ""
        },
        {
          en: "Traumatic Brain Injury",
          ar: ""
        },
        {
          en: "Spinal Cord Injury",
          ar: ""
        },
        {
          en: "Musculoskeletal Rehabilitation",
          ar: ""
        },
        {
          en: "Post-Surgical & Road Traffic Accident Rehabilitation",
          ar: ""
        },
        {
          en: "Pain & Spasticity Management",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20235",
      slug: "ahmed-eltahir",
      old_url: "",
      name: {
        en: "Dr. Ahmed Eltahir",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Dr. Ahmed Moawia Ahmed Eltahir is a General Practitioner in the Extended Care Department at Cambridge Hospital, providing comprehensive, patient-centered care for individuals in long-term and extended care. This role covers the day-to-day management of medically stable and chronically ill patients \u2014 including those recovering from stroke, injury, or major surgery \u2014 with a focus on close monitoring, prevention of complications, and continuity of care in coordination with the multidisciplinary rehabilitation team.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Long-Term & Extended Care",
          ar: ""
        },
        {
          en: "Chronic Disease Management",
          ar: ""
        },
        {
          en: "Post-Stroke & Post-Injury Care",
          ar: ""
        },
        {
          en: "Post-Surgical Recovery",
          ar: ""
        },
        {
          en: "Preventive Care",
          ar: ""
        },
        {
          en: "Monitoring & Complication Prevention",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20234",
      slug: "ahmed-abdallah",
      old_url: "",
      name: {
        en: "Dr. Ahmed Abdallah",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "intensive-care"
      ],
      hospital_id: "",
      country: "",
      languages: [],
      bio: {
        en: "<p>As an Intensive Care Specialist specializing in Adult Critical Care Medicine, Dr. AHMED FATHY AHMED ABDALLAH provides expert care for critically ill and medically complex patients in the Intensive Care Department at Cambridge Hospital. This work spans mechanical ventilation and ventilator weaning, long-term ventilated patients, respiratory failure, sepsis and multi-organ support, and post-surgical critical care, with continuous monitoring and close collaboration across the intensive care and rehabilitation teams to stabilize patients and support their recovery.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Mechanical Ventilation",
          ar: ""
        },
        {
          en: "Ventilator Weaning",
          ar: ""
        },
        {
          en: "Long-Term Ventilated Patients",
          ar: ""
        },
        {
          en: "Respiratory Failure",
          ar: ""
        },
        {
          en: "Sepsis & Multi-Organ Support",
          ar: ""
        },
        {
          en: "Tracheostomy Care",
          ar: ""
        },
        {
          en: "Post-Surgical Critical Care",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20233",
      slug: "ahmed-rohoma",
      old_url: "",
      name: {
        en: "Dr. Ahmed Rohoma",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "intensive-care"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>As an Intensive Care Specialist specializing in Critical Care Medicine, Dr. Ahmed Samir Mohammed Elsaeid Rohoma provides expert care for critically ill and medically complex patients in the Intensive Care Department at Cambridge Hospital. This work spans mechanical ventilation and ventilator weaning, long-term ventilated patients, respiratory failure, sepsis and multi-organ support, and post-surgical critical care, with continuous monitoring and close collaboration across the intensive care and rehabilitation teams to stabilize patients and support their recovery.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Mechanical Ventilation",
          ar: ""
        },
        {
          en: "Ventilator Weaning",
          ar: ""
        },
        {
          en: "Long-Term Ventilated Patients",
          ar: ""
        },
        {
          en: "Respiratory Failure",
          ar: ""
        },
        {
          en: "Sepsis & Multi-Organ Support",
          ar: ""
        },
        {
          en: "Tracheostomy Care",
          ar: ""
        },
        {
          en: "Post-Surgical Critical Care",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20232",
      slug: "abdulrahman-batarfi",
      old_url: "",
      name: {
        en: "Dr. Abdulrahman Batarfi",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Dr. ABDULRAHMAN OMAR ABDULLAH BATARFI is a General Practitioner supporting the Intensive Care Department at Cambridge Hospital, caring for critically ill and medically complex patients. Day-to-day responsibilities include ongoing patient assessment, monitoring of ventilated and tracheostomy patients, management of chronic conditions, and post-surgical recovery, delivered in close coordination with the critical care and rehabilitation teams.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Long-Term & Extended Care",
          ar: ""
        },
        {
          en: "Chronic Disease Management",
          ar: ""
        },
        {
          en: "Post-Stroke & Post-Injury Care",
          ar: ""
        },
        {
          en: "Post-Surgical Recovery",
          ar: ""
        },
        {
          en: "Preventive Care",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20229",
      slug: "kashif-ahmed",
      old_url: "",
      name: {
        en: "Dr. Kashif Ahmed",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "intensive-care"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>As an Intensive Care Resident specializing in Critical Care Medicine, Dr. KASHIF RAZA BASHIR AHMED provides expert care for critically ill and medically complex patients in the Intensive Care Department at Cambridge Hospital. This work spans mechanical ventilation and ventilator weaning, long-term ventilated patients, respiratory failure, sepsis and multi-organ support, and post-surgical critical care, with continuous monitoring and close collaboration across the intensive care and rehabilitation teams to stabilize patients and support their recovery.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Mechanical Ventilation",
          ar: ""
        },
        {
          en: "Ventilator Weaning",
          ar: ""
        },
        {
          en: "Long-Term Ventilated Patients",
          ar: ""
        },
        {
          en: "Respiratory Failure",
          ar: ""
        },
        {
          en: "Sepsis & Multi-Organ Support",
          ar: ""
        },
        {
          en: "Tracheostomy Care",
          ar: ""
        },
        {
          en: "Post-Surgical Critical Care",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20228",
      slug: "farahim-chaudhary",
      old_url: "",
      name: {
        en: "Dr. Farahim Chaudhary",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "intensive-care"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>As an Intensive Care Resident specializing in Critical Care Medicine, Dr. FARAHIM HUSAIN CHAUDHARY provides expert care for critically ill and medically complex patients in the Intensive Care Department at Cambridge Hospital. This work spans mechanical ventilation and ventilator weaning, long-term ventilated patients, respiratory failure, sepsis and multi-organ support, and post-surgical critical care, with continuous monitoring and close collaboration across the intensive care and rehabilitation teams to stabilize patients and support their recovery.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Mechanical Ventilation",
          ar: ""
        },
        {
          en: "Ventilator Weaning",
          ar: ""
        },
        {
          en: "Long-Term Ventilated Patients",
          ar: ""
        },
        {
          en: "Respiratory Failure",
          ar: ""
        },
        {
          en: "Sepsis & Multi-Organ Support",
          ar: ""
        },
        {
          en: "Tracheostomy Care",
          ar: ""
        },
        {
          en: "Post-Surgical Critical Care",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20226",
      slug: "ahmed-morsy",
      old_url: "",
      name: {
        en: "Dr. Ahmed Morsy",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "intensive-care"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>As an Intensive Care Specialist specializing in Critical Care Medicine, Dr. Ahmed Morsy Ali Morsy provides expert care for critically ill and medically complex patients in the Intensive Care Department at Cambridge Hospital. This work spans mechanical ventilation and ventilator weaning, long-term ventilated patients, respiratory failure, sepsis and multi-organ support, and post-surgical critical care, with continuous monitoring and close collaboration across the intensive care and rehabilitation teams to stabilize patients and support their recovery.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Mechanical Ventilation",
          ar: ""
        },
        {
          en: "Ventilator Weaning",
          ar: ""
        },
        {
          en: "Long-Term Ventilated Patients",
          ar: ""
        },
        {
          en: "Respiratory Failure",
          ar: ""
        },
        {
          en: "Sepsis & Multi-Organ Support",
          ar: ""
        },
        {
          en: "Tracheostomy Care",
          ar: ""
        },
        {
          en: "Post-Surgical Critical Care",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20225",
      slug: "mohammed-esmail",
      old_url: "",
      name: {
        en: "Dr. Mohammed Esmail",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "pediatric"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>As a Pediatric Resident in Pediatrics, Dr. Mohammed Amin Elsayed Esmail cares for infants and children in the Pediatric Extended Care Department at Cambridge Hospital. This work spans pediatric rehabilitation, pulmonary and neuromuscular rehabilitation, central nervous system anomalies, long-term care of cardiac anomalies, and pediatric transitional and post-acute care, delivered through a family-centered approach that supports each child\u2019s development, recovery, and quality of life.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Pediatric Rehabilitation",
          ar: ""
        },
        {
          en: "Pulmonary Rehabilitation",
          ar: ""
        },
        {
          en: "Neuromuscular Rehabilitation",
          ar: ""
        },
        {
          en: "Central Nervous System Anomalies",
          ar: ""
        },
        {
          en: "Long-Term Care of Cardiac Anomalies",
          ar: ""
        },
        {
          en: "Pediatric Transitional & Post-Acute Care",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20222",
      slug: "suheib-ahmed",
      old_url: "",
      name: {
        en: "Dr. Suheib Ahmed",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "intensive-care"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>As an Intensive Care Specialist with expertise in Pulmonary Medicine, Dr. Suheib Ali Abdelhamid Ahmed delivers respiratory and critical care in the Intensive Care Department at Cambridge Hospital. This work addresses respiratory failure, mechanical ventilation and weaning, chronic respiratory conditions, tracheostomy management, and pulmonary rehabilitation, supporting patients toward improved breathing function and long-term respiratory health.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Respiratory Failure",
          ar: ""
        },
        {
          en: "Mechanical Ventilation & Weaning",
          ar: ""
        },
        {
          en: "Pulmonary Rehabilitation",
          ar: ""
        },
        {
          en: "Chronic Respiratory Conditions",
          ar: ""
        },
        {
          en: "Tracheostomy Management",
          ar: ""
        },
        {
          en: "Monitoring & Complication Prevention",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20221",
      slug: "wael-mabruk",
      old_url: "",
      name: {
        en: "Dr. Wael Mabruk",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Dr. Wael Adam Bakheet Mabruk is a General Practitioner in the Extended Care Department at Cambridge Hospital, providing comprehensive, patient-centered care for individuals in long-term and extended care. This role covers the day-to-day management of medically stable and chronically ill patients \u2014 including those recovering from stroke, injury, or major surgery \u2014 with a focus on close monitoring, prevention of complications, and continuity of care in coordination with the multidisciplinary rehabilitation team.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Long-Term & Extended Care",
          ar: ""
        },
        {
          en: "Chronic Disease Management",
          ar: ""
        },
        {
          en: "Post-Stroke & Post-Injury Care",
          ar: ""
        },
        {
          en: "Post-Surgical Recovery",
          ar: ""
        },
        {
          en: "Preventive Care",
          ar: ""
        },
        {
          en: "Monitoring & Complication Prevention",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-20220",
      slug: "nada-mohamed",
      old_url: "",
      name: {
        en: "Dr. Nada Mohamed",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Dr. Nada Ali Elshareef Mohamed is a General Practitioner in the Extended Care Department at Cambridge Hospital, providing comprehensive, patient-centered care for individuals in long-term and extended care. This role covers the day-to-day management of medically stable and chronically ill patients \u2014 including those recovering from stroke, injury, or major surgery \u2014 with a focus on close monitoring, prevention of complications, and continuity of care in coordination with the multidisciplinary rehabilitation team.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Long-Term & Extended Care",
          ar: ""
        },
        {
          en: "Chronic Disease Management",
          ar: ""
        },
        {
          en: "Post-Stroke & Post-Injury Care",
          ar: ""
        },
        {
          en: "Post-Surgical Recovery",
          ar: ""
        },
        {
          en: "Preventive Care",
          ar: ""
        },
        {
          en: "Monitoring & Complication Prevention",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-18834",
      slug: "abdulaziz-almetrek",
      old_url: "",
      name: {
        en: "Dr. Abdulaziz Almetrek",
        ar: "\u062F. \u0639\u0628\u062F \u0627\u0644\u0639\u0632\u064A\u0632 \u0623\u0644\u0645\u062A\u0631\u064A\u0643"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "pmr"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Dr. AbdulAziz is a physician and Medical Director at Cambridge Hospital, Khobar. He oversees medical services and clinical operations, supporting rehabilitation, long-term care, and chronic disease management programs while promoting excellence in patient care, quality, and safety.</p>",
        ar: "<p>\u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u0639\u0628\u062F \u0627\u0644\u0639\u0632\u064A\u0632 \u0647\u0648 \u0637\u0628\u064A\u0628 \u0648\u0645\u062F\u064A\u0631 \u0637\u0628\u064A \u0641\u064A \u0645\u0633\u062A\u0634\u0641\u0649 \u0643\u0627\u0645\u0628\u0631\u064A\u062F\u062C\u060C \u0627\u0644\u062E\u0628\u0631. \u064A\u0634\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u0639\u0645\u0644\u064A\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629\u060C \u0648\u064A\u062F\u0639\u0645 \u0628\u0631\u0627\u0645\u062C \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0648\u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0637\u0648\u064A\u0644\u0629 \u0627\u0644\u0623\u0645\u062F \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0645\u0631\u0627\u0636 \u0627\u0644\u0645\u0632\u0645\u0646\u0629 \u0645\u0639 \u062A\u0639\u0632\u064A\u0632 \u0627\u0644\u062A\u0645\u064A\u0632 \u0641\u064A \u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0648\u062C\u0648\u062F\u062A\u0647\u0627 \u0648\u0633\u0644\u0627\u0645\u062A\u0647\u0627.</p>"
      },
      sub_specialities: [
        {
          en: "Stroke Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0633\u0643\u062A\u0629 \u0627\u0644\u062F\u0645\u0627\u063A\u064A\u0629"
        },
        {
          en: "Traumatic Brain Injury Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0645\u0646 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062F\u0645\u0627\u063A \u0627\u0644\u0631\u0636\u062D\u064A\u0629"
        },
        {
          en: "Amputee Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0645\u0628\u062A\u0648\u0631\u064A\u0646"
        },
        {
          en: "Neurological Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0639\u0635\u0628\u064A"
        },
        {
          en: "Spasticity Management",
          ar: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u0634\u0646\u0651\u062C \u0627\u0644\u0639\u0636\u0644\u064A"
        },
        {
          en: "Pain Management",
          ar: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0644\u0645"
        },
        {
          en: "Prehabilitation and Rehabilitation for Joint Replacement",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0648\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0644\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0645\u0641\u0627\u0635\u0644"
        },
        {
          en: "Geriatric Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0634\u064A\u062E\u0648\u062E\u0629"
        },
        {
          en: "Pediatric Rehabilitation including Cerebral Palsy and Neuromuscular Diseases",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0644\u0644\u0623\u0637\u0641\u0627\u0644 \u0628\u0645\u0627 \u0641\u064A \u0630\u0644\u0643 \u0627\u0644\u0634\u0644\u0644 \u0627\u0644\u062F\u0645\u0627\u063A\u064A \u0648\u0623\u0645\u0631\u0627\u0636 \u0627\u0644\u0623\u0639\u0635\u0627\u0628 \u0627\u0644\u0639\u0636\u0644\u064A\u0629"
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19296
    },
    {
      id: "wp-18833",
      slug: "mohammed-alhayyan",
      old_url: "",
      name: {
        en: "Dr. Mohammed Alhayyan",
        ar: "\u062F. \u0645\u062D\u0645\u062F \u0627\u0644\u062D\u064A\u0627\u0646"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "pmr"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Dr. Mohammed Alhayyan is a Consultant in Physical Medicine and Rehabilitation (PM&amp;R) and currently serves as the Medical Director of Cambridge Hospital &#8211; Dhahran Branch.\xA0As Medical Director at Cambridge Hospital, I oversee the medical and clinical operations of the hospital, with a focus on maintaining high standards of patient care, strengthening multidisciplinary collaboration, and developing comprehensive inpatient and outpatient rehabilitation services. I also lead initiatives aimed at expanding specialized rehabilitation programs and enhancing the overall patient experience and quality of care.</p>",
        ar: "<p>\u0628\u0635\u0641\u062A\u064A \u0627\u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0637\u0628\u064A \u0641\u064A \u0645\u0633\u062A\u0634\u0641\u0649 \u0643\u0627\u0645\u0628\u0631\u064A\u062F\u062C\u060C \u0642\u062F\u062A \u0627\u0644\u062C\u0647\u0648\u062F \u0644\u062A\u0639\u0632\u064A\u0632 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062A\u064A \u062A\u0631\u0643\u0632 \u0639\u0644\u0649 \u0627\u0644\u0645\u0631\u064A\u0636 \u0648\u0627\u0644\u062A\u0645\u064A\u0632 \u0627\u0644\u062A\u0634\u063A\u064A\u0644\u064A. \u0643\u0627\u0646 \u062A\u0631\u0643\u064A\u0632\u064A \u0639\u0644\u0649 \u0627\u0644\u062A\u0639\u0627\u0648\u0646 \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0648\u0627\u0644\u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u0645\u0633\u062A\u0645\u0631 \u0644\u0646\u062A\u0627\u0626\u062C \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0645\u062D\u0648\u0631\u064A\u0627 \u0641\u064A \u062F\u0641\u0639 \u0645\u0628\u0627\u062F\u0631\u0627\u062A \u0627\u0644\u062A\u0648\u0633\u0639 \u0627\u0644\u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0629 \u0648\u062A\u0637\u0648\u064A\u0631 \u0628\u0631\u0627\u0645\u062C \u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0645\u0628\u062A\u0643\u0631\u0629 \u0645\u0635\u0645\u0645\u0629 \u0644\u062A\u0644\u0628\u064A\u0629 \u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0627\u0644\u0645\u062C\u062A\u0645\u0639.</p>"
      },
      sub_specialities: [
        {
          en: "Stroke Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0633\u0643\u062A\u0629 \u0627\u0644\u062F\u0645\u0627\u063A\u064A\u0629"
        },
        {
          en: "Traumatic Brain Injury Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0645\u0646 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062F\u0645\u0627\u063A \u0627\u0644\u0631\u0636\u062D\u064A\u0629"
        },
        {
          en: "Spinal Cord Injury Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0625\u0635\u0627\u0628\u0629 \u0627\u0644\u062D\u0628\u0644 \u0627\u0644\u0634\u0648\u0643\u064A"
        },
        {
          en: "Amputee Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0645\u0628\u062A\u0648\u0631\u064A\u0646"
        },
        {
          en: "Neurological Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0639\u0635\u0628\u064A"
        },
        {
          en: "Spasticity Management",
          ar: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u0634\u0646\u0651\u062C \u0627\u0644\u0639\u0636\u0644\u064A"
        },
        {
          en: "Pain Management",
          ar: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0644\u0645"
        },
        {
          en: "Prehabilitation and Rehabilitation for Joint Replacement",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0648\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0644\u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0627\u0644\u0645\u0641\u0627\u0635\u0644"
        },
        {
          en: "Geriatric Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0634\u064A\u062E\u0648\u062E\u0629"
        },
        {
          en: "Pediatric Rehabilitation including Cerebral Palsy and Neuromuscular Diseases",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0644\u0644\u0623\u0637\u0641\u0627\u0644 \u0628\u0645\u0627 \u0641\u064A \u0630\u0644\u0643 \u0627\u0644\u0634\u0644\u0644 \u0627\u0644\u062F\u0645\u0627\u063A\u064A \u0648\u0623\u0645\u0631\u0627\u0636 \u0627\u0644\u0623\u0639\u0635\u0627\u0628 \u0627\u0644\u0639\u0636\u0644\u064A\u0629"
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19297
    },
    {
      id: "wp-18832",
      slug: "ahmed-ibrahim",
      old_url: "",
      name: {
        en: "Dr. Ahmed Ibrahim",
        ar: "\u062F. \u0623\u062D\u0645\u062F \u0625\u0628\u0631\u0627\u0647\u064A\u0645"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Strong commitment to patient care and clinical excellence, plays a key role in supporting multidisciplinary healthcare services and delivering high-quality medical care.</p>",
        ar: "<p>\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0627\u0644\u0642\u0648\u064A \u0628\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0648\u0627\u0644\u062A\u0645\u064A\u0632 \u0627\u0644\u0633\u0631\u064A\u0631\u064A \u064A\u0644\u0639\u0628 \u062F\u0648\u0631\u0627 \u0631\u0626\u064A\u0633\u064A\u0627 \u0641\u064A \u062F\u0639\u0645 \u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0648\u062A\u0642\u062F\u064A\u0645 \u0631\u0639\u0627\u064A\u0629 \u0637\u0628\u064A\u0629 \u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u062C\u0648\u062F\u0629.</p>"
      },
      sub_specialities: [
        {
          en: "Physical Rehabilitation",
          ar: "\u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0628\u062F\u0646\u064A"
        },
        {
          en: "Spinal Cord Injury Care",
          ar: "\u0631\u0639\u0627\u064A\u0629 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062D\u0628\u0644 \u0627\u0644\u0634\u0648\u0643\u064A"
        },
        {
          en: "Brain Injury Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062F\u0645\u0627\u063A"
        },
        {
          en: "Sports Injury Treatment",
          ar: "\u0639\u0644\u0627\u062C \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u0631\u064A\u0627\u0636\u0629"
        },
        {
          en: "EMG & Nerve Studies",
          ar: "\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0639\u0636\u0644\u0627\u062A \u0648\u062F\u0631\u0627\u0633\u0627\u062A \u0627\u0644\u0623\u0639\u0635\u0627\u0628"
        },
        {
          en: "Pain Management",
          ar: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0644\u0645"
        },
        {
          en: "Acupuncture Therapy",
          ar: "\u0627\u0644\u0639\u0644\u0627\u062C \u0628\u0627\u0644\u0625\u0628\u0631 \u0627\u0644\u0635\u064A\u0646\u064A\u0629"
        }
      ],
      photo: "doctors/wp/ahmed-ibrahim",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19281
    },
    {
      id: "wp-18830",
      slug: "mohammed-bawahal",
      old_url: "",
      name: {
        en: "Dr. Mohammed Bawahal",
        ar: "\u062F. \u0645\u062D\u0645\u062F \u0628\u0648\u0627\u0647\u0627\u0644"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Physician holding an MBBS degree and certified by the Saudi Commission for Health Specialties (SCFHS), with 10 years extensive hands-on experience in emergency medicine and critical care, as well as strong leadership in medical administration.</p><p>Currently, I serve as part of the International SOS team, delivering high-quality medical care in remote and challenging environments, with a focus on emergency medicine and occupational health. I am continuously committed to advancing both my clinical and administrative competencies to ensure optimal healthcare delivery across diverse settings.</p>",
        ar: "<p>\u0637\u0628\u064A\u0628 \u062D\u0627\u0635\u0644 \u0639\u0644\u0649 \u0634\u0647\u0627\u062F\u0629 \u0627\u0644\u0637\u0628 \u0648\u0627\u0644\u0647\u0646\u062F\u0633\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0645\u0639\u062A\u0645\u062F \u0645\u0646 \u0627\u0644\u0645\u0641\u0648\u0636\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629 \u0644\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0627\u0644\u0635\u062D\u064A\u0629 (SCFHS)\u060C \u0648\u0644\u062F\u064A\u0647 \u062E\u0628\u0631\u0629 \u0639\u0645\u0644\u064A\u0629 \u0648\u0627\u0633\u0639\u0629 \u062A\u0645\u062A\u062F \u0644\u0639\u0634\u0631 \u0633\u0646\u0648\u0627\u062A \u0641\u064A \u0637\u0628 \u0627\u0644\u0637\u0648\u0627\u0631\u0626 \u0648\u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062D\u0631\u062C\u0629\u060C \u0628\u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0642\u064A\u0627\u062F\u0629 \u0642\u0648\u064A\u0629 \u0641\u064A \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0637\u0628\u064A\u0629.</p><p>\u062D\u0627\u0644\u064A\u0627\u060C \u0623\u0639\u0645\u0644 \u0643\u062C\u0632\u0621 \u0645\u0646 \u0641\u0631\u064A\u0642 \u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0635\u062D\u0629 \u0627\u0644\u062F\u0648\u0644\u064A\u0629 (ISS) \u0627\u0644\u062F\u0648\u0644\u064A\u060C \u062D\u064A\u062B \u0623\u0642\u062F\u0645 \u0631\u0639\u0627\u064A\u0629 \u0637\u0628\u064A\u0629 \u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u062C\u0648\u062F\u0629 \u0641\u064A \u0628\u064A\u0626\u0627\u062A \u0646\u0627\u0626\u064A\u0629 \u0648\u0635\u0639\u0628\u0629\u060C \u0645\u0639 \u062A\u0631\u0643\u064A\u0632 \u0639\u0644\u0649 \u0637\u0628 \u0627\u0644\u0637\u0648\u0627\u0631\u0626 \u0648\u0627\u0644\u0635\u062D\u0629 \u0627\u0644\u0645\u0647\u0646\u064A\u0629. \u0623\u0646\u0627 \u0645\u0644\u062A\u0632\u0645 \u0628\u0627\u0633\u062A\u0645\u0631\u0627\u0631 \u0628\u062A\u0637\u0648\u064A\u0631 \u0643\u0641\u0627\u0621\u0627\u062A\u064A \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0648\u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 \u0644\u0636\u0645\u0627\u0646 \u062A\u0642\u062F\u064A\u0645 \u0623\u0641\u0636\u0644 \u0631\u0639\u0627\u064A\u0629 \u0635\u062D\u064A\u0629 \u0639\u0628\u0631 \u0628\u064A\u0626\u0627\u062A \u0645\u062A\u0646\u0648\u0639\u0629.</p>"
      },
      sub_specialities: [
        {
          en: "Physical Rehabilitation",
          ar: "\u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0628\u062F\u0646\u064A"
        },
        {
          en: "Spinal Cord Injury Care",
          ar: "\u0631\u0639\u0627\u064A\u0629 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062D\u0628\u0644 \u0627\u0644\u0634\u0648\u0643\u064A"
        },
        {
          en: "Brain Injury Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062F\u0645\u0627\u063A"
        },
        {
          en: "Sports Injury Treatment",
          ar: "\u0639\u0644\u0627\u062C \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u0631\u064A\u0627\u0636\u0629"
        },
        {
          en: "EMG & Nerve Studies",
          ar: "\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0639\u0636\u0644\u0627\u062A \u0648\u062F\u0631\u0627\u0633\u0627\u062A \u0627\u0644\u0623\u0639\u0635\u0627\u0628"
        },
        {
          en: "Pain Management",
          ar: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0644\u0645"
        },
        {
          en: "Acupuncture Therapy",
          ar: "\u0627\u0644\u0639\u0644\u0627\u062C \u0628\u0627\u0644\u0625\u0628\u0631 \u0627\u0644\u0635\u064A\u0646\u064A\u0629"
        }
      ],
      photo: "doctors/wp/mohammed-bawahal",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19328
    },
    {
      id: "wp-18829",
      slug: "nansy-elnaggar",
      old_url: "",
      name: {
        en: "Dr. Nansy Elnaggar",
        ar: "\u062F. \u0646\u0627\u0646\u0633\u064A \u0625\u0644\u0646\u0627\u062C\u0627\u0631"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Strong commitment to patient care and clinical excellence, plays a key role in supporting multidisciplinary healthcare services and delivering high-quality medical care.</p>",
        ar: "<p>\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0627\u0644\u0642\u0648\u064A \u0628\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0648\u0627\u0644\u062A\u0645\u064A\u0632 \u0627\u0644\u0633\u0631\u064A\u0631\u064A \u064A\u0644\u0639\u0628 \u062F\u0648\u0631\u0627 \u0631\u0626\u064A\u0633\u064A\u0627 \u0641\u064A \u062F\u0639\u0645 \u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0648\u062A\u0642\u062F\u064A\u0645 \u0631\u0639\u0627\u064A\u0629 \u0637\u0628\u064A\u0629 \u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u062C\u0648\u062F\u0629.</p>"
      },
      sub_specialities: [
        {
          en: "Physical Rehabilitation",
          ar: "\u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0628\u062F\u0646\u064A"
        },
        {
          en: "Spinal Cord Injury Care",
          ar: "\u0631\u0639\u0627\u064A\u0629 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062D\u0628\u0644 \u0627\u0644\u0634\u0648\u0643\u064A"
        },
        {
          en: "Brain Injury Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062F\u0645\u0627\u063A"
        },
        {
          en: "Sports Injury Treatment",
          ar: "\u0639\u0644\u0627\u062C \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u0631\u064A\u0627\u0636\u0629"
        },
        {
          en: "EMG & Nerve Studies",
          ar: "\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0639\u0636\u0644\u0627\u062A \u0648\u062F\u0631\u0627\u0633\u0627\u062A \u0627\u0644\u0623\u0639\u0635\u0627\u0628"
        },
        {
          en: "Pain Management",
          ar: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0644\u0645"
        },
        {
          en: "Acupuncture Therapy",
          ar: "\u0627\u0644\u0639\u0644\u0627\u062C \u0628\u0627\u0644\u0625\u0628\u0631 \u0627\u0644\u0635\u064A\u0646\u064A\u0629"
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19286
    },
    {
      id: "wp-18828",
      slug: "souad-mohamed",
      old_url: "",
      name: {
        en: "Dr. Souad Mohamed",
        ar: "\u062F. \u0633\u0639\u0627\u062F \u0645\u062D\u0645\u062F"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Strong commitment to patient care and clinical excellence, plays a key role in supporting multidisciplinary healthcare services and delivering high-quality medical care.</p>",
        ar: "<p>\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0627\u0644\u0642\u0648\u064A \u0628\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0648\u0627\u0644\u062A\u0645\u064A\u0632 \u0627\u0644\u0633\u0631\u064A\u0631\u064A \u064A\u0644\u0639\u0628 \u062F\u0648\u0631\u0627 \u0631\u0626\u064A\u0633\u064A\u0627 \u0641\u064A \u062F\u0639\u0645 \u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0648\u062A\u0642\u062F\u064A\u0645 \u0631\u0639\u0627\u064A\u0629 \u0637\u0628\u064A\u0629 \u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u062C\u0648\u062F\u0629.</p>"
      },
      sub_specialities: [
        {
          en: "Physical Rehabilitation",
          ar: "\u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0628\u062F\u0646\u064A"
        },
        {
          en: "Spinal Cord Injury Care",
          ar: "\u0631\u0639\u0627\u064A\u0629 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062D\u0628\u0644 \u0627\u0644\u0634\u0648\u0643\u064A"
        },
        {
          en: "Brain Injury Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062F\u0645\u0627\u063A"
        },
        {
          en: "Sports Injury Treatment",
          ar: "\u0639\u0644\u0627\u062C \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u0631\u064A\u0627\u0636\u0629"
        },
        {
          en: "EMG & Nerve Studies",
          ar: "\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0639\u0636\u0644\u0627\u062A \u0648\u062F\u0631\u0627\u0633\u0627\u062A \u0627\u0644\u0623\u0639\u0635\u0627\u0628"
        },
        {
          en: "Pain Management",
          ar: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0644\u0645"
        },
        {
          en: "Acupuncture Therapy",
          ar: "\u0627\u0644\u0639\u0644\u0627\u062C \u0628\u0627\u0644\u0625\u0628\u0631 \u0627\u0644\u0635\u064A\u0646\u064A\u0629"
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19287
    },
    {
      id: "wp-18827",
      slug: "rawiyah-abdalla",
      old_url: "",
      name: {
        en: "Dr. Rawiyah Abdalla",
        ar: "\u062F. \u0631\u0648\u064A\u0629 \u0639\u0628\u062F \u0627\u0644\u0644\u0647"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Strong commitment to patient care and clinical excellence, plays a key role in supporting multidisciplinary healthcare services and delivering high-quality medical care.</p>",
        ar: "<p>\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0627\u0644\u0642\u0648\u064A \u0628\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0648\u0627\u0644\u062A\u0645\u064A\u0632 \u0627\u0644\u0633\u0631\u064A\u0631\u064A \u064A\u0644\u0639\u0628 \u062F\u0648\u0631\u0627 \u0631\u0626\u064A\u0633\u064A\u0627 \u0641\u064A \u062F\u0639\u0645 \u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0648\u062A\u0642\u062F\u064A\u0645 \u0631\u0639\u0627\u064A\u0629 \u0637\u0628\u064A\u0629 \u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u062C\u0648\u062F\u0629.</p>"
      },
      sub_specialities: [
        {
          en: "Physical Rehabilitation",
          ar: "\u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0628\u062F\u0646\u064A"
        },
        {
          en: "Spinal Cord Injury Care",
          ar: "\u0631\u0639\u0627\u064A\u0629 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062D\u0628\u0644 \u0627\u0644\u0634\u0648\u0643\u064A"
        },
        {
          en: "Brain Injury Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062F\u0645\u0627\u063A"
        },
        {
          en: "Sports Injury Treatment",
          ar: "\u0639\u0644\u0627\u062C \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u0631\u064A\u0627\u0636\u0629"
        },
        {
          en: "EMG & Nerve Studies",
          ar: "\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0639\u0636\u0644\u0627\u062A \u0648\u062F\u0631\u0627\u0633\u0627\u062A \u0627\u0644\u0623\u0639\u0635\u0627\u0628"
        },
        {
          en: "Pain Management",
          ar: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0644\u0645"
        },
        {
          en: "Acupuncture Therapy",
          ar: "\u0627\u0644\u0639\u0644\u0627\u062C \u0628\u0627\u0644\u0625\u0628\u0631 \u0627\u0644\u0635\u064A\u0646\u064A\u0629"
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19289
    },
    {
      id: "wp-18825",
      slug: "mohammed-mugahed",
      old_url: "",
      name: {
        en: "Dr. Mohammed Mugahed",
        ar: "\u062F. \u0645\u062D\u0645\u062F \u0645\u062C\u0627\u0647\u062F"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Dedicated General Practitioner skilled in Family Medicine, ICU, ER. over 5 years of comprehensive experience in Emergency Medicine.</p>",
        ar: "<p>\u0637\u0628\u064A\u0628 \u0639\u0627\u0645 \u0645\u062E\u0635\u0635 \u0645\u062A\u062E\u0635\u0635 \u0641\u064A \u0637\u0628 \u0627\u0644\u0623\u0633\u0631\u0629\u060C \u0627\u0644\u0639\u0646\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629\u060C \u0642\u0633\u0645 \u0627\u0644\u0637\u0648\u0627\u0631\u0626. \u0623\u0643\u062B\u0631 \u0645\u0646 5 \u0633\u0646\u0648\u0627\u062A \u0645\u0646 \u0627\u0644\u062E\u0628\u0631\u0629 \u0627\u0644\u0634\u0627\u0645\u0644\u0629 \u0641\u064A \u0637\u0628 \u0627\u0644\u0637\u0648\u0627\u0631\u0626.</p>"
      },
      sub_specialities: [
        {
          en: "Physical Rehabilitation",
          ar: "\u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0628\u062F\u0646\u064A"
        },
        {
          en: "Spinal Cord Injury Care",
          ar: "\u0631\u0639\u0627\u064A\u0629 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062D\u0628\u0644 \u0627\u0644\u0634\u0648\u0643\u064A"
        },
        {
          en: "Brain Injury Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062F\u0645\u0627\u063A"
        },
        {
          en: "Sports Injury Treatment",
          ar: "\u0639\u0644\u0627\u062C \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u0631\u064A\u0627\u0636\u0629"
        },
        {
          en: "EMG & Nerve Studies",
          ar: "\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0639\u0636\u0644\u0627\u062A \u0648\u062F\u0631\u0627\u0633\u0627\u062A \u0627\u0644\u0623\u0639\u0635\u0627\u0628"
        },
        {
          en: "Pain Management",
          ar: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0644\u0645"
        },
        {
          en: "Acupuncture Therapy",
          ar: "\u0627\u0644\u0639\u0644\u0627\u062C \u0628\u0627\u0644\u0625\u0628\u0631 \u0627\u0644\u0635\u064A\u0646\u064A\u0629"
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19329
    },
    {
      id: "wp-18824",
      slug: "medhat-hagras",
      old_url: "",
      name: {
        en: "Dr. Medhat Hagras",
        ar: "\u062F. \u0645\u062F\u062D\u062A \u0647\u062C\u0631\u0627\u0633"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "internal-medicine"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Consultant Internist, Head of internal medicine department, Chief of medical services including ICU, Medical ER, Medical inpatients ,Medical outpatients, Long Term Care(LTC), very skillful in Endoscopy upper ,lower diagnostic and therapeutic maneuvers , had a training courses and scientific activities all over the world , assigned as a main responsible physician and the treating consultant for hundreds of COVID -19 cases of all categories with a high cure rate, the Panel physician for USA embassy for immigration sector in the eastern province &amp; chairman of many committees in NMC As-Salama Hospital,Alkhobar, K.S.A. from 9/2005 up till now, very Dynamic, active, decision maker and team leader.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "ICU & Critical Care",
          ar: ""
        },
        {
          en: "Medical Emergencies",
          ar: ""
        },
        {
          en: "Inpatient Wards",
          ar: ""
        }
      ],
      photo: "doctors/wp/medhat-hagras",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19299
    },
    {
      id: "wp-18822",
      slug: "shayma-marganie",
      old_url: "",
      name: {
        en: "Dr. Shayma Marganie",
        ar: "\u062F. \u0634\u064A\u0645\u0627 \u0645\u0627\u0631\u063A\u0627\u0646\u064A"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "pediatric"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Strong commitment to patient care and clinical excellence, plays a key role in supporting multidisciplinary healthcare services and delivering high-quality medical care.</p>",
        ar: "<p>\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0627\u0644\u0642\u0648\u064A \u0628\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0648\u0627\u0644\u062A\u0645\u064A\u0632 \u0627\u0644\u0633\u0631\u064A\u0631\u064A \u064A\u0644\u0639\u0628 \u062F\u0648\u0631\u0627 \u0631\u0626\u064A\u0633\u064A\u0627 \u0641\u064A \u062F\u0639\u0645 \u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0648\u062A\u0642\u062F\u064A\u0645 \u0631\u0639\u0627\u064A\u0629 \u0637\u0628\u064A\u0629 \u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u062C\u0648\u062F\u0629.</p>"
      },
      sub_specialities: [
        {
          en: "Pulmonary Pediatric Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0631\u0626\u0629 \u0644\u062F\u0649 \u0627\u0644\u0623\u0637\u0641\u0627\u0644"
        },
        {
          en: "Speech and Language Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0646\u0637\u0642 \u0648\u0627\u0644\u0644\u063A\u0629"
        },
        {
          en: "Pediatric Neuromuscular Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0639\u0635\u0628\u064A \u0627\u0644\u0639\u0636\u0644\u064A \u0644\u0644\u0623\u0637\u0641\u0627\u0644"
        },
        {
          en: "Central Nervous System Anomalies",
          ar: "\u062A\u0634\u0648\u0647\u0627\u062A \u0627\u0644\u062C\u0647\u0627\u0632 \u0627\u0644\u0639\u0635\u0628\u064A \u0627\u0644\u0645\u0631\u0643\u0632\u064A"
        },
        {
          en: "Long-term Care of Cardiac Anomalies",
          ar: "\u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0637\u0648\u064A\u0644\u0629 \u0627\u0644\u0623\u0645\u062F \u0644\u0627\u0636\u0637\u0631\u0627\u0628\u0627\u062A \u0627\u0644\u0642\u0644\u0628"
        },
        {
          en: "Pediatric Transitional Care",
          ar: "\u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0627\u0646\u062A\u0642\u0627\u0644\u064A\u0629 \u0644\u0644\u0623\u0637\u0641\u0627\u0644"
        },
        {
          en: "Pediatric Post-Acute Care",
          ar: "\u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0644\u0627\u062D\u0642\u0629 \u0644\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u062D\u0627\u062F\u0629 \u0644\u062F\u0649 \u0627\u0644\u0623\u0637\u0641\u0627\u0644"
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19294
    },
    {
      id: "wp-18821",
      slug: "amgad-ali",
      old_url: "",
      name: {
        en: "Dr. Amgad Ali",
        ar: "\u062F. \u0623\u0645\u062C\u062F \u0639\u0644\u064A"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Dedicated General Practitioner skilled in Family Medicine. over 5 years of comprehensive experience in Emergency Medicine.</p>",
        ar: "<p>\u0637\u0628\u064A\u0628 \u0639\u0627\u0645 \u0645\u0643\u0631\u0633 \u0645\u0627\u0647\u0631 \u0641\u064A \u0637\u0628 \u0627\u0644\u0623\u0633\u0631\u0629. \u0623\u0643\u062B\u0631 \u0645\u0646 5 \u0633\u0646\u0648\u0627\u062A \u0645\u0646 \u0627\u0644\u062E\u0628\u0631\u0629 \u0627\u0644\u0634\u0627\u0645\u0644\u0629 \u0641\u064A \u0637\u0628 \u0627\u0644\u0637\u0648\u0627\u0631\u0626.</p>"
      },
      sub_specialities: [
        {
          en: "Family Medicine",
          ar: "\u0637\u0628 \u0627\u0644\u0623\u0633\u0631\u0629"
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19301
    },
    {
      id: "wp-18820",
      slug: "safa-mohamed",
      old_url: "",
      name: {
        en: "Dr. Safa Mohamed",
        ar: "\u062F. \u0635\u0641\u0627\u0621 \u0645\u062D\u0645\u062F"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Dedicated General Practitioner skilled in Family Medicine. over 5 years of comprehensive experience in Emergency Medicine.</p>",
        ar: "<p>\u0637\u0628\u064A\u0628 \u0639\u0627\u0645 \u0645\u0643\u0631\u0633 \u0645\u0627\u0647\u0631 \u0641\u064A \u0637\u0628 \u0627\u0644\u0623\u0633\u0631\u0629. \u0623\u0643\u062B\u0631 \u0645\u0646 5 \u0633\u0646\u0648\u0627\u062A \u0645\u0646 \u0627\u0644\u062E\u0628\u0631\u0629 \u0627\u0644\u0634\u0627\u0645\u0644\u0629 \u0641\u064A \u0637\u0628 \u0627\u0644\u0637\u0648\u0627\u0631\u0626.</p>"
      },
      sub_specialities: [
        {
          en: "Family Medicine",
          ar: "\u0637\u0628 \u0627\u0644\u0623\u0633\u0631\u0629"
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19330
    },
    {
      id: "wp-18819",
      slug: "ahmed-eldadah",
      old_url: "",
      name: {
        en: "Dr. Ahmed Eldadah",
        ar: "\u062F. \u0623\u062D\u0645\u062F \u0627\u0644\u062F\u0627\u062F\u0629"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Dedicated General Practitioner skilled in Family Medicine, ICU, ER. over 5 years of comprehensive experience in Emergency Medicine.</p>",
        ar: "<p>\u0637\u0628\u064A\u0628 \u0639\u0627\u0645 \u0645\u062E\u0635\u0635 \u0645\u062A\u062E\u0635\u0635 \u0641\u064A \u0637\u0628 \u0627\u0644\u0623\u0633\u0631\u0629\u060C \u0627\u0644\u0639\u0646\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629\u060C \u0642\u0633\u0645 \u0627\u0644\u0637\u0648\u0627\u0631\u0626. \u0623\u0643\u062B\u0631 \u0645\u0646 5 \u0633\u0646\u0648\u0627\u062A \u0645\u0646 \u0627\u0644\u062E\u0628\u0631\u0629 \u0627\u0644\u0634\u0627\u0645\u0644\u0629 \u0641\u064A \u0637\u0628 \u0627\u0644\u0637\u0648\u0627\u0631\u0626.</p>"
      },
      sub_specialities: [
        {
          en: "Family Medicine",
          ar: "\u0637\u0628 \u0627\u0644\u0623\u0633\u0631\u0629"
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19331
    },
    {
      id: "wp-18818",
      slug: "ahmed-basunbul",
      old_url: "",
      name: {
        en: "Dr. Ahmed Basunbul",
        ar: "\u062F. \u0623\u062D\u0645\u062F \u0628\u0627\u0633\u0646\u0628\u0648\u0644"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "internal-medicine"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Consultant of internal medicine heal of department with extensive experience in managing inpatient and outpatient cases. Skilled in clinical assessment, diagnostic, and treatment planning with strong focus on patient centered care. Proven leadership in medical teams and commitment to improving healthcare outcomes and operational efficiency.</p>",
        ar: "<p>\u0645\u0633\u062A\u0634\u0627\u0631 \u0637\u0628 \u0627\u0644\u0628\u0627\u0637\u0646\u064A \u0641\u064A \u0642\u0633\u0645 \u0627\u0644\u0637\u0628 \u0627\u0644\u0628\u0627\u0637\u0646\u064A \u0630\u0648 \u062E\u0628\u0631\u0629 \u0648\u0627\u0633\u0639\u0629 \u0641\u064A \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629 \u0648\u0627\u0644\u062E\u0627\u0631\u062C\u064A\u0629. \u0645\u0627\u0647\u0631 \u0641\u064A \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u060C \u0648\u0627\u0644\u062A\u0634\u062E\u064A\u0635\u060C \u0648\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0639\u0644\u0627\u062C \u0645\u0639 \u062A\u0631\u0643\u064A\u0632 \u0642\u0648\u064A \u0639\u0644\u0649 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062A\u064A \u062A\u0631\u0643\u0632 \u0639\u0644\u0649 \u0627\u0644\u0645\u0631\u064A\u0636. \u0642\u064A\u0627\u062F\u0629 \u0645\u062B\u0628\u062A\u0629 \u0641\u064A \u0627\u0644\u0641\u0631\u0642 \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u062A\u062D\u0633\u064A\u0646 \u0646\u062A\u0627\u0626\u062C \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0648\u0643\u0641\u0627\u0621\u0629 \u0627\u0644\u0639\u0645\u0644\u064A\u0627\u062A.</p>"
      },
      sub_specialities: [
        {
          en: "Complex Inpatient and Long-term Care cases",
          ar: "\u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0645\u0639\u0642\u062F\u0629 \u0641\u064A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629 \u0648\u0637\u0648\u064A\u0644\u0629 \u0627\u0644\u0623\u0645\u062F"
        },
        {
          en: "Long-Term Acute Care",
          ar: "\u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062D\u0627\u062F\u0629 \u0637\u0648\u064A\u0644\u0629 \u0627\u0644\u0623\u0645\u062F"
        },
        {
          en: "Geriatric Care",
          ar: "\u0631\u0639\u0627\u064A\u0629 \u0643\u0628\u0627\u0631 \u0627\u0644\u0633\u0646"
        }
      ],
      photo: "doctors/wp/ahmed-basunbul",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19304
    },
    {
      id: "wp-18816",
      slug: "abbas-khalid",
      old_url: "",
      name: {
        en: "Dr. Abbas Khalid",
        ar: "\u062F. \u0639\u0628\u0627\u0633 \u062E\u0627\u0644\u062F"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Diligent about addressing every need with conscientious and detail-oriented approach. Offering a passion for helping patients improve health and wellness. Serve diverse patient needs by providing high-quality, knowledgeable medical care for acute and chronic conditions. Highly experienced in tropical medicine and offering specialized support of critical issues. Respectful and articulate communicator skillful in handling sensitive issues with patients from different backgrounds.</p>",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Critical Cases",
          ar: ""
        },
        {
          en: "Family Medicine",
          ar: ""
        }
      ],
      photo: "doctors/wp/abbas-khalid",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19306
    },
    {
      id: "wp-18815",
      slug: "adnan-bahakam",
      old_url: "",
      name: {
        en: "Dr. Adnan Bahakam",
        ar: "\u062F. \u0639\u062F\u0646\u0627\u0646 \u0628\u0647\u0627\u0643\u0627\u0645"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "pmr"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>2016 to 2021: Residency program at ministry of health of Jordan in Al Bashir Hospital</p><p>June 2022 \u2013 Sep 2022: Locum PMR Specialist at CMRC Saudi Arabia, Al Dahran.</p><p>PMR Specialist Full-Time, effective 1st Oct 2022, at CMRC Saudi Arabia, Al Dahran.</p><p>Education &amp; Training:</p><p>Board certificate of physical medicine and rehabilitation from Jordan medical council, &amp;</p><p>2021, Obtained bachelor\u2019s degree of medicine &amp; surgery (MBBS) Graduated in 2014.</p>",
        ar: "<p>2016 \u0625\u0644\u0649 2021: \u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0625\u0642\u0627\u0645\u0629 \u0641\u064A \u0648\u0632\u0627\u0631\u0629 \u0627\u0644\u0635\u062D\u0629 \u0627\u0644\u0623\u0631\u062F\u0646\u064A\u0629 \u0641\u064A \u0645\u0633\u062A\u0634\u0641\u0649</p><p>\u0627\u0644\u0628\u0634\u064A\u0631 \u0645\u0646 \u064A\u0648\u0646\u064A\u0648 2022 \u2013 \u0633\u0628\u062A\u0645\u0628\u0631 2022: \u0623\u062E\u0635\u0627\u0626\u064A \u0628\u0645\u062B\u0627\u0628\u0629 PMR \u0645\u0624\u0642\u062A \u0641\u064A \u0645\u0631\u0643\u0632 CMRC \u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629\u060C \u0627\u0644\u062F\u0647\u0631\u0627\u0646.</p><p>\u0623\u062E\u0635\u0627\u0626\u064A PMR \u0628\u062F\u0648\u0627\u0645 \u0643\u0627\u0645\u0644\u060C \u0627\u0639\u062A\u0628\u0627\u0631\u0627 \u0645\u0646 1 \u0623\u0643\u062A\u0648\u0628\u0631 2022\u060C \u0641\u064A \u0645\u0631\u0643\u0632 CMRC \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629\u060C \u0627\u0644\u062F\u0647\u0631\u0627\u0646.</p><p>\u0627\u0644\u062A\u0639\u0644\u064A\u0645 \u0648\u0627\u0644\u062A\u062F\u0631\u064A\u0628:</p><p>\u0634\u0647\u0627\u062F\u0629 \u0645\u062C\u0644\u0633 \u0627\u0644\u0637\u0628 \u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0626\u064A \u0648\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0645\u0646 \u0627\u0644\u0645\u062C\u0644\u0633 \u0627\u0644\u0637\u0628\u064A \u0627\u0644\u0623\u0631\u062F\u0646\u064A\u060C \u06482021</p><p>\u060C \u062D\u0635\u0644 \u0639\u0644\u0649 \u062F\u0631\u062C\u0629 \u0627\u0644\u0628\u0643\u0627\u0644\u0648\u0631\u064A\u0648\u0633 \u0641\u064A \u0627\u0644\u0637\u0628 \u0648\u0627\u0644\u062C\u0631\u0627\u062D\u0629 (MBBS) \u0648\u062A\u062E\u0631\u062C \u0641\u064A 2014.</p>"
      },
      sub_specialities: [
        {
          en: "Sports Medicine",
          ar: "\u0637\u0628 \u0627\u0644\u0631\u064A\u0627\u0636\u0629"
        },
        {
          en: "Obesity",
          ar: "\u0627\u0644\u0633\u0645\u0646\u0629"
        },
        {
          en: "Amputation of Inferior Limbs Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0628\u062A\u0631 \u0627\u0644\u0623\u0637\u0631\u0627\u0641 \u0627\u0644\u0633\u0641\u0644\u064A\u0629"
        },
        {
          en: "Botox Injection",
          ar: "\u062D\u0642\u0646 \u0627\u0644\u0628\u0648\u062A\u0648\u0643\u0633"
        },
        {
          en: "Rheumatology",
          ar: "\u0627\u0644\u0631\u0648\u0645\u0627\u062A\u064A\u0632\u0645"
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19307
    },
    {
      id: "wp-18814",
      slug: "asmaa-alalay",
      old_url: "",
      name: {
        en: "Dr. Asmaa Alalay",
        ar: "\u062F. \u0623\u0633\u0645\u0627\u0621 \u0623\u0644\u0627\u0644\u0627\u064A"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "pmr"
      ],
      hospital_id: "",
      country: "",
      languages: [],
      bio: {
        en: "<p>Bachelor of Medicine and Surgery Cairo university ( 2008)</p><p>Master of Al \u2013 Azhar University</p><p>Master Thesis on the effect of obesity on the musculoskeletal system</p>",
        ar: "<p>\u0628\u0643\u0627\u0644\u0648\u0631\u064A\u0648\u0633 \u0627\u0644\u0637\u0628 \u0648\u0627\u0644\u062C\u0631\u0627\u062D\u0629 \u0645\u0646 \u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u0642\u0627\u0647\u0631\u0629 (2008)</p><p>\u0645\u0627\u062C\u0633\u062A\u064A\u0631 \u0645\u0627\u062C\u0633\u062A\u064A\u0631 \u062C\u0627\u0645\u0639\u0629</p><p>\u0627\u0644\u0623\u0632\u0647\u0631 \u062D\u0648\u0644 \u062A\u0623\u062B\u064A\u0631 \u0627\u0644\u0633\u0645\u0646\u0629 \u0639\u0644\u0649 \u0627\u0644\u062C\u0647\u0627\u0632 \u0627\u0644\u0639\u0636\u0644\u064A \u0627\u0644\u0647\u064A\u0643\u0644\u064A</p>"
      },
      sub_specialities: [
        {
          en: "Physical Rehabilitation",
          ar: "\u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0628\u062F\u0646\u064A"
        },
        {
          en: "Sports Medicine",
          ar: "\u0637\u0628 \u0627\u0644\u0631\u064A\u0627\u0636\u0629"
        },
        {
          en: "Obesity",
          ar: "\u0627\u0644\u0633\u0645\u0646\u0629"
        },
        {
          en: "Botox Injection",
          ar: "\u062D\u0642\u0646 \u0627\u0644\u0628\u0648\u062A\u0648\u0643\u0633"
        },
        {
          en: "Rheumatic Diseases",
          ar: "\u0623\u0645\u0631\u0627\u0636 \u0627\u0644\u0631\u0648\u0645\u0627\u062A\u064A\u0632\u0645"
        },
        {
          en: "Pain Management",
          ar: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0644\u0645"
        },
        {
          en: "Acupuncture Therapy",
          ar: "\u0627\u0644\u0639\u0644\u0627\u062C \u0628\u0627\u0644\u0625\u0628\u0631 \u0627\u0644\u0635\u064A\u0646\u064A\u0629"
        }
      ],
      photo: "doctors/wp/asmaa-alalay",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19308
    },
    {
      id: "wp-18813",
      slug: "mohamed-fathi",
      old_url: "",
      name: {
        en: "Dr. Mohamed Fathi",
        ar: "\u062F. \u0645\u062D\u0645\u062F \u0641\u062A\u062D\u064A"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Medical Doctor</p><p>CMRC Saudi Arabia \xB7 Full-time</p><p>Feb 2020 \u2013 Present \xB7 6 yrs 6 mos</p>",
        ar: "<p>\u0637\u0628\u064A\u0628</p><p>CMRC \u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629 \xB7 \u062F\u0648\u0627\u0645</p><p>\u0643\u0627\u0645\u0644 \u0641\u0628\u0631\u0627\u064A\u0631 2020 \u2013 \u062D\u062A\u0649 \u0627\u0644\u0622\u0646 \xB7 6 \u0633\u0646\u0648\u0627\u062A 6 \u0623\u0634\u0647\u0631</p>"
      },
      sub_specialities: [
        {
          en: "Family Medicine",
          ar: "\u0637\u0628 \u0627\u0644\u0623\u0633\u0631\u0629"
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19332
    },
    {
      id: "wp-18751",
      slug: "safa-alsayed",
      old_url: "",
      name: {
        en: "Dr. Safa Alsayed",
        ar: "\u062F. \u0635\u0641\u0627\u0621 \u0627\u0644\u0633\u064A\u062F"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Dr. Safa Alsayed provides comprehensive pediatric care in inpatient, outpatient, and emergency settings, including cerebral palsy, trauma rehab, and critical care.</p>",
        ar: "<p>\u062A\u0642\u062F\u064A\u0645 \u0631\u0639\u0627\u064A\u0629 \u0637\u0628\u064A\u0629 \u0634\u0627\u0645\u0644\u0629 \u0644\u0644\u0623\u0637\u0641\u0627\u0644 \u0641\u064A \u0628\u064A\u0626\u0627\u062A \u0627\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u064A\u0646 \u0648\u0627\u0644\u0639\u064A\u0627\u062F\u0627\u062A \u0627\u0644\u062E\u0627\u0631\u062C\u064A\u0629 \u0648\u0627\u0644\u0637\u0648\u0627\u0631\u0626. \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0645\u0639\u0642\u062F\u0629 \u0628\u0645\u0627 \u0641\u064A \u0630\u0644\u0643 \u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u0627\u0644\u0645\u0635\u0627\u0628\u064A\u0646 \u0628\u0627\u0644\u0634\u0644\u0644 \u0627\u0644\u062F\u0645\u0627\u063A\u064A\u060C \u0648\u0636\u0645\u0627\u0646 \u062E\u0637\u0637 \u0631\u0639\u0627\u064A\u0629 \u0634\u0627\u0645\u0644\u0629 \u062A\u0634\u0645\u0644 \u0627\u0644\u0639\u0644\u0627\u062C \u0627\u0644\u0637\u0628\u064A\u060C \u0648\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644\u060C \u0648\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0641\u0631\u064A\u0642 \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A.</p><p>\u0625\u062F\u0627\u0631\u0629 \u0645\u0631\u0636\u0649 \u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u0628\u0639\u062F \u0627\u0644\u0635\u062F\u0645\u0629 \u0644\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644\u060C \u0645\u0639 \u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0639\u0644\u0649 \u0627\u0644\u062A\u0639\u0627\u0641\u064A \u0627\u0644\u0648\u0638\u064A\u0641\u064A\u060C \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0644\u0645\u060C \u0648\u0627\u0644\u0646\u062A\u0627\u0626\u062C \u0627\u0644\u0635\u062D\u064A\u0629 \u0637\u0648\u064A\u0644\u0629 \u0627\u0644\u0623\u0645\u062F. \u0625\u062F\u0627\u0631\u0629 \u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0637\u0648\u0627\u0631\u0626 \u0627\u0644\u0623\u0637\u0641\u0627\u0644. \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u0627\u0644\u0645\u0631\u0636\u0649 \u0628\u0634\u062F\u0629 \u0639\u0644\u0649 \u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u062A\u0646\u0641\u0633 \u0627\u0644\u0635\u0646\u0627\u0639\u064A \u0627\u0644\u0645\u064A\u0643\u0627\u0646\u064A\u0643\u064A\u0629.</p><p>\u0627\u0644\u062A\u0639\u0627\u0648\u0646 \u0645\u0639 \u0623\u062E\u0635\u0627\u0626\u064A\u064A \u0627\u0644\u0639\u0644\u0627\u062C \u0627\u0644\u0637\u0628\u064A\u0639\u064A\u060C \u0648\u0627\u0644\u0645\u0639\u0627\u0644\u062C\u064A\u0646 \u0627\u0644\u0648\u0638\u064A\u0641\u064A\u064A\u0646\u060C \u0648\u0623\u062E\u0635\u0627\u0626\u064A\u064A \u0627\u0644\u0646\u0637\u0642\u060C \u0648\u0623\u062E\u0635\u0627\u0626\u064A\u064A \u0627\u0644\u062A\u0623\u0647\u064A\u0644. \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629 \u0641\u064A \u062C\u0648\u0644\u0627\u062A \u0627\u0644\u062C\u0646\u0627\u062D\u064A\u0646\u060C \u0648\u0645\u0646\u0627\u0642\u0634\u0627\u062A \u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A\u060C \u0648\u0627\u0644\u0627\u0633\u062A\u0634\u0627\u0631\u0627\u062A \u0627\u0644\u0623\u0633\u0631\u064A\u0629 \u0644\u062F\u0639\u0645 \u0627\u062A\u062E\u0627\u0630 \u0627\u0644\u0642\u0631\u0627\u0631 \u0627\u0644\u0645\u0633\u062A\u0646\u064A\u0631.</p>"
      },
      sub_specialities: [
        {
          en: "Physical Rehabilitation",
          ar: "\u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0628\u062F\u0646\u064A"
        },
        {
          en: "Spinal Cord Injury Care",
          ar: "\u0631\u0639\u0627\u064A\u0629 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062D\u0628\u0644 \u0627\u0644\u0634\u0648\u0643\u064A"
        },
        {
          en: "Brain Injury Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062F\u0645\u0627\u063A"
        },
        {
          en: "Sports Injury Treatment",
          ar: "\u0639\u0644\u0627\u062C \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u0631\u064A\u0627\u0636\u0629"
        },
        {
          en: "EMG & Nerve Studies",
          ar: "\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0639\u0636\u0644\u0627\u062A \u0648\u062F\u0631\u0627\u0633\u0627\u062A \u0627\u0644\u0623\u0639\u0635\u0627\u0628"
        },
        {
          en: "Pain Management",
          ar: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0644\u0645"
        },
        {
          en: "Acupuncture Therapy",
          ar: "\u0627\u0644\u0639\u0644\u0627\u062C \u0628\u0627\u0644\u0625\u0628\u0631 \u0627\u0644\u0635\u064A\u0646\u064A\u0629"
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 19312
    },
    {
      id: "wp-19656",
      slug: "bader-al-qahtani",
      old_url: "",
      name: {
        en: "Dr. Bader Al Qahtani",
        ar: "\u062F. \u0628\u062F\u0631 \u0627\u0644\u0642\u062D\u0637\u0627\u0646\u064A"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Bader Abdulrahman Ahmed Shuhail Al Qahtani provides general medical services with a strong emphasis on urgent care and emergency-driven patient management.</p><p>His scope includes rapid clinical assessment, stabilization of acute conditions, and delivery of timely medical interventions. He also supports operational aspects of care by contributing to protocol development, ensuring readiness for emergency scenarios, and collaborating with multidisciplinary teams to deliver efficient and high-quality patient care in line with clinical governance standards.</p>",
        ar: "<p>\u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u0628\u062F\u0631 \u0639\u0628\u062F \u0627\u0644\u0631\u062D\u0645\u0646 \u0623\u062D\u0645\u062F \u0634\u0647\u064A\u0644 \u0627\u0644\u0642\u062D\u0637\u0627\u0646\u064A \u064A\u0642\u062F\u0645 \u062E\u062F\u0645\u0627\u062A \u0637\u0628\u064A\u0629 \u0639\u0627\u0645\u0629 \u0645\u0639 \u062A\u0631\u0643\u064A\u0632 \u0642\u0648\u064A \u0639\u0644\u0649 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0639\u0627\u062C\u0644\u0629 \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u0645\u062F\u0641\u0648\u0639\u064A\u0646 \u0628\u0627\u0644\u0637\u0648\u0627\u0631\u0626.</p><p>\u064A\u0634\u0645\u0644 \u0646\u0637\u0627\u0642 \u0639\u0645\u0644\u0647 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0633\u0631\u064A\u0631\u064A \u0627\u0644\u0633\u0631\u064A\u0639\u060C \u0648\u062A\u062B\u0628\u064A\u062A \u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u062D\u0627\u062F\u0629\u060C \u0648\u062A\u0642\u062F\u064A\u0645 \u0627\u0644\u062A\u062F\u062E\u0644\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0641\u064A \u0627\u0644\u0648\u0642\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628. \u0643\u0645\u0627 \u064A\u062F\u0639\u0645 \u0627\u0644\u062C\u0648\u0627\u0646\u0628 \u0627\u0644\u062A\u0634\u063A\u064A\u0644\u064A\u0629 \u0644\u0644\u0631\u0639\u0627\u064A\u0629 \u0645\u0646 \u062E\u0644\u0627\u0644 \u0627\u0644\u0645\u0633\u0627\u0647\u0645\u0629 \u0641\u064A \u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u0628\u0631\u0648\u062A\u0648\u0643\u0648\u0644\u0627\u062A\u060C \u0648\u0636\u0645\u0627\u0646 \u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F \u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0637\u0648\u0627\u0631\u0626\u060C \u0648\u0627\u0644\u062A\u0639\u0627\u0648\u0646 \u0645\u0639 \u0641\u0631\u0642 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0644\u062A\u0642\u062F\u064A\u0645 \u0631\u0639\u0627\u064A\u0629 \u0641\u0639\u0627\u0644\u0629 \u0648\u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u062C\u0648\u062F\u0629 \u0644\u0644\u0645\u0631\u0636\u0649 \u0628\u0645\u0627 \u064A\u062A\u0645\u0627\u0634\u0649 \u0645\u0639 \u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u062D\u0648\u0643\u0645\u0629 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629.</p>"
      },
      sub_specialities: [],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 20033
    },
    {
      id: "wp-19655",
      slug: "khalifa-swidan",
      old_url: "",
      name: {
        en: "Dr. Khalifa Swidan",
        ar: "\u062F. \u062E\u0644\u064A\u0641\u0629 \u0633\u0648\u064A\u062F\u0627\u0646"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Khalifa Abdul Razik Khalifa Swidan provides comprehensive medical care within inpatient and long-term care settings, focusing on patients with complex and rehabilitation needs.</p><p>His scope includes detailed clinical evaluation, development and implementation of individualized care plans, and monitoring of patients requiring continuous medical support. He contributes to coordinated care delivery by working closely with specialized teams, ensuring adherence to clinical pathways, and maintaining high standards of patient safety and quality of care.</p>",
        ar: "<p>\u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u062E\u0644\u064A\u0641\u0629 \u0639\u0628\u062F \u0627\u0644\u0631\u0627\u0632\u0642 \u062E\u0644\u064A\u0641\u0629 \u0633\u0648\u064A\u062F\u0627\u0646 \u064A\u0642\u062F\u0645 \u0631\u0639\u0627\u064A\u0629 \u0637\u0628\u064A\u0629 \u0634\u0627\u0645\u0644\u0629 \u0636\u0645\u0646 \u0628\u064A\u0626\u0627\u062A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629 \u0648\u0637\u0648\u064A\u0644\u0629 \u0627\u0644\u0623\u0645\u062F\u060C \u0645\u0639 \u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0639\u0644\u0649 \u0627\u0644\u0645\u0631\u0636\u0649 \u0630\u0648\u064A \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u062C\u0627\u062A \u0627\u0644\u0645\u0639\u0642\u062F\u0629 \u0648\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0623\u0647\u064A\u0644.</p><p>\u064A\u0634\u0645\u0644 \u0646\u0637\u0627\u0642 \u0639\u0645\u0644\u0647 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0633\u0631\u064A\u0631\u064A \u0627\u0644\u062A\u0641\u0635\u064A\u0644\u064A\u060C \u0648\u062A\u0637\u0648\u064A\u0631 \u0648\u062A\u0646\u0641\u064A\u0630 \u062E\u0637\u0637 \u0631\u0639\u0627\u064A\u0629 \u0641\u0631\u062F\u064A\u0629\u060C \u0648\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u0630\u064A\u0646 \u064A\u062D\u062A\u0627\u062C\u0648\u0646 \u0625\u0644\u0649 \u062F\u0639\u0645 \u0637\u0628\u064A \u0645\u0633\u062A\u0645\u0631. \u064A\u0633\u0627\u0647\u0645 \u0641\u064A \u062A\u0646\u0633\u064A\u0642 \u062A\u0642\u062F\u064A\u0645 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0645\u0646 \u062E\u0644\u0627\u0644 \u0627\u0644\u0639\u0645\u0644 \u0639\u0646 \u0643\u062B\u0628 \u0645\u0639 \u0641\u0631\u0642 \u0645\u062A\u062E\u0635\u0635\u0629\u060C \u0648\u0636\u0645\u0627\u0646 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629\u060C \u0648\u0627\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0645\u0639\u0627\u064A\u064A\u0631 \u0639\u0627\u0644\u064A\u0629 \u0644\u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0648\u062C\u0648\u062F\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629.</p>"
      },
      sub_specialities: [],
      photo: "doctors/wp/khalifa-swidan",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 20035
    },
    {
      id: "wp-19654",
      slug: "asma-mohamed",
      old_url: "",
      name: {
        en: "Dr. Asma Mohamed",
        ar: "\u062F. \u0623\u0633\u0645\u0627\u0621 \u0645\u062D\u0645\u062F"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Asma Ahmed Osman Mohamed provides inpatient medical care with a focus on the management of high-dependency and long-term patients.</p><p>Her scope includes ongoing clinical evaluation, supporting ventilated and medically complex patients, and contributing to structured care plans aimed at stabilization and recovery. She works within a multidisciplinary framework to ensure coordinated care delivery, accurate clinical documentation, and compliance with established patient safety and quality standards.</p>",
        ar: "<p>\u0627\u0644\u062F\u0643\u062A\u0648\u0631\u0629 \u0623\u0633\u0645\u0627\u0621 \u0623\u062D\u0645\u062F \u0639\u062B\u0645\u0627\u0646 \u0645\u062D\u0645\u062F \u062A\u0642\u062F\u0645 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629 \u0645\u0639 \u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0639\u0644\u0649 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0630\u0648\u064A \u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u0639\u0627\u0644\u064A \u0648\u0627\u0644\u0645\u0631\u0636\u0649 \u0637\u0648\u064A\u0644 \u0627\u0644\u0623\u0645\u062F.</p><p>\u064A\u0634\u0645\u0644 \u0646\u0637\u0627\u0642 \u0639\u0645\u0644\u0647\u0627 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0633\u0631\u064A\u0631\u064A \u0627\u0644\u0645\u0633\u062A\u0645\u0631\u060C \u0648\u062F\u0639\u0645 \u0627\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u0630\u064A\u0646 \u062A\u0645 \u0627\u0644\u062A\u0646\u0641\u0633 \u0627\u0644\u0635\u0646\u0627\u0639\u064A \u0648\u0627\u0644\u0645\u0631\u0636\u0649 \u0630\u0648\u064A \u0627\u0644\u062A\u0646\u0641\u0633 \u0627\u0644\u0637\u0628\u064A \u0627\u0644\u0645\u0639\u0642\u062F\u060C \u0648\u0627\u0644\u0645\u0633\u0627\u0647\u0645\u0629 \u0641\u064A \u062E\u0637\u0637 \u0631\u0639\u0627\u064A\u0629 \u0645\u0646\u0638\u0645\u0629 \u062A\u0647\u062F\u0641 \u0625\u0644\u0649 \u0627\u0644\u0627\u0633\u062A\u0642\u0631\u0627\u0631 \u0648\u0627\u0644\u062A\u0639\u0627\u0641\u064A. \u062A\u0639\u0645\u0644 \u0636\u0645\u0646 \u0625\u0637\u0627\u0631 \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0644\u0636\u0645\u0627\u0646 \u062A\u0646\u0633\u064A\u0642 \u062A\u0642\u062F\u064A\u0645 \u0627\u0644\u0631\u0639\u0627\u064A\u0629\u060C \u0648\u0627\u0644\u062A\u0648\u062B\u064A\u0642 \u0627\u0644\u0633\u0631\u064A\u0631\u064A \u0627\u0644\u062F\u0642\u064A\u0642\u060C \u0648\u0627\u0644\u0627\u0645\u062A\u062B\u0627\u0644 \u0644\u0645\u0639\u0627\u064A\u064A\u0631 \u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0648\u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629.</p>"
      },
      sub_specialities: [],
      photo: "doctors/wp/asma-mohamed",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 20034
    },
    {
      id: "wp-18826",
      slug: "asmaa-abdullah",
      old_url: "",
      name: {
        en: "Dr. Asmaa Abdullah",
        ar: "\u062F. \u0623\u0633\u0645\u0627\u0621 \u0639\u0628\u062F \u0627\u0644\u0644\u0647"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>Strong commitment to patient care and clinical excellence, plays a key role in supporting multidisciplinary healthcare services and delivering high-quality medical care.</p>",
        ar: "<p>\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0627\u0644\u0642\u0648\u064A \u0628\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0648\u0627\u0644\u062A\u0645\u064A\u0632 \u0627\u0644\u0633\u0631\u064A\u0631\u064A \u064A\u0644\u0639\u0628 \u062F\u0648\u0631\u0627 \u0631\u0626\u064A\u0633\u064A\u0627 \u0641\u064A \u062F\u0639\u0645 \u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0648\u062A\u0642\u062F\u064A\u0645 \u0631\u0639\u0627\u064A\u0629 \u0637\u0628\u064A\u0629 \u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u062C\u0648\u062F\u0629.</p>"
      },
      sub_specialities: [
        {
          en: "Physical Rehabilitation",
          ar: "\u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0628\u062F\u0646\u064A"
        },
        {
          en: "Spinal Cord Injury Care",
          ar: "\u0631\u0639\u0627\u064A\u0629 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062D\u0628\u0644 \u0627\u0644\u0634\u0648\u0643\u064A"
        },
        {
          en: "Brain Injury Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062F\u0645\u0627\u063A"
        },
        {
          en: "Sports Injury Treatment",
          ar: "\u0639\u0644\u0627\u062C \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u0631\u064A\u0627\u0636\u0629"
        },
        {
          en: "EMG & Nerve Studies",
          ar: "\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0639\u0636\u0644\u0627\u062A \u0648\u062F\u0631\u0627\u0633\u0627\u062A \u0627\u0644\u0623\u0639\u0635\u0627\u0628"
        },
        {
          en: "Pain Management",
          ar: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0644\u0645"
        },
        {
          en: "Acupuncture Therapy",
          ar: "\u0627\u0644\u0639\u0644\u0627\u062C \u0628\u0627\u0644\u0625\u0628\u0631 \u0627\u0644\u0635\u064A\u0646\u064A\u0629"
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-19653",
      slug: "tamer-eissa",
      old_url: "",
      name: {
        en: "Dr. Tamer Eissa",
        ar: "\u062F. \u062A\u0627\u0645\u0631 \u0639\u064A\u0633\u0649"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Tamer Mohamed Helmy Mohamed Eissa provides comprehensive medical care with a strong emphasis on inpatient and critical care services.</p><p>His scope includes conducting detailed clinical evaluations, supporting the management of complex and high-risk patients, and assisting in the delivery of advanced medical interventions. He plays an active role in monitoring patient progress, facilitating multidisciplinary coordination, and ensuring that care delivery aligns with clinical protocols, safety regulations, and quality standards.</p>",
        ar: "<p>\u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u062A\u0627\u0645\u0631 \u0645\u062D\u0645\u062F \u062D\u0644\u0645\u064A \u0645\u062D\u0645\u062F \u0639\u064A\u0633\u0649 \u064A\u0642\u062F\u0645 \u0631\u0639\u0627\u064A\u0629 \u0637\u0628\u064A\u0629 \u0634\u0627\u0645\u0644\u0629 \u0645\u0639 \u062A\u0631\u0643\u064A\u0632 \u0642\u0648\u064A \u0639\u0644\u0649 \u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629 \u0648\u0627\u0644\u0639\u0646\u0627\u064A\u0629 \u0627\u0644\u062D\u0631\u062C\u0629.</p><p>\u064A\u0634\u0645\u0644 \u0646\u0637\u0627\u0642 \u0639\u0645\u0644\u0647 \u0625\u062C\u0631\u0627\u0621 \u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0633\u0631\u064A\u0631\u064A\u0629 \u0645\u0641\u0635\u0644\u0629\u060C \u0648\u062F\u0639\u0645 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u0645\u0639\u0642\u062F\u064A\u0646 \u0648\u0630\u0648\u064A \u0627\u0644\u0645\u062E\u0627\u0637\u0631 \u0627\u0644\u0639\u0627\u0644\u064A\u0629\u060C \u0648\u0627\u0644\u0645\u0633\u0627\u0639\u062F\u0629 \u0641\u064A \u062A\u0642\u062F\u064A\u0645 \u0627\u0644\u062A\u062F\u062E\u0644\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0645\u062A\u0642\u062F\u0645\u0629. \u064A\u0644\u0639\u0628 \u062F\u0648\u0631\u0627 \u0646\u0634\u0637\u0627 \u0641\u064A \u0645\u0631\u0627\u0642\u0628\u0629 \u062A\u0642\u062F\u0645 \u0627\u0644\u0645\u0631\u0636\u0649\u060C \u0648\u062A\u0633\u0647\u064A\u0644 \u0627\u0644\u062A\u0646\u0633\u064A\u0642 \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A\u060C \u0648\u0636\u0645\u0627\u0646 \u062A\u0648\u0627\u0641\u0642 \u062A\u0642\u062F\u064A\u0645 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0645\u0639 \u0627\u0644\u0628\u0631\u0648\u062A\u0648\u0643\u0648\u0644\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629\u060C \u0648\u0644\u0648\u0627\u0626\u062D \u0627\u0644\u0633\u0644\u0627\u0645\u0629\u060C \u0648\u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u062C\u0648\u062F\u0629.</p>"
      },
      sub_specialities: [],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 20036
    },
    {
      id: "wp-19652",
      slug: "ahmed-elenani",
      old_url: "",
      name: {
        en: "Dr. Ahmed Elenani",
        ar: "\u062F. \u0623\u062D\u0645\u062F \u0625\u0644\u064A\u0646\u0627\u0646\u064A"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Strong commitment to patient care and clinical excellence, plays a key role in supporting multidisciplinary healthcare services and delivering high-quality medical care.</p>",
        ar: "<p>\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0627\u0644\u0642\u0648\u064A \u0628\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0648\u0627\u0644\u062A\u0645\u064A\u0632 \u0627\u0644\u0633\u0631\u064A\u0631\u064A \u064A\u0644\u0639\u0628 \u062F\u0648\u0631\u0627 \u0631\u0626\u064A\u0633\u064A\u0627 \u0641\u064A \u062F\u0639\u0645 \u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0648\u062A\u0642\u062F\u064A\u0645 \u0631\u0639\u0627\u064A\u0629 \u0637\u0628\u064A\u0629 \u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u062C\u0648\u062F\u0629.</p>"
      },
      sub_specialities: [
        {
          en: "Physical Rehabilitation",
          ar: "\u0627\u0644\u062A\u0623\u0647\u064A\u0644 \u0627\u0644\u0628\u062F\u0646\u064A"
        },
        {
          en: "Spinal Cord Injury Care",
          ar: "\u0631\u0639\u0627\u064A\u0629 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062D\u0628\u0644 \u0627\u0644\u0634\u0648\u0643\u064A"
        },
        {
          en: "Brain Injury Rehabilitation",
          ar: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0623\u0647\u064A\u0644 \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u062F\u0645\u0627\u063A"
        },
        {
          en: "Sports Injury Treatment",
          ar: "\u0639\u0644\u0627\u062C \u0625\u0635\u0627\u0628\u0627\u062A \u0627\u0644\u0631\u064A\u0627\u0636\u0629"
        },
        {
          en: "EMG & Nerve Studies",
          ar: "\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0639\u0636\u0644\u0627\u062A \u0648\u062F\u0631\u0627\u0633\u0627\u062A \u0627\u0644\u0623\u0639\u0635\u0627\u0628"
        },
        {
          en: "Pain Management",
          ar: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u0644\u0645"
        },
        {
          en: "Acupuncture Therapy",
          ar: "\u0627\u0644\u0639\u0644\u0627\u062C \u0628\u0627\u0644\u0625\u0628\u0631 \u0627\u0644\u0635\u064A\u0646\u064A\u0629"
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 20040
    },
    {
      id: "wp-19651",
      slug: "youssef-haggag",
      old_url: "",
      name: {
        en: "Dr. Youssef Haggag",
        ar: "\u062F. \u064A\u0648\u0633\u0641 \u062D\u062C\u0627\u062C"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Youssef Ibrahim Youssef Haggag provides specialized intensive care services focused on the management of critically ill patients requiring advanced organ support and continuous monitoring.</p><p>His scope includes delivering complex critical care interventions, guiding treatment decisions for high-risk patients, and overseeing clinical stability through evidence-based protocols. He plays an active role in coordinating ICU care, ensuring adherence to safety and quality frameworks, and supporting multidisciplinary teams in delivering high-acuity, patient-centered care.</p>",
        ar: "<p>\u064A\u0642\u062F\u0645 \u0627\u0644\u062F\u0643\u062A\u0648\u0631 \u064A\u0648\u0633\u0641 \u0625\u0628\u0631\u0627\u0647\u064A\u0645 \u064A\u0648\u0633\u0641 \u062D\u062C\u0627\u062C \u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0639\u0646\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629 \u0627\u0644\u0645\u062A\u062E\u0635\u0635\u0629 \u0627\u0644\u062A\u064A \u062A\u0631\u0643\u0632 \u0639\u0644\u0649 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0636\u0649 \u0641\u064A \u062D\u0627\u0644\u0629 \u062D\u0631\u062C\u0629 \u0627\u0644\u0630\u064A\u0646 \u064A\u062D\u062A\u0627\u062C\u0648\u0646 \u0625\u0644\u0649 \u062F\u0639\u0645 \u0645\u062A\u0642\u062F\u0645 \u0644\u0644\u0623\u0639\u0636\u0627\u0621 \u0648\u0645\u0631\u0627\u0642\u0628\u0629 \u0645\u0633\u062A\u0645\u0631\u0629.</p><p>\u064A\u0634\u0645\u0644 \u0646\u0637\u0627\u0642 \u0639\u0645\u0644\u0647 \u062A\u0642\u062F\u064A\u0645 \u062A\u062F\u062E\u0644\u0627\u062A \u0645\u0639\u0642\u062F\u0629 \u0641\u064A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062D\u0631\u062C\u0629\u060C \u0648\u062A\u0648\u062C\u064A\u0647 \u0642\u0631\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0644\u0627\u062C \u0644\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u0645\u0639\u0631\u0636\u064A\u0646 \u0644\u062E\u0637\u0631 \u0639\u0627\u0644\u064A\u060C \u0648\u0627\u0644\u0625\u0634\u0631\u0627\u0641 \u0639\u0644\u0649 \u0627\u0644\u0627\u0633\u062A\u0642\u0631\u0627\u0631 \u0627\u0644\u0633\u0631\u064A\u0631\u064A \u0645\u0646 \u062E\u0644\u0627\u0644 \u0628\u0631\u0648\u062A\u0648\u0643\u0648\u0644\u0627\u062A \u0645\u0628\u0646\u064A\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u062F\u0644\u0629. \u064A\u0644\u0639\u0628 \u062F\u0648\u0631\u0627 \u0646\u0634\u0637\u0627 \u0641\u064A \u062A\u0646\u0633\u064A\u0642 \u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0639\u0646\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629\u060C \u0648\u0636\u0645\u0627\u0646 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0623\u0637\u0631 \u0627\u0644\u0633\u0644\u0627\u0645\u0629 \u0648\u0627\u0644\u062C\u0648\u062F\u0629\u060C \u0648\u062F\u0639\u0645 \u0627\u0644\u0641\u0631\u0642 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0641\u064A \u062A\u0642\u062F\u064A\u0645 \u0631\u0639\u0627\u064A\u0629 \u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u062D\u062F\u0629 \u062A\u0631\u0643\u0632 \u0639\u0644\u0649 \u0627\u0644\u0645\u0631\u064A\u0636.</p>"
      },
      sub_specialities: [],
      photo: "doctors/wp/youssef-haggag",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 20037
    },
    {
      id: "wp-19650",
      slug: "isra-adam",
      old_url: "",
      name: {
        en: "Dr. Isra Adam",
        ar: "\u062F. \u0625\u0633\u0631\u0627 \u0622\u062F\u0645"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "pediatric"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Isra Abdelrahim Mohamedo Adam delivers specialized pediatric services centered on comprehensive child health management, including acute care, chronic disease follow-up, and developmental surveillance.</p><p>Her role encompasses clinical evaluation, formulation of tailored treatment strategies, and provision of preventive and wellness care such as immunization and growth monitoring. She actively participates in stabilizing pediatric emergencies, coordinates referrals when higher levels of care are required, and works collaboratively within multidisciplinary teams to ensure holistic, evidence-based care aligned with established clinical standards.</p>",
        ar: "<p>\u062A\u0642\u062F\u0645 \u0627\u0644\u062F\u0643\u062A\u0648\u0631\u0629 \u0625\u0633\u0631\u0627\u0621 \u0639\u0628\u062F \u0627\u0644\u0631\u062D\u064A\u0645 \u0645\u062D\u0645\u062F\u0648 \u0622\u062F\u0645 \u062E\u062F\u0645\u0627\u062A \u0645\u062A\u062E\u0635\u0635\u0629 \u0641\u064A \u0637\u0628 \u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u062A\u0631\u0643\u0632 \u0639\u0644\u0649 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0634\u0627\u0645\u0644\u0629 \u0644\u0635\u062D\u0629 \u0627\u0644\u0637\u0641\u0644\u060C \u0628\u0645\u0627 \u0641\u064A \u0630\u0644\u0643 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u062D\u0627\u062F\u0629\u060C \u0648\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0623\u0645\u0631\u0627\u0636 \u0627\u0644\u0645\u0632\u0645\u0646\u0629\u060C \u0648\u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u0646\u0645\u0648\u064A\u0629.</p><p>\u064A\u0634\u0645\u0644 \u062F\u0648\u0631\u0647\u0627 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u060C \u0648\u0648\u0636\u0639 \u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0627\u062A \u0639\u0644\u0627\u062C\u064A\u0629 \u0645\u062E\u0635\u0635\u0629\u060C \u0648\u062A\u0642\u062F\u064A\u0645 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0648\u0642\u0627\u0626\u064A\u0629 \u0648\u0627\u0644\u0635\u062D\u064A\u0629 \u0645\u062B\u0644 \u0627\u0644\u062A\u0637\u0639\u064A\u0645 \u0648\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u0646\u0645\u0648. \u062A\u0634\u0627\u0631\u0643 \u0628\u0646\u0634\u0627\u0637 \u0641\u064A \u0627\u0633\u062A\u0642\u0631\u0627\u0631 \u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0637\u0648\u0627\u0631\u0626 \u0644\u0644\u0623\u0637\u0641\u0627\u0644\u060C \u0648\u062A\u0646\u0633\u0642 \u0627\u0644\u0625\u062D\u0627\u0644\u0627\u062A \u0639\u0646\u062F \u0627\u0644\u062D\u0627\u062C\u0629 \u0625\u0644\u0649 \u0645\u0633\u062A\u0648\u064A\u0627\u062A \u0631\u0639\u0627\u064A\u0629 \u0623\u0639\u0644\u0649\u060C \u0648\u062A\u0639\u0645\u0644 \u0628\u0634\u0643\u0644 \u062A\u0639\u0627\u0648\u0646\u064A \u0636\u0645\u0646 \u0641\u0631\u0642 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0644\u0636\u0645\u0627\u0646 \u0631\u0639\u0627\u064A\u0629 \u0634\u0627\u0645\u0644\u0629 \u0642\u0627\u0626\u0645\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u062F\u0644\u0629 \u062A\u062A\u0645\u0627\u0634\u0649 \u0645\u0639 \u0627\u0644\u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629.</p>"
      },
      sub_specialities: [],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 20038
    },
    {
      id: "wp-18823",
      slug: "walaa-elgheriany",
      old_url: "",
      name: {
        en: "Dr. Walaa Elgheriany",
        ar: "\u062F. \u0648\u0644\u0627\u0621 \u0627\u0644\u063A\u0631\u064A\u0627\u0646\u064A"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "internal-medicine"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "<p>An accomplished Internal Medicine specialist with over 15 years of clinical experience, holding valid medical licenses to practice in both Saudi Arabia and Egypt. Possesses a PhD degree in Internal Medicine, with a subspecialty focus in Hematology, reflecting a deep commitment to advancing medical knowledge and expertise in this field.</p><p>Completed a rigorous residency in Internal Medicine in Egypt from 2013 to 2015, followed by a Master\u2019s degree with a hematology subspecialization. Between 2015 and 2018, successfully undertook and passed MD examinations in Internal Medicine while conducting research and developing a thesis, demonstrating strong academic and clinical proficiency.</p><p>Brings extensive experience in managing complex cases in Long-Term Care (LTC) units, with a decade of dedicated service in this setting, ensuring comprehensive care of chronically ill and elderly patients. Currently engaged as an acting Internal Medicine consultant, applying advanced diagnostic and therapeutic skills to improve patient outcomes.</p><p>The combination of advanced academic qualifications, hands-on clinical experience, and subspecialty training in hematology equips this specialist to provide expert care across a wide range of internal medicine conditions, including blood disorders, chronic diseases, and acute medical issues.</p>",
        ar: "<p>\u0623\u062E\u0635\u0627\u0626\u064A \u0637\u0628 \u062F\u0627\u062E\u0644\u064A \u0645\u062A\u0645\u0631\u0633 \u064A\u062A\u0645\u062A\u0639 \u0628\u062E\u0628\u0631\u0629 \u0633\u0631\u064A\u0631\u064A\u0629 \u062A\u0632\u064A\u062F \u0639\u0646 15 \u0639\u0627\u0645\u0627\u060C \u0648\u064A\u062D\u0645\u0644 \u062A\u0631\u0627\u062E\u064A\u0635 \u0637\u0628\u064A\u0629 \u0633\u0627\u0631\u064A\u0629 \u0644\u0645\u0645\u0627\u0631\u0633\u0629 \u0627\u0644\u0645\u0647\u0646\u0629 \u0641\u064A \u0643\u0644 \u0645\u0646 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629 \u0648\u0645\u0635\u0631. \u064A\u062D\u0645\u0644 \u062F\u0631\u062C\u0629 \u0627\u0644\u062F\u0643\u062A\u0648\u0631\u0627\u0647 \u0641\u064A \u0627\u0644\u0637\u0628 \u0627\u0644\u0628\u0627\u0637\u0646\u064A\u060C \u0645\u0639 \u062A\u0631\u0643\u064A\u0632 \u062A\u062E\u0635\u0635\u064A \u0641\u0631\u0639\u064A \u0641\u064A \u0623\u0645\u0631\u0627\u0636 \u0627\u0644\u062F\u0645\u060C \u0645\u0645\u0627 \u064A\u0639\u0643\u0633 \u0627\u0644\u062A\u0632\u0627\u0645\u0627 \u0639\u0645\u064A\u0642\u0627 \u0628\u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u0645\u0639\u0631\u0641\u0629 \u0648\u0627\u0644\u062E\u0628\u0631\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0645\u062C\u0627\u0644.</p><p>\u0623\u0643\u0645\u0644 \u0625\u0642\u0627\u0645\u0629 \u0635\u0627\u0631\u0645\u0629 \u0641\u064A \u0627\u0644\u0637\u0628 \u0627\u0644\u0628\u0627\u0637\u0646\u064A \u0641\u064A \u0645\u0635\u0631 \u0645\u0646 2013 \u0625\u0644\u0649 2015\u060C \u062A\u0644\u0627\u0647\u0627 \u062F\u0631\u062C\u0629 \u0627\u0644\u0645\u0627\u062C\u0633\u062A\u064A\u0631 \u0645\u0639 \u062A\u062E\u0635\u0635 \u0641\u0631\u0639\u064A \u0641\u064A \u0623\u0645\u0631\u0627\u0636 \u0627\u0644\u062F\u0645. \u0628\u064A\u0646 \u0639\u0627\u0645\u064A 2015 \u06482018\u060C \u0627\u062C\u062A\u0627\u0632 \u0628\u0646\u062C\u0627\u062D \u0627\u0645\u062A\u062D\u0627\u0646\u0627\u062A MD \u0641\u064A \u0627\u0644\u0637\u0628 \u0627\u0644\u0628\u0627\u0637\u0646\u064A \u0623\u062B\u0646\u0627\u0621 \u0625\u062C\u0631\u0627\u0621 \u0627\u0644\u0623\u0628\u062D\u0627\u062B \u0648\u062A\u0637\u0648\u064A\u0631 \u0623\u0637\u0631\u0648\u062D\u0629\u060C \u0645\u0645\u0627 \u0623\u0638\u0647\u0631 \u0643\u0641\u0627\u0621\u0629 \u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0648\u0633\u0631\u064A\u0631\u064A\u0629 \u0642\u0648\u064A\u0629.</p><p>\u064A\u0645\u062A\u0644\u0643 \u062E\u0628\u0631\u0629 \u0648\u0627\u0633\u0639\u0629 \u0641\u064A \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0645\u0639\u0642\u062F\u0629 \u0641\u064A \u0648\u062D\u062F\u0627\u062A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0637\u0648\u064A\u0644\u0629 \u0627\u0644\u0623\u0645\u062F\u060C \u0645\u0639 \u0639\u0642\u062F \u0645\u0646 \u0627\u0644\u062E\u062F\u0645\u0629 \u0627\u0644\u0645\u062E\u0644\u0635\u0629 \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0633\u064A\u0627\u0642\u060C \u0644\u0636\u0645\u0627\u0646 \u0631\u0639\u0627\u064A\u0629 \u0634\u0627\u0645\u0644\u0629 \u0644\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u0645\u0635\u0627\u0628\u064A\u0646 \u0628\u0623\u0645\u0631\u0627\u0636 \u0645\u0632\u0645\u0646\u0629 \u0648\u0643\u0628\u0627\u0631 \u0627\u0644\u0633\u0646. \u064A\u0639\u0645\u0644 \u062D\u0627\u0644\u064A\u0627 \u0643\u0645\u0633\u062A\u0634\u0627\u0631 \u0628\u0627\u0637\u0646\u064A \u0628\u0627\u0644\u0625\u0646\u0627\u0628\u0629\u060C \u062D\u064A\u062B \u064A\u0633\u062A\u062E\u062F\u0645 \u0645\u0647\u0627\u0631\u0627\u062A \u062A\u0634\u062E\u064A\u0635\u064A\u0629 \u0648\u0639\u0644\u0627\u062C\u064A\u0629 \u0645\u062A\u0642\u062F\u0645\u0629 \u0644\u062A\u062D\u0633\u064A\u0646 \u0646\u062A\u0627\u0626\u062C \u0627\u0644\u0645\u0631\u0636\u0649.</p><p>\u0625\u0646 \u0627\u0644\u062C\u0645\u0639 \u0628\u064A\u0646 \u0627\u0644\u0645\u0624\u0647\u0644\u0627\u062A \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0627\u0644\u0645\u062A\u0642\u062F\u0645\u0629\u060C \u0648\u0627\u0644\u062E\u0628\u0631\u0629 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0627\u0644\u0639\u0645\u0644\u064A\u0629\u060C \u0648\u0627\u0644\u062A\u062F\u0631\u064A\u0628 \u0627\u0644\u062A\u062E\u0635\u0635\u064A \u0627\u0644\u0641\u0631\u0639\u064A \u0641\u064A \u0623\u0645\u0631\u0627\u0636 \u0627\u0644\u062F\u0645 \u064A\u0624\u0647\u0644 \u0647\u0630\u0627 \u0627\u0644\u0623\u062E\u0635\u0627\u0626\u064A \u0644\u062A\u0642\u062F\u064A\u0645 \u0631\u0639\u0627\u064A\u0629 \u0645\u062A\u062E\u0635\u0635\u0629 \u0641\u064A \u0645\u062C\u0645\u0648\u0639\u0629 \u0648\u0627\u0633\u0639\u0629 \u0645\u0646 \u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0637\u0628 \u0627\u0644\u0628\u0627\u0637\u0646\u064A\u060C \u0628\u0645\u0627 \u0641\u064A \u0630\u0644\u0643 \u0627\u0636\u0637\u0631\u0627\u0628\u0627\u062A \u0627\u0644\u062F\u0645\u060C \u0648\u0627\u0644\u0623\u0645\u0631\u0627\u0636 \u0627\u0644\u0645\u0632\u0645\u0646\u0629\u060C \u0648\u0627\u0644\u0645\u0634\u0627\u0643\u0644 \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u062D\u0627\u062F\u0629.</p>"
      },
      sub_specialities: [
        {
          en: "ICU and Critical Cases",
          ar: "\u0627\u0644\u0639\u0646\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u0629 \u0648\u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u062D\u0631\u062C\u0629"
        },
        {
          en: "Medical Emergencies",
          ar: "\u0627\u0644\u0637\u0648\u0627\u0631\u0626 \u0627\u0644\u0637\u0628\u064A\u0629"
        },
        {
          en: "Inpatient Wards",
          ar: "\u0623\u0642\u0633\u0627\u0645 \u0627\u0644\u0645\u0631\u0636\u0649 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u064A\u0646"
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    },
    {
      id: "wp-19648",
      slug: "maysa-osman",
      old_url: "",
      name: {
        en: "Dr. Maysa Osman",
        ar: "\u062F. \u0645\u064A\u0633\u0627\u0621 \u0639\u062B\u0645\u0627\u0646"
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "ae",
      languages: [],
      bio: {
        en: "<p>Dr. Maysa Awad Eltayeb Osman provides general medical services with an emphasis on patient-centered care and continuity of treatment. Her scope includes clinical evaluation, diagnosis, and management of a broad spectrum of conditions, along with supporting preventive healthcare and routine follow-up.</p><p>She contributes to coordinated care by working alongside multidisciplinary teams, ensuring appropriate referrals, maintaining accurate documentation, and adhering to established clinical and quality standards within the healthcare setting.</p>",
        ar: "<p>\u062A\u0642\u062F\u0645 \u0627\u0644\u062F\u0643\u062A\u0648\u0631\u0629 \u0645\u064A\u0633\u0627\u0621 \u0639\u0648\u0636 \u0627\u0644\u0637\u064A\u0628 \u0639\u062B\u0645\u0627\u0646 \u062E\u062F\u0645\u0627\u062A \u0637\u0628\u064A\u0629 \u0639\u0627\u0645\u0629 \u0645\u0639 \u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0639\u0644\u0649 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0631\u062A\u0643\u0632\u0629 \u0639\u0644\u0649 \u0627\u0644\u0645\u0631\u064A\u0636 \u0648\u0627\u0633\u062A\u0645\u0631\u0627\u0631\u064A\u0629 \u0627\u0644\u0639\u0644\u0627\u062C. \u064A\u0634\u0645\u0644 \u0646\u0637\u0627\u0642 \u0639\u0645\u0644\u0647\u0627 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0633\u0631\u064A\u0631\u064A \u0648\u0627\u0644\u062A\u0634\u062E\u064A\u0635 \u0648\u0625\u062F\u0627\u0631\u0629 \u0645\u062C\u0645\u0648\u0639\u0629 \u0648\u0627\u0633\u0639\u0629 \u0645\u0646 \u0627\u0644\u062D\u0627\u0644\u0627\u062A\u060C \u0625\u0644\u0649 \u062C\u0627\u0646\u0628 \u062F\u0639\u0645 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0627\u0644\u0648\u0642\u0627\u0626\u064A\u0629 \u0648\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0631\u0648\u062A\u064A\u0646\u064A\u0629.</p><p>\u062A\u0633\u0627\u0647\u0645 \u0641\u064A \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0645\u0646\u0633\u0642\u0629 \u0645\u0646 \u062E\u0644\u0627\u0644 \u0627\u0644\u0639\u0645\u0644 \u062C\u0646\u0628\u0627 \u0625\u0644\u0649 \u062C\u0646\u0628 \u0645\u0639 \u0641\u0631\u0642 \u0645\u062A\u0639\u062F\u062F\u0629 \u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A\u060C \u0648\u0636\u0645\u0627\u0646 \u0627\u0644\u0625\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629\u060C \u0648\u0627\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u062A\u0648\u062B\u064A\u0642 \u062F\u0642\u064A\u0642\u060C \u0648\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0627\u0644\u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u0633\u0631\u064A\u0631\u064A\u0629 \u0648\u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0631\u0639\u0627\u064A\u0629 \u0627\u0644\u0635\u062D\u064A\u0629.</p>"
      },
      sub_specialities: [],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      },
      wp_media: 20039
    },
    {
      id: "wp-20031",
      slug: "mohamed-kallash",
      old_url: "",
      name: {
        en: "Dr. Mohamed Kallash",
        ar: ""
      },
      title: {
        en: "",
        ar: ""
      },
      specialties: [
        "gp"
      ],
      hospital_id: "",
      country: "sa",
      languages: [],
      bio: {
        en: "",
        ar: ""
      },
      sub_specialities: [
        {
          en: "Physical Rehabilitation",
          ar: ""
        },
        {
          en: "Spinal Cord Injury Care",
          ar: ""
        },
        {
          en: "Brain Injury Rehabilitation",
          ar: ""
        },
        {
          en: "Sports Injury Treatment",
          ar: ""
        },
        {
          en: "EMG & Nerve Studies",
          ar: ""
        },
        {
          en: "Pain Management",
          ar: ""
        },
        {
          en: "Acupuncture Therapy",
          ar: ""
        }
      ],
      photo: "",
      photo_alt: {
        en: "",
        ar: ""
      }
    }
  ]
};

// src/data/hospitals.json
var hospitals_default = {
  $comment: "The six facilities. slug = internal id (doctors.json, forms, footer, tests); path = URL segment under hospitals/ (the live site's URLs quoted in Website Content - Suhad/Our Hospitals, e.g. /ae/hospitals/cambridge-hospital-abu-dhabi/). Full name = brand + ' ' + city ('Al Mudeef Centre' spelling from the documents, one spelling site-wide). listTitle / listButton = the Our Hospitals list card ('Abu Dhabi Hospital' ... 'Al Mudeef Centre' + 'View Centre', from the Our Hospitals main page document, 5 Oct 2026). address + listPhoto as in Figma 101:6247. Detail pages (Figma 112:7721): phone (click-to-call, international format), hours ({en, ar}) and mapUrl are NOT in Figma or the documents and wait for Pramod (empty = not shown; empty mapUrl = Google Maps search for the address). Arabic names, list titles, addresses and 'View Centre' = the live site's Arabic Our Hospitals page and footer (WordPress export pages 19104 / 19153 / block 19169, 6 Oct 2026). location (bug 051, the ONE place for hospital positions: Contact Us map markers, directions links, hospital-page 'Open in Google Maps'): lat / lng = the hospital's exact position (required for a marker), placeId = its Google Place ID (optional, sharpens the directions link), source = where the value comes from. Five positions = the hospital's own Google place, checked 7 Oct 2026 (client approval pending, R051). Jeddah has NO verified position: lat / lng are null on purpose (no marker, no directions link) until the client supplies the exact coordinates or Place ID; never fill it with a guess or a Google search result.",
  hospitals: [
    {
      slug: "abu-dhabi",
      path: "cambridge-hospital-abu-dhabi",
      brand: {
        en: "Cambridge Hospital",
        ar: "\u0645\u0633\u062A\u0634\u0641\u0649 \u0643\u0627\u0645\u0628\u0631\u064A\u062F\u062C"
      },
      city: {
        en: "Abu Dhabi",
        ar: "\u0623\u0628\u0648\u0638\u0628\u064A"
      },
      region: "ae",
      listTitle: {
        en: "Abu Dhabi Hospital",
        ar: "\u0645\u0633\u062A\u0634\u0641\u0649 \u0623\u0628\u0648\u0638\u0628\u064A"
      },
      photo: "facilities/auh-new",
      address: {
        en: "Shakbout City, Abu Dhabi - UAE",
        ar: "\u0645\u062F\u064A\u0646\u0629 \u0634\u062E\u0628\u0648\u0637\u060C \u0623\u0628\u0648\u0638\u0628\u064A\u060C \u0627\u0644\u0627\u0645\u0627\u0631\u0627\u062A"
      },
      listPhoto: "hospitals/abu-dhabi",
      phone: "",
      hours: {
        en: "",
        ar: ""
      },
      mapUrl: "",
      location: {
        lat: 24.3507866,
        lng: 54.6375318,
        placeId: "",
        source: "Google place position, checked 7 Oct 2026 (client approval pending)"
      }
    },
    {
      slug: "al-ain",
      path: "cambridge-hospital-al-ain",
      brand: {
        en: "Cambridge Hospital",
        ar: "\u0645\u0633\u062A\u0634\u0641\u0649 \u0643\u0627\u0645\u0628\u0631\u064A\u062F\u062C"
      },
      city: {
        en: "Al Ain",
        ar: "\u0627\u0644\u0639\u064A\u0646"
      },
      region: "ae",
      listTitle: {
        en: "Al Ain Hospital",
        ar: "\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u0639\u064A\u0646"
      },
      photo: "facilities/al-ain",
      address: {
        en: "Al Khabisi, Al Ain - UAE",
        ar: "\u0634\u0627\u0631\u0639 \u0627\u0644\u062E\u0628\u064A\u0633\u064A\u060C \u0627\u0644\u0639\u064A\u0646\u060C \u0627\u0644\u0627\u0645\u0627\u0631\u0627\u062A"
      },
      listPhoto: "hospitals/al-ain",
      phone: "",
      hours: {
        en: "",
        ar: ""
      },
      mapUrl: "",
      location: {
        lat: 24.2311383,
        lng: 55.6805982,
        placeId: "",
        source: "Google place position, checked 7 Oct 2026 (client approval pending)"
      }
    },
    {
      slug: "dhahran",
      path: "cambridge-hospital-dhahran",
      brand: {
        en: "Cambridge Hospital",
        ar: "\u0645\u0633\u062A\u0634\u0641\u0649 \u0643\u0627\u0645\u0628\u0631\u064A\u062F\u062C"
      },
      city: {
        en: "Dhahran",
        ar: "\u0638\u0647\u0631\u0627\u0646"
      },
      region: "sa",
      listTitle: {
        en: "Dhahran Hospital",
        ar: "\u0645\u0633\u062A\u0634\u0641\u0649 \u0638\u0647\u0631\u0627\u0646"
      },
      photo: "facilities/dhahran",
      address: {
        en: "Al Doha Al Janubia, Dhahran - KSA",
        ar: "\u0627\u0644\u062F\u0648\u062D\u0629 \u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629\u060C \u0638\u0647\u0631\u0627\u0646 - \u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629"
      },
      listPhoto: "hospitals/dhahran",
      phone: "",
      hours: {
        en: "",
        ar: ""
      },
      mapUrl: "",
      location: {
        lat: 26.3191904,
        lng: 50.1556885,
        placeId: "",
        source: "Google place position, checked 7 Oct 2026 (client approval pending)"
      }
    },
    {
      slug: "al-khobar",
      path: "cambridge-hospital-al-khobar",
      brand: {
        en: "Cambridge Hospital",
        ar: "\u0645\u0633\u062A\u0634\u0641\u0649 \u0643\u0627\u0645\u0628\u0631\u064A\u062F\u062C"
      },
      city: {
        en: "Al Khobar",
        ar: "\u0627\u0644\u062E\u0628\u0631"
      },
      region: "sa",
      listTitle: {
        en: "Al Khobar Hospital",
        ar: "\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u062E\u0628\u0631"
      },
      photo: "facilities/al-khobar",
      address: {
        en: "Al Tahliyah, Al Khobar - KSA",
        ar: "\u0627\u0644\u0637\u0647\u0644\u064A\u0629\u060C \u0627\u0644\u062E\u0628\u0631 - \u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629"
      },
      listPhoto: "hospitals/al-khobar",
      phone: "",
      hours: {
        en: "",
        ar: ""
      },
      mapUrl: "",
      location: {
        lat: 26.1862228,
        lng: 50.2090257,
        placeId: "",
        source: "Google place position, checked 7 Oct 2026 (client approval pending)"
      }
    },
    {
      slug: "jeddah",
      path: "cambridge-hospital-jeddah",
      brand: {
        en: "Cambridge Hospital",
        ar: "\u0645\u0633\u062A\u0634\u0641\u0649 \u0643\u0627\u0645\u0628\u0631\u064A\u062F\u062C"
      },
      city: {
        en: "Jeddah",
        ar: "\u062C\u062F\u0629"
      },
      region: "sa",
      listTitle: {
        en: "Jeddah Hospital",
        ar: "\u0645\u0633\u062A\u0634\u0641\u0649 \u062C\u062F\u0629"
      },
      photo: "facilities/jeddah",
      address: {
        en: "Al Ruwais, Jeddah - KSA",
        ar: "\u0627\u0644\u0631\u0648\u064A\u0633\u060C \u062C\u062F\u0629 - \u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629"
      },
      listPhoto: "hospitals/jeddah",
      phone: "",
      hours: {
        en: "",
        ar: ""
      },
      mapUrl: "",
      location: {
        lat: null,
        lng: null,
        placeId: "",
        source: "MISSING: client to supply the exact coordinates (and Place ID) of Cambridge Hospital Jeddah"
      }
    },
    {
      slug: "al-mudeef-abu-dhabi",
      path: "al-mudeef-center-abu-dhabi",
      brand: {
        en: "Al Mudeef Centre",
        ar: "\u0645\u0631\u0643\u0632 \u0627\u0644\u0645\u0636\u064A\u0641"
      },
      city: {
        en: "Abu Dhabi",
        ar: "\u0623\u0628\u0648\u0638\u0628\u064A"
      },
      region: "ae",
      listTitle: {
        en: "Al Mudeef Centre",
        ar: "\u0627\u0644\u0645\u0636\u064A\u0641"
      },
      listButton: {
        en: "View Centre",
        ar: "\u0639\u0631\u0636 \u0627\u0644\u0645\u0631\u0643\u0632"
      },
      photo: "facilities/al-mudeef",
      address: {
        en: "Shakbout City, Abu Dhabi - UAE",
        ar: "\u0645\u062F\u064A\u0646\u0629 \u0634\u062E\u0628\u0648\u0637\u060C \u0623\u0628\u0648\u0638\u0628\u064A\u060C \u0627\u0644\u0627\u0645\u0627\u0631\u0627\u062A"
      },
      listPhoto: "hospitals/al-mudeef-abu-dhabi",
      phone: "",
      hours: {
        en: "",
        ar: ""
      },
      mapUrl: "",
      location: {
        lat: 24.3239001,
        lng: 54.6089327,
        placeId: "",
        source: "Google place position, checked 7 Oct 2026 (client approval pending)"
      }
    }
  ]
};

// src/data/countries.json
var countries_default = {
  $comment: "ISO 3166-1 alpha-2 countries with English and Arabic names generated from the CLDR data in Node (Intl.DisplayNames, ICU 78.3), not typed by hand. Used by the International Patients form country select (no list in Figma: flagged). Order: English A-Z (the Arabic page sorts by its own names).",
  countries: [
    {
      code: "af",
      name: {
        en: "Afghanistan",
        ar: "\u0623\u0641\u063A\u0627\u0646\u0633\u062A\u0627\u0646"
      }
    },
    {
      code: "ax",
      name: {
        en: "\xC5land Islands",
        ar: "\u062C\u0632\u0631 \u0622\u0644\u0627\u0646\u062F"
      }
    },
    {
      code: "al",
      name: {
        en: "Albania",
        ar: "\u0623\u0644\u0628\u0627\u0646\u064A\u0627"
      }
    },
    {
      code: "dz",
      name: {
        en: "Algeria",
        ar: "\u0627\u0644\u062C\u0632\u0627\u0626\u0631"
      }
    },
    {
      code: "as",
      name: {
        en: "American Samoa",
        ar: "\u0633\u0627\u0645\u0648\u0627 \u0627\u0644\u0623\u0645\u0631\u064A\u0643\u064A\u0629"
      }
    },
    {
      code: "ad",
      name: {
        en: "Andorra",
        ar: "\u0623\u0646\u062F\u0648\u0631\u0627"
      }
    },
    {
      code: "ao",
      name: {
        en: "Angola",
        ar: "\u0623\u0646\u063A\u0648\u0644\u0627"
      }
    },
    {
      code: "ai",
      name: {
        en: "Anguilla",
        ar: "\u0623\u0646\u063A\u0648\u064A\u0644\u0627"
      }
    },
    {
      code: "aq",
      name: {
        en: "Antarctica",
        ar: "\u0623\u0646\u062A\u0627\u0631\u0643\u062A\u064A\u0643\u0627"
      }
    },
    {
      code: "ag",
      name: {
        en: "Antigua & Barbuda",
        ar: "\u0623\u0646\u062A\u064A\u063A\u0648\u0627 \u0648\u0628\u0631\u0628\u0648\u062F\u0627"
      }
    },
    {
      code: "ar",
      name: {
        en: "Argentina",
        ar: "\u0627\u0644\u0623\u0631\u062C\u0646\u062A\u064A\u0646"
      }
    },
    {
      code: "am",
      name: {
        en: "Armenia",
        ar: "\u0623\u0631\u0645\u064A\u0646\u064A\u0627"
      }
    },
    {
      code: "aw",
      name: {
        en: "Aruba",
        ar: "\u0623\u0631\u0648\u0628\u0627"
      }
    },
    {
      code: "au",
      name: {
        en: "Australia",
        ar: "\u0623\u0633\u062A\u0631\u0627\u0644\u064A\u0627"
      }
    },
    {
      code: "at",
      name: {
        en: "Austria",
        ar: "\u0627\u0644\u0646\u0645\u0633\u0627"
      }
    },
    {
      code: "az",
      name: {
        en: "Azerbaijan",
        ar: "\u0623\u0630\u0631\u0628\u064A\u062C\u0627\u0646"
      }
    },
    {
      code: "bs",
      name: {
        en: "Bahamas",
        ar: "\u062C\u0632\u0631 \u0627\u0644\u0628\u0647\u0627\u0645\u0627"
      }
    },
    {
      code: "bh",
      name: {
        en: "Bahrain",
        ar: "\u0627\u0644\u0628\u062D\u0631\u064A\u0646"
      }
    },
    {
      code: "bd",
      name: {
        en: "Bangladesh",
        ar: "\u0628\u0646\u063A\u0644\u0627\u062F\u064A\u0634"
      }
    },
    {
      code: "bb",
      name: {
        en: "Barbados",
        ar: "\u0628\u0631\u0628\u0627\u062F\u0648\u0633"
      }
    },
    {
      code: "by",
      name: {
        en: "Belarus",
        ar: "\u0628\u064A\u0644\u0627\u0631\u0648\u0633"
      }
    },
    {
      code: "be",
      name: {
        en: "Belgium",
        ar: "\u0628\u0644\u062C\u064A\u0643\u0627"
      }
    },
    {
      code: "bz",
      name: {
        en: "Belize",
        ar: "\u0628\u0644\u064A\u0632"
      }
    },
    {
      code: "bj",
      name: {
        en: "Benin",
        ar: "\u0628\u0646\u064A\u0646"
      }
    },
    {
      code: "dy",
      name: {
        en: "Benin",
        ar: "\u0628\u0646\u064A\u0646"
      }
    },
    {
      code: "bm",
      name: {
        en: "Bermuda",
        ar: "\u0628\u0631\u0645\u0648\u062F\u0627"
      }
    },
    {
      code: "bt",
      name: {
        en: "Bhutan",
        ar: "\u0628\u0648\u062A\u0627\u0646"
      }
    },
    {
      code: "bo",
      name: {
        en: "Bolivia",
        ar: "\u0628\u0648\u0644\u064A\u0641\u064A\u0627"
      }
    },
    {
      code: "ba",
      name: {
        en: "Bosnia & Herzegovina",
        ar: "\u0627\u0644\u0628\u0648\u0633\u0646\u0629 \u0648\u0627\u0644\u0647\u0631\u0633\u0643"
      }
    },
    {
      code: "bw",
      name: {
        en: "Botswana",
        ar: "\u0628\u0648\u062A\u0633\u0648\u0627\u0646\u0627"
      }
    },
    {
      code: "bv",
      name: {
        en: "Bouvet Island",
        ar: "\u062C\u0632\u064A\u0631\u0629 \u0628\u0648\u0641\u064A\u0647"
      }
    },
    {
      code: "br",
      name: {
        en: "Brazil",
        ar: "\u0627\u0644\u0628\u0631\u0627\u0632\u064A\u0644"
      }
    },
    {
      code: "io",
      name: {
        en: "British Indian Ocean Territory",
        ar: "\u0627\u0644\u0625\u0642\u0644\u064A\u0645 \u0627\u0644\u0628\u0631\u064A\u0637\u0627\u0646\u064A \u0641\u064A \u0627\u0644\u0645\u062D\u064A\u0637 \u0627\u0644\u0647\u0646\u062F\u064A"
      }
    },
    {
      code: "vg",
      name: {
        en: "British Virgin Islands",
        ar: "\u062C\u0632\u0631 \u0641\u064A\u0631\u062C\u0646 \u0627\u0644\u0628\u0631\u064A\u0637\u0627\u0646\u064A\u0629"
      }
    },
    {
      code: "bn",
      name: {
        en: "Brunei",
        ar: "\u0628\u0631\u0648\u0646\u0627\u064A"
      }
    },
    {
      code: "bg",
      name: {
        en: "Bulgaria",
        ar: "\u0628\u0644\u063A\u0627\u0631\u064A\u0627"
      }
    },
    {
      code: "bf",
      name: {
        en: "Burkina Faso",
        ar: "\u0628\u0648\u0631\u0643\u064A\u0646\u0627 \u0641\u0627\u0633\u0648"
      }
    },
    {
      code: "hv",
      name: {
        en: "Burkina Faso",
        ar: "\u0628\u0648\u0631\u0643\u064A\u0646\u0627 \u0641\u0627\u0633\u0648"
      }
    },
    {
      code: "bi",
      name: {
        en: "Burundi",
        ar: "\u0628\u0648\u0631\u0648\u0646\u062F\u064A"
      }
    },
    {
      code: "kh",
      name: {
        en: "Cambodia",
        ar: "\u0643\u0645\u0628\u0648\u062F\u064A\u0627"
      }
    },
    {
      code: "cm",
      name: {
        en: "Cameroon",
        ar: "\u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0648\u0646"
      }
    },
    {
      code: "ca",
      name: {
        en: "Canada",
        ar: "\u0643\u0646\u062F\u0627"
      }
    },
    {
      code: "cv",
      name: {
        en: "Cape Verde",
        ar: "\u0627\u0644\u0631\u0623\u0633 \u0627\u0644\u0623\u062E\u0636\u0631"
      }
    },
    {
      code: "bq",
      name: {
        en: "Caribbean Netherlands",
        ar: "\u0647\u0648\u0644\u0646\u062F\u0627 \u0627\u0644\u0643\u0627\u0631\u064A\u0628\u064A\u0629"
      }
    },
    {
      code: "ky",
      name: {
        en: "Cayman Islands",
        ar: "\u062C\u0632\u0631 \u0643\u0627\u064A\u0645\u0627\u0646"
      }
    },
    {
      code: "cf",
      name: {
        en: "Central African Republic",
        ar: "\u062C\u0645\u0647\u0648\u0631\u064A\u0629 \u0623\u0641\u0631\u064A\u0642\u064A\u0627 \u0627\u0644\u0648\u0633\u0637\u0649"
      }
    },
    {
      code: "td",
      name: {
        en: "Chad",
        ar: "\u062A\u0634\u0627\u062F"
      }
    },
    {
      code: "cl",
      name: {
        en: "Chile",
        ar: "\u062A\u0634\u064A\u0644\u064A"
      }
    },
    {
      code: "cn",
      name: {
        en: "China",
        ar: "\u0627\u0644\u0635\u064A\u0646"
      }
    },
    {
      code: "cx",
      name: {
        en: "Christmas Island",
        ar: "\u062C\u0632\u064A\u0631\u0629 \u0643\u0631\u064A\u0633\u0645\u0627\u0633"
      }
    },
    {
      code: "cc",
      name: {
        en: "Cocos (Keeling) Islands",
        ar: "\u062C\u0632\u0631 \u0643\u0648\u0643\u0648\u0633 (\u0643\u064A\u0644\u064A\u0646\u063A)"
      }
    },
    {
      code: "co",
      name: {
        en: "Colombia",
        ar: "\u0643\u0648\u0644\u0648\u0645\u0628\u064A\u0627"
      }
    },
    {
      code: "km",
      name: {
        en: "Comoros",
        ar: "\u062C\u0632\u0631 \u0627\u0644\u0642\u0645\u0631"
      }
    },
    {
      code: "cg",
      name: {
        en: "Congo - Brazzaville",
        ar: "\u0627\u0644\u0643\u0648\u0646\u063A\u0648 - \u0628\u0631\u0627\u0632\u0627\u0641\u064A\u0644"
      }
    },
    {
      code: "cd",
      name: {
        en: "Congo - Kinshasa",
        ar: "\u0627\u0644\u0643\u0648\u0646\u063A\u0648 - \u0643\u064A\u0646\u0634\u0627\u0633\u0627"
      }
    },
    {
      code: "zr",
      name: {
        en: "Congo - Kinshasa",
        ar: "\u0627\u0644\u0643\u0648\u0646\u063A\u0648 - \u0643\u064A\u0646\u0634\u0627\u0633\u0627"
      }
    },
    {
      code: "ck",
      name: {
        en: "Cook Islands",
        ar: "\u062C\u0632\u0631 \u0643\u0648\u0643"
      }
    },
    {
      code: "cr",
      name: {
        en: "Costa Rica",
        ar: "\u0643\u0648\u0633\u062A\u0627\u0631\u064A\u0643\u0627"
      }
    },
    {
      code: "ci",
      name: {
        en: "C\xF4te d\u2019Ivoire",
        ar: "\u0633\u0627\u062D\u0644 \u0627\u0644\u0639\u0627\u062C"
      }
    },
    {
      code: "hr",
      name: {
        en: "Croatia",
        ar: "\u0643\u0631\u0648\u0627\u062A\u064A\u0627"
      }
    },
    {
      code: "cu",
      name: {
        en: "Cuba",
        ar: "\u0643\u0648\u0628\u0627"
      }
    },
    {
      code: "an",
      name: {
        en: "Cura\xE7ao",
        ar: "\u0643\u0648\u0631\u0627\u0633\u0627\u0648"
      }
    },
    {
      code: "cw",
      name: {
        en: "Cura\xE7ao",
        ar: "\u0643\u0648\u0631\u0627\u0633\u0627\u0648"
      }
    },
    {
      code: "cy",
      name: {
        en: "Cyprus",
        ar: "\u0642\u0628\u0631\u0635"
      }
    },
    {
      code: "cz",
      name: {
        en: "Czechia",
        ar: "\u0627\u0644\u062A\u0634\u064A\u0643"
      }
    },
    {
      code: "dk",
      name: {
        en: "Denmark",
        ar: "\u0627\u0644\u062F\u0627\u0646\u0645\u0631\u0643"
      }
    },
    {
      code: "dj",
      name: {
        en: "Djibouti",
        ar: "\u062C\u064A\u0628\u0648\u062A\u064A"
      }
    },
    {
      code: "dm",
      name: {
        en: "Dominica",
        ar: "\u062F\u0648\u0645\u064A\u0646\u064A\u0643\u0627"
      }
    },
    {
      code: "do",
      name: {
        en: "Dominican Republic",
        ar: "\u062C\u0645\u0647\u0648\u0631\u064A\u0629 \u0627\u0644\u062F\u0648\u0645\u064A\u0646\u064A\u0643\u0627\u0646"
      }
    },
    {
      code: "ec",
      name: {
        en: "Ecuador",
        ar: "\u0627\u0644\u0625\u0643\u0648\u0627\u062F\u0648\u0631"
      }
    },
    {
      code: "eg",
      name: {
        en: "Egypt",
        ar: "\u0645\u0635\u0631"
      }
    },
    {
      code: "sv",
      name: {
        en: "El Salvador",
        ar: "\u0627\u0644\u0633\u0644\u0641\u0627\u062F\u0648\u0631"
      }
    },
    {
      code: "gq",
      name: {
        en: "Equatorial Guinea",
        ar: "\u063A\u064A\u0646\u064A\u0627 \u0627\u0644\u0627\u0633\u062A\u0648\u0627\u0626\u064A\u0629"
      }
    },
    {
      code: "er",
      name: {
        en: "Eritrea",
        ar: "\u0625\u0631\u064A\u062A\u0631\u064A\u0627"
      }
    },
    {
      code: "ee",
      name: {
        en: "Estonia",
        ar: "\u0625\u0633\u062A\u0648\u0646\u064A\u0627"
      }
    },
    {
      code: "sz",
      name: {
        en: "Eswatini",
        ar: "\u0625\u0633\u0648\u0627\u062A\u064A\u0646\u064A"
      }
    },
    {
      code: "et",
      name: {
        en: "Ethiopia",
        ar: "\u0625\u062B\u064A\u0648\u0628\u064A\u0627"
      }
    },
    {
      code: "fk",
      name: {
        en: "Falkland Islands",
        ar: "\u062C\u0632\u0631 \u0641\u0648\u0643\u0644\u0627\u0646\u062F"
      }
    },
    {
      code: "fo",
      name: {
        en: "Faroe Islands",
        ar: "\u062C\u0632\u0631 \u0641\u0627\u0631\u0648"
      }
    },
    {
      code: "fj",
      name: {
        en: "Fiji",
        ar: "\u0641\u064A\u062C\u064A"
      }
    },
    {
      code: "fi",
      name: {
        en: "Finland",
        ar: "\u0641\u0646\u0644\u0646\u062F\u0627"
      }
    },
    {
      code: "fr",
      name: {
        en: "France",
        ar: "\u0641\u0631\u0646\u0633\u0627"
      }
    },
    {
      code: "fx",
      name: {
        en: "France",
        ar: "\u0641\u0631\u0646\u0633\u0627"
      }
    },
    {
      code: "gf",
      name: {
        en: "French Guiana",
        ar: "\u063A\u0648\u064A\u0627\u0646\u0627 \u0627\u0644\u0641\u0631\u0646\u0633\u064A\u0629"
      }
    },
    {
      code: "pf",
      name: {
        en: "French Polynesia",
        ar: "\u0628\u0648\u0644\u064A\u0646\u064A\u0632\u064A\u0627 \u0627\u0644\u0641\u0631\u0646\u0633\u064A\u0629"
      }
    },
    {
      code: "tf",
      name: {
        en: "French Southern Territories",
        ar: "\u0627\u0644\u0623\u0642\u0627\u0644\u064A\u0645 \u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629 \u0627\u0644\u0641\u0631\u0646\u0633\u064A\u0629"
      }
    },
    {
      code: "ga",
      name: {
        en: "Gabon",
        ar: "\u0627\u0644\u063A\u0627\u0628\u0648\u0646"
      }
    },
    {
      code: "gm",
      name: {
        en: "Gambia",
        ar: "\u063A\u0627\u0645\u0628\u064A\u0627"
      }
    },
    {
      code: "ge",
      name: {
        en: "Georgia",
        ar: "\u062C\u0648\u0631\u062C\u064A\u0627"
      }
    },
    {
      code: "dd",
      name: {
        en: "Germany",
        ar: "\u0623\u0644\u0645\u0627\u0646\u064A\u0627"
      }
    },
    {
      code: "de",
      name: {
        en: "Germany",
        ar: "\u0623\u0644\u0645\u0627\u0646\u064A\u0627"
      }
    },
    {
      code: "gh",
      name: {
        en: "Ghana",
        ar: "\u063A\u0627\u0646\u0627"
      }
    },
    {
      code: "gi",
      name: {
        en: "Gibraltar",
        ar: "\u062C\u0628\u0644 \u0637\u0627\u0631\u0642"
      }
    },
    {
      code: "gr",
      name: {
        en: "Greece",
        ar: "\u0627\u0644\u064A\u0648\u0646\u0627\u0646"
      }
    },
    {
      code: "gl",
      name: {
        en: "Greenland",
        ar: "\u063A\u0631\u064A\u0646\u0644\u0627\u0646\u062F"
      }
    },
    {
      code: "gd",
      name: {
        en: "Grenada",
        ar: "\u063A\u0631\u064A\u0646\u0627\u062F\u0627"
      }
    },
    {
      code: "gp",
      name: {
        en: "Guadeloupe",
        ar: "\u063A\u0648\u0627\u062F\u0644\u0648\u0628"
      }
    },
    {
      code: "gu",
      name: {
        en: "Guam",
        ar: "\u063A\u0648\u0627\u0645"
      }
    },
    {
      code: "gt",
      name: {
        en: "Guatemala",
        ar: "\u063A\u0648\u0627\u062A\u064A\u0645\u0627\u0644\u0627"
      }
    },
    {
      code: "gg",
      name: {
        en: "Guernsey",
        ar: "\u063A\u064A\u0631\u0646\u0632\u064A"
      }
    },
    {
      code: "gn",
      name: {
        en: "Guinea",
        ar: "\u063A\u064A\u0646\u064A\u0627"
      }
    },
    {
      code: "gw",
      name: {
        en: "Guinea-Bissau",
        ar: "\u063A\u064A\u0646\u064A\u0627 \u0628\u064A\u0633\u0627\u0648"
      }
    },
    {
      code: "gy",
      name: {
        en: "Guyana",
        ar: "\u063A\u064A\u0627\u0646\u0627"
      }
    },
    {
      code: "ht",
      name: {
        en: "Haiti",
        ar: "\u0647\u0627\u064A\u062A\u064A"
      }
    },
    {
      code: "hm",
      name: {
        en: "Heard & McDonald Islands",
        ar: "\u062C\u0632\u064A\u0631\u0629 \u0647\u064A\u0631\u062F \u0648\u062C\u0632\u0631 \u0645\u0627\u0643\u062F\u0648\u0646\u0627\u0644\u062F"
      }
    },
    {
      code: "hn",
      name: {
        en: "Honduras",
        ar: "\u0647\u0646\u062F\u0648\u0631\u0627\u0633"
      }
    },
    {
      code: "hk",
      name: {
        en: "Hong Kong SAR China",
        ar: "\u0647\u0648\u0646\u063A \u0643\u0648\u0646\u063A \u0627\u0644\u0635\u064A\u0646\u064A\u0629 (\u0645\u0646\u0637\u0642\u0629 \u0625\u062F\u0627\u0631\u064A\u0629 \u062E\u0627\u0635\u0629)"
      }
    },
    {
      code: "hu",
      name: {
        en: "Hungary",
        ar: "\u0647\u0646\u063A\u0627\u0631\u064A\u0627"
      }
    },
    {
      code: "is",
      name: {
        en: "Iceland",
        ar: "\u0622\u064A\u0633\u0644\u0646\u062F\u0627"
      }
    },
    {
      code: "in",
      name: {
        en: "India",
        ar: "\u0627\u0644\u0647\u0646\u062F"
      }
    },
    {
      code: "id",
      name: {
        en: "Indonesia",
        ar: "\u0625\u0646\u062F\u0648\u0646\u064A\u0633\u064A\u0627"
      }
    },
    {
      code: "ir",
      name: {
        en: "Iran",
        ar: "\u0625\u064A\u0631\u0627\u0646"
      }
    },
    {
      code: "iq",
      name: {
        en: "Iraq",
        ar: "\u0627\u0644\u0639\u0631\u0627\u0642"
      }
    },
    {
      code: "ie",
      name: {
        en: "Ireland",
        ar: "\u0623\u064A\u0631\u0644\u0646\u062F\u0627"
      }
    },
    {
      code: "im",
      name: {
        en: "Isle of Man",
        ar: "\u062C\u0632\u064A\u0631\u0629 \u0645\u0627\u0646"
      }
    },
    {
      code: "il",
      name: {
        en: "Israel",
        ar: "\u0625\u0633\u0631\u0627\u0626\u064A\u0644"
      }
    },
    {
      code: "it",
      name: {
        en: "Italy",
        ar: "\u0625\u064A\u0637\u0627\u0644\u064A\u0627"
      }
    },
    {
      code: "jm",
      name: {
        en: "Jamaica",
        ar: "\u062C\u0627\u0645\u0627\u064A\u0643\u0627"
      }
    },
    {
      code: "jp",
      name: {
        en: "Japan",
        ar: "\u0627\u0644\u064A\u0627\u0628\u0627\u0646"
      }
    },
    {
      code: "je",
      name: {
        en: "Jersey",
        ar: "\u062C\u064A\u0631\u0633\u064A"
      }
    },
    {
      code: "jo",
      name: {
        en: "Jordan",
        ar: "\u0627\u0644\u0623\u0631\u062F\u0646"
      }
    },
    {
      code: "kz",
      name: {
        en: "Kazakhstan",
        ar: "\u0643\u0627\u0632\u0627\u062E\u0633\u062A\u0627\u0646"
      }
    },
    {
      code: "ke",
      name: {
        en: "Kenya",
        ar: "\u0643\u064A\u0646\u064A\u0627"
      }
    },
    {
      code: "ki",
      name: {
        en: "Kiribati",
        ar: "\u0643\u064A\u0631\u064A\u0628\u0627\u062A\u064A"
      }
    },
    {
      code: "kw",
      name: {
        en: "Kuwait",
        ar: "\u0627\u0644\u0643\u0648\u064A\u062A"
      }
    },
    {
      code: "kg",
      name: {
        en: "Kyrgyzstan",
        ar: "\u0642\u064A\u0631\u063A\u064A\u0632\u0633\u062A\u0627\u0646"
      }
    },
    {
      code: "la",
      name: {
        en: "Laos",
        ar: "\u0644\u0627\u0648\u0633"
      }
    },
    {
      code: "lv",
      name: {
        en: "Latvia",
        ar: "\u0644\u0627\u062A\u0641\u064A\u0627"
      }
    },
    {
      code: "lb",
      name: {
        en: "Lebanon",
        ar: "\u0644\u0628\u0646\u0627\u0646"
      }
    },
    {
      code: "ls",
      name: {
        en: "Lesotho",
        ar: "\u0644\u064A\u0633\u0648\u062A\u0648"
      }
    },
    {
      code: "lr",
      name: {
        en: "Liberia",
        ar: "\u0644\u064A\u0628\u064A\u0631\u064A\u0627"
      }
    },
    {
      code: "ly",
      name: {
        en: "Libya",
        ar: "\u0644\u064A\u0628\u064A\u0627"
      }
    },
    {
      code: "li",
      name: {
        en: "Liechtenstein",
        ar: "\u0644\u064A\u062E\u062A\u0646\u0634\u062A\u0627\u064A\u0646"
      }
    },
    {
      code: "lt",
      name: {
        en: "Lithuania",
        ar: "\u0644\u064A\u062A\u0648\u0627\u0646\u064A\u0627"
      }
    },
    {
      code: "lu",
      name: {
        en: "Luxembourg",
        ar: "\u0644\u0648\u0643\u0633\u0645\u0628\u0648\u0631\u063A"
      }
    },
    {
      code: "mo",
      name: {
        en: "Macao SAR China",
        ar: "\u0645\u0646\u0637\u0642\u0629 \u0645\u0627\u0643\u0627\u0648 \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 \u0627\u0644\u062E\u0627\u0635\u0629"
      }
    },
    {
      code: "mg",
      name: {
        en: "Madagascar",
        ar: "\u0645\u062F\u063A\u0634\u0642\u0631"
      }
    },
    {
      code: "mw",
      name: {
        en: "Malawi",
        ar: "\u0645\u0644\u0627\u0648\u064A"
      }
    },
    {
      code: "my",
      name: {
        en: "Malaysia",
        ar: "\u0645\u0627\u0644\u064A\u0632\u064A\u0627"
      }
    },
    {
      code: "mv",
      name: {
        en: "Maldives",
        ar: "\u062C\u0632\u0631 \u0627\u0644\u0645\u0627\u0644\u062F\u064A\u0641"
      }
    },
    {
      code: "ml",
      name: {
        en: "Mali",
        ar: "\u0645\u0627\u0644\u064A"
      }
    },
    {
      code: "mt",
      name: {
        en: "Malta",
        ar: "\u0645\u0627\u0644\u0637\u0627"
      }
    },
    {
      code: "mh",
      name: {
        en: "Marshall Islands",
        ar: "\u062C\u0632\u0631 \u0645\u0627\u0631\u0634\u0627\u0644"
      }
    },
    {
      code: "mq",
      name: {
        en: "Martinique",
        ar: "\u062C\u0632\u0631 \u0627\u0644\u0645\u0627\u0631\u062A\u064A\u0646\u064A\u0643"
      }
    },
    {
      code: "mr",
      name: {
        en: "Mauritania",
        ar: "\u0645\u0648\u0631\u064A\u062A\u0627\u0646\u064A\u0627"
      }
    },
    {
      code: "mu",
      name: {
        en: "Mauritius",
        ar: "\u0645\u0648\u0631\u064A\u0634\u064A\u0648\u0633"
      }
    },
    {
      code: "yt",
      name: {
        en: "Mayotte",
        ar: "\u0645\u0627\u064A\u0648\u062A"
      }
    },
    {
      code: "mx",
      name: {
        en: "Mexico",
        ar: "\u0627\u0644\u0645\u0643\u0633\u064A\u0643"
      }
    },
    {
      code: "fm",
      name: {
        en: "Micronesia",
        ar: "\u0645\u064A\u0643\u0631\u0648\u0646\u064A\u0632\u064A\u0627"
      }
    },
    {
      code: "md",
      name: {
        en: "Moldova",
        ar: "\u0645\u0648\u0644\u062F\u0648\u0641\u0627"
      }
    },
    {
      code: "mc",
      name: {
        en: "Monaco",
        ar: "\u0645\u0648\u0646\u0627\u0643\u0648"
      }
    },
    {
      code: "mn",
      name: {
        en: "Mongolia",
        ar: "\u0645\u0646\u063A\u0648\u0644\u064A\u0627"
      }
    },
    {
      code: "me",
      name: {
        en: "Montenegro",
        ar: "\u0627\u0644\u062C\u0628\u0644 \u0627\u0644\u0623\u0633\u0648\u062F"
      }
    },
    {
      code: "ms",
      name: {
        en: "Montserrat",
        ar: "\u0645\u0648\u0646\u062A\u0633\u0631\u0627\u062A"
      }
    },
    {
      code: "ma",
      name: {
        en: "Morocco",
        ar: "\u0627\u0644\u0645\u063A\u0631\u0628"
      }
    },
    {
      code: "mz",
      name: {
        en: "Mozambique",
        ar: "\u0645\u0648\u0632\u0645\u0628\u064A\u0642"
      }
    },
    {
      code: "bu",
      name: {
        en: "Myanmar (Burma)",
        ar: "\u0645\u064A\u0627\u0646\u0645\u0627\u0631 (\u0628\u0648\u0631\u0645\u0627)"
      }
    },
    {
      code: "mm",
      name: {
        en: "Myanmar (Burma)",
        ar: "\u0645\u064A\u0627\u0646\u0645\u0627\u0631 (\u0628\u0648\u0631\u0645\u0627)"
      }
    },
    {
      code: "na",
      name: {
        en: "Namibia",
        ar: "\u0646\u0627\u0645\u064A\u0628\u064A\u0627"
      }
    },
    {
      code: "nr",
      name: {
        en: "Nauru",
        ar: "\u0646\u0627\u0648\u0631\u0648"
      }
    },
    {
      code: "np",
      name: {
        en: "Nepal",
        ar: "\u0646\u064A\u0628\u0627\u0644"
      }
    },
    {
      code: "nl",
      name: {
        en: "Netherlands",
        ar: "\u0647\u0648\u0644\u0646\u062F\u0627"
      }
    },
    {
      code: "nc",
      name: {
        en: "New Caledonia",
        ar: "\u0643\u0627\u0644\u064A\u062F\u0648\u0646\u064A\u0627 \u0627\u0644\u062C\u062F\u064A\u062F\u0629"
      }
    },
    {
      code: "nz",
      name: {
        en: "New Zealand",
        ar: "\u0646\u064A\u0648\u0632\u064A\u0644\u0646\u062F\u0627"
      }
    },
    {
      code: "ni",
      name: {
        en: "Nicaragua",
        ar: "\u0646\u064A\u0643\u0627\u0631\u0627\u063A\u0648\u0627"
      }
    },
    {
      code: "ne",
      name: {
        en: "Niger",
        ar: "\u0627\u0644\u0646\u064A\u062C\u0631"
      }
    },
    {
      code: "ng",
      name: {
        en: "Nigeria",
        ar: "\u0646\u064A\u062C\u064A\u0631\u064A\u0627"
      }
    },
    {
      code: "nu",
      name: {
        en: "Niue",
        ar: "\u0646\u064A\u0648\u064A"
      }
    },
    {
      code: "nf",
      name: {
        en: "Norfolk Island",
        ar: "\u062C\u0632\u064A\u0631\u0629 \u0646\u0648\u0631\u0641\u0648\u0644\u0643"
      }
    },
    {
      code: "kp",
      name: {
        en: "North Korea",
        ar: "\u0643\u0648\u0631\u064A\u0627 \u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629"
      }
    },
    {
      code: "mk",
      name: {
        en: "North Macedonia",
        ar: "\u0645\u0642\u062F\u0648\u0646\u064A\u0627 \u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629"
      }
    },
    {
      code: "mp",
      name: {
        en: "Northern Mariana Islands",
        ar: "\u062C\u0632\u0631 \u0645\u0627\u0631\u064A\u0627\u0646\u0627 \u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629"
      }
    },
    {
      code: "no",
      name: {
        en: "Norway",
        ar: "\u0627\u0644\u0646\u0631\u0648\u064A\u062C"
      }
    },
    {
      code: "om",
      name: {
        en: "Oman",
        ar: "\u0639\u064F\u0645\u0627\u0646"
      }
    },
    {
      code: "pk",
      name: {
        en: "Pakistan",
        ar: "\u0628\u0627\u0643\u0633\u062A\u0627\u0646"
      }
    },
    {
      code: "pw",
      name: {
        en: "Palau",
        ar: "\u0628\u0627\u0644\u0627\u0648"
      }
    },
    {
      code: "ps",
      name: {
        en: "Palestinian Territories",
        ar: "\u0627\u0644\u0623\u0631\u0627\u0636\u064A \u0627\u0644\u0641\u0644\u0633\u0637\u064A\u0646\u064A\u0629"
      }
    },
    {
      code: "pa",
      name: {
        en: "Panama",
        ar: "\u0628\u0646\u0645\u0627"
      }
    },
    {
      code: "pg",
      name: {
        en: "Papua New Guinea",
        ar: "\u0628\u0627\u0628\u0648\u0627 \u063A\u064A\u0646\u064A\u0627 \u0627\u0644\u062C\u062F\u064A\u062F\u0629"
      }
    },
    {
      code: "py",
      name: {
        en: "Paraguay",
        ar: "\u0628\u0627\u0631\u0627\u063A\u0648\u0627\u064A"
      }
    },
    {
      code: "pe",
      name: {
        en: "Peru",
        ar: "\u0628\u064A\u0631\u0648"
      }
    },
    {
      code: "ph",
      name: {
        en: "Philippines",
        ar: "\u0627\u0644\u0641\u0644\u0628\u064A\u0646"
      }
    },
    {
      code: "pn",
      name: {
        en: "Pitcairn Islands",
        ar: "\u062C\u0632\u0631 \u0628\u064A\u062A\u0643\u064A\u0631\u0646"
      }
    },
    {
      code: "pl",
      name: {
        en: "Poland",
        ar: "\u0628\u0648\u0644\u0646\u062F\u0627"
      }
    },
    {
      code: "pt",
      name: {
        en: "Portugal",
        ar: "\u0627\u0644\u0628\u0631\u062A\u063A\u0627\u0644"
      }
    },
    {
      code: "pr",
      name: {
        en: "Puerto Rico",
        ar: "\u0628\u0648\u0631\u062A\u0648\u0631\u064A\u0643\u0648"
      }
    },
    {
      code: "qa",
      name: {
        en: "Qatar",
        ar: "\u0642\u0637\u0631"
      }
    },
    {
      code: "re",
      name: {
        en: "R\xE9union",
        ar: "\u0631\u0648\u064A\u0646\u064A\u0648\u0646"
      }
    },
    {
      code: "ro",
      name: {
        en: "Romania",
        ar: "\u0631\u0648\u0645\u0627\u0646\u064A\u0627"
      }
    },
    {
      code: "ru",
      name: {
        en: "Russia",
        ar: "\u0631\u0648\u0633\u064A\u0627"
      }
    },
    {
      code: "su",
      name: {
        en: "Russia",
        ar: "\u0631\u0648\u0633\u064A\u0627"
      }
    },
    {
      code: "rw",
      name: {
        en: "Rwanda",
        ar: "\u0631\u0648\u0627\u0646\u062F\u0627"
      }
    },
    {
      code: "ws",
      name: {
        en: "Samoa",
        ar: "\u0633\u0627\u0645\u0648\u0627"
      }
    },
    {
      code: "sm",
      name: {
        en: "San Marino",
        ar: "\u0633\u0627\u0646 \u0645\u0627\u0631\u064A\u0646\u0648"
      }
    },
    {
      code: "st",
      name: {
        en: "S\xE3o Tom\xE9 & Pr\xEDncipe",
        ar: "\u0633\u0627\u0648 \u062A\u0648\u0645\u064A \u0648\u0628\u0631\u064A\u0646\u0633\u064A\u0628\u064A"
      }
    },
    {
      code: "sa",
      name: {
        en: "Saudi Arabia",
        ar: "\u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629"
      }
    },
    {
      code: "sn",
      name: {
        en: "Senegal",
        ar: "\u0627\u0644\u0633\u0646\u063A\u0627\u0644"
      }
    },
    {
      code: "cs",
      name: {
        en: "Serbia",
        ar: "\u0635\u0631\u0628\u064A\u0627"
      }
    },
    {
      code: "rs",
      name: {
        en: "Serbia",
        ar: "\u0635\u0631\u0628\u064A\u0627"
      }
    },
    {
      code: "yu",
      name: {
        en: "Serbia",
        ar: "\u0635\u0631\u0628\u064A\u0627"
      }
    },
    {
      code: "sc",
      name: {
        en: "Seychelles",
        ar: "\u0633\u064A\u0634\u0644"
      }
    },
    {
      code: "sl",
      name: {
        en: "Sierra Leone",
        ar: "\u0633\u064A\u0631\u0627\u0644\u064A\u0648\u0646"
      }
    },
    {
      code: "sg",
      name: {
        en: "Singapore",
        ar: "\u0633\u0646\u063A\u0627\u0641\u0648\u0631\u0629"
      }
    },
    {
      code: "sx",
      name: {
        en: "Sint Maarten",
        ar: "\u0633\u0627\u0646\u062A \u0645\u0627\u0631\u062A\u0646"
      }
    },
    {
      code: "sk",
      name: {
        en: "Slovakia",
        ar: "\u0633\u0644\u0648\u0641\u0627\u0643\u064A\u0627"
      }
    },
    {
      code: "si",
      name: {
        en: "Slovenia",
        ar: "\u0633\u0644\u0648\u0641\u064A\u0646\u064A\u0627"
      }
    },
    {
      code: "sb",
      name: {
        en: "Solomon Islands",
        ar: "\u062C\u0632\u0631 \u0633\u0644\u064A\u0645\u0627\u0646"
      }
    },
    {
      code: "so",
      name: {
        en: "Somalia",
        ar: "\u0627\u0644\u0635\u0648\u0645\u0627\u0644"
      }
    },
    {
      code: "za",
      name: {
        en: "South Africa",
        ar: "\u062C\u0646\u0648\u0628 \u0623\u0641\u0631\u064A\u0642\u064A\u0627"
      }
    },
    {
      code: "gs",
      name: {
        en: "South Georgia & South Sandwich Islands",
        ar: "\u062C\u0648\u0631\u062C\u064A\u0627 \u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629 \u0648\u062C\u0632\u0631 \u0633\u0627\u0646\u062F\u0648\u064A\u062A\u0634 \u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629"
      }
    },
    {
      code: "kr",
      name: {
        en: "South Korea",
        ar: "\u0643\u0648\u0631\u064A\u0627 \u0627\u0644\u062C\u0646\u0648\u0628\u064A\u0629"
      }
    },
    {
      code: "ss",
      name: {
        en: "South Sudan",
        ar: "\u062C\u0646\u0648\u0628 \u0627\u0644\u0633\u0648\u062F\u0627\u0646"
      }
    },
    {
      code: "es",
      name: {
        en: "Spain",
        ar: "\u0625\u0633\u0628\u0627\u0646\u064A\u0627"
      }
    },
    {
      code: "lk",
      name: {
        en: "Sri Lanka",
        ar: "\u0633\u0631\u064A\u0644\u0627\u0646\u0643\u0627"
      }
    },
    {
      code: "bl",
      name: {
        en: "St. Barth\xE9lemy",
        ar: "\u0633\u0627\u0646 \u0628\u0627\u0631\u062A\u0644\u064A\u0645\u064A"
      }
    },
    {
      code: "sh",
      name: {
        en: "St. Helena",
        ar: "\u0633\u0627\u0646\u062A \u0647\u064A\u0644\u064A\u0646\u0627"
      }
    },
    {
      code: "kn",
      name: {
        en: "St. Kitts & Nevis",
        ar: "\u0633\u0627\u0646\u062A \u0643\u064A\u062A\u0633 \u0648\u0646\u064A\u0641\u064A\u0633"
      }
    },
    {
      code: "lc",
      name: {
        en: "St. Lucia",
        ar: "\u0633\u0627\u0646\u062A \u0644\u0648\u0633\u064A\u0627"
      }
    },
    {
      code: "mf",
      name: {
        en: "St. Martin",
        ar: "\u0633\u0627\u0646 \u0645\u0627\u0631\u062A\u0646"
      }
    },
    {
      code: "pm",
      name: {
        en: "St. Pierre & Miquelon",
        ar: "\u0633\u0627\u0646 \u0628\u064A\u064A\u0631 \u0648\u0645\u0643\u0648\u064A\u0644\u0648\u0646"
      }
    },
    {
      code: "vc",
      name: {
        en: "St. Vincent & Grenadines",
        ar: "\u0633\u0627\u0646\u062A \u0641\u0646\u0633\u0646\u062A \u0648\u062C\u0632\u0631 \u063A\u0631\u064A\u0646\u0627\u062F\u064A\u0646"
      }
    },
    {
      code: "sd",
      name: {
        en: "Sudan",
        ar: "\u0627\u0644\u0633\u0648\u062F\u0627\u0646"
      }
    },
    {
      code: "sr",
      name: {
        en: "Suriname",
        ar: "\u0633\u0648\u0631\u064A\u0646\u0627\u0645"
      }
    },
    {
      code: "sj",
      name: {
        en: "Svalbard & Jan Mayen",
        ar: "\u0633\u0641\u0627\u0644\u0628\u0627\u0631\u062F \u0648\u062C\u0627\u0646 \u0645\u0627\u064A\u0646"
      }
    },
    {
      code: "se",
      name: {
        en: "Sweden",
        ar: "\u0627\u0644\u0633\u0648\u064A\u062F"
      }
    },
    {
      code: "ch",
      name: {
        en: "Switzerland",
        ar: "\u0633\u0648\u064A\u0633\u0631\u0627"
      }
    },
    {
      code: "sy",
      name: {
        en: "Syria",
        ar: "\u0633\u0648\u0631\u064A\u0627"
      }
    },
    {
      code: "tw",
      name: {
        en: "Taiwan",
        ar: "\u062A\u0627\u064A\u0648\u0627\u0646"
      }
    },
    {
      code: "tj",
      name: {
        en: "Tajikistan",
        ar: "\u0637\u0627\u062C\u064A\u0643\u0633\u062A\u0627\u0646"
      }
    },
    {
      code: "tz",
      name: {
        en: "Tanzania",
        ar: "\u062A\u0646\u0632\u0627\u0646\u064A\u0627"
      }
    },
    {
      code: "th",
      name: {
        en: "Thailand",
        ar: "\u062A\u0627\u064A\u0644\u0627\u0646\u062F"
      }
    },
    {
      code: "tl",
      name: {
        en: "Timor-Leste",
        ar: "\u062A\u064A\u0645\u0648\u0631 - \u0644\u064A\u0634\u062A\u064A"
      }
    },
    {
      code: "tp",
      name: {
        en: "Timor-Leste",
        ar: "\u062A\u064A\u0645\u0648\u0631 - \u0644\u064A\u0634\u062A\u064A"
      }
    },
    {
      code: "tg",
      name: {
        en: "Togo",
        ar: "\u062A\u0648\u063A\u0648"
      }
    },
    {
      code: "tk",
      name: {
        en: "Tokelau",
        ar: "\u062A\u0648\u0643\u064A\u0644\u0627\u0648"
      }
    },
    {
      code: "to",
      name: {
        en: "Tonga",
        ar: "\u062A\u0648\u0646\u063A\u0627"
      }
    },
    {
      code: "tt",
      name: {
        en: "Trinidad & Tobago",
        ar: "\u062A\u0631\u064A\u0646\u064A\u062F\u0627\u062F \u0648\u062A\u0648\u0628\u0627\u063A\u0648"
      }
    },
    {
      code: "tn",
      name: {
        en: "Tunisia",
        ar: "\u062A\u0648\u0646\u0633"
      }
    },
    {
      code: "tr",
      name: {
        en: "T\xFCrkiye",
        ar: "\u062A\u0631\u0643\u064A\u0627"
      }
    },
    {
      code: "tm",
      name: {
        en: "Turkmenistan",
        ar: "\u062A\u0631\u0643\u0645\u0627\u0646\u0633\u062A\u0627\u0646"
      }
    },
    {
      code: "tc",
      name: {
        en: "Turks & Caicos Islands",
        ar: "\u062C\u0632\u0631 \u062A\u0648\u0631\u0643\u0633 \u0648\u0643\u0627\u064A\u0643\u0648\u0633"
      }
    },
    {
      code: "tv",
      name: {
        en: "Tuvalu",
        ar: "\u062A\u0648\u0641\u0627\u0644\u0648"
      }
    },
    {
      code: "um",
      name: {
        en: "U.S. Outlying Islands",
        ar: "\u062C\u0632\u0631 \u0627\u0644\u0648\u0644\u0627\u064A\u0627\u062A \u0627\u0644\u0645\u062A\u062D\u062F\u0629 \u0627\u0644\u0646\u0627\u0626\u064A\u0629"
      }
    },
    {
      code: "vi",
      name: {
        en: "U.S. Virgin Islands",
        ar: "\u062C\u0632\u0631 \u0641\u064A\u0631\u062C\u0646 \u0627\u0644\u0623\u0645\u0631\u064A\u0643\u064A\u0629"
      }
    },
    {
      code: "ug",
      name: {
        en: "Uganda",
        ar: "\u0623\u0648\u063A\u0646\u062F\u0627"
      }
    },
    {
      code: "ua",
      name: {
        en: "Ukraine",
        ar: "\u0623\u0648\u0643\u0631\u0627\u0646\u064A\u0627"
      }
    },
    {
      code: "ae",
      name: {
        en: "United Arab Emirates",
        ar: "\u0627\u0644\u0625\u0645\u0627\u0631\u0627\u062A \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0645\u062A\u062D\u062F\u0629"
      }
    },
    {
      code: "gb",
      name: {
        en: "United Kingdom",
        ar: "\u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0645\u062A\u062D\u062F\u0629"
      }
    },
    {
      code: "uk",
      name: {
        en: "United Kingdom",
        ar: "\u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0645\u062A\u062D\u062F\u0629"
      }
    },
    {
      code: "us",
      name: {
        en: "United States",
        ar: "\u0627\u0644\u0648\u0644\u0627\u064A\u0627\u062A \u0627\u0644\u0645\u062A\u062D\u062F\u0629"
      }
    },
    {
      code: "uy",
      name: {
        en: "Uruguay",
        ar: "\u0623\u0648\u0631\u063A\u0648\u0627\u064A"
      }
    },
    {
      code: "uz",
      name: {
        en: "Uzbekistan",
        ar: "\u0623\u0648\u0632\u0628\u0643\u0633\u062A\u0627\u0646"
      }
    },
    {
      code: "nh",
      name: {
        en: "Vanuatu",
        ar: "\u0641\u0627\u0646\u0648\u0627\u062A\u0648"
      }
    },
    {
      code: "vu",
      name: {
        en: "Vanuatu",
        ar: "\u0641\u0627\u0646\u0648\u0627\u062A\u0648"
      }
    },
    {
      code: "va",
      name: {
        en: "Vatican City",
        ar: "\u0627\u0644\u0641\u0627\u062A\u064A\u0643\u0627\u0646"
      }
    },
    {
      code: "ve",
      name: {
        en: "Venezuela",
        ar: "\u0641\u0646\u0632\u0648\u064A\u0644\u0627"
      }
    },
    {
      code: "vd",
      name: {
        en: "Vietnam",
        ar: "\u0641\u064A\u062A\u0646\u0627\u0645"
      }
    },
    {
      code: "vn",
      name: {
        en: "Vietnam",
        ar: "\u0641\u064A\u062A\u0646\u0627\u0645"
      }
    },
    {
      code: "wf",
      name: {
        en: "Wallis & Futuna",
        ar: "\u062C\u0632\u0631 \u0648\u0627\u0644\u0633 \u0648\u0641\u0648\u062A\u0648\u0646\u0627"
      }
    },
    {
      code: "eh",
      name: {
        en: "Western Sahara",
        ar: "\u0627\u0644\u0635\u062D\u0631\u0627\u0621 \u0627\u0644\u063A\u0631\u0628\u064A\u0629"
      }
    },
    {
      code: "yd",
      name: {
        en: "Yemen",
        ar: "\u0627\u0644\u064A\u0645\u0646"
      }
    },
    {
      code: "ye",
      name: {
        en: "Yemen",
        ar: "\u0627\u0644\u064A\u0645\u0646"
      }
    },
    {
      code: "zm",
      name: {
        en: "Zambia",
        ar: "\u0632\u0627\u0645\u0628\u064A\u0627"
      }
    },
    {
      code: "rh",
      name: {
        en: "Zimbabwe",
        ar: "\u0632\u064A\u0645\u0628\u0627\u0628\u0648\u064A"
      }
    },
    {
      code: "zw",
      name: {
        en: "Zimbabwe",
        ar: "\u0632\u064A\u0645\u0628\u0627\u0628\u0648\u064A"
      }
    }
  ]
};

// src/data/dial-codes.json
var dial_codes_default = {
  $comment: "Country calling codes for the Mobile fields (all forms). UNCONFIRMED with Pramod (list, order, Arabic names). The box shows the code like Figma ('+971'); the open list shows the country name. Only the UAE flag exists in Figma, so other codes show no flag until flag artwork is supplied. `defaults` = preselected country per edition region.",
  defaults: {
    global: "AE",
    ae: "AE",
    sa: "SA"
  },
  countries: [
    {
      iso: "AF",
      name: {
        en: "Afghanistan",
        ar: ""
      },
      code: "+93"
    },
    {
      iso: "AL",
      name: {
        en: "Albania",
        ar: ""
      },
      code: "+355"
    },
    {
      iso: "DZ",
      name: {
        en: "Algeria",
        ar: ""
      },
      code: "+213"
    },
    {
      iso: "AS",
      name: {
        en: "American Samoa",
        ar: ""
      },
      code: "+1684"
    },
    {
      iso: "AD",
      name: {
        en: "Andorra",
        ar: ""
      },
      code: "+376"
    },
    {
      iso: "AO",
      name: {
        en: "Angola",
        ar: ""
      },
      code: "+244"
    },
    {
      iso: "AI",
      name: {
        en: "Anguilla",
        ar: ""
      },
      code: "+1264"
    },
    {
      iso: "AG",
      name: {
        en: "Antigua and Barbuda",
        ar: ""
      },
      code: "+1268"
    },
    {
      iso: "AR",
      name: {
        en: "Argentina",
        ar: ""
      },
      code: "+54"
    },
    {
      iso: "AM",
      name: {
        en: "Armenia",
        ar: ""
      },
      code: "+374"
    },
    {
      iso: "AW",
      name: {
        en: "Aruba",
        ar: ""
      },
      code: "+297"
    },
    {
      iso: "AU",
      name: {
        en: "Australia",
        ar: ""
      },
      code: "+61"
    },
    {
      iso: "AT",
      name: {
        en: "Austria",
        ar: ""
      },
      code: "+43"
    },
    {
      iso: "AZ",
      name: {
        en: "Azerbaijan",
        ar: ""
      },
      code: "+994"
    },
    {
      iso: "BS",
      name: {
        en: "Bahamas",
        ar: ""
      },
      code: "+1242"
    },
    {
      iso: "BH",
      name: {
        en: "Bahrain",
        ar: ""
      },
      code: "+973"
    },
    {
      iso: "BD",
      name: {
        en: "Bangladesh",
        ar: ""
      },
      code: "+880"
    },
    {
      iso: "BB",
      name: {
        en: "Barbados",
        ar: ""
      },
      code: "+1246"
    },
    {
      iso: "BY",
      name: {
        en: "Belarus",
        ar: ""
      },
      code: "+375"
    },
    {
      iso: "BE",
      name: {
        en: "Belgium",
        ar: ""
      },
      code: "+32"
    },
    {
      iso: "BZ",
      name: {
        en: "Belize",
        ar: ""
      },
      code: "+501"
    },
    {
      iso: "BJ",
      name: {
        en: "Benin",
        ar: ""
      },
      code: "+229"
    },
    {
      iso: "BM",
      name: {
        en: "Bermuda",
        ar: ""
      },
      code: "+1441"
    },
    {
      iso: "BT",
      name: {
        en: "Bhutan",
        ar: ""
      },
      code: "+975"
    },
    {
      iso: "BO",
      name: {
        en: "Bolivia",
        ar: ""
      },
      code: "+591"
    },
    {
      iso: "BA",
      name: {
        en: "Bosnia and Herzegovina",
        ar: ""
      },
      code: "+387"
    },
    {
      iso: "BW",
      name: {
        en: "Botswana",
        ar: ""
      },
      code: "+267"
    },
    {
      iso: "BR",
      name: {
        en: "Brazil",
        ar: ""
      },
      code: "+55"
    },
    {
      iso: "VG",
      name: {
        en: "British Virgin Islands",
        ar: ""
      },
      code: "+1284"
    },
    {
      iso: "BN",
      name: {
        en: "Brunei",
        ar: ""
      },
      code: "+673"
    },
    {
      iso: "BG",
      name: {
        en: "Bulgaria",
        ar: ""
      },
      code: "+359"
    },
    {
      iso: "BF",
      name: {
        en: "Burkina Faso",
        ar: ""
      },
      code: "+226"
    },
    {
      iso: "BI",
      name: {
        en: "Burundi",
        ar: ""
      },
      code: "+257"
    },
    {
      iso: "CV",
      name: {
        en: "Cabo Verde",
        ar: ""
      },
      code: "+238"
    },
    {
      iso: "KH",
      name: {
        en: "Cambodia",
        ar: ""
      },
      code: "+855"
    },
    {
      iso: "CM",
      name: {
        en: "Cameroon",
        ar: ""
      },
      code: "+237"
    },
    {
      iso: "CA",
      name: {
        en: "Canada",
        ar: ""
      },
      code: "+1"
    },
    {
      iso: "KY",
      name: {
        en: "Cayman Islands",
        ar: ""
      },
      code: "+1345"
    },
    {
      iso: "CF",
      name: {
        en: "Central African Republic",
        ar: ""
      },
      code: "+236"
    },
    {
      iso: "TD",
      name: {
        en: "Chad",
        ar: ""
      },
      code: "+235"
    },
    {
      iso: "CL",
      name: {
        en: "Chile",
        ar: ""
      },
      code: "+56"
    },
    {
      iso: "CN",
      name: {
        en: "China",
        ar: ""
      },
      code: "+86"
    },
    {
      iso: "CO",
      name: {
        en: "Colombia",
        ar: ""
      },
      code: "+57"
    },
    {
      iso: "KM",
      name: {
        en: "Comoros",
        ar: ""
      },
      code: "+269"
    },
    {
      iso: "CG",
      name: {
        en: "Congo",
        ar: ""
      },
      code: "+242"
    },
    {
      iso: "CD",
      name: {
        en: "Congo (DRC)",
        ar: ""
      },
      code: "+243"
    },
    {
      iso: "CK",
      name: {
        en: "Cook Islands",
        ar: ""
      },
      code: "+682"
    },
    {
      iso: "CR",
      name: {
        en: "Costa Rica",
        ar: ""
      },
      code: "+506"
    },
    {
      iso: "CI",
      name: {
        en: "C\xF4te d\u2019Ivoire",
        ar: ""
      },
      code: "+225"
    },
    {
      iso: "HR",
      name: {
        en: "Croatia",
        ar: ""
      },
      code: "+385"
    },
    {
      iso: "CU",
      name: {
        en: "Cuba",
        ar: ""
      },
      code: "+53"
    },
    {
      iso: "CW",
      name: {
        en: "Cura\xE7ao",
        ar: ""
      },
      code: "+599"
    },
    {
      iso: "CY",
      name: {
        en: "Cyprus",
        ar: ""
      },
      code: "+357"
    },
    {
      iso: "CZ",
      name: {
        en: "Czechia",
        ar: ""
      },
      code: "+420"
    },
    {
      iso: "DK",
      name: {
        en: "Denmark",
        ar: ""
      },
      code: "+45"
    },
    {
      iso: "DJ",
      name: {
        en: "Djibouti",
        ar: ""
      },
      code: "+253"
    },
    {
      iso: "DM",
      name: {
        en: "Dominica",
        ar: ""
      },
      code: "+1767"
    },
    {
      iso: "DO",
      name: {
        en: "Dominican Republic",
        ar: ""
      },
      code: "+1809"
    },
    {
      iso: "EC",
      name: {
        en: "Ecuador",
        ar: ""
      },
      code: "+593"
    },
    {
      iso: "EG",
      name: {
        en: "Egypt",
        ar: ""
      },
      code: "+20"
    },
    {
      iso: "SV",
      name: {
        en: "El Salvador",
        ar: ""
      },
      code: "+503"
    },
    {
      iso: "GQ",
      name: {
        en: "Equatorial Guinea",
        ar: ""
      },
      code: "+240"
    },
    {
      iso: "ER",
      name: {
        en: "Eritrea",
        ar: ""
      },
      code: "+291"
    },
    {
      iso: "EE",
      name: {
        en: "Estonia",
        ar: ""
      },
      code: "+372"
    },
    {
      iso: "SZ",
      name: {
        en: "Eswatini",
        ar: ""
      },
      code: "+268"
    },
    {
      iso: "ET",
      name: {
        en: "Ethiopia",
        ar: ""
      },
      code: "+251"
    },
    {
      iso: "FK",
      name: {
        en: "Falkland Islands",
        ar: ""
      },
      code: "+500"
    },
    {
      iso: "FO",
      name: {
        en: "Faroe Islands",
        ar: ""
      },
      code: "+298"
    },
    {
      iso: "FJ",
      name: {
        en: "Fiji",
        ar: ""
      },
      code: "+679"
    },
    {
      iso: "FI",
      name: {
        en: "Finland",
        ar: ""
      },
      code: "+358"
    },
    {
      iso: "FR",
      name: {
        en: "France",
        ar: ""
      },
      code: "+33"
    },
    {
      iso: "GF",
      name: {
        en: "French Guiana",
        ar: ""
      },
      code: "+594"
    },
    {
      iso: "PF",
      name: {
        en: "French Polynesia",
        ar: ""
      },
      code: "+689"
    },
    {
      iso: "GA",
      name: {
        en: "Gabon",
        ar: ""
      },
      code: "+241"
    },
    {
      iso: "GM",
      name: {
        en: "Gambia",
        ar: ""
      },
      code: "+220"
    },
    {
      iso: "GE",
      name: {
        en: "Georgia",
        ar: ""
      },
      code: "+995"
    },
    {
      iso: "DE",
      name: {
        en: "Germany",
        ar: ""
      },
      code: "+49"
    },
    {
      iso: "GH",
      name: {
        en: "Ghana",
        ar: ""
      },
      code: "+233"
    },
    {
      iso: "GI",
      name: {
        en: "Gibraltar",
        ar: ""
      },
      code: "+350"
    },
    {
      iso: "GR",
      name: {
        en: "Greece",
        ar: ""
      },
      code: "+30"
    },
    {
      iso: "GL",
      name: {
        en: "Greenland",
        ar: ""
      },
      code: "+299"
    },
    {
      iso: "GD",
      name: {
        en: "Grenada",
        ar: ""
      },
      code: "+1473"
    },
    {
      iso: "GP",
      name: {
        en: "Guadeloupe",
        ar: ""
      },
      code: "+590"
    },
    {
      iso: "GU",
      name: {
        en: "Guam",
        ar: ""
      },
      code: "+1671"
    },
    {
      iso: "GT",
      name: {
        en: "Guatemala",
        ar: ""
      },
      code: "+502"
    },
    {
      iso: "GN",
      name: {
        en: "Guinea",
        ar: ""
      },
      code: "+224"
    },
    {
      iso: "GW",
      name: {
        en: "Guinea-Bissau",
        ar: ""
      },
      code: "+245"
    },
    {
      iso: "GY",
      name: {
        en: "Guyana",
        ar: ""
      },
      code: "+592"
    },
    {
      iso: "HT",
      name: {
        en: "Haiti",
        ar: ""
      },
      code: "+509"
    },
    {
      iso: "HN",
      name: {
        en: "Honduras",
        ar: ""
      },
      code: "+504"
    },
    {
      iso: "HK",
      name: {
        en: "Hong Kong",
        ar: ""
      },
      code: "+852"
    },
    {
      iso: "HU",
      name: {
        en: "Hungary",
        ar: ""
      },
      code: "+36"
    },
    {
      iso: "IS",
      name: {
        en: "Iceland",
        ar: ""
      },
      code: "+354"
    },
    {
      iso: "IN",
      name: {
        en: "India",
        ar: ""
      },
      code: "+91"
    },
    {
      iso: "ID",
      name: {
        en: "Indonesia",
        ar: ""
      },
      code: "+62"
    },
    {
      iso: "IR",
      name: {
        en: "Iran",
        ar: ""
      },
      code: "+98"
    },
    {
      iso: "IQ",
      name: {
        en: "Iraq",
        ar: ""
      },
      code: "+964"
    },
    {
      iso: "IE",
      name: {
        en: "Ireland",
        ar: ""
      },
      code: "+353"
    },
    {
      iso: "IL",
      name: {
        en: "Israel",
        ar: ""
      },
      code: "+972"
    },
    {
      iso: "IT",
      name: {
        en: "Italy",
        ar: ""
      },
      code: "+39"
    },
    {
      iso: "JM",
      name: {
        en: "Jamaica",
        ar: ""
      },
      code: "+1876"
    },
    {
      iso: "JP",
      name: {
        en: "Japan",
        ar: ""
      },
      code: "+81"
    },
    {
      iso: "JO",
      name: {
        en: "Jordan",
        ar: ""
      },
      code: "+962"
    },
    {
      iso: "KZ",
      name: {
        en: "Kazakhstan",
        ar: ""
      },
      code: "+7"
    },
    {
      iso: "KE",
      name: {
        en: "Kenya",
        ar: ""
      },
      code: "+254"
    },
    {
      iso: "KI",
      name: {
        en: "Kiribati",
        ar: ""
      },
      code: "+686"
    },
    {
      iso: "XK",
      name: {
        en: "Kosovo",
        ar: ""
      },
      code: "+383"
    },
    {
      iso: "KW",
      name: {
        en: "Kuwait",
        ar: ""
      },
      code: "+965"
    },
    {
      iso: "KG",
      name: {
        en: "Kyrgyzstan",
        ar: ""
      },
      code: "+996"
    },
    {
      iso: "LA",
      name: {
        en: "Laos",
        ar: ""
      },
      code: "+856"
    },
    {
      iso: "LV",
      name: {
        en: "Latvia",
        ar: ""
      },
      code: "+371"
    },
    {
      iso: "LB",
      name: {
        en: "Lebanon",
        ar: ""
      },
      code: "+961"
    },
    {
      iso: "LS",
      name: {
        en: "Lesotho",
        ar: ""
      },
      code: "+266"
    },
    {
      iso: "LR",
      name: {
        en: "Liberia",
        ar: ""
      },
      code: "+231"
    },
    {
      iso: "LY",
      name: {
        en: "Libya",
        ar: ""
      },
      code: "+218"
    },
    {
      iso: "LI",
      name: {
        en: "Liechtenstein",
        ar: ""
      },
      code: "+423"
    },
    {
      iso: "LT",
      name: {
        en: "Lithuania",
        ar: ""
      },
      code: "+370"
    },
    {
      iso: "LU",
      name: {
        en: "Luxembourg",
        ar: ""
      },
      code: "+352"
    },
    {
      iso: "MO",
      name: {
        en: "Macao",
        ar: ""
      },
      code: "+853"
    },
    {
      iso: "MG",
      name: {
        en: "Madagascar",
        ar: ""
      },
      code: "+261"
    },
    {
      iso: "MW",
      name: {
        en: "Malawi",
        ar: ""
      },
      code: "+265"
    },
    {
      iso: "MY",
      name: {
        en: "Malaysia",
        ar: ""
      },
      code: "+60"
    },
    {
      iso: "MV",
      name: {
        en: "Maldives",
        ar: ""
      },
      code: "+960"
    },
    {
      iso: "ML",
      name: {
        en: "Mali",
        ar: ""
      },
      code: "+223"
    },
    {
      iso: "MT",
      name: {
        en: "Malta",
        ar: ""
      },
      code: "+356"
    },
    {
      iso: "MH",
      name: {
        en: "Marshall Islands",
        ar: ""
      },
      code: "+692"
    },
    {
      iso: "MQ",
      name: {
        en: "Martinique",
        ar: ""
      },
      code: "+596"
    },
    {
      iso: "MR",
      name: {
        en: "Mauritania",
        ar: ""
      },
      code: "+222"
    },
    {
      iso: "MU",
      name: {
        en: "Mauritius",
        ar: ""
      },
      code: "+230"
    },
    {
      iso: "YT",
      name: {
        en: "Mayotte",
        ar: ""
      },
      code: "+262"
    },
    {
      iso: "MX",
      name: {
        en: "Mexico",
        ar: ""
      },
      code: "+52"
    },
    {
      iso: "FM",
      name: {
        en: "Micronesia",
        ar: ""
      },
      code: "+691"
    },
    {
      iso: "MD",
      name: {
        en: "Moldova",
        ar: ""
      },
      code: "+373"
    },
    {
      iso: "MC",
      name: {
        en: "Monaco",
        ar: ""
      },
      code: "+377"
    },
    {
      iso: "MN",
      name: {
        en: "Mongolia",
        ar: ""
      },
      code: "+976"
    },
    {
      iso: "ME",
      name: {
        en: "Montenegro",
        ar: ""
      },
      code: "+382"
    },
    {
      iso: "MS",
      name: {
        en: "Montserrat",
        ar: ""
      },
      code: "+1664"
    },
    {
      iso: "MA",
      name: {
        en: "Morocco",
        ar: ""
      },
      code: "+212"
    },
    {
      iso: "MZ",
      name: {
        en: "Mozambique",
        ar: ""
      },
      code: "+258"
    },
    {
      iso: "MM",
      name: {
        en: "Myanmar",
        ar: ""
      },
      code: "+95"
    },
    {
      iso: "NA",
      name: {
        en: "Namibia",
        ar: ""
      },
      code: "+264"
    },
    {
      iso: "NR",
      name: {
        en: "Nauru",
        ar: ""
      },
      code: "+674"
    },
    {
      iso: "NP",
      name: {
        en: "Nepal",
        ar: ""
      },
      code: "+977"
    },
    {
      iso: "NL",
      name: {
        en: "Netherlands",
        ar: ""
      },
      code: "+31"
    },
    {
      iso: "NC",
      name: {
        en: "New Caledonia",
        ar: ""
      },
      code: "+687"
    },
    {
      iso: "NZ",
      name: {
        en: "New Zealand",
        ar: ""
      },
      code: "+64"
    },
    {
      iso: "NI",
      name: {
        en: "Nicaragua",
        ar: ""
      },
      code: "+505"
    },
    {
      iso: "NE",
      name: {
        en: "Niger",
        ar: ""
      },
      code: "+227"
    },
    {
      iso: "NG",
      name: {
        en: "Nigeria",
        ar: ""
      },
      code: "+234"
    },
    {
      iso: "NU",
      name: {
        en: "Niue",
        ar: ""
      },
      code: "+683"
    },
    {
      iso: "KP",
      name: {
        en: "North Korea",
        ar: ""
      },
      code: "+850"
    },
    {
      iso: "MK",
      name: {
        en: "North Macedonia",
        ar: ""
      },
      code: "+389"
    },
    {
      iso: "MP",
      name: {
        en: "Northern Mariana Islands",
        ar: ""
      },
      code: "+1670"
    },
    {
      iso: "NO",
      name: {
        en: "Norway",
        ar: ""
      },
      code: "+47"
    },
    {
      iso: "OM",
      name: {
        en: "Oman",
        ar: ""
      },
      code: "+968"
    },
    {
      iso: "PK",
      name: {
        en: "Pakistan",
        ar: ""
      },
      code: "+92"
    },
    {
      iso: "PW",
      name: {
        en: "Palau",
        ar: ""
      },
      code: "+680"
    },
    {
      iso: "PS",
      name: {
        en: "Palestine",
        ar: ""
      },
      code: "+970"
    },
    {
      iso: "PA",
      name: {
        en: "Panama",
        ar: ""
      },
      code: "+507"
    },
    {
      iso: "PG",
      name: {
        en: "Papua New Guinea",
        ar: ""
      },
      code: "+675"
    },
    {
      iso: "PY",
      name: {
        en: "Paraguay",
        ar: ""
      },
      code: "+595"
    },
    {
      iso: "PE",
      name: {
        en: "Peru",
        ar: ""
      },
      code: "+51"
    },
    {
      iso: "PH",
      name: {
        en: "Philippines",
        ar: ""
      },
      code: "+63"
    },
    {
      iso: "PL",
      name: {
        en: "Poland",
        ar: ""
      },
      code: "+48"
    },
    {
      iso: "PT",
      name: {
        en: "Portugal",
        ar: ""
      },
      code: "+351"
    },
    {
      iso: "PR",
      name: {
        en: "Puerto Rico",
        ar: ""
      },
      code: "+1787"
    },
    {
      iso: "QA",
      name: {
        en: "Qatar",
        ar: ""
      },
      code: "+974"
    },
    {
      iso: "RE",
      name: {
        en: "R\xE9union",
        ar: ""
      },
      code: "+262"
    },
    {
      iso: "RO",
      name: {
        en: "Romania",
        ar: ""
      },
      code: "+40"
    },
    {
      iso: "RU",
      name: {
        en: "Russia",
        ar: ""
      },
      code: "+7"
    },
    {
      iso: "RW",
      name: {
        en: "Rwanda",
        ar: ""
      },
      code: "+250"
    },
    {
      iso: "KN",
      name: {
        en: "Saint Kitts and Nevis",
        ar: ""
      },
      code: "+1869"
    },
    {
      iso: "LC",
      name: {
        en: "Saint Lucia",
        ar: ""
      },
      code: "+1758"
    },
    {
      iso: "VC",
      name: {
        en: "Saint Vincent and the Grenadines",
        ar: ""
      },
      code: "+1784"
    },
    {
      iso: "WS",
      name: {
        en: "Samoa",
        ar: ""
      },
      code: "+685"
    },
    {
      iso: "SM",
      name: {
        en: "San Marino",
        ar: ""
      },
      code: "+378"
    },
    {
      iso: "ST",
      name: {
        en: "S\xE3o Tom\xE9 and Pr\xEDncipe",
        ar: ""
      },
      code: "+239"
    },
    {
      iso: "SA",
      name: {
        en: "Saudi Arabia",
        ar: ""
      },
      code: "+966"
    },
    {
      iso: "SN",
      name: {
        en: "Senegal",
        ar: ""
      },
      code: "+221"
    },
    {
      iso: "RS",
      name: {
        en: "Serbia",
        ar: ""
      },
      code: "+381"
    },
    {
      iso: "SC",
      name: {
        en: "Seychelles",
        ar: ""
      },
      code: "+248"
    },
    {
      iso: "SL",
      name: {
        en: "Sierra Leone",
        ar: ""
      },
      code: "+232"
    },
    {
      iso: "SG",
      name: {
        en: "Singapore",
        ar: ""
      },
      code: "+65"
    },
    {
      iso: "SX",
      name: {
        en: "Sint Maarten",
        ar: ""
      },
      code: "+1721"
    },
    {
      iso: "SK",
      name: {
        en: "Slovakia",
        ar: ""
      },
      code: "+421"
    },
    {
      iso: "SI",
      name: {
        en: "Slovenia",
        ar: ""
      },
      code: "+386"
    },
    {
      iso: "SB",
      name: {
        en: "Solomon Islands",
        ar: ""
      },
      code: "+677"
    },
    {
      iso: "SO",
      name: {
        en: "Somalia",
        ar: ""
      },
      code: "+252"
    },
    {
      iso: "ZA",
      name: {
        en: "South Africa",
        ar: ""
      },
      code: "+27"
    },
    {
      iso: "KR",
      name: {
        en: "South Korea",
        ar: ""
      },
      code: "+82"
    },
    {
      iso: "SS",
      name: {
        en: "South Sudan",
        ar: ""
      },
      code: "+211"
    },
    {
      iso: "ES",
      name: {
        en: "Spain",
        ar: ""
      },
      code: "+34"
    },
    {
      iso: "LK",
      name: {
        en: "Sri Lanka",
        ar: ""
      },
      code: "+94"
    },
    {
      iso: "SD",
      name: {
        en: "Sudan",
        ar: ""
      },
      code: "+249"
    },
    {
      iso: "SR",
      name: {
        en: "Suriname",
        ar: ""
      },
      code: "+597"
    },
    {
      iso: "SE",
      name: {
        en: "Sweden",
        ar: ""
      },
      code: "+46"
    },
    {
      iso: "CH",
      name: {
        en: "Switzerland",
        ar: ""
      },
      code: "+41"
    },
    {
      iso: "SY",
      name: {
        en: "Syria",
        ar: ""
      },
      code: "+963"
    },
    {
      iso: "TW",
      name: {
        en: "Taiwan",
        ar: ""
      },
      code: "+886"
    },
    {
      iso: "TJ",
      name: {
        en: "Tajikistan",
        ar: ""
      },
      code: "+992"
    },
    {
      iso: "TZ",
      name: {
        en: "Tanzania",
        ar: ""
      },
      code: "+255"
    },
    {
      iso: "TH",
      name: {
        en: "Thailand",
        ar: ""
      },
      code: "+66"
    },
    {
      iso: "TL",
      name: {
        en: "Timor-Leste",
        ar: ""
      },
      code: "+670"
    },
    {
      iso: "TG",
      name: {
        en: "Togo",
        ar: ""
      },
      code: "+228"
    },
    {
      iso: "TO",
      name: {
        en: "Tonga",
        ar: ""
      },
      code: "+676"
    },
    {
      iso: "TT",
      name: {
        en: "Trinidad and Tobago",
        ar: ""
      },
      code: "+1868"
    },
    {
      iso: "TN",
      name: {
        en: "Tunisia",
        ar: ""
      },
      code: "+216"
    },
    {
      iso: "TR",
      name: {
        en: "T\xFCrkiye",
        ar: ""
      },
      code: "+90"
    },
    {
      iso: "TM",
      name: {
        en: "Turkmenistan",
        ar: ""
      },
      code: "+993"
    },
    {
      iso: "TC",
      name: {
        en: "Turks and Caicos Islands",
        ar: ""
      },
      code: "+1649"
    },
    {
      iso: "TV",
      name: {
        en: "Tuvalu",
        ar: ""
      },
      code: "+688"
    },
    {
      iso: "UG",
      name: {
        en: "Uganda",
        ar: ""
      },
      code: "+256"
    },
    {
      iso: "UA",
      name: {
        en: "Ukraine",
        ar: ""
      },
      code: "+380"
    },
    {
      iso: "AE",
      name: {
        en: "United Arab Emirates",
        ar: ""
      },
      code: "+971"
    },
    {
      iso: "GB",
      name: {
        en: "United Kingdom",
        ar: ""
      },
      code: "+44"
    },
    {
      iso: "US",
      name: {
        en: "United States",
        ar: ""
      },
      code: "+1"
    },
    {
      iso: "UY",
      name: {
        en: "Uruguay",
        ar: ""
      },
      code: "+598"
    },
    {
      iso: "VI",
      name: {
        en: "U.S. Virgin Islands",
        ar: ""
      },
      code: "+1340"
    },
    {
      iso: "UZ",
      name: {
        en: "Uzbekistan",
        ar: ""
      },
      code: "+998"
    },
    {
      iso: "VU",
      name: {
        en: "Vanuatu",
        ar: ""
      },
      code: "+678"
    },
    {
      iso: "VA",
      name: {
        en: "Vatican City",
        ar: ""
      },
      code: "+379"
    },
    {
      iso: "VE",
      name: {
        en: "Venezuela",
        ar: ""
      },
      code: "+58"
    },
    {
      iso: "VN",
      name: {
        en: "Vietnam",
        ar: ""
      },
      code: "+84"
    },
    {
      iso: "WF",
      name: {
        en: "Wallis and Futuna",
        ar: ""
      },
      code: "+681"
    },
    {
      iso: "YE",
      name: {
        en: "Yemen",
        ar: ""
      },
      code: "+967"
    },
    {
      iso: "ZM",
      name: {
        en: "Zambia",
        ar: ""
      },
      code: "+260"
    },
    {
      iso: "ZW",
      name: {
        en: "Zimbabwe",
        ar: ""
      },
      code: "+263"
    }
  ]
};

// functions/_lib/turnstile.ts
var SETUP_ERRORS = ["missing-input-secret", "invalid-input-secret"];
async function verifyTurnstile(token, secret, ip) {
  if (!token) return "failed";
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  let r;
  try {
    r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  } catch {
    console.error("turnstile: siteverify unreachable");
    return "config";
  }
  if (!r.ok) {
    console.error(`turnstile: siteverify ${r.status}`);
    return "config";
  }
  const data = await r.json().catch(() => ({}));
  if (data.success === true) return "ok";
  const codes = data["error-codes"] ?? [];
  if (codes.some((c) => SETUP_ERRORS.includes(c))) {
    console.error(`turnstile: secret rejected (${codes.join(", ")}); check TURNSTILE_SECRET_KEY`);
    return "config";
  }
  return "failed";
}

// functions/_lib/smtp.ts
var TIMEOUT_MS = 2e4;
var load = (name) => import(
  /* @vite-ignore */
  name
);
async function sendSmtp(m, c) {
  const implicitTls = c.port === 465;
  const isWorker = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
  const wire = await (isWorker ? workerWire : nodeWire)(
    c.host,
    c.port,
    implicitTls
  );
  let timer;
  try {
    await Promise.race([
      converse(wire, m, c, implicitTls),
      new Promise(
        (_, reject) => timer = setTimeout(
          () => reject(new Error("smtp timeout")),
          TIMEOUT_MS
        )
      )
    ]);
  } finally {
    clearTimeout(timer);
    wire.close();
  }
}
async function converse(wire, m, c, implicitTls) {
  const s = new Session(wire);
  await s.expect("greeting", [220]);
  const helo = c.from.email.split("@")[1] ?? "localhost";
  let caps = await s.cmd(`EHLO ${helo}`, [250]);
  if (!implicitTls) {
    if (!caps.some((l) => /^STARTTLS\b/i.test(l)))
      throw new Error(
        "smtp server offers no STARTTLS (refusing to send the password in clear)"
      );
    await s.cmd("STARTTLS", [220]);
    await wire.upgrade();
    caps = await s.cmd(`EHLO ${helo}`, [250]);
  }
  const auth = caps.find((l) => /^AUTH[ =]/i.test(l))?.toUpperCase() ?? "";
  if (/\bPLAIN\b/.test(auth) || !/\bLOGIN\b/.test(auth)) {
    await s.cmd(`AUTH PLAIN ${b64(`\0${c.user}\0${c.pass}`)}`, [235], "AUTH");
  } else {
    await s.cmd("AUTH LOGIN", [334]);
    await s.cmd(b64(c.user), [334], "AUTH");
    await s.cmd(b64(c.pass), [235], "AUTH");
  }
  await s.cmd(`MAIL FROM:<${c.from.email}>`, [250]);
  for (const to of m.to) await s.cmd(`RCPT TO:<${to}>`, [250, 251], "RCPT");
  await s.cmd("DATA", [354]);
  await s.cmd(
    `${message(m, c.from, helo).replace(/^\./gm, "..")}\r
.`,
    [250],
    "DATA"
  );
  await wire.write("QUIT\r\n").catch(() => {
  });
}
var Session = class {
  constructor(wire) {
    this.wire = wire;
    wire.listen(
      (chunk) => {
        this.buf += this.dec.decode(chunk, { stream: true });
        this.wake?.();
      },
      (e) => {
        this.ended = e ?? new Error("smtp connection closed");
        this.wake?.();
      }
    );
  }
  wire;
  buf = "";
  ended = null;
  wake = null;
  dec = new TextDecoder();
  async reply() {
    const lines = [];
    for (; ; ) {
      const i = this.buf.indexOf("\r\n");
      if (i < 0) {
        if (this.ended) throw this.ended;
        await new Promise((r) => this.wake = r);
        this.wake = null;
        continue;
      }
      const line = this.buf.slice(0, i);
      this.buf = this.buf.slice(i + 2);
      lines.push(line.slice(4));
      if (/^\d{3}(?: |$)/.test(line))
        return { code: Number(line.slice(0, 3)), lines };
    }
  }
  async expect(what, codes) {
    const r = await this.reply();
    if (!codes.includes(r.code))
      throw new Error(`smtp ${what} ${r.code} ${r.lines.at(-1) ?? ""}`.trim());
    return r.lines;
  }
  /** `label` replaces the command in error messages (never log AUTH payloads). */
  async cmd(line, codes, label) {
    await this.wire.write(`${line}\r
`);
    return this.expect(label ?? line.split(" ")[0], codes);
  }
};
var clean = (s) => s.replace(/[\r\n]+/g, " ").trim();
var ascii = (s) => /^[\x20-\x7e]*$/.test(s);
function message(m, from, domain) {
  const boundary = `=_ch_${crypto.randomUUID()}`;
  const fromName = from.name ? `${word(from.name)} ` : "";
  const headers = [
    `From: ${fromName}<${from.email}>`,
    `To: ${m.to.map(clean).join(", ")}`,
    ...m.replyTo ? [`Reply-To: <${clean(m.replyTo)}>`] : [],
    `Subject: ${word(m.subject)}`,
    `Date: ${(/* @__PURE__ */ new Date()).toUTCString().replace("GMT", "+0000")}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`
  ];
  const part = (type, body) => [
    `--${boundary}`,
    `Content-Type: ${type}; charset=UTF-8`,
    "Content-Transfer-Encoding: base64",
    "",
    wrap(b64(body))
  ].join("\r\n");
  return [
    ...headers,
    "",
    part("text/plain", m.text),
    part("text/html", m.html),
    `--${boundary}--`
  ].join("\r\n");
}
function word(s) {
  s = clean(s);
  if (ascii(s)) return s;
  const words = [];
  let chunk = "";
  for (const ch of s) {
    if (new TextEncoder().encode(chunk + ch).length > 45) {
      words.push(chunk);
      chunk = "";
    }
    chunk += ch;
  }
  if (chunk) words.push(chunk);
  return words.map((w) => `=?UTF-8?B?${b64(w)}?=`).join("\r\n ");
}
function b64(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 32768)
    bin += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(bin);
}
var wrap = (s) => s.replace(/.{1,76}/g, "$&\r\n").trimEnd();
async function nodeWire(host, port, implicitTls) {
  const net = await load("node:net");
  const tls = await load("node:tls");
  const ready = (sock2, ev) => new Promise((resolve, reject) => {
    sock2.once(ev, () => resolve(sock2));
    sock2.once("error", reject);
  });
  let sock = implicitTls ? await ready(
    tls.connect({ host, port, servername: host }),
    "secureConnect"
  ) : await ready(net.connect({ host, port }), "connect");
  let onData = () => {
  };
  let onEnd = () => {
  };
  const attach = (s) => {
    s.on("data", (d) => onData(d));
    s.on("error", (e) => onEnd(e));
    s.on("close", () => onEnd());
  };
  return {
    listen(d, e) {
      onData = d;
      onEnd = e;
      attach(sock);
    },
    write: (s) => new Promise(
      (resolve, reject) => sock.write(s, (e) => e ? reject(e) : resolve())
    ),
    async upgrade() {
      for (const ev of ["data", "error", "close"]) sock.removeAllListeners(ev);
      sock = await ready(
        tls.connect({ socket: sock, servername: host }),
        "secureConnect"
      );
      attach(sock);
    },
    close: () => sock.destroy()
  };
}
async function workerWire(host, port, implicitTls) {
  const { connect } = await load("cloudflare:sockets");
  let sock = connect(
    { hostname: host, port },
    { secureTransport: implicitTls ? "on" : "starttls" }
  );
  let writer = sock.writable.getWriter();
  let reader;
  let upgrading = false;
  let onData = () => {
  };
  let onEnd = () => {
  };
  const pump = async () => {
    reader = sock.readable.getReader();
    try {
      for (; ; ) {
        const { value, done } = await reader.read();
        if (done) break;
        onData(value);
      }
      if (!upgrading) onEnd();
    } catch (e) {
      if (!upgrading)
        onEnd(e instanceof Error ? e : new Error("smtp read failed"));
    }
  };
  const enc = new TextEncoder();
  return {
    listen(d, e) {
      onData = d;
      onEnd = e;
      void pump();
    },
    write: (s) => writer.write(enc.encode(s)),
    async upgrade() {
      upgrading = true;
      reader.releaseLock();
      writer.releaseLock();
      sock = sock.startTls();
      writer = sock.writable.getWriter();
      upgrading = false;
      void pump();
    },
    close: () => void sock.close().catch(() => {
    })
  };
}

// functions/_lib/email.ts
var resend = async (m, env) => {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.EMAIL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.MAIL_FROM, to: m.to, subject: m.subject, text: m.text, html: m.html, reply_to: m.replyTo })
  });
  if (!r.ok) throw new Error(`resend ${r.status}${await reason(r)}`);
};
var postmark = async (m, env) => {
  const r = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: { "X-Postmark-Server-Token": env.EMAIL_API_KEY ?? "", "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ From: env.MAIL_FROM, To: m.to.join(","), Subject: m.subject, TextBody: m.text, HtmlBody: m.html, ReplyTo: m.replyTo, MessageStream: "outbound" })
  });
  if (!r.ok) throw new Error(`postmark ${r.status}${await reason(r)}`);
};
var sendgrid = async (m, env) => {
  const r = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.EMAIL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: m.to.map((email) => ({ email })) }],
      // SendGrid wants { email, name }, not the "Name <address>" form MAIL_FROM uses (.env.example).
      from: address(mailFrom(env)),
      reply_to: m.replyTo ? { email: m.replyTo } : void 0,
      subject: m.subject,
      content: [{ type: "text/plain", value: m.text }, { type: "text/html", value: m.html }],
      tracking_settings: { click_tracking: { enable: false }, open_tracking: { enable: false } }
    })
  });
  if (!r.ok) throw new Error(`sendgrid ${r.status}${await reason(r)}`);
};
var none = async (_m, env) => {
  if (env.LOCAL_DEV !== "true") throw new Error('EMAIL_PROVIDER "none" is for local development only (set LOCAL_DEV=true)');
};
var smtp = (m, env) => sendSmtp(m, { host: env.SMTP_HOST, port: Number(env.SMTP_PORT) || 587, user: env.SMTP_USER, pass: env.SMTP_PASS, from: address(mailFrom(env)) });
var adapters = { resend, postmark, sendgrid, smtp, none };
var mailFrom = (env) => env.MAIL_FROM?.trim() || ((env.EMAIL_PROVIDER ?? "").trim().toLowerCase() === "smtp" && env.SMTP_USER ? `Cambridge Hospital Website <${env.SMTP_USER}>` : "");
function mailConfigError(env) {
  const name = (env.EMAIL_PROVIDER ?? "").trim().toLowerCase();
  if (!Object.hasOwn(adapters, name)) return `EMAIL_PROVIDER "${name}" is not one of ${Object.keys(adapters).join(" | ")}`;
  if (name === "none") return env.LOCAL_DEV === "true" ? void 0 : 'EMAIL_PROVIDER "none" is for local development only (set LOCAL_DEV=true)';
  const needed = name === "smtp" ? ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"] : ["EMAIL_API_KEY", "MAIL_FROM"];
  const missing = needed.filter((k) => !env[k]?.trim());
  if (missing.length) return `${missing.join(" / ")} missing`;
  if (!address(mailFrom(env)).email) return 'MAIL_FROM is not an email address ("Name <address>" or "address")';
  return void 0;
}
async function sendMail(mail, env) {
  const problem = mailConfigError(env);
  if (problem) throw new Error(problem);
  await adapters[(env.EMAIL_PROVIDER ?? "").trim().toLowerCase()](mail, env);
}
function address(v) {
  const m = /^\s*(?:"?([^"<]*?)"?\s*)?<([^<>\s]+@[^<>\s]+)>\s*$/.exec(v);
  if (m) return m[1] ? { email: m[2], name: m[1] } : { email: m[2] };
  const plain = v.trim();
  return { email: /^[^\s@<>]+@[^\s@<>]+$/.test(plain) ? plain : "" };
}
async function reason(r) {
  try {
    const t = (await r.text()).replace(/[^\s"'<>,;:]+@[^\s"'<>,;:]+/g, "<email>").replace(/\s+/g, " ").trim();
    return t ? `: ${t.slice(0, 300)}` : "";
  } catch {
    return "";
  }
}

// src/lib/form-config.ts
function resolveForms(forms2) {
  const out = {};
  for (const [id, f] of Object.entries(forms2)) {
    if (!f.variantOf) {
      out[id] = { subject: f.subject ?? id, inbox: f.inbox ?? id, ...f.inboxEnv ? { inboxEnv: f.inboxEnv } : {}, fields: f.fields ?? [] };
      continue;
    }
    const base = forms2[f.variantOf];
    if (!base || base.variantOf) throw new Error(`forms.json: "${id}" is a variant of unknown or variant form "${f.variantOf}"`);
    const omit = new Set(f.omitGroups ?? []);
    out[id] = {
      subject: f.subject ?? base.subject ?? id,
      inbox: f.inbox ?? base.inbox ?? f.variantOf,
      ...f.inboxEnv ?? base.inboxEnv ? { inboxEnv: f.inboxEnv ?? base.inboxEnv } : {},
      fields: (base.fields ?? []).filter((x) => !omit.has(x.ui?.group ?? "details"))
    };
  }
  return out;
}

// functions/api/forms/[form].ts
var forms = resolveForms(
  forms_default.forms
);
var dialCodes = new Map(dial_codes_default.countries.map((c) => [c.iso, c.code]));
var MAX_BODY = 32 * 1024;
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
var TEL_RE = /^[0-9][0-9 ()-]{4,18}$/;
var DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
var sources = {
  specialties: new Map(
    specialties_default.specialties.map((s) => [s.id, s.name.en])
  ),
  doctors: new Map(doctors_default.doctors.map((d) => [d.slug, d.name.en])),
  hospitals: new Map(
    hospitals_default.hospitals.map((h) => [h.slug, `${h.brand.en} ${h.city.en}`])
  ),
  countries: new Map(countries_default.countries.map((c) => [c.code, c.name.en]))
};
var onRequestPost = async ({
  request,
  env,
  params
}) => {
  const wantsJson = (request.headers.get("Accept") ?? "").includes(
    "application/json"
  );
  const back = (status) => {
    const ref = request.headers.get("Referer");
    const url = new URL(
      ref && sameOrigin(ref, request) ? ref : "/",
      request.url
    );
    url.searchParams.set("form", status);
    return Response.redirect(url.toString(), 303);
  };
  const fail = (status, error, fields2) => wantsJson ? json({ ok: false, error, ...fields2 ? { fields: fields2 } : {} }, status) : back("error");
  const formId = String(params.form);
  const form = Object.hasOwn(forms, formId) ? forms[formId] : void 0;
  if (!form) return fail(404, "unknown_form");
  if (!originAllowed(request, env.ALLOWED_ORIGINS)) return fail(403, "origin");
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BODY)
    return fail(413, "too_large");
  let data;
  try {
    data = await request.formData();
  } catch {
    return fail(400, "bad_request");
  }
  const fields = {};
  const rows = [];
  for (const f of form.fields) {
    const v = String(data.get(f.name) ?? "").trim();
    const error = check(f, v, data);
    if (error) fields[f.name] = error;
    rows.push([f.label ?? f.name, display(f, v, data)]);
  }
  const consent = String(data.get("consent") ?? "");
  if (!["on", "true", "1", "yes"].includes(consent))
    fields.consent = "required";
  if (Object.keys(fields).length) return fail(422, "validation", fields);
  const rawEdition = String(data.get("edition") ?? "");
  const edition = /^(global|ae|sa)-(en|ar)$/.test(rawEdition) ? rawEdition : "global-en";
  const region = edition.split("-")[0];
  const inboxEnv = form.inboxEnv ?? `FORM_TO_${form.inbox.toUpperCase().replace(/-/g, "_")}`;
  const to = recipients(env[inboxEnv], region);
  const setup = [
    env.TURNSTILE_SECRET_KEY ? "" : "TURNSTILE_SECRET_KEY missing",
    to.length ? "" : `${inboxEnv} has no valid address for region ${region}`,
    mailConfigError(env) ?? ""
  ].filter(Boolean);
  if (setup.length) {
    console.error(`form ${formId}: not configured (${setup.join("; ")})`);
    return fail(500, "not_configured");
  }
  const human = await verifyTurnstile(
    String(data.get("cf-turnstile-response") ?? ""),
    env.TURNSTILE_SECRET_KEY,
    request.headers.get("CF-Connecting-IP")
  );
  if (human === "config") return fail(500, "not_configured");
  if (human !== "ok") return fail(403, "turnstile");
  rows.push(["Edition", edition], ["Consent", "yes"]);
  const email = String(data.get("email") ?? "").trim();
  try {
    await sendMail(
      {
        to,
        subject: `${form.subject} \u2014 website (${edition})`,
        text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
        html: `<table>${rows.map(([k, v]) => `<tr><th align="left">${esc(k)}</th><td>${esc(v).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table>`,
        replyTo: EMAIL_RE.test(email) ? email : void 0
      },
      env
    );
  } catch (e) {
    console.error(
      `form ${formId}: send failed (${e instanceof Error ? e.message : "unknown"})`
    );
    return fail(502, "send_failed");
  }
  return wantsJson ? json({ ok: true }) : back("sent");
};
function check(f, v, data) {
  if (!v) return f.required ? "required" : void 0;
  if (v.length > (f.max ?? 200)) return "too_long";
  switch (f.type) {
    case "email":
      return EMAIL_RE.test(v) ? void 0 : "invalid";
    case "tel":
      return TEL_RE.test(v) && dialCodes.has(String(data.get(`${f.name}_code`) ?? "")) ? void 0 : "invalid";
    case "date":
      return validDate(v) && !(f.name === "dob" && v > (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)) ? void 0 : "invalid";
    case "radio":
    case "rating":
      return f.options?.includes(v) ? void 0 : "invalid";
    case "select":
      if (f.source) return sources[f.source]?.has(v) ? void 0 : "invalid";
      return f.options && !f.options.includes(v) ? "invalid" : void 0;
  }
  return void 0;
}
function display(f, v, data) {
  if (!v) return "";
  if (f.type === "tel") {
    const iso = String(data.get(`${f.name}_code`) ?? "");
    return `${dialCodes.get(iso) ?? ""} ${v} (${iso})`;
  }
  if (f.type === "select" && f.source) return sources[f.source]?.get(v) ?? v;
  return v;
}
function validDate(v) {
  const m = DATE_RE.exec(v);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] && +m[1] >= 1900;
}
function recipients(value, region) {
  if (!value) return [];
  let list = value;
  if (value.trim().startsWith("{")) {
    try {
      const map = JSON.parse(value);
      list = map[region] ?? map.global ?? "";
    } catch {
      return [];
    }
  }
  return list.split(",").map((s) => s.trim()).filter((s) => EMAIL_RE.test(s));
}
var json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  }
});
var esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function sameOrigin(url, req) {
  try {
    return new URL(url).origin === new URL(req.url).origin;
  } catch {
    return false;
  }
}
function originAllowed(req, allowed) {
  if (req.headers.get("Sec-Fetch-Site") === "cross-site") return false;
  const origin = req.headers.get("Origin");
  if (!origin) return true;
  const list = allowed ? allowed.split(",").map((s) => s.trim()) : [new URL(req.url).origin];
  return list.includes(origin);
}

// tools/vercel/api-forms.ts
async function POST(request) {
  const form = decodeURIComponent(
    new URL(request.url).pathname.split("/").pop() ?? ""
  );
  const headers = new Headers(request.headers);
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0].trim();
  if (ip && !headers.has("CF-Connecting-IP"))
    headers.set("CF-Connecting-IP", ip);
  return onRequestPost({
    request: new Request(request, { headers }),
    env: process.env,
    params: { form },
    next: () => Promise.resolve(new Response(null, { status: 404 }))
  });
}
var notAllowed = () => new Response("Method Not Allowed", {
  status: 405,
  headers: { Allow: "POST" }
});
var GET = notAllowed;
var PUT = notAllowed;
var DELETE = notAllowed;
var PATCH = notAllowed;
export {
  DELETE,
  GET,
  PATCH,
  POST,
  PUT
};
