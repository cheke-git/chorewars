import {
  type AnyPgColumn,
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique(),
  passwordHash: text('password_hash'),
  guardianUserId: uuid('guardian_user_id').references((): AnyPgColumn => users.id, {
    onDelete: 'cascade',
  }),
  guardianPinHash: text('guardian_pin_hash'),
  name: text('name').notNull(),
  isAdult: boolean('is_adult').notNull().default(false),
  avatarKey: text('avatar_key').notNull().default('parent-male'),
  avatarUrl: text('avatar_url'),
  careerXp: integer('career_xp').notNull().default(0),
  claimedArtTier: integer('claimed_art_tier').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const forts = pgTable('forts', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdByUserId: uuid('created_by_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  homeType: text('home_type').notNull().default('house'),
  bedroomCount: integer('bedroom_count').notNull().default(2),
  bathroomCount: integer('bathroom_count').notNull().default(1),
  hasKitchen: boolean('has_kitchen').notNull().default(true),
  hasYard: boolean('has_yard').notNull().default(false),
  hasPets: boolean('has_pets').notNull().default(false),
  inviteCode: text('invite_code').notNull().unique(),
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const fortMemberships = pgTable('fort_memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  fortId: uuid('fort_id')
    .notNull()
    .references(() => forts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('recruit'),
  fortXp: integer('fort_xp').notNull().default(0),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  leftAt: timestamp('left_at', { withTimezone: true }),
});

export const fortInvitations = pgTable('fort_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  fortId: uuid('fort_id')
    .notNull()
    .references(() => forts.id, { onDelete: 'cascade' }),
  invitedByUserId: uuid('invited_by_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  targetEmail: text('target_email').notNull(),
  role: text('role').notNull().default('recruit'),
  note: text('note'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  respondedAt: timestamp('responded_at', { withTimezone: true }),
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
  assignedUserId: uuid('assigned_user_id').references(() => users.id, {
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
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
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
  excludedUserIds: jsonb('excluded_user_ids').$type<string[]>().notNull().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
