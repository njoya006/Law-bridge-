"""
Seed Batch 2: 10 more books — Criminal Procedure, Family, Environmental,
Human Rights, Customary, Admin, Civil Procedure, International, Civil, Legal Ethics.
Run via: docker exec -i <container> python manage.py shell < /tmp/seed_b2.py
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
'title': 'Criminal Procedure in the Courts of Cameroon',
'subtitle': 'Law No. 2005/007 of 27 July 2005 — Annotated',
'author': 'Dr. Henri Tchantchou',
'publisher': 'Juridis Périodique, Yaoundé',
'year': 2022, 'edition': 2, 'pages': 448,
'areas': ['Criminal Procedure'],
'categories': ['Criminal Procedure'],
'abstract': 'The Code of Criminal Procedure (CPC), enacted as Law No. 2005/007 of 27 July 2005, represents the most significant reform of Cameroonian criminal justice in decades, replacing the colonial-era 1967 Penal Procedure Code. This annotated edition systematically examines the investigation phase, the pre-trial detention regime, the conduct of criminal trials, sentencing, and appeal, with particular attention to the rights of the accused, the role of the defence counsel, and the expanding use of alternative measures to prosecution. Decisions of the Cour Suprême on points of criminal procedure are cited throughout.',
'content': '''# Criminal Procedure in the Courts of Cameroon
## Law No. 2005/007 — Annotated

---

## PART ONE: INVESTIGATION

### Chapter 1 — Judicial Police and Investigation

The judicial police (police judiciaire) operates under the authority of the Parquet (prosecuting authority). Its task is to ascertain criminal offences, collect evidence, and bring suspected offenders before the competent judicial authority.

**Officers of the Judicial Police (OPJ):** Magistrates of the Parquet, Senior Divisional Officers and their delegates, judicial police inspectors, and officers of the gendarmerie and police designated by law.

**Article 92 CPC —** When an OPJ is called to investigate a flagrant offence, he has the power to: (a) seal off the scene of the offence; (b) take statements from witnesses; (c) conduct searches of any premises for evidence; (d) place any person suspected of involvement in custody (garde à vue); and (e) seize any item that may constitute evidence.

### Chapter 2 — Pre-Trial Detention (Garde à Vue)

**Article 119 CPC —** Any person suspected of having committed an offence may be placed in police custody (garde à vue) for an initial period not exceeding 24 hours. This period may be extended by a further 24 hours on the written authorisation of the Procureur de la République.

In cases of terrorism, narcotics trafficking, or cross-border organised crime, garde à vue may be extended to a maximum of 15 days with the written authorisation of the investigating magistrate.

**Rights of the Person in Garde à Vue:**
- Right to be informed of the reason for detention and the offence suspected
- Right to notify a family member
- Right to access a doctor if health requires
- Right not to be subjected to any form of coercion, violence, or inhuman treatment

---

## PART TWO: THE EXAMINING MAGISTRATE (JUGE D\'INSTRUCTION)

Cameroon\'s criminal procedure retains the inquisitorial examining magistrate (juge d\'instruction), who has exclusive power to investigate serious offences (crimes and délits). The examining magistrate may issue:

- **Summons (citation à comparaître):** calling a suspect or witness to appear
- **Arrest warrant (mandat d\'arrêt):** for suspects at large who are unlikely to appear voluntarily
- **Remand in custody (détention provisoire):** with judicial supervision, duration strictly limited

**Article 221 CPC —** Pre-trial detention (détention provisoire) may not exceed six months in criminal cases. It may be extended by the Chambre d\'Accusation for further periods of three months up to a maximum of eighteen months in the most complex cases. Detention beyond the statutory maximum without court order is unlawful detention.

---

## PART THREE: THE TRIAL

### The Adversarial Principle

The 2005 CPC introduced a more adversarial model, strengthening the role of the defence:

**Article 304 —** The accused has the right to be represented by counsel of his choice. Legal aid counsel (commis d\'office) must be appointed if the accused cannot afford private counsel in cases carrying a potential sentence of 10 years or more.

**Article 305 —** The prosecution bears the burden of proving guilt beyond reasonable doubt. No adverse inference may be drawn from the accused\'s silence.

### Sentencing

Sentences available to the criminal courts of Cameroon include:
- **Capital punishment:** retained for the most serious felonies including aggravated murder
- **Life imprisonment:** for murder, armed robbery with homicide, serious rape
- **Fixed-term imprisonment:** from 10 days to 20 years depending on the offence
- **Fines**
- **Forfeiture of assets:** in narcotics and corruption cases
- **Community service:** as an alternative to short custodial sentences

---

## PART FOUR: APPEALS

**Court of First Instance → Court of Appeal:** Appeals against judgments of the Court of First Instance must be lodged within 10 days of judgment for the parties present, and within 3 months of publication for parties absent.

**Court of Appeal → Cour Suprême:** Cassation appeals (pourvoi en cassation) lie to the Cour Suprême on points of law only. The Cour Suprême does not reassess the facts.
''',
},

{
'title': 'Family Law in Cameroon',
'subtitle': 'Marriage, Matrimonial Regimes, Divorce and Succession',
'author': 'Prof. Jacqueline Mouangue Kobila',
'publisher': 'Presses de l\'UCAC, Yaoundé',
'year': 2021, 'edition': 2, 'pages': 292,
'areas': ['Family Law'],
'categories': ['Family Law'],
'abstract': 'Family law in Cameroon operates at the intersection of state legislation, customary law, and religious norms. This work provides a coherent analysis of the statutory framework governing marriage formation and dissolution, matrimonial property regimes, filiation and parental authority, and succession under the Cameroonian Civil Code and applicable customary norms. Special chapters address the legal position of women in marriage and divorce, children\'s rights, and the recognition of customary marriages in civil proceedings. The author draws on over twenty years of scholarship and practice in Cameroonian family courts.',
'content': '''# Family Law in Cameroon
## Marriage, Matrimonial Regimes, Divorce and Succession

---

## PART ONE: MARRIAGE

### Chapter 1 — Formation of Marriage

Marriage in Cameroon is a civil institution governed by the Civil Code as applied by Cameroon\'s national courts. Three forms of marriage may be recognised:

1. **Civil marriage (mariage civil)** — performed before a civil registrar; the only form with full legal effect for all purposes including inheritance and social security
2. **Religious marriage** — valid between the parties in their faith community but has no autonomous legal effect without civil registration
3. **Customary marriage (mariage coutumier)** — traditionally performed in many communities; may be recognised by courts if proven

**Article 48 Civil Code —** Two persons who desire to marry must satisfy the following conditions: (a) neither must be already married (prohibition of polygamy for women; polygamy for men is conditioned by national and customary rules); (b) neither must be related within prohibited degrees of consanguinity or affinity; (c) both must have attained the legal age: 18 years for men, 15 years for women (reform under discussion to equalise at 18 years); (d) both must give full and free consent.

### Chapter 2 — Bridewealth (Dot)

In many Cameroonian communities, payment of bridewealth (dot) is a condition for the validity of a customary marriage. Courts have increasingly recognised that non-payment of dot, while evidence against a customary marriage, is not in itself conclusive. The Supreme Court has held that a customary marriage may be valid even without full bridewealth payment if the parties have cohabited and been treated by their community as married.

---

## PART TWO: MATRIMONIAL REGIMES

Married couples in Cameroon are governed by one of three regimes:

**1. Separation of Property (Séparation de Biens):** Each spouse retains exclusive ownership and management of property owned before marriage and acquired during marriage. This is the preferred regime among professionals and business owners.

**2. Community of Acquests (Communauté Réduite aux Acquêts):** Property acquired during marriage (other than by gift or inheritance) is jointly owned. Each spouse manages their own property; major acts require the consent of both spouses. This is the default regime under the Civil Code.

**3. Universal Community (Communauté Universelle):** All property, existing and future, is jointly owned. Creditors of either spouse can reach community property for debts incurred for household needs.

---

## PART THREE: DIVORCE

**Article 229 Civil Code —** Divorce may be granted by the court on the petition of either spouse for specified causes:
- Adultery
- Abandonment of the matrimonial home for at least one year
- Serious or repeated violation of matrimonial duties making continued cohabitation intolerable
- Final criminal conviction to imprisonment of 5 years or more

**Procedure:** Divorce proceedings begin with a conciliation attempt before the president of the court. If conciliation fails, the case proceeds to trial. The court determines: whether the divorce is granted; fault (which affects support obligations); custody of children; and division of matrimonial property.

**Child Custody:** The welfare of the child is the paramount consideration. Courts generally award custody to the mother for younger children and give children above 10 years some weight in expressing preferences.

---

## PART FOUR: SUCCESSION

### Testate Succession

Any person aged 18 and above may make a will. The will must comply with formal requirements: handwritten will (testament olographe) — entirely handwritten, dated and signed; notarial will (testament authentique) — signed before a notary and two witnesses; secret will (testament mystique).

The Cameroonian Civil Code provides for a forced share (réserve héréditaire) that cannot be defeated by will: children (including natural children) are entitled to one-half (one child), two-thirds (two children), or three-quarters (three or more children) of the estate, regardless of the will.

### Intestate Succession

On death without a valid will, the estate is distributed according to the statutory order: (1) descendants (children, grandchildren); (2) surviving spouse; (3) ascendants and collateral relatives. Customary heirs may claim through parallel customary succession proceedings, particularly for land and livestock.
''',
},

{
'title': 'Environmental Law and Natural Resources in Cameroon',
'subtitle': 'The 1994 Forest Law, the 1996 Environment Law, and the Mining Code',
'author': 'Dr. Victor Mbappe Tita',
'publisher': 'Presses Universitaires d\'Afrique, Yaoundé',
'year': 2022, 'edition': 1, 'pages': 298,
'areas': ['Environmental Law'],
'categories': ['Environmental Law'],
'abstract': 'Cameroon contains some of Africa\'s most significant biodiversity — the Congo Basin forests, the Cameroonian Highlands, and the Lake Chad Basin — and is subject to increasingly important international environmental obligations. This work examines the legal framework governing forest management and exploitation (Law No. 94/01 of 20 January 1994), environmental protection and management (Law No. 96/12 of 5 August 1996), the 2002 Mining Code, wildlife conservation, and Cameroon\'s obligations under international environmental treaties including the Paris Agreement, the Convention on Biological Diversity, and CITES.',
'content': '''# Environmental Law and Natural Resources in Cameroon
## First Edition

---

## PART ONE: THE CONSTITUTIONAL AND STATUTORY FRAMEWORK

### Constitutional Basis

The preamble to Cameroon\'s 1996 Constitution provides that "every person shall have a right to a healthy environment. The protection of the environment shall be the duty of every citizen. The State shall ensure the protection and improvement of the environment."

This constitutional mandate is implemented through three framework statutes: the Forest Law (1994), the Environment Law (1996), and the Mining Code (2002), supplemented by numerous implementing decrees.

### The Ministry of Environment

The Ministry of Environment, Nature Protection and Sustainable Development (MINEPDED) is the lead environmental authority. It administers environmental impact assessments, enforces pollution standards, manages protected areas, and represents Cameroon in multilateral environmental agreements.

---

## PART TWO: FOREST LAW (LAW NO. 94/01 OF 20 JANUARY 1994)

### Classification of Forests

The 1994 Forest Law classifies forests in Cameroon into:

**1. Permanent Forest Estate (Domaine Forestier Permanent):**
Forests permanently dedicated to forest use. Comprises: state forests (forêts domaniales), including national parks, wildlife reserves, and production forests; and council forests (forêts communales) managed by local councils.

**2. Non-Permanent Forest Estate (Domaine Forestier Non-Permanent):**
Forests not permanently dedicated to forest use, including community forests, farm forests, and agroforestry systems.

### Forest Concessions and Logging Licences

Commercial logging requires a Forest Management Unit (FMU / Unité Forestière d\'Aménagement, UFA) concession from the Ministry of Forests (MINFOF). UFAs are allocated by competitive tendering. The concessionaire must prepare and implement an approved management plan.

**Revenue sharing:** The annual timber levy (Redevance Forestière Annuelle) is shared:
- 50% to the State Treasury
- 40% to the concerned local council
- 10% to the concerned village communities

This sharing mechanism has been widely praised as an innovative community benefit-sharing arrangement, though implementation challenges persist.

### Community Forests

Communities may be allocated up to 5,000 hectares of non-permanent forest to manage for the benefit of community members. The community manages the forest under a simple management plan. Income from community forestry must be used for community development projects.

---

## PART THREE: THE ENVIRONMENT LAW (LAW NO. 96/12 OF 5 AUGUST 1996)

### Environmental Impact Assessment (EIA)

**Article 17 —** Projects likely to have significant impact on the environment must be subject to an Environmental Impact Assessment (EIA) approved by the competent authority before commencement. Projects subject to mandatory EIA include: industrial facilities, mines, dams, major roads and railways, large agricultural schemes, and coastal developments.

The EIA process involves: scoping; baseline study; impact prediction and evaluation; public consultation; mitigation measures; and monitoring plan. Projects with minor impacts may be required to prepare a simplified Environmental and Social Impact Notice (PNIES).

### Pollution Control

The Environment Law prohibits the discharge of solid, liquid or gaseous waste that damages the quality of water, air or soil beyond prescribed standards. Industrial emissions standards are set by decree. Environmental violations may result in: orders to cease operations; fines; criminal prosecution; and mandatory clean-up obligations.

---

## PART FOUR: WILDLIFE AND BIODIVERSITY

Cameroon\'s wildlife is regulated by Law No. 94/01 and Decree No. 95/466/PM. Wildlife is classified by protection status:

- **Class A:** Total protection — no hunting permitted (gorillas, chimpanzees, elephants, manatees, pangolins)
- **Class B:** Partial protection — regulated by sport hunting permits
- **Class C:** Not specially protected — may be hunted with a hunting licence

Cameroon is a signatory to CITES (the Convention on International Trade in Endangered Species), which controls international trade in protected species. CITES violations carry severe penalties including imprisonment.

---

## PART FIVE: INTERNATIONAL ENVIRONMENTAL OBLIGATIONS

### Paris Agreement

Cameroon ratified the Paris Agreement on climate change in 2016. Its Nationally Determined Contribution (NDC) commits to reducing greenhouse gas emissions by 32% by 2035 compared to a business-as-usual scenario, conditional on international financial support.

### Congo Basin Forest Partnership

Cameroon is a key member of the Congo Basin Forest Partnership, which aims to protect the Congo Basin — the world\'s second-largest tropical rainforest after the Amazon. The 2012 Cameroon–EU Voluntary Partnership Agreement on Forest Law Enforcement, Governance and Trade (FLEGT VPA) commits Cameroon to a timber legality assurance system as a condition of timber exports to the EU.
''',
},

{
'title': 'Human Rights Law in Cameroon',
'subtitle': 'Constitutional Protections, the African Charter, and ACHPR Practice',
'author': 'Prof. Maurice Kamto',
'publisher': 'Les Editions du Kilimandjaro, Douala',
'year': 2021, 'edition': 2, 'pages': 368,
'areas': ['Human Rights Law'],
'categories': ['Human Rights Law'],
'abstract': 'This work examines human rights protections in Cameroon through three lenses: the national constitutional framework established by the 1996 Constitution; the African Charter on Human and Peoples\' Rights (the Banjul Charter), ratified by Cameroon in 1989; and the decisions of the African Commission on Human and Peoples\' Rights and the African Court on Human and Peoples\' Rights against and concerning Cameroon. The author — a former candidate for President of the International Court of Justice and a renowned public international law scholar — provides both doctrinal analysis and critical commentary on the gap between formal rights guarantees and practical enjoyment of human rights in Cameroon.',
'content': '''# Human Rights Law in Cameroon
## Constitutional Protections, the African Charter, and ACHPR Practice

---

## PART ONE: CONSTITUTIONAL RIGHTS

### The Constitutional Block

The protection of human rights in Cameroon derives from three constitutional instruments:

1. **The Preamble to the 1996 Constitution** — which incorporates by reference the rights in the Universal Declaration of Human Rights, the UN Charter, and the African Charter
2. **The body of the 1996 Constitution** — Articles 17-25 containing specific guarantees
3. **The 1972 Constitution as amended** — the predecessor constitution retains relevance for historical continuity

**Key constitutional rights:**
- **Personal liberty:** No person may be deprived of liberty except in accordance with law (Art. 17)
- **Right to a fair trial:** Independent and impartial tribunal (Art. 19)
- **Freedom of expression and press:** Guaranteed within the limits of the law (Art. 17(2))
- **Freedom of religion:** The secular (laïc) character of the State does not impede religious freedom
- **Right to property:** Guaranteed; expropriation only for public utility with prior fair compensation

### The Constitutional Council

The Constitutional Council (replacing the Supreme Court\'s Constitutional Chamber under the 1996 reform) has the power to declare laws unconstitutional. However, access is limited: only the President of the Republic, the President of the National Assembly, the President of the Senate, and one-third of members of Parliament may refer laws to the Constitutional Council before promulgation. There is no constitutional complaint mechanism for individuals.

---

## PART TWO: THE AFRICAN CHARTER ON HUMAN AND PEOPLES\' RIGHTS

### Scope of Rights

Cameroon ratified the African Charter (the Banjul Charter) on 20 June 1989. The Charter has direct effect in Cameroonian law and may be invoked before national courts.

The African Charter is distinctive in three respects:

1. **Clawback clauses:** Many rights are limited "as established by law." National legislation may restrict rights more than other international instruments permit, provided the restrictions have a legitimate aim and are proportionate.

2. **Peoples\' rights:** The Charter recognises collective rights of peoples — the right to self-determination, to freely dispose of natural resources, to development, and to a satisfactory environment.

3. **Duties:** The Charter imposes duties on individuals toward their family, society, the state, and the international community.

### The African Commission

The African Commission on Human and Peoples\' Rights (ACHPR) in Banjul examines individual and inter-state communications alleging violations of the Charter.

**Notable decisions concerning Cameroon:**
- *Social and Economic Rights Action Center v. Nigeria (2001)*: Established that socio-economic rights are justiciable and that states have positive obligations to protect communities from corporate environmental harm — directly applicable by analogy to Cameroon\'s extractive industries.
- Communications against Cameroon concerning: enforced disappearances in the Anglophone crisis; treatment of prisoners; and freedom of the press.

---

## PART THREE: THE ANGLOPHONE CRISIS AND HUMAN RIGHTS

The conflict in the North West and South West regions (2016 to present) has generated the most serious human rights concerns in contemporary Cameroon. International and domestic human rights bodies have documented:

- Extrajudicial killings by both security forces and armed groups
- Widespread displacement of civilians (over 700,000 internally displaced persons)
- Destruction of schools and health facilities
- Arbitrary detention of civilians in military custody
- Serious restrictions on freedom of movement and access

**The legal framework applicable to the conflict** includes: international humanitarian law (Common Article 3 to the Geneva Conventions, applicable to non-international armed conflicts); international human rights law (African Charter, ICCPR, CAT); and Cameroonian criminal law.

---

## PART FOUR: CIVIL SOCIETY AND NHRI

The National Human Rights Commission (Commission Nationale des Droits de l\'Homme et des Libertés — CNDHL) was established by Law No. 2004/016 of 22 July 2004. It has a mandate to: promote awareness of human rights; investigate allegations of human rights violations; and advise the government. However, the CNDHL lacks the power to make binding decisions or award compensation to victims.

Civil society organisations — including the Ligue Camerounaise des Droits de l\'Homme, the Réseau des Défenseurs des Droits Humains en Afrique Centrale (REDHAC), and Amnesty International Cameroon — play a crucial role in monitoring, documentation, and advocacy.
''',
},

{
'title': 'Administrative Law and Governance in Cameroon',
'subtitle': 'Organisation of the State, Administrative Acts, and Judicial Review',
'author': 'Prof. Luc Sindjoun',
'publisher': 'Presses Universitaires de Cameroun, Yaoundé',
'year': 2022, 'edition': 3, 'pages': 334,
'areas': ['Administrative Law'],
'categories': ['Administrative Law'],
'abstract': 'Administrative law in Cameroon — derived from the French droit administratif tradition — governs the organisation and action of the public administration and the legal relations between public authorities and private persons. This third edition examines the structure of the central and decentralised administration, the theory and practice of administrative acts (règlements and décisions), the State\'s liability in tort, the public contracts regime including public procurement, and administrative dispute resolution before the Administrative Tribunals and the Supreme Court\'s Administrative Division. Recent reforms under the decentralisation programme and the Special Status of the North West and South West Regions receive detailed treatment.',
'content': '''# Administrative Law and Governance in Cameroon
## Third Edition

---

## PART ONE: ORGANISATION OF THE CAMEROONIAN STATE

### Central Administration

The central administration is organised on the principle of hierarchical subordination. At its apex is the Presidency of the Republic, which coordinates the Secretariat-General of the Presidency and the Cabinet. The Prime Minister\'s Office coordinates government action.

Ministries are the principal organs of the central administration. Each ministry is headed by a Minister appointed by the President of the Republic. Within ministries, the principal units are Directorates (Directions Générales and Directions), Sub-Directorates (Sous-Directions), and Services.

**Déconcentrated services:** Central ministries are represented at regional and divisional level by Regional Delegates (Délégués Régionaux) and Divisional Delegates (Délégués Départementaux). These officers exercise delegated powers of the ministry within their territorial circumscription.

### Decentralised Authorities

The 1996 Constitution and the Law on Decentralisation (Law No. 2004/17 of 22 July 2004) established three levels of territorial decentralised authority:

- **Regions (Régions):** Ten regions, each governed by a Regional Council elected by indirect suffrage and a President of the Regional Council. The State is represented by the Governor (Gouverneur).
- **Municipalities (Communes):** 374 communes, each governed by a Municipal Council elected by direct suffrage and a Mayor (Maire). The State is represented by the Senior Divisional Officer (Préfet).
- **City Councils (Communautés Urbaines):** Major cities have an additional layer of metropolitan governance.

---

## PART TWO: ADMINISTRATIVE ACTS

### Unilateral Administrative Acts (Actes Administratifs Unilatéraux)

An administrative act is any decision made unilaterally by a public authority in the exercise of its powers, which creates, modifies or extinguishes legal rights or obligations. Administrative acts may be:

- **General acts (règlements):** Apply to all persons or a category of persons; examples: presidential decrees, ministerial orders (arrêtés)
- **Individual acts (décisions individuelles):** Apply to a named person; examples: appointments, dismissals, licences, refusals

**Principles governing administrative acts:**
- **Légalité:** Administrative acts must be consistent with the Constitution, laws, and superior regulations
- **Forme et procédure:** Required forms and procedures must be observed
- **Notification:** Administrative acts affecting individual rights must be notified to the person concerned

### Administrative Contracts (Marchés Publics)

Public procurement in Cameroon is governed by Decree No. 2018/355 of 12 June 2018 on the Code of Public Contracts. Public contracts above specified thresholds must be awarded through competitive tender (appel d\'offres). The Regulatory Agency for Public Contracts (ARMP — Agence de Régulation des Marchés Publics) supervises the procurement process and hears procurement disputes.

---

## PART THREE: LIABILITY OF THE STATE IN TORT

### Principle of State Liability

The State and public authorities may incur liability in two circumstances:

**1. Fault-based liability (responsabilité pour faute):** The public authority committed a faute de service — a malfunction of the public service. This is the general rule.

**2. No-fault liability (responsabilité sans faute):** Applied where the victim suffers an abnormal and special prejudice due to a lawful public act (e.g., lawful expropriation, or injury caused by a police operation).

### Procedure

Claims against the State in administrative matters are brought before the Administrative Tribunal of the Regional capital. Appeals go to the Supreme Court — Administrative Division.

The statute of limitations for State liability claims is 4 years from the date the claimant knew or ought to have known of the damage (prescription quadriennale).

---

## PART FOUR: JUDICIAL REVIEW OF ADMINISTRATIVE ACTION

### The Recours pour Excès de Pouvoir (REP)

The recours pour excès de pouvoir is the primary mechanism for individuals to challenge administrative acts before the Administrative Tribunal. Any person with a direct and personal interest may bring a REP to annul an administrative act that is: ultra vires (outside the authority\'s powers); procedurally irregular; contrary to law; or vitiated by detournement de pouvoir (misuse of power for an unauthorised purpose).

### The Special Status of the NW and SW Regions

Law No. 2019/004 of 25 April 2019 confers a Special Status on the North West and South West Regions, giving these Anglophone regions additional powers in education, cultural affairs, and the use of English in public services. The Special Status represents an important administrative law development, though critics argue it falls short of the federal arrangement sought by many in these regions.
''',
},

{
'title': 'Civil Procedure in the Courts of Cameroon',
'subtitle': 'The Code of Civil and Commercial Procedure — A Practical Guide',
'author': 'Dr. Henri Tchantchou',
'publisher': 'Juridis Périodique, Yaoundé',
'year': 2021, 'edition': 2, 'pages': 282,
'areas': ['Civil Procedure'],
'categories': ['Civil Procedure'],
'abstract': 'This practical guide to Cameroonian civil procedure covers the principal rules governing civil litigation from pre-trial to enforcement, drawing on the Code of Civil and Commercial Procedure (CCCP), the applicable OHADA procedural rules, and the jurisprudence of the Yaoundé and Douala Courts of Appeal. It addresses jurisdiction, representation, pleadings, provisional measures, evidence, judgment, appeal, and the enforcement of civil judgments including OHADA writs of execution. Special chapters address arbitration as an alternative to litigation and the simplified collection procedures for uncontested debts (injonction de payer) under the OHADA Uniform Act.',
'content': '''# Civil Procedure in the Courts of Cameroon
## A Practical Guide — Second Edition

---

## PART ONE: THE COURT STRUCTURE

### Courts of Civil Jurisdiction

- **Tribunal de Première Instance (TPI) / High Court:** First-instance jurisdiction over most civil and commercial disputes. In practice, TPI and HCT exercise concurrent jurisdiction in Anglophone regions.
- **Cour d\'Appel / Court of Appeal:** Hears appeals from TPI/HCT judgments. There are ten Courts of Appeal, one per region.
- **Cour Suprême / Supreme Court:** Hears cassation appeals on points of law from Courts of Appeal.

### Jurisdiction

**Subject-matter jurisdiction:** General civil jurisdiction rests with the TPI. Labour disputes go to the Tribunal du Travail. Administrative disputes go to the Tribunal Administratif.

**Territorial jurisdiction:** Generally, the defendant\'s place of domicile. For contracts, the place of performance. For real property, the location of the property.

---

## PART TWO: COMMENCING PROCEEDINGS

### The Summons (Assignation)

Civil proceedings are commenced by service of a summons (assignation) on the defendant, through a Huissier de Justice (bailiff). The summons must contain:
- Identification of the parties
- Statement of the cause of action
- Relief sought
- Date, time, and place of hearing
- Copy of all documents relied upon

The defendant has a minimum of 15 days to file a defence (conclusions) and any counterclaim.

### Legal Representation

Representation by an Avocat is mandatory before the Courts of Appeal and the Cour Suprême. Before the TPI, parties may represent themselves or be represented by a close family member with power of attorney, or by a trade union representative in labour matters.

---

## PART THREE: PROVISIONAL MEASURES

### Reference to the President (Référé)

Where urgent action is required, a party may apply to the President of the court for an interim order (ordonnance de référé). The référé judge may make orders:

- **Référé d\'urgence:** Urgent protective orders in any matter
- **Référé conservatoire:** Orders to preserve evidence or assets pending trial
- **Référé provision:** Ordering payment of an undisputed portion of a debt

The référé order is not a judgment on the merits; it is provisional and may be revisited at trial.

### Conservatory Attachment (Saisie Conservatoire)

Under the OHADA Uniform Act on Simplified Recovery Procedures and Measures of Execution, a creditor who can show a prima facie case and urgency may obtain a conservatory attachment of the debtor\'s movable assets without prior notice. The creditor must subsequently obtain a judgment to convert the conservatory attachment into a definitive execution.

---

## PART FOUR: EVIDENCE

### Admissible Evidence

Cameroonian civil procedure draws from the Civil Code\'s rules of evidence:

- **Written evidence (la preuve par écrit):** Documentary evidence, including notarial deeds (actes authentiques) which have conclusive probative value and private deeds (actes sous seing privé) which are admissible if acknowledged or not denied
- **Testimonial evidence (la preuve testimoniale):** Witnesses may be examined; witness statements are generally required for claims above FCFA 100,000 to supplement documentary evidence
- **Presumptions:** Legal presumptions (as in negligence cases) and factual presumptions (présomptions de fait) drawn by the judge from established facts
- **Expert evidence:** The court may appoint an expert (expert judiciaire) to report on technical questions

---

## PART FIVE: ENFORCEMENT OF JUDGMENTS

### OHADA Simplified Recovery Procedures

**Injonction de Payer (Payment Order):** For undisputed liquid claims, the OHADA Uniform Act on Simplified Recovery Procedures provides an expedited mechanism. The creditor files a petition with the President of the competent court, who issues an order ex parte if satisfied of the claim. If the debtor does not oppose within 15 days, the order is enforceable. This mechanism is widely used in commercial practice for recovery of unpaid invoices.

**Execution:** Enforcement of judgments and payment orders is carried out by a Huissier de Justice. Methods of execution include: attachment of bank accounts (saisie-attribution de créances); attachment of wages (saisie sur rémunérations); seizure and sale of movable property; and in OHADA proceedings, seizure of commercial assets (saisie de droits d\'associé et de valeurs mobilières).
''',
},

{
'title': 'International Trade Law for Cameroonian Businesses',
'subtitle': 'WTO Membership, AfCFTA, and Export-Import Regulations',
'author': 'Dr. Francis Batoum Batoum',
'publisher': 'LawBridge Press, Yaoundé',
'year': 2023, 'edition': 1, 'pages': 318,
'areas': ['International Law'],
'categories': ['International Law'],
'abstract': 'Cameroon\'s position as a trading nation is shaped by its membership of the World Trade Organisation (since 1995), the Central African Economic and Monetary Community (CEMAC), the Economic Community of Central African States (ECCAS), and its Economic Partnership Agreement (EPA) with the European Union. Since 2021, Cameroon has also been engaged in implementing the African Continental Free Trade Area (AfCFTA). This work provides the first comprehensive English-language guide to the international trade law framework applicable to Cameroonian businesses, covering customs duties and tariffs, trade in services, investment protection, intellectual property in trade, and the use of international commercial arbitration for trade disputes.',
'content': '''# International Trade Law for Cameroonian Businesses
## First Edition

---

## PART ONE: CAMEROON\'S TRADE PROFILE

### Trade Structure

Cameroon is one of sub-Saharan Africa\'s most diversified economies, exporting: crude oil and petroleum products; cocoa and coffee; timber and wood products; cotton; aluminium; and increasingly, manufactured goods. Its main trading partners are the European Union (historically), China (growing rapidly), India, and Nigeria.

**GDP and trade:** Trade (exports plus imports) amounts to approximately 55% of Cameroon\'s GDP. The port of Douala — the largest on the Gulf of Guinea — serves as the primary gateway not only for Cameroon but for landlocked Chad and the Central African Republic.

---

## PART TWO: WORLD TRADE ORGANISATION

### WTO Membership and Commitments

Cameroon has been a WTO member since 13 December 1995. As a developing country member, Cameroon benefits from: special and differential treatment (SDT) provisions allowing longer implementation periods for trade liberalisation obligations; technical assistance and capacity-building; and reduced obligations in certain sectors.

**Tariff Commitments:** Cameroon has "bound" its tariffs — committed not to raise customs duties above the bound rate — for most product categories. The CEMAC Common External Tariff (CET) applies a four-band structure:
- 0%: essential goods (some medicines, basic foods)
- 5%: raw materials and capital goods
- 10%: intermediate goods
- 20%: consumer goods and finished products

### WTO Dispute Settlement

Cameroon has participated as a third party in several WTO dispute settlement proceedings but has not been a complainant or respondent in formal dispute settlement. WTO dispute settlement is available to challenge measures that violate WTO agreements — most importantly the GATT, GATS, TRIPS, and the SPS and TBT Agreements.

---

## PART THREE: THE EU-CAMEROON ECONOMIC PARTNERSHIP AGREEMENT

The EU-Cameroon EPA (signed 2009, provisionally applied since 2014) provides duty-free and quota-free access to EU markets for substantially all Cameroonian exports. In return, Cameroon liberalises imports from the EU over a 15-year period.

**Key benefits for Cameroon:**
- Duty-free access for all agricultural exports to the EU (major benefit for cocoa, coffee, banana producers)
- Fisheries Protocol giving Cameroonian fishing vessels and the EU fleet access under agreed terms
- Rules of origin provisions enabling cumulation with other ACP countries

**Obligations on Cameroon:**
- Progressive reduction of import duties on EU goods over 15 years
- Trade facilitation obligations (customs modernisation)
- Cooperation on sanitary and phytosanitary standards

---

## PART FOUR: THE AFRICAN CONTINENTAL FREE TRADE AREA (AFCFTA)

The AfCFTA Agreement entered into force on 30 May 2019. Cameroon signed in March 2018 and ratified in January 2021. Full implementation of the AfCFTA is expected to create the world\'s largest free trade area by number of countries.

**Key AfCFTA provisions:**
- Phase 1 commitments: elimination of tariffs on 90% of goods within 5 years (10 years for sensitive goods)
- Services liberalisation across five priority sectors: business services, communications, financial services, tourism, and transport
- Investment chapter promoting regional investment flows
- A dispute settlement mechanism for state-to-state trade disputes

### Implications for Cameroonian Businesses

AfCFTA creates new opportunities for Cameroonian manufacturers to export to the 1.4 billion-person African market. Key growth sectors include: food processing (cocoa, coffee); chemicals; pharmaceuticals; and light manufacturing. The main challenge is meeting rules of origin requirements and product standards across destination markets.

---

## PART FIVE: INVESTMENT PROTECTION

Cameroon has bilateral investment treaties (BITs) with France, Switzerland, Germany, the United States, China, and several other states. These treaties provide international law protections for foreign investors including:

- **Fair and equitable treatment** (FET) — the most commonly invoked standard
- **Most-favoured-nation treatment** (MFN)
- **Protection against expropriation** without prompt, adequate and effective compensation
- **Repatriation of profits** — the right to transfer investment proceeds freely

Investment disputes with foreign investors may be referred to the International Centre for Settlement of Investment Disputes (ICSID) or to ad hoc UNCITRAL arbitration under applicable BIT provisions.
''',
},

{
'title': 'Civil Law of Obligations in Cameroon',
'subtitle': 'Contract Formation, Validity, Performance and Delictual Liability',
'author': 'Dr. Gaston Song Bela',
'publisher': 'LawBridge Press, Yaoundé',
'year': 2022, 'edition': 1, 'pages': 396,
'areas': ['Civil Law'],
'categories': ['Civil Law'],
'abstract': 'Cameroon\'s law of obligations derives from the French Civil Code, maintained largely intact from the colonial era and supplemented by commercial obligations under the OHADA Uniform Acts. This work provides a systematic treatment of contractual obligations — offer and acceptance, conditions of validity, content, performance and non-performance — and non-contractual obligations including delictual (tort) liability, quasi-contracts (enrichissement sans cause, gestion d\'affaires, paiement de l\'indu), and damages. The work bridges the French civil law tradition with the common law influence evident in Anglophone Cameroon\'s court practice, providing guidance that is useful across both legal systems.',
'content': '''# Civil Law of Obligations in Cameroon
## Contract Formation, Validity, Performance and Delictual Liability

---

## PART ONE: CONTRACT — FORMATION

### Chapter 1 — Offer and Acceptance

**Article 1101 Civil Code (as applied in Cameroon) —** A contract is an agreement by which one or more persons bind themselves to one or more other persons to give something, to do something, or not to do something.

**Offer:** An offer must be sufficiently definite (identifying the essential terms: parties, subject-matter, price or consideration) and made with the intention to be bound. An offer may be revoked before acceptance unless: (a) it specifies a fixed period for acceptance; or (b) the offeree has relied on the offer to their detriment.

**Acceptance:** Acceptance must mirror the offer (mirror-image rule under civil law). A purported acceptance that modifies the terms of the offer is a counter-offer. Acceptance takes effect when communicated to the offeror (théorie de la réception).

### Chapter 2 — Conditions of Validity

**Article 1108 Civil Code —** Four conditions are required for the validity of a contract:

1. **Consent (consentement)** — real, free and informed. Vices du consentement that vitiate consent: erreur (error on a substantial quality of the subject-matter), dol (fraudulent misrepresentation), and violence (coercion).

2. **Capacity (capacité)** — both parties must have the capacity to contract. Minors may not contract except for acts of ordinary daily life proportionate to their condition. Mentally incapacitated persons under judicial protection (tutelle) may not contract without their guardian.

3. **Object (objet)** — the object must be: certain (determined or determinable); possible of performance; and licit (not contrary to law or public morals — ordre public et bonnes moeurs).

4. **Cause (cause)** — each party\'s obligation must have a lawful cause. An obligation without cause, with a false cause, or with an unlawful cause is void.

---

## PART TWO: PERFORMANCE AND NON-PERFORMANCE

### Performance (Exécution)

Contracts must be performed in good faith (Article 1134 Civil Code). The obligation to perform in good faith extends not only to the express terms but also to implied terms arising from equity, custom, and the nature of the contract.

**Specific performance (exécution forcée):** Where a debtor fails to perform an obligation to do something, the creditor may petition the court for an order of specific performance (ordonnance d\'injonction de faire). The court may also award an astreinte (periodic fine) to compel compliance.

### Non-Performance: The Remedies

Where a debtor fails to perform their obligation without lawful justification, the creditor may choose between:

1. **Résolution (Termination):** The contract is dissolved retroactively, restoring the parties to their pre-contractual positions. Requires prior formal notice to perform (mise en demeure) and an order of the court (in most cases).

2. **Damages (Dommages-Intérêts):** The debtor is liable to pay compensation for the harm caused by non-performance. Damages include: damnum emergens (actual loss suffered) and lucrum cessans (profits lost). Remote and unforeseeable damage is not recoverable (principle of foreseeability of damage).

3. **Exception d\'Inexécution (Self-Help Defence):** Either party may suspend its own performance where the other party has failed to perform its reciprocal obligation (exceptio non adimpleti contractus).

---

## PART THREE: DELICTUAL LIABILITY (LA RESPONSABILITÉ DÉLICTUELLE)

### General Principle — Article 1382 Civil Code

**Article 1382 —** "Any act whatsoever of man which causes damage to another obliges him by whose fault it occurred to repair it." This general clause has no equivalent in common law and renders virtually any harmful conduct potentially actionable.

**Elements of delictual liability:**
- **A fault (faute):** An act or omission departing from the standard of a reasonable person in the same circumstances
- **Damage (préjudice):** The claimant must have suffered actual loss
- **Causation (lien de causalité):** The fault must have caused the damage

### Liability Without Fault

**Article 1384 —** Liability is imposed without fault for:
- Damage caused by a thing in one\'s custody (responsabilité du fait des choses)
- Damage caused by animals (responsabilité du fait des animaux)
- Damage caused by children under authority (responsabilité du fait d\'autrui)
- Damage caused by employees in the course of their employment (responsabilité des commettants du fait des préposés)

The employer bears strict vicarious liability (responsabilité du commettant) for damage caused by an employee acting within the scope of his duties. This is a major basis of employer liability in Cameroonian civil litigation.

### Damages

Delictual damages are assessed at the time of judgment and must fully compensate the victim (principe de réparation intégrale). Categories of recoverable damage include: physical injury (dommage corporel); property damage (dommage matériel); economic loss (perte économique); and — in appropriate cases — moral harm (dommage moral) including grief, suffering, and loss of reputation.
''',
},

{
'title': 'Legal Ethics and Professional Conduct for Cameroonian Lawyers',
'subtitle': 'The Bar Rules, Deontology, and Disciplinary Practice',
'author': 'Me. Akéré Tity Muna',
'publisher': 'Barreau du Cameroun, Yaoundé',
'year': 2022, 'edition': 2, 'pages': 204,
'areas': ['Legal Practice & Ethics'],
'categories': ['Legal Practice & Ethics'],
'abstract': 'The practice of law in Cameroon is governed by Law No. 90/059 of 19 December 1990 on the organisation of the legal profession and the Internal Rules (Règlement Intérieur) of the Barreau du Cameroun. This work — authored by a former President of the Cameroon Bar and former UN Special Rapporteur on Human Rights Defenders — provides the authoritative treatment of lawyers\' professional duties, the conflicts of interest rules, client confidentiality, fees and billing, advertising restrictions, relations with the courts, and the Bar\'s disciplinary system. It is essential reading for every lawyer called to the Cameroon Bar and for law students preparing for their professional examinations.',
'content': '''# Legal Ethics and Professional Conduct for Cameroonian Lawyers
## Second Edition

---

## PART ONE: THE LEGAL PROFESSION IN CAMEROON

### Organisation of the Bar

The Barreau du Cameroun (Cameroon Bar Association) is the professional body for all lawyers practicing in Cameroon. It is governed by Law No. 90/059 of 19 December 1990 and is divided into two Bars: the Common Law Bar (Barreaux des régions anglophones) and the Civil Law Bar (Barreaux des régions francophones). Membership of the appropriate Bar is mandatory to practice law.

The Bar is headed by a Bâtonnier elected by Bar members for a two-year term. The Conseil de l\'Ordre oversees professional matters and exercises disciplinary jurisdiction over members.

### Admission to the Bar

To be called to the Cameroon Bar, a candidate must:
- Hold a Maîtrise en Droit (LLM) or equivalent from a recognised university
- Complete a two-year stage (pupillage) under a practising Avocat
- Pass the professional examination (CRFPA or equivalent)
- Be of good moral character (no criminal convictions for offences of dishonesty)
- Take the professional oath before the Court of Appeal

---

## PART TWO: CORE PROFESSIONAL DUTIES

### Confidentiality (Secret Professionnel)

The lawyer\'s duty of professional secrecy (secret professionnel) is absolute and perpetual. It covers all information received from the client in the course of the professional relationship, whether in the lawyer\'s capacity as adviser, negotiator, or litigator.

**Article 34 Bar Rules —** A lawyer may not disclose communications received from a client without the client\'s express authorisation, except where disclosure is required to prevent serious imminent harm to a third party or where the client explicitly waives confidentiality for a defined purpose.

Professional secrecy is not merely a professional duty — it is also a criminal offence to violate it. Article 310 of the Cameroon Penal Code criminalises the disclosure of professional secrets.

### Independence (Indépendance)

The lawyer must act with complete independence both from the client and from the courts. Independence from the client means the lawyer must advise honestly and not simply validate the client\'s wishes. Independence from the courts means the lawyer must represent the client\'s interests vigorously even when this is uncomfortable for the court.

**Instruction conflicts:** A lawyer must refuse or withdraw from instructions that would require acting contrary to the lawyer\'s professional obligations, involving the lawyer in dishonesty, or causing serious harm to a third party.

### Loyalty (Loyauté et Probité)

The lawyer owes a duty of loyalty to the client: to act in the client\'s best interests, to keep the client informed, to act promptly, and to observe confidentiality. The duty of loyalty is bounded by the lawyer\'s overriding obligations of honesty to the court.

**Duty of candour to the court:** A lawyer may not knowingly make false statements of fact or law to the court, submit false documents, or assist a client in committing fraud on the court.

---

## PART THREE: FEES AND BILLING

### Principles

Lawyers\' fees in Cameroon are governed by the principle of librement convenus (freely agreed) — there are no fixed scales, although the Bar may provide guidance scales. Fees must be fair and proportionate to:
- The importance and complexity of the case
- The financial situation of the client
- The time spent
- The results achieved
- The urgency of the matter

### Prohibited Arrangements

The following fee arrangements are prohibited:

- **Pactum de quota litis (pure contingency fees):** An agreement under which the lawyer is paid exclusively a percentage of the amount recovered, with no retainer or hourly component. This is prohibited as creating a conflict between the lawyer\'s financial interest and the client\'s best interests.
- **Fees for referrals:** A lawyer may not receive or pay remuneration for referring a client to another lawyer.
- **Improper advances:** Demanding grossly excessive advance payments.

### Honoured Commitments

The client must pay agreed fees. Unpaid fees may be recovered by action before the court, but the lawyer must first seek resolution through the Bar\'s Conseil de l\'Ordre.

---

## PART FOUR: CONFLICTS OF INTEREST

**Article 18 Bar Rules —** A lawyer must not act where there is a conflict of interest between the lawyer\'s own interests and those of the client, or between the interests of two clients whom the lawyer represents (or has represented) in related matters.

**Successive conflicts:** A lawyer who has previously represented Party A may not, in a substantially related matter, represent Party B against Party A without Party A\'s informed written consent.

**Confidential information:** Where a lawyer holds confidential information from a former client that would be relevant to a new matter against that client, the lawyer is disqualified from acting even if the former client consents to the new representation.

---

## PART FIVE: DISCIPLINARY PROCEEDINGS

The Conseil de l\'Ordre has exclusive jurisdiction to discipline members of the Bar. Disciplinary sanctions range from:

1. Avertissement (private warning)
2. Blâme (public reprimand)
3. Suspension from practice for up to 5 years
4. Radiation (permanent disbarment)

Proceedings begin with a complaint or the Bâtonnier\'s own initiative. The Conseil conducts an investigation and hearing. The lawyer has the right to be heard, to be represented by a colleague, and to appeal to the Court of Appeal.
''',
},

{
'title': 'Customary Law and the Modern Courts of Cameroon',
'subtitle': 'Traditions, Pluralism, and Judicial Reception',
'author': 'Dr. Simon Pierre Menyengue',
'publisher': 'Presses de l\'UCAC, Yaoundé',
'year': 2021, 'edition': 1, 'pages': 244,
'areas': ['Customary & Traditional Law'],
'categories': ['Customary & Traditional Law'],
'abstract': 'Cameroon\'s legal pluralism — the coexistence of a codified civil law system in the francophone regions, a common law system in the Anglophone regions, and over 250 customary legal systems reflecting the country\'s ethnic diversity — is one of the most complex in Africa. This work examines the nature of customary law in Cameroon, the mechanisms by which customary norms are recognised and applied by modern courts, the role of traditional rulers (chiefs, fons, lamidos) in dispute resolution, the interaction between customary law and national statutory law in the areas of land tenure, family law, and succession, and the reform proposals to systematise and modernise the application of customary law.',
'content': '''# Customary Law and the Modern Courts of Cameroon
## First Edition

---

## PART ONE: LEGAL PLURALISM IN CAMEROON

### Historical Foundations

Cameroon\'s legal system is the product of three distinct influences:

1. **Pre-colonial customary law:** Over 250 ethnic communities, each with distinct customary norms governing land, family, and dispute resolution. Major customary traditions include: the Bamileke (highly structured land and succession system); the Fulani/Hausa (influenced by Islamic law); the Bassa, Beti, Ewondo, and Fang communities (Central South); the Grassfields kingdoms (Fon systems); and the coastal Duala tradition.

2. **French civil law tradition (1916–present):** Applied in the eight francophone regions through the Civil Code, Criminal Code, and commercial codes.

3. **English common law tradition (1916–1961):** Applied in the Anglophone North West and South West Regions through the inherited common law system.

The interaction between these three traditions creates a uniquely complex legal environment.

### Constitutional Recognition

The 1996 Constitution, while not explicitly recognising customary law as a source of state law, acknowledges cultural diversity and the protection of minority rights. Traditional rulers are recognised as essential actors in local governance and conflict resolution under the laws governing local administration.

---

## PART TWO: APPLICATION OF CUSTOMARY LAW IN COURTS

### The Customary Courts

Cameroon formerly maintained a system of customary courts (tribunaux coutumiers) with jurisdiction over disputes between parties who both submitted to the jurisdiction. These were abolished in 1970 and replaced by the ordinary courts, which are tasked with applying relevant customary law.

### Standards for Recognition of Customary Norms

For a customary rule to be applied by a modern court, the rule must be:

1. **Established:** Proven by evidence — testimony of elders, community leaders, or expert anthropologists
2. **Certain:** Consistently applied in the community
3. **Reasonable:** Not contrary to natural justice
4. **Licit:** Not in conflict with national legislation or public policy (ordre public)

In family law and succession matters particularly, courts apply customary norms that meet these criteria even in the absence of codified statutory rules. The Supreme Court has consistently held that customary law is part of the law of Cameroon.

---

## PART THREE: CUSTOMARY LAW AND LAND

### The Challenge of Dual Systems

The tension between the national land tenure regime (Ordinance 74-1) and customary land rights is the most contested area of legal pluralism. The national system defines all unregistered land as "national domain" subject to State control. But most rural communities have centuries-old systems of customary allocation, use, and inheritance of land.

**Courts\' approach:** Where a party claims land under customary right, courts will recognise the right if the customary occupation can be proven and if no title has been issued over the same land. However, once a titre foncier is issued, it is indefeasible under statute — even if obtained fraudulently over customary land. Reform proposals would allow courts to void titles obtained through fraud on customary right holders.

---

## PART FOUR: THE ROLE OF TRADITIONAL RULERS

Traditional rulers in Cameroon — chiefs at village level (Chef de Deuxième ou Troisième Degré), chiefs at district level (Chef de Premier Degré), and paramount chiefs (Lamido, Fon) — play a formal role in local administration and dispute resolution under Decree No. 77/245 of 15 July 1977.

**Functions of traditional rulers:**
- Assisting the administrative authority in maintaining peace and order
- Collecting taxes and disseminating official information
- First-instance conciliation in minor disputes between community members
- Custodians of customary norms and traditions

Traditional rulers receive a monthly allowance from the State and are considered auxiliary officers of the civil administration. They may not serve as political party officials.

---

## PART FIVE: REFORM PROPOSALS

The debate on customary law reform in Cameroon has produced several proposals:

1. **Codification:** Systematic recording and codification of customary laws by region and ethnic group, as was done in some other African states post-independence. The challenge is diversity — no single code can capture 250+ customary systems.

2. **Harmonisation:** Developing model rules for key areas (marriage, succession, land) that draw from customary norms while ensuring compliance with international human rights standards, particularly gender equality.

3. **Alternative Dispute Resolution:** Strengthening the formal role of traditional authorities in ADR, with appropriate procedural safeguards and mechanisms to appeal to the ordinary courts.

4. **Land reform:** Amending Ordinance 74-1 to give stronger legal protection to customary land rights, particularly in peri-urban areas where community lands are under pressure from development.
''',
},

]

for b in BOOKS:
    seed(b)

total_pub = __import__('apps.books.models', fromlist=['Book']).Book.objects.filter(status='published').count()
print(f'\nDone. Published books in database: {total_pub}')
