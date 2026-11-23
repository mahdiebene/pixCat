import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adjustStat,
  advanceToNextDay,
  applyPersistedJson,
  buyFoodToFridge,
  clampBathroomDuckPosition,
  computeStageViewport,
  consumeTableFood,
  createInitialState,
  detectRoomSwipe,
  diffDateKeys,
  extractPersistedData,
  finishMiniGame,
  getBondLevelInfo,
  getCatMoodSummary,
  getDraggedItemPoint,
  getProfileMilestones,
  getTouchHitPadding,
  hitTestHubCard,
  moveFridgeItemToTable,
  moveTableItemToFridge,
  recordCareActivity,
  resetMiniGame,
  resolveFlyingFood,
  sanitizePetName,
  screenPointToWorld,
  stepMiniGame,
  stepToyMouse,
  stepYarnPhysics,
  syncDailyProgress,
  tryConsumeFood,
  tryEquipAccessory,
} from './logic';
import { FOODS } from './types';

test('stat clamping prevents NaN, negative, and >100 values without wiping stats', () => {
  const s = createInitialState();
  adjustStat(s, 'hunger', 500);
  assert.equal(s.stats.hunger, 100);
  adjustStat(s, 'hunger', -999);
  assert.equal(s.stats.hunger, 0);
  const prevFun = s.stats.fun;
  adjustStat(s, 'fun', Number.NaN);
  adjustStat(s, 'fun', Number.POSITIVE_INFINITY);
  assert.equal(s.stats.fun, prevFun);
  // Recovers if stat itself was corrupted to NaN
  s.stats.energy = Number.NaN;
  adjustStat(s, 'energy', 10);
  assert.equal(s.stats.energy, 60);
});

test('pet name sanitization strips special chars and enforces max length', () => {
  assert.equal(sanitizePetName('  mochi!@#  '), 'MOCHI');
  assert.equal(sanitizePetName('   '), '');
  assert.equal(sanitizePetName('superlongkittynamed'), 'SUPERLONGK');
});

test('persistence handles valid round-trip and recovers cleanly from corrupted storage', () => {
  const s = createInitialState();
  s.petName = 'YUZU';
  s.coins = 42;
  s.fur = 'tabby';
  s.ownedAccessories = ['none', 'bow', 'crown'];
  s.accessory = 'crown';
  s.highScore = 180;
  s.stats.hunger = 64;

  const saved = JSON.stringify(extractPersistedData(s));
  const fresh = createInitialState();
  assert.equal(applyPersistedJson(fresh, saved), true);
  assert.equal(fresh.petName, 'YUZU');
  assert.equal(fresh.coins, 42);
  assert.equal(fresh.fur, 'tabby');
  assert.equal(fresh.accessory, 'crown');
  assert.equal(fresh.highScore, 180);

  // Corrupted JSON & out-of-range values
  const damaged = createInitialState();
  assert.equal(applyPersistedJson(damaged, '{not-valid-json'), false);
  assert.equal(damaged.petName, 'MOCHI');

  const weird = createInitialState();
  applyPersistedJson(
    weird,
    JSON.stringify({
      petName: '   ',
      coins: -50,
      fur: 'nonexistent',
      accessory: 'crown', // not owned
      ownedAccessories: ['invalid_item'],
      stats: { hunger: 999, hygiene: -10, energy: null, fun: 40 },
    }),
  );
  assert.equal(weird.petName, 'MOCHI');
  assert.equal(weird.coins, 0);
  assert.equal(weird.fur, 'classic');
  assert.equal(weird.accessory, 'none');
  assert.ok(weird.ownedAccessories.includes('bow'));
  assert.equal(weird.stats.hunger, 100);
  assert.equal(weird.stats.hygiene, 5);
  assert.equal(weird.stats.fun, 40);
});

