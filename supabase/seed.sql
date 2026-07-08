-- LN Planner — seed the two starting clients (Phase 2)
-- Idempotent: only inserts a client if its name is not already present.
-- Rules/hashtags come from BUILD-SPEC.md section 3.

insert into public.clients (name, handle, emoji, branche, cta, voice, hard_rules, hashtags_fix, facts)
select
  'Greek Food Olympia',
  '@greekfoodolympia',
  '🇬🇷',
  'Restaurant',
  'Willkommen im GFO.',
  'Du-Form, warm und atmosphärisch. Sinnliche Bilder von Essen und Abend. Jeder Post folgt einer Dreiteilung (Anreiz · Detail · Einladung) und schließt mit „Willkommen im GFO.".',
  array[
    'du-Form, atmosphärisch, Dreiteilung, schließt mit „Willkommen im GFO."',
    'Kein Em-Dash (—)',
    'Max. 6–8 Hashtags, ".." + Zeilenumbruch vor dem Hashtag-Block',
    'Feed nur Sonntag 18:00 Uhr',
    'Business Lunch: 19,90 € / 3 Gänge / Mo–Fr 11:45–14:30 Uhr'
  ],
  array[
    '#greekfoodolympia','#berlindining','#berlinrestaurants',
    '#moderncuisine','#greekbutdifferent','#dinnerexperience'
  ],
  'Business Lunch: 19,90 € für 3 Gänge, Mo–Fr 11:45–14:30 Uhr. Feed-Posts nur sonntags 18:00 Uhr.'
where not exists (select 1 from public.clients where name = 'Greek Food Olympia');

insert into public.clients (name, handle, emoji, branche, cta, voice, hard_rules, hashtags_fix, facts)
select
  'team tankpool24',
  '@teamenergie',
  '⛽',
  'Mobilität / Fuhrpark',
  'Link in Bio 👆',
  'Sachlich, kompetent, B2B für Disponenten und Fuhrparkleiter. Nutzenorientiert und seriös, ohne Übertreibung. Schließt immer mit „Link in Bio 👆".',
  array[
    'Markenname „tankpool24-Karte von team" — nie „team Mobility Card"',
    '„team" immer klein; nie „tp24" öffentlich',
    'Kein Em-Dash; immer „Link in Bio 👆"',
    'Karte nie als „Bezahlkarte"; keine Referenzkunden namentlich',
    'Schmierstoff-Hausmarke oilfino; Partner Mobil/ExxonMobil (nicht Total)',
    'Ladeabdeckung „nahezu allen Ladepunkten in Deutschland" — nie „99%"',
    'Ökostrom = aus Wasserkraft; B100 Biodiesel nicht im Sortiment (nie nennen)',
    'Immer „2.200 Stationen"; HVO100 „ca. 90%" CO₂-Reduktion',
    'Design: schwarz/weiß entsättigt, rot #E31E24 einziger Akzent'
  ],
  array['#teamenergie','#tankpool24','#fuhrpark','#spedition','#logistik'],
  '2.200 Stationen. HVO100 ca. 90% CO₂-Reduktion. Ökostrom aus Wasserkraft. Schmierstoff-Hausmarke oilfino. Partner Mobil/ExxonMobil. Ladeabdeckung: nahezu alle Ladepunkte in Deutschland.'
where not exists (select 1 from public.clients where name = 'team tankpool24');
