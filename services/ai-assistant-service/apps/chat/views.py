import json
import logging
from datetime import datetime

from django.conf import settings
from django.http import StreamingHttpResponse
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.renderers import JSONRenderer, BaseRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ChatSession, LegalDraft
from .serializers import ChatSessionSerializer
from apps.utils.ai_client import get_ai_client, LEGAL_SYSTEM_PROMPT, DRAFT_LEGAL_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class ServerSentEventRenderer(BaseRenderer):
    """Allows DRF content negotiation to accept Accept: text/event-stream."""
    media_type = 'text/event-stream'
    format = 'text'
    charset = 'utf-8'

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data


class ChatView(APIView):
    permission_classes = [IsAuthenticated]
    renderer_classes = [ServerSentEventRenderer, JSONRenderer]

    def post(self, request):
        user_message = request.data.get('message', '').strip()
        session_id = request.data.get('session_id')
        case_id = request.data.get('case_id')

        if not user_message:
            return Response({'error': 'Message is required'}, status=400)

        # Detect language
        language = 'en'
        try:
            from langdetect import detect
            detected = detect(user_message)
            language = 'fr' if detected == 'fr' else 'en'
        except Exception:
            pass

        # Determine portal from JWT role ('client' role -> client portal, everything else -> lawyer)
        portal = 'client' if (getattr(request.user, 'role', '') or '') == 'client' else 'lawyer'

        # Get or create session
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id, user_id=str(request.user.id), portal=portal)
            except ChatSession.DoesNotExist:
                return Response({'error': 'Session not found'}, status=404)
        else:
            session = ChatSession.objects.create(
                user_id=str(request.user.id),
                portal=portal,
                case_id=case_id,
                language=language,
                title=user_message[:60],
                messages=[],
            )

        # Append user message to history
        session.messages.append({
            'role': 'user',
            'content': user_message,
            'timestamp': datetime.utcnow().isoformat(),
        })
        session.save()

        # Optional case context from case-service
        case_context = ''
        if session.case_id:
            try:
                import requests as req
                r = req.get(
                    f"{settings.CASE_SERVICE_URL}/api/v1/cases/{session.case_id}/summary/",
                    headers={'X-Internal-Api-Key': getattr(settings, 'INTERNAL_API_KEY', '')},
                    timeout=4,
                )
                if r.status_code == 200:
                    d = r.json()
                    case_context = (
                        f"CASE CONTEXT:\nType: {d.get('case_type')} | "
                        f"Circuit: {d.get('circuit')} ({d.get('legal_tradition')}) | "
                        f"Status: {d.get('status')}\n"
                        f"Description: {str(d.get('description', ''))[:400]}"
                    )
            except Exception:
                pass

        def stream_response():
            yield f"data: {json.dumps({'session_id': str(session.id)})}\n\n"

            full_response = ''
            try:
                ai = get_ai_client(settings)
                for token in ai.stream(
                    user_message=user_message,
                    history=session.messages[:-1],  # exclude the message we just appended
                    case_context=case_context,
                ):
                    full_response += token
                    yield f"data: {json.dumps({'token': token})}\n\n"

                # Persist assistant reply
                session.messages.append({
                    'role': 'assistant',
                    'content': full_response,
                    'timestamp': datetime.utcnow().isoformat(),
                })
                session.save()
                yield f"data: {json.dumps({'done': True})}\n\n"

            except Exception as exc:
                logger.exception("AI generation error")
                err = str(exc)
                # Translate raw connection errors into friendly messages
                if 'Name or service not known' in err or 'Connection refused' in err or 'Connect call failed' in err:
                    friendly = (
                        "The AI model is not reachable right now. "
                        "Please contact support or try again later."
                    )
                elif 'api_key' in err.lower() or 'authentication' in err.lower():
                    friendly = "AI service is not configured yet. Contact your administrator."
                else:
                    friendly = f"AI error: {err}"
                yield f"data: {json.dumps({'error': friendly})}\n\n"

        response = StreamingHttpResponse(stream_response(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


class ChatSessionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        portal = 'client' if (getattr(request.user, 'role', '') or '') == 'client' else 'lawyer'
        sessions = ChatSession.objects.filter(user_id=str(request.user.id), portal=portal).values(
            'id', 'title', 'language', 'case_id', 'updated_at'
        )
        return Response(list(sessions))


class ChatSessionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        try:
            session = ChatSession.objects.get(id=session_id, user_id=str(request.user.id))
            return Response(ChatSessionSerializer(session).data)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

    def delete(self, request, session_id):
        try:
            session = ChatSession.objects.get(id=session_id, user_id=str(request.user.id))
            session.delete()
            return Response(status=204)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


DRAFT_TYPE_PROMPTS = {
    'letter_to_client': """
Draft a formal professional letter from a lawyer/law firm to a client.
Use the EXACT section markers below — fill every section completely:

[LETTERHEAD]
[Lawyer/Firm full name]
[Professional title — e.g. Avocat au Barreau du Cameroun / Barrister & Solicitor]
[Bar Registration No.]
[Full address]
[Tel / Email]
[/LETTERHEAD]
[DATE][Full date in format: 28 June 2026][/DATE]
[TO]
[Client full name]
[Client full address]
[/TO]
[REF]File No.: [reference][/REF]
[SUBJECT]RE: [SUBJECT IN CAPITALS][/SUBJECT]
[SALUTATION]Dear [Mr./Ms./Dr.] [Surname],[/SALUTATION]
[BODY]
Write 3–5 formal paragraphs. Open by identifying capacity and purpose.
State the legal position clearly. Where relevant, cite:
- Art. 1134 Civil Code (contractual obligations)
- Art. 1147-1151 Civil Code (non-performance and damages)
- Applicable OHADA UA or Land Law (Ordinance 74/1) where property is involved.
Close with a call to action or next step.
[/BODY]
[CLOSING]Yours faithfully,[/CLOSING]
[SIGNATURE]
[Full name]
[Title/Qualification]
[Bar/Roll Number]
[Firm Name if applicable]
[/SIGNATURE]
""",

    'demand_letter': """
Draft a formal demand letter / lettre de mise en demeure. This is a pre-litigation notice.
Use the EXACT section markers:

[LETTERHEAD]
[Lawyer/Firm name, bar number, address]
[/LETTERHEAD]
[DATE][Date][/DATE]
[TO]
[Opposing party full name and address]
[/TO]
[REF]File No.: [reference] — BY REGISTERED POST WITH ACKNOWLEDGEMENT[/REF]
[SUBJECT]RE: FORMAL DEMAND FOR [SUBJECT — e.g. PAYMENT OF XAF X / SPECIFIC PERFORMANCE][/SUBJECT]
[SALUTATION]Dear [Mr./Ms./Maître] [Surname],[/SALUTATION]
[BODY]
Paragraph 1 — Capacity: State you act for [client name] and the purpose.
Paragraph 2 — Background: Recite the facts establishing the obligation (contract date, terms, performance by your client).
Paragraph 3 — Breach: Detail the breach and failure to perform. Cite:
  • Art. 1134 C.civ. (binding force of contracts)
  • Art. 1147-1149 C.civ. (liability for non-performance, damages)
  • Art. 1153 C.civ. (statutory interest on money debts from date of formal demand)
  • For commercial debts: Art. 1-3 OHADA AUPSRVE (simplified recovery procedure / injonction de payer)
  • For dishonoured cheques: Art. 73 OHADA Uniform Act on Securities
Paragraph 4 — FORMAL DEMAND: Demand specific performance/payment of [amount + currency] within [X] days.
Paragraph 5 — Consequences: State that failure will result in immediate legal proceedings, costs, and interest at the legal rate, without further notice.
[/BODY]
[CLOSING]Yours faithfully,[/CLOSING]
[SIGNATURE]
[Lawyer name, title, bar no.]
[/SIGNATURE]
""",

    'letter_to_court': """
Draft a formal letter to the court from the lawyer on behalf of a client.
Use these markers:

[LETTERHEAD]
[Lawyer/Firm name, bar no., address]
[/LETTERHEAD]
[DATE][Date][/DATE]
[TO]
The Registrar / Le Greffier en Chef
[Full court name and address]
[/TO]
[REF]Suit No. / Dossier No.: [reference][/REF]
[SUBJECT]RE: [SUBJECT — e.g. REQUEST FOR ADJOURNMENT / FILING OF DOCUMENTS][/SUBJECT]
[SALUTATION]Dear Sir/Madam,[/SALUTATION]
[BODY]
Paragraph 1: Identify counsel, client, and the matter before the court.
Paragraph 2: State the specific request and grounds.
Paragraph 3: Where applicable cite:
  • Law No. 2005/007 CPC Arts. relevant to the procedural request
  • Civil Procedure Rules (anglophone) or NCPC provisions (francophone)
  • OHADA UA on Arbitration Art. X if arbitration-related
Paragraph 4: Attach list of documents if any.
[/BODY]
[CLOSING]Yours faithfully,[/CLOSING]
[SIGNATURE]
[Counsel name, title, bar no.]
Counsel for [Claimant/Defendant — name]
[/SIGNATURE]
""",

    'motion': """
Draft a formal legal motion / requête to be filed in court.
Structure EXACTLY as follows:

[COURT]
IN THE [HIGH COURT / TRIBUNAL DE GRANDE INSTANCE] OF CAMEROON
[Circuit / Jurisdiction] DIVISION
[/COURT]
[CASE_REF]
SUIT NO. / DOSSIER NO.: [reference]
[Title of suit: Claimant v. Defendant]
[/CASE_REF]
[PARTIES]
APPLICANT / REQUÉRANT: [Full name, address]
RESPONDENT / INTIMÉ: [Full name, address]
[/PARTIES]
[MOTION_TITLE]NOTICE OF MOTION / REQUÊTE EN [SUBJECT — e.g. PROVISIONAL MEASURES / RÉFÉRÉ][/MOTION_TITLE]
[PREAMBLE]
TAKE NOTICE that [Applicant name], by Counsel, moves this Honourable Court on [date] or soon thereafter for the following Orders:
[/PREAMBLE]
[BODY]
GROUNDS:
1. [Factual background — chronologically stated]
2. [Legal basis — cite specifically:]
   • Art. [X] Law No. 2005/007 CPC (procedure, evidence, enforcement)
   • Art. [X] Civil Code (substantive right asserted)
   • Art. [X] OHADA UA [name] (if commercial matter)
   • Ordinance No. 74/1 1974 (if land matter)
3. [The Applicant will suffer irreparable harm / is entitled to judgment as a matter of law because…]
[/BODY]
[PRAYER]
WHEREFORE, the Applicant respectfully prays that this Honourable Court grant:
1. [Specific order 1]
2. [Specific order 2]
3. Costs of this application be borne by the Respondent.
4. Such further relief as this Court may deem just and equitable.
[/PRAYER]
[DATE]Dated at [city] on this [day] day of [month] [year].[/DATE]
[SIGNATURE]
[Counsel full name]
[Barrister-at-Law & Solicitor / Avocat au Barreau du Cameroun]
[Bar No.]
Counsel for the Applicant
[/SIGNATURE]
""",

    'affidavit': """
Draft a sworn affidavit / déclaration sous serment in proper legal form.

[COURT]
IN THE [COURT NAME] OF CAMEROON
[Circuit/Division]
[/COURT]
[CASE_REF]
SUIT / DOSSIER NO.: [reference]
[Party names]
[/CASE_REF]
[AFFIDAVIT_TITLE]AFFIDAVIT OF [DEPONENT FULL NAME][/AFFIDAVIT_TITLE]
[DEPONENT]
I, [Full name], [occupation], holder of National Identity Card / Passport No. [number], residing at [full address], being duly sworn/affirmed, do hereby solemnly and sincerely declare as follows:
[/DEPONENT]
[BODY]
1. I am the [Applicant / Claimant / Defendant / Witness] in the above matter and I am competent to depose to the facts set out herein.
2. [Paragraph of fact — each paragraph one distinct fact only]
3. [Continue numbered paragraphs for each material fact]
   Cite applicable law where relevant:
   • Art. 116 Law No. 2005/007 CPC — statutory basis for sworn evidence
   • Arts. 344-357 C.civ. — affidavit in personal status proceedings
4. The facts deposed to herein are true and correct to the best of my knowledge, information, and belief.
[/BODY]
[JURAT]
SWORN / AFFIRMED at [location] on this [day] day of [month] [year],
before me:

____________________________
Commissioner for Oaths / Greffier / Notaire
[Stamp]
[/JURAT]
[SIGNATURE]
____________________________
[Deponent: Full name]
[/SIGNATURE]
""",

    'memorandum': """
Draft a confidential legal memorandum / note juridique.

[MEMO_HEADER]
CONFIDENTIAL — LEGALLY PRIVILEGED
LEGAL MEMORANDUM / NOTE JURIDIQUE
[/MEMO_HEADER]
[MEMO_META]
TO: [Recipient name and title]
FROM: [Author name and title]
DATE: [Full date]
RE: [Subject matter of memorandum]
FILE NO.: [reference]
CLASSIFICATION: Attorney-Client Privilege / Privilegiée
[/MEMO_META]
[SUMMARY]
EXECUTIVE SUMMARY
[2-3 sentence summary of the legal question, answer, and key action point]
[/SUMMARY]
[ISSUES]
ISSUES PRESENTED
1. [Precise legal question 1]
2. [Precise legal question 2 if applicable]
[/ISSUES]
[BRIEF_ANSWERS]
BRIEF ANSWERS
1. [One-sentence answer to Issue 1, citing the key authority]
2. [Answer to Issue 2]
[/BRIEF_ANSWERS]
[BODY]
ANALYSIS

A. [First Issue Heading]
[Detailed legal analysis. Apply the IRAC method: Issue → Rule → Application → Conclusion.
Cite applicable statutes precisely:]
• [Statute / UA / Code article]
• [Case law if available: Arrêt No. X, Cour Suprême, date]
Apply the law to the specific facts. Distinguish adverse authorities if needed.

B. [Second Issue Heading if applicable]
[Same structure]

RISKS & CONSIDERATIONS
[Set out legal risks, limitation periods, procedural traps.]
[/BODY]
[CONCLUSION]
CONCLUSION & RECOMMENDATIONS
[Concise conclusion per issue. Specific next steps for the client/lawyer.]
[/CONCLUSION]
[SIGNATURE]
Prepared by: [Author name]
[Title / Bar No.]
[Date]
This memorandum is prepared for the exclusive use of [recipient] and is protected by attorney-client privilege.
[/SIGNATURE]
""",

    'settlement_proposal': """
Draft a without-prejudice settlement proposal between parties.

[LETTERHEAD]
[Lawyer/Firm name, bar no., address]
[/LETTERHEAD]
[DATE][Date][/DATE]
[TO]
[Opposing counsel or party name and address]
[/TO]
[REF]File No.: [reference] — WITHOUT PREJUDICE / SOUS TOUTES RÉSERVES[/REF]
[SUBJECT]RE: SETTLEMENT PROPOSAL — [CASE TITLE / DOSSIER REFERENCE][/SUBJECT]
[SALUTATION]Dear [Maître / Mr. / Ms.] [Surname],[/SALUTATION]
[BODY]
WITHOUT PREJUDICE

Paragraph 1 — Authority: State you act for [client] and are authorised to make this proposal.
Paragraph 2 — Background: Briefly state the dispute, the claim, and what each party seeks.
Paragraph 3 — Proposed Terms:
  My client proposes to settle this matter on the following terms:
  (a) [Payment of XAF X by date Y — Art. 1234 C.civ.: discharge of obligation by payment]
  (b) [Mutual release of all claims]
  (c) [Specific performance obligation if any]
  (d) [Confidentiality clause — Art. 1134 C.civ.]
  (e) [Each party to bear own costs / costs allocation]
Paragraph 4 — Expiry: This proposal is open for acceptance until [date] and will lapse automatically thereafter.
Paragraph 5 — Without Prejudice: This communication is without prejudice to our client's legal rights and remedies and may not be produced in any proceedings without consent of both parties.
[/BODY]
[CLOSING]Yours faithfully,[/CLOSING]
[SIGNATURE]
[Lawyer name, title, bar no.]
Counsel for [Client name]
[/SIGNATURE]
""",

    'appeal_brief': """
Draft an appeal brief / mémoire d'appel for filing in the Court of Appeal.

[COURT]
IN THE COURT OF APPEAL OF CAMEROON
[Circuit — e.g. LITTORAL / CENTRE / ANGLOPHONE SW]
[/COURT]
[CASE_REF]
APPEAL NO. / APPEL NO.: [reference]
(Appeal from the Judgment / Jugement of [lower court] in Suit/Dossier No. [reference] dated [date])
[/CASE_REF]
[PARTIES]
APPELLANT / APPELANT: [Full name, address, counsel]
RESPONDENT / INTIMÉ: [Full name, address, counsel]
[/PARTIES]
[APPEAL_TITLE]BRIEF OF APPELLANT / MÉMOIRE DE L'APPELANT[/APPEAL_TITLE]
[BACKGROUND]
STATEMENT OF THE CASE / FAITS ET PROCÉDURE
[Chronological account: contract or events → trial proceedings → lower court's judgment → notice of appeal filed on (date) within the time prescribed by Art. 353 Law No. 2005/007 CPC / Art. 172 NCPC.]
[/BACKGROUND]
[GROUNDS]
GROUNDS OF APPEAL / MOYENS D'APPEL
Ground 1: [Error of law — cite: Art. X C.civ. / OHADA UA / CPC misapplied]
Ground 2: [Error of fact — lower court misapprehended the evidence by…]
Ground 3: [Procedural irregularity — Art. X Law No. 2005/007 CPC violated because…]
[Add additional grounds as warranted]
[/GROUNDS]
[ARGUMENTS]
SUBMISSIONS IN SUPPORT / DÉVELOPPEMENT DES MOYENS

On Ground 1:
[Argument — Rule: cite authority precisely; Application: show how lower court erred; Conclusion: relief sought]

On Ground 2:
[Same structure]

On Ground 3:
[Same structure]
[/ARGUMENTS]
[PRAYER]
PRAYER / CONCLUSIONS
The Appellant respectfully prays that this Honourable Court:
1. Set aside / infirmer le jugement du [lower court] dated [date].
2. [Substitute order / render the judgment the lower court should have rendered].
3. Award costs to the Appellant / Condamner l'Intimé aux dépens.
[/PRAYER]
[DATE]Respectfully submitted at [city] on [date].[/DATE]
[SIGNATURE]
[Counsel full name]
[Barrister-at-Law / Avocat au Barreau du Cameroun]
[Bar No.]
Counsel for the Appellant
[/SIGNATURE]
""",

    'contract_clause': """
Draft a professional contract clause or set of related clauses.

[CLAUSE_HEADER]
ARTICLE [NUMBER] — [TITLE IN CAPITALS]
(Insert into [Contract Type — e.g. Service Agreement / Contrat de Prestation de Services])
[/CLAUSE_HEADER]
[BODY]
[NUMBER].1 [Sub-clause heading if needed]: [Text — precise, unambiguous language]
[NUMBER].2 [Next sub-clause]: [Text]
[NUMBER].3 [etc.]

Key rules to follow in drafting:
- Define key terms used (draw on Art. 1 AUDCG style if commercial)
- Penalties/consequences: cite Art. 1147 C.civ. (non-performance liability)
- Force majeure: Art. 1148 C.civ. — define unforeseeable, irresistible events
- Dispute resolution: reference OHADA UA on Arbitration or courts of [jurisdiction]
- Governing law: "This Agreement is governed by the laws of Cameroon and, where applicable, the OHADA Uniform Acts."
[/BODY]
[DEFINITIONS]
DEFINITIONS (if applicable)
"[Term]" means [precise definition].
[/DEFINITIONS]
[NOTES]
DRAFTING NOTES
[Flag any OHADA mandatory provisions, any CIV/CIMA insurance requirements, or labour code constraints that affect this clause.]
[/NOTES]
""",

    'other': """
Draft the legal document as fully described by the lawyer.
Where applicable use section markers:
[TITLE][/TITLE] [DATE][/DATE] [PARTIES][/PARTIES] [BODY][/BODY] [SIGNATURE][/SIGNATURE]
Cite the relevant Cameroonian or OHADA law provisions that apply to the subject matter.
""",
}


class LegalDraftCreateView(APIView):
    """POST /api/v1/ai/drafts/ — generate a legal document draft using AI."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        draft_type = (request.data.get('draft_type') or 'other').strip()
        instructions = (request.data.get('instructions') or '').strip()
        case_id = request.data.get('case_id')
        title = (request.data.get('title') or '').strip()

        if not instructions:
            return Response({'error': 'instructions are required'}, status=400)

        valid_types = [t for t, _ in LegalDraft.DRAFT_TYPES]
        if draft_type not in valid_types:
            draft_type = 'other'

        # Optional case context
        case_context = ''
        if case_id:
            try:
                import requests as req
                r = req.get(
                    f"{settings.CASE_SERVICE_URL}/api/v1/cases/{case_id}/summary/",
                    headers={'X-Internal-Api-Key': getattr(settings, 'INTERNAL_API_KEY', '')},
                    timeout=4,
                )
                if r.status_code == 200:
                    d = r.json()
                    case_context = (
                        f"CASE CONTEXT:\nType: {d.get('case_type')} | "
                        f"Circuit: {d.get('circuit')} ({d.get('legal_tradition')}) | "
                        f"Status: {d.get('status')}\n"
                        f"Parties: {str(d.get('description', ''))[:300]}"
                    )
            except Exception:
                pass

        type_prompt = DRAFT_TYPE_PROMPTS.get(draft_type, DRAFT_TYPE_PROMPTS['other'])
        draft_prompt = (
            f"{LEGAL_SYSTEM_PROMPT}\n\n"
            "You are now in DOCUMENT DRAFTING MODE. Do not include explanations or commentary — "
            "output only the complete, professionally formatted legal document text.\n\n"
            f"Document type: {type_prompt}\n"
        )
        if case_context:
            draft_prompt += f"\n{case_context}\n"
        draft_prompt += f"\nLawyer's instructions:\n{instructions}\n\nDraft:"

        try:
            ai = get_ai_client(settings)
            full_content = ''
            for token in ai.stream(
                user_message=draft_prompt,
                history=[],
                case_context='',
            ):
                full_content += token
        except Exception as exc:
            logger.exception("AI draft generation error")
            return Response({'error': f'Draft generation failed: {exc}'}, status=502)

        draft = LegalDraft.objects.create(
            user_id=str(request.user.id),
            case_id=case_id,
            draft_type=draft_type,
            title=title or f"{dict(LegalDraft.DRAFT_TYPES).get(draft_type, 'Draft')}",
            instructions=instructions,
            content=full_content,
        )
        return Response({
            'id': str(draft.id),
            'draft_type': draft.draft_type,
            'title': draft.title,
            'instructions': draft.instructions,
            'content': draft.content,
            'case_id': draft.case_id,
            'created_at': draft.created_at.isoformat(),
        }, status=201)


def _default_clarify_questions(draft_type: str) -> list:
    common = [
        {"id": "party_name", "label": "Full legal name of the primary party / client", "placeholder": "e.g., Mr. Jean-Baptiste Kamga", "required": True},
        {"id": "date", "label": "Key date (event, hearing, signing, deadline)", "placeholder": "e.g., 15 June 2026", "required": True},
    ]
    extras: dict = {
        'letter_to_client': [
            {"id": "client_address", "label": "Client's full postal address", "placeholder": "e.g., BP 1234, Yaoundé, Centre Region", "required": True},
            {"id": "matter_ref", "label": "Matter reference or subject", "placeholder": "e.g., Advice re: property dispute at Lot 45 Bastos", "required": False},
        ],
        'demand_letter': [
            {"id": "amount", "label": "Amount demanded (with currency)", "placeholder": "e.g., XAF 2,500,000", "required": True},
            {"id": "response_deadline", "label": "Deadline for the opposing party to respond", "placeholder": "e.g., within 14 days of receipt", "required": True},
            {"id": "opposing_address", "label": "Opposing party's full address", "placeholder": "e.g., BP 9876, Douala, Littoral Region", "required": True},
        ],
        'motion': [
            {"id": "court_name", "label": "Full name of the court", "placeholder": "e.g., Tribunal de Grande Instance du Wouri, Douala", "required": True},
            {"id": "case_number", "label": "Dossier / case number", "placeholder": "e.g., No. 123/CIV/2026", "required": True},
            {"id": "relief_sought", "label": "Specific relief or order being sought", "placeholder": "e.g., dismissal of the claimant's motion for provisional measures", "required": True},
        ],
        'affidavit': [
            {"id": "deponent", "label": "Full name and occupation of the deponent", "placeholder": "e.g., Marie Ngo, Accountant", "required": True},
            {"id": "id_details", "label": "Deponent's ID / National ID number", "placeholder": "e.g., CNI No. 1234567890", "required": False},
            {"id": "sworn_facts", "label": "Key facts to be sworn to", "placeholder": "e.g., I witnessed the signing on 10 June 2026 at Douala", "required": True},
        ],
        'settlement_proposal': [
            {"id": "settlement_amount", "label": "Proposed settlement amount or terms", "placeholder": "e.g., XAF 5,000,000 payable in 3 instalments", "required": True},
            {"id": "opposing_party", "label": "Full name of the opposing party", "placeholder": "e.g., Société Acacia SARL", "required": True},
        ],
        'letter_to_court': [
            {"id": "court_name", "label": "Full name and location of the court", "placeholder": "e.g., Cour d'Appel du Littoral, Douala", "required": True},
            {"id": "case_ref", "label": "Case reference / dossier number", "placeholder": "e.g., Dossier No. 456/2025", "required": True},
        ],
        'appeal_brief': [
            {"id": "lower_court", "label": "Lower court that issued the decision", "placeholder": "e.g., TGI de Yaoundé", "required": True},
            {"id": "judgment_date", "label": "Date of the judgment being appealed", "placeholder": "e.g., 3 March 2026", "required": True},
            {"id": "grounds", "label": "Main grounds of appeal", "placeholder": "e.g., misapplication of Article 135 OHADA, insufficient evidence", "required": True},
        ],
    }
    return common + extras.get(draft_type, [
        {"id": "context", "label": "Additional context or specific facts to include", "placeholder": "Describe the situation in detail", "required": False},
    ])


class DraftClarifyView(APIView):
    """POST /api/v1/ai/drafts/clarify/ — AI generates specific follow-up questions before drafting."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        draft_type = (request.data.get('draft_type') or 'other').strip()
        instructions = (request.data.get('instructions') or '').strip()
        if not instructions:
            return Response({'error': 'instructions required'}, status=400)

        type_label = dict(LegalDraft.DRAFT_TYPES).get(draft_type, 'Legal Document')
        prompt = (
            f'A lawyer wants to draft a "{type_label}".\n\n'
            f'Their initial description:\n"{instructions}"\n\n'
            'Identify exactly 4–6 specific pieces of information that are missing from this description '
            'and without which you would have to write [PLACEHOLDER], [NAME], [DATE], [AMOUNT], or empty '
            f'brackets in the final {type_label}.\n\n'
            'Return ONLY a valid JSON array (no markdown, no prose, nothing else):\n'
            '[\n'
            '  {"id": "snake_case_id", "label": "Concise question label", "placeholder": "Example answer", "required": true}\n'
            ']\n\n'
            'Focus on: full party names, addresses, specific dates, monetary amounts, '
            'court/jurisdiction name, case/dossier reference numbers, deadlines, and key '
            f'facts specific to a {type_label}. Do NOT ask for anything already clearly stated.'
        )

        try:
            import re as _re
            ai = get_ai_client(settings)
            raw = ''
            for chunk in ai.stream(user_message=prompt, history=[], case_context=''):
                raw += chunk
            match = _re.search(r'\[.*\]', raw, _re.DOTALL)
            if not match:
                raise ValueError('No JSON array in response')
            questions = json.loads(match.group())
            if not isinstance(questions, list) or not questions:
                raise ValueError('Empty question list')
            return Response({'questions': questions[:6]})
        except Exception:
            logger.warning("Clarify question generation failed for %s, using defaults", draft_type)
            return Response({'questions': _default_clarify_questions(draft_type)})


class LegalDraftStreamView(APIView):
    """POST /api/v1/ai/drafts/stream/ — stream draft tokens, save on completion."""
    permission_classes = [IsAuthenticated]
    renderer_classes = [ServerSentEventRenderer, JSONRenderer]

    def post(self, request):
        draft_type = (request.data.get('draft_type') or 'other').strip()
        instructions = (request.data.get('instructions') or '').strip()
        answers = request.data.get('answers') or {}
        case_id = request.data.get('case_id')
        title = (request.data.get('title') or '').strip()

        if not instructions:
            return Response({'error': 'instructions are required'}, status=400)

        valid_types = [t for t, _ in LegalDraft.DRAFT_TYPES]
        if draft_type not in valid_types:
            draft_type = 'other'

        # Optional case context
        case_context = ''
        if case_id:
            try:
                import requests as req
                r = req.get(
                    f"{settings.CASE_SERVICE_URL}/api/v1/cases/{case_id}/summary/",
                    headers={'X-Internal-Api-Key': getattr(settings, 'INTERNAL_API_KEY', '')},
                    timeout=4,
                )
                if r.status_code == 200:
                    d = r.json()
                    case_context = (
                        f"CASE CONTEXT:\nType: {d.get('case_type')} | "
                        f"Circuit: {d.get('circuit')} ({d.get('legal_tradition')}) | "
                        f"Status: {d.get('status')}\n"
                        f"Parties: {str(d.get('description', ''))[:300]}"
                    )
            except Exception:
                pass

        type_prompt = DRAFT_TYPE_PROMPTS.get(draft_type, DRAFT_TYPE_PROMPTS['other'])
        draft_prompt = (
            f"{DRAFT_LEGAL_SYSTEM_PROMPT}\n\n"
            "You are now in DOCUMENT DRAFTING MODE.\n"
            "Rules:\n"
            "1. Output ONLY the complete document using the section markers specified — no preamble, no commentary.\n"
            "2. Fill EVERY section with real content — do NOT write [PLACEHOLDER], [NAME], [DATE], or empty brackets.\n"
            "3. Cite the correct Cameroonian statute, OHADA Uniform Act, or legal provision where indicated.\n"
            "4. Use formal, precise legal language appropriate to Cameroon's bijural system.\n\n"
            f"DOCUMENT FORMAT INSTRUCTIONS:\n{type_prompt}\n"
        )
        if case_context:
            draft_prompt += f"\n{case_context}\n"

        draft_prompt += f"\nLawyer's instructions:\n{instructions}\n"

        if answers:
            filled = {k: v for k, v in answers.items() if str(v).strip()}
            if filled:
                answers_text = '\n'.join(
                    f"- {k.replace('_', ' ').title()}: {v}" for k, v in filled.items()
                )
                draft_prompt += (
                    f"\nSpecific details collected from the lawyer:\n{answers_text}\n\n"
                    "CRITICAL: Use every detail above in the document. "
                    "Do NOT write [PLACEHOLDER], [NAME], [DATE], [AMOUNT], or any empty brackets. "
                    "Every field must be filled with the provided information.\n"
                )

        draft_prompt += "\nDraft:"

        user_id = str(request.user.id)

        def generate():
            full_content = ''
            try:
                ai = get_ai_client(settings)
                for chunk in ai.stream(user_message=draft_prompt, history=[], case_context='', max_tokens=4096):
                    full_content += chunk
                    yield f"data: {json.dumps({'token': chunk})}\n\n"
            except Exception as exc:
                logger.exception("AI draft stream error")
                yield f"data: {json.dumps({'error': str(exc)})}\n\n"
                return

            try:
                draft = LegalDraft.objects.create(
                    user_id=user_id,
                    case_id=case_id,
                    draft_type=draft_type,
                    title=title or dict(LegalDraft.DRAFT_TYPES).get(draft_type, 'Draft'),
                    instructions=instructions,
                    content=full_content,
                )
                yield f"data: {json.dumps({'done': True, 'draft_id': str(draft.id), 'title': draft.title, 'created_at': draft.created_at.isoformat()})}\n\n"
            except Exception as exc:
                logger.exception("Failed to save streamed draft")
                yield f"data: {json.dumps({'error': f'Save failed: {exc}'})}\n\n"

        response = StreamingHttpResponse(generate(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


class DraftTranslateView(APIView):
    """POST /api/v1/ai/drafts/translate/ — stream a translation of a draft into EN or FR."""
    permission_classes = [IsAuthenticated]
    renderer_classes = [ServerSentEventRenderer, JSONRenderer]

    def post(self, request):
        content = (request.data.get('content') or '').strip()
        target_lang = (request.data.get('target_lang') or 'fr').strip().lower()
        if not content:
            return Response({'error': 'content required'}, status=400)
        if target_lang not in ('en', 'fr'):
            return Response({'error': 'target_lang must be "en" or "fr"'}, status=400)

        lang_name = 'French (formal legal French — droit camerounais)' if target_lang == 'fr' else 'English (formal legal English — Cameroon common law style)'

        translate_prompt = (
            f"{DRAFT_LEGAL_SYSTEM_PROMPT}\n\n"
            "You are now in TRANSLATION MODE.\n"
            f"Translate the following Cameroonian legal document into {lang_name}.\n"
            "Rules:\n"
            "1. Preserve ALL section markers exactly as-is (e.g. [BODY], [/BODY], [SIGNATURE], etc.).\n"
            "2. Translate only the text content inside the markers.\n"
            "3. Preserve all legal citations exactly (Article numbers, law numbers, OHADA references).\n"
            "4. Use correct legal terminology for the target language — e.g. 'requête' → 'motion', "
            "'mise en demeure' → 'formal demand notice', 'mémoire d'appel' → 'appeal brief'.\n"
            "5. Maintain the same professional register and formal tone.\n"
            "6. Output ONLY the translated document — no explanations.\n\n"
            f"DOCUMENT TO TRANSLATE:\n\n{content}"
        )

        def generate():
            try:
                ai = get_ai_client(settings)
                for chunk in ai.stream(user_message=translate_prompt, history=[], case_context='', max_tokens=4096):
                    yield f"data: {json.dumps({'token': chunk})}\n\n"
                yield f"data: {json.dumps({'done': True})}\n\n"
            except Exception as exc:
                logger.exception("Translation stream error")
                yield f"data: {json.dumps({'error': str(exc)})}\n\n"

        response = StreamingHttpResponse(generate(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


class LegalDraftListView(APIView):
    """GET /api/v1/ai/drafts/ — list user's saved drafts."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        drafts = LegalDraft.objects.filter(
            user_id=str(request.user.id)
        ).values('id', 'draft_type', 'title', 'case_id', 'created_at')
        return Response(list(drafts))


class LegalDraftDetailView(APIView):
    """GET/DELETE /api/v1/ai/drafts/{id}/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, draft_id):
        try:
            draft = LegalDraft.objects.get(id=draft_id, user_id=str(request.user.id))
        except LegalDraft.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        return Response({
            'id': str(draft.id),
            'draft_type': draft.draft_type,
            'title': draft.title,
            'instructions': draft.instructions,
            'content': draft.content,
            'case_id': draft.case_id,
            'created_at': draft.created_at.isoformat(),
        })

    def delete(self, request, draft_id):
        try:
            draft = LegalDraft.objects.get(id=draft_id, user_id=str(request.user.id))
            draft.delete()
            return Response(status=204)
        except LegalDraft.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


MEETING_SUMMARY_SYSTEM_PROMPT = """You are a legal secretary AI for a Cameroonian law firm.
Given raw meeting notes between a lawyer and client (or between lawyers), produce a structured JSON object.

Respond ONLY with valid JSON using this exact schema:
{
  "summary": "2-3 sentence structured summary of what was discussed and agreed",
  "action_items": [
    {
      "item": "Specific action to take",
      "assignee": "lawyer|client|third_party",
      "suggested_due_date": "YYYY-MM-DD or null"
    }
  ],
  "draft_client_email": "Full professional email from the lawyer to the client summarising the meeting and next steps. Use formal Cameroonian legal correspondence style. Do not use placeholders.",
  "case_note_text": "Formal internal case note entry suitable for the case record. Start with date and parties present."
}

Rules:
- Language: match the language of the raw notes (English or French)
- Cite applicable Cameroonian law in the case note where relevant
- draft_client_email must be complete and ready to send — no [PLACEHOLDER] text
- action_items must be specific, assignable, and actionable"""


class MeetingSummaryView(APIView):
    """POST /api/v1/ai/meetings/summarize/ — stream meeting notes analysis."""
    permission_classes = [IsAuthenticated]
    renderer_classes = [ServerSentEventRenderer, JSONRenderer]

    def post(self, request):
        raw_notes = (request.data.get('raw_notes') or '').strip()
        case_id = request.data.get('case_id', '')
        case_type = request.data.get('case_type', '')
        client_name = request.data.get('client_name', 'the client')

        if not raw_notes:
            return Response({'error': 'raw_notes is required'}, status=400)

        user_message = (
            f"Case type: {case_type}\n"
            f"Client name: {client_name}\n"
            f"Meeting notes:\n\n{raw_notes[:5000]}"
        )

        def generate():
            full_text = ''
            try:
                ai = get_ai_client(settings)
                for chunk in ai.stream(user_message=user_message, history=[], case_context=MEETING_SUMMARY_SYSTEM_PROMPT, max_tokens=2048):
                    full_text += chunk
                    yield f"data: {json.dumps({'token': chunk})}\n\n"
            except Exception as exc:
                logger.exception("Meeting summary stream error")
                yield f"data: {json.dumps({'error': str(exc)})}\n\n"
                return

            import re as _re
            cleaned = full_text.strip()
            if cleaned.startswith('```'):
                cleaned = cleaned.split('```')[1]
                if cleaned.startswith('json'):
                    cleaned = cleaned[4:]
                cleaned = cleaned.strip()
            if cleaned.endswith('```'):
                cleaned = cleaned[:-3].strip()
            m = _re.search(r'\{[\s\S]*\}', cleaned)
            if m:
                cleaned = m.group(0)

            try:
                result = json.loads(cleaned)
            except Exception:
                result = {
                    'summary': full_text[:500],
                    'action_items': [],
                    'draft_client_email': '',
                    'case_note_text': full_text[:300],
                }

            # Auto-save case note (best-effort)
            if case_id and result.get('case_note_text'):
                try:
                    import requests as req
                    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
                    req.post(
                        f"{settings.CASE_SERVICE_URL}/api/v1/cases/{case_id}/notes/",
                        json={'content': result['case_note_text'], 'is_private': True},
                        headers={
                            'Authorization': auth_header,
                            'X-Internal-Api-Key': getattr(settings, 'INTERNAL_API_KEY', 'dev-internal-key'),
                        },
                        timeout=5,
                    )
                except Exception:
                    pass

            yield f"data: {json.dumps({'done': True, **result})}\n\n"

        response = StreamingHttpResponse(generate(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


RESEARCH_SYSTEM_PROMPT = """You are LexAI Research Mode — a specialist legal research engine for Cameroonian law.

For every query, provide a cited, precise answer. You MUST:
1. Cite specific statutes in format: [Citation: Law No. XXX/YYY of DATE — Art. Z]
2. Apply OHADA Uniform Acts where commercial law is relevant
3. Reference both Civil Law (francophone regions) and Common Law (anglophone NW/SW regions) where applicable
4. Return ONLY valid JSON with this exact schema:
{
  "answer": "Full answer text. Inline citations formatted as [Citation: ...]",
  "citations": [
    {
      "title": "Short name of the statute or uniform act",
      "reference": "Full formal reference e.g. Art. 1134 of the Civil Code",
      "relevance_note": "One sentence on why this applies to the query"
    }
  ],
  "confidence": "high|medium|low",
  "disclaimer": "This is AI-assisted legal research. Verify all citations before reliance in court proceedings."
}

IMPORTANT: If you cannot locate a specific Cameroonian provision, say so clearly — never fabricate citations.
Confidence: high = you cited a specific article; medium = general principle applies; low = uncertain or no specific statute found."""


class LegalResearchView(APIView):
    """POST /api/v1/ai/research/ — stream a legal research answer with citations."""
    permission_classes = [IsAuthenticated]
    renderer_classes = [ServerSentEventRenderer, JSONRenderer]

    def post(self, request):
        query = (request.data.get('query') or '').strip()
        session_id = request.data.get('session_id')

        if not query:
            return Response({'error': 'query is required'}, status=400)

        # Reuse ChatSession for history (portal='research')
        session = None
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id, user_id=str(request.user.id), portal='research')
            except ChatSession.DoesNotExist:
                pass

        if not session:
            session = ChatSession.objects.create(
                user_id=str(request.user.id),
                portal='research',
                title=query[:60],
                language='en',
                messages=[],
            )

        session.messages.append({'role': 'user', 'content': query, 'timestamp': datetime.utcnow().isoformat()})
        session.save()

        full_system = (
            RESEARCH_SYSTEM_PROMPT
            + "\n\n"
            + "CAMEROONIAN LAW REFERENCE (use for citations):\n"
            + "Civil Code Art. 1134 (pacta sunt servanda), Art. 1147 (non-performance liability), Art. 1382 (tort).\n"
            + "Penal Code: Law No. 2016/007 of 12 July 2016.\n"
            + "Criminal Procedure Code: Law No. 2005/007 of 27 July 2005.\n"
            + "Labour Code: Law No. 92/007 of 14 August 1992.\n"
            + "OHADA AUDCG (commercial law), AUSC (companies), AUPC (insolvency), AUPSRVE (enforcement), AUS (securities).\n"
            + "Land Law: Ordinance No. 74/1 of 6 July 1974.\n"
            + "Constitution: Law No. 96/06 of 18 January 1996.\n"
        )

        def generate():
            full_text = ''
            try:
                ai = get_ai_client(settings)
                for chunk in ai.stream(user_message=query, history=session.messages[:-1], case_context=full_system, max_tokens=2048):
                    full_text += chunk
                    yield f"data: {json.dumps({'token': chunk})}\n\n"
            except Exception as exc:
                logger.exception("Research stream error")
                yield f"data: {json.dumps({'error': str(exc)})}\n\n"
                return

            # Parse JSON from accumulated response
            import re as _re
            cleaned = full_text.strip()
            if cleaned.startswith('```'):
                cleaned = cleaned.split('```')[1]
                if cleaned.startswith('json'):
                    cleaned = cleaned[4:]
            if cleaned.endswith('```'):
                cleaned = cleaned[:-3].strip()
            match = _re.search(r'\{[\s\S]*\}', cleaned)
            if match:
                cleaned = match.group(0)

            try:
                result = json.loads(cleaned)
            except Exception:
                result = {
                    'answer': full_text,
                    'citations': [],
                    'confidence': 'low',
                    'disclaimer': 'Could not parse structured response. See raw text above.',
                }

            session.messages.append({'role': 'assistant', 'content': result.get('answer', full_text), 'timestamp': datetime.utcnow().isoformat()})
            session.save()

            yield f"data: {json.dumps({'done': True, 'session_id': str(session.id), **result})}\n\n"

        response = StreamingHttpResponse(generate(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


class FirmInsightsView(APIView):
    """POST /api/v1/ai/insights/ — internal endpoint called by monitoring-service for AI narrative."""
    permission_classes = [AllowAny]

    def post(self, request):
        key = request.headers.get('X-Internal-Api-Key', '')
        from decouple import config
        if key != config('INTERNAL_API_KEY', default='dev-internal-key'):
            return Response({'error': 'Forbidden'}, status=403)

        firm_data = request.data.get('firm_data', {})
        prompt = (
            f"You are a senior law firm management consultant. "
            f"Analyse this firm's operational data and provide actionable insights.\n\n"
            f"FIRM DATA:\n"
            f"- Active cases: {firm_data.get('total_active_cases', 0)}\n"
            f"- Total cases all time: {firm_data.get('total_cases_all_time', 0)}\n"
            f"- Stalled cases (no update >14 days): {firm_data.get('stalled_cases_count', 0)}\n"
            f"- Number of lawyers: {firm_data.get('lawyer_count', 0)}\n"
            f"- Average resolution days: {firm_data.get('avg_resolution_days', 0)}\n"
            f"- Status distribution: {json.dumps(firm_data.get('status_distribution', {}))}\n"
            f"- Top stalled cases: {json.dumps(firm_data.get('top_stalled', []))}\n"
            f"- Top lawyer loads: {json.dumps(firm_data.get('lawyer_loads', []))}\n\n"
            f"Provide a brief management narrative (2-3 sentences) and 3-5 bullet point action items.\n"
            f"Respond with JSON: "
            f'{{ "narrative": "...", "bullet_insights": ["...", "..."] }}'
        )

        try:
            ai = get_ai_client(settings)
            raw = ai.complete(prompt, system=LEGAL_SYSTEM_PROMPT, max_tokens=600)
        except Exception as exc:
            return Response({'narrative': '', 'bullet_insights': [], 'error': str(exc)})

        import re as _re
        cleaned = raw.strip()
        if cleaned.startswith('```'):
            cleaned = cleaned.split('```')[1]
            if cleaned.startswith('json'):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip()
        m = _re.search(r'\{[\s\S]*\}', cleaned)
        if m:
            cleaned = m.group(0)

        try:
            result = json.loads(cleaned)
        except Exception:
            result = {'narrative': raw[:400], 'bullet_insights': []}

        return Response(result)


INTAKE_SYSTEM_PROMPT = (
    "You are a Cameroonian legal intake specialist. "
    "Generate a client intake questionnaire tailored to the given case type and jurisdiction. "
    "Each question should gather information the lawyer specifically needs for this type of case. "
    "Respond ONLY with valid JSON — no markdown, no explanation."
)


class IntakeGenerateView(APIView):
    """POST /api/v1/ai/intake/generate/ — generate a client intake questionnaire."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        case_type = (request.data.get('case_type') or '').strip()
        circuit = (request.data.get('circuit') or 'Anglophone').strip()
        language = (request.data.get('language') or 'en').strip()

        if not case_type:
            return Response({'error': 'case_type is required'}, status=400)

        lang_note = 'in French' if language == 'fr' else 'in English'
        prompt = (
            f"Generate a client intake questionnaire for a **{case_type}** case "
            f"in the **{circuit}** circuit of Cameroon.\n\n"
            f"Write all question labels {lang_note}.\n\n"
            f"Return ONLY a JSON array of 8-12 questions:\n"
            f'[\n'
            f'  {{\n'
            f'    "label": "Question text",\n'
            f'    "type": "text|textarea|select|date|email|phone",\n'
            f'    "required": true|false,\n'
            f'    "placeholder": "Helper text",\n'
            f'    "options": ["Option A", "Option B"]  // only for type=select\n'
            f'  }}\n'
            f']\n\n'
            f'Include questions specific to {case_type} cases: parties involved, key dates, '
            f'prior legal action, evidence available, desired outcome, financial circumstances if relevant.'
        )

        try:
            ai = get_ai_client(settings)
            raw = ai.complete(prompt, system=INTAKE_SYSTEM_PROMPT, max_tokens=1200)
        except Exception as exc:
            return Response({'error': f'AI unavailable: {exc}'}, status=503)

        import re as _re
        cleaned = raw.strip()
        if cleaned.startswith('```'):
            cleaned = cleaned.split('```')[1]
            if cleaned.startswith('json'):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip()
        m = _re.search(r'\[[\s\S]*\]', cleaned)
        if m:
            cleaned = m.group(0)

        try:
            fields = json.loads(cleaned)
            if not isinstance(fields, list):
                raise ValueError('Expected list')
        except Exception:
            return Response({'error': 'AI returned unexpected format. Please try again.'}, status=502)

        return Response({'form_fields': fields, 'case_type': case_type, 'circuit': circuit})
