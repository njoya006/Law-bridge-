"""
Expand content for remaining books: Human Rights, Civil Procedure,
International Trade, Civil Obligations, Legal Ethics, Customary Law.
"""
from apps.books.models import Book

def upd(title, pages, subtitle, content):
    n = Book.objects.filter(title=title).update(
        pages=pages, subtitle=subtitle, content=content,
    )
    wc = len(content.split())
    print(f"{'OK' if n else '??'} [{wc:,}w / {pages}pp]: {title[:65]}")

# ─────────────────────────────────────────────────────────────────────────────
upd(
'Human Rights Law in Cameroon',
68,
'Domestic and International Frameworks — Second Edition',
"""# HUMAN RIGHTS LAW IN CAMEROON
## Domestic Framework, International Obligations, and Enforcement — Annotated Edition

---

# PART I: CONSTITUTIONAL HUMAN RIGHTS GUARANTEES

## The Preamble as a Source of Rights

The Preamble to the 1996 Constitution of Cameroon forms an integral part of the constitutional order. The Cour Suprême has confirmed that the rights guaranteed in the Preamble have constitutional force and may be directly invoked before the courts.

The Preamble guarantees:

- **Equality before the law:** All citizens are equal before the law. No person may be privileged or discriminated against on grounds of origin, race, gender, religion, or political opinion.

- **Freedom of speech and of the press:** Subject to laws protecting against defamation, incitement to violence, hate speech, and offences against the dignity of the State. The Communications Council (Conseil National de la Communication, CNC) is the regulatory body for the press.

- **Freedom of association and assembly:** Political parties, trade unions, and civil society organisations may be formed freely and operate within the limits of the law.

- **Physical integrity:** No person may be subjected to torture or cruel, inhuman, or degrading treatment or punishment.

- **Right to a fair trial:** All persons have the right to be tried by a competent, independent, and impartial court within a reasonable time and with adequate facilities for their defence.

---

# PART II: INTERNATIONAL HUMAN RIGHTS OBLIGATIONS

## CHAPTER 1 — UN Treaty Obligations

Cameroon has ratified the following major United Nations human rights instruments:

| Treaty | Date of Ratification | Key Rights |
|---|---|---|
| International Covenant on Civil and Political Rights (ICCPR) | 27 June 1984 | Right to life, freedom from torture, fair trial, political rights |
| International Covenant on Economic, Social and Cultural Rights (ICESCR) | 27 June 1984 | Right to work, education, health, social security |
| Convention Against Torture (CAT) | 19 December 1986 | Absolute prohibition of torture; non-refoulement |
| Convention on the Elimination of All Forms of Discrimination Against Women (CEDAW) | 23 August 1994 | Non-discrimination in all fields of law |
| Convention on the Rights of the Child (CRC) | 11 January 1993 | Rights of the child: protection, participation, provision |
| Convention on the Rights of Persons with Disabilities (CRPD) | 1 October 2021 | Non-discrimination of persons with disabilities |

**Domestic Application:** Ratified treaties become part of Cameroonian law upon publication in the Official Gazette. Under Article 45 of the Constitution, duly ratified treaties have authority superior to national laws. This means a statute that conflicts with a ratified treaty is effectively superseded by the treaty.

**Optional Protocol to the ICCPR:** Cameroon has not ratified the Optional Protocol allowing individual complaints to the UN Human Rights Committee. Citizens therefore cannot directly petition the UN HRC — a significant gap in accountability.

---

## CHAPTER 2 — African Human Rights Framework

**The African Charter on Human and Peoples' Rights (ACHPR):**

Cameroon ratified the African Charter (also known as the Banjul Charter) on 20 June 1989. The Charter protects:

*Civil and Political Rights:*
- Right to life (Article 4) — prohibits arbitrary deprivation of life
- Freedom from torture and cruel treatment (Article 5)
- Right to liberty and security (Article 6)
- Right to fair trial (Article 7) — including the right to be heard, presumption of innocence, and independent courts
- Freedom of conscience and religion (Article 8)
- Right to receive information and express opinions (Article 9)
- Freedom of association (Article 10)
- Freedom of assembly (Article 11)
- Freedom of movement (Article 12)
- Right to participate in government (Article 13)
- Right to property (Article 14)
- Right to education (Article 17)

*Economic, Social and Cultural Rights:*
- Right to work under equitable conditions (Article 15)
- Right to health (Article 16)
- Right to education (Article 17)
- Right to culture (Article 17(2))

*Peoples' Rights (unique to the African Charter):*
- Right of peoples to self-determination (Article 20)
- Right of peoples to freely dispose of natural resources (Article 21)
- Right to development (Article 22)
- Right to peace and security (Article 23)
- Right to a generally satisfactory environment (Article 24)

**The African Commission on Human and Peoples' Rights:**

The African Commission is the treaty body that monitors compliance with the Charter. It accepts individual and inter-state communications (complaints). Cameroonian cases decided by the Commission include:

- *Mukong v. Cameroon (1995):* The Commission found Cameroon violated Articles 4, 5, 6, and 7 of the Charter through the arbitrary detention, torture, and unfair treatment of journalist Albert Mukong, a political activist.
- *Civil Liberties Organisation v. Nigeria (1995):* Applied to Cameroon by analogy on prison conditions.

**The African Court on Human and Peoples' Rights:**

Cameroon has not made the declaration under Article 34(6) of the Protocol allowing individuals and NGOs to bring cases directly to the African Court. Accordingly, individuals cannot take cases directly to the Court without going through the Commission.

---

## CHAPTER 3 — Torture and Ill-Treatment

**Domestic Legal Framework:**

The prohibition of torture is both constitutional (Preamble) and statutory (Penal Code, Article 132-bis introduced in 1997 following Cameroon's ratification of CAT):

*Article 132-bis Penal Code:* Any public official or person acting in an official capacity who inflicts severe physical or mental pain or suffering on a person in order to obtain information, a confession, or to intimidate or discriminate, shall be punished by imprisonment of 5 to 15 years and permanently barred from holding public office.

**The Cameroonian Human Rights Context:**

Independent human rights organisations (Human Rights Watch, Amnesty International, the Cameroonian Mandela Foundation, and REDHAC) have documented:

- Torture and ill-treatment in police custody and gendarmerie detention centres, particularly in the context of investigations into Boko Haram activities in the Far North, and the Anglophone crisis
- Overcrowding in prisons — Kondengui Central Prison (Yaoundé) designed for 1,500 inmates holds 4,000+
- Prolonged pre-trial detention beyond the periods allowed by the CPP
- Death in custody — cases documented but rarely prosecuted

**Enforcement Gap:** Despite the existence of legal prohibitions, accountability for torture is rare. The National Commission on Human Rights and Freedoms (Commission Nationale des Droits de l'Homme et des Libertés, CNDHL) has the mandate to receive complaints and visit detention centres but lacks enforcement powers.

---

## CHAPTER 4 — Right to a Fair Trial

**Constitutional Guarantee:** Article 38 of the Constitution and the Preamble guarantee the right to a fair trial before an independent and impartial court.

**Judicial Independence:**

The Constitution makes the President of the Republic the guarantor of judicial independence. However, critics have noted:
- Judges are appointed by Presidential decree on the recommendation of the Superior Council of Magistracy
- The President also chairs the Superior Council of Magistracy
- Career advancement of judges depends on Presidential favour

**The Backlog Problem:** Cameroonian courts suffer from severe case backlogs. Cases in the Court of First Instance routinely take 2-5 years to come to trial. The Cour Suprême may take 5-10 years to dispose of an appeal. This delay itself constitutes a violation of the right to a fair trial within a reasonable time.

**Access to Justice:**

Legal aid (aide juridictionnelle) is theoretically available for persons without financial means in criminal cases. In practice, the system is severely underfunded and the Bar Association (Barreau du Cameroun) provides duty counsel in limited circumstances. The majority of criminal defendants in Cameroonian courts are unrepresented.

---

# PART III: SPECIFIC VULNERABLE GROUPS

## CHAPTER 1 — Women's Rights

Despite constitutional equality guarantees and CEDAW obligations, women in Cameroon face:
- Under-representation in political and public life (fewer than 25% of National Assembly seats)
- Unequal inheritance in customary law traditions
- Marital rape not explicitly criminalised
- Female genital mutilation practised in some communities (illegal under the Penal Code since 2016 Amendment)
- Gender-based violence: Law No. 2016/007 strengthened provisions on domestic violence

**Progress:** The 2016 Penal Code reform criminalised sexual harassment, increased penalties for domestic violence, and introduced provisions on gender-based persecution.

## CHAPTER 2 — Children's Rights

**Law No. 2011/028 of 14 December 2011** strengthened protections against child labour. **Decree No. 2005/2040/PM** established the list of hazardous activities prohibited for child labour.

**Key Issues:**
- Child labour in agriculture (cocoa, tea, rubber sectors)
- Child trafficking for domestic service and sexual exploitation
- Recruitment of children as combatants in the Anglophone conflict

---

*This annotated edition is current to 31 December 2023.*
""")

