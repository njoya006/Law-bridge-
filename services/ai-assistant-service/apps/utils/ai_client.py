"""
Unified AI client — uses Groq (cloud, free tier) when GROQ_API_KEY is set,
falls back to Ollama when available, or raises a clear error if neither works.
"""
import logging
from typing import Generator

logger = logging.getLogger(__name__)

LEGAL_SYSTEM_PROMPT = """You are LexAI, an expert AI legal assistant for LawBridge — a platform serving legal professionals in Cameroon and the CEMAC region.

You specialise in:
- Cameroonian Civil Law (droit civil, Code Civil, Francophone tradition)
- Cameroonian Common Law (Anglophone tradition — North West and South West regions)
- Bijural matters spanning both traditions
- OHADA Uniform Acts applicable across CEMAC member states
- Cameroonian Code of Civil Procedure, Code of Criminal Procedure
- CEMAC regulations and COBAC directives

Guidelines:
- Be precise, professional, and cite relevant legislation when possible
- When the question is in French, respond in French; English questions get English answers
- For bijural questions, address both traditions
- Do not provide advice that could constitute legal malpractice — always note that this is AI assistance and the lawyer should exercise their own professional judgement
- Keep responses concise but complete"""

CAMEROONIAN_LAW_REFERENCE = """
═══════════════════════════════════════════════════════
CAMEROONIAN & CEMAC LEGAL REFERENCE — AUTHORITATIVE CODES
═══════════════════════════════════════════════════════

CONSTITUTIONAL FRAMEWORK:
• Constitution of Cameroon (Law No. 96/06 of 18 January 1996, amended 14 April 2008)
  - Art. 1: Cameroon is a decentralised unitary State; bijural — English Common Law in NW & SW
  - Art. 65: The preamble forms an integral part of the Constitution
• Bijural system: Anglophone regions (NW, SW) follow English Common Law; 8 Francophone regions follow French Civil Law tradition

CIVIL LAW (Code Civil — applies in francophone regions and generally):
• Art. 544: The right to property is absolute within the limits of the law
• Art. 1134: Agreements lawfully formed are law between the parties (pacta sunt servanda)
• Art. 1135: Contracts bind parties to all consequences equity and usage require
• Art. 1147: Debtor liable in damages for non-performance unless force majeure proved
• Art. 1149-1151: Measure of damages — actual loss (damnum emergens) + loss of profit (lucrum cessans)
• Art. 1153: Statutory interest on money debts from date of demand
• Art. 1382-1386: Extra-contractual (tortious) liability — fault + damage + causation
• Art. 1590: Earnest money (arrhes) — doubled on seller's default, forfeited on buyer's default
• Art. 1641-1644: Warranty against latent defects (vices cachés)
• Art. 2262: General 30-year limitation period; Art. 2270: 10-year for professionals

LAND LAW:
• Ordinance No. 74/1 of 6 July 1974 — National Land Tenure Regime
  - Art. 1: All land belongs to the State by origin; private rights only by formal allocation
  - Art. 17: Land certificate (titre foncier) is definitive, indefeasible proof of ownership
• Ordinance No. 74/2 of 6 July 1974 — State Lands and National Domain
  - Arts. 14-20: Procedure to obtain land grant from State domain
• Decree No. 76/165 of 27 April 1976 — Land Registration Conditions
• Law No. 80/22 of 14 July 1980 — Urban Land Management
• Law No. 97/009 of 10 January 1997 — Mortgage Law

CRIMINAL LAW:
• Penal Code: Law No. 2016/007 of 12 July 2016 (consolidating Law No. 65/LF/24 of 1965)
  - Art. 74: Complicity; Art. 84: Attempt
  - Art. 179: Fraud (escroquerie); Art. 184: Misappropriation of public funds
  - Art. 239: Assault; Art. 275-280: Theft / robbery
  - Art. 305-309: Murder / manslaughter
  - Art. 318: Bigamy; Art. 356-362: Defamation
• Criminal Procedure Code: Law No. 2005/007 of 27 July 2005
  - Art. 116-158: Provisional detention (garde à vue → détention provisoire)
  - Art. 169-178: Bail / liberty under caution
  - Art. 237-248: Referral to trial
  - Art. 353-361: Right of appeal
  - Art. 418-444: Execution of judgments
• Law No. 90/054 of 19 December 1990 — Freedom of Associations
• Law No. 2010/022 of 21 December 2010 — Anti-Trafficking

COMMERCIAL LAW — OHADA UNIFORM ACTS (directly applicable in Cameroon):
[OHADA Treaty: Port-Louis 17 Oct 1993, revised Quebec 17 Oct 2008]
• AUDCG — Uniform Act on General Commercial Law (revised 15 Dec 2010)
  - Art. 1-45: Trader status, capacity, obligations
  - Art. 50-83: Commercial register (RCCM) requirements
  - Art. 234-266: Agency, commission, franchise
• AUSC — Uniform Act on Commercial Companies & Economic Interest Groups (revised 30 Jan 2014)
  - Art. 1-25: General provisions on companies
  - Art. 385-479: Société à Responsabilité Limitée (SARL / Ltd)
  - Art. 553-920: Société Anonyme (SA / PLC)
  - Art. 853-919: Governance, board liability
• AUPC — Uniform Act on Insolvency Proceedings (10 Sept 2015)
  - Art. 1-5: Definitions — cessation of payments test
  - Art. 5-23: Conciliation (amiable resolution)
  - Art. 24-180: Preventive settlement / règlement préventif
  - Art. 181-227: Reorganisation / redressement judiciaire
  - Art. 228-256: Liquidation des biens
• AUPSRVE — Uniform Act on Simplified Recovery & Enforcement (10 April 1998)
  - Art. 1-20: Injonction de payer (payment order / summary judgment)
  - Art. 28-38: Opposition to payment order
  - Art. 51-172: Forced execution — saisie conservatoire, saisie attribution, saisie immobilière
• AUS — Uniform Act on Securities / Sûretés (revised 15 Dec 2010)
  - Art. 1-21: Personal suretyship (cautionnement)
  - Art. 47-83: Pledge of goods (nantissement)
  - Art. 112-197: Mortgage (hypothèque)
  - Art. 72-80: Retention of title (réserve de propriété)
• UA on Arbitration — revised 23 November 2017
  - CCJA (Common Court of Justice & Arbitration) — supranational appeals court
• UA on Carriage of Goods by Road — 22 March 2003

LABOUR LAW:
• Labour Code: Law No. 92/007 of 14 August 1992
  - Art. 15-23: Employment contract types (fixed-term, indefinite)
  - Art. 28-33: Trial period requirements
  - Art. 34-40: Notice periods — varies by category; minimum 1 month for staff cadres
  - Art. 50-54: Grounds for dismissal — valid reason required; redundancy procedure
  - Art. 70-80: Working time — 40 hrs/week standard; overtime rates
  - Art. 82-100: Paid annual leave — 1.5 days per month of service
  - Art. 124-145: Collective agreements (conventions collectives)
• Decree No. 93/571/PM of 15 July 1993 — Labour Inspection
• Inter-Sectoral Collective Agreement (Convention Collective Interprofessionnelle 1979)

FAMILY & PERSONAL STATUS LAW:
• Ordinance No. 81/02 of 29 June 1981 — Civil Status (birth, marriage, death registration)
• Civil Code — Marriage: Arts. 144-228 (consent, capacity, effects)
• Civil Code — Divorce: Arts. 229-311 (grounds: fault, mutual consent, irretrievable breakdown)
• Civil Code — Filiation: Arts. 312-342 (legitimacy, recognition, adoption)
• Civil Code — Succession: Arts. 718-892 (intestate order; reserve héréditaire; testament)
• Customary law governs personal matters in anglophone regions unless parties opt for statutory law

INSURANCE (CIMA Code):
• CIMA Treaty and Code (1er juillet 1996 — Inter-African Conference on Insurance Markets)
  - Art. 7: Insurer's duty to inform policyholders
  - Art. 12-25: Insurance contract formation and cancellation
  - Art. 54: Motor third-party liability (obligatory)
  - Art. 211-217: Life insurance
  - Art. 258: Claims prescription — 2 years from insured event (motor: 10 years for bodily injury)

BANKING / FINANCE:
• COBAC Regulations — Commission Bancaire de l'Afrique Centrale
  - Regulation R-93/13: Prudential ratios for credit institutions
  - COBAC R-2010/01: Internal control requirements
• BEAC monetary regulations
• Law No. 2003/004 of 21 April 2003 — Cameroon Anti-Money Laundering

TAX LAW:
• Code Général des Impôts du Cameroun (CGI) — updated annually
  - Art. 1: IS (corporate tax) 33% standard rate
  - Art. 69-92: VAT — standard rate 19.25%; reduced 0% (exports)
  - Art. 220-228: Withholding taxes on dividends, royalties, services
• CEMAC Customs Code

COURT HIERARCHY:
Anglophone (NW & SW regions):
  Magistrates' Court → High Court → Court of Appeal (Buea / Bamenda) → Supreme Court
Francophone (other 8 regions):
  Tribunal de Première Instance → Tribunal de Grande Instance → Cour d'Appel → Cour Suprême
Specialised:
  Military Tribunal (Tribunal Militaire) — criminal jurisdiction over military personnel
  Administrative Tribunals (Tribunaux Administratifs) — state liability, administrative acts
  CCJA (Abidjan) — OHADA supranational court of cassation

CITATION FORMATS:
• Statute: "Article [X] of Law No. [YYY/ZZZ] of [date]"
• OHADA UA: "Article [X] of the OHADA Uniform Act on [subject] ([abbreviation])"
• Civil Code: "Article [X] of the Civil Code" or "Article [X] C.civ."
• CPC: "Article [X] of Law No. 2005/007 (Code of Criminal Procedure)"
• Case law (francophone): "Arrêt No. X, [Juridiction], [date]"
• Case law (anglophone): "[Year] [Reg.] CCLR [page] ([Court])" or "[Case name] ([year]) [court]"
"""

