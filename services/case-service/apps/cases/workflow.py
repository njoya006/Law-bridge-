"""
Smart case lifecycle engine.

Maps case types to their typical stage progressions, defines which
transitions are allowed, and provides bilingual client-facing messages
for every status change so lawyers never have to write "update" emails.
"""

# ── Stage definitions ──────────────────────────────────────────────────────────

# Ordered stage pipelines per case category.
# A case may skip stages or branch (e.g. to settlement), but this defines
# the "happy path" used for the progress stepper on the client UI.

_CRIMINAL = ['filed', 'under_review', 'evidence_collection',
              'hearing_scheduled', 'in_progress', 'verdict']

_CIVIL = ['filed', 'under_review', 'evidence_collection',
          'awaiting_court_date', 'hearing_scheduled', 'in_progress',
          'mediation', 'settled']

_FAMILY = ['filed', 'under_review', 'mediation',
           'hearing_scheduled', 'in_progress', 'settled']

_COMMERCIAL = ['filed', 'under_review', 'evidence_collection',
               'mediation', 'in_progress', 'settled']

_LABOUR = ['filed', 'under_review', 'mediation',
           'hearing_scheduled', 'in_progress', 'verdict']

_PROPERTY = ['filed', 'under_review', 'evidence_collection',
             'in_progress', 'settled']

_IMMIGRATION = ['filed', 'under_review', 'evidence_collection',
                'in_progress', 'closed']

_DEFAULT = ['filed', 'under_review', 'evidence_collection',
            'in_progress', 'settled']


def _keywords(words: list[str]) -> dict:
    return {w: True for w in words}


# Map keyword → pipeline. First match wins (most-specific first).
_PIPELINE_MAP = [
    (_keywords(['criminal', 'pénal', 'penal']),                 _CRIMINAL),
    (_keywords(['family', 'famille', 'divorce', 'custody',
                'inheritance', 'succession']),                   _FAMILY),
    (_keywords(['labour', 'labor', 'employment', 'travail',
                'employment']),                                   _LABOUR),
    (_keywords(['commercial', 'corporate', 'contract', 'contrat',
                'business', 'debt', 'créance']),                  _COMMERCIAL),
    (_keywords(['property', 'real estate', 'immobilier', 'land',
                'foncier']),                                       _PROPERTY),
    (_keywords(['immigration', 'visa', 'asylum', 'asile']),      _IMMIGRATION),
    (_keywords(['civil', 'tort', 'civil liability']),            _CIVIL),
]


def get_pipeline(case_type: str) -> list:
    """Return the ordered stage list for a given free-text case type."""
    ct = (case_type or '').lower()
    for keywords, pipeline in _PIPELINE_MAP:
        if any(k in ct for k in keywords):
            return pipeline
    return _DEFAULT


# ── Allowed transitions ────────────────────────────────────────────────────────

# These are additive: a status is always allowed to move to any later
# stage in its pipeline, plus these explicit cross-pipeline moves.
_EXTRA_TRANSITIONS: dict[str, list[str]] = {
    'in_progress':        ['verdict', 'settled', 'dismissed', 'mediation'],
    'hearing_scheduled':  ['hearing_adjourned', 'in_progress', 'dismissed'],
    'hearing_adjourned':  ['hearing_scheduled', 'dismissed'],
    'mediation':          ['settled', 'hearing_scheduled', 'in_progress'],
    'verdict':            ['appeal_filed', 'closed'],
    'appeal_filed':       ['appeal_in_progress'],
    'appeal_in_progress': ['verdict', 'settled', 'dismissed'],
    'settled':            ['closed'],
    'dismissed':          ['closed'],
}

_TERMINAL = {'closed', 'dismissed', 'archived', 'settled', 'verdict'}


def get_allowed_transitions(case_type: str, current_status: str) -> list[str]:
    """Return statuses the lawyer is allowed to move to from current_status."""
    if current_status in _TERMINAL:
        return []
    pipeline = get_pipeline(case_type)
    allowed = set()
    # Forward moves within the pipeline
    if current_status in pipeline:
        idx = pipeline.index(current_status)
        allowed.update(pipeline[idx + 1:])
    # Extra cross-pipeline moves
    allowed.update(_EXTRA_TRANSITIONS.get(current_status, []))
    # Always allow archiving and dismissal from any non-terminal state
    allowed.update(['archived', 'dismissed'])
    return sorted(allowed)