test('feeding free and paid foods charges coins only on success and boosts stats', () => {
  const s = createInitialState();
  s.coins = 6;
  s.stats.hunger = 50;

  // Free fish succeeds without spending coins
  const resFish = tryConsumeFood(s, 'fish');
  assert.equal(resFish.ok, true);
  assert.equal(s.coins, 6);
  assert.equal(s.stats.hunger, 70);

  // Paid cake (10 coins) fails without mutating coins or hunger
  const resCake = tryConsumeFood(s, 'cake');
  assert.equal(resCake.ok, false);
  assert.equal(resCake.reason, 'insufficient_coins');
  assert.equal(s.coins, 6);
  assert.equal(s.stats.hunger, 70);

  // Paid boba (5 coins) succeeds
  const resBoba = tryConsumeFood(s, 'boba');
  assert.equal(resBoba.ok, true);
  assert.equal(s.coins, 1);
  assert.equal(s.stats.hunger, 92);
});

test('closet accessory purchase, re-equip without double charge, and unequip work cleanly', () => {
  const s = createInitialState();
  s.coins = 15;

  // Shades costs 10 -> buys and equips
  const buy = tryEquipAccessory(s, 'shades');
  assert.equal(buy.ok, true);
  assert.equal(buy.purchased, true);
  assert.equal(s.coins, 5);
  assert.equal(s.accessory, 'shades');
  assert.ok(s.ownedAccessories.includes('shades'));

  // Crown costs 30 -> fails cleanly
  const failCrown = tryEquipAccessory(s, 'crown');
  assert.equal(failCrown.ok, false);
  assert.equal(failCrown.reason, 'insufficient_coins');
  assert.equal(s.accessory, 'shades');
  assert.equal(s.coins, 5);

  // Unequip & re-equip shades costs 0
  tryEquipAccessory(s, 'none');
  assert.equal(s.accessory, 'none');
  const reequip = tryEquipAccessory(s, 'shades');
  assert.equal(reequip.ok, true);
  assert.equal(reequip.purchased, false);
  assert.equal(s.coins, 5);
  assert.equal(s.accessory, 'shades');
});

test('hub card hit testing maps coordinates to the five rooms', () => {
  assert.equal(hitTestHubCard(90, 75), 'bedroom');
  assert.equal(hitTestHubCard(300, 75), 'bathroom');
  assert.equal(hitTestHubCard(200, 140), 'playroom');
  assert.equal(hitTestHubCard(90, 210), 'kitchen');
  assert.equal(hitTestHubCard(300, 210), 'closet');
  assert.equal(hitTestHubCard(10, 10), null);
});

test('yarn physics bounces off floor and walls and settles cleanly', () => {
  const s = createInitialState();
  s.playroom.yarn = { active: true, x: 80, y: 220, vx: -120, vy: 80, rot: 0 };
  const ev = stepYarnPhysics(s, 0.05);
  assert.equal(ev.bounced, true);
  assert.ok(s.playroom.yarn.x >= 78);
  assert.ok(s.playroom.yarn.y <= 230);
});

test('Fish Catch mini-game scores catches, penalizes boots safely, and ends with coin payout', () => {
  const s = createInitialState();
  s.coins = 10;
  resetMiniGame(s);

  // Boot at score 0 clamps safely to 0
  s.playroom.miniGame.items = [{ type: 'boot', x: s.playroom.miniGame.catX, y: 232, vy: 40 }];
  const ev0 = stepMiniGame(s, 0.016, () => 0.5);
  assert.equal(ev0.caughtBoot.length, 1);
  assert.equal(s.playroom.miniGame.score, 0);

  // Star gives +25 and +3 coins
  s.playroom.miniGame.items = [{ type: 'star', x: s.playroom.miniGame.catX, y: 230, vy: 40 }];
  const ev1 = stepMiniGame(s, 0.016, () => 0.5);
  assert.equal(ev1.caughtGood.length, 1);
  assert.equal(s.playroom.miniGame.score, 25);
  assert.equal(s.playroom.miniGame.coinsEarned, 3);

  // Boot at score 25 drops to 15
  s.playroom.miniGame.items = [{ type: 'boot', x: s.playroom.miniGame.catX, y: 232, vy: 40 }];
  stepMiniGame(s, 0.016, () => 0.5);
  assert.equal(s.playroom.miniGame.score, 15);

  // Finish timer
  s.playroom.miniGame.timeLeft = 0.01;
  const ev2 = stepMiniGame(s, 0.02, () => 0.5);
  assert.equal(ev2.finished, true);
  assert.equal(s.playroom.miniGame.gameOver, true);
  assert.equal(s.coins, 13);
  assert.equal(s.highScore, 15);
  assert.ok(s.playroom.miniGame.popups.length >= 1);
});

