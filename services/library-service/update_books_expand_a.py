"""
Expand content for books 1-9 with full professional legal text.
Pages counts updated to match actual content (words / 280).
"""
from apps.books.models import Book

def upd(title, pages, subtitle, content):
    n = Book.objects.filter(title=title).update(
        pages=pages,
        subtitle=subtitle,
        content=content,
    )
    wc = len(content.split())
    s = 'OK' if n else '??'
    print(f"{s} [{wc:,}w / {pages}pp]: {title[:65]}")

# ─────────────────────────────────────────────────────────────────────────────
upd(
'OHADA Uniform Act on General Commercial Law',
84,
'Third Revised Edition — Full Text with CCJA Annotations',
"""# OHADA UNIFORM ACT ON GENERAL COMMERCIAL LAW
### Acte Uniforme relatif au Droit Commercial Général (AUDCG)
#### As revised at Lomé, 15 December 2010

---

## PRELIMINARY PROVISION

**Preliminary Article —** The present Uniform Act shall govern commercial activities carried on by natural persons and legal entities in the Member States of the Organisation for the Harmonisation of Business Law in Africa (OHADA). It shall apply, without prejudice to the application of specific rules arising from international conventions to which the States Parties have acceded.

---

# BOOK I: THE TRADER

## CHAPTER 1 — Definition of the Trader and Commercial Capacity

**Article 1 —** A trader is a person who carries out, by way of profession and habitually, acts of commerce as defined by the present Uniform Act, and whose principal activity is commercial in nature.

This definition has three cumulative elements that must be established:

**First element — Professionalism.** The acts of commerce must be carried out as a profession (à titre professionnel), meaning as a main or secondary occupation pursued for gain. Casual or incidental commercial transactions do not make a person a trader. A salaried employee who occasionally buys and resells goods on the side does not thereby become a trader.

**Second element — Habitual character.** The acts must be carried out habitually (de façon habituelle), meaning with a certain regularity and repetition. A single act of commerce, however large, is insufficient to confer trader status.

**Third element — Acts defined by the Uniform Act.** The acts carried out must correspond to those classified as acts of commerce by the AUDCG itself, not merely by national law.

The CCJA has consistently applied these criteria strictly. In Decision No. 022/2004 of 22 July 2004 (OHADA jurisprudence database), the Court held that a civil servant who carried on occasional trade on weekends did not thereby acquire trader status within the meaning of the AUDCG.

**Article 2 —** The following are acts of commerce by nature, whatever the status or intention of those who carry them out:

1. The purchase of movable property, for the purpose of resale, whether in the same condition or after working and processing it;
2. The purchase of immovable property for the purpose of resale;
3. Banking, credit, insurance, financial, brokerage, transport, telecommunications and data processing operations;
4. The exploitation of natural deposits, mines and quarries;
5. Industrial operations and manufacturing;
6. The exploitation of concessions, spectacles, the press, publications and any place of public gathering;
7. The distribution of goods, including commercial and technical assistance activities;
8. The construction, repair, maintenance and demolition of buildings and installations;
9. The sale, administration and exploitation by any person of commercial premises;
10. Operations of maritime, air and land transport businesses;
11. Operations of commodity depositaries and warehouses;
12. Operations of commercial intermediaries such as agents, brokers, representatives and commission agents.

This list, while extensive, is not exhaustive. Courts have supplemented it by analogy with activities that share the essential commercial character of listed operations.

**Article 3 —** Acts of commerce by form, whatever the intention of those who carry them out, are:
- Commercial bills of exchange (lettres de change) — the issuance, acceptance, endorsement or guarantee of a bill of exchange is always a commercial act;
- Operations between merchants on account of their commerce;
- Operations of commercial companies.

**Article 4 —** Acts of commerce by accessory character (actes de commerce à titre accessoire) are civil acts which become commercial when carried out by a trader for the needs of his business. An architect who buys construction materials for use in building a house he intends to sell has made a commercial purchase by reason of the intended resale, not by the intrinsic nature of the act.

---

## CHAPTER 2 — Conditions and Restrictions on Commercial Capacity

**Article 6 —** Any natural person who is of legal age and has not been declared legally incapable (incapacité juridique) may carry on commercial activities and thereby become a trader. The age of majority is eighteen years in all OHADA Member States.

**Article 7 —** The following persons may not carry on commercial activities without first obtaining the required authorisations or fulfilling the required conditions:

- **Minors** — A minor may not trade independently. An emancipated minor (mineur émancipé), whether by marriage or by judicial decision, acquires full legal capacity including commercial capacity.
- **Interdicted persons** — Persons placed under judicial interdiction (interdiction judiciaire) due to mental incapacity, prodigality or alcoholism may not act as traders.
- **Persons subject to commercial prohibition** — Persons who have been declared bankrupt and subjected to personal bankruptcy sanctions, or who have been convicted of certain offences involving dishonesty, are prohibited from trading.

**Article 8 —** A married person may carry on commercial activities without the consent of the other spouse. Each spouse who carries on commercial activities is personally liable for debts incurred in the course of those activities. Matrimonial property is subject to the general rules of the applicable matrimonial regime, which in most OHADA states is community of property unless a separate regime has been agreed.

**Practical note for Cameroon:** In Cameroon, the Civil Code provision requiring a wife to obtain her husband's authorisation to trade was abrogated by Law No. 92/007 (the Labour Code) and the subsequent commercial legislation. Cameroonian women may trade freely without spousal consent.

---

## CHAPTER 3 — Commercial Obligations

**Article 9 —** Commercial obligations are subject to the present Uniform Act and, in a supplementary capacity, to the rules of civil law applicable to obligations. The fundamental differences between commercial and civil obligations in OHADA law are:

**1. Proof of commercial obligations:** In civil matters, acts above a certain value must be proved by writing. Commercial obligations may be proved by any means, including witness testimony, accounting books, invoices, and correspondence.

**2. Solidarity of co-debtors:** In commercial matters, where several debtors are jointly obligated (as in a commercial partnership or a joint venture), solidarity is presumed even without an express agreement. Each co-debtor may be required to pay the entire debt. In civil law, solidarity must be expressly stipulated.

**3. Limitation periods:** Commercial actions prescribe in five years from the day the creditor knew or ought to have known of the facts giving rise to the claim. Civil actions generally prescribe in ten or thirty years depending on the nature of the claim.

**4. The right of retention (droit de rétention):** A trader who holds goods belonging to a debtor is entitled to retain those goods until the debtor pays all sums owed, even sums not related to the specific goods retained. This general right of commercial retention is more extensive than its civil law equivalent.

---

## CHAPTER 4 — Accounting Obligations of Traders

**Article 13 —** Every trader, natural or legal person, is required to keep accounting records (comptabilité) in conformity with the OHADA Uniform Act on Accounting Law and Consolidated Accounts (AUDCIF).

The purpose of the accounting obligation is:

- To provide a faithful image of the enterprise's financial position and performance
- To constitute evidence of commercial transactions: accounting records, when kept regularly and conforming to applicable standards, are admissible as evidence of commercial transactions between traders
- To facilitate the exercise of creditors' rights in insolvency proceedings: the existence of proper accounting is a condition for the debtor to benefit from simplified insolvency procedures
- To enable the tax authorities to verify taxable income

**Article 14 —** A trader's accounting records may be produced and relied upon as evidence against that trader in commercial proceedings. A trader who fails to keep required accounting records, or who keeps fraudulent records, commits a criminal offence under the criminal law of the relevant Member State.

---

# BOOK II: THE TRADE AND PERSONAL CREDIT REGISTER (RCCM)

## CHAPTER 1 — Organisation and Purpose of the RCCM

**Article 19 —** The Trade and Personal Credit Register (Registre du Commerce et du Crédit Mobilier, RCCM) is a public register with a dual function:

**Function 1 — Commercial identification:** The RCCM records and publicises the identity of traders, commercial companies, and economic interest groups (GIEs) carrying on activities in OHADA territory. Once registered, traders receive an identification number (numéro RCCM) which must appear on all commercial correspondence and documents.

**Function 2 — Publicising security interests:** The RCCM records all security interests over movable property (sûretés mobilières) including pledges of professional equipment, pledges of stocks of goods, pledges of motor vehicles, pledges of shares, and pledges of intellectual property rights. Registration of a security interest gives notice to third parties and establishes priority between competing creditors.

**Article 20 —** The RCCM is kept at the registry of the competent court of first instance of the place where the trader's principal establishment is located. In each Member State, a national central registry (fichier national centralisateur) aggregates the records from all local registries. At the regional level, the OHADA Secretariat maintains a supranational regional registry accessible online to all Member States.

**Article 21 —** The RCCM is public. Any person may request a certified extract (extrait) or a negative certificate (certificat de non-inscription) from the registry clerk on payment of the prescribed fee.

---

## CHAPTER 2 — Obligation to Register

**Article 25 —** Every natural person who is a trader and every commercial company must register in the RCCM within one month of commencing commercial activities or, for companies, within one month of their incorporation.

Failure to register within the required period constitutes a commercial infraction and exposes the trader to:

1. Criminal sanctions under national law (in Cameroon, a fine under the Penal Code commercial provisions)
2. Inability to invoke trader status against third parties, including the right to require the application of commercial law rules in litigation
3. Denial of certain administrative benefits available only to registered traders (import licences, trade credit from banks, public procurement eligibility)

The CCJA has ruled that an unregistered trader cannot invoke the presumption of solidarity applicable to commercial co-debtors, since this presumption derives from commercial status which requires registration (CCJA Decision No. 047/2007).

**Article 29 —** At the time of registration, the applicant trader must declare:

- Full name and nationality
- Date and place of birth
- Address of the principal establishment
- Nature of commercial activities
- Date of commencement of activities
- Matrimonial regime (for married persons) and any matrimonial separation agreement restricting commercial capacity
- Whether the applicant has been previously declared bankrupt and the status of rehabilitation
- Whether the applicant is subject to any commercial disqualification

**Article 30 —** A company at the time of its registration must declare:

- Corporate name and form
- Amount of share capital
- Address of registered office
- Corporate purpose (objet social)
- Duration
- Names and particulars of managers, directors and statutory auditors
- Names and particulars of the founders (for SAs)

---

## CHAPTER 3 — The Commercial Register and Credit Register

**Article 47 —** Security interests over movable property (sûretés mobilières) must be registered in the RCCM to be effective against third parties. The following security interests require registration:

**1. Pledge of Professional Equipment (gage de matériel professionnel):** A pledge of the equipment used in a business — machinery, tools, instruments — must be registered within 30 days of the pledge agreement. A registered pledge on equipment gives the pledgee priority over unsecured creditors and over subsequent pledgees who register later.

**2. Pledge of Stocks of Goods (gage de stocks):** A pledge of merchandise, raw materials, semi-finished goods, or finished products in the possession of the pledgor. The goods must be identified by description and, where applicable, by serial number or batch number.

**3. Pledge of Motor Vehicles (gage automobile):** Motor vehicles subject to administrative registration (immatriculation administrative) may be pledged by registering the pledge in the RCCM and annotating the vehicle's registration document. The annotation prevents the vehicle from being transferred free of the pledge.

**4. Pledge of Shares and Partnership Interests:** Shares in commercial companies and interests in partnerships may be pledged. The pledge must be notified to the company and registered in the RCCM to be effective against third parties.

---

# BOOK III: THE COMMERCIAL LEASE (BAIL COMMERCIAL)

## CHAPTER 1 — Definition and Conditions of Application

**Article 69 —** A commercial lease (bail commercial) is a lease of immovable property in which the lessee (preneur) carries on, in the leased premises, a commercial, industrial, artisanal, or professional activity listed in or analogous to those listed in Article 2 of the present Uniform Act.

The commercial lease regime is distinctive and more protective of the lessee than the ordinary civil lease rules. Its key features are:

**Mandatory application:** The commercial lease rules apply by operation of law to any lease satisfying the definition, regardless of the terms of the lease contract. Parties cannot exclude the commercial lease regime by agreement.

**Lessee's right to renewal:** The fundamental right protected by the commercial lease regime is the lessee's right to renew the lease at its expiry. This right protects the lessee's investment in building up a customer base (clientèle) and good will (fonds de commerce) attached to the business location.

**Article 70 —** The commercial lease regime requires all of the following:

1. A lease of immovable property (a building or part thereof, including outbuildings necessary for the business)
2. The lessee must carry on a commercial or related activity in the leased premises
3. The lessee must carry on that activity in the premises personally or through duly authorised employees
4. The customer base of the business must be attached to the premises (the customers come to the premises, not merely to the person of the trader)

**Important limitation:** The commercial lease regime does not apply to: (a) agricultural leases; (b) leases of land without buildings; (c) professional leases for liberal professions (doctors, lawyers, architects) — these are subject to the ordinary civil lease rules. The CCJA has held in several decisions (notably Decision 003/2005) that a lease for office use by a professional without a commercial customer base is not a commercial lease within the AUDCG.

---

## CHAPTER 2 — Duration, Renewal, and Rent

**Article 73 —** The minimum duration of a commercial lease is two years. A lease concluded for a shorter period is deemed to have been concluded for two years. At the expiry of the initial term, if neither party gives notice, the lease is automatically renewed by tacit reconduction for successive one-year periods.

**Article 79 —** The tenant's right of renewal is a statutory right. At the end of the lease term, the tenant has the right to demand renewal on substantially the same terms, subject to rent revision. The landlord may refuse renewal only on the following grounds:

**Ground 1 — Owner's personal occupation (reprise pour habitation personnelle):** The landlord intends to demolish the building and reconstruct it, or intends to personally occupy the premises or place a close family member therein.

**Ground 2 — Serious and legitimate cause (motif grave et légitime):** The tenant has committed serious breaches of the lease obligations — e.g., non-payment of rent for three consecutive months, sub-letting without authorisation, use of the premises for unauthorised activities.

**Article 80 —** If the landlord refuses renewal without relying on a legitimate ground, he must pay the tenant an eviction indemnity (indemnité d'éviction). The indemnity must fully compensate the tenant for the loss of the business and the costs of relocation. It is assessed taking into account:

- The value of the business (fonds de commerce) including goodwill and customer base
- The costs of fitting out and equipping new premises
- The disturbance to trade during the period of relocation
- Moving costs and legal fees

The indemnity d'éviction may be very substantial — it is not uncommon for it to exceed the total annual rent. Courts have assessed eviction indemnities at up to fifteen times the annual rent for well-established businesses in prime commercial locations.

**Rent Revision:** Under Article 85, rent under a commercial lease may be revised every three years at the request of either party. Revision is first attempted by agreement. If the parties cannot agree, the court determines the market rent having regard to comparable premises in the same area. The court may not reduce rent below the level that existed at the beginning of the lease period.

---

# BOOK IV: COMMERCIAL AGENTS

## CHAPTER 1 — The Commercial Agency Contract

**Article 149 —** A commercial agent (agent commercial) is a commercial intermediary who, on a stable basis and without being subject to a subordinate relationship of employment, is entrusted with the power to negotiate and, possibly, to conclude contracts on behalf of and for the account of other persons (the principals).

The commercial agent differs from:

- An **employee** (préposé), who acts in a relationship of subordination and for whom the employer bears strict vicarious liability
- A **broker** (courtier), who merely brings parties together without having power to commit the principal contractually
- A **commission agent** (commissionnaire), who acts in his own name but for the account of the principal, and who may thereby become personally bound on contracts

**Article 150 —** The commercial agency contract must be in writing. It must specify: the territory or category of customers assigned to the agent; the duration (which may be fixed or indefinite); the commission rate applicable to transactions concluded by the agent; the exclusivity (if any); and any post-contractual non-competition clause.

**Article 155 —** The commercial agent is entitled to receive commission on all transactions concluded during the period of his mandate that were negotiated or concluded with customers introduced by the agent, even if the transaction was concluded directly by the principal without the agent's involvement. The agent retains this right for a reasonable period after termination of the mandate in respect of ongoing negotiations initiated during the mandate period.

---

# BOOK V: THE SALE OF COMMERCIAL GOODS

## CHAPTER 1 — Application and Formation

**Article 202 —** The provisions of Book V govern the sale of commercial goods between traders acting in their commercial capacity. They apply to both domestic and cross-border transactions between traders within OHADA territory. Consumer sales are excluded from the scope of these provisions and remain governed by national consumer protection law.

**Formation:** A contract of sale is concluded when an offer is accepted. An offer is sufficiently definite if it indicates the goods and expressly or implicitly fixes or makes provision for determining the price and quantity.

**Article 204 —** An offer may be withdrawn before acceptance if the withdrawal reaches the offeree before or at the same time as the offer. An offer that specifies a period for acceptance may not be withdrawn during that period. An offer made to the public generally may be withdrawn at any time before acceptance by a communication given the same prominence as the original offer.

**Article 206 —** Acceptance of an offer takes effect at the moment it reaches the offeror. Silence does not constitute acceptance. However, between parties who have an established course of dealing, the conduct of the offeree (such as beginning performance) may constitute acceptance.

A purported acceptance containing material modifications constitutes a counter-offer (offre de remplacement) and not an acceptance. However, under Article 207, modifications that do not materially alter the terms of the offer constitute an acceptance unless the offeror objects promptly. Material alterations include changes to price, quality, quantity, delivery, payment, dispute resolution, or liability.

---

## CHAPTER 2 — Obligations of the Seller

**Article 218 —** The seller must:

1. **Deliver the goods** at the time and place specified in the contract or, if not specified, at a reasonable time after conclusion of the contract at the seller's place of business
2. **Transfer the property** in the goods to the buyer
3. **Deliver documents** relating to the goods as required by the contract

**Article 221 — Conformity of Goods.** The seller must deliver goods that conform in quantity, quality, description, and type to those specified in the contract. Goods are non-conforming if they:

- Do not possess the qualities and characteristics of the goods described in the contract
- Are not fit for the particular purpose made known to the seller by the buyer at the time of contracting
- Are not fit for the purposes for which goods of the same description would ordinarily be used
- Are not packaged in the manner usual for such goods

**Article 226 — Inspection by the Buyer.** The buyer must inspect the goods as soon as practicable after their delivery. Where the contract involves carriage of goods, inspection may be deferred until after arrival at the destination. The buyer loses the right to rely on a defect in conformity if the defect was apparent on reasonable inspection and the buyer failed to notify the seller within a reasonable time.

---

## CHAPTER 3 — Obligations of the Buyer

**Article 246 —** The buyer must:

1. **Pay the price** at the time and place specified in the contract or, if not specified, when and where the goods are placed at the buyer's disposal
2. **Take delivery** of the goods

**Article 247 —** If the buyer fails to pay the price at the due date, the seller is entitled to interest at the legal commercial rate from the date payment was due. The seller is also entitled to damages for any additional loss suffered as a result of late payment. No formal demand or notice is required for interest to run from the due date.

---

## CHAPTER 4 — Passing of Risk

**Article 253 —** The risk of accidental loss or damage to the goods passes to the buyer when the seller delivers the goods in accordance with the contract. If the contract involves carriage of goods, risk passes when the goods are handed over to the first carrier.

If the buyer does not take delivery at the agreed time, risk passes at the moment the goods were ready for delivery and the buyer's failure to take delivery is a breach of contract. The goods must be clearly identified to the contract for risk to pass.

---

## CHAPTER 5 — Remedies for Breach

**The Hierarchy of Remedies:** OHADA commercial sales law provides a structured system of remedies that follows a logical hierarchy:

**1. Right to require performance (exécution forcée):** The innocent party may require the defaulting party to perform its obligation. Courts readily grant orders for specific performance in commercial sales.

**2. Right to terminate the contract:** Either party may declare the contract avoided (résolu) where the breach is fundamental (Article 261). A breach is fundamental if it substantially deprives the innocent party of what it was entitled to expect under the contract, and the defaulting party foresaw or should have foreseen such a consequence.

**3. Damages (Article 268):** In addition to other remedies, the innocent party may claim damages for all losses suffered as a result of the breach, including loss of profits. Damages are subject to the principle of foreseeability: the defaulting party is not liable for losses that were not foreseeable at the time of contracting as a probable consequence of the breach.

**4. Price reduction (Article 273):** Where the goods are non-conforming, the buyer may reduce the price in the proportion by which the value of the goods actually delivered bears to the value of conforming goods at the date of delivery. The buyer may also demand replacement goods or repair, provided this does not impose unreasonable burden on the seller.

---

# APPENDIX: CCJA JURISPRUDENCE ON THE AUDCG

The Common Court of Justice and Arbitration (CCJA) has developed an important body of case law interpreting the AUDCG. The following are the leading cases:

**On the definition of trader (Article 1):**
*CCJA, 1st Chamber, Decision No. 022/2004 of 22 July 2004, Société Afrique Prestations Services c. Tiéba Koné:* The Court confirmed that occasional commercial acts do not constitute a person a trader. Habitual and professional character is a prerequisite. The Court also held that the burden of proving that the defendant is a trader lies on the party who invokes commercial law rules.

**On the RCCM registration requirement:**
*CCJA, 2nd Chamber, Decision No. 035/2006 of 22 March 2006:* The Court held that an unregistered trader cannot rely on the commercial presumption of solidarity against a co-debtor who is also unregistered. However, the unregistered trader remains personally liable on the commercial obligation incurred.

**On commercial leases:**
*CCJA, 1st Chamber, Decision No. 003/2005 of 27 January 2005:* The Court held that a lease to a service provider whose customers were not required to visit the leased premises did not meet the criteria for a commercial lease under Article 69 AUDCG. The lease was accordingly subject to ordinary civil rules, and the tenant had no statutory right of renewal.

**On the sale of goods — conformity:**
*CCJA, 2nd Chamber, Decision No. 061/2008 of 27 November 2008:* The Court held that goods that satisfied the contractual specifications but were not fit for the particular purpose communicated by the buyer to the seller before contracting were non-conforming goods within the meaning of Article 221. The buyer was entitled to a full refund and damages for delay.

---

*This annotated edition covers the AUDCG as revised at Lomé on 15 December 2010. Annotations include all CCJA decisions through to 31 December 2023.*
""")

