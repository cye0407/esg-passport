# Tough ESG QA Questionnaires - July 13, 2026

Use these for local browser QA in `esg-passport`. They are designed to stress the audit fixes: dataBridge source precedence, dropped fields, plural matching, German aliases, generic-token precision, EN/DE generation, and honest gap behavior.

Expected QA stance:
- Good answers should use real entered/profile data when present.
- Missing data should be stated as not tracked / not documented.
- The engine should not fabricate policies, programs, targets, controls, certifications, or percentages.
- German questions should produce German answers without English boilerplate leakage.
- Scope-specific questions should not receive the generic Scope 1+2 block unless the question asks for total GHG.

---

## Questionnaire 1 - Buyer ESG Deep-Dive, English

| ID | Question | Stress target |
| --- | --- | --- |
| EN-01 | What is your total number of employees, including full-time equivalents and temporary staff? | H4 headcount vs products |
| EN-02 | Do you conduct sustainability assessments or audits of your suppliers, including corrective actions for non-compliance? | H5/H6 supplier plurals + H3 CAP field |
| EN-03 | Please describe your human rights due diligence process under LkSG, CSDDD, or similar supply-chain laws. | M13 due diligence + H3 HRDD |
| EN-04 | Do you have an anti-corruption and anti-bribery policy, and is it supported by a code of conduct? | H3 governance fields |
| EN-05 | Do you have a conflict of interest, AML, lobbying, political contributions, tax transparency, fair competition, or antitrust policy? | M20 ethics coverage |
| EN-06 | Are your products or minerals in scope for conflict minerals reporting, CMRT, EMRT, 3TG, or responsible minerals due diligence? | H3 conflict minerals |
| EN-07 | What percentage of packaging contains recycled content, and how much packaging waste was generated? | H3 packaging field + L10 dedupe |
| EN-08 | How do you ensure proper disposal of hazardous waste, including licensed carriers, manifests, and traceability? | H9 hazardous MEASURE |
| EN-09 | Do you measure Scope 3 emissions, and which categories are included? | Scope 3 retrieval under emissions |
| EN-10 | What are your Scope 1 emissions only? Do not include Scope 2. | Scope-specific template |
| EN-11 | What are your Scope 2 market-based and location-based emissions from purchased electricity? | Scope 2 template |
| EN-12 | What are your total greenhouse gas emissions across Scope 1 and Scope 2? | Full GHG template |
| EN-13 | Do you conduct a double materiality assessment and identify material topics? | H7 materiality |
| EN-14 | Describe your biodiversity, land-use-change, no-deforestation, palm oil, and ecosystem commitments. | M15 biodiversity |
| EN-15 | Do you track air emissions such as NOx, SOx, VOCs, PM2.5, PM10, noise pollution, spills, or releases to the environment? | M21 pollution vs carbon |
| EN-16 | Do you have documented cybersecurity, information security, data breach, ransomware, or SOC 2 controls? | M19 cyber |
| EN-17 | What is your gender pay gap, absenteeism rate, parental leave uptake, and employee engagement score? | M16 HR metrics |
| EN-18 | Do you operate a whistleblowing hotline or whistleblowing policy for grievances? | M23 whistleblowing |
| EN-19 | Do you publish a sustainability report and has it received external assurance under ISAE 3000 or AA1000? | assurance + transparency |
| EN-20 | Are any of your ESG data points not applicable rather than yes/no, including living wage, external assurance, or data protection? | M18 not_applicable |
| EN-21 | What is your annual turnover, net turnover, revenue band, and sales? | M7 turnover precision |
| EN-22 | What is your employee turnover rate and attrition trend? | M7 workforce turnover |
| EN-23 | What is your production output and production volume? | M2 output precision |
| EN-24 | Do you have power plant emissions, manufacturing plant locations, or do you plant trees? | M4 plant precision |
| EN-25 | What is your target market, market scope, and markets served? | L3 market precision |
| EN-26 | What are your ESG risks, risk assessment process, and risk management controls? | L4 risk precision |
| EN-27 | Do your products carry ecolabels, EPDs, Blue Angel, Nordic Swan, GOTS, GRS, FSC, RDS, or cruelty-free claims? | L13 ecolabel/material/animal testing |
| EN-28 | Have you completed DJSI, Sedex/SMETA, IntegrityNext, NQC, Achilles, CDP, EcoVadis, or supplier assurance questionnaires? | L13 ratings/frameworks |
| EN-29 | Describe your community engagement, local community investment, philanthropy, indigenous rights, or CSR programs. | M22 community |
| EN-30 | Do you have a data protection policy if the default privacy policy record is blank but the company profile says yes? | H1 dataBridge integration |
| EN-31 | Do you have a grievance mechanism if the default whistleblower policy record is blank but the company profile says yes? | H2 dataBridge integration |
| EN-32 | Are your ISO certifications current, expired, or not applicable? Please list all certifications held. | plural certs + ISO precision |

---

## Questionnaire 2 - German Buyer Questionnaire