test('wind-up toy mouse scurries, bounces off playroom walls, and winds down cleanly', () => {
  const s = createInitialState();
  s.playroom.mouse = { active: true, x: 268, y: 240, vx: 100, dir: 1, windTimer: 1.0 };
  const ev = stepToyMouse(s, 0.1);
  assert.equal(ev.turned, true);
  assert.equal(s.playroom.mouse.dir, -1);
  assert.ok(s.playroom.mouse.vx < 0);
  assert.ok(s.playroom.mouse.x <= 272);

  // Wind-down stops mouse cleanly
  stepToyMouse(s, 1.0);
  assert.equal(s.playroom.mouse.active, false);
  assert.equal(s.playroom.mouse.vx, 0);
});

test('adaptive viewport keeps 400x300 on desktop and expands full-bleed portrait buffer on mobile', () => {
  const desk = computeStageViewport(800, 600);
  assert.equal(desk.isPortrait, false);
  assert.equal(desk.bufW, 400);
  assert.equal(desk.bufH, 300);
  assert.equal(desk.offsetX, 0);
  assert.equal(desk.offsetY, 0);

  const phone = computeStageViewport(390, 580);
  assert.equal(phone.isPortrait, true);
  assert.equal(phone.bufW, 368);
  assert.ok(phone.bufH > 500);
  assert.equal(phone.offsetX, -16);
  assert.ok(phone.offsetY > 100);

  // Center of canvas maps cleanly back to world center (200, 150)
  const centerWorld = screenPointToWorld(0.5, 0.5, phone);
  assert.ok(Math.abs(centerWorld.x - 200) <= 1);
  assert.ok(Math.abs(centerWorld.y - 150) <= 1);

  // Portrait hub cards hit-test cleanly across all 5 rooms
  assert.equal(hitTestHubCard(100, 20, true), 'bedroom');
  assert.equal(hitTestHubCard(280, 20, true), 'bathroom');
  assert.equal(hitTestHubCard(200, 140, true), 'playroom');
  assert.equal(hitTestHubCard(100, 260, true), 'kitchen');
  assert.equal(hitTestHubCard(280, 260, true), 'closet');
});

test('kitchen grocery shop fills fridge up to capacity, serves to table, and feeds Mochi', () => {
  const s = createInitialState();
  s.coins = 20;
  s.stats.hunger = 40;
  // Starts with 2 starter items in fridge
  assert.equal(s.kitchen.fridgeItems.length, 2);
  assert.equal(s.kitchen.tableItems.length, 0);

  // Buy paid boba (5c) + sushi (8c) + free fish + free milk -> fills fridge to 6/6
  assert.equal(buyFoodToFridge(s, 'boba').ok, true);
  assert.equal(s.coins, 15);
  assert.equal(buyFoodToFridge(s, 'sushi').ok, true);
  assert.equal(s.coins, 7);
  // Cake costs 10c -> insufficient coins
  const tooExpensive = buyFoodToFridge(s, 'cake');
  assert.equal(tooExpensive.ok, false);
  assert.equal(tooExpensive.reason, 'insufficient_coins');

  assert.equal(buyFoodToFridge(s, 'fish').ok, true);
  assert.equal(buyFoodToFridge(s, 'milk').ok, true);
  assert.equal(s.kitchen.fridgeItems.length, 6);

  // 7th item rejected cleanly because fridge is full!
  const fullRes = buyFoodToFridge(s, 'fish');
  assert.equal(fullRes.ok, false);
  assert.equal(fullRes.reason, 'fridge_full');
  assert.equal(s.kitchen.fridgeItems.length, 6);

  // Serve 3 items from fridge to dining table (table cap = 3)
  assert.equal(moveFridgeItemToTable(s, 0).ok, true);
  assert.equal(moveFridgeItemToTable(s, 0).ok, true);
  assert.equal(moveFridgeItemToTable(s, 0).ok, true);
  assert.equal(s.kitchen.fridgeItems.length, 3);
  assert.equal(s.kitchen.tableItems.length, 3);

  // 4th item to table rejected cleanly
  const tableFull = moveFridgeItemToTable(s, 0);
  assert.equal(tableFull.ok, false);
  assert.equal(tableFull.reason, 'table_full');

  // Put one item back into fridge cleanly
  assert.equal(moveTableItemToFridge(s, 2).ok, true);
  assert.equal(s.kitchen.tableItems.length, 2);
  assert.equal(s.kitchen.fridgeItems.length, 4);

  // Feed Mochi from table boosts hunger and removes plated food
  const fed = consumeTableFood(s, 0);
  assert.equal(fed.ok, true);
  assert.equal(s.kitchen.tableItems.length, 1);
  assert.ok(s.stats.hunger > 40);

  // Persistence preserves fridge & table inventory cleanly
  const saved = JSON.stringify(extractPersistedData(s));
  const restored = createInitialState();
  assert.equal(applyPersistedJson(restored, saved), true);
  assert.deepEqual(restored.kitchen.fridgeItems, s.kitchen.fridgeItems);
  assert.deepEqual(restored.kitchen.tableItems, s.kitchen.tableItems);
});

