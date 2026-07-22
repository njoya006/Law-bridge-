"""
Procedure templates — rigid step/deadline sequences from OHADA uniform acts and
Cameroonian procedure, applied to a case as a checklist with auto-seeded deadlines.

Each step: {title, description, deadline_days} — deadline_days is the offset in
days from the date the template is applied (None = no fixed deadline).
Deadline offsets follow the statutory outer limits; the lawyer can edit dates after.
"""

PROCEDURE_TEMPLATES = {
    'injonction_de_payer': {
        'name': 'Injonction de Payer (OHADA Payment Order)',
        'name_fr': 'Injonction de Payer',
        'description': 'Simplified debt recovery under AUPSRVE — for certain, liquid, due contractual debts.',
        'applicable_case_types': ['commercial', 'debt_recovery', 'civil'],
        'steps': [
            {'title': 'Verify debt is certain, liquid and due',
             'description': 'Confirm the claim qualifies under AUPSRVE Art. 1-2: contractual origin or dishonoured negotiable instrument.',
             'deadline_days': None},
            {'title': 'File petition with the president of the competent court',
             'description': 'Petition with supporting documents at the court of the debtor\'s domicile.',
             'deadline_days': 7},
            {'title': 'Obtain the payment order (ordonnance)',
             'description': 'Follow up with the registry for the president\'s decision.',
             'deadline_days': 30},
            {'title': 'Serve the order on the debtor via bailiff',
             'description': 'Service must occur within 3 months of the order or it lapses (AUPSRVE Art. 7).',
             'deadline_days': 90},
            {'title': 'Monitor debtor opposition window',
             'description': 'Debtor has 15 days from service to file opposition (AUPSRVE Art. 10).',
             'deadline_days': 105},
            {'title': 'Request enforcement formula (formule exécutoire)',
             'description': 'If no opposition: apply for the enforcement endorsement within 2 months of expiry of the opposition window, or the order lapses (AUPSRVE Art. 16).',
             'deadline_days': 165},
        ],
    },
    'injonction_de_restituer': {
        'name': 'Injonction de Délivrer/Restituer (OHADA Recovery of Goods)',
        'name_fr': 'Injonction de Délivrer ou de Restituer',
        'description': 'Simplified recovery of specific movable property under AUPSRVE Art. 19-27.',
        'applicable_case_types': ['commercial', 'civil', 'property'],
        'steps': [
            {'title': 'Confirm obligation to deliver or return a specific movable asset',
             'description': 'AUPSRVE Art. 19 — the obligation must concern identified movable property.',
             'deadline_days': None},
            {'title': 'File petition with the president of the competent court',
             'description': 'At the domicile of the party owing delivery/restitution.',
             'deadline_days': 7},
            {'title': 'Serve the order on the debtor via bailiff',
             'description': 'Service within 3 months or the order lapses.',
             'deadline_days': 90},
            {'title': 'Monitor opposition window (15 days)',
             'description': 'Opposition suspends enforcement; matter proceeds to hearing.',
             'deadline_days': 105},
            {'title': 'Enforce delivery / apply enforcement formula',
             'description': 'If no opposition, proceed to forced recovery of the asset.',
             'deadline_days': 165},
        ],
    },
    'saisie_attribution': {
        'name': 'Saisie-Attribution (OHADA Attachment of Debts)',
        'name_fr': 'Saisie-Attribution de Créances',
        'description': 'Attachment of sums owed to the debtor by third parties (usually bank accounts), AUPSRVE Art. 153+.',
        'applicable_case_types': ['commercial', 'debt_recovery', 'enforcement'],
        'steps': [
            {'title': 'Hold an enforceable title (titre exécutoire)',
             'description': 'Judgment with enforcement formula, notarial deed, or endorsed payment order.',
             'deadline_days': None},
            {'title': 'Serve attachment on the third party (garnishee) via bailiff',
             'description': 'The bank/third party must declare the extent of its obligations immediately.',
             'deadline_days': 14},
            {'title': 'Notify the debtor of the attachment',
             'description': 'Within 8 days of service on the garnishee, or the attachment lapses (AUPSRVE Art. 160).',
             'deadline_days': 22},
            {'title': 'Monitor debtor contestation window',
             'description': 'Debtor has 1 month from notification to contest before the enforcement judge.',
             'deadline_days': 52},
            {'title': 'Obtain payment from the garnishee',
             'description': 'On expiry of the contestation window (or dismissal of contest), request payment against receipt.',
             'deadline_days': 60},
        ],
    },
    'labour_prelitigation': {
        'name': 'Labour Dispute — Mandatory Conciliation',
        'name_fr': 'Litige de Travail — Conciliation Préalable',
        'description': 'Labour Code requires attempted conciliation before the labour inspector prior to filing at the labour bench.',
        'applicable_case_types': ['labour', 'employment'],
        'steps': [
            {'title': 'Refer the dispute to the competent labour inspector',
             'description': 'Written referral to the inspector of the place of employment.',
             'deadline_days': 7},
            {'title': 'Attend conciliation session(s)',
             'description': 'Both parties convened by the inspector; record outcomes per session.',
             'deadline_days': 30},
            {'title': 'Obtain PV of conciliation or non-conciliation',
             'description': 'Total or partial settlement is enforceable; non-conciliation PV opens the way to court.',
             'deadline_days': 45},
            {'title': 'File at the competent court with the non-conciliation PV',
             'description': 'The PV must be attached to the claim — filing without it is inadmissible.',
             'deadline_days': 60},
        ],
    },
    'divorce_conciliation': {
        'name': 'Divorce — Conciliation Phase',
        'name_fr': 'Divorce — Phase de Conciliation',
        'description': 'Mandatory conciliation attempt before the judge prior to divorce proceedings on the merits.',
        'applicable_case_types': ['family', 'divorce'],
        'steps': [
            {'title': 'File the divorce petition',
             'description': 'Petition to the competent court (High Court for statutory marriage).',
             'deadline_days': 7},
            {'title': 'Attend the conciliation hearing before the judge',
             'description': 'Judge attempts to reconcile the spouses; may order provisional measures (residence, custody, maintenance).',
             'deadline_days': 45},
            {'title': 'Obtain the non-conciliation order',
             'description': 'Ordonnance de non-conciliation authorises the petitioner to summon on the merits.',
             'deadline_days': 60},
            {'title': 'Summon the respondent on the merits',
             'description': 'Assignation within the validity of the non-conciliation order.',
             'deadline_days': 90},
        ],
    },
}


def get_template(key):
    return PROCEDURE_TEMPLATES.get(key)


def list_templates():
    return [
        {
            'key': key,
            'name': t['name'],
            'name_fr': t['name_fr'],
            'description': t['description'],
            'applicable_case_types': t['applicable_case_types'],
            'step_count': len(t['steps']),
        }
        for key, t in PROCEDURE_TEMPLATES.items()
    ]
