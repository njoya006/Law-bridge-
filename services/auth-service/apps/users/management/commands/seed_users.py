"""
Seed the auth_db with test users: lawyers, secretaries, and clients.
Run: python manage.py seed_users
"""
from django.core.management.base import BaseCommand
from apps.users.models import User

PASSWORD = "LawBridge@2024"

# (email, full_name, role)
USERS = [
    # ── Firm 1: Nji & Associates ──────────────────────────────────────────────
    ("emmanuel.nji@nji-associates.cm",     "Emmanuel Nji",          "lawyer"),
    ("grace.foncha@nji-associates.cm",     "Grace Foncha",          "lawyer"),
    ("kevin.tambe@nji-associates.cm",      "Kevin Tambe",           "lawyer"),
    ("rita.ngwa@nji-associates.cm",        "Rita Ngwa",             "lawyer"),
    ("pascal.mbah@nji-associates.cm",      "Pascal Mbah",           "lawyer"),
    ("linda.fon@nji-associates.cm",        "Linda Fon",             "lawyer"),
    ("samuel.nkeng@nji-associates.cm",     "Samuel Nkeng",          "lawyer"),
    ("alice.bih@nji-associates.cm",        "Alice Bih",             "lawyer"),
    ("felix.atanga@nji-associates.cm",     "Felix Atanga",          "lawyer"),
    ("divine.tabi@nji-associates.cm",      "Divine Tabi",           "lawyer"),
    ("celine.akama@nji-associates.cm",     "Celine Akama",          "secretary"),

    # ── Firm 2: Biya Law Partners ─────────────────────────────────────────────
    ("paul.biya@biya-law.cm",             "Paul Biya Jr.",          "lawyer"),
    ("michelle.tchouake@biya-law.cm",     "Michelle Tchouaké",      "lawyer"),
    ("boris.mbida@biya-law.cm",           "Boris Mbida",            "lawyer"),
    ("christiane.ngom@biya-law.cm",       "Christiane Ngom",        "lawyer"),
    ("edmond.eto@biya-law.cm",            "Edmond Eto",             "lawyer"),
    ("anne.mfoumou@biya-law.cm",          "Anne Mfoumou",           "lawyer"),
    ("stephane.zang@biya-law.cm",         "Stéphane Zang",          "lawyer"),
    ("beatrice.ongolo@biya-law.cm",       "Béatrice Ongolo",        "lawyer"),
    ("richard.abesso@biya-law.cm",        "Richard Abesso",         "lawyer"),
    ("sophie.minkoe@biya-law.cm",         "Sophie Minkoé",          "secretary"),

    # ── Firm 3: Tanyi Law Group ───────────────────────────────────────────────
    ("charles.tanyi@tanyi-law.cm",        "Charles Tanyi",          "lawyer"),
    ("eunice.wirba@tanyi-law.cm",         "Eunice Wirba",           "lawyer"),
    ("nfor.nkum@tanyi-law.cm",            "Nfor Nkum",              "lawyer"),
    ("veronica.che@tanyi-law.cm",         "Veronica Che",           "lawyer"),
    ("andrew.wung@tanyi-law.cm",          "Andrew Wung",            "lawyer"),
    ("patience.mbah@tanyi-law.cm",        "Patience Mbah",          "lawyer"),
    ("jerome.njikam@tanyi-law.cm",        "Jérôme Njikam",          "lawyer"),
    ("esther.bongfen@tanyi-law.cm",       "Esther Bongfen",         "lawyer"),
    ("humphrey.ndeh@tanyi-law.cm",        "Humphrey Ndeh",          "lawyer"),
    ("gladys.ndi@tanyi-law.cm",           "Gladys Ndi",             "lawyer"),
    ("brigitte.fondop@tanyi-law.cm",      "Brigitte Fondop",        "secretary"),

    # ── Firm 4: Fon Chambers ─────────────────────────────────────────────────
    ("victor.fon@fon-chambers.cm",        "Victor Fon",             "lawyer"),
    ("natalie.likowo@fon-chambers.cm",    "Natalie Likowo",         "lawyer"),
    ("benedict.nde@fon-chambers.cm",      "Benedict Nde",           "lawyer"),
    ("josephine.ngole@fon-chambers.cm",   "Joséphine Ngole",        "lawyer"),
    ("titus.oben@fon-chambers.cm",        "Titus Oben",             "lawyer"),
    ("miriam.egbe@fon-chambers.cm",       "Miriam Egbe",            "lawyer"),
    ("godwill.ebob@fon-chambers.cm",      "Godwill Ebob",           "lawyer"),
    ("irene.arrey@fon-chambers.cm",       "Irene Arrey",            "lawyer"),
    ("claudette.efange@fon-chambers.cm",  "Claudette Efange",       "secretary"),

    # ── Firm 5: Mbah & Co. Solicitors ────────────────────────────────────────
    ("jean.mbah@mbah-co.cm",              "Jean Mbah",              "lawyer"),
    ("nicole.feudjio@mbah-co.cm",         "Nicole Feudjio",         "lawyer"),
    ("olivier.nana@mbah-co.cm",           "Olivier Nana",           "lawyer"),
    ("helene.wabo@mbah-co.cm",            "Hélène Wabo",            "lawyer"),
    ("theodore.kamga@mbah-co.cm",         "Théodore Kamga",         "lawyer"),
    ("sylvie.dongmo@mbah-co.cm",          "Sylvie Dongmo",          "lawyer"),
    ("alain.tchiakam@mbah-co.cm",         "Alain Tchiakam",         "lawyer"),
    ("flora.kemdjio@mbah-co.cm",          "Flora Kemdjio",          "lawyer"),
    ("jean-claude.kengni@mbah-co.cm",     "Jean-Claude Kengni",     "lawyer"),
    ("madeleine.tsafack@mbah-co.cm",      "Madeleine Tsafack",      "secretary"),

    # ── Firm 6: Nguele Legal Associates ──────────────────────────────────────
    ("pierre.nguele@nguele-legal.cm",     "Pierre Nguélé",          "lawyer"),
    ("carine.nzamba@nguele-legal.cm",     "Carine Nzamba",          "lawyer"),
    ("denis.bilong@nguele-legal.cm",      "Denis Bilong",           "lawyer"),
    ("vanessa.owona@nguele-legal.cm",     "Vanessa Owona",          "lawyer"),
    ("gaston.mvondo@nguele-legal.cm",     "Gaston Mvondo",          "lawyer"),
    ("aline.etoundi@nguele-legal.cm",     "Aline Etoundi",          "lawyer"),
    ("thierry.ondoua@nguele-legal.cm",    "Thierry Ondoua",         "lawyer"),
    ("nadege.zoa@nguele-legal.cm",        "Nadège Zoa",             "lawyer"),
    ("marc.nkoulou@nguele-legal.cm",      "Marc Nkoulou",           "lawyer"),
    ("francoise.mbono@nguele-legal.cm",   "Françoise Mbono",        "secretary"),

    # ── Firm 7: Atangana Partners ─────────────────────────────────────────────
    ("henri.atangana@atangana-partners.cm", "Henri Atangana",       "lawyer"),
    ("laure.messi@atangana-partners.cm",    "Laure Messi",          "lawyer"),
    ("serge.ekani@atangana-partners.cm",    "Serge Ekani",          "lawyer"),
    ("martine.essama@atangana-partners.cm", "Martine Essama",       "lawyer"),
    ("igor.mbana@atangana-partners.cm",     "Igor Mbana",           "lawyer"),
    ("rose.obam@atangana-partners.cm",      "Rose Obam",            "lawyer"),
    ("christian.akono@atangana-partners.cm","Christian Akono",      "lawyer"),
    ("fabiola.bindzi@atangana-partners.cm", "Fabiola Bindzi",       "lawyer"),
    ("arnaud.abe@atangana-partners.cm",     "Arnaud Abé",           "lawyer"),
    ("judith.nkodo@atangana-partners.cm",   "Judith Nkodo",         "lawyer"),
    ("veronique.bela@atangana-partners.cm", "Véronique Béla",       "secretary"),

    # ── Firm 8: Oben Law Firm ────────────────────────────────────────────────
    ("thomas.oben@oben-law.cm",           "Thomas Oben",            "lawyer"),
    ("helen.mbongo@oben-law.cm",          "Helen Mbongo",           "lawyer"),
    ("augustin.epale@oben-law.cm",        "Augustin Epalé",         "lawyer"),
    ("claire.ikome@oben-law.cm",          "Claire Ikome",           "lawyer"),
    ("innocent.njie@oben-law.cm",         "Innocent Njie",          "lawyer"),
    ("sandra.endeley@oben-law.cm",        "Sandra Endeley",         "lawyer"),
    ("eric.lifanda@oben-law.cm",          "Eric Lifanda",           "lawyer"),
    ("priscilla.epie@oben-law.cm",        "Priscilla Epie",         "lawyer"),
    ("nathaniel.molo@oben-law.cm",        "Nathaniel Molo",         "secretary"),

    # ── Firm 9: Kue & Associates ──────────────────────────────────────────────
    ("desire.kue@kue-associates.cm",      "Désiré Kue",             "lawyer"),
    ("ines.feudjio@kue-associates.cm",    "Inès Feudjio",           "lawyer"),
    ("armand.kamga@kue-associates.cm",    "Armand Kamga",           "lawyer"),
    ("pauline.fotso@kue-associates.cm",   "Pauline Fotso",          "lawyer"),
    ("frederic.tene@kue-associates.cm",   "Frédéric Tené",          "lawyer"),
    ("alphonsine.nzeugang@kue-associates.cm", "Alphonsine Nzeugang","lawyer"),
    ("blaise.djoumbe@kue-associates.cm",  "Blaise Djoumbé",         "lawyer"),
    ("raissa.tagne@kue-associates.cm",    "Raïssa Tagné",           "lawyer"),
    ("christophe.tcheumi@kue-associates.cm","Christophe Tcheumi",   "lawyer"),
    ("emilienne.pokam@kue-associates.cm", "Émilienne Pokam",        "secretary"),

    # ── Firm 10: Essomba Chambers ─────────────────────────────────────────────
    ("jean-marie.essomba@essomba-chambers.cm", "Jean-Marie Essomba","lawyer"),
    ("annie.minkoulou@essomba-chambers.cm",    "Annie Minkoulou",   "lawyer"),
    ("stephane.mbarga@essomba-chambers.cm",    "Stéphane Mbarga",   "lawyer"),
    ("georgette.ondo@essomba-chambers.cm",     "Georgette Ondo",    "lawyer"),
    ("francois.abomo@essomba-chambers.cm",     "François Abomo",    "lawyer"),
    ("marceline.efoa@essomba-chambers.cm",     "Marceline Efoa",    "lawyer"),
    ("celestin.ngoue@essomba-chambers.cm",     "Célestin Ngoue",    "lawyer"),
    ("therese.ateba@essomba-chambers.cm",      "Thérèse Ateba",     "lawyer"),
    ("leopold.engolo@essomba-chambers.cm",     "Léopold Engolo",    "lawyer"),
    ("marthe.edzoa@essomba-chambers.cm",       "Marthe Edzoa",      "secretary"),

    # ── Private Lawyers (no firm — for testing invitations) ───────────────────
    ("solo.nkemdirim@lawbridge.cm",       "Solo Nkemdirim",         "lawyer"),
    ("amara.diallo@lawbridge.cm",         "Amara Diallo",           "lawyer"),
    ("yves.nkouandou@lawbridge.cm",       "Yves Nkouandou",         "lawyer"),
    ("cecile.fotso@lawbridge.cm",         "Cécile Fotso",           "lawyer"),
    ("boris.njoya@lawbridge.cm",          "Boris Njoya",            "lawyer"),

    # ── Test Clients ─────────────────────────────────────────────────────────
    ("client.alpha@test.cm",              "Alpha Ndi",              "client"),
    ("client.beta@test.cm",               "Beta Muna",              "client"),
    ("client.gamma@test.cm",              "Gamma Tabi",             "client"),
    ("client.delta@test.cm",              "Delta Kome",             "client"),
    ("client.epsilon@test.cm",            "Epsilon Fru",            "client"),
]


class Command(BaseCommand):
    help = "Seed auth_db with test lawyers, secretaries, and clients"

    def handle(self, *args, **options):
        created, skipped = 0, 0

        for email, full_name, role in USERS:
            user, new = User.objects.get_or_create(
                email=email,
                defaults={"full_name": full_name, "role": role},
            )
            if new:
                user.set_password(PASSWORD)
                user.is_active = True
                user.save()
                created += 1
            else:
                skipped += 1

        self.stdout.write(self.style.SUCCESS(
            f"\nDone: {created} created, {skipped} already existed.\n"
            f"All users have password: {PASSWORD}\n"
        ))