test('resolveFlyingFood settles in-flight treat stats once and never double-feeds', () => {
  const s = createInitialState();
  s.stats.hunger = 40;
  s.stats.fun = 50;
  const cake = FOODS.find((f) => f.id === 'cake')!;
  s.kitchen.flyingFood = {
    id: cake.id,
    food: cake,
    x: 220,
    y: 190,
    sx: 220,
    sy: 190,
    tx: 162,
    ty: 186,
    t: 0.4,
  };

  const settled = resolveFlyingFood(s);
  assert.equal(settled?.id, 'cake');
  assert.equal(s.kitchen.flyingFood, null);
  assert.equal(s.stats.hunger, 40 + cake.hunger);
  assert.equal(s.stats.fun, 50 + cake.fun);

  // Second call is a clean no-op
  const again = resolveFlyingFood(s);
  assert.equal(again, null);
  assert.equal(s.stats.hunger, 40 + cake.hunger);
});

test('finishMiniGame awards partial coins on early exit and is strictly idempotent', () => {
  const s = createInitialState();
  s.coins = 10;
  s.highScore = 20;
  resetMiniGame(s);
  s.playroom.miniGame.score = 35;
  s.playroom.miniGame.coinsEarned = 4;

  const first = finishMiniGame(s, true);
  assert.equal(first.awardedCoins, 4);
  assert.equal(first.newBest, true);
  assert.equal(s.coins, 14);
  assert.equal(s.highScore, 35);
  assert.equal(s.playroom.miniGame.active, false);
  assert.equal(s.playroom.miniGame.gameOver, true);

  // Calling finishMiniGame again never double-awards coins
  const second = finishMiniGame(s, true);
  assert.equal(second.awardedCoins, 0);
  assert.equal(second.newBest, false);
  assert.equal(s.coins, 14);
});

test('stepMiniGame cancels simultaneous left+right keys and ignores invalid dt', () => {
  const s = createInitialState();
  resetMiniGame(s);
  const startX = s.playroom.miniGame.catX;
  s.keys.left = true;
  s.keys.right = true;
  stepMiniGame(s, 0.05, () => 0.5);
  assert.equal(s.playroom.miniGame.catX, startX);

  const timeBefore = s.playroom.miniGame.timeLeft;
  stepMiniGame(s, 0, () => 0.5);
  stepMiniGame(s, -1, () => 0.5);
  stepMiniGame(s, Number.NaN, () => 0.5);
  assert.equal(s.playroom.miniGame.timeLeft, timeBefore);
});