def get_next_status(case_type: str, current_status: str) -> str | None:
    """Return the single most-likely next status (the smart suggestion)."""
    pipeline = get_pipeline(case_type)
    if current_status in pipeline:
        idx = pipeline.index(current_status)
        if idx + 1 < len(pipeline):
            return pipeline[idx + 1]
    # For statuses not in pipeline, look at extras
    extras = _EXTRA_TRANSITIONS.get(current_status, [])
    return extras[0] if extras else None


# ── Bilingual client messages ──────────────────────────────────────────────────

# Each status → {'en': {'headline', 'detail', 'next', 'estimate'},
#                'fr': {...}}
# 'estimate' is a rough duration string shown on the client's progress bar.

_MESSAGES: dict[str, dict] = {
    'filed': {
        'en': {
            'headline': 'Your case has been filed',
            'detail': 'Your case has been officially registered and assigned to your legal team. All details have been recorded and your case file is now open.',
            'next': 'Your lawyer will begin reviewing your case details and will contact you if any additional information is needed.',
            'estimate': 'Review usually begins within 1–2 business days.',
        },
        'fr': {
            'headline': 'Votre dossier a été déposé',
            'detail': 'Votre dossier a été officiellement enregistré et confié à votre équipe juridique. Tous les détails ont été consignés et votre dossier est maintenant ouvert.',
            'next': 'Votre avocat commencera à examiner votre dossier et vous contactera si des informations supplémentaires sont nécessaires.',
            'estimate': 'L\'examen commence généralement dans 1 à 2 jours ouvrables.',
        },
    },
    'under_review': {
        'en': {
            'headline': 'Your lawyer is reviewing your case',
            'detail': 'Your lawyer is carefully analysing all aspects of your case — reviewing the facts, applicable laws, and building a legal strategy tailored to your situation.',
            'next': 'Your lawyer will next gather evidence and supporting documents. You may be asked to provide additional materials.',
            'estimate': 'Review typically takes 3–7 business days depending on complexity.',
        },
        'fr': {
            'headline': 'Votre avocat examine votre dossier',
            'detail': 'Votre avocat analyse attentivement tous les aspects de votre affaire — les faits, les lois applicables — et élabore une stratégie juridique adaptée à votre situation.',
            'next': 'Votre avocat procédera ensuite à la collecte des preuves et documents justificatifs. Il est possible que vous soyez sollicité pour fournir des pièces supplémentaires.',
            'estimate': 'L\'examen prend généralement 3 à 7 jours ouvrables selon la complexité.',
        },
    },
    'evidence_collection': {
        'en': {
            'headline': 'Evidence is being gathered',
            'detail': 'Your legal team is actively collecting evidence, documents, and statements that support your case. This is a critical phase that directly impacts the strength of your position.',
            'next': 'Once the evidence is complete, your lawyer will file the necessary documents with the court or relevant authority.',
            'estimate': 'Evidence collection typically takes 1–3 weeks.',
        },
        'fr': {
            'headline': 'Collecte des preuves en cours',
            'detail': 'Votre équipe juridique collecte activement les preuves, documents et témoignages qui soutiennent votre dossier. Cette phase est déterminante pour la solidité de votre position.',
            'next': 'Une fois les preuves rassemblées, votre avocat déposera les documents nécessaires auprès du tribunal ou de l\'autorité compétente.',
            'estimate': 'La collecte prend généralement 1 à 3 semaines.',
        },
    },
    'awaiting_court_date': {
        'en': {
            'headline': 'Waiting for a court date',
            'detail': 'Your case has been submitted to the court and is awaiting a scheduled hearing date. Court scheduling timelines vary based on the court\'s calendar.',
            'next': 'You will be notified as soon as a hearing date is set. Ensure you are available to attend with your lawyer.',
            'estimate': 'Court dates are typically set within 2–8 weeks.',
        },
        'fr': {
            'headline': 'En attente d\'une date d\'audience',
            'detail': 'Votre dossier a été soumis au tribunal et attend une date d\'audience. Les délais varient selon le calendrier du tribunal.',
            'next': 'Vous serez informé dès qu\'une date d\'audience sera fixée. Assurez-vous d\'être disponible pour y assister avec votre avocat.',
            'estimate': 'Les audiences sont généralement fixées dans un délai de 2 à 8 semaines.',
        },
    },
    'hearing_scheduled': {
        'en': {
            'headline': 'A hearing has been scheduled',
            'detail': 'A formal court hearing has been set for your case. This is an important step where both sides will present their arguments before the court.',
            'next': 'Prepare any documents your lawyer requests. Dress formally and arrive early on the hearing date.',
            'estimate': 'Hearings are usually held within the next 1–3 weeks.',
        },
        'fr': {
            'headline': 'Une audience a été fixée',
            'detail': 'Une audience formelle a été fixée pour votre affaire. C\'est une étape importante où les deux parties présenteront leurs arguments devant le tribunal.',
            'next': 'Préparez les documents demandés par votre avocat. Habillez-vous formellement et arrivez tôt le jour de l\'audience.',
            'estimate': 'Les audiences se tiennent généralement dans les 1 à 3 prochaines semaines.',
        },
    },
    'hearing_adjourned': {
        'en': {
            'headline': 'Hearing adjourned — rescheduling in progress',
            'detail': 'Today\'s hearing was adjourned (postponed) by the court. This is a normal occurrence in legal proceedings and does not affect the merits of your case.',
            'next': 'Your lawyer is working to secure a new hearing date as soon as possible. You will be notified once it is confirmed.',
            'estimate': 'A new date is typically set within 1–4 weeks.',
        },
        'fr': {
            'headline': 'Audience ajournée — report en cours',
            'detail': 'L\'audience d\'aujourd\'hui a été ajournée (reportée) par le tribunal. Cela est courant dans les procédures judiciaires et n\'affecte pas le fond de votre affaire.',
            'next': 'Votre avocat travaille à obtenir une nouvelle date d\'audience dans les meilleurs délais. Vous serez informé dès confirmation.',
            'estimate': 'Une nouvelle date est généralement fixée dans 1 à 4 semaines.',
        },
    },
    'in_progress': {
        'en': {
            'headline': 'Proceedings are underway',
            'detail': 'Your case is actively being heard and argued before the court or relevant authority. Your legal team is presenting your case and responding to all claims.',
            'next': 'Your lawyer will keep you updated after each session. Follow all instructions given by your lawyer carefully.',
            'estimate': 'Active proceedings vary in duration. Your lawyer will advise on expected timelines.',
        },
        'fr': {
            'headline': 'La procédure est en cours',
            'detail': 'Votre affaire est activement entendue et plaidée devant le tribunal ou l\'autorité compétente. Votre équipe juridique présente votre dossier et répond à toutes les demandes.',
            'next': 'Votre avocat vous tiendra informé après chaque séance. Suivez attentivement les instructions de votre avocat.',
            'estimate': 'La durée des procédures en cours est variable. Votre avocat vous conseillera sur les délais prévus.',
        },
    },
    'mediation': {
        'en': {
            'headline': 'Mediation is in progress',
            'detail': 'Both parties are meeting with a neutral mediator to try to reach a mutually acceptable resolution without a full court trial. Mediation is confidential and often leads to faster, less costly outcomes.',
            'next': 'If mediation succeeds, your case will be resolved through a settlement agreement. If not, court proceedings will resume.',
            'estimate': 'Mediation sessions typically last 1–5 days.',
        },
        'fr': {
            'headline': 'La médiation est en cours',
            'detail': 'Les deux parties se réunissent avec un médiateur neutre pour tenter de parvenir à un règlement acceptable sans audience complète. La médiation est confidentielle et aboutit souvent à des résultats plus rapides et moins coûteux.',
            'next': 'Si la médiation réussit, votre affaire sera résolue par un accord amiable. Dans le cas contraire, la procédure judiciaire reprendra.',
            'estimate': 'Les séances de médiation durent généralement 1 à 5 jours.',
        },
    },
    'verdict': {
        'en': {
            'headline': 'A verdict has been rendered',
            'detail': 'The court has delivered its judgment in your case. Your lawyer will explain the full implications of the verdict and advise you on all available next steps.',
            'next': 'Review the verdict carefully with your lawyer. If you wish to appeal, there are strict deadlines — act promptly.',
            'estimate': 'You typically have 30 days to file an appeal after a verdict.',
        },
        'fr': {
            'headline': 'Un verdict a été rendu',
            'detail': 'Le tribunal a rendu son jugement dans votre affaire. Votre avocat vous expliquera toutes les implications du verdict et vous conseillera sur les prochaines étapes disponibles.',
            'next': 'Examinez attentivement le verdict avec votre avocat. Si vous souhaitez faire appel, des délais stricts s\'appliquent — agissez rapidement.',
            'estimate': 'Vous disposez généralement de 30 jours pour faire appel après un verdict.',
        },
    },
    'settled': {
        'en': {
            'headline': 'Your case has been settled',
            'detail': 'Both parties have reached a mutually agreed settlement, resolving the matter without further court proceedings. This is often the most efficient and private way to resolve a dispute.',
            'next': 'Your lawyer will finalise and sign the settlement agreement. Keep your copy safely — it is a legally binding document.',
            'estimate': 'Settlement paperwork is typically completed within 5–10 business days.',
        },
        'fr': {
            'headline': 'Votre affaire a été réglée à l\'amiable',
            'detail': 'Les deux parties ont conclu un accord amiable, résolvant le litige sans nouvelle procédure judiciaire. C\'est souvent la manière la plus efficace et discrète de résoudre un différend.',
            'next': 'Votre avocat finalisera et signera l\'accord de règlement. Conservez votre copie précieusement — c\'est un document juridiquement contraignant.',
            'estimate': 'Les formalités de règlement sont généralement complétées en 5 à 10 jours ouvrables.',
        },
    },
    'appeal_filed': {
        'en': {
            'headline': 'An appeal has been filed',
            'detail': 'A formal appeal has been submitted to a higher court requesting a review of the original verdict. The appeals process gives your case another hearing at a superior level.',
            'next': 'The appeal court will schedule your case. Your lawyer will prepare a comprehensive appellate brief.',
            'estimate': 'Appeals are typically heard within 3–6 months of filing.',
        },
        'fr': {
            'headline': 'Un appel a été formé',
            'detail': 'Un appel formel a été déposé auprès d\'une juridiction supérieure demandant le réexamen du verdict initial. La procédure d\'appel offre une nouvelle audience à un niveau supérieur.',
            'next': 'La cour d\'appel planifiera votre affaire. Votre avocat préparera un mémoire d\'appel complet.',
            'estimate': 'Les appels sont généralement entendus dans un délai de 3 à 6 mois après le dépôt.',
        },
    },
    'appeal_in_progress': {
        'en': {
            'headline': 'Appeal proceedings are underway',
            'detail': 'Your appeal is actively being heard by the appellate court. The higher court is reviewing the legal arguments and the record from the original trial.',
            'next': 'Your lawyer will argue your position before the appellate judges. A new decision will be issued in due course.',
            'estimate': 'Appellate decisions are typically issued within 1–3 months of hearings.',
        },
        'fr': {
            'headline': 'La procédure d\'appel est en cours',
            'detail': 'Votre appel est activement examiné par la cour d\'appel, qui révise les arguments juridiques et le dossier du procès initial.',
            'next': 'Votre avocat plaidera votre position devant les juges d\'appel. Une nouvelle décision sera rendue en temps voulu.',
            'estimate': 'Les décisions d\'appel sont généralement rendues dans 1 à 3 mois après les audiences.',
        },
    },
    'closed': {
        'en': {
            'headline': 'Your case is now closed',
            'detail': 'All proceedings have concluded and your case has been officially closed. All obligations and deadlines related to this matter have been fulfilled.',
            'next': 'No further action is required. Retain all case documents for your records. Contact your lawyer if any new issues arise.',
            'estimate': 'Case closed.',
        },
        'fr': {
            'headline': 'Votre dossier est maintenant clôturé',
            'detail': 'Toutes les procédures ont été menées à terme et votre dossier a été officiellement clôturé. Toutes les obligations et délais liés à cette affaire ont été respectés.',
            'next': 'Aucune action supplémentaire n\'est requise. Conservez tous les documents du dossier. Contactez votre avocat si de nouveaux problèmes surviennent.',
            'estimate': 'Dossier clôturé.',
        },
    },
    'dismissed': {
        'en': {
            'headline': 'Case dismissed',
            'detail': 'The court or authority has dismissed this case. Your lawyer will explain the specific grounds for dismissal and whether any remedies or alternative actions are available.',
            'next': 'Discuss with your lawyer whether to re-file, appeal the dismissal, or explore alternative options.',
            'estimate': 'Consult your lawyer within 15 days — dismissal deadlines are strict.',
        },
        'fr': {
            'headline': 'Affaire classée',
            'detail': 'Le tribunal ou l\'autorité a classé cette affaire. Votre avocat vous expliquera les motifs spécifiques du classement et les recours ou actions alternatives éventuellement disponibles.',
            'next': 'Discutez avec votre avocat de la possibilité de redéposer, de faire appel du classement ou d\'explorer d\'autres options.',
            'estimate': 'Consultez votre avocat dans les 15 jours — les délais de recours sont stricts.',
        },
    },
}

