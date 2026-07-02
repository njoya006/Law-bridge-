"""
Seed lawyer_db with firms, lawyer profiles, and firm memberships.
Must run AFTER seed_users has run on auth-service.
Reads auth-service users via the shared DB host (same postgres, different DB).
Run: python manage.py seed_firms
"""
import os
import psycopg2
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.lawyers.models import LawyerProfile
from apps.firms.models import Firm, FirmMembership, FirmPartnershipPolicy

User = get_user_model()

SPECIALIZATIONS = [
    "Criminal Law",
    "Family Law",
    "Corporate Law",
    "Real Estate Law",
    "Immigration Law",
    "Labor Law",
    "Intellectual Property",
    "Civil Litigation",
    "Tax Law",
    "Constitutional Law",
]

CASE_TYPES = [
    "criminal,civil_litigation",
    "family,civil_litigation,real_estate",
    "corporate,tax,intellectual_property",
    "real_estate,civil_litigation",
    "immigration,labor",
    "labor,civil_litigation",
    "intellectual_property,corporate",
    "civil_litigation,criminal",
    "tax,corporate",
    "constitutional,civil_litigation",
]

CIRCUITS = [
    "Centre", "Littoral", "Northwest", "Southwest", "West",
    "Centre", "Littoral", "Southwest", "West", "Centre",
]