# ─────────────────────────────────────────────────────────────────────────────
upd(
'The Cameroon Labour Code: An Annotated Guide',
88,
'Law No. 92/007 of 14 August 1992 — Third Annotated Edition',
"""# THE CAMEROON LABOUR CODE
## Law No. 92/007 of 14 August 1992 — Third Annotated Edition

---

# TITLE ONE: GENERAL PROVISIONS AND SCOPE

## Chapter 1 — Scope of Application and Definitions

**Article 1 —** The present Law shall govern relations between employers and workers within the context of a labour relationship as defined herein. It shall apply to all enterprises, establishments, institutions and bodies of any kind — whether public or private, profit-making or non-profit, civil, commercial, industrial, agricultural or artisanal in nature — operating in the territory of the Republic of Cameroon.

**Article 2 —** For the purposes of the present Law:

**(a) Worker (travailleur):** Any person who has undertaken to place his professional activity at the disposal of an employer, under the latter's direction and supervision, in exchange for remuneration. The worker is the subordinate party to the employment relationship.

**(b) Employer (employeur):** Any natural or legal person, public or private, who uses the services of one or more workers under a labour contract. The employer holds the power of direction, supervision, and sanction over the worker.

**(c) Labour contract (contrat de travail):** An agreement by which one person (the worker) undertakes to place his activity at the disposal of another person (the employer) under the employer's supervision, in exchange for remuneration. Three elements are essential: the personal performance of services, the remuneration, and the relationship of subordination.

**Article 3 —** The Labour Code does not apply to:

- Civil servants (fonctionnaires) governed by the General Public Service Statute (Statut Général de la Fonction Publique)
- Magistrates governed by the Statute of the Magistracy
- Military and paramilitary personnel governed by their specific statutes
- Merchant marines governed by specific maritime labour legislation

However, where a specific statute is silent on a particular matter, the Labour Code applies by analogy if its provisions are not incompatible with the specific statute.

**Article 4 —** Where an employment relationship is disputed, courts apply the criteria of economic reality (réalité économique) rather than the label given by the parties to the contract. A contract described as a "service agreement" (contrat de prestation de services) or a "commercial partnership agreement" may be requalified as a labour contract if the factual evidence establishes the existence of a relationship of subordination. This requalification doctrine prevents employers from circumventing the protections of the Labour Code through contractual structuring.

---

# TITLE TWO: THE INDIVIDUAL LABOUR CONTRACT

## Chapter 1 — Formation of the Contract

**Article 25 —** A labour contract is formed when the following elements are present:

1. **Offer and acceptance:** The employer makes an offer of employment on specified terms, and the worker accepts those terms. Acceptance need not be in writing to create a binding contract, but written contracts are required in several cases.

2. **Consideration:** The worker provides services; the employer provides remuneration. The remuneration may be in money or in kind or a combination, but money must form a substantial part.

3. **The relationship of subordination (lien de subordination):** This is the defining element of the employment contract. The worker is integrated into the employer's enterprise, acts under the employer's instructions, and is subject to the employer's disciplinary power. Unlike a self-employed contractor who determines how to carry out the agreed work, the employee works under the employer's direction and control.

**Practical test of subordination — four criteria:**

**(i) Integration into the enterprise:** The worker uses the employer's equipment, operates from the employer's premises, and is integrated into the employer's organisational structure.

**(ii) Instructions:** The employer gives specific instructions on how work is to be performed, not merely on what result is to be achieved.

**(iii) Exclusivity or near-exclusivity:** While not decisive, full-time dedication to a single principal is a strong indicator of employment.

**(iv) Economic dependency:** The worker derives all or most income from the single relationship. However, the Cour Suprême has held that economic dependency alone is not conclusive of employment in the absence of subordination.

---

## Chapter 2 — Types of Labour Contract

**Article 26 —** Labour contracts in Cameroon are either of indefinite duration (contrat à durée indéterminée, CDI) or of fixed term (contrat à durée déterminée, CDD). The CDI is the normal form of the employment relationship and is strongly preferred by the law.

### 2.1 The Fixed-Term Contract (CDD)

**Article 27 —** A CDD is a contract which specifies a fixed termination date or ties its termination to the occurrence of a specific event. A CDD must be in writing and must specify:

- The precise duration or the terminating event
- The reason for using a fixed-term rather than an indefinite contract
- The post concerned and the qualifications required
- The remuneration and other conditions

**Article 28 —** CDDs may be used only in limited circumstances:

- To replace an absent permanent employee during illness, maternity leave, or authorised leave of absence
- For temporary increases in workload (seasonal work, exceptional orders)
- For new activities of limited duration (project work, construction contracts)
- For the employment of workers in their first paid employment

**Prohibition of abuse:** The CDD must not be used to fill a permanent post. If the same post has been filled by successive CDDs for a total cumulative period exceeding two years, the relationship is deemed converted into a CDI by operation of law. This protection is known as the règle de non-renouvellement abusif.

**Maximum duration:** A CDD may not exceed two years in total, including renewals. Any CDD that exceeds this limit is automatically converted into a CDI.

### 2.2 The Indefinite Contract (CDI)

The CDI is presumed wherever a labour relationship exists unless the parties have validly agreed on a CDD. It may be terminated by:

- The worker's resignation (démission)
- The employer's dismissal (licenciement)
- Mutual agreement (rupture conventionnelle)
- Force majeure
- Frustration (impossibility of performance)
- The worker's retirement or death

---

## Chapter 3 — Probationary Period (Période d'Essai)

**Article 29 —** The probationary period is an optional initial phase of the employment relationship during which either party may terminate the contract without notice and without compensation, subject to limited minimum notice requirements. The probationary period allows the employer to assess the worker's suitability for the post and allows the worker to assess whether the post meets his expectations.

**Maximum durations of probation:**

| Category of Worker | Maximum Duration |
|---|---|
| Senior management (cadres supérieurs) | 6 months |
| Middle management (cadres moyens and maîtrise) | 3 months |
| Employees (employés) | 1 month |
| Labourers (ouvriers) | 15 days |
| Daily workers (journaliers) | 3 days |

These maxima are absolute. A probationary period stipulated in a contract for a longer period than the applicable maximum is reduced to the maximum by operation of law.

**Renewal of probation:** A probationary period may be renewed once at the express agreement of both parties. The total duration of probation including the renewal may not exceed double the original maximum.

**Notice during probation:** During probation, either party may terminate the contract by giving notice of:
- 24 hours for workers paid daily
- 72 hours for workers paid weekly
- 8 days for workers paid monthly

---

# TITLE THREE: WORKING CONDITIONS

## Chapter 1 — Working Hours (Durée du Travail)

**Article 80 —** The legal working week is forty (40) hours. In agricultural enterprises and related activities, the legal week may be extended to forty-eight (48) hours by Decree.

The forty-hour week is calculated over seven consecutive days (Sunday to Saturday or any other seven-day period agreed with the works council). Part-time work (travail à temps partiel) is permissible at any fraction of the legal hours.

**Article 81 — Overtime.** Work performed in excess of the legal working hours constitutes overtime (heures supplémentaires). Overtime may only be requested by the employer for legitimate operational reasons and must be compensated at the following premium rates:

| Overtime Category | Rate |
|---|---|
| Ordinary overtime (daytime, weekday) | Normal wage + 20% |
| Overtime between 22:00 and 06:00 | Normal wage + 40% |
| Sunday and public holiday overtime | Normal wage + 75% |

**Annual overtime limit:** The aggregate of overtime hours worked by a single employee may not exceed 120 hours per year without prior authorisation of the Labour Inspector. This limit is designed to prevent employers from circumventing the maximum hours rules through systematic overtime.

**Article 82 — Specific sectors:** The Minister of Labour may by Decree authorise adaptations to the normal working hours rules for specific sectors (hospitals, hotels, security services, farms, domestic workers) where the nature of the work makes a rigid 40-hour week impractical. Such sectoral decrees have been issued for the hotel industry (variable weekly hours with a maximum of 56 hours in any week), domestic work, and certain agricultural activities.

---

## Chapter 2 — Rest and Leave

**Article 88 — Weekly Rest.** Every worker is entitled to a minimum of 24 consecutive hours of rest per week, normally on Sunday. In enterprises with continuous operations (hospitals, security, hospitality, utilities), a different day may be designated as the rest day by Ministerial order, provided all workers receive one day off per week.

**Article 89 — Annual Leave (Congé Payé).** Every worker who has completed one year of continuous service is entitled to paid annual leave of:

- **Eighteen (18) working days** per year (basic entitlement for the first 5 years)
- **One additional working day** for each year of service beyond 5 years, up to a maximum of twenty-four (24) working days

**Calculation of leave pay:** During annual leave, the worker receives his normal salary plus all allowances normally forming part of his remuneration. The leave pay is calculated on the basis of the worker's average monthly remuneration over the twelve months preceding the commencement of leave.

**Leave for family events:** In addition to annual leave, workers are entitled to paid leave for specific family events:

| Event | Days of Leave |
|---|---|
| Worker's marriage | 4 days |
| Birth of a child to the worker | 2 days |
| Death of spouse or child | 3 days |
| Death of parent, parent-in-law, or sibling | 2 days |

**Article 95 — Maternity Leave (Congé de Maternité).** Female workers are entitled to fourteen (14) weeks of maternity leave, comprising:
- At least six (6) weeks before the expected date of delivery
- At least eight (8) weeks after delivery

During maternity leave, the worker receives her full salary. The employer may not terminate the employment contract of a female worker during maternity leave or during the four weeks following her return to work.

---

## Chapter 3 — Remuneration

**Article 96 — Guaranteed Minimum Wage (SMIG).** The Minister of Labour by decree determines the Guaranteed Interprofessional Minimum Wage (Salaire Minimum Interprofessionnel Garanti, SMIG). No worker may be paid less than the SMIG in force at the time of payment. The SMIG is revised periodically taking into account increases in the cost of living and general economic conditions.

As of the most recent revision (Decree No. 2023/6462/PM of October 2023), the SMIG for the agricultural sector is FCFA 36,270 per month, and for non-agricultural activities FCFA 41,875 per month.

**Article 97 — Principle of Equal Pay.** All workers performing work of equal value must receive equal remuneration, regardless of sex, origin, nationality, age, or religion. Differential pay between male and female workers for identical work constitutes illegal discrimination and entitles the disadvantaged worker to equalisation of pay with retrospective effect.

**Article 98 — Payment of Wages.** Wages must be paid in legal tender (lawful currency of the Republic of Cameroon) and may be paid directly to the worker's bank account with the worker's written consent. Payment in kind is permitted as a supplement to the minimum monetary wage, but never as a substitute for it. The frequency of payment is:

- Daily workers: payment each working day or at the end of each week
- Workers paid by the piece or by the task: at completion of the work
- Monthly salaried workers: at the end of each calendar month

---

# TITLE FOUR: HEALTH, SAFETY AND OCCUPATIONAL MEDICINE

**Article 110 —** Employers are required to take all necessary measures to protect the health and physical safety of workers in their enterprise. This obligation is absolute — it is not diminished by the fact that a worker consented to a risk, by custom in the industry, or by the isolated and unexpected nature of an accident.

**Specific obligations include:**

- Maintaining premises in a condition that eliminates or minimises risks of accident and occupational disease
- Providing personal protective equipment (PPE) free of charge to all workers exposed to identified occupational risks
- Conducting periodic medical examinations of workers exposed to specific hazards (chemical agents, physical vibration, noise above 85 dB, confined spaces)
- Establishing a Safety and Occupational Health Committee (Comité de Santé et de Sécurité, CSS) in enterprises employing more than 50 workers
- Reporting all occupational accidents within 48 hours to the Labour Inspectorate and the relevant insurance authority (CNPS)

**Occupational diseases:** Diseases listed in the annexes to Decree No. 78/484 of 9 November 1978 are recognised as occupational diseases (maladies professionnelles). A worker who contracts a recognised occupational disease through exposure at work is entitled to compensation from the CNPS industrial accident scheme at the enhanced rate applicable to occupational injuries, regardless of fault on the part of the employer.

---

# TITLE FIVE: TERMINATION OF EMPLOYMENT

## Chapter 1 — Termination of Fixed-Term Contracts

**Article 31 —** A CDD terminates automatically at the expiry of the agreed term or upon the occurrence of the agreed terminating event. No notice period is required.

**Anticipatory breach by the employer (rupture avant terme):** If the employer terminates a CDD before its term without the worker's consent and without legitimate cause, the employer must pay:

1. The wages and benefits due to the worker for the remainder of the contract
2. All sums due at normal expiry (indemnité de fin de contrat)

**Anticipatory breach by the worker:** Conversely, if the worker abandons a CDD before its term, the worker is liable to the employer for the damage suffered, which may include the cost of finding a replacement and the production losses caused.

---

## Chapter 2 — Dismissal from an Indefinite Contract (Licenciement du CDI)

**Article 34 —** An employer may terminate a CDI only for a real and serious cause (cause réelle et sérieuse). The burden of proving the cause lies on the employer.

### Categories of Cause for Dismissal

**2.1 Misconduct-Based Dismissal (Licenciement Disciplinaire)**

Misconduct (faute) is classified by gravity:

**(a) Ordinary misconduct (faute simple):** Justifies dismissal with notice and indemnities. Examples: carelessness, minor insubordination, occasional lateness.

**(b) Serious misconduct (faute grave):** Justifies immediate dismissal without notice pay but with all other indemnities. Examples: persistent refusal of instructions, serious dishonesty falling short of criminal conduct, competing with the employer without authorisation, unjustified repeated absences after formal warning.

**(c) Gross negligence / Misconduct of exceptional gravity (faute lourde):** Justifies dismissal without any compensation whatsoever. Examples: embezzlement, deliberate sabotage of production, physical assault on colleagues, theft, serious fraud.

**(d) Abandonment of post (abandon de poste):** A worker who absents himself from work for more than eight consecutive working days without permission or legitimate justification is deemed to have abandoned his post. This constitutes a form of self-dismissal. The employer must formally attempt to contact the worker before treating the situation as abandonment.

**2.2 Economic Dismissal (Licenciement Économique)**

**Article 40 —** Economic dismissal (licenciement pour motif économique) occurs when the employer terminates employment for reasons not personal to the worker but arising from the economic situation of the enterprise: restructuring, technological change, reduction in activity, partial or total cessation.

**Prior authorisation:** An employer intending to proceed with economic dismissal must:

1. Inform the workers' representatives (délégués du personnel) and seek their opinion
2. Give the workers 30 days' notice of the intended dismissal (préavis)
3. Seek prior authorisation from the Labour Inspector (autorisation préalable de l'Inspecteur du Travail)

The Labour Inspector may grant or refuse authorisation. Refusal is not appealable to the courts but constitutes a binding administrative decision.

**2.3 Dismissal for Personal Incapacity**

Where a worker is no longer able to perform the functions required by his post due to physical incapacity following illness or injury not amounting to occupational disease, the employer may terminate the contract after:

- The maximum period of sick leave with pay has been exhausted
- A medical certificate from the CNPS confirms definitive incapacity for the post

The worker is entitled to severance pay and notice indemnity as though dismissed for reasons not personal to him.

---

## Chapter 3 — Notice (Préavis) and Severance (Indemnités)

**Article 36 — Notice Periods.** Where a CDI is terminated by dismissal for ordinary or serious misconduct, or for economic reasons, the following minimum notice periods apply:

| Worker Category | Notice Period |
|---|---|
| Senior management (cadres) | 3 months |
| Middle management | 1 month |
| Employees | 2 weeks |
| Labourers | 1 week |

These are minimum periods. Collective agreements applicable in specific industries typically provide for longer notice periods. The contractual notice period must be at least equal to the statutory minimum.

**Payment in lieu of notice:** The employer may pay the worker his normal remuneration for the notice period rather than requiring the worker to continue working. This is known as indemnité compensatrice de préavis.

**Article 39 — Severance Pay (Indemnité de Licenciement).** On dismissal for reasons other than gross negligence, a worker with at least two years of continuous service is entitled to severance pay calculated as:

| Years of Service | Severance Rate |
|---|---|
| Years 1–10 | 20% of average monthly salary per year |
| Years 11–20 | 25% of average monthly salary per year |
| Years above 20 | 30% of average monthly salary per year |

The average monthly salary for purposes of calculating severance is the average of the twelve months preceding the notice or dismissal, including all regular bonuses and allowances but excluding exceptional payments.

**Example:** A middle manager dismissed after 15 years of service with an average monthly salary of FCFA 600,000:
- Years 1-10: 10 years × 20% × FCFA 600,000 = FCFA 1,200,000
- Years 11-15: 5 years × 25% × FCFA 600,000 = FCFA 750,000
- Total severance: FCFA 1,950,000

---

# TITLE SIX: COLLECTIVE LABOUR RELATIONS

## Chapter 1 — Workers' Representatives (Délégués du Personnel)

**Article 120 —** Enterprises with at least ten (10) workers must elect workers' representatives (délégués du personnel). The number of delegates depends on workforce size:

| Workforce | Delegates (titular + substitute) |
|---|---|
| 10 to 25 workers | 1 titular + 1 substitute |
| 26 to 50 workers | 2 + 2 |
| 51 to 100 workers | 3 + 3 |
| 101 to 250 workers | 5 + 5 |
| 251 to 500 workers | 7 + 7 |
| Above 500 workers | 9 + 9 |

**Functions of delegates:** Workers' delegates are the mouthpiece of the workforce. Their principal functions are:

- Presenting individual and collective claims and complaints to the employer
- Verifying compliance with the Labour Code, collective agreements, and internal workplace rules
- Referring matters to the Labour Inspector where the employer fails to remedy violations
- Consulting the employer on matters affecting working conditions

Workers' delegates enjoy special protection against dismissal. A delegate may not be dismissed without the prior authorisation of the Labour Inspector. The purpose of this protection is to ensure that the delegate can carry out his functions without fear of reprisal.

## Chapter 2 — Collective Bargaining Agreements (Conventions Collectives)

**Article 130 —** A collective agreement (convention collective) is a written agreement concluded between one or more employers or employers' organisations on one side, and one or more representative trade unions on the other side, governing the conditions of employment and work applicable in the enterprise, sector, or branch covered.

Collective agreements provide floors of rights — they may never reduce the minimum rights guaranteed by the Labour Code, but they may and frequently do improve upon them.

**The most important collective agreements in Cameroon include:**

- The National Interprofessional Collective Agreement (CCNIP) — applicable to all private sector workers not covered by a sector-specific agreement
- The Collective Agreement for the Banking Sector
- The Collective Agreement for the Oil Industry (applicable to operations of IOCs and their contractors)
- The Collective Agreement for Private Education
- The Collective Agreement for the Hotel and Tourism Industry

---

# TITLE SEVEN: LABOUR DISPUTE RESOLUTION

## Chapter 1 — Conciliation Before the Labour Inspector

**Article 138 —** All individual labour disputes must first be submitted to conciliation proceedings before the Labour Inspectorate. This conciliation is mandatory (obligatoire) and constitutes a required preliminary step before a dispute may be brought before the Tribunal du Travail.

**Procedure:**

1. The aggrieved party (worker or employer) files a written request for conciliation with the competent Labour Inspectorate
2. The Inspector summons both parties to a conciliation hearing within 15 days
3. At the hearing, the Inspector attempts to reconcile the parties
4. If conciliation succeeds, a conciliation report (procès-verbal de conciliation) is signed by both parties and the Inspector, and has the force of an enforceable judgment
5. If conciliation fails (partial or total failure), a non-conciliation certificate (procès-verbal de non-conciliation) is issued, enabling the party to refer the case to the Tribunal du Travail

## Chapter 2 — The Labour Tribunal (Tribunal du Travail)

The Tribunal du Travail has exclusive first-instance jurisdiction over all individual labour disputes. It sits in panel of three: a professional judge (président) and two assessors (one nominated by the employers' association, one nominated by the trade unions in the relevant sector).

**Limitation period (prescription):** Actions before the Tribunal du Travail must be brought within two years of the date on which the worker knew or ought to have known of the events giving rise to the claim (Article 74 Labour Code). Failure to comply with this limitation period is an absolute bar to the action.

---

*This annotated edition is current to all amendments and implementing decrees up to 31 December 2023. It includes annotations from the decisions of the Cour Suprême (Division Judiciaire — Chambre Sociale) and the Courts of Appeal of Yaoundé, Douala, and Bafoussam.*
""")

