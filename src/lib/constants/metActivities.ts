/**
 * MET (Metabolic Equivalent of Task) Aktiviteter
 * Baserat på Compendium of Physical Activities
 *
 * MET värden representerar energiförbrukning relativt till vila
 * 1 MET = cirka 1 kcal/kg/timme
 */

export interface METActivity {
  id: string;
  category: string;
  activity: string;
  met: number;
  intensity?: 'light' | 'moderate' | 'vigorous' | 'very vigorous';
}

export const MET_CATEGORIES = [
  'Bicycling',
  'Conditioning Exercise',
  'Dancing',
  'Fishing & Hunting',
  'Home Activities',
  'Home Repair',
  'Inactivity',
  'Lawn & Garden',
  'Miscellaneous',
  'Music Playing',
  'Occupation',
  'Running',
  'Self Care',
  'Sexual Activity',
  'Sports',
  'Transportation',
  'Walking',
  'Water Activities',
  'Winter Activities',
  'Religious Activities',
  'Volunteer Activities',
] as const;

/**
 * Omfattande lista av MET aktiviteter
 * Baserat på Compendium of Physical Activities 2011
 */
export const MET_ACTIVITIES: METActivity[] = [
  // BICYCLING (01000-01999)
  { id: '01010', category: 'Bicycling', activity: 'bicycling, leisure, <10 mph', met: 4.0, intensity: 'light' },
  { id: '01020', category: 'Bicycling', activity: 'bicycling, 10-11.9 mph, leisure, slow', met: 6.8, intensity: 'moderate' },
  { id: '01030', category: 'Bicycling', activity: 'bicycling, 12-13.9 mph, leisure, moderate', met: 8.0, intensity: 'vigorous' },
  { id: '01040', category: 'Bicycling', activity: 'bicycling, 14-15.9 mph, racing or leisure, fast', met: 10.0, intensity: 'vigorous' },
  { id: '01050', category: 'Bicycling', activity: 'bicycling, 16-19 mph, racing/not drafting', met: 12.0, intensity: 'very vigorous' },
  { id: '01060', category: 'Bicycling', activity: 'bicycling, >20 mph, racing', met: 15.8, intensity: 'very vigorous' },
  { id: '01070', category: 'Bicycling', activity: 'bicycling, mountain, uphill, vigorous', met: 14.0, intensity: 'very vigorous' },
  { id: '01080', category: 'Bicycling', activity: 'bicycling, mountain, general', met: 8.5, intensity: 'vigorous' },
  { id: '01090', category: 'Bicycling', activity: 'bicycling, BMX', met: 8.5, intensity: 'vigorous' },
  { id: '01100', category: 'Bicycling', activity: 'bicycling, stationary, light effort', met: 3.5, intensity: 'light' },
  { id: '01110', category: 'Bicycling', activity: 'bicycling, stationary, moderate effort', met: 6.8, intensity: 'moderate' },
  { id: '01120', category: 'Bicycling', activity: 'bicycling, stationary, vigorous effort', met: 8.8, intensity: 'vigorous' },
  { id: '01130', category: 'Bicycling', activity: 'bicycling, stationary, very vigorous effort', met: 11.0, intensity: 'very vigorous' },

  // CONDITIONING EXERCISE (02000-02999)
  { id: '02010', category: 'Conditioning Exercise', activity: 'aerobics, general', met: 7.3, intensity: 'vigorous' },
  { id: '02020', category: 'Conditioning Exercise', activity: 'aerobics, low impact', met: 5.0, intensity: 'moderate' },
  { id: '02030', category: 'Conditioning Exercise', activity: 'aerobics, high impact', met: 7.3, intensity: 'vigorous' },
  { id: '02040', category: 'Conditioning Exercise', activity: 'aerobics, step aerobics', met: 8.5, intensity: 'vigorous' },
  { id: '02050', category: 'Conditioning Exercise', activity: 'bench step class', met: 8.5, intensity: 'vigorous' },
  { id: '02060', category: 'Conditioning Exercise', activity: 'calisthenics (pushups, sit-ups), vigorous', met: 8.0, intensity: 'vigorous' },
  { id: '02070', category: 'Conditioning Exercise', activity: 'calisthenics, light or moderate', met: 3.5, intensity: 'light' },
  { id: '02080', category: 'Conditioning Exercise', activity: 'circuit training, moderate effort', met: 4.3, intensity: 'moderate' },
  { id: '02090', category: 'Conditioning Exercise', activity: 'circuit training, vigorous effort', met: 8.0, intensity: 'vigorous' },
  { id: '02100', category: 'Conditioning Exercise', activity: 'elliptical trainer, moderate effort', met: 5.0, intensity: 'moderate' },
  { id: '02110', category: 'Conditioning Exercise', activity: 'rope jumping, fast pace', met: 12.3, intensity: 'very vigorous' },
  { id: '02120', category: 'Conditioning Exercise', activity: 'rope jumping, moderate pace', met: 11.8, intensity: 'very vigorous' },
  { id: '02130', category: 'Conditioning Exercise', activity: 'rope jumping, slow pace', met: 8.8, intensity: 'vigorous' },
  { id: '02140', category: 'Conditioning Exercise', activity: 'rowing, stationary, light effort', met: 3.5, intensity: 'light' },
  { id: '02150', category: 'Conditioning Exercise', activity: 'rowing, stationary, moderate effort', met: 7.0, intensity: 'moderate' },
  { id: '02160', category: 'Conditioning Exercise', activity: 'rowing, stationary, vigorous effort', met: 8.5, intensity: 'vigorous' },
  { id: '02170', category: 'Conditioning Exercise', activity: 'rowing, stationary, very vigorous effort', met: 12.0, intensity: 'very vigorous' },
  { id: '02180', category: 'Conditioning Exercise', activity: 'stair-treadmill ergometer, general', met: 9.0, intensity: 'vigorous' },
  { id: '02190', category: 'Conditioning Exercise', activity: 'stretching, mild', met: 2.3, intensity: 'light' },
  { id: '02200', category: 'Conditioning Exercise', activity: 'weight lifting, light or moderate effort', met: 3.0, intensity: 'light' },
  { id: '02210', category: 'Conditioning Exercise', activity: 'weight lifting, vigorous effort', met: 6.0, intensity: 'moderate' },
  { id: '02220', category: 'Conditioning Exercise', activity: 'weight lifting, powerlifting or bodybuilding', met: 6.0, intensity: 'moderate' },
  { id: '02230', category: 'Conditioning Exercise', activity: 'yoga, Hatha', met: 2.5, intensity: 'light' },
  { id: '02240', category: 'Conditioning Exercise', activity: 'yoga, Power', met: 4.0, intensity: 'moderate' },
  { id: '02250', category: 'Conditioning Exercise', activity: 'pilates, general', met: 3.0, intensity: 'light' },

  // DANCING (03000-03999)
  { id: '03010', category: 'Dancing', activity: 'dancing, general', met: 4.5, intensity: 'moderate' },
  { id: '03020', category: 'Dancing', activity: 'dancing, aerobic, ballet or modern', met: 6.0, intensity: 'moderate' },
  { id: '03030', category: 'Dancing', activity: 'dancing, ballroom, slow', met: 3.0, intensity: 'light' },
  { id: '03040', category: 'Dancing', activity: 'dancing, ballroom, fast', met: 5.5, intensity: 'moderate' },
  { id: '03050', category: 'Dancing', activity: 'dancing, disco, folk, line dancing', met: 5.5, intensity: 'moderate' },
  { id: '03060', category: 'Dancing', activity: 'dancing, Caribbean', met: 3.5, intensity: 'light' },
  { id: '03070', category: 'Dancing', activity: 'dancing, salsa', met: 5.0, intensity: 'moderate' },
  { id: '03080', category: 'Dancing', activity: 'dancing, swing', met: 5.5, intensity: 'moderate' },
  { id: '03090', category: 'Dancing', activity: 'dancing, tap', met: 4.8, intensity: 'moderate' },

  // RUNNING (12000-12999)
  { id: '12010', category: 'Running', activity: 'running, 4 mph (15 min/mile)', met: 6.0, intensity: 'moderate' },
  { id: '12020', category: 'Running', activity: 'running, 5 mph (12 min/mile)', met: 8.3, intensity: 'vigorous' },
  { id: '12030', category: 'Running', activity: 'running, 5.2 mph (11.5 min/mile)', met: 9.0, intensity: 'vigorous' },
  { id: '12040', category: 'Running', activity: 'running, 6 mph (10 min/mile)', met: 9.8, intensity: 'vigorous' },
  { id: '12050', category: 'Running', activity: 'running, 6.7 mph (9 min/mile)', met: 10.5, intensity: 'vigorous' },
  { id: '12060', category: 'Running', activity: 'running, 7 mph (8.5 min/mile)', met: 11.0, intensity: 'very vigorous' },
  { id: '12070', category: 'Running', activity: 'running, 7.5 mph (8 min/mile)', met: 11.5, intensity: 'very vigorous' },
  { id: '12080', category: 'Running', activity: 'running, 8 mph (7.5 min/mile)', met: 11.8, intensity: 'very vigorous' },
  { id: '12090', category: 'Running', activity: 'running, 8.6 mph (7 min/mile)', met: 12.3, intensity: 'very vigorous' },
  { id: '12100', category: 'Running', activity: 'running, 9 mph (6.5 min/mile)', met: 12.8, intensity: 'very vigorous' },
  { id: '12110', category: 'Running', activity: 'running, 10 mph (6 min/mile)', met: 14.5, intensity: 'very vigorous' },
  { id: '12120', category: 'Running', activity: 'running, 11 mph (5.5 min/mile)', met: 16.0, intensity: 'very vigorous' },
  { id: '12130', category: 'Running', activity: 'running, 12 mph (5 min/mile)', met: 19.0, intensity: 'very vigorous' },
  { id: '12140', category: 'Running', activity: 'running, cross country', met: 9.0, intensity: 'vigorous' },
  { id: '12150', category: 'Running', activity: 'running, stairs, up', met: 15.0, intensity: 'very vigorous' },
  { id: '12160', category: 'Running', activity: 'running, on a track, team practice', met: 10.0, intensity: 'vigorous' },
  { id: '12170', category: 'Running', activity: 'jogging, general', met: 7.0, intensity: 'moderate' },
  { id: '12180', category: 'Running', activity: 'jogging, in place', met: 8.0, intensity: 'vigorous' },

  // SPORTS (15000-15999)
  { id: '15010', category: 'Sports', activity: 'archery, non-hunting', met: 4.3, intensity: 'moderate' },
  { id: '15020', category: 'Sports', activity: 'badminton, competitive', met: 7.0, intensity: 'moderate' },
  { id: '15030', category: 'Sports', activity: 'badminton, social singles and doubles', met: 5.5, intensity: 'moderate' },
  { id: '15040', category: 'Sports', activity: 'basketball, game', met: 8.0, intensity: 'vigorous' },
  { id: '15050', category: 'Sports', activity: 'basketball, shooting baskets', met: 4.5, intensity: 'moderate' },
  { id: '15060', category: 'Sports', activity: 'basketball, non-game, general', met: 6.5, intensity: 'moderate' },
  { id: '15070', category: 'Sports', activity: 'basketball, officiating', met: 7.0, intensity: 'moderate' },
  { id: '15080', category: 'Sports', activity: 'billiards', met: 2.5, intensity: 'light' },
  { id: '15090', category: 'Sports', activity: 'bowling', met: 3.0, intensity: 'light' },
  { id: '15100', category: 'Sports', activity: 'boxing, in ring, general', met: 12.8, intensity: 'very vigorous' },
  { id: '15110', category: 'Sports', activity: 'boxing, punching bag', met: 5.5, intensity: 'moderate' },
  { id: '15120', category: 'Sports', activity: 'boxing, sparring', met: 7.8, intensity: 'vigorous' },
  { id: '15130', category: 'Sports', activity: 'football, competitive', met: 9.0, intensity: 'vigorous' },
  { id: '15140', category: 'Sports', activity: 'football, touch, flag', met: 8.0, intensity: 'vigorous' },
  { id: '15150', category: 'Sports', activity: 'football or baseball, playing catch', met: 2.5, intensity: 'light' },
  { id: '15160', category: 'Sports', activity: 'frisbee playing, general', met: 3.0, intensity: 'light' },
  { id: '15170', category: 'Sports', activity: 'frisbee, ultimate', met: 8.0, intensity: 'vigorous' },
  { id: '15180', category: 'Sports', activity: 'golf, general', met: 4.8, intensity: 'moderate' },
  { id: '15190', category: 'Sports', activity: 'golf, walking and carrying clubs', met: 4.3, intensity: 'moderate' },
  { id: '15200', category: 'Sports', activity: 'golf, using power cart', met: 3.5, intensity: 'light' },
  { id: '15210', category: 'Sports', activity: 'gymnastics, general', met: 3.8, intensity: 'light' },
  { id: '15220', category: 'Sports', activity: 'handball, general', met: 12.0, intensity: 'very vigorous' },
  { id: '15230', category: 'Sports', activity: 'hockey, field', met: 7.8, intensity: 'vigorous' },
  { id: '15240', category: 'Sports', activity: 'hockey, ice', met: 8.0, intensity: 'vigorous' },
  { id: '15250', category: 'Sports', activity: 'racquetball, competitive', met: 10.0, intensity: 'vigorous' },
  { id: '15260', category: 'Sports', activity: 'racquetball, general', met: 7.0, intensity: 'moderate' },
  { id: '15270', category: 'Sports', activity: 'rugby', met: 10.0, intensity: 'vigorous' },
  { id: '15280', category: 'Sports', activity: 'soccer, competitive', met: 10.0, intensity: 'vigorous' },
  { id: '15290', category: 'Sports', activity: 'soccer, casual, general', met: 7.0, intensity: 'moderate' },
  { id: '15300', category: 'Sports', activity: 'softball or baseball, fast or slow pitch', met: 5.0, intensity: 'moderate' },
  { id: '15310', category: 'Sports', activity: 'softball, officiating', met: 4.0, intensity: 'moderate' },
  { id: '15320', category: 'Sports', activity: 'squash', met: 12.0, intensity: 'very vigorous' },
  { id: '15330', category: 'Sports', activity: 'table tennis, ping pong', met: 4.0, intensity: 'moderate' },
  { id: '15340', category: 'Sports', activity: 'tennis, general', met: 7.3, intensity: 'vigorous' },
  { id: '15350', category: 'Sports', activity: 'tennis, doubles', met: 6.0, intensity: 'moderate' },
  { id: '15360', category: 'Sports', activity: 'tennis, singles', met: 8.0, intensity: 'vigorous' },
  { id: '15370', category: 'Sports', activity: 'volleyball, competitive, in gymnasium', met: 6.0, intensity: 'moderate' },
  { id: '15380', category: 'Sports', activity: 'volleyball, beach', met: 8.0, intensity: 'vigorous' },

  // WALKING (17000-17999)
  { id: '17010', category: 'Walking', activity: 'walking, less than 2.0 mph, very slow', met: 2.0, intensity: 'light' },
  { id: '17020', category: 'Walking', activity: 'walking, 2.0 mph, slow pace', met: 2.8, intensity: 'light' },
  { id: '17030', category: 'Walking', activity: 'walking, 2.5 mph', met: 3.0, intensity: 'light' },
  { id: '17040', category: 'Walking', activity: 'walking, 3.0 mph, moderate pace', met: 3.5, intensity: 'light' },
  { id: '17050', category: 'Walking', activity: 'walking, 3.5 mph, brisk pace', met: 4.3, intensity: 'moderate' },
  { id: '17060', category: 'Walking', activity: 'walking, 4.0 mph, very brisk pace', met: 5.0, intensity: 'moderate' },
  { id: '17070', category: 'Walking', activity: 'walking, 4.5 mph', met: 5.3, intensity: 'moderate' },
  { id: '17080', category: 'Walking', activity: 'walking, 5.0 mph', met: 8.0, intensity: 'vigorous' },
  { id: '17090', category: 'Walking', activity: 'walking, for pleasure', met: 3.5, intensity: 'light' },
  { id: '17100', category: 'Walking', activity: 'walking, to work or school', met: 4.0, intensity: 'moderate' },
  { id: '17110', category: 'Walking', activity: 'walking, uphill', met: 6.0, intensity: 'moderate' },
  { id: '17120', category: 'Walking', activity: 'walking, downhill', met: 3.3, intensity: 'light' },
  { id: '17130', category: 'Walking', activity: 'walking, grass track', met: 4.8, intensity: 'moderate' },
  { id: '17140', category: 'Walking', activity: 'hiking, cross country', met: 6.0, intensity: 'moderate' },
  { id: '17150', category: 'Walking', activity: 'marching, rapidly, military', met: 6.5, intensity: 'moderate' },
  { id: '17160', category: 'Walking', activity: 'race walking', met: 6.5, intensity: 'moderate' },

  // WATER ACTIVITIES (18000-18999)
  { id: '18010', category: 'Water Activities', activity: 'diving, springboard or platform', met: 3.0, intensity: 'light' },
  { id: '18020', category: 'Water Activities', activity: 'kayaking', met: 5.0, intensity: 'moderate' },
  { id: '18030', category: 'Water Activities', activity: 'sailing, boat and board sailing', met: 3.0, intensity: 'light' },
  { id: '18040', category: 'Water Activities', activity: 'sailing, in competition', met: 4.5, intensity: 'moderate' },
  { id: '18050', category: 'Water Activities', activity: 'sailing, windsurfing', met: 3.0, intensity: 'light' },
  { id: '18060', category: 'Water Activities', activity: 'skiing, water', met: 6.0, intensity: 'moderate' },
  { id: '18070', category: 'Water Activities', activity: 'snorkeling', met: 5.0, intensity: 'moderate' },
  { id: '18080', category: 'Water Activities', activity: 'surfing, body or board', met: 3.0, intensity: 'light' },
  { id: '18090', category: 'Water Activities', activity: 'swimming laps, freestyle, fast', met: 9.8, intensity: 'vigorous' },
  { id: '18100', category: 'Water Activities', activity: 'swimming laps, freestyle, slow', met: 7.0, intensity: 'moderate' },
  { id: '18110', category: 'Water Activities', activity: 'swimming, backstroke, general', met: 7.0, intensity: 'moderate' },
  { id: '18120', category: 'Water Activities', activity: 'swimming, breaststroke, general', met: 10.3, intensity: 'vigorous' },
  { id: '18130', category: 'Water Activities', activity: 'swimming, butterfly, general', met: 13.8, intensity: 'very vigorous' },
  { id: '18140', category: 'Water Activities', activity: 'swimming, leisurely, not lap swimming', met: 6.0, intensity: 'moderate' },
  { id: '18150', category: 'Water Activities', activity: 'swimming, sidestroke, general', met: 7.0, intensity: 'moderate' },
  { id: '18160', category: 'Water Activities', activity: 'swimming, treading water, moderate effort', met: 3.5, intensity: 'light' },
  { id: '18170', category: 'Water Activities', activity: 'water aerobics, water calisthenics', met: 5.3, intensity: 'moderate' },
  { id: '18180', category: 'Water Activities', activity: 'water polo', met: 10.0, intensity: 'vigorous' },
  { id: '18190', category: 'Water Activities', activity: 'water volleyball', met: 3.0, intensity: 'light' },

  // HOME ACTIVITIES (05000-05999)
  { id: '05010', category: 'Home Activities', activity: 'cleaning, general', met: 3.3, intensity: 'light' },
  { id: '05020', category: 'Home Activities', activity: 'cleaning, heavy or major', met: 3.8, intensity: 'light' },
  { id: '05030', category: 'Home Activities', activity: 'mopping', met: 3.5, intensity: 'light' },
  { id: '05040', category: 'Home Activities', activity: 'sweeping', met: 3.3, intensity: 'light' },
  { id: '05050', category: 'Home Activities', activity: 'vacuuming', met: 3.3, intensity: 'light' },
  { id: '05060', category: 'Home Activities', activity: 'cooking', met: 2.5, intensity: 'light' },
  { id: '05070', category: 'Home Activities', activity: 'food preparation, standing', met: 3.3, intensity: 'light' },
  { id: '05080', category: 'Home Activities', activity: 'washing dishes, standing', met: 2.3, intensity: 'light' },
  { id: '05090', category: 'Home Activities', activity: 'ironing', met: 2.3, intensity: 'light' },
  { id: '05100', category: 'Home Activities', activity: 'laundry, washing clothes', met: 2.3, intensity: 'light' },
  { id: '05110', category: 'Home Activities', activity: 'laundry, folding or hanging clothes', met: 2.0, intensity: 'light' },
  { id: '05120', category: 'Home Activities', activity: 'making bed', met: 2.0, intensity: 'light' },
  { id: '05130', category: 'Home Activities', activity: 'moving furniture, household items', met: 5.8, intensity: 'moderate' },
  { id: '05140', category: 'Home Activities', activity: 'scrubbing floors, on hands and knees', met: 3.8, intensity: 'light' },
  { id: '05150', category: 'Home Activities', activity: 'sweeping garage, sidewalk', met: 4.0, intensity: 'moderate' },

  // LAWN & GARDEN (08000-08999)
  { id: '08010', category: 'Lawn & Garden', activity: 'gardening, general', met: 4.0, intensity: 'moderate' },
  { id: '08020', category: 'Lawn & Garden', activity: 'digging, spading, filling garden', met: 5.0, intensity: 'moderate' },
  { id: '08030', category: 'Lawn & Garden', activity: 'laying sod', met: 5.0, intensity: 'moderate' },
  { id: '08040', category: 'Lawn & Garden', activity: 'mowing lawn, general', met: 5.5, intensity: 'moderate' },
  { id: '08050', category: 'Lawn & Garden', activity: 'mowing lawn, riding mower', met: 2.5, intensity: 'light' },
  { id: '08060', category: 'Lawn & Garden', activity: 'mowing lawn, walking, power mower', met: 5.5, intensity: 'moderate' },
  { id: '08070', category: 'Lawn & Garden', activity: 'mowing lawn, walking, hand mower', met: 6.0, intensity: 'moderate' },
  { id: '08080', category: 'Lawn & Garden', activity: 'planting seedlings, shrubs', met: 4.3, intensity: 'moderate' },
  { id: '08090', category: 'Lawn & Garden', activity: 'raking lawn', met: 4.0, intensity: 'moderate' },
  { id: '08100', category: 'Lawn & Garden', activity: 'sacking grass, leaves', met: 4.0, intensity: 'moderate' },
  { id: '08110', category: 'Lawn & Garden', activity: 'trimming shrubs or trees, manual cutter', met: 4.5, intensity: 'moderate' },
  { id: '08120', category: 'Lawn & Garden', activity: 'trimming shrubs or trees, power cutter', met: 3.5, intensity: 'light' },
  { id: '08130', category: 'Lawn & Garden', activity: 'watering lawn or garden', met: 1.5, intensity: 'light' },
  { id: '08140', category: 'Lawn & Garden', activity: 'weeding, cultivating garden', met: 4.5, intensity: 'moderate' },

  // INACTIVITY (07000-07999)
  { id: '07010', category: 'Inactivity', activity: 'lying quietly, doing nothing', met: 1.0 },
  { id: '07020', category: 'Inactivity', activity: 'sitting quietly', met: 1.0 },
  { id: '07030', category: 'Inactivity', activity: 'sleeping', met: 0.9 },
  { id: '07040', category: 'Inactivity', activity: 'standing quietly', met: 1.3 },
  { id: '07050', category: 'Inactivity', activity: 'reclining, writing', met: 1.3 },
  { id: '07060', category: 'Inactivity', activity: 'reclining, talking or eating', met: 1.5 },
  { id: '07070', category: 'Inactivity', activity: 'sitting, fidgeting feet', met: 1.8 },
  { id: '07080', category: 'Inactivity', activity: 'watching television', met: 1.0 },
  { id: '07090', category: 'Inactivity', activity: 'computer work', met: 1.5 },
  { id: '07100', category: 'Inactivity', activity: 'reading, sitting', met: 1.3 },

  // OCCUPATION (11000-11999)
  { id: '11010', category: 'Occupation', activity: 'bakery, general', met: 2.5, intensity: 'light' },
  { id: '11020', category: 'Occupation', activity: 'carpentry, general', met: 3.6, intensity: 'light' },
  { id: '11030', category: 'Occupation', activity: 'carrying heavy loads', met: 8.0, intensity: 'vigorous' },
  { id: '11040', category: 'Occupation', activity: 'construction, outside', met: 5.5, intensity: 'moderate' },
  { id: '11050', category: 'Occupation', activity: 'farming, feeding animals', met: 4.5, intensity: 'moderate' },
  { id: '11060', category: 'Occupation', activity: 'farming, chores, light', met: 3.0, intensity: 'light' },
  { id: '11070', category: 'Occupation', activity: 'farming, driving harvester', met: 2.5, intensity: 'light' },
  { id: '11080', category: 'Occupation', activity: 'fire fighter, general', met: 8.0, intensity: 'vigorous' },
  { id: '11090', category: 'Occupation', activity: 'forestry, general', met: 8.0, intensity: 'vigorous' },
  { id: '11100', category: 'Occupation', activity: 'horse grooming', met: 6.0, intensity: 'moderate' },
  { id: '11110', category: 'Occupation', activity: 'horse racing, galloping', met: 8.0, intensity: 'vigorous' },
  { id: '11120', category: 'Occupation', activity: 'horse riding, general', met: 5.5, intensity: 'moderate' },
  { id: '11130', category: 'Occupation', activity: 'locksmith', met: 3.0, intensity: 'light' },
  { id: '11140', category: 'Occupation', activity: 'machine tooling', met: 3.0, intensity: 'light' },
  { id: '11150', category: 'Occupation', activity: 'masonry, concrete', met: 7.0, intensity: 'moderate' },
  { id: '11160', category: 'Occupation', activity: 'massage, standing', met: 4.0, intensity: 'moderate' },
  { id: '11170', category: 'Occupation', activity: 'moving, pushing heavy objects', met: 7.5, intensity: 'vigorous' },
  { id: '11180', category: 'Occupation', activity: 'operating heavy equipment', met: 2.5, intensity: 'light' },
  { id: '11190', category: 'Occupation', activity: 'painting, general', met: 3.3, intensity: 'light' },
  { id: '11200', category: 'Occupation', activity: 'plumbing', met: 3.0, intensity: 'light' },

  // SELF CARE (13000-13999)
  { id: '13010', category: 'Self Care', activity: 'bathing, sitting', met: 1.5, intensity: 'light' },
  { id: '13020', category: 'Self Care', activity: 'dressing, undressing', met: 2.0, intensity: 'light' },
  { id: '13030', category: 'Self Care', activity: 'eating, sitting', met: 1.5, intensity: 'light' },
  { id: '13040', category: 'Self Care', activity: 'grooming, washing hands, shaving', met: 2.0, intensity: 'light' },
  { id: '13050', category: 'Self Care', activity: 'hairstyling', met: 2.5, intensity: 'light' },
  { id: '13060', category: 'Self Care', activity: 'showering, toweling off', met: 2.0, intensity: 'light' },
  { id: '13070', category: 'Self Care', activity: 'talking and eating or eating only', met: 1.5, intensity: 'light' },

  // TRANSPORTATION (16000-16999)
  { id: '16010', category: 'Transportation', activity: 'automobile or light truck, driving', met: 2.0, intensity: 'light' },
  { id: '16020', category: 'Transportation', activity: 'automobile or light truck, not driving', met: 1.3, intensity: 'light' },
  { id: '16030', category: 'Transportation', activity: 'flying airplane', met: 2.5, intensity: 'light' },
  { id: '16040', category: 'Transportation', activity: 'motor scooter, motorcycle', met: 3.5, intensity: 'light' },
  { id: '16050', category: 'Transportation', activity: 'truck, semi, tractor, >1 ton', met: 2.0, intensity: 'light' },

  // WINTER ACTIVITIES (19000-19999)
  { id: '19010', category: 'Winter Activities', activity: 'skiing, cross country, slow', met: 7.0, intensity: 'moderate' },
  { id: '19020', category: 'Winter Activities', activity: 'skiing, cross country, moderate', met: 8.0, intensity: 'vigorous' },
  { id: '19030', category: 'Winter Activities', activity: 'skiing, cross country, vigorous', met: 9.0, intensity: 'vigorous' },
  { id: '19040', category: 'Winter Activities', activity: 'skiing, cross country, racing', met: 15.0, intensity: 'very vigorous' },
  { id: '19050', category: 'Winter Activities', activity: 'skiing, cross country, uphill', met: 16.5, intensity: 'very vigorous' },
  { id: '19060', category: 'Winter Activities', activity: 'skiing, downhill, light effort', met: 5.3, intensity: 'moderate' },
  { id: '19070', category: 'Winter Activities', activity: 'skiing, downhill, moderate effort', met: 6.0, intensity: 'moderate' },
  { id: '19080', category: 'Winter Activities', activity: 'skiing, downhill, vigorous effort', met: 8.0, intensity: 'vigorous' },
  { id: '19090', category: 'Winter Activities', activity: 'sledding, tobogganing', met: 7.0, intensity: 'moderate' },
  { id: '19100', category: 'Winter Activities', activity: 'snow shoveling, by hand', met: 5.3, intensity: 'moderate' },
  { id: '19110', category: 'Winter Activities', activity: 'snowmobiling', met: 3.5, intensity: 'light' },
  { id: '19120', category: 'Winter Activities', activity: 'snowshoeing', met: 8.0, intensity: 'vigorous' },
  { id: '19130', category: 'Winter Activities', activity: 'skating, ice, general', met: 7.0, intensity: 'moderate' },
  { id: '19140', category: 'Winter Activities', activity: 'skating, ice, rapidly', met: 9.0, intensity: 'vigorous' },

  // MISCELLANEOUS (09000-09999)
  { id: '09010', category: 'Miscellaneous', activity: 'childcare, general', met: 3.0, intensity: 'light' },
  { id: '09020', category: 'Miscellaneous', activity: 'children\'s games, hopscotch, jacks', met: 5.0, intensity: 'moderate' },
  { id: '09030', category: 'Miscellaneous', activity: 'marching band, playing instrument', met: 4.0, intensity: 'moderate' },
  { id: '09040', category: 'Miscellaneous', activity: 'playing with children, vigorous', met: 5.8, intensity: 'moderate' },
  { id: '09050', category: 'Miscellaneous', activity: 'playing with children, moderate', met: 4.0, intensity: 'moderate' },
  { id: '09060', category: 'Miscellaneous', activity: 'playing with children, light', met: 2.5, intensity: 'light' },
  { id: '09070', category: 'Miscellaneous', activity: 'standing, playing with children', met: 2.8, intensity: 'light' },

  // SEXUAL ACTIVITY (14000-14999)
  { id: '14010', category: 'Sexual Activity', activity: 'sexual activity, general, moderate effort', met: 1.8, intensity: 'light' },
  { id: '14020', category: 'Sexual Activity', activity: 'sexual activity, vigorous effort', met: 2.8, intensity: 'light' },

  // MUSIC PLAYING (10000-10999)
  { id: '10010', category: 'Music Playing', activity: 'accordion', met: 1.8, intensity: 'light' },
  { id: '10020', category: 'Music Playing', activity: 'cello', met: 2.3, intensity: 'light' },
  { id: '10030', category: 'Music Playing', activity: 'conducting', met: 2.5, intensity: 'light' },
  { id: '10040', category: 'Music Playing', activity: 'drums', met: 4.0, intensity: 'moderate' },
  { id: '10050', category: 'Music Playing', activity: 'flute', met: 2.0, intensity: 'light' },
  { id: '10060', category: 'Music Playing', activity: 'guitar, classical, folk', met: 2.0, intensity: 'light' },
  { id: '10070', category: 'Music Playing', activity: 'guitar, rock and roll', met: 3.0, intensity: 'light' },
  { id: '10080', category: 'Music Playing', activity: 'piano or organ', met: 2.3, intensity: 'light' },
  { id: '10090', category: 'Music Playing', activity: 'trombone', met: 3.5, intensity: 'light' },
  { id: '10100', category: 'Music Playing', activity: 'trumpet', met: 2.5, intensity: 'light' },
  { id: '10110', category: 'Music Playing', activity: 'violin', met: 2.5, intensity: 'light' },
  { id: '10120', category: 'Music Playing', activity: 'woodwind', met: 2.0, intensity: 'light' },

  // FISHING & HUNTING (04000-04999)
  { id: '04010', category: 'Fishing & Hunting', activity: 'fishing, general', met: 3.5, intensity: 'light' },
  { id: '04020', category: 'Fishing & Hunting', activity: 'fishing, ice', met: 2.0, intensity: 'light' },
  { id: '04030', category: 'Fishing & Hunting', activity: 'fishing from boat, sitting', met: 2.5, intensity: 'light' },
  { id: '04040', category: 'Fishing & Hunting', activity: 'fishing from riverbank, standing', met: 3.5, intensity: 'light' },
  { id: '04050', category: 'Fishing & Hunting', activity: 'fishing in stream, in waders', met: 6.0, intensity: 'moderate' },
  { id: '04060', category: 'Fishing & Hunting', activity: 'hunting, bow and arrow or crossbow', met: 2.5, intensity: 'light' },
  { id: '04070', category: 'Fishing & Hunting', activity: 'hunting, deer, elk, large game', met: 6.0, intensity: 'moderate' },
  { id: '04080', category: 'Fishing & Hunting', activity: 'hunting, duck, wading', met: 2.5, intensity: 'light' },
  { id: '04090', category: 'Fishing & Hunting', activity: 'hunting, general', met: 5.0, intensity: 'moderate' },
  { id: '04100', category: 'Fishing & Hunting', activity: 'hunting, pheasants or grouse', met: 6.0, intensity: 'moderate' },

  // HOME REPAIR (06000-06999)
  { id: '06010', category: 'Home Repair', activity: 'automobile body work', met: 3.0, intensity: 'light' },
  { id: '06020', category: 'Home Repair', activity: 'automobile repair', met: 3.0, intensity: 'light' },
  { id: '06030', category: 'Home Repair', activity: 'carpentry, finishing or refinishing cabinets', met: 4.5, intensity: 'moderate' },
  { id: '06040', category: 'Home Repair', activity: 'carpentry, sawing hardwood', met: 6.0, intensity: 'moderate' },
  { id: '06050', category: 'Home Repair', activity: 'caulking, chinking log cabin', met: 5.0, intensity: 'moderate' },
  { id: '06060', category: 'Home Repair', activity: 'caulking, except log cabin', met: 4.5, intensity: 'moderate' },
  { id: '06070', category: 'Home Repair', activity: 'cleaning gutters', met: 5.0, intensity: 'moderate' },
  { id: '06080', category: 'Home Repair', activity: 'excavating garage', met: 5.0, intensity: 'moderate' },
  { id: '06090', category: 'Home Repair', activity: 'hanging storm windows', met: 5.0, intensity: 'moderate' },
  { id: '06100', category: 'Home Repair', activity: 'laying or removing carpet', met: 4.5, intensity: 'moderate' },
  { id: '06110', category: 'Home Repair', activity: 'painting, outside home', met: 5.0, intensity: 'moderate' },
  { id: '06120', category: 'Home Repair', activity: 'painting, papering, plastering', met: 3.3, intensity: 'light' },
  { id: '06130', category: 'Home Repair', activity: 'repairing, painting boat or trailer', met: 4.5, intensity: 'moderate' },
  { id: '06140', category: 'Home Repair', activity: 'roofing', met: 6.0, intensity: 'moderate' },
  { id: '06150', category: 'Home Repair', activity: 'sanding floors with a power sander', met: 4.5, intensity: 'moderate' },
  { id: '06160', category: 'Home Repair', activity: 'scraping and painting sailboat', met: 4.5, intensity: 'moderate' },
  { id: '06170', category: 'Home Repair', activity: 'spreading dirt with a shovel', met: 5.0, intensity: 'moderate' },
  { id: '06180', category: 'Home Repair', activity: 'washing and waxing car', met: 4.5, intensity: 'moderate' },

  // RELIGIOUS ACTIVITIES (20000-20999)
  { id: '20010', category: 'Religious Activities', activity: 'church service, sitting', met: 1.3, intensity: 'light' },
  { id: '20020', category: 'Religious Activities', activity: 'church service, standing, singing', met: 2.0, intensity: 'light' },
  { id: '20030', category: 'Religious Activities', activity: 'praying, standing', met: 1.3, intensity: 'light' },
  { id: '20040', category: 'Religious Activities', activity: 'religious ceremony, kneeling', met: 1.8, intensity: 'light' },

  // VOLUNTEER ACTIVITIES (21000-21999)
  { id: '21010', category: 'Volunteer Activities', activity: 'moderate effort tasks', met: 3.0, intensity: 'light' },
  { id: '21020', category: 'Volunteer Activities', activity: 'light effort tasks', met: 2.5, intensity: 'light' },
];

/**
 * Sök aktiviteter baserat på kategori och sökterm
 */
export function searchActivities(searchTerm: string, category?: string): METActivity[] {
  let filtered = MET_ACTIVITIES;

  if (category && category !== 'All') {
    filtered = filtered.filter(activity => activity.category === category);
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      activity =>
        activity.activity.toLowerCase().includes(term) ||
        activity.category.toLowerCase().includes(term)
    );
  }

  return filtered;
}

/**
 * Få alla aktiviteter för en kategori
 */
export function getActivitiesByCategory(category: string): METActivity[] {
  return MET_ACTIVITIES.filter(activity => activity.category === category);
}

/**
 * Hitta aktivitet per ID
 */
export function getActivityById(id: string): METActivity | undefined {
  return MET_ACTIVITIES.find(activity => activity.id === id);
}

/**
 * Få aktiviteter sorterade efter MET värde
 */
export function getActivitiesByMET(ascending: boolean = false): METActivity[] {
  return [...MET_ACTIVITIES].sort((a, b) => (ascending ? a.met - b.met : b.met - a.met));
}