FIRMS_DATA = [
    {
        "name": "Nji & Associates",
        "city": "Yaoundé",
        "description": "Leading litigation and corporate advisory firm based in Yaoundé, serving clients across Cameroon since 2005.",
        "office_address": "Rue Nachtigal, Immeuble Nji, Yaoundé",
        "specializations": ["Criminal Law", "Civil Litigation", "Corporate Law"],
        "year_established": 2005,
        "contact_email": "contact@nji-associates.cm",
        "owner_email": "emmanuel.nji@nji-associates.cm",
        "secretary_email": "celine.akama@nji-associates.cm",
        "lawyers": [
            ("grace.foncha@nji-associates.cm",     "partner"),
            ("kevin.tambe@nji-associates.cm",      "partner"),
            ("rita.ngwa@nji-associates.cm",        "associate"),
            ("pascal.mbah@nji-associates.cm",      "associate"),
            ("linda.fon@nji-associates.cm",        "associate"),
            ("samuel.nkeng@nji-associates.cm",     "associate"),
            ("alice.bih@nji-associates.cm",        "associate"),
            ("felix.atanga@nji-associates.cm",     "associate"),
            ("divine.tabi@nji-associates.cm",      "guest"),
        ],
        "circuit": "Centre",
    },
    {
        "name": "Biya Law Partners",
        "city": "Douala",
        "description": "Premier commercial law firm in Douala specialising in corporate transactions, M&A, and dispute resolution.",
        "office_address": "Avenue de Gaulle, Immeuble Biya, Douala",
        "specializations": ["Corporate Law", "Tax Law", "Civil Litigation"],
        "year_established": 2010,
        "contact_email": "info@biya-law.cm",
        "owner_email": "paul.biya@biya-law.cm",
        "secretary_email": "sophie.minkoe@biya-law.cm",
        "lawyers": [
            ("michelle.tchouake@biya-law.cm",     "partner"),
            ("boris.mbida@biya-law.cm",           "partner"),
            ("christiane.ngom@biya-law.cm",       "associate"),
            ("edmond.eto@biya-law.cm",            "associate"),
            ("anne.mfoumou@biya-law.cm",          "associate"),
            ("stephane.zang@biya-law.cm",         "associate"),
            ("beatrice.ongolo@biya-law.cm",       "associate"),
            ("richard.abesso@biya-law.cm",        "guest"),
        ],
        "circuit": "Littoral",
    },
    {
        "name": "Tanyi Law Group",
        "city": "Bamenda",
        "description": "Northwest Cameroon's most experienced law group, handling criminal defence, family and property matters.",
        "office_address": "Commercial Avenue, Bamenda",
        "specializations": ["Criminal Law", "Family Law", "Real Estate Law"],
        "year_established": 1998,
        "contact_email": "office@tanyi-law.cm",
        "owner_email": "charles.tanyi@tanyi-law.cm",
        "secretary_email": "brigitte.fondop@tanyi-law.cm",
        "lawyers": [
            ("eunice.wirba@tanyi-law.cm",         "partner"),
            ("nfor.nkum@tanyi-law.cm",            "partner"),
            ("veronica.che@tanyi-law.cm",         "associate"),
            ("andrew.wung@tanyi-law.cm",          "associate"),
            ("patience.mbah@tanyi-law.cm",        "associate"),
            ("jerome.njikam@tanyi-law.cm",        "associate"),
            ("esther.bongfen@tanyi-law.cm",       "associate"),
            ("humphrey.ndeh@tanyi-law.cm",        "associate"),
            ("gladys.ndi@tanyi-law.cm",           "guest"),
        ],
        "circuit": "Northwest",
    },
    {
        "name": "Fon Chambers",
        "city": "Buea",
        "description": "Southwest regional chambers known for immigration, labour law and human rights litigation.",
        "office_address": "Molyko Road, Buea",
        "specializations": ["Immigration Law", "Labor Law", "Civil Litigation"],
        "year_established": 2008,
        "contact_email": "chambers@fon-chambers.cm",
        "owner_email": "victor.fon@fon-chambers.cm",
        "secretary_email": "claudette.efange@fon-chambers.cm",
        "lawyers": [
            ("natalie.likowo@fon-chambers.cm",    "partner"),
            ("benedict.nde@fon-chambers.cm",      "partner"),
            ("josephine.ngole@fon-chambers.cm",   "associate"),
            ("titus.oben@fon-chambers.cm",        "associate"),
            ("miriam.egbe@fon-chambers.cm",       "associate"),
            ("godwill.ebob@fon-chambers.cm",      "associate"),
            ("irene.arrey@fon-chambers.cm",       "guest"),
        ],
        "circuit": "Southwest",
    },
    {
        "name": "Mbah & Co. Solicitors",
        "city": "Yaoundé",
        "description": "Boutique solicitors firm specialising in tax advisory, estate planning and francophone civil litigation.",
        "office_address": "Quartier Bastos, Yaoundé",
        "specializations": ["Tax Law", "Family Law", "Civil Litigation"],
        "year_established": 2012,
        "contact_email": "solicitors@mbah-co.cm",
        "owner_email": "jean.mbah@mbah-co.cm",
        "secretary_email": "madeleine.tsafack@mbah-co.cm",
        "lawyers": [
            ("nicole.feudjio@mbah-co.cm",         "partner"),
            ("olivier.nana@mbah-co.cm",           "partner"),
            ("helene.wabo@mbah-co.cm",            "associate"),
            ("theodore.kamga@mbah-co.cm",         "associate"),
            ("sylvie.dongmo@mbah-co.cm",          "associate"),
            ("alain.tchiakam@mbah-co.cm",         "associate"),
            ("flora.kemdjio@mbah-co.cm",          "associate"),
            ("jean-claude.kengni@mbah-co.cm",     "guest"),
        ],
        "circuit": "Centre",
    },
    {
        "name": "Nguele Legal Associates",
        "city": "Douala",
        "description": "Douala-based firm with deep expertise in intellectual property, technology law and corporate compliance.",
        "office_address": "Rue des Palmiers, Bonanjo, Douala",
        "specializations": ["Intellectual Property", "Corporate Law", "Tax Law"],
        "year_established": 2015,
        "contact_email": "legal@nguele-legal.cm",
        "owner_email": "pierre.nguele@nguele-legal.cm",
        "secretary_email": "francoise.mbono@nguele-legal.cm",
        "lawyers": [
            ("carine.nzamba@nguele-legal.cm",     "partner"),
            ("denis.bilong@nguele-legal.cm",      "partner"),
            ("vanessa.owona@nguele-legal.cm",     "associate"),
            ("gaston.mvondo@nguele-legal.cm",     "associate"),
            ("aline.etoundi@nguele-legal.cm",     "associate"),
            ("thierry.ondoua@nguele-legal.cm",    "associate"),
            ("nadege.zoa@nguele-legal.cm",        "associate"),
            ("marc.nkoulou@nguele-legal.cm",      "guest"),
        ],
        "circuit": "Littoral",
    },
    {
        "name": "Atangana Partners",
        "city": "Yaoundé",
        "description": "Constitutional and public-law specialists advising government agencies and civil society organisations.",
        "office_address": "Avenue Kennedy, Yaoundé",
        "specializations": ["Constitutional Law", "Civil Litigation", "Labor Law"],
        "year_established": 2003,
        "contact_email": "partners@atangana-partners.cm",
        "owner_email": "henri.atangana@atangana-partners.cm",
        "secretary_email": "veronique.bela@atangana-partners.cm",
        "lawyers": [
            ("laure.messi@atangana-partners.cm",    "partner"),
            ("serge.ekani@atangana-partners.cm",    "partner"),
            ("martine.essama@atangana-partners.cm", "associate"),
            ("igor.mbana@atangana-partners.cm",     "associate"),
            ("rose.obam@atangana-partners.cm",      "associate"),
            ("christian.akono@atangana-partners.cm","associate"),
            ("fabiola.bindzi@atangana-partners.cm", "associate"),
            ("arnaud.abe@atangana-partners.cm",     "associate"),
            ("judith.nkodo@atangana-partners.cm",   "guest"),
        ],
        "circuit": "Centre",
    },
    {
        "name": "Oben Law Firm",
        "city": "Limbe",
        "description": "Coastal firm serving the Fako Division with expertise in maritime, environmental and property law.",
        "office_address": "Down Beach Road, Limbe",
        "specializations": ["Real Estate Law", "Civil Litigation", "Criminal Law"],
        "year_established": 2007,
        "contact_email": "info@oben-law.cm",
        "owner_email": "thomas.oben@oben-law.cm",
        "secretary_email": "nathaniel.molo@oben-law.cm",
        "lawyers": [
            ("helen.mbongo@oben-law.cm",          "partner"),
            ("augustin.epale@oben-law.cm",        "partner"),
            ("claire.ikome@oben-law.cm",          "associate"),
            ("innocent.njie@oben-law.cm",         "associate"),
            ("sandra.endeley@oben-law.cm",        "associate"),
            ("eric.lifanda@oben-law.cm",          "associate"),
            ("priscilla.epie@oben-law.cm",        "guest"),
        ],
        "circuit": "Southwest",
    },
    {
        "name": "Kue & Associates",
        "city": "Bafoussam",
        "description": "Western Cameroon's go-to firm for commercial disputes, family succession and agribusiness law.",
        "office_address": "Carrefour Touristique, Bafoussam",
        "specializations": ["Corporate Law", "Family Law", "Real Estate Law"],
        "year_established": 2011,
        "contact_email": "info@kue-associates.cm",
        "owner_email": "desire.kue@kue-associates.cm",
        "secretary_email": "emilienne.pokam@kue-associates.cm",
        "lawyers": [
            ("ines.feudjio@kue-associates.cm",    "partner"),
            ("armand.kamga@kue-associates.cm",    "partner"),
            ("pauline.fotso@kue-associates.cm",   "associate"),
            ("frederic.tene@kue-associates.cm",   "associate"),
            ("alphonsine.nzeugang@kue-associates.cm", "associate"),
            ("blaise.djoumbe@kue-associates.cm",  "associate"),
            ("raissa.tagne@kue-associates.cm",    "associate"),
            ("christophe.tcheumi@kue-associates.cm","guest"),
        ],
        "circuit": "West",
    },
    {
        "name": "Essomba Chambers",
        "city": "Yaoundé",
        "description": "Multi-practice chambers handling criminal appeals, corporate restructuring and international arbitration.",
        "office_address": "Rue Joseph Mballa Elounden, Yaoundé",
        "specializations": ["Criminal Law", "Corporate Law", "Civil Litigation"],
        "year_established": 2000,
        "contact_email": "chambers@essomba-chambers.cm",
        "owner_email": "jean-marie.essomba@essomba-chambers.cm",
        "secretary_email": "marthe.edzoa@essomba-chambers.cm",
        "lawyers": [
            ("annie.minkoulou@essomba-chambers.cm",    "partner"),
            ("stephane.mbarga@essomba-chambers.cm",    "partner"),
            ("georgette.ondo@essomba-chambers.cm",     "associate"),
            ("francois.abomo@essomba-chambers.cm",     "associate"),
            ("marceline.efoa@essomba-chambers.cm",     "associate"),
            ("celestin.ngoue@essomba-chambers.cm",     "associate"),
            ("therese.ateba@essomba-chambers.cm",      "associate"),
            ("leopold.engolo@essomba-chambers.cm",     "associate"),
        ],
        "circuit": "Centre",
    },
]

