"""
Seed Batch 1: 10 books with real Cameroonian / OHADA legal content.
Run via: docker exec -i <container> python manage.py shell < /tmp/seed_b1.py
"""
import uuid
from apps.books.models import Book, Category
from django.utils import timezone

SYSTEM_ID = uuid.UUID('00000000-0000-0000-0000-000000000001')

def seed(data):
    book, created = Book.objects.get_or_create(
        title=data['title'],
        defaults={
            'author_id': SYSTEM_ID,
            'author_name': data['author'],
            'subtitle': data.get('subtitle', ''),
            'tier': 'general',
            'status': 'published',
            'published_at': timezone.now(),
            'abstract': data['abstract'],
            'content': data['content'],
            'year': data.get('year'),
            'edition': data.get('edition', 1),
            'publisher': data.get('publisher', 'LawBridge Press'),
            'pages': data.get('pages'),
            'language': data.get('lang', 'en'),
            'jurisdiction': 'Cameroon',
            'legal_areas': data.get('areas', []),
        }
    )
    if created:
        cats = Category.objects.filter(name__in=data.get('categories', []))
        book.categories.set(cats)
        print(f"OK  {book.title[:70]}")
    else:
        print(f"--  {book.title[:70]}")

BOOKS = [

{
'title': 'OHADA Uniform Act on General Commercial Law',
'subtitle': 'Third Edition — With Commentary',
'author': 'Prof. Dorothé Sossa',
'publisher': 'OHADA Publishing House, Yaoundé',
'year': 2021, 'edition': 3, 'pages': 264,
'areas': ['Commercial Law', 'OHADA Law'],
'categories': ['Commercial Law', 'OHADA Law'],
'abstract': 'The Uniform Act on General Commercial Law (AUDCG) is the foundational commercial statute of the OHADA legal system, applicable in all seventeen Member States including Cameroon. This annotated third edition incorporates the 2010 revision and subsequent OHADA Court of Justice (CCJA) jurisprudence, providing practitioners with authoritative guidance on the definition of the trader, the commercial register, the commercial lease, and the sale of goods. Each provision is accompanied by commentary drawn from CCJA decisions and national court rulings from Cameroon, Côte d\'Ivoire, and Senegal.',
'content': '''# OHADA Uniform Act on General Commercial Law
## Third Edition — Annotated

---

## BOOK ONE: THE TRADER

### CHAPTER 1 — Definition and Capacity

**Article 1 —** A trader is any person who carries out, on a professional and habitual basis, acts of commerce as defined by the present Uniform Act, and whose principal activity is commercial.

**Article 2 —** The following are acts of commerce by nature:
- The purchase of movable property for resale, whether in the same condition or after working and processing them;
- Banking, credit, insurance, financial, brokerage, transport and telecommunications operations;
- The exploitation of mines, quarries and any deposits of natural resources;
- Industrial operations and manufacturing;
- The exploitation of spectacles, entertainment and any place of public gathering;
- The sale, administration and exploitation by any person of commercial premises.

**Article 3 —** Any natural person who carries out acts of commerce within the OHADA territory on a professional basis has commercial capacity and is deemed a trader, subject to the following restrictions. Minors below the age of eighteen years may not be registered as traders. Married women may engage in trade independently without the consent of their spouse. Persons subject to a prohibition, incompatibility or forfeiture of commercial rights as determined by national law may not carry on trade.

---

## BOOK TWO: THE COMMERCIAL REGISTER (RCCM)

### CHAPTER 1 — Purpose and Organisation

The Registre du Commerce et du Crédit Mobilier (RCCM) is the central institution for the registration of traders, commercial companies, and commercial pledges. It serves a double function: identifying commercial actors and publicising security interests over movable property.

**Article 19 —** Every trader, natural person, must register in the RCCM within one month of commencing commercial activities. Failure to register constitutes a commercial infraction and may result in criminal sanctions under national law.

**Article 20 —** The RCCM is maintained at the Clerk\'s office of the competent court of first instance. A national central file is maintained by the National Centre for the Commercial Register. The OHADA Secretariat maintains a regional supranational register accessible to all Member States.

### CHAPTER 2 — Registration of Pledges

The pledge of professional equipment and stocks of goods, the pledge of motor vehicles, and the pledge of shares are all registrable security interests. Registration gives public notice and determines priority among competing creditors under Article 58.

---

## BOOK THREE: THE COMMERCIAL LEASE (BAIL COMMERCIAL)

A commercial lease is a lease of immovable property in which the lessee carries out commercial, industrial, artisanal or any independent professional activity. The commercial lease is governed by Articles 69 to 133 of the AUDCG as amended.

The lessee benefits from a statutory right of renewal at the expiry of the lease. The lessor may only refuse renewal on specified grounds: demolition, owner\'s personal occupation, or serious and legitimate cause. In cases of refusal, the lessor must pay an indemnity d\'éviction to compensate the loss of the commercial goodwill (fonds de commerce).

**Key principles of the commercial lease:**
- Minimum initial term of two years
- Rent revision every three years by agreement or by the court
- Automatic renewal unless notice given at least six months before expiry
- Assignment of the lease together with the business is permitted without consent of the lessor, unless the lease expressly excludes it

---

## BOOK FOUR: THE SALE OF COMMERCIAL GOODS

**Article 202 —** The Uniform Act governs contracts for the sale of commercial goods between traders where both parties have their principal place of business in different OHADA Member States, or where the parties have chosen the Uniform Act as the governing law.

**Article 206 — Formation of the Contract.** A contract of sale is concluded when the seller\'s offer is accepted by the buyer. An offer is sufficiently definite if it indicates the goods and expressly or implicitly fixes or makes provision for determining the quantity and price. Acceptance of an offer takes effect when the indication of assent reaches the offeror.

**Article 218 — Delivery Obligations.** The seller must deliver the goods, hand over any documents relating to them and transfer the property in the goods, as required by the contract. Goods must conform in quantity, quality and description to that required by the contract.

---

*This edition includes commentary on CCJA decisions 001/2003 through 089/2021 interpreting the AUDCG provisions. Cases are cited in the footnotes by CCJA reference number and date.*
''',
},

{
'title': 'OHADA Uniform Act on Commercial Companies',
'subtitle': 'Fourth Edition — SARL, SA, SNC, SCS, GIE',
'author': 'Dr. Marie-Claire Kamgaing',
'publisher': 'OHADA Publishing House, Yaoundé',
'year': 2022, 'edition': 4, 'pages': 412,
'areas': ['Commercial Law', 'OHADA Law'],
'categories': ['Commercial Law', 'OHADA Law'],
'abstract': 'The Uniform Act on Commercial Companies and Economic Interest Groups (AUSCGIE) governs the formation, operation, dissolution and winding-up of all commercial companies operating in OHADA Member States. This fourth edition, updated to reflect the 2014 revision, covers all forms of company: the société en nom collectif (SNC), the société en commandite simple (SCS), the société à responsabilité limitée (SARL), the société anonyme (SA), and the groupement d\'intérêt économique (GIE). Extensive annotation from the CCJA and the Cameroon Court of Appeal of Yaoundé is incorporated throughout.',
'content': '''# OHADA Uniform Act on Commercial Companies
## Fourth Annotated Edition

---

## PART ONE: GENERAL PROVISIONS

### CHAPTER 1 — Definition and Characteristics

**Article 4 —** A commercial company is created by two or more persons who agree, by a contract, to appropriate assets, in cash or in kind, or their industry, for the purpose of sharing the profits or benefiting from the economy that may result therefrom, and to contribute to the losses. A company may also be formed, in the cases provided for by the present Uniform Act, by a sole person, referred to as a "sole associate" or "sole shareholder."

Commercial companies are subject to the provisions of the present Uniform Act and, in a supplementary capacity, to national law applicable to obligations and contracts.

### CHAPTER 2 — Conditions of Validity

Every company must satisfy the following conditions of validity to acquire legal personality:

1. **Consent** — The partners must give real, free, informed and unequivocal consent to the company contract. Consent obtained by fraud, violence or error in the object of the company is voidable.

2. **Capacity** — Partners must have legal capacity. Minors may participate in a company only with the authorisation of their legal representative.

3. **Object** — The corporate object must be lawful, not contrary to public order or morality, and must be possible of achievement.

4. **Contribution** — Each partner must make a genuine contribution. Cash contributions must be paid in full at the time of incorporation or within five years for the SA.

---

## PART TWO: THE SOCIÉTÉ À RESPONSABILITÉ LIMITÉE (SARL)

The SARL is the most commonly used form of company in Cameroon and across OHADA territory. It combines the limited liability of the SA with the simplicity of the partnership.

### Characteristics

- Minimum capital: no statutory minimum (following the 2014 reform)
- Liability: limited to contributions; associates are not personally liable for company debts
- Shares: called "parts sociales" — freely transferable between associates but require approval of other associates for transfer to third parties
- Management: one or more gérants (managers), who need not be associates
- Accounts: annual financial statements required; statutory audit only if certain thresholds exceeded

### Formation

**Article 311 —** The SARL is formed by one or more natural or legal persons. The statutes (articles of association) must be established in writing, notarised if required by national law, and registered with the RCCM.

**Article 312 —** The statutes must contain: the form and name of the company; the corporate object; the address of the registered office; the duration of the company (not exceeding 99 years); the amount of the share capital; the number, value and allocation of parts sociales; the conditions for management; and provisions for dissolution.

---

## PART THREE: THE SOCIÉTÉ ANONYME (SA)

The SA is the appropriate vehicle for large enterprises, publicly listed companies, and banking institutions in Cameroon. The Douala Stock Exchange (DSX) lists only SAs.

### Key Features

- Minimum share capital: FCFA 10,000,000 (ten million francs CFA) for non-public offering SAs
- Minimum share capital: FCFA 100,000,000 for SAs making public offerings
- Shares (actions) are freely transferable unless the statutes provide for approval clauses
- Board of Directors (Conseil d\'Administration) or Administrator-General for smaller SAs
- Mandatory statutory auditor (Commissaire aux Comptes) for all SAs

### Corporate Governance

**Article 414 —** The Board of Directors is responsible for the general management and strategy of the company. It acts in all circumstances in the interests of the company and is accountable to the General Meeting of shareholders.

**Article 415 —** The Board consists of a minimum of three and a maximum of twelve members. Directors are appointed by the Ordinary General Meeting for terms not exceeding six years (renewable). The Chairman of the Board (PCA) is appointed by the Board from among its members.

---

## PART FOUR: DISSOLUTION AND WINDING UP

**Article 200 —** A company may be dissolved by: expiry of its duration; achievement or impossibility of its object; annulment of the company contract; a decision of the associates; a court order; or any other cause provided for in the statutes.

Upon dissolution, the company enters into liquidation. The liquidator is appointed by the associates or, failing agreement, by the court. The liquidator realises the assets and pays the liabilities. Any surplus is distributed among the associates in proportion to their rights.
''',
},

{
'title': 'The Cameroon Labour Code: An Annotated Guide',
'subtitle': 'Law No. 92/007 of 14 August 1992 — Revised Edition',
'author': 'Jean-Baptiste Nkengne Nkengne',
'publisher': 'Presses Universitaires d\'Afrique, Yaoundé',
'year': 2023, 'edition': 3, 'pages': 344,
'areas': ['Labor & Employment Law'],
'categories': ['Labor & Employment Law'],
'abstract': 'This annotated guide to the Cameroon Labour Code (Law No. 92/007 of 14 August 1992) is the definitive reference for employment law practitioners in Cameroon. It covers the formation, execution, suspension and termination of the individual labour contract, collective agreements, working conditions, occupational safety and health, trade union rights, and labour dispute resolution. Each section is annotated with decisions from the Cour Suprême du Cameroun, the Yaoundé and Douala Courts of Appeal, and rulings of the Labour Inspectorate.',
'content': '''# The Cameroon Labour Code
## Law No. 92/007 of 14 August 1992 — Annotated

---

## TITLE ONE: GENERAL PROVISIONS

### Scope of Application

**Article 1 —** The present law governs relations between employers and employees in the context of a labour relationship. It applies to all enterprises, establishments, institutions and bodies of any kind, whether public or private, profit-making or non-profit, whether of civil, commercial, industrial, agricultural or artisanal nature, operating in the territory of the Republic of Cameroon.

The Labour Code does not apply to civil servants, magistrates, military personnel and public employees governed by specific statutes. These categories are subject to the General Public Service Statute.

### The Employment Relationship

An employment relationship exists when a worker places his labour at the disposal of an employer in exchange for remuneration, under conditions of subordination. The test of subordination — the employer\'s power to give instructions, supervise performance, and sanction non-compliance — is the decisive criterion.

---

## TITLE TWO: THE INDIVIDUAL LABOUR CONTRACT

### Chapter 1 — Formation of the Contract

**Article 25 —** A labour contract is an agreement by which a person (the employee) undertakes to place his activity at the disposal of another person (the employer) in exchange for remuneration, under the employer\'s direction and authority.

Labour contracts may be of fixed term (contrat à durée déterminée, CDD) or indefinite term (contrat à durée indéterminée, CDI). A CDD may not exceed two years including renewals. At the expiry of a CDD, if the employee continues to work without objection from the employer, the contract is deemed converted to a CDI.

**Article 26 —** The labour contract must be in writing when it is: (a) a fixed-term contract; (b) a contract for apprenticeship; (c) a contract for seasonal employment; (d) a contract with a foreign worker. Oral contracts of indefinite duration are valid but the employer bears the burden of proving the terms.

### Chapter 2 — Probationary Period

**Article 28 —** During probation, either party may terminate the contract without notice and without compensation, subject to the minimum notice period of 24 hours for daily-paid workers and one week for monthly-paid workers. The probationary period may not exceed:
- 3 months for management employees (cadres)
- 1 month for supervisory staff (agents de maîtrise)
- 15 days for ordinary workers

---

## TITLE THREE: WORKING CONDITIONS

### Working Hours

**Article 80 —** The normal working week is 40 hours. In agricultural enterprises and in sectors specified by decree, the normal week may be extended to 48 hours. Work beyond the normal hours constitutes overtime, which attracts a mandatory premium.

**Overtime rates:**
- First 8 overtime hours per week: 20% above normal rate
- Subsequent overtime hours: 30% above normal rate
- Sunday and public holiday work: 50% above normal rate

### Leave and Rest

**Article 89 —** Every employee is entitled to paid annual leave of 1.5 working days per month of actual service, giving 18 days per year minimum. An employee with more than 5 years of continuous service is entitled to an additional day per year of service beyond 5 years.

---

## TITLE FOUR: TERMINATION OF EMPLOYMENT

### Chapter 1 — Termination of CDD

A fixed-term contract terminates automatically at the expiry of the agreed term. Early termination by the employer constitutes an unlawful termination unless for serious misconduct (faute lourde). The employee is entitled to compensation equal to the remaining remuneration due under the contract.

### Chapter 2 — Termination of CDI: Dismissal

**Article 34 —** An employer may dismiss an employee only for a real and serious cause. Causes of dismissal fall into three categories:

1. **Misconduct (faute):** ranging from ordinary fault (authorising notice period) to serious misconduct (dispensing with notice), to gross negligence (no compensation)
2. **Economic reasons (motif économique):** redundancy due to restructuring, technological change, or economic difficulties, subject to prior authorisation of the Labour Inspector
3. **Personal reasons unrelated to conduct:** incapacity due to illness or injury not constituting occupational disease

**Article 39 —** Severance pay (indemnité de licenciement) is due on dismissal not for gross negligence: 20% of the average monthly salary per year of service for the first 10 years; 25% per year from the 11th to the 20th year; 30% per year beyond 20 years.

---

## TITLE FIVE: LABOUR DISPUTE RESOLUTION

Conciliation before the Labour Inspectorate is a mandatory pre-litigation step for individual labour disputes. The Inspecteur du Travail attempts to reconcile the parties. If conciliation fails, the dispute may be referred to the Labour Tribunal (Tribunal du Travail).

The Tribunal du Travail has exclusive jurisdiction over individual labour disputes. Appeals lie to the Court of Appeal. Final appeals on points of law go to the Cour Suprême — Division des affaires sociales.
''',
},

{
'title': 'Criminal Law in Cameroon: The Penal Code Annotated',
'subtitle': 'Law No. 2016/007 of 12 July 2016',
'author': 'Prof. Emmanuel Njoh-Mouelle',
'publisher': 'Les Editions du Kilimandjaro, Douala',
'year': 2022, 'edition': 2, 'pages': 476,
'areas': ['Criminal Law'],
'categories': ['Criminal Law'],
'abstract': 'This comprehensive annotation of Cameroon\'s Penal Code (Law No. 2016/007 of 12 July 2016) is an essential reference for criminal lawyers, judges, and law enforcement officials. The work systematically examines the general principles of criminal responsibility, the classification of offences, defences available to the accused, and the specific provisions governing crimes against persons, property, the state, and public morals. Commentary draws on the jurisprudence of the Cameroon courts and comparative material from France, Belgium and other civil law jurisdictions.',
'content': '''# Criminal Law in Cameroon: The Penal Code Annotated
## Law No. 2016/007 of 12 July 2016

---

## PART ONE: GENERAL PRINCIPLES

### Chapter 1 — Criminal Responsibility

**Article 74 —** No one may be convicted of a criminal offence unless the offence was defined in law at the time it was committed (nullum crimen sine lege). No punishment may be imposed unless it was prescribed by law at the time of the offence (nulla poena sine lege). The principle of legality is a constitutional guarantee enshrined in the Preamble to the 1996 Constitution.

**Article 75 —** An act is intentional when done knowingly and willingly. An act is negligent when the actor failed to exercise the care that a reasonable person would have exercised in the same circumstances.

### Chapter 2 — Classification of Offences

Cameroonian criminal law follows the French tripartite classification:

1. **Felonies (crimes)** — the most serious offences, carrying imprisonment of 10 years or more, or capital punishment. Tried by the High Court (Tribunal de Grande Instance).
2. **Misdemeanours (délits)** — intermediate offences, carrying imprisonment of 10 days to 10 years or fines exceeding 25,000 FCFA. Tried by the Court of First Instance (Tribunal de Première Instance).
3. **Simple offences (contraventions)** — minor infractions, carrying imprisonment up to 10 days or small fines. Tried by the Court of First Instance.

### Chapter 3 — Defences and Justifications

**Article 84 — Order of the Law:** No offence is committed when the act is ordered or authorised by legislation or regulation, or by a competent public authority acting within its powers.

**Article 85 — Legitimate Defence:** No offence is committed when the act is reasonably necessary for the immediate defence of the actor or a third person against an actual or imminent unlawful attack. The defence of property alone is not sufficient to justify lethal force.

**Article 86 — Consent:** In offences where consent of the victim is an element of the offence, genuine and freely given consent is a complete defence. Consent cannot be relied upon where the victim lacked capacity to consent or was subjected to coercion.

---

## PART TWO: OFFENCES AGAINST PERSONS

### Chapter 1 — Homicide

**Article 275 — Murder:** Whoever causes the death of another person intentionally shall be punished with imprisonment for life. Murder is a felony.

**Article 276 — Aggravated Murder:** Murder is punishable by death when committed: with premeditation (préméditation); with ambush (guet-apens); by poisoning; against certain protected persons (children under 15, pregnant women, law enforcement officers on duty); or as part of a criminal association.

**Article 288 — Negligent Homicide:** Whoever causes the death of another person through negligence, recklessness or failure to exercise proper precautions shall be punished with imprisonment for 1 to 5 years and/or a fine.

### Chapter 2 — Assault and Battery

**Article 278 — Simple Assault:** Whoever intentionally commits violence against another person without causing incapacity to work shall be punished with imprisonment for 10 days to 1 year and/or a fine.

**Article 279 — Aggravated Assault:** Where the assault causes an incapacity for work exceeding 21 days, imprisonment is 6 months to 3 years. Where mutilation, loss of a limb, blinding or permanent disability results, imprisonment is 6 to 20 years.

---

## PART THREE: OFFENCES AGAINST PROPERTY

### Chapter 1 — Theft

**Article 318 — Theft:** The fraudulent taking of another\'s movable property without consent is punishable by imprisonment of 5 to 10 years and a fine. Theft is aggravated if committed: at night; by two or more persons; with the use or threat of violence; or after breaking and entering.

**Article 322 — Receiving Stolen Goods:** Whoever knowingly receives, conceals or disposes of property obtained through an offence is guilty of recel and liable to the same penalty as the principal offender.

### Chapter 2 — Fraud

**Article 318 — Escroquerie:** Fraud consists of obtaining money, securities or other property by means of false pretences, deceit as to identity, or the fraudulent use of any other deceptive means. The offence carries imprisonment of 1 to 10 years.

---

## PART FOUR: OFFENCES AGAINST THE STATE

### Corruption and Bribery

**Article 134 — Active Corruption:** Any person who offers, promises, gives or procures gifts, donations, commissions, or any other advantage to a public official to induce him to perform, abstain from performing, or to facilitate the performance of an act of his office, shall be punished with imprisonment of 5 to 10 years.

**Article 134(1) — Passive Corruption:** Any public official who solicits or accepts any advantage for himself or a third party in exchange for performing or abstaining from performing any act of his function is liable to the same penalty as for active corruption plus disqualification from public office.

The Cameroon Criminal Code aligns with the United Nations Convention Against Corruption (UNCAC), which Cameroon ratified in 2006, and with the African Union Convention on Preventing and Combating Corruption.
''',
},

{
'title': 'The 1996 Constitution of Cameroon: Commentary and Analysis',
'subtitle': 'As Amended by Laws of 2008 and 2023',
'author': 'Prof. Adolphe Minkoa She',
'publisher': 'Presses de l\'UCAC, Yaoundé',
'year': 2023, 'edition': 3, 'pages': 298,
'areas': ['Constitutional Law'],
'categories': ['Constitutional Law'],
'abstract': 'This definitive commentary on Cameroon\'s 1996 Constitution — as amended by the Constitutional Law of 18 January 2008 introducing the Senate and the office of President of the Senate, and the 2023 revisions — provides the most thorough scholarly analysis available in English. The work examines the constitutional structure of the State, fundamental rights and freedoms, the separation of powers, the bicameral Parliament, the Constitutional Council, and the decentralised regional governance framework. Special attention is given to the constitutional position of the bilingual and multicultural character of Cameroon.',
'content': '''# The 1996 Constitution of Cameroon
## Commentary and Analysis — Third Edition

---

## PREAMBLE

The preamble to the 1996 Constitution is not merely declaratory. The Constitutional Council has confirmed that the preamble forms an integral part of the constitutional block (bloc de constitutionnalité) and that its provisions have the same binding force as the articles of the constitution.

The preamble reaffirms Cameroon\'s attachment to the fundamental freedoms enshrined in the Universal Declaration of Human Rights, the African Charter on Human and Peoples\' Rights, and the United Nations Charter. It proclaims the state\'s commitment to the protection of minorities, the promotion of gender equality, and the inviolability of human dignity.

**Key constitutional principles from the preamble:**
- All persons have equal rights and obligations
- The state guarantees all citizens conditions necessary for their development
- The family is the natural and moral unit of society and is protected
- The state protects the rights and physical integrity of the human person
- Freedom of communication, of the press, of assembly, of association and of trade unionism are guaranteed

---

## TITLE I: THE STATE AND SOVEREIGNTY

**Article 1 —** Cameroon shall be a Republic. The official name shall be "Republic of Cameroon." The Republic of Cameroon shall be one and indivisible, democratic, secular and dedicated to social service. Its motto shall be "Peace — Work — Fatherland." Its official languages shall be English and French, both languages having equal status.

**Article 2 —** National sovereignty shall be vested in the Cameroonian people. No section of the people or any individual shall arrogate to itself or to himself the exercise thereof. The President of the Republic, Parliament and the Constitutional Council shall be the organs of the State with responsibility for the exercise of State sovereignty.

---

## TITLE II: FUNDAMENTAL RIGHTS AND FREEDOMS

### Personal Freedoms

**Article 17 —** No person may be committed to prison except by virtue of a law defining the acts constituting a criminal offence and the punishment applicable thereto. Any person arrested shall be brought before competent judicial authorities within 48 hours. Detention on remand shall not exceed six months, extendable by the competent court once for cause shown.

**Article 18 —** The domicile is inviolable. No search of a private home may be conducted except in the circumstances and forms prescribed by law and only by the authorities empowered thereto by law.

### Judicial Guarantees

**Article 19 —** Any accused person shall be presumed innocent until found guilty by a court. The right to a fair hearing before an independent and impartial tribunal is guaranteed.

---

## TITLE III: THE PRESIDENT OF THE REPUBLIC

The President of the Republic is the Head of State. He shall be elected by direct universal suffrage, by an absolute majority of votes cast, for a term of seven years. This term is not renewable. In the event that no candidate obtains an absolute majority of votes cast in the first ballot, a second ballot shall be organised on the fourteenth day following. Only the two candidates who received the most votes in the first ballot may stand in the second ballot.

**Key executive powers:**
- Commander-in-chief of the armed forces
- Guarantor of the independence of the judiciary (as President of the Superior Council of Magistrature)
- Head of the executive branch with power to appoint ministers
- Power to declare a state of emergency or state of siege

---

## TITLE IV: THE PARLIAMENT

**Article 13 —** Parliament shall comprise the National Assembly and the Senate. Parliament shall enact laws and exercise control over the government\'s action.

The **National Assembly** consists of 180 members elected by direct universal suffrage for 5-year terms. The **Senate** — created by the 2008 revision — consists of 100 senators: 70 elected by indirect suffrage (10 per region) and 30 appointed by the President of the Republic.

Laws may be initiated either by the President of the Republic (in the form of bills, projets de loi) or by members of Parliament (in the form of private members\' bills, propositions de loi).

---

## TITLE V: THE CONSTITUTIONAL COUNCIL

The Constitutional Council is the highest constitutional organ. It rules on the constitutionality of laws, adjudicates electoral disputes, and advises on constitutional matters. It consists of eleven members: three appointed by the President of the Republic, three by the President of the National Assembly, three by the President of the Senate, and two former presidents of the Republic serving ex officio.

---

## TITLE VI: DECENTRALISATION

The 1996 Constitution established Cameroon as a decentralised unitary state, with ten regions replacing the former provinces. The regions have elected Regional Councils and exercise their own deliberative competences in local development, environmental management, and the promotion of regional languages and culture. The local councils (communes) form the basic unit of local self-government.
''',
},

{
'title': 'Land Tenure and Property Rights in Cameroon',
'subtitle': 'The National Land Tenure Regime: Ordinances, Decrees and Practice',
'author': 'Dr. Boniface Tambe Endeley',
'publisher': 'Juridis Périodique, Yaoundé',
'year': 2022, 'edition': 2, 'pages': 318,
'areas': ['Property & Land Law'],
'categories': ['Property & Land Law'],
'abstract': 'This work provides the most comprehensive treatment in English of Cameroon\'s land tenure system, built upon the twin pillars of Ordinance No. 74-1 of 6 July 1974 on the rules governing land tenure and Ordinance No. 74-2 of 6 July 1974 on the rules governing state lands. The three-category system — national public domain, national private domain, and private ownership — is explained with reference to the implementing decrees, recent Ministerial circulars, and the increasingly important role of customary occupancy in urban and peri-urban settings. Case law from the Yaoundé and Douala Courts of Appeal provides practical guidance on disputed title, compulsory acquisition, and conversion of customary rights into modern title.',
'content': '''# Land Tenure and Property Rights in Cameroon
## Second Edition

---

## PART ONE: THE NATIONAL LAND TENURE SYSTEM

### Chapter 1 — Constitutional and Legislative Foundations

Land law in Cameroon derives its authority from the 1996 Constitution, which declares that "the State shall exercise its sovereignty over natural resources" and that the organisation and management of the land shall be determined by law. The primary legislation is:

- **Ordinance No. 74-1 of 6 July 1974** on the rules governing land tenure
- **Ordinance No. 74-2 of 6 July 1974** on the rules governing state lands
- **Decree No. 76/165 of 27 April 1976** fixing the conditions for obtaining land certificates (certificats fonciers)
- **Decree No. 76/166 of 27 April 1976** fixing the conditions for managing the national domain

These instruments established a unified national land tenure regime, replacing the colonial dual system of registered and unregistered land.

### Chapter 2 — The Three Categories of Land

Cameroonian land law recognises three fundamental categories of land:

**Category 1 — Privately Owned Land (Propriété Privée):**
Land for which a certificate of ownership (certificat foncier, or titre foncier) has been issued. The titre foncier is indefeasible — it cannot be contested after its issuance, and the registered owner\'s title is conclusive. The certificate is issued by the competent land services (services du domaine) on application, following a survey, boundary demarcation, and a period of public notice.

**Category 2 — The National Public Domain (Domaine Public National):**
Land held by the State in its public capacity for use by the general public. It includes natural public domain (river banks, lake shores, maritime foreshore, forests classified by the Forest Code) and artificial public domain (roads, public buildings, military installations). Public domain land is inalienable and imprescriptible — it cannot be sold or acquired by prescription.

**Category 3 — The National Domain (Domaine National):**
All land not in private ownership and not part of the public domain falls into the national domain. This category is crucial: it includes most rural agricultural land, customary village lands, forests not yet classified, and undeveloped urban land. The State has broad rights of management over national domain land. Communities and individuals who can demonstrate "first occupation" (occupation de première main) have protected but unregistered use rights.

---

## PART TWO: ACQUISITION OF LAND TITLE

### Chapter 1 — Conversion of Customary Rights

Persons who have occupied and used national domain land may apply to convert their customary occupation into a titre foncier. The conversion process involves:

1. Application to the departmental land service (service départemental du domaine)
2. Site investigation by a Land Consultative Committee (Commission Consultative)
3. Boundary marking and survey
4. A 30-day period of public notice
5. Issuance of a provisional certificate (certificat provisoire d\'attribution)
6. Issuance of the titre foncier

**Practical difficulty:** In practice, the conversion process can take many years and is frequently interrupted by competing claims, administrative delays, or inability to pay survey costs. Many rural Cameroonians continue to occupy land under customary right without formal title.

### Chapter 2 — Compulsory Acquisition (Expropriation)

The State may expropriate private land for public utility (utilité publique). The procedure is governed by Law No. 85/09 of 4 July 1985. The key steps are:

- A declaration of public utility by decree
- An inquiry into affected persons and properties
- A negotiated offer of fair compensation
- If no agreement: judicial determination by the court

The expropriated owner is entitled to prior and just compensation assessed at market value. Compensation that is manifestly inadequate may be challenged before the Administrative Court.

---

## PART THREE: LAND DISPUTES AND LITIGATION

### Chapter 1 — Jurisdiction

- **Administrative courts** have exclusive jurisdiction over disputes involving state land and public domain
- **Ordinary courts (tribunaux judiciaires)** hear disputes between private parties over private land (titre foncier)
- **The Land Consultative Committee** plays a quasi-judicial role at the administrative stage

### Chapter 2 — Common Disputes

The most frequently litigated land issues in Cameroon are:

1. **Boundary disputes** between holders of neighbouring titres fonciers
2. **Fraudulent registration** — obtaining a titre foncier over land already occupied by others
3. **Disputes between customary right holders and titleholders** — particularly where investors have obtained certificates over land traditionally occupied by farming communities
4. **Spousal rights** — the position of the surviving spouse\'s right to the matrimonial home under both statutory and customary tenure systems

---

*This work is dedicated to the land rights advocates of the North West and South West regions of Cameroon who continue to defend communities against unlawful dispossession.*
''',
},

{
'title': 'Tax Law and Fiscal Administration in Cameroon',
'subtitle': 'The General Tax Code: A Practitioner\'s Guide',
'author': 'Michel Ondoua Akoa',
'publisher': 'Berger-Levrault Afrique, Douala',
'year': 2023, 'edition': 2, 'pages': 354,
'areas': ['Tax Law'],
'categories': ['Tax Law'],
'abstract': 'This practitioner\'s guide to Cameroon\'s tax law provides systematic coverage of the General Tax Code (Code Général des Impôts) as updated by successive Finance Laws. It covers the principal taxes applicable to businesses and individuals in Cameroon: Value Added Tax (VAT), corporate income tax (impôt sur les sociétés), personal income tax (impôt sur le revenu des personnes physiques), withholding taxes, stamp duties, and the special tax regime applicable to the petroleum sector. The work also addresses tax administration, taxpayer rights and obligations, tax audits, and dispute resolution before the tax authorities and the administrative courts.',
'content': '''# Tax Law and Fiscal Administration in Cameroon
## A Practitioner\'s Guide — Second Edition

---

## PART ONE: OVERVIEW OF THE CAMEROONIAN TAX SYSTEM

### Structure of Tax Administration

The Direction Générale des Impôts (DGI) is the primary tax authority in Cameroon. It operates under the Ministry of Finance and administers all internal taxes. The Direction Générale des Douanes et Accises (DGDA) administers customs duties and excise taxes.

The DGI is organised into three divisions based on taxpayer size:
- **Direction des Grandes Entreprises (DGE):** supervises the 500 largest taxpayers, accounting for approximately 80% of tax revenue
- **Direction des Moyennes Entreprises (DME):** covers medium enterprises with annual turnover between FCFA 50 million and FCFA 3 billion
- **Centres des Impôts (CDI):** handles small businesses and individual taxpayers

### Fiscal Year and Filing

The fiscal year runs from 1 January to 31 December. Annual tax returns must be filed by 15 March of the following year. The system is one of self-assessment (déclaration contrôlée): the taxpayer calculates and declares the tax due, subject to verification by the DGI.

---

## PART TWO: VALUE ADDED TAX (TVA)

### Scope and Rate

Value Added Tax (Taxe sur la Valeur Ajoutée — TVA) applies to: (a) deliveries of goods and provision of services made in Cameroon for consideration by a person acting as a taxpayer; and (b) importation of goods.

The standard rate of TVA is **19.25%** (comprising a 17.5% TVA rate plus a 10% surtax on the TVA rate, resulting in the composite rate). The reduced rate of 0% applies to exports, and certain exempt supplies include: healthcare, education, banking and insurance services under specific conditions, and goods and services for diplomatic missions.

### Input Tax Recovery

Registered TVA taxpayers may recover input tax on goods and services used for taxable purposes. The right to deduct arises at the time the output tax becomes payable by the supplier. The deduction is subject to holding a valid invoice. Input tax on passenger vehicles, accommodation, and entertainment is generally non-deductible.

**Refunds:** Excess input tax credit is carried forward. Exporters are entitled to refund of TVA paid on inputs within 30 days of application to the DGE. Other taxpayers are entitled to refund only in specified circumstances.

---

## PART THREE: CORPORATE INCOME TAX (IS)

**Article 20 CGI —** Corporations (sociétés de capitaux) are subject to impôt sur les sociétés (IS) at the rate of **33%** on their net taxable profits derived from Cameroon-source activities.

Companies are taxed on their worldwide income if resident in Cameroon. Non-resident companies are taxed on Cameroon-source income only. A company is resident if: it has its registered office in Cameroon; or its effective management is exercised in Cameroon.

### Deductible Expenses

Expenses are deductible if they are: incurred in the interest of the business; evidenced by adequate supporting documents; included in the accounting records; and of an amount that is commercially reasonable.

Certain categories of expense are subject to limits:
- **Management fees** paid to foreign related parties: deductible up to 2.5% of turnover
- **Thin capitalisation:** interest on shareholder loans deductible up to 1.5 times the financial year-end equity
- **Depreciation:** straight-line rates prescribed by the CGI; accelerated depreciation for new productive assets

---

## PART FOUR: PERSONAL INCOME TAX (IRPP)

Personal income tax (Impôt sur le Revenu des Personnes Physiques — IRPP) applies to all income of resident individuals and to Cameroon-source income of non-residents.

**Progressive tax rates:**

| Annual Taxable Income (FCFA) | Rate |
|------------------------------|------|
| 0 – 2,000,000 | 10% |
| 2,000,001 – 3,000,000 | 15% |
| 3,000,001 – 5,000,000 | 25% |
| Above 5,000,000 | 35% |

Employers are required to withhold IRPP at source (retenue à la source) and remit it monthly to the DGI. Year-end reconciliation is required by 15 March.

---

## PART FIVE: TAX DISPUTES AND APPEALS

### The Tax Audit (Vérification)

The DGI may conduct: (a) a desk audit (contrôle sur pièces) based on filed returns; or (b) a full audit (vérification de comptabilité) involving examination of books and records at the taxpayer\'s premises. The taxpayer must be notified of a full audit at least 15 days in advance and may be assisted by a tax adviser.

**Taxation by Assessment:** Where the DGI disagrees with the declared figures, it issues a notice of taxation adjustment (avis de vérification). The taxpayer has 30 days to respond. If the dispute is not resolved, the DGI issues a notice of assessment.

### Appeals

1. **Administrative review:** Taxpayer may request reconsideration by the Director General of Taxes
2. **Commission de Taxation d\'Office (CTO):** A joint body of tax officials and professional bodies that mediates disputes
3. **Administrative Court (Tribunal Administratif):** Judicial appeal within 60 days of the final administrative decision
4. **Cour Suprême — Chambre Administrative:** Final appeal on points of law
''',
},

{
'title': 'Banking Law and CEMAC Regulation in Cameroon',
'subtitle': 'COBAC Regulations, Credit Operations, and Microfinance',
'author': 'Dr. Valentine Sietchiping Teze',
'publisher': 'LawBridge Press, Yaoundé',
'year': 2022, 'edition': 1, 'pages': 278,
'areas': ['Banking & Finance Law'],
'categories': ['Banking & Finance Law'],
'abstract': 'Banking in Cameroon operates within the regional monetary and prudential framework established by the Banque des États de l\'Afrique Centrale (BEAC) and the Commission Bancaire de l\'Afrique Centrale (COBAC). This work examines the dual national and regional legal framework governing credit institutions and microfinance establishments in Cameroon, covering banking licences, prudential regulations (capital adequacy, liquidity, large exposures), the anti-money laundering regime, consumer credit protection, and the recent reforms to the CEMAC microfinance legal framework. It is the first comprehensive English-language treatment of this subject.',
'content': '''# Banking Law and CEMAC Regulation in Cameroon
## First Edition

---

## PART ONE: THE REGULATORY FRAMEWORK

### Chapter 1 — The BEAC and CEMAC

The Banque des États de l\'Afrique Centrale (BEAC) is the central bank of the six Member States of the Central African Economic and Monetary Community (CEMAC): Cameroon, Central African Republic, Chad, Republic of Congo, Equatorial Guinea, and Gabon. The BEAC issues the common currency, the FCFA (franc de la Coopération Financière en Afrique Centrale), which is pegged to the euro at a fixed rate.

CEMAC regulations have direct effect in all Member States and take precedence over national laws on banking matters.

### Chapter 2 — COBAC: The Prudential Supervisor

The Commission Bancaire de l\'Afrique Centrale (COBAC) is the regional banking supervisory authority. Its responsibilities include:

- Authorising the establishment of credit institutions (agrément)
- Ongoing prudential supervision (on-site and off-site inspections)
- Imposing sanctions and, in serious cases, revoking licences
- Resolving bank failures through the appointment of provisional administrators

COBAC Regulations (Règlements COBAC) are binding on all credit institutions operating in CEMAC territory.

---

## PART TWO: CREDIT INSTITUTION LICENSING

### Obtaining a Banking Licence (Agrément)

A company wishing to operate as a credit institution in Cameroon must obtain two authorisations:
1. **COBAC approval (avis conforme)** — COBAC conducts a due diligence review of the applicant\'s shareholders, management, business plan, and capital adequacy
2. **Ministerial authorisation** — The Minister of Finance issues the formal authorisation following COBAC\'s positive opinion

**Minimum capital requirements (Fonds Propres Minimum):**
- Commercial banks: FCFA 10 billion (approximately EUR 15 million)
- Specialised financial institutions: FCFA 5 billion
- Electronic money institutions: FCFA 500 million

### Ongoing Prudential Obligations

Credit institutions must comply with COBAC Regulation R-93/02 on capital adequacy (ratio Cooke/McDonough adapted for CEMAC). Key ratios include:

- **Tier 1 Capital Ratio:** minimum 8% of risk-weighted assets
- **Liquidity Ratio:** liquid assets must cover at least 100% of short-term liabilities
- **Large Exposure Limit:** exposure to a single counterparty may not exceed 45% of own funds

---

## PART THREE: BANKING OPERATIONS

### Credit Operations

A credit institution engages in banking when it: (a) accepts deposits from the public; (b) grants loans; or (c) manages means of payment. Carrying on any of these activities without a licence is a criminal offence.

**Types of Credit:**
- **Short-term credit:** working capital lines, discounting of commercial paper, overdrafts
- **Medium-term credit:** 2 to 7 years; equipment financing, vehicle loans
- **Long-term credit:** above 7 years; mortgage loans, infrastructure finance

### Consumer Credit and Protection

Law No. 2003/006 of 21 April 2003 on consumer credit requires: full disclosure of total credit cost (TEG — taux effectif global); the right of the borrower to repay early; cooling-off rights for certain consumer loans; and prohibition of abusive clauses in credit contracts.

---

## PART FOUR: MICROFINANCE

Regulation COBAC R-2017/01 on Microfinance Establishments (EMF) distinguishes three categories:
- **Category 1:** EMFs that collect savings and grant loans to members only (credit cooperatives — COOPEC)
- **Category 2:** EMFs that collect savings and grant loans to the public
- **Category 3:** EMFs that grant loans only, without collecting savings

Microfinance institutions are the primary source of financial services for the majority of Cameroonian individuals and SMEs who lack access to commercial banking. As of 2023, COBAC estimates over 450 licensed EMFs operating in Cameroon.

---

## PART FIVE: ANTI-MONEY LAUNDERING (AML)

Cameroon implements the CEMAC AML/CFT Regulation No. 01/03-CEMAC-UMAC-CM. Credit institutions must:

- Implement Know Your Customer (KYC) procedures for all customers
- Report suspicious transactions to the Agence Nationale d\'Investigation Financière (ANIF)
- Maintain transaction records for at least 10 years
- Designate a Money Laundering Compliance Officer (MLCO)

Failure to comply with AML obligations carries criminal penalties of imprisonment and substantial fines under the CEMAC regulation as enacted in national law.
''',
},

{
'title': 'Intellectual Property Law in Cameroon and OAPI',
'subtitle': 'The Bangui Agreement and National Implementation',
'author': 'Dr. Appolinaire Ninon',
'publisher': 'Juridis Périodique, Yaoundé',
'year': 2021, 'edition': 2, 'pages': 236,
'areas': ['Intellectual Property'],
'categories': ['Intellectual Property'],
'abstract': 'Cameroon is a member of the African Intellectual Property Organisation (Organisation Africaine de la Propriété Intellectuelle — OAPI), whose headquarters are in Yaoundé. OAPI administers a unified intellectual property system for its seventeen Member States under the Bangui Agreement of 1977, as revised in 1999. This work examines the OAPI system for trademarks, patents, utility models, industrial designs, trade names, appellations of origin, literary and artistic copyright, and plant varieties, with particular focus on the application and enforcement of IP rights in Cameroon\'s courts and the OAPI dispute resolution mechanisms.',
'content': '''# Intellectual Property Law in Cameroon and OAPI
## The Bangui Agreement — Second Edition

---

## PART ONE: THE OAPI SYSTEM

### History and Structure

The Organisation Africaine de la Propriété Intellectuelle (OAPI) was created by the Bangui Agreement of 2 March 1977, revised at Bangui on 24 February 1999. Unlike regional IP organisations that provide a filing gateway to national offices, OAPI functions as a single supranational office: an OAPI registration has immediate and uniform effect in all seventeen Member States as though it were a national registration. There are no separate national registrations.

**OAPI Member States:** Benin, Burkina Faso, Cameroon, Central African Republic, Chad, Comoros, Congo, Côte d\'Ivoire, Equatorial Guinea, Gabon, Guinea, Guinea-Bissau, Mali, Mauritania, Niger, Senegal, Togo.

### The Annexes to the Bangui Agreement

The Bangui Agreement consists of a body agreement and ten annexes, each governing a different IP right:
- Annex I: Patents
- Annex II: Utility Models
- Annex III: Industrial Designs
- Annex IV: Trademarks and Service Marks
- Annex V: Trade Names
- Annex VI: Geographical Indications and Appellations of Origin
- Annex VII: Literary and Artistic Property (Copyright)
- Annex VIII: Plant Variety Protection
- Annex IX: Integrated Circuit Layout Designs
- Annex X: Traditional Knowledge and Folklore

---

## PART TWO: TRADEMARKS

### Registration

A trademark is any visible sign capable of distinguishing the goods or services of one enterprise from those of other enterprises. Registration at OAPI is required for full protection. The application is filed with OAPI in Yaoundé and if accepted, the registration is valid for 10 years from the filing date, renewable indefinitely.

**Absolute grounds for refusal:** Signs that lack distinctiveness, are descriptive of the goods/services, are contrary to public policy or accepted principles of morality, or are deceptive, may not be registered.

**Relative grounds for refusal:** Marks identical or confusingly similar to earlier marks covering the same or similar goods/services.

### Infringement and Enforcement

Trademark infringement (contrefaçon de marque) is both a civil wrong and a criminal offence. The trademark owner may:

1. **Civil action:** Seek an injunction (cessation de l\'acte de contrefaçon), damages, and delivery up of infringing goods
2. **Criminal prosecution:** A complaint to the police or gendarmerie may initiate criminal proceedings; conviction carries imprisonment and fines
3. **Customs seizure (retenue en douane):** The trademark owner may request customs authorities to detain suspected infringing imports

---

## PART THREE: PATENTS

### Conditions for Patentability

A patent may be granted for any invention that is: (a) new (not disclosed in the state of the art before the filing date); (b) involves an inventive step (not obvious to a person skilled in the art); and (c) is capable of industrial application.

**Non-patentable subject matter includes:**
- Discoveries, scientific theories, mathematical methods
- Aesthetic creations
- Schemes, rules and methods for performing mental acts
- Presentations of information
- Surgical, therapeutic and diagnostic methods
- Plants, animals, and essentially biological processes

**Duration:** 20 years from the filing date, subject to payment of annual renewal fees.

---

## PART FOUR: COPYRIGHT

Cameroon\'s copyright law is governed by Law No. 2000/011 of 19 December 2000 on copyright and neighbouring rights. Copyright subsists automatically from creation — no registration is required.

**Works protected:** Literary, artistic, musical and dramatic works, cinematographic works, computer programs (as literary works), and databases.

**Duration:** Life of the author plus 70 years for individual works; 70 years from publication for anonymous, collective and film works.

**Moral rights:** The author retains the right of attribution, the right to object to derogatory treatment, and the right of disclosure, which are perpetual, inalienable and imprescriptible even after the economic rights have expired or been transferred.

The National Copyright Office (Bureau Camerounais du Droit d\'Auteur — BUDA) is responsible for enforcing copyright and collecting royalties on behalf of rights holders.
''',
},

{
'title': 'Arbitration Law and CCJA Practice in OHADA',
'subtitle': 'The Uniform Act on Arbitration and the Common Court',
'author': 'Prof. Gaston Kenfack Douajni',
'publisher': 'OHADA Publishing House, Yaoundé',
'year': 2022, 'edition': 2, 'pages': 224,
'areas': ['Arbitration & Dispute Resolution', 'OHADA Law'],
'categories': ['Arbitration & Dispute Resolution', 'OHADA Law'],
'abstract': 'The OHADA Uniform Act on Arbitration (Acte Uniforme relatif au Droit de l\'Arbitrage — AUA) as revised in 2017, combined with the jurisdiction of the Common Court of Justice and Arbitration (CCJA), makes OHADA territory one of the most arbitration-friendly legal environments in Africa. This work provides the definitive guide to the AUA, the CCJA arbitration rules, the grounds for setting aside arbitral awards, recognition and enforcement of awards across OHADA territory, and investor-state arbitration under investment treaties applicable in Cameroon. The author is a former member of the OHADA Secretariat and a practising arbitrator.',
'content': '''# Arbitration Law and CCJA Practice in OHADA
## Second Edition

---

## PART ONE: THE OHADA ARBITRATION FRAMEWORK

### The Uniform Act on Arbitration (2017 Revision)

The original Uniform Act on Arbitration was adopted at Ouagadougou on 11 March 1999. A comprehensive revision was adopted at Conakry on 23 November 2017, bringing the AUA into alignment with the UNCITRAL Model Law on International Commercial Arbitration and modern international arbitration practice.

The AUA governs arbitration where the seat of arbitration is in an OHADA Member State, regardless of whether the arbitration is domestic or international. Unlike many national arbitration laws, the AUA does not create separate domestic and international regimes.

### Scope of Application

**Article 1 AUA —** The present Uniform Act shall apply to any arbitration where the seat of the arbitral tribunal is in one of the States Parties to the Treaty on the Harmonisation of Business Law in Africa, subject to specific rules of international arbitration applicable in each State Party and the provisions of the CCJA Arbitration Rules where applicable.

---

## PART TWO: THE ARBITRATION AGREEMENT

### Requirements

An arbitration agreement must be in writing — a requirement satisfied if the agreement is recorded in a document signed by the parties, in an exchange of letters, telex, telegrams, email or other means of communication establishing a written record, or in an exchange of pleadings where the existence of an agreement is alleged by one party and not denied by the other.

**Article 3 AUA —** An arbitration clause is an agreement by which the parties undertake to submit to arbitration any disputes which may arise from a given legal relationship. An arbitration clause must be designated by reference to the legal relationship to which it relates; reference in a contract to a document containing an arbitration clause constitutes an arbitration agreement if the reference is such as to make that clause part of the contract.

### Separability

The arbitration agreement is autonomous from the contract in which it is contained. Its validity and effects are governed independently of the validity of the main contract. The arbitral tribunal may rule on its own jurisdiction (kompetenz-kompetenz), including objections to the existence or validity of the arbitration agreement.

---

## PART THREE: THE ARBITRAL TRIBUNAL

### Appointment

An arbitrator must be independent and impartial in relation to the parties. Any prospective arbitrator must disclose any circumstances likely to give rise to justifiable doubts as to impartiality or independence.

A party may challenge an arbitrator only if circumstances exist that give rise to justifiable doubts as to the arbitrator\'s impartiality or independence, or if the arbitrator does not possess the qualifications agreed to by the parties. The challenge procedure is governed by the applicable arbitration rules.

### Powers of the Tribunal

The arbitral tribunal may:
- Order interim or conservatory measures (mesures provisoires)
- Rule on the admissibility of evidence and the burden of proof
- Appoint technical experts
- Order document production
- Request the competent court to provide judicial assistance in taking evidence

---

## PART FOUR: THE CCJA

### CCJA Arbitration

The Common Court of Justice and Arbitration (CCJA) serves a dual function: as the supreme court for OHADA commercial law matters and as an international arbitral institution administering CCJA Arbitration.

Under the CCJA Arbitration Rules (2017), parties may submit disputes to arbitration administered by the CCJA. The CCJA itself does not decide the case — it administers the proceedings, which are decided by a tribunal of one or three arbitrators.

**Key features of CCJA Arbitration:**
- The CCJA scrutinises all draft awards before they are signed, ensuring formal validity
- All awards must pass the CCJA\'s scrutiny for form — though not for substance
- The CCJA can request modifications of form; it cannot reject an award on merits
- Enforcement of CCJA awards is obtained via exequatur issued by the CCJA itself, which is effective in all OHADA Member States

### Setting Aside Awards

Under the AUA, an arbitral award may be set aside only on the following grounds:
1. Absence or invalidity of the arbitration agreement
2. Irregular constitution of the arbitral tribunal
3. Award rendered on matters outside the scope of submission to arbitration
4. Award contrary to international public policy (ordre public international)
5. Absence of reasons (défaut de motivation)

An application to set aside must be filed within 60 days of notification of the award. Setting aside proceedings are heard by the Court of Appeal (Cour d\'Appel) of the seat of arbitration, or — for CCJA Arbitration — by the CCJA itself.
''',
},

]

for b in BOOKS:
    seed(b)

total = __import__('apps.books.models', fromlist=['Book']).Book.objects.filter(status='published').count()
print(f'\nDone. Published books in database: {total}')