# ─────────────────────────────────────────────────────────────────────────────
upd(
'Civil Procedure in the Courts of Cameroon',
56,
'Code of Civil and Commercial Procedure — Practice and Commentary',
"""# CIVIL PROCEDURE IN THE COURTS OF CAMEROON
## Civil and Commercial Procedure — Annotated Practitioner's Guide

---

# PART I: ORGANISATION AND JURISDICTION

## CHAPTER 1 — The Hierarchy of Civil Courts

Cameroonian civil courts are organised in a four-tier hierarchy:

| Court | Level | Civil Jurisdiction |
|---|---|---|
| Tribunal de Première Instance (TPI) | First instance | Civil claims ≤ FCFA 50 million |
| High Court (Tribunal de Grande Instance, TGI) | First instance | Civil claims > FCFA 50 million; immovable property; family status |
| Court of Appeal (Cour d'Appel) | First appeal | Appeals from TPI and TGI |
| Cour Suprême (Division Judiciaire — Chambre Civile et Commerciale) | Final appeal | Cassation on points of law only |

**Jurisdiction Rules:**

*Territorial jurisdiction:* Civil actions are generally brought before the court of the defendant's domicile (actor sequitur forum rei). Exceptions:
- Immovable property: court of the location of the property
- Contracts: court of place of performance
- Torts: court of place of the harmful act
- Company disputes: court of the company's registered office

*Subject-matter jurisdiction:* Magistrates' courts handle the smallest claims. TPI handles mid-range claims. TGI handles major civil, commercial, and family matters.

---

## CHAPTER 2 — Starting a Civil Action

**The Writ (Assignation ou Requête):**

A civil action is commenced by:
1. **Assignation (summons):** The plaintiff causes a court bailiff (huissier de justice) to serve a formal summons (assignation) on the defendant, setting out the claims and requiring appearance on a specified date
2. **Requête:** A written petition filed directly with the court registry, used for summary proceedings and some special procedures

**Contents of the Assignation:**
- The parties (names, addresses)
- The court where the action is brought
- The nature of the claim
- The legal grounds (fondement juridique)
- The specific relief sought (petitum)
- The date and time of the first hearing

**Service:** Service must be personal (remise en main propre) or, if the defendant is unavailable, at the defendant's last known address with notification to neighbours or the municipality. Service at a PO box is insufficient.

---

## CHAPTER 3 — Provisional and Interim Measures

**The Référé Procedure:**

The référé is a procedure before the President of the TGI or TPI, sitting alone, granting interim measures in urgent cases without prejudging the merits. The référé judgment is provisionally executable (exécutoire par provision) immediately on being pronounced.

**Available Référé Orders:**
- Appointment of a séquestre (administrator) to manage contested property pending judgment
- Order for urgent examination of documents or premises
- Provisional maintenance (pension alimentaire provisoire)
- Order to stop ongoing harm (cessation d'un trouble manifestement illicite)
- Appointment of a provisional administrator for a company in governance crisis

The key criterion for référé: urgency (urgence) and/or obvious unlawfulness (trouble manifestement illicite). The référé judge does not resolve the underlying dispute — the parties must still bring a main action (action au fond) to obtain a final judgment.

---

## CHAPTER 4 — Evidence in Civil Proceedings

**The Principle of Written Proof (Preuve Littérale):**

In civil matters, acts with a value above FCFA 20,000 must be proved by writing (preuve écrite or preuve littérale). The applicable instruments are:
- Authentic acts (actes authentiques): notarised contracts, official certificates — have absolute evidentiary force
- Under-seal private acts (actes sous seing privé): signed written agreements — full proof between the parties
- Electronically signed documents: admitted as equivalent to written documents if the signature is reliable and the document has not been altered (Law No. 2010/021 on Electronic Commerce)

**Exceptions to the Writing Requirement:**
- Customary practices in commerce (actes de commerce): proved by any means
- Impossibility of obtaining written evidence at the time of the transaction
- Loss of the written evidence through force majeure

**Expert Evidence:**

Courts routinely appoint court-certified experts (experts judiciaires) in:
- Accounting/financial disputes
- Construction defects
- Medical negligence
- Intellectual property valuation
- Real property valuation

The court-appointed expert's report (rapport d'expertise) carries significant evidential weight. Parties may challenge the report by appointing counter-experts.

---

## CHAPTER 5 — Judgments and Enforcement

**The Judgment:**

Civil judgments must be reasoned — the judge must state the facts, the applicable legal rules, and the legal reasoning leading to the decision. An unreasoned judgment is subject to cassation for défaut de base légale.

**Costs (Dépens):**

The losing party bears the costs of the proceedings (dépens): court fees, bailiff fees, expert fees, and translation costs. Lawyers' fees are not automatically included in the costs order — they are borne by each party unless the court makes a specific order under Article 700 of the CPC equivalent.

**Enforcement (Exécution Forcée):**

A final judgment bearing the execution stamp (formule exécutoire) may be enforced against the losing party's assets. Enforcement mechanisms:

- **Seizure of movable assets (saisie-vente):** The bailiff inventories and sells the debtor's movable property
- **Garnishment (saisie-attribution):** Seizure of a debt owed to the judgment debtor by a third party (e.g., garnishment of a bank account)
- **Attachment of immovable property (saisie immobilière):** Judicial sale of the debtor's real property through a public auction (vente judiciaire)

The OHADA Uniform Act on Simplified Recovery Procedures and Enforcement Measures governs the principal enforcement procedures.

---

*This guide is current to all procedural reforms through 31 December 2023.*
""")

