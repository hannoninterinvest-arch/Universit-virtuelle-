# Université virtuelle HANNON

Campus francophone : admissions, enseignement en ligne et scolarité. Next.js 16, React 19, Neon PostgreSQL, Neon Auth et stockage privé compatible S3. Le dépôt GitHub déclenche le déploiement du projet Vercel `hannon-universite-virtuelle`.

## Parcours et services

| Espace | Fonctions |
| --- | --- |
| Public | Accueil, catalogue de formations publiées, détails et candidature, création de compte, connexion, vérification et récupération du compte |
| Étudiant | Tableau de bord personnel, inscription et historique des décisions, matières de ses classes, emploi du temps en ligne, supports et PDF, codes et liens Classroom, évaluations, notes et relevé PDF |
| Suivi étudiant | Cours marqués comme terminés, présences saisies par les enseignants, notifications, justificatifs, demandes d’attestations, factures et versements, assistance |
| Enseignant | Matières attribuées, supports et cours privés, séances, notes, QCM, devoirs et examens écrits ou QCM, correction et publication, présences, annonces aux classes |
| Administration | Admissions, classes et affectations, matières, catalogue, enseignants, contrôle des documents, délivrance d’attestations, facturation et rapprochement manuel des versements, assistance et coordonnées de l’organisme |

Les espaces principaux sont `/espace-etudiant`, `/enseignant`, `/administration`, `/administration/pedagogie` et `/administration/campus`. Le catalogue se trouve dans `/formations`. La navigation s’adapte au rôle, avec menu mobile, notifications non lues et raccourcis vers les actions en attente.

La création d’un compte ne constitue pas une admission ni une affectation à une classe. Les formations et tarifs réels doivent être saisis et publiés par l’administration. Aucun programme, diplôme accrédité, tarif, enseignant ni résultat réel n’est inventé par l’application.

## Installation

```bash
npm ci
cp .env.example .env.local
# Renseigner les valeurs serveur et un secret aléatoire de 32 caractères minimum.
npm run db:migrate
npm run dev
```

`DATABASE_URL` est une connexion serveur, de préférence avec pooler pour l’application. Les migrations `db/001_*.sql` à `db/004_*.sql` s’exécutent dans l’ordre, dans une transaction par fichier. Elles sont additives et rejouables. Pour une migration nécessitant des opérations de session, employer une connexion directe.

Ne jamais placer les secrets dans une variable `NEXT_PUBLIC_*`, un commit ou une capture. Les fonctions Vercel et la base sont situées à Francfort. L’origine exacte doit être autorisée dans Neon Auth.

## Comptes et autorisations

Les nouveaux comptes sont étudiants. Aucun premier utilisateur ni domaine e-mail ne devient administrateur automatiquement. Une adresse précise peut être réservée dans `university.staff_invitations` : le compte doit exister et son adresse être vérifiée. La réservation est consommée une seule fois. Retirer ensuite le rôle ne le réattribue pas.

Pour une attribution administrative explicite depuis un environnement de confiance :

```bash
npm run admin:grant -- adresse@example.com
```

L’administration affecte un compte enseignant existant à une matière ; l’enseignant doit vérifier son e-mail. Il ne peut consulter et modifier que ses matières. Les étudiants accèdent aux cours, évaluations et données pédagogiques selon leur appartenance active aux classes. Les réponses correctes des QCM restent côté serveur et les notes restent invisibles tant que l’enseignant ne les a pas publiées.

Les décisions d’admission, modifications pédagogiques et opérations de scolarité sont tracées. Les requêtes sont paramétrées, l’identité provient de la session et les transitions sont validées côté serveur. Les opérations liées sont transactionnelles ; les principaux formulaires utilisent une version pour éviter d’écraser une modification concurrente. Aucun droit du schéma applicatif n’est accordé à `PUBLIC`.

## Enseignement et évaluations

Les matières proposent des liens de cours, vidéos, PDF privés ou externes et liens Classroom. Les créneaux hebdomadaires utilisent les horaires de Tunis et une période de validité ; les chevauchements dans une même classe sont bloqués. Les présences sont saisies par un responsable pour des séances valides, sans pointage anticipé.

Les devoirs et examens écrits acceptent texte et fichier ; les QCM proposent quatre choix par question et une pondération. Une durée facultative commence à la première tentative. Le brouillon s’enregistre automatiquement. La clôture effective est la première des deux limites : date globale et durée individuelle. Après expiration, seules les réponses déjà enregistrées peuvent être finalisées. Une tentative ne peut être remise qu’une fois ; l’enseignant vérifie, corrige et publie le résultat. Il n’existe pas de surveillance d’examen ni de détection de fraude automatique.

