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

Une adresse précise peut être réservée par le propriétaire dans `university.staff_invitations`. Le compte correspondant doit être créé et son adresse vérifiée avant tout accès administratif. La réservation est consommée une seule fois lors de la consultation de l’espace authentifié ; retirer ensuite le rôle ne le réattribue pas. Les comptes non vérifiés ou bannis ne peuvent pas consommer une réservation. Aucun secret ni mot de passe n’est créé par cette réservation.

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

## Campus pédagogique

`/administration/pedagogie` permet de créer et modifier des classes (code, année, niveau). Chaque classe propose cinq onglets : matières et cours, étudiants, emploi du temps, notes et paramètres.

- Affectation d’un compte étudiant par son e-mail, avec activation ou désactivation de l’accès à cette classe. Plusieurs classes sont possibles. Cette affectation ne modifie ni les droits administratifs ni la décision d’admission.
- Matières avec enseignant, coefficient, présentation, code et lien Google Classroom.
- Supports de type lien de cours, PDF/Drive, vidéo ou publication Classroom, avec brouillon, publication et ordre d’affichage.
- Séances hebdomadaires en ligne, avec période de validité, horaires de Tunis et lien de connexion. Un verrou transactionnel par classe empêche les créations concurrentes de créneaux qui se chevauchent.
- Notes par étudiant et matière, avec évaluation, date, barème, coefficient, commentaire et publication explicite. La modification d’une note conserve son étudiant et sa matière. Chaque modification est tracée et protégée contre l’écrasement concurrent.

Espaces étudiants : `/espace-etudiant/matieres`, `/espace-etudiant/emploi-du-temps` et `/espace-etudiant/notes`. L’appartenance active à la classe est vérifiée dans chaque requête, y compris pour les URL directes des cours. Les brouillons et les notes des autres étudiants ne sont pas envoyés au navigateur. Une classe ou matière archivée disparaît de l’espace étudiant, sans supprimer ses données.

Les PDF Google Drive sont affichés via leur lecteur de prévisualisation ; les liens directs terminant par `.pdf` sont également acceptés. Les autorisations Google restent nécessaires et le bouton d’ouverture externe reste disponible si le navigateur refuse l’intégration. Les liens Classroom s’ouvrent sur Google avec le code fourni : aucune synchronisation des contenus, des affectations ou des notes Classroom n’est activée. Les notes affichées sur HANNON sont saisies dans HANNON. Les moyennes sur 20 sont indicatives et pondérées par les coefficients des évaluations publiées.

Migration : `db/002_academics.sql`, additive et rejouable ; `npm run db:migrate` exécute désormais les fichiers SQL dans l’ordre avec une transaction par fichier. Migration d’abord validée sur la branche isolée `dev-pedagogie-20261127`, puis appliquée à la branche principale. Aucun étudiant n’a été affecté et aucune note n’a été créée sur la branche principale pendant le développement.

Validation pédagogique : 12 tests au total et compilation Next.js/TypeScript réussis. Les essais SQL isolés confirment l’exclusion des brouillons, des autres classes et d’un autre étudiant ainsi que la détection des chevauchements et l’acceptation de créneaux adjacents. Les formulaires administratifs et le parcours pédagogique avec un compte réellement affecté restent à vérifier après désignation du responsable ; aucun privilège administratif n’a été attribué pour ces essais.