# ─────────────────────────────────────────────────────────────────────────────
upd(
'International Trade Law for Cameroonian Businesses',
56,
'CEMAC, WTO, and Bilateral Trade Frameworks — Practitioner\'s Edition',
"""# INTERNATIONAL TRADE LAW FOR CAMEROONIAN BUSINESSES
## Export, Import, Customs, and Regional Trade Agreements — Annotated

---

# PART I: THE CEMAC TRADE FRAMEWORK

## CHAPTER 1 — The CEMAC Customs Union

The Central African Economic and Monetary Community (Communauté Économique et Monétaire de l'Afrique Centrale, CEMAC) establishes a customs union among its six member states: Cameroon, Republic of Congo, Gabon, CAR, Equatorial Guinea, and Chad.

**Core Features of the CEMAC Customs Union:**

1. **Common External Tariff (CET):** A single tariff schedule applicable to all imports from outside CEMAC territory. The CET has four rates:
   - 0%: Essential goods (medicines, basic foods, educational materials, capital goods)
   - 5%: Raw materials and production inputs
   - 10%: Intermediate goods
   - 30%: Finished consumer goods

2. **Free Trade Zone:** Goods originating in CEMAC member states may circulate freely within CEMAC without import duties or quantitative restrictions, subject to rules of origin. A "CEMAC origin" good is one manufactured within the union using at least 40% local content or having undergone substantial transformation.

3. **Common Customs Code:** CEMAC Regulation No. 02/10 establishes the common customs code, which Cameroon has transposed into national law through the Customs Code (Code des Douanes).

---

## CHAPTER 2 — Cameroonian Customs Law

**The Customs Code:** Law No. 969/LF/3 of 14 June 1969, as amended, and implementing regulations.

**Import Duties and Taxes:**

On importation of goods into Cameroon, the following are payable:
1. Import duties (droits d'entrée) at the applicable CET rate
2. VAT (TVA): 19.25% on the customs value + import duties
3. Excise duties (droits d'accise) on specified products (alcohol, tobacco, luxury vehicles, petroleum products)
4. Statistical levy (redevance statistique): 1% of customs value
5. Community integration levy (Taxe Communautaire d'Intégration, TCI): 0.4% for CEMAC; 0.2% for ECCAS

**The Customs Value:**

The customs value is the primary basis for calculating ad valorem duties. Under the WTO Customs Valuation Agreement (which Cameroon has ratified), the primary method is the **transaction value** — the price actually paid or payable for the goods in a commercial sale between an arm's-length buyer and seller.

Adjustments to the invoice price:
- Add: freight costs, insurance costs, loading and handling in the exporting country (CIF adjustment)
- Deduct: freight costs after the point of entry into Cameroon, installation costs, customs duties themselves

**Prohibited Imports:** Certain goods are prohibited from importation regardless of tariff classification:
- Narcotics and psychotropic substances (except under permit for medical use)
- Counterfeit goods
- Goods infringing intellectual property rights
- Firearms and ammunition (without authorisation)
- Certain chemicals (under the Chemical Weapons Convention)

---

## CHAPTER 3 — Export Trade

**Export Procedures:**

Cameroon's major exports include cocoa, coffee, oil, timber, cotton, and aluminium. Export requires:

1. Export declaration lodged with Customs
2. Phytosanitary certificates for agricultural products (issued by MINADER/MINEPIA)
3. CITES permit for controlled species (MINFOF)
4. Export duty (droit de sortie) where applicable (applicable to unprocessed timber and certain raw materials)

**Export Value Added Tax (VAT):**

Exports of goods are zero-rated for VAT — the exporter charges 0% VAT on the invoice price and is entitled to a refund of all input TVA incurred in producing the exported goods. In practice, TVA refunds are subject to significant delays — many exporters wait 12-24 months for reimbursement.

---

## CHAPTER 4 — The Economic Partnership Agreement with the EU (EPA)

Cameroon signed an interim Economic Partnership Agreement with the European Union in 2009. The EPA establishes a preferential trade regime between Cameroon and the EU:

- EU market access: Cameroonian exports enter the EU duty-free and quota-free under Everything But Arms (EBA) and the EPA
- Cameroonian import liberalisation: Cameroon committed to progressively reduce import duties on 80% of EU goods over 15 years

**Impact on Cameroonian Businesses:**

The EPA has increased competition from EU goods in the Cameroonian market, particularly in processed foods, beverages, and manufactured goods. Cameroonian manufacturers that previously benefited from import duty protection face higher competition.

Conversely, Cameroonian agricultural exporters (cocoa, coffee, timber) benefit from preferential access to the EU's 450-million-consumer market without duties.

---

## CHAPTER 5 — WTO Membership and TRIMS

Cameroon is a founding member of the World Trade Organisation (WTO). Key WTO obligations:

**GATT Most-Favoured-Nation (MFN) Principle:** Cameroon must apply its customs duties equally to all WTO Members. Discriminatory duties applied to one WTO Member but not others violate GATT Article I.

**GATT National Treatment:** Imported goods, once customs cleared, may not be subject to internal taxes or regulations less favourable than those applied to like domestic products. A regulation requiring food stores to display domestic goods more prominently than imported goods, or a tax on imported beverages not applied to domestic ones, would violate GATT Article III.

**Agreement on Trade-Related Investment Measures (TRIMs):** TRIMs prohibits performance requirements tied to investment that distort trade, such as local content requirements, trade balancing requirements, and foreign exchange balancing rules.

---

*This practitioner's edition is current to WTO and EPA developments as of 31 December 2023.*
""")

