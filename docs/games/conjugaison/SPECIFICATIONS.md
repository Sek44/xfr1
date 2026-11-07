# Conjugaison — Spécifications fonctionnelles

## Présent de l’indicatif — 1er et 2e groupes

Deux onglets sélectionnent le groupe : « Présent · 1er groupe » et « Présent · 2e groupe ». Chaque onglet propose une série de dix questions propre au groupe. Un clic sur l’onglet actif ne modifie rien. Changer d’onglet demande confirmation si le joueur a commencé à saisir, valider ou avancer dans la série. Annuler préserve exactement la réponse, la question, le score et le délai de passage automatique ; confirmer abandonne la série sans score ni crédit quotidien, et commence la nouvelle. Avant toute saisie et une fois la série terminée, le changement est immédiat. L’onglet sélectionné est restauré après rechargement, avec sa série en cours.

### 1er groupe

Le joueur voit un verbe à l’infinitif et une phrase avec un trou. Il doit saisir **la forme conjuguée entière** dans le trou, au moyen d’un clavier virtuel AZERTY reproduisant les trois rangées de lettres d’un clavier français, la troisième complétée par une touche Shift (flèche SVG vers le haut) à gauche et une touche Retour arrière à droite. Shift met en majuscule la prochaine lettre, puis se désactive. Une rangée d’accents à deux pages reste placée au-dessus : la première contient « à â é è ê ù û ô ç », la seconde « î ï ä ë ü ö ÿ œ æ ». La dixième touche de cette rangée présente une flèche SVG permettant d’aller à l’autre page (droite, puis gauche). Seule la première rangée change, sans modifier la saisie ni déplacer les touches des autres rangées. Shift s’applique également à ces caractères. Le choix de page est conservé lors de la bascule vers « ?123 » puis du retour « ABC ». La dernière rangée propose « Tout effacer », « Espace » et « ?123 » ; ce dernier ouvre les chiffres et symboles et devient « ABC » pour revenir aux lettres. « Tout effacer » conserve son libellé sur deux lignes, mais utilise la même typographie (famille, taille et graisse) que « ?123 », y compris sur les écrans étroits. Le clavier occupe presque toute la largeur disponible, avec de grandes lettres et des marges latérales modérées (de 12 à 20 px sur la page). Les lignes du clavier sont légèrement espacées entre elles (6 à 10 px). La rangée des accents dispose d'une séparation supplémentaire et ses touches ont un fond plus clair. Un clavier physique fonctionne également hors des boutons et champs de contrôle. Les accents, cédilles et la conjugaison doivent être exacts ; la casse est indifférente. Les espaces accidentels au début ou à la fin de la saisie sont ignorés à la vérification.

Six familles : **-er** régulier, **-ger**, **-cer**, **-guer**, **-yer** (passage de y à i) et **alternance e/è**. Les sujets couvrent je, tu, il, elle, on, nous, vous, ils, elles. Des groupes nominaux remplacent parfois le pronom tout en conservant le bon accord : « Paul », « Paul et Julie », « Paul et moi », « Paul et toi », etc. « Je » devient « J’ » devant une forme commençant par une voyelle. Les infinitifs à variantes orthographiques multiples ne sont pas proposés.

### 2e groupe

Une banque de 22 verbes réguliers en **-ir** (notamment finir, choisir, réussir, grandir, rougir, remplir, réfléchir, obéir, applaudir, ralentir, bondir, bâtir, avertir, réunir et nourrir) utilise les terminaisons **-is, -is, -it, -issons, -issez, -issent**. Les neuf personnes et leurs variantes de sujets sont communes au 1er groupe. Les verbes en -ir du 3e groupe (comme partir) sont exclus.

La zone de phrase réserve la hauteur de deux lignes et centre verticalement les phrases plus courtes. Le cadre peut s’agrandir si la phrase dépasse deux lignes, sans limiter son contenu.

## Score et correction

La session comporte 10 combinaisons distinctes (famille, infinitif, personne) du groupe choisi. Après saisie, « Vérifier » signale la justesse. Le bouton bleu est centré et volontairement plus étroit que le clavier, avec un libellé large et une icône de baguette ; ses variantes de correction sont légèrement plus larges avec des caractères plus grands, tout en conservant la même hauteur. Une erreur au premier essai empêche de gagner le point sur cette question ; une bonne correction permet d’avancer mais ne rapporte pas de point. Après réussite, la question suivante arrive automatiquement au bout d’environ 3 secondes ou immédiatement avec « Suivant ».

Une série terminée produit un score sur 10 dans l’historique commun et donne **1 point d’exercice quotidien**, soit actuellement **3 minutes de jeu autorisées** quel que soit le résultat. Une session interrompue ne crédite rien. Le bouton d’icône « Recommencer la série », placé dans l’en-tête juste à gauche des scores, demande confirmation : annuler reprend le jeu, confirmer recrée une série de dix questions avec un score nul, sans enregistrer ni créditer la série abandonnée.

## Pondération et sauvegarde

La probabilité de réapparition dépend du triplet **(type de terminaison, verbe, personne grammaticale)**. Chaque apparition avec réussite au premier essai la diminue ; une erreur au premier essai l’augmente. Les différents sujets d’un même triplet ne modifient pas son poids. Un triplet ne se répète pas au sein des 10 questions.

Mode, question, saisie, score, état de correction et délai restant sont conservés au rechargement et lors de la consultation des scores. L’historique distingue les scores du 1er et du 2e groupe ; les anciens scores demeurent inchangés.

Voir l’[architecture](ARCHITECTURE.md) et le [backlog](BACKLOG.md).