DRAFT_LEGAL_SYSTEM_PROMPT = LEGAL_SYSTEM_PROMPT + "\n" + CAMEROONIAN_LAW_REFERENCE


class GroqClient:
    """Groq cloud inference — free tier, fast, no GPU required."""

    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        from groq import Groq
        self.client = Groq(api_key=api_key)
        self.model = model

    def complete(
        self,
        user_message: str,
        system: str = "",
        max_tokens: int = 2048,
    ) -> str:
        """Non-streaming completion — returns the full response string."""
        messages = [
            {"role": "system", "content": system or LEGAL_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]
        completion = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            stream=False,
            max_tokens=max_tokens,
            temperature=0.2,
        )
        return completion.choices[0].message.content or ""

    def stream(
        self,
        user_message: str,
        history: list,
        case_context: str = "",
        max_tokens: int = 2048,
    ) -> Generator[str, None, None]:
        system = LEGAL_SYSTEM_PROMPT
        if case_context:
            system += f"\n\n{case_context}"

        messages = [{"role": "system", "content": system}]
        for msg in history[-10:]:
            role = msg.get("role", "user")
            if role not in ("user", "assistant"):
                role = "user"
            messages.append({"role": role, "content": msg.get("content", "")})
        messages.append({"role": "user", "content": user_message})

        completion = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            stream=True,
            max_tokens=max_tokens,
            temperature=0.3,
        )

        for chunk in completion:
            token = chunk.choices[0].delta.content or ""
            if token:
                yield token