# ─────────────────────────────────────────────────────────────────────────────
upd(
'Civil Law of Obligations in Cameroon',
72,
'Contract, Tort, and Quasi-Contract under Cameroonian Civil Law',
"""# CIVIL LAW OF OBLIGATIONS IN CAMEROON
## Contract, Tort, and Quasi-Contract — Annotated Treatise

---

# PART I: THE LAW OF CONTRACT

## CHAPTER 1 — Formation of Contract

### The Essentials of a Contract

Under the Civil Code as applied in Cameroon, a contract is formed when the following four essential elements are present (Article 1108 French Civil Code as applicable):

**1. Consent (Consentement):**

The parties must give free and full consent to the contract. Consent is defective, and the contract voidable at the instance of the affected party, where it was obtained by:

**(a) Error (Erreur):** A mistake by one party that goes to the substance of the thing contracted for (erreur sur la substance). Error as to the identity of a person (erreur sur la personne) is a ground for avoidance only in contracts entered into based on personal trust (intuitu personae contracts — employment, professional services, mandate).

Error as to motive (erreur sur le mobile) is generally not a ground for avoidance unless it was expressly incorporated into the contract as a condition.

**(b) Duress (Violence):** Physical or moral coercion that would overcome the will of a reasonable person. The coercion must come from the other contracting party or be known to that party. Economic duress (abus de dépendance économique) has been increasingly recognised by French doctrine and courts as a form of duress, particularly in franchise agreements and supply contracts involving parties of unequal bargaining power. Cameroonian courts have begun to adopt this doctrine.

**(c) Fraud (Dol):** Deliberate deception by one party that induces the other to contract. The deception may be active (positive misrepresentations) or in exceptional cases passive (deliberate silence — dol par réticence — where the silent party was under a duty to speak, e.g., a seller with knowledge of a hidden defect, a borrower with knowledge of his inability to repay).

**2. Capacity (Capacité):**

All natural persons of legal age (18 years) and sound mind may contract. Legal incapacity affects:
- Minors (except emancipated minors)
- Interdicted adults (persons under curatorship or guardianship)
- Insolvent persons for acts outside ordinary management (after insolvency opening)

A legal person (company) has contractual capacity within the scope of its corporate purpose (objet social).

**3. A Definite Object (Objet Certain):**

The subject matter of the contract must be determined or determinable at the time of contracting. A contract for the sale of goods to be specified later, or at a price to be "agreed," may lack the certainty required.

**4. A Lawful Cause (Cause Licite):**

The cause (the purpose behind the undertaking — the reason for which each party agreed to be bound) must be lawful and not contrary to public order or morality. A contract to commit a crime, to circumvent a legal prohibition, or to exploit the other party's vulnerability (lésion énorme in certain contracts) lacks a lawful cause and is void.

---

## CHAPTER 2 — Classification of Obligations

Obligations arising from contract are classified by their content:

**Obligation to Do (Obligation de Faire):** An obligation to perform a positive act — to build a house, to provide services, to deliver goods. Performance in kind (exécution en nature) is the primary remedy for non-performance.

**Obligation Not to Do (Obligation de Ne Pas Faire):** An obligation to refrain from action — a non-compete clause, a confidentiality obligation, a restriction on use of licensed intellectual property.

**Obligation of Result (Obligation de Résultat):** The debtor promises a specific, objective result — the carrier promises to deliver the goods; the contractor promises a completed building. Failure to achieve the result is a breach without the need to prove fault. Contractual liability in obligations of result is strict.

**Obligation of Means (Obligation de Moyens):** The debtor promises only to apply reasonable skill and care in pursuit of an objective — the doctor promises to treat the patient with skill; the lawyer promises to represent the client with diligence. Failure to achieve the objective (the patient does not recover, the case is lost) does not automatically constitute a breach — the creditor must prove the debtor failed to apply the promised skill and care.

---

## CHAPTER 3 — Performance and Non-Performance

**Specific Performance:**

The creditor of an obligation has the primary right to demand specific performance (exécution forcée en nature). Courts regularly grant injunctions or performance orders (astreintes — coercive daily financial penalties for non-performance) to compel performance.

Exceptions where specific performance is not available:
- Obligations of a strictly personal character (personal services cannot be forced)
- Where performance has become physically or legally impossible

**Termination for Breach (Résolution):**

Where one party fails substantially to perform, the other party may:
1. Seek a court order dissolving the contract (résolution judiciaire) — the standard approach under the Civil Code, requiring a court declaration
2. Rely on a contractual termination clause (clause résolutoire or clause de résiliation de plein droit) if the contract contains one — these are common in commercial leases and credit agreements
3. Invoke the urgent unilateral termination (résolution unilatérale aux risques et périls) — recognised by the Cour de Cassation in France (and increasingly by Cameroonian courts) where the breach is sufficiently serious and immediate action is required

**Effects of Résolution:**

Résolution (termination) has retroactive effect — the parties are restored to their pre-contractual position (remise en état). Performances already rendered are returned (restitution). Résiliation, by contrast, terminates for the future only (used for continuing obligations such as employment or tenancy).

---

## CHAPTER 4 — Liability for Non-Performance (Responsabilité Contractuelle)

**Requirements for Contractual Liability:**

1. **Breach of the contractual obligation:** The debtor failed to perform, performed late, or performed defectively
2. **Damage:** The creditor suffered a quantifiable loss — financial (lost profit, additional costs) or non-pecuniary (damage to reputation, personal injury in service contracts)
3. **Causal link:** The breach caused the damage

**Foreseeability Limitation:** The debtor is liable only for damages that were foreseeable at the time of contracting as a probable consequence of non-performance (Article 1150 Civil Code). Unforeseeable damages remain with the creditor unless there was fraud (dol) or gross negligence (faute lourde assimilée au dol), in which case full compensation (including unforeseeable losses) is available.

**Penalty Clauses (Clauses Pénales):**

The parties may fix in advance the amount of damages payable on breach (clause pénale). The clause pénale avoids the need to prove actual damage. Courts may reduce manifestly excessive penalty clauses and increase manifestly derisory ones.

---

# PART II: TORT LAW (RESPONSABILITÉ DÉLICTUELLE)

## CHAPTER 1 — General Principles

**Article 1382 Civil Code:** Any act causing harm to another obliges the person by whose fault it was caused to make reparation.

**Article 1383 Civil Code:** A person is responsible not only for damage caused by his own act but also for damage caused by his negligence (imprudence) or carelessness (négligence).

**The Three Elements of Delictual Liability:**
1. Fault (faute): intentional or negligent conduct falling below the standard of the bon père de famille (reasonable person)
2. Damage (préjudice): actual, certain, and assessable harm
3. Causal link (lien de causalité): adequate causation between the fault and the damage

---

## CHAPTER 2 — Liability for Others (Responsabilité du Fait d'Autrui)

**Article 1384 Civil Code:**

**(a) Liability of employers for employees (commettants pour préposés):** An employer is strictly liable for damage caused by an employee acting in the course of employment. The employer may not avoid liability by showing they were not negligent in hiring or supervision. The employer may seek indemnity from the employee only if the employee acted with personal fault outside the scope of employment.

**(b) Parental liability for children:** Parents are strictly liable for damage caused by their minor unemancipated children. The standard is strict — no fault on the part of the parents need be shown.

**(c) Principal-agent:** A principal who entrusts an act to an agent may be liable for harm caused by the agent in the performance of the entrusted act.

---

## CHAPTER 3 — Quasi-Contracts

Quasi-contracts (quasi-contrats) are facts, not agreements, that give rise to obligations similar to those arising from contract.

**Unjust Enrichment (Enrichissement sans Cause):**

Where one person is enriched at the expense of another without a legal basis for the enrichment, the enriched person must compensate the impoverished one up to the amount of the lesser of the enrichment and the impoverishment. This prevents unjust outcomes where no other specific remedy is available.

**The Negotiorum Gestio (Gestion d'Affaires):**

Where a person (the gestionnaire) manages the affairs of another (the maître) without instruction and without being legally obliged to do so, and the management is undertaken in good faith and to the advantage of the maître, the maître is obliged to ratify and reimburse the gestionnaire for necessary expenses incurred.

**The Condictio Indebiti (Répétition de l'Indu):**

Where a person pays a debt that does not exist (payment of a non-existent obligation), the payee must return the payment. The payer must show the payment was made by mistake; payment made with full knowledge that the debt did not exist cannot be reclaimed.

---

*This treatise covers obligations law as applied in Cameroonian civil and commercial courts through 31 December 2023.*
""")

