# Entraînement — Architecture transversale actuelle

## Contexte et points d'entrée

Site statique HTML/CSS/JavaScript, sans serveur applicatif, compilation ni dépendance d'exécution. Publication GitHub Pages sous `/xfr1/`. Les chemins des pages sont relatifs et les jeux fonctionnent sur téléphone, tablette et ordinateur.

- `index.html` : accueil avec cinq liens vers `francais.html`, `conjugaison.html`, `calcul.html`, `space.html` et `magic.html`.
- `styles/typography.css` : **source de vérité des deux familles, huit tailles, quatre graisses et rôles typographiques responsives**, chargée en premier sur les sept pages (voir le [guide](design/TYPOGRAPHY.md)).
- `styles/themes/magical-academy/classic.css` : **source de vérité des composants visuels communs** à Français, Conjugaison, Calcul et Scores (cadre extérieur, navigation, typographies, cartes Question/Score, cadres parchemin 9-slice, boutons, contrôles et responsive). Les fichiers `francais.css`, `calcul.css` et `styles/themes/magical-academy/conjugaison.css` ne gèrent que les particularités de leur page ; `theme.css` contient la palette et les fonds.
- `scores.html` : historique général et filtres par jeu, avec courbe uniquement sur les pages de scores filtrées par jeu.
- Chaque page de jeu charge ses modules communs puis son contrôleur propre. Les fichiers des jeux restent dans la racine du dépôt ; leurs documents sont dans `docs/games/<id>/`.

## Modules réutilisables

| Fichier | API / responsabilité |
| --- | --- |
| `game-common.js` | `ExerciseGame` : déroulement des questions, validation, score de premier essai, délai avant question suivante, snapshot et reprise ; **composant `progress()` partagé** avec « Question x/maximum » et « Score x » (sans dénominateur). Le bouton de validation est une instance DOM stable réutilisée lors des changements d’état, pour ne pas perdre les taps rapides. Le clic « Bravo ! Suivant » ignore le délai et annule le timer restant. |
| `game-ui.js` | `GameUI` : éléments DOM, `tabs()` pour les cartouches interactifs accessibles, touches `.academy-key` du pavé numérique, clavier AZERTY partagé, édition de nombres et de mots |
| `exercise-weighting.js` | `ExerciseWeighting` : compteurs d'apparition/erreur et tirage pondéré sans remise |
| `conjugaison-data.js` | `ConjugaisonData` : banque de verbes, sujets et règles du présent du 1er groupe |
| `game-state.js` | `GameState` : lecture/écriture/suppression prudentes des sessions en `localStorage` |
| `scores.js` | `ExerciseScores` : historique compatible, date/heure, filtres, graphique SVG, suppression ciblée confirmée |
| `daily-exercises.js` | `DailyExercises` : crédits d’exercices quotidiens, minutes autorisées, progression des jeux continus et lecture inter-sites de même origine |
| `score-view.js` | `ScoreView` : scores en iframe sans détruire le jeu, suspension/reprise et navigation par l'historique |
| `app-confirm.js` | `AppConfirm` : dialogue de confirmation interne |
| `academy-header.js` (`AcademyHeader`) | Bandeau commun des quatre pages classiques, généré via les attributs du `<nav data-academy-header>` ; préserve `restart-series`, `scores-back`, liens, libellés accessibles et navigation Scores en iframe |
| `styles/typography.css` | Échelle de huit tailles, quatre graisses, deux familles et rôles responsives communs à toutes les pages |
| `styles/themes/magical-academy/classic.css` | Styles réutilisables de l'identité Académie magique : panneaux, progressions, boutons, navigation, typographie et adaptations mobiles |
| `shared.css`, `keyboard.css`, `score-view.css`, `app-confirm.css` | Base historique partagée, clavier AZERTY, affichage des scores et confirmations |

`francais.js`, `calcul.js` et `conjugaison.js` utilisent `ExerciseGame`. Français et Conjugaison partagent également `ExerciseWeighting` ; leurs statistiques et questions restent distinctes. Les jeux d'arcade délèguent leurs règles à des moteurs isolables (`space-engine.js` et `magic-engine.js`) tandis que leurs contrôleurs gèrent interface, événements, rendu et persistance. Voir leurs architectures dédiées.

Les sept pages chargent d'abord `styles/typography.css`. Les composants classiques conservent leur priorité dans `classic.css`, chargé en dernier après les CSS historiques et de jeu ; les jeux d'arcade utilisent les mêmes tokens et gardent leurs adaptations de HUD.

