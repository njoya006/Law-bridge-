/**
 * Client-side case workflow engine.
 * Mirrors the backend workflow.py so UI works before / after the backend
 * returns workflow data in the API response.
 */

// ── Stage pipelines ─────────────────────────────────────────────────────────

const PIPELINES: Record<string, string[]> = {
  criminal:   ['filed', 'under_review', 'evidence_collection', 'hearing_scheduled', 'in_progress', 'verdict'],
  civil:      ['filed', 'under_review', 'evidence_collection', 'awaiting_court_date', 'hearing_scheduled', 'in_progress', 'settled'],
  family:     ['filed', 'under_review', 'mediation', 'hearing_scheduled', 'in_progress', 'settled'],
  commercial: ['filed', 'under_review', 'evidence_collection', 'mediation', 'in_progress', 'settled'],
  labour:     ['filed', 'under_review', 'mediation', 'hearing_scheduled', 'in_progress', 'verdict'],
  property:   ['filed', 'under_review', 'evidence_collection', 'in_progress', 'settled'],
  immigration:['filed', 'under_review', 'evidence_collection', 'in_progress', 'closed'],
  default:    ['filed', 'under_review', 'evidence_collection', 'in_progress', 'settled'],
}

const KEYWORD_MAP: [string[], string][] = [
  [['criminal', 'pénal', 'penal'],                          'criminal'],
  [['family', 'famille', 'divorce', 'custody', 'inheritance', 'succession'], 'family'],
  [['labour', 'labor', 'employment', 'travail'],            'labour'],
  [['commercial', 'corporate', 'contract', 'business', 'debt'], 'commercial'],
  [['property', 'real estate', 'immobilier', 'land', 'foncier'], 'property'],
  [['immigration', 'visa', 'asylum', 'asile'],              'immigration'],
  [['civil', 'tort'],                                        'civil'],
]

export function getPipeline(caseType: string): string[] {
  const ct = (caseType ?? '').toLowerCase()
  for (const [keywords, key] of KEYWORD_MAP) {
    if (keywords.some(k => ct.includes(k))) return PIPELINES[key]
  }
  return PIPELINES.default
}

export function getNextStatus(caseType: string, currentStatus: string): string | null {
  const stages = getPipeline(caseType)
  const idx = stages.indexOf(currentStatus)
  return idx >= 0 && idx + 1 < stages.length ? stages[idx + 1] : null
}

const EXTRA_TRANSITIONS: Record<string, string[]> = {
  in_progress:       ['verdict', 'settled', 'dismissed', 'mediation'],
  hearing_scheduled: ['hearing_adjourned', 'in_progress', 'dismissed'],
  hearing_adjourned: ['hearing_scheduled', 'dismissed'],
  mediation:         ['settled', 'hearing_scheduled', 'in_progress'],
  verdict:           ['appeal_filed', 'closed'],
  appeal_filed:      ['appeal_in_progress'],
  appeal_in_progress:['verdict', 'settled', 'dismissed'],
  settled:           ['closed'],
  dismissed:         ['closed'],
}

export const TERMINAL = new Set(['closed', 'dismissed', 'archived', 'settled', 'verdict'])

export function getAllowedTransitions(caseType: string, currentStatus: string): string[] {
  if (TERMINAL.has(currentStatus)) return []
  const stages = getPipeline(caseType)
  const allowed = new Set<string>()
  const idx = stages.indexOf(currentStatus)
  if (idx >= 0) stages.slice(idx + 1).forEach(s => allowed.add(s))
  ;(EXTRA_TRANSITIONS[currentStatus] ?? []).forEach(s => allowed.add(s))
  allowed.add('archived')
  allowed.add('dismissed')
  return [...allowed]
}

// ── Bilingual status messages ────────────────────────────────────────────────

type Msg = { headline: string; detail: string; next: string; estimate: string }
type BiMsg = { en: Msg; fr: Msg }

