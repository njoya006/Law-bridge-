"""
Fix the original 6 books that still have inflated page counts.
Clear pages=None and expand their content.
"""
from apps.books.models import Book

def upd(title, subtitle, content):
    n = Book.objects.filter(title=title).update(
        pages=None, subtitle=subtitle, content=content,
    )
    wc = len(content.split())
    print(f"{'OK' if n else '??'} [{wc:,}w]: {title[:65]}")

upd(
'Introduction to OHADA Uniform Acts',
'A Practitioner\'s Guide to the OHADA Legal System',
"""# INTRODUCTION TO OHADA UNIFORM ACTS
## A Practitioner's Guide to the OHADA Legal System

---

# PART I: THE OHADA LEGAL FRAMEWORK

## Origins and Purpose

OHADA (Organisation pour l'Harmonisation en Afrique du Droit des Affaires — Organisation for the Harmonisation of Business Law in Africa) was created by the Treaty of Port-Louis, Mauritius, on 17 October 1993. It currently has seventeen Member States: Benin, Burkina Faso, Cameroon, Central African Republic, Chad, Comoros, Congo, Côte d'Ivoire, Democratic Republic of Congo (since 2012), Equatorial Guinea, Gabon, Guinea, Guinea-Bissau, Mali, Niger, Senegal, and Togo.

**The Problem OHADA Solved:** Before OHADA, each state in francophone Africa had its own commercial law — often outdated colonial-era legislation supplemented by ad hoc national reforms. This fragmentation made cross-border commerce difficult: a company doing business across five states faced five different contract law regimes, five different company law regimes, and five different dispute resolution systems. Investors saw legal uncertainty as a major obstacle to investment.

**OHADA's Solution:** A single body of "Uniform Acts" (Actes Uniformes) — legislation adopted by the Council of Ministers of all Member States, automatically applicable throughout OHADA territory without transposition into national law. An Uniform Act on commercial law in Cameroon is the same as the same Act in Senegal.

## The Uniform Acts in Force

There are currently ten OHADA Uniform Acts:

| Uniform Act | Subject | Year |
|---|---|---|
| AUDCG | General Commercial Law (traders, RCCM, commercial leases, commercial sales) | 1997, revised 2010 |
| AUSCGIE | Commercial Companies and Economic Interest Groups | 1997, revised 2014 |
| AUS | Securities (Sûretés) | 1997, revised 2010 |
| AUPSRVE | Simplified Recovery Procedures and Enforcement | 1998, revised 2023 |
| AUP/AUPCAP | Insolvency (Procédures Collectives d'Apurement du Passif) | 1999, revised 2015 |
| AUA | Arbitration | 1999, revised 2017 |
| AUDCIF | Accounting Law and Consolidated Accounts | 2000, revised 2017 |
| AUDT | Labour Law (Droit du Travail) | 2008 |
| AUC | Consumer Protection Law | 2010 |

## The Common Court of Justice and Arbitration (CCJA)

The CCJA in Abidjan, Côte d'Ivoire, is the supranational supreme court for all OHADA Uniform Acts. Its jurisdiction is dual:

**1. Judicial — Cassation Court:** The CCJA replaces the national supreme courts for matters of OHADA law. A final judgment of a national court on an OHADA law question is subject to cassation before the CCJA, not the national supreme court. This ensures uniform interpretation across all Member States.

**2. Arbitral Institution:** The CCJA administers international commercial arbitrations under its own rules, providing an alternative to ICC, LCIA, or ICSID arbitration for disputes within OHADA territory.

## Relationship Between OHADA and National Law

An OHADA Uniform Act overrides inconsistent national legislation. Where a Uniform Act is silent, national law fills the gap. Courts apply OHADA law first; national law supplements.

**In practice for Cameroon:**
- Commercial company law: governed by AUSCGIE (OHADA)
- Traders and commercial obligations: governed by AUDCG (OHADA)
- Labour law: governed partly by the Cameroonian Labour Code (national) — OHADA's AUDT is a supplementary instrument
- Insolvency: governed by AUPCAP (OHADA)
- Securities: governed by AUS (OHADA)
- Arbitration: governed by AUA (OHADA)
- Civil obligations (tort, non-commercial contract): governed by the Cameroonian Civil Code (national, derived from French Civil Code)

---

# PART II: HOW TO USE OHADA LAW IN PRACTICE

## Identifying the Applicable Text

To determine which law governs a dispute:
1. Is the party a trader (commerçant)? If yes → OHADA commercial law applies
2. Is the dispute about a company? → AUSCGIE applies
3. Is there a security interest? → AUS applies
4. Is there an insolvency situation? → AUPCAP applies
5. Is there an arbitration agreement? → AUA applies
6. Is there a commercial sale? → AUDCG Book V applies

## Finding OHADA Decisions

**Primary sources:**
- OHADA Official Gazette (Journal Officiel de l'OHADA): publishes all Uniform Acts and Council of Ministers decisions
- CCJA Recueil de Jurisprudence: published collections of CCJA decisions
- OHADA Online databases: ohada.com (free) and Doctrine OHADA (subscription)

**Citation format:** "CCJA, [Chamber], Decision No. [number]/[year] of [date], [parties]"

## Drafting Commercial Contracts Under OHADA

Key drafting points:
- Specify the applicable Uniform Act if more than one could apply
- For company contracts: ensure consistency with AUSCGIE requirements
- For credit agreements: comply with AUS security interest rules and RCCM registration
- For arbitration clauses: specify CCJA rules or another institutional set + seat in OHADA territory for UAA to apply
- For commercial leases: comply with AUDCG Book III (bail commercial) mandatory provisions

---

*This guide is current to all Uniform Acts in force as of 31 December 2023.*
""")

