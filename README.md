# Université virtuelle HANNON

Portail francophone d’admissions : comptes étudiants, inscriptions et traitement administratif. Next.js 16, React 19, Neon PostgreSQL et Neon Auth (Managed Better Auth).

## Parcours disponibles

- `/` : accueil avec création de compte et connexion.
- `/auth/sign-up`, `/auth/sign-in` : inscription au portail et connexion.
- `/auth/forgot-password`, `/auth/reset-password` : récupération par code e-mail.
- `/auth/verify-email` : vérification de l’adresse par code.
- `/espace-etudiant` : tableau de bord, statut, messages et historique.
- `/espace-etudiant/inscription` : profil, parcours, formation souhaitée, brouillon et transmission.
- `/administration` : liste des dossiers, recherche, filtres et pagination.
- `/administration/[id]` : examen, admission, refus ou demande de compléments.

La création d’un compte ne constitue pas une admission. Aucun programme, tarif ou diplôme accrédité n’est annoncé à ce stade. La formation souhaitée est saisie librement en attendant la définition du catalogue. Les documents justificatifs et paiements ne font pas encore partie de cette version.

## Démarrage

```bash
npm ci
cp .env.example .env.local
# Renseigner les valeurs Neon et un secret aléatoire (32 caractères minimum).
npm run db:migrate
npm run dev
```

`DATABASE_URL` : connexion serveur, de préférence avec pooler. Pour les migrations futures nécessitant des opérations de session, utiliser une connexion directe. Ne jamais placer ces secrets dans une variable `NEXT_PUBLIC_*`, un commit ou une capture.

## Accès administratif

Les nouveaux comptes sont uniquement étudiants. Aucun premier utilisateur ni domaine e-mail ne devient administrateur automatiquement.

1. Créer le compte de la personne désignée.
2. Vérifier son e-mail dans `/auth/verify-email`.
3. Depuis un environnement de confiance disposant de `DATABASE_URL` :

```bash
npm run admin:grant -- adresse@example.com
```

Les autorisations sont stockées dans `university.staff_members` et vérifiées côté serveur pour chaque lecture ou décision. L’administration peut lire les brouillons mais ne peut décider qu’après transmission. Les décisions sont enregistrées dans un historique ; une correction demandée permet à l’étudiant de modifier puis retransmettre son dossier.

## Validation et sécurité

```bash
npm test
npm run typecheck
npm run build
```

La validation des données et des transitions est effectuée côté serveur. Les requêtes utilisent des paramètres SQL ; l’identité provient de la session et jamais du formulaire. Un numéro de version protège contre les enregistrements et décisions concurrents. Les modifications et l’historique associé sont atomiques. Le rôle PostgreSQL n’est pas exposé aux navigateurs ; le schéma applicatif n’accorde aucun droit à PUBLIC.

Les e-mails d’authentification utilisent le service partagé Neon pour les essais. Configurer un SMTP HANNON avant ouverture publique et vérifier la réception des codes et la récupération des comptes. Les demandes d’inscription n’envoient pas de notification e-mail : les décisions sont consultables dans l’espace étudiant.

## Déploiement

Projet Vercel : `hannon-universite-virtuelle`. Variables serveur requises : `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`. Autoriser l’origine exacte du déploiement dans les domaines de confiance Neon Auth. Les fonctions sont placées à Francfort, comme la base.

## Vérifications de cette version

Compilation de production, vérification TypeScript et 4 tests de validation réussis. Sur le déploiement connecté à Neon : création d’un compte fictif, session authentifiée, affichage de l’inscription, sauvegarde du brouillon, transmission et verrouillage du dossier confirmés. Un étudiant sans rôle administratif ne peut pas consulter la liste des dossiers. Le contrôle visuel de l’accueil et du formulaire de création de compte a été effectué, ainsi que la redirection des visiteurs non connectés.

L’essai d’une décision administrative a été arrêté par le contrôle automatique d’autorisation ; aucune décision d’admission n’a été enregistrée. L’accès administratif temporaire a été retiré. Un compte fictif et son dossier clairement nommé TEST TECHNIQUE restent présents pour traçabilité. La réception des codes e-mail reste à vérifier avec une boîte contrôlée, et un responsable doit être désigné avant d’activer l’accès administratif réel.