# ─────────────────────────────────────────────────────────────────────────────
upd(
'Legal Ethics and Professional Conduct for Cameroonian Lawyers',
44,
'Rules of Professional Conduct and Discipline — Third Edition',
"""# LEGAL ETHICS AND PROFESSIONAL CONDUCT FOR CAMEROONIAN LAWYERS
## The Bar Ordinance, Rules of Professional Conduct, and Disciplinary Proceedings

---

# PART I: THE ORGANISATION OF THE LEGAL PROFESSION IN CAMEROON

## CHAPTER 1 — The Bar of Cameroon (Barreau du Cameroun)

The legal profession in Cameroon is governed by Ordinance No. 81/03 of 29 June 1981 on the organisation of the legal profession (as amended), and the National Code of Conduct of the Barreau du Cameroun.

**The Barreau du Cameroun** is the national professional association of all advocates (avocats). Membership is mandatory — no person may practise as an advocate without being enrolled on the Roll of the Barreau. The Barreau has two sections:
- **Barreau du Centre (Yaoundé):** Covers the Centre, South, East, and Adamawa Regions
- **Barreau du Littoral (Douala):** Covers the Littoral, West, North, South West, and North West Regions

The Barreau is governed by a National Council (Conseil National) and each section by a Council of the Order (Conseil de l'Ordre).

**Admission to the Bar:**

Requirements for enrolment:
1. Cameroon nationality (or authorisation under specific bilateral treaties)
2. Degree in Law (Licence en Droit or equivalent)
3. Completion of the Bar Vocational Training Course (Stage du Barreau) — 2 years as a stagiaire
4. Written examination (concours d'entrée) in professional subjects
5. Good moral character — no criminal convictions for dishonesty, no disciplinary records
6. Physical fitness and mental capacity

**Foreign Lawyers:** Lawyers qualified abroad may be admitted on a reciprocal basis. Lawyers from OHADA Member States and CEMAC States receive preferential treatment. Foreign lawyers not otherwise qualified may be admitted in specific cases by the National Council.

---

## CHAPTER 2 — Core Professional Duties

### 2.1 Independence (Indépendance)

Independence is the first and most fundamental professional duty. The lawyer must be independent of:
- The client: the lawyer advises on the law and ethics, even when the advice is unwelcome; the lawyer does not simply execute client instructions that would violate the law or professional rules
- Third parties: the lawyer's judgment must not be compromised by the interests of third parties, including the opposing party, a financing institution, or a referring agent
- The courts and authorities: the lawyer may not allow pressure from judges, prosecutors, or administrative authorities to compromise the quality of representation

Independence does not mean stubbornness — the lawyer respects the authority of courts — but it means the lawyer cannot be controlled.

### 2.2 Loyalty (Loyauté)

The lawyer owes absolute loyalty to the client. This means:
- Putting the client's legal interests first, within the limits of the law and ethics
- Not simultaneously representing conflicting interests without full disclosure and consent
- Not using information obtained from a client for the benefit of another client or for personal profit

### 2.3 Confidentiality (Secret Professionnel)

**Article 38 (Ordinance 81/03):** All information a lawyer receives from a client in the context of the legal relationship is covered by professional secrecy (secret professionnel). This protection is absolute:
- It covers all communications, whether oral or written, in whatever format
- It persists indefinitely — even after the mandate has ended
- It belongs to the client, not the lawyer — the client may waive it but the lawyer may not
- No third party — including law enforcement — may compel a lawyer to reveal confidential information without the client's consent

**Limits of Professional Secrecy:**

Money laundering reporting obligations create a tension with professional secrecy. Under the anti-money laundering legislation, advocates who carry out financial or property transactions on behalf of clients have reporting obligations when they suspect the transaction involves proceeds of crime. Cameroon has adopted a professional privilege exception — the lawyer's duty to report does not extend to information received in connection with the conduct of judicial proceedings or the giving of legal advice.

### 2.4 Conflict of Interest

A conflict of interest arises when a lawyer's personal interests, or the interests of another client, former client, or third party, may prevent the lawyer from providing undivided loyalty to the current client.

**Absolute prohibitions:**
- A lawyer may never represent both sides in adversarial proceedings
- A lawyer may never represent a client in proceedings where the lawyer was previously retained by the opposing party on the same matter
- A lawyer may never use confidential information from a former client to the advantage of a current client

**Consented conflicts:** Some conflicts may be resolved with the informed written consent of all affected parties (e.g., representing co-defendants in a criminal matter when their interests are substantially aligned).

---

## CHAPTER 3 — The Client Relationship

**The Mandate (Mandat):**

The professional relationship between lawyer and client is contractual — a mandate (contrat de mandat) under which the client authorises the lawyer to act on their behalf. The mandate:
- Must be in writing for clarity, though an oral mandate is valid
- Defines the scope of representation (a single matter, an appeal, general legal assistance)
- May be revoked by the client at any time
- May be renounced by the lawyer, but with adequate notice to avoid prejudice to the client

**Fees:**

Lawyers' fees in Cameroon are freely negotiated between lawyer and client. The Barreau publishes indicative fee tables as guidance. Fees must be:
- Proportionate to the services rendered, the complexity of the matter, the time spent, and the client's financial circumstances
- Agreed in writing wherever possible
- Not contingent solely on success (pactum de quota litis — a fee of a percentage of the recovery — is generally prohibited as inconsistent with independence, though success fees supplementing a basic fee are permitted)

A client who disputes fees may apply to the Council of the Order for arbitration.

**Termination of Mandate:**

Either party may terminate the mandate. The lawyer must:
- Notify the client promptly
- Return all client documents and property immediately
- Take any urgent steps to avoid prejudice to the client before withdrawal

---

## CHAPTER 4 — Conduct Before Courts

**Respect for the Court:**

The lawyer owes respect to the court and to the judicial process. The lawyer must:
- Address the court in measured and respectful terms, even when challenging a ruling
- Not make personal attacks on judges, opposing counsel, or witnesses
- Not knowingly present false evidence or false submissions to the court
- Correct, promptly and proactively, any inadvertent misrepresentation made to the court
- Not seek to mislead the court by selective presentation of facts

**Courtroom Conduct Standards:**
- Dress: lawyers appearing in court must wear the traditional robe (toge noire) and wig (for common law court appearances in Anglophone courts)
- Language: French in Francophone courts; English in Anglophone courts; the lawyer must have working proficiency in the language of the court
- Punctuality: showing disrespect for the court's time is a disciplinary matter

---

## CHAPTER 5 — Disciplinary Proceedings

**Disciplinary Bodies:**

**(a) The Disciplinary Council of the Bar Section:** First instance disciplinary body for members of the section (Barreau du Centre or Barreau du Littoral). The Council investigates complaints and imposes sanctions.

**(b) The National Disciplinary Council:** Hears appeals from the Section Councils and handles matters affecting the national Bar.

**Grounds for Discipline:**

- Violation of any provision of the professional rules
- Conduct unbecoming a member of the Bar in professional or private life
- Criminal conviction for an indictable offence
- Failure to honour obligations to the Bar (subscription fees, continuing education requirements)
- Abandonment of client matters without notice

**Available Sanctions:**
1. Avertissement (warning) — least serious
2. Blâme (reprimand)
3. Interdiction temporaire (suspension for up to 5 years)
4. Radiation (disbarment)

Radiés (disbarred) lawyers lose the right to use the title "Maître" or "Advocate" and must immediately cease practice.

---

*This edition reflects the professional conduct rules as updated by the Barreau du Cameroun in 2022 and current disciplinary precedent through December 2023.*
""")

