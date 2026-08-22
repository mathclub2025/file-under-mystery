-- FILE UNDER MYSTERY Master Seed Data (12 Tiers + Final Boss)
insert into levels (id, level_order, base_points, correct_hash) values
('level1', 1, 10, 'A19X7'),
('level2', 2, 12, 'K4P82'),
('level3', 3, 14, 'XT4Q1'),
('level4', 4, 16, 'M77RB'),
('level5', 5, 18, 'P0W3R'),
('level6', 6, 15, 'NT2K5'),
('level7', 7, 18, 'BXZ19'),
('level8', 8, 20, 'FIN4L'),
('level9', 9, 22, 'EL7P9'),
('level10', 10, 22, 'R30S4'),
('level11', 11, 24, 'PH4Z3'),
('level12', 12, 25, 'GR4PH'),
('final', 13, 40, 'THE_BEACON_IS_AWAKE')
on conflict (id) do update set 
    base_points = excluded.base_points,
    correct_hash = excluded.correct_hash;