Les moyennes sur 20 sont indicatives et pondérées sur les évaluations publiées. Les liens Classroom s’ouvrent avec le code fourni ; les permissions Google restent applicables. Aucune synchronisation automatique des cours, membres ou notes Google Classroom n’est activée. Les PDF Drive peuvent être prévisualisés si les permissions et le navigateur l’autorisent, avec un lien d’ouverture externe.

## Fichiers et documents PDF

Le bucket `campus-private` est privé. Variables serveur : `AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `CAMPUS_STORAGE_BUCKET`. Le client S3 utilise le mode path-style. Les accès sont contrôlés avant la génération d’un lien signé valable 120 secondes.

Les dépôts acceptent PDF, JPEG ou PNG, au maximum 4 Mo par fichier, avec contrôle de signature du contenu et un plafond de 50 dépôts par compte et par jour. Les supports téléversés depuis l’éditeur de cours acceptent seulement les PDF. Les documents sont accessibles au propriétaire, à l’administration et, selon leur usage, aux enseignants attribués ou aux membres de la classe qui reçoit le support publié.

L’étudiant peut télécharger un relevé pédagogique explicitement non certifié. Les attestations d’inscription, de présence et relevés validés nécessitent une décision administrative et des données de scolarité correspondantes. La délivrance fige les informations dans un instantané ; une page publique de vérification expose uniquement le type, la référence et la date, sans identité ni notes. Aucune signature manuscrite ni accréditation n’est fabriquée. La police embarquée est accompagnée de sa licence dans `assets/`.

## Notifications et courriels

Les notifications internes sont actives indépendamment du SMTP. La publication d’un résultat, d’un cours ou d’une évaluation, les annonces et les décisions de scolarité peuvent créer une notification et une entrée dans la file de courriels.

Pour envoyer les courriels du campus, renseigner `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` et `SMTP_FROM`. Les traitements tentent au plus cinq livraisons après une action ; l’administration peut relancer la file depuis le pilotage. Sans ces paramètres, les messages restent en attente et les notifications internes restent disponibles. Ce mécanisme n’est pas un ordonnanceur autonome : une file importante doit être surveillée et relancée. Les courriels d’authentification Neon ont leur propre configuration ; la réception des codes et la récupération doivent être vérifiées avec une boîte contrôlée avant ouverture générale.

## Finances

L’administration émet une facture avec devise, échéance, instructions et lien facultatif vers un paiement hébergé par son prestataire. L’étudiant déclare un versement avec référence et justificatif facultatif. Seule une validation administrative confirme son règlement. Les versements en attente réservent le solde pour éviter les dépassements concurrents ; les refus libèrent ce montant. La précision monétaire suit la devise, notamment trois décimales pour le TND.

Aucun encaissement carte, remboursement ni webhook bancaire n’est intégré. Un lien de paiement externe ne confirme jamais automatiquement une facture. Les coordonnées de l’organisme sont configurables et figées lors de l’émission d’une facture ou attestation. Vérifier les mentions et règles de facturation applicables avant usage réel.

## Validation et recette

```bash
npm test
npm run typecheck
npm run build
```

La version complète comprend 19 tests de validation métier, une vérification TypeScript et une compilation de production. La génération PDF avec police embarquée a également été exécutée en mémoire. La migration complète est d’abord appliquée à la branche de développement avant la branche principale. Aucun étudiant, note, facture ni versement réel n’est créé pour ces contrôles.

La recette fonctionnelle de cette extension reste à effectuer par le responsable, comme convenu :

1. Créer et vérifier le compte administratif désigné ; renseigner les coordonnées de l’organisme.
2. Publier une formation, créer une classe et ses matières, affecter un enseignant et un étudiant.
3. Essayer le parcours inscription → traitement administratif → accès aux matières.
4. Publier un PDF, un lien Classroom et une séance ; vérifier l’affichage sur téléphone.
5. Remettre un devoir, terminer un QCM chronométré, corriger et publier les notes.
6. Vérifier le cloisonnement avec un autre étudiant et une autre classe.
7. Déposer un justificatif, délivrer une attestation et vérifier sa référence.
8. Émettre une facture, déposer une preuve puis confirmer ou refuser le versement.
9. Répondre à une demande d’assistance et vérifier notifications et réception des courriels après configuration.

Le déploiement conserve sa protection Vercel actuelle. Les sauvegardes, la procédure de restauration et la configuration de livraison des courriels doivent être vérifiées avant l’ouverture générale. Les anciens essais d’admission utilisent un compte clairement nommé TEST TECHNIQUE ; ils ne représentent pas une inscription réelle.
