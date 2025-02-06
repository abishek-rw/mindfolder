import { relations } from "drizzle-orm";
import { pgTable, text, integer, timestamp, boolean, uniqueIndex, serial } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
});

export const folder = pgTable("folder", {
	id: serial().primaryKey(),
	name: text('name').notNull(),
	userId: text('user_id').notNull().references(() => user.id),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
});

export const file = pgTable("file", {
	id: serial().primaryKey(),
	name: text('name').notNull(),
	folderId: integer('folder_id').notNull().references(() => folder.id),
	userId: text('user_id').notNull().references(() => user.id),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id').notNull().references(() => user.id)
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at')
});

// relations
export const userRelations = relations(user, ({ many }) => ({
	folders: many(folder),
	files: many(file),
	accounts: many(account),
	verifications: many(verification)
}))

export const folderRelations = relations(folder, ({ many, one }) => ({
	files: many(file),
	user: one(user, { fields: [folder.userId], references: [user.id] })
}));

export const fileRelations = relations(file, ({ one }) => ({
	folder: one(folder, { fields: [file.folderId], references: [folder.id] }),
	user: one(user, { fields: [file.userId], references: [user.id] })
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.userId], references: [user.id] })
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, { fields: [account.userId], references: [user.id] })
}));

export const verificationRelations = relations(verification, ({ one }) => ({
	user: one(user, { fields: [verification.identifier], references: [user.email] })
}));

// types
export type User = typeof user.$inferSelect;
export type Folder = typeof folder.$inferSelect;
export type File = typeof file.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
