"""
Expand content for batch1 books 4-10 and batch2 books 11-15.
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
'OHADA Uniform Act on Commercial Companies and Economic Interest Groups',
96,
'AUSCGIE — Full Annotated Text — Revised Edition 2014',
"""# OHADA UNIFORM ACT ON COMMERCIAL COMPANIES AND ECONOMIC INTEREST GROUPS
## Acte Uniforme relatif au Droit des Sociétés Commerciales et du Groupement d'Intérêt Économique (AUSCGIE)
#### As revised at Ouagadougou, 30 January 2014

---

# BOOK I: GENERAL PROVISIONS FOR ALL COMMERCIAL COMPANIES

## CHAPTER 1 — Definition and Concept of the Commercial Company

**Article 1 —** A commercial company is created by contract between two or more persons who agree to put something in common with a view to sharing the profit or benefiting from the saving that may result therefrom. It is constituted on the activities referred to in Article 2 of the Uniform Act on General Commercial Law.

However, a company may also be created, in the cases provided for by the present Uniform Act, by the will of one single person, designated as "sole member" or "sole shareholder."

The three essential elements of the company contract are:

**1. Contributions (apports):** Each partner or shareholder must bring something of value to the company. Contributions may be:
- *En numéraire* (cash): money paid into the company's bank account
- *En nature* (in kind): movable or immovable property transferred to the company
- *En industrie* (services/skills): the contributor's time, expertise, or labour; permitted only in certain company forms and does not form part of the capital

**2. Intention to share profits and losses (affectio societatis):** The partners must genuinely intend to participate together in the venture as co-principals, not merely as employees or service providers. The affectio societatis distinguishes a partnership or company from a loan, a joint venture agreement, or a service contract.

**3. Participation in profits and contribution to losses:** Each partner participates in both the profits and the losses of the company in proportion to his contribution, unless the articles of association provide otherwise (subject to the prohibition of leonine clauses under Article 54).

---

## CHAPTER 2 — Classification of Commercial Companies

OHADA law recognises the following types of commercial company:

**Article 6 — Companies with Unlimited Liability:**

**(a) Société en nom collectif (SNC)** — General Partnership: All partners are jointly and severally liable for the company's debts without limitation. This is the most solidarity-intensive form — a creditor may pursue any partner for the full amount of a debt, regardless of the partner's proportional shareholding. The SNC has the character of an intuitu personae company (the identity and trust of the partners is central).

**(b) Société en commandite simple (SCS)** — Limited Partnership: Has two categories of partner:
- *Commandités* (general partners) — unlimited personal liability
- *Commanditaires* (sleeping or limited partners) — liability limited to their contribution; they have no right to participate in management

**Article 8 — Companies with Limited Liability:**

**(a) Société à responsabilité limitée (SARL)** — Private Limited Company: The most popular form for small to medium enterprises in OHADA territory. Partners are called *associés*; their liability is limited to the amount of their contribution. There is no minimum number of partners. The minimum share capital is FCFA 1,000,000 (one million FCFA) in Cameroon, or an amount fixed by each Member State. Management is by one or more *gérants* (managers).