PRIVATE_LAWYERS = [
    ("solo.nkemdirim@lawbridge.cm",   "Solo Nkemdirim",   "Criminal Law",         "Northwest", 0),
    ("amara.diallo@lawbridge.cm",     "Amara Diallo",     "Family Law",           "Littoral",  1),
    ("yves.nkouandou@lawbridge.cm",   "Yves Nkouandou",   "Corporate Law",        "Centre",    2),
    ("cecile.fotso@lawbridge.cm",     "Cécile Fotso",     "Immigration Law",      "West",      3),
    ("boris.njoya@lawbridge.cm",      "Boris Njoya",      "Intellectual Property","Littoral",  4),
]


def get_auth_uuid(email):
    """Fetch the UUID of a user from auth_db by email."""
    db_host = os.environ.get("DB_HOST", "postgres")
    db_password = os.environ.get("DB_PASSWORD", "")
    conn = psycopg2.connect(
        host=db_host, port=5432,
        dbname="auth_db", user="lawbridge_user", password=db_password,
    )
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM users_user WHERE email = %s", (email,))
        row = cur.fetchone()
        return str(row[0]) if row else None
    finally:
        conn.close()


def get_or_create_local_user(email):
    """Get or create the lawyer-service's local Django user by email."""
    user, _ = User.objects.get_or_create(
        username=email,
        defaults={"email": email},
    )
    return user