_DEFAULT_MSG = {
    'en': {
        'headline': 'Case status updated',
        'detail': 'Your lawyer has updated the status of your case. Please review the latest update and contact your lawyer if you have any questions.',
        'next': 'Your lawyer will keep you informed of all further developments.',
        'estimate': '',
    },
    'fr': {
        'headline': 'Statut du dossier mis à jour',
        'detail': 'Votre avocat a mis à jour le statut de votre dossier. Veuillez prendre connaissance de cette mise à jour et contacter votre avocat si vous avez des questions.',
        'next': 'Votre avocat vous tiendra informé de tous les développements ultérieurs.',
        'estimate': '',
    },
}


def get_status_message(status: str, lang: str = 'en') -> dict:
    """Return headline, detail, next-step, and estimate for a given status."""
    lang = lang if lang in ('en', 'fr') else 'en'
    entry = _MESSAGES.get(status, _DEFAULT_MSG)
    return entry.get(lang, entry.get('en', _DEFAULT_MSG['en']))


def get_workflow_stages(case_type: str) -> list[str]:
    """Return the ordered stage labels for the progress stepper."""
    return get_pipeline(case_type)


# Human-readable labels for ALL statuses (used by frontend stepper)
STATUS_LABELS: dict[str, dict[str, str]] = {
    'filed':               {'en': 'Filed',                   'fr': 'Déposé'},
    'under_review':        {'en': 'Under Review',             'fr': 'En examen'},
    'evidence_collection': {'en': 'Evidence Collection',      'fr': 'Collecte des preuves'},
    'awaiting_court_date': {'en': 'Awaiting Court Date',      'fr': 'En attente d\'audience'},
    'hearing_scheduled':   {'en': 'Hearing Scheduled',        'fr': 'Audience planifiée'},
    'hearing_adjourned':   {'en': 'Adjourned',                'fr': 'Ajourné'},
    'in_progress':         {'en': 'In Progress',              'fr': 'En cours'},
    'mediation':           {'en': 'Mediation',                'fr': 'Médiation'},
    'verdict':             {'en': 'Verdict',                  'fr': 'Verdict'},
    'settled':             {'en': 'Settled',                  'fr': 'Règlement amiable'},
    'appeal_filed':        {'en': 'Appeal Filed',             'fr': 'Appel formé'},
    'appeal_in_progress':  {'en': 'Appeal in Progress',       'fr': 'Appel en cours'},
    'closed':              {'en': 'Closed',                   'fr': 'Clôturé'},
    'dismissed':           {'en': 'Dismissed',                'fr': 'Classé'},
    'archived':            {'en': 'Archived',                 'fr': 'Archivé'},
    'draft':               {'en': 'Draft',                    'fr': 'Brouillon'},
    'assigned':            {'en': 'Assigned',                 'fr': 'Assigné'},
}
