import type { OnboardingResponse } from '@/types'

export function generateProjectPrompt(response: OnboardingResponse): string {
  const client = response.client as any
  const project = response.project as any
  const r = response.responses as Record<string, any>
  const type = response.questionnaire_type

  const typeLabel = type === 'mvp' ? 'MVP / Application Web' : type === 'website' ? 'Site Web Vitrine' : 'Refonte de Site'

  // Build the responses summary
  const responsesBlock = Object.entries(r)
    .map(([key, value]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      const val = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
      return `- **${label}**: ${val}`
    })
    .join('\n')

  return `# Projet QuickShip — Création One-Shot

## Contexte Client
- **Client** : ${client?.full_name || 'Non renseigné'}
- **Email** : ${client?.email || 'Non renseigné'}
- **Entreprise** : ${client?.company || 'Non renseigné'}
- **Type de projet** : ${typeLabel}
${project?.name ? `- **Nom du projet** : ${project.name}` : ''}

## Réponses du questionnaire d'onboarding
${responsesBlock}

${response.notes ? `## Notes internes\n${response.notes}\n` : ''}

---

## Instructions pour l'agent IA

Tu es un expert fullstack qui crée des projets web complets en one-shot pour l'agence QuickShip. Tu dois livrer un projet fini, déployable, et prêt à être montré au client.

### Skills à activer (cloner depuis le repo)

Repo des skills : \`https://github.com/VoltAgent/awesome-claude-code-subagents\`

Active et utilise systématiquement ces agents spécialisés :
1. **frontend-developer** (\`categories/01-core-development/frontend-developer.md\`) — Expert React/Next.js, composants performants, accessibilité
2. **ui-designer** (\`categories/01-core-development/ui-designer.md\`) — Design system, visual design, interactions
3. **ux-researcher** (\`categories/08-business-product/ux-researcher.md\`) — Architecture UX, parcours utilisateur, personas
4. **content-marketer** (\`categories/08-business-product/content-marketer.md\`) — Copywriting, SEO, textes de conversion
5. **seo-specialist** (\`categories/07-specialized-domains/seo-specialist.md\`) — SEO technique, meta tags, schema markup

### Skill UI/UX prioritaire

Utilise en priorité le skill **UI UX Pro Max** depuis : \`https://ui-ux-pro-max-skill.nextlevelbuilder.io/\`
- **frontend-design** : Design non-générique, identité visuelle unique
- **web-artifacts-builder** : Stack React + Tailwind + shadcn/ui pour tous les artifacts
- **webapp-testing** : Tests Playwright pour vérifier la qualité

### Stack technique obligatoire
- **Framework** : Next.js 14+ (App Router)
- **Styling** : Tailwind CSS + shadcn/ui
- **Language** : TypeScript strict
- **Tests** : Playwright pour les tests E2E
- **Déploiement** : Vercel-ready

### Exigences de qualité
1. **Design non-générique** : Pas de templates basiques. Le design doit être unique, moderne et correspondre à l'identité du client
2. **Responsive** : Mobile-first, testé sur toutes les tailles d'écran
3. **Performance** : Score Lighthouse > 90 sur tous les critères
4. **SEO** : Meta tags, Open Graph, schema.org, sitemap
5. **Accessibilité** : WCAG 2.1 AA minimum
6. **Copywriting** : Textes professionnels, orientés conversion, pas de lorem ipsum
7. **Animations** : Micro-interactions subtiles, transitions fluides
8. **Images** : Optimisées, lazy loading, formats modernes (WebP/AVIF)

### Processus de création
1. **Analyse** : Lire le questionnaire client ci-dessus, définir les personas et le parcours utilisateur
2. **Architecture** : Planifier la structure des pages, le sitemap, les composants
3. **Design System** : Créer les tokens de design (couleurs, typographie, espacements) basés sur l'identité du client
4. **Développement** : Coder le projet complet en one-shot avec tous les composants
5. **Contenu** : Rédiger tous les textes (copywriting professionnel, pas de placeholder)
6. **Tests** : Écrire et exécuter les tests Playwright
7. **Optimisation** : Performance, SEO, accessibilité
8. **Livraison** : Projet prêt à déployer sur Vercel

### Livrables attendus
- Code source complet (repo Git)
- Toutes les pages fonctionnelles avec contenu réel
- Tests Playwright passants
- README avec instructions de déploiement
- Variables d'environnement documentées

---

**Lance la création du projet maintenant. Commence par l'analyse du questionnaire client et la définition de l'architecture.**`
}