| ID | Question | Stress target |
| --- | --- | --- |
| DE-01 | Wie viele Mitarbeitende hat Ihr Unternehmen insgesamt, einschließlich Vollzeitäquivalenten? | H4/H5 workforce |
| DE-02 | Wie hoch ist der Frauenanteil in Führungspositionen? | women-in-leadership alias |
| DE-03 | Wie hoch sind Ihre Scope-1-Emissionen? Bitte Scope 2 nicht einschließen. | H8 hyphenated Scope 1 |
| DE-04 | Wie hoch sind Ihre Scope-2-Emissionen standortbasiert und marktbasiert? | H8 Scope 2 |
| DE-05 | Erfassen Sie Scope-3-Emissionen und welche Kategorien berichten Sie? | Scope 3 retrieval |
| DE-06 | Führen Sie Nachhaltigkeitsbewertungen oder Audits Ihrer Lieferanten durch? | M24 supplier assessment |
| DE-07 | Gibt es einen Prozess für Korrekturmaßnahmen bei ESG-Verstößen von Zulieferern? | H3 CAP + zulieferer |
| DE-08 | Beschreiben Sie Ihre menschenrechtliche Sorgfaltspflicht nach LkSG oder Lieferkettensorgfaltspflichtengesetz. | M13 LkSG |
| DE-09 | Unterliegen Ihre Produkte der EUDR oder Entwaldungsverordnung? | M13 EUDR |
| DE-10 | Haben Sie eine Wesentlichkeitsanalyse oder doppelte Wesentlichkeitsanalyse durchgeführt? | H7 materiality |
| DE-11 | Gibt es eine Richtlinie gegen Korruption, Bestechung, Interessenkonflikte, Geldwäsche oder Lobbyarbeit? | H3/M20 ethics |
| DE-12 | Sind Konfliktmineralien, CMRT, EMRT oder 3TG für Ihr Unternehmen relevant? | H3 conflict minerals |
| DE-13 | Wie hoch ist der Rezyklatanteil Ihrer Verpackungen? | H3 packaging recycled content |
| DE-14 | Wie stellen Sie die ordnungsgemäße Entsorgung von Sondermüll und gefährlichen Abfällen sicher? | H9 hazardous MEASURE |
| DE-15 | Wie viel Abfall wurde recycelt und wie hoch ist die Recyclingquote? | L14 recycelt |
| DE-16 | Haben Sie Ziele oder Maßnahmen zu Biodiversität, Entwaldung, Landnutzungsänderung oder Ökosystemen? | M15 biodiversity |
| DE-17 | Erfassen Sie Luftemissionen wie NOx, SOx, VOC, Feinstaub, Lärm, Umweltvorfälle oder Leckagen? | M21 pollution |
| DE-18 | Haben Sie ein Programm für Cybersicherheit, Informationssicherheit oder den Umgang mit Datenpannen? | M19 cyber |
| DE-19 | Wie hoch sind Krankenstand, Fehlzeiten, Elternzeit, Entgeltlücke und Mitarbeiterzufriedenheit? | M14/M16 HR |
| DE-20 | Gibt es eine Whistleblowing-Richtlinie, Hinweisgeberkanal oder Beschwerdemechanismus? | M23 whistleblowing + DE aliases |
| DE-21 | Veröffentlichen Sie einen Nachhaltigkeitsbericht, und wurde er extern geprüft oder verifiziert? | M12 assurance |
| DE-22 | Sind Datenschutz, externe Prüfung oder existenzsichernde Löhne als nicht zutreffend markiert? | M18 not_applicable |
| DE-23 | Wie hoch ist Ihr Umsatz, Nettoumsatz und Ihre Umsatzklasse? | M11/M7 revenue |
| DE-24 | Wie hoch ist Ihre Fluktuationsrate? | M11/M7 workforce turnover |
| DE-25 | Welche Taxonomie-Bewertung oder EU-Taxonomie-Ausrichtung liegt vor? | M10 taxonomy |
| DE-26 | Welche DJSI-, Sedex-, SMETA-, IntegrityNext-, NQC-, Achilles-, CDP- oder EcoVadis-Bewertungen haben Sie abgeschlossen? | L13 frameworks |
| DE-27 | Beschreiben Sie gesellschaftliches Engagement, lokale Gemeinwesenarbeit, Spenden oder soziale Investitionen. | M22 community |
| DE-28 | Liegt eine Datenschutzrichtlinie vor, wenn der Standard-Datenschutzdatensatz leer ist, aber das Profil ja sagt? | H1 integration |
| DE-29 | Gibt es einen Beschwerdemechanismus, wenn der Standard-Hinweisgeberdatensatz leer ist, aber das Profil ja sagt? | H2 integration |
| DE-30 | Haben Sie an Ihren Standorten Wasserknappheit, Wasserstress oder Wassermangel bewertet? | DE water stress vs site |
| DE-31 | Welche Auszubildenden, Trainingsstunden und Entwicklungsprogramme erfassen Sie? | M14 training |
| DE-32 | Welche Zertifizierungen liegen vor, einschließlich ISO 14001, ISO 45001, ISO 9001 oder branchenspezifischer Standards? | cert routing |

---

## Questionnaire 3 - Mixed-Language Adversarial Sheet