Les scripts sont chargés dans l'ordre des dépendances. Les modules communs exposent leurs APIs sur `window` ; les contrôleurs de jeux restent dans des portées privées. Les styles de mise en page ont été extraits des fichiers HTML de Français, Calcul et Scores. Leurs CSS dédiés sont chargés avant `classic.css` ; les règles de thème communes ont ainsi la priorité. Les contrôleurs ne manipulent que les classes des composants standard (`academy-playing`, `question-frame`, `keyboard-panel`, `feedback-retry`, `feedback-success`).

## Données locales et compatibilité

Les données restent sur l'appareil et le navigateur ; aucune synchronisation ni compte utilisateur.

| Clé | Propriétaire | Usage |
| --- | --- | --- |
| `exercices_francais_scores` | `scores.js` | Historique commun pérenne, y compris les enregistrements anciens et leurs champs inconnus |
| `exercices_in_progress_<jeu>` | `game-state.js` | Session temporaire versionnée par jeu (`francais`, `conjugaison`, `calcul`, `space`, `magic`) |
| `entrainement_daily_exercises_v1` | `daily-exercises.js` | Total de points d’exercice, minutes autorisées et progression partielle pour la date locale du jour ; clé partagée avec les autres dépôts GitHub Pages de même origine |
| `entrainement_francais_word_counts_v1` | `francais.js` | Nombre d'apparitions par mot |
| `entrainement_francais_word_errors_v1` | `francais.js` | Premières erreurs par mot |
| `entrainement_francais_sentence_counts_v1` | ancien format lu par `francais.js` | Migration des anciennes apparitions par phrase, sans effacement de la clé historique |
| `entrainement_conjugaison_counts_v1` | `conjugaison.js` via `ExerciseWeighting` | Apparitions par type + verbe + personne |
| `entrainement_conjugaison_errors_v1` | `conjugaison.js` via `ExerciseWeighting` | Premières erreurs par combinaison |

Le compteur `DailyExercises` est **distinct des scores** : une session terminée de Français, Conjugaison ou Calcul vaut 1 point, quels que soient les points obtenus ; Mission calcul crédite 1 point par 10 destructions par tir, et Mission magique 1 point par 20 créatures détruites par sort. Les reliquats des missions se conservent entre parties dans une même journée, mais pas au-delà de minuit local. Chaque point donne actuellement 5 minutes de jeu autorisées. Les règles sont choisies dans chaque contrôleur de jeu ; la clé de stockage et le ratio restent communs. L’accueil affiche les totaux du jour et les autres pages peuvent les lire. Voir [ADR-0002](adr/0002-credit-quotidien-et-origine-web.md).

`ExerciseScores` ajoute les scores sans supprimer ni réécrire les anciens ; une suppression individuelle demande confirmation et vérifie que la sélection n'est pas devenue obsolète. Une heure absente se déduit d'une date ISO exploitable, sinon vaut `00:00`. Les données malformées ne doivent pas entraîner l'écrasement silencieux de l'historique. Voir [ADR-0001](adr/0001-compatibilite-des-donnees.md).

Le contrat public du stockage est `{"version":1,"date":"AAAA-MM-JJ","points":0,"minutes":0,"progress":{},"events":[]}` ; `date` suit le calendrier **local du navigateur**, `minutes` est le crédit autorisé (pas un décompte du temps déjà joué), `progress` stocke les calculs restant avant le prochain palier et `events` évite des doubles crédits. Une application externe doit comparer `date` à sa date locale et considérer un enregistrement d’un autre jour comme zéro, même si xfr1 n’a pas été ouvert depuis minuit. `localStorage` est partagé par **origine** (protocole + hôte + port), et non entre noms de domaine ou appareils : `https://sek44.github.io/xfr1/` et `https://sek44.github.io/rblx/` peuvent partager la clé si tous deux sont publiés sous cette même origine ; un domaine différent ne le peut pas sans mécanisme explicite.

Les sessions temporaires sont distinctes des scores. Une navigation vers les scores suspend le jeu sans avancer les minuteries ; un rechargement/retour restaure les informations prévues par chaque jeu. Une session terminée ne doit pas générer un second score.

## Qualité, livraison et limites

Les tests Node intégrés au dépôt (`node --test tests/*.test.cjs`) couvrent des moteurs, contrôleurs et API partagées. Prettier 3.6.2 sert au formatage HTML/JS/CSS. Le site n'a pas de build obligatoire.