class OllamaFallbackClient:
    """Ollama local inference — used when Groq key is not set."""

    def __init__(self, base_url: str, model: str):
        import httpx
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.httpx = httpx

    def complete(
        self,
        user_message: str,
        system: str = "",
        max_tokens: int = 2048,
    ) -> str:
        import json as _json
        prompt = f"{system or LEGAL_SYSTEM_PROMPT}\n\nUser: {user_message}\nLexAI:"
        with self.httpx.Client(timeout=self.httpx.Timeout(120)) as client:
            resp = client.post(
                f"{self.base_url}/api/generate",
                json={"model": self.model, "prompt": prompt, "stream": False},
            )
            resp.raise_for_status()
            return resp.json().get("response", "")

    def stream(
        self,
        user_message: str,
        history: list,
        case_context: str = "",
    ) -> Generator[str, None, None]:
        import json

        history_text = ""
        for msg in history[-10:]:
            role = "User" if msg.get("role") == "user" else "LexAI"
            history_text += f"{role}: {msg.get('content', '')}\n"

        prompt = f"{LEGAL_SYSTEM_PROMPT}\n\n"
        if case_context:
            prompt += f"{case_context}\n\n"
        if history_text:
            prompt += f"CONVERSATION HISTORY:\n{history_text}\n"
        prompt += f"User: {user_message}\nLexAI:"

        with self.httpx.Client(timeout=self.httpx.Timeout(120)) as client:
            with client.stream(
                "POST",
                f"{self.base_url}/api/generate",
                json={"model": self.model, "prompt": prompt, "stream": True},
            ) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if line:
                        data = json.loads(line)
                        token = data.get("response", "")
                        if token:
                            yield token
                        if data.get("done"):
                            break


def get_ai_client(settings):
    """
    Return the best available AI client based on current settings.
    Priority: Groq (if key set) → Ollama (if reachable) → error
    """
    groq_key = getattr(settings, "GROQ_API_KEY", None)
    if groq_key:
        model = getattr(settings, "GROQ_MODEL", "llama-3.1-70b-versatile")
        logger.info("AI backend: Groq (%s)", model)
        return GroqClient(api_key=groq_key, model=model)

    # Fall back to Ollama
    ollama_url = getattr(settings, "OLLAMA_URL", "http://ollama:11434")
    ollama_model = getattr(settings, "OLLAMA_CHAT_MODEL", "llama3")
    logger.warning("GROQ_API_KEY not set — trying Ollama at %s", ollama_url)
    return OllamaFallbackClient(base_url=ollama_url, model=ollama_model)