| ID | Question | Stress target |
| --- | --- | --- |
| MIX-01 | Bitte list all current certifications, including ISO 14001 Zertifikate and expired certificates. | mixed certs |
| MIX-02 | What is your Umsatz and annual turnover, and does "turnover" mean revenue or employee attrition here? | turnover ambiguity |
| MIX-03 | Wie viele Fachkräfte und Führungskräfte are employed, and what percentage are women in leadership? | M17 stopgap |
| MIX-04 | Do your suppliers have Lieferantenbewertungen, supplier audits, or sustainability assessments separated from ratings? | supplier assessment |
| MIX-05 | Haben Sie Scope-1-, Scope-2- und Scope-3-Emissionen, but answer each scope separately. | scope separation |
| MIX-06 | Do you have external assurance, externe Prüfung, Prüfvermerk, or verifiziert ESG data? | assurance aliases |
| MIX-07 | Is data protection not applicable, no, yes, or unknown? Bitte nicht als "Yes" ausgeben, wenn not applicable. | M18 |
| MIX-08 | Are living wages marked N/A, and if so do not claim all employees receive a living wage. | M18 |
| MIX-09 | Do you have a Datenschutzrichtlinie if the policy library says not_available but profile says yes? | H1 integration |
| MIX-10 | Do you have a grievance mechanism if whistleblower policy is not_available but profile says yes? | H2 integration |
| MIX-11 | What are your carbon output, product output, and production output? Route each correctly. | M2 output |
| MIX-12 | Are you planting trees, operating a plant, or reporting power plant emissions? | M4 plant |
| MIX-13 | What is the risk of raw material price increases vs your ESG risk management process? | L4 risk |
| MIX-14 | What is your market risk, target market, and markets served? | L3 market |
| MIX-15 | Does your "policy statement" refer to ESG policy or an income statement? | L5 statement |
| MIX-16 | Are you ISO 8601 compliant, using ISO week numbering, or certified to ISO 14001? | L6 ISO precision |
| MIX-17 | Do you reuse passwords, reuse product materials, or operate a take-back program? | L7 reuse |
| MIX-18 | Do employees take coffee breaks, rest breaks, or career breaks? | L8 break |
| MIX-19 | Is this a construction site safety question, an office-location question, or number-of-sites question? | L9 site/office |
| MIX-20 | Do you track pollution emissions, GHG emissions, air emissions, and water effluents separately? | pollution vs GHG |

---

## Questionnaire 4 - Honest-Gap / Anti-Fabrication Checks

Use a sparse profile for this set. The expected behavior is mostly drafted "not documented/not tracked" language, not confident invented programs.

| ID | Question | What should not happen |
| --- | --- | --- |
| GAP-01 | Describe your biodiversity strategy, targets, governance, metrics, and no-deforestation controls. | Do not invent a biodiversity program |
| GAP-02 | Provide your AML, lobbying, political donation, tax transparency, antitrust, and conflict-of-interest controls. | Do not invent ethics controls |
| GAP-03 | Provide your cybersecurity incident response, ransomware readiness, SOC 2 status, and data breach history. | Do not invent a cyber program |
| GAP-04 | Provide your community investment budget, indigenous rights engagement, and philanthropy KPIs. | Do not invent community work |
| GAP-05 | Provide your NOx, SOx, VOC, PM2.5, PM10, noise, spill, and environmental-incident metrics. | Do not answer with carbon-only data |
| GAP-06 | Provide your gender pay gap, absenteeism, parental leave, employee engagement, and sick-leave figures. | Do not substitute generic diversity data as if complete |
| GAP-07 | Provide your supplier corrective-action process, escalation ladder, and termination policy. | Do not invent CAP steps |
| GAP-08 | Provide your hazardous-waste disposal process and manifest controls. | Do not answer only with tonnage |
| GAP-09 | Provide CMRT, EMRT, conflict-minerals, 3TG, and responsible-minerals evidence. | Do not invent CMRT/EMRT availability |
| GAP-10 | Provide external assurance standard, assurance provider, scope, and report year. | Do not claim assurance when N/A or unknown |
| GAP-11 | Provide data-protection policy owner, review date, GDPR scope, breach process, and employee training. | Do not claim a full GDPR program from a yes/no flag |
| GAP-12 | Provide LkSG/EUDR/CSDDD due-diligence steps, risk analysis, remediation, and complaints procedure. | Do not invent legal compliance procedures |

---

## Quick Smoke Set

If you only have 10 minutes, use these:

1. What is your total number of employees?
2. Do you conduct sustainability assessments or audits of your suppliers?
3. What are your Scope-3-Emissionen?
4. Haben Sie eine Wesentlichkeitsanalyse durchgeführt?
5. Is external assurance marked not applicable?
6. Wie hoch ist der Frauenanteil in Führungspositionen?
7. How do you ensure proper disposal of hazardous waste?
8. Do you have cybersecurity, data breach, or SOC 2 controls?
9. Beschreiben Sie Ihre menschenrechtliche Sorgfaltspflicht nach LkSG.
10. Do you have a data protection policy if profile says yes but default policy status is untouched?

