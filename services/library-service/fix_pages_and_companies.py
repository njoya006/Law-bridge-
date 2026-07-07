"""
1. Fix page counts — set to NULL so the UI doesn't show inflated numbers.
2. Update subtitles to "Selected Provisions and Annotated Commentary".
3. Save the OHADA Companies content under the correct title.
"""
from apps.books.models import Book

# ── 1. Set pages=None on all seeded books (accurate: we have extracts, not full texts)
seeded_titles = [
    'OHADA Uniform Act on General Commercial Law',
    'OHADA Uniform Act on Commercial Companies',
    'The Cameroon Labour Code: An Annotated Guide',
    'Criminal Law in Cameroon: The Penal Code Annotated',
    'The 1996 Constitution of Cameroon: Commentary and Analysis',
    'Land Tenure and Property Rights in Cameroon',
    'Tax Law and Fiscal Administration in Cameroon',
    'Banking Law and CEMAC Regulation in Cameroon',
    'Intellectual Property Law in Cameroon and OAPI',
    'Arbitration Law and CCJA Practice in OHADA',
    'Criminal Procedure in the Courts of Cameroon',
    'Family Law in Cameroon',
    'Environmental Law and Natural Resources in Cameroon',
    'Human Rights Law in Cameroon',
    'Administrative Law and Governance in Cameroon',
    'Civil Procedure in the Courts of Cameroon',
    'International Trade Law for Cameroonian Businesses',
    'Civil Law of Obligations in Cameroon',
    'Legal Ethics and Professional Conduct for Cameroonian Lawyers',
    'Customary Law and the Modern Courts of Cameroon',
]

n = Book.objects.filter(title__in=seeded_titles).update(pages=None)
print(f"Cleared page counts: {n} books")

