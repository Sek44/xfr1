# Conjugaison — Spécifications fonctionnelles

## Présent de l’indicatif — 1er groupe

Le joueur voit un verbe à l’infinitif et une phrase avec un trou. Il doit saisir **la forme conjuguée entière** dans le trou, au moyen d’un clavier virtuel AZERTY reproduisant les trois rangées de lettres d’un clavier français, la troisième centrée. Une rangée d’accents classés par voyelle (a, e, u, i, o, puis ç) est placée au-dessus et une barre d’espace au-dessous, avec touches de suppression. Le clavier occupe presque toute la largeur disponible, avec de grandes lettres et des marges latérales modérées (de 12 à 20 px sur la page). Les lignes du clavier sont légèrement espacées entre elles (6 à 10 px). La rangée des accents dispose d'une séparation supplémentaire et ses touches ont un fond plus clair. Un clavier physique fonctionne également hors des boutons et champs de contrôle. Les accents, cédilles et la conjugaison doivent être exacts ; la casse est indifférente. Les espaces accidentels au début ou à la fin de la saisie sont ignorés à la vérification.

Six familles : **-er** régulier, **-ger**, **-cer**, **-guer**, **-yer** (passage de y à i) et **alternance e/è**. Les sujets couvrent je, tu, il, elle, on, nous, vous, ils, elles. Des groupes nominaux remplacent parfois le pronom tout en conservant le bon accord : « Paul », « Paul et Julie », « Paul et moi », « Paul et toi », etc. « Je » devient « J’ » devant une forme commençant par une voyelle. Les infinitifs à variantes orthographiques multiples ne sont pas proposés.

## Score et correction

La session comporte 10 combinaisons distinctes (famille, infinitif, personne). Après saisie, « Vérifier » signale la justesse. Le bouton bleu est centré et volontairement plus étroit que le clavier, avec un libellé large et une icône de baguette ; ses variantes de correction sont légèrement plus larges avec des caractères plus grands, tout en conservant la même hauteur. Une erreur au premier essai empêche de gagner le point sur cette question ; une bonne correction permet d’avancer mais ne rapporte pas de point. Après réussite, la question suivante arrive automatiquement au bout d’environ 3 secondes ou immédiatement avec « Suivant ».

Une série terminée produit un score sur 10 dans l’historique commun et donne **1 point d’exercice quotidien**, soit actuellement **5 minutes de jeu autorisées** quel que soit le résultat. Une session interrompue ne crédite rien. Le bouton d’icône « Recommencer la série », placé dans l’en-tête juste à gauche des scores, demande confirmation : annuler reprend le jeu, confirmer recrée une série de dix questions avec un score nul, sans enregistrer ni créditer la série abandonnée.

## Pondération et sauvegarde

La probabilité de réapparition dépend du triplet **(type de terminaison, verbe, personne grammaticale)**. Chaque apparition avec réussite au premier essai la diminue ; une erreur au premier essai l’augmente. Les différents sujets d’un même triplet ne modifient pas son poids. Un triplet ne se répète pas au sein des 10 questions.

Question, saisie, score, état de correction et délai restant sont conservés au rechargement et lors de la consultation des scores. L’interface prévoit l’ajout ultérieur d’autres temps et groupes.

Voir l’[architecture](ARCHITECTURE.md) et le [backlog](BACKLOG.md).
