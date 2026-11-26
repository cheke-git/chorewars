import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const forts = pgTable('forts', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerAccountId: uuid('owner_account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  homeType: text('home_type').notNull().default('house'),
  bedroomCount: integer('bedroom_count').notNull().default(2),
  bathroomCount: integer('bathroom_count').notNull().default(1),
  hasKitchen: boolean('has_kitchen').notNull().default(true),
  hasYard: boolean('has_yard').notNull().default(false),
  hasPets: boolean('has_pets').notNull().default(false),
  cochPinHash: text('coch_pin_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  fortId: uuid('fort_id')
    .notNull()
    .references(() => forts.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: text('role').notNull().default('recruit'),
  isAdult: boolean('is_adult').notNull().default(false),
  avatarKey: text('avatar_key').notNull().default('shield-orange'),
  avatarUrl: text('avatar_url'),
  xpTotal: integer('xp_total').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const areas = pgTable('areas', {
  id: uuid('id').defaultRandom().primaryKey(),
  fortId: uuid('fort_id')
    .notNull()
    .references(() => forts.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  categoryKey: text('category_key').notNull().default('custom'),
  iconKey: text('icon_key').notNull().default('home'),
  defaultXp: integer('default_xp').notNull().default(10),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  fortId: uuid('fort_id')
    .notNull()
    .references(() => forts.id, { onDelete: 'cascade' }),
  areaId: uuid('area_id').references(() => areas.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  categoryKey: text('category_key').notNull().default('custom'),
  xp: integer('xp').notNull().default(10),
  recurrenceType: text('recurrence_type').notNull().default('daily'),
  cooldownDays: integer('cooldown_days'),
  validationMode: text('validation_mode').notNull().default('honor'),
  assignedProfileId: uuid('assigned_profile_id').references(() => profiles.id, {
    onDelete: 'set null',
  }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const taskRuns = pgTable('task_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  fortId: uuid('fort_id')
    .notNull()
    .references(() => forts.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('in_progress'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  durationSeconds: integer('duration_seconds'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  xpAwarded: integer('xp_awarded').notNull().default(0),
  comment: text('comment'),
  proofPhotoUrl: text('proof_photo_url'),
});

export const rewards = pgTable('rewards', {
  id: uuid('id').defaultRandom().primaryKey(),
  fortId: uuid('fort_id')
    .notNull()
    .references(() => forts.id, { onDelete: 'cascade' }),
  title: text('title'),
  type: text('type').notNull().default('individual_goal'),
  targetXp: integer('target_xp').notNull().default(20),
  poolAmountCents: integer('pool_amount_cents'),
  excludedProfileIds: jsonb('excluded_profile_ids').$type<string[]>().notNull().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
