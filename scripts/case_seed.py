import sys, os
sys.path.insert(0, '/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()
import psycopg2
from django.utils import timezone
from datetime import timedelta
from apps.cases.models import Case, CaseNote

def get_uuid(email, db="auth_db"):
    host = os.environ.get("DB_HOST", "postgres")
    pw = os.environ.get("DB_PASSWORD", "")
    conn = psycopg2.connect(host=host, port=5432, dbname=db, user="lawbridge_user", password=pw)
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM users_user WHERE email=%s", (email,))
        row = cur.fetchone()
        return str(row[0]) if row else None
    finally:
        conn.close()

def get_lawyer_uuid(email):
    host = os.environ.get("DB_HOST", "postgres")
    pw = os.environ.get("DB_PASSWORD", "")
    conn = psycopg2.connect(host=host, port=5432, dbname="lawyer_db", user="lawbridge_user", password=pw)
    try:
        cur = conn.cursor()
        cur.execute("SELECT user_id FROM lawyers_lawyerprofile WHERE user_id=(SELECT id::text FROM users_user WHERE email=%s LIMIT 1)", (email,))
        # fallback: look in auth_db
        row = cur.fetchone()
        return str(row[0]) if row else None
    finally:
        conn.close()

# Fetch UUIDs
clients = {
    "alpha": get_uuid("client.alpha@test.cm"),
    "beta":  get_uuid("client.beta@test.cm"),
    "gamma": get_uuid("client.gamma@test.cm"),
    "delta": get_uuid("client.delta@test.cm"),
    "epsilon": get_uuid("client.epsilon@test.cm"),
}

# Nji lawyers (from auth_db)
nji_owner   = get_uuid("emmanuel.nji@nji-associates.cm")
nji_p1      = get_uuid("grace.foncha@nji-associates.cm")
nji_p2      = get_uuid("kevin.tambe@nji-associates.cm")
nji_assoc1  = get_uuid("rita.ngwa@nji-associates.cm")
nji_assoc2  = get_uuid("pascal.mbah@nji-associates.cm")

# Biya lawyers (from auth_db)
biya_owner  = get_uuid("paul.biya@biya-law.cm")
biya_p1     = get_uuid("michelle.tchouake@biya-law.cm")
biya_p2     = get_uuid("boris.mbida@biya-law.cm")
biya_assoc1 = get_uuid("christiane.ngom@biya-law.cm")
biya_assoc2 = get_uuid("edmond.eto@biya-law.cm")

now = timezone.now()

CASES = [
    # ── NJI & ASSOCIATES (5 cases) ────────────────────────────────────────────
    {
        "client_id":          clients["alpha"],
        "assigned_lawyer_id": nji_owner,
        "title":              "Criminal Defence — Armed Robbery Charge",
        "description":        "Client Alpha Ndi has been charged with armed robbery following an incident in Yaoundé on 14 March 2026. Client denies all charges and claims mistaken identity. Need to review CCTV footage, witness statements, and file a motion to dismiss based on alibi evidence.",
        "case_type":          "criminal",
        "legal_tradition":    "common_law",
        "circuit":            "anglophone",
        "language":           "en",
        "status":             "in_progress",
        "booking_status":     "accepted",
        "booking_metadata":   {"consultation_type": "criminal_defence", "booking_fee": 30000, "payment_status": "paid", "firm": "Nji & Associates"},
        "filed_at":           now - timedelta(days=45),
        "timeline": [
            {"timestamp": (now - timedelta(days=45)).isoformat(), "status": "filed",               "notes": "Case filed by client.", "updated_by": None},
            {"timestamp": (now - timedelta(days=44)).isoformat(), "status": "assigned",            "notes": "Assigned to Emmanuel Nji.", "updated_by": str(nji_owner)},
            {"timestamp": (now - timedelta(days=40)).isoformat(), "status": "under_review",        "notes": "Initial review of police report and charge sheet.", "updated_by": str(nji_owner)},
            {"timestamp": (now - timedelta(days=30)).isoformat(), "status": "evidence_collection", "notes": "Obtaining CCTV footage from municipality. Scheduling witness interviews.", "updated_by": str(nji_owner)},
            {"timestamp": (now - timedelta(days=10)).isoformat(), "status": "in_progress",         "notes": "Alibi witnesses confirmed. Filing motion to dismiss next week.", "updated_by": str(nji_owner)},
        ],
        "notes": [
            {"lawyer_id": nji_owner, "content": "Police report shows client was apprehended 2 km from the scene. Alibi: client was at a funeral in Bafoussam. Three witnesses can testify. Need sworn affidavits by Friday.", "is_private": False},
            {"lawyer_id": nji_owner, "content": "PRIVATE — client has a prior caution notice from 2022 (minor traffic offence). Not relevant here but flag if prosecution attempts to raise character.", "is_private": True},
        ],
    },
    {
        "client_id":          clients["beta"],
        "assigned_lawyer_id": nji_p1,
        "title":              "Matrimonial Property Dispute — Divorce Proceedings",
        "description":        "Beta Muna is seeking dissolution of a 12-year marriage and equitable distribution of jointly acquired assets including a 4-bedroom property in Yaoundé, two vehicles, and a joint savings account of approximately XAF 18,000,000. Spouse is contesting the property valuation.",
        "case_type":          "family",
        "legal_tradition":    "common_law",
        "circuit":            "anglophone",
        "language":           "en",
        "status":             "mediation",
        "booking_status":     "accepted",
        "booking_metadata":   {"consultation_type": "family_law", "booking_fee": 25000, "payment_status": "paid", "firm": "Nji & Associates"},
        "filed_at":           now - timedelta(days=60),
        "timeline": [
            {"timestamp": (now - timedelta(days=60)).isoformat(), "status": "filed",       "notes": "Petition for divorce filed.", "updated_by": None},
            {"timestamp": (now - timedelta(days=59)).isoformat(), "status": "assigned",    "notes": "Assigned to Grace Foncha.", "updated_by": str(nji_p1)},
            {"timestamp": (now - timedelta(days=55)).isoformat(), "status": "under_review","notes": "Marriage certificate, title deeds and bank statements reviewed.", "updated_by": str(nji_p1)},
            {"timestamp": (now - timedelta(days=20)).isoformat(), "status": "mediation",   "notes": "Both parties agreed to mediation session before court ruling. Scheduled for next month.", "updated_by": str(nji_p1)},
        ],
        "notes": [
            {"lawyer_id": nji_p1, "content": "Property at Mvan, Yaoundé is registered solely in husband's name but funded 60% from joint savings. Strong claim for constructive trust. Need valuation report.", "is_private": False},
        ],
    },
    {
        "client_id":          clients["gamma"],
        "assigned_lawyer_id": nji_p2,
        "title":              "Land Ownership Dispute — Encroachment on Titled Land",
        "description":        "Gamma Tabi holds a land certificate (titre foncier) for a 2,500 sqm plot in the Mendong district. A neighbouring developer has begun construction encroaching approximately 180 sqm onto the titled plot. Client seeks an injunction and compensation.",
        "case_type":          "real_estate",
        "legal_tradition":    "civil_law",
        "circuit":            "francophone",
        "language":           "fr",
        "status":             "awaiting_court_date",
        "booking_status":     "accepted",
        "booking_metadata":   {"consultation_type": "real_estate", "booking_fee": 20000, "payment_status": "paid", "firm": "Nji & Associates"},
        "filed_at":           now - timedelta(days=30),
        "timeline": [
            {"timestamp": (now - timedelta(days=30)).isoformat(), "status": "filed",               "notes": "Case filed with certified copies of titre foncier.", "updated_by": None},
            {"timestamp": (now - timedelta(days=29)).isoformat(), "status": "assigned",            "notes": "Assigned to Kevin Tambe.", "updated_by": str(nji_p2)},
            {"timestamp": (now - timedelta(days=25)).isoformat(), "status": "under_review",        "notes": "Verified land certificate authenticity with MINDCAF. Confirmed encroachment via aerial survey.", "updated_by": str(nji_p2)},
            {"timestamp": (now - timedelta(days=15)).isoformat(), "status": "evidence_collection", "notes": "Survey report obtained. Photographs and GPS coordinates filed.", "updated_by": str(nji_p2)},
            {"timestamp": (now - timedelta(days=5)).isoformat(),  "status": "awaiting_court_date", "notes": "Petition for injunction submitted to the High Court. Awaiting hearing date.", "updated_by": str(nji_p2)},
        ],
        "notes": [
            {"lawyer_id": nji_p2, "content": "Developer has a building permit but it references a different plot number. Their surveyor appears to have used incorrect cadastral coordinates. Strong case for injunction.", "is_private": False},
        ],
    },
    {
        "client_id":          clients["delta"],
        "assigned_lawyer_id": nji_assoc1,
        "title":              "Wrongful Termination — Senior Management Role",
        "description":        "Delta Kome was summarily dismissed from a position as Regional Sales Director after 8 years of service, without notice or severance, following a whistleblower complaint about financial irregularities. Client has documentary evidence of retaliatory dismissal.",
        "case_type":          "labor",
        "legal_tradition":    "civil_law",
        "circuit":            "francophone",
        "language":           "fr",
        "status":             "hearing_scheduled",
        "booking_status":     "accepted",
        "booking_metadata":   {"consultation_type": "labor_law", "booking_fee": 20000, "payment_status": "paid", "firm": "Nji & Associates"},
        "filed_at":           now - timedelta(days=80),
        "timeline": [
            {"timestamp": (now - timedelta(days=80)).isoformat(), "status": "filed",            "notes": "Labour complaint filed with MINTSS and simultaneously with the court.", "updated_by": None},
            {"timestamp": (now - timedelta(days=79)).isoformat(), "status": "assigned",         "notes": "Assigned to Rita Ngwa.", "updated_by": str(nji_assoc1)},
            {"timestamp": (now - timedelta(days=70)).isoformat(), "status": "under_review",     "notes": "Employment contract, dismissal letter and whistleblower report reviewed.", "updated_by": str(nji_assoc1)},
            {"timestamp": (now - timedelta(days=50)).isoformat(), "status": "in_progress",      "notes": "Filed notice of retaliatory dismissal. Employer served.", "updated_by": str(nji_assoc1)},
            {"timestamp": (now - timedelta(days=10)).isoformat(), "status": "hearing_scheduled","notes": "Labour court hearing set for 18 July 2026 at 09:00.", "updated_by": str(nji_assoc1)},
        ],
        "notes": [
            {"lawyer_id": nji_assoc1, "content": "Whistleblower complaint was filed 3 days before dismissal letter. Timeline strongly supports retaliation. Compensation sought: 24 months salary + moral damages.", "is_private": False},
        ],
    },
    {
        "client_id":          clients["epsilon"],
        "assigned_lawyer_id": nji_assoc2,
        "title":              "Intellectual Property — Trademark Infringement",
        "description":        "Epsilon Fru owns a registered trademark for an artisan coffee brand 'BAMENDA GOLD'. A Douala-based competitor has launched 'BAMENDA GOLD PLUS' using a nearly identical logo and colour scheme. Client seeks immediate injunction and damages for lost revenue.",
        "case_type":          "intellectual_property",
        "legal_tradition":    "civil_law",
        "circuit":            "francophone",
        "language":           "en",
        "status":             "under_review",
        "booking_status":     "accepted",
        "booking_metadata":   {"consultation_type": "intellectual_property", "booking_fee": 35000, "payment_status": "paid", "firm": "Nji & Associates"},
        "filed_at":           now - timedelta(days=12),
        "timeline": [
            {"timestamp": (now - timedelta(days=12)).isoformat(), "status": "filed",        "notes": "Case filed with OAPI trademark registration certificate attached.", "updated_by": None},
            {"timestamp": (now - timedelta(days=11)).isoformat(), "status": "assigned",     "notes": "Assigned to Pascal Mbah.", "updated_by": str(nji_assoc2)},
            {"timestamp": (now - timedelta(days=8)).isoformat(),  "status": "under_review", "notes": "Comparing trade dress elements. Requesting OAPI cease-and-desist template.", "updated_by": str(nji_assoc2)},
        ],
        "notes": [
            {"lawyer_id": nji_assoc2, "content": "Side-by-side comparison of logos shows 85% similarity in font, colour and layout. Will pursue interim injunction while the main case proceeds.", "is_private": False},
        ],
    },

    # ── BIYA LAW PARTNERS (5 cases) ───────────────────────────────────────────
    {
        "client_id":          clients["alpha"],
        "assigned_lawyer_id": biya_owner,
        "title":              "Corporate Restructuring — Acquisition of Subsidiary",
        "description":        "Client Alpha Ndi's holding company seeks legal advice on acquiring a 70% stake in a Douala-based logistics firm. Transaction value: XAF 850,000,000. Requires due diligence review, SPA drafting, regulatory filings with MINMIDT, and competition authority notification.",
        "case_type":          "corporate",
        "legal_tradition":    "civil_law",
        "circuit":            "francophone",
        "language":           "fr",
        "status":             "in_progress",
        "booking_status":     "accepted",
        "booking_metadata":   {"consultation_type": "corporate_advisory", "booking_fee": 50000, "payment_status": "paid", "firm": "Biya Law Partners"},
        "filed_at":           now - timedelta(days=25),
        "timeline": [
            {"timestamp": (now - timedelta(days=25)).isoformat(), "status": "filed",        "notes": "Engagement letter signed. Transaction brief received.", "updated_by": None},
            {"timestamp": (now - timedelta(days=24)).isoformat(), "status": "assigned",     "notes": "Assigned to Paul Biya Jr.", "updated_by": str(biya_owner)},
            {"timestamp": (now - timedelta(days=22)).isoformat(), "status": "under_review", "notes": "Reviewing target company financials, articles of incorporation, and existing contracts.", "updated_by": str(biya_owner)},
            {"timestamp": (now - timedelta(days=10)).isoformat(), "status": "in_progress",  "notes": "Due diligence report drafted. Key red flag: undisclosed tax liability of ~XAF 40M. Renegotiating purchase price.", "updated_by": str(biya_owner)},
        ],
        "notes": [
            {"lawyer_id": biya_owner, "content": "Due diligence uncovered an undisclosed DGI tax assessment. Advised client to request price reduction or escrow clause. Client agreed to escrow. Redrafting SPA now.", "is_private": False},
            {"lawyer_id": biya_owner, "content": "PRIVATE — target company director has personal dispute with client. May affect board seat negotiations. Handle delicately.", "is_private": True},
        ],
    },
    {
        "client_id":          clients["beta"],
        "assigned_lawyer_id": biya_p1,
        "title":              "Tax Dispute — Transfer Pricing Assessment by DGI",
        "description":        "Beta Muna's import/export company received a DGI assessment of XAF 320,000,000 in additional taxes following a transfer pricing audit. The assessment alleges under-pricing of inter-company transactions with a Mauritius-based subsidiary. Client disputes the assessment methodology.",
        "case_type":          "tax",
        "legal_tradition":    "civil_law",
        "circuit":            "francophone",
        "language":           "fr",
        "status":             "evidence_collection",
        "booking_status":     "accepted",
        "booking_metadata":   {"consultation_type": "tax_advisory", "booking_fee": 45000, "payment_status": "paid", "firm": "Biya Law Partners"},
        "filed_at":           now - timedelta(days=50),
        "timeline": [
            {"timestamp": (now - timedelta(days=50)).isoformat(), "status": "filed",               "notes": "DGI notice of reassessment received. Formal objection filed.", "updated_by": None},
            {"timestamp": (now - timedelta(days=49)).isoformat(), "status": "assigned",            "notes": "Assigned to Michelle Tchouake.", "updated_by": str(biya_p1)},
            {"timestamp": (now - timedelta(days=45)).isoformat(), "status": "under_review",        "notes": "Reviewing 3 years of inter-company pricing documentation and OECD benchmarking reports.", "updated_by": str(biya_p1)},
            {"timestamp": (now - timedelta(days=25)).isoformat(), "status": "evidence_collection", "notes": "Obtaining comparable uncontrolled price data. Commissioning independent transfer pricing study.", "updated_by": str(biya_p1)},
        ],
        "notes": [
            {"lawyer_id": biya_p1, "content": "DGI used a CUP method but applied Moroccan market data instead of CEMAC regional comparables. Our TP study using CEMAC data shows pricing was within arm's length. Strong grounds for objection.", "is_private": False},
        ],
    },
    {
        "client_id":          clients["gamma"],
        "assigned_lawyer_id": biya_p2,
        "title":              "Commercial Lease Dispute — Unlawful Eviction from Business Premises",
        "description":        "Gamma Tabi's restaurant business was evicted from commercial premises in Akwa, Douala, with only 48 hours' notice, despite having a valid 3-year lease with 18 months remaining. Landlord claims breach of use clause. Client disputes this and seeks reinstatement and damages.",
        "case_type":          "commercial",
        "legal_tradition":    "civil_law",
        "circuit":            "francophone",
        "language":           "fr",
        "status":             "hearing_scheduled",
        "booking_status":     "accepted",
        "booking_metadata":   {"consultation_type": "commercial_litigation", "booking_fee": 30000, "payment_status": "paid", "firm": "Biya Law Partners"},
        "filed_at":           now - timedelta(days=35),
        "timeline": [
            {"timestamp": (now - timedelta(days=35)).isoformat(), "status": "filed",            "notes": "Emergency injunction application filed alongside main claim.", "updated_by": None},
            {"timestamp": (now - timedelta(days=34)).isoformat(), "status": "assigned",         "notes": "Assigned to Boris Mbida.", "updated_by": str(biya_p2)},
            {"timestamp": (now - timedelta(days=33)).isoformat(), "status": "under_review",     "notes": "Lease agreement reviewed. Use clause is for 'restaurant and events' — client was using for restaurant only. No breach.", "updated_by": str(biya_p2)},
            {"timestamp": (now - timedelta(days=25)).isoformat(), "status": "in_progress",      "notes": "Served landlord with formal demand to restore possession. Landlord refused. Proceeding to court.", "updated_by": str(biya_p2)},
            {"timestamp": (now - timedelta(days=7)).isoformat(),  "status": "hearing_scheduled","notes": "Tribunal de Grande Instance, Douala — hearing on 10 July 2026 at 10:00.", "updated_by": str(biya_p2)},
        ],
        "notes": [
            {"lawyer_id": biya_p2, "content": "Emergency injunction was partially granted — landlord cannot re-let the property pending judgment. Client's stock and equipment are being stored by a court-appointed bailiff. Hearing in 8 days.", "is_private": False},
        ],
    },
    {
        "client_id":          clients["delta"],
        "assigned_lawyer_id": biya_assoc1,
        "title":              "Breach of Contract — Software Development Agreement",
        "description":        "Delta Kome's tech startup contracted a Yaoundé development firm for a fintech platform for XAF 75,000,000. After receiving 60% of payment, the contractor delivered a non-functional product and ceased communication. Client seeks full refund and consequential damages.",
        "case_type":          "commercial",
        "legal_tradition":    "civil_law",
        "circuit":            "francophone",
        "language":           "en",
        "status":             "filed",
        "booking_status":     "accepted",
        "booking_metadata":   {"consultation_type": "commercial_litigation", "booking_fee": 25000, "payment_status": "paid", "firm": "Biya Law Partners"},
        "filed_at":           now - timedelta(days=5),
        "timeline": [
            {"timestamp": (now - timedelta(days=5)).isoformat(), "status": "filed",    "notes": "Statement of claim filed. Payment proof and WhatsApp communication logs attached.", "updated_by": None},
            {"timestamp": (now - timedelta(days=4)).isoformat(), "status": "assigned", "notes": "Assigned to Christiane Ngom.", "updated_by": str(biya_assoc1)},
        ],
        "notes": [
            {"lawyer_id": biya_assoc1, "content": "Contract has a clear deliverables schedule with milestone payments. Contractor acknowledged in writing that delivery was delayed but blames 'client-side change requests' — we have evidence this is false. Strong case.", "is_private": False},
        ],
    },
    {
        "client_id":          clients["epsilon"],
        "assigned_lawyer_id": biya_assoc2,
        "title":              "Debt Recovery — Unpaid Invoice from Government Contractor",
        "description":        "Epsilon Fru's construction company supplied building materials worth XAF 48,000,000 to a public works contractor. Payment has been outstanding for 14 months despite three formal demand letters. Client seeks full recovery plus interest and legal costs.",
        "case_type":          "civil_litigation",
        "legal_tradition":    "civil_law",
        "circuit":            "francophone",
        "language":           "fr",
        "status":             "verdict",
        "booking_status":     "accepted",
        "booking_metadata":   {"consultation_type": "civil_litigation", "booking_fee": 20000, "payment_status": "paid", "firm": "Biya Law Partners"},
        "filed_at":           now - timedelta(days=120),
        "timeline": [
            {"timestamp": (now - timedelta(days=120)).isoformat(), "status": "filed",               "notes": "Payment order application (injonction de payer) filed.", "updated_by": None},
            {"timestamp": (now - timedelta(days=119)).isoformat(), "status": "assigned",            "notes": "Assigned to Edmond Eto.", "updated_by": str(biya_assoc2)},
            {"timestamp": (now - timedelta(days=115)).isoformat(), "status": "under_review",        "notes": "Delivery notes, invoices and demand letters verified.", "updated_by": str(biya_assoc2)},
            {"timestamp": (now - timedelta(days=90)).isoformat(),  "status": "evidence_collection", "notes": "Obtained signed delivery receipts countersigned by the contractor's site manager.", "updated_by": str(biya_assoc2)},
            {"timestamp": (now - timedelta(days=60)).isoformat(),  "status": "in_progress",         "notes": "Hearing concluded. Judgement reserved.", "updated_by": str(biya_assoc2)},
            {"timestamp": (now - timedelta(days=15)).isoformat(),  "status": "verdict",             "notes": "JUDGEMENT: Full amount (XAF 48,000,000) awarded plus 12% annual interest and legal costs. Now pursuing enforcement.", "updated_by": str(biya_assoc2)},
        ],
        "notes": [
            {"lawyer_id": biya_assoc2, "content": "Court ruled in full favour of client. Now filing for garnishment of contractor's bank accounts under Article 30 of the OHADA Uniform Act on Simplified Recovery Procedures.", "is_private": False},
        ],
    },
]

created = 0
for c in CASES:
    notes_data = c.pop("notes", [])
    case = Case.objects.create(
        client_id=c["client_id"],
        assigned_lawyer_id=c["assigned_lawyer_id"],
        title=c["title"],
        description=c["description"],
        case_type=c["case_type"],
        legal_tradition=c["legal_tradition"],
        circuit=c["circuit"],
        language=c["language"],
        status=c["status"],
        booking_status=c["booking_status"],
        booking_metadata=c["booking_metadata"],
        timeline=c["timeline"],
        filed_at=c.get("filed_at"),
    )
    for n in notes_data:
        CaseNote.objects.create(case=case, lawyer_id=n["lawyer_id"], content=n["content"], is_private=n["is_private"])
    created += 1
    print(f"  Created: [{c['status'].upper()}] {c['title'][:60]}")

print(f"\nSEED_CASES_OK: {created} cases created with {Case.objects.count()} total in DB.")
