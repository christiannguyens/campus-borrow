import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'
import { borrowingActions } from './borrowing'

export const actions: Record<string, ActionHandler<Env>> = {
  ...borrowingActions,
}