**(b) Société anonyme (SA)** — Public Limited Company (Joint Stock Company): The standard form for large enterprises, publicly listed companies, banks, and insurance companies. Shareholders' liability is limited to their subscribed contributions. The SA requires:
- A minimum of three shareholders (or one in the case of a single-member SA)
- A minimum capital of FCFA 10,000,000 (ten million FCFA)
- An administrative structure: either a Board of Directors (Conseil d'administration) with a Chairman-CEO (Président-Directeur Général, PDG) or a Supervisory Board (Conseil de surveillance) with a Management Board (Directoire)

**(c) Société par actions simplifiée (SAS)** — Simplified Joint Stock Company: A form introduced by the 2014 revision to provide greater contractual flexibility. The articles of association (statuts) may freely organise management, voting rights, and the conditions for admission and exit of shareholders. Used primarily for subsidiaries of multinationals, joint ventures, and holding companies. Capital minimum: FCFA 10,000,000.

**Economic Interest Group (GIE — Groupement d'Intérêt Économique):**

The GIE is not a commercial company stricto sensu but is regulated in the same Uniform Act. It is a legal entity formed by two or more natural or legal persons to facilitate, develop or improve the economic activities of its members. A GIE has no minimum capital requirement and may operate without share capital. Members are jointly and severally liable for GIE debts unless the GIE agreement provides otherwise.

---

## CHAPTER 3 — Formation: Requirements and Procedure

**Article 10 — The Articles of Association (Statuts).** Every commercial company must have written articles of association (statuts) signed by all partners or founding shareholders. The statuts must contain at minimum:
- The form (SARL, SA, SNC, etc.)
- The corporate name (dénomination sociale)
- The corporate purpose (objet social)
- The registered office address (siège social)
- The duration (which may not exceed 99 years)
- The amount of share capital and how it is divided
- The names, addresses and nationalities of founders

**Article 11 — Registration.** A company acquires legal personality (la personnalité morale) from the date of its inscription in the Trade and Personal Credit Register (RCCM). Before registration, the company in formation (société en formation) may enter into commitments on behalf of the company being formed, but the founders who act in the name of the company before registration are personally and jointly liable for those commitments unless the company, once registered, ratifies them.

**Article 46 — Nullity of Companies.** A company may be declared null and void only in limited circumstances:
- Absence of one of the essential requirements (contribution, profit-sharing intent, participation in losses)
- Unlawful corporate purpose
- Leonine clause making all profit accrue to one partner or relieving one partner of all losses

Courts are instructed to grant a period to regularise the defect before declaring nullity. Nullity of a company does not affect obligations already entered into with third parties in good faith.

---

# BOOK II: RULES SPECIFIC TO EACH FORM OF COMPANY

## PART I — The Société à Responsabilité Limitée (SARL)

### Chapter 1 — Capital, Parts Sociales, and Transfer

**Article 311 — Minimum Capital.** The SARL's capital is divided into parts sociales (shares without certificate value), each having a nominal value of at least FCFA 5,000. All shares must be fully paid up on formation.

**Article 317 — Transfer of Parts Sociales.** Shares in a SARL are not freely transferable to third parties. A transfer to a person who is not already a partner requires:
- Approval by a majority of the partners representing at least three-quarters (3/4) of the share capital (unless the statuts provide for a stricter majority)
- The company must notify each partner of the proposed transfer
- If the company refuses consent, it must within three months either find a buyer among the existing partners, or purchase the shares itself (with a reduction of capital), or allow the transfer to proceed

This restriction on transferability is fundamental to the SARL's character as a company based on mutual trust (intuitu personae).

**Article 318 — Transfer to Heirs.** Transfer of parts sociales by inheritance or by reason of the death of a partner is permitted by operation of law unless the statuts provide for an agrément clause.

### Chapter 2 — Management of the SARL

**Article 323 — The Gérant.** A SARL is managed by one or more gérants (managers) who may be partners or non-partners, natural persons only. The gérant(s) may be appointed in the statuts or by a separate act.

**Article 326 — Powers.** In the internal relationships between partners, the gérant's powers are defined by the statuts and the decisions of the partners. In external relationships with third parties, the gérant has the broadest power to act on behalf of the company in all circumstances, including any act within the corporate purpose. Restrictions on the gérant's powers in the statuts are not opposable to third parties.

**Article 330 — Liability of the Gérant.** The gérant is liable to the company and to third parties for:
- Infringement of legislative or regulatory provisions
- Violation of the statuts
- Faults in management (fautes de gestion)

The gérant's civil liability is assessed against the standard of the bon gérant — the diligent and careful manager who acts in the best interests of the company.

**Article 334 — Collective Decisions by Partners.** Partners exercise collective control through decisions (as opposed to the SA's general meeting). Key decisions:
- Approval of accounts and allocation of profit (majority in terms of both partners and capital)
- Amendment of statuts (3/4 majority in capital)
- Removal of the gérant (majority of partners representing majority of capital)
- Dissolution of the company (3/4 majority in capital)

---

## PART II — The Société Anonyme (SA)

### Chapter 1 — Incorporated SA with Board of Directors (Conseil d'Administration)

**Article 414 — Composition of the Board.** The Conseil d'Administration must have between three and fifteen directors (administrateurs). Directors are appointed by the founding shareholders in the statuts or subsequently at the General Meeting (AGM). A director need not be a shareholder.

**Article 417 — Duration of Directors' Mandate.** Directors serve for a term fixed in the statuts, which may not exceed six years. They are eligible for re-appointment unless the statuts provide otherwise.

**Article 422 — Chairman-CEO (PDG).** The Board of Directors must elect from among its members a Chairman (Président du Conseil d'Administration). The Chairman may also be appointed as Director-General (Directeur Général) in which case he is called the PDG (Président-Directeur Général). The PDG is the most powerful figure in the governance of an SA with a unitary board structure.

**Powers of the PDG:**
- Chair meetings of the Board and General Meetings
- Represent the company in all external dealings
- Exercise executive management powers within the limits set by the Board
- Sign all major contracts and commitments
- Appear before courts as the legal representative of the company

**Article 430 — Conventions Réglementées.** Agreements between the SA and its directors or shareholders (or companies in which directors hold an interest) require prior authorisation by the Board and ratification by the AGM. This prevents directors from profiting from their position through self-dealing.

### Chapter 2 — The General Meeting (Assemblée Générale)

**Ordinary General Meeting (AGM — Assemblée Générale Ordinaire, AGO):** Must be convened at least once per year within six months of the close of the financial year to:
- Approve the annual accounts (bilan, compte de résultat, annexe)
- Decide on the allocation of profits (distribution of dividends or carry-forward)
- Elect or re-elect directors
- Appoint or renew the mandate of the statutory auditor (commissaire aux comptes)
- Deliberate on any matter within the AGO's competence

Quorum at first convening: shareholders representing at least one-quarter (1/4) of the voting shares. If the quorum is not met, a second convening is held at which there is no quorum requirement. Decisions are taken by an absolute majority of votes cast.

**Extraordinary General Meeting (AGM — Assemblée Générale Extraordinaire, AGE):** Required for any amendment of the statuts, capital increase or reduction, dissolution, merger, or any other matter requiring a qualified majority. The AGE requires a two-thirds majority (2/3) of votes cast. Capital increases by issuing new shares at a price below the theoretical value of existing shares require unanimity of all shareholders.

### Chapter 3 — The Statutory Auditor (Commissaire aux Comptes, CAC)

**Article 702 —** Every SA must appoint one or more statutory auditors (commissaires aux comptes, CAC). The CAC must be a registered member of the national professional association of statutory auditors (in Cameroon, the Ordre National des Experts Comptables du Cameroun, ONECCA, which also covers statutory audit functions).

**Duties of the CAC:**
- Certify that the company's financial statements give a true and fair view (image fidèle) of the company's financial position
- Verify the consistency of the Board's management report with the financial statements
- Report any discovered irregularities or statutory violations to the Board and, in serious cases, to the competent court
- Maintain absolute independence from the company — the CAC may not hold shares in or be related to the audited company

The CAC serves for six years and may not be re-appointed for consecutive mandates. This rule (non-renouvellement consecutif) was designed to prevent auditors from becoming too closely identified with management.

---

# BOOK III: MERGERS, ACQUISITIONS AND RESTRUCTURING

**Article 189 — Merger (Fusion).** A merger (fusion) is an operation by which two or more companies are combined:
- In a merger by absorption (fusion-absorption), one company (the absorbing company) absorbs one or more other companies (the absorbed companies); the absorbed companies are dissolved without liquidation and their assets and liabilities are transferred en bloc to the absorbing company
- In a merger by creation of a new company (fusion par création d'une société nouvelle), the merging companies are all dissolved and their combined assets and liabilities are transferred to a newly created company

**Article 195 — Effects of Merger:**
1. All assets and liabilities of the absorbed company transfer to the absorbing company by operation of law (transmission universelle du patrimoine)
2. The absorbed company's shareholders receive shares in the absorbing company in exchange for their existing shares (according to an exchange ratio)
3. The absorbed company ceases to exist and is struck off the RCCM

**Article 196 — Creditor Protection.** Creditors of the absorbed company who do not consent to the merger and whose claims are not yet due may object to the merger within 30 days of publication. The court may:
- Order the constitution of adequate guarantees by the absorbing company
- Order immediate repayment of the claims

**Spin-off (Scission):** The reverse of a merger. A company (the divided company) divides into two or more companies; all assets and liabilities are distributed between the beneficiary companies; the divided company is dissolved.

**Partial Transfer of Undertaking (Apport partiel d'actif):** A company contributes a distinct branch of its activities to another existing or new company in exchange for shares in that company. Unlike a merger, the contributing company continues to exist.

---

# BOOK IV: DISSOLUTION AND LIQUIDATION

**Article 200 — Grounds for Dissolution.** A company is dissolved:
1. By the expiry of its agreed term without extension
2. By the achievement of its corporate purpose
3. By the permanent impossibility of achieving the corporate purpose
4. By judicial dissolution at the request of any partner on legitimate grounds
5. By a decision of the partners (by the qualified majority required for AGE decisions)
6. By the opening of insolvency proceedings if the court orders the company's liquidation

**Article 204 — Liquidation.** On dissolution, the company enters into liquidation. It continues to exist as a legal entity for the sole purpose of winding up affairs. A liquidator (liquidateur) is appointed:
- By the partners' meeting if the dissolution is consensual
- By the court if the dissolution is judicial

The liquidator's duties include:
1. Completing pending transactions
2. Collecting debts owed to the company
3. Selling company assets
4. Paying creditors in order of priority
5. Distributing the remaining net assets to shareholders

A final accounts meeting (assemblée générale de clôture) approves the liquidator's final report and discharges the liquidator.

---

*Annotations include all CCJA decisions through 2023 and decisions of Cameroonian courts of appeal.*
""")

# ─────────────────────────────────────────────────────────────────────────────
upd(
'Criminal Law in Cameroon: The Penal Code Annotated',
78,
'Law No. 2016/007 of 12 July 2016 — Fully Annotated Edition',
"""# CRIMINAL LAW IN CAMEROON: THE PENAL CODE ANNOTATED
## Law No. 2016/007 of 12 July 2016 — Annotated Edition

---

# PRELIMINARY CHAPTER: PRINCIPLES OF CAMEROONIAN CRIMINAL LAW

## The Sources of Criminal Law

The primary source of criminal law in Cameroon is the Penal Code (Code Pénal), which consolidated and replaced the two prior codes (one for the former Francophone region, one for the former Anglophone region) into a single national code.

The Penal Code is supplemented by:
- Special criminal provisions in other legislation (e.g., the Anti-Corruption Law, the Anti-Money Laundering Law, the Electronic Communications Law, the Anti-Terrorism Law of 2014)
- Conventions incorporated into domestic law by ratification and published in the Official Gazette

## Constitutional Principles of Criminal Law

### The Principle of Legality (Principle of No Crime Without Law — Nullum Crimen Sine Lege)

No conduct constitutes a criminal offence unless it is expressly defined as such by a written legal text in force at the time the conduct was engaged in. This principle has two corollaries:

**Strictness of interpretation:** Criminal statutes must be interpreted strictly (application stricte). Judges may not extend criminal liability to conduct analogous to but not expressly covered by the text.

**Non-retroactivity:** A person may not be punished for conduct that was not criminal at the time of performance, even if it is made criminal by a later enactment. However, a less severe law enacted after the offence is committed applies retroactively to reduce the sentence of a convicted person who has not yet fully served their sentence.

### The Principle of Personal Criminal Responsibility

Only the person who personally committed the offence (or who is deemed legally responsible for it as a co-principal or accomplice) may be punished. A person may not be criminally punished for the acts of another.

---

# BOOK I: GENERAL PROVISIONS

## CHAPTER 1 — Classification of Offences

**Article 21 —** Offences are classified into three categories:

**1. Félonies (Felonies):** The most serious category of offence. Punishable by imprisonment of ten years to life, or by death in cases expressly provided. Tried exclusively before the High Court (Tribunal de Grande Instance sitting as a criminal court).

**2. Délits (Misdemeanours):** Medium-gravity offences. Punishable by imprisonment of ten days to ten years, or fines, or both. Tried before the Court of First Instance (Tribunal de Première Instance). Most white-collar offences, moderate violence, and property crimes fall in this category.

**3. Contraventions:** The least serious category. Punishable by imprisonment up to ten days, or fines up to FCFA 25,000. Tried before the Magistrate's Court or Court of First Instance as summary proceedings.

---

## CHAPTER 2 — Elements of Criminal Liability

Every criminal offence has two elements, both of which must be established beyond reasonable doubt:

**The Material Element (élément matériel):** The actual physical conduct constituting the offence — an act (positive conduct: striking, taking, defrauding) or in exceptional cases an omission (failure to act where a legal duty to act exists, such as the duty to report a crime or to rescue a person in danger).

**The Mental Element (élément moral or élément intentionnel):** The state of mind of the perpetrator. Cameroonian law distinguishes:

**(a) Intentional offences (infractions intentionnelles):** The majority of serious offences require that the accused have acted with *dol général* — knowledge of the criminal character of the act and a will to commit it. The accused must have known that he was committing the prohibited act.

**(b) Offences of specific intent (infractions à dol spécial):** Some offences require a specific ulterior purpose in addition to the general intent. For example, theft requires not only the intentional taking of another's property but also the specific intent to appropriate it permanently (animus furandi).

**(c) Non-intentional offences:** A person may be convicted of a non-intentional offence (infractions non-intentionnelles) where the law expressly so provides. The most important category is criminal negligence: the person causes harm by recklessness, carelessness, inattention, or violation of a safety rule or duty of care. Examples: negligent homicide (homicide involontaire), negligent assault causing serious harm, road traffic offences.

---

## CHAPTER 3 — Causes Excluding Criminal Responsibility

**Article 74 — Legitimate Defence (Légitime Défense).** A person is not criminally responsible for an act that was strictly necessary to protect himself or another person from an unlawful and imminent threat, provided the defence was proportionate to the attack. The conditions are:

1. The threat must have been real (not imaginary) or at least reasonably believed to be real
2. The threat must have been unlawful (an act by public authorities in the lawful exercise of their functions cannot justify self-defence)
3. The threat must have been imminent (the response must not be in anticipation of a future attack or in retaliation for a past one)
4. The defensive act must have been necessary and proportionate

*Excess of self-defence:* Where the defensive act was not proportionate to the threat, the accused may benefit from a mitigating circumstance rather than a complete exculpation, resulting in a reduced sentence.

**Article 77 — Necessity (État de Nécessité).** A person is not criminally responsible for an act that was necessary to preserve a legally protected interest (his own or another's) from an imminent and serious danger that could not otherwise be avoided, provided the harm caused is not greater than the harm averted.

**Article 78 — Insanity and Mental Disorder.** A person who, at the time of the commission of the offence, was suffering from a mental disorder that abolished his understanding or control of his conduct is not criminally responsible. The court orders the person's placement in an appropriate psychiatric institution.

A person whose mental disorder did not abolish but merely diminished his understanding or control retains criminal responsibility but benefits from a mandatory mitigation of the applicable sentence.

**Article 79 — Minority.** Persons under the age of 10 years are irrebuttably presumed to lack criminal responsibility. Persons aged 10 to 14 years are presumed to lack criminal responsibility but the presumption may be rebutted. Persons aged 14 to 18 are criminally responsible but benefit from reduced sentences under the juvenile provisions.

---

# BOOK II: OFFENCES AGAINST PERSONS

## CHAPTER 1 — Homicide and Assault

**Article 275 — Intentional Homicide (Meurtre).** Whoever intentionally causes the death of another person shall be punished by imprisonment of ten to twenty years.

**Aggravated Homicide (Assassinat) — Article 276.** Homicide committed with premeditation or by use of poison shall be punishable by death.

Premeditation is defined as a pre-formed design (dessein prémédité) to commit the killing, formed before the moment of the act. It is not required that the design be of long duration — an hour's reflection before the killing suffices.

**Article 277 — Infanticide.** A mother who intentionally causes the death of her newborn child shall be punished by imprisonment of six to twenty years. The reduced penalty reflects the exceptional circumstances of childbirth.

**Article 279 — Negligent Homicide (Homicide Involontaire).** Whoever, through negligence, recklessness, lack of skill, non-observance of safety regulations, or breach of a duty of care, causes the death of another person shall be punished by imprisonment of one to three years and/or a fine of FCFA 25,000 to 300,000.

**Aggravation of negligent homicide:** The penalty is doubled where the accused was engaged in a professional activity at the time (e.g., a surgeon operating, a driver carrying passengers, a construction site supervisor).

**Article 280 — Intentional Assault and Battery (Coups et Blessures Volontaires).** Whoever intentionally strikes or injures another person shall be punished:
- Where no permanent incapacity results: imprisonment of 10 days to 2 years
- Where the injury results in incapacity for work exceeding 30 days: 2 to 10 years
- Where the injury results in permanent disability (loss of limb, loss of sight, etc.): 5 to 15 years
- Where the assault causes unintended death: 10 to 20 years

**Circumstances Aggravating Assault:**
- Premeditation or ambush: sentence multiplied by two
- Use of a weapon: sentence increased by one-third
- Assault on a vulnerable person (child under 15, disabled person, pregnant woman): sentence increased by one-half
- Assault by a public servant while on duty: sentence increased by one-half

---

## CHAPTER 2 — Sexual Offences

**Article 294 — Rape (Viol).** Whoever engages in any act of sexual penetration on another person without that person's free and informed consent, or by means of violence, coercion, threat, surprise, or abuse of authority, commits rape and shall be punishable by imprisonment of five to ten years.

Aggravated rape (carrying up to thirty years imprisonment) occurs where:
- The victim is a minor under fifteen years
- The victim is a vulnerable person (mentally disabled, intoxicated)
- The perpetrator is a person in authority over the victim (parent, teacher, employer, medical professional, religious authority)
- The rape was committed with the assistance of accomplices or in public
- The rape caused permanent physical or psychological harm

**Article 296 — Indecent Assault (Attentat à la Pudeur).** Any act of sexual nature short of penetration committed on another person without consent, or on a minor under fifteen years, is punishable by imprisonment of one to five years, doubled in cases of aggravation.

**Article 347-1 — Homosexual Acts.** [This provision remains in the Code as enacted and criminalises consensual same-sex acts. It has been widely criticised by international human rights bodies and domestic civil society as inconsistent with constitutional guarantees of non-discrimination.]

---

## CHAPTER 3 — Offences Against Liberty

**Article 291 — Kidnapping and Unlawful Confinement (Enlèvement et Séquestration).** Whoever by fraud, violence, or threat seizes, arrests, detains or confines a person without lawful authority shall be punished by imprisonment of five to ten years. Where the unlawful confinement lasts more than one month, or involves demands for ransom, the sentence rises to ten to twenty years.

**Article 293 — Human Trafficking.** Whoever, for the purposes of exploitation (including sexual exploitation, forced labour, organ trafficking, or adoption) recruits, transports, transfers, harbours or receives a person by means of coercion, threat, fraud, deception, abuse of power, or abuse of a position of vulnerability shall be punishable by imprisonment of fifteen to twenty years, and a fine of FCFA 10,000,000 to 50,000,000.

---

# BOOK III: OFFENCES AGAINST PROPERTY

## CHAPTER 1 — Theft (Vol)

**Article 318 —** Theft is the fraudulent taking of another's movable property. The elements are:

1. A thing that belongs to another (the accused must not own the property taken)
2. A movable thing (theft of immovables is not possible — it is governed by the civil law remedy of "troubling possession")
3. Fraudulent taking (soustraction frauduleuse): the taking must be without the consent of the owner and with intent to deprive the owner permanently

Punishment: 5 to 10 years imprisonment.

**Aggravated Theft:** The following circumstances aggravate the punishment to 10 to 20 years:
- Theft at night (between 9 pm and 6 am)
- Theft by breaking and entering (escalade, effraction — breaking locks, climbing walls, breaking windows)
- Theft by two or more persons (in gang)
- Theft while carrying a weapon
- Theft by a domestic servant or employee from the employer
- Theft of a motor vehicle

---

## CHAPTER 2 — Fraud and Deception (Escroquerie)

**Article 318(b) — Fraud (Escroquerie).** Whoever, with intent to secure a profit for himself or another, deceives another person by use of false names, false titles, false quality, or by fraudulent manoeuvres, and thereby causes the victim to hand over funds, securities, or property, or to incur an obligation, shall be punished by imprisonment of 1 to 10 years and a fine.

**Article 321 — Breach of Trust (Abus de Confiance).** Whoever misappropriates or dissipates to the detriment of the owner property entrusted to him in a specific capacity (as employee, agent, depositary, carrier, or pledgee) shall be punished by imprisonment of 1 to 5 years. This offence is frequently invoked in commercial contexts — an agent who misappropriates funds collected from clients, a director who misuses company funds, a warehouse keeper who sells pledged goods.

---

## CHAPTER 3 — Corruption and Abuse of Office

**Article 134 — Active and Passive Corruption.** Corruption in the public sector is one of the most heavily prosecuted offences in Cameroon.

*Passive corruption (corruption passive):* Any public servant or person entrusted with a public service mission who, directly or through an intermediary, solicits, accepts, or receives an offer, promise, donation, or advantage of any kind in order to perform, delay, or abstain from performing an act within the scope of his functions, shall be punished by imprisonment of 5 to 10 years and a fine equal to at least three times the value of the advantage.

*Active corruption (corruption active):* Whoever proposes, offers, or gives such an advantage to a public official commits the offence of active corruption and is subject to the same penalties as the passive corruptor.

**Article 136 — Embezzlement (Détournement de Fonds Publics).** Any public official who, by reason of his functions, has custody, management, or administration of public funds, and who misappropriates those funds for personal use or the use of a third party, shall be punished by imprisonment of 5 to 20 years and a mandatory fine of at least twice the amount embezzled.

Aggravated embezzlement (leading to 15 to 20 years) is committed where the offender was a senior official, where the amount exceeded FCFA 50,000,000, or where the embezzlement caused public service disruption.

---

# BOOK IV: ECONOMIC AND FINANCIAL OFFENCES

## CHAPTER 1 — Money Laundering (Blanchiment de Capitaux)

**CEMAC Regulation No. 01/03/CEMAC/UMAC/CM** and **Law No. 2003/004** of 21 April 2003 address money laundering and terrorist financing. Key provisions:

*Definition:* Money laundering means the conversion or transfer of proceeds of crime, knowing that such proceeds derive from criminal activity, with the intention of concealing their illegal origin or of assisting any person who is involved in the commission of the predicate offence to evade the legal consequences of his actions.

*Predicate offences:* All offences carrying a custodial sentence of at least one year, including but not limited to drug trafficking, corruption, fraud, tax evasion, human trafficking, arms trafficking, terrorism, and organised crime.

*Penalty:* Imprisonment of 5 to 10 years and a fine of twice the value of the laundered funds.

*Suspicious Transaction Reporting:* All financial institutions, casinos, notaries, accountants, and real estate agents (reporting entities) must report suspicious transactions to the National Agency for Financial Investigation (ANIF). Failure to report is an offence.

---

*This annotated edition is current to all amending legislation and regulatory texts through 31 December 2023. Annotations include rulings of the Cour Suprême (Chambre Pénale).*
""")

# ─────────────────────────────────────────────────────────────────────────────
upd(
'Land Tenure and Property Rights in Cameroon',
62,
'Ordinance No. 74-1 of 6 July 1974 and Related Legislation — Annotated',
"""# LAND TENURE AND PROPERTY RIGHTS IN CAMEROON
## Ordinance No. 74-1 of 6 July 1974 — Annotated Edition

---

# PART I: THE STRUCTURE OF LAND TENURE IN CAMEROON

## CHAPTER 1 — Historical Overview and the 1974 Reforms

The land law of Cameroon reflects a complex historical layering of German colonial law, French and British colonial administrations, and post-independence unified legislation. The 1974 reform under President Ahmadou Ahidjo fundamentally restructured land ownership in the Republic by establishing the primacy of the State as the initial source of all land rights.

The four foundational texts of the 1974 reform are:

1. **Ordinance No. 74-1 of 6 July 1974** — Establishing the rules governing land tenure in the Republic of Cameroon. This is the principal law.
2. **Ordinance No. 74-2 of 6 July 1974** — Establishing rules governing State lands.
3. **Decree No. 76/165 of 27 April 1976** — Conditions for obtaining land certificates (titres fonciers).
4. **Decree No. 76/166 of 27 April 1976** — Procedure for consultation of local land committees.

These texts have been amended several times, most significantly by Law No. 80/22 of 14 July 1980, Decree No. 2005/481 of 16 December 2005, and various sector-specific texts including the Forestry Law (No. 94/01 of 20 January 1994) and the Mining Code.

---

## CHAPTER 2 — The Three Categories of Land

The 1974 Ordinance divides all land in Cameroon into three categories:

### Category 1: Private Property

**Definition:** Land over which a person holds a formal title of ownership as recognised by the State — that is, land for which a Land Certificate (Titre Foncier, TF) has been issued.

**The Land Certificate (Titre Foncier):** The TF is definitive, indefeasible, and enforceable against all persons and the State itself. It is issued by the Land Registry (Conservation Foncière) and is the only legally recognised form of full private ownership (droit de propriété) over land in Cameroon.

**Key characteristics of the Titre Foncier:**
- Once issued, it cannot be challenged or annulled except by the court in very limited circumstances (fraud in the registration process)
- The rights it confers are absolute and cannot be acquired by adverse possession (prescription acquisitive) against the holder
- It is a complete register of all encumbrances — mortgages, servitudes, usufructs — on the registered parcel

### Category 2: State Lands (Terres Domaniales)

State lands are divided into two subcategories:

**(a) The Public Domain (Domaine public) of the State:** Lands inalienable by their nature or by their purpose, including:
- Natural resources: rivers, lakes, the sea and its bed, beaches, airspace
- Public infrastructure: roads, railways, ports, airports, public buildings
- Historical and archaeological sites
- National parks and wildlife reserves

These lands cannot be sold, mortgaged, or acquired by prescription. Any occupation without authorisation constitutes illegal encroachment (empiétement sur le domaine public).

**(b) The Private Domain (Domaine privé) of the State:** Lands owned by the State that are not subject to public use. The State administers these lands through allocation (concession), leasing, or sale. State allocations of private domain land require formal procedure and publication.

### Category 3: National Lands (Terres Nationales)

**Definition:** All land not constituting private property or State domain. This is the residual category and encompasses the vast majority of rural land in Cameroon.

**Critical rule:** Under Ordinance 74-1, national lands belong to the State. The State holds them in trust for the benefit of the Cameroonian people. No person acquires ownership of national land by virtue of occupation, customary use, or inheritance — only the State can create a title of ownership over national land.

**Customary Occupation:** However, persons who are in permanent customary occupation (occupation coutumière permanente) of national land hold a right of priority (droit de priorité) to obtain the title of their land through the registration procedure. This right of priority:
- Must be exercised within a reasonable time of the land being required for development
- Does not confer ownership — it creates only a procedural advantage in the registration process
- Can be extinguished if the national land is needed for public purposes (expropriation with compensation)

---

## CHAPTER 3 — Registration of Land Titles

### The Registration Procedure

To obtain a Titre Foncier, an applicant must follow the procedure set out in Decree No. 76/165:

**Step 1 — Application:** The applicant files a written request with the departmental Land Service (Service des Domaines et des Affaires Foncières), stating the location, surface area, and current use of the land.

**Step 2 — Boundary Survey (Bornage).** A topographer from the Topographical Service (Service du Cadastre) marks the boundaries of the parcel with concrete or iron boundary markers (bornes). The survey plan (plan cadastral) is drawn.

**Step 3 — Local Consultative Committee (Commission Consultative).** Under Decree No. 76/166, a local committee composed of the Divisional Officer (Sous-Préfet), the Land Service representative, two customary chiefs (chefs traditionnels), and the Topographer visits the parcel to:
- Verify the accuracy of the claimed boundaries
- Identify any third-party claims or customary occupants
- Record any objections from neighbours or other claimants

**Step 4 — 30-Day Public Notice.** The application is posted at the Divisional Office, the District Council, and the village or neighbourhood for thirty (30) days. Any person with an objection must file it within this period.

**Step 5 — Settlement of Objections.** If objections are filed, the Land Service attempts conciliation. Unresolved objections are referred to the administrative court.

**Step 6 — Issuance of the Titre Foncier.** If no objection is filed, or after resolution of objections, the Land Service issues the Titre Foncier and records it in the Land Register (Registre Foncier). The holder receives an official copy (expédition du titre foncier).

---

## CHAPTER 4 — Expropriation for Public Utility

**Legal Framework:** Law No. 85/09 of 4 July 1985 governing expropriation, the temporary occupation of land for public purposes, and the modification of land entitlements.

**Procedure for Expropriation:**

1. **Declaration of public utility (déclaration d'utilité publique):** The President of the Republic, by decree, declares the project of public utility (road, school, dam, industrial zone, etc.).

2. **Investigation period:** A public inquiry is conducted to identify affected landholders and assess the land to be acquired.

3. **Withdrawal of use (cessation d'usage):** The administration issues formal orders to the occupants.

4. **Compensation:** Expropriated owners must receive full and fair compensation (indemnisation équitable) determined by the Land Commission. Compensation covers:
- The market value of the land (valeur vénale)
- The value of improvements (crops, buildings, structures)
- Moving costs and relocation expenses
- Loss of business income for traders

**Constitutional Guarantee:** The Constitution guarantees that no person may be deprived of property except for public utility and upon payment of fair and prior compensation.

**Criticism:** In practice, compensation in Cameroon has frequently been inadequate, delayed, or not paid at all. The courts have increasingly intervened to enforce the constitutional guarantee. The Cour Suprême has held that the State may not enter onto expropriated land before paying compensation.

---

## CHAPTER 5 — Mortgages and Real Property Security

**Mortgage (Hypothèque):** A mortgage is a charge over immovable property (a Titre Foncier) given as security for a debt. In Cameroon, the OHADA Uniform Act on Securities (Acte Uniforme portant organisation des Sûretés) governs mortgages.

**Requirements for a valid mortgage:**
- A registered real property title (the Titre Foncier) — you cannot mortgage national land or informal occupation
- A notarised mortgage deed (acte notarié)
- Registration of the mortgage on the Titre Foncier at the Land Registry

**Priority:** Mortgages rank in order of their registration date. The first-registered mortgage has priority over subsequent ones. Banks conducting due diligence on land security must search the Titre Foncier for prior registrations before agreeing to advance funds.

**Enforcement:** On default, the mortgagee may apply to the court for a forced sale (vente forcée) of the mortgaged property. The proceeds are distributed to creditors in priority order.

---

*This annotated edition covers land tenure law as at 31 December 2023, including all implementing decrees and relevant OHADA provisions.*
""")

# ─────────────────────────────────────────────────────────────────────────────
upd(
'Tax Law and Fiscal Administration in Cameroon',
64,
'General Tax Code and Related Legislation — Third Edition',
"""# TAX LAW AND FISCAL ADMINISTRATION IN CAMEROON
## General Tax Code (Code Général des Impôts, CGI) — Annotated Edition

---

# PART I: OVERVIEW OF THE CAMEROONIAN TAX SYSTEM

## CHAPTER 1 — Sources and Administration of Tax Law

### Principal Legal Sources

The primary source of Cameroonian tax law is the **Code Général des Impôts (CGI)**, enacted by the National Assembly and updated annually through the Finance Act (Loi de Finances). The CGI consolidates the rules governing direct taxes, indirect taxes, and stamp duties (droits de timbre et d'enregistrement).

Supplementary sources include:
- Implementing Decrees (Décrets d'Application) issued by the President of the Republic
- Circulars and Instruction Notes (Circulaires et Notes de Service) of the Directorate General of Taxation (DGI) — binding on tax officials but not on taxpayers
- Tax treaties (Conventions Fiscales) concluded by Cameroon with France (1976), Canada, Tunisia, Morocco, and several other states
- CEMAC Directives on VAT and customs harmonisation

### Tax Administration Authorities

**Directorate General of Taxation (Direction Générale des Impôts, DGI):** The central authority responsible for assessment, collection, and audit of direct and indirect taxes administered by the State. Organised into:
- The Large Taxpayers Unit (Division des Grandes Entreprises, DGE) — handles corporations with annual turnover above FCFA 3 billion
- The Medium Taxpayers Unit (Centre des Impôts des Moyennes Entreprises, CIME) — turnover FCFA 50 million to FCFA 3 billion
- The Small Taxpayers Unit (Centre des Impôts des Petites Entreprises) — turnover below FCFA 50 million

**Directorate General of Customs (Direction Générale des Douanes):** Administers import and export duties under the CEMAC Customs Regime.

**Directorate General of the Treasury (Direction Générale du Trésor):** Collects certain fees, stamp duties and registration taxes.

---

## CHAPTER 2 — Corporation Tax (Impôt sur les Sociétés, IS)

**Scope:** The IS applies to legal entities (sociétés) carrying on business activities in Cameroon, including:
- Cameroonian companies on all profits earned anywhere in the world (residence basis)
- Foreign companies on profits attributable to Cameroonian-based activities or permanent establishments (source basis)

**Rate:** The standard IS rate is **33%** of taxable profit (bénéfice imposable).

For companies in the oil and gas sector, the effective rate is higher due to additional sector-specific levies and participation arrangements with the State.

**Special incentive regimes:**
- Enterprises with Investment Agreement (Convention d'Etablissement): reduced IS rate of 15% for 10-year period for qualifying large investments
- Enterprise Zones (Zones Franches Industrielles): IS exemption for the first 10 years; 15% rate thereafter
- Small enterprises below the simplified regime threshold: flat tax (impôt libératoire) instead of IS

**Taxable Profit Computation:**

Taxable profit = Accounting profit ± Tax adjustments

**Key adjustments:**

*Disallowed deductions (charges non déductibles):*
- Excessive or unusual remuneration paid to directors or controlling shareholders
- Penalties and fines (non-déductibles de plein droit)
- Expenses without supporting invoices above FCFA 50,000
- Interest on loans from shareholders exceeding a thin capitalisation ratio (3:1 debt-to-equity)
- Provisions not meeting the strict conditions (specific risk identified, probable loss, quantifiable)

*Special deductions:*
- Accelerated depreciation on qualifying equipment (first year: up to 50% of cost)
- 100% deduction of expenditure on vocational training
- 50% deduction of expenditure on industrial research and development

**Tax Payment:**

IS is paid in three instalments:
- Two advance payments (acomptes provisionnels) of 1% of prior year turnover each, due in February and May
- Balance payment by 15 March of the year following the fiscal year

---

## CHAPTER 3 — Personal Income Tax (Impôt sur le Revenu des Personnes Physiques, IRPP)

**Scope:** The IRPP applies to all income received by natural persons in Cameroon, including:
- Employment income (salaires, traitements, pensions)
- Business income (bénéfices industriels et commerciaux, BIC)
- Professional income (bénéfices non commerciaux, BNC — doctors, lawyers, architects)
- Agricultural income (bénéfices agricoles)
- Investment income (revenus de capitaux mobiliers — dividends, interest)
- Rental income (revenus fonciers)

**Rates — Progressive Scale:**

| Annual Taxable Income (FCFA) | Marginal Rate |
|---|---|
| 0 – 2,000,000 | 10% |
| 2,000,001 – 3,000,000 | 15% |
| 3,000,001 – 5,000,000 | 25% |
| Above 5,000,000 | 35% |

**Employment Income — Monthly Withholding (PAYE):**

Employers are required to deduct and withhold IRPP from employees' salaries monthly (retenue à la source). The applicable rates are calculated on the net taxable salary (gross salary minus professional charges allowance of 30% and social security contributions).

**Additional Charge (Surtaxe) on Dividends:**

Dividends paid by Cameroonian companies are subject to a 15% withholding tax (Retenue à la Source sur Dividendes, IRCM) at source. This rate is reduced to 7.5% for qualifying companies listed on the Douala Stock Exchange, and to treaty rates for recipients in treaty countries.

---

## CHAPTER 4 — Value Added Tax (Taxe sur la Valeur Ajoutée, TVA)

**Scope:** TVA is levied on the supply of goods and services in Cameroon by taxable persons in the course of their business activities. The TVA follows the destination principle — imports are subject to TVA; exports are zero-rated.

**Standard Rate: 19.25%** (a composite of 17.5% basic TVA + 1.5% surcharge for CEMAC contributions + 0.25% special contribution).

**Zero-Rated Supplies:** Exports of goods, international freight services, and hotel accommodation in qualifying establishments receive the zero rate (with entitlement to credit or refund of input tax).

**Exempt Supplies (no TVA, no input tax credit):** Medical services by licensed health professionals, educational services, financial services, agricultural products in unprocessed form, books, newspapers.

**TVA Registration Threshold:** Turnover exceeding FCFA 50,000,000 per year requires mandatory TVA registration. Voluntary registration is available below the threshold for businesses with significant input tax (e.g., exporters).

**TVA Returns and Payment:** Monthly TVA returns must be filed by the 15th of the following month. The return declares:
- Output tax (TVA collectée) on sales and services provided
- Input tax (TVA déductible) on purchases of goods and services used in taxable activities
- Net TVA payable = Output tax – Input tax

**TVA on Imports:** TVA on imported goods is collected at the port/border by customs at the time of importation, calculated on the customs value + import duties + all other taxes.

---

## CHAPTER 5 — Tax Audit and Enforcement

### Types of Tax Audit

**Desk Audit (Contrôle sur Pièces):** The tax administration reviews the taxpayer's returns and supporting documents without visiting the taxpayer's premises. Frequently used for VAT mismatches and inconsistencies between IS returns and payroll declarations.

**On-Site Audit (Vérification de Comptabilité):** A comprehensive audit of the taxpayer's books and records at their premises. The auditor examines:
- Accounting records (grand livre, journal, balance sheets)
- Supporting invoices and contracts
- Bank statements
- Payroll records
- Stock records

**Right of Communication (Droit de Communication):** Tax auditors may request documents and information from third parties (banks, clients, suppliers) to verify the accuracy of a taxpayer's declarations.

### Taxpayer Rights in Audit

The CGI provides specific procedural protections for taxpayers under audit:

- The taxpayer must be notified in writing (Avis de Vérification) at least 3 days before the audit commences; this notice names the period under audit and the taxes to be verified
- The taxpayer has the right to be assisted by an adviser of his choice (accountant, tax lawyer)
- The audit may not cover a period already audited on the same taxes (non bis in idem principle)
- At the conclusion of the audit, the administration must notify the taxpayer of its findings (Notification de Redressement) and give the taxpayer 30 days to respond
- The taxpayer may appeal to: (i) the Director of Taxation (administrative review), (ii) the Special Tax Commission, and (iii) the Administrative Court

### Interest and Penalties

- Late payment interest: 1.5% per month on unpaid taxes
- Tax evasion (fraud): penalty of 100% of the underpaid tax plus criminal prosecution
- Failure to file: 5% penalty per month of delay, capped at 25%
- Failure to withhold (PAYE, TVA): the employer is personally liable for the amount not withheld

---

*This edition is current to the Finance Act 2024 (Loi de Finances 2024). Tax rates and thresholds are confirmed as of 1 January 2024.*
""")

# ─────────────────────────────────────────────────────────────────────────────
upd(
'Banking Law and CEMAC Regulation in Cameroon',
58,
'COBAC Regulations, CEMAC Directives, and National Banking Legislation',
"""# BANKING LAW AND CEMAC REGULATION IN CAMEROON
## COBAC, BEAC, and the Cameroonian Banking Sector — Annotated Edition

---

# PART I: THE REGULATORY FRAMEWORK

## CHAPTER 1 — Sources of Banking Law

Cameroonian banking law operates at three levels:

**1. The CEMAC Level:** The Central African Economic and Monetary Community (CEMAC) provides the supranational framework. Key instruments:
- CEMAC Convention on the Organisation of Monetary Union (UMAC) — the constitutional foundation of monetary union
- BEAC Statutes — governing the Banque des États de l'Afrique Centrale, the common central bank
- COBAC Regulation No. R-93/13 — the foundational banking regulation applicable across all COBAC-supervised states

**2. COBAC Regulations:** The Banking Commission of Central Africa (Commission Bancaire de l'Afrique Centrale, COBAC) is the supranational prudential supervisor for all banks in Cameroon, Congo, Gabon, CAR, Equatorial Guinea, and Chad. COBAC issues binding regulations on:
- Capital requirements (minimum capital: FCFA 10 billion for banks)
- Prudential ratios (solvency ratio, liquidity ratio, concentration limits)
- Governance requirements (board composition, internal control)
- Anti-money laundering compliance

**3. Cameroonian National Legislation:** Cameroon's national banking legislation governs aspects not covered by COBAC regulations:
- Law No. 2003/004 of 21 April 2003 on anti-money laundering and terrorist financing
- Law No. 90/019 of 10 August 1990 on financial activities (setting up banks and microfinance)
- Regulations governing payments, electronic money, and mobile banking

---

## CHAPTER 2 — Licensing and Capital Requirements

**Article 3 (COBAC Regulation) —** No person may carry on banking activities in Cameroon without a prior authorisation (agrément) from COBAC. The authorisation is granted on application by the founders and covers:
- The corporate form (must be SA or similar form equivalent)
- The nature of banking activities to be conducted (universal banking, specialised banking, microfinance)
- The shareholders and their qualifications
- The management team and their fitness and propriety
- The business plan and five-year financial projections

**Minimum Capital:**
- Commercial Banks: FCFA 10,000,000,000 (10 billion FCFA)
- Specialised Financial Institutions: FCFA 3,000,000,000
- Class 1 Microfinance Institutions: FCFA 25,000,000
- Class 2 MFIs: FCFA 25,000,000 minimum (varies by COBAC category)

**Fit and Proper Test:** Each significant shareholder (>10%), director, and senior manager must satisfy the fit and proper criteria: good professional reputation, no criminal convictions for financial offences, no prior regulatory sanctions, sufficient professional competence.

---

## CHAPTER 3 — Prudential Requirements

### Capital Adequacy (Solvency Ratio)

Banks must maintain a minimum capital adequacy ratio calculated as:

**Tier 1 + Tier 2 Capital ÷ Risk-Weighted Assets ≥ 8%**

This is COBAC's implementation of the Basel Accord. Risk-weighting means:
- Government debt: 0% weight
- Loans to other banks: 20%
- Retail mortgages: 50%
- Corporate loans (standard): 100%
- Non-performing loans: 100-150%

A bank whose capital ratio falls below 8% enters automatic COBAC supervision and must submit a capital restoration plan within 30 days.

### Liquidity Requirements

Banks must maintain:
- **Short-term liquidity coverage:** Liquid assets covering at least 100% of liquid liabilities falling due within 30 days
- **Transformation ratio:** The volume of long-term assets (over 5 years) must not exceed the volume of long-term liabilities by more than 50%

### Large Exposure Limits

No bank may have:
- A single exposure exceeding 45% of net banking equity to a single counterparty
- Aggregate large exposures (each > 15% of equity) exceeding 800% of net banking equity

These limits prevent catastrophic losses from a single default and are the prudential expression of the diversification principle.

### Non-Performing Loans (NPLs)

COBAC requires banks to classify loans by quality:

| Category | Description | Provisioning Requirement |
|---|---|---|
| Performing (courant) | Current in payments | 0% |
| Watch (à surveiller) | Up to 30 days overdue | 5% |
| Sub-standard (en souffrance) | 31-90 days overdue | 20% |
| Doubtful (douteux) | 91-180 days overdue | 50% |
| Loss (compromis) | Over 180 days overdue | 100% |

---

## CHAPTER 4 — Banking Operations

### The Current Account (Compte Courant)

The bank current account is the standard banking relationship. It is governed by:
- The OHADA Uniform Act on Securities (for account pledges)
- The CEMAC Regulation on payment systems
- The bilateral bank-client contract

Key features of the bank current account in Cameroonian law:
- **Fungibility:** Entries in a current account are not individual debts but parts of a single running balance
- **Rule of merger (fusion) of claims:** All credit and debit entries merge into a single balance — neither party may refuse to include a specific entry
- **Right of set-off (compensation):** At account closure, the balance represents the net amount owed by the bank to the client or vice versa
- **Lien:** The bank has a general lien (droit de rétention général) over all assets and funds deposited by a customer, securing all amounts owed by that customer to the bank

### Credit Agreements

Cameroonian law distinguishes several types of credit:

**(a) Term loans (crédits à terme):** Fixed-duration loans with scheduled amortisation. Interest is calculated on the outstanding principal. Early repayment may attract a prepayment penalty (indemnité de remboursement anticipé).

**(b) Overdraft facilities (crédits de trésorerie / découverts):** Short-term facilities for working capital. Interest calculated daily on the actual drawn amount.

**(c) Documentary credit (crédit documentaire, L/C):** An undertaking by the issuing bank to pay the seller-beneficiary on presentation of conforming documents. Governed by UCP 600 (ICC Uniform Customs and Practice for Documentary Credits).

**(d) Bank guarantee (cautionnement bancaire):** The bank undertakes to pay a third party (the beneficiary) on demand or on occurrence of a specified event (e.g., failure of the bank's client to perform a contract). Governed by the OHADA Uniform Act on Securities.

---

## CHAPTER 5 — MOBILE BANKING AND DIGITAL FINANCIAL SERVICES

The rapid growth of mobile money services (Mobile Money, Orange Money, MTN Mobile Money) in Cameroon required a new regulatory framework:

**BEAC Regulation No. 01/17/CEMAC/UMAC/COBAC on Electronic Money Institutions (2017):**

Electronic money institutions (EMEs) are legal entities licensed by COBAC to issue electronic money through mobile channels. Key requirements:
- Minimum capital: FCFA 1,000,000,000
- The funds corresponding to outstanding electronic money must be held in segregated accounts with BEAC or qualified commercial banks
- EMEs may not use customer float for lending or investment purposes
- Customer protection: float must be repayable on demand at any time

**Mobile Money Taxation:** Mobile money transactions are subject to a 0.2% transactions tax (Taxe sur les Transferts d'Argent), collected at source by the mobile money operator. Cameroon's mobile money market is one of the largest in Central Africa, with over 15 million active wallets.

---

*This annotated edition reflects COBAC regulations and national legislation current as of 1 January 2024.*
""")

# ─────────────────────────────────────────────────────────────────────────────
upd(
'Intellectual Property Law in Cameroon and OAPI',
52,
'Bangui Agreement (Revised) and OAPI Practice — Annotated Edition',
"""# INTELLECTUAL PROPERTY LAW IN CAMEROON AND OAPI
## Bangui Agreement as Revised in 1999 — Annotated Edition

---

# PART I: THE OAPI FRAMEWORK

## CHAPTER 1 — The African Intellectual Property Organisation (OAPI)

The African Intellectual Property Organisation (Organisation Africaine de la Propriété Intellectuelle, OAPI) is the intergovernmental organisation administering intellectual property rights in seventeen Francophone African states, including Cameroon. OAPI was established by the Bangui Agreement of 2 March 1977, revised at Bangui on 24 February 1999.

**The unique feature of OAPI IP rights:** Unlike the Paris Convention model (where IP rights are national and must be obtained separately in each country), an OAPI right is a single right valid simultaneously in all seventeen Member States. OAPI administers:

- **Annex I:** Patents for Invention (Brevets d'Invention)
- **Annex II:** Utility Models (Modèles d'Utilité)
- **Annex III:** Trademarks and Service Marks (Marques de Fabrique, de Commerce et de Service)
- **Annex IV:** Industrial Designs (Dessins et Modèles Industriels)
- **Annex V:** Trade Names (Noms Commerciaux)
- **Annex VI:** Geographic Indications (Indications Géographiques)
- **Annex VII:** Literary and Artistic Property (Droit d'Auteur — Copyright)
- **Annex VIII:** New Plant Varieties (Obtentions Végétales)
- **Annex IX:** Layout Designs of Integrated Circuits (Topographies de Circuits Intégrés)
- **Annex X:** Protection Against Unfair Competition (Répression de la Concurrence Déloyale)

OAPI is headquartered in Yaoundé, Cameroon.

---

## CHAPTER 2 — Patent Law (Annex I — Brevets d'Invention)

**Patentability Requirements — Article 1 (Annex I):**

A patent may be obtained for any invention that:
1. **Is novel:** Not previously disclosed to the public anywhere in the world — by any means (publication, public use, oral description, prior patent) — before the application's priority date
2. **Involves an inventive step:** Not obvious to a person skilled in the relevant technical field
3. **Is industrially applicable:** Can be made or used in any industry, including agriculture

**Excluded Subject Matter:**
- Discoveries, scientific theories, and mathematical methods
- Methods for treatment of the human or animal body (medical methods — products may be patented, not methods)
- Plant varieties and animal breeds (covered by Annex VIII)
- Computer programs as such (though software-implemented inventions may be patentable if they produce a technical effect)
- Inventions contrary to public order or morality

**Patent Term:** 20 years from the application date, subject to payment of annual maintenance fees.

**Employee Inventions:** Where an employee makes an invention in the course of employment (within the scope of duties or using employer resources), the employer owns the patent. The employee retains a right to fair compensation (prime d'invention) determined by agreement or by the courts.

**Compulsory Licensing:** OAPI Member States may grant compulsory licences where:
- The patent has not been worked (exploited) in the territory for 3 years after grant
- There is an urgent public health need
- National emergency requires it
Compulsory licences require the payment of adequate remuneration to the patent holder.

---

## CHAPTER 3 — Trademark Law (Annex III)

**Registration Requirements:** A trademark is a distinctive sign (word, device, logo, colour combination, sound, 3D shape) used to distinguish the goods or services of one enterprise from those of another. OAPI registration requires:

1. Distinctiveness: The mark must be capable of distinguishing — generic names, descriptive words, deceptive terms, and official emblems may not be registered
2. Availability: The mark must not conflict with an earlier registered or well-known mark for the same or similar goods/services
3. No deceptiveness: The mark must not deceive consumers as to the nature, quality, or origin of the goods

**Registration Procedure:** Application filed at OAPI, published in the Official Bulletin of OAPI, subject to 3-month opposition period. On registration, a certificate of trademark registration (Titre de Propriété) is issued.

**Term:** 10 years from application, renewable indefinitely for successive 10-year periods.

**Rights Conferred:** The registered trademark owner has the exclusive right to use the mark on the registered goods/services in all 17 OAPI states. Third-party use of an identical or confusingly similar mark constitutes infringement.

**Penalties for Trademark Infringement:**
- Civil: injunction, damages (assessed on the infringer's profits or the owner's losses)
- Criminal: imprisonment of 2-6 months and/or fine of FCFA 1,000,000 to 5,000,000

---

## CHAPTER 4 — Copyright (Annex VII)

**Scope:** Copyright (droit d'auteur) protects original literary and artistic works. It arises automatically on creation — no registration is required. Protected works include:
- Literary works (books, articles, speeches, computer programs)
- Musical works (with or without words)
- Dramatic and choreographic works
- Audiovisual works (films, videos)
- Photographic works
- Architectural works
- Works of fine art, applied art, maps

**Economic Rights (Droits Patrimoniaux):** The exclusive right to:
- Reproduce the work in any form
- Communicate it to the public (broadcast, public performance, online transmission)
- Distribute copies
- Translate, adapt, or make derivative works

**Moral Rights (Droits Moraux):** The inalienable rights of the author to:
- Be identified as the author (droit de paternité)
- Object to any modification, distortion, or mutilation of the work that would be prejudicial to honour or reputation
- Decide if and when to disclose the work (droit de divulgation)

Moral rights are perpetual and cannot be transferred or waived.

**Term:** Life of the author + 70 years.

**Exceptions (Exceptions au Droit d'Auteur):**
- Private copying for personal use
- Quotation for criticism, review, or journalism
- Use for educational purposes
- Reporting current events

**Collective Management:** The Society for the Rights of Authors, Composers and Publishers of Cameroon (Société Civile des Droits des Auteurs, Compositeurs et Éditeurs du Cameroun, SOCADEC) collects and distributes royalties on behalf of authors whose works are publicly broadcast or performed.

---

*This edition covers OAPI law and Cameroonian national provisions current to 31 December 2023.*
""")

# ─────────────────────────────────────────────────────────────────────────────
upd(
'Arbitration Law and CCJA Practice in OHADA',
52,
'OHADA Uniform Act on Arbitration and CCJA Arbitration Rules — Annotated',
"""# ARBITRATION LAW AND CCJA PRACTICE IN OHADA
## The OHADA Uniform Act on Arbitration and CCJA Arbitration Rules

---

# PART I: THE OHADA ARBITRATION FRAMEWORK

## CHAPTER 1 — Sources and Architecture

OHADA arbitration law comprises two distinct regimes operating in parallel:

**1. The Uniform Act on Arbitration (UAA):** Adopted at Ouagadougou on 11 March 1999, revised 23 November 2017. The UAA governs ad hoc and institutional arbitration with its seat in OHADA territory. It applies whenever parties have agreed to arbitrate a dispute in an OHADA Member State. The UAA is modelled on the UNCITRAL Model Law on International Commercial Arbitration.

**2. The CCJA Arbitration Rules:** The Common Court of Justice and Arbitration (CCJA) has its own arbitration rules and administers institutional arbitrations. When parties choose "CCJA arbitration," the CCJA acts as an arbitral institution (administering the procedure, confirming arbitrators, scrutinising awards) while the arbitral tribunal itself decides the merits.

---

## CHAPTER 2 — The Arbitration Agreement

**Definition (Article 3 UAA) —** An arbitration agreement (convention d'arbitrage) is an agreement by which the parties to a contract decide to submit to arbitration all or some of the disputes which have arisen or may arise between them in connection with that contract. The agreement may take the form of an arbitration clause (clause compromissoire) in the main contract or a submission agreement (compromis) concluded after a dispute has arisen.

**Form Requirements:** The arbitration agreement must be in writing (express written agreement or reference to a standard terms document containing an arbitration clause). An oral agreement is invalid.

**Arbitrability:** Any dispute of a contractual nature and of a commercial character may be submitted to arbitration. Non-arbitrable matters include:
- Disputes affecting public order (ordre public)
- Criminal matters
- Family law matters
- Insolvency proceedings governed by the OHADA Uniform Act on Insolvency

**Separability (Autonomie de la Clause):** The arbitration clause is legally independent of the main contract. The validity, existence, or termination of the main contract does not affect the validity of the arbitration clause. This means an arbitral tribunal has jurisdiction to determine whether the main contract exists even if the defendant argues the entire contract is void.

---

## CHAPTER 3 — The Arbitral Tribunal

**Appointment of Arbitrators (Article 5 UAA):**

Arbitrators are appointed:
- By the parties themselves (named in the agreement or subsequently)
- By the arbitration institution (in institutional arbitration)
- By the competent court if a party fails to appoint, or if the appointed arbitrators cannot agree on a chairman

**Number of Arbitrators:** The parties may agree on any number; if they do not agree, the default under the UAA is three arbitrators (one nominated by each party, and a third — the chairman — agreed by the two co-arbitrators).

**Independence and Impartiality:** Arbitrators must disclose any circumstances that may give rise to doubts about their impartiality or independence. An arbitrator may be challenged (récusé) if circumstances reveal a reasonable basis for doubting independence. After appointment, an arbitrator may not accept instructions from any party or accept any payment beyond agreed fees.

**Challenge Procedure:** A party wishing to challenge an arbitrator must do so promptly after becoming aware of the ground of challenge. In CCJA arbitration, challenges are decided by the CCJA Court itself.

---

## CHAPTER 4 — The Arbitral Proceedings

**Principle of Party Autonomy:** The parties are free to agree on the procedure for the arbitral proceedings. In the absence of agreement, the arbitral tribunal establishes the procedure as it deems appropriate, subject to the principles of due process.

**Key Procedural Principles:**

**(a) Equality of parties:** Each party must have an equal opportunity to present its case and to comment on the other party's case. The tribunal must not receive any information from one party without communicating it to the other.

**(b) The adversarial principle (principe du contradictoire):** Each party has the right to contest the evidence and arguments of the other party. Submissions, evidence, and expert reports must be communicated to all parties.

**(c) Confidentiality:** Arbitral proceedings are by default confidential. The content of submissions, evidence, and the award may not be disclosed to third parties without the consent of all parties. This is a major advantage of arbitration over court proceedings for commercial parties.

**Interim Measures:** Unless the parties agree otherwise, the arbitral tribunal may at the request of a party order any interim or conservatory measure it deems appropriate. However, a party may also apply to the national courts for urgent interim measures without this being inconsistent with the arbitration agreement.

---

## CHAPTER 5 — The CCJA as Appellate Court

The CCJA performs a dual function unique in international arbitration:

**Function 1 — Arbitral Institution:** Administers CCJA arbitrations. Reviews draft awards (scrutiny procedure) before they are signed by the tribunal. This scrutiny ensures formal regularity and improves enforceability across Member States.

**Function 2 — Supranational Supreme Court:** The CCJA is the highest court for the interpretation and application of OHADA Uniform Acts. Appeals on points of OHADA law from national supreme courts are heard by the CCJA.

In its capacity as a court, the CCJA may also:
- Hear exequatur applications for OHADA arbitral awards
- Set aside awards on limited grounds (Article 25 UAA)

**Grounds for Setting Aside (Annulation) of Awards (Article 25 UAA):**

An award may be set aside by the CCJA only if:
1. The arbitral tribunal had no jurisdiction (no valid arbitration agreement, or matter not arbitrable)
2. The arbitral tribunal was improperly constituted
3. The arbitral tribunal failed to comply with its mandate (decided beyond the scope of submission, or failed to decide a submitted issue)
4. Due process was violated (a party was denied the opportunity to present its case)
5. The award is contrary to international public order (ordre public international)

This limited review standard means courts may not re-examine the merits of the award — only these formal and jurisdictional grounds are available.

---

## CHAPTER 6 — Recognition and Enforcement of Awards

**The Exequatur Procedure (Article 30 UAA):**

An arbitral award is not automatically enforceable in OHADA territory. The successful party must obtain an exequatur (enforcement order) from the competent court (or the CCJA for CCJA awards). The court granting exequatur will refuse it only if the award is contrary to public order.

**The New York Convention:** Cameroon has ratified the New York Convention on the Recognition and Enforcement of Foreign Arbitral Awards (1958). Foreign arbitral awards (awards made outside OHADA territory) are enforceable in Cameroon under the Convention on the same limited grounds.

---

*This edition covers OHADA arbitration law current to the 2017 revision of the UAA.*
""")

# ─────────────────────────────────────────────────────────────────────────────
upd(
'Criminal Procedure in the Courts of Cameroon',
88,
'Law No. 2005/007 of 27 July 2005 — Criminal Procedure Code Annotated',
"""# CRIMINAL PROCEDURE IN THE COURTS OF CAMEROON
## Law No. 2005/007 of 27 July 2005 — Criminal Procedure Code (CPC) — Annotated Edition

---

# PRELIMINARY: THE CAMEROONIAN CRIMINAL PROCEDURE CODE

## Overview

The Criminal Procedure Code (Code de Procédure Pénale, CPP), enacted as Law No. 2005/007 of 27 July 2005 and entering into force on 1 January 2007, replaced the pre-existing patchwork of procedures inherited from the colonial era. The CPP governs all stages of criminal procedure from initial police investigation through to the execution of sentences.

The CPP is notable for introducing enhanced procedural protections that did not exist under the prior regime:
- Strict time limits on police custody (garde à vue)
- Mandatory legal assistance for accused in serious matters
- Strengthened rights of the victim (partie civile)
- Habeas corpus mechanism (demande de mise en liberté)
- Pre-trial detention (détention provisoire) now limited by strict time limits

The CPP applies in all courts of the Republic of Cameroon, including the Military Court (Tribunal Militaire), except where the Military Code of Procedure provides otherwise.

---

# BOOK I: THE POLICE AND PRELIMINARY INVESTIGATION

## CHAPTER 1 — Judicial Police (Police Judiciaire)

**Article 78 —** Judicial police (police judiciaire) is the activity of investigating, discovering, and gathering evidence of offences, and arresting alleged offenders for prosecution. It is distinct from administrative police (police administrative), which is concerned with preventing disorder and maintaining public order.

**Officers of Judicial Police (Officiers de Police Judiciaire, OPJ):**

The following persons are officers of judicial police under the CPP:

1. State Counsel (Procureur de la République) and substitute prosecutors
2. Examining magistrates (juges d'instruction)
3. Superior Police Officers (Commissaires de Police, Officiers de Gendarmerie) holding specific warrants from the Procureur Général
4. Senior Gendarmerie Officers

**Agents of Judicial Police (Agents de Police Judiciaire):**
- Non-commissioned officers of the Gendarmerie
- Police officers below OPJ rank
- Customs officers (for customs offences)
- Forest officers (for forestry offences)

---

## CHAPTER 2 — Police Custody (Garde à Vue)

**Article 119 —** Garde à vue is the measure by which an OPJ, in the course of an investigation, keeps a person at the police station or gendarmerie post to determine his involvement in an offence. It is the primary measure short of formal arrest.

**Duration and Conditions:**

The maximum duration of garde à vue is 24 hours, renewable once for a further 24 hours (total maximum 48 hours), with the authorisation of the Procureur de la République.

For offences of serious crime and terrorism, the Procureur may authorise extensions up to a maximum of 15 days total.

**Notification Rights:**

The OPJ must immediately notify:
- The person's family or person of their choice
- If a minor: the parents or guardian
- If a foreign national: the person's consulate

**Access to Medical Care:** A person in garde à vue is entitled to be examined by a doctor of their choice at any time during the custody period. The OPJ may not refuse this request.

**Prohibitions During Garde à Vue:**
- No physical or psychological coercion
- No threats, torture, or degrading treatment
- Adequate food, water, rest, and sanitation must be provided
- The custody register (registre de garde à vue) must be maintained and is subject to inspection by the Procureur

---

## CHAPTER 3 — The Preliminary Inquiry (Enquête Préliminaire)

**Article 93 —** The preliminary inquiry (enquête préliminaire) is the standard mode of investigation conducted by OPJs before any formal judicial investigation is opened. In the preliminary inquiry, no coercive powers are available without the consent of the persons concerned, except in limited cases.

**The Police Custody (Enquête de Flagrance):** Where an offence is caught in the act (flagrance), the OPJ has broader powers, including entry and search without warrant in cases of flagrant crime.

**Types of Preliminary Inquiry:**

**(a) Enquête sur commission rogatoire:** The OPJ acts under the specific instruction (commission rogatoire) of an examining magistrate, carrying out specific investigative acts delegated by the magistrate.

**(b) Enquête préliminaire proper:** Self-initiated investigation by OPJ after receiving a complaint or information about an alleged offence. OPJs may:
- Record statements (auditions)
- Conduct consensual searches of premises and vehicles
- Seize documents and objects

---

## CHAPTER 4 — Judicial Investigation (Instruction Judiciaire)

**Article 136 —** Judicial investigation (instruction judiciaire) is mandatory for all felonies (crimes) and is optional (but frequent) for serious misdemeanours. It is conducted by the examining magistrate (juge d'instruction) acting independently of both the prosecution and the defence.

**Referral to the juge d'instruction:** The State Counsel (Procureur de la République) may refer a matter to the juge d'instruction by réquisitoire introductif (in rem order opening an investigation). The victim may also initiate a judicial investigation by constitution de partie civile (joining as a civil party before the examining magistrate).

**Powers of the Juge d'Instruction:**

The juge d'instruction has extensive powers during the investigation:

**(a) Inculpation:** The magistrate formally notifies a suspect that they are under investigation (mise en examen). From this moment, the suspect becomes the inculpé and has all the procedural rights of an accused.

**(b) Detention on Remand (Détention Provisoire):** The juge d'instruction may issue a warrant of committal (mandat de dépôt) placing the inculpé in pre-trial detention where:
- The offence is a felony
- Detention is necessary to protect evidence, prevent flight, or prevent re-offending
- No lesser measure suffices

**Time Limits on Pre-Trial Detention:**

Pre-trial detention is strictly limited:

| Offence Category | Maximum Period |
|---|---|
| Misdemeanour | 6 months (renewable twice = 18 months max) |
| Felony | 12 months (renewable — total 24 months) |
| Organised crime / terrorism | Longer periods by specific legislation |

Beyond the maximum, continued detention is unlawful and the inculpé must be released immediately.

**(c) Commission Rogatoire:** The juge d'instruction may delegate investigative acts to OPJs.

**(d) Requisition of Experts:** The juge may appoint forensic experts, handwriting experts, accountants, or medical experts to assist the investigation.

**(e) Wiretapping and Electronic Surveillance:** Authorised exclusively by the juge d'instruction (not the police) for a maximum of 3 months, renewable once, for felonies and organised crime misdemeanours.

---

## CHAPTER 5 — The Right to Counsel

**Article 80 —** The right to legal assistance (droit à l'assistance d'un avocat) is a constitutional right. The CPP provides:

- From the moment of garde à vue: the detained person may contact a lawyer, and the lawyer may consult with the client at any time during custody
- Once formally inculpé: the lawyer has access to the investigation file (dossier de procédure) and may be present at all hearings before the juge d'instruction
- At trial: the accused has the right to be assisted by counsel of choice; if the accused cannot afford counsel and the offence carries a potential sentence of 10+ years, the court appoints duty counsel (avocat commis d'office)

---

# BOOK II: CRIMINAL PROSECUTION

## CHAPTER 1 — The Procureur de la République (State Counsel)

**Article 61 —** The State Counsel (Procureur de la République) is the head of the prosecution department at the Court of First Instance level. The State Counsel:
- Receives police reports and decides whether to prosecute
- Directs the activities of OPJs in the district
- Represents the State in criminal proceedings as plaintiff (partie poursuivante)

**The Principle of Prosecutorial Discretion (Opportunité des Poursuites):** The State Counsel is not obliged to prosecute every reported offence. He has discretion to:
- File without further action (classement sans suite)
- Pursue alternative measures (classement sous condition — similar to deferred prosecution)
- Refer to juvenile authorities where the accused is a minor
- Prosecute

The victim may challenge a classement sans suite by filing a direct complaint with the examining magistrate.

---

## CHAPTER 2 — Jurisdiction of Criminal Courts

| Court | Offences | Where Located |
|---|---|---|
| Tribunal de Première Instance (TPI) | Misdemeanours (délits) | Every subdivision (sous-préfecture) |
| High Court (TGI — criminal division) | Felonies (crimes) | Each division (département) |
| Court of Appeal | Appeals from TPI and TGI | Each region (régional courts of appeal) |
| Cour Suprême (Chambre Pénale) | Final appeal on points of law | Yaoundé |
| Military Court | Offences by military personnel; terrorism | Yaoundé, Buea, Douala |
| Special Criminal Court | Embezzlement of public funds above FCFA 50 million | Yaoundé |

---

## CHAPTER 3 — Trial Procedure

**Article 398 — The Adversarial Principle.** The criminal trial is conducted on adversarial principles. Both prosecution and defence have equal right to:
- Call and examine witnesses
- Produce documentary and material evidence
- Challenge the opposing party's evidence
- Address the court in closing argument

**Standard of Proof:** Guilt must be established beyond reasonable doubt (intime conviction). The judge is free in their assessment of the evidence — there is no hierarchy of evidence; confessions, witness testimony, documentary evidence, and expert opinion all bear equal weight in principle, to be assessed by the court's inner conviction.

**Article 402 — The Presumption of Innocence.** Every accused person is presumed innocent until proven guilty by a final judgment of conviction. No person may be presented in public as guilty before conviction.

**The Accused's Right to Silence:** The accused is not required to answer questions. Silence may not be treated as evidence of guilt.

**Article 406 — The Partie Civile (Civil Party).** The victim of an offence may join the criminal proceedings as a partie civile, claiming compensation for harm suffered. The criminal court then adjudicates both the criminal charge and the civil damages in the same proceedings.

---

## CHAPTER 4 — Sentencing

**Individualization of Sentences:** The judge must take into account all circumstances of the case — the gravity of the offence, the personal circumstances of the offender, prior convictions, and any mitigating or aggravating circumstances — in determining the sentence within the statutory range.

**Mitigating Circumstances:** The judge may reduce the sentence below the statutory minimum in cases of genuine mitigation:
- First offence
- Genuine remorse and cooperation with authorities
- Provocation
- Youth of the offender

**Suspended Sentences (Sursis):** The court may suspend all or part of a custodial sentence for offenders with no prior convictions, where the offence carries a maximum of 5 years. If the offender commits no further offence within a probation period of 5 years, the sentence is deemed served.

**Alternative Measures:** Community service orders, electronic monitoring, and probation are available under the 2005 CPP as alternatives to imprisonment for minor offences.

---

*This edition is current to all amendments through 31 December 2023, including provisions introduced by the Anti-Terrorism Law of 2014 and the Special Criminal Court legislation.*
""")

# ─────────────────────────────────────────────────────────────────────────────
upd(
'Family Law in Cameroon',
58,
'Civil Status, Marriage, Divorce, Succession, and Guardianship — Second Edition',
"""# FAMILY LAW IN CAMEROON
## Civil Status, Marriage, Divorce, Succession, and Guardianship — Annotated Edition

---

# PART I: CIVIL STATUS AND IDENTITY

## CHAPTER 1 — Birth Registration

Birth registration in Cameroon is governed by Ordinance No. 81-02 of 29 June 1981 on civil status registration.

**Article 26 (Ordinance 81-02) —** The birth of every child born in Cameroon must be registered with the Civil Registry (État Civil) of the district (arrondissement) where the birth occurred. Registration must be effected within thirty (30) days of birth.

**Persons Obliged to Declare:** The father, or in his absence the mother, or in the absence of both parents, the attending physician or midwife, or the person who was present at the birth.

**Consequences of Non-Registration:** A child without a birth certificate has no legal identity in Cameroon — cannot enrol in school, obtain travel documents, vote, or access formal financial services. An estimated 20-30% of births in rural Cameroon are not registered within the required period.

**Late Registration (Jugement Supplétif):** A child not registered within 30 days can only be registered by a court judgment (jugement supplétif) issued by the Court of First Instance of the place of birth. The applicant must produce evidence of birth (witness testimony, medical records, school records). Courts process thousands of jugements supplétifs annually.

---

## CHAPTER 2 — Nationality

**Law No. 1968/LF/3 of 11 June 1968 on Cameroonian Nationality** governs the acquisition, loss, and proof of Cameroonian nationality.

**Acquisition by Descent (Jus Sanguinis):** A child is Cameroonian by descent if:
- The father is Cameroonian (regardless of where born), OR
- The mother is Cameroonian and the father is stateless or unknown

**Acquisition by Birth on Cameroonian Territory (Jus Soli):** A person born in Cameroon to parents who are both stateless or unknown acquires Cameroonian nationality.

**Acquisition by Marriage:** A foreign woman who marries a Cameroonian man may acquire Cameroonian nationality by declaration within two years of marriage, subject to no criminal convictions and no national security concerns. A foreign man who marries a Cameroonian woman does not automatically acquire Cameroonian nationality (the law applies asymmetrically). This asymmetry has been criticised as inconsistent with the equal rights provisions of the Constitution.

**Loss of Nationality:** Voluntary acquisition of a foreign nationality without prior authorisation from the Cameroonian government causes automatic loss of Cameroonian nationality.

---

# PART II: MARRIAGE

## CHAPTER 1 — Conditions for a Valid Marriage

**Civil Law Marriage:** Marriage in Cameroon is governed by the Civil Code (applicable in French Cameroon) and by Ordinance No. 81-02 in both regions. Marriage creates a civil status recognised by the State.

**Article 48 (Civil Code) —** The conditions for a valid civil marriage are:

1. **Consent:** Both parties must give free and full consent. Consent obtained by duress, error as to the identity of the spouse, or fraud as to substantial qualities is defective.

2. **Age:** The minimum age for marriage is 15 years for women and 18 years for men (subject to judicial dispensation). Marriages of persons below these ages are voidable at the instance of the minor or the prosecution.

3. **Monogamy/Polygamy:** Cameroonian law permits both monogamous marriage (mariage monogame) and polygamous marriage under customary law. At the time of marriage, the parties must declare whether their union is monogamous or polygamous.

4. **No prohibited relationship (inceste):** Marriage between direct blood relatives (parent-child, grandparent-grandchild, siblings) is void.

5. **No prior undissolved marriage:** A person already married in a monogamous union may not contract another marriage without first obtaining a divorce. Bigamy is a criminal offence.

**Customary Marriage:** In addition to civil marriage, Cameroonian law recognises customary marriages (mariages coutumiers) entered into under the personal law of the ethnic group of the parties. A customary marriage typically requires the payment of bride price (dot) to the family of the wife and a communal ceremony.

---

## CHAPTER 2 — Effects of Marriage

**Matrimonial Regimes:**

At marriage, spouses may choose between two regimes:

**(a) Separation of Property (Séparation de Biens):** Each spouse retains full ownership, management, and enjoyment of assets owned before and acquired during marriage. Neither spouse is liable for the other's debts.

**(b) Community of Property (Communauté des Biens):** Property acquired by either spouse during marriage constitutes a community jointly owned by both. Each spouse has a 50% undivided share in community assets.

Where parties do not make a choice, the default regime in Cameroon is... [this is a contested point — French law applies the community of acquests by default in French Cameroon; the Anglo-Saxon separate property approach applies in Common Law Cameroon].

**Marital Authority and Rights:**

The 1981 Ordinance partially reformed the previously unequal structure of marital authority. However, vestiges of the paternal model persist in Cameroonian practice:
- A wife does not need the husband's written authorisation to open a bank account (reformed)
- A wife does not need the husband's authorisation to register a company (reformed)
- However, decisions on family residence and the education of children still reflect traditional expectation of paternal leadership in many communities

---

## CHAPTER 3 — Divorce

**Grounds for Divorce (Article 229 Civil Code):**

Cameroon recognises several grounds for divorce:

1. **Mutual consent (consentement mutuel):** Both parties agree to dissolve the marriage. The court must verify that consent is genuine and that arrangements for children are adequate.

2. **Fault (faute):** One party seeks divorce on the ground of the other's serious fault:
   - Adultery
   - Physical violence or abuse
   - Abandonment (leaving the matrimonial home for more than 2 years without justification)
   - Criminal conviction resulting in an infamous sentence
   - Attempted murder of the other spouse
   - Persistent public humiliation

3. **Prolonged de facto separation:** Separation of more than 6 years.

**Effects of Divorce:**

On divorce:
- The matrimonial regime is liquidated
- The community of property (if applicable) is divided in half
- Children's custody is determined by the court applying the best interests of the child
- Maintenance (pension alimentaire) may be ordered for the dependent spouse and for children

**Procedure:** Divorce actions are brought before the Court of First Instance by either spouse. In fault-based divorce, the faulty spouse may not obtain divorce without proving the other's fault. The judge can reconcile parties at a preliminary hearing.

---

# PART III: SUCCESSION

## CHAPTER 1 — Overview

Succession in Cameroon is governed by a complex mixture of:
- Civil Code rules (applicable to those opting for civil law succession)
- Customary law rules (applicable where no testament and parties are subject to customary law)
- Ordinance No. 81-02 provisions on civil status affecting inheritance

**Order of Succession (Civil Code):**

In the absence of a testament:

| Order | Heirs |
|---|---|
| 1st | Descendants (children, grandchildren) |
| 2nd | Parents + siblings (ascendants ordinaires) |
| 3rd | Other ascendants (grandparents) |
| 4th | Collateral relatives up to 6th degree |

**The Reserved Share (Réserve Héréditaire):** Under civil law, descendants are entitled to a reserved portion of the estate which the testator may not deprive them of:
- 1 child: reserved share = 1/2 of estate
- 2 children: 2/3
- 3 or more children: 3/4

A testator may dispose freely only of the "quotité disponible" (the non-reserved portion).

**Customary Succession:** In many Cameroonian ethnic traditions, succession is patrilineal — property passes to male relatives. This often disadvantages widows and daughters. The courts have increasingly applied the constitutional principle of non-discrimination to protect female heirs.

---

*This edition covers family law as applied in Cameroonian courts as at 31 December 2023.*
""")

# ─────────────────────────────────────────────────────────────────────────────
upd(
'Administrative Law and Governance in Cameroon',
62,
'Public Administration, Government Liability, and Administrative Courts',
"""# ADMINISTRATIVE LAW AND GOVERNANCE IN CAMEROON
## Public Administration, Administrative Litigation, and Government Liability — Annotated Edition

---

# PART I: ORGANISATION OF PUBLIC ADMINISTRATION

## CHAPTER 1 — Constitutional Framework

**Article 12 of the Constitution** — The constitutional basis of the executive administration. The President of the Republic heads the executive and appoints the Prime Minister. The Prime Minister directs the administration.

**The Structure of Cameroonian Public Administration:**

Cameroon is a unitary decentralised state. Public administration is organised at three levels:

**1. Central State Administration:**
- Ministries (Ministères): Each headed by a Minister responsible to the Prime Minister and ultimately to the President. There are approximately 35 ministries in the current government.
- National Bodies: Semi-autonomous institutions operating under central State authority (e.g., SONARA, CAMAIR, CAMTEL, CDC).

**2. Deconcentrated Administration (Administration Déconcentrée):**
- Regions (10): Headed by the Governor (Gouverneur de Région), a presidential appointee
- Divisions/Departments (Départements, 58): Headed by the Divisional Officer (Préfet)
- Sub-Divisions (Arrondissements, 360): Headed by the Sub-Divisional Officer (Sous-Préfet)
- Districts (Districts, ~100): Headed by the District Head (Chef de District)

These are territorial representatives of the central State, not autonomous bodies.

**3. Decentralised Authorities (Collectivités Territoriales Décentralisées):**
- Regions: Elected Regional Council; Special Status NW/SW regions
- Councils/Communes (374): Elected Municipal Council and Mayor

---

## CHAPTER 2 — Administrative Act Theory

**Categories of Administrative Decision:**

**(a) Unilateral Administrative Acts (Actes Administratifs Unilatéraux):**

These are the fundamental instruments of administrative governance — acts issued by an administrative authority that create legal effects for the addressee without requiring the addressee's consent.

Types:
- *Décrets* — Issued by the President of the Republic or the Prime Minister; highest form of regulatory act
- *Arrêtés* — Issued by Ministers, Governors, Divisional Officers, Mayors; lower in hierarchy
- *Décisions* — Individual administrative decisions affecting specific persons
- *Circulaires* — Internal administrative instructions; not legally binding on citizens unless they create substantive rights

**Validity Requirements:**

An administrative act is valid only if it satisfies:
1. **Competence:** The authority had the legal power to issue the act
2. **Procedure:** Required consultations and formalities were followed
3. **Form:** Required form (written, published) was respected
4. **Motive (purpose):** The act was issued for the purpose for which the power was granted — an act issued for an ulterior purpose is tainted by "détournement de pouvoir"
5. **Legality (légalité):** The act must not violate superior legal rules (Constitution, law, regulations)

**(b) Administrative Contracts:**

Public contracts are contracts in which at least one party is a public authority and which relate to public service missions. They are subject to specific rules:
- Public procurement rules (Code des Marchés Publics)
- Special performance clauses not available in private contracts (clause exorbitante du droit commun)
- Administrative courts have jurisdiction over disputes

---

## CHAPTER 3 — Public Procurement (Marchés Publics)

**Legal Framework:** Decree No. 2018/366 of 20 June 2018 on the Code of Public Procurement (Code des Marchés Publics).

**Key Principles:**
- **Equal access to competition:** All qualified bidders must have equal access and equal information
- **Transparency:** All contracts above threshold must be published in the Journal des Marchés Publics
- **Best value for money:** Selection criteria must include quality, not merely lowest price
- **Integrity:** Corruption in public procurement is a criminal offence under the Penal Code

**Types of Procurement Procedure:**

| Procedure | Applicable to | Conditions |
|---|---|---|
| Open Tender (Appel d'offres ouvert) | All contracts above thresholds | Default procedure — open to all |
| Restricted Tender (AO restreint) | Technical/security contracts | Limited list of pre-qualified firms |
| Request for Proposals (AMI/AAO) | Complex consultancy/services | Design competition |
| Direct Contract (Gré à gré) | Emergency/single source | Exceptional — requires special authorisation |

**Oversight Bodies:**
- ARMP (Autorité de Régulation des Marchés Publics): Regulatory authority; handles pre-award complaints
- CONSUPE (Contrôle Supérieur de l'État): Post-award audit of contract performance and value for money

---

## CHAPTER 4 — Administrative Litigation (Contentieux Administratif)

**Jurisdiction:** Administrative disputes in Cameroon are heard by the Administrative Chambers (Chambres Administratives) of the Courts of Appeal, and on cassation by the Administrative Division (Division Administrative) of the Cour Suprême.

**Types of Administrative Action:**

**(a) Action for Annulment (Recours Pour Excès de Pouvoir, REP):**

The most important administrative action — a challenge to the legality of an administrative act. Grounds for annulment:

1. Incompetence (the authority lacked power to issue the act)
2. Formal defects (required form or procedure not followed)
3. Violation of the law (the act contradicts a higher rule)
4. Détournement de pouvoir (the power was used for an improper purpose)

If annulled, the act is void from its inception (ex tunc) — as if it had never been issued. The annulment is erga omnes (effective against all persons, not just the applicant).

**(b) Full Jurisdiction Action (Recours de Pleine Juridiction):**

An action for damages against the State for unlawful administrative action or for harm caused by public services. The court can award compensation, order specific performance, or make any appropriate order.

**Liability of the State:**

The State is liable for harm caused by its acts and omissions. Cameroonian administrative law distinguishes:

- *Faute de service* (organisational fault): An individual civil servant cannot be identified as responsible; the harm is attributable to the collective failure of the public service. The State is liable.
- *Faute personnelle* (personal fault): The individual civil servant acted outside the scope of official duty or with gross personal misconduct. The civil servant is personally liable; the State is not.
- *Théorie du risque* (liability without fault): The State is liable for exceptional harm caused to a person by a dangerous public activity, even without fault — e.g., harm from military exercises, dangerous road infrastructure.

---

*This edition covers Cameroonian administrative law current to 31 December 2023.*
""")

print("\n=== Batch B updates complete ===")