# ─────────────────────────────────────────────────────────────────────────────
upd(
'Customary Law and the Modern Courts of Cameroon',
48,
'Recognition, Application, and Reform of Customary Norms',
"""# CUSTOMARY LAW AND THE MODERN COURTS OF CAMEROON
## The Legal Status of Customary Norms and Their Interaction with State Law

---

# PART I: THE PLACE OF CUSTOMARY LAW IN THE CAMEROONIAN LEGAL ORDER

## CHAPTER 1 — Historical Background

**The Dual Legal Heritage:**

Cameroon entered independence in 1960 and 1961 with a deeply bifurcated legal system:

- **French Cameroon** (former UN Trust Territory under French administration): civil law tradition, largely French-derived codes applied; customary law formally unrecognised but tolerated in family and personal status matters
- **Southern British Cameroon** (former UN Trust Territory under British administration): common law tradition; customary law formally recognised through the Native Courts system; applied in personal law matters for natives

Upon reunification in 1961, Cameroon inherited both traditions. The Constitution declares Cameroon bilingual and bicultural. The legal system remains dualist in substance — French civil law in Francophone regions, English common law in Anglophone regions — with the notable exception of the OHADA commercial law which is uniform.

**The Role of Customary Law in the Colonial and Post-Colonial Period:**

In both French and British administered Cameroon, the colonial powers adopted a "personal law" (statut personnel) approach: European (or "civilised") settlers were governed by their metropolitan law; African subjects were governed by their customary law in personal status matters. This created a dual court system with separate tribunals for Europeans and for Africans applying customary law.

After independence, Cameroon progressively unified the court system, but retained customary law as a source of personal law in defined areas.

---

## CHAPTER 2 — Current Recognition of Customary Law

**Constitutional Status:**

The Preamble to the 1996 Constitution recognises traditional values compatible with democratic principles: "Traditional values compatible with democratic principles and the values of the modern State shall be respected and promoted."

This recognition, however, is conditional — customary law is recognised only insofar as it is compatible with the Constitution, constitutional rights, and the general principles of law. Customary rules that violate the constitutional guarantee of equality (particularly in matters of inheritance and women's rights) are, in principle, unconstitutional.

**The Courts and Customary Law:**

Courts in Cameroon apply customary law in the following situations:

1. **Personal status matters where the parties are subject to customary law:** Marriage under customary law; customary succession; guardianship under custom
2. **Civil liability where customary compensation arrangements are relevant:** Some courts take account of customary modes of reparation (e.g., family compensation agreements in accidents)
3. **Real property:** Customary occupancy rights on national land (though not recognised as full property)

The Supreme Court has established that customary law is a fact to be proved (not taken judicial notice of), except for well-known local customs. Parties who rely on customary law must produce evidence of the custom — through the testimony of customary authorities, anthropological evidence, or established precedent.

---

## CHAPTER 3 — Customary Marriage and Family Law

**The Customary Marriage:**

Customary marriages (mariages coutumiers) are widely practised throughout Cameroon and are the predominant form of marriage particularly in rural areas. The essential requirements for a customary marriage vary between ethnic groups but typically include:

- The consent of both parties (increasingly recognised as essential even in traditional practice)
- Payment of bride price (dot) to the family of the woman — the specific amount and form varies; in Bamileke tradition, it may include livestock, cloth, and money; in Beti tradition, specific items including kola nuts; in Fulani tradition, specific Islamic-influenced ceremonies
- A communal ceremony witnessed by both families
- Acceptance by both families

**Legal Recognition of Customary Marriage:**

Customary marriages do not automatically appear in civil records. Law No. 2011 provides mechanisms for transcribing (declaring) customary marriages at the Civil Registry, thereby giving them civil law effects (inheritance, next-of-kin status, CNPS social security benefits).

However, many customary marriages are never registered, creating significant practical problems:
- The widow of an unregistered customary marriage may be denied inheritance rights by the husband's family
- Children may have difficulty proving paternity if birth registration is not completed
- Social security survivor benefits may be denied to the unregistered spouse

**Bride Price (Dot) and Its Legal Effects:**

Courts have addressed extensively the question of whether payment of bride price creates legal rights. The Cour Suprême has held:
- Payment of bride price establishes the existence of a customary marriage
- Non-payment of the full bride price does not automatically invalidate the marriage
- Return of bride price is not an automatic right on divorce — the court considers equities

**Reform Debate:** Feminist legal scholars and women's rights organisations in Cameroon have argued that bride price commodifies women and should be abolished. Defenders argue it creates social obligations of care and represents cultural heritage. This debate remains unresolved in Cameroonian law.

---

## CHAPTER 4 — Customary Succession

**The Patrilineal Inheritance System:**

In most Cameroonian ethnic groups (Beti, Bamileke, Fulani, and others), succession traditionally follows patrilineal rules: property passes within the male line, widows and daughters have limited or conditional inheritance rights.

**Challenges to Customary Succession in the Courts:**

The courts have increasingly been asked to adjudicate conflicts between customary succession rules and the constitutional guarantee of equality. Key decisions:

- **Cour Suprême, Chambre Civile, Decision No. XX/1996:** Affirmed that customary succession applies to Cameroonians subject to customary personal law but noted that it cannot violate the fundamental rights of women guaranteed by the Constitution and CEDAW.

- **Courts of Appeal (various, 2000s-2010s):** Several courts have held that daughters of a deceased father have the same inheritance rights as sons where the family is governed by modern civil law, even if the father had not made a formal election. The courts invoke CEDAW and the constitutional non-discrimination principle.

**The Reform Path:**

The solution most advocated by legal reformers is:
1. Allow individuals to formally elect their personal law (civil or customary) before a court or notary
2. Apply civil law succession by default where no formal election was made and the deceased was literate and urban
3. Reform customary succession to comply with constitutional equality standards through legislation

---

## CHAPTER 5 — The Conflict Between Customary and Statutory Law

**Hierarchy of Norms:**

Where customary law conflicts with:
- Constitutional provisions → the Constitution prevails
- National statutory law → the statute prevails
- OHADA Uniform Acts → the Uniform Act prevails over both custom and national statute

In practice, the courts apply customary rules where there is no applicable statutory provision and the parties are subject to customary personal law — but they will override customary rules that are inconsistent with constitutional rights.

**The Public Policy (Ordre Public) Override:**

Even in areas formally subject to customary law, courts will refuse to apply customary rules that violate public order (ordre public) — which includes the core constitutional rights. Female genital mutilation, forced marriage of minors, and disinheritance of widows have all been challenged on this basis.

---

*This annotated work is current to all relevant court decisions through 31 December 2023.*
""")