def make_bar_number(idx):
    return f"CMR-BAR-{1000 + idx:04d}"


class Command(BaseCommand):
    help = "Seed lawyer_db with firms, lawyer profiles, and memberships"

    def handle(self, *args, **options):
        profile_idx = 0
        summary = []

        for fi, firm_data in enumerate(FIRMS_DATA):
            # Create firm
            firm, _ = Firm.objects.get_or_create(
                name=firm_data["name"],
                defaults={
                    "city": firm_data["city"],
                    "description": firm_data["description"],
                    "office_address": firm_data["office_address"],
                    "specializations": firm_data["specializations"],
                    "year_established": firm_data["year_established"],
                    "contact_email": firm_data["contact_email"],
                    "country": "Cameroon",
                },
            )

            # Partnership policy
            FirmPartnershipPolicy.objects.get_or_create(
                firm=firm,
                defaults={
                    "is_open": True,
                    "min_years_experience": 3,
                    "revenue_share_percentage": 50,
                },
            )

            self.stdout.write(f"\n[Firm {fi+1}] {firm.name} — {firm.city}")

            # Owner
            owner_email = firm_data["owner_email"]
            owner_local = get_or_create_local_user(owner_email)
            owner_uuid = get_auth_uuid(owner_email)

            FirmMembership.objects.get_or_create(
                user=owner_local,
                firm=firm,
                defaults={
                    "role": "owner",
                    "invited_email": owner_email,
                    "accepted_at": timezone.now(),
                    "is_active": True,
                    "user_uuid": owner_uuid,
                },
            )

            if not LawyerProfile.objects.filter(user_id=owner_uuid).exists() and owner_uuid:
                spec = firm_data["specializations"][0]
                LawyerProfile.objects.create(
                    user_id=owner_uuid,
                    full_name=owner_local.email.split("@")[0].replace(".", " ").title(),
                    specialization=spec,
                    bar_number=make_bar_number(profile_idx),
                    years_of_experience=15 + (fi % 5),
                    bijural_flag="both",
                    consultation_fee=30000 + fi * 5000,
                    procedural_fee=10000,
                    professional_fee=50000,
                    practice_circuit=firm_data["circuit"],
                    accepted_case_types=",".join(firm_data["specializations"]),
                    availability_status="available",
                    qualifications=f"LLB, LLM — Bar of Cameroon. Senior Partner at {firm.name}.",
                    bio=f"Founding partner of {firm.name} with over {15 + (fi % 5)} years of practice.",
                )
            profile_idx += 1
            self.stdout.write(f"  ✓ Owner: {owner_email}")

            # Secretary
            sec_email = firm_data["secretary_email"]
            sec_local = get_or_create_local_user(sec_email)
            sec_uuid = get_auth_uuid(sec_email)
            FirmMembership.objects.get_or_create(
                user=sec_local,
                firm=firm,
                defaults={
                    "role": "firm_admin",
                    "invited_email": sec_email,
                    "accepted_at": timezone.now(),
                    "is_active": True,
                    "user_uuid": sec_uuid,
                },
            )
            self.stdout.write(f"  ✓ Secretary: {sec_email}")

            # Associate / partner lawyers
            for email, mem_role in firm_data["lawyers"]:
                local_user = get_or_create_local_user(email)
                auth_uuid = get_auth_uuid(email)

                FirmMembership.objects.get_or_create(
                    user=local_user,
                    firm=firm,
                    defaults={
                        "role": mem_role,
                        "invited_email": email,
                        "accepted_at": timezone.now(),
                        "is_active": True,
                        "user_uuid": auth_uuid,
                    },
                )

                spec_idx = profile_idx % len(SPECIALIZATIONS)
                if not LawyerProfile.objects.filter(user_id=auth_uuid).exists() and auth_uuid:
                    exp = 2 + (profile_idx % 12)
                    LawyerProfile.objects.create(
                        user_id=auth_uuid,
                        full_name=email.split("@")[0].replace(".", " ").title(),
                        specialization=SPECIALIZATIONS[spec_idx],
                        bar_number=make_bar_number(profile_idx),
                        years_of_experience=exp,
                        bijural_flag=["common_law", "civil_law", "both"][profile_idx % 3],
                        consultation_fee=15000 + (profile_idx % 10) * 3000,
                        procedural_fee=5000,
                        professional_fee=25000,
                        practice_circuit=firm_data["circuit"],
                        accepted_case_types=CASE_TYPES[spec_idx],
                        availability_status="available",
                        qualifications=f"LLB — Bar of Cameroon. {mem_role.title()} at {firm.name}.",
                        bio=f"{mem_role.title()} at {firm.name}, specialising in {SPECIALIZATIONS[spec_idx]}.",
                    )
                profile_idx += 1
                self.stdout.write(f"  ✓ {mem_role.title()}: {email}")

            summary.append(firm.name)

        # Private lawyers
        self.stdout.write("\n[Private Lawyers]")
        for email, name, spec, circuit, pidx in PRIVATE_LAWYERS:
            auth_uuid = get_auth_uuid(email)
            if not LawyerProfile.objects.filter(user_id=auth_uuid).exists() and auth_uuid:
                LawyerProfile.objects.create(
                    user_id=auth_uuid,
                    full_name=name,
                    specialization=spec,
                    bar_number=make_bar_number(profile_idx + pidx),
                    years_of_experience=3 + pidx * 2,
                    bijural_flag=["common_law", "civil_law", "both"][pidx % 3],
                    consultation_fee=20000 + pidx * 5000,
                    procedural_fee=5000,
                    professional_fee=30000,
                    practice_circuit=circuit,
                    accepted_case_types=spec.lower().replace(" ", "_"),
                    availability_status="available",
                    qualifications=f"LLB — Bar of Cameroon. Independent practitioner.",
                    bio=f"Independent lawyer specialising in {spec}. Open to firm invitations.",
                )
            self.stdout.write(f"  ✓ {name} ({spec})")

        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Seeded {len(FIRMS_DATA)} firms and {profile_idx} lawyer profiles.\n"
        ))