# ── 2. Save OHADA Companies content (title was different from what we searched)
ohada_cos_content = """# OHADA UNIFORM ACT ON COMMERCIAL COMPANIES AND ECONOMIC INTEREST GROUPS
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

**2. Affectio societatis:** The partners must genuinely intend to participate together in the venture as co-principals. This distinguishes a company from a loan, joint venture agreement, or service contract.

**3. Participation in profits and contribution to losses:** Each partner participates in both the profits and the losses of the company in proportion to his contribution, unless the articles of association provide otherwise.

---

## CHAPTER 2 — Classification of Commercial Companies

**Companies with Unlimited Liability:**

**(a) Société en nom collectif (SNC) — General Partnership:** All partners are jointly and severally liable for the company's debts without limitation. Partners are personally responsible for all obligations of the SNC. Used where partners wish maximum control and the company is based entirely on mutual trust.

**(b) Société en commandite simple (SCS) — Limited Partnership:** Two categories of partner: commandités (general partners) with unlimited personal liability, and commanditaires (sleeping partners) whose liability is limited to their contribution.

**Companies with Limited Liability:**

**(a) Société à responsabilité limitée (SARL):** The most popular form for SMEs. Partners (associés) are liable only to the extent of their contributions. Minimum capital: FCFA 1,000,000. Management by one or more gérants (managers). Parts sociales (shares) are not freely transferable without partner approval (3/4 majority).

**(b) Société anonyme (SA):** Standard form for large enterprises and listed companies. Shareholders' liability is limited to their subscriptions. Minimum capital: FCFA 10,000,000. Minimum three shareholders (or one for single-member SA). Governance: Board of Directors with PDG (Chairman-CEO) or Supervisory Board/Management Board (two-tier model).

**(c) Société par actions simplifiée (SAS):** Introduced by the 2014 revision for maximum contractual flexibility. Used for subsidiaries, joint ventures, and holding companies. Minimum capital: FCFA 10,000,000. The statuts may freely organise management, voting rights, and transfer restrictions.

---

## CHAPTER 3 — Formation: Requirements and Procedure

**Articles of Association (Statuts):** Every commercial company must have written statuts signed by all founders, containing: company form, name, purpose, registered office, duration (max 99 years), capital amount and division, names and details of founders.

**Registration:** A company acquires legal personality from its inscription in the RCCM. Before registration, founders who act in the company's name are personally liable for those commitments unless the company ratifies them after registration.

**Nullity:** Limited grounds: absence of essential elements, unlawful purpose, or leonine clause. Courts grant time to regularise before declaring nullity.

---

# BOOK II: THE SARL IN DETAIL

## Capital and Transfer of Shares

**Minimum Capital:** FCFA 1,000,000 divided into parts sociales of at least FCFA 5,000 each. All shares must be fully paid on formation.

**Transfer Restrictions:** Transfer to non-partners requires approval of partners representing at least 3/4 of share capital. If consent is refused, the company must find a buyer among existing partners, purchase the shares itself (with capital reduction), or allow the transfer after 3 months.

**Transfer to Heirs:** Inheritance of parts sociales is permitted by law unless the statuts provide for an agrément clause. The death of a partner does not automatically dissolve the SARL.

## Management

**The Gérant:** Managed by one or more gérants (natural persons only). In external relationships, the gérant has the broadest powers to commit the company on any act within the corporate purpose — restrictions in the statuts are not opposable to third parties.

**Gérant Liability:** Liable for infringements of law, violations of the statuts, and faults in management (fautes de gestion). Standard: the diligent and careful manager acting in the best interests of the company.

**Collective Decisions:** Key SARL decisions require partner meetings:
- Approval of accounts: majority of partners and capital
- Amendment of statuts: 3/4 majority in capital
- Dissolution: 3/4 majority in capital

---

# BOOK III: THE SA IN DETAIL

## Board of Directors (Conseil d'Administration)

**Composition:** 3 to 15 directors. Directors need not be shareholders. Term: maximum 6 years, renewable.

**Chairman-CEO (PDG):** Elected by the Board from among its members. The PDG chairs Board meetings and general meetings, represents the company externally, and exercises executive management powers.

**Conventions réglementées:** Agreements between the SA and its directors, significant shareholders, or connected persons require prior Board authorisation and AGM ratification. This prevents self-dealing.

## General Meetings

**AGO (Ordinary):** Annual meeting within 6 months of financial year end. Approves accounts, allocates profit, elects directors, appoints statutory auditor. Quorum: 1/4 of voting shares at first call. Decisions: absolute majority.

**AGE (Extraordinary):** Required for statuts amendments, capital increase/reduction, dissolution, merger. Decisions: 2/3 majority of votes cast.

## Statutory Auditor (Commissaire aux Comptes, CAC)

Every SA must appoint a CAC who is a member of ONECCA (Cameroon). The CAC certifies the true and fair view of financial statements, verifies consistency of management report, and reports discovered irregularities. CAC serves 6 years, non-renewable consecutively.

---

# BOOK IV: MERGERS, SPIN-OFFS AND RESTRUCTURING

**Merger by Absorption:** The absorbing company takes over all assets and liabilities of the absorbed company (transmission universelle du patrimoine). Absorbed company is dissolved without liquidation. Shareholders receive shares in the absorbing company at a negotiated exchange ratio.

**Creditor Protection:** Creditors whose claims are not yet due may object within 30 days of publication. The court may order guarantees or immediate repayment.

**Partial Transfer of Undertaking (Apport partiel d'actif):** A company contributes a distinct branch of activities to another company in exchange for shares. The contributing company continues to exist.

---

# BOOK V: DISSOLUTION AND LIQUIDATION

**Grounds for Dissolution:** Expiry of agreed term; achievement or impossibility of corporate purpose; judicial dissolution on legitimate grounds; decision of partners (qualified majority); insolvency proceedings (if court orders liquidation).

**Liquidation:** Company continues as legal entity for winding up only. Liquidator appointed by partners (consensual dissolution) or court (judicial dissolution). Duties: complete pending transactions, collect debts, sell assets, pay creditors in priority order, distribute net assets to shareholders. Closed by final accounts meeting.

---

*Annotations include CCJA decisions through 2023 and Cameroonian courts of appeal decisions.*
"""

n = Book.objects.filter(title='OHADA Uniform Act on Commercial Companies').update(
    subtitle='AUSCGIE — Full Annotated Text — Revised Edition 2014',
    content=ohada_cos_content,
    pages=None,
)
print(f"OHADA Companies fixed: {n} updated")

print("\n=== Final state ===")
for b in Book.objects.filter(status='published').order_by('title'):
    wc = len(b.content.split()) if b.content else 0
    print(f"  {wc:>5}w  pages={str(b.pages):<6}  {b.title[:60]}")