La validation visuelle/tactile sur mobile et tablette, le comportement selon l'orientation et l'intégration réelle du navigateur nécessitent des vérifications supplémentaires : voir [backlog transversal](BACKLOG.md). L'architecture propre à chaque jeu est documentée dans `docs/games/<id>/ARCHITECTURE.md`.

## Identité graphique commune

La page **Conjugaison** est la référence visuelle des sous-pages classiques : Français, Calcul et Scores. Toutes chargent, **en dernier**, `styles/themes/magical-academy/classic.css` après le thème général et les styles de jeu.

- **Bandeau** : un seul générateur `academy-header.js` crée le titre, l’illustration, les liens et le bouton de reprise de série à partir des attributs `data-title`, `data-icon`, `data-game`, `data-restart`, `data-scores` et `data-back-id`. Il doit être chargé avant les contrôleurs des exercices et avant le script de routage de Scores. Les boutons d’illustration restent de vrais liens/boutons accessibles. Sur Scores, `scores-back` permet toujours le retour au jeu et l’usage en iframe.
- **Cadre global** : `body.academy-page main` contient un encadrement unique et un fond bleu translucide.
- **Question/Score** : `ExerciseGame.progress(container)` crée le composant `.academy-progress.progress-row` pour les trois exercices. La question indique toujours `Question x/maximum`, et le score indique simplement `Score x` (sans `/maximum`). `classic.css` impose les mêmes proportions, étoile, typographie et ombres ; ne pas retoucher le DOM dans chaque jeu.
- **Onglets** : `.academy-tabs .academy-tab` est un composant CSS pur (rectangles symétriques bleu saphir, coins légèrement arrondis et contour doré discret, fond actif plus lumineux, états hover/focus et marges responsives), sans `border-image` ni WebP. Il sert au temps fixe de Conjugaison, aux familles interactives de Français via `GameUI.tabs()` (`role=tab`, `aria-selected`), et aux six filtres de Scores (`<nav>` et liens, avec `aria-current="page"`). Ces plaques sombres sont intentionnellement distinctes des pastilles Question/Score crème.
- **Touches** : `.academy-key` (choix Français et pavé Calcul) partage sa texture crème, bordure et ombre avec `.azerty-keyboard .keyboard-key` ; les dimensions et la disposition des touches AZERTY demeurent spécifiques à Conjugaison.
- **Question et saisie** : `.question-frame` (parchemin 9-slice), puis `.keyboard-panel` (fond crème et touches). L’état `.panel.academy-playing` rend leur parent transparent ; une page de résultat final conserve son panneau parchemin.
- **Actions et contrôles** : `.exercise-actions .primary` ou `.actions .primary`, `.feedback-retry`, `.feedback-success` emploient la même grammaire de boutons, y compris icônes et ombres adaptées. Les touches, listes déroulantes et filtres utilisent la palette commune.
- **Écran de fin partagé** : `ExerciseGame.finish(container, restart)` construit une seule carte sémantique `.academy-result` sur Français, Calcul et Conjugaison. Son cadre parchemin 9-slice, le trophée `home-cup.webp`, le cartouche « Ton score », le texte de félicitations et le bouton `.academy-result-actions .primary` sont tous stylés dans `classic.css`. Le score final affiche uniquement les points obtenus, sans `/maximum` ; les pastilles de progression « Question x/maximum » et « Score x » sont masquées uniquement sur l'écran final afin d'éviter de répéter le résultat. Le court texte d'instruction Français est également masqué sur cet écran, sans retirer les onglets permettant de choisir une nouvelle série. Aucun résultat final ne doit être réimplémenté ou stylé séparément dans les CSS de jeu.

Dans la page Scores, la colonne « Score » n'affiche que la valeur (ou les points des missions), jamais un dénominateur. Les champs `total` restent sauvegardés pour les calculs de réussite, les encouragements et les anciens enregistrements.

Les feuilles `francais.css`, `calcul.css` et `styles/themes/magical-academy/conjugaison.css` doivent contenir **uniquement** les adaptations propres à leurs pages. Ne pas recopier le bandeau ou les règles de taille des boutons. `school-common.css` et `exercise-theme.css` conservent temporairement les styles de base historiques, surchargés par `classic.css` pour les quatre pages. Les jeux d’arcade n’utilisent pas ces composants et conservent leur apparence indépendante.