upd(
'Constitutional Framework of Cameroon',
'Separation of Powers, Federalism Debate, and Governance Institutions',
"""# THE CONSTITUTIONAL FRAMEWORK OF CAMEROON
## Separation of Powers, Decentralisation, and Governance Institutions

---

# PART I: THE CONSTITUTIONAL HISTORY OF CAMEROON

## From Mandate to Republic

Cameroon's constitutional history begins with German colonial rule (1884–1916), followed by French and British League of Nations Mandates (1920–1945) and UN Trust Territories (1945–1960/1961).

**1960:** French Cameroon achieved independence as the Republic of Cameroon with a constitution establishing a presidential system with a National Assembly.

**1961:** The result of the UN-supervised plebiscite in Southern British Cameroons led to federation with French Cameroon. The Federal Republic of Cameroon was governed by the Constitution of 1 September 1961 — a two-state federation with a federal president and separate state governments.

**1972:** President Ahmadou Ahidjo, following a referendum, replaced the federation with a unitary state under the Constitution of 2 June 1972, creating the United Republic of Cameroon.

**1984:** President Paul Biya changed the name to "Republic of Cameroon" — dropping the "United" — by Law No. 84/001.

**1996:** The Constitution of 18 January 1996 introduced: the Senate, decentralisation to regions, the Constitutional Council, constitutional review procedures, and the two-term limit (later removed in 2008).

**2008:** Law No. 2008/001 of 14 April 2008 removed the presidential term limit (allowing President Biya to run for re-election indefinitely) and introduced the Senate.

---

# PART II: THE EXECUTIVE BRANCH

## The President of the Republic

The President is the dominant figure in Cameroonian government. Under the 1996 Constitution:
- Elected by direct universal suffrage for 7-year terms (renewable once, in theory)
- Commander-in-Chief of the Armed Forces
- Chairs the Council of Ministers
- Guarantor of national independence, territorial integrity, and constitutional continuity
- Appoints and dismisses the Prime Minister and all members of government
- Signs all major legislative texts, ratifies treaties, issues decrees

**Powers in Emergency:** The President may declare a state of emergency or state of siege after consultation with the Presidents of the National Assembly and Senate. This power has been invoked in the Far North (Boko Haram crisis) and the North West and South West regions (Anglophone conflict).

## The Prime Minister

The Prime Minister heads the government but operates under the President's authority. The PM:
- Directs and coordinates government action
- Exercises regulatory power (signs decrees on routine matters)
- Signs appointments for most civil servants
- Is accountable to the President, not Parliament

In practice, the Prime Minister implements presidential policy rather than setting independent government direction.

---

# PART III: THE LEGISLATIVE BRANCH

## Bicameral Parliament

**The National Assembly (180 seats):** Elected by direct universal suffrage for 5-year terms in multi-member constituencies. The ruling CPDM party has maintained a dominant majority since the introduction of multiparty elections in 1990.

**The Senate (100 seats):** Introduced in 2013 (the first Senate elections were held in April 2013). 70 senators elected indirectly by regional councillors (7 per region); 30 senators appointed by the President of the Republic (3 per region). 5-year terms. The President of the Senate assumes the Presidency of the Republic in the event of the President's incapacitation or death.

**Legislative Powers:** Parliament enacts laws, votes on the Finance Act, and monitors executive action. In practice, the executive dominates the legislative agenda through its parliamentary majority.

---

# PART IV: THE JUDICIARY

**Dual Structure:** Cameroon has a dual judicial structure reflecting its bilingual heritage:
- French-speaking regions: civil law tradition, derived from French law
- English-speaking regions (NW and SW): common law tradition, derived from English law

**The Cour Suprême:** The supreme court for all judicial, administrative, and audit matters. Its three divisions are:
- Chambre Judiciaire: hears cassation appeals in civil and criminal matters
- Chambre Administrative: hears appeals in administrative matters
- Chambre des Comptes: audits public finances

**The Constitutional Council:** Established in 1996 but only constituted in 2018. Determines the constitutionality of laws (before promulgation) when referred by the President, Presidents of the National Assembly or Senate, or 1/3 of members of Parliament. Individual citizens cannot directly petition the Constitutional Council.

---

# PART V: DECENTRALISATION AND THE ANGLOPHONE QUESTION

## The 2019 Special Status

Following the outbreak of armed conflict in the North West and South West regions in 2016-2017, the government enacted Law No. 2019/004 of 25 April 2019 giving a Special Status to the two Anglophone regions. Key provisions:
- Regional Education Boards manage educational systems in line with the common law tradition
- English is the administrative language in the NW and SW regions
- English common law is maintained in courts of the two regions
- A House of Chiefs is established in each region

**The Crisis:** The special status has not resolved the conflict. Separatist groups (the "Ambazonia" movement) continue to demand independence or confederation. The crisis has caused massive internal displacement and economic disruption in the two regions.

---

*This analysis is current to constitutional developments through 31 December 2023.*
""")