const MESSAGES: Record<string, BiMsg> = {
  filed: {
    en: { headline: 'Your case has been filed', detail: 'Your case has been officially registered and your legal team has been notified. Your case file is now open.', next: 'Your lawyer will begin reviewing your case and may contact you for additional information.', estimate: 'Review typically begins within 1–2 business days.' },
    fr: { headline: 'Votre dossier a été déposé', detail: 'Votre dossier a été officiellement enregistré et votre équipe juridique en a été informée. Votre dossier est maintenant ouvert.', next: 'Votre avocat commencera à examiner votre dossier et pourra vous contacter pour des informations supplémentaires.', estimate: "L'examen commence généralement dans 1 à 2 jours ouvrables." },
  },
  under_review: {
    en: { headline: 'Your lawyer is reviewing your case', detail: 'Your lawyer is carefully analysing all aspects of your case — reviewing the facts, applicable laws, and building a legal strategy tailored to your situation.', next: 'Your lawyer will next begin gathering evidence. You may be asked to provide documents.', estimate: 'Review typically takes 3–7 business days.' },
    fr: { headline: 'Votre avocat examine votre dossier', detail: "Votre avocat analyse attentivement tous les aspects de votre affaire et élabore une stratégie juridique adaptée.", next: "Votre avocat procédera ensuite à la collecte des preuves. Des documents supplémentaires pourraient vous être demandés.", estimate: "L'examen prend généralement 3 à 7 jours ouvrables." },
  },
  evidence_collection: {
    en: { headline: 'Evidence is being gathered', detail: 'Your legal team is actively collecting evidence, documents, and statements that support your case. This phase directly impacts the strength of your position.', next: 'Once evidence is complete, your lawyer will file with the court or relevant authority.', estimate: 'Evidence collection typically takes 1–3 weeks.' },
    fr: { headline: 'Collecte des preuves en cours', detail: 'Votre équipe juridique collecte activement les preuves, documents et témoignages. Cette phase est déterminante pour la solidité de votre dossier.', next: "Une fois les preuves rassemblées, votre avocat déposera les documents nécessaires.", estimate: 'La collecte prend généralement 1 à 3 semaines.' },
  },
  awaiting_court_date: {
    en: { headline: 'Waiting for a court date', detail: "Your case has been submitted to the court and is awaiting a scheduled hearing date. Court scheduling depends on the court's calendar.", next: 'You will be notified as soon as a hearing date is set. Make sure you are available.', estimate: 'Court dates are typically set within 2–8 weeks.' },
    fr: { headline: "En attente d'une date d'audience", detail: "Votre dossier a été soumis au tribunal et attend une date d'audience. Les délais dépendent du calendrier du tribunal.", next: "Vous serez informé dès qu'une date d'audience sera fixée.", estimate: "Les audiences sont généralement fixées dans 2 à 8 semaines." },
  },
  hearing_scheduled: {
    en: { headline: 'A hearing has been scheduled', detail: 'A formal court hearing has been set for your case. Both sides will present their arguments before the court.', next: 'Prepare any documents your lawyer requests. Dress formally and arrive early.', estimate: 'Hearings are usually within 1–3 weeks.' },
    fr: { headline: 'Une audience a été fixée', detail: "Une audience formelle a été fixée. Les deux parties présenteront leurs arguments devant le tribunal.", next: "Préparez les documents demandés par votre avocat. Habillez-vous formellement et arrivez tôt.", estimate: "Les audiences ont généralement lieu dans 1 à 3 semaines." },
  },
  hearing_adjourned: {
    en: { headline: 'Hearing adjourned — rescheduling', detail: "Today's hearing was postponed. This is a normal occurrence and does not affect the merits of your case.", next: 'Your lawyer is securing a new hearing date and will notify you once confirmed.', estimate: 'A new date is typically set within 1–4 weeks.' },
    fr: { headline: 'Audience ajournée — report en cours', detail: "L'audience d'aujourd'hui a été reportée. Cela est courant et n'affecte pas le fond de votre affaire.", next: "Votre avocat travaille à obtenir une nouvelle date. Vous serez informé dès confirmation.", estimate: 'Une nouvelle date est généralement fixée dans 1 à 4 semaines.' },
  },
  in_progress: {
    en: { headline: 'Proceedings are underway', detail: 'Your case is actively being heard and argued before the court. Your legal team is presenting your case and responding to all claims.', next: 'Your lawyer will update you after each session. Follow all instructions carefully.', estimate: 'Duration varies. Your lawyer will advise on expected timelines.' },
    fr: { headline: 'La procédure est en cours', detail: "Votre affaire est activement entendue devant le tribunal. Votre équipe juridique présente votre dossier.", next: "Votre avocat vous tiendra informé après chaque séance.", estimate: "La durée est variable. Votre avocat vous conseillera sur les délais." },
  },
  mediation: {
    en: { headline: 'Mediation is in progress', detail: 'Both parties are working with a neutral mediator to reach a mutually acceptable resolution without a full trial. Mediation is confidential and often leads to faster outcomes.', next: 'If mediation succeeds, the case resolves with a settlement. If not, court proceedings resume.', estimate: 'Mediation sessions typically last 1–5 days.' },
    fr: { headline: 'La médiation est en cours', detail: "Les deux parties travaillent avec un médiateur neutre pour trouver une solution amiable. La médiation est confidentielle.", next: "Si la médiation réussit, l'affaire sera résolue par accord amiable. Sinon, la procédure reprendra.", estimate: 'Les séances de médiation durent généralement 1 à 5 jours.' },
  },
  verdict: {
    en: { headline: 'A verdict has been rendered', detail: "The court has delivered its judgment. Your lawyer will explain the full implications and advise on all available next steps.", next: 'Review the verdict carefully with your lawyer. If you wish to appeal, strict deadlines apply — act promptly.', estimate: 'You typically have 30 days to file an appeal.' },
    fr: { headline: 'Un verdict a été rendu', detail: "Le tribunal a rendu son jugement. Votre avocat vous expliquera toutes les implications et vous conseillera sur les prochaines étapes.", next: "Examinez attentivement le verdict. Si vous souhaitez faire appel, des délais stricts s'appliquent.", estimate: 'Vous disposez généralement de 30 jours pour faire appel.' },
  },
  settled: {
    en: { headline: 'Your case has been settled', detail: 'Both parties have reached a settlement, resolving the matter without further court proceedings. This is often the most efficient and private resolution.', next: 'Your lawyer will finalise the settlement agreement. Keep your copy — it is legally binding.', estimate: 'Settlement paperwork is completed within 5–10 business days.' },
    fr: { headline: "Votre affaire a été réglée à l'amiable", detail: "Les deux parties ont conclu un accord amiable, résolvant le litige sans nouvelle procédure.", next: "Votre avocat finalisera l'accord. Conservez votre copie — c'est un document juridiquement contraignant.", estimate: "Les formalités sont généralement complétées en 5 à 10 jours ouvrables." },
  },
  appeal_filed: {
    en: { headline: 'An appeal has been filed', detail: 'A formal appeal has been submitted to a higher court requesting a review of the original verdict.', next: 'The appeal court will schedule your case. Your lawyer will prepare a comprehensive brief.', estimate: 'Appeals are typically heard within 3–6 months of filing.' },
    fr: { headline: 'Un appel a été formé', detail: "Un appel formel a été déposé auprès d'une juridiction supérieure demandant le réexamen du verdict initial.", next: "La cour d'appel planifiera votre affaire. Votre avocat préparera un mémoire d'appel.", estimate: "Les appels sont généralement entendus dans un délai de 3 à 6 mois." },
  },
  appeal_in_progress: {
    en: { headline: 'Appeal proceedings are underway', detail: "Your appeal is actively being heard by the appellate court, which is reviewing the legal arguments from the original trial.", next: 'Your lawyer will argue your position before the appellate judges. A new decision will be issued.', estimate: 'Appellate decisions are typically issued within 1–3 months.' },
    fr: { headline: "La procédure d'appel est en cours", detail: "Votre appel est activement examiné par la cour d'appel, qui révise les arguments juridiques.", next: "Votre avocat plaidera devant les juges d'appel. Une nouvelle décision sera rendue.", estimate: "Les décisions d'appel sont généralement rendues dans 1 à 3 mois." },
  },
  closed: {
    en: { headline: 'Your case is now closed', detail: 'All proceedings have concluded and your case has been officially closed. All obligations have been fulfilled.', next: 'No further action required. Retain all case documents. Contact your lawyer if new issues arise.', estimate: 'Case closed.' },
    fr: { headline: 'Votre dossier est maintenant clôturé', detail: "Toutes les procédures sont terminées et votre dossier a été officiellement clôturé.", next: "Aucune action supplémentaire requise. Conservez tous les documents. Contactez votre avocat si de nouveaux problèmes surviennent.", estimate: 'Dossier clôturé.' },
  },
  dismissed: {
    en: { headline: 'Case dismissed', detail: "The court has dismissed this case. Your lawyer will explain the grounds for dismissal and any available remedies.", next: 'Discuss with your lawyer whether to re-file, appeal, or explore alternatives.', estimate: 'Consult your lawyer within 15 days — dismissal deadlines are strict.' },
    fr: { headline: 'Affaire classée', detail: "Le tribunal a classé cette affaire. Votre avocat vous expliquera les motifs du classement.", next: "Discutez avec votre avocat de la possibilité de redéposer, de faire appel ou d'explorer d'autres options.", estimate: 'Consultez votre avocat dans les 15 jours — les délais de recours sont stricts.' },
  },
}

const DEFAULT_MSG: BiMsg = {
  en: { headline: 'Case status updated', detail: 'Your lawyer has updated the status of your case. Contact your lawyer if you have any questions.', next: 'Your lawyer will keep you informed of all further developments.', estimate: '' },
  fr: { headline: 'Statut du dossier mis à jour', detail: 'Votre avocat a mis à jour le statut de votre dossier. Contactez votre avocat si vous avez des questions.', next: 'Votre avocat vous tiendra informé de tous les développements ultérieurs.', estimate: '' },
}

export function getStatusMessage(status: string): BiMsg {
  return MESSAGES[status] ?? DEFAULT_MSG
}

export function buildWorkflow(caseType: string, currentStatus: string) {
  const stages      = getPipeline(caseType)
  const nextStatus  = getNextStatus(caseType, currentStatus)
  const transitions = getAllowedTransitions(caseType, currentStatus)
  const msg         = getStatusMessage(currentStatus)
  const previews: Record<string, Msg> = {}
  transitions.forEach(s => { previews[s] = getStatusMessage(s).en })
  return {
    stages,
    next_status:         nextStatus,
    allowed_transitions: transitions,
    current_message:     msg,
    transition_previews: previews,
  }
}
