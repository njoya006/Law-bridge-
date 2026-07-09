'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import PublicHeader from '../components/layout/PublicHeader'

// ── Types ─────────────────────────────────────────────────────────────────────
type Lang = 'en' | 'fr'

// ── Bilingual Content ─────────────────────────────────────────────────────────
const T = {
  en: {
    badge: '🇨🇲  Built for Cameroon · OHADA · Bijural · Bilingual',
    heroTitle1: 'Legal Practice,',
    heroTitle2: 'Reimagined for Africa',
    heroSub: "Enterprise-grade legal management for Cameroon's legal professionals — bijural, bilingual, and built for growth.",
    heroCta1: 'Get Started Free',
    heroCta2: 'See the Platform',
    stats: [{ val: '2,000+', label: 'Professionals' }, { val: '5,000+', label: 'Cases Managed' }, { val: '98%', label: 'Satisfaction Rate' }, { val: '26+', label: 'Law Books' }],
    trustLabel: "Recognized across Cameroon's dual legal system",
    forWhomTitle: 'Built for everyone in your legal journey',
    forLawyerTitle: 'For Lawyers & Firms',
    forLawyerSub: 'Everything you need to run a modern, efficient legal practice.',
    forLawyerFeatures: ['AI-powered legal research & document drafting', 'Full-lifecycle case management (16+ statuses)', 'Firm team management with role-based access', 'Encrypted document vault with version control', 'Mobile money invoicing & XAF payment tracking', 'CamLex library publishing & firm collections', 'Open case marketplace & partnership program', 'AI-generated firm analytics & actionable reports'],
    forLawyerCta: 'Start as a Lawyer →',
    forClientTitle: 'For Clients',
    forClientSub: 'Find expert legal help, track your case, and stay informed every step.',
    forClientFeatures: ['Discover & book verified Cameroonian lawyers', 'Real-time case status tracking & full timeline', 'Secure document sharing with your lawyer', 'Pay via MTN Money or Orange Money (XAF)', 'Direct messaging in English or French', 'AI intake forms tailored to your case type', 'Bilingual support throughout your case', 'Consultation booking & calendar management'],
    forClientCta: 'Get Legal Help →',
    featuresTitle: 'Everything your practice needs',
    featuresSub: 'A complete platform built around how Cameroonian lawyers actually work',
    aiTitle: "Africa's First",
    aiTitleGold: 'AI Legal Co-Pilot',
    aiSub: 'From research to court, our AI understands Cameroonian law — bijural, bilingual, and grounded in OHADA.',
    aiTabs: ['Legal Research', 'Document Drafting', 'Document Analysis', 'Case Triage'],
    aiContent: [
      { title: 'Instant Legal Research with Citations', sub: 'Ask any legal question. Get cited answers grounded in Cameroonian and OHADA law.', points: ['Cited answers from Civil Code, Penal Code, Labour Code & Constitution', 'OHADA Uniform Acts cross-referencing built in', 'Bijural support: Common Law & Civil Law traditions', 'Confidence scoring: high / medium / low', 'English & French output on demand'] },
      { title: 'Draft Any Legal Document in Seconds', sub: '10+ professional document types, bilingual output, streaming generation.', points: ['Demand letters, motions, affidavits, contracts & appeals', 'Legal memos, settlement proposals, court letters', 'Bilingual EN/FR output on demand', 'Cameroonian legal citations auto-inserted', 'Versioning & saved draft management'] },
      { title: 'Instant Document Analysis', sub: 'Upload any PDF or DOCX — get risks, compliance checks, and recommendations.', points: ['Contract risk scoring clause by clause', 'Missing clause detection', 'OHADA compliance verification', 'Unfair terms flagging', 'Summary, key points & action items'] },
      { title: 'Smart Case Triage & Lawyer Matching', sub: 'AI scores lawyers 0–100 for every new case, surfacing the best match instantly.', points: ['Specialization & expertise alignment scoring', 'Circuit and jurisdiction matching', 'Availability & capacity check', 'Urgency detection & flagging', 'One-click assignment recommendation'] },
    ],
    caseTitle: 'Full-Lifecycle Case Management',
    caseSub: 'From intake to verdict — every stage, every document, every deadline, in one place.',
    casePoints: ['16+ case status stages with full audit timeline', 'AI-generated intake forms per case type & circuit', 'Smart reassignment with multi-factor conflict detection', 'Case notes, documents, billing & calendar per matter', 'Open case marketplace for firm applications', 'Criminal, civil, property, family, commercial, labour'],
    caseBadge1: 'Common Law', caseBadge2: 'Civil Law',
    howTitle: 'Up and running in minutes',
    howSteps: [
      { n: '01', title: 'Register', sub: 'Create your lawyer or client account. Verify credentials and build your profile.' },
      { n: '02', title: 'Connect', sub: 'Lawyers build searchable profiles. Clients discover, review, and book the right professional.' },
      { n: '03', title: 'Manage', sub: 'Cases, documents, payments, and AI tools — all in one unified platform.' },
    ],
    camTitle: 'CamLex — Legal Knowledge for Cameroon',
    camSub: "Cameroon's first digital legal library: 26+ treatises, articles, and OHADA resources in one place.",
    camPoints: ['26+ published legal treatises — OHADA, Labour, Criminal, Constitutional, Land, IP, and more', 'Short-form legal articles, case summaries, analysis, and commentary from practitioners', 'Lawyers can publish; firms can curate private collections for their teams'],
    camCta: 'Browse the Library →',
    firmTitle: 'Built for Firms, Not Just Lawyers',
    firmSub: 'Complete firm management: team roles, partnerships, verification, and AI-powered analytics.',
    firmPoints: ['Team roles: Owner, Admin, Partner, Associate, Guest', 'Email invitation system with role assignment', 'Firm verification & bar number validation', 'Partnership program with revenue share configuration', 'AI-powered firm insights & bottleneck detection', 'Secretary portal for administrative workflows', 'Report generation: financial, case, and team activity'],
    firmBadge: '✓ Verified Firm',
    payTitle: 'Payments Built for Cameroon',
    paySub: 'Accept mobile money, bank transfers, and cash — all tracked in XAF.',
    payMethods: [{ name: 'MTN Mobile Money', icon: '📱', color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30', sub: 'Instant XAF transfers' }, { name: 'Orange Money', icon: '🟠', color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30', sub: 'Secure mobile payments' }, { name: 'Bank Transfer', icon: '🏦', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30', sub: 'Wire & BEAC transfers' }],
    payFlow: ['Draft', 'Issued', 'Partial', 'Paid ✓'],
    payNote: 'All amounts in CFA Franc (XAF)',
    secTitle: 'Bank-grade security for legal data',
    secSub: "Your clients' information is protected with enterprise-grade security at every layer.",
    secItems: [{ icon: '🔐', label: 'AES Encryption', sub: 'All documents encrypted before storage' }, { icon: '🛡️', label: 'Role-based Access', sub: 'JWT-secured per-role permissions' }, { icon: '🦠', label: 'Virus Scanning', sub: 'Every file scanned before storage' }, { icon: '📋', label: 'Full Audit Trails', sub: 'Every action logged with timestamps' }, { icon: '🔒', label: 'Per-case Isolation', sub: 'Strict data isolation between matters' }, { icon: '⚖️', label: 'Bijural Compliance', sub: 'Common Law & Civil Law data handling' }],
    secTrust: 'Your client data never leaves secure, encrypted storage.',
    statsTitle: 'Built at scale',
    statsItems: [{ val: 13, suffix: '', label: 'Integrated Services' }, { val: 10, suffix: '+', label: 'AI Capabilities' }, { val: 5, suffix: '', label: 'User Roles' }, { val: 2, suffix: '', label: 'Legal Traditions' }],
    testimonialsTitle: 'Trusted by legal professionals',
    testimonials: [
      { quote: 'LawBridge transformed how I manage cases. The AI assistant drafts documents in seconds — what used to take me hours.', name: 'Me. Alain Mbarga', role: 'Barrister, Yaoundé Court of Appeal', initials: 'AM', color: 'from-gold-500 to-gold-600' },
      { quote: "The team management and analytics features give me complete firm visibility. We've reduced administrative overhead by 60%.", name: 'Maître Sophie Nkoumazok', role: 'Managing Partner, Douala', initials: 'SN', color: 'from-emerald-500 to-emerald-600' },
      { quote: "I tracked my property case in real time. Booking my lawyer took minutes, and I paid via Orange Money. An incredible experience.", name: 'Jean-Pierre Fotso', role: 'Client, Bafoussam', initials: 'JF', color: 'from-primary-500 to-primary-600' },
    ],
    ctaTitle: 'Transform your legal practice today',
    ctaSub: 'Join legal professionals across Cameroon and the CEMAC region',
    ctaBtn1: 'Get Started Free',
    ctaBtn2: 'Book a Demo',
    footerTagline: "Legal technology built for Africa's legal professionals.",
    footerCols: [
      { title: 'Platform', links: [{ label: 'Case Management', href: '#features' }, { label: 'AI Assistant', href: '#ai' }, { label: 'Document Vault', href: '#features' }, { label: 'Library', href: '/library' }, { label: 'Payments', href: '#features' }, { label: 'Booking', href: '#features' }] },
      { title: 'Resources', links: [{ label: 'Security', href: '#security' }, { label: 'Firm Guide', href: '#firm' }, { label: 'API Docs', href: '/support' }, { label: 'Support', href: '/support' }] },
      { title: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Blog', href: '/about' }, { label: 'Careers', href: '/about' }, { label: 'Contact', href: '/support' }] },
      { title: 'Legal', links: [{ label: 'Privacy Policy', href: '#' }, { label: 'Terms of Service', href: '#' }, { label: 'Cookie Policy', href: '#' }] },
    ],
    footerCopy: '© 2026 LawBridge. All rights reserved.',
    footerBuilt: 'Built with care for Cameroonian legal professionals.',
  },
  fr: {
    badge: '🇨🇲  Conçu pour le Cameroun · OHADA · Bijuridique · Bilingue',
    heroTitle1: 'La Pratique Juridique,',
    heroTitle2: "Réinventée pour l'Afrique",
    heroSub: "Gestion juridique de niveau entreprise pour les professionnels du droit camerounais — bijuridique, bilingue et conçu pour la croissance.",
    heroCta1: 'Commencer Gratuitement',
    heroCta2: 'Voir la Plateforme',
    stats: [{ val: '2 000+', label: 'Professionnels' }, { val: '5 000+', label: 'Dossiers Gérés' }, { val: '98%', label: 'Satisfaction' }, { val: '26+', label: 'Livres de Droit' }],
    trustLabel: "Reconnu dans le double système juridique du Cameroun",
    forWhomTitle: 'Conçu pour tous dans votre parcours juridique',
    forLawyerTitle: 'Pour les Avocats et Cabinets',
    forLawyerSub: 'Tout ce dont vous avez besoin pour gérer un cabinet moderne et efficace.',
    forLawyerFeatures: ["Recherche juridique IA & rédaction de documents", "Gestion complète des dossiers (16+ statuts)", "Gestion d'équipe avec accès par rôle", "Coffre-fort de documents chiffrés avec versionnage", "Facturation mobile money & suivi des paiements XAF", "Publication dans la bibliothèque CamLex", "Place de marché des affaires & programme de partenariat", "Analytique de cabinet IA & rapports actionnables"],
    forLawyerCta: 'Commencer comme Avocat →',
    forClientTitle: 'Pour les Clients',
    forClientSub: 'Trouvez une aide juridique experte, suivez votre dossier et restez informé à chaque étape.',
    forClientFeatures: ["Découvrez & réservez des avocats camerounais vérifiés", "Suivi du statut du dossier en temps réel", "Partage sécurisé de documents avec votre avocat", "Paiement via MTN Money ou Orange Money (XAF)", "Messagerie directe en anglais ou en français", "Formulaires d'intake IA adaptés à votre dossier", "Assistance bilingue tout au long de votre dossier", "Réservation de consultation & gestion du calendrier"],
    forClientCta: 'Obtenir une Aide Juridique →',
    featuresTitle: "Tout ce dont votre cabinet a besoin",
    featuresSub: "Une plateforme complète construite autour du fonctionnement réel des avocats camerounais",
    aiTitle: "Le Premier",
    aiTitleGold: "Co-Pilote Juridique IA d'Afrique",
    aiSub: "De la recherche au tribunal, notre IA comprend le droit camerounais — bijuridique, bilingue et intégrant le cadre OHADA.",
    aiTabs: ['Recherche Juridique', 'Rédaction', 'Analyse de Documents', 'Triage de Dossiers'],
    aiContent: [
      { title: 'Recherche Juridique Instantanée avec Citations', sub: 'Posez toute question. Obtenez des réponses citées du droit camerounais et OHADA.', points: ['Réponses citées du Code Civil, Code Pénal, Code du Travail & Constitution', 'Référencement des Actes Uniformes OHADA', 'Support bijuridique: Common Law & Droit Civil', 'Score de confiance: élevé / moyen / faible', 'Sortie en anglais & français'] },
      { title: 'Rédigez Tout Document en Secondes', sub: '10+ types de documents professionnels, sortie bilingue, génération en flux.', points: ["Mises en demeure, requêtes, affidavits, contrats & appels", "Mémorandums juridiques, propositions de règlement, lettres aux tribunaux", "Sortie bilingue EN/FR à la demande", "Citations juridiques camerounaises auto-insérées", "Versionnage & gestion des brouillons"] },
      { title: 'Analyse de Documents Instantanée', sub: 'Téléchargez un PDF ou DOCX — obtenez risques, conformité et recommandations.', points: ["Évaluation des risques clause par clause", "Détection des clauses manquantes", "Vérification de conformité OHADA", "Signalement des clauses abusives", "Résumé, points clés & actions recommandées"] },
      { title: 'Triage Intelligent & Correspondance', sub: "L'IA note les avocats de 0 à 100 pour chaque nouveau dossier.", points: ["Alignement des spécialisations & expertises", "Correspondance circuit/juridiction", "Vérification de disponibilité & capacité", "Détection & signalement d'urgence", "Recommandation d'affectation en un clic"] },
    ],
    caseTitle: 'Gestion Complète du Cycle de Vie des Dossiers',
    caseSub: "De l'intake au verdict — chaque étape, chaque document, chaque délai, en un seul endroit.",
    casePoints: ['16+ statuts avec audit complet de la chronologie', "Formulaires d'intake générés par IA selon le type de dossier", 'Réaffectation intelligente avec détection de conflits', 'Notes, documents, facturation & calendrier par dossier', 'Place de marché ouverte pour les candidatures de cabinets', 'Pénal, civil, foncier, familial, commercial, social'],
    caseBadge1: 'Common Law', caseBadge2: 'Droit Civil',
    howTitle: 'Opérationnel en quelques minutes',
    howSteps: [
      { n: '01', title: "S'inscrire", sub: "Créez votre compte avocat ou client. Vérifiez vos accréditations et configurez votre profil." },
      { n: '02', title: 'Se Connecter', sub: "Les avocats créent des profils consultables. Les clients découvrent, évaluent et réservent le professionnel idéal." },
      { n: '03', title: 'Gérer', sub: "Dossiers, documents, paiements et outils IA — tout dans une plateforme unifiée." },
    ],
    camTitle: 'CamLex — Savoir Juridique pour le Cameroun',
    camSub: "La première bibliothèque juridique numérique du Cameroun: 26+ traités, articles et ressources OHADA.",
    camPoints: ["26+ traités juridiques publiés — OHADA, Travail, Pénal, Constitutionnel, Foncier, PI et plus", "Articles courts, résumés de jurisprudence, analyses et actualités juridiques des praticiens", "Les avocats peuvent publier; les cabinets peuvent organiser des collections privées pour leurs équipes"],
    camCta: 'Parcourir la Bibliothèque →',
    firmTitle: 'Conçu pour les Cabinets, Pas Seulement les Avocats',
    firmSub: 'Gestion complète: rôles équipe, partenariats, vérification et analytique IA.',
    firmPoints: ["Rôles: Propriétaire, Admin, Associé, Collaborateur, Invité", "Système d'invitation par email avec attribution des rôles", "Vérification du cabinet & validation du numéro de barreau", "Programme de partenariat avec configuration du partage des revenus", "Insights de cabinet IA & détection des goulots d'étranglement", "Portail secrétaire pour les flux de travail administratifs", "Génération de rapports: financiers, dossiers, activité d'équipe"],
    firmBadge: '✓ Cabinet Vérifié',
    payTitle: 'Paiements Conçus pour le Cameroun',
    paySub: 'Acceptez le mobile money, les virements et les espèces — tout suivi en XAF.',
    payMethods: [{ name: 'MTN Mobile Money', icon: '📱', color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30', sub: 'Transferts XAF instantanés' }, { name: 'Orange Money', icon: '🟠', color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30', sub: 'Paiements mobiles sécurisés' }, { name: 'Virement Bancaire', icon: '🏦', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30', sub: 'Virements BEAC & bancaires' }],
    payFlow: ['Brouillon', 'Émise', 'Partielle', 'Payée ✓'],
    payNote: 'Tous les montants en Franc CFA (XAF)',
    secTitle: 'Sécurité bancaire pour les données juridiques',
    secSub: "Les informations de vos clients sont protégées avec une sécurité de niveau entreprise à chaque couche.",
    secItems: [{ icon: '🔐', label: 'Chiffrement AES', sub: 'Tous les documents chiffrés avant stockage' }, { icon: '🛡️', label: 'Accès par Rôle', sub: 'Permissions JWT sécurisées par rôle' }, { icon: '🦠', label: 'Analyse Antivirus', sub: 'Chaque fichier analysé avant stockage' }, { icon: '📋', label: 'Pistes d\'Audit', sub: 'Chaque action enregistrée avec horodatage' }, { icon: '🔒', label: 'Isolation par Dossier', sub: 'Isolation stricte des données entre affaires' }, { icon: '⚖️', label: 'Conformité Bijuridique', sub: 'Gestion Common Law & Droit Civil' }],
    secTrust: "Les données de vos clients ne quittent jamais un stockage sécurisé et chiffré.",
    statsTitle: 'Construit à grande échelle',
    statsItems: [{ val: 13, suffix: '', label: 'Services Intégrés' }, { val: 10, suffix: '+', label: 'Capacités IA' }, { val: 5, suffix: '', label: 'Rôles Utilisateurs' }, { val: 2, suffix: '', label: 'Traditions Juridiques' }],
    testimonialsTitle: 'Approuvé par les professionnels du droit',
    testimonials: [
      { quote: "LawBridge a transformé ma gestion des dossiers. L'assistant IA rédige des documents en secondes — ce qui me prenait des heures auparavant.", name: 'Me. Alain Mbarga', role: "Avocat, Cour d'Appel de Yaoundé", initials: 'AM', color: 'from-gold-500 to-gold-600' },
      { quote: "Les fonctionnalités de gestion d'équipe et d'analytique me donnent une visibilité complète. Nous avons réduit le temps administratif de 60%.", name: 'Maître Sophie Nkoumazok', role: 'Associée Directrice, Douala', initials: 'SN', color: 'from-emerald-500 to-emerald-600' },
      { quote: "J'ai suivi mon dossier foncier en temps réel. Réserver mon avocat a pris quelques minutes, et j'ai payé via Orange Money. Expérience incroyable.", name: 'Jean-Pierre Fotso', role: 'Client, Bafoussam', initials: 'JF', color: 'from-primary-500 to-primary-600' },
    ],
    ctaTitle: "Transformez votre pratique juridique aujourd'hui",
    ctaSub: 'Rejoignez les professionnels du droit à travers le Cameroun et la région CEMAC',
    ctaBtn1: 'Commencer Gratuitement',
    ctaBtn2: 'Réserver une Démo',
    footerTagline: "Technologie juridique pour les professionnels du droit en Afrique.",
    footerCols: [
      { title: 'Plateforme', links: [{ label: 'Gestion de Dossiers', href: '#features' }, { label: 'Assistant IA', href: '#ai' }, { label: 'Coffre-fort', href: '#features' }, { label: 'Bibliothèque', href: '/library' }, { label: 'Paiements', href: '#features' }, { label: 'Réservation', href: '#features' }] },
      { title: 'Ressources', links: [{ label: 'Sécurité', href: '#security' }, { label: 'Guide Cabinet', href: '#firm' }, { label: 'Docs API', href: '/support' }, { label: 'Support', href: '/support' }] },
      { title: 'Entreprise', links: [{ label: 'À Propos', href: '/about' }, { label: 'Blog', href: '/about' }, { label: 'Carrières', href: '/about' }, { label: 'Contact', href: '/support' }] },
      { title: 'Légal', links: [{ label: 'Confidentialité', href: '#' }, { label: "Conditions d'Utilisation", href: '#' }, { label: 'Cookies', href: '#' }] },
    ],
    footerCopy: '© 2026 LawBridge. Tous droits réservés.',
    footerBuilt: 'Conçu avec soin pour les professionnels du droit camerounais.',
  },
}

// ── Feature cards (icon components inline) ────────────────────────────────────
const FEATURES = [
  { titleEn: 'Case Management', titleFr: 'Gestion des Dossiers', descEn: '16+ status stages, full audit timeline, and bijural support across all case types.', descFr: "16+ statuts, audit complet et support bijuridique pour tous types d'affaires.", accent: 'from-gold-500 to-gold-600', border: 'hover:border-gold-400/40', glow: 'group-hover:shadow-gold-500/20',
    Icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg> },
  { titleEn: 'AI Legal Assistant', titleFr: 'Assistant Juridique IA', descEn: 'Research, drafting, analysis, and case triage — all powered by Cameroonian law knowledge.', descFr: "Recherche, rédaction, analyse et triage — tout propulsé par la connaissance du droit camerounais.", accent: 'from-emerald-500 to-emerald-600', border: 'hover:border-emerald-400/40', glow: 'group-hover:shadow-emerald-500/20',
    Icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2z"/><path d="M12 6v6l4 2"/></svg> },
  { titleEn: 'Smart Booking', titleFr: 'Réservation Intelligente', descEn: 'Calendar management, consultation booking, and automated reminders for every matter.', descFr: "Gestion du calendrier, réservation de consultations et rappels automatiques pour chaque dossier.", accent: 'from-primary-500 to-primary-600', border: 'hover:border-primary-400/40', glow: 'group-hover:shadow-primary-500/20',
    Icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { titleEn: 'Document Vault', titleFr: 'Coffre-fort de Documents', descEn: 'Encrypted storage, virus scanning, full version control, and per-case access control.', descFr: "Stockage chiffré, analyse antivirus, contrôle de version complet et accès par dossier.", accent: 'from-amber-500 to-amber-600', border: 'hover:border-amber-400/40', glow: 'group-hover:shadow-amber-500/20',
    Icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
  { titleEn: 'Mobile Payments', titleFr: 'Paiements Mobiles', descEn: 'MTN Money, Orange Money, bank transfers — XAF invoicing and payment tracking built in.', descFr: "MTN Money, Orange Money, virements bancaires — facturation XAF et suivi des paiements intégrés.", accent: 'from-orange-500 to-orange-600', border: 'hover:border-orange-400/40', glow: 'group-hover:shadow-orange-500/20',
    Icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
  { titleEn: 'CamLex Library', titleFr: 'Bibliothèque CamLex', descEn: '26+ published legal treatises and articles covering OHADA, Civil, Criminal, and more.', descFr: "26+ traités juridiques et articles couvrant l'OHADA, le Droit Civil, Pénal, et plus.", accent: 'from-purple-500 to-purple-600', border: 'hover:border-purple-400/40', glow: 'group-hover:shadow-purple-500/20',
    Icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> },
  { titleEn: 'Firm & Team Hub', titleFr: 'Gestion de Cabinet', descEn: 'Roles, invitations, firm verification, partnerships, and AI-powered analytics for your team.', descFr: "Rôles, invitations, vérification, partenariats et analytique IA pour votre équipe.", accent: 'from-crimson-500 to-crimson-600', border: 'hover:border-crimson-400/40', glow: 'group-hover:shadow-crimson-500/20',
    Icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
  { titleEn: 'Real-time Messaging', titleFr: 'Messagerie en Temps Réel', descEn: 'Client-lawyer threads, AI-assisted support, and firm-internal chats linked to every case.', descFr: "Fils client-avocat, support IA et chats internes liés à chaque dossier.", accent: 'from-teal-500 to-teal-600', border: 'hover:border-teal-400/40', glow: 'group-hover:shadow-teal-500/20',
    Icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
]

// ── CamLex book covers ────────────────────────────────────────────────────────
const BOOKS = [
  { title: 'OHADA Commercial Law', area: 'Commercial', bg: 'from-blue-900 via-blue-800 to-blue-900', accent: '#3B82F6' },
  { title: 'Labour Code of Cameroon', area: 'Labour', bg: 'from-emerald-900 via-emerald-800 to-emerald-900', accent: '#10B981' },
  { title: 'Penal Code Annotated', area: 'Criminal', bg: 'from-red-900 via-red-800 to-red-900', accent: '#EF4444' },
  { title: 'Constitutional Law', area: 'Constitutional', bg: 'from-purple-900 via-purple-800 to-purple-900', accent: '#A855F7' },
  { title: 'Land Tenure Law', area: 'Land', bg: 'from-amber-900 via-amber-800 to-amber-900', accent: '#F59E0B' },
  { title: 'Family Law in Cameroon', area: 'Family', bg: 'from-pink-900 via-pink-800 to-pink-900', accent: '#EC4899' },
]

// ── Custom hooks ──────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function useCounter(target: number, active: boolean, duration = 1400) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let current = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      current += increment
      if (current >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, 16)
    return () => clearInterval(timer)
  }, [target, active, duration])
  return count
}

// ── StatCounter (extracted to avoid hooks-in-map) ────────────────────────────
function StatCounter({ val, suffix, label, active, delay }: { val: number; suffix: string; label: string; active: boolean; delay: number }) {
  const count = useCounter(val, active)
  return (
    <div className={`stagger-in ${active ? 'visible' : ''}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className="font-display text-4xl sm:text-5xl md:text-6xl font-bold gold-text-grad mb-2">{count}{suffix}</div>
      <p className="text-sm pub-muted font-medium">{label}</p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [lang, setLang] = useState<Lang>('en')
  const [aiTab, setAiTab] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('lawbridge-lang') as Lang | null
    if (saved === 'en' || saved === 'fr') setLang(saved)
  }, [])

  const handleLangChange = useCallback((l: Lang) => {
    setLang(l)
    localStorage.setItem('lawbridge-lang', l)
  }, [])

  const t = T[lang]

  // Scroll animation refs
  const featuresSv = useInView()
  const aiSv = useInView()
  const caseSv = useInView()
  const howSv = useInView()
  const camSv = useInView()
  const firmSv = useInView()
  const paySv = useInView()
  const secSv = useInView()
  const statsSv = useInView(0.3)
  const testSv = useInView()
  const ctaSv = useInView()

  if (!mounted) return null

  return (
    <>
      <style>{`
        @keyframes heroGradient {
          0%,100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes floatY {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes shimmerBadge {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes goldPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(201,146,58,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(201,146,58,0); }
        }
        @keyframes slideUp {
          from { opacity:0; transform:translateY(24px); }
          to { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity:0; }
          to { opacity:1; }
        }
        .hero-bg {
          background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(201,146,58,0.14) 0%, transparent 60%),
                      radial-gradient(ellipse 60% 50% at 80% 80%, rgba(75,120,204,0.10) 0%, transparent 50%),
                      radial-gradient(ellipse 60% 50% at 10% 60%, rgba(16,185,129,0.06) 0%, transparent 50%),
                      linear-gradient(180deg, #080e1e 0%, #0B1426 40%, #0a1128 100%);
        }
        .gold-text-grad {
          background: linear-gradient(135deg, #C9923A 0%, #f0c060 50%, #C9923A 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerBadge 4s linear infinite;
        }
        .badge-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(201,146,58,0.15) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmerBadge 2.5s linear infinite;
        }
        .float-card { animation: floatY 5s ease-in-out infinite; }
        .float-card-2 { animation: floatY 6s ease-in-out infinite 1s; }
        .slide-up-1 { animation: slideUp 0.6s ease both; }
        .slide-up-2 { animation: slideUp 0.6s ease 0.15s both; }
        .slide-up-3 { animation: slideUp 0.6s ease 0.3s both; }
        .slide-up-4 { animation: slideUp 0.6s ease 0.45s both; }
        .ai-mock-line { animation: slideUp 0.4s ease both; }
        .stagger-in { opacity:1; transform:translateY(0); transition: opacity 0.5s ease, transform 0.5s ease; }
        .stagger-in.animating { opacity:0; transform:translateY(16px); }
        .stagger-in.visible { opacity:1; transform:translateY(0); }
        .tab-bar { position:relative; }
        .tab-bar::after { content:''; position:absolute; bottom:0; left:0; right:0; height:1px; background:rgba(255,255,255,0.08); }
        .section-divider { background: linear-gradient(90deg, transparent, rgba(201,146,58,0.3), transparent); height:1px; }
      `}</style>

      <div className="min-h-screen pub-page overflow-x-hidden">
        <PublicHeader lang={lang} onLangChange={handleLangChange} />

        {/* ── 1. HERO ── */}
        <section className="hero-bg relative flex flex-col justify-center px-6 pt-28 pb-16 overflow-hidden">
          {/* decorative blobs */}
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] bg-gold-500/5 pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/6 w-[400px] h-[400px] rounded-full blur-[100px] bg-primary-500/8 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] bg-gold-500/3 pointer-events-none" />

          <div className="max-w-6xl mx-auto w-full relative">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Left: copy */}
              <div>
                {/* badge */}
                <div className="slide-up-1 inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-gold-500/25 bg-gold-500/8 relative overflow-hidden">
                  <span className="badge-shimmer absolute inset-0 rounded-full" />
                  <span className="relative text-xs font-semibold tracking-wider text-gold-400/90">{t.badge}</span>
                </div>

                <h1 className="slide-up-2 font-display text-3xl sm:text-5xl md:text-6xl xl:text-7xl font-bold leading-[1.05] mb-5 pub-heading">
                  {t.heroTitle1}<br />
                  <span className="gold-text-grad">{t.heroTitle2}</span>
                </h1>

                <p className="slide-up-3 text-base md:text-xl pub-subtext leading-relaxed mb-8 max-w-lg">
                  {t.heroSub}
                </p>

                <div className="slide-up-4 flex flex-col sm:flex-row gap-3 mb-10">
                  <Link href="/auth/register">
                    <button className="group flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-primary-900 font-bold text-base hover:opacity-95 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-gold-500/30" style={{ animation: 'goldPulse 3s ease-in-out infinite' }}>
                      {t.heroCta1}
                      <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                    </button>
                  </Link>
                  <a href="#features">
                    <button className="flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-[var(--border-default)] pub-subtext font-semibold text-base hover:border-gold-400/50 hover:text-gold-400 transition-all duration-200">
                      {t.heroCta2}
                      <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                    </button>
                  </a>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {t.stats.map((s, i) => (
                    <div key={i} className="space-y-1">
                      <div className="text-3xl font-bold text-gold-400 font-display">{s.val}</div>
                      <p className="text-xs pub-muted font-medium tracking-wide uppercase">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: floating UI cards */}
              <div className="hidden lg:flex items-center justify-center relative h-[480px]">
                {/* Main card */}
                <div className="float-card absolute top-8 left-4 right-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <div className="flex-1 bg-white/5 rounded-md h-5 ml-2 flex items-center px-2">
                      <span className="text-[10px] text-white/30">lawbridge.app/lawyer/matters</span>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {[{ title: 'Mbeki v. State Energy Corp', status: 'In Hearing', color: 'bg-blue-400' }, { title: 'Nkeng Estate Dispute', status: 'Evidence Collection', color: 'bg-amber-400' }, { title: 'TotalCam Contract Review', status: 'Closed — Won', color: 'bg-emerald-400' }].map((c, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/4 rounded-lg px-3 py-2.5">
                        <div>
                          <div className="text-xs font-semibold text-white/80">{c.title}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
                            <span className="text-[10px] text-white/40">{c.status}</span>
                          </div>
                        </div>
                        <svg className="w-3.5 h-3.5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI badge floating */}
                <div className="float-card-2 absolute bottom-12 right-0 bg-emerald-500/10 border border-emerald-400/20 backdrop-blur-xl rounded-xl px-4 py-3 flex items-center gap-2.5 shadow-xl">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-sm">⚡</div>
                  <div>
                    <div className="text-xs font-bold text-emerald-400">AI Research Complete</div>
                    <div className="text-[10px] text-white/40">3 OHADA citations found</div>
                  </div>
                </div>

                {/* Payment badge */}
                <div className="float-card absolute bottom-28 left-0 bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl px-4 py-3 flex items-center gap-2.5 shadow-xl">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center text-sm">💰</div>
                  <div>
                    <div className="text-xs font-bold text-gold-400">Payment Confirmed</div>
                    <div className="text-[10px] text-white/40">XAF 150,000 · MTN Money</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-40 animate-bounce">
            <span className="text-[10px] tracking-widest uppercase pub-muted">Scroll</span>
            <svg className="w-4 h-4 pub-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </div>
        </section>

        {/* ── 2. TRUST BAR ── */}
        <section className="py-6 border-y border-[var(--border-default)] overflow-hidden">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col sm:flex-row items-center gap-5 justify-center">
              <span className="hidden sm:block text-xs pub-muted font-medium tracking-wider uppercase whitespace-nowrap">{t.trustLabel}</span>
              <div className="w-px h-5 bg-[var(--border-default)] hidden sm:block" />
              <div className="flex flex-wrap items-center justify-center gap-2">
                {['Common Law (Anglophone)', 'Civil Law (Francophone)', 'OHADA', 'MTN Mobile Money', 'Orange Money'].map(badge => (
                  <span key={badge} className="px-3 py-1.5 rounded-full text-[11px] font-semibold border border-gold-500/20 bg-gold-500/6 text-gold-400/80 relative overflow-hidden">
                    <span className="badge-shimmer absolute inset-0 rounded-full" />
                    <span className="relative">{badge}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. WHO IT'S FOR ── */}
        <section className="px-6 py-12 md:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl sm:text-3xl md:text-5xl pub-heading font-bold mb-4">{t.forWhomTitle}</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Lawyers */}
              <div className="group relative pub-card rounded-2xl p-5 sm:p-8 border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/25 text-xl">⚖️</div>
                <h3 className="font-display text-2xl font-bold pub-heading mb-2">{t.forLawyerTitle}</h3>
                <p className="pub-subtext text-sm mb-6 leading-relaxed">{t.forLawyerSub}</p>
                <ul className="space-y-2.5 mb-8">
                  {t.forLawyerFeatures.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      <span className="text-sm pub-subtext">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register">
                  <button className="text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 group">
                    {t.forLawyerCta}
                    <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                  </button>
                </Link>
              </div>

              {/* Clients */}
              <div className="group relative pub-card rounded-2xl p-5 sm:p-8 border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gold-500/10 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center mb-5 shadow-lg shadow-gold-500/25 text-xl">👤</div>
                <h3 className="font-display text-2xl font-bold pub-heading mb-2">{t.forClientTitle}</h3>
                <p className="pub-subtext text-sm mb-6 leading-relaxed">{t.forClientSub}</p>
                <ul className="space-y-2.5 mb-8">
                  {t.forClientFeatures.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      <span className="text-sm pub-subtext">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register">
                  <button className="text-sm font-bold text-gold-400 hover:text-gold-300 transition-colors flex items-center gap-1.5 group">
                    {t.forClientCta}
                    <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider mx-6 md:mx-16" />

        {/* ── 4. FEATURES GRID ── */}
        <section id="features" className="px-6 py-12 md:py-20 pub-section-alt">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-xs font-bold tracking-widest uppercase text-gold-400/70 mb-3 block">{lang === 'en' ? 'Platform Features' : 'Fonctionnalités'}</span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-5xl pub-heading font-bold mb-4">{t.featuresTitle}</h2>
              <p className="text-lg pub-subtext max-w-2xl mx-auto">{t.featuresSub}</p>
            </div>
            <div ref={featuresSv.ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {FEATURES.map((f, i) => (
                <div
                  key={f.titleEn}
                  className={`stagger-in group pub-card rounded-2xl p-6 border border-[var(--border-default)] ${f.border} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${f.glow} ${featuresSv.inView ? 'visible' : ''}`}
                  style={{ transitionDelay: featuresSv.inView ? `${i * 60}ms` : '0ms' }}
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.accent} flex items-center justify-center mb-4 shadow-md text-white group-hover:scale-110 transition-transform duration-200`}>
                    <f.Icon />
                  </div>
                  <h3 className="font-heading text-sm font-bold pub-heading mb-2">{lang === 'en' ? f.titleEn : f.titleFr}</h3>
                  <p className="text-xs pub-subtext leading-relaxed">{lang === 'en' ? f.descEn : f.descFr}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="section-divider mx-6 md:mx-16" />

        {/* ── 5. AI SHOWCASE ── */}
        <section id="ai" className="px-6 py-12 md:py-20 relative overflow-hidden">
          {/* grid texture */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />

          <div className="max-w-6xl mx-auto relative" ref={aiSv.ref}>
            <div className="text-center mb-10">
              <span className="text-xs font-bold tracking-widest uppercase text-emerald-400/70 mb-3 block">{lang === 'en' ? 'AI-Powered' : 'Propulsé par IA'}</span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-5xl pub-heading font-bold mb-4">
                {t.aiTitle} <span className="gold-text-grad">{t.aiTitleGold}</span>
              </h2>
              <p className="text-lg pub-subtext max-w-2xl mx-auto">{t.aiSub}</p>
            </div>

            {/* Tab switcher */}
            <div className="tab-bar flex gap-1 mb-8 overflow-x-auto pb-px scrollbar-hide -mx-1 px-1">
              {t.aiTabs.map((tab, i) => (
                <button
                  key={i}
                  onClick={() => setAiTab(i)}
                  className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 border-b-2 ${aiTab === i ? 'text-gold-400 border-gold-400 bg-gold-500/8' : 'pub-muted border-transparent hover:text-[var(--text-primary)] hover:bg-white/4'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className={`grid lg:grid-cols-2 gap-6 lg:gap-10 items-start transition-all duration-500 ${aiSv.inView ? 'translate-y-0' : 'translate-y-4'}`}>
              {/* Left: content */}
              <div>
                <h3 className="font-display text-xl sm:text-2xl md:text-3xl pub-heading font-bold mb-3">{t.aiContent[aiTab].title}</h3>
                <p className="pub-subtext mb-6 leading-relaxed">{t.aiContent[aiTab].sub}</p>
                <ul className="space-y-3">
                  {t.aiContent[aiTab].points.map((p, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </div>
                      <span className="text-sm pub-subtext leading-snug">{p}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link href="/auth/register">
                    <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/25">
                      {lang === 'en' ? 'Try the AI Assistant →' : "Essayer l'Assistant IA →"}
                    </button>
                  </Link>
                </div>
              </div>

              {/* Right: AI chat mock */}
              <div className="bg-white/4 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
                {/* mock browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-white/3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                  <div className="ml-3 flex-1 bg-white/5 rounded-md h-5 flex items-center px-2">
                    <span className="text-[10px] text-white/25">LawBridge AI Assistant</span>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  {/* chat messages */}
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 shrink-0 flex items-center justify-center text-[10px] font-bold text-primary-900">A</div>
                    <div className="bg-white/6 rounded-2xl rounded-tl-none px-4 py-2.5 max-w-[80%]">
                      <p className="text-xs text-white/70">What are the OHADA rules for corporate dissolution?</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 justify-end">
                    <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-400/15 rounded-2xl rounded-tr-none px-4 py-3 max-w-[85%]">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[10px] font-semibold text-emerald-400">LawBridge AI · High Confidence</span>
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed">Under OHADA Uniform Act on Commercial Companies (AUDSC), Art. 200-204, corporate dissolution requires...</p>
                      <div className="mt-2 pt-2 border-t border-white/8 flex items-center gap-2">
                        <span className="text-[9px] text-white/30">📚 AUDSC Art. 200-204</span>
                        <span className="text-[9px] text-white/20">·</span>
                        <span className="text-[9px] text-white/30">OHADA Treaty Art. 17</span>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shrink-0 flex items-center justify-center text-[10px]">🤖</div>
                  </div>
                  {/* typing indicator */}
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 shrink-0 flex items-center justify-center text-[10px] font-bold text-primary-900">A</div>
                    <div className="bg-white/6 rounded-2xl rounded-tl-none px-4 py-2.5">
                      <p className="text-xs text-white/40 italic">Drafting follow-up question...</p>
                    </div>
                  </div>
                  {/* input bar */}
                  <div className="mt-4 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                    <input disabled className="flex-1 bg-transparent text-xs text-white/30 outline-none placeholder:text-white/20" placeholder={lang === 'en' ? 'Ask about any law in Cameroon or OHADA...' : 'Posez une question sur le droit camerounais ou OHADA...'} />
                    <button className="w-6 h-6 rounded-lg bg-emerald-500/30 flex items-center justify-center">
                      <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider mx-6 md:mx-16" />

        {/* ── 6. CASE MANAGEMENT ── */}
        <section className="px-6 py-12 md:py-20 pub-section-alt" ref={caseSv.ref}>
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left: text */}
            <div className={`transition-all duration-700 ${caseSv.inView ? 'translate-x-0' : '-translate-x-4'}`}>
              <span className="text-xs font-bold tracking-widest uppercase text-gold-400/70 mb-3 block">{lang === 'en' ? 'Core Feature' : 'Fonctionnalité Principale'}</span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl xl:text-5xl pub-heading font-bold mb-4 leading-tight">{t.caseTitle}</h2>
              <p className="pub-subtext mb-8 leading-relaxed">{t.caseSub}</p>
              <ul className="space-y-3 mb-8">
                {t.casePoints.map((p, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <span className="text-sm pub-subtext">{p}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/15 border border-blue-400/25 text-blue-400">{t.caseBadge1}</span>
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-500/15 border border-purple-400/25 text-purple-400">{t.caseBadge2}</span>
              </div>
            </div>

            {/* Right: browser mockup */}
            <div className={`transition-all duration-700 delay-200 ${caseSv.inView ? 'translate-x-0' : 'translate-x-4'}`}>
              <div className="bg-white/4 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-white/3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                  <div className="ml-3 flex-1 bg-white/5 rounded-md h-5 flex items-center px-2">
                    <span className="text-[10px] text-white/25">lawbridge.app/lawyer/matters</span>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  {/* Status header */}
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-white/80">Active Matters</h4>
                    <span className="text-[10px] text-white/30 bg-white/5 px-2 py-1 rounded-md">12 cases</span>
                  </div>
                  {/* Timeline status steps */}
                  <div className="flex items-center gap-1 overflow-x-auto py-2 mb-2">
                    {['Filed', 'Assigned', 'Review', 'Evidence', 'Hearing', 'Verdict'].map((s, i) => (
                      <React.Fragment key={s}>
                        <span className={`text-[9px] font-semibold px-2 py-1 rounded-md whitespace-nowrap ${i <= 3 ? 'bg-gold-500/20 text-gold-400 border border-gold-500/20' : 'bg-white/4 text-white/25 border border-white/8'}`}>{s}</span>
                        {i < 5 && <div className={`w-3 h-px shrink-0 ${i < 3 ? 'bg-gold-400/40' : 'bg-white/10'}`} />}
                      </React.Fragment>
                    ))}
                  </div>
                  {/* Case cards */}
                  {[
                    { name: 'Ngono v. Société Forestière', type: 'Commercial', stage: 'In Hearing', progress: 75, color: 'bg-blue-400' },
                    { name: 'Fang Estate — Land Dispute', type: 'Property', stage: 'Evidence Collection', progress: 45, color: 'bg-amber-400' },
                    { name: 'Mvondo Criminal Appeal', type: 'Criminal', stage: 'Appeal', progress: 85, color: 'bg-purple-400' },
                  ].map((c, i) => (
                    <div key={i} className="bg-white/4 border border-white/8 rounded-xl p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-xs font-semibold text-white/80">{c.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] bg-white/8 px-1.5 py-0.5 rounded text-white/40">{c.type}</span>
                            <span className="flex items-center gap-1 text-[9px] text-white/30">
                              <span className={`w-1.5 h-1.5 rounded-full ${c.color}`} />{c.stage}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-full h-1 bg-white/6 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-gold-500 to-gold-400 rounded-full transition-all" style={{ width: `${c.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider mx-6 md:mx-16" />

        {/* ── 7. HOW IT WORKS ── */}
        <section className="px-6 py-12 md:py-20" ref={howSv.ref}>
          <div className="max-w-5xl mx-auto text-center mb-10">
            <span className="text-xs font-bold tracking-widest uppercase text-gold-400/70 mb-3 block">{lang === 'en' ? 'Getting Started' : 'Démarrage'}</span>
            <h2 className="font-display text-3xl md:text-5xl pub-heading font-bold">{t.howTitle}</h2>
          </div>
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 relative">
            {/* connecting line */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px border-t border-dashed border-gold-400/20" />
            <div className="hidden md:block absolute top-10 left-2/3 right-8 h-px border-t border-dashed border-gold-400/20" />
            {t.howSteps.map((step, i) => (
              <div
                key={i}
                className={`stagger-in text-center transition-all duration-500 ${howSv.inView ? 'visible' : ''}`}
                style={{ transitionDelay: howSv.inView ? `${i * 150}ms` : '0ms' }}
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-500/10 to-gold-600/5 border-2 border-gold-400/30 flex flex-col items-center justify-center mx-auto mb-5 relative">
                  <span className="text-[10px] font-bold text-gold-400/60 tracking-widest">{step.n}</span>
                  <span className="text-2xl mt-0.5">{['🔑', '🤝', '⚡'][i]}</span>
                </div>
                <h3 className="font-heading text-lg font-bold pub-heading mb-2">{step.title}</h3>
                <p className="text-sm pub-subtext leading-relaxed">{step.sub}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="section-divider mx-6 md:mx-16" />

        {/* ── 8. CAMLEX LIBRARY ── */}
        <section className="px-6 py-12 md:py-20 pub-section-alt" ref={camSv.ref}>
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Left: book covers grid */}
              <div className={`transition-all duration-700 ${camSv.inView ? 'translate-x-0' : '-translate-x-4'}`}>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-sm mx-auto lg:max-w-none">
                  {BOOKS.map((book, i) => (
                    <div
                      key={i}
                      className="relative rounded-xl overflow-hidden shadow-xl"
                      style={{ aspectRatio: '5/7', background: `linear-gradient(160deg, ${book.bg.replace('from-', '').replace(' via-', ',').replace(' to-', ',')})`, transitionDelay: `${i * 80}ms` }}
                    >
                      {/* spine strip */}
                      <div className="absolute left-0 top-0 bottom-0 w-2" style={{ background: book.accent, opacity: 0.7 }} />
                      {/* pages edge */}
                      <div className="absolute right-0 top-1 bottom-1 w-1.5 bg-white/10 rounded-sm" />
                      <div className="absolute inset-0 flex flex-col justify-between p-2.5 pl-4">
                        <div className="text-lg opacity-60">⚖</div>
                        <div>
                          <div className="text-[8px] font-bold text-white/50 uppercase tracking-wider mb-0.5">{book.area}</div>
                          <div className="text-[9px] font-bold text-white/80 leading-tight">{book.title}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: text */}
              <div className={`transition-all duration-700 delay-200 ${camSv.inView ? 'translate-x-0' : 'translate-x-4'}`}>
                <span className="text-xs font-bold tracking-widest uppercase text-purple-400/70 mb-3 block">{lang === 'en' ? 'Legal Knowledge Base' : 'Base de Connaissances Juridiques'}</span>
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl xl:text-5xl pub-heading font-bold mb-4 leading-tight">{t.camTitle}</h2>
                <p className="pub-subtext mb-8 leading-relaxed">{t.camSub}</p>
                <ul className="space-y-4 mb-8">
                  {t.camPoints.map((p, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </div>
                      <span className="text-sm pub-subtext leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/library">
                  <button className="flex items-center gap-2 px-6 py-3 rounded-xl border border-purple-400/30 text-purple-400 font-bold text-sm hover:bg-purple-500/10 transition-all duration-200">
                    {t.camCta}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider mx-6 md:mx-16" />

        {/* ── 9. FIRM HUB ── */}
        <section className="px-6 py-12 md:py-20" ref={firmSv.ref}>
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left: text */}
            <div className={`transition-all duration-700 ${firmSv.inView ? 'translate-x-0' : '-translate-x-4'}`}>
              <span className="text-xs font-bold tracking-widest uppercase text-crimson-400/70 mb-3 block">{lang === 'en' ? 'Firm Management' : 'Gestion de Cabinet'}</span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl xl:text-5xl pub-heading font-bold mb-4 leading-tight">{t.firmTitle}</h2>
              <p className="pub-subtext mb-8 leading-relaxed">{t.firmSub}</p>
              <ul className="space-y-3">
                {t.firmPoints.map((p, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-crimson-500 to-crimson-600 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <span className="text-sm pub-subtext">{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: firm stats mock */}
            <div className={`transition-all duration-700 delay-200 ${firmSv.inView ? 'translate-x-0' : 'translate-x-4'}`}>
              <div className="bg-white/4 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
                {/* Firm header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-crimson-500 to-crimson-600 flex items-center justify-center text-lg shadow-lg shadow-crimson-500/20">🏛</div>
                    <div>
                      <div className="text-sm font-bold text-white/80">Mbarga & Associates</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full border border-emerald-400/20">{t.firmBadge}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Team members */}
                <div>
                  <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-3">{lang === 'en' ? 'Team Members' : 'Membres de l\'Équipe'}</div>
                  {[{ name: 'Me. Alain Mbarga', role: lang === 'en' ? 'Owner' : 'Propriétaire', color: 'from-gold-500 to-gold-600', status: '🟢' }, { name: 'Me. Carine Njoya', role: lang === 'en' ? 'Partner' : 'Associée', color: 'from-blue-500 to-blue-600', status: '🟢' }, { name: 'Sophie Akono', role: lang === 'en' ? 'Secretary' : 'Secrétaire', color: 'from-purple-500 to-purple-600', status: '🟡' }].map((m, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-[10px] font-bold text-white`}>{m.name.split(' ').map(w => w[0]).join('').slice(0,2)}</div>
                        <div>
                          <div className="text-xs font-semibold text-white/70">{m.name}</div>
                          <div className="text-[10px] text-white/30">{m.role}</div>
                        </div>
                      </div>
                      <span className="text-[10px]">{m.status}</span>
                    </div>
                  ))}
                </div>
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[{ val: '34', label: lang === 'en' ? 'Active Cases' : 'Dossiers Actifs', color: 'text-gold-400' }, { val: '8', label: lang === 'en' ? 'Team Members' : 'Membres', color: 'text-blue-400' }, { val: '4.8★', label: lang === 'en' ? 'Avg. Rating' : 'Note Moy.', color: 'text-emerald-400' }].map((s, i) => (
                    <div key={i} className="text-center bg-white/4 rounded-xl p-3">
                      <div className={`text-lg font-bold ${s.color}`}>{s.val}</div>
                      <div className="text-[9px] text-white/30 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider mx-6 md:mx-16" />

        {/* ── 10. PAYMENTS ── */}
        <section className="px-6 py-12 md:py-20 pub-section-alt" ref={paySv.ref}>
          <div className="max-w-5xl mx-auto text-center mb-10">
            <span className="text-xs font-bold tracking-widest uppercase text-orange-400/70 mb-3 block">{lang === 'en' ? 'Billing & Payments' : 'Facturation & Paiements'}</span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-5xl pub-heading font-bold mb-4">{t.payTitle}</h2>
            <p className="pub-subtext max-w-xl mx-auto">{t.paySub}</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {t.payMethods.map((m, i) => (
                <div key={i} className={`stagger-in rounded-2xl p-5 border bg-gradient-to-br ${m.color} flex sm:flex-col items-center sm:text-center gap-4 sm:gap-0 transition-all duration-300 hover:-translate-y-1 ${paySv.inView ? 'visible' : ''}`} style={{ transitionDelay: paySv.inView ? `${i * 100}ms` : '0ms' }}>
                  <div className="text-2xl sm:text-3xl sm:mb-3 shrink-0">{m.icon}</div>
                  <div>
                    <div className="text-sm font-bold pub-heading sm:mb-1">{m.name}</div>
                    <div className="text-xs pub-muted">{m.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Invoice flow */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4 sm:p-6">
              <div className="text-xs pub-muted font-semibold mb-4 tracking-wider uppercase text-center">{lang === 'en' ? 'Invoice Lifecycle' : 'Cycle de Vie de la Facture'}</div>
              <div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-center sm:justify-between sm:gap-2">
                {t.payFlow.map((step, i) => (
                  <React.Fragment key={i}>
                    <div className={`text-center py-2 sm:py-2.5 sm:flex-1 rounded-xl text-[10px] sm:text-xs font-semibold ${i === t.payFlow.length - 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30' : 'bg-white/5 text-white/50 border border-white/8'}`}>
                      {step}
                    </div>
                    {i < t.payFlow.length - 1 && (
                      <svg className="hidden sm:block w-4 h-4 text-white/20 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <p className="text-center text-[11px] pub-muted mt-4 opacity-60">{t.payNote}</p>
            </div>
          </div>
        </section>

        <div className="section-divider mx-6 md:mx-16" />

        {/* ── 11. SECURITY ── */}
        <section id="security" className="px-6 py-12 md:py-20" ref={secSv.ref}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-xs font-bold tracking-widest uppercase text-blue-400/70 mb-3 block">{lang === 'en' ? 'Security & Compliance' : 'Sécurité & Conformité'}</span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-5xl pub-heading font-bold mb-4">{t.secTitle}</h2>
              <p className="pub-subtext max-w-xl mx-auto">{t.secSub}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {t.secItems.map((item, i) => (
                <div key={i} className={`stagger-in pub-card rounded-2xl p-5 border border-[var(--border-default)] hover:border-blue-400/25 transition-all duration-300 ${secSv.inView ? 'visible' : ''}`} style={{ transitionDelay: secSv.inView ? `${i * 80}ms` : '0ms' }}>
                  <div className="text-2xl mb-3">{item.icon}</div>
                  <div className="text-sm font-bold pub-heading mb-1">{item.label}</div>
                  <div className="text-xs pub-muted">{item.sub}</div>
                </div>
              ))}
            </div>
            <div className="text-center bg-blue-500/6 border border-blue-400/15 rounded-2xl py-5 px-6">
              <span className="text-sm text-blue-400/80 font-medium">🔒 {t.secTrust}</span>
            </div>
          </div>
        </section>

        {/* ── 12. PLATFORM STATS ── */}
        <section className="px-6 py-12 md:py-16 bg-gradient-to-b from-gold-500/4 via-transparent to-transparent">
          <div className="max-w-4xl mx-auto" ref={statsSv.ref}>
            <div className="text-center mb-8">
              <h2 className="font-display text-xl sm:text-2xl md:text-4xl pub-heading font-bold">{t.statsTitle}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {t.statsItems.map((s, i) => (
                <StatCounter key={i} val={s.val} suffix={s.suffix} label={s.label} active={statsSv.inView} delay={i * 100} />
              ))}
            </div>
          </div>
        </section>

        <div className="section-divider mx-6 md:mx-16" />

        {/* ── 13. TESTIMONIALS ── */}
        <section className="px-6 py-12 md:py-20 pub-section-alt" ref={testSv.ref}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl md:text-5xl pub-heading font-bold">{t.testimonialsTitle}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {t.testimonials.map((test, i) => (
                <div key={i} className={`stagger-in relative pub-card rounded-2xl p-5 sm:p-7 border border-[var(--border-default)] hover:border-gold-400/25 transition-all duration-300 hover:-translate-y-1 ${testSv.inView ? 'visible' : ''}`} style={{ transitionDelay: testSv.inView ? `${i * 120}ms` : '0ms' }}>
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-4">
                    {[1,2,3,4,5].map(s => <span key={s} className="text-gold-400 text-sm">★</span>)}
                  </div>
                  <blockquote className="text-sm pub-subtext leading-relaxed mb-6 italic">"{test.quote}"</blockquote>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${test.color} flex items-center justify-center text-xs font-bold text-white shadow-md`}>{test.initials}</div>
                    <div>
                      <div className="text-sm font-bold pub-heading">{test.name}</div>
                      <div className="text-xs pub-muted">{test.role}</div>
                    </div>
                  </div>
                  {/* quote mark decoration */}
                  <div className="absolute top-5 right-6 text-5xl text-gold-400/8 font-serif leading-none select-none">"</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 14. FINAL CTA ── */}
        <section className="px-6 py-12 md:py-20 relative overflow-hidden" ref={ctaSv.ref}>
          {/* Gold gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gold-500/12 via-gold-600/6 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-transparent to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent" />
          {/* decorative SVG scales watermark */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none hidden lg:block">
            <svg width="400" height="400" viewBox="0 0 100 100" fill="currentColor" className="text-gold-400">
              <circle cx="50" cy="10" r="4"/><rect x="48" y="14" width="4" height="20" rx="2"/><rect x="20" y="34" width="60" height="4" rx="2"/><rect x="48" y="38" width="4" height="50" rx="2"/><ellipse cx="50" cy="92" rx="15" ry="3"/>
              <line x1="20" y1="36" x2="25" y2="56" stroke="currentColor" strokeWidth="2"/><ellipse cx="22" cy="58" rx="12" ry="4"/>
              <line x1="80" y1="36" x2="75" y2="56" stroke="currentColor" strokeWidth="2"/><ellipse cx="78" cy="58" rx="12" ry="4"/>
            </svg>
          </div>

          <div className="max-w-3xl mx-auto text-center relative">
            <div className={`transition-all duration-700 ${ctaSv.inView ? 'translate-y-0' : 'translate-y-4'}`}>
              <span className="text-xs font-bold tracking-widest uppercase text-gold-400/70 mb-4 block">{lang === 'en' ? 'Start Today' : "Commencer Aujourd'hui"}</span>
              <h2 className="font-display text-2xl sm:text-4xl md:text-6xl pub-heading font-bold mb-5 leading-tight">{t.ctaTitle}</h2>
              <p className="text-base sm:text-lg pub-subtext mb-8 max-w-xl mx-auto">{t.ctaSub}</p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                <Link href="/auth/register" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-primary-900 font-bold text-base sm:text-lg hover:opacity-95 active:scale-[0.98] transition-all duration-200 shadow-xl shadow-gold-500/30" style={{ animation: 'goldPulse 3s ease-in-out infinite' }}>
                    {t.ctaBtn1}
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                  </button>
                </Link>
                <Link href="/support" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-gold-400/30 text-gold-400 font-bold text-base sm:text-lg hover:bg-gold-500/8 transition-all duration-200">
                    {t.ctaBtn2}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── 15. FOOTER ── */}
        <footer className="pub-footer border-t border-[var(--border-default)] px-6 pt-16 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-10 mb-10">
              {/* Brand col */}
              <div className="col-span-2 md:col-span-1">
                <Link href="/" className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center text-primary-900 font-bold text-base shadow-lg shadow-gold-500/25">⚖</div>
                  <span className="font-display text-xl font-bold pub-heading">LawBridge</span>
                </Link>
                <p className="text-sm pub-muted leading-relaxed mb-5">{t.footerTagline}</p>
                <div className="flex gap-2">
                  {['EN', 'FR'].map(l => (
                    <button
                      key={l}
                      onClick={() => handleLangChange(l.toLowerCase() as Lang)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${lang === l.toLowerCase() ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' : 'text-white/30 hover:text-white/60 border border-white/10 hover:border-white/20'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Link cols */}
              {t.footerCols.map((col, i) => (
                <div key={i}>
                  <h4 className="text-xs font-bold text-gold-400 mb-4 tracking-widest uppercase">{col.title}</h4>
                  <ul className="space-y-2.5 text-sm pub-muted">
                    {col.links.map(link => (
                      <li key={link.label}>
                        <Link href={link.href} className="hover:text-gold-400 transition-colors duration-150">{link.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--border-default)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs pub-muted">{t.footerCopy}</p>
              <p className="text-xs pub-muted opacity-60">{t.footerBuilt}</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