test('kitchen slot helpers reject invalid, negative, fractional, and out-of-bounds indices', () => {
  const s = createInitialState();
  s.kitchen.fridgeItems = ['fish', 'milk'];
  s.kitchen.tableItems = ['boba'];

  for (const badIdx of [-1, 0.5, 2, 99, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(moveFridgeItemToTable(s, badIdx).reason, 'invalid_slot');
    assert.equal(moveTableItemToFridge(s, badIdx).reason, 'invalid_slot');
    assert.equal(consumeTableFood(s, badIdx).reason, 'invalid_slot');
  }
  assert.deepEqual(s.kitchen.fridgeItems, ['fish', 'milk']);
  assert.deepEqual(s.kitchen.tableItems, ['boba']);
});

test('physics, coordinates, and persistence clamp extreme and non-finite edge cases', () => {
  const s = createInitialState();
  s.playroom.yarn = { active: true, x: 200, y: 150, vx: 99999, vy: -99999, rot: 0 };
  // Zero / NaN dt does nothing
  stepYarnPhysics(s, 0);
  stepYarnPhysics(s, Number.NaN);
  assert.equal(s.playroom.yarn.x, 200);
  // Clamped velocity stays finite and inside room bounds
  stepYarnPhysics(s, 0.05);
  assert.ok(Number.isFinite(s.playroom.yarn.vx) && Math.abs(s.playroom.yarn.vx) <= 280);
  assert.ok(s.playroom.yarn.x >= 78 && s.playroom.yarn.x <= 318);

  // Mouse ignores non-positive / NaN dt
  s.playroom.mouse = { active: true, x: 180, y: 240, vx: 80, dir: 1, windTimer: 2 };
  stepToyMouse(s, -0.5);
  stepToyMouse(s, Number.NaN);
  assert.equal(s.playroom.mouse.x, 180);
  assert.equal(s.playroom.mouse.windTimer, 2);

  // Bathroom duck position clamps NaN and out-of-tub coordinates
  const duckNaN = clampBathroomDuckPosition(Number.NaN, Number.POSITIVE_INFINITY);
  assert.deepEqual(duckNaN, { x: 182, y: 208 });
  const duckFar = clampBathroomDuckPosition(-500, 999);
  assert.deepEqual(duckFar, { x: 146, y: 242 });

  // screenPointToWorld handles NaN normalized pointer coords safely
  const vp = computeStageViewport(390, 844);
  const pt = screenPointToWorld(Number.NaN, Number.NEGATIVE_INFINITY, vp);
  assert.ok(Number.isFinite(pt.x) && Number.isFinite(pt.y));

  // Persistence clamps huge coins/highScore and trims oversized/invalid kitchen arrays
  const capped = createInitialState();
  applyPersistedJson(
    capped,
    JSON.stringify({
      coins: 999_999_999,
      highScore: 50_000_000,
      fridgeItems: ['fish', 'bad_food', 'milk', 'boba', 'cake', 'sushi', 'fish', 'milk'],
      tableItems: ['fish', 'milk', 'boba', 'cake', 'sushi'],
    }),
  );
  assert.equal(capped.coins, 999_999);
  assert.equal(capped.highScore, 999_999);
  assert.equal(capped.kitchen.fridgeItems.length, 6);
  assert.ok(!capped.kitchen.fridgeItems.includes('bad_food' as never));
  assert.equal(capped.kitchen.tableItems.length, 3);
});

test('date math and calendar sync advance days, track streaks, archive history, and ignore backward clocks', () => {
  assert.equal(diffDateKeys('2026-11-23', '2026-11-24'), 1);
  assert.equal(diffDateKeys('2026-11-23', '2026-11-26'), 3);
  assert.equal(diffDateKeys('2026-11-23', '2026-11-23'), 0);
  assert.equal(diffDateKeys('2026-11-24', '2026-11-23'), 0);
  assert.equal(diffDateKeys('not-a-date', '2026-11-24'), 0);
  assert.equal(diffDateKeys('2026-02-30', '2026-03-01'), 0);

  const s = createInitialState('2026-11-20');
  s.coins = 10;
  recordCareActivity(s, 'feed');
  recordCareActivity(s, 'play');

  // Same-day sync is a no-op
  const sameDay = syncDailyProgress(s, '2026-11-20');
  assert.equal(sameDay.advanced, false);
  assert.equal(s.progress.currentDay, 1);

  // Consecutive next day advances day, increments streak, logs Day 1, awards coins
  const nextDay = syncDailyProgress(s, '2026-11-21');
  assert.equal(nextDay.advanced, true);
  assert.equal(nextDay.daysElapsed, 1);
  assert.equal(s.progress.currentDay, 2);
  assert.equal(s.progress.streakDays, 2);
  assert.equal(s.progress.bestStreak, 2);
  assert.equal(s.progress.dayHistory.length, 1);
  assert.equal(s.progress.dayHistory[0].dayNumber, 1);
  assert.equal(s.progress.dayHistory[0].careCount, 2);
  assert.equal(s.progress.todayCare.fed, false);
  assert.ok(nextDay.bonusCoins >= 12);
  assert.equal(s.coins, 10 + nextDay.bonusCoins);

  // 3-day gap resets streak to 1, preserves bestStreak, floors stats safely
  const afterGap = syncDailyProgress(s, '2026-11-24');
  assert.equal(afterGap.advanced, true);
  assert.equal(afterGap.daysElapsed, 3);
  assert.equal(s.progress.currentDay, 5);
  assert.equal(s.progress.streakDays, 1);
  assert.equal(s.progress.bestStreak, 2);
  assert.ok(s.stats.hunger >= 28 && s.stats.hygiene >= 30 && s.stats.fun >= 28);
});

test('care activities award Bond XP, level up stages, and trigger Perfect Day reward once per day', () => {
  const s = createInitialState('2026-11-23');
  s.coins = 20;

  const r1 = recordCareActivity(s, 'feed');
  assert.equal(r1.taskJustCompleted, 'fed');
  assert.equal(s.progress.lifetime.mealsServed, 1);

  const r2 = recordCareActivity(s, 'bath');
  assert.equal(r2.taskJustCompleted, 'bathed');
  assert.equal(s.progress.lifetime.bathsGiven, 1);

  const r3 = recordCareActivity(s, 'play');
  assert.equal(r3.taskJustCompleted, 'played');
  assert.equal(s.progress.lifetime.playSessions, 1);

  // Completing 4th task triggers Perfect Day bonus (+20 coins, +30 XP) and levels up!
  const r4 = recordCareActivity(s, 'nap');
  assert.equal(r4.taskJustCompleted, 'slept');
  assert.equal(r4.perfectDayAchieved, true);
  assert.equal(r4.bonusCoins, 20);
  assert.equal(s.coins, 40);
  assert.equal(s.progress.perfectDays, 1);
  assert.ok(getBondLevelInfo(s.progress.xp).level >= 2);

  // Repeating care same day never double-claims Perfect Day bonus
  const r5 = recordCareActivity(s, 'feed');
  assert.equal(r5.perfectDayAchieved, false);
  assert.equal(r5.bonusCoins, 0);
  assert.equal(s.coins, 40);
  assert.equal(s.progress.perfectDays, 1);
});

test('advanceToNextDay requires daily care, archives journal, and gates morning coin bonus cleanly', () => {
  const s = createInitialState('2026-11-23');
  s.coins = 10;

  // Blocked cleanly when 0 care tasks completed
  const blocked = advanceToNextDay(s, '2026-11-23');
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'no_care_today');
  assert.equal(s.progress.currentDay, 1);

  // 1 care task advances day without morning coin bonus
  recordCareActivity(s, 'pet');
  const day2 = advanceToNextDay(s, '2026-11-23');
  assert.equal(day2.ok, true);
  assert.equal(day2.dayNumber, 2);
  assert.equal(day2.bonusCoins, 0);
  assert.equal(s.progress.dayHistory.length, 1);
  assert.equal(s.coins, 10);

  // 2+ care tasks advances to Day 3 with +6 morning coins
  recordCareActivity(s, 'feed');
  recordCareActivity(s, 'bath');
  const day3 = advanceToNextDay(s, '2026-11-23');
  assert.equal(day3.ok, true);
  assert.equal(day3.dayNumber, 3);
  assert.equal(day3.bonusCoins, 6);
  assert.equal(s.coins, 16);
  assert.equal(s.progress.dayHistory.length, 2);
});

