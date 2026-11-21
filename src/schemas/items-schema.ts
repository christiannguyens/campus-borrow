/**
 * Items — things a student is willing to lend.
 *
 * The student who posts an item is its owner (the SDK records them in the
 * built-in `createdBy` field automatically). Only the owner can edit or delete it.
 */

import type { CollectionSchema } from 'deepspace/schema'

// One list, shared by the schema and (later) the category filter in the UI.
export const ITEM_CATEGORIES = [
  'Books',
  'Electronics',
  'Kitchen',
  'Sports & Outdoors',
  'Tools',
  'Furniture',
  'Clothing',
  'Other',
]

// 'available' = can be requested. 'borrowed' = someone has it right now.
export const ITEM_STATUSES = ['available', 'borrowed']

export const itemsSchema: CollectionSchema = {
  name: 'items',
  columns: [
    { name: 'name', storage: 'text', interpretation: 'plain', required: true },
    { name: 'description', storage: 'text', interpretation: 'plain', default: '' },
    {
      name: 'category',
      storage: 'text',
      interpretation: { kind: 'select', options: ITEM_CATEGORIES },
      required: true,
    },
    { name: 'pickupLocation', storage: 'text', interpretation: 'plain', required: true },
    {
      name: 'status',
      storage: 'text',
      interpretation: { kind: 'select', options: ITEM_STATUSES },
      default: 'available',
    },
  ],
  permissions: {
    // Signed-out visitors: nothing. Browsing is for signed-in students only.
    '*': { read: false, create: false, update: false, delete: false },

    // Read-only accounts can browse but not post.
    viewer: { read: true, create: false, update: false, delete: false },

    // Every signed-in student.
    member: {
      read: true, // browse every item
      create: true, // post new items
      update: 'own', // edit only items they posted
      delete: 'own', // delete only items they posted
      // Students may only type these fields. `status` is left out on purpose:
      // it changes only when a loan is approved or returned (server actions),
      // so the "available / borrowed" label can't get out of sync.
      writableFields: ['name', 'description', 'category', 'pickupLocation'],
    },

    // The app owner / moderators can fix anything.
    admin: { read: true, create: true, update: true, delete: true },
  },
}