upd(
'Criminal Procedure in Cameroon',
'Practice Guide: From Investigation to Sentencing',
"""# CRIMINAL PROCEDURE IN CAMEROON
## A Practice Guide: From Investigation to Sentencing

---

> This guide covers the same CPP (Law No. 2005/007) as the more detailed annotated edition "Criminal Procedure in the Courts of Cameroon." This practitioner's summary focuses on practical guidance for advocates.

---

# PART I: PRACTICAL CHECKLIST FOR CRIMINAL DEFENCE

## At the Police Station (Garde à Vue)

**Immediate steps for defence counsel:**
1. Request to see the client immediately — this right cannot be refused (Article 80 CPP)
2. Confirm the client has not been coerced into making statements
3. Advise the client of the right to silence
4. Note: the garde à vue is limited to 48 hours total (24h + one 24h extension with Procureur's authorisation). For terrorism: up to 15 days
5. Request a medical examination if there are signs of mistreatment
6. Confirm that the custody register (registre de garde à vue) shows the correct time of arrest

**Red flags requiring immediate escalation:**
- Client held beyond 48 hours without transfer to the juge d'instruction
- No food, water, or toilet access provided
- Signs of physical or psychological coercion
- Family not notified of arrest

## At the Judicial Investigation (Instruction Judiciaire)

**Rights of the inculpé (formally investigated person):**
- Right to be assisted by counsel at all hearings before the juge d'instruction
- Right to access the investigation file (dossier) after the first interrogation
- Right to request the juge to hear witnesses, conduct investigations, or commission experts
- Right to appeal orders of the juge d'instruction (including detention orders) to the Chambre d'Instruction of the Court of Appeal

**Challenging detention on remand:**
- Application for release (demande de mise en liberté) may be made to the juge d'instruction at any time
- If refused by the juge, the application goes to the Chambre d'Instruction
- Time limits must be checked: misdemeanour detention = max 18 months; felony = max 24 months

---

# PART II: KEY PROCEDURAL STAGES

## Stage 1: Police Investigation
- OPJ receives complaint or witnesses offence in flagrance
- OPJ conducts enquête préliminaire or enquête de flagrance
- OPJ drafts police report (procès-verbal) and transmits to the Procureur

## Stage 2: Prosecutorial Decision
- Procureur reviews file: prosecute, send to juge d'instruction, or class without further action (classement sans suite)
- For felonies: must send to juge d'instruction
- For misdemeanours: may prosecute directly before TPI by réquisitoire introductif or by direct citation

## Stage 3: Judicial Investigation (if ordered)
- Juge d'instruction investigates
- May issue mandat de dépôt (detention warrant), mandat d'amener (arrest warrant), or mandat de comparaître (appearance warrant)
- Investigation ends with ordonnance de renvoi (case sent to trial court) or ordonnance de non-lieu (no case to answer)

## Stage 4: Trial
- At TPI for misdemeanours; TGI for felonies
- Adversarial hearing: prosecution opens, defence responds
- Witnesses examined, evidence produced
- Closing arguments (réquisitoire de condamnation by prosecution; plaidoirie by defence)
- Judgment: guilt or acquittal; sentence if guilty
- Civil damages awarded to partie civile if applicable

## Stage 5: Appeal
- Within 10 days of judgment at the trial court
- Court of Appeal: full rehearing of law and fact
- Cassation to Cour Suprême: law only (no re-examination of facts)

---

# PART III: SPECIAL PROCEDURES

## The Special Criminal Court (Tribunal Criminel Spécial, TCS)

Created in 2012 to hear cases involving embezzlement of public funds above FCFA 50 million. Jurisdiction: financial crimes by public officials. Composed of a President and two assessors. No jury. Applies the same CPP procedural rules. Known for high-profile convictions of senior officials.

## Military Court (Tribunal Militaire)

Jurisdiction over offences by military and paramilitary personnel, and since the Anti-Terrorism Law of 2014, all terrorism-related offences regardless of the civilian status of the accused. This has been widely criticised by human rights organisations as removing terrorism suspects from civilian court protection.

---

*Current to all CPP amendments and related legislation through 31 December 2023.*
""")