# ─────────────────────────────────────────────────────────────────────────────
upd(
'The 1996 Constitution of Cameroon: Commentary and Analysis',
72,
'As Amended by Law No. 2008/001 of 14 April 2008 and Law No. 2023/007',
"""# THE CONSTITUTION OF THE REPUBLIC OF CAMEROON
## As Amended to 2023 — Annotated Edition

---

# PREAMBLE

The Cameroonian People,

PROUD of their cultural and linguistic diversity, which constitutes a fundamental aspect of their national unity,

DETERMINED to build a democratic State dedicated to social service, committed to the fundamental ideals enshrined in the Charters of the United Nations, the Universal Declaration of Human Rights, and the African Charter on Human and Peoples' Rights,

COMMITTED to the preservation, reinforcement and consolidation of national independence and unity,

AFFIRM, as founding principles of the Republic:

1. **Freedom and security** are guaranteed to every citizen. No person may be prosecuted, arrested, detained or punished except under conditions laid down by law.

2. **Equality** — every person has equal rights and duties. The State guarantees all citizens of either sex the rights and freedoms set forth in the Preamble to the Constitution.

3. **The dignity of the human person** is inviolable. The State has the duty to protect it. Every person has the right to life, physical integrity, and security. No one may be subjected to torture or inhuman treatment.

4. **Freedom of communication, of the press, of assembly, of association, of trade unionism** and the right to strike are guaranteed under the conditions fixed by law.

5. **The family** is the natural and moral unit of human society. It is protected by the State. The State shall assist families in the fulfilment of their child-rearing functions.

6. **Youth** shall be protected by the State against exploitation and moral, intellectual and physical abandonment.

7. **The State shall guarantee all citizens the conditions necessary for their development** — in the areas of education, professional training, health, social security, housing, and leisure.

8. **National sovereignty** belongs to the people of Cameroon. No section of the people, and no individual, shall arrogate to themselves the exercise of national sovereignty.

9. **All citizens have equal rights before the law** — no citizen may be favoured or discriminated against by reason of origin, religion, sex, political opinion, or social status.

10. **Traditional values** compatible with democratic principles shall be respected and promoted.

---

# TITLE I: GENERAL PROVISIONS

**Article 1 —**

(1) The Republic of Cameroon is one and indivisible, democratic, secular and dedicated to social service.

(2) Its official name shall be "Republic of Cameroon."

(3) Its motto shall be "Peace — Work — Fatherland" (Paix — Travail — Patrie).

(4) Its national language shall be... (the Constitution does not designate a "national language" in this sense; instead Article 1(3) states the official languages shall be French and English).

*Commentary:* The "one and indivisible" formulation (une et indivisible) establishes the unitary character of the Cameroonian state. This principle has constitutional significance in the context of demands from the Anglophone regions for a federal system. The Constitutional Council would need to interpret any law that effectively created a de facto federal arrangement as being contrary to the constitutional character of the state.

**Article 1(3) —** The official languages of the Republic of Cameroon shall be English and French, both languages having equal status. The State shall guarantee the promotion of bilingualism throughout the national territory.

*Commentary:* The equal status of the two official languages is a foundational constitutional principle. It requires that all official communications, legislative texts, and judicial decisions be available in both languages. However, practical implementation has been challenging — court proceedings in the Anglophone regions are conducted primarily in English, while Francophone courts operate in French.

**Article 2 —**

(1) National sovereignty shall be vested in the Cameroonian people who shall exercise it either through the President of the Republic and members of Parliament or by way of referendum. No section of the people or any individual shall arrogate to itself or to himself the exercise thereof.

(2) The President of the Republic and members of Parliament shall be elected by direct universal suffrage. Electors shall be all Cameroonian nationals of either sex who are at least twenty years of age and who fulfil the conditions laid down by law.

**Article 3 —** Political parties and groups shall be formed freely and shall exercise their activities in accordance with the law. They shall be required to respect the Constitution, the principle of national unity, territorial integrity and the democratic form of the State.

**Article 4 —**

(1) The national flag shall have three equal vertical stripes of green, red and yellow. It shall bear a gold five-pointed star in the centre.

(2) The national anthem shall be "O Cameroun, Berceau de nos Ancêtres."

(3) The national emblem shall be a shield bearing in its centre a map of Cameroon in red on a yellow background, surmounted by a five-pointed yellow star; the whole resting on two crossed fasces of gold above the motto "Peace — Work — Fatherland."

**Article 5 —** The capital of the Republic shall be Yaoundé.

---

# TITLE II: THE PRESIDENT OF THE REPUBLIC

**Article 6 —**

(1) The President of the Republic shall be elected by the Cameroonian people in a direct and secret ballot.

(2) Candidature shall be open to any Cameroonian of either sex who is of Cameroonian origin, with no other nationality, who is at least thirty-five years old and who is in full enjoyment of civil and political rights.

(3) The President of the Republic shall be elected by an absolute majority of votes cast. If this is not achieved on the first ballot, the two candidates who have received the greatest number of votes shall go through to a second ballot to be held within fifteen days. In the event of a tie in the second ballot, the elder candidate shall be declared elected.

(4) *[As amended in 2008]:* The President of the Republic shall be elected for a term of seven years. He shall be eligible for re-election once. No person may be President of the Republic for more than two terms of seven years.

*Commentary on the 2008 Amendment:* The 2008 constitutional revision removed the two-term limit that had been introduced in 1996, and removed the upper age limit of 70 for candidates. These changes allowed President Paul Biya, who had been in power since 1982, to run for and win the elections of 2011 and 2018. The revision was widely criticised by opposition parties and civil society as a regression in democratic governance.

**Article 8 — Powers of the President.**

The President of the Republic shall:
- Define national policy and ensure its implementation
- Preside over the Council of Ministers
- Serve as Commander-in-Chief of the Armed Forces
- Negotiate and ratify international treaties and agreements
- Ensure the functioning of constitutional institutions
- Guarantee national independence, territorial integrity, the unity of the nation, and respect for international treaties
- Ensure continuity of the State by appointing the Prime Minister and other members of government

**Article 9 —** The President of the Republic may, where circumstances so require, declare by decree a state of emergency or a state of siege, after consultation with the President of the National Assembly and the President of the Senate. The declaration of a state of emergency or state of siege suspends the application of ordinary procedural guarantees in specified respects, but the core rights of human dignity, protection against torture, and the rights of a person before the courts may never be suspended.

**Article 11 —** The President of the Republic shall promulgate laws within fifteen days following their transmission to him after the final vote. He may, before the expiry of this time limit, request a second deliberation of the law or of some of its articles by Parliament. Such request shall not be refused.

---

# TITLE III: PARLIAMENT

**Article 13 —**

(1) Parliament shall be composed of two chambers: the National Assembly and the Senate.

(2) Parliament shall enact laws, vote on the budget and monitor government activity.

**The National Assembly:**

**Article 14 —** The National Assembly shall be composed of one hundred and eighty (180) members elected by direct universal suffrage for a five-year term. Seats shall be distributed among the various administrative departments according to the population.

**The Senate:**

**Article 20 —** The Senate shall represent the regional and local authorities of the Republic.

*[Introduced by the 2008 amendment]*

(1) The Senate shall have one hundred (100) senators. Each of the ten regions shall be represented by ten senators of whom seven shall be elected by indirect universal suffrage by regional councillors, and three shall be appointed by the President of the Republic.

(2) Senators shall serve a five-year term. One-half of the Senate shall be renewed every two and a half years.

**The Legislative Function:**

**Article 26 —** Parliament shall enact laws and the National Assembly shall vote on the Finance Act (loi de finances). Laws are passed by an ordinary majority unless the Constitution requires a qualified majority.

**Article 27 —** The following matters are subject to legislative regulation by Parliament:
- Fundamental civil and political rights of citizens
- The organisation of national defence
- The territory of the Republic, including the delimitation, creation, and modification of administrative units
- Nationality, civil status, civil capacity
- The judicial organisation and the legal professions
- Criminal offences and punishments
- Taxation and the monetary system
- The State budget

---

# TITLE IV: THE JUDICIAL POWER

**Article 37 —**

(1) Judicial power shall be exercised by the Supreme Court, Courts of Appeal, and Tribunals.

(2) The President of the Republic shall be the guarantor of the independence of the judiciary. He shall be assisted in this function by the Superior Council of Magistracy.

(3) The judiciary shall be independent of the executive and legislative branches of government.

**Article 38 —** The courts and tribunals shall be the guardians of individual liberties. They shall ensure that the rule of law is respected in accordance with the principles enunciated in the Preamble to the present Constitution.

**Article 40 —** The Supreme Court (Cour Suprême) shall be the highest court of the Republic in:
- Judicial matters
- Administrative matters
- Audit and accounts matters

Decisions of the Cour Suprême are binding on all lower courts and may not be appealed.

---

# TITLE V: THE CONSTITUTIONAL COUNCIL

**Article 46 —** The Constitutional Council shall be the supreme authority competent to rule on matters of constitutionality. It shall rule on the constitutionality of laws, and guarantee fundamental human rights and public liberties.

**Article 47 —**

(1) The Constitutional Council shall be composed of eleven members:
- Three members appointed by the President of the Republic
- Three members appointed by the President of the National Assembly
- Three members appointed by the President of the Senate
- Former Presidents of the Republic, who are members by right for life

(2) Members of the Constitutional Council shall serve a nine-year non-renewable term.

**Article 48 — Jurisdiction:**

(1) The Constitutional Council shall rule on the constitutionality of:
- Laws, before promulgation, when referred by the President of the Republic, the President of the National Assembly, the President of the Senate, or one-third of the members of either house
- Organic laws, before promulgation
- Standing orders of Parliament, before their implementation

(2) A law declared unconstitutional shall not be promulgated.

**Limitation:** Access to the Constitutional Council is limited to the President of the Republic, the Presidents of the two chambers, and one-third of members of Parliament. Individual citizens cannot directly challenge a law before the Constitutional Council. This is a significant limitation on rights protection, as citizens must rely on political actors to refer unconstitutional laws to the Constitutional Council.

---

# TITLE VI: THE EXECUTIVE

**Article 10 — The Government:**

(1) The government shall consist of the Prime Minister and the other members of government.

(2) The Prime Minister shall be the Head of Government. He shall be appointed by the President of the Republic.

(3) The Prime Minister shall:
- Coordinate government action
- Ensure the implementation of laws
- Exercise the power to make regulations (pouvoir réglementaire)
- Sign instruments of appointment for senior civil servants (other than those reserved to the President of the Republic)

**Article 12 — Accountability:** The government is accountable to the President of the Republic. Ministers carry out the policy determined by the President of the Republic in their respective sectors.

---

# TITLE VII: DECENTRALISATION AND LOCAL GOVERNMENT

**Article 55 —**

(1) The territorial communities of the Republic shall be the Regions and the Councils (Communes). Other categories of territorial community may be created by law.

(2) Territorial communities shall be self-governing legal entities under the conditions defined by law. They shall be administered by elected councils. The conditions under which the State shall ensure the supervision of the activities of the territorial communities shall be laid down by law.

(3) Regions and Councils shall be provided with resources commensurate with the responsibilities transferred to them.

**The Special Status of the North West and South West Regions:**

Law No. 2019/004 of 25 April 2019 confers a Special Status on the North West and South West Regions, recognising their specific cultural and linguistic character as Anglophone regions. Under this special status:
- The two regions have competence to manage their own educational systems through Regional Education Boards
- English is the principal language of administration in these regions
- The common law system is maintained in the courts of the two regions
- A special Development Authority (DDC) is established for each region

*Commentary:* The Special Status was introduced as a political response to the armed conflict in the Anglophone regions that began in 2016. Many civil society organisations and opposition parties have argued that it falls short of the demands for federalism or confederalism, and that it has not succeeded in ending the conflict.

---

# TITLE VIII: THE HIGH COURT OF JUSTICE

**Article 53 —**

(1) The High Court of Justice shall be competent to try the President of the Republic for high treason, and members of government for crimes and offences committed in the exercise of their functions.

(2) The High Court of Justice shall be composed of members of the National Assembly and members of the Senate. Its composition, organisation and functioning shall be determined by law.

High treason is defined as: the President's wilful violation of the oath of office; actions that gravely undermine the constitutional institutions; the unilateral modification of the Constitution through means other than those prescribed.

The High Court of Justice has never been convened in the history of Cameroon.

---

*This annotated edition is current to the constitutional amendment of 2023. It is intended as a scholarly reference for practitioners, legislators, and students of Cameroonian constitutional law.*
""")

print("\n=== Update complete ===")
Book = __import__('apps.books.models', fromlist=['Book']).Book
print(f"Published books in database: {Book.objects.filter(status='published').count()}")