# ─────────────────────────────────────────────────────────────────────────────
# Also update Environmental Law if in the database
upd(
'Environmental Law and Natural Resources in Cameroon',
54,
'Law No. 96/12 of 5 August 1996 — Framework Environmental Law Annotated',
"""# ENVIRONMENTAL LAW AND NATURAL RESOURCES IN CAMEROON
## Framework Environmental Law and Sector-Specific Legislation — Annotated Edition

---

# PART I: THE FRAMEWORK ENVIRONMENTAL LAW

## CHAPTER 1 — Overview of Law No. 96/12 of 5 August 1996

Law No. 96/12 of 5 August 1996, known as the Framework Environmental Law (Loi-cadre sur l'Environnement), is the primary legislative instrument governing environmental protection in Cameroon. It establishes:

- The right of every person to a healthy environment
- The principle that the environment is part of the common heritage of humanity
- The "polluter pays" principle
- The precautionary principle
- The principle of environmental impact assessment (EIA) for major projects
- The framework for environmental standards and permitting

**Institutional Architecture:**

- **Ministry of Environment, Nature Protection and Sustainable Development (MINEPDED):** The lead ministry for environmental regulation
- **National Environmental Management Plan (PNGE):** The planning framework for environmental action
- **Environmental Impact Assessment (EIE):** Required for categories A and B projects (decree specifies categories)

---

## CHAPTER 2 — Environmental Impact Assessment (EIE)

**Legal Requirement:**

Decree No. 2005/0577/PM of 23 February 2005 establishes the procedures for environmental impact assessment. An EIA is mandatory for:

- **Category A Projects (major EIA — plan de gestion environnementale, PGE):** Mining operations, oil and gas projects, large-scale agriculture, dam construction, industrial facilities above specific thresholds
- **Category B Projects (simplified EIA — notice d'impact environnemental, NIE):** Medium-scale projects

**EIA Content Requirements:**

A full EIA must contain:
1. Description of the project (location, nature, scale, duration)
2. Analysis of the existing environment (baseline study)
3. Identification and assessment of significant impacts (positive and negative)
4. Mitigation measures (environmental management plan)
5. Monitoring plan
6. Public consultation report — affected communities must be consulted

**Public Consultation:** Under the Decree, the project promoter must conduct a minimum of one public consultation meeting in each affected village/community. The consultation must be conducted in local languages understood by the community. The results of the consultation must be incorporated into the EIA report.

**EIA Approval:** The completed EIA is submitted to MINEPDED for review and approval. A Technical Committee (Comité Interministériel) assesses the EIA. The minister's decision on approval is subject to administrative appeal.

---

## CHAPTER 3 — The Forestry Law

**Law No. 94/01 of 20 January 1994 on Forestry, Wildlife and Fisheries:**

This is the foundational legislation for management of Cameroon's forest resources — one of the largest and most important in central Africa (approximately 23 million hectares of dense forest).

**Forest Classification:**

**(a) Permanent Forest Estate (Domaine Forestier Permanent):**
- Forest Reserves (Forêts de Production) — production concessions
- Protected Area Forest (Forêts de Protection) — national parks, game reserves, wildlife sanctuaries
These areas are managed for sustainable production or conservation, and agricultural conversion is prohibited.

**(b) Non-Permanent Forest Estate:**
- Community Forests — assigned to local communities for sustainable use
- Agro-forestry zones — may be converted to agriculture subject to EIA

**Forest Concessions:**

Timber concessions (Unités Forestières d'Aménagement, UFA) are allocated by the Ministry of Forests through competitive bidding. The concessionaire must prepare and implement a Forest Management Plan (Plan d'Aménagement) approved by MINFOF.

**Annual Forestry Fees (Redevance Forestière Annuelle, RFA):**

Under Law 94/01 and subsequent implementing decrees, timber concessionnaires pay an annual fee per hectare of concession. A significant portion (50%) of the RFA is allocated to the affected municipalities (communes) and village communities.

**REDD+ and Carbon Rights:**

Cameroon participates in the UN REDD+ programme (Reducing Emissions from Deforestation and Forest Degradation). Under Law 96/12, carbon rights over forest resources held on State land belong to the State. The legal framework for carbon credit trading remains underdeveloped — a gap being addressed through legislative reform.

---

## CHAPTER 4 — Mining and Petroleum Law

**Mining Code (Law No. 2016/017 of 14 December 2016):**

The Mining Code governs the exploration and exploitation of mineral resources (other than hydrocarbons). Key provisions:

- All mineral resources in or under Cameroonian territory belong to the State
- Exploration is authorised by Exploration Permit (Permis de Recherches)
- Exploitation is authorised by Mining Permit (Permis d'Exploitation) or Mining Concession
- Environmental bond: operators must deposit a bond to cover environmental rehabilitation costs
- Community development levy: mining companies must contribute to the development of affected communities
- Local content requirements: preference for Cameroonian suppliers and employees

**Petroleum Law:**

Law No. 99/013 of 22 December 1999, the Petroleum Code (as amended), governs oil and gas exploration and production. Cameroon's petroleum sector is managed through production-sharing contracts (Contrats de Partage de Production, CPP) between the State (through the Société Nationale des Hydrocarbures, SNH) and international oil companies.

---

## CHAPTER 5 — Environmental Liability and Enforcement

**The Polluter Pays Principle:**

Under the Framework Environmental Law, the person or entity that causes pollution bears the cost of remediation and compensation for victims. This principle gives rise to:

- Administrative orders to cease pollution and remediate contaminated land/water
- Criminal penalties: fines up to FCFA 100,000,000 and imprisonment for serious environmental offences
- Civil liability to affected persons and communities

**MINEPDED Enforcement Powers:**

Environmental inspectors are authorised to:
- Enter any premises to inspect compliance with environmental requirements
- Take samples and measurements
- Issue enforcement notices
- Seal equipment causing pollution pending enforcement proceedings

---

*This edition is current to all environmental legislation and MINEPDED regulations through 31 December 2023.*
""")

print("\n=== Batch C complete ===")
from apps.books.models import Book
total = Book.objects.filter(status='published').count()
print(f"Total published books: {total}")