upd(
'Employment Law in Cameroon',
'The Labour Code in Practice: Rights, Obligations, and Disputes',
"""# EMPLOYMENT LAW IN CAMEROON
## The Labour Code in Practice: Rights, Obligations, and Disputes

---

> This guide covers the same Labour Code (Law No. 92/007) as the more detailed "Cameroon Labour Code: An Annotated Guide." This edition focuses on practical application for HR managers and employer counsel.

---

# PART I: EMPLOYER COMPLIANCE CHECKLIST

## Hiring

- **Written contract:** Required for CDDs; strongly recommended for CDIs
- **CNPS registration:** Employee must be registered with the Caisse Nationale de Prévoyance Sociale within 8 days of commencement
- **Medical examination:** Required before commencement (médecin du travail)
- **Internal rules (Règlement Intérieur):** Mandatory for enterprises with 10+ workers; must cover discipline, hygiene, safety; deposit with Labour Inspectorate required
- **Minimum wage:** Check current SMIG applicable to the sector
- **Non-discrimination:** Job advertisement, interview, and selection must not discriminate on prohibited grounds

## During Employment

- **Pay slips:** Must be issued with each salary payment; must show all components and deductions
- **CNPS contributions:** Employer pays 11.2% of gross salary (family allowances 7%, work accidents 1.75%, pension 2.45%); employee pays 4.2%
- **Annual leave:** Ensure 18 working days' leave is taken or carried forward with agreement
- **Safety:** Conduct risk assessment; provide PPE; report accidents to CNPS and Labour Inspectorate within 48 hours

## Termination (CDI)

- **Written notice of dismissal (lettre de licenciement):** Must state the real and serious cause; served by registered post or hand delivery with signed receipt
- **Observe notice period:** Ensure minimum statutory notice is given or paid in lieu
- **Calculate indemnities:** Severance pay (indemnité de licenciement), notice pay (indemnité de préavis), and accrued leave (indemnité de congés)
- **Issue work certificate (certificat de travail):** Mandatory on termination; must state dates of employment and nature of work
- **Issue clearance (reçu pour solde de tout compte):** Settle all outstanding amounts; ask employee to sign receipt

---

# PART II: EMPLOYEE RIGHTS SUMMARY

| Right | Minimum Entitlement |
|---|---|
| Weekly working hours | 40 hours (48 hours in agriculture) |
| Overtime premium | +20% daytime; +40% nighttime; +75% Sundays/holidays |
| Annual leave | 18 days per year (+ 1 day per year over 5 years service) |
| Maternity leave | 14 weeks (6 pre-birth + 8 post-birth) |
| Minimum wage (non-agricultural) | FCFA 41,875/month (2023) |
| Minimum wage (agricultural) | FCFA 36,270/month (2023) |
| Probation maximum (managers) | 6 months |
| Probation maximum (employees) | 1 month |
| Probation maximum (labourers) | 15 days |

---

# PART III: DISPUTE RESOLUTION

## Labour Inspector Conciliation (Mandatory First Step)

Before going to court, any labour dispute must be submitted to the Labour Inspectorate for conciliation. The Inspector summons both parties within 15 days. If conciliation succeeds, the procès-verbal de conciliation is enforceable as a judgment. If it fails, a procès-verbal de non-conciliation enables the party to sue.

**Tip:** Bring supporting documents to the conciliation hearing — the Inspector may use them to produce a realistic settlement. Employers should bring the employment contract, pay slips, and dismissal letter.

## Tribunal du Travail

If conciliation fails, the case goes to the Tribunal du Travail. Claims must be filed within 2 years of the events. The tribunal sits with a professional judge + two assessors (one employer-side, one union-side). Hearings are relatively informal compared to ordinary civil courts. Judgments are enforceable immediately (exécution provisoire) unless the court suspends enforcement pending appeal.

---

*This guide is current to all Labour Code amendments and implementing decrees through 31 December 2023.*
""")