test('cat profile milestones, mood summary, and progress persistence round-trip cleanly', () => {
  const s = createInitialState('2026-11-23');
  s.stats.hunger = 25;
  assert.equal(getCatMoodSummary(s.stats).label, 'Hungry for a Snack');
  s.stats = { hunger: 92, hygiene: 90, energy: 95, fun: 88 };
  assert.equal(getCatMoodSummary(s.stats).label, 'Radiant & Purring');

  recordCareActivity(s, 'feed');
  recordCareActivity(s, 'bath');
  s.progress.currentDay = 3;
  s.highScore = 75;

  const saved = JSON.stringify(extractPersistedData(s));
  const restored = createInitialState('2026-11-23');
  assert.equal(applyPersistedJson(restored, saved), true);
  assert.equal(restored.progress.currentDay, 3);
  assert.equal(restored.progress.lifetime.mealsServed, 1);
  assert.equal(restored.progress.lifetime.bathsGiven, 1);

  const milestones = getProfileMilestones({
    fur: restored.fur,
    accessory: restored.accessory,
    ownedAccessories: restored.ownedAccessories,
    highScore: restored.highScore,
    progress: restored.progress,
  });
  assert.equal(milestones.find((m) => m.id === 'first_meal')?.unlocked, true);
  assert.equal(milestones.find((m) => m.id === 'first_bath')?.unlocked, true);
  assert.equal(milestones.find((m) => m.id === 'three_days')?.unlocked, true);
  assert.equal(milestones.find((m) => m.id === 'angler')?.unlocked, true);
  assert.equal(milestones.find((m) => m.id === 'week_together')?.unlocked, false);
});