upd(
'Land Tenure in Cameroon',
'Practical Guide to Acquisition, Registration, and Security Over Land',
"""# LAND TENURE IN CAMEROON
## Practical Guide to Acquisition, Registration, and Security Over Land

---

> This practical guide covers the same 1974 land law framework as the more detailed "Land Tenure and Property Rights in Cameroon." This edition focuses on practical steps for property acquisition and security.

---

# PART I: PRACTICAL LAND ACQUISITION GUIDE

## Step 1: Due Diligence — Is the Land Available?

Before purchasing or leasing land in Cameroon, verify:

1. **Is there a Titre Foncier?** Request an extract (extrait) from the Land Registry. The extract shows: owner, surface area, address, and all encumbrances (mortgages, servitudes, pending litigation).

2. **What category is the land?**
   - Private property (Titre Foncier exists): the cleanest title — buy from the TF holder
   - National land (no TF): customary occupants have a right of priority but no formal title; you must first apply for title registration
   - State domain: cannot be privately acquired without a formal State allocation

3. **Are there customary occupants?** Even for land with no formal title, customary occupants have rights. Relocating them without compensation can expose a project to legal challenge.

4. **Is the land in a controlled zone?** Check for: national park boundaries, forest reserve boundaries, pipeline/road rights-of-way, riverbank setbacks, flood plains.

## Step 2: Sale and Transfer (if Titre Foncier Exists)

1. **Notarised sale deed (Acte de Vente Notarié):** All sales of titled land must be by notarised act. A private agreement is not valid for transfer of a Titre Foncier.

2. **Payment of transfer taxes:**
   - Mutation duty (droit de mutation): 10% of the sale price
   - Notary fees: 3-5% of sale price (regulated tariff)
   - Land Registry fees: FCFA 50,000-250,000 depending on surface area

3. **Update the Titre Foncier:** After signing the notarised deed and paying taxes, the Land Registry (Conservation Foncière) updates the TF to show the new owner.

## Step 3: First-Time Registration (National Land)

1. File application with the Departmental Land Service
2. Pay for boundary survey (bornage)
3. Attend Local Consultative Committee visit
4. Wait 30-day public notice period
5. Respond to any objections
6. Receive the Titre Foncier

**Time:** The process officially takes 3-6 months but frequently takes 2-5 years in practice due to administrative delays and land conflicts.

---

# PART II: MORTGAGES AND LAND SECURITY

## Granting a Mortgage

To mortgage a titled property:
1. Execute a notarised mortgage deed (Acte Hypothécaire)
2. Register the mortgage at the Land Registry — this annotates the Titre Foncier
3. The mortgage is now effective against third parties from the date of registration

**Priority rule:** First-registered mortgage has priority over subsequent ones. A lender doing due diligence must search the TF for prior registrations.

## Enforcing a Mortgage (Default)

On default, the mortgagee must obtain a court order for forced sale (vente judiciaire aux enchères publiques). The property is sold by public auction; proceeds are distributed to creditors in priority order. This process typically takes 2-4 years in Cameroon.

**Practical alternative:** In many cases, lenders prefer to negotiate an out-of-court sale (vente à l'amiable) with the borrower rather than enforce through the courts.

---

# PART III: COMMON LAND DISPUTES AND HOW TO AVOID THEM

| Dispute Type | Common Cause | Prevention |
|---|---|---|
| Boundary overlap | Inaccurate survey or fraud | Use licensed topographer; verify boundaries before purchase |
| Customary claim | Prior customary occupation not identified | Full due diligence including community consultation |
| State claim | Land misclassified as private when part of State domain | Check zoning maps at Departmental Land Service |
| Succession dispute | Undivided inheritance | Request certified extract showing all co-owners |
| Fraud | Forged TF | Verify TF directly at the Land Registry; never rely on copy alone |

---

*Current to all land law reforms through 31 December 2023.*
""")

upd(
'Arbitration in Cameroon',
'CCJA, GICAM, and Ad Hoc Arbitration Practice',
"""# ARBITRATION IN CAMEROON
## CCJA, GICAM, and Ad Hoc Arbitration — A Practitioner's Overview

---

> This guide covers practical arbitration in Cameroon. For the full legal framework, see "Arbitration Law and CCJA Practice in OHADA."

---

# PART I: CHOOSING YOUR ARBITRATION MECHANISM

## Option 1: CCJA Arbitration

The **Common Court of Justice and Arbitration (CCJA)** in Abidjan administers arbitrations under its own rules. Choosing CCJA arbitration is particularly appropriate where:
- The dispute concerns OHADA Uniform Act provisions
- The parties want the arbitral award to be directly executable in all 17 OHADA states without national exequatur proceedings (this is a major practical advantage)
- The parties prefer a well-established African institution

**CCJA Arbitration Clause:**
> "Any dispute arising out of or in connection with this contract, including any question regarding its existence, validity or termination, shall be referred to and finally resolved by arbitration administered by the CCJA in accordance with the CCJA Arbitration Rules."

## Option 2: GICAM Arbitration Centre

The Groupement Inter-Patronal du Cameroun (GICAM) operates the Centre d'Arbitrage du GICAM (CAG) in Douala. The CAG provides institutional arbitration for commercial disputes under Cameroonian law. Particularly suitable for purely domestic Cameroonian disputes where the parties prefer Yaoundé or Douala as the seat.

## Option 3: International Institutions

For large cross-border disputes involving international parties, ICC (Paris), LCIA (London), or ICSID (Washington — for investor-State disputes) are frequently specified.

## Option 4: Ad Hoc Arbitration under the OHADA UAA

Parties may agree on an ad hoc arbitration procedure without an institution, applying the OHADA Uniform Act on Arbitration. This reduces cost but requires more procedural discipline from the parties.

---

# PART II: DRAFTING A GOOD ARBITRATION CLAUSE

A poorly drafted arbitration clause can lead to litigation about whether to arbitrate before the arbitration even begins. Key elements of a good clause:

1. **Clear intent to arbitrate:** "Any and all disputes shall be finally resolved by arbitration..." (not "may be referred to arbitration")

2. **Specified institution and rules:** "...administered by the CCJA under the CCJA Arbitration Rules" or "...under the OHADA Uniform Act on Arbitration"

3. **Number of arbitrators:** "...before a sole arbitrator" (for smaller disputes) or "...before a tribunal of three arbitrators"

4. **Seat:** "The seat of the arbitration shall be Yaoundé, Cameroon" — the seat determines the lex arbitri (procedural law of the arbitration)

5. **Language:** "The language of the arbitration shall be French" or "...English and French (bilingual)"

6. **Governing law:** "This contract shall be governed by the laws of Cameroon including applicable OHADA Uniform Acts"

**Pathological clauses to avoid:**
- "Disputes may be referred to arbitration or to the courts of [city]" — creates jurisdictional ambiguity
- "Disputes shall be referred to arbitration, unless either party prefers the courts" — effectively eliminates arbitration
- Naming a non-existent institution or a closed arbitration centre

---

# PART III: ENFORCING AN AWARD IN CAMEROON

## Exequatur Procedure

A Cameroonian arbitral award becomes enforceable (executory) through the exequatur granted by the President of the competent court of first instance. For CCJA awards, the CCJA itself delivers the exequatur.

**Requirements for exequatur:**
- Original or certified copy of the award
- Proof of notification to the losing party
- The award is not contrary to public order

## Grounds for Setting Aside

An award may be set aside only if: the arbitral tribunal had no jurisdiction; the tribunal was improperly constituted; the award went beyond the submission; due process was violated; or the award violates international public order. Merits review is not possible — the courts cannot re-examine how the tribunal decided the case.

---

*Current to OHADA UAA 2017 revision and Cameroonian practice through 31 December 2023.*
""")

print("\n=== Original 6 books updated ===")
from apps.books.models import Book
for b in Book.objects.filter(status='published').order_by('title'):
    wc = len(b.content.split()) if b.content else 0
    print(f"  {wc:>5}w  pages={str(b.pages):<6}  {b.title[:60]}")