test('mobile touch helpers provide thumb hit padding and upward visual lift for small dragged items', () => {
  assert.equal(getTouchHitPadding(false), 0);
  assert.ok(getTouchHitPadding(true) >= 6);

  const s = createInitialState();
  s.pointerX = 180;
  s.pointerY = 160;
  s.pointerIsTouch = true;

  // Small items lift upward above fingertip so thumb does not cover target
  s.drag = { kind: 'fridge_food', fridgeIndex: 0, foodId: 'fish' };
  const liftedFood = getDraggedItemPoint(s);
  assert.equal(liftedFood.lifted, true);
  assert.equal(liftedFood.x, 180);
  assert.ok(liftedFood.y < 160);

  // Near top edge clamps safely instead of leaving canvas
  s.pointerY = 12;
  const clamped = getDraggedItemPoint(s);
  assert.equal(clamped.lifted, true);
  assert.ok(clamped.y >= 10);

  // Mouse pointer does not lift
  s.pointerIsTouch = false;
  s.pointerY = 160;
  const mouseFood = getDraggedItemPoint(s);
  assert.equal(mouseFood.lifted, false);
  assert.equal(mouseFood.y, 160);

  // Large/physics items (cat, yarn, wand) stay directly under touch pointer
  s.pointerIsTouch = true;
  s.drag = { kind: 'cat', offsetX: 0, offsetY: 0 };
  assert.equal(getDraggedItemPoint(s).lifted, false);
  s.drag = { kind: 'yarn', vx: 0, vy: 0 };
  assert.equal(getDraggedItemPoint(s).lifted, false);
  s.drag = { kind: 'wand' };
  assert.equal(getDraggedItemPoint(s).lifted, false);
});

test('detectRoomSwipe cycles cleanly across rooms and rejects vertical, short, slow, or non-room gestures', () => {
  // Left swipe advances forward through ROOM_ORDER; right swipe goes backward with wrap-around
  assert.equal(detectRoomSwipe('bedroom', -90, 10, 220), 'bathroom');
  assert.equal(detectRoomSwipe('bedroom', 90, -8, 220), 'closet');
  assert.equal(detectRoomSwipe('closet', -85, 5, 250), 'bedroom');
  assert.equal(detectRoomSwipe('kitchen', 110, 12, 300), 'playroom');

  // Reject non-room screens
  assert.equal(detectRoomSwipe('title', -100, 0, 200), null);
  assert.equal(detectRoomSwipe('hub', -100, 0, 200), null);

  // Reject short, vertical/diagonal, slow, or non-finite gestures
  assert.equal(detectRoomSwipe('bedroom', -30, 0, 150), null);
  assert.equal(detectRoomSwipe('bedroom', -80, 75, 200), null);
  assert.equal(detectRoomSwipe('bedroom', -100, 5, 950), null);
  assert.equal(detectRoomSwipe('bedroom', Number.NaN, 0, 200), null);
});



